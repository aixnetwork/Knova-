
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parsePathname, pathFor, isPublicPath, type RouteParams } from './routes';
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
  FileText,
  PlayCircle,
  Plus,
  Trash2
} from 'lucide-react';

import { Course, Module, AppView, QuizQuestion, UserStats, UserProfile, UserRole, SubscriptionTier, MicroLesson, CourseStatus, AssessmentResult, CourseResource, CourseResourceType } from './types';
import { generateModuleContent, streamModuleContent, generateQuizForModule, generateConceptImage, generateSpeech, setSessionUserApiKey, clearSessionUserApiKey, resetClient, LEGACY_LOCAL_STORAGE_KEY, validateApiKey } from './services/geminiService';
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
import { CourseCard } from './components/CourseCard';
import { DashboardView } from './components/DashboardView';
import { MeetingPrepView } from './components/MeetingPrepView';
import { CohortProgramView } from './components/CohortProgramView';
import { ExternalAssessmentView } from './components/ExternalAssessmentView';
import { FeedbackModal } from './components/FeedbackModal';
import { TwinManager } from './components/TwinManager';
import { authApi, clearToken, coursesApi, enrollmentsApi, type AuthUser } from './services/api';
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
// Exclude demo/mock courses from being loaded or persisted.
const isMockOrDemoCourseId = (id: string) => !id || id.startsWith('mock-');

const normalizeCourseVideoResources = (items: unknown): CourseResource[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, idx) => {
      const row = item as Record<string, unknown>;
      if (row.type === 'MARKETING') return null;
      const sourceUrl = typeof row.sourceUrl === 'string' ? row.sourceUrl : '';
      const type = typeof row.type === 'string' ? row.type : '';
      const embedUrl = typeof row.embedUrl === 'string' ? row.embedUrl : undefined;
      const videoId = typeof row.videoId === 'string' ? row.videoId : undefined;
      if (!sourceUrl) return null;
      return {
        id: typeof row.id === 'string' ? row.id : `res-${idx}`,
        title: typeof row.title === 'string' ? row.title : `Video ${idx + 1}`,
        type: type === 'YOUTUBE' || type === 'PDF' || type === 'LINK' ? type : 'LINK',
        sourceUrl,
        embedUrl,
        videoId,
      };
    })
    .filter(Boolean) as CourseResource[];
};

const normalizeMarketingYoutubeResources = (items: unknown): { title: string; channelName: string; searchQuery: string; reason: string }[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const row = item as Record<string, unknown>;
      if (row.type === 'EMBED') return null;
      const title = typeof row.title === 'string' ? row.title : '';
      const channelName = typeof row.channelName === 'string' ? row.channelName : '';
      const searchQuery = typeof row.searchQuery === 'string' ? row.searchQuery : '';
      const reason = typeof row.reason === 'string' ? row.reason : '';
      if (!title || !channelName || !searchQuery || !reason) return null;
      return { title, channelName, searchQuery, reason };
    })
    .filter(Boolean) as { title: string; channelName: string; searchQuery: string; reason: string }[];
};

const getYoutubeVideoId = (rawUrl: string) => {
  const input = (rawUrl || '').trim();
  if (!input) return null;
  try {
    const parsed = new URL(input);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').trim();
      return id || null;
    }
    if (host.includes('youtube.com')) {
      const byQuery = parsed.searchParams.get('v');
      if (byQuery) return byQuery;
      const parts = parsed.pathname.split('/').filter(Boolean);
      const embedIdx = parts.findIndex((p) => p === 'embed' || p === 'shorts');
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    }
    return null;
  } catch {
    return null;
  }
};

