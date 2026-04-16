
import React, { useState } from 'react';
import { Briefcase, Sparkles, Loader2, CheckCircle, ArrowLeft, Target, MessageSquare, AlertTriangle, List } from 'lucide-react';
import { generateMeetingPrep, requireUserGeminiSessionOrToast } from '../services/geminiService';

interface MeetingPrepViewProps {
    onClose: () => void;
}

export const MeetingPrepView: React.FC<MeetingPrepViewProps> = ({ onClose }) => {
    const [meetingType, setMeetingType] = useState('Strategy');
    const [context, setContext] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [prepData, setPrepData] = useState<any>(null);

    const handleGenerate = async () => {
        if (!context) return;
        if (!requireUserGeminiSessionOrToast()) return;
        setIsGenerating(true);
        try {
            const data = await generateMeetingPrep(meetingType, context);
            setPrepData(data);
        } catch (e) {
            console.error(e);
            // alert("Failed to generate prep. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-full p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Briefcase className="text-blue-600" />
                            Meeting Prep Sidekick
                        </h1>
                        <p className="text-slate-500 mt-2">Win your next meeting with AI-generated strategy.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 font-bold text-sm flex items-center gap-2">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Meeting Type</label>
                            <select 
                                value={meetingType} 
                                onChange={(e) => setMeetingType(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Strategy">Strategy Session</option>
                                <option value="Sales/Pitch">Sales / Pitch</option>
                                <option value="Negotiation">Negotiation</option>
                                <option value="1:1">1:1 / Performance Review</option>
                                <option value="Team Sync">Team Sync</option>
                                <option value="Interview">Job Interview</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Context & Agenda</label>
                            <textarea 
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                placeholder="Paste agenda, email thread, or key goals here..."
                                className="w-full p-4 border border-slate-200 rounded-xl h-48 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !context}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-200"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                            Generate Briefing Doc
                        </button>
                    </div>

                    {/* Output Section */}
                    <div className="space-y-6">
                        {prepData ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                                {/* Objective Card */}
                                <div className="bg-white p-6 rounded-2xl border-l-4 border-emerald-500 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Target size={16} /> Strategic Objective
                                    </h3>
                                    <p className="text-lg font-medium text-slate-900 leading-relaxed">
                                        {prepData.objective}
                                    </p>
                                </div>

                                {/* Smart Questions */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <MessageSquare size={16} /> Smart Questions to Ask
                                    </h3>
                                    <ul className="space-y-3">
                                        {prepData.smartQuestions?.map((q: string, i: number) => (
                                            <li key={i} className="flex gap-3 text-slate-700">
                                                <span className="font-bold text-blue-400">{i+1}.</span>
                                                {q}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Risks */}
                                {prepData.potentialRisks && prepData.potentialRisks.length > 0 && (
                                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm">
                                        <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <AlertTriangle size={16} /> Blind Spots & Risks
                                        </h3>
                                        <ul className="space-y-2">
                                            {prepData.potentialRisks.map((r: string, i: number) => (
                                                <li key={i} className="flex gap-2 text-amber-900 text-sm">
                                                    <span className="text-amber-500">•</span> {r}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Talking Points */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <List size={16} /> Key Talking Points
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {prepData.talkingPoints?.map((tp: string, i: number) => (
                                            <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200">
                                                {tp}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                    <Briefcase size={32} className="opacity-50" />
                                </div>
                                <p className="text-center font-medium max-w-xs">
                                    {isGenerating 
                                        ? "Analyzing agenda and simulating potential outcomes..." 
                                        : "Enter meeting details to receive your tactical briefing."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
