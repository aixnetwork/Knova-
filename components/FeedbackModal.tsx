import React, { useState } from 'react';
import { X, Send, AlertTriangle, Lightbulb, Wrench, CheckCircle, Loader2 } from 'lucide-react';
import { FeedbackType, UserProfile } from '../types';
import { feedbackApi } from '../services/api';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile | null;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, user }) => {
    const [type, setType] = useState<FeedbackType>(FeedbackType.IMPROVEMENT);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSending(true);
        setError(null);

        try {
            await feedbackApi.create({
                type,
                message: message.trim(),
                userName: user?.name || 'Guest',
                userEmail: user?.email || 'guest@example.com',
            });
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setTimeout(() => {
                    setIsSuccess(false);
                    setMessage('');
                    setType(FeedbackType.IMPROVEMENT);
                    setIsSending(false);
                    setError(null);
                }, 300);
            }, 2000);
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to send feedback.';
            setError(msg);
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative border border-slate-200 scale-100 animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Support & Feedback</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Feedback Sent!</h3>
                            <p className="text-slate-600 mb-1">Your message has been dispatched to our Super Admin.</p>
                            <p className="text-xs text-slate-400">A copy has been sent to support@aixnetwork.net</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Type Selection */}
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setType(FeedbackType.IMPROVEMENT)}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                        type === FeedbackType.IMPROVEMENT 
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' 
                                        : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                                    }`}
                                >
                                    <Lightbulb size={20} />
                                    <span className="text-xs font-bold">Suggestion</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType(FeedbackType.BUG)}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                        type === FeedbackType.BUG 
                                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500' 
                                        : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                                    }`}
                                >
                                    <AlertTriangle size={20} />
                                    <span className="text-xs font-bold">Report Bug</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType(FeedbackType.TECHNICAL)}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                        type === FeedbackType.TECHNICAL 
                                        ? 'bg-amber-50 border-amber-500 text-amber-700 ring-1 ring-amber-500' 
                                        : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                                    }`}
                                >
                                    <Wrench size={20} />
                                    <span className="text-xs font-bold">Tech Issue</span>
                                </button>
                            </div>

                            {/* Message Input */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Describe your feedback
                                </label>
                                <textarea
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Please provide details about your request or the issue you encountered..."
                                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none text-sm leading-relaxed"
                                />
                            </div>

                            {/* Footer / Submit */}
                            <div className="flex items-center justify-between pt-2">
                                <div className="text-xs text-slate-400">
                                    Ticket ID: #FB-{Date.now().toString().substr(-6)}
                                </div>
                                {error && (
                                    <p className="text-red-600 text-sm">{error}</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={isSending || !message.trim()}
                                    className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" /> Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} /> Submit Feedback
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                
                {/* Info Footer */}
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400">
                        Replies will be sent to <strong>{user?.email || 'your registered email'}</strong>. 
                        Support hours: Mon-Fri 9am-6pm PST.
                    </p>
                </div>
            </div>
        </div>
    );
};