const toEmbedYoutubeUrl = (videoId: string) => `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;

const isDirectVideoFileUrl = (url: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test((url || '').trim());

const getVimeoVideoId = (rawUrl: string) => {
  const input = (rawUrl || '').trim();
  if (!input) return null;
  try {
    const parsed = new URL(input);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes('vimeo.com')) return null;
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (!parts.length) return null;
    const candidates = parts.filter((p) => /^\d+$/.test(p));
    return candidates.length ? candidates[candidates.length - 1] : null;
  } catch {
    return null;
  }
};

const mapApiCourseToCourse = (c: {
  id: string;
  title?: string;
  topic: string;
  description: string;
  status?: string;
  modules?: { id: string; name: string; description?: string | null; keyConcepts: string[]; content?: string | null }[];
  assets?: {
    flyerUrl?: string | null;
    podcastUrl?: string | null;
    salesSlides?: { title: string; bullets: string[]; speakerNotes: string }[] | null;
    infographic?: { title: string; content: string; iconSuggestion: string; colorTheme: string }[] | null;
    youtubeResources?: unknown[] | null;
  } | null;
}): Course => ({
  id: c.id,
  title: c.title ?? c.topic,
  topic: c.topic,
  description: c.description || '',
  progress: 0,
  createdAt: Date.now(),
  modules: (c.modules || []).map((m) => ({
    id: m.id,
    title: m.name,
    description: m.description ?? undefined,
    keyConcepts: m.keyConcepts || [],
    content: m.content ?? undefined,
    isCompleted: false,
  })),
  status: c.status === 'PUBLISHED' ? CourseStatus.PUBLISHED : CourseStatus.DRAFT,
  thumbnailUrl: c.assets?.flyerUrl ?? undefined,
  savedAssets: c.assets ? {
    flyerUrl: c.assets.flyerUrl ?? undefined,
    podcastUrl: c.assets.podcastUrl ?? undefined,
    videoResources: normalizeCourseVideoResources(c.assets.youtubeResources),
    marketingData: c.assets.salesSlides || c.assets.infographic || c.assets.youtubeResources ? {
      slides: Array.isArray(c.assets.salesSlides) ? c.assets.salesSlides : [],
      infographic: Array.isArray(c.assets.infographic) ? c.assets.infographic : [],
      youtubeResources: normalizeMarketingYoutubeResources(c.assets.youtubeResources),
      generatedAt: Date.now(),
    } : undefined,
  } : undefined,
});

// --- Persistence Helpers with Quota Safety ---
const safePersistCourse = (course: Course) => {
  if (isBackendCourseId(course.id)) return; // Backend courses are stored in DB, not localStorage
  if (isMockOrDemoCourseId(course.id)) return; // Don't persist demo/mock courses
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
    const ids = courses.filter(c => !isBackendCourseId(c.id) && !isMockOrDemoCourseId(c.id)).map(c => c.id);
    localStorage.setItem('knovatwin_course_index', JSON.stringify(ids));
  } catch (e) {
    console.error("Failed to save index:", e);
  }
};

async function bootstrapGeminiSession(authUser: AuthUser): Promise<UserProfile> {
  const isGodMode = authUser.id?.startsWith('user-godmode');
  clearSessionUserApiKey();
  resetClient();

  if (isGodMode) {
    const legacy = localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
    if (legacy?.trim()) setSessionUserApiKey(legacy.trim());
    resetClient();
    return mapAuthUserToProfile({
      ...authUser,
      hasGeminiKey: !!legacy?.trim(),
    });
  }

  let hasKey = authUser.hasGeminiKey === true;
  let nextAuth: AuthUser = { ...authUser };
  if (!hasKey) {
    const legacy = localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
    if (legacy?.trim()) {
      try {
        await authApi.saveMyGeminiKey(legacy.trim());
        localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
        hasKey = true;
        nextAuth = { ...nextAuth, hasGeminiKey: true };
      } catch {
        /* ignore */
      }
    }
  }

  if (hasKey) {
    try {
      const { data } = await authApi.getMyGeminiKey();
      if (data?.apiKey) setSessionUserApiKey(data.apiKey);
      else hasKey = false;
    } catch {
      hasKey = false;
    }
  }

  if (!hasKey) clearSessionUserApiKey();
  resetClient();
  return mapAuthUserToProfile({ ...nextAuth, hasGeminiKey: hasKey });
}

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
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden text-sm ${active
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
  const location = useLocation();
  const navigate = useNavigate();
  const [embedTwinId, setEmbedTwinId] = useState<string | null>(null);
  const [routeParams, setRouteParams] = useState<{ assessmentId?: string | null; teamId?: string | null }>({});
  const navigateToView = (view: AppView, params?: Partial<RouteParams>) => navigate(pathFor(view, params));

  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [courses, setCourses] = useState<Course[]>([]);
  const debouncedCourses = useDebounce(courses, 2000);

  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [courseViewTab, setCourseViewTab] = useState<'MODULES' | 'ASSESSMENT' | 'RESOURCES'>('MODULES');
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const [justPublishedCourse, setJustPublishedCourse] = useState<Course | null>(null);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMobileModuleList, setShowMobileModuleList] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [geminiKeyDraft, setGeminiKeyDraft] = useState('');
  const [geminiKeyError, setGeminiKeyError] = useState('');
  const [isValidatingGeminiKey, setIsValidatingGeminiKey] = useState(false);

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
  const [showSavedAssetsModal, setShowSavedAssetsModal] = useState(false);
  const [showCourseResourcesModal, setShowCourseResourcesModal] = useState(false);
  const [resourceInputType, setResourceInputType] = useState<CourseResourceType>('YOUTUBE');
  const [resourceInputTitle, setResourceInputTitle] = useState('');
  const [resourceInputUrl, setResourceInputUrl] = useState('');
  const [isSavingResources, setIsSavingResources] = useState(false);

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
      .then(async ({ data }) => {
        const profile = await bootstrapGeminiSession(data);
        setUser(profile);
        const p = location.pathname.replace(/\/$/, '') || '/';
        if (p === '/' || p === '/login') navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        clearToken();
        setUser(null);
        if (!isPublicPath(location.pathname)) navigate('/', { replace: true });
      })
      .finally(() => setSessionChecked(true));
  }, []);

  // Legacy embed: ?view=public_agent&twinId=xyz -> /embed/xyz
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('view') === 'public_agent' && params.get('twinId')) {
      navigate(pathFor(AppView.PUBLIC_AGENT, { embedTwinId: params.get('twinId')! }), { replace: true });
    }
  }, []);

  // Sync URL pathname to view and params (after session is resolved)
  useEffect(() => {
    if (!sessionChecked) return;
    const pathname = location.pathname;
    if (!user && !isPublicPath(pathname)) {
      navigate('/', { replace: true });
      return;
    }
    if (user && (pathname === '/' || pathname === '/login')) {
      navigate('/dashboard', { replace: true });
      return;
    }
    const parsed = parsePathname(pathname);
    setView(parsed.view); // keep in sync with URL
    setActiveCourseId(parsed.courseId ?? null);
    setActiveModuleId(parsed.moduleId ?? null);
    if (parsed.embedTwinId != null) setEmbedTwinId(parsed.embedTwinId);
    setRouteParams({ assessmentId: parsed.assessmentId ?? null, teamId: parsed.teamId ?? null });
  }, [location.pathname, sessionChecked, user, navigate]);

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
    const onAppToast = (e: Event) => {
      const msg = (e as CustomEvent<{ message?: string }>).detail?.message;
      if (msg) {
        setStorageNotification(msg);
        setTimeout(() => setStorageNotification(null), 5000);
      }
    };
    window.addEventListener('knovatwin-app-toast', onAppToast);
    return () => window.removeEventListener('knovatwin-app-toast', onAppToast);
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

  // LOAD COURSES: localStorage first (user drafts), then API. Exclude demo/mock courses.
  useEffect(() => {
    const indexStr = localStorage.getItem('knovatwin_course_index');
    let loadedCourses: Course[] = [];
    if (indexStr) {
      try {
        const ids = JSON.parse(indexStr);
        if (Array.isArray(ids)) {
          const validIds = ids.filter((id: string) => !isMockOrDemoCourseId(id));
          loadedCourses = validIds.map((id: string) => {
            const item = localStorage.getItem(`knovatwin_course_${id}`);
            return item ? JSON.parse(item) : null;
          }).filter((c: any) => c && c.id && !isMockOrDemoCourseId(c.id));
          // One-time cleanup: remove demo/mock course entries and update index
          const mockIds = ids.filter((id: string) => isMockOrDemoCourseId(id));
          if (mockIds.length > 0) {
            mockIds.forEach((id: string) => localStorage.removeItem(`knovatwin_course_${id}`));
            localStorage.setItem('knovatwin_course_index', JSON.stringify(validIds));
          }
        }
      } catch (e) {
        console.error("Index load failed", e);
      }
    }
    setCourses(loadedCourses);

    coursesApi.list()
      .then(({ data }) => {
        if (!Array.isArray(data)) return;
        const apiCourses: Course[] = data.map(mapApiCourseToCourse);
        setCourses(prev => {
          const map = new Map(prev.filter(c => !isMockOrDemoCourseId(c.id)).map(c => [c.id, c]));
          apiCourses.forEach(ac => {
            const existing = map.get(ac.id);
            if (!existing) {
              map.set(ac.id, ac);
              return;
            }

            map.set(ac.id, {
              ...existing,
              ...ac,
              progress: existing.progress ?? ac.progress,
              createdAt: existing.createdAt || ac.createdAt,
              modules: ac.modules.map((module) => {
                const prevModule = existing.modules?.find((m) => m.id === module.id);
                return {
                  ...module,
                  isCompleted: prevModule?.isCompleted ?? module.isCompleted,
                  imageUrl: prevModule?.imageUrl ?? module.imageUrl,
                };
              }),
            });
          });
          return Array.from(map.values());
        });
      })
      .catch(() => { });
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
    // Hard gate: if the account doesn't have a saved Gemini key, block the app until they validate + save one.
    if (user && user.hasGeminiKey !== true) {
      setShowApiKeyModal(true);
    } else {
      setShowApiKeyModal(false);
      setGeminiKeyDraft('');
      setGeminiKeyError('');
      setIsValidatingGeminiKey(false);
    }
  }, [user]);

  const handleValidateAndSaveGeminiKey = async () => {
    if (!user) return;
    const key = geminiKeyDraft.trim();
    if (!key) return;
    setIsValidatingGeminiKey(true);
    setGeminiKeyError('');
    try {
      const check = await validateApiKey(key);
      if (!check.valid) {
        setGeminiKeyError(check.error || 'Invalid key. Please try again.');
        return;
      }

      const isGod = user.id?.startsWith('user-godmode');
      if (isGod) {
        localStorage.setItem(LEGACY_LOCAL_STORAGE_KEY, key);
        setSessionUserApiKey(key);
        resetClient();
        setUser(prev => (prev ? { ...prev, hasGeminiKey: true } : null));
        return;
      }

      await authApi.saveMyGeminiKey(key);
      setSessionUserApiKey(key);
      resetClient();
      localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
      setUser(prev => (prev ? { ...prev, hasGeminiKey: true } : null));
    } catch (e: any) {
      const msg = String(e?.message || '');
      setGeminiKeyError(msg || 'Could not validate this key. Please try again.');
    } finally {
      setIsValidatingGeminiKey(false);
    }
  };

  const handleLogout = () => {
    clearSessionUserApiKey();
    resetClient();
    setUser(null);
    setGeminiKeyDraft('');
    setGeminiKeyError('');
    setIsValidatingGeminiKey(false);
    clearToken();
    localStorage.removeItem('knovatwin_user_session');
    navigateToView(AppView.LANDING);
  };

  const handleLogin = async (authUser: AuthUser) => {
    const profile = await bootstrapGeminiSession(authUser);
    setUser(profile);
    navigateToView(AppView.DASHBOARD);
  };

  const handleUpdateUser = (updates: Partial<UserProfile>) => {
    setUser(prev => prev ? ({ ...prev, ...updates }) : null);
  };

  const handleUpgradeUser = (newTier: SubscriptionTier) => {
    if (user) {
      const updatedUser = { ...user, tier: newTier };
      if (newTier === SubscriptionTier.EXPERT) {
        updatedUser.role = UserRole.FACILITATOR;
      }
      setUser(updatedUser);
      navigateToView(AppView.DASHBOARD);
      alert(`Success! You have been upgraded to the ${newTier} plan.`);
    }
  };

  const addCourse = async (course: Course): Promise<Course> => {
    if (!course.modules) course.modules = [];
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
    try {
      const { data } = await coursesApi.create({
        title: courseWithTimestamp.title || courseWithTimestamp.topic || 'Untitled',
        topic: courseWithTimestamp.topic || courseWithTimestamp.title || 'Untitled',
        description: courseWithTimestamp.description || '',
        modules: (courseWithTimestamp.modules || []).map(m => ({
          name: m.title,
          description: m.description ?? undefined,
          keyConcepts: m.keyConcepts || [],
          content: m.content ?? undefined
        })),
        status: status === CourseStatus.PUBLISHED ? 'PUBLISHED' : 'DRAFT'
      });
      const apiCourse: Course = mapApiCourseToCourse(data);
      setCourses(prev => {
        const next = prev.filter(c => c.id !== tempId);
        const map = new Map(next.map(c => [c.id, c]));
        map.set(apiCourse.id, apiCourse);
        try { localStorage.removeItem(`knovatwin_course_${tempId}`); } catch (_) { }
        persistIndexToStorage(Array.from(map.values()));
        return Array.from(map.values());
      });
      if (status === CourseStatus.PUBLISHED) setJustPublishedCourse(apiCourse);
      setCourseSearch('');
      return apiCourse;
    } catch {
      // Keep course in state and localStorage if API fails
      setCourseSearch('');
      return courseWithTimestamp;
    }
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
      }).catch(() => { });
    }
  };

  const handleEditCourse = async (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      if (isBackendCourseId(courseId)) {
        try {
          const { data } = await coursesApi.getById(courseId);
          setCourseToEdit(mapApiCourseToCourse(data));
        } catch {
          setCourseToEdit(course);
        }
      } else {
        setCourseToEdit(course);
      }
      navigateToView(AppView.CREATOR_STUDIO);
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    const isBackend = isBackendCourseId(courseId);
    if (isBackend) {
      coursesApi.delete(courseId).then(() => {
        setCourses(prev => {
          const remaining = prev.filter(c => c.id !== courseId);
          try { persistIndexToStorage(remaining); } catch (_) { }
          return remaining;
        });
        if (activeCourseId === courseId) {
          setActiveCourseId(null);
          navigateToView(AppView.DASHBOARD);
        }
      }).catch((_e) => {
        alert('Failed to delete course. You may only delete courses you created.');
      });
      return;
    }
    const updatedCourses = courses.filter(c => c.id !== courseId);
    setCourses(updatedCourses);
    try {
      localStorage.removeItem(`knovatwin_course_${courseId}`);
      persistIndexToStorage(updatedCourses);
    } catch (e) {
      console.error("Delete persistence failed", e);
    }
    if (activeCourseId === courseId) {
      setActiveCourseId(null);
      navigateToView(AppView.DASHBOARD);
    }
  };

  const handleSelectCourse = async (courseId: string) => {
    let course = courses.find(c => c.id === courseId);
    if (!course) return;
    setActiveCourseId(courseId);
    if (isBackendCourseId(courseId)) {
      try {
        const { data } = await coursesApi.getById(courseId);
        const freshCourse = mapApiCourseToCourse(data);
        course = freshCourse;
        setCourses(prev => prev.map(c => c.id === courseId ? {
          ...freshCourse,
          progress: c.progress,
          modules: freshCourse.modules.map((m) => {
            const prevModule = c.modules.find(pm => pm.id === m.id);
            return { ...m, isCompleted: prevModule?.isCompleted ?? false };
          }),
        } : c));
      } catch {
        // Fall back to the existing client state if the refresh fails.
      }
      enrollmentsApi.enroll(courseId).catch(() => { });
      enrollmentsApi.getCompletedModules(courseId).then(({ data }) => {
        const ids = new Set(data.moduleIds || []);
        if (ids.size > 0) {
          setCourses(prev => prev.map(c => c.id === courseId ? { ...c, modules: c.modules?.map(m => ({ ...m, isCompleted: ids.has(m.id) })) || [] } : c));
        }
      }).catch(() => { });
    }
    const firstModule = course.modules?.find(m => !m.isCompleted) || course.modules?.[0];
    if (!firstModule) {
      setActiveModuleId(null);
      setModuleContent(null);
    }
    setModuleTopic('');
    setQuizActive(false);
    navigateToView(AppView.COURSE_VIEW, firstModule ? { courseId, moduleId: firstModule.id } : { courseId });
    setCourseViewTab('MODULES');
    setSelectedResourceId(null);
    setFocusMode(false);
    setIsEditing(false);
    setCourseToEdit(null);
  };

  const handleSelectModuleNav = (moduleId: string, courseId: string) => {
    navigateToView(AppView.COURSE_VIEW, { courseId, moduleId });
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

    // Saved courses (from DB): never call Gemini — use only stored data.
    if (module.content) {
      setModuleContent(module.content);
      setIsLoadingContent(false);
    } else if (isBackendCourseId(cId)) {
      setModuleContent(module.description || 'No content available for this module.');
      setIsLoadingContent(false);
    } else {
      setIsLoadingContent(true);
      setModuleContent('');
      try {
        const finalContent = await streamModuleContent(course.topic, module, (chunk) => {
          setModuleContent(chunk);
          if (chunk.length > 20) setIsLoadingContent(false);
        });
        updateModuleInState(cId, moduleId, { content: finalContent });
        setModuleContent(finalContent);
      } catch (error) {
        setModuleContent("Error generating content. Please try again.");
      } finally {
        setIsLoadingContent(false);
      }
    }

    // Don't call Gemini for images when opening a saved (DB) course.
    if (!module.imageUrl && !isBackendCourseId(cId)) {
      setIsLoadingImage(true);
      generateConceptImage(`${module.title} - ${module.keyConcepts?.[0] || 'Concept'}`).then(url => {
        if (url) updateModuleInState(cId, moduleId, { imageUrl: url });
      }).finally(() => setIsLoadingImage(false));
    }
  };

  const handleSelectModuleRef = useRef(handleSelectModule);
  handleSelectModuleRef.current = handleSelectModule;
  useEffect(() => {
    if (view !== AppView.COURSE_VIEW || !activeCourseId || !activeModuleId) return;
    const course = courses.find(c => c.id === activeCourseId);
    const module = course?.modules?.find(m => m.id === activeModuleId);
    if (course && module) handleSelectModuleRef.current(activeModuleId, activeCourseId);
  }, [view, activeCourseId, activeModuleId, courses]);

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
        if (chunk.length > 20) setIsLoadingContent(false);
      });
      updateModuleInState(activeCourseId, activeModuleId, { content });
      if (isBackendCourseId(activeCourseId)) {
        coursesApi.updateModuleContent(activeCourseId, activeModuleId, { content }).catch(() => { });
      }
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
    if (isBackendCourseId(activeCourseId)) {
      coursesApi.updateModuleContent(activeCourseId, activeModuleId, { content: moduleContent }).catch(() => { });
    }
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

  const handleOpenCourseResourcesModal = () => {
    setShowCourseResourcesModal(true);
  };

  const handleAddCourseResource = async () => {
    if (!activeCourseId) return;
    const course = courses.find((c) => c.id === activeCourseId);
    if (!course) return;

    const sourceUrl = resourceInputUrl.trim();
    if (!sourceUrl) return;

    let videoId: string | null = null;
    let vimeoId: string | null = null;
    let embedUrl: string | undefined;
    if (resourceInputType === 'YOUTUBE') {
      videoId = getYoutubeVideoId(sourceUrl);
      if (!videoId) {
        alert('Please enter a valid YouTube link.');
        return;
      }
      embedUrl = toEmbedYoutubeUrl(videoId);
    } else {
      try {
        const parsed = new URL(sourceUrl);
        if (resourceInputType === 'PDF' && !parsed.pathname.toLowerCase().includes('.pdf')) {
          alert('Please provide a direct PDF link.');
          return;
        }
      } catch {
        alert('Please enter a valid URL.');
        return;
      }
      videoId = getYoutubeVideoId(sourceUrl);
      if (videoId) {
        embedUrl = toEmbedYoutubeUrl(videoId);
      } else {
        vimeoId = getVimeoVideoId(sourceUrl);
        if (vimeoId) {
          embedUrl = `https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}`;
        }
      }
    }

    const existing = course.savedAssets?.videoResources || [];
    const label = resourceInputType === 'YOUTUBE' ? 'YouTube Video' : resourceInputType === 'PDF' ? 'PDF Resource' : 'External Link';
    const newResource: CourseResource = {
      id: `res-${Date.now()}`,
      type: videoId ? 'YOUTUBE' : resourceInputType,
      title: resourceInputTitle.trim() || `${label} ${existing.length + 1}`,
      sourceUrl,
      embedUrl,
      videoId: videoId || undefined,
    };
    const nextResources = [newResource, ...existing];

    handleUpdateCourse(activeCourseId, {
      savedAssets: {
        ...course.savedAssets,
        videoResources: nextResources,
      },
    });

    if (isBackendCourseId(activeCourseId)) {
      setIsSavingResources(true);
      try {
        const marketingData = course.savedAssets?.marketingData;
        const marketingYoutubeResources = (marketingData?.youtubeResources || []).map((item) => ({ ...item, type: 'MARKETING' as const }));
        const embeddedYoutubeResources = nextResources.map((item) => ({ ...item, type: item.type }));
        await coursesApi.saveAssets(activeCourseId, {
          flyerUrl: course.savedAssets?.flyerUrl || null,
          podcastUrl: course.savedAssets?.podcastUrl || null,
          slides: marketingData?.slides || [],
          infographic: marketingData?.infographic || [],
          youtubeResources: [...marketingYoutubeResources, ...embeddedYoutubeResources],
        });
      } catch (e) {
        alert('Could not save resource right now. Please try again.');
      } finally {
        setIsSavingResources(false);
      }
    }

    setResourceInputTitle('');
    setResourceInputUrl('');
    setResourceInputType('YOUTUBE');
  };

  const handleRemoveCourseResource = async (resourceId: string) => {
    if (!activeCourseId) return;
    const course = courses.find((c) => c.id === activeCourseId);
    if (!course) return;
    const existing = course.savedAssets?.videoResources || [];
    const nextResources = existing.filter((r) => r.id !== resourceId);
    handleUpdateCourse(activeCourseId, {
      savedAssets: {
        ...course.savedAssets,
        videoResources: nextResources,
      },
    });
    if (isBackendCourseId(activeCourseId)) {
      setIsSavingResources(true);
      try {
        const marketingData = course.savedAssets?.marketingData;
        const marketingYoutubeResources = (marketingData?.youtubeResources || []).map((item) => ({ ...item, type: 'MARKETING' as const }));
        const embeddedYoutubeResources = nextResources.map((item) => ({ ...item, type: item.type }));
        await coursesApi.saveAssets(activeCourseId, {
          flyerUrl: course.savedAssets?.flyerUrl || null,
          podcastUrl: course.savedAssets?.podcastUrl || null,
          slides: marketingData?.slides || [],
          infographic: marketingData?.infographic || [],
          youtubeResources: [...marketingYoutubeResources, ...embeddedYoutubeResources],
        });
      } catch (e) {
        alert('Could not update resources right now. Please try again.');
      } finally {
        setIsSavingResources(false);
      }
    }
  };

  const stopAudio = () => {
    if (currentAudioSource) {
      try { currentAudioSource.stop(); } catch (e) { }
      setCurrentAudioSource(null);
    }
    setIsPlayingAudio(false);
  };

  const renderCourseView = () => {
    const course = activeCourseId ? courses.find(c => c.id === activeCourseId) : null;
    const sortedCourses = [...courses].filter(c => c && c.id).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // No course selected: show list so user can choose
    if (!activeCourseId || !course) {
      return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[2000px] mx-auto pb-32">
          <button type="button" onClick={() => navigateToView(AppView.DASHBOARD)} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-bold mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">My Courses</h1>
          <p className="text-slate-500 mb-8">Choose a course to start learning.</p>
          {sortedCourses.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <BookOpen size={48} className="mx-auto mb-4 text-slate-400" />
              <p className="font-medium text-slate-600 mb-2">No courses yet</p>
              <p className="text-sm text-slate-500 mb-6">Enroll in a course from the Dashboard or create one in Course Builder.</p>
              <button type="button" onClick={() => navigateToView(AppView.DASHBOARD)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500">Go to Dashboard</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedCourses.map(c => (
                <CourseCard
                  key={c.id}
                  course={c}
                  onClick={() => handleSelectCourse(c.id)}
                  onUpdateThumbnail={(url) => handleUpdateCourse(c.id, { thumbnailUrl: url })}
                  onEdit={showCreateTools ? () => handleEditCourse(c.id) : undefined}
                  onDelete={showCreateTools ? () => handleDeleteCourse(c.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    const activeModule = course.modules?.find(m => m.id === activeModuleId);
    const savedAssets = course.savedAssets;
    const hasSavedAssets = !!(savedAssets?.flyerUrl || savedAssets?.podcastUrl || savedAssets?.marketingData);
    const videoResources = savedAssets?.videoResources || [];
    const selectedVideoResource =
      videoResources.find((r) => r.id === selectedResourceId) ||
      videoResources[0] ||
      null;

    // Sort modules by number in title (Module 1, Module 2, ...) so order is correct in the sidebar
    const getModuleOrder = (m: Module) => {
      const match = (m.title || '').match(/Module\s*(\d+)/i);
      return match ? parseInt(match[1], 10) : 999;
    };
    const sortedModules = [...(course.modules || [])].sort((a, b) => getModuleOrder(a) - getModuleOrder(b));

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
            <div className="flex flex-col gap-2 mb-4">
              <button type="button" onClick={() => navigateToView(AppView.DASHBOARD)} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-bold transition-colors">
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
              <button type="button" onClick={() => navigateToView(AppView.COURSE_VIEW)} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2 text-sm font-bold transition-colors">
                <BookOpen size={14} /> All courses
              </button>
            </div>
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
              <button
                onClick={() => setCourseViewTab('RESOURCES')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${courseViewTab === 'RESOURCES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Resources
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {courseViewTab !== 'RESOURCES' ? (
              sortedModules.map((module, idx) => (
                <button
                  key={module.id}
                  onClick={() => handleSelectModuleNav(module.id, course.id)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-all border ${activeModuleId === module.id
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                    : 'bg-white border-transparent hover:bg-slate-100 text-slate-600'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${module.isCompleted
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : activeModuleId === module.id
                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                      {module.isCompleted ? <Check size={12} /> : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold line-clamp-2">{module.title}</div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              videoResources.length ? (
                videoResources.map((resource, idx) => (
                  <button
                    key={resource.id}
                    onClick={() => setSelectedResourceId(resource.id)}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-all border ${selectedVideoResource?.id === resource.id
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                      : 'bg-white border-transparent hover:bg-slate-100 text-slate-600'
                      }`}
                  >
                    <div className="font-semibold line-clamp-2">{idx + 1}. {resource.title}</div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 space-y-2">
                  <div className="text-xs text-slate-500">No resources added for this course yet.</div>
                  <button
                    onClick={handleOpenCourseResourcesModal}
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    Add Resources
                  </button>
                </div>
              )
            )}
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
          ) : courseViewTab === 'RESOURCES' ? (
            <div className="max-w-6xl mx-auto p-6 md:p-10">
              {selectedVideoResource ? (
                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Course Resources</h3>
                    <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                      {videoResources.map((resource, idx) => (
                        <button
                          key={resource.id}
                          onClick={() => setSelectedResourceId(resource.id)}
                          className={`w-full text-left p-3 rounded-xl border text-sm transition-colors ${selectedVideoResource.id === resource.id
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                          <div className="font-semibold line-clamp-2">{idx + 1}. {resource.title}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedVideoResource.title}</h2>
                    {(selectedVideoResource.type === 'YOUTUBE' && selectedVideoResource.embedUrl) || (selectedVideoResource.embedUrl && selectedVideoResource.type !== 'PDF') ? (
                      <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-200 bg-black">
                        <iframe
                          src={selectedVideoResource.embedUrl}
                          title={selectedVideoResource.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      </div>
                    ) : isDirectVideoFileUrl(selectedVideoResource.sourceUrl) ? (
                      <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-black">
                        <video
                          controls
                          preload="metadata"
                          className="w-full max-h-[70vh]"
                          src={selectedVideoResource.sourceUrl}
                        />
                      </div>
                    ) : (
                      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-600 text-sm">
                        {selectedVideoResource.type === 'PDF'
                          ? 'This is a PDF resource. Open it in a new tab.'
                          : 'This link cannot be embedded by this site. Open it in a new tab.'}
                      </div>
                    )}
                    <a
                      href={selectedVideoResource.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      {selectedVideoResource.type === 'YOUTUBE' ? 'Open on YouTube' : selectedVideoResource.type === 'PDF' ? 'Open PDF' : 'Open link'}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="h-[60vh] flex flex-col items-center justify-center text-slate-500 gap-4">
                  <p>No resources added for this course yet.</p>
                  <button
                    onClick={handleOpenCourseResourcesModal}
                    className="px-4 py-2 text-sm font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    Add Resources
                  </button>
                </div>
              )}
            </div>
          ) : (
            activeModule ? (
              <div className={`max-w-4xl mx-auto p-6 md:p-12 pb-32 transition-all duration-500 ${focusMode ? 'max-w-5xl' : ''}`}>
                {/* Module Header */}
                <div className="mb-8">
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Module {sortedModules.findIndex(m => m.id === activeModuleId) + 1}</div>
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
                      <h2 className="text-xl font-bold flex items-center gap-2"><Trophy className="text-amber-500" /> Knowledge Check</h2>
                      <button onClick={() => setQuizActive(false)} className="text-sm text-slate-500 hover:text-slate-800 font-bold">Exit Quiz</button>
                    </div>

                    <div className="space-y-8">
                      {quizQuestions.map((q, idx) => (
                        <div key={idx} className="space-y-3">
                          <p className="font-bold text-slate-800 text-lg">{idx + 1}. {q.question}</p>
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
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${quizSubmitted
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
                        <Loader2 size={48} className="animate-spin mb-4 text-indigo-600" />
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
                                  {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />} {focusMode ? 'Exit Focus' : 'Focus Mode'}
                                </button>
                                <button
                                  onClick={handlePlayAudio}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isPlayingAudio ? 'bg-rose-50 text-rose-600 animate-pulse' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                  {isPlayingAudio ? <Loader2 className="animate-spin" size={16} /> : <Mic size={16} />} {isPlayingAudio ? 'Playing...' : 'Listen'}
                                </button>
                                {hasSavedAssets && (
                                  <button
                                    onClick={() => setShowSavedAssetsModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                                  >
                                    <Eye size={16} /> View Assets
                                  </button>
                                )}
                              </div>
                              {showCreateTools && (
                                <div className="flex gap-2">
                                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors"><Edit size={16} /> Edit</button>
                                  <button onClick={handleRegenerateContent} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors"><RefreshCw size={16} /> Regenerate</button>
                                </div>
                              )}
                            </div>

                            <div className="animate-in fade-in duration-500">
                              {!focusMode && savedAssets?.flyerUrl && (
                                <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                                  <img src={savedAssets.flyerUrl} alt={`${course.title} flyer`} className="w-full max-h-[420px] object-cover" referrerPolicy="no-referrer" />
                                </div>
                              )}
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
        return <LandingPage onEnterApp={handleLogin} onNavigate={(v) => navigateToView(v)} />;
      case AppView.ABOUT:
        return <AboutUs onBack={() => navigateToView(user ? AppView.DASHBOARD : AppView.LANDING)} />;
      case AppView.DASHBOARD:
        return <DashboardView
          user={user}
          courses={courses}
          stats={stats}
          storageStatus={storageStatus}
          justPublishedCourse={justPublishedCourse}
          onClearPublished={() => setJustPublishedCourse(null)}
          onSelectCourse={handleSelectCourse}
          onNavigate={(v: AppView) => navigateToView(v)}
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
        return <SimulationView topic={courses.find(c => c.id === activeCourseId)?.topic || 'General Management'} user={user} onClose={() => navigateToView(AppView.DASHBOARD)} />;
      case AppView.LIVE_TUTOR:
        const activeC = courses.find(c => c.id === activeCourseId);
        const activeContext = activeC?.modules?.map(m => `Module: ${m.title}\n${m.content || m.description}`).join('\n\n');
        return (
          <LiveTutor
            topic={activeC?.topic}
            contextContent={activeContext}
            onClose={() => navigateToView(AppView.DASHBOARD)}
            onGoToTwinLab={() => navigateToView(AppView.TWIN_MANAGER)}
          />
        );
      case AppView.PATHFINDER:
        return (
          <PathfinderView
            user={user}
            onClose={() => navigateToView(AppView.DASHBOARD)}
            onEnrolledInBridge={() => navigateToView(AppView.COURSE_VIEW)}
          />
        );
      case AppView.MEETING_PREP:
        return <MeetingPrepView onClose={() => navigateToView(AppView.DASHBOARD)} />;
      case AppView.COHORT_PROGRAM:
        // Ensure access control for route
        if (showManageTools) return <CohortProgramView />;
        return <DashboardView user={user} courses={courses} stats={stats} storageStatus={storageStatus} justPublishedCourse={justPublishedCourse} onClearPublished={() => setJustPublishedCourse(null)} onSelectCourse={handleSelectCourse} onNavigate={(v: AppView) => navigateToView(v)} onUpdateCourse={handleUpdateCourse} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} setCourseSearch={setCourseSearch} courseSearch={courseSearch} isFeedbackOpen={isFeedbackOpen} setIsFeedbackOpen={setIsFeedbackOpen} onSetCourseToEdit={setCourseToEdit} />;
      case AppView.IMPACT:
        // Ensure access control for route
        if (showManageTools) return <ImpactDashboard />;
        return <DashboardView user={user} courses={courses} stats={stats} storageStatus={storageStatus} justPublishedCourse={justPublishedCourse} onClearPublished={() => setJustPublishedCourse(null)} onSelectCourse={handleSelectCourse} onNavigate={(v: AppView) => navigateToView(v)} onUpdateCourse={handleUpdateCourse} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} setCourseSearch={setCourseSearch} courseSearch={courseSearch} isFeedbackOpen={isFeedbackOpen} setIsFeedbackOpen={setIsFeedbackOpen} onSetCourseToEdit={setCourseToEdit} />;
      case AppView.SUBSCRIPTION:
        return <SubscriptionPage onSelectTier={handleUpgradeUser} />;
      case AppView.CREATOR_STUDIO:
        // Ensure access control for route
        if (showCreateTools) {
          return <CreatorStudio
            onPublishCourse={addCourse}
            onUpdateCourse={handleUpdateCourse}
            courses={courses}
            user={user}
            onNavigateToDashboard={() => {
              if (justPublishedCourse) {
                navigateToView(AppView.COURSE_VIEW, { courseId: justPublishedCourse.id, moduleId: justPublishedCourse.modules?.[0]?.id });
              } else {
                navigateToView(AppView.DASHBOARD);
              }
            }}
            courseToEdit={courseToEdit}
            onClearEditMode={() => setCourseToEdit(null)}
          />;
        }
        // Fallback to Dashboard
        return <DashboardView user={user} courses={courses} stats={stats} storageStatus={storageStatus} justPublishedCourse={justPublishedCourse} onClearPublished={() => setJustPublishedCourse(null)} onSelectCourse={handleSelectCourse} onNavigate={(v: AppView) => navigateToView(v)} onUpdateCourse={handleUpdateCourse} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} setCourseSearch={setCourseSearch} courseSearch={courseSearch} isFeedbackOpen={isFeedbackOpen} setIsFeedbackOpen={setIsFeedbackOpen} onSetCourseToEdit={setCourseToEdit} />;
      case AppView.TWIN_MANAGER:
        if (showCreateTools) return <TwinManager />;
        return <DashboardView user={user} courses={courses} stats={stats} storageStatus={storageStatus} justPublishedCourse={justPublishedCourse} onClearPublished={() => setJustPublishedCourse(null)} onSelectCourse={handleSelectCourse} onNavigate={(v: AppView) => navigateToView(v)} onUpdateCourse={handleUpdateCourse} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} setCourseSearch={setCourseSearch} courseSearch={courseSearch} isFeedbackOpen={isFeedbackOpen} setIsFeedbackOpen={setIsFeedbackOpen} onSetCourseToEdit={setCourseToEdit} />;
      case AppView.AFFILIATE:
        return <AffiliateView />;
      case AppView.ADMIN_PANEL:
        if (showSystemTools) return <SuperAdminDashboard courses={courses} onUpdateCourse={handleUpdateCourse} onDeleteCourse={handleDeleteCourse} />;
        return <DashboardView user={user} courses={courses} stats={stats} storageStatus={storageStatus} justPublishedCourse={justPublishedCourse} onClearPublished={() => setJustPublishedCourse(null)} onSelectCourse={handleSelectCourse} onNavigate={(v: AppView) => navigateToView(v)} onUpdateCourse={handleUpdateCourse} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} setCourseSearch={setCourseSearch} courseSearch={courseSearch} isFeedbackOpen={isFeedbackOpen} setIsFeedbackOpen={setIsFeedbackOpen} onSetCourseToEdit={setCourseToEdit} />;
      case AppView.TEAM_MANAGEMENT:
        if (showManageTools) return <TeamManagement initialTeamId={routeParams.teamId} />;
        return <DashboardView user={user} courses={courses} stats={stats} storageStatus={storageStatus} justPublishedCourse={justPublishedCourse} onClearPublished={() => setJustPublishedCourse(null)} onSelectCourse={handleSelectCourse} onNavigate={(v: AppView) => navigateToView(v)} onUpdateCourse={handleUpdateCourse} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} setCourseSearch={setCourseSearch} courseSearch={courseSearch} isFeedbackOpen={isFeedbackOpen} setIsFeedbackOpen={setIsFeedbackOpen} onSetCourseToEdit={setCourseToEdit} />;
      case AppView.EXTERNAL_ASSESSMENT:
        if (showManageTools) return <ExternalAssessmentView user={user} initialAssessmentId={routeParams.assessmentId} />;
        return <DashboardView user={user} courses={courses} stats={stats} storageStatus={storageStatus} justPublishedCourse={justPublishedCourse} onClearPublished={() => setJustPublishedCourse(null)} onSelectCourse={handleSelectCourse} onNavigate={(v: AppView) => navigateToView(v)} onUpdateCourse={handleUpdateCourse} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} setCourseSearch={setCourseSearch} courseSearch={courseSearch} isFeedbackOpen={isFeedbackOpen} setIsFeedbackOpen={setIsFeedbackOpen} onSetCourseToEdit={setCourseToEdit} />;
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
          onNavigate={(v: AppView) => navigateToView(v)}
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

  const renderGeminiKeyGateModal = () => {
    if (!showApiKeyModal) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Key size={32} className="text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Expertise Key Required</h2>
            <p className="text-slate-500 mt-3 text-sm leading-relaxed">
              To activate your AI twins and insights, please provide your Google Gemini API key.
              Your key is stored locally and used only for your session.
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <input
                value={geminiKeyDraft}
                onChange={(e) => setGeminiKeyDraft(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
              />
              {geminiKeyError ? (
                <p className="text-xs text-red-600">{geminiKeyError}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleValidateAndSaveGeminiKey}
              disabled={isValidatingGeminiKey || !geminiKeyDraft.trim()}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isValidatingGeminiKey ? <Loader2 className="animate-spin w-5 h-5" /> : null}
              {isValidatingGeminiKey ? 'Validating…' : 'Validate & Enter'}
            </button>
          </div>

          <p className="text-center mt-5 text-xs text-slate-400">
            Don't have a key?{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-indigo-500 font-semibold"
            >
              Get one for free here
            </a>
          </p>
        </div>
      </div>
    );
  };

  // Avoid flash of login: show loading until session is resolved, or until view is in sync with URL for logged-in user
  const pathname = location.pathname.replace(/\/$/, '') || '/';
  const isPublicPathname = pathname === '/' || pathname === '/login' || pathname === '/about' || /^\/embed\//.test(pathname);
  const waitingForSession = !sessionChecked;
  const loggedInButViewStillLanding = sessionChecked && !!user && view === AppView.LANDING && !isPublicPathname;
  const loggedInOnRoot = sessionChecked && !!user && (pathname === '' || pathname === '/' || pathname === '/login');
  if (waitingForSession || loggedInOnRoot || loggedInButViewStillLanding) {
    return (
      <div className="h-full w-full bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  // Full Screen Views check
  const isLanding = view === AppView.LANDING;
  const isPublic = view === AppView.PUBLIC_AGENT;
  const isAbout = view === AppView.ABOUT;

  if (isLanding || isPublic || isAbout) {
    return (
      <div className="h-full w-full bg-slate-50 overflow-hidden">
        {renderContent()}
        {renderGeminiKeyGateModal()}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden text-slate-900 font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Storage Notification Toast */}
      {storageNotification && (
        <div className="fixed top-4 right-4 left-4 md:left-auto z-[80] bg-white border-l-4 border-amber-500 p-4 rounded-lg shadow-2xl animate-in slide-in-from-right-10 flex items-start gap-3 w-auto md:w-[min(40rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)]">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-700 break-words whitespace-pre-wrap leading-relaxed">
              {storageNotification}
            </p>
          </div>
          <button onClick={() => setStorageNotification(null)} className="shrink-0 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
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
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={view === AppView.DASHBOARD} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.DASHBOARD)} />
          <NavItem icon={<BookOpen size={18} />} label="My Courses" active={view === AppView.COURSE_VIEW} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.COURSE_VIEW)} />
          <NavItem icon={<Network size={18} />} label="Knowledge Graph" active={view === AppView.KNOWLEDGE_GRAPH} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.KNOWLEDGE_GRAPH)} />

          {/* Practice Group */}
          <NavSectionHeader title="Experience" expanded={isSidebarOpen} />
          <NavItem icon={<Mic size={18} />} label="Live Tutor" active={view === AppView.LIVE_TUTOR} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.LIVE_TUTOR)} />
          <NavItem icon={<Briefcase size={18} />} label="Scenario Lab" active={view === AppView.SIMULATION} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.SIMULATION)} />
          <NavItem icon={<MapIcon size={18} />} label="Career Pathfinder" active={view === AppView.PATHFINDER} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.PATHFINDER)} />
          <NavItem icon={<ClipboardCheck size={18} />} label="Meeting Prep" active={view === AppView.MEETING_PREP} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.MEETING_PREP)} />

          {/* Create Group (Expert/Creator/Admin) */}
          {showCreateTools && (
            <>
              <NavSectionHeader title="Create" expanded={isSidebarOpen} />
              <NavItem icon={<Sparkles size={18} />} label="Course Builder" active={view === AppView.CREATOR_STUDIO} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.CREATOR_STUDIO)} />
              <NavItem icon={<Bot size={18} />} label="Twin Lab" active={view === AppView.TWIN_MANAGER} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.TWIN_MANAGER)} />
            </>
          )}

          {/* Enterprise Group (Company Admin/Super Admin) */}
          {showManageTools && (
            <>
              <NavSectionHeader title="Manage" expanded={isSidebarOpen} />
              <NavItem icon={<TrendingUp size={18} />} label="BICE Impact" active={view === AppView.IMPACT} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.IMPACT)} />
              <NavItem icon={<Users size={18} />} label="Workforce" active={view === AppView.TEAM_MANAGEMENT} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.TEAM_MANAGEMENT)} />
              {/* Cohorts – uncomment when needed
                        <NavItem icon={<Users size={18}/>} label="Cohorts" active={view === AppView.COHORT_PROGRAM} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.COHORT_PROGRAM)} />
                        */}
              <NavItem icon={<ClipboardCheck size={18} />} label="Assessments" active={view === AppView.EXTERNAL_ASSESSMENT} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.EXTERNAL_ASSESSMENT)} />
            </>
          )}

          {/* System Group (Super Admin Only) */}
          {showSystemTools && (
            <>
              <NavSectionHeader title="System" expanded={isSidebarOpen} />
              <NavItem icon={<ShieldAlert size={18} />} label="Admin Console" active={view === AppView.ADMIN_PANEL} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.ADMIN_PANEL)} />
            </>
          )}
        </div>

        <div className="p-3 border-t border-slate-800 flex flex-col gap-1">
          {isSidebarOpen && user && (
            <div className="mb-2 px-3 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Role: {isSuperAdmin ? 'Super Admin' : isCompanyAdmin ? 'Company Admin' : isExpert ? 'Expert Account' : 'Learner'}
            </div>
          )}
          <NavItem icon={<Gift size={18} />} label="Rewards" active={view === AppView.AFFILIATE} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.AFFILIATE)} />
          <NavItem icon={<Settings size={18} />} label="Settings" active={view === AppView.SETTINGS} expanded={isSidebarOpen} onClick={() => navigateToView(AppView.SETTINGS)} />
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
            <button onClick={() => setIsMobileSidebarOpen(true)} className="text-slate-600"><Menu size={24} /></button>
            <Logo className="w-8 h-8" showText={false} />
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
            <img src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="User" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 relative">
          {renderContent()}
        </div>

        {showSavedAssetsModal && activeCourseId && (() => {
          const currentCourse = courses.find(c => c.id === activeCourseId);
          const assets = currentCourse?.savedAssets;
          const marketingData = assets?.marketingData;
          if (!assets) return null;
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowSavedAssetsModal(false)}>
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                  <h2 className="text-lg font-bold text-slate-900">Saved course assets</h2>
                  <button onClick={() => setShowSavedAssetsModal(false)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-200/80 hover:text-slate-800 transition-colors" aria-label="Close">
                    <X size={20} />
                  </button>
                </div>
                <div className="overflow-y-auto p-6 space-y-8">
                  {assets.flyerUrl && (
                    <section className="space-y-3">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon size={16} /> Marketing flyer
                      </h3>
                      <img src={assets.flyerUrl} alt="Saved flyer" className="w-full rounded-xl border border-slate-200 shadow-sm" referrerPolicy="no-referrer" />
                    </section>
                  )}
                  {assets.podcastUrl && (
                    <section className="space-y-3">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <PlayCircle size={16} /> Promo podcast
                      </h3>
                      <audio src={assets.podcastUrl} controls className="w-full" />
                    </section>
                  )}
                  {marketingData?.slides?.length ? (
                    <section>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <BookOpen size={16} /> Slide deck
                      </h3>
                      <div className="space-y-4">
                        {marketingData.slides.map((slide, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                            <p className="text-xs font-bold text-amber-600 mb-1">Slide {idx + 1}</p>
                            <h4 className="font-bold text-slate-900 mb-2">{slide.title}</h4>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 mb-3">
                              {slide.bullets.map((b, i) => <li key={i}>{b}</li>)}
                            </ul>
                            <p className="text-xs text-slate-500 border-t border-slate-200 pt-3">
                              <span className="font-semibold text-slate-600">Speaker notes: </span>
                              {slide.speakerNotes}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                  {marketingData?.infographic?.length ? (
                    <section>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Sparkles size={16} /> Infographics
                      </h3>
                      <div className="grid gap-4">
                        {marketingData.infographic.map((block, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-bold text-slate-900">{block.title}</h4>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                                {block.colorTheme}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{block.content}</p>
                            <p className="text-xs text-slate-400">
                              <span className="font-medium text-slate-500">Icon idea: </span>
                              {block.iconSuggestion}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                  {marketingData?.youtubeResources?.length ? (
                    <section>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FileText size={16} /> YouTube resources
                      </h3>
                      <div className="space-y-3">
                        {marketingData.youtubeResources.map((vid, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/80">
                            <h4 className="font-bold text-slate-900">{vid.title}</h4>
                            <p className="text-sm text-indigo-600">{vid.channelName}</p>
                            <p className="text-xs text-slate-500 mt-1">{vid.reason}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                  {assets.videoResources?.length ? (
                    <section>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <PlayCircle size={16} /> Embedded resources
                      </h3>
                      <div className="space-y-3">
                        {assets.videoResources.map((video) => (
                          <a
                            key={video.id}
                            href={video.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 transition-colors"
                          >
                            <h4 className="font-bold text-slate-900">{video.title}</h4>
                            <p className="text-xs text-indigo-600 mt-1">{video.sourceUrl}</p>
                          </a>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })()}

        {showCourseResourcesModal && activeCourseId && (() => {
          const course = courses.find((c) => c.id === activeCourseId);
          if (!course) return null;
          const resources = course.savedAssets?.videoResources || [];
          return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCourseResourcesModal(false)}>
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                  <h2 className="text-lg font-bold text-slate-900">Add course resources</h2>
                  <button onClick={() => setShowCourseResourcesModal(false)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-200/80 hover:text-slate-800 transition-colors" aria-label="Close">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 border-b border-slate-100 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                      value={resourceInputType}
                      onChange={(e) => setResourceInputType(e.target.value as CourseResourceType)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="YOUTUBE">YouTube</option>
                      <option value="PDF">PDF</option>
                      <option value="LINK">Any Link</option>
                    </select>
                    <input
                      type="text"
                      value={resourceInputTitle}
                      onChange={(e) => setResourceInputTitle(e.target.value)}
                      placeholder="Title (optional)"
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 md:col-span-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={resourceInputUrl}
                      onChange={(e) => setResourceInputUrl(e.target.value)}
                      placeholder={resourceInputType === 'YOUTUBE' ? 'https://youtube.com/watch?v=...' : resourceInputType === 'PDF' ? 'https://example.com/file.pdf' : 'https://example.com'}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleAddCourseResource}
                      disabled={!resourceInputUrl.trim() || isSavingResources}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                    >
                      {isSavingResources ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      Add
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto p-6 space-y-3">
                  {resources.length ? resources.map((resource, idx) => (
                    <div key={resource.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{resource.type}</p>
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">{idx + 1}. {resource.title}</p>
                        <a href={resource.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-700 line-clamp-1">
                          {resource.sourceUrl}
                        </a>
                      </div>
                      <button
                        onClick={() => handleRemoveCourseResource(resource.id)}
                        className="text-slate-400 hover:text-red-600 shrink-0"
                        aria-label="Remove resource"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )) : (
                    <div className="text-sm text-slate-500 text-center py-10">
                      No resources added yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

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

      {renderGeminiKeyGateModal()}
    </div>
  );
};
