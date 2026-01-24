import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Activity, 
  CreditCard, 
  Trophy, 
  ShieldAlert, 
  Search, 
  Download,
  MoreVertical,
  UserCheck,
  UserX,
  PieChart,
  BarChart3,
  Globe,
  Zap,
  Lock,
  LogOut,
  BookOpen,
  CheckCircle,
  XCircle,
  FileText,
  Star,
  Tag,    
  Plus,   
  Edit,   
  Save,
  MessageSquare,
  AlertTriangle,
  Wrench,
  Lightbulb,
  Trash2,
  Mail,
  ShoppingCart,
  Server,
  CloudLightning,
  ShieldCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart, 
  Line,
  AreaChart, 
  Area
} from 'recharts';
import { UserRole, SubscriptionTier, Course, CourseStatus, FeedbackItem, FeedbackType } from '../types';
import { PaymentModal } from './PaymentModal';

const REVENUE_DATA = [
    { month: 'Jan', revenue: 12000 },
    { month: 'Feb', revenue: 45000 },
    { month: 'Mar', revenue: 89000 },
    { month: 'Apr', revenue: 165000 },
    { month: 'May', revenue: 245000 },
    { month: 'Jun', revenue: 410000 }, // Scaling to 1M goal
];

const USER_DATA = [
    { month: 'Jan', users: 5000 },
    { month: 'Feb', users: 15000 },
    { month: 'Mar', users: 42000 },
    { month: 'Apr', users: 150000 },
    { month: 'May', users: 480000 },
    { month: 'Jun', users: 1024500 }, // 1M MAU Reached
];

const INITIAL_PLANS = [
  { id: 'free', name: 'Free Tier', price: 0, users: 850000, features: ['2 Courses', 'Community Support', 'Basic Access'] },
  { id: 'pro', name: 'Professional', price: 29, users: 120000, features: ['Career Pathfinder', 'Meeting Prep Agent', 'AI Tutor', 'Focus Mode'] },
  { id: 'expert-studio', name: 'Expert (Studio)', price: 299, users: 45000, features: ['500 Users', '3 Co-Experts', 'Free Hybrid Events', 'Brain Dump'] },
  { id: 'org-ent', name: 'Organization (Ent)', price: 999, users: 9500, features: ['1000 Users', 'Unlimited Invites', 'Free Hybrid Events', 'SSO'] },
];

interface SuperAdminDashboardProps {
    courses?: Course[];
    onUpdateCourse?: (id: string, updates: Partial<Course>) => void;
    onDeleteCourse?: (id: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ courses = [], onUpdateCourse, onDeleteCourse }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DISTRIBUTED' | 'FINANCE' | 'CONTENT' | 'PRICING' | 'FEEDBACK'>('OVERVIEW');
  
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('0');
  
