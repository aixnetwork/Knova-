
import React, { useState } from 'react';
import { 
  Users, Calendar, TrendingUp, BarChart2, CheckCircle, 
  AlertTriangle, ArrowRight, Plus, Search, Filter, 
  MoreHorizontal, FileText, Activity, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

// --- Mock Data ---

const COHORT_LIST = [
    { id: 'c1', name: 'Q4 Leadership Track', status: 'Active', members: 24, progress: 65, startDate: 'Oct 1, 2024', endDate: 'Dec 15, 2024', atRisk: 2 },
    { id: 'c2', name: 'Data Science Bootcamp Alpha', status: 'Active', members: 15, progress: 42, startDate: 'Oct 15, 2024', endDate: 'Jan 30, 2025', atRisk: 0 },
    { id: 'c3', name: 'Executive Onboarding', status: 'Completed', members: 8, progress: 100, startDate: 'Sep 1, 2024', endDate: 'Sep 30, 2024', atRisk: 0 },
    { id: 'c4', name: 'Sales Enablement Sprinters', status: 'Draft', members: 0, progress: 0, startDate: 'Nov 1, 2024', endDate: '-', atRisk: 0 },
];

const ENGAGEMENT_DATA = [
    { week: 'W1', activeUsers: 85, completions: 12 },
    { week: 'W2', activeUsers: 88, completions: 24 },
    { week: 'W3', activeUsers: 92, completions: 45 },
    { week: 'W4', activeUsers: 82, completions: 38 }, // Dip
    { week: 'W5', activeUsers: 95, completions: 60 },
    { week: 'W6', activeUsers: 98, completions: 85 },
];

const SKILL_GROWTH_DATA = [
    { skill: 'Strategy', pre: 30, post: 75 },
    { skill: 'Analysis', pre: 45, post: 82 },
    { skill: 'Communication', pre: 50, post: 70 },
    { skill: 'Leadership', pre: 25, post: 65 },
    { skill: 'Tech Fluency', pre: 20, post: 85 },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'];

export const CohortProgramView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'COHORTS' | 'ANALYTICS'>('OVERVIEW');
    const [searchTerm, setSearchTerm] = useState('');

    const renderOverview = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Learners</p>
                            <h3 className="text-3xl font-bold text-slate-900">47</h3>
                        </div>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Users size={20} /></div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <TrendingUp size={14} /> +12% this week
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg. Completion</p>
                            <h3 className="text-3xl font-bold text-slate-900">68%</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle size={20} /></div>
                    </div>
                    <p className="text-xs text-slate-400">Across active cohorts</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Engagement Score</p>
                            <h3 className="text-3xl font-bold text-slate-900">8.4</h3>
                        </div>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Activity size={20} /></div>
                    </div>
                    <p className="text-xs text-slate-400">Daily active time: 42m</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">At Risk</p>
                            <h3 className="text-3xl font-bold text-slate-900">2</h3>
                        </div>
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle size={20} /></div>
                    </div>
                    <button className="text-xs font-bold text-rose-600 hover:underline">View Learners</button>
                </div>
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6">Engagement Velocity</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={ENGAGEMENT_DATA}>
                                <defs>
                                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="activeUsers" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" name="Active Learners %" />
                                <Line type="monotone" dataKey="completions" stroke="#10b981" strokeWidth={3} dot={{r:4, fill:'#10b981'}} name="Module Completions" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6">Skill Gap Closure</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={SKILL_GROWTH_DATA} layout="vertical" barGap={2}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="skill" type="category" width={100} tick={{fontSize: 11, fill: '#475569', fontWeight: 600}} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                                <Bar dataKey="pre" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={12} name="Baseline" />
                                <Bar dataKey="post" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={12} name="Current Mastery" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCohorts = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search cohorts..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 font-medium text-slate-700">
                        <Filter size={18} /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100">
                        <Plus size={18} /> New Cohort
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Cohort Name</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Progress</th>
                                <th className="px-6 py-4">Members</th>
                                <th className="px-6 py-4">Timeline</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {COHORT_LIST.map((cohort) => (
                                <tr key={cohort.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{cohort.name}</div>
                                        <div className="text-xs text-slate-500">ID: {cohort.id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                            cohort.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            cohort.status === 'Completed' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                            'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {cohort.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 min-w-[140px]">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${cohort.progress}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">{cohort.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Users size={16} className="text-slate-400" />
                                            {cohort.members}
                                            {cohort.atRisk > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                                                    <AlertTriangle size={10} /> {cohort.atRisk} Risk
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <div className="flex flex-col text-xs">
                                            <span className="text-slate-900 font-medium">{cohort.startDate}</span>
                                            <span className="text-slate-400">to {cohort.endDate}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderAnalytics = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">Deep Intelligence Report</h3>
                    <p className="text-slate-300 max-w-2xl mb-6">AI-driven analysis of cohort interactions, quiz performance, and sentiment analysis from discussion boards.</p>
                    <button className="bg-white text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-indigo-50 transition-colors inline-flex items-center gap-2">
                        <FileText size={18} /> Download PDF Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-6">Time Allocation (Avg Learner)</h4>
                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Modules', value: 45 },
                                        { name: 'Simulations', value: 25 },
                                        { name: 'AI Tutor', value: 20 },
                                        { name: 'Quizzes', value: 10 },
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {ENGAGEMENT_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-6">Peak Activity Hours</h4>
                    <div className="h-64 flex flex-col justify-center items-center text-slate-400">
                        <div className="w-full h-full flex items-end justify-between px-4 gap-2">
                            {[10, 25, 40, 90, 60, 30, 15, 10, 5, 20, 45, 80, 50, 20].map((h, i) => (
                                <div key={i} className="flex-1 bg-indigo-100 rounded-t hover:bg-indigo-500 transition-colors relative group" style={{ height: `${h}%` }}>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-800 text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                        {h} Users
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="w-full flex justify-between text-[10px] text-slate-400 mt-2 px-2 uppercase tracking-wider font-bold">
                            <span>6 AM</span>
                            <span>12 PM</span>
                            <span>6 PM</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Users className="text-indigo-600" />
                        Cohort Program
                    </h1>
                    <p className="text-slate-500 mt-1">Manage learning tracks, monitor progress, and analyze outcomes.</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-slate-200">
                <div className="flex gap-6">
                    <button 
                        onClick={() => setActiveTab('OVERVIEW')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'OVERVIEW' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('COHORTS')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'COHORTS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Active Cohorts
                    </button>
                    <button 
                        onClick={() => setActiveTab('ANALYTICS')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'ANALYTICS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Deep Analytics
                    </button>
                </div>
            </div>

            {activeTab === 'OVERVIEW' && renderOverview()}
            {activeTab === 'COHORTS' && renderCohorts()}
            {activeTab === 'ANALYTICS' && renderAnalytics()}
        </div>
    );
};
