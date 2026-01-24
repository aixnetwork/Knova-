
import React, { useState, useEffect } from 'react';
import { 
    Play, Send, CheckCircle, AlertTriangle, ShieldAlert, Award, ArrowRight, 
    Zap, Settings, Building, Users, DollarSign, Briefcase, FileText, 
    Target, BarChart3, RefreshCw
} from 'lucide-react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip 
} from 'recharts';
import { generateSimulation, evaluateSimulation, SimulationConfig } from '../services/geminiService';
import { SimulationScenario, SimulationFeedback, UserProfile } from '../types';

interface SimulationViewProps {
    topic: string;
    user?: UserProfile | null;
    onClose: () => void;
}

// Minimal Icons for internal use
const TrendingUpIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
const TargetIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const CodeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>;
const DollarSignIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const UsersIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;

const DEPARTMENTS = [
    { id: 'Sales', icon: <TrendingUpIcon />, color: 'bg-emerald-100 text-emerald-600' },
    { id: 'Marketing', icon: <TargetIcon />, color: 'bg-rose-100 text-rose-600' },
    { id: 'Operations', icon: <SettingsIcon />, color: 'bg-slate-100 text-slate-600' },
    { id: 'IT', icon: <CodeIcon />, color: 'bg-blue-100 text-blue-600' },
    { id: 'Finance', icon: <DollarSignIcon />, color: 'bg-amber-100 text-amber-600' },
    { id: 'HR', icon: <UsersIcon />, color: 'bg-purple-100 text-purple-600' },
];

const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail'];
const COMPANY_SIZES = ['1-50 (Startup)', '51-200 (Small)', '201-1,000 (Mid)', '1,000-5,000 (Large)', '5,000+ (Ent)'];

