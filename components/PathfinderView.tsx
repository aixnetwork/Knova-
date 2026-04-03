
import React, { useState, useEffect, useMemo } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import { Target, ArrowRight, Zap, BookOpen, Search, Briefcase, TrendingUp, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { pathfinderApi, coursesApi, type PathfinderStateRes, type CourseRes } from '../services/api';

const DEFAULT_SKILL_DATA = [
  { subject: 'Strategic Thinking', A: 60, B: 90, fullMark: 100 },
  { subject: 'Data Fluency', A: 40, B: 85, fullMark: 100 },
  { subject: 'Leadership', A: 70, B: 80, fullMark: 100 },
  { subject: 'Technical Ops', A: 85, B: 60, fullMark: 100 },
  { subject: 'Communication', A: 65, B: 95, fullMark: 100 },
  { subject: 'Project Mgmt', A: 90, B: 70, fullMark: 100 },
];

interface PathfinderViewProps {
  user: UserProfile | null;
  onClose: () => void;
  onEnrolledInBridge?: () => void;
}

export const PathfinderView: React.FC<PathfinderViewProps> = ({ user, onClose, onEnrolledInBridge }) => {
  const [targetRole, setTargetRole] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [skillData, setSkillData] = useState(DEFAULT_SKILL_DATA);
  const [recommendedCourseIds, setRecommendedCourseIds] = useState<string[]>([]);
  const [allCourses, setAllCourses] = useState<CourseRes[]>([]);
  const [loadingState, setLoadingState] = useState(true);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved pathfinder state on mount
  useEffect(() => {
    if (!user) {
      setLoadingState(false);
      return;
    }
    setError(null);
    pathfinderApi
      .get()
      .then((res) => {
        const state = res?.data as PathfinderStateRes | null | undefined;
        if (!state) {
          setLoadingState(false);
          return;
        }
        setTargetRole(state.targetRole || '');
        try {
          const parsed = JSON.parse(state.skillData || '[]');
          if (Array.isArray(parsed) && parsed.length > 0) setSkillData(parsed);
        } catch {
          // keep default skill data
        }
        if (state.recommendedCourseIds?.length) {
          setRecommendedCourseIds(state.recommendedCourseIds);
        }
        setAnalysisComplete(!!(state.targetRole && (state.recommendedCourseIds?.length || state.skillData)));
      })
      .catch(() => setError('Could not load your pathfinder state.'))
      .finally(() => setLoadingState(false));
  }, [user]);

  // Load course list for displaying recommended course names
  useEffect(() => {
    if (recommendedCourseIds.length === 0) return;
    coursesApi
      .list()
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        setAllCourses(list);
      })
      .catch(() => {});
  }, [recommendedCourseIds.length]);

  const recommendedCourses = useMemo(() => {
    if (recommendedCourseIds.length === 0 || allCourses.length === 0) return [];
    return recommendedCourseIds
      .map((id) => allCourses.find((c) => c.id === id))
      .filter((c): c is CourseRes => c != null);
  }, [recommendedCourseIds, allCourses]);

  const handleAnalyze = async () => {
    if (!targetRole.trim()) return;
    setError(null);
    setIsAnalyzing(true);
    try {
      const payload = {
        targetRole: targetRole.trim(),
        skillData: JSON.stringify(skillData),
      };
      await pathfinderApi.save(payload);
      const recRes = await pathfinderApi.getRecommendedCourseIds(targetRole.trim());
      const ids = recRes?.data?.courseIds ?? [];
      await pathfinderApi.save({
        ...payload,
        recommendedCourseIds: ids,
      });
      setRecommendedCourseIds(ids);
      setAnalysisComplete(true);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Analysis failed';
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEnrollBridge = async () => {
    if (recommendedCourseIds.length === 0) {
      setError('No courses in your bridge path. Enter a target role and click "Map Gap" to get recommendations, then try again.');
      return;
    }
    setError(null);
    setEnrollLoading(true);
    try {
      const res = await pathfinderApi.enrollBridge();
      const enrolled = (res?.data as { enrolled?: string[] })?.enrolled ?? [];
      if (enrolled.length > 0 && onEnrolledInBridge) {
        onEnrolledInBridge();
      } else if (enrolled.length > 0) {
        onClose();
      } else {
        setError('No courses in your bridge path to enroll in. Run "Map Gap" again to refresh recommendations.');
      }
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Enroll failed';
      setError(msg);
    } finally {
      setEnrollLoading(false);
    }
  };

  if (loadingState) {
    return (
      <div className="bg-slate-50 min-h-full p-4 md:p-8 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 size={24} className="animate-spin" /> Loading pathfinder…
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-full p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Target className="text-rose-600" />
              AI Career Pathfinder
            </h1>
            <p className="text-slate-500 mt-2">Visualize your skill gaps and generate a bridge to your dream role.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 font-bold text-sm">Exit Pathfinder</button>
        </div>

        {error && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!analysisComplete ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xl max-w-3xl mx-auto mt-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500"></div>
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
              <Briefcase size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Where do you want to be in 2 years?</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">Enter a target job title. We’ll save your path and recommend courses to close the gap.</p>
            <div className="relative max-w-md mx-auto">
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Chief Product Officer"
                className="w-full p-4 pl-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-lg shadow-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <button
                onClick={handleAnalyze}
                disabled={!targetRole.trim() || isAnalyzing}
                className="absolute right-2 top-2 bottom-2 bg-slate-900 text-white px-6 rounded-lg font-bold hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Mapping…
                  </>
                ) : (
                  'Map Gap'
                )}
              </button>
            </div>
            <div className="mt-8 flex justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><TrendingUp size={12} /> Market Data Live</span>
              <span className="flex items-center gap-1"><Zap size={12} /> AI Personalized</span>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Target size={18} className="text-rose-500" /> Gap Analysis: {targetRole}
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                      <PolarGrid gridType="circle" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Current" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                      <Radar name="Required" dataKey="B" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-xs font-bold">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500/30 border border-indigo-500 rounded-full"></div> You</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500/10 border border-rose-500 rounded-full"></div> {targetRole}</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Zap size={18} className="text-amber-500" /> Recommended Bridge Curriculum
                </h3>
                <div className="space-y-4 flex-1">
                  {recommendedCourses.length === 0 && recommendedCourseIds.length > 0 && (
                    <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
                      <Loader2 size={18} className="animate-spin" /> Loading courses…
                    </div>
                  )}
                  {recommendedCourses.length === 0 && recommendedCourseIds.length === 0 && (
                    <p className="text-slate-500 text-sm py-4">No recommended courses yet. Publish more courses to see suggestions.</p>
                  )}
                  {recommendedCourses.map((course, idx) => (
                    <div
                      key={course.id}
                      className={`p-4 border rounded-xl flex items-start gap-4 transition-colors ${
                        idx === 0 ? 'border-indigo-100 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg shadow-sm ${idx === 0 ? 'bg-white text-indigo-600' : 'bg-white text-rose-500'}`}>
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{course.title ?? course.topic}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>
                        <span className={`text-[10px] font-bold mt-2 inline-block px-2 py-1 rounded uppercase tracking-wide ${
                          idx === 0 ? 'bg-white border border-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {idx === 0 ? 'High Priority' : 'Recommended'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {recommendedCourseIds.length === 0 && (
                  <p className="text-sm text-slate-500 mt-2">Run &quot;Map Gap&quot; above to get recommended courses, then enroll here.</p>
                )}
                <button
                  type="button"
                  onClick={handleEnrollBridge}
                  disabled={enrollLoading}
                  className="w-full mt-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrollLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Enrolling…
                    </>
                  ) : (
                    <>
                      Enroll in Bridge Path <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
