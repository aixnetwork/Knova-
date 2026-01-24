
import React, { useState } from 'react';
import { Check, Shield, Zap, Crown, Building, Star, Users, Bot, Code, Cpu, Mic, Map as MapIcon, TrendingUp, Brain, Briefcase, Sparkles, Globe, Lock, UserPlus, PieChart, Gift, Activity } from 'lucide-react';
import { SubscriptionTier } from '../types';
import { PaymentModal } from './PaymentModal';

interface SubscriptionPageProps {
  onSelectTier: (tier: SubscriptionTier) => void;
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onSelectTier }) => {
  // Local state for pricing toggles
  const [expertLevel, setExpertLevel] = useState<'SOLO' | 'STUDIO'>('SOLO');
  const [orgLevel, setOrgLevel] = useState<'MID' | 'LARGE'>('MID');
  
  // Payment Modal State
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<{ name: string; price: number; tier: SubscriptionTier } | null>(null);

  const handleStartCheckout = (tier: SubscriptionTier, name: string, price: number) => {
      if (price === 0) {
          // Free tier bypasses payment
          onSelectTier(tier);
      } else {
          setSelectedPlanDetails({ name, price, tier });
          setShowPayment(true);
      }
  };

  const handlePaymentSuccess = () => {
      setShowPayment(false);
      if (selectedPlanDetails) {
          onSelectTier(selectedPlanDetails.tier);
      }
  };

  return (
    <div className="p-4 md:p-0 max-w-7xl mx-auto">
      <PaymentModal 
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        planName={selectedPlanDetails?.name || ''}
        price={selectedPlanDetails?.price || 0}
        onSuccess={handlePaymentSuccess}
      />

      <div className="text-center mb-8 md:mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold uppercase tracking-wider mb-6 shadow-sm">
            <Star size={14} className="fill-indigo-700" /> 30-Day Money-Back Guarantee
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Unlock the Knowledge Engine</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Choose the plan that fits your ambition. From individual mastery to organizational collaborative intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        
        {/* Professional Tier (Learner) */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 relative flex flex-col group">
          <div className="text-center mb-8 border-b border-slate-100 pb-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <Zap size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Professional</h3>
            <p className="text-slate-500 text-sm mb-6 h-10 font-medium">For ambitious learners wanting AI-accelerated growth.</p>
            <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-extrabold text-slate-900">$29</span>
                <span className="text-slate-500 font-medium">/mo</span>
            </div>
          </div>
          
          <div className="space-y-6 flex-1">
              <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Learning Tools</p>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                      <Check size={18} className="text-blue-500 shrink-0 mt-0.5" /> <span><strong>Personal AI Tutor</strong> (24/7 access)</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                      <Check size={18} className="text-blue-500 shrink-0 mt-0.5" /> <span><strong>NALO™ Focus Mode</strong></span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                      <Check size={18} className="text-blue-500 shrink-0 mt-0.5" /> <span><strong>Career Pathfinder</strong> Analysis</span>
                  </li>
              </div>
              <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access</p>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                      <Check size={18} className="text-blue-500 shrink-0 mt-0.5" /> <span>5 Active Course Enrollments</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                      <Check size={18} className="text-blue-500 shrink-0 mt-0.5" /> <span>Unlimited Quiz Attempts</span>
                  </li>
              </div>
          </div>

          <button 
            onClick={() => handleStartCheckout(SubscriptionTier.PROFESSIONAL, 'Professional Plan', 29)}
            className="w-full mt-8 py-4 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors border border-slate-200"
          >
            Choose Professional
          </button>
        </div>

        {/* Expert Tier (Creator) - Highlighted */}
        <div className="bg-white rounded-3xl p-8 border-2 border-purple-600 shadow-2xl relative flex flex-col transform md:-translate-y-4 z-10 group">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2">
             <Sparkles size={14} /> Creator's Choice
          </div>
          <div className="text-center mb-8 border-b border-purple-100 pb-8">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-md">
                <Crown size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Expert</h3>
            <p className="text-slate-500 text-sm mb-4 h-10 font-medium">For consultants scaling wisdom & monetizing expertise.</p>
            
            {/* Toggle Switch */}
            <div className="flex justify-center mb-6">
                <div className="bg-purple-100/50 p-1 rounded-lg inline-flex">
                    <button 
                        onClick={() => setExpertLevel('SOLO')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${expertLevel === 'SOLO' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-400 hover:text-purple-600'}`}
                    >
                        Solo
                    </button>
                    <button 
                        onClick={() => setExpertLevel('STUDIO')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${expertLevel === 'STUDIO' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-400 hover:text-purple-600'}`}
                    >
                        Studio
                    </button>
                </div>
            </div>

            <div className="flex items-baseline justify-center gap-1 animate-in fade-in">
                <span className="text-5xl font-extrabold text-slate-900">${expertLevel === 'SOLO' ? '99' : '299'}</span>
                <span className="text-slate-500 font-medium">/mo</span>
            </div>
          </div>
          
          <div className="space-y-6 flex-1">
              <div className="space-y-3">
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Creator Studio Exclusive</p>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                      <Check size={18} className="text-purple-600 shrink-0 mt-0.5" /> <span><strong>AI Digital Twin Builder</strong></span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                      <Check size={18} className="text-purple-600 shrink-0 mt-0.5" /> <span><strong>Course Builder</strong></span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                      <Check size={18} className="text-purple-600 shrink-0 mt-0.5" /> <span><strong>Brain Dump Interview</strong></span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                      <Check size={18} className="text-purple-600 shrink-0 mt-0.5" /> <span>AI Agent (embed in your web site)</span>
                  </li>
              </div>
              <div className="space-y-3">
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Scale & Monetize</p>
                  <li className="flex items-start gap-3 text-sm text-slate-800">
                      <div className="bg-purple-100 p-1 rounded-full text-purple-600 mt-0.5"><Users size={14} /></div> 
                      <span>
                          <strong>Up to {expertLevel === 'SOLO' ? '100' : '500'} Active Users</strong>
                      </span>
                  </li>
                  
                  {expertLevel === 'STUDIO' && (
                      <li className="flex items-start gap-3 text-sm text-slate-800 animate-in fade-in slide-in-from-left-2">
                          <div className="bg-purple-100 p-1 rounded-full text-purple-600 mt-0.5"><Gift size={14} /></div> 
                          <span>
                              <strong>Free Hybrid Event Hosting</strong>
                              <br/><span className="text-emerald-600 text-xs font-bold flex items-center gap-1"><Sparkles size={10}/> $500 Value</span>
                          </span>
                      </li>
                  )}
                  {expertLevel === 'STUDIO' && (
                      <li className="flex items-start gap-3 text-sm text-slate-800 animate-in fade-in slide-in-from-left-2">
                          <div className="bg-purple-100 p-1 rounded-full text-purple-600 mt-0.5"><UserPlus size={14} /></div> 
                          <span>3 Co-Experts Included</span>
                      </li>
                  )}
              </div>
          </div>

          <button 
            onClick={() => handleStartCheckout(SubscriptionTier.EXPERT, `Expert (${expertLevel === 'SOLO' ? 'Solo' : 'Studio'})`, expertLevel === 'SOLO' ? 99 : 299)}
            className="w-full mt-8 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
          >
            Subscribe to Expert
          </button>
        </div>

        {/* Organization Tier (Company) */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 relative flex flex-col group">
          <div className="text-center mb-8 border-b border-slate-100 pb-8">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <Building size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Organization</h3>
            <p className="text-slate-500 text-sm mb-4 h-10 font-medium">For enterprises building collaborative intelligence.</p>
            
            {/* Toggle Switch */}
            <div className="flex justify-center mb-6">
                <div className="bg-indigo-50 p-1 rounded-lg inline-flex">
                    <button 
                        onClick={() => setOrgLevel('MID')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgLevel === 'MID' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-400 hover:text-indigo-600'}`}
                    >
                        Business
                    </button>
                    <button 
                        onClick={() => setOrgLevel('LARGE')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${orgLevel === 'LARGE' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-400 hover:text-indigo-600'}`}
                    >
                        Enterprise
                    </button>
                </div>
            </div>

            <div className="flex items-baseline justify-center gap-1 animate-in fade-in">
                <span className="text-5xl font-extrabold text-slate-900">${orgLevel === 'MID' ? '499' : '999'}</span>
                <span className="text-slate-500 font-medium">/mo</span>
            </div>
          </div>

          <div className="space-y-6 flex-1">
              <div className="space-y-3">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Enterprise Intelligence</p>
                  <li className="flex items-start gap-3 text-sm text-slate-800">
                      <div className="bg-indigo-100 p-1 rounded-full text-indigo-600 mt-0.5"><Users size={14} /></div> 
                      <span><strong>Up to {orgLevel === 'MID' ? '500' : '1,000'} Active Users</strong><br/><span className="text-slate-500 text-xs">Department-wide access</span></span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-800">
                      <div className="bg-indigo-100 p-1 rounded-full text-indigo-600 mt-0.5"><Activity size={14} /></div> 
                      <span>
                          <strong>Daily Health Score & Assessment</strong>
                          <br/><span className="text-indigo-600 text-xs font-bold">
                              {orgLevel === 'MID' ? '(Internal)' : '(Internal & External)'}
                          </span>
                      </span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-800">
                      <Check size={18} className="text-indigo-600 shrink-0 mt-0.5" /> 
                      <span><strong>Includes All Expert Functions</strong></span>
                  </li>
                  {orgLevel === 'LARGE' && (
                      <li className="flex items-start gap-3 text-sm text-slate-800">
                          <div className="bg-indigo-100 p-1 rounded-full text-indigo-600 mt-0.5"><Gift size={14} /></div> 
                          <span>
                              <strong>Free Hybrid Event Hosting</strong>
                              <br/><span className="text-emerald-600 text-xs font-bold flex items-center gap-1"><Sparkles size={10}/> $500 Value</span>
                          </span>
                      </li>
                  )}
              </div>
              <div className="space-y-3">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Strategic Tools</p>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                      <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" /> <span><strong>Flight Risk Detector</strong></span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                      <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" /> <span><strong>BICE ROI Dashboard</strong></span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-700">
                      <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" /> <span>SSO & Role Management</span>
                  </li>
              </div>
          </div>

          <button 
            onClick={() => handleStartCheckout(SubscriptionTier.COMPANY, `Organization (${orgLevel === 'MID' ? 'Business' : 'Enterprise'})`, orgLevel === 'MID' ? 499 : 999)}
            className="w-full mt-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Start {orgLevel === 'MID' ? 'Business' : 'Enterprise'}
          </button>
        </div>

      </div>
      
      <div className="mt-16 text-center">
          <p className="text-slate-500 mb-4">Trusted by innovative teams at</p>
          <div className="flex justify-center gap-8 opacity-50 grayscale">
              <div className="font-bold text-xl text-slate-800">Acme Corp</div>
              <div className="font-bold text-xl text-slate-800">TechFlow</div>
              <div className="font-bold text-xl text-slate-800">GlobalDynamics</div>
              <div className="font-bold text-xl text-slate-800">FutureSoft</div>
          </div>
      </div>
    </div>
  );
};
