
import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Sparkles, Loader2, MessageSquare, AlertCircle, Mic, ChevronLeft } from 'lucide-react';
import { ExpertPersona, ChatMessage } from '../types';
import { getClient, EXPERT_PERSONAS } from '../services/geminiService';
import { expertPersonasApi, mapBackendPersonaToExpertPersona } from '../services/api';
import { GenerateContentResponse } from "@google/genai";
import { LiveTutor } from './LiveTutor';

interface PublicAgentRendererProps {
    twinId: string;
}

export const PublicAgentRenderer: React.FC<PublicAgentRendererProps> = ({ twinId }) => {
    const [persona, setPersona] = useState<ExpertPersona | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showVoiceMode, setShowVoiceMode] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatSessionRef = useRef<any>(null);

    const initPersonaAndChat = (p: ExpertPersona) => {
        setPersona(p);
        setError(null);
        try {
            const ai = getClient();
            chatSessionRef.current = ai.chats.create({
                model: 'gemini-3-flash-preview',
                config: {
                    systemInstruction: `You are ${p.name}, a ${p.role}. ${p.systemPrompt}. 
                    CONSTRAINTS: You are interacting via a mobile app. Keep answers highly concise, use bullet points for readability, and focus on your specific subject expertise.`
                }
            });
            setMessages([{
                id: 'init',
                role: 'model',
                text: `Hello! I'm your ${p.role}, ${p.name}. How can I apply my expertise to help you on the go today?`,
                timestamp: Date.now()
            }]);
        } catch (e) {
            setError("Expertise Engine initialization failed.");
        }
    };

    useEffect(() => {
        const found: ExpertPersona | undefined = EXPERT_PERSONAS.find(p => p.id === twinId);
        if (found) {
            initPersonaAndChat(found);
            return;
        }
        expertPersonasApi.list()
            .then(({ data }) => {
                if (!Array.isArray(data)) {
                    setError("Expert Twin not found.");
                    return;
                }
                const match = data.find((p: { id: string }) => p.id === twinId);
                if (match) initPersonaAndChat(mapBackendPersonaToExpertPersona(match));
                else setError("Expert Twin not found.");
            })
            .catch(() => setError("Expert Twin not found."));
    }, [twinId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || !chatSessionRef.current) return;
        const userText = input.trim();
        setInput('');
        setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', text: userText, timestamp: Date.now() }]);
        setIsTyping(true);

        try {
            const result: GenerateContentResponse = await chatSessionRef.current.sendMessage({ message: userText });
            setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'model', text: result.text ?? "I couldn't generate a response. Please try again.", timestamp: Date.now() }]);
        } catch (e) {
            setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'model', text: "Connection issues. Please retry.", timestamp: Date.now() }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (error) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white p-8 text-center">
            <AlertCircle size={64} className="text-rose-500 mb-6" />
            <h3 className="text-2xl font-bold mb-2">Twin Offline</h3>
            <p className="text-slate-400">{error}</p>
        </div>
    );

    if (!persona) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900">
            <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Calibrating Expertise...</p>
        </div>
    );

    if (showVoiceMode) {
        return <LiveTutor onClose={() => setShowVoiceMode(false)} customPersona={persona} />;
    }

    return (
        <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden relative font-sans">
            {/* Native Mobile Header */}
            <div className="safe-top bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
                <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-indigo-100 shadow-sm"
                    style={{ backgroundColor: persona.avatarUrl ? 'transparent' : persona.accentColor }}
                >
                    {persona.avatarUrl ? <img src={persona.avatarUrl} className="w-full h-full object-cover" /> : <User size={20} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="font-bold text-slate-900 text-sm truncate">{persona.name}</h1>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{persona.role}</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowVoiceMode(true)}
                    className="p-2.5 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
                >
                    <Mic size={20} />
                </button>
            </div>

            {/* Scrollable Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                        <div 
                            className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex gap-1.5 items-center">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Mobile Keyboard-Friendly Input */}
            <div className="p-3 bg-white border-t border-slate-100 pb-safe">
                <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white transition-all border border-transparent focus-within:border-indigo-200">
                    <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={`Consult your ${persona.role}...`}
                        className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400 h-10"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className={`p-2 rounded-full transition-all ${input.trim() ? 'bg-indigo-600 text-white rotate-0 shadow-md' : 'text-slate-400 grayscale'}`}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
