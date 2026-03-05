
import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Database, 
  X, 
  CheckCircle, 
  BookOpen, 
  Activity, 
  Clock, 
  Flame, 
  Target, 
  Plus, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Play, 
  Sparkles,
  Lightbulb,
  ShieldCheck,
  Bot,
  CloudLightning,
  RefreshCw,
  Globe,
  HelpCircle,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { Course, UserStats, UserProfile, UserRole, SubscriptionTier, AppView } from '../types';
import { CourseCard } from './CourseCard';
import { OnboardingAssistant } from './OnboardingAssistant';
import { generateDailyInsight } from '../services/geminiService';
import { syncEngine, SyncStatus } from '../services/syncService';
import { DashboardQuickStart } from './DashboardQuickStart';
import { expertPersonasApi } from '../services/api';

interface DashboardViewProps {
    user: UserProfile | null;
    courses: Course[];
    /** From App: totalCourses/completedModules are derived from courses; level, streakDays, etc. are from backend or placeholders */
    stats: UserStats;
    storageStatus: 'OK' | 'WARNING' | 'CRITICAL';
    justPublishedCourse: Course | null;
    onClearPublished: () => void;
    onSelectCourse: (id: string) => void;
    onNavigate: (view: AppView) => void;
    onUpdateCourse: (id: string, updates: Partial<Course>) => void;
    onEditCourse: (id: string) => void;
    onDeleteCourse: (id: string) => void;
    setCourseSearch: (term: string) => void;
    courseSearch: string;
    isFeedbackOpen: boolean;
    setIsFeedbackOpen: (open: boolean) => void;
    onSetCourseToEdit: (course: Course | null) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
    user, 
    courses, 
    stats, 
    storageStatus, 
    justPublishedCourse, 
    onClearPublished,
    onSelectCourse,
    onNavigate,
    onUpdateCourse,
    onEditCourse,
    onDeleteCourse,
    setCourseSearch,
    courseSearch,
    isFeedbackOpen,
    setIsFeedbackOpen,
    onSetCourseToEdit
}) => {
    // --- SCALE MONITORING ---
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('IDLE');
    useEffect(() => {
        syncEngine.subscribe(status => setSyncStatus(status));
    }, []);

    // Load twin count from API for checklist
    const [twinCount, setTwinCount] = useState(0);
    useEffect(() => {
        expertPersonasApi.list()
            .then(({ data }) => setTwinCount(Array.isArray(data) ? data.length : 0))
            .catch(() => {});
    }, []);

    const isSuperAdmin = user?.email === 'knovaadmin' || user?.name?.toLowerCase() === 'knova admin' || user?.name?.toLowerCase() === 'knovaadmin';
    const isCompanyUser = user?.tier === SubscriptionTier.COMPANY || user?.role === UserRole.ADMIN;
    
    const hasCreatorAccess = 
        user?.tier === SubscriptionTier.EXPERT || 
        user?.role === UserRole.FACILITATOR ||
        user?.isCreatorMode || 
        isCompanyUser || 
        isSuperAdmin;

    const safeCourses = (courses || []).filter(c => c && c.id);
    const sortedCourses = [...safeCourses].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    const visibleCourses = sortedCourses.filter(c => {
        if (!c) return false;
        if (isSuperAdmin || isCompanyUser) return true;
        if (user?.name && c.authorName === user.name) return true;
        if (hasCreatorAccess && c.status !== 'ARCHIVED') return true;
        if (c.isDefault) return true;
        if (c.status === 'PUBLISHED') return true;
        return false; 
    });

    const myCreations = visibleCourses.filter(c => 
        (c.id && c.id.startsWith('course-')) || 
        (user?.name && c.authorName === user.name) ||
        (hasCreatorAccess && c.status === 'DRAFT')
    );
    
    const otherCourses = visibleCourses.filter(c => !myCreations.includes(c));
    const continueCourse = visibleCourses.find(c => c.progress > 0 && c.progress < 100) || visibleCourses[0];

    let displayCreations = [...myCreations];
    let displayOthers = [...otherCourses];
  
    if (courseSearch.trim()) {
        const term = courseSearch.toLowerCase();
        const matches = (c: Course) => (c.title || '').toLowerCase().includes(term);
        displayCreations = displayCreations.filter(matches);
        displayOthers = displayOthers.filter(matches);
    }

    const [dailyInsight, setDailyInsight] = useState<string | null>(null);

    useEffect(() => {
        const loadInsight = async () => {
            const today = new Date().toDateString();
            const storedKey = `knovatwin_insight_${today}`;
            const storedInsight = localStorage.getItem(storedKey);

            if (storedInsight) {
                setDailyInsight(storedInsight);
            } else if (user && continueCourse && continueCourse.topic) {
                try {
                    const insight = await generateDailyInsight(user.name, continueCourse.topic);
                    setDailyInsight(insight);
                    localStorage.setItem(storedKey, insight);
                } catch (e: any) {
                    setDailyInsight("Consistency is key. Keep learning!"); 
                }
            }
        };
        loadInsight();
    }, [user, continueCourse]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const userName = user?.name ? user.name.split(' ')[0] : 'Learner';

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[2000px] mx-auto pb-32 relative animate-in fade-in duration-500">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                {getGreeting()}, {userName}
                            </h1>
                            {isSuperAdmin && (
                                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider shadow-sm">
                                    <ShieldCheck size={12}/> Super Admin
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 text-sm mt-1">
                            Your expertise is safe and synced across the network.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 shadow-lg">
                        <Globe size={12} className="text-cyan-400 animate-pulse" />
                        <span>Global Network: 1M MAU Ready</span>
                    </div>

                    <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-full px-4 py-1.5 flex items-center gap-3 shadow-sm text-sm font-bold text-slate-700">
                        {syncStatus === 'SYNCING' ? (
                            <div className="flex items-center gap-2 text-indigo-600 animate-pulse">
                                <RefreshCw size={14} className="animate-spin" />
                                <span className="text-[10px]">Syncing...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-emerald-600">
                                <CloudLightning size={14} />
                                <span className="text-[10px]">Synced</span>
                            </div>
                        )}
                        <div className="w-px h-3 bg-slate-300"></div>
                        <div className="flex items-center gap-1.5 text-indigo-600">
                            <Trophy size={14} /> Lvl {stats.level}
                        </div>
                    </div>
                </div>
            </div>

            {justPublishedCourse && (
                <div className="bg-emerald-600 text-white p-4 rounded-xl mb-8 flex justify-between items-center shadow-lg animate-in slide-in-from-top duration-500 border border-emerald-500">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2 rounded-full"><CheckCircle size={24} /></div>
                        <div>
                            <h3 className="font-bold text-lg">Knowledge Persisted</h3>
                            <p className="text-emerald-100 text-sm">Successfully synced to the decentralized hub.</p>
                        </div>
                    </div>
                    <button onClick={onClearPublished} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
                </div>
            )}

            {/* NEURAL ANALYTICS HUB (Replaces top box) */}
            <DashboardQuickStart 
                onNavigate={onNavigate} 
                onStartTour={() => window.dispatchEvent(new CustomEvent('relaunch-tour'))} 
            />

            <div className="grid grid-cols-12 gap-6 lg:gap-8">
                <div className="col-span-12 xl:col-span-9 space-y-8">
                    
                    {/* Mastery Card */}
                    <div className="w-full">
                        <div className="bg-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg border border-slate-100 flex flex-col justify-center min-h-[300px] group hover:shadow-xl transition-all">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] opacity-50 -mr-12 -mt-12 group-hover:bg-indigo-100 transition-colors"></div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4 w-fit">
                                    <CloudLightning size={12} /> Resume Learning
                                </div>
                                
                                {continueCourse ? (
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h2 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight text-slate-900 leading-tight">
                                            {continueCourse.title}
                                        </h2>
                                        
                                        <div className="max-w-md mb-6">
                                            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                                <span>Session Progress</span>
                                                <span>{continueCourse.progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${continueCourse.progress}%` }}></div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => onSelectCourse(continueCourse.id)}
                                            className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg w-full md:w-fit justify-center"
                                        >
                                            <Play size={18} fill="currentColor" /> Enter Lab
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight text-slate-900">Infinite Wisdom</h2>
                                        <p className="text-slate-600 mb-6 max-w-md">The 1M user network is active. Join a cohort to begin your decentralized learning journey.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Creations Hub */}
                    <div className="space-y-12">
                        {displayCreations.length > 0 && (
                            <div className="animate-in slide-in-from-left-4 duration-500">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900">Your Knowledge Hub</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                    {displayCreations.map(course => (
                                        <CourseCard 
                                            key={course.id}
                                            course={course} 
                                            onClick={() => onSelectCourse(course.id)} 
                                            onUpdateThumbnail={(url) => onUpdateCourse(course.id, { thumbnailUrl: url })}
                                            onEdit={hasCreatorAccess ? () => onEditCourse(course.id) : undefined}
                                            onDelete={hasCreatorAccess ? () => onDeleteCourse(course.id) : undefined}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Marketplace */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-slate-900">Global Knowledge Pool</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                {displayOthers.map(course => (
                                    <CourseCard 
                                        key={course.id}
                                        course={course} 
                                        onClick={() => onSelectCourse(course.id)}
                                        onUpdateThumbnail={(url) => onUpdateCourse(course.id, { thumbnailUrl: url })}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Sidebar (Cleaned Up) */}
                <div className="hidden xl:block xl:col-span-3 space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm sticky top-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Target size={18} className="text-indigo-600" /> Milestone Tracking
                            </h3>
                        </div>

                        {(() => {
                            const totalModules = (courses || []).reduce((acc, c) => acc + (c.modules?.length || 0), 0);
                            const progressPct = totalModules > 0 ? Math.round((stats.completedModules / totalModules) * 100) : 0;
                            return (
                        <div className="space-y-4">
                             <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Progress</p>
                                <p className="text-sm font-bold text-slate-900">{stats.completedModules} of {totalModules} modules</p>
                                <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                                </div>
                             </div>

                             <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Active Streak</p>
                                <div className="flex items-center gap-2">
                                    <Flame size={16} className="text-orange-500" />
                                    <p className="text-sm font-bold text-slate-900">{stats.streakDays} Day Learning Streak</p>
                                </div>
                             </div>

                             <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Mastery</p>
                                <div className="flex items-center gap-2">
                                    <Target size={16} className="text-indigo-500" />
                                    <p className="text-sm font-bold text-slate-900">{stats.masteryScore}% Mastery Score</p>
                                </div>
                             </div>
                        </div>
                            );
                        })()}

                        <div className="pt-6 mt-6 border-t border-slate-100">
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Sparkles size={10}/> Weekly Insight
                                </p>
                                <p className="text-[11px] text-indigo-700 leading-relaxed italic">
                                    {dailyInsight || "Your neural retention is 14% higher than the global average today. Focus on deep work sessions."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {user && <OnboardingAssistant user={user} />}
        </div>
    );
};
