
import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Volume2, VolumeX, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { AppView, UserProfile } from '../types';
import { generateSpeech, hasValidKey } from '../services/geminiService';

interface TourStep {
    view: AppView;
    title: string;
    text: string;
    selector: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        view: AppView.DASHBOARD,
        title: "Your Intelligence Hub",
        text: "Welcome back! I'm Knova. This is your main dashboard where you monitor the 'Intelligence Velocity' of your organization and track active twinning progress.",
        selector: "#nav-dashboard"
    },
    {
        view: AppView.SETTINGS,
        title: "The Privacy Engine",
        text: "Your expertise is your most valuable asset. In Settings, you provide your own API key. This ensures your knowledge stays encrypted on your device and never touches our servers.",
        selector: "#nav-settings"
    },
    {
        view: AppView.CREATOR_STUDIO,
        title: "Wisdom Capture Lab",
        text: "The Studio is where magic happens. You can upload documents or use 'Brain Dump' mode to have me interview you—turning your tacit expertise into a structured digital course.",
        selector: "#nav-creator"
    },
    {
        view: AppView.TWIN_MANAGER,
        title: "Global Deployment",
        text: "The Twin Lab is your command center for scale. Deploy your digital agents as interactive tutors for your team, or embed them directly on your website for 24/7 expert guidance.",
        selector: "#nav-twins"
    }
];

interface OnboardingTourProps {
    user: UserProfile | null;
    onNavigate: (view: AppView) => void;
    onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ user, onNavigate, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [spotlight, setSpotlight] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const hasKey = hasValidKey();

    const step = TOUR_STEPS[currentStep];

