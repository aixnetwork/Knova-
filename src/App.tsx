
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Network, 
  LogOut, 
  ArrowLeft, 
  Sparkles, 
  RefreshCw, 
  X, 
  CheckCircle, 
  Mic, 
  Image as ImageIcon, 
  ShieldAlert, 
  TrendingUp, 
  Eye, 
  Edit, 
  Save, 
  Settings, 
  Lock, 
  Menu, 
  PanelLeft, 
  Lightbulb, 
  Loader2, 
  Gift, 
  Users, 
  ArrowRight, 
  Check, 
  LifeBuoy, 
  FileBadge, 
  Database, 
  Trophy, 
  Zap, 
  Key, 
  ClipboardCheck, 
  Map as MapIcon, 
  Briefcase,
  PenTool,
  Bot,
  Globe,
  AlertTriangle,
  Maximize2, 
  Minimize2, 
  HelpCircle,
  FlaskConical,
  GraduationCap
} from 'lucide-react';

import { Course, Module, AppView, QuizQuestion, UserStats, UserProfile, UserRole, SubscriptionTier, MicroLesson, CourseStatus, AssessmentResult } from './types';
import { generateModuleContent, streamModuleContent, generateQuizForModule, generateConceptImage, validateApiKey, generateSpeech } from './services/geminiService';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { LiveTutor } from './components/LiveTutor';
import { SimulationView } from './components/SimulationView';
import { ImpactDashboard } from './components/ImpactDashboard';
import { LandingPage } from './components/LandingPage';
import { SubscriptionPage } from './components/SubscriptionPage';
import { CreatorStudio } from './components/CreatorStudio';
import { AffiliateView } from './components/AffiliateView';
import { TeamManagement } from './components/TeamManagement';
import { Logo } from './components/Logo';
import { SettingsView } from './components/SettingsView';
import { AboutUs } from './components/AboutUs';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { SkillsAssessment } from './components/SkillsAssessment'; 
import { PublicAgentRenderer } from './components/PublicAgentRenderer';
import { PathfinderView } from './components/PathfinderView';
import { DashboardView } from './components/DashboardView';
import { MeetingPrepView } from './components/MeetingPrepView';
import { CohortProgramView } from './components/CohortProgramView';
import { ExternalAssessmentView } from './components/ExternalAssessmentView';
import { FeedbackModal } from './components/FeedbackModal';
import { TwinManager } from './components/TwinManager';
import { OnboardingTour } from './components/OnboardingTour';
import { BetaFeedbackHub } from './components/BetaFeedbackHub';

// --- Performance Hook: Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// --- Persistence Helpers with Quota Safety ---
const safePersistCourse = (course: Course) => {
    const key = `knovatwin_course_${course.id}`;
    try {
        localStorage.setItem(key, JSON.stringify(course));
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
            console.warn(`Storage quota exceeded for ${course.title}. Stripping images to save text data.`);
            const leanCourse = { ...course };
            if (leanCourse.thumbnailUrl && leanCourse.thumbnailUrl.startsWith('data:')) {
                leanCourse.thumbnailUrl = undefined; 
            }
            if (leanCourse.modules) {
                leanCourse.modules = leanCourse.modules.map(m => {
                    const newM = { ...m };
                    if (newM.imageUrl && newM.imageUrl.startsWith('data:')) {
                        newM.imageUrl = undefined;
                    }
                    return newM;
                });
            }
            try {
                localStorage.setItem(key, JSON.stringify(leanCourse));
                window.dispatchEvent(new CustomEvent('knovatwin-storage-warning', { 
                    detail: { message: `Storage full. Saved "${course.title}" without images.` } 
                }));
            } catch (retryErr) {
                console.error("Failed to save even lightweight course", retryErr);
                window.dispatchEvent(new CustomEvent('knovatwin-storage-error', { 
                    detail: { message: `CRITICAL: Could not save "${course.title}". Storage full.` } 
                }));
            }
        } else {
            console.error("Unknown storage error", e);
        }
    }
};

const persistIndexToStorage = (courses: Course[]) => {
    try {
        const ids = courses.map(c => c.id);
        localStorage.setItem('knovatwin_course_index', JSON.stringify(ids));
    } catch (e) {
        console.error("Failed to save index:", e);
    }
};

