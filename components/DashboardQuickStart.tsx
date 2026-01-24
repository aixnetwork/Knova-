
import React, { useState, useEffect } from 'react';
import { Activity, Globe, Zap, Users, ShieldCheck, Play, ArrowUpRight, CloudLightning, RefreshCw, Sparkles } from 'lucide-react';
import { AppView } from '../types';

interface DashboardAnalyticsHeroProps {
    onNavigate: (view: AppView) => void;
    onStartTour: () => void;
}

export const DashboardQuickStart: React.FC<DashboardAnalyticsHeroProps> = ({ 
    onNavigate, 
    onStartTour 
}) => {
    // Simulated Live Metrics
    const [inferences, setInferences] = useState(1248500);
    const [activeNodes, setActiveNodes] = useState(42380);
    const [syncHealth, setSyncHealth] = useState(99.98);

    useEffect(() => {
        const interval = setInterval(() => {
            setInferences(prev => prev + Math.floor(Math.random() * 5));
            setActiveNodes(prev => prev + (Math.random() > 0.5 ? 1 : -1));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const triggerTour = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("[QuickStart] Dispatching relaunch-tour event");
        // We dispatch globally to ensure App.tsx catches it regardless of prop depth
        window.dispatchEvent(new CustomEvent('relaunch-tour'));
    };

    return (
        <div className="mb-10 relative group">
            {/* Ambient Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
            
            <div className="relative bg-slate-950 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden min-h-[220px] flex flex-col xl:flex-row">
                
                {/* Left Section: Live Status */}
                <div className="p-8 xl:w-1/3 border-b xl:border-b-0 xl:border-r border-white/5 flex flex-col justify-between bg-gradient-to-br from-slate-950 to-indigo-950/30">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <Globe size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg tracking-tight">Neural Network</h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Global Pulse Active
                                </p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Expert Inferences</div>
                                <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
                                    {inferences.toLocaleString()}
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div>
                                    <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Active Minds</div>
                                    <div className="text-indigo-400 font-bold tabular-nums">{activeNodes.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Sync Health</div>
                                    <div className="text-emerald-400 font-bold tabular-nums">{syncHealth}%</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={triggerTour}
                        className="mt-8 relative inline-flex items-center gap-3 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40 group/btn active:scale-95"
                    >
                        <div className="p-1.5 bg-white/20 rounded-lg group-hover/btn:rotate-12 transition-transform">
                            <Sparkles size={14} />
                        </div>
                        <span>Neural Discovery Sync</span>
                        <Play size={10} className="fill-current ml-auto opacity-50" />
                        
                        {/* Subtle inner glow */}
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 ring-inset"></div>
                    </button>
                </div>

                {/* Right Section: Intelligence Metrics Grid */}
                <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/[0.02]">
                    {/* Metric 1 */}
                    <div className="relative p-6 rounded-3xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all group/card">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                <Zap size={18} />
                            </div>
                            <ArrowUpRight size={14} className="text-slate-600 group-hover/card:text-white transition-colors" />
                        </div>
                        <h4 className="text-slate-300 font-bold text-sm mb-1">Knowledge Velocity</h4>
                        <div className="text-xl font-black text-white">+84%</div>
                        <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 w-[84%] shadow-[0_0_8px_#f59e0b]"></div>
                        </div>
                    </div>

                    {/* Metric 2 */}
                    <div className="relative p-6 rounded-3xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all group/card">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                <Activity size={18} />
                            </div>
                            <ArrowUpRight size={14} className="text-slate-600 group-hover/card:text-white transition-colors" />
                        </div>
                        <h4 className="text-slate-300 font-bold text-sm mb-1">Neural Retention</h4>
                        <div className="text-xl font-black text-white">High</div>
                        <div className="mt-4 flex gap-1 items-end h-4">
                            {[4, 7, 5, 8, 6, 9, 7].map((h, i) => (
                                <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-sm group-hover/card:bg-indigo-500 transition-colors" style={{ height: `${h * 10}%` }}></div>
                            ))}
                        </div>
                    </div>

                    {/* Metric 3 */}
                    <div className="relative p-6 rounded-3xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all group/card">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <ShieldCheck size={18} />
                            </div>
                            <ArrowUpRight size={14} className="text-slate-600 group-hover/card:text-white transition-colors" />
                        </div>
                        <h4 className="text-slate-300 font-bold text-sm mb-1">Compute Offload</h4>
                        <div className="text-xl font-black text-white">$42k/mo</div>
                        <p className="text-[9px] text-slate-500 mt-4 leading-tight font-medium uppercase tracking-tighter italic">Value of browser-based edge inference</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
