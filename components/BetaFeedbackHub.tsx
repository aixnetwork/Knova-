
import React, { useState } from 'react';
import { Bug, Lightbulb, MousePointer, X, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { AppView } from '../types';

interface BetaFeedbackHubProps {
    currentView: AppView;
    isOpen: boolean;
    onClose: () => void;
}

export const BetaFeedbackHub: React.FC<BetaFeedbackHubProps> = ({ currentView, isOpen, onClose }) => {
    const [category, setCategory] = useState<'UX' | 'BUG' | 'IDEA'>('UX');
    const [text, setText] = useState('');
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        // Simulate logging to a telemetry service
        console.log(`[BETA_UX_LOG]: View: ${currentView} | Cat: ${category} | Msg: ${text}`);
        setTimeout(() => {
            setSubmitted(false);
            setText('');
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl z-[100] animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                        <MessageSquare size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm">Beta Insights</h3>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-tighter">View: {currentView}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X size={18}/></button>
            </div>

            <div className="flex-1 p-6 space-y-6">
                {submitted ? (
                    <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h4 className="font-bold text-slate-900">Wisdom Captured</h4>
                        <p className="text-sm text-slate-500 mt-2">Your feedback helps us refine the neural interface.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Feedback Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button type="button" onClick={() => setCategory('UX')} className={`p-2 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 ${category === 'UX' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-500'}`}>
                                    <MousePointer size={14}/> UX
                                </button>
                                <button type="button" onClick={() => setCategory('BUG')} className={`p-2 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 ${category === 'BUG' ? 'border-red-600 bg-red-50 text-red-600' : 'border-slate-200 text-slate-500'}`}>
                                    <Bug size={14}/> Bug
                                </button>
                                <button type="button" onClick={() => setCategory('IDEA')} className={`p-2 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 ${category === 'IDEA' ? 'border-amber-600 bg-amber-50 text-amber-600' : 'border-slate-200 text-slate-500'}`}>
                                    <Lightbulb size={14}/> Idea
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                            <textarea 
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="What felt clunky? What was great?"
                                className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                                required
                            />
                        </div>

                        <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg">
                            <Send size={16} /> Submit Feedback
                        </button>
                    </form>
                )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                <p className="text-[9px] text-slate-400 font-medium">KnovaTwin v2.5 Beta Testing Cluster #042</p>
            </div>
        </div>
    );
};
