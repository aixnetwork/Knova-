
import React, { useState } from 'react';
import { X, CreditCard, Loader2, CheckCircle, Lock, Wallet, ShieldCheck } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    planName: string;
    price: number;
    onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, planName, price, onSuccess }) => {
    const [method, setMethod] = useState<'STRIPE' | 'PAYPAL'>('STRIPE');
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'SELECT' | 'PROCESSING' | 'SUCCESS'>('SELECT');

    if (!isOpen) return null;

    const handlePayment = () => {
        setIsProcessing(true);
        setStep('PROCESSING');
        
        // Simulate API latency for payment processing
        setTimeout(() => {
            setIsProcessing(false);
            setStep('SUCCESS');
            
            // Auto close after success
            setTimeout(() => {
                onSuccess();
                setStep('SELECT'); // Reset for next time
            }, 2000);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-200 scale-100 animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                        <Lock size={16} className="text-emerald-500" /> Secure Checkout
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'SELECT' && (
                        <>
                            <div className="mb-6 text-center">
                                <p className="text-slate-500 text-sm mb-1">Subscribing to</p>
                                <h3 className="text-2xl font-bold text-slate-900">{planName}</h3>
                                <div className="text-3xl font-extrabold text-indigo-600 mt-2">${price}<span className="text-sm text-slate-400 font-medium">/mo</span></div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <button 
                                    onClick={() => setMethod('STRIPE')}
                                    className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${method === 'STRIPE' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-600 text-white p-2 rounded-lg"><CreditCard size={20}/></div>
                                        <div className="text-left">
                                            <div className="font-bold text-slate-900 text-sm">Pay with Card</div>
                                            <div className="text-[10px] text-slate-500">Powered by Stripe</div>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'STRIPE' ? 'border-indigo-600' : 'border-slate-300'}`}>
                                        {method === 'STRIPE' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setMethod('PAYPAL')}
                                    className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${method === 'PAYPAL' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[#003087] text-white p-2 rounded-lg"><Wallet size={20}/></div>
                                        <div className="text-left">
                                            <div className="font-bold text-slate-900 text-sm">PayPal</div>
                                            <div className="text-[10px] text-slate-500">Fast & Secure</div>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'PAYPAL' ? 'border-blue-500' : 'border-slate-300'}`}>
                                        {method === 'PAYPAL' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                                    </div>
                                </button>
                            </div>

                            <button 
                                onClick={handlePayment}
                                className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                Pay ${price} with {method === 'STRIPE' ? 'Card' : 'PayPal'}
                            </button>
                            
                            <div className="mt-4 flex justify-center items-center gap-2 text-[10px] text-slate-400">
                                <ShieldCheck size={12} /> SSL Encrypted Payment
                            </div>
                        </>
                    )}

                    {step === 'PROCESSING' && (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <Loader2 size={48} className="animate-spin text-indigo-600 mb-6" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Processing Payment...</h3>
                            <p className="text-slate-500 text-sm">Connecting to {method === 'STRIPE' ? 'Stripe Secure Gateway' : 'PayPal'}...</p>
                        </div>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h3>
                            <p className="text-slate-600 text-sm">Your subscription to {planName} is now active.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