export const SimulationView: React.FC<SimulationViewProps> = ({ topic, user, onClose }) => {
    const [scenario, setScenario] = useState<SimulationScenario | null>(null);
    const [solution, setSolution] = useState('');
    const [rationale, setRationale] = useState('');
    const [feedback, setFeedback] = useState<SimulationFeedback | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'setup' | 'loading' | 'scenario' | 'result'>('setup');

    // Configuration State
    const [simConfig, setSimConfig] = useState<SimulationConfig>({
        department: 'Operations',
        industry: user?.industry || 'Technology',
        employees: '201-1,000 (Mid)',
        revenue: '$10M - $50M'
    });

    useEffect(() => {
        if(topic) {
            const lowerTopic = topic.toLowerCase();
            if (lowerTopic.includes('sales')) setSimConfig(p => ({...p, department: 'Sales'}));
            else if (lowerTopic.includes('marketing')) setSimConfig(p => ({...p, department: 'Marketing'}));
            else if (lowerTopic.includes('finance')) setSimConfig(p => ({...p, department: 'Finance'}));
            else if (lowerTopic.includes('tech') || lowerTopic.includes('it')) setSimConfig(p => ({...p, department: 'IT'}));
        }
    }, [topic]);

    const loadScenario = async () => {
        setIsLoading(true);
        setStep('loading');
        try {
            const effectiveUser: UserProfile = user || {
                id: 'guest', name: 'Guest', email: '', role: 'LEARNER' as any, tier: 'FREE' as any,
                title: 'Professional', industry: simConfig.industry, interests: []
            };
            const data = await generateSimulation(effectiveUser, topic, simConfig);
            setScenario(data);
            setStep('scenario');
        } catch (e) {
            console.error(e);
            setStep('setup');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!scenario) return;
        setIsLoading(true);
        try {
            const result = await evaluateSimulation(scenario, solution, rationale);
            setFeedback(result);
            setStep('result');
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    // Radar Data construction
    const radarData = feedback?.metrics ? [
        { subject: 'Strategy', A: feedback.metrics.strategy, fullMark: 100 },
        { subject: 'Empathy', A: feedback.metrics.empathy, fullMark: 100 },
        { subject: 'Execution', A: feedback.metrics.execution, fullMark: 100 },
    ] : [];

    return (
        <div className="h-full bg-slate-50 p-4 md:p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Zap className="text-indigo-600" />
                            Scenario Lab
                        </h1>
                        <p className="text-slate-500 text-sm">Testing your judgment in the "Top 80%" of critical situations.</p>
                    </div>
                    <button onClick={onClose} className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Exit Lab</button>
                </div>

                {step === 'setup' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Briefcase size={20}/> Select Department</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {DEPARTMENTS.map(dept => (
                                        <button
                                            key={dept.id}
                                            onClick={() => setSimConfig({...simConfig, department: dept.id})}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                                simConfig.department === dept.id 
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900' 
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-full ${simConfig.department === dept.id ? 'bg-white' : dept.color}`}>
                                                {dept.icon}
                                            </div>
                                            <span className="font-bold text-sm">{dept.id}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Industry</label>
                                    <select 
                                        value={simConfig.industry}
                                        onChange={(e) => setSimConfig({...simConfig, industry: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Company Size</label>
                                    <select 
                                        value={simConfig.employees}
                                        onChange={(e) => setSimConfig({...simConfig, employees: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Revenue Scale</label>
                                    <select 
                                        value={simConfig.revenue}
                                        onChange={(e) => setSimConfig({...simConfig, revenue: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="<$1M">Seed (&lt;$1M)</option>
                                        <option value="$1M - $10M">Growth ($1M - $10M)</option>
                                        <option value="$10M - $50M">Scale ($10M - $50M)</option>
                                        <option value="$50M+">Enterprise ($50M+)</option>
                                    </select>
                                </div>
                            </div>

                            <button 
                                onClick={loadScenario}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
                            >
                                <Play size={20} fill="currentColor" /> Initialize Simulation
                            </button>
                        </div>
                    </div>
                )}

                {step === 'loading' && (
                    <div className="flex flex-col items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mb-6"></div>
                        <h3 className="text-xl font-bold text-slate-800 animate-pulse">Constructing Scenario...</h3>
                        <p className="text-slate-500 mt-2 text-center">
                            Injecting {simConfig.department} protocols<br/>
                            Calibrating for {simConfig.industry} market dynamics...
                        </p>
                    </div>
                )}

                {step === 'scenario' && scenario && (
                    <div className="flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4">
                        {/* Scenario Dossier */}
                        <div className="flex-[2] space-y-6">
                            <div className="bg-white border-l-4 border-indigo-600 p-8 rounded-r-xl shadow-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-indigo-50 px-4 py-2 rounded-bl-xl text-xs font-bold text-indigo-700 uppercase tracking-wider border-b border-l border-indigo-100">
                                    Confidential Brief
                                </div>
                                <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4 text-sm uppercase tracking-wider">
                                    <Award size={16} /> Role: {scenario.role}
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-4 font-serif">{scenario.context}</h2>
                                
                                <div className="p-4 bg-red-50 border border-red-100 rounded-lg mb-4">
                                    <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2"><AlertTriangle size={18}/> The Crisis</h3>
                                    <p className="text-red-900/80 leading-relaxed">{scenario.problem}</p>
                                </div>
                                
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                    <ShieldAlert size={16} /> Stakes: <span className="text-slate-800">{scenario.stakes}</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Your Tactical Response</label>
                                    <textarea 
                                        className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none h-32 resize-none"
                                        placeholder="What specific action do you take?"
                                        value={solution}
                                        onChange={e => setSolution(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Strategic Rationale</label>
                                    <textarea 
                                        className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none"
                                        placeholder="Why is this the best course of action?"
                                        value={rationale}
                                        onChange={e => setRationale(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Panel */}
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                                <h3 className="font-bold text-lg mb-2">Instructions</h3>
                                <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                                    Act as the {scenario.role}. Consider the long-term impact on the {simConfig.department} department and the company's {simConfig.revenue} revenue goals.
                                </p>
                                <div className="flex flex-col gap-2 text-sm">
                                    <div className="flex items-center gap-2 text-indigo-300"><CheckCircle size={14}/> Be decisive</div>
                                    <div className="flex items-center gap-2 text-indigo-300"><CheckCircle size={14}/> Justify risks</div>
                                    <div className="flex items-center gap-2 text-indigo-300"><CheckCircle size={14}/> Consider culture</div>
                                </div>
                            </div>
                            
                            <div className="mt-auto">
                                <button 
                                    onClick={handleSubmit}
                                    disabled={!solution || !rationale || isLoading}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    {isLoading ? 'Analyzing...' : <><Send size={18} /> Execute Decision</>}
                                </button>
                                <button 
                                    onClick={() => setStep('setup')}
                                    className="w-full mt-3 py-3 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                                >
                                    Abort Mission
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'result' && feedback && (
                    <div className="animate-in zoom-in-95 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Score Card */}
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg text-center flex flex-col items-center justify-center relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-2 ${feedback.score >= 80 ? 'bg-emerald-500' : feedback.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Performance Index</div>
                                <div className="text-7xl font-black text-slate-900 mb-2 tracking-tighter">{feedback.score}</div>
                                <div className={`px-4 py-1 rounded-full text-sm font-bold ${feedback.score >= 80 ? 'bg-emerald-100 text-emerald-700' : feedback.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                    {feedback.score >= 80 ? 'Excellent' : feedback.score >= 60 ? 'Satisfactory' : 'Critical Failure'}
                                </div>
                            </div>

                            {/* Radar Chart */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                                <div className="w-full h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="Performance" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-8">
                            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText size={20} className="text-indigo-600"/> Mission Debrief</h3>
                            <p className="text-slate-600 leading-relaxed mb-6 text-lg">{feedback.critique}</p>
                            
                            {feedback.betterApproach && (
                                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-xl">
                                    <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><Target size={18}/> Optimized Strategy</h4>
                                    <p className="text-indigo-800/90">{feedback.betterApproach}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center gap-4">
                            <button onClick={() => { setStep('setup'); setSolution(''); setRationale(''); }} className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg">
                                <RefreshCw size={20} /> Run Another Simulation
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
