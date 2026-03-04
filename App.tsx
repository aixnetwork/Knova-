
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
  HelpCircle
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
import { authApi, clearToken, coursesApi, enrollmentsApi } from './services/api';
import { mapAuthUserToProfile } from './services/authHelpers';

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

// Backend course IDs are UUIDs; only persist non-backend courses to localStorage.
const isBackendCourseId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// --- Persistence Helpers with Quota Safety ---
const safePersistCourse = (course: Course) => {
    if (isBackendCourseId(course.id)) return; // Backend courses are stored in DB, not localStorage
    const key = `knovatwin_course_${course.id}`;
    try {
        localStorage.setItem(key, JSON.stringify(course));
    } catch (e: any) {
        // Check for QuotaExceededError
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
            console.warn(`Storage quota exceeded for ${course.title}. Stripping images to save text data.`);
            
            // Create lightweight clone
            const leanCourse = { ...course };
            
            // Remove main thumbnail if it's base64
            if (leanCourse.thumbnailUrl && leanCourse.thumbnailUrl.startsWith('data:')) {
                leanCourse.thumbnailUrl = undefined; 
            }
            
            // Remove module images if base64
            if (leanCourse.modules) {
                leanCourse.modules = leanCourse.modules.map(m => {
                    const newM = { ...m };
                    if (newM.imageUrl && newM.imageUrl.startsWith('data:')) {
                        newM.imageUrl = undefined;
                    }
                    return newM;
                });
            }
            
            // Retry save
            try {
                localStorage.setItem(key, JSON.stringify(leanCourse));
                // We dispatch a custom event so the UI can show a toast if needed
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
        const ids = courses.filter(c => !isBackendCourseId(c.id)).map(c => c.id);
        localStorage.setItem('knovatwin_course_index', JSON.stringify(ids));
    } catch (e) {
        console.error("Failed to save index:", e);
    }
};

// --- Markdown Helper ---
const renderMarkdown = (text: string, isFocusMode: boolean) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className={`${isFocusMode ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'} font-bold mb-4 md:mb-6 mt-6 md:mt-8 text-slate-900 leading-tight`}>{line.replace('# ', '')}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className={`${isFocusMode ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'} font-bold mb-3 md:mb-4 mt-4 md:mt-6 text-slate-800`}>{line.replace('## ', '')}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className={`${isFocusMode ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'} font-bold mb-2 md:mb-3 mt-3 md:mt-4 text-slate-800`}>{line.replace('### ', '')}</h3>;
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc mb-2 text-slate-700 pl-2 text-sm md:text-base">{line.replace('- ', '')}</li>;
        if (line.match(/^\d+\. /)) return <li key={i} className="ml-4 list-decimal mb-2 text-slate-700 pl-2 text-sm md:text-base">{line.replace(/^\d+\. /, '')}</li>;
        
        // Basic Bold Parsing
        const parts = line.split(/(\*\*.*?\*\*)/);
        return (
            <p key={i} className={`mb-3 md:mb-4 leading-relaxed ${isFocusMode ? 'text-lg md:text-xl text-slate-700' : 'text-sm md:text-base text-slate-600'}`}>
                {parts.map((part, index) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                })}
            </p>
        );
    });
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, expanded, onClick }) => (
  <button
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
  // ROUTING LOGIC FOR STANDALONE EMBED
  const [embedTwinId, setEmbedTwinId] = useState<string | null>(null);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const twinIdParam = params.get('twinId');
      
      if (viewParam === 'public_agent' && twinIdParam) {
          setEmbedTwinId(twinIdParam);
          setView(AppView.PUBLIC_AGENT);
      }
  }, []);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [courses, setCourses] = useState<Course[]>([]);
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
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [keyValidationStatus, setKeyValidationStatus] = useState<'IDLE' | 'VALIDATING' | 'ERROR'>('IDLE');
  const [keyValidationError, setKeyValidationError] = useState('');
  
  const [courseSearch, setCourseSearch] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [currentAudioSource, setCurrentAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const [moduleContent, setModuleContent] = useState<string | null>(null);
  const [moduleTopic, setModuleTopic] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizActive, setQuizActive] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const [activeMicroLesson, setActiveMicroLesson] = useState<MicroLesson | null>(null);
  
  const [storageStatus, setStorageStatus] = useState<'OK' | 'WARNING' | 'CRITICAL'>('OK');
  const [storageNotification, setStorageNotification] = useState<string | null>(null);
  
  // Feedback Modal State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
  // Contextual Tutor State
  const [liveTutorContext, setLiveTutorContext] = useState<string | undefined>(undefined);

  // --- STRICT PERMISSION FLAGS ---
  // Super Admin: Has access to System Admin Panel (God Mode)
  const isSuperAdmin = user?.email === 'knovaadmin' || user?.name?.toLowerCase() === 'knova admin' || user?.name?.toLowerCase() === 'knovaadmin';
  
  // Company Admin: Has access to Workforce, BICE, Impact, Assessments
  const isCompanyAdmin = user?.tier === SubscriptionTier.COMPANY || user?.role === UserRole.ADMIN;
  
  // Expert / Creator: Has access to Creator Studio, Twin Lab
  // IMPORTANT: This now properly gates the "Create" sidebar section. 
  // Company Admins and Super Admins also get Create tools.
  const isExpert = user?.tier === SubscriptionTier.EXPERT || user?.role === UserRole.FACILITATOR || user?.isCreatorMode || isCompanyAdmin || isSuperAdmin;

  // Render Flags
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
    badges: [
        { id: '1', name: 'Fast Starter', icon: '🚀', description: 'Completed first module in < 10 mins' },
        { id: '2', name: 'Quiz Whiz', icon: '🧠', description: 'Scored 100% on a quiz' },
        { id: '3', name: 'Deep Diver', icon: '🌊', description: 'Spent 2+ hours in Focus Mode' }
    ]
  };

  // Restore session from token (GET /auth/me)
  useEffect(() => {
    const token = localStorage.getItem('knovatwin_token');
    if (!token) {
      setSessionChecked(true);
      return;
    }
    authApi.me()
      .then(({ data }) => {
        setUser(mapAuthUserToProfile(data));
        setView(AppView.DASHBOARD);
      })
      .catch(() => {
        clearToken();
        setUser(null);
        setView(AppView.LANDING);
      })
      .finally(() => setSessionChecked(true));
  }, []);

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
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        } else {
            setIsSidebarOpen(true);
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // LOAD COURSES: localStorage first, then merge with API if available
  useEffect(() => {
    const MARKETPLACE_MOCK: Course[] = [
        { 
            id: 'mock-1', 
            title: 'Python for Data Science Bootcamp', 
            topic: 'Python', 
            description: 'Master Python, Pandas, and NumPy to analyze data and build ML models.', 
            progress: 0, 
            createdAt: Date.now() - 100000000, 
            modules: [], 
            price: 129.99,
            isFeatured: true,
            authorName: 'Dr. Angela Yu',
            rating: 4.9,
            reviewCount: 4520,
            status: CourseStatus.PUBLISHED
        },
    ];
    
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
        } catch (e) {
            console.error("Index load failed", e);
        }
    }
    
    const loadedMap = new Map(loadedCourses.map(c => [c.id, c]));
    MARKETPLACE_MOCK.forEach(mock => {
        if (!loadedMap.has(mock.id)) {
            loadedCourses.push(mock);
        }
    });
    setCourses(loadedCourses);

    coursesApi.list()
      .then(({ data }) => {
        if (!Array.isArray(data)) return;
        const apiCourses: Course[] = data.map((c: { id: string; topic: string; description: string; status?: string; modules?: { id: string; name: string; description?: string | null; keyConcepts: string[] }[] }) => ({
          id: c.id,
          title: c.topic,
          topic: c.topic,
          description: c.description || '',
          progress: 0,
          createdAt: Date.now(),
          modules: (c.modules || []).map((m: { id: string; name: string; description?: string | null; keyConcepts: string[] }) => ({
            id: m.id,
            title: m.name,
            description: m.description ?? undefined,
            keyConcepts: m.keyConcepts || [],
            isCompleted: false,
          })),
          status: c.status === 'PUBLISHED' ? CourseStatus.PUBLISHED : CourseStatus.DRAFT,
        }));
        setCourses(prev => {
          const map = new Map(prev.map(c => [c.id, c]));
          apiCourses.forEach(ac => { if (!map.has(ac.id)) map.set(ac.id, ac); });
          return Array.from(map.values());
        });
      })
      .catch(() => {});
  }, []);

  // BACKGROUND SAVE (Debounced)
  useEffect(() => {
    if (debouncedCourses.length === 0) return;
    persistIndexToStorage(debouncedCourses);
    debouncedCourses.forEach(c => {
        // Only save user courses or active progress, to save I/O
        if (c.id.startsWith('course-') || c.progress > 0) {
            safePersistCourse(c);
        }
    });
  }, [debouncedCourses]);

  useEffect(() => {
      if (user) {
          localStorage.setItem('knovatwin_user_session', JSON.stringify(user));
      }
  }, [user]);

  useEffect(() => {
      if (user) {
          const geminiKey = (import.meta as any)?.env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY)) || '';
          const hasEnvKey = geminiKey.length > 10;
          const storedKey = localStorage.getItem('knovatwin_custom_api_key');
          if (!hasEnvKey && !storedKey) {
              setShowApiKeyModal(true);
          }
      }
  }, [user]);

  const handleSaveApiKey = async (e: React.FormEvent) => {
      e.preventDefault();
      if(customApiKey.trim()) {
          setKeyValidationStatus('VALIDATING');
          setKeyValidationError('');
          const result = await validateApiKey(customApiKey.trim());
          if (result.valid) {
              localStorage.setItem('knovatwin_custom_api_key', customApiKey.trim());
              setKeyValidationStatus('IDLE');
              setShowApiKeyModal(false);
              alert("Key Verified! Welcome to KnovaTwin.");
              window.location.reload();
          } else {
              setKeyValidationStatus('ERROR');
              setKeyValidationError(result.error || "Invalid Key");
          }
      }
  };

  const handleLogout = () => {
      setUser(null);
      clearToken();
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

  const handleUpgradeUser = (newTier: SubscriptionTier) => {
      if(user) {
          const updatedUser = { ...user, tier: newTier };
          if (newTier === SubscriptionTier.EXPERT) {
              updatedUser.role = UserRole.FACILITATOR;
          }
          setUser(updatedUser);
          setView(AppView.DASHBOARD);
          alert(`Success! You have been upgraded to the ${newTier} plan.`);
      }
  };

  const addCourse = (course: Course) => {
      if(!course.modules) course.modules = [];
      const tempId = course.id && course.id.startsWith('course-') ? course.id : `course-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const status = course.status || (user?.role === UserRole.ADMIN ? CourseStatus.PUBLISHED : CourseStatus.DRAFT);
      const courseWithTimestamp = {
          ...course,
          id: tempId,
          createdAt: course.createdAt || Date.now(),
          status
      };

      setCourses(prev => {
          const idx = prev.findIndex(c => c.id === courseWithTimestamp.id);
          const newCourses = idx >= 0 ? prev.map(c => c.id === courseWithTimestamp.id ? courseWithTimestamp : c) : [courseWithTimestamp, ...prev];
          safePersistCourse(courseWithTimestamp);
          persistIndexToStorage(newCourses);
          return newCourses;
      });
      if (status === CourseStatus.PUBLISHED) setJustPublishedCourse(courseWithTimestamp);

      // Always save to backend (database) for both draft and publish
      coursesApi.create({
          topic: courseWithTimestamp.topic || courseWithTimestamp.title || 'Untitled',
          description: courseWithTimestamp.description || '',
          modules: (courseWithTimestamp.modules || []).map(m => ({
              name: m.title,
              description: m.description ?? undefined,
              keyConcepts: m.keyConcepts || []
          })),
          status: status === CourseStatus.PUBLISHED ? 'PUBLISHED' : 'DRAFT'
      }).then(({ data }) => {
          const apiCourse: Course = {
              id: data.id,
              title: data.topic,
              topic: data.topic,
              description: data.description || '',
              progress: 0,
              createdAt: Date.now(),
              modules: (data.modules || []).map((m: { id: string; name: string; description?: string | null; keyConcepts: string[] }) => ({
                  id: m.id,
                  title: m.name,
                  description: m.description ?? undefined,
                  keyConcepts: m.keyConcepts || [],
                  isCompleted: false
              })),
              status: (data as { status?: string }).status === 'PUBLISHED' ? CourseStatus.PUBLISHED : CourseStatus.DRAFT
          };
          setCourses(prev => {
              const next = prev.filter(c => c.id !== tempId);
              const map = new Map(next.map(c => [c.id, c]));
              map.set(apiCourse.id, apiCourse);
              try { localStorage.removeItem(`knovatwin_course_${tempId}`); } catch (_) {}
              persistIndexToStorage(Array.from(map.values()));
              return Array.from(map.values());
          });
          if (status === CourseStatus.PUBLISHED) setJustPublishedCourse(apiCourse);
      }).catch(() => {
          // Keep course in state and localStorage if API fails
      });
      setCourseSearch('');
  };

  const handleUpdateCourse = (courseId: string, updates: Partial<Course>) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    const updatedCourse = { ...course, ...updates };
    setCourses(prev => {
        const newCourses = prev.map(c => (c.id === courseId ? updatedCourse : c));
        safePersistCourse(updatedCourse);
        return newCourses;
    });
    if (isBackendCourseId(courseId)) {
        coursesApi.update(courseId, {
            topic: updatedCourse.topic || updatedCourse.title,
            description: updatedCourse.description,
            modules: updatedCourse.modules?.map(m => ({ title: m.title, description: m.description, keyConcepts: m.keyConcepts })),
        }).catch(() => {});
    }
  };

  const handleEditCourse = (courseId: string) => {
      const course = courses.find(c => c.id === courseId);
      if (course) {
          setCourseToEdit(course);
          setView(AppView.CREATOR_STUDIO);
      }
  };

  const handleDeleteCourse = (courseId: string) => {
      if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
          const updatedCourses = courses.filter(c => c.id !== courseId);
          setCourses(updatedCourses);
          try {
              localStorage.removeItem(`knovatwin_course_${courseId}`);
              const updatedIds = updatedCourses.map(c => c.id);
              localStorage.setItem('knovatwin_course_index', JSON.stringify(updatedIds));
          } catch (e) {
              console.error("Delete persistence failed", e);
          }
          if (activeCourseId === courseId) {
              setActiveCourseId(null);
              setView(AppView.DASHBOARD);
          }
      }
  };

  const handleSelectCourse = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    setActiveCourseId(courseId);
    if (isBackendCourseId(courseId)) {
      enrollmentsApi.enroll(courseId).catch(() => {});
      enrollmentsApi.getCompletedModules(courseId).then(({ data }) => {
        const ids = new Set(data.moduleIds || []);
        if (ids.size > 0) {
          setCourses(prev => prev.map(c => c.id === courseId ? { ...c, modules: c.modules?.map(m => ({ ...m, isCompleted: ids.has(m.id) })) || [] } : c));
        }
      }).catch(() => {});
    }
    const firstModule = course.modules?.find(m => !m.isCompleted) || course.modules?.[0];
    if (firstModule) {
        handleSelectModule(firstModule.id, courseId);
    } else {
        setActiveModuleId(null);
        setModuleContent(null);
    }
    setModuleTopic('');
    setQuizActive(false);
    setView(AppView.COURSE_VIEW);
    setCourseViewTab('MODULES');
    setFocusMode(false);
    setIsEditing(false);
    setCourseToEdit(null);
  };

  const handleSelectModule = async (moduleId: string, specificCourseId?: string) => {
    const cId = specificCourseId || activeCourseId;
    if (!cId) return;
    const course = courses.find(c => c.id === cId);
    if (!course) return;
    const module = course.modules?.find(m => m.id === moduleId);
    if (!module) return;

    setActiveModuleId(moduleId);
    setShowMobileModuleList(false);
    setQuizActive(false);
    setIsEditing(false);
    setModuleTopic(module.topic || '');
    stopAudio();

    if (module.content) {
      setModuleContent(module.content);
      setIsLoadingContent(false);
    } else {
      setIsLoadingContent(true);
      setModuleContent('');
      try {
        const finalContent = await streamModuleContent(course.topic, module, (chunk) => {
            setModuleContent(chunk);
            if(chunk.length > 20) setIsLoadingContent(false);
        });
        updateModuleInState(cId, moduleId, { content: finalContent });
        setModuleContent(finalContent);
      } catch (error) {
        setModuleContent("Error generating content. Please try again.");
      } finally {
        setIsLoadingContent(false);
      }
    }

    if (!module.imageUrl) {
        setIsLoadingImage(true);
        generateConceptImage(`${module.title} - ${module.keyConcepts?.[0] || 'Concept'}`).then(url => {
            if(url) updateModuleInState(cId, moduleId, { imageUrl: url });
        }).finally(() => setIsLoadingImage(false));
    }
  };

  const handleRegenerateContent = async () => {
    if (!activeCourseId || !activeModuleId) return;
    const course = courses.find(c => c.id === activeCourseId);
    const module = course?.modules?.find(m => m.id === activeModuleId);
    if (!course || !module) return;
    
    setIsLoadingContent(true);
    setModuleContent('');
    try {
        const content = await streamModuleContent(course.topic, module, (chunk) => {
            setModuleContent(chunk);
            if(chunk.length > 20) setIsLoadingContent(false);
        });
        updateModuleInState(activeCourseId, activeModuleId, { content });
    } catch (error) {
        console.error("Failed to regenerate content", error);
    } finally {
        setIsLoadingContent(false);
    }
  };

  const handleSaveContent = () => {
    if (!activeCourseId || !activeModuleId || moduleContent === null) return;
    updateModuleInState(activeCourseId, activeModuleId, { 
        content: moduleContent,
        topic: moduleTopic 
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const updateModuleInState = (courseId: string, moduleId: string, updates: Partial<Module>) => {
    setCourses(prev => {
        const newCourses = prev.map(c => {
            if (c.id === courseId) {
              const updatedCourse = {
                ...c,
                modules: c.modules?.map(m => m.id === moduleId ? { ...m, ...updates } : m) || []
              };
              safePersistCourse(updatedCourse);
              return updatedCourse;
            }
            return c;
        });
        return newCourses;
    });
  };

  const handleMarkModuleComplete = () => {
    if (!activeCourseId || !activeModuleId) return;
    const updateLocalState = (progress?: number) => {
      setCourses(prev => prev.map(c => {
        if (c.id !== activeCourseId) return c;
        const updatedModules = c.modules?.map(m => m.id === activeModuleId ? { ...m, isCompleted: true } : m) || [];
        const p = progress ?? Math.round((updatedModules.filter(m => m.isCompleted).length / Math.max(1, updatedModules.length)) * 100);
        const updatedCourse = { ...c, modules: updatedModules, progress: p };
        safePersistCourse(updatedCourse);
        return updatedCourse;
      }));
    };
    if (isBackendCourseId(activeCourseId)) {
      enrollmentsApi.markModuleComplete(activeModuleId).then(({ data }) => updateLocalState(data.progress)).catch(() => updateLocalState());
    } else {
      updateLocalState();
    }
  };

  const handleStartQuiz = async () => {
      if (!activeCourseId || !activeModuleId) return;
      const course = courses.find(c => c.id === activeCourseId);
      const module = course?.modules?.find(m => m.id === activeModuleId);
      if (!course || !module) return;
      setIsLoadingContent(true);
      try {
          const questions = await generateQuizForModule(course.topic, module.title);
          setQuizQuestions(questions);
          setQuizAnswers(new Array(questions.length).fill(-1));
          setQuizSubmitted(false);
          setQuizActive(true);
      } catch (err) {
          console.error(err);
      } finally {
          setIsLoadingContent(false);
      }
  };

  const handleAssessmentComplete = (result: AssessmentResult) => {
      if (activeCourseId) {
          handleUpdateCourse(activeCourseId, { assessmentResult: result });
      }
  };

  const stopAudio = () => {
      if (currentAudioSource) {
          try { currentAudioSource.stop(); } catch(e) {}
          setCurrentAudioSource(null);
      }
      setIsPlayingAudio(false);
  };

  const renderCourseView = () => {
    const course = courses.find(c => c.id === activeCourseId);
    if (!course) return <div className="p-8 text-center text-slate-500">Course not found.</div>;

    const activeModule = course.modules?.find(m => m.id === activeModuleId);

    const handlePlayAudio = async () => {
        if (!moduleContent) return;
        
        if (isPlayingAudio) {
            stopAudio();
            return;
        }
        
        try {
            // Simple optimistic UI for audio start
            const buffer = await generateSpeech(moduleContent.substring(0, 1000)); // Limit length for demo
            if (buffer) {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const audioBuffer = await ctx.decodeAudioData(buffer);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.start(0);
                
                setAudioContext(ctx);
                setCurrentAudioSource(source);
                setIsPlayingAudio(true);
                
                source.onended = () => {
                    setIsPlayingAudio(false);
                    setCurrentAudioSource(null);
                };
            }
        } catch (e) {
            console.error("Audio playback failed", e);
            alert("Could not play audio.");
        }
    };

    return (
        <div className="flex h-full bg-white relative">
            {/* Sidebar for Modules */}
            <div className={`
                absolute md:static inset-y-0 left-0 z-20 w-80 bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-300 shadow-xl md:shadow-none
                ${showMobileModuleList ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-4 border-b border-slate-200 bg-white">
                    <button onClick={() => setView(AppView.DASHBOARD)} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-bold mb-4 transition-colors">
                        <ArrowLeft size={16}/> Back to Dashboard
                    </button>
                    <h2 className="font-bold text-slate-900 leading-tight mb-4">{course.title}</h2>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setCourseViewTab('MODULES')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${courseViewTab === 'MODULES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Modules
                        </button>
                        <button 
                            onClick={() => setCourseViewTab('ASSESSMENT')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${courseViewTab === 'ASSESSMENT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Assessment
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {course.modules?.map((module, idx) => (
                        <button
                            key={module.id}
                            onClick={() => handleSelectModule(module.id)}
                            className={`w-full text-left p-3 rounded-lg text-sm transition-all border ${
                                activeModuleId === module.id 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                                : 'bg-white border-transparent hover:bg-slate-100 text-slate-600'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                                    module.isCompleted 
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                    : activeModuleId === module.id 
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                    {module.isCompleted ? <Check size={12}/> : idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold line-clamp-2">{module.title}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 h-full overflow-y-auto relative bg-white scroll-smooth" id="module-content-area">
                {/* Mobile Toggle for Module List */}
                <button 
                    onClick={() => setShowMobileModuleList(!showMobileModuleList)}
                    className="md:hidden absolute top-4 left-4 z-10 bg-white p-2 rounded-full shadow-md border border-slate-200 text-slate-600"
                >
                    <Menu size={20} />
                </button>

                {courseViewTab === 'ASSESSMENT' ? (
                    <SkillsAssessment course={course} onComplete={handleAssessmentComplete} />
                ) : (
                    activeModule ? (
                        <div className={`max-w-4xl mx-auto p-6 md:p-12 pb-32 transition-all duration-500 ${focusMode ? 'max-w-5xl' : ''}`}>
                            {/* Module Header */}
                            <div className="mb-8">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Module {course.modules.findIndex(m => m.id === activeModuleId) + 1}</div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">{activeModule.title}</h1>
                                
                                {!focusMode && activeModule.imageUrl && (
                                    <div className="rounded-xl overflow-hidden mb-8 shadow-lg max-h-80 w-full bg-slate-100">
                                        <img src={activeModule.imageUrl} alt={activeModule.title} className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>

                            {/* Content or Quiz */}
                            {quizActive ? (
                                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold flex items-center gap-2"><Trophy className="text-amber-500"/> Knowledge Check</h2>
                                        <button onClick={() => setQuizActive(false)} className="text-sm text-slate-500 hover:text-slate-800 font-bold">Exit Quiz</button>
                                    </div>
                                    
                                    <div className="space-y-8">
                                        {quizQuestions.map((q, idx) => (
                                            <div key={idx} className="space-y-3">
                                                <p className="font-bold text-slate-800 text-lg">{idx+1}. {q.question}</p>
                                                <div className="space-y-2">
                                                    {q.options.map((opt, optIdx) => (
                                                        <button 
                                                            key={optIdx}
                                                            onClick={() => {
                                                                const newAnswers = [...quizAnswers];
                                                                newAnswers[idx] = optIdx;
                                                                setQuizAnswers(newAnswers);
                                                            }}
                                                            disabled={quizSubmitted}
                                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                                                quizSubmitted 
                                                                    ? (optIdx === q.correctAnswerIndex 
                                                                        ? 'bg-emerald-100 border-emerald-500 text-emerald-800' 
                                                                        : quizAnswers[idx] === optIdx 
                                                                            ? 'bg-red-100 border-red-500 text-red-800'
                                                                            : 'bg-white border-slate-200 opacity-50')
                                                                    : (quizAnswers[idx] === optIdx 
                                                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm'
                                                                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300')
                                                            }`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {!quizSubmitted && (
                                        <button 
                                            onClick={() => setQuizSubmitted(true)}
                                            disabled={quizAnswers.includes(-1)}
                                            className="mt-8 w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg"
                                        >
                                            Submit Answers
                                        </button>
                                    )}
                                    
                                    {quizSubmitted && (
                                        <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200 text-center shadow-lg animate-in zoom-in">
                                            <div className="text-3xl font-black text-slate-900 mb-2">
                                                {Math.round((quizAnswers.filter((a, i) => a === quizQuestions[i].correctAnswerIndex).length / quizQuestions.length) * 100)}%
                                            </div>
                                            <p className="text-slate-500 mb-6">Score</p>
                                            <button 
                                                onClick={() => { setQuizActive(false); handleMarkModuleComplete(); }}
                                                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                                            >
                                                Continue Module
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="prose prose-slate prose-lg max-w-none">
                                    {isLoadingContent ? (
                                        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                                            <Loader2 size={48} className="animate-spin mb-4 text-indigo-600"/>
                                            <p className="font-medium animate-pulse">Generating personalized content...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {isEditing ? (
                                                <div className="space-y-4">
                                                    <textarea 
                                                        value={moduleContent || ''} 
                                                        onChange={(e) => setModuleContent(e.target.value)}
                                                        className="w-full h-[600px] p-6 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm leading-relaxed"
                                                    />
                                                    <div className="flex gap-3 justify-end sticky bottom-4">
                                                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white text-slate-600 font-bold rounded-lg shadow-sm border border-slate-200">Cancel</button>
                                                        <button onClick={handleSaveContent} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md">Save Changes</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex flex-wrap justify-between items-center mb-8 gap-4 border-b border-slate-100 pb-4">
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => setFocusMode(!focusMode)} 
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${focusMode ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                                                            >
                                                                {focusMode ? <Minimize2 size={16}/> : <Maximize2 size={16}/>} {focusMode ? 'Exit Focus' : 'Focus Mode'}
                                                            </button>
                                                            <button 
                                                                onClick={handlePlayAudio}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isPlayingAudio ? 'bg-rose-50 text-rose-600 animate-pulse' : 'text-slate-500 hover:bg-slate-100'}`}
                                                            >
                                                                {isPlayingAudio ? <Loader2 className="animate-spin" size={16}/> : <Mic size={16}/>} {isPlayingAudio ? 'Playing...' : 'Listen'}
                                                            </button>
                                                        </div>
                                                        {showCreateTools && (
                                                            <div className="flex gap-2">
                                                                <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors"><Edit size={16}/> Edit</button>
                                                                <button onClick={handleRegenerateContent} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors"><RefreshCw size={16}/> Regenerate</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="animate-in fade-in duration-500">
                                                        {renderMarkdown(moduleContent || '', focusMode)}
                                                    </div>
                                                    
                                                    <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                                                        <button 
                                                            onClick={handleStartQuiz}
                                                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <HelpCircle size={20} /> Take Quiz
                                                        </button>
                                                        <button 
                                                            onClick={handleMarkModuleComplete}
                                                            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${activeModule.isCompleted ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800 hover:-translate-y-0.5'}`}
                                                        >
                                                            {activeModule.isCompleted ? <><CheckCircle size={20} /> Completed</> : <>Mark Complete <ArrowRight size={20} /></>}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <BookOpen size={32} className="opacity-50" />
                            </div>
                            <p className="font-medium text-lg text-slate-600">Select a module to start learning.</p>
                            <p className="text-sm mt-2">Choose from the sidebar to begin.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
  };

  const renderContent = () => {
    switch (view) {
      case AppView.LANDING:
        return <LandingPage onEnterApp={handleLogin} onNavigate={setView} />;
      case AppView.ABOUT:
        return <AboutUs onBack={() => setView(user ? AppView.DASHBOARD : AppView.LANDING)} />;
      case AppView.DASHBOARD:
        return <DashboardView 
            user={user}
            courses={courses}
            stats={stats}
            storageStatus={storageStatus}
            justPublishedCourse={justPublishedCourse}
            onClearPublished={() => setJustPublishedCourse(null)}
            onSelectCourse={handleSelectCourse}
            onNavigate={setView}
            onUpdateCourse={handleUpdateCourse}
            onEditCourse={handleEditCourse}
            onDeleteCourse={handleDeleteCourse}
            setCourseSearch={setCourseSearch}
            courseSearch={courseSearch}
            isFeedbackOpen={isFeedbackOpen}
            setIsFeedbackOpen={setIsFeedbackOpen}
            onSetCourseToEdit={setCourseToEdit}
        />;
      case AppView.COURSE_VIEW:
        return renderCourseView();
      case AppView.KNOWLEDGE_GRAPH:
        return <div className="p-8 h-full"><KnowledgeGraph courses={debouncedCourses} /></div>;
      case AppView.SIMULATION:
        return <SimulationView topic={courses.find(c => c.id === activeCourseId)?.topic || 'General Management'} user={user} onClose={() => setView(AppView.DASHBOARD)} />;
      case AppView.LIVE_TUTOR:
        const activeC = courses.find(c => c.id === activeCourseId);
        const activeContext = activeC?.modules?.map(m => `Module: ${m.title}\n${m.content || m.description}`).join('\n\n');
        return <LiveTutor topic={activeC?.topic} contextContent={activeContext} onClose={() => setView(AppView.DASHBOARD)} />;
      case AppView.PATHFINDER:
        return <PathfinderView user={user} onClose={() => setView(AppView.DASHBOARD)} />;
      case AppView.MEETING_PREP:
        return <MeetingPrepView onClose={() => setView(AppView.DASHBOARD)} />;
      case AppView.COHORT_PROGRAM:
        // Ensure access control for route
        if (showManageTools) return <CohortProgramView />;
        return <DashboardView user={user} courses={courses} stats={stats} storageStatus={storageStatus} justPublishedCourse={justPublishedCourse} onClearPublished={() => setJustPublishedCourse(null)} onSelectCourse={handleSelectCourse} onNavigate={setView} onUpdateCourse={handleUpdateCourse} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} setCourseSearch={setCourseSearch} courseSearch={courseSearch} isFeedbackOpen={isFeedbackOpen} setIsFeedbackOpen={setIsFeedbackOpen} onSetCourseToEdit={setCourseToEdit} />;
      case AppView.IMPACT:
        // Ensure access control for route
        if (showManageTools) return <ImpactDashboard />;
        return <DashboardView user={user} courses={courses} stats={stats} storageStatus={storageStatus} justPublishedCourse={justPublishedCourse} onClearPublished={() => setJustPublishedCourse(null)} onSelectCourse={handleSelectCourse} onNavigate={setView} onUpdateCourse={handleUpdateCourse} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} setCourseSearch={setCourseSearch} courseSearch={courseSearch} isFeedbackOpen={isFeedbackOpen} setIsFeedbackOpen={setIsFeedbackOpen} onSetCourseToEdit={setCourseToEdit} />;
      case AppView.SUBSCRIPTION:
        return <SubscriptionPage onSelectTier={handleUpgradeUser} />;
      case AppView.CREATOR_STUDIO:
        // Ensure access control for route
        if (showCreateTools) {
            return <CreatorStudio 
                onPublishCourse={addCourse} 
                courses={courses} 
                user={user} 
                onNavigateToDashboard={() => { 
                    if(justPublishedCourse) {
                        setActiveCourseId(justPublishedCourse.id);
                        setView(AppView.COURSE_VIEW);
                    } else {
                        setView(AppView.DASHBOARD);
                    }
                }}
                courseToEdit={courseToEdit}
                onClearEditMode={() => setCourseToEdit(null)}
            />;
        }
        // Fallback to Dashboard
        return <DashboardView user={user} courses={courses} stats={stats} storageStatus={storageStatus} justPublishedCourse={justPublishedCourse} onClearPublished={() => setJustPublishedCourse(null)} onSelectCourse={handleSelectCourse} onNavigate={setView} onUpdateCourse={handleUpdateCourse} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} setCourseSearch={setCourseSearch} courseSearch={courseSearch} isFeedbackOpen={isFeedbackOpen} setIsFeedbackOpen={setIsFeedbackOpen} onSetCourseToEdit={setCourseToEdit} />;
      case AppView.TWIN_MANAGER:
        if (showCreateTools) return <TwinManager />;
        return <DashboardView user={user} courses={courses} stats={stats} storageStatus={storageStatus} justPublishedCourse={justPublishedCourse} onClearPublished={() => setJustPublishedCourse(null)} onSelectCourse={handleSelectCourse} onNavigate={setView} onUpdateCourse={handleUpdateCourse} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} setCourseSearch={setCourseSearch} courseSearch={courseSearch} isFeedbackOpen={isFeedbackOpen} setIsFeedbackOpen={setIsFeedbackOpen} onSetCourseToEdit={setCourseToEdit} />;
      case AppView.AFFILIATE:
        return <AffiliateView />;
      case AppView.ADMIN_PANEL:
        if (showSystemTools) return <SuperAdminDashboard courses={courses} onUpdateCourse={handleUpdateCourse} onDeleteCourse={handleDeleteCourse} />;
        return <DashboardView user={user} courses={courses} stats={stats} storageStatus={storageStatus} justPublishedCourse={justPublishedCourse} onClearPublished={() => setJustPublishedCourse(null)} onSelectCourse={handleSelectCourse} onNavigate={setView} onUpdateCourse={handleUpdateCourse} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} setCourseSearch={setCourseSearch} courseSearch={courseSearch} isFeedbackOpen={isFeedbackOpen} setIsFeedbackOpen={setIsFeedbackOpen} onSetCourseToEdit={setCourseToEdit} />;
      case AppView.TEAM_MANAGEMENT:
        if (showManageTools) return <TeamManagement />;
        return <DashboardView user={user} courses={courses} stats={stats} storageStatus={storageStatus} justPublishedCourse={justPublishedCourse} onClearPublished={() => setJustPublishedCourse(null)} onSelectCourse={handleSelectCourse} onNavigate={setView} onUpdateCourse={handleUpdateCourse} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} setCourseSearch={setCourseSearch} courseSearch={courseSearch} isFeedbackOpen={isFeedbackOpen} setIsFeedbackOpen={setIsFeedbackOpen} onSetCourseToEdit={setCourseToEdit} />;
      case AppView.EXTERNAL_ASSESSMENT: 
        if (showManageTools) return <ExternalAssessmentView user={user} />;
        return <DashboardView user={user} courses={courses} stats={stats} storageStatus={storageStatus} justPublishedCourse={justPublishedCourse} onClearPublished={() => setJustPublishedCourse(null)} onSelectCourse={handleSelectCourse} onNavigate={setView} onUpdateCourse={handleUpdateCourse} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} setCourseSearch={setCourseSearch} courseSearch={courseSearch} isFeedbackOpen={isFeedbackOpen} setIsFeedbackOpen={setIsFeedbackOpen} onSetCourseToEdit={setCourseToEdit} />;
      case AppView.SETTINGS:
        return <SettingsView user={user} onUpdateUser={handleUpdateUser} />;
      case AppView.PUBLIC_AGENT:
        return <PublicAgentRenderer twinId={embedTwinId || ''} />;
      default:
        return <DashboardView 
            user={user}
            courses={courses}
            stats={stats}
            storageStatus={storageStatus}
            justPublishedCourse={justPublishedCourse}
            onClearPublished={() => setJustPublishedCourse(null)}
            onSelectCourse={handleSelectCourse}
            onNavigate={setView}
            onUpdateCourse={handleUpdateCourse}
            onEditCourse={handleEditCourse}
            onDeleteCourse={handleDeleteCourse}
            setCourseSearch={setCourseSearch}
            courseSearch={courseSearch}
            isFeedbackOpen={isFeedbackOpen}
            setIsFeedbackOpen={setIsFeedbackOpen}
            onSetCourseToEdit={setCourseToEdit}
        />;
    }
  };

  // Full Screen Views check
  const isLanding = view === AppView.LANDING;
  const isPublic = view === AppView.PUBLIC_AGENT;
  const isAbout = view === AppView.ABOUT;

  if (isLanding || isPublic || isAbout) {
    return (
        <div className="h-full w-full bg-slate-50 overflow-hidden">
            {renderContent()}
            {showApiKeyModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4"><Key size={32} className="text-indigo-600" /></div>
                            <h2 className="text-2xl font-bold text-slate-900">Enter API Key</h2>
                            <p className="text-slate-500 mt-2 text-sm">To enable the full AI experience, please provide your Google Gemini API Key. It will be stored locally on your device.</p>
                        </div>
                        <form onSubmit={handleSaveApiKey} className="space-y-4">
                            <input type="password" value={customApiKey} onChange={(e) => setCustomApiKey(e.target.value)} placeholder="AIzaSy..." className={`w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 ${keyValidationStatus === 'ERROR' ? 'border-red-500' : 'border-slate-300'}`} />
                            {keyValidationStatus === 'ERROR' && <p className="text-red-500 text-xs">{keyValidationError}</p>}
                            <button type="submit" disabled={!customApiKey || keyValidationStatus === 'VALIDATING'} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">{keyValidationStatus === 'VALIDATING' ? <Loader2 className="animate-spin" /> : 'Validate & Enter'}</button>
                        </form>
                        <p className="text-center mt-4 text-xs text-slate-400"><a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline hover:text-indigo-500">Get a Gemini API Key</a></p>
                    </div>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden text-slate-900 font-sans selection:bg-indigo-500 selection:text-white relative">
        {/* Storage Notification Toast */}
        {storageNotification && (
            <div className="fixed top-4 right-4 z-[60] bg-white border-l-4 border-amber-500 p-4 rounded-lg shadow-2xl animate-in slide-in-from-right-10 flex items-center gap-3 max-w-sm">
                <AlertTriangle className="text-amber-500 shrink-0" />
                <p className="text-sm font-medium text-slate-700">{storageNotification}</p>
                <button onClick={() => setStorageNotification(null)} className="ml-auto text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />}
        
        {/* Sidebar */}
        <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out ${isMobileSidebarOpen || isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20 lg:w-72'}`}>
            <div className="p-6 flex items-center gap-3 h-20 border-b border-slate-800">
                <Logo className="w-8 h-8 shrink-0" showText={isSidebarOpen} lightText={true} />
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
                {/* Learn Group */}
                <NavItem icon={<LayoutDashboard size={18}/>} label="Dashboard" active={view === AppView.DASHBOARD} expanded={isSidebarOpen} onClick={() => setView(AppView.DASHBOARD)} />
                <NavItem icon={<BookOpen size={18}/>} label="My Courses" active={view === AppView.COURSE_VIEW} expanded={isSidebarOpen} onClick={() => { setActiveCourseId(courses[0]?.id); setView(AppView.COURSE_VIEW); }} />
                <NavItem icon={<Network size={18}/>} label="Knowledge Graph" active={view === AppView.KNOWLEDGE_GRAPH} expanded={isSidebarOpen} onClick={() => setView(AppView.KNOWLEDGE_GRAPH)} />
                
                {/* Practice Group */}
                <NavSectionHeader title="Experience" expanded={isSidebarOpen} />
                <NavItem icon={<Mic size={18}/>} label="Live Tutor" active={view === AppView.LIVE_TUTOR} expanded={isSidebarOpen} onClick={() => setView(AppView.LIVE_TUTOR)} />
                <NavItem icon={<Briefcase size={18}/>} label="Scenario Lab" active={view === AppView.SIMULATION} expanded={isSidebarOpen} onClick={() => setView(AppView.SIMULATION)} />
                <NavItem icon={<MapIcon size={18}/>} label="Career Pathfinder" active={view === AppView.PATHFINDER} expanded={isSidebarOpen} onClick={() => setView(AppView.PATHFINDER)} />
                <NavItem icon={<ClipboardCheck size={18}/>} label="Meeting Prep" active={view === AppView.MEETING_PREP} expanded={isSidebarOpen} onClick={() => setView(AppView.MEETING_PREP)} />

                {/* Create Group (Expert/Creator/Admin) */}
                {showCreateTools && (
                    <>
                        <NavSectionHeader title="Create" expanded={isSidebarOpen} />
                        <NavItem icon={<Sparkles size={18}/>} label="Course Builder" active={view === AppView.CREATOR_STUDIO} expanded={isSidebarOpen} onClick={() => setView(AppView.CREATOR_STUDIO)} />
                        <NavItem icon={<Bot size={18}/>} label="Twin Lab" active={view === AppView.TWIN_MANAGER} expanded={isSidebarOpen} onClick={() => setView(AppView.TWIN_MANAGER)} />
                    </>
                )}

                {/* Enterprise Group (Company Admin/Super Admin) */}
                {showManageTools && (
                    <>
                        <NavSectionHeader title="Manage" expanded={isSidebarOpen} />
                        <NavItem icon={<TrendingUp size={18}/>} label="BICE Impact" active={view === AppView.IMPACT} expanded={isSidebarOpen} onClick={() => setView(AppView.IMPACT)} />
                        <NavItem icon={<Users size={18}/>} label="Workforce" active={view === AppView.TEAM_MANAGEMENT} expanded={isSidebarOpen} onClick={() => setView(AppView.TEAM_MANAGEMENT)} />
                        <NavItem icon={<Users size={18}/>} label="Cohorts" active={view === AppView.COHORT_PROGRAM} expanded={isSidebarOpen} onClick={() => setView(AppView.COHORT_PROGRAM)} />
                        <NavItem icon={<ClipboardCheck size={18}/>} label="Assessments" active={view === AppView.EXTERNAL_ASSESSMENT} expanded={isSidebarOpen} onClick={() => setView(AppView.EXTERNAL_ASSESSMENT)} />
                    </>
                )}

                {/* System Group (Super Admin Only) */}
                {showSystemTools && (
                    <>
                        <NavSectionHeader title="System" expanded={isSidebarOpen} />
                        <NavItem icon={<ShieldAlert size={18}/>} label="Admin Console" active={view === AppView.ADMIN_PANEL} expanded={isSidebarOpen} onClick={() => setView(AppView.ADMIN_PANEL)} />
                    </>
                )}
            </div>

            <div className="p-3 border-t border-slate-800 flex flex-col gap-1">
                {isSidebarOpen && user && (
                    <div className="mb-2 px-3 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        Role: {isSuperAdmin ? 'Super Admin' : isCompanyAdmin ? 'Company Admin' : isExpert ? 'Expert Account' : 'Learner'}
                    </div>
                )}
                <NavItem icon={<Gift size={18}/>} label="Rewards" active={view === AppView.AFFILIATE} expanded={isSidebarOpen} onClick={() => setView(AppView.AFFILIATE)} />
                <NavItem icon={<Settings size={18}/>} label="Settings" active={view === AppView.SETTINGS} expanded={isSidebarOpen} onClick={() => setView(AppView.SETTINGS)} />
                <div className="pt-2">
                    <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group ${!isSidebarOpen ? 'justify-center' : ''}`} title="Logout">
                        <LogOut size={18} />
                        {isSidebarOpen && <span className="font-medium text-sm">Log Out</span>}
                    </button>
                </div>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-full overflow-hidden flex flex-col relative w-full">
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-30 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsMobileSidebarOpen(true)} className="text-slate-600"><Menu size={24}/></button>
                    <Logo className="w-8 h-8" showText={false} />
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <img src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="User" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 relative">
                {renderContent()}
            </div>

            {/* Feedback Button */}
            <button 
                onClick={() => setIsFeedbackOpen(true)}
                className="fixed bottom-6 right-20 md:right-8 z-40 bg-white p-3 rounded-full shadow-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all hover:-translate-y-1 group"
                title="Send Feedback"
            >
                <LifeBuoy size={20} />
            </button>
            
            <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} user={user} />
        </main>
    </div>
  );
};
