
import React, { useEffect, useRef, useState } from 'react';
import { LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, User, Sparkles, Briefcase, Settings2, Play, ChevronDown, Loader2, Image as ImageIcon, Video, VideoOff, MonitorPlay, BookOpen, RefreshCw, Bot } from 'lucide-react';
import { EXPERT_PERSONAS, generatePersonaAvatar, getClient, requireUserGeminiSessionOrToast } from '../services/geminiService';
import { ExpertPersona } from '../types';
import { expertPersonasApi, mapBackendPersonaToExpertPersona, type ExpertPersonaBackend } from '../services/api';

const COLOR_OPTIONS = [
  { tailwind: 'bg-indigo-500', hex: '#6366f1' },
  { tailwind: 'bg-emerald-500', hex: '#10b981' },
  { tailwind: 'bg-rose-500', hex: '#f43f5e' },
  { tailwind: 'bg-amber-500', hex: '#f59e0b' },
  { tailwind: 'bg-purple-600', hex: '#9333ea' },
  { tailwind: 'bg-slate-700', hex: '#334155' },
];

const VOICE_OPTIONS = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface LiveTutorProps {
  onClose: () => void;
  onGoToTwinLab?: () => void;
  topic?: string;
  contextContent?: string; // NEW: Pass the actual lesson text here
  customPersona?: ExpertPersona; // NEW: Direct persona injection for testing
}