interface NavItemProps {
  id?: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ id, icon, label, active, expanded, onClick }) => (
  <button
    id={id}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden text-sm ${
      active 
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20 font-medium' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
    title={!expanded ? label : undefined}
  >
    <div className={`transition-colors relative z-10 ${active ? 'text-white' : 'group-hover:text-white'}`}>
      {icon}
    </div>
    {expanded && (
      <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 relative z-10`}>
        {label}
      </span>
    )}
    {active && expanded && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm animate-pulse"></div>
    )}
  </button>
);

const NavSectionHeader: React.FC<{ title: string, expanded: boolean }> = ({ title, expanded }) => {
    if (!expanded) return <div className="h-px bg-slate-800 mx-4 my-4"></div>;
    return (
        <div className="px-4 mt-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
            {title}
        </div>
    );
};

export const App: React.FC = () => {
  const [embedTwinId, setEmbedTwinId] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => {
      try {
          const savedUser = localStorage.getItem('knovatwin_user_session');
          if (!savedUser) return null;
          const parsed = JSON.parse(savedUser);
          if (!parsed || !parsed.name || !parsed.email) return null; 
          return parsed;
      } catch (e) {
          return null;
      }
  });

  const [view, setView] = useState<AppView>(user ? AppView.DASHBOARD : AppView.LANDING);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const debouncedCourses = useDebounce(courses, 2000); 

  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [courseViewTab, setCourseViewTab] = useState<'MODULES' | 'ASSESSMENT'>('MODULES');

  const [justPublishedCourse, setJustPublishedCourse] = useState<Course | null>(null);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMobileModuleList, setShowMobileModuleList] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [storageStatus, setStorageStatus] = useState<'OK' | 'WARNING' | 'CRITICAL'>('OK');
  const [storageNotification, setStorageNotification] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
  // AI TOUR STATE
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourKey, setTourKey] = useState(0); 
  
  // BETA TESTING STATE
  const [isBetaPortalOpen, setIsBetaPortalOpen] = useState(false);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const twinIdParam = params.get('twinId');
      
      if (viewParam === 'public_agent' && twinIdParam) {
          setEmbedTwinId(twinIdParam);
          setView(AppView.PUBLIC_AGENT);
      }
  }, []);

  useEffect(() => {
      if (user && !localStorage.getItem('knovatwin_tour_completed') && view === AppView.DASHBOARD) {
          setIsTourActive(true);
      }
  }, [user, view]);

  useEffect(() => {
      const handleRelaunch = () => {
          console.log("[App] Received relaunch-tour request");
          setIsTourActive(false); 
          setTimeout(() => {
            setTourKey(prev => prev + 1);
            setIsTourActive(true);
            setView(AppView.DASHBOARD);
            localStorage.removeItem('knovatwin_tour_completed');
          }, 100);
      };
      window.addEventListener('relaunch-tour', handleRelaunch);
      return () => window.removeEventListener('relaunch-tour', handleRelaunch);
  }, []);

  const handleTourComplete = () => {
      setIsTourActive(false);
      localStorage.setItem('knovatwin_tour_completed', 'true');
  };

  const isSuperAdmin = user?.email === 'knovaadmin' || user?.name?.toLowerCase() === 'knova admin' || user?.name?.toLowerCase() === 'knovaadmin';
  const isCompanyAdmin = user?.tier === SubscriptionTier.COMPANY || user?.role === UserRole.ADMIN;
  const isExpert = user?.tier === SubscriptionTier.EXPERT || user?.role === UserRole.FACILITATOR || user?.isCreatorMode || isCompanyAdmin || isSuperAdmin;

  const showSystemTools = isSuperAdmin; 
  const showManageTools = isSuperAdmin || isCompanyAdmin; 
  const showCreateTools = isExpert; 

  const stats: UserStats = {
    totalCourses: courses?.length || 0,
    completedModules: courses?.reduce((acc, c) => acc + (c.modules?.filter(m => m.isCompleted)?.length || 0), 0) || 0,
    hoursSpent: 12.5,
    streakDays: 4,
    masteryScore: 85,
    points: 4500,
    level: 5,
    badges: []
  };

  useEffect(() => {
    const handleStorageWarning = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        setStorageNotification(detail.message);
        setTimeout(() => setStorageNotification(null), 5000);
        setStorageStatus('WARNING');
    };
    const handleStorageError = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        setStorageNotification(detail.message);
        setTimeout(() => setStorageNotification(null), 8000);
        setStorageStatus('CRITICAL');
    };
    window.addEventListener('knovatwin-storage-warning', handleStorageWarning);
    window.addEventListener('knovatwin-storage-error', handleStorageError);
    return () => {
        window.removeEventListener('knovatwin-storage-warning', handleStorageWarning);
        window.removeEventListener('knovatwin-storage-error', handleStorageError);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
        else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const indexStr = localStorage.getItem('knovatwin_course_index');
    let loadedCourses: Course[] = [];
    if (indexStr) {
        try {
            const ids = JSON.parse(indexStr);
            if (Array.isArray(ids)) {
                 loadedCourses = ids.map((id: string) => {
                    const item = localStorage.getItem(`knovatwin_course_${id}`);
                    return item ? JSON.parse(item) : null;
                 }).filter((c: any) => c && c.id);
            }
        } catch (e) {}
    }
    setCourses(loadedCourses);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    debouncedCourses.forEach(c => {
        if (c.id.startsWith('course-') || c.progress > 0) safePersistCourse(c);
    });
  }, [debouncedCourses, isLoaded]);

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('knovatwin_user_session');
      setView(AppView.LANDING);
  };

  const handleLogin = (newUser: UserProfile) => {
      setUser(newUser);
      setView(AppView.DASHBOARD);
  };

  const handleUpdateUser = (updates: Partial<UserProfile>) => {
    setUser(prev => prev ? ({ ...prev, ...updates }) : null);
  };

  const toggleBetaRole = () => {
      if(!user) return;
      const isCurrentlyExpert = user.tier === SubscriptionTier.EXPERT;
      handleUpdateUser({
          tier: isCurrentlyExpert ? SubscriptionTier.PROFESSIONAL : SubscriptionTier.EXPERT,
          role: isCurrentlyExpert ? UserRole.LEARNER : UserRole.FACILITATOR
      });
  };

  const addCourse = (course: Course) => {
    if(!course.modules) course.modules = [];
    if(!course.id || !course.id.startsWith('course-')) {
        course.id = `course-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    const courseWithTimestamp = {
        ...course,
        createdAt: course.createdAt || Date.now(),
        status: course.status || (user?.role === UserRole.ADMIN ? CourseStatus.PUBLISHED : CourseStatus.DRAFT)
    };
    setCourses(prev => {
        let newCourses;
        const idx = prev.findIndex(c => c.id === courseWithTimestamp.id);
        if (idx >= 0) {
            newCourses = [...prev];
            newCourses[idx] = courseWithTimestamp;
        } else {
            newCourses = [courseWithTimestamp, ...prev];
        }
        safePersistCourse(courseWithTimestamp);
        persistIndexToStorage(newCourses);
        return newCourses;
    });
    if (courseWithTimestamp.status === CourseStatus.PUBLISHED) {
        setJustPublishedCourse(courseWithTimestamp);
    }
    setCourseSearch('');
  };

  const handleUpdateCourse = (courseId: string, updates: Partial<Course>) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, ...updates } : c));
  };

  const handleSelectCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    setView(AppView.COURSE_VIEW);
  };

  const handleEditCourse = (courseId: string) => {
      const course = courses.find(c => c.id === courseId);
      if (course) {
          setCourseToEdit(course);
          setView(AppView.CREATOR_STUDIO);
      }
  };

  const handleDeleteCourse = (courseId: string) => {
      if (confirm("Are you sure you want to delete this course?")) {
          const updatedCourses = courses.filter(c => c.id !== courseId);
          setCourses(updatedCourses);
          localStorage.removeItem(`knovatwin_course_${courseId}`);
          persistIndexToStorage(updatedCourses);
      }
  };

  const renderContent = () => {
    switch (view) {
      case AppView.LANDING: return <LandingPage onEnterApp={handleLogin} onNavigate={setView} />;
      case AppView.ABOUT: return <AboutUs onBack={() => setView(user ? AppView.DASHBOARD : AppView.LANDING)} />;
      case AppView.DASHBOARD: return <DashboardView user={user} courses={courses} stats={stats} storageStatus={storageStatus} justPublishedCourse={justPublishedCourse} onClearPublished={() => setJustPublishedCourse(null)} onSelectCourse={handleSelectCourse} onNavigate={setView} onUpdateCourse={handleUpdateCourse} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} setCourseSearch={setCourseSearch} courseSearch={courseSearch} isFeedbackOpen={isFeedbackOpen} setIsFeedbackOpen={setIsFeedbackOpen} onSetCourseToEdit={setCourseToEdit} />;
      case AppView.CREATOR_STUDIO: return <CreatorStudio onPublishCourse={addCourse} courses={courses} user={user} onNavigateToDashboard={() => setView(AppView.DASHBOARD)} courseToEdit={courseToEdit} onClearEditMode={() => setCourseToEdit(null)} />;
      case AppView.TWIN_MANAGER: return <TwinManager />;
      case AppView.SETTINGS: return <SettingsView user={user} onUpdateUser={handleUpdateUser} />;
      case AppView.PUBLIC_AGENT: return embedTwinId ? <PublicAgentRenderer twinId={embedTwinId} /> : null;
      default: return <DashboardView {...{user, courses, stats, storageStatus, justPublishedCourse, onClearPublished: () => {}, onSelectCourse: () => {}, onNavigate: setView, onUpdateCourse: () => {}, onEditCourse: () => {}, onDeleteCourse: () => {}, setCourseSearch, courseSearch, isFeedbackOpen, setIsFeedbackOpen, onSetCourseToEdit: () => {}}} />;
    }
  };

  const hideSidebar = view === AppView.LANDING || view === AppView.PUBLIC_AGENT || view === AppView.ABOUT;

  if (hideSidebar) {
      return (
          <div className="h-full w-full bg-slate-50 overflow-hidden text-slate-900 relative">
              {isTourActive && user && <OnboardingTour key={tourKey} user={user} onNavigate={setView} onComplete={handleTourComplete} />}
              {renderContent()}
          </div>
      );
  }

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden text-slate-900 font-sans selection:bg-indigo-500 selection:text-white relative">
        {isTourActive && user && <OnboardingTour key={tourKey} user={user} onNavigate={setView} onComplete={handleTourComplete} />}
        
        <BetaFeedbackHub isOpen={isBetaPortalOpen} currentView={view} onClose={() => setIsBetaPortalOpen(false)} />

        {storageNotification && (
            <div className="fixed top-4 right-4 z-[60] bg-white border-l-4 border-amber-500 p-4 rounded-lg shadow-2xl animate-in slide-in-from-right-10 flex items-center gap-3 max-w-sm">
                <AlertTriangle className="text-amber-500 shrink-0" />
                <p className="text-sm font-medium text-slate-700">{storageNotification}</p>
                <button onClick={() => setStorageNotification(null)} className="ml-auto text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>
        )}

        {isMobileSidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />}
        <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out ${isMobileSidebarOpen || isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20 lg:w-72'}`}>
            <div className="p-6 flex items-center gap-3 h-20 border-b border-slate-800"><Logo className="w-8 h-8 shrink-0" showText={isSidebarOpen} lightText={true} /></div>
            <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
                <NavItem id="nav-dashboard" icon={<LayoutDashboard size={18}/>} label="Dashboard" active={view === AppView.DASHBOARD} expanded={isSidebarOpen} onClick={() => setView(AppView.DASHBOARD)} />
                <NavSectionHeader title="Practice" expanded={isSidebarOpen} />
                <NavItem id="nav-tutor" icon={<Mic size={18}/>} label="Live Tutor" active={view === AppView.LIVE_TUTOR} expanded={isSidebarOpen} onClick={() => setView(AppView.LIVE_TUTOR)} />
                {showCreateTools && (
                    <><NavSectionHeader title="Create" expanded={isSidebarOpen} />
                        <NavItem id="nav-creator" icon={<Sparkles size={18}/>} label="Course Builder" active={view === AppView.CREATOR_STUDIO} expanded={isSidebarOpen} onClick={() => setView(AppView.CREATOR_STUDIO)} />
                        <NavItem id="nav-twins" icon={<Bot size={18}/>} label="Twin Lab" active={view === AppView.TWIN_MANAGER} expanded={isSidebarOpen} onClick={() => setView(AppView.TWIN_MANAGER)} />
                    </>
                )}
            </div>
            <div className="p-3 border-t border-slate-800 flex flex-col gap-1">
                <NavItem id="nav-settings" icon={<Settings size={18}/>} label="Settings" active={view === AppView.SETTINGS} expanded={isSidebarOpen} onClick={() => setView(AppView.SETTINGS)} />
                <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group ${!isSidebarOpen ? 'justify-center' : ''}`} title="Logout">
                    <LogOut size={18} /> {isSidebarOpen && <span className="font-medium text-sm">Log Out</span>}
                </button>
            </div>
        </aside>

        <main className="flex-1 h-full overflow-hidden flex flex-col relative w-full">
            <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center z-30 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden text-slate-600"><Menu size={24}/></button>
                    
                    {/* BETA TESTER ROLE SWITCHER */}
                    <div className="hidden sm:flex bg-slate-100 rounded-full p-1 border border-slate-200 ml-4">
                        <button 
                            onClick={toggleBetaRole}
                            className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 transition-all ${user?.tier === SubscriptionTier.EXPERT ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <PenTool size={12}/> Expert View
                        </button>
                        <button 
                            onClick={toggleBetaRole}
                            className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 transition-all ${user?.tier !== SubscriptionTier.EXPERT ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <GraduationCap size={12}/> Learner View
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsBetaPortalOpen(true)}
                        className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-2"
                    >
                        <FlaskConical size={12} className="animate-pulse" /> Feedback
                    </button>
                    <Logo className="w-8 h-8 hidden md:block" showText={false} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 relative">{renderContent()}</div>
            
            <button 
                onClick={() => window.dispatchEvent(new CustomEvent('relaunch-tour'))} 
                className="fixed bottom-6 right-8 md:right-8 z-40 bg-white p-3 rounded-full shadow-lg border border-slate-200 text-slate-500 hover:text-indigo-600 transition-all flex items-center gap-2 group overflow-hidden max-w-[44px] hover:max-w-[180px]" 
                title="Restart Guided Tour"
            >
                <HelpCircle size={20} className="shrink-0" />
                <span className="text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Guided Discovery</span>
            </button>
        </main>
    </div>
  );
};