    const updateSpotlight = () => {
        const target = document.querySelector(step.selector);
        if (target) {
            const rect = target.getBoundingClientRect();
            setSpotlight({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
        } else {
            // Retry if not found yet (view switching)
            setTimeout(updateSpotlight, 100);
        }
    };

    useEffect(() => {
        // Initial delay to allow for view navigation and layout shifts
        const timer = setTimeout(updateSpotlight, 600);
        window.addEventListener('resize', updateSpotlight);
        return () => {
            window.removeEventListener('resize', updateSpotlight);
            clearTimeout(timer);
        };
    }, [currentStep, step.selector]);

    const stopAudio = () => {
        if (sourceRef.current) {
            try { sourceRef.current.stop(); } catch (e) {}
            sourceRef.current = null;
        }
        setIsSpeaking(false);
    };

    const playStepAudio = async (index: number) => {
        if (!audioEnabled || !hasKey) {
            setIsSpeaking(false);
            return;
        }
        
        stopAudio();
        setIsLoadingAudio(true);
        
        try {
            const buffer = await generateSpeech(TOUR_STEPS[index].text);
            
            if (buffer) {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                }
                const ctx = audioContextRef.current;
                if (ctx.state === 'suspended') await ctx.resume();

                const audioBuffer = await ctx.decodeAudioData(buffer);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                
                sourceRef.current = source;
                setIsSpeaking(true);
                setIsLoadingAudio(false);
                
                source.start(0);
                source.onended = () => {
                    setIsSpeaking(false);
                    sourceRef.current = null;
                };
            } else {
                setIsLoadingAudio(false);
            }
        } catch (e) {
            console.error("Tour audio error", e);
            setIsLoadingAudio(false);
            setIsSpeaking(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => playStepAudio(0), 1000);
        return () => {
            clearTimeout(timer);
            stopAudio();
        };
    }, []);

    const handleNext = () => {
        const nextIndex = currentStep + 1;
        if (nextIndex < TOUR_STEPS.length) {
            setCurrentStep(nextIndex);
            onNavigate(TOUR_STEPS[nextIndex].view);
            playStepAudio(nextIndex);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            const prevIndex = currentStep - 1;
            setCurrentStep(prevIndex);
            onNavigate(TOUR_STEPS[prevIndex].view);
            playStepAudio(prevIndex);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] pointer-events-none flex flex-col items-center justify-center p-4 md:p-8">
            {/* SPATIAL SPOTLIGHT MASK */}
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-700">
                {spotlight && (
                    <div 
                        className="absolute bg-transparent rounded-xl shadow-[0_0_0_9999px_rgba(15,23,42,0.75)] transition-all duration-500 ease-in-out border-2 border-indigo-400/50"
                        style={{
                            top: spotlight.top - 8,
                            left: spotlight.left - 8,
                            width: spotlight.width + 16,
                            height: spotlight.height + 16,
                        }}
                    >
                        <div className="absolute inset-0 rounded-xl border-4 border-white/20 animate-ping opacity-20"></div>
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-bounce shadow-xl">
                            Look Here
                        </div>
                    </div>
                )}
            </div>

            {/* AI CHARACTER INTERFACE */}
            <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] border border-white/40 pointer-events-auto overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-12 duration-700">
                <button onClick={onComplete} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 z-20">
                    <X size={20} />
                </button>
                
                <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
                    <div 
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                        style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
                    />
                </div>

                <div className="p-10 pt-12">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        {/* THE PERSONA - SVG FACE */}
                        <div className="relative shrink-0">
                            <div className={`w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl transition-all duration-700 ${isSpeaking ? 'scale-110 rotate-2' : 'scale-100 rotate-0'}`}>
                                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g>
                                        <rect x="20" y="28" width="10" height="10" rx="5" fill="white">
                                            <animate attributeName="height" values="10;1;10" dur="4s" repeatCount="indefinite" />
                                        </rect>
                                        <rect x="50" y="28" width="10" height="10" rx="5" fill="white">
                                            <animate attributeName="height" values="10;1;10" dur="4s" repeatCount="indefinite" />
                                        </rect>
                                        {isSpeaking ? (
                                            <path d="M30 52 Q 40 60, 50 52" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none">
                                                <animate attributeName="d" values="M30 52 Q 40 60, 50 52; M30 55 Q 40 45, 50 55; M30 52 Q 40 60, 50 52" dur="0.3s" repeatCount="indefinite" />
                                            </path>
                                        ) : (
                                            <rect x="32" y="55" width="16" height="3" rx="1.5" fill="white" opacity="0.6" />
                                        )}
                                    </g>
                                </svg>
                            </div>
                        </div>

                        {/* CONTENT */}
                        <div className="flex-1 space-y-6 text-center md:text-left">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                                    Guided Onboarding
                                </span>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => playStepAudio(currentStep)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                                        title="Replay Audio"
                                    >
                                        <RefreshCw size={18} className={isLoadingAudio ? 'animate-spin' : ''} />
                                    </button>
                                    <button 
                                        onClick={() => setAudioEnabled(!audioEnabled)}
                                        className={`p-2 rounded-full transition-all ${audioEnabled ? 'text-indigo-600 hover:bg-indigo-50' : 'text-slate-300'}`}
                                    >
                                        {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{step.title}</h3>
                                <p className="text-slate-600 text-lg leading-relaxed min-h-[100px] animate-in fade-in slide-in-from-left-4 duration-700">
                                    {step.text}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-8">
                        <div className="flex gap-2.5">
                            {TOUR_STEPS.map((_, i) => (
                                <div key={i} className={`h-2 rounded-full transition-all duration-700 ${i === currentStep ? 'w-10 bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.4)]' : 'w-2 bg-slate-200'}`}></div>
                            ))}
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {currentStep > 0 && (
                                <button 
                                    onClick={handlePrev}
                                    className="p-4 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    <ChevronLeft size={28} />
                                </button>
                            )}
                            <button 
                                onClick={handleNext}
                                disabled={isLoadingAudio}
                                className="group relative bg-slate-950 text-white px-10 py-5 rounded-[1.5rem] font-black text-lg hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-2xl hover:shadow-indigo-500/20 disabled:opacity-50 overflow-hidden active:scale-95"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {isLoadingAudio ? (
                                        <Loader2 size={24} className="animate-spin" />
                                    ) : (
                                        <>
                                            {currentStep === TOUR_STEPS.length - 1 ? 'Start Cloning' : 'Next Discovery'}
                                            <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