export const LiveTutor: React.FC<LiveTutorProps> = ({ onClose, onGoToTwinLab, topic, contextContent, customPersona }) => {
  // Load personas from API (Twin Lab agents); no mock until we've tried the API
  const [personas, setPersonas] = useState<ExpertPersona[]>([]);
  const [personasLoaded, setPersonasLoaded] = useState(false);
  const [personasError, setPersonasError] = useState<string | null>(null);

  const loadPersonas = () => {
    setPersonasError(null);
    expertPersonasApi.list()
      .then((response: { data?: unknown }) => {
        const raw = response?.data ?? response;
        const list = Array.isArray(raw) ? raw : [];
        // Only show DB personas; no hardcoded fallback when API returns empty
        const mapped = list.map((p) => mapBackendPersonaToExpertPersona(p as ExpertPersonaBackend));
        setPersonas(mapped);
        setPersonasLoaded(true);
      })
      .catch(() => {
        setPersonas(EXPERT_PERSONAS);
        setPersonasLoaded(true);
        setPersonasError('Could not load your Twins. Showing defaults.');
      });
  };

  useEffect(() => {
    loadPersonas();
  }, []);

  // If customPersona provided (Test Mode), use it directly. Otherwise null initially.
  const [selectedPersona, setSelectedPersona] = useState<ExpertPersona | null>(customPersona || null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI State for Custom Dropdowns
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  
  // Generating Avatar State
  const [generatingAvatarId, setGeneratingAvatarId] = useState<string | null>(null);

  // Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  
  // Visualizer Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-select tutor if contextContent is provided (Fast Start) OR use customPersona
  useEffect(() => {
      if (customPersona) {
          setSelectedPersona(customPersona);
          return;
      }
      if (contextContent && !selectedPersona) {
          const tutor = personas.find(p => p.id === 'tutor') || personas[0];
          setSelectedPersona(tutor);
      }
  }, [contextContent, personas, customPersona]);

  useEffect(() => {
    if (selectedPersona) {
        connectToLiveApi();
        setIsVideoMode(false);
    }
    return () => {
      cleanup();
    };
  }, [selectedPersona]);

  // Handle Resize for Canvas
  useEffect(() => {
    if (!selectedPersona || isVideoMode) return; 
    
    const handleResize = () => {
        if (canvasRef.current && containerRef.current) {
            canvasRef.current.width = containerRef.current.clientWidth;
            canvasRef.current.height = containerRef.current.clientWidth; // Square
        }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); 
    
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedPersona, isVideoMode]);

  // Close dropdowns when clicking outside
  useEffect(() => {
      const handleClickOutside = () => setActiveDropdownId(null);
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const cleanup = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsConnected(false);
  };

  const connectToLiveApi = async () => {
    if (!selectedPersona) return;
    if (!requireUserGeminiSessionOrToast()) return;

    try {
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      analyzerRef.current = outputAudioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;
      const outputNode = outputAudioContextRef.current.createGain();
      outputNode.connect(analyzerRef.current);
      analyzerRef.current.connect(outputAudioContextRef.current.destination);

      if (!isVideoMode) {
          drawVisualizer();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Construct system instruction with Context if available
      // IMPORTANT: Use the persona's existing systemPrompt if available (especially for custom tested personas)
      let systemInstruction = selectedPersona.systemPrompt || `Context: User is learning about "${topic || 'general topics'}".`;
      
      // If we are in "Course Mode" (contextContent passed) and not "Test Mode" (customPersona passed with its own prompt), append context
      if (contextContent && !customPersona) {
          const safeContext = contextContent.substring(0, 10000); 
          systemInstruction = `
          SYSTEM: You are an interactive tutor. 
          CONTEXT: The user is currently reading the following material: 
          """${safeContext}"""
          
          TASK: Answer questions specifically about this material. Be concise, encouraging, and Socratic. 
          If the user asks something unrelated, gently guide them back or answer briefly.
          
          ROLE: ${selectedPersona.systemPrompt || selectedPersona.role}
          `;
      }

      const sessionPromise = getClient().live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedPersona.voiceName || 'Kore' } },
          },
          systemInstruction: systemInstruction,
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            const ctx = inputAudioContextRef.current;
            if(!ctx) return;
            
            sourceRef.current = ctx.createMediaStreamSource(stream);
            processorRef.current = ctx.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (e) => {
              if (isMuted) return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = floatTo16BitPCM(inputData);
              const base64Data = arrayBufferToBase64(pcmData);
              
              sessionPromise.then(session => {
                  session.sendRealtimeInput({
                      media: {
                          mimeType: 'audio/pcm;rate=16000',
                          data: base64Data
                      }
                  });
              });
            };

            sourceRef.current.connect(processorRef.current);
            processorRef.current.connect(ctx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const data = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (data && outputAudioContextRef.current) {
                const audioData = base64ToArrayBuffer(data);
                const audioBuffer = await decodeAudioData(
                    audioData, 
                    outputAudioContextRef.current,
                    24000,
                    1
                );
                playAudioChunk(audioBuffer);
            }
          },
          onclose: () => {
            setIsConnected(false);
          },
          onerror: (err) => {
            console.error("Session error", err);
            setError("Connection failed. Check API Key.");
            setIsConnected(false);
          }
        }
      });

    } catch (e: unknown) {
      console.error("Failed to connect", e);
      const message = e instanceof Error ? e.message : "Could not access microphone or API.";
      setError(message);
    }
  };

  const playAudioChunk = (buffer: AudioBuffer) => {
    if (!outputAudioContextRef.current || !analyzerRef.current) return;
    const ctx = outputAudioContextRef.current;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(analyzerRef.current);
    
    const currentTime = ctx.currentTime;
    if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
    }
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
  };
  
  const playVoiceSample = async (voiceName: string) => {
      if (playingVoice) return; 
      setPlayingVoice(voiceName);
      
      const client = getClient();
      const requestParams = {
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text: `Hello, I am ${voiceName}. Ready to assist you.` }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName }
                }
            }
        }
      };

      try {
          let response;
          const retries = 3;
          
          for (let i = 0; i < retries; i++) {
              try {
                  response = await client.models.generateContent(requestParams);
                  break; // Success, exit loop
              } catch (e: any) {
                  const isOverloaded = e?.status === 503 || 
                                       e?.code === 503 || 
                                       e?.message?.includes('overloaded') ||
                                       e?.message?.includes('503');
                  
                  if (isOverloaded && i < retries - 1) {
                      const waitTime = 1000 * Math.pow(2, i); // 1s, 2s, 4s...
                      console.warn(`TTS Overloaded. Retrying in ${waitTime}ms...`);
                      await delay(waitTime);
                      continue;
                  }
                  throw e; // Rethrow if not overload or last retry
              }
          }
          
          const base64Audio = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
               const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
               const audioBuffer = await decodeAudioData(base64ToArrayBuffer(base64Audio), ctx, 24000, 1);
               const source = ctx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(ctx.destination);
               source.start();
               source.onended = () => {
                   ctx.close();
                   setPlayingVoice(null);
               };
          } else {
              setPlayingVoice(null);
          }
      } catch (err) {
          console.error("Failed to play sample", err);
          setPlayingVoice(null);
          alert("Could not play voice sample due to high traffic. Please try again in a moment.");
      }
  };

  const drawVisualizer = () => {
    if (isVideoMode) return;
    if (!canvasRef.current || !analyzerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyzer = analyzerRef.current;
    if (!ctx) return;

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
        if (!canvasRef.current) return;

        animationFrameRef.current = requestAnimationFrame(draw);
        analyzer.getByteFrequencyData(dataArray);

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.15;
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const scale = 1 + (average / 256) * 0.4;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * scale, 0, 2 * Math.PI);
        ctx.fillStyle = selectedPersona?.accentColor || '#6366f1'; 
        ctx.fill(); 
        
        const bars = 40;
        const step = (Math.PI * 2) / bars;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        
        for (let i = 0; i < bars; i++) {
            const value = dataArray[i % bufferLength] || 0;
            const barHeight = (value / 255) * (baseRadius * 0.8);
            const angle = i * step;
            const x1 = centerX + Math.cos(angle) * (baseRadius * scale);
            const y1 = centerY + Math.sin(angle) * (baseRadius * scale);
            const x2 = centerX + Math.cos(angle) * (baseRadius * scale + barHeight + 5);
            const y2 = centerY + Math.sin(angle) * (baseRadius * scale + barHeight + 5);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    };
    draw();
  };

  const updatePersona = (id: string, updates: Partial<ExpertPersona>) => {
    setPersonas(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleColorChange = (e: React.MouseEvent, personaId: string, color: { tailwind: string, hex: string }) => {
    e.stopPropagation();
    updatePersona(personaId, { avatarColor: color.tailwind, accentColor: color.hex });
  };

  const handleCustomColorChange = (personaId: string, hex: string) => {
    updatePersona(personaId, { avatarColor: '', accentColor: hex });
  };

  const handleGenerateAvatar = async (e: React.MouseEvent, persona: ExpertPersona) => {
      e.stopPropagation();
      setGeneratingAvatarId(persona.id);
      try {
          const avatarUrl = await generatePersonaAvatar(persona);
          if (avatarUrl) {
              updatePersona(persona.id, { avatarUrl });
          }
      } catch (err) {
          console.error("Avatar gen error", err);
      } finally {
          setGeneratingAvatarId(null);
      }
  };

  function floatTo16BitPCM(float32Array: Float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  }

  function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToArrayBuffer(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  async function decodeAudioData(data: ArrayBuffer, ctx: AudioContext, sampleRate: number, numChannels: number) {
     const dataInt16 = new Int16Array(data);
     const frameCount = dataInt16.length / numChannels;
     const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
     for (let channel = 0; channel < numChannels; channel++) {
         const channelData = buffer.getChannelData(channel);
         for(let i=0; i < frameCount; i++) {
             channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
         }
     }
     return buffer;
  }

  // --- MODIFIED RENDER TO HANDLE AUTO-START WITH CONTEXT OR CUSTOM PERSONA ---
  
  if (!selectedPersona) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur flex flex-col items-center justify-center p-4 md:p-8 text-white overflow-y-auto">
            <button onClick={onClose} className="absolute top-4 right-4 md:top-8 md:right-8 p-2 hover:bg-white/10 rounded-full"><PhoneOff /></button>
            <div className="max-w-5xl w-full flex flex-col items-center my-auto">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center mt-12 md:mt-0">Knowledge Twin Selection</h2>
                <p className="text-slate-400 mb-4 text-center max-w-xl text-sm md:text-base">
                    Don't just learn the theory. Consult with our digital experts who have decades of simulated "Tribal Knowledge" and experience.
                </p>
                {personasError && <p className="text-amber-400 text-sm mb-4">{personasError}</p>}
                {personasLoaded && (
                  <button type="button" onClick={loadPersonas} className="mb-6 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <RefreshCw size={14} /> Refresh list from Twin Lab
                  </button>
                )}
                {!personasLoaded && (
                  <div className="flex items-center gap-2 text-slate-400 mb-8">
                    <Loader2 size={20} className="animate-spin" /> Loading your Twins…
                  </div>
                )}
                {personasLoaded && personas.length === 0 && (
                  <div className="w-full max-w-md py-12 px-6 bg-slate-800/50 border border-slate-700 rounded-2xl text-center">
                    <Bot size={48} className="mx-auto mb-4 text-slate-500" />
                    <h3 className="text-lg font-bold text-white mb-2">No Twins yet</h3>
                    <p className="text-slate-400 text-sm mb-6">Create your AI agents in Twin Lab and they will appear here for Live Tutor.</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (onGoToTwinLab) onGoToTwinLab();
                        else onClose();
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500"
                    >
                      Go to Twin Lab
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pb-8">
                    {personasLoaded && personas.length > 0 && personas.map(persona => (
                        <div 
                            key={persona.id}
                            onClick={() => setSelectedPersona(persona)}
                            className="bg-slate-800 border border-slate-700 p-6 rounded-2xl cursor-pointer hover:bg-slate-750 hover:border-indigo-500 transition-all group relative flex flex-col"
                        >
                            <div className="relative mx-auto mb-4 group/avatar">
                                <div 
                                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/20 transition-colors duration-300 overflow-hidden relative`}
                                    style={{ backgroundColor: persona.avatarUrl ? 'transparent' : persona.accentColor }}
                                >
                                    {persona.avatarUrl ? (
                                        <img src={persona.avatarUrl} alt={persona.name} className="w-full h-full object-cover" />
                                    ) : (
                                        persona.id === 'tutor' ? <Sparkles size={32} /> : <User size={32} />
                                    )}
                                    
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity z-10">
                                        <button 
                                            onClick={(e) => handleGenerateAvatar(e, persona)}
                                            className="p-1.5 bg-white text-indigo-600 rounded-full hover:scale-110 transition-transform"
                                            title="Generate AI Avatar"
                                            disabled={generatingAvatarId === persona.id}
                                        >
                                            {generatingAvatarId === persona.id ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-center">{persona.name}</h3>
                            <p className="text-indigo-400 text-sm font-medium mb-2 text-center">{persona.role}</p>
                            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-4">
                                <Briefcase size={12} /> {persona.yearsExperience} years exp.
                            </div>
                            
                            <div className="mt-2 bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 space-y-3" onClick={(e) => e.stopPropagation()}>
                                {/* ... Customization inputs ... */}
                                <div className="text-xs text-slate-500 text-center italic">Settings hidden for concise view</div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-slate-700 text-center">
                                <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors uppercase tracking-wider">Click card to start</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center text-white overflow-hidden p-4 animate-in fade-in duration-300">
      <div className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-4 z-20">
        <div 
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 overflow-hidden`}
            style={{ backgroundColor: selectedPersona.avatarUrl ? 'transparent' : selectedPersona.accentColor }}
        >
             {selectedPersona.avatarUrl ? (
                 <img src={selectedPersona.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
                 <User size={20} className="md:w-6 md:h-6" />
             )}
        </div>
        <div>
            <h3 className="font-bold text-base md:text-lg">{selectedPersona.name}</h3>
            <p className="text-xs md:text-sm text-slate-400 flex items-center gap-2">
                {selectedPersona.role}
                {(contextContent || customPersona) && <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-indigo-500/30"><BookOpen size={10}/> {customPersona ? 'Test Mode' : 'Context Aware'}</span>}
            </p>
        </div>
      </div>

      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20 flex items-center gap-3">
        {selectedPersona.heyGenAvatarId && (
            <button 
                onClick={() => setIsVideoMode(!isVideoMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${isVideoMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                {isVideoMode ? <Video size={16} /> : <VideoOff size={16} />}
                <span className="hidden md:inline">{isVideoMode ? 'Video Active' : 'Enable Video'}</span>
            </button>
        )}
        <button onClick={onClose} className="p-3 md:p-4 bg-red-500/10 hover:bg-red-500/20 rounded-full transition-colors group">
            <PhoneOff size={20} className="md:w-6 md:h-6 text-red-400 group-hover:text-red-300" />
        </button>
      </div>
      
      <div className="text-center mb-4 z-10 mt-20 md:mt-0">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            {isConnected ? 'Live Connection Active' : error || 'Establishing secure line...'}
        </div>
      </div>

      <div ref={containerRef} className="relative w-full max-w-4xl flex-1 flex items-center justify-center p-4">
        {!isVideoMode && (
             <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
                <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-80 w-full h-full" />
                
                <div 
                    className="relative z-10 w-32 h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 border-4 border-white/10 overflow-hidden"
                    style={{ 
                        backgroundColor: selectedPersona.avatarUrl ? 'transparent' : selectedPersona.accentColor, 
                        boxShadow: `0 0 60px ${selectedPersona.accentColor}60`
                    }}
                >
                    {selectedPersona.avatarUrl ? (
                        <img src={selectedPersona.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : selectedPersona.id === 'tutor' ? (
                        <Sparkles size={64} className="text-white drop-shadow-md" />
                    ) : (
                        <User size={64} className="text-white drop-shadow-md" />
                    )}
                    
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20 -z-10" style={{ backgroundColor: selectedPersona.accentColor }}></div>
                </div>
            </div>
        )}

        {isVideoMode && (
            <div className="relative w-full h-full max-h-[600px] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex items-center justify-center animate-in zoom-in-95 duration-300">
                {selectedPersona.avatarUrl ? (
                     <img src={selectedPersona.avatarUrl} alt="Video Stream" className="w-full h-full object-cover opacity-90 blur-[1px] scale-105" />
                ) : (
                    <div className={`w-full h-full ${selectedPersona.avatarColor || 'bg-slate-800'} flex items-center justify-center`}>
                        <User size={120} className="text-white/20" />
                    </div>
                )}
                
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-4 py-2 rounded-lg flex items-center gap-3">
                    <MonitorPlay size={16} className="text-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono text-emerald-400">HEYGEN_STREAM_ACTIVE</span>
                </div>
            </div>
        )}
      </div>

      <div className="mt-8 md:mt-12 flex gap-6 z-10 pb-12">
         <button 
           onClick={() => setIsMuted(!isMuted)}
           className={`p-5 md:p-6 rounded-full transition-all duration-300 shadow-lg border-4 relative overflow-hidden group ${isMuted ? 'bg-red-500 border-red-400 text-white hover:bg-red-600' : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600'}`}
           title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
         >
             {!isMuted && <div className="absolute inset-0 bg-white/10 animate-pulse rounded-full"></div>}
            <div className="relative z-10">
                {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
            </div>
         </button>
      </div>
      
      <p className="mt-6 text-sm text-slate-500 text-center px-4 font-medium tracking-wide fixed bottom-8">
         {isMuted ? 'Microphone Muted' : 'Listening... Speak naturally to your Twin.'}
      </p>
    </div>
  );
};
