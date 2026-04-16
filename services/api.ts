/**
 * Central API client for Knova backend.
 * All FE → BE requests go through this module.
 */

import type { ExpertPersona, MarketingAssets } from '../types';

const getBaseUrl = (): string => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL;
  if (envUrl && String(envUrl).trim()) return String(envUrl).trim();

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    return isLocal ? 'http://localhost:5000' : origin;
  }

  return 'http://localhost:5000';
};

export const getToken = (): string | null => {
  try {
    return localStorage.getItem('knovatwin_token');
  } catch {
    return null;
  }
};

export function setToken(token: string): void {
  localStorage.setItem('knovatwin_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('knovatwin_token');
}

export type ApiError = { message: string; code?: string };

async function request<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<{ data: T; message?: string }> {
  const { skipAuth, ...fetchOptions } = options;
  const base = getBaseUrl().replace(/\/$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };
  const token = getToken();
  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error?.message || res.statusText || 'Request failed';
    const err: ApiError & { status?: number } = { message: msg, code: body?.error?.code, status: res.status };
    if (res.status === 401) {
      clearToken();
    }
    throw err;
  }

  return body as { data: T; message?: string };
}

// --- Auth ---
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  title?: string;
  industry?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  hasGeminiKey?: boolean;
};
export type AuthResponse = { data: { user: AuthUser; token: string }; message?: string };

export const authApi = {
  register: (email: string, password: string, name: string, referrerUserId?: string | null, role?: 'USER' | 'FACILITATOR' | 'ADMIN') =>
    request<{ user: AuthUser; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        name,
        referrerUserId: referrerUserId || undefined,
        ref: referrerUserId || undefined,
        ...(role && role !== 'USER' ? { role } : {}),
      }),
      skipAuth: true,
    }),

  login: (email: string, password: string) =>
    request<{ user: AuthUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    }),

  me: () => request<AuthUser>('/auth/me'),
  updateMe: (payload: { name?: string; title?: string; industry?: string; bio?: string; avatarUrl?: string }) =>
    request<AuthUser>('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) }),
  saveMyGeminiKey: (apiKey: string) =>
    request<{ apiKey: string }>('/auth/me/gemini-key', { method: 'POST', body: JSON.stringify({ apiKey }) }),
  deleteMyGeminiKey: () => request<{ ok: boolean }>('/auth/me/gemini-key', { method: 'DELETE' }),
  getMyGeminiKey: () => request<{ apiKey: string }>('/auth/me/gemini-key'),
};

// --- Feedback ---
export type FeedbackPayload = { type: string; message: string; userName?: string; userEmail?: string };
export type FeedbackItemRes = {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  type: string;
  message: string;
  timestamp: string;
  status: string;
  userAgent?: string;
};

