
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, X, ChevronDown, Sparkles, Bot, Minimize2, RotateCcw } from 'lucide-react';
import { UserProfile } from '../types';
import { getOnboardingChat, isUserGeminiSessionReady, showKnovaToast } from '../services/geminiService';

interface OnboardingAssistantProps {
  user: UserProfile;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for retry logic on 503 and 429 errors
async function sendMessageWithRetry(session: any, message: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await session.sendMessage({ message });
    } catch (e: any) {
      // Check for 503 (Overloaded) or 429 (Rate Limit)
      const isOverloaded = e?.status === 503 || e?.code === 503 || e?.message?.includes('overloaded') || e?.message?.includes('503');
      const isRateLimited = e?.status === 429 || e?.code === 429 || e?.message?.includes('429') || e?.message?.includes('quota');

      if (isOverloaded || isRateLimited) {
        if (i === retries - 1) throw e;
        // If rate limited, wait longer (4s+), otherwise standard backoff
        const baseDelay = isRateLimited ? 4000 : 1000;
        const waitTime = baseDelay * Math.pow(2, i);

        console.warn(`Chat API ${isRateLimited ? 'Rate Limited' : 'Overloaded'}. Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      throw e;
    }
  }
}

export const OnboardingAssistant: React.FC<OnboardingAssistantProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userSessionKey = user.id || user.email || user.name;
  const hasStartedRef = useRef(false);

  const escapeHtml = (str: string) => {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const escapeHtmlAttr = (str: string) => {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const renderMarkdownToHtml = (text?: string | null) => {
    if (!text) return '';
    let s = String(text);
    s = s.replace(/\r\n/g, '\n');

    s = s.replace(/```(?:([a-zA-Z0-9_-]+)\n)?([\s\S]*?)```/g, (_match, _lang, code) => {
      const esc = escapeHtml(code);
      return `<pre><code>${esc}</code></pre>`;
    });

    s = s.replace(/`([^`]+)`/g, (_m, code) => `<code>${escapeHtml(code)}</code>`);
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
      const href = String(url).trim();
      const textEsc = escapeHtml(text);
      return `<a href="${escapeHtmlAttr(href)}" target="_blank" rel="noopener noreferrer">${textEsc}</a>`;
    });

    s = s.replace(/\*\*([^*]+)\*\*/g, (_m, t) => `${escapeHtml(t)}`);
    s = s.replace(/__([^_]+)__/g, (_m, t) => `${escapeHtml(t)}`);
    s = s.replace(/\*([^*]+)\*/g, (_m, t) => `<em>${escapeHtml(t)}</em>`);
    s = s.replace(/_([^_]+)_/g, (_m, t) => `<em>${escapeHtml(t)}</em>`);

    const lines = s.split('\n');
    const out: string[] = [];
    let inList = false;
    for (const line of lines) {
      const m = line.match(/^\s*[-*]\s+(.*)$/);
      if (m) {
        if (!inList) { out.push('<ul>'); inList = true; }
        out.push(`<li>${m[1]}</li>`);
      } else {
        if (inList) { out.push('</ul>'); inList = false; }
        out.push(line);
      }
    }
    if (inList) out.push('</ul>');

    s = out.join('\n');
    const paragraphs = s.split(/\n{2,}/).map(p => p.trim()).filter(Boolean).map(p => {
      if (/^<(pre|ul|h[1-6]|blockquote)/.test(p)) return p;
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    });

    return paragraphs.join('\n');
  };

  const prepareModelHtml = (raw?: string | null) => {
    const decoded = decodeHtmlEntities(raw);

    const hasHtmlTags = /<[a-z]+[^>]*>|<\/[a-z]+>/i.test(decoded);

    if (hasHtmlTags) {
      return decoded;
    }

    let md = renderMarkdownToHtml(decoded);
    md = md.replace(/(https?:\/\/[^\s"'<>]+)/g, (m) => {
      const href = escapeHtmlAttr(m);
      const text = escapeHtml(m);
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });

    return md;
  }; const sanitizeHtml = (html?: string | null) => {
    if (!html) return '';
    try {
      const template = document.createElement('template');
      template.innerHTML = html;

      const forbiddenTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta']);
      const safeTags = new Set(['strong', 'code', 'em', 'u', 'b', 'i', 'a', 'p', 'br', 'ul', 'ol', 'li', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div']);

      const walk = (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          const tag = el.tagName.toLowerCase();
          if (forbiddenTags.has(tag)) {
            el.remove();
            return;
          }
          // Keep safe tags but remove event handlers and dangerous attributes
          if (safeTags.has(tag)) {
            // For <a> tags, keep href, target, rel; remove others
            if (tag === 'a') {
              const href = el.getAttribute('href');
              const target = el.getAttribute('target');
              const rel = el.getAttribute('rel');
              el.removeAttribute('href');
              el.removeAttribute('target');
              el.removeAttribute('rel');
              if (href) el.setAttribute('href', href);
              if (target) el.setAttribute('target', target);
              if (rel) el.setAttribute('rel', rel);
            } else {
              // For other safe tags, remove all attributes (they don't need any)
              while (el.attributes.length) {
                el.removeAttribute(el.attributes[0].name);
              }
            }
            return;
          }
          for (const attr of Array.from(el.attributes)) {
            const name = attr.name;
            const val = attr.value;
            if (/^on/i.test(name) || /javascript:/i.test(val) || name === 'srcdoc') {
              el.removeAttribute(name);
            }
          }
        }
        for (const child of Array.from(node.childNodes)) walk(child);
      };

      walk(template.content);
      return template.innerHTML;
    } catch (e) {
      const d = document.createElement('div');
      d.textContent = html;
      return d.innerHTML || '';
    }
  };

  // Decode HTML entities like &lt; &gt; &amp; so that model text containing escaped HTML is rendered properly.
  const decodeHtmlEntities = (str?: string | null) => {
    if (!str) return '';
    try {
      let prev = String(str);
      let curr = prev;
      const txt = document.createElement('textarea');
      for (let i = 0; i < 5; i++) {
        txt.innerHTML = curr;
        const decoded = txt.value;
        if (decoded === curr) break;
        prev = curr;
        curr = decoded;
      }
      return curr;
    } catch (e) {
      return String(str);
    }
  };

  const startChat = useCallback(async (withDelay = false) => {
    if (!isUserGeminiSessionReady()) {
      showKnovaToast('Set your Gemini API key first: open Settings, then Integrations, and save your key.');
      setMessages([{ role: 'model', text: "Welcome to KnovaTwin! Please verify your API Key in Settings to enable the AI Guide." }]);
      return;
    }

    if (withDelay) await delay(3000);

    setMessages([]);
    try {
      const session = getOnboardingChat(user);
      setChatSession(session);

      // Initial Greeting
      setIsTyping(true);

      // Use retry logic here
      const result = await sendMessageWithRetry(session, "Hello, I just logged in.");
      if (result.text) {
        setMessages([{ role: 'model', text: result.text }]);
      }
    } catch (e: any) {
      // Graceful fallback if even retries fail
      let fallbackMsg = "Hello! I'm KnovaBot. I'm currently experiencing high traffic, but I'm here to help guide you through the platform. Ask me anything!";

      if (e?.status === 429 || e?.message?.includes('429')) {
        console.warn("Onboarding chat 429 Rate Limit hit. Using fallback.");
      } else if (e?.message?.includes('Rpc failed') || e?.code === 500) {
        // Suppress scary RPC/XHR error logs for user safety, often network or key related
        console.warn("Chat connection issue (RPC/XHR). Likely network or key permissions.");
        fallbackMsg = "I'm having trouble connecting to the network right now. Please check your internet connection or API Key.";
      } else {
        console.error("Failed to start onboarding chat", e);
      }

      setMessages([{ role: 'model', text: fallbackMsg }]);
    } finally {
      setIsTyping(false);
    }
  }, [user]);

  // Only auto-start when the widget is opened, and only once per browser session for this user.
  useEffect(() => {
    if (!isOpen || !userSessionKey) return;

    const startedKey = `knovatwin_onboarding_started_${userSessionKey}`;
    if (hasStartedRef.current || sessionStorage.getItem(startedKey) === 'true') {
      hasStartedRef.current = true;
      return;
    }

    hasStartedRef.current = true;
    sessionStorage.setItem(startedKey, 'true');
    startChat(false);
  }, [isOpen, userSessionKey, startChat]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    hasStartedRef.current = true;
    startChat(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!chatSession && isUserGeminiSessionReady()) {
      // Try to reconnect if session lost but key exists
      const session = getOnboardingChat(user);
      setChatSession(session);
    } else if (!chatSession) {
      showKnovaToast('Set your Gemini API key first: open Settings, then Integrations, and save your key.');
      setMessages(prev => [...prev, { role: 'model', text: "Please set your API key in Settings to chat." }]);
      return;
    }

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const result = await sendMessageWithRetry(chatSession, userMsg);
      if (result.text) {
        setMessages(prev => [...prev, { role: 'model', text: result.text }]);
      }
    } catch (e) {
      console.warn("Message send failed", e);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting right now due to high network load. Please try again in a moment." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 flex items-center gap-2 group"
      >
        <Bot size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap font-bold">
          AI Guide
        </span>
        <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 overflow-hidden ${isMinimized ? 'w-72 h-16' : 'w-80 sm:w-96 h-[500px]'}`}>
      {/* Header */}
      <div
        className="bg-indigo-600 p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3 text-white">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-none">KnovaBot</h3>
            <p className="text-[10px] text-indigo-200 mt-0.5">Onboarding Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-indigo-200">
          <button onClick={handleReset} className="hover:text-white" title="Reset Chat">
            <RotateCcw size={18} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:text-white">
            {isMinimized ? <ChevronDown size={18} className="rotate-180" /> : <Minimize2 size={18} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="hover:text-white">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                  }`}>
                  {msg.role === 'user' ? (
                    msg.text
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(prepareModelHtml(msg.text)) }} />
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3 shadow-sm flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about features..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50 p-1"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
