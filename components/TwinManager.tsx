
import React, { useState, useEffect } from 'react';
import { Bot, Plus, Edit, Code, MessageSquare, Trash2, CheckCircle, Copy, Globe, Loader2, Image as ImageIcon } from 'lucide-react';
import { ExpertPersona } from '../types';
import { generatePersonaAvatar } from '../services/geminiService';

const STORAGE_KEY = 'knovatwin_expert_personas_v1';

export const TwinManager: React.FC = () => {
    const [twins, setTwins] = useState<ExpertPersona[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTwin, setCurrentTwin] = useState<ExpertPersona | null>(null);
    const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

    useEffect(() => {
        loadTwins();
    }, []);

    const loadTwins = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setTwins(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load twins", e);
        }
    };

    const saveTwin = (twin: ExpertPersona) => {
        const updatedTwins = currentTwin && twins.find(t => t.id === twin.id)
            ? twins.map(t => t.id === twin.id ? twin : t)
            : [...twins, twin];
        
        setTwins(updatedTwins);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTwins));
        setIsEditing(false);
        setCurrentTwin(null);
    };

    const handleDelete = (id: string) => {
        if(confirm("Delete this Twin? This will break any existing embeds.")) {
            const updated = twins.filter(t => t.id !== id);
            setTwins(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
    };

    const handleCreateNew = () => {
        const newTwin: ExpertPersona = {
            id: `twin-${Date.now()}`,
            name: '',
            role: '',
            systemPrompt: 'You are a helpful AI assistant.',
            accentColor: '#6366f1',
            voiceName: 'Kore',
            yearsExperience: 5
        };
        setCurrentTwin(newTwin);
        setIsEditing(true);
    };

    const handleGenerateAvatar = async () => {
        if (!currentTwin) return;
        setIsGeneratingAvatar(true);
        try {
            const url = await generatePersonaAvatar(currentTwin);
            if (url) {
                setCurrentTwin({ ...currentTwin, avatarUrl: url });
            }
        } catch (e) {
            console.error("Avatar gen failed", e);
        } finally {
            setIsGeneratingAvatar(false);
        }
    };

    const getEmbedCode = (id: string) => {
        const origin = window.location.origin;
        return `<iframe src="${origin}?view=public_agent&twinId=${id}" width="100%" height="600" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"></iframe>`;
    };

    if (isEditing && currentTwin) {
        return (
            <div className="max-w-4xl mx-auto p-6 md:p-8 animate-in fade-in bg-slate-50 min-h-full">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">{twins.find(t => t.id === currentTwin.id) ? 'Edit Twin' : 'Create New Twin'}</h2>
                    <button onClick={() => setIsEditing(false)} className="text-slate-500 font-bold hover:text-slate-800">Cancel</button>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
                                <input 
                                    value={currentTwin.name}
                                    onChange={e => setCurrentTwin({...currentTwin, name: e.target.value})}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. Sales Copilot"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Role / Title</label>
                                <input 
                                    value={currentTwin.role}
                                    onChange={e => setCurrentTwin({...currentTwin, role: e.target.value})}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. Product Expert"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Voice</label>
                                <select 
                                    value={currentTwin.voiceName}
                                    onChange={e => setCurrentTwin({...currentTwin, voiceName: e.target.value})}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                >
                                    {['Kore', 'Fenrir', 'Puck', 'Charon', 'Zephyr'].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Visual Identity</label>
                            <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 bg-slate-200 flex items-center justify-center">
                                    {currentTwin.avatarUrl ? (
                                        <img src={currentTwin.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <Bot size={40} className="text-slate-400" />
                                    )}
                                </div>
                                <button 
                                    onClick={handleGenerateAvatar}
                                    disabled={isGeneratingAvatar || !currentTwin.name || !currentTwin.role}
                                    className="px-4 py-2 bg-indigo-100 text-indigo-700 font-bold rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-2 text-xs"
                                >
                                    {isGeneratingAvatar ? <Loader2 className="animate-spin" size={14}/> : <ImageIcon size={14}/>}
                                    Generate with AI
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">System Instructions (Knowledge Base)</label>
                        <textarea 
                            value={currentTwin.systemPrompt}
                            onChange={e => setCurrentTwin({...currentTwin, systemPrompt: e.target.value})}
                            className="w-full h-48 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm leading-relaxed"
                            placeholder="You are an expert in..."
                        />
                        <p className="text-xs text-slate-500 mt-2">Paste course content, FAQs, or personality guidelines here.</p>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button 
                            onClick={() => saveTwin(currentTwin)}
                            disabled={!currentTwin.name}
                            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg disabled:opacity-50"
                        >
                            Save Twin
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto bg-slate-50">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Bot className="text-indigo-600" />
                        Twin Lab
                    </h1>
                    <p className="text-slate-500 mt-2">Create, manage, and deploy your digital workforce.</p>
                </div>
                <button 
                    onClick={handleCreateNew}
                    className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg flex items-center gap-2"
                >
                    <Plus size={18} /> Create Twin
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {twins.length === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <Bot size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-medium text-lg text-slate-600">No Twins Deployed</p>
                        <p className="text-sm">Create your first AI agent to start scaling your expertise.</p>
                    </div>
                )}

                {twins.map(twin => (
                    <div key={twin.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                                {twin.avatarUrl ? (
                                    <img src={twin.avatarUrl} alt={twin.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Bot size={24}/></div>
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="font-bold text-slate-900 truncate">{twin.name}</h3>
                                <p className="text-xs text-slate-500 truncate">{twin.role}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-2 mb-6">
                            <div className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                                <span className="text-slate-500 font-medium">Voice</span>
                                <span className="font-bold text-indigo-600">{twin.voiceName}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                                <span className="text-slate-500 font-medium">Experience</span>
                                <span className="font-bold text-indigo-600">{twin.yearsExperience} Years</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => { setCurrentTwin(twin); setIsEditing(true); }}
                                className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center gap-2"
                            >
                                <Edit size={14}/> Edit
                            </button>
                            <button 
                                onClick={() => {
                                    const code = getEmbedCode(twin.id);
                                    navigator.clipboard.writeText(code);
                                    alert("Embed code copied to clipboard!");
                                }}
                                className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 flex items-center justify-center gap-2"
                            >
                                <Code size={14}/> Embed
                            </button>
                        </div>

                        <button 
                            onClick={() => handleDelete(twin.id)}
                            className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