  const [testPaymentOpen, setTestPaymentOpen] = useState(false);
  const [testPlan, setTestPlan] = useState<{name: string, price: number} | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);

  useEffect(() => {
      const stored = localStorage.getItem('knovatwin_feedback');
      if (stored) {
          try {
              setFeedbackList(JSON.parse(stored));
          } catch (e) {
              console.error("Failed to parse feedback", e);
          }
      }
  }, [activeTab]);

  const pendingCourses = courses.filter(c => c.status === CourseStatus.PENDING_APPROVAL);
  const publishedCourses = courses.filter(c => c.status === CourseStatus.PUBLISHED);

  const handleApprove = (id: string) => onUpdateCourse?.(id, { status: CourseStatus.PUBLISHED });
  const handleReject = (id: string) => onUpdateCourse?.(id, { status: CourseStatus.REJECTED });
  const handleToggleDefault = (id: string, currentStatus: boolean) => onUpdateCourse?.(id, { isDefault: !currentStatus });
  const handleDelete = (id: string) => onDeleteCourse?.(id);

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total MRR</p>
              <h3 className="text-3xl font-bold text-slate-900">$14.2M</h3>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            <TrendingUp size={14} /> +18% vs last month
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Global MAU</p>
              <h3 className="text-3xl font-bold text-slate-900">1.02M</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
            <TrendingUp size={14} /> +4.2k today
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">App Stability</p>
              <h3 className="text-3xl font-bold text-slate-900">99.98%</h3>
            </div>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ShieldCheck size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400">Targeting 4 nines</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Network Sync</p>
              <h3 className="text-3xl font-bold text-slate-900">Healthy</h3>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <CloudLightning size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-400">12 Edge Nodes Active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-slate-800 mb-6">Revenue Scale (Projected)</h3>
           <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={REVENUE_DATA}>
                       <defs>
                           <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                           </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis dataKey="month" axisLine={false} tickLine={false} />
                       <YAxis axisLine={false} tickLine={false} />
                       <Tooltip />
                       <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" />
                   </AreaChart>
               </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-slate-800 mb-6">User Acquisition (Growth)</h3>
           <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={USER_DATA}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} />
                       <XAxis dataKey="month" axisLine={false} tickLine={false} />
                       <YAxis axisLine={false} tickLine={false} />
                       <Tooltip />
                       <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} dot={{r: 4}} />
                   </LineChart>
               </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );

  const renderDistributed = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
            <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3"><Server className="text-cyan-400" /> Distributed Engine Monitoring</h2>
                <p className="text-slate-400 max-w-2xl mb-8">You are currently monitoring **1.2M browser nodes** performing inference at the edge. Centralized API costs remain near zero.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Global Sync Latency</div>
                        <div className="text-3xl font-bold text-emerald-400">12ms</div>
                        <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 w-full animate-pulse"></div>
                        </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Edge Cache Efficiency</div>
                        <div className="text-3xl font-bold text-cyan-400">99.8%</div>
                        <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400 w-full"></div>
                        </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Compute Offload Value</div>
                        <div className="text-3xl font-bold text-amber-400">$3.2M/mo</div>
                        <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 w-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Node Health Map</h3>
                <div className="grid grid-cols-8 gap-2">
                    {Array.from({length: 32}).map((_, i) => (
                        <div key={i} className="aspect-square bg-emerald-500 rounded shadow-sm animate-pulse" style={{animationDelay: `${i*100}ms`}}></div>
                    ))}
                </div>
                <p className="mt-4 text-xs text-slate-400 italic">Aggregated heartbeat from 1M+ active inference points.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Regional Traffic</h3>
                <div className="space-y-3">
                    {['US-East', 'US-West', 'EU-West', 'AP-South'].map(region => (
                        <div key={region} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">{region}</span>
                            <div className="flex-1 mx-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{width: `${Math.random()*40 + 60}%`}}></div>
                            </div>
                            <span className="text-xs font-bold text-slate-900">Active</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );

  const renderContent = () => (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-orange-50">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><ShieldAlert size={20} /></div>
                      <div>
                          <h3 className="font-bold text-slate-900">Approval Queue</h3>
                          <p className="text-xs text-slate-500">{pendingCourses.length} courses waiting for review</p>
                      </div>
                  </div>
              </div>
              
              {pendingCourses.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                      {pendingCourses.map(course => (
                          <div key={course.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                              <div className="flex items-start gap-4">
                                  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                      {course.thumbnailUrl ? <img src={course.thumbnailUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><BookOpen size={20}/></div>}
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-slate-900">{course.title}</h4>
                                      <p className="text-sm text-slate-500 mb-1 line-clamp-1">{course.description}</p>
                                      <div className="flex items-center gap-3 text-xs">
                                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{course.authorName}</span>
                                          <span className="text-slate-400">{new Date(course.createdAt).toLocaleDateString()}</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex gap-2 w-full md:w-auto">
                                  <button onClick={() => handleReject(course.id)} className="flex-1 md:flex-none px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-bold">Reject</button>
                                  <button onClick={() => handleApprove(course.id)} className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-bold">Approve & Publish</button>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="p-12 text-center text-slate-400">
                      <CheckCircle size={48} className="mx-auto mb-4 text-emerald-200" />
                      <p className="font-bold text-slate-600">All Caught Up!</p>
                  </div>
              )}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg"><Lock size={20} /></div>
            <div>
                <h1 className="font-bold text-lg leading-tight">Super Admin Console</h1>
                <p className="text-xs text-slate-400">Scale Mode: 1M MAU Active</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
                <p className="text-sm font-bold">knovaadmin</p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                   <Globe size={10} /> Edge Sync Active
                </div>
            </div>
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold shadow-lg shadow-indigo-900/50">SA</div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
            <nav className="flex-1 p-4 space-y-2">
                <button onClick={() => setActiveTab('OVERVIEW')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'OVERVIEW' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <Activity size={18} /> Business Overview
                </button>
                <button onClick={() => setActiveTab('DISTRIBUTED')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'DISTRIBUTED' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <Server size={18} /> Distributed Engine
                </button>
                <button onClick={() => setActiveTab('CONTENT')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'CONTENT' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <BookOpen size={18} /> Content Approvals
                    {pendingCourses.length > 0 && <span className="ml-auto bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCourses.length}</span>}
                </button>
                <button onClick={() => setActiveTab('PRICING')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'PRICING' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <Tag size={18} /> Monetization
                </button>
                <button onClick={() => setActiveTab('FEEDBACK')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'FEEDBACK' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>
                    <MessageSquare size={18} /> Global Feedback
                </button>
            </nav>
            <div className="p-4 border-t border-slate-100">
                <button onClick={() => window.location.reload()} className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-red-600 py-2 text-xs font-bold transition-colors">
                    <LogOut size={14} /> Exit System Admin
                </button>
            </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
            {activeTab === 'OVERVIEW' && renderOverview()}
            {activeTab === 'DISTRIBUTED' && renderDistributed()}
            {activeTab === 'CONTENT' && renderContent()}
            {activeTab === 'PRICING' && <div>Pricing & Plans (Enabled for scale)</div>}
            {activeTab === 'FEEDBACK' && <div>Feedback Inbox</div>}
        </main>
      </div>
    </div>
  );
};