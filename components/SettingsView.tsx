
import React, { useState, useEffect } from 'react';
import { User, Mail, Key, Bell, Moon, Save, CheckCircle, Shield, Bot, Server, Zap, RefreshCw, CreditCard, BadgeCheck, LayoutTemplate, Database, Trash2, AlertTriangle, Loader2, XCircle, LifeBuoy } from 'lucide-react';
import { UserProfile, UserRole, SubscriptionTier } from '../types';
import { validateApiKey, setSessionUserApiKey, clearSessionUserApiKey, resetClient, LEGACY_LOCAL_STORAGE_KEY } from '../services/geminiService';
import { authApi, getToken } from '../services/api';
import { mapAuthUserToProfile } from '../services/authHelpers';

interface SettingsViewProps {
    user: UserProfile | null;
    onUpdateUser: (updates: Partial<UserProfile>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser }) => {
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'INTEGRATIONS' | 'PREFERENCES' | 'STORAGE'>('PROFILE');
    
    // Profile State
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [role, setRole] = useState<UserRole>(user?.role || UserRole.LEARNER);
    const [tier, setTier] = useState<SubscriptionTier>(user?.tier || SubscriptionTier.PROFESSIONAL);
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
    const [jobTitle, setJobTitle] = useState(user?.title || '');
    const [industry, setIndustry] = useState(user?.industry || '');
    const [bio, setBio] = useState(user?.bio || '');
    
    // API Keys State
    const [apiKey, setApiKey] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [anthropicKey, setAnthropicKey] = useState('');
    const [keyStatus, setKeyStatus] = useState<'IDLE' | 'TESTING' | 'VALID' | 'INVALID'>('IDLE');
    const [keyError, setKeyError] = useState('');
    
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Storage Diagnostics
    const [storageUsage, setStorageUsage] = useState<any[]>([]);
    const [totalUsage, setTotalUsage] = useState(0);

    // Initial Load
    useEffect(() => {
        calculateStorage();
    }, []);

    useEffect(() => {
        try {
            if (sessionStorage.getItem('knovatwin_focus_integrations') === '1') {
                sessionStorage.removeItem('knovatwin_focus_integrations');
                setActiveTab('INTEGRATIONS');
            }
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        if (user?.hasGeminiKey) {
            setApiKey('');
        } else {
            const leg = localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
            setApiKey(leg || '');
        }
    }, [user?.id, user?.hasGeminiKey]);

    // Sync from prop
    useEffect(() => {
        if(user) {
            setName(user.name);
            setRole(user.role);
            setTier(user.tier);
            setAvatarUrl(user.avatarUrl || '');
            setJobTitle(user.title || '');
            setIndustry(user.industry || '');
            setBio(user.bio || '');
        }
    }, [user]);
    
    const calculateStorage = () => {
        let total = 0;
        const items = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('knovatwin')) {
                const value = localStorage.getItem(key) || '';
                const size = value.length * 2; // approx bytes
                total += size;
                items.push({ key, size: (size / 1024).toFixed(2) + ' KB' });
            }
        }
        setStorageUsage(items);
        setTotalUsage(total);
    };

    const handleClearKey = (key: string) => {
        if (confirm(`Delete ${key}? This action is irreversible.`)) {
            localStorage.removeItem(key);
            calculateStorage();
        }
    };

    const handleRandomizeAvatar = () => {
        const randomSeed = Math.random().toString(36).substring(7);
        setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`);
    };

    const handleRemoveGeminiKey = async () => {
        if (!user?.hasGeminiKey && !localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY)) return;
        if (!confirm('Remove your stored Gemini API key? AI features will stop until you add a new key.')) return;
        const isGod = user?.id?.startsWith('user-godmode');
        if (isGod) {
            localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
            clearSessionUserApiKey();
            resetClient();
            setApiKey('');
            onUpdateUser({ hasGeminiKey: false });
            return;
        }
        if (!getToken()) return;
        try {
            await authApi.deleteMyGeminiKey();
            clearSessionUserApiKey();
            resetClient();
            localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
            setApiKey('');
            const { data } = await authApi.me();
            onUpdateUser(mapAuthUserToProfile(data));
        } catch (e) {
            console.error(e);
        }
    };

    const handleTestKey = async () => {
        if (!apiKey) return;
        setKeyStatus('TESTING');
        const result = await validateApiKey(apiKey);
        if (result.valid) {
            setKeyStatus('VALID');
            setKeyError('');
        } else {
            setKeyStatus('INVALID');
            setKeyError(result.error || 'Could not validate this key. Please try again.');
        }
    };

    const handleRescueData = () => {
        if (confirm("This will scan your browser storage for any lost courses and rebuild your index. Continue?")) {
            // Logic to scan localStorage manually
            const newIndex = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('knovatwin_course_') && !key.includes('index')) {
                    const id = key.replace('knovatwin_course_', '');
                    newIndex.push(id);
                }
            }
            localStorage.setItem('knovatwin_course_index', JSON.stringify(newIndex));
            alert(`Recovery Complete. Found ${newIndex.length} courses. Reloading app...`);
            window.location.reload();
        }
    };

    const handleSave = async () => {
        setIsSaving(true);

        const isGod = user?.id?.startsWith('user-godmode');
        try {
            if (apiKey.trim()) {
                const check = await validateApiKey(apiKey.trim());
                if (!check.valid) {
                    setKeyStatus('INVALID');
                    setKeyError(check.error || 'Could not validate this key. Please try again.');
                    setIsSaving(false);
                    return;
                }
                if (isGod) {
                    localStorage.setItem(LEGACY_LOCAL_STORAGE_KEY, apiKey.trim());
                    setSessionUserApiKey(apiKey.trim());
                    resetClient();
                    onUpdateUser({ hasGeminiKey: true });
                } else if (getToken()) {
                    await authApi.saveMyGeminiKey(apiKey.trim());
                    setSessionUserApiKey(apiKey.trim());
                    resetClient();
                    localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
                    onUpdateUser({ hasGeminiKey: true });
                }
            }

            await authApi.updateMe({
                name,
                title: jobTitle || undefined,
                industry: industry || undefined,
                bio: bio || undefined,
                avatarUrl: avatarUrl || undefined,
            });
            const { data } = await authApi.me();
            onUpdateUser(mapAuthUserToProfile(data));
            if (user) {
                const directUpdate = { ...user, name, email, role, tier, avatarUrl, title: jobTitle, industry, bio };
                localStorage.setItem('knovatwin_user_session', JSON.stringify(directUpdate));
            }
        } catch (e: any) {
            // Make sure we never show a raw JSON blob in the UI.
            const msg = String(e?.message || '');
            if (msg) {
                setKeyStatus('INVALID');
                setKeyError(msg);
            }
            onUpdateUser({ name, email, role, tier, avatarUrl, title: jobTitle, industry, bio });
            if (user) {
                const directUpdate = { ...user, name, email, role, tier, avatarUrl, title: jobTitle, industry, bio };
                localStorage.setItem('knovatwin_user_session', JSON.stringify(directUpdate));
            }
        }

        setIsSaved(true);
        setTimeout(() => {
            setIsSaving(false);
            setIsSaved(false);
        }, 1500);
    };

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto h-full overflow-hidden flex flex-col">
            <div className="mb-8 shrink-0">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Account Settings</h1>
                <p className="text-slate-500">Manage your profile, persona, and AI integrations.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row flex-1 min-h-0">
                {/* Sidebar */}
                <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-100 p-4 shrink-0">
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('PROFILE')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                activeTab === 'PROFILE' ? 'bg-indigo-50 text-indigo-700 shadow-sm border-l-4 border-indigo-600 rounded-l-none' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <User size={18} /> Profile & Persona
                        </button>
                        <button
                            onClick={() => setActiveTab('INTEGRATIONS')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                activeTab === 'INTEGRATIONS' ? 'bg-indigo-50 text-indigo-700 shadow-sm border-l-4 border-indigo-600 rounded-l-none' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <Key size={18} /> Integrations
                        </button>
                        <button
                            onClick={() => setActiveTab('PREFERENCES')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                activeTab === 'PREFERENCES' ? 'bg-indigo-50 text-indigo-700 shadow-sm border-l-4 border-indigo-600 rounded-l-none' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <Bell size={18} /> Preferences
                        </button>
                         <button
                            onClick={() => setActiveTab('STORAGE')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                activeTab === 'STORAGE' ? 'bg-indigo-50 text-indigo-700 shadow-sm border-l-4 border-indigo-600 rounded-l-none' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <Database size={18} /> Storage Doctor
                        </button>
                    </nav>
                </div>

                {/* Content Scroll Area */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50/50">
                    {activeTab === 'PROFILE' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Column 1: Identity & Visuals */}
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <BadgeCheck className="text-indigo-600" size={20}/> Identity
                                </h2>
                                
                                {/* Live ID Card Preview */}
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                                    <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg overflow-hidden relative z-10 mb-4 -mt-12">
                                        <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} alt="Avatar" className="w-full h-full object-cover rounded-full bg-slate-100" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">{name || 'User Name'}</h3>
                                    <p className="text-slate-500 text-sm font-medium mb-1">{jobTitle || 'Job Title'}</p>
                                    <p className="text-xs text-slate-400 mb-4">{industry || 'Industry'}</p>
                                    <div className="flex items-center gap-2 justify-center">
                                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase border border-indigo-100 tracking-wider">{role}</span>
                                        <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded uppercase border border-amber-100 tracking-wider">{tier}</span>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Display Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Title</label>
                                            <input
                                                type="text"
                                                value={jobTitle}
                                                onChange={(e) => setJobTitle(e.target.value)}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Industry</label>
                                            <input
                                                type="text"
                                                value={industry}
                                                onChange={(e) => setIndustry(e.target.value)}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Avatar Source</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={avatarUrl}
                                                onChange={(e) => setAvatarUrl(e.target.value)}
                                                placeholder="https://..."
                                                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <button 
                                                onClick={handleRandomizeAvatar}
                                                className="px-3 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                                                title="Generate Random Avatar"
                                            >
                                                <RefreshCw size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bio</label>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            rows={3}
                                            placeholder="Tell us about yourself..."
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Access & Permissions */}
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Shield className="text-emerald-600" size={20}/> Access Control
                                </h2>

                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                                        <p className="font-bold flex items-center gap-2 mb-1"><LayoutTemplate size={16}/> Simulator Mode</p>
                                        <p className="opacity-90 leading-relaxed">Change your Role and Tier below to test different features of the application (e.g. Creator Studio, Admin Panel). <strong>Settings apply immediately.</strong></p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">User Role</label>
                                        <div className="relative">
                                            <select 
                                                value={role} 
                                                onChange={(e) => setRole(e.target.value as UserRole)}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
                                            >
                                                <option value={UserRole.LEARNER}>Learner (Standard View)</option>
                                                <option value={UserRole.FACILITATOR}>Facilitator / Expert (Creator View)</option>
                                                <option value={UserRole.ADMIN}>Administrator (System View)</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Subscription Tier</label>
                                        <div className="relative">
                                            <select 
                                                value={tier} 
                                                onChange={(e) => setTier(e.target.value as SubscriptionTier)}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
                                            >
                                                <option value={SubscriptionTier.FREE}>Free Tier</option>
                                                <option value={SubscriptionTier.PROFESSIONAL}>Professional (Individual)</option>
                                                <option value={SubscriptionTier.COMPANY}>Company (Org Features)</option>
                                                <option value={SubscriptionTier.EXPERT}>Expert (Creator Features)</option>
                                                <option value={SubscriptionTier.BETA}>Beta Tester (Unlimited)</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                                        <p><strong>Note:</strong> To access the <span className="text-purple-600 font-bold">Creator Studio</span>, you must be an <strong>Expert</strong> or have the <strong>Facilitator</strong> role.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'INTEGRATIONS' && (
                        <div className="space-y-8 animate-in fade-in max-w-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-800">Model Providers</h2>
                                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">BYO-Keys Enabled</span>
                            </div>
                            
                            {/* Google Gemini */}
                            <div className="p-6 bg-white border border-amber-200 rounded-xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                                        <Zap size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-bold text-slate-900">Google Gemini</h3>
                                            <span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded">Primary</span>
                                        </div>
                                        <p className="text-sm text-slate-500 mb-4">
                                            Required for all core features (Courses, Twins, Live API).
                                        </p>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="password"
                                                value={apiKey}
                                                onChange={(e) => {
                                                    setApiKey(e.target.value);
                                                    if (keyStatus !== 'IDLE') setKeyStatus('IDLE');
                                                    if (keyError) setKeyError('');
                                                }}
                                                placeholder={user?.hasGeminiKey ? 'Enter a new key to replace the saved one' : 'AIzaSy...'}
                                                className={`w-full p-3 bg-slate-50 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500 outline-none ${keyStatus === 'INVALID' ? 'border-red-300' : 'border-slate-200'}`}
                                            />
                                            <button
                                                onClick={handleTestKey}
                                                disabled={keyStatus === 'TESTING' || !apiKey}
                                                className={`px-4 rounded-lg font-bold text-sm transition-colors border ${keyStatus === 'VALID' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                                            >
                                                {keyStatus === 'TESTING' ? <Loader2 size={18} className="animate-spin"/> : keyStatus === 'VALID' ? 'Valid' : 'Test'}
                                            </button>
                                        </div>
                                        {keyStatus === 'INVALID' && <p className="text-xs text-red-500 font-bold">{keyError}</p>}
                                        {keyStatus === 'VALID' && <p className="text-xs text-emerald-600 font-bold">Connection Successful</p>}
                                        <p className="text-xs text-slate-400 mt-2">
                                            {user?.hasGeminiKey
                                                ? 'A Gemini key is saved on your account (encrypted). Enter a new key above and save to replace it.'
                                                : 'Your key is encrypted and stored with your account after you save.'}
                                        </p>
                                        {(user?.hasGeminiKey ||
                                            (typeof window !== 'undefined' &&
                                                user?.id?.startsWith('user-godmode') &&
                                                !!localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY))) && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveGeminiKey}
                                                className="mt-3 text-xs font-bold text-red-600 hover:text-red-700 underline"
                                            >
                                                Remove stored Gemini key
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* OpenAI */}
                            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm opacity-100 hover:border-indigo-300 transition-colors group">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-green-50 text-green-600 rounded-lg shrink-0">
                                        <Bot size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 mb-1">OpenAI (GPT-4)</h3>
                                        <p className="text-sm text-slate-500 mb-4">
                                            Enable alternative reasoning models for simulations.
                                        </p>
                                        <input
                                            type="password"
                                            value={openaiKey}
                                            onChange={(e) => setOpenaiKey(e.target.value)}
                                            placeholder="sk-..."
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Anthropic */}
                            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-colors group">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                                        <Server size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 mb-1">Anthropic (Claude)</h3>
                                        <p className="text-sm text-slate-500 mb-4">
                                            Enhanced long-context document analysis.
                                        </p>
                                        <input
                                            type="password"
                                            value={anthropicKey}
                                            onChange={(e) => setAnthropicKey(e.target.value)}
                                            placeholder="sk-ant-..."
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'PREFERENCES' && (
                        <div className="space-y-6 animate-in fade-in max-w-2xl">
                            <h2 className="text-xl font-bold text-slate-800">App Preferences</h2>
                            
                            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:shadow-sm transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <Bell size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">Email Notifications</div>
                                        <div className="text-sm text-slate-500">Receive weekly progress reports</div>
                                    </div>
                                </div>
                                <div className="w-12 h-6 bg-indigo-600 rounded-full relative cursor-pointer shadow-inner transition-colors">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white opacity-60">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                        <Moon size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">Dark Mode</div>
                                        <div className="text-sm text-slate-500">Switch system theme (Coming Soon)</div>
                                    </div>
                                </div>
                                <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-not-allowed">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'STORAGE' && (
                        <div className="space-y-6 animate-in fade-in max-w-2xl">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Database className="text-indigo-600"/> Storage Doctor
                            </h2>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-end mb-4">
                                    <div className="text-sm font-bold text-slate-500">Local Usage</div>
                                    <div className={`text-xl font-bold ${(totalUsage / 1024 / 1024) > 4.5 ? 'text-red-500' : 'text-slate-900'}`}>
                                        {(totalUsage / 1024 / 1024).toFixed(2)} MB <span className="text-xs text-slate-400 font-normal">/ ~5 MB</span>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6">
                                    <div 
                                        className={`h-full transition-all duration-500 ${(totalUsage / 1024 / 1024) > 4.5 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                                        style={{ width: `${Math.min((totalUsage / 1024 / 1024 / 5) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {storageUsage.map(item => (
                                        <div key={item.key} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 text-sm hover:bg-red-50 hover:border-red-100 group transition-colors">
                                            <span className="truncate max-w-[200px] font-mono text-xs">{item.key}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-500 text-xs font-bold">{item.size}</span>
                                                <button onClick={() => handleClearKey(item.key)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex gap-3 text-indigo-900 text-sm">
                                <LifeBuoy className="shrink-0 text-indigo-600" />
                                <p><strong>Lost Data?</strong> Click below to scan your device for courses that might be missing from your dashboard list.</p>
                            </div>
                            
                            <button 
                                onClick={handleRescueData}
                                className="w-full py-3 bg-indigo-600 text-white border border-indigo-600 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg"
                            >
                                <LifeBuoy size={18} className="inline mr-2" /> Scan & Recover Data
                            </button>
                            
                            <div className="border-t border-slate-200 my-4"></div>

                            <button 
                                onClick={() => { localStorage.clear(); window.location.reload(); }}
                                className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition-colors"
                            >
                                <Trash2 size={18} className="inline mr-2" /> Factory Reset (Clear All Data)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 flex justify-end shrink-0">
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-wait"
                >
                    {isSaving ? <RefreshCw size={20} className="animate-spin" /> : isSaved ? <CheckCircle size={20} /> : <Save size={20} />}
                    {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};
