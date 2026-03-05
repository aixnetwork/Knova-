
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { TrendingUp, DollarSign, Users, Target, Map as MapIcon, AlertTriangle, Sparkles, Loader2, User, ChevronRight, Calendar, ClipboardList, X } from 'lucide-react';
import { generateBiceData } from '../services/geminiService';

interface Employee {
    id: string;
    name: string;
    role: string;
    type: 'Employee' | 'Consultant';
    department: string;
    scores: Record<string, number>; // map skill -> score
    actionPlan: string;
    targetDate: string;
    status: 'Pending' | 'In Progress' | 'Completed';
}

export const ImpactDashboard: React.FC = () => {
    // State for Dynamic Generation
    const [industry, setIndustry] = useState('');
    const [strategy, setStrategy] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [showRosterModal, setShowRosterModal] = useState(false);
    
    // Default Mock Data Structures
    const [data, setData] = useState<{
        departments: string[],
        skills: string[],
        employees: Employee[],
        criticalAction?: string
    }>({
        departments: ['Sales', 'Engineering', 'HR', 'Marketing'],
        skills: ['AI Fluency', 'Data Analytics', 'Leadership', 'Compliance'],
        employees: [
            { id: 'e1', name: 'John Doe', role: 'Sales Lead', type: 'Employee', department: 'Sales', scores: { 'AI Fluency': 85, 'Data Analytics': 40, 'Leadership': 70, 'Compliance': 90 }, actionPlan: "Complete 'Data Analytics for Sales' module", targetDate: "2024-11-15", status: "In Progress" },
            { id: 'e2', name: 'Jane Smith', role: 'Dev Consultant', type: 'Consultant', department: 'Engineering', scores: { 'AI Fluency': 95, 'Data Analytics': 90, 'Leadership': 60, 'Compliance': 50 }, actionPlan: "Review GDPR compliance protocols", targetDate: "2024-10-30", status: "Pending" },
            { id: 'e3', name: 'Bob Wilson', role: 'Recruiter', type: 'Employee', department: 'HR', scores: { 'AI Fluency': 30, 'Data Analytics': 20, 'Leadership': 80, 'Compliance': 95 }, actionPlan: "Enroll in AI Fundamentals cohort", targetDate: "2024-12-01", status: "Pending" },
            { id: 'e4', name: 'Alice Wong', role: 'Growth Hacker', type: 'Employee', department: 'Marketing', scores: { 'AI Fluency': 75, 'Data Analytics': 80, 'Leadership': 65, 'Compliance': 60 }, actionPlan: "Attend Leadership workshop", targetDate: "2024-11-20", status: "Completed" },
        ],
        criticalAction: 'HR Department is critically low on "Data Analytics" and "AI Fluency". Upskilling recommended.'
    });

    const [selectedCell, setSelectedCell] = useState<{ dept: string, skill: string } | null>(null);

    const roiData = [
        { month: 'Jan', trainingCost: 1200, efficiencyGain: 2400 },
        { month: 'Feb', trainingCost: 1500, efficiencyGain: 3100 },
        { month: 'Mar', trainingCost: 1100, efficiencyGain: 4200 },
        { month: 'Apr', trainingCost: 1800, efficiencyGain: 5600 },
        { month: 'May', trainingCost: 1400, efficiencyGain: 6800 },
        { month: 'Jun', trainingCost: 1300, efficiencyGain: 7200 },
    ];

    const getHeatmapColor = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-emerald-300';
        if (score >= 40) return 'bg-amber-300';
        if (score >= 20) return 'bg-orange-400';
        return 'bg-red-500';
    };

    const handleGenerateReport = async () => {
        if (!industry?.trim() || !strategy?.trim()) return;
        setGenerateError(null);
        setIsGenerating(true);
        setSelectedCell(null);
        try {
            const result = await generateBiceData(industry.trim(), strategy.trim());
            if (result && Array.isArray(result.departments) && Array.isArray(result.skills) && Array.isArray(result.employees) && result.employees.length > 0 && result.departments.length > 0 && result.skills.length > 0) {
                setData({
                    departments: result.departments,
                    skills: result.skills,
                    employees: result.employees,
                    criticalAction: result.criticalAction,
                });
            } else {
                setGenerateError("Could not generate report. The response was invalid. Please try again.");
            }
        } catch (e) {
            console.error("Failed to generate BICE report", e);
            const msg = e instanceof Error ? e.message : "Could not generate report. Check your API key (Settings) and try again.";
            setGenerateError(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    // Calculate aggregated scores for the heatmap
    const calculateMatrix = () => {
        const matrix: Record<string, Record<string, { total: number, count: number }>> = {};
        
        // Initialize
        data.departments.forEach(dept => {
            matrix[dept] = {};
            data.skills.forEach(skill => {
                matrix[dept][skill] = { total: 0, count: 0 };
            });
        });

        // Sum up
        data.employees.forEach(emp => {
            if (matrix[emp.department]) {
                Object.entries(emp.scores).forEach(([skill, score]) => {
                    if (matrix[emp.department][skill]) {
                        matrix[emp.department][skill].total += (score as number);
                        matrix[emp.department][skill].count += 1;
                    }
                });
            }
        });

        // Average
        const finalScores: Record<string, Record<string, number>> = {};
        Object.keys(matrix).forEach(dept => {
            finalScores[dept] = {};
            Object.keys(matrix[dept]).forEach(skill => {
                const { total, count } = matrix[dept][skill];
                finalScores[dept][skill] = count > 0 ? Math.round(total / count) : 0;
            });
        });

        return finalScores;
    };

    const matrixScores = calculateMatrix();

    // Filter employees for detail view
    const filteredEmployees = selectedCell 
        ? data.employees.filter(e => e.department === selectedCell.dept)
                        .sort((a, b) => (a.scores[selectedCell.skill] || 0) - (b.scores[selectedCell.skill] || 0)) // Sort by score ascending (show low performers first)
        : [];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in relative">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <TrendingUp className="text-emerald-600" />
                    Business Impact Correlation Engine (BICE)
                </h1>
                <p className="text-slate-500 mt-2">Connecting individual learning mastery directly to business KPIs.</p>
            </div>

            {/* Generator Controls */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl shadow-xl text-white">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Industry</label>
                        <input 
                            type="text" 
                            value={industry}
                            onChange={(e) => { setIndustry(e.target.value); setGenerateError(null); }}
                            placeholder="e.g. Fintech, Healthcare, Manufacturing" 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-500"
                        />
                    </div>
                    <div className="flex-[2] w-full">
                        <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Strategic Goal</label>
                        <input 
                            type="text" 
                            value={strategy}
                            onChange={(e) => { setStrategy(e.target.value); setGenerateError(null); }}
                            placeholder="e.g. Accelerate AI Adoption, Improve Cybersecurity Posture" 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-500"
                        />
                    </div>
                    <button 
                        type="button"
                        onClick={handleGenerateReport}
                        disabled={isGenerating || !industry.trim() || !strategy.trim()}
                        className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-400 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/50 h-[50px]"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                        {isGenerating ? 'Analyzing...' : 'Simulate Impact'}
                    </button>
                </div>
                {generateError && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-100 px-4 py-3 text-sm">
                        <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                        <span>{generateError}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Skill Gap Heatmap Section */}
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl border-2 border-indigo-100 shadow-lg relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <MapIcon className="text-indigo-600" /> Organizational Heatmap
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 hidden sm:flex">
                            <span className="w-3 h-3 bg-red-500 rounded-sm"></span> Critical
                            <span className="w-3 h-3 bg-amber-300 rounded-sm"></span> Avg
                            <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Strong
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto relative z-10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="p-2 text-left text-slate-400 font-medium">Dept / Skill</th>
                                    {data.skills.map(skill => (
                                        <th key={skill} className="p-2 text-center text-slate-700 font-bold rotate-0 min-w-[80px] text-xs uppercase tracking-tight">{skill}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.departments.map((dept) => (
                                    <tr key={dept}>
                                        <td className="p-3 font-bold text-slate-900 border-b border-slate-100">{dept}</td>
                                        {data.skills.map((skill) => {
                                            const score = matrixScores[dept]?.[skill] || 0;
                                            const isSelected = selectedCell?.dept === dept && selectedCell?.skill === skill;
                                            return (
                                                <td key={skill} className="p-1 border-b border-slate-100">
                                                    <div className="relative group cursor-pointer" onClick={() => setSelectedCell({ dept, skill })}>
                                                        <div 
                                                            className={`h-12 w-full rounded-md ${getHeatmapColor(score)} transition-all hover:opacity-80 shadow-sm flex items-center justify-center ${isSelected ? 'ring-4 ring-indigo-500 z-10 scale-105' : ''}`}
                                                        >
                                                            <span className="text-white/90 font-bold text-xs">{score}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {data.criticalAction && (
                        <div className="mt-4 bg-red-50 border border-red-100 p-4 rounded-lg flex gap-3 text-red-800 text-sm items-start relative z-10 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle className="shrink-0 mt-0.5" size={16}/>
                            <div>
                                <strong>AI Recommendation:</strong> {data.criticalAction}
                            </div>
                        </div>
                    )}
                </div>

                {/* Drill Down Panel */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Users size={18} className="text-indigo-600"/> 
                        {selectedCell ? `${selectedCell.dept}: ${selectedCell.skill}` : "Source Intelligence"}
                    </h3>
                    
                    {!selectedCell ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-4 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50">
                            <MapIcon size={32} className="mb-2 opacity-50"/>
                            <p className="text-sm">Click a cell in the heatmap to see individual contributor scores and action plans.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {filteredEmployees.length > 0 ? filteredEmployees.map(emp => (
                                <div key={emp.id} className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-slate-900 text-sm">{emp.name}</div>
                                        <div className={`text-xs font-bold px-2 py-0.5 rounded ${emp.scores[selectedCell.skill] < 60 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {emp.scores[selectedCell.skill]}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                                        <span>{emp.role}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase border ${emp.type === 'Consultant' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                            {emp.type}
                                        </span>
                                    </div>
                                    
                                    {/* Action Plan Section */}
                                    <div className="bg-slate-50 p-2 rounded text-xs border border-slate-200 mt-2">
                                        <div className="flex items-start gap-2 mb-1">
                                            <ClipboardList size={12} className="text-indigo-500 mt-0.5 shrink-0"/>
                                            <span className="font-medium text-slate-700">{emp.actionPlan || 'No plan assigned'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-slate-200">
                                            <div className="flex items-center gap-1 text-slate-500">
                                                <Calendar size={10} /> Due: {emp.targetDate || 'TBD'}
                                            </div>
                                            <span className={`px-1.5 py-0.5 rounded font-bold ${
                                                emp.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                                                emp.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 
                                                'bg-slate-200 text-slate-600'
                                            }`}>
                                                {emp.status || 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-slate-400 text-sm py-4">No data for this segment.</p>
                            )}
                        </div>
                    )}
                    {selectedCell && (
                        <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                            <button 
                                onClick={() => setShowRosterModal(true)}
                                className="text-indigo-600 text-xs font-bold hover:underline flex items-center justify-center gap-1 w-full py-2 hover:bg-indigo-50 rounded transition-colors"
                            >
                                View Full Roster <ChevronRight size={12}/>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={20} /></div>
                        <h3 className="font-semibold text-slate-700">Projected ROI</h3>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">342%</p>
                    <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                        <TrendingUp size={14} /> +12% from last month
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Target size={20} /></div>
                        <h3 className="font-semibold text-slate-700">Skill-to-KPI Match</h3>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">High</p>
                    <p className="text-sm text-slate-500 mt-1">
                        Correlation: 0.89
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users size={20} /></div>
                        <h3 className="font-semibold text-slate-700">Workforce Readiness</h3>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">78%</p>
                    <p className="text-sm text-slate-500 mt-1">
                        Up from 65% in Q1
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Investment vs. Operational Gain</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={roiData}>
                                <defs>
                                    <linearGradient id="colorGain" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="efficiencyGain" stroke="#10b981" fillOpacity={1} fill="url(#colorGain)" name="Efficiency Value ($)" />
                                <Area type="monotone" dataKey="trainingCost" stroke="#f43f5e" fillOpacity={1} fill="url(#colorCost)" name="Training Cost ($)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Roster Modal */}
            {showRosterModal && selectedCell && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{selectedCell.dept} Department Roster</h2>
                                <p className="text-sm text-slate-500">Focus Skill: <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{selectedCell.skill}</span></p>
                            </div>
                            <button onClick={() => setShowRosterModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto p-0">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0 uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="p-4">Employee</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4 text-center">Score</th>
                                        <th className="p-4">Action Plan</th>
                                        <th className="p-4">Target Date</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredEmployees.map(emp => (
                                        <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900">{emp.name}</div>
                                                <div className="text-xs text-slate-400">{emp.id}</div>
                                            </td>
                                            <td className="p-4 text-slate-600">
                                                {emp.role}
                                                <span className={`block text-[10px] font-bold uppercase mt-1 ${emp.type === 'Consultant' ? 'text-purple-600' : 'text-blue-600'}`}>{emp.type}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block w-8 h-8 leading-8 text-center rounded-full font-bold text-xs ${emp.scores[selectedCell.skill] < 60 ? 'bg-red-100 text-red-700' : emp.scores[selectedCell.skill] < 80 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {emp.scores[selectedCell.skill]}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-start gap-2 max-w-xs">
                                                    <ClipboardList size={14} className="text-indigo-500 mt-0.5 shrink-0"/>
                                                    <span className="text-slate-700 leading-snug">{emp.actionPlan}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-500 whitespace-nowrap font-mono text-xs">
                                                {emp.targetDate}
                                            </td>
                                            <td className="p-4">
                                                 <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                                    emp.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                    emp.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                    {emp.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setShowRosterModal(false)} className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-100 transition-colors shadow-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
