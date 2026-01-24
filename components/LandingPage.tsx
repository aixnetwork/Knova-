
import React, { useState } from 'react';
import { 
  Brain, 
  TrendingUp, 
  ArrowRight, 
  Zap, 
  CheckCircle, 
  Key, 
  Menu, 
  Check, 
  X, 
  Network, 
  Star, 
  Sparkles, 
  Twitter, 
  Linkedin, 
  Facebook,
  Globe,
  ChevronDown,
  MessageSquare,
  Fingerprint,
  Users,
  Building,
  Cpu,
  MonitorPlay,
  Layers,
  Image as ImageIcon, 
  Database,
  Crown,
  Gift,
  Activity,
  Briefcase,
  Play,
  Upload,
  PlayCircle,
  Quote,
  XCircle,
  UserPlus,
  ShieldCheck,
  Clock,
  HelpCircle,
  Mail,
  Lock,
  Shield
} from 'lucide-react';
import { UserProfile, UserRole, SubscriptionTier, AppView } from '../types';
import { Logo } from './Logo';

interface LandingPageProps {
  onEnterApp: (user: UserProfile) => void;
  onNavigate: (view: AppView) => void;
}

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education", "Manufacturing", 
  "Retail", "Consulting", "Media", "Government", "Non-Profit", "Other"
];

const LEARNER_INTERESTS = [
  "Artificial Intelligence", "Data Science", "Leadership & Management", 
  "Digital Marketing", "Project Management", "Software Development", 
  "Sales & Negotiation", "Cybersecurity", "Product Design", "Finance & Investing"
];

const LEARNER_STATUSES = [
    "Student / Academic",
    "Employed (Up-skilling)",
    "Seeking New Role",
    "Founder / Entrepreneur",
    "Executive Leadership"
];

