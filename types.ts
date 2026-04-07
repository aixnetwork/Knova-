
export interface MarketingAssets {
    slides: { title: string; bullets: string[]; speakerNotes: string }[];
    infographic: { title: string; content: string; iconSuggestion: string; colorTheme: string }[];
    youtubeResources: { title: string; channelName: string; searchQuery: string; reason: string }[];
    generatedAt: number;
}

export enum UserRole {
  LEARNER = 'LEARNER',
  FACILITATOR = 'FACILITATOR',
  ADMIN = 'ADMIN'
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PROFESSIONAL = 'PROFESSIONAL',
  COMPANY = 'COMPANY',
  EXPERT = 'EXPERT',
  BETA = 'BETA'
}

export enum AppView {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  COURSE_VIEW = 'COURSE_VIEW',
  KNOWLEDGE_GRAPH = 'KNOWLEDGE_GRAPH',
  SIMULATION = 'SIMULATION',
  LIVE_TUTOR = 'LIVE_TUTOR',
  CREATOR_STUDIO = 'CREATOR_STUDIO',
  IMPACT = 'IMPACT',
  SUBSCRIPTION = 'SUBSCRIPTION',
  AFFILIATE = 'AFFILIATE',
  ADMIN_PANEL = 'ADMIN_PANEL',
  TEAM_MANAGEMENT = 'TEAM_MANAGEMENT',
  SETTINGS = 'SETTINGS',
  ABOUT = 'ABOUT',
  PUBLIC_AGENT = 'PUBLIC_AGENT',
  PATHFINDER = 'PATHFINDER',
  MEETING_PREP = 'MEETING_PREP',
  COHORT_PROGRAM = 'COHORT_PROGRAM',
  EXTERNAL_ASSESSMENT = 'EXTERNAL_ASSESSMENT',
  TWIN_MANAGER = 'TWIN_MANAGER'
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED'
}

export enum AssessmentQuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  OPEN_ENDED = 'OPEN_ENDED'
}

export enum FeedbackType {
  IMPROVEMENT = 'IMPROVEMENT',
  BUG = 'BUG',
  TECHNICAL = 'TECHNICAL'
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tier: SubscriptionTier;
  avatarUrl?: string;
  isCreatorMode?: boolean;
  title?: string;
  industry?: string;
  interests?: string[];
  bio?: string;
  /** Server-backed BYOK: user has a Gemini key stored (encrypted). */
  hasGeminiKey?: boolean;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  keyConcepts?: string[];
  isCompleted: boolean;
  topic?: string;
  content?: string;
  imageUrl?: string;
}

export interface AssessmentResult {
  score: number;
  passed: boolean;
  feedback: string;
  takenAt?: number;
}

export interface Course {
  id: string;
  title: string;
  topic: string;
  description: string;
  progress: number;
  createdAt: number;
  modules: Module[];
  price?: number;
  isFeatured?: boolean;
  authorName?: string;
  rating?: number;
  reviewCount?: number;
  status?: CourseStatus;
  thumbnailUrl?: string;
  isDefault?: boolean;
  assessmentResult?: AssessmentResult;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface UserStats {
  totalCourses: number;
  completedModules: number;
  hoursSpent: number;
  streakDays: number;
  masteryScore: number;
  points: number;
  level: number;
  badges: { id: string; name: string; icon: string; description: string }[];
}

export interface MicroLesson {
  id: string;
  topic: string;
  title: string;
  content: string;
  duration: string;
  generatedAt: number;
}

export interface SimulationScenario {
  role: string;
  context: string;
  problem: string;
  stakes: string;
}

export interface SimulationFeedback {
  score: number;
  critique: string;
  betterApproach: string;
  metrics: {
    strategy: number;
    empathy: number;
    execution: number;
  };
}

export interface ExpertPersona {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  accentColor: string;
  voiceName: string;
  yearsExperience: number;
  avatarUrl?: string;
  avatarColor?: string;
  heyGenAvatarId?: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: AssessmentQuestionType;
  options?: string[];
}

export interface ExpertInsight {
  id: string;
  expertName: string;
  expertRole: string;
  avatarUrl: string;
  score: number;
  summary: string;
  recommendations: string[];
  submittedAt: number;
  metrics: {
    strategy: number;
    execution: number;
    technology: number;
    people: number;
    risk: number;
  };
}

export interface ExternalAssessment {
  id: string;
  title: string;
  companyName: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  createdDate: string;
  deadline: string;
  description: string;
  invitedExperts: number;
  insights: ExpertInsight[];
  aiSynthesis?: string;
}

export interface FeedbackItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: FeedbackType;
  message: string;
  timestamp: number;
  status: 'NEW' | 'RESOLVED';
  userAgent?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
