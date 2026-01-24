
import React from 'react';
import { ArrowLeft, ArrowRight, Brain, Users, TrendingUp, Sparkles, Building, ChevronRight, Globe, MonitorPlay, ShieldCheck, Network, Zap, Twitter, Linkedin, Facebook, Mail, Crown, GraduationCap } from 'lucide-react';
import { Logo } from './Logo';

interface AboutUsProps {
    onBack: () => void;
}

export const AboutUs: React.FC<AboutUsProps> = ({ onBack }) => {
    return (
        <div className="bg-white h-full overflow-y-auto text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={onBack}>
                        <Logo />
                    </div>
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-full border border-slate-200"
                    >
                        <ArrowLeft size={16} /> Back to App
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative py-24 md:py-32 overflow-hidden">
                 <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-50/50 rounded-full blur-[100px] -z-10"></div>
                </div>
                
                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-8 border border-indigo-100 shadow-sm">
                        Our Vision
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight text-slate-900 leading-[1.1]">
                        Wisdom should never be lost. <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">It should be multiplied.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light mb-10">
                        We are transforming human expertise into living AI twins that empower individuals, organizations, and entire ecosystems to solve tomorrow's problems today.
                    </p>
                    <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-slate-200 max-w-3xl mx-auto text-base text-slate-700 leading-relaxed shadow-lg">
                        As the engine behind the <strong>AI X Network & CAIO Service</strong>, KnovaTwin enables companies to preserve critical knowledge, accelerate AI adoption, and unlock collaborative intelligence across employees, partners, and consultants.
                    </div>
                </div>
            </section>

            {/* The KnovaTwin Call to Action */}
            <section className="py-24 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">The KnovaTwin Call to Action</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* A Call to Experts */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Crown size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">A Call to Experts</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                <strong className="text-slate-900">Secure Your Legacy:</strong> KnovaTwin is the most powerful way to mentor and train the next generation at scale, while upskilling you in generative AI.
                            </p>
                        </div>

                        {/* A Call to Learners */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <GraduationCap size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">A Call to Learners</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                <strong className="text-slate-900">Master Practical Expertise:</strong> Move beyond theory and gain practical, battle-tested experience directly from the best experts in the field.
                            </p>
                        </div>

                        {/* A Call to Organizations */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Building size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">A Call to Organizations</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                <strong className="text-slate-900">Future-Proof Your Capability:</strong> KnovaTwin is the ultimate knowledge management system, ensuring everyone achieves the required AI Fluency to stay competitive.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why We Exist */}
            <section className="py-24 border-t border-slate-100 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="animate-in slide-in-from-left-8 duration-700">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">Why We Exist</h2>
                            <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                                <p>
                                    Every retirement, turnover, or consultant departure costs organizations millions in lost wisdom. Traditional Learning Management Systems (LMS) capture information but fail to preserve <strong>judgment</strong> and <strong>intuition</strong>.
                                </p>
                                <p>
                                    KnovaTwin was built to solve the "Brain Drain" crisis. By cloning expertise into <strong>AI Knowledge Twins™</strong>, we help organizations scale decision-making, accelerate onboarding, and create a resilient institutional memory that lasts forever.
                                </p>
                            </div>
                            
                            <div className="mt-12 flex gap-12 border-t border-slate-200 pt-8">
                                <div>
                                    <div className="text-4xl font-extrabold text-slate-900 mb-1">$30M+</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Avg. Knowledge Loss Risk</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-extrabold text-slate-900 mb-1">50%</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Faster Onboarding</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-colors"></div>
                            <div className="relative z-10 grid grid-cols-1 gap-6">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all">
                                    <div className="p-4 bg-white rounded-xl shadow-sm text-slate-400"><Users size={32}/></div>
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-700">Traditional Model</h4>
                                        <p className="text-sm text-slate-500">Expert leaves → Wisdom lost forever.</p>
                                    </div>
                                </div>
                                <div className="flex justify-center text-slate-300">
                                    <ArrowLeft className="rotate-[-90deg] w-8 h-8" />
                                </div>
                                <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 flex items-center gap-6 transform scale-105 shadow-md">
                                    <div className="p-4 bg-indigo-600 rounded-xl shadow-lg text-white"><Sparkles size={32}/></div>
                                    <div>
                                        <h4 className="font-bold text-lg text-indigo-900">KnovaTwin Model</h4>
                                        <p className="text-sm text-indigo-700">Expert leaves → Twin remains, teaches & evolves.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Mission */}
            <section className="py-24 bg-[#0B1120] text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-10">Our Mission</h2>
                    <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-xl md:text-2xl font-bold text-indigo-400 mb-12">
                        <span>To Connect.</span>
                        <span className="text-slate-600">•</span>
                        <span>To Clone.</span>
                        <span className="text-slate-600">•</span>
                        <span>To Scale.</span>
                    </div>
                    <p className="text-lg md:text-2xl text-slate-300 leading-relaxed font-light max-w-3xl mx-auto">
                        We are moving from the Information Age to the <strong className="text-white">Intelligence Age</strong>. By scaling expertise and fostering Collective Intelligence, the AI X Network is building a future where Intelligence is Amplified, not Artificial.
                    </p>
                </div>
            </section>

            {/* What We Offer */}
            <section className="py-24 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-slate-900">The Intelligence Ecosystem</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                            A complete suite for capturing, scaling, and operationalizing human expertise.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all group">
                            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                <Brain size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">Knowledge Twin™</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Clone expert thinking into interactive AI mentors that can answer questions and guide decision-making 24/7.
                            </p>
                        </div>
                        
                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-purple-200 hover:shadow-xl transition-all group">
                            <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                <MonitorPlay size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">Practice Simulator</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Train employees with real-world decision scenarios generated dynamically from your expert's experiences.
                            </p>
                        </div>

                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:shadow-xl transition-all group">
                            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                <TrendingUp size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">BICE ROI Engine</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Link learning outcomes directly to KPIs (sales, safety, retention) to prove the business impact of training.
                            </p>
                        </div>

                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all group">
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                <Globe size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">Wisdom Marketplace</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Enable consultants and partners to publish and scale their expertise across multiple client organizations globally.
                            </p>
                        </div>

                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-amber-200 hover:shadow-xl transition-all group lg:col-span-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                    <ShieldCheck size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-900">CAIO Integration</h3>
                                <p className="text-slate-600 leading-relaxed text-sm max-w-lg">
                                    Align AI adoption with business strategy, compliance, and measurable ROI through our Chief AI Officer framework integration.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Founder's Story */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200 flex flex-col md:flex-row gap-12 items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-16 -mt-16 z-0"></div>
                        
                        <div className="w-56 h-56 md:w-72 md:h-72 shrink-0 relative z-10">
                            <div className="absolute inset-0 bg-indigo-600 rounded-2xl rotate-3 opacity-10"></div>
                            <div className="absolute inset-0 bg-purple-600 rounded-2xl -rotate-3 opacity-10"></div>
                            <img 
                                src="https://lh3.googleusercontent.com/d/1M6PzYqJrurjaOHcc0A-85iFUOuwLc2IF" 
                                alt="Matt Fok" 
                                className="w-full h-full object-cover rounded-2xl shadow-lg relative z-10 bg-slate-200"
                                onError={(e) => {
                                    e.currentTarget.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=MattFok";
                                }}
                            />
                        </div>
                        
                        <div className="flex-1 text-center md:text-left z-10">
                            <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 border border-slate-200">Founder's Vision</div>
                            <h3 className="text-4xl font-extrabold text-slate-900 mb-2">Matt Fok</h3>
                            <p className="text-indigo-600 font-bold mb-6 text-lg">CEO & Founder, AI X Network | Creator of CAIO Service</p>
                            
                            <div className="space-y-4 text-slate-600 leading-relaxed mb-8 text-base">
                                <p>
                                    KnovaTwin was founded by Matt Fok, a visionary entrepreneur and pioneer in AI-driven ecosystems. As the creator of the <strong>CAIO Service</strong> (Chief AI Officer-as-a-Service), Matt has dedicated his career to democratizing AI adoption and empowering communities with collaborative intelligence.
                                </p>
                                <p>
                                    His vision extends beyond software. He believes in building <strong>Smart Communities</strong> where AI is not just a tool, but a movement — enabling collective intelligence, sustainable growth, and shared prosperity for all.
                                </p>
                            </div>
                            
                            <blockquote className="border-l-4 border-indigo-600 pl-6 italic text-xl text-slate-800 font-medium mb-8">
                                “KnovaTwin is more than technology. It’s a revolution in how wisdom lives, grows, and connects us all.”
                            </blockquote>
                            
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700">AI X Network</span>
                                <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600">eZ-XPO</span>
                                <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600">eLearningZoom</span>
                                <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600">Assistant Professor</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 text-center bg-white border-t border-slate-100">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Ready to Scale Your Wisdom?</h2>
                    <p className="text-xl text-slate-600 mb-10 leading-relaxed font-light">
                        Join the movement. Transform your expertise into an asset that works for you 24/7.
                    </p>
                    <div className="flex flex-col items-center">
                        <button onClick={onBack} className="bg-indigo-600 text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-indigo-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 inline-flex items-center gap-3">
                            Create Your AI Twin <ChevronRight strokeWidth={3} />
                        </button>
                        <p className="text-indigo-600 font-bold mt-8 uppercase tracking-wide text-xs">
                            Powered by AI X Network
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 pt-20 pb-10 text-slate-400 text-sm border-t border-slate-900 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-900/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                        {/* Brand Column (Wider) */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
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
                        
                        {/* Links Columns */}
                        <div>
                            <h4 className="font-bold text-white mb-6">Platform</h4>
                            <ul className="space-y-4">
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Why KnovaTwin</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Expert Marketplace</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">AI Core Engine</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Pricing</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-6">Resources</h4>
                            <ul className="space-y-4">
                                <li><a href="https://aixnetwork.net" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors flex items-center gap-2">Community Hub <ArrowRight size={12}/></a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">CAIO Certification</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Help Center</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-6">Company</h4>
                            <ul className="space-y-4">
                                <li><button className="hover:text-indigo-400 transition-colors text-left font-bold text-white">About Us</button></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Careers</a></li>
                                <li><a href="https://go.oncehub.com/MattFok" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors flex items-center gap-2"><Mail size={14}/> Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                            <p>© 2025 KnovaTwin Inc.</p>
                            <div className="flex gap-6">
                                <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
                                <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="font-mono text-emerald-500">All Systems Operational</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