export const feedbackApi = {
  create: (payload: FeedbackPayload) =>
    request<FeedbackItemRes>('/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.page != null) sp.set('page', String(params.page));
    if (params?.limit != null) sp.set('limit', String(params.limit));
    const q = sp.toString();
    return request<{ feedback: FeedbackItemRes[]; total: number; page: number; limit: number }>(
      `/feedback${q ? `?${q}` : ''}`
    );
  },

  updateStatus: (id: string, status: string) =>
    request<FeedbackItemRes>(`/feedback/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// --- Affiliate ---
export type AffiliateRes = {
  id: string;
  userId: string;
  referralLink: string;
  totalEarnings: string | number;
  nextPayout: string | number;
  nextPayoutDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
export type ReferralRes = {
  id: string;
  referredEmail: string;
  status: string;
  commission: string | number;
  createdAt?: string;
};

export const affiliateApi = {
  get: () => request<AffiliateRes>('/affiliate'),
  join: () => request<AffiliateRes>('/affiliate', { method: 'POST' }),
  getReferrals: (params?: { page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set('page', String(params.page));
    if (params?.limit != null) sp.set('limit', String(params.limit));
    const q = sp.toString();
    return request<{ referrals: ReferralRes[]; total?: number; page?: number; limit?: number }>(
      `/affiliate/referrals${q ? `?${q}` : ''}`
    );
  },
};

// --- Admin ---
export type AdminUserRes = { id: string; email: string; name: string; role: string; createdAt?: string; updatedAt?: string };

export const adminApi = {
  getUsers: (params?: { page?: number; limit?: number; filter?: string }) => {
    const sp = new URLSearchParams();
    if (params?.page != null) sp.set('page', String(params.page));
    if (params?.limit != null) sp.set('limit', String(params.limit));
    if (params?.filter) sp.set('filter', params.filter);
    const q = sp.toString();
    return request<{ users: AdminUserRes[]; total: number; page: number; limit: number }>(
      `/admin/users${q ? `?${q}` : ''}`
    );
  },
  getUserById: (id: string) => request<AdminUserRes>(`/admin/users/${id}`),
  updateUser: (id: string, role: string) =>
    request<AdminUserRes>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  getCourses: () => request<CourseRes[]>('/admin/courses'),
  deleteCourse: (id: string) => request<unknown>(`/admin/courses/${id}`, { method: 'DELETE' }),
};

// --- Courses ---
export type CourseAssetsRes = {
  flyerUrl?: string | null;
  podcastUrl?: string | null;
  salesSlides?: MarketingAssets['slides'] | null;
  infographic?: MarketingAssets['infographic'] | null;
  youtubeResources?: MarketingAssets['youtubeResources'] | null;
};

export type CourseRes = {
  id: string;
  title?: string;
  topic: string;
  description: string;
  status?: string;
  modules?: CourseModuleRes[];
  assets?: CourseAssetsRes | null;
};

export type CourseModuleRes = { id: string; name: string; description?: string | null; keyConcepts: string[]; content?: string | null };

export const coursesApi = {
  list: () => request<CourseRes[]>('/courses'),
  getById: (id: string) => request<CourseRes>(`/courses/${id}`),
  create: (payload: { title?: string; topic: string; description: string; modules: { name?: string; title?: string; description?: string; keyConcepts?: string[]; content?: string }[]; status?: string }) =>
    request<CourseRes>('/courses', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: { title?: string; topic?: string; description?: string; modules?: { name?: string; title?: string; description?: string; keyConcepts?: string[]; content?: string }[]; status?: string }) =>
    request<CourseRes>(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  delete: (id: string) => request<unknown>(`/courses/${id}`, { method: 'DELETE' }),
  updateModuleContent: (courseId: string, moduleId: string, payload: { content: string }) =>
    request<CourseModuleRes>(`/courses/${courseId}/modules/${moduleId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  saveAssets: (
    id: string,
    payload: {
      flyerUrl?: string | null;
      podcastUrl?: string | null;
      slides?: MarketingAssets['slides'];
      infographic?: MarketingAssets['infographic'];
      youtubeResources?: MarketingAssets['youtubeResources'];
    }
  ) => request<CourseRes>(`/courses/${id}/assets`, { method: 'PUT', body: JSON.stringify(payload) }),
  uploadFlyer: (id: string, payload: { imageData: string }) =>
    request<{ flyerUrl: string; course: CourseRes }>(`/courses/${id}/flyer-upload`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// --- Enrollments ---
export type EnrollmentRes = { id: string; userId: string; courseId: string; progress: number; course: CourseRes };

export const enrollmentsApi = {
  getMy: () => request<EnrollmentRes[]>('/enrollments'),
  enroll: (courseId: string) => request<EnrollmentRes>(`/courses/${courseId}/enroll`, { method: 'POST' }),
  updateProgress: (courseId: string, progress: number) =>
    request<EnrollmentRes>(`/courses/${courseId}/progress`, { method: 'PATCH', body: JSON.stringify({ progress }) }),
  markModuleComplete: (moduleId: string) =>
    request<{ progress: number; completedCount: number; totalModules: number }>(`/modules/${moduleId}/complete`, { method: 'POST' }),
  getCompletedModules: (courseId: string) =>
    request<{ moduleIds: string[] }>(`/courses/${courseId}/completed-modules`),
};

// --- Teams ---
export const teamsApi = {
  list: () => request<unknown[]>('/teams'),
  create: (name: string) => request<unknown>('/teams', { method: 'POST', body: JSON.stringify({ name }) }),
  getById: (teamId: string) => request<unknown>(`/teams/${teamId}`),
  invite: (teamId: string, email: string) => request<unknown>(`/teams/${teamId}/invite`, { method: 'POST', body: JSON.stringify({ email }) }),
  removeMember: (teamId: string, userId: string) => request<unknown>(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),
};

// --- Cohorts ---
export const cohortsApi = {
  list: () => request<unknown[]>('/cohorts'),
  create: (payload: { name?: string; status?: string; startDate?: string; endDate?: string; courseId?: string }) =>
    request<unknown>('/cohorts', { method: 'POST', body: JSON.stringify(payload) }),
  getById: (id: string) => request<unknown>(`/cohorts/${id}`),
  enroll: (id: string) => request<unknown>(`/cohorts/${id}/enroll`, { method: 'POST' }),
};

// --- Assessments ---
export type AssessmentInsightRes = {
  id: string;
  summary: string;
  recommendations: string[];
  strategyScore: number;
  executionScore: number;
  technologyScore: number;
  peopleScore: number;
  riskScore: number;
  submittedAt: string;
  userId: string;
  user?: { id: string; name: string; email: string; avatarUrl?: string | null };
};
export type AssessmentRes = {
  id: string;
  title: string;
  companyName: string;
  status: string;
  aiSynthesis?: string | null;
  deadline: string | null;
  description: string | null;
  createdAt: string;
  insights?: AssessmentInsightRes[];
};
export function mapAssessmentResToExternal(be: AssessmentRes): import('../types').ExternalAssessment {
  const insights = (be.insights || []).map((i) => ({
    id: i.id,
    expertName: i.user?.name ?? 'Expert',
    expertRole: 'Reviewer',
    avatarUrl: i.user?.avatarUrl ?? '',
    score: Math.round((i.strategyScore + i.executionScore + i.technologyScore + i.peopleScore + i.riskScore) / 5),
    summary: i.summary,
    recommendations: Array.isArray(i.recommendations) ? i.recommendations : [],
    submittedAt: new Date(i.submittedAt).getTime(),
    metrics: {
      strategy: i.strategyScore,
      execution: i.executionScore,
      technology: i.technologyScore,
      people: i.peopleScore,
      risk: i.riskScore,
    },
  }));
  const deadline = be.deadline ? (typeof be.deadline === 'string' ? be.deadline : (be.deadline as unknown as { toISOString?: () => string })?.toISOString?.()?.split('T')[0] ?? '') : '';
  return {
    id: be.id,
    title: be.title,
    companyName: be.companyName,
    status: (be.status === 'COMPLETED' || be.status === 'IN_PROGRESS' ? be.status : 'OPEN') as 'OPEN' | 'IN_PROGRESS' | 'COMPLETED',
    createdDate: be.createdAt?.toString().split('T')[0] ?? '',
    deadline: deadline || new Date(Date.now() + 12096e5).toISOString().split('T')[0],
    description: be.description ?? '',
    invitedExperts: insights.length,
    insights,
    aiSynthesis: be.aiSynthesis ?? undefined,
  };
}
export const assessmentsApi = {
  list: () => request<AssessmentRes[]>('/assessments'),
  create: (payload: { title?: string; companyName?: string; status?: string; deadline?: string; description?: string }) =>
    request<AssessmentRes>('/assessments', { method: 'POST', body: JSON.stringify(payload) }),
  getById: (id: string) => request<AssessmentRes>(`/assessments/${id}`),
  update: (id: string, payload: { status?: string; aiSynthesis?: string }) =>
    request<AssessmentRes>(`/assessments/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  addInsight: (id: string, payload: { summary: string; recommendations: string[]; strategyScore: number; executionScore: number; technologyScore: number; peopleScore: number; riskScore: number }) =>
    request<AssessmentInsightRes>(`/assessments/${id}/insights`, { method: 'POST', body: JSON.stringify(payload) }),
};

// --- Pathfinder ---
export type PathfinderStateRes = {
  targetRole: string;
  skillData: string;
  recommendedCourseIds?: string[];
};
export const pathfinderApi = {
  get: () => request<PathfinderStateRes | null>('/pathfinder'),
  save: (payload: { targetRole?: string; skillData?: string | object; recommendedCourseIds?: string[] }) =>
    request<PathfinderStateRes>('/pathfinder', { method: 'POST', body: JSON.stringify(payload) }),
  getRecommendedCourseIds: (targetRole?: string) => {
    const q = targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : '';
    return request<{ courseIds: string[] }>(`/pathfinder/recommended-courses${q}`);
  },
  enrollBridge: () =>
    request<{ enrolled: string[] }>('/pathfinder/enroll-bridge', { method: 'POST' }),
};

// --- Expert Personas (Twins) ---
export type ExpertPersonaBackend = {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  accentColor?: string;
  voiceName?: string;
  avatarUrl?: string | null;
  yearsExperience?: number;
};
export function mapBackendPersonaToExpertPersona(row: ExpertPersonaBackend): ExpertPersona {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    systemPrompt: row.systemPrompt ?? '',
    accentColor: row.accentColor ?? '#6366f1',
    voiceName: row.voiceName ?? 'Kore',
    yearsExperience: row.yearsExperience ?? 5,
    avatarUrl: row.avatarUrl ?? undefined,
  };
}

export const expertPersonasApi = {
  list: () => request<ExpertPersonaBackend[]>('/expert-personas'),
  create: (payload: { name?: string; role?: string; systemPrompt?: string; accentColor?: string; voiceName?: string; avatarUrl?: string; yearsExperience?: number }) =>
    request<ExpertPersonaBackend>('/expert-personas', { method: 'POST', body: JSON.stringify(payload) }),
  getById: (id: string) => request<ExpertPersonaBackend>(`/expert-personas/${id}`),
  update: (id: string, payload: { name?: string; role?: string; systemPrompt?: string; accentColor?: string; voiceName?: string; avatarUrl?: string; yearsExperience?: number }) =>
    request<ExpertPersonaBackend>(`/expert-personas/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  delete: (id: string) => request<unknown>(`/expert-personas/${id}`, { method: 'DELETE' }),
};

// --- Health ---
export const healthApi = () => request<unknown>('/health', { skipAuth: true });
