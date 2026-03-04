
import React, { useState, useRef, useEffect } from 'react';
import { 
    Sparkles, ArrowRight, Mic, BookOpen, Layers, Square, 
    FileText, CheckCircle, Loader2, RefreshCw, Eye, Mic2, MonitorPlay, BarChart3, Zap, Copy, ImageIcon, Download, X,
    Bot, Code, Globe, Brain, Save, Cloud, FileUp, Link as LinkIcon, HardDrive, Plus, Trash2, MessageSquare, Send, PlayCircle, Settings,
    Radio, Volume2, VolumeX
} from 'lucide-react';
import { Course, CourseStatus, Module, UserProfile, MarketingAssets, MicroLesson, ExpertPersona, ChatMessage } from '../types';
import { generateNextInterviewQuestion, generateCourseSyllabus, generateCourseMarketingAssets, generateCoursePodcast, generateMicroLesson, generateMarketingFlyer, generatePersonaAvatar, getClient, generateSpeech, hasValidKey } from '../services/geminiService';
import { LiveTutor } from './LiveTutor';

interface CreatorStudioProps {
    onPublishCourse: (course: Course) => void;
    courses: Course[];
    user: UserProfile | null;
    onNavigateToDashboard: () => void;
    courseToEdit: Course | null;
    onClearEditMode: () => void;
}

interface SourceItem {
    id: string;
    name: string;
    type: 'FILE' | 'DRIVE' | 'ONEDRIVE' | 'LINK' | 'TEXT';
    content: string;
}