const REVENUE_RANGES = ["Pre-Revenue / Seed", "$1M - $10M", "$10M - $50M", "$50M - $100M", "$100M+"];
const EMPLOYEE_RANGES = ["1 - 10 Employees", "11 - 50 Employees", "51 - 200 Employees", "201 - 1,000 Employees", "1,000+ Employees"];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [regRoleType, setRegRoleType] = useState<'LEARNER' | 'EXPERT' | 'COMPANY'>('LEARNER');
  
  // Pricing Toggles
  const [expertLevel, setExpertLevel] = useState<'SOLO' | 'STUDIO'>('SOLO');
  const [orgLevel, setOrgLevel] = useState<'MID' | 'LARGE'>('MID');
  
  // FAQ Toggle
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Legal Modal State
  const [activeLegalModal, setActiveLegalModal] = useState<'PRIVACY' | 'SECURITY' | 'TERMS' | null>(null);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  // Learner Fields
  const [regLearnerStatus, setRegLearnerStatus] = useState('');
  const [regInterest, setRegInterest] = useState('');
  
  // Expert Fields
  const [regJobTitle, setRegJobTitle] = useState('');
  const [regExpertise, setRegExpertise] = useState('');
  const [regIndustry, setRegIndustry] = useState(''); // Shared with Company
  
  // Company Fields
  const [regOrgName, setRegOrgName] = useState('');
  const [regRevenue, setRegRevenue] = useState('');
  const [regEmployees, setRegEmployees] = useState('');

  const handleAuth = (e: React.FormEvent) => {
      e.preventDefault();
      const normalizedEmail = regEmail.trim().toLowerCase();
      
      // Super Admin Check
      if (normalizedEmail === 'knovaadmin' || (regName && regName.toLowerCase() === 'knovaadmin')) {
          onEnterApp({
              id: `user-godmode-${Date.now()}`,
              name: 'Knova Admin',
              email: normalizedEmail,
              role: UserRole.ADMIN,       
              tier: SubscriptionTier.COMPANY, 
              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=knovaadmin`,
              isCreatorMode: true,
              title: "System Administrator",
              bio: "Platform Super Admin"
          });
          return;
      }

      let finalRole = UserRole.LEARNER;
      let finalTier = SubscriptionTier.FREE;
      let finalTitle = regJobTitle;
      let finalIndustry = regIndustry;
      let finalInterests = regInterest ? [regInterest] : [];
      let finalBio = "";

      if (regRoleType === 'COMPANY') {
          finalRole = UserRole.ADMIN; 
          finalTier = SubscriptionTier.COMPANY; 
          finalTitle = "Company Admin";
          finalBio = `Org: ${regOrgName || 'My Company'}`;
          finalIndustry = regIndustry || 'General';
      } else if (regRoleType === 'EXPERT') {
          finalRole = UserRole.FACILITATOR;
          finalTier = SubscriptionTier.EXPERT; 
          finalTitle = regExpertise ? `Expert in ${regExpertise}` : regJobTitle;
          finalBio = `Expertise: ${regExpertise}`;
          finalIndustry = regIndustry || 'General';
      } else {
          finalRole = UserRole.LEARNER;
          finalTier = SubscriptionTier.FREE;
          finalBio = `Status: ${regLearnerStatus}`;
      }

      onEnterApp({
          id: `user-${Date.now()}`,
          name: regName || normalizedEmail.split('@')[0] || 'New User',
          email: normalizedEmail,
          role: finalRole, 
          tier: finalTier, 
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${regName || normalizedEmail}`,
          isCreatorMode: finalRole === UserRole.FACILITATOR || finalRole === UserRole.ADMIN,
          title: finalTitle || 'Member',
          industry: finalIndustry || 'General',
          interests: finalInterests,
          bio: finalBio
      });
  };

  const scrollToTop = () => {
      const element = document.getElementById('landing-top');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const scrollToAuth = () => {
      const el = document.getElementById('auth-card');
      if(el) el.scrollIntoView({behavior: 'smooth'});
  };

  const toggleFaq = (index: number) => {
      setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const FAQ_ITEMS = [
      { q: "Who owns the Intellectual Property (IP)?", a: "You do. KnovaTwin creates the digital model, but the underlying knowledge, content, and the resulting Twin's personality remain 100% your intellectual property." },
      { q: "Is my data secure?", a: "Yes. We use enterprise-grade encryption for all data at rest and in transit. Your Knowledge Base is siloed and never shared with other organizations or used to train public models without explicit consent." },
      { q: "How long does it take to create a Twin?", a: "Minutes. You can upload existing PDFs, documents, or videos to get started immediately. For deeper judgment capture, our 'Brain Dump' interview mode can refine your Twin in about an hour." },
      { q: "Can I embed the Twin on my own website?", a: "Absolutely. The Expert and Organization plans provide a simple embed code (iframe) that works on WordPress, Webflow, React, and any custom site." },
      { q: "What happens if I cancel?", a: "You can download your course data and analytics. Your public-facing Twin will go offline at the end of the billing cycle, but your account data is preserved for 90 days in case you reactivate." }
  ];

  return (
    <div id="landing-top" className="w-full h-full overflow-y-auto bg-slate-950 font-sans text-slate-100 relative selection:bg-indigo-500 selection:text-white scroll-smooth">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-indigo-950 border-b border-white/10 relative z-50">
          <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4 text-center">
              <span className="flex items-center gap-2 text-xs md:text-sm font-bold text-white tracking-wide">
                  <Sparkles size={14} className="text-amber-400" /> 
                  Join the AI Wisdom Revolution.
              </span>
              <span className="hidden md:inline text-indigo-500">•</span>
              <span className="text-[10px] md:text-xs text-indigo-200/90 font-medium leading-tight">
                  Preserve expertise, accelerate AI adoption, and unify collaborative intelligence.
              </span>
          </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={scrollToTop}>
            <Logo showTagline={false} lightText={true} />
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Why KnovaTwin</a>
            <a href="#marketplace" onClick={(e) => handleNavClick(e, 'marketplace')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Marketplace</a>
            <a href="#pricing" onClick={(e) => handleNavClick(e, 'pricing')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Pricing</a>
            <button onClick={() => onNavigate(AppView.ABOUT)} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">About Us</button>
            <button 
              onClick={scrollToAuth}
              className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-indigo-50 transition-all transform hover:-translate-y-0.5"
            >
              Get Started
            </button>
          </div>

          <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-300 hover:text-white">
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 md:pt-24 pb-20 md:pb-32 overflow-hidden px-4 md:px-6 bg-[#0B1120]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center relative z-10">
            {/* Hero Text */}
            <div className="lg:col-span-7 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-8 shadow-lg backdrop-blur-md hover:bg-white/10 transition-colors cursor-default">
                    <Zap size={14} className="fill-indigo-400 text-indigo-400" /> V2.5 Now Live
                </div>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-white">
                    Never lose wisdom again. <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500">Clone it. Scale it. Live forever.</span>
                </h1>
                <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light tracking-wide">
                    The AI-Powered Knowledge Twin platform. Capture tacit judgment, build instant courses, and bridge the skills gap with digital experts.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start text-sm text-slate-400 font-medium mb-12">
                    <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50 hover:border-slate-600 transition-colors cursor-default">
                        <CheckCircle size={16} className="text-emerald-400 shrink-0" /> 
                        <span>Free Plan: 2 AI Courses</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50 hover:border-slate-600 transition-colors cursor-default">
                        <Key size={16} className="text-amber-400 shrink-0" /> 
                        <span>BYO-Key: Secure & Private</span>
                    </div>
                </div>

                <div className="mt-8 flex justify-center lg:justify-start">
                    <button 
                        onClick={scrollToAuth}
                        className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-50 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-3 group active:scale-95"
                    >
                        Preserve Your Expertise <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Hero Auth Card */}
            <div className="lg:col-span-5 space-y-8">
                <div id="auth-card" className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative group hover:border-white/20 transition-colors">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold text-white mb-2">{isLoginMode ? 'Welcome Back' : 'Create Free Account'}</h3>
                            <p className="text-sm text-slate-400">Join the movement. Start building your legacy.</p>
                        </div>

                        <div className="flex bg-slate-900/50 p-1 rounded-lg mb-6 border border-slate-800">
                            {['LEARNER', 'EXPERT', 'COMPANY'].map(type => (
                                <button 
                                    key={type}
                                    onClick={() => setRegRoleType(type as any)}
                                    className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all ${regRoleType === type ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {type.charAt(0) + type.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleAuth} className="space-y-4">
                            {!isLoginMode && regRoleType === 'LEARNER' && (
                                <div className="grid grid-cols-1 gap-3">
                                    <select value={regLearnerStatus} onChange={(e) => setRegLearnerStatus(e.target.value)} className="w-full px-4 py-3 bg-black/20 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white text-sm outline-none transition-all focus:bg-black/40">
                                        <option value="" disabled className="text-slate-500">Current Status</option>
                                        {LEARNER_STATUSES.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                                    </select>
                                    <select value={regInterest} onChange={(e) => setRegInterest(e.target.value)} className="w-full px-4 py-3 bg-black/20 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white text-sm outline-none transition-all focus:bg-black/40">
                                        <option value="" disabled className="text-slate-500">Primary Interest</option>
                                        {LEARNER_INTERESTS.map(i => <option key={i} value={i} className="bg-slate-900">{i}</option>)}
                                    </select>
                                </div>
                            )}

                            {!isLoginMode && regRoleType === 'EXPERT' && (
                                <div className="space-y-3">
                                    <input type="text" placeholder="Area of Expertise" value={regExpertise} onChange={(e) => setRegExpertise(e.target.value)} className="w-full px-4 py-3 bg-black/20 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-500 text-sm outline-none transition-all focus:bg-black/40" />
                                    <select value={regIndustry} onChange={(e) => setRegIndustry(e.target.value)} className="w-full px-4 py-3 bg-black/20 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white text-sm outline-none transition-all focus:bg-black/40">
                                        <option value="" disabled className="text-slate-500">Select Industry</option>
                                        {INDUSTRIES.map(i => <option key={i} value={i} className="bg-slate-900">{i}</option>)}
                                    </select>
                                </div>
                            )}

                            {!isLoginMode && regRoleType === 'COMPANY' && (
                                <div className="space-y-3">
                                    <input type="text" placeholder="Organization Name" value={regOrgName} onChange={(e) => setRegOrgName(e.target.value)} className="w-full px-4 py-3 bg-black/20 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-500 text-sm outline-none transition-all focus:bg-black/40" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <select value={regRevenue} onChange={(e) => setRegRevenue(e.target.value)} className="w-full px-4 py-3 bg-black/20 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white text-sm outline-none transition-all focus:bg-black/40">
                                            <option value="" disabled className="text-slate-500">Revenue</option>
                                            {REVENUE_RANGES.map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
                                        </select>
                                        <select value={regEmployees} onChange={(e) => setRegEmployees(e.target.value)} className="w-full px-4 py-3 bg-black/20 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white text-sm outline-none transition-all focus:bg-black/40">
                                            <option value="" disabled className="text-slate-500">Employees</option>
                                            {EMPLOYEE_RANGES.map(e => <option key={e} value={e} className="bg-slate-900">{e}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {!isLoginMode && (
                                <input type="text" required placeholder="Full Name" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full px-4 py-3 bg-black/20 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-500 text-sm outline-none transition-all focus:bg-black/40" />
                            )}
                            <input type="text" required placeholder={isLoginMode ? "Email / Username" : "Email Address"} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full px-4 py-3 bg-black/20 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-500 text-sm outline-none transition-all focus:bg-black/40" />
                            <input type="password" required placeholder="Password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full px-4 py-3 bg-black/20 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-500 text-sm outline-none transition-all focus:bg-black/40" />

                            <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-lg mt-4 text-base active:scale-95 transform">
                                {isLoginMode ? `Log In as ${regRoleType.charAt(0) + regRoleType.slice(1).toLowerCase()}` : 'Start Creating Free'}
                            </button>
                        </form>
                        <div className="text-center mt-6">
                            <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-xs text-indigo-300 hover:text-white hover:underline transition-colors">{isLoginMode ? "Need an account?" : "Already have an account?"}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 border-b border-slate-900/50 bg-[#0B1120]">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Trusted by Forward-Thinking Teams</p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                  <h3 className="text-xl font-black text-white font-serif tracking-widest">ACME Corp</h3>
                  <h3 className="text-xl font-black text-white font-sans tracking-tight">GlobalTech</h3>
                  <h3 className="text-xl font-black text-white font-mono">Nebula.ai</h3>
                  <h3 className="text-xl font-black text-white tracking-wide">QuantumSoft</h3>
                  <h3 className="text-xl font-black text-white font-serif italic">Velocis</h3>
              </div>
          </div>
      </section>

      {/* Use Case Section */}
      <section id="marketplace" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for Visionaries who Scale</h2>
                  <p className="text-slate-500 max-w-2xl mx-auto">Whether you're a solo expert or a growing enterprise, KnovaTwin adapts to your wisdom.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                  {/* For Experts */}
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 hover:border-purple-300 transition-colors group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-purple-200 transition-colors"></div>
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-purple-600 relative z-10">
                          <Crown size={32} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">The Expert Consultant</h3>
                      <p className="text-slate-600 mb-6 leading-relaxed">
                          Stop trading time for money. Capture your unique methodology into an AI Twin that can mentor 1,000 clients simultaneously. Monetize your sleep.
                      </p>
                      <ul className="space-y-3 mb-8">
                          <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                              <CheckCircle size={18} className="text-purple-600" /> Convert books/blogs to active agents
                          </li>
                          <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                              <CheckCircle size={18} className="text-purple-600" /> Embed your Twin on your website
                          </li>
                          <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                              <CheckCircle size={18} className="text-purple-600" /> Generate passive income streams
                          </li>
                      </ul>
                      <button onClick={() => { setRegRoleType('EXPERT'); scrollToAuth(); }} className="w-full py-3 bg-white border-2 border-purple-100 text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
                          Start as Expert <ArrowRight size={16}/>
                      </button>
                  </div>

                  {/* For SMBs */}
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 hover:border-indigo-300 transition-colors group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-200 transition-colors"></div>
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-indigo-600 relative z-10">
                          <Users size={32} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">The Growing Team</h3>
                      <p className="text-slate-600 mb-6 leading-relaxed">
                          Your senior staff are drowning in repetitive questions. Clone their knowledge to onboard new hires 50% faster and create a unified "Team Brain".
                      </p>
                      <ul className="space-y-3 mb-8">
                          <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                              <CheckCircle size={18} className="text-indigo-600" /> Reduce onboarding time by weeks
                          </li>
                          <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                              <CheckCircle size={18} className="text-indigo-600" /> Prevent knowledge loss from turnover
                          </li>
                          <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                              <CheckCircle size={18} className="text-indigo-600" /> Instant answers in Slack/Teams
                          </li>
                      </ul>
                      <button onClick={() => { setRegRoleType('COMPANY'); scrollToAuth(); }} className="w-full py-3 bg-white border-2 border-indigo-100 text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                          Start for Teams <ArrowRight size={16}/>
                      </button>
                  </div>
              </div>
          </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">From Brain to Bot in Minutes</h2>
                  <p className="text-slate-500 max-w-2xl mx-auto">Stop writing static documentation. Start cloning your expertise.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                  <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-indigo-100 -z-10"></div>
                  
                  <div className="text-center relative group">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100 mx-auto mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
                          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                              <Upload size={32}/>
                          </div>
                          <div className="absolute -top-2 -right-2 bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-4 border-white">1</div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Capture</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">Upload documents or do a quick "Brain Dump" interview with our AI to extract tacit knowledge.</p>
                  </div>

                  <div className="text-center relative group">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100 mx-auto mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
                          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                              <Sparkles size={32}/>
                          </div>
                          <div className="absolute -top-2 -right-2 bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-4 border-white">2</div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Clone</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">Our engine generates an interactive Course and a Digital Twin persona that mimics your judgment.</p>
                  </div>

                  <div className="text-center relative group">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100 mx-auto mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
                          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                              <PlayCircle size={32}/>
                          </div>
                          <div className="absolute -top-2 -right-2 bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-4 border-white">3</div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Scale</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">Deploy to your team or embed on your site. The Twin teaches, tests, and guides users 24/7.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* Pricing Grid */}
      <section id="pricing" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Unlock the Knowledge Engine</h2>
                  <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                      Choose the plan that fits your ambition. From individual mastery to organizational intelligence.
                  </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
                  {/* Professional */}
                  <div className="p-8 rounded-3xl border border-slate-200 bg-white flex flex-col hover:shadow-xl transition-all">
                      <h3 className="font-bold text-slate-900 text-xl mb-2 flex items-center gap-2"><Zap className="text-blue-600" size={20}/> Professional</h3>
                      <div className="text-4xl font-extrabold text-slate-900 mb-2">$29<span className="text-lg font-medium text-slate-400">/mo</span></div>
                      <p className="text-xs text-slate-500 mb-6">For ambitious learners wanting AI-accelerated growth.</p>
                      
                      <ul className="space-y-4 mb-8 text-sm text-slate-600 flex-1">
                          <li className="flex gap-3"><CheckCircle size={18} className="text-blue-600 shrink-0"/> Personal AI Tutor</li>
                          <li className="flex gap-3"><CheckCircle size={18} className="text-blue-600 shrink-0"/> Career Pathfinder</li>
                          <li className="flex gap-3"><CheckCircle size={18} className="text-blue-600 shrink-0"/> 5 Active Courses</li>
                      </ul>
                      <button onClick={scrollToAuth} className="w-full py-3 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors">Start Trial</button>
                  </div>

                  {/* Expert */}
                  <div className="p-8 rounded-3xl border-2 border-purple-600 bg-white relative shadow-xl transform md:-translate-y-4 z-10 flex flex-col">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                          <Sparkles size={12}/> Creator's Choice
                      </div>
                      
                      <h3 className="font-bold text-slate-900 text-xl mb-4 flex items-center gap-2 justify-center"><Crown className="text-purple-600" size={20}/> Expert</h3>
                      
                      <div className="flex justify-center mb-6">
                          <div className="bg-purple-50 p-1 rounded-lg inline-flex">
                              <button onClick={() => setExpertLevel('SOLO')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${expertLevel === 'SOLO' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-400 hover:text-purple-600'}`}>Solo</button>
                              <button onClick={() => setExpertLevel('STUDIO')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${expertLevel === 'STUDIO' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-400 hover:text-purple-600'}`}>Studio</button>
                          </div>
                      </div>

                      <div className="text-4xl font-extrabold text-slate-900 mb-2 text-center animate-in fade-in">${expertLevel === 'SOLO' ? '99' : '299'}<span className="text-lg font-medium text-slate-400">/mo</span></div>
                      <p className="text-xs text-slate-500 mb-6 text-center">For consultants scaling wisdom & monetizing expertise.</p>

                      <ul className="space-y-4 mb-8 text-sm text-slate-600 flex-1">
                          <li className="flex gap-3"><CheckCircle size={18} className="text-purple-600 shrink-0"/> <strong>AI Twin Builder</strong></li>
                          <li className="flex gap-3"><CheckCircle size={18} className="text-purple-600 shrink-0"/> Course Creator Studio</li>
                          <li className="flex gap-3"><CheckCircle size={18} className="text-purple-600 shrink-0"/> Brain Dump Interview</li>
                          <li className="flex gap-3"><CheckCircle size={18} className="text-purple-600 shrink-0"/> Up to {expertLevel === 'SOLO' ? '100' : '500'} Users</li>
                          {expertLevel === 'STUDIO' && <li className="flex gap-3 text-purple-700 font-bold animate-in slide-in-from-left-2"><Gift size={18} className="shrink-0"/> Free Hybrid Event Hosting</li>}
                      </ul>
                      <button onClick={scrollToAuth} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">Get Expert</button>
                  </div>

                  {/* Organization */}
                  <div className="p-8 rounded-3xl border border-slate-200 bg-white flex flex-col hover:shadow-xl transition-all">
                      <h3 className="font-bold text-slate-900 text-xl mb-4 flex items-center gap-2 justify-center"><Building className="text-indigo-600" size={20}/> Organization</h3>
                      
                      <div className="flex justify-center mb-6">
                          <div className="bg-indigo-50 p-1 rounded-lg inline-flex">
                              <button onClick={() => setOrgLevel('MID')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${orgLevel === 'MID' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-400 hover:text-indigo-600'}`}>Business</button>
                              <button onClick={() => setOrgLevel('LARGE')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${orgLevel === 'LARGE' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-400 hover:text-indigo-600'}`}>Enterprise</button>
                          </div>
                      </div>

                      <div className="text-4xl font-extrabold text-slate-900 mb-2 text-center animate-in fade-in">${orgLevel === 'MID' ? '499' : '999'}<span className="text-lg font-medium text-slate-400">/mo</span></div>
                      <p className="text-xs text-slate-500 mb-6 text-center">For enterprises building collaborative intelligence.</p>

                      <ul className="space-y-4 mb-8 text-sm text-slate-600 flex-1">
                          <li className="flex gap-3"><CheckCircle size={18} className="text-emerald-500 shrink-0"/> <strong>Up to {orgLevel === 'MID' ? '500' : '1,000'} Active Users</strong></li>
                          <li className="flex gap-3"><CheckCircle size={18} className="text-emerald-500 shrink-0"/> BICE ROI Analytics</li>
                          <li className="flex gap-3"><CheckCircle size={18} className="text-emerald-500 shrink-0"/> Flight Risk Detector</li>
                          <li className="flex gap-3"><CheckCircle size={18} className="text-emerald-500 shrink-0"/> {orgLevel === 'MID' ? 'Internal' : 'External'} Assessments</li>
                      </ul>
                      <button onClick={scrollToAuth} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">Contact Sales</button>
                  </div>
              </div>
          </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-6">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
                  <p className="text-slate-500">Common questions from Experts and Teams.</p>
              </div>
              
              <div className="space-y-4">
                  {FAQ_ITEMS.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          <button 
                              onClick={() => toggleFaq(idx)}
                              className="w-full flex justify-between items-center p-6 text-left hover:bg-slate-50 transition-colors"
                          >
                              <span className="font-bold text-slate-800">{item.q}</span>
                              <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
                          </button>
                          <div className={`overflow-hidden transition-all duration-300 ${openFaqIndex === idx ? 'max-h-48' : 'max-h-0'}`}>
                              <div className="p-6 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-100">
                                  {item.a}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 pt-20 pb-10 text-slate-400 text-sm border-t border-slate-900 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-900/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                  <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity cursor-pointer" onClick={scrollToTop}>
                          <Logo className="w-8 h-8" showText={true} lightText={true} />
                      </div>
                      <p className="text-slate-500 leading-relaxed max-w-sm">
                          The operating system for organizational wisdom. We help companies and experts clone their judgment, scale their impact, and build a legacy that lasts forever.
                      </p>
                      <div className="flex gap-4">
                          <a href="#" className="bg-slate-900 p-2 rounded-full hover:bg-indigo-600 hover:text-white transition-all transform hover:-translate-y-1" aria-label="Twitter">
                              <Twitter size={18} />
                          </a>
                          <a href="#" className="bg-slate-900 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-all transform hover:-translate-y-1" aria-label="LinkedIn">
                              <Linkedin size={18} />
                          </a>
                          <a href="#" className="bg-slate-900 p-2 rounded-full hover:bg-blue-500 hover:text-white transition-all transform hover:-translate-y-1" aria-label="Facebook">
                              <Facebook size={18} />
                          </a>
                      </div>
                  </div>
                  
                  <div>
                      <h4 className="font-bold text-white mb-6">Platform</h4>
                      <ul className="space-y-4">
                          <li><a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')} className="hover:text-indigo-400 transition-colors">Why KnovaTwin</a></li>
                          <li><a href="#marketplace" onClick={(e) => handleNavClick(e, 'marketplace')} className="hover:text-indigo-400 transition-colors">Expert Marketplace</a></li>
                          <li><a href="#features" onClick={(e) => handleNavClick(e, 'features')} className="hover:text-indigo-400 transition-colors">AI Core Engine</a></li>
                          <li><a href="#pricing" onClick={(e) => handleNavClick(e, 'pricing')} className="hover:text-indigo-400 transition-colors">Pricing</a></li>
                      </ul>
                  </div>

                  <div>
                      <h4 className="font-bold text-white mb-6">Legal & Security</h4>
                      <ul className="space-y-4 font-medium">
                          <li><button onClick={() => setActiveLegalModal('PRIVACY')} className="hover:text-indigo-400 transition-colors">Privacy Policy</button></li>
                          <li><button onClick={() => setActiveLegalModal('SECURITY')} className="hover:text-indigo-400 transition-colors">Security Architecture</button></li>
                          <li><button onClick={() => setActiveLegalModal('TERMS')} className="hover:text-indigo-400 transition-colors">Terms of Service</button></li>
                      </ul>
                  </div>

                  <div>
                      <h4 className="font-bold text-white mb-6">Company</h4>
                      <ul className="space-y-4 font-medium">
                          <li><button onClick={() => onNavigate(AppView.ABOUT)} className="hover:text-indigo-400 transition-colors text-left">About Us</button></li>
                          <li><a href="#" className="hover:text-indigo-400 transition-colors">Careers</a></li>
                          <li><a href="https://go.oncehub.com/MattFok" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors flex items-center gap-2"><Mail size={14}/> Contact</a></li>
                      </ul>
                  </div>
              </div>
              
              <div className="pt-8 border-t border-slate-900 flex flex-col gap-6 text-xs text-slate-500">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                          <p>© 2025 KnovaTwin Inc.</p>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="font-mono text-emerald-500">All Systems Operational</span>
                      </div>
                  </div>
                  <div className="text-center text-slate-600 font-medium">
                      KnovaTwin is Powered by AI X Network
                  </div>
              </div>
          </div>
      </footer>

      {/* Legal & Security Modals */}
      {activeLegalModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-2xl w-full my-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
                  <button 
                    onClick={() => setActiveLegalModal(null)}
                    className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors z-20"
                  >
                      <X size={20} />
                  </button>

                  <div className="p-8 md:p-12 overflow-y-auto max-h-[80vh] custom-scrollbar">
                      {activeLegalModal === 'PRIVACY' && (
                          <article className="prose prose-slate max-w-none text-slate-700">
                              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                                  <Shield size={32} />
                              </div>
                              <h2 className="text-3xl font-extrabold text-slate-900 mb-6">Your Privacy, Your Twin</h2>
                              <p className="text-lg leading-relaxed mb-6">
                                  At KnovaTwin, we believe <strong>Collaborative Intelligence (CI)</strong> requires absolute trust. Unlike traditional AI platforms, we do not own your insights or store your "Digital Twin" on our servers. We use a <strong>Decentralized Intelligence Architecture</strong>:
                              </p>
                              <ul className="space-y-6 list-none pl-0">
                                  <li className="flex gap-4">
                                      <div className="bg-indigo-50 p-2 rounded-lg h-fit text-indigo-600"><Key size={20}/></div>
                                      <div>
                                          <h4 className="font-bold text-slate-900 text-lg mb-1">You Own the Brain</h4>
                                          <p className="text-slate-600">By using the BYO-Key (Bring Your Own Key) model, your conversations flow directly between your device and your own Google Cloud account. KnovaTwin never sees, stores, or "trains" on your private data.</p>
                                      </div>
                                  </li>
                                  <li className="flex gap-4">
                                      <div className="bg-indigo-50 p-2 rounded-lg h-fit text-indigo-600"><Database size={20}/></div>
                                      <div>
                                          <h4 className="font-bold text-slate-900 text-lg mb-1">Local-Only Memory</h4>
                                          <p className="text-slate-600">Your expert personas, course structures, and "Brain Dumps" are stored exclusively in your browser's Local Storage. If you clear your browser data or switch devices, that data remains yours—it never touches our database.</p>
                                      </div>
                                  </li>
                                  <li className="flex gap-4">
                                      <div className="bg-indigo-50 p-2 rounded-lg h-fit text-indigo-600"><CheckCircle size={20}/></div>
                                      <div>
                                          <h4 className="font-bold text-slate-900 text-lg mb-1">Total Sovereignty</h4>
                                          <p className="text-slate-600">You have the power to delete your identity and all associated AI knowledge at any time with a single click. We provide the tools; you provide the soul.</p>
                                      </div>
                                  </li>
                              </ul>
                          </article>
                      )}

                      {activeLegalModal === 'SECURITY' && (
                          <article className="prose prose-slate max-w-none text-slate-700">
                              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                                  <Lock size={32} />
                              </div>
                              <h2 className="text-3xl font-extrabold text-slate-900 mb-6">Security & Data Sovereignty Architecture</h2>
                              <p className="text-lg leading-relaxed mb-6">
                                  KnovaTwin is built on a <strong>"Zero-Knowledge"</strong> infrastructure regarding user content. The platform acts as a functional interface (orchestrator) while data persistence and AI compute are decentralized to the client.
                              </p>
                              
                              <h3 className="text-xl font-bold text-slate-900 mt-10 mb-4 border-b pb-2">Data Flow & Persistence</h3>
                              <ul className="space-y-4 list-disc pl-5">
                                  <li><strong className="text-slate-900">Identity Isolation:</strong> User-generated content (Personas, Course Indexes) is persisted via the Web Storage API (LocalStorage).</li>
                                  <li><strong className="text-slate-900">Risk Mitigation:</strong> No PII (Personally Identifiable Information) or proprietary "Knowledge Graphs" are transmitted to KnovaTwin’s backend.</li>
                                  <li><strong className="text-slate-900">Compute Decentralization:</strong> The <code>@google/genai</code> SDK is initialized client-side using the user's provided API_KEY.</li>
                                  <li><strong className="text-slate-900">Traffic Security:</strong> Request payloads (prompts) and response streams (completions) move directly between the client's browser and Google’s Gemini API endpoints. KnovaTwin never acts as a proxy.</li>
                              </ul>

                              <h3 className="text-xl font-bold text-slate-900 mt-10 mb-4 border-b pb-2">Technical Safeguards</h3>
                              <ul className="space-y-4 list-disc pl-5">
                                  <li><strong className="text-slate-900">Debounce Logic:</strong> To prevent storage "thrashing" and ensure data integrity during high-frequency updates, we implement a custom <code>useDebounce</code> hook for all LocalStorage writes.</li>
                                  <li><strong className="text-slate-900">PCM Audio Handling:</strong> Raw audio data for the Live API is processed in-memory via the Web Audio API and is not recorded or cached to disk unless explicitly triggered by the user.</li>
                              </ul>
                          </article>
                      )}

                      {activeLegalModal === 'TERMS' && (
                          <article className="prose prose-slate max-w-none text-slate-700">
                              <h2 className="text-3xl font-extrabold text-slate-900 mb-6">Terms of Service</h2>
                              <p className="leading-relaxed mb-4">By using KnovaTwin, you agree to the following terms:</p>
                              <ol className="space-y-4">
                                  <li><strong className="text-slate-900">Intellectual Property:</strong> You retain 100% ownership of any data you input. You grant KnovaTwin a non-exclusive license to process this data locally for the purpose of generating your Digital Twin.</li>
                                  <li><strong className="text-slate-900">BYO-Key Responsibility:</strong> You are responsible for the management and costs associated with your own Google Gemini API key. KnovaTwin is not liable for overages on your Google Cloud billing.</li>
                                  <li><strong className="text-slate-900">Decentralized Storage:</strong> Since data is stored locally in your browser, KnovaTwin cannot recover lost data if you clear your browser cache or lose your device. We recommend regular manual exports for critical knowledge.</li>
                                  <li><strong className="text-slate-900">Acceptable Use:</strong> You agree not to use the system for illegal activities or to generate harmful content through the integrated LLMs.</li>
                              </ol>
                          </article>
                      )}
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex justify-center">
                      <button 
                        onClick={() => setActiveLegalModal(null)}
                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                      >
                          Close Document
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
