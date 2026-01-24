
import React, { useState } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip 
} from 'recharts';
import { Target, ArrowRight, Zap, BookOpen, Search, Briefcase, TrendingUp } from 'lucide-react';
import { UserProfile } from '../types';

interface PathfinderViewProps {
    user: UserProfile | null;
    onClose: () => void;
}

export const PathfinderView: React.FC<PathfinderViewProps> = ({ user, onClose }) => {
    const [targetRole, setTargetRole] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisComplete, setAnalysisComplete] = useState(false);

    // Mock Data for Gap Analysis
    const [skillData, setSkillData] = useState([
        { subject: 'Strategic Thinking', A: 60, B: 90, fullMark: 100 },
        { subject: 'Data Fluency', A: 40, B: 85, fullMark: 100 },
        { subject: 'Leadership', A: 70, B: 80, fullMark: 100 },
        { subject: 'Technical Ops', A: 85, B: 60, fullMark: 100 },
        { subject: 'Communication', A: 65, B: 95, fullMark: 100 },
        { subject: 'Project Mgmt', A: 90, B: 70, fullMark: 100 },
    ]);

    const handleAnalyze = () => {
        if (!targetRole) return;
        setIsAnalyzing(true);
        // Simulate AI Analysis
        setTimeout(() => {
            setIsAnalyzing(false);
            setAnalysisComplete(true);
            // Randomize slightly for "AI effect"
            setSkillData(skillData.map(s => ({
                ...s,
                B: Math.floor(Math.random() * 30) + 70 // High requirements
            })));
        }, 2000);
    };

    return (
        <div className="bg-slate-50 min-h-full p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Target className="text-rose-600" />
                            AI Career Pathfinder
                        </h1>
                        <p className="text-slate-500 mt-2">Visualize your skill gaps and generate a bridge to your dream role.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 font-bold text-sm">Exit Pathfinder</button>
                </div>

                {!analysisComplete ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xl max-w-3xl mx-auto mt-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500"></div>
                        
                        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                            <Briefcase size={40} />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Where do you want to be in 2 years?</h2>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">Enter a target job title. Our AI will analyze your current activity and compare it against industry benchmarks.</p>
                        
                        <div className="relative max-w-md mx-auto">
                            <input 
                                type="text"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                placeholder="e.g. Chief Product Officer"
                                className="w-full p-4 pl-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-lg shadow-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <button 
                                onClick={handleAnalyze}
                                disabled={!targetRole || isAnalyzing}
                                className="absolute right-2 top-2 bottom-2 bg-slate-900 text-white px-6 rounded-lg font-bold hover:bg-slate-800 transition-colors disabled:opacity-70"
                            >
                                {isAnalyzing ? 'Analyzing...' : 'Map Gap'}
                            </button>
                        </div>
                        
                        <div className="mt-8 flex justify-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><TrendingUp size={12}/> Market Data Live</span>
                            <span className="flex items-center gap-1"><Zap size={12}/> AI Personalized</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8">
                        {/* Analysis Dashboard */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Chart Card */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Target size={18} className="text-rose-500"/> Gap Analysis: {targetRole}
                                </h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                                            <PolarGrid gridType="circle" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                            <Radar
                                                name="Current"
                                                dataKey="A"
                                                stroke="#6366f1"
                                                fill="#6366f1"
                                                fillOpacity={0.3}
                                            />
                                            <Radar
                                                name="Required"
                                                dataKey="B"
                                                stroke="#f43f5e"
                                                fill="#f43f5e"
                                                fillOpacity={0.1}
                                            />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-6 mt-4 text-xs font-bold">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500/30 border border-indigo-500 rounded-full"></div> You</div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500/10 border border-rose-500 rounded-full"></div> {targetRole}</div>
                                </div>
                            </div>

                            {/* Recommendations Card */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Zap size={18} className="text-amber-500"/> Recommended Bridge Curriculum
                                </h3>
                                <div className="space-y-4 flex-1">
                                    <div className="p-4 border border-indigo-100 bg-indigo-50/50 rounded-xl flex items-start gap-4 cursor-pointer hover:bg-indigo-50 transition-colors">
                                        <div className="bg-white p-2 rounded-lg shadow-sm text-indigo-600"><BookOpen size={24} /></div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">Strategic Communication for Execs</h4>
                                            <p className="text-xs text-slate-500 mt-1 mb-2">Closes "Communication" gap (+30%)</p>
                                            <span className="text-[10px] font-bold bg-white px-2 py-1 rounded border border-indigo-100 text-indigo-600 uppercase tracking-wide">High Priority</span>
                                        </div>
                                    </div>
                                    <div className="p-4 border border-slate-200 rounded-xl flex items-start gap-4 cursor-pointer hover:bg-slate-50 transition-colors">
                                        <div className="bg-white p-2 rounded-lg shadow-sm text-rose-500"><BookOpen size={24} /></div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">Data Driven Decision Making</h4>
                                            <p className="text-xs text-slate-500 mt-1 mb-2">Closes "Data Fluency" gap (+45%)</p>
                                            <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase tracking-wide">Recommended</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full mt-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2">
                                    Enroll in Bridge Path <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