export const CreatorStudio: React.FC<CreatorStudioProps> = ({ 
    onPublishCourse, 
    onNavigateToDashboard, 
    user,
    courseToEdit,
    onClearEditMode
}) => {
    const [currentCourseId, setCurrentCourseId] = useState<string>(courseToEdit?.id || '');
    const [wizardMode, setWizardMode] = useState<'TOPIC' | 'BRAIN_DUMP' | 'OUTLINE' | 'MARKETING' | 'TWIN_LAB' | 'MICRO' | 'IMPORT'>('TOPIC');
    const [topic, setTopic] = useState(courseToEdit?.topic || '');
    const [title, setTitle] = useState(courseToEdit?.title || '');
    const [description, setDescription] = useState(courseToEdit?.description || '');
    const [generatedModules, setGeneratedModules] = useState<Module[]>(courseToEdit?.modules || []);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [sources, setSources] = useState<SourceItem[]>([]);
    const [activeImportTab, setActiveImportTab] = useState<'TEXT' | 'FILE' | 'CLOUD'>('TEXT');
    const [tempText, setTempText] = useState('');
    const [tempLink, setTempLink] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [marketingData, setMarketingData] = useState<MarketingAssets | null>(null);
    const [podcastUrl, setPodcastUrl] = useState<string | null>(null);
    const [flyerUrl, setFlyerUrl] = useState<string | null>(null);
    const [isGeneratingMarketing, setIsGeneratingMarketing] = useState(false);
    const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
    const [isGeneratingFlyer, setIsGeneratingFlyer] = useState(false);
    const [showMarketingModal, setShowMarketingModal] = useState(false);

    const [microLesson, setMicroLesson] = useState<MicroLesson | null>(null);

    const [twinConfig, setTwinConfig] = useState<ExpertPersona>({
        id: '',
        name: '',
        role: 'Course Guide',
        systemPrompt: '',
        accentColor: '#6366f1',
        voiceName: 'Kore',
        yearsExperience: 5
    });
    const [isTrainingTwin, setIsTrainingTwin] = useState(false);
    const [embedCode, setEmbedCode] = useState('');
    const [twinAvatarGenerating, setTwinAvatarGenerating] = useState(false);
    const [activeTwinTab, setActiveTwinTab] = useState<'CHAT' | 'VOICE'>('CHAT');
    
    const [testChatMessages, setTestChatMessages] = useState<ChatMessage[]>([]);
    const [testChatInput, setTestChatInput] = useState('');
    const [isTestTyping, setIsTestTyping] = useState(false);
    const testChatSessionRef = useRef<any>(null);
    const testMessagesEndRef = useRef<HTMLDivElement>(null);
    const [showVoiceTest, setShowVoiceTest] = useState(false);

    const [brainDumpState, setBrainDumpState] = useState<'IDLE' | 'RECORDING' | 'PROCESSING' | 'REVIEW' | 'EDIT'>('IDLE');
    const [interviewHistory, setInterviewHistory] = useState<{question: string, answer: string}[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState("What is the main topic you want to teach?");
    const [currentAnswerDraft, setCurrentAnswerDraft] = useState("");
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    // --- Audio Utilities ---
    const decodeRawPcm = async (data: ArrayBuffer, ctx: AudioContext, sampleRate: number = 24000, numChannels: number = 1): Promise<AudioBuffer> => {
        const dataInt16 = new Int16Array(data);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    };

    const stopAudio = () => {
        if (currentAudioSourceRef.current) {
            try { currentAudioSourceRef.current.stop(); } catch(e) {}
            currentAudioSourceRef.current = null;
        }
        setIsSpeaking(false);
    };

    const speakQuestion = async (text: string) => {
        if (!isAudioEnabled || !hasValidKey()) return;
        
        stopAudio();
        setIsSpeaking(true);

        try {
            const buffer = await generateSpeech(text);
            if (buffer) {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                }
                const ctx = audioContextRef.current;
                if (ctx.state === 'suspended') await ctx.resume();

                const audioBuffer = await decodeRawPcm(buffer, ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                
                currentAudioSourceRef.current = source;
                source.start(0);
                source.onended = () => {
                    setIsSpeaking(false);
                    currentAudioSourceRef.current = null;
                };
            } else {
                setIsSpeaking(false);
            }
        } catch (e) {
            console.error("Brain Dump audio error", e);
            setIsSpeaking(false);
        }
    };

    // Auto-speak questions
    useEffect(() => {
        if (wizardMode === 'BRAIN_DUMP' && isAudioEnabled && currentQuestion && !isAiThinking) {
            speakQuestion(currentQuestion);
        }
        return () => stopAudio();
    }, [currentQuestion, wizardMode]);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch(e) {}
            }
            stopAudio();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        if (testMessagesEndRef.current) {
            testMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [testChatMessages, isTestTyping]);

    const handleAddTextSource = () => {
        if (!tempText.trim()) return;
        const newSource: SourceItem = {
            id: `src-${Date.now()}`,
            name: `Text Snippet ${sources.length + 1}`,
            type: 'TEXT',
            content: tempText
        };
        setSources([...sources, newSource]);
        setTempText('');
        if (!topic) setTopic("Custom Knowledge Base");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const newSource: SourceItem = {
                id: `src-${Date.now()}`,
                name: file.name,
                type: 'FILE',
                content: text
            };
            setSources([...sources, newSource]);
            if (!topic) setTopic(file.name.replace(/\.[^/.]+$/, ""));
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAddLinkSource = (type: 'DRIVE' | 'ONEDRIVE' | 'LINK') => {
        if (!tempLink.trim()) return;
        const newSource: SourceItem = {
            id: `src-${Date.now()}`,
            name: type === 'DRIVE' ? 'Google Doc' : type === 'ONEDRIVE' ? 'Word Doc' : 'Web Resource',
            type: type,
            content: `[Simulated Content imported from ${tempLink}]. \n\nKey Concepts extracted: Strategy, Execution, Analysis.` 
        };
        setSources([...sources, newSource]);
        setTempLink('');
    };

    const handleRemoveSource = (id: string) => {
        setSources(sources.filter(s => s.id !== id));
    };

    const handleBrainDumpToggle = async () => {
        if (brainDumpState === 'IDLE' || brainDumpState === 'REVIEW' || brainDumpState === 'EDIT') {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
                return;
            }
            
            stopAudio();
            setBrainDumpState('RECORDING');
            setCurrentAnswerDraft(""); 

            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    finalTranscript += event.results[i][0].transcript;
                }
                setCurrentAnswerDraft(finalTranscript);
            };

            recognition.onend = () => {
                setBrainDumpState(prev => (prev === 'RECORDING' || prev === 'PROCESSING') ? 'REVIEW' : prev);
            };

            recognitionRef.current = recognition;
            try {
                recognition.start();
            } catch (e) {
                setBrainDumpState('IDLE');
            }
        } else if (brainDumpState === 'RECORDING') {
            setBrainDumpState('PROCESSING'); 
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch(e) {}
            }
        }
    };

    const submitAnswerAndNext = async () => {
        if (!currentAnswerDraft.trim()) return;
        
        const newHistory = [...interviewHistory, { question: currentQuestion, answer: currentAnswerDraft }];
        setInterviewHistory(newHistory);
        setCurrentAnswerDraft("");
        setBrainDumpState('IDLE');
        setIsAiThinking(true);

        try {
            const nextQuestion = await generateNextInterviewQuestion(newHistory);
            setCurrentQuestion(nextQuestion);
        } catch (e) {
            setCurrentQuestion("Could you elaborate on that?");
        } finally {
            setIsAiThinking(false);
        }
    };

    const handleFinishInterview = async () => {
        setIsGenerating(true);
        setWizardMode('OUTLINE');
        try {
            const context = interviewHistory.map(h => `Q: ${h.question}\nA: ${h.answer}`).join('\n\n');
            const result = await generateCourseSyllabus(topic || 'Expert Masterclass', context);
            
            setTitle(result.title || title);
            setDescription(result.description || description);
            setGeneratedModules(result.modules?.map((m: any, i: number) => ({...m, id: `mod-${Date.now()}-${i}`, isCompleted: false})) || []);
        } catch (e) {
            alert("Failed to generate outline.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateOutline = async () => {
        if (!topic) return;
        setIsGenerating(true);
        try {
            const result = await generateCourseSyllabus(topic);
            setTitle(result.title || 'New Course');
            setDescription(result.description || '');
            setGeneratedModules(result.modules?.map((m: any, i: number) => ({...m, id: `mod-${Date.now()}-${i}`, isCompleted: false})) || []);
            setWizardMode('OUTLINE');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveDraft = () => {
        const idToUse = currentCourseId || courseToEdit?.id || `course-${Date.now()}`;
        const newCourse: Course = {
            ...courseToEdit,
            id: idToUse,
            title: title || 'Untitled Course',
            topic: topic || title,
            description: description || '',
            progress: courseToEdit?.progress || 0,
            createdAt: courseToEdit?.createdAt || Date.now(),
            modules: generatedModules,
            authorName: user?.name || 'Anonymous',
            status: CourseStatus.DRAFT,
            isDefault: courseToEdit?.isDefault || false
        };
        if (!currentCourseId) setCurrentCourseId(idToUse);
        onPublishCourse(newCourse);
        alert("Draft saved successfully.");
    };

    const handlePublish = () => {
        const idToUse = currentCourseId || courseToEdit?.id || `course-${Date.now()}`;
        const newCourse: Course = {
            ...courseToEdit,
            id: idToUse,
            title: title || 'Untitled Course',
            topic: topic || title,
            description: description || '',
            progress: courseToEdit?.progress || 0,
            createdAt: courseToEdit?.createdAt || Date.now(),
            modules: generatedModules,
            authorName: user?.name || 'Anonymous',
            status: CourseStatus.PUBLISHED,
            isDefault: courseToEdit?.isDefault || false
        };
        if (!currentCourseId) setCurrentCourseId(idToUse);
        onPublishCourse(newCourse);
        onNavigateToDashboard();
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-full">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <Sparkles className="text-purple-600" />
                    Creator Studio
                </h1>
                <div className="flex items-center gap-2">
                    {wizardMode === 'OUTLINE' && (
                        <button onClick={handleSaveDraft} className="text-indigo-600 hover:text-indigo-800 font-bold text-sm px-4 py-2 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2">
                            <Save size={16} /> Save Draft
                        </button>
                    )}
                    <button onClick={onNavigateToDashboard} className="text-slate-500 hover:text-slate-900 font-bold text-sm px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors">
                        Exit Studio
                    </button>
                </div>
            </div>

            {wizardMode === 'OUTLINE' && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-xl font-bold mb-6 text-slate-900">Course outline</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Course title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Course title"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Course description"
                                rows={4}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-y"
                            />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Modules ({generatedModules.length})</h3>
                            <ul className="space-y-4">
                                {generatedModules.map((mod, i) => (
                                    <li key={mod.id || i} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                                        <div className="font-medium text-slate-900">{i + 1}. {mod.title}</div>
                                        {mod.description && <p className="text-sm text-slate-600 mt-1">{mod.description}</p>}
                                        {mod.keyConcepts && mod.keyConcepts.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {mod.keyConcepts.map((c, j) => (
                                                    <span key={j} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">{c}</span>
                                                ))}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-8">
                        <button onClick={() => setWizardMode('TOPIC')} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">
                            Back to topic
                        </button>
                        <button onClick={handleSaveDraft} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                            <Save size={16} /> Save draft
                        </button>
                        <button onClick={handlePublish} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                            Publish course
                        </button>
                    </div>
                </div>
            )}

            {wizardMode === 'TOPIC' && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-xl font-bold mb-6">What do you want to teach?</h2>
                    <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Advanced React Patterns, Crisis Leadership..."
                        className="w-full p-4 border border-slate-300 rounded-xl text-lg mb-6 focus:ring-2 focus:ring-purple-500 outline-none"
                        disabled={isGenerating}
                    />
                    {isGenerating && (
                        <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-purple-50 border border-purple-100 text-purple-800">
                            <Loader2 className="animate-spin flex-shrink-0" size={24} />
                            <span>Generating course outline…</span>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <button onClick={handleGenerateOutline} disabled={!topic || isGenerating} className="p-4 border-2 border-slate-100 hover:border-purple-500 rounded-xl flex flex-col items-center gap-3 group transition-all bg-white disabled:opacity-60">
                            <div className="bg-purple-50 p-3 rounded-full group-hover:bg-purple-100 transition-colors"><Layers size={24} className="text-purple-600"/></div>
                            <div className="text-center"><span className="font-bold text-slate-700 block text-sm">Full Course</span><span className="text-[10px] text-slate-500">Comprehensive Syllabus</span></div>
                        </button>
                        <button onClick={() => setWizardMode('BRAIN_DUMP')} disabled={!topic} className="p-4 border-2 border-slate-100 hover:border-indigo-500 rounded-xl flex flex-col items-center gap-3 group transition-all bg-white">
                            <div className="bg-indigo-50 p-3 rounded-full group-hover:bg-indigo-100 transition-colors"><Mic size={24} className="text-indigo-600"/></div>
                            <div className="text-center"><span className="font-bold text-slate-700 block text-sm">Brain Dump</span><span className="text-[10px] text-slate-500">Interview Mode</span></div>
                        </button>
                        <button onClick={() => setWizardMode('MICRO')} disabled={!topic} className="p-4 border-2 border-slate-100 hover:border-amber-500 rounded-xl flex flex-col items-center gap-3 group transition-all bg-white">
                            <div className="bg-amber-50 p-3 rounded-full group-hover:bg-amber-100 transition-colors"><Zap size={24} className="text-amber-600"/></div>
                            <div className="text-center"><span className="font-bold text-slate-700 block text-sm">Micro-Lesson</span><span className="text-[10px] text-slate-500">3-Min Quick Hit</span></div>
                        </button>
                        <button onClick={() => setWizardMode('IMPORT')} className="p-4 border-2 border-slate-100 hover:border-emerald-500 rounded-xl flex flex-col items-center gap-3 group transition-all bg-white">
                            <div className="bg-emerald-50 p-3 rounded-full group-hover:bg-emerald-100 transition-colors"><FileText size={24} className="text-emerald-600"/></div>
                            <div className="text-center"><span className="font-bold text-slate-700 block text-sm">Import Content</span><span className="text-[10px] text-slate-500">Document Upload</span></div>
                        </button>
                    </div>
                </div>
            )}

            {wizardMode === 'BRAIN_DUMP' && (
                <div className="bg-slate-950 text-white rounded-[2.5rem] p-0 text-center border border-white/10 relative overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col h-[650px]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
                    
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <Radio size={20} className={brainDumpState === 'RECORDING' ? 'animate-pulse text-red-500' : ''} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-bold tracking-tight">Wisdom Recording Studio</h3>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tacit Knowledge Extraction</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                                className={`p-2 rounded-lg transition-colors ${isAudioEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-500'}`}
                                title={isAudioEnabled ? "Disable Interviewer Voice" : "Enable Interviewer Voice"}
                            >
                                {isAudioEnabled ? <Volume2 size={18}/> : <VolumeX size={18}/>}
                            </button>
                            {interviewHistory.length > 0 && (
                                <button onClick={handleFinishInterview} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40">
                                    Synthesize Course
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-950">
                        {interviewHistory.map((item, idx) => (
                            <React.Fragment key={idx}>
                                <div className="flex justify-start animate-in slide-in-from-left-4">
                                    <div className="bg-slate-900/80 p-5 rounded-3xl rounded-tl-none max-w-[85%] border border-white/5 text-left">
                                        <p className="text-[10px] text-indigo-400 font-black mb-2 uppercase tracking-widest">Interviewer</p>
                                        <p className="text-slate-300 text-sm leading-relaxed">{item.question}</p>
                                    </div>
                                </div>
                                <div className="flex justify-end animate-in slide-in-from-right-4">
                                    <div className="bg-indigo-600/20 p-5 rounded-3xl rounded-tr-none max-w-[85%] border border-indigo-500/30 text-left shadow-xl">
                                        <p className="text-[10px] text-indigo-300 font-black mb-2 uppercase tracking-widest">Your Mastery</p>
                                        <p className="text-white text-sm leading-relaxed">{item.answer}</p>
                                    </div>
                                </div>
                            </React.Fragment>
                        ))}
                        <div className="flex justify-start animate-in slide-in-from-bottom-4">
                            <div className="bg-indigo-600/5 p-6 rounded-3xl rounded-tl-none max-w-[85%] border border-indigo-500/20 text-left relative group">
                                <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
                                <p className="text-[10px] text-indigo-400 font-black mb-3 uppercase tracking-widest flex items-center gap-2">
                                    Active Prompt
                                    {isSpeaking && <span className="flex items-center gap-0.5 ml-2"><span className="w-1 h-3 bg-indigo-400 rounded-full animate-pulse"></span><span className="w-1 h-2 bg-indigo-400 rounded-full animate-pulse delay-75"></span><span className="w-1 h-3 bg-indigo-400 rounded-full animate-pulse delay-150"></span></span>}
                                </p>
                                <p className="text-white text-xl font-bold leading-tight tracking-tight">
                                    {isAiThinking ? (
                                        <span className="flex items-center gap-3 text-slate-500 font-medium">
                                            <Loader2 className="animate-spin" size={20}/> Deep Processing...
                                        </span>
                                    ) : currentQuestion}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-900/50 border-t border-white/5">
                        {brainDumpState === 'REVIEW' || brainDumpState === 'EDIT' ? (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="relative group">
                                    <textarea 
                                        value={currentAnswerDraft} 
                                        onChange={(e) => {setCurrentAnswerDraft(e.target.value); setBrainDumpState('EDIT');}} 
                                        className="w-full bg-slate-950 text-white p-5 rounded-2xl border border-white/10 focus:border-indigo-500 outline-none text-sm h-32 resize-none transition-all tabular-nums" 
                                        placeholder="Reviewing expert transcript..."
                                    />
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-50">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={handleBrainDumpToggle} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-slate-400 transition-colors flex items-center gap-2 border border-white/10">
                                        <RefreshCw size={16}/> Retake Session
                                    </button>
                                    <button onClick={submitAnswerAndNext} disabled={!currentAnswerDraft.trim()} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-30 shadow-2xl shadow-indigo-900/50">
                                        Commit Answer <ArrowRight size={20}/>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6">
                                {brainDumpState === 'RECORDING' && (
                                    <div className="flex items-end gap-1 h-12 mb-2">
                                        {[1,2,3,4,5,6,7,8,7,6,5,4,3,2,1].map((h, i) => (
                                            <div key={i} className="w-1.5 bg-indigo-500 rounded-full animate-pulse" style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 100}ms` }}></div>
                                        ))}
                                    </div>
                                )}
                                <button 
                                    onClick={handleBrainDumpToggle} 
                                    disabled={isAiThinking} 
                                    className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all border-8 relative ${brainDumpState === 'RECORDING' ? 'bg-red-600 border-red-500/20 scale-110' : 'bg-white border-white/5 hover:scale-105 active:scale-95'}`}
                                >
                                    {brainDumpState === 'RECORDING' && <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping"></div>}
                                    {brainDumpState === 'RECORDING' ? <Square size={32} className="text-white fill-white" /> : <Mic size={40} className="text-slate-950"/>}
                                </button>
                                <div className="text-center">
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-1">
                                        {brainDumpState === 'RECORDING' ? 'Active Input Signal' : 'Mastery Standby'}
                                    </p>
                                    <p className="text-[10px] text-indigo-400 font-bold">
                                        {brainDumpState === 'RECORDING' ? 'Capturing tacit judgment...' : 'Click to begin expert session'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {wizardMode === 'MICRO' && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-xl font-bold mb-2 text-slate-900 flex items-center gap-2">
                        <Zap className="text-amber-500" size={24} /> Micro-Lesson
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">3-minute quick hit on: <strong>{topic || 'Your topic'}</strong></p>
                    {!microLesson ? (
                        <div className="space-y-4">
                            <p className="text-slate-600">Generate a short, focused lesson you can use as a stand-alone or add to a course later.</p>
                            <button
                                onClick={async () => {
                                    if (!topic?.trim()) return;
                                    setIsGenerating(true);
                                    try {
                                        const lesson = await generateMicroLesson(topic);
                                        setMicroLesson({ ...lesson, id: lesson.id || `micro-${Date.now()}`, generatedAt: Date.now() });
                                    } catch (e) {
                                        console.error(e);
                                        alert('Failed to generate micro-lesson. Please try again.');
                                    } finally {
                                        setIsGenerating(false);
                                    }
                                }}
                                disabled={!topic?.trim() || isGenerating}
                                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                                {isGenerating ? 'Generating…' : 'Generate 3-min lesson'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 text-left">
                            <h3 className="text-lg font-bold text-slate-900">{microLesson.title}</h3>
                            {microLesson.duration && <p className="text-xs text-slate-500">{microLesson.duration}</p>}
                            <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap">{microLesson.content}</div>
                        </div>
                    )}
                    <div className="mt-8 flex flex-wrap gap-3">
                        <button onClick={() => { setMicroLesson(null); setWizardMode('TOPIC'); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">
                            Back to topic
                        </button>
                        {microLesson && (
                            <button onClick={() => { setMicroLesson(null); setWizardMode('TOPIC'); }} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
                                Create another
                            </button>
                        )}
                    </div>
                </div>
            )}

            {wizardMode === 'IMPORT' && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-xl font-bold mb-2 text-slate-900 flex items-center gap-2">
                        <FileText className="text-emerald-500" size={24} /> Import Content
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">Paste text, upload a file, or add a link. Then generate a course from your sources.</p>
                    <div className="flex gap-2 mb-4 border-b border-slate-200">
                        {(['TEXT', 'FILE', 'CLOUD'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveImportTab(tab)}
                                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeImportTab === tab ? 'bg-slate-100 text-slate-900 border-b-2 border-emerald-500 -mb-px' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab === 'TEXT' ? 'Paste text' : tab === 'FILE' ? 'Upload file' : 'Link / Cloud'}
                            </button>
                        ))}
                    </div>
                    {activeImportTab === 'TEXT' && (
                        <div className="space-y-3">
                            <textarea
                                value={tempText}
                                onChange={(e) => setTempText(e.target.value)}
                                placeholder="Paste your content, notes, or document text here..."
                                rows={6}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
                            />
                            <button onClick={handleAddTextSource} disabled={!tempText.trim()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
                                Add to sources
                            </button>
                        </div>
                    )}
                    {activeImportTab === 'FILE' && (
                        <div className="space-y-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt,.md,.json"
                                onChange={handleFileUpload}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700"
                            />
                            <p className="text-xs text-slate-500">Supported: .txt, .md, .json. Content will be used as course source.</p>
                        </div>
                    )}
                    {activeImportTab === 'CLOUD' && (
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={tempLink}
                                onChange={(e) => setTempLink(e.target.value)}
                                placeholder="Paste a Google Doc, OneDrive, or web URL..."
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <div className="flex gap-2">
                                <button onClick={() => handleAddLinkSource('LINK')} disabled={!tempLink.trim()} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 text-sm font-medium rounded-lg">Add as link</button>
                                <button onClick={() => handleAddLinkSource('DRIVE')} disabled={!tempLink.trim()} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 text-sm font-medium rounded-lg">Add as Google Doc</button>
                                <button onClick={() => handleAddLinkSource('ONEDRIVE')} disabled={!tempLink.trim()} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 text-sm font-medium rounded-lg">Add as OneDrive</button>
                            </div>
                        </div>
                    )}
                    {sources.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-slate-700 mb-2">Sources ({sources.length})</h3>
                            <ul className="space-y-2">
                                {sources.map((s) => (
                                    <li key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <span className="text-sm font-medium text-slate-800 truncate">{s.name}</span>
                                        <button onClick={() => handleRemoveSource(s.id)} className="text-slate-400 hover:text-red-600 p-1" aria-label="Remove"><X size={16} /></button>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={async () => {
                                    const context = sources.map(s => s.content).join('\n\n').substring(0, 50000);
                                    setIsGenerating(true);
                                    try {
                                        const result = await generateCourseSyllabus(topic || 'Imported content', context);
                                        setTitle(result.title || title);
                                        setDescription(result.description || description);
                                        setGeneratedModules(result.modules?.map((m: any, i: number) => ({ ...m, id: `mod-${Date.now()}-${i}`, isCompleted: false })) || []);
                                        setWizardMode('OUTLINE');
                                    } catch (e) {
                                        console.error(e);
                                        alert('Failed to generate outline from sources.');
                                    } finally {
                                        setIsGenerating(false);
                                    }
                                }}
                                disabled={isGenerating}
                                className="mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : null}
                                {isGenerating ? 'Generating outline…' : 'Generate course from sources'}
                            </button>
                        </div>
                    )}
                    <div className="mt-8">
                        <button onClick={() => setWizardMode('TOPIC')} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">
                            Back to topic
                        </button>
                    </div>
                </div>
            )}

            {/* TWIN_LAB and MARKETING render modes can be added here if needed */}
        </div>
    );
};
