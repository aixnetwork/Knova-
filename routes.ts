/**
 * Central route paths and URL <-> view/params mapping.
 * All sidebar modules and sub-modules have a corresponding path.
 */

import { AppView } from './types';

export const paths = {
  landing: () => '/',
  login: () => '/login',
  about: () => '/about',
  dashboard: () => '/dashboard',
  courses: () => '/courses',
  course: (courseId: string) => `/courses/${encodeURIComponent(courseId)}`,
  courseModule: (courseId: string, moduleId: string) =>
    `/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`,
  knowledgeGraph: () => '/knowledge-graph',
  liveTutor: () => '/live-tutor',
  scenarioLab: () => '/scenario-lab',
  pathfinder: () => '/pathfinder',
  meetingPrep: () => '/meeting-prep',
  courseBuilder: () => '/course-builder',
  twinLab: () => '/twin-lab',
  impact: () => '/impact',
  workforce: () => '/workforce',
  workforceTeam: (teamId: string) => `/workforce/teams/${encodeURIComponent(teamId)}`,
  cohorts: () => '/cohorts',
  assessments: () => '/assessments',
  assessment: (assessmentId: string) => `/assessments/${encodeURIComponent(assessmentId)}`,
  rewards: () => '/rewards',
  admin: () => '/admin',
  settings: () => '/settings',
  subscription: () => '/subscription',
  embedAgent: (twinId: string) => `/embed/${encodeURIComponent(twinId)}`,
} as const;

export type RouteParams = {
  view: AppView;
  courseId?: string | null;
  moduleId?: string | null;
  assessmentId?: string | null;
  teamId?: string | null;
  embedTwinId?: string | null;
};

const COURSE_MODULE_REGEX = /^\/courses\/([^/]+)\/modules\/([^/]+)\/?$/;
const COURSE_REGEX = /^\/courses\/([^/]+)\/?$/;
const ASSESSMENT_REGEX = /^\/assessments\/([^/]+)\/?$/;
const WORKFORCE_TEAM_REGEX = /^\/workforce\/teams\/([^/]+)\/?$/;
const EMBED_REGEX = /^\/embed\/([^/]+)\/?$/;

export function parsePathname(pathname: string): RouteParams {
  const normalized = pathname.replace(/\/$/, '') || '/';
  if (normalized === '/' || normalized === '/login') return { view: AppView.LANDING };
  if (normalized === '/about') return { view: AppView.ABOUT };
  if (normalized === '/dashboard') return { view: AppView.DASHBOARD };
  if (normalized === '/courses') return { view: AppView.COURSE_VIEW };
  const courseModuleMatch = normalized.match(COURSE_MODULE_REGEX);
  if (courseModuleMatch)
    return {
      view: AppView.COURSE_VIEW,
      courseId: decodeURIComponent(courseModuleMatch[1]),
      moduleId: decodeURIComponent(courseModuleMatch[2]),
    };
  const courseMatch = normalized.match(COURSE_REGEX);
  if (courseMatch)
    return { view: AppView.COURSE_VIEW, courseId: decodeURIComponent(courseMatch[1]) };
  if (normalized === '/knowledge-graph') return { view: AppView.KNOWLEDGE_GRAPH };
  if (normalized === '/live-tutor') return { view: AppView.LIVE_TUTOR };
  if (normalized === '/scenario-lab') return { view: AppView.SIMULATION };
  if (normalized === '/pathfinder') return { view: AppView.PATHFINDER };
  if (normalized === '/meeting-prep') return { view: AppView.MEETING_PREP };
  if (normalized === '/course-builder') return { view: AppView.CREATOR_STUDIO };
  if (normalized === '/twin-lab') return { view: AppView.TWIN_MANAGER };
  if (normalized === '/impact') return { view: AppView.IMPACT };
  const workforceTeamMatch = normalized.match(WORKFORCE_TEAM_REGEX);
  if (workforceTeamMatch)
    return {
      view: AppView.TEAM_MANAGEMENT,
      teamId: decodeURIComponent(workforceTeamMatch[1]),
    };
  if (normalized === '/workforce') return { view: AppView.TEAM_MANAGEMENT };
  if (normalized === '/cohorts') return { view: AppView.COHORT_PROGRAM };
  const assessmentMatch = normalized.match(ASSESSMENT_REGEX);
  if (assessmentMatch)
    return {
      view: AppView.EXTERNAL_ASSESSMENT,
      assessmentId: decodeURIComponent(assessmentMatch[1]),
    };
  if (normalized === '/assessments') return { view: AppView.EXTERNAL_ASSESSMENT };
  if (normalized === '/rewards') return { view: AppView.AFFILIATE };
  if (normalized === '/admin') return { view: AppView.ADMIN_PANEL };
  if (normalized === '/settings') return { view: AppView.SETTINGS };
  if (normalized === '/subscription') return { view: AppView.SUBSCRIPTION };
  const embedMatch = normalized.match(EMBED_REGEX);
  if (embedMatch)
    return {
      view: AppView.PUBLIC_AGENT,
      embedTwinId: decodeURIComponent(embedMatch[1]),
    };
  return { view: AppView.DASHBOARD };
}

export function pathFor(view: AppView, params?: Partial<RouteParams>): string {
  const p = params || {};
  switch (view) {
    case AppView.LANDING:
      return paths.landing();
    case AppView.ABOUT:
      return paths.about();
    case AppView.DASHBOARD:
      return paths.dashboard();
    case AppView.COURSE_VIEW:
      if (p.courseId && p.moduleId) return paths.courseModule(p.courseId, p.moduleId);
      if (p.courseId) return paths.course(p.courseId);
      return paths.courses();
    case AppView.KNOWLEDGE_GRAPH:
      return paths.knowledgeGraph();
    case AppView.LIVE_TUTOR:
      return paths.liveTutor();
    case AppView.SIMULATION:
      return paths.scenarioLab();
    case AppView.PATHFINDER:
      return paths.pathfinder();
    case AppView.MEETING_PREP:
      return paths.meetingPrep();
    case AppView.CREATOR_STUDIO:
      return paths.courseBuilder();
    case AppView.TWIN_MANAGER:
      return paths.twinLab();
    case AppView.IMPACT:
      return paths.impact();
    case AppView.TEAM_MANAGEMENT:
      if (p.teamId) return paths.workforceTeam(p.teamId);
      return paths.workforce();
    case AppView.COHORT_PROGRAM:
      return paths.cohorts();
    case AppView.EXTERNAL_ASSESSMENT:
      if (p.assessmentId) return paths.assessment(p.assessmentId);
      return paths.assessments();
    case AppView.AFFILIATE:
      return paths.rewards();
    case AppView.ADMIN_PANEL:
      return paths.admin();
    case AppView.SETTINGS:
      return paths.settings();
    case AppView.SUBSCRIPTION:
      return paths.subscription();
    case AppView.PUBLIC_AGENT:
      if (p.embedTwinId) return paths.embedAgent(p.embedTwinId);
      return paths.landing();
    default:
      return paths.dashboard();
  }
}

/** Paths that do not require authentication */
export function isPublicPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/';
  if (normalized === '/' || normalized === '/login' || normalized === '/about') return true;
  if (EMBED_REGEX.test(normalized)) return true;
  return false;
}
