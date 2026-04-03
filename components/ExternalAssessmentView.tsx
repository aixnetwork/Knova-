
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
    Loader2,
    X,
} from 'lucide-react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { ExternalAssessment, UserProfile } from '../types';
import { synthesizeAssessmentReport } from '../services/geminiService';
import { assessmentsApi, mapAssessmentResToExternal } from '../services/api';

interface ExternalAssessmentViewProps {
    user: UserProfile | null;
    /** When opening from URL e.g. /assessments/:id */
    initialAssessmentId?: string | null;
}

export const ExternalAssessmentView: React.FC<ExternalAssessmentViewProps> = ({ user, initialAssessmentId }) => {
    const [assessments, setAssessments] = useState<ExternalAssessment[]>([]);
    const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(initialAssessmentId ?? null);
    const [loading, setLoading] = useState(true);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAddInsight, setShowAddInsight] = useState(false);
    const [insightForm, setInsightForm] = useState({
        summary: '',
        recommendations: '',
        strategyScore: 70,
        executionScore: 70,
        technologyScore: 70,
        peopleScore: 70,
        riskScore: 70,
    });
    const [addingInsight, setAddingInsight] = useState(false);

    const activeAssessment = assessments.find((a) => a.id === activeAssessmentId);

    const loadAssessments = () => {
        setError(null);
        assessmentsApi
            .list()
            .then((res) => {
                const list = Array.isArray(res?.data) ? res.data : [];
                setAssessments(list.map((a) => mapAssessmentResToExternal(a as import('../services/api').AssessmentRes)));
            })
            .catch((e) => setError(e?.message || 'Failed to load assessments'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadAssessments();
    }, []);

    useEffect(() => {
        if (initialAssessmentId && assessments.some((a) => a.id === initialAssessmentId)) {
            setActiveAssessmentId(initialAssessmentId);
        }
    }, [initialAssessmentId, assessments]);

    const refreshActiveAssessment = () => {
        if (!activeAssessmentId) return;
        assessmentsApi
            .getById(activeAssessmentId)
            .then((res) => {
                const data = res?.data as import('../services/api').AssessmentRes | undefined;
                if (data) {
                    setAssessments((prev) =>
                        prev.map((a) => (a.id === activeAssessmentId ? mapAssessmentResToExternal(data) : a))
                    );
                }
            })
            .catch(() => {});
    };

    const handleCreateAssessment = () => {
        setError(null);
        const title = 'New Strategic Review';
        const companyName = user?.industry || 'My Company';
        const deadline = new Date(Date.now() + 12096e5).toISOString().split('T')[0];
        const description = 'A new evaluation initiated by ' + (user?.name || 'Admin');
        assessmentsApi
            .create({ title, companyName, status: 'OPEN', deadline, description })
            .then((res) => {
                const data = res?.data as import('../services/api').AssessmentRes | undefined;
                if (data) {
                    const mapped = mapAssessmentResToExternal(data);
                    setAssessments((prev) => [mapped, ...prev]);
                    setActiveAssessmentId(mapped.id);
                }
            })
            .catch((e) => setError(e?.message || 'Failed to create assessment'));
    };

    const handleSynthesize = async () => {
        if (!activeAssessment) return;
        setIsSynthesizing(true);
        setError(null);
        try {
            const report = await synthesizeAssessmentReport(activeAssessment);
            await assessmentsApi.update(activeAssessment.id, { status: 'COMPLETED', aiSynthesis: report });
            const updated = assessments.map((a) => (a.id === activeAssessment.id ? { ...a, aiSynthesis: report, status: 'COMPLETED' as const } : a));
            setAssessments(updated);
        } catch (e: unknown) {
            console.error(e);
            const msg = e instanceof Error ? e.message : '';
            if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
                setError('High traffic volume (Rate Limit). Please wait a moment and try again.');
            } else {
                setError('Failed to generate report. The AI service might be busy.');
            }
        } finally {
            setIsSynthesizing(false);
        }
    };

    const handleAddInsight = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeAssessmentId || !user) return;
        const recs = insightForm.recommendations.trim().split('\n').filter(Boolean);
        setAddingInsight(true);
        setError(null);
        assessmentsApi
            .addInsight(activeAssessmentId, {
                summary: insightForm.summary.trim() || 'No summary provided.',
                recommendations: recs.length ? recs : ['Follow up with team.'],
                strategyScore: Math.min(100, Math.max(0, insightForm.strategyScore)),
                executionScore: Math.min(100, Math.max(0, insightForm.executionScore)),
                technologyScore: Math.min(100, Math.max(0, insightForm.technologyScore)),
                peopleScore: Math.min(100, Math.max(0, insightForm.peopleScore)),
                riskScore: Math.min(100, Math.max(0, insightForm.riskScore)),
            })
            .then(() => {
                setShowAddInsight(false);
                setInsightForm({ summary: '', recommendations: '', strategyScore: 70, executionScore: 70, technologyScore: 70, peopleScore: 70, riskScore: 70 });
                refreshActiveAssessment();
            })
            .catch((e) => setError(e?.message || 'Failed to add insight'))
            .finally(() => setAddingInsight(false));
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
                <button type="button" onClick={() => setActiveAssessmentId(null)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 mb-6 transition-colors">
                    <ArrowRight size={18} className="rotate-180" /> Back to Dashboard
                </button>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-2">
                        <AlertCircle size={20} /> {error}
                    </div>
                )}

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
                                <div className="mt-8 bg-amber-50 border border-amber-100 p-6 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4">
                                    <AlertCircle className="text-amber-600 shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-amber-900">No expert insights yet</h4>
                                        <p className="text-sm text-amber-800">Add an expert insight to get started. You can then run AI synthesis.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddInsight(true)}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 shrink-0"
                                    >
                                        <Plus size={16} className="inline mr-1" /> Add insight
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Individual Insights */}
                        <div className="flex justify-between items-center flex-wrap gap-2">
                            <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                                <Users className="text-slate-500" /> Expert Inputs
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowAddInsight(true)}
                                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                                <Plus size={18} /> Add insight
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {activeAssessment.insights.map(insight => (
                                <div key={insight.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                                    <div className="flex flex-col items-center text-center md:w-48 shrink-0">
                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 mb-3 border-2 border-white shadow-md flex items-center justify-center text-xl font-bold text-slate-500">
                                            {insight.avatarUrl ? <img src={insight.avatarUrl} alt={insight.expertName} className="w-full h-full object-cover" /> : (insight.expertName?.charAt(0)?.toUpperCase() ?? '?')}
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
                                {activeAssessment.insights.length === 0 ? (
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-500">No insights yet. Add one above.</div>
                                ) : (
                                    activeAssessment.insights.map((insight, i) => (
                                        <div key={insight.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <div>
                                                    <div className="text-sm font-bold text-slate-700">{insight.expertName}</div>
                                                    <div className="text-xs text-slate-400">Submitted</div>
                                                </div>
                                            </div>
                                            <CheckCircle size={16} className="text-emerald-500" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Insight modal */}
                {showAddInsight && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => !addingInsight && setShowAddInsight(false)}>
                        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900">Add expert insight</h3>
                                <button type="button" onClick={() => !addingInsight && setShowAddInsight(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleAddInsight} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Summary</label>
                                    <textarea value={insightForm.summary} onChange={(e) => setInsightForm((f) => ({ ...f, summary: e.target.value }))} className="w-full border border-slate-200 rounded-lg p-3 text-sm" rows={3} placeholder="Brief summary of your assessment..." required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Recommendations (one per line)</label>
                                    <textarea value={insightForm.recommendations} onChange={(e) => setInsightForm((f) => ({ ...f, recommendations: e.target.value }))} className="w-full border border-slate-200 rounded-lg p-3 text-sm" rows={3} placeholder="Recommendation 1&#10;Recommendation 2" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    {(['strategyScore', 'executionScore', 'technologyScore', 'peopleScore', 'riskScore'] as const).map((key) => (
                                        <div key={key}>
                                            <label className="block text-xs font-bold text-slate-600 mb-1">{key.replace('Score', '')}</label>
                                            <input type="number" min={0} max={100} value={insightForm[key]} onChange={(e) => setInsightForm((f) => ({ ...f, [key]: parseInt(e.target.value, 10) || 0 }))} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="submit" disabled={addingInsight} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                                        {addingInsight ? <Loader2 size={16} className="animate-spin" /> : null} {addingInsight ? 'Adding...' : 'Add insight'}
                                    </button>
                                    <button type="button" onClick={() => !addingInsight && setShowAddInsight(false)} className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Dashboard View
    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto bg-slate-50">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <ClipboardCheck className="text-indigo-600" /> External Assessments
                    </h1>
                    <p className="text-slate-500 mt-2">Manage expert audits, strategic reviews, and compliance checks.</p>
                </div>
                <button
                    type="button"
                    onClick={handleCreateAssessment}
                    className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                    <Plus size={18} /> New Assessment
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-2">
                    <AlertCircle size={20} /> {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20 gap-2 text-slate-500">
                    <Loader2 size={24} className="animate-spin" /> Loading assessments…
                </div>
            ) : assessments.length > 0 ? (
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
                                        <Users size={16} /> {assessment.insights.length} insight{assessment.insights.length !== 1 ? 's' : ''}
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
                            
                            {/* Progress when we have insights */}
                            {assessment.insights.length > 0 && (
                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, assessment.insights.length * 25)}%` }}></div>
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
