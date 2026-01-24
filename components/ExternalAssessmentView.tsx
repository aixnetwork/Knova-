
import React, { useState, useEffect } from 'react';
import { 
    ClipboardCheck, 
    Plus, 
    ArrowRight, 
    Users, 
    Calendar, 
    CheckCircle, 
    Clock, 
    BarChart3, 
    Brain, 
    AlertCircle,
    User,
    Loader2
} from 'lucide-react';
import { 
    Radar, 
    RadarChart, 
    PolarGrid, 
    PolarAngleAxis, 
    PolarRadiusAxis, 
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { ExternalAssessment, ExpertInsight, UserProfile } from '../types';
import { synthesizeAssessmentReport } from '../services/geminiService';

// --- MOCK DATA ---
const MOCK_ASSESSMENTS: ExternalAssessment[] = [];

interface ExternalAssessmentViewProps {
    user: UserProfile | null;
}

export const ExternalAssessmentView: React.FC<ExternalAssessmentViewProps> = ({ user }) => {
    const [assessments, setAssessments] = useState<ExternalAssessment[]>(MOCK_ASSESSMENTS);
    const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeAssessment = assessments.find(a => a.id === activeAssessmentId);

    const handleCreateAssessment = () => {
        const newAssessment: ExternalAssessment = {
            id: `aud-${Date.now()}`,
            title: 'New Strategic Review',
            companyName: user?.industry || 'My Company',
            status: 'OPEN',
            createdDate: new Date().toISOString().split('T')[0],
            deadline: new Date(Date.now() + 12096e5).toISOString().split('T')[0], // +2 weeks
            description: 'A new evaluation initiated by ' + user?.name,
            invitedExperts: 0,
            insights: []
        };
        setAssessments([newAssessment, ...assessments]);
        setActiveAssessmentId(newAssessment.id);
    };

    const handleSynthesize = async () => {
        if (!activeAssessment) return;
        setIsSynthesizing(true);
        setError(null);
        try {
            const report = await synthesizeAssessmentReport(activeAssessment);
            const updated = assessments.map(a => a.id === activeAssessment.id ? { ...a, aiSynthesis: report, status: 'COMPLETED' as const } : a);
            setAssessments(updated);
        } catch (e: any) {
            console.error(e);
            if (e.message?.includes('429') || e.message?.includes('quota') || e.message?.includes('Too Many Requests')) {
                setError("High traffic volume (Rate Limit). Please wait a moment and try again.");
            } else {
                setError("Failed to generate report. The AI service might be busy.");
            }
        } finally {
            setIsSynthesizing(false);
        }
    };

    // Calculate Radar Data
    const radarData = activeAssessment?.insights.length ? [
        { subject: 'Strategy', A: 0, fullMark: 100 },
        { subject: 'Execution', A: 0, fullMark: 100 },
        { subject: 'Technology', A: 0, fullMark: 100 },
        { subject: 'People', A: 0, fullMark: 100 },
        { subject: 'Risk Mgmt', A: 0, fullMark: 100 },
    ] : [];

    if (activeAssessment && radarData.length) {
        // Average the scores
        activeAssessment.insights.forEach(insight => {
            radarData[0].A += insight.metrics.strategy;
            radarData[1].A += insight.metrics.execution;
            radarData[2].A += insight.metrics.technology;
            radarData[3].A += insight.metrics.people;
            radarData[4].A += insight.metrics.risk;
        });
        radarData.forEach(d => d.A = Math.round(d.A / activeAssessment.insights.length));
    }

    // Render Logic
    if (activeAssessmentId && activeAssessment) {
        return (
            <div className="p-6 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto bg-slate-50 animate-in fade-in slide-in-from-right-8">
                <button onClick={() => setActiveAssessmentId(null)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 mb-6 transition-colors">
                    <ArrowRight size={18} className="rotate-180" /> Back to Dashboard
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details & Synthesis */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
                                        {activeAssessment.status.replace('_', ' ')}
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{activeAssessment.title}</h1>
                                    <p className="text-slate-600">{activeAssessment.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deadline</p>
                                    <p className="text-slate-700 font-medium flex items-center justify-end gap-2"><Calendar size={14}/> {activeAssessment.deadline}</p>
                                </div>
                            </div>

                            {activeAssessment.insights.length > 0 ? (
                                <div className="mt-8">
                                    {activeAssessment.aiSynthesis ? (
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Brain className="text-indigo-600" size={24}/>
                                                <h3 className="text-xl font-bold text-slate-900">Executive Synthesis</h3>
                                            </div>
                                            <div className="prose prose-slate prose-sm max-w-none">
                                                {activeAssessment.aiSynthesis.split('\n').map((line, i) => (
                                                    <p key={i}>{line}</p>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl text-center">
                                            <h3 className="font-bold text-indigo-900 text-lg mb-2">Ready for Synthesis</h3>
                                            <p className="text-indigo-700 mb-6 text-sm">We have collected {activeAssessment.insights.length} expert insights. Generate a consolidated strategic report now.</p>
                                            
                                            {error && (
                                                <div className="mb-4 bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2 justify-center">
                                                    <AlertCircle size={16} /> {error}
                                                </div>
                                            )}

                                            <button 
                                                onClick={handleSynthesize}
                                                disabled={isSynthesizing}
                                                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 mx-auto transition-all disabled:opacity-50"
                                            >
                                                {isSynthesizing ? <Loader2 className="animate-spin" /> : <Brain size={20} />}
                                                {isSynthesizing ? 'Analyzing...' : 'Synthesize Report with AI'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-8 bg-amber-50 border border-amber-100 p-6 rounded-xl flex items-start gap-4">
                                    <AlertCircle className="text-amber-600 shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-amber-900">Waiting for Experts</h4>
                                        <p className="text-sm text-amber-800">No insights submitted yet. Invites have been sent to {activeAssessment.invitedExperts} experts.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Individual Insights */}
                        <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                            <Users className="text-slate-500" /> Expert Inputs
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {activeAssessment.insights.map(insight => (
                                <div key={insight.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                                    <div className="flex flex-col items-center text-center md:w-48 shrink-0">
                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 mb-3 border-2 border-white shadow-md">
                                            <img src={insight.avatarUrl} alt={insight.expertName} className="w-full h-full object-cover" />
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-sm">{insight.expertName}</h4>
                                        <p className="text-xs text-slate-500 mb-3">{insight.expertRole}</p>
                                        <div className={`text-2xl font-black ${insight.score >= 80 ? 'text-emerald-500' : insight.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                            {insight.score}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Health Score</div>
                                    </div>
                                    <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                        <p className="text-slate-700 italic mb-4">"{insight.summary}"</p>
                                        <div className="space-y-2">
                                            {insight.recommendations.map((rec, i) => (
                                                <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                    <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                                    {rec}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Visual Analytics */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <BarChart3 className="text-indigo-600" /> Consensus Radar
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid gridType="circle" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name="Average Expert Score"
                                            dataKey="A"
                                            stroke="#6366f1"
                                            fill="#6366f1"
                                            fillOpacity={0.4}
                                        />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-xs text-slate-500 text-center mt-2">Aggregated score across 5 key dimensions.</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4">Expert Roster</h3>
                            <div className="space-y-3">
                                {Array.from({length: activeAssessment.invitedExperts}).map((_, i) => {
                                    const insight = activeAssessment.insights[i];
                                    return (
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${insight ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-700">{insight ? insight.expertName : `Expert ${i+1}`}</div>
                                                    <div className="text-xs text-slate-400">{insight ? 'Submitted' : 'Pending...'}</div>
                                                </div>
                                            </div>
                                            {insight && <CheckCircle size={16} className="text-emerald-500" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Dashboard View
    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto bg-slate-50">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <ClipboardCheck className="text-indigo-600" /> External Assessments
                    </h1>
                    <p className="text-slate-500 mt-2">Manage expert audits, strategic reviews, and compliance checks.</p>
                </div>
                <button 
                    onClick={handleCreateAssessment}
                    className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                    <Plus size={18} /> New Assessment
                </button>
            </div>

            {assessments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.map(assessment => (
                        <div 
                            key={assessment.id}
                            onClick={() => setActiveAssessmentId(assessment.id)}
                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer group flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    assessment.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                    assessment.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                    {assessment.status.replace('_', ' ')}
                                </div>
                                <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-indigo-700 transition-colors">{assessment.title}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">{assessment.description}</p>
                            
                            <div className="border-t border-slate-100 pt-4 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                                        <Users size={16} /> {assessment.insights.length} / {assessment.invitedExperts} Experts
                                    </div>
                                    {assessment.insights.length > 0 && (
                                        <div className="flex -space-x-2">
                                            {assessment.insights.slice(0,3).map(i => (
                                                <img key={i.id} src={i.avatarUrl} className="w-6 h-6 rounded-full border-2 border-white" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-400">
                                    <span className="flex items-center gap-1"><Clock size={12}/> Due {assessment.deadline}</span>
                                    {assessment.aiSynthesis && <span className="text-emerald-600 font-bold flex items-center gap-1"><Brain size={12}/> AI Synthesized</span>}
                                </div>
                            </div>
                            
                            {/* Progress Bar for In Progress */}
                            {assessment.status === 'IN_PROGRESS' && (
                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(assessment.insights.length / assessment.invitedExperts) * 100}%` }}></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <ClipboardCheck size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-medium text-lg text-slate-600">No Assessments Created</p>
                    <p className="text-sm">Start a new external audit or review.</p>
                </div>
            )}
        </div>
    );
};
