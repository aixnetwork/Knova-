import React, { useState, useEffect } from 'react';
import { DollarSign, Users, MousePointer, Copy, Share2, TrendingUp, Gift } from 'lucide-react';
import { affiliateApi } from '../services/api';

export const AffiliateView: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const [referralLink, setReferralLink] = useState('');
    const [totalEarnings, setTotalEarnings] = useState<string>('0.00');
    const [nextPayout, setNextPayout] = useState<string>('0.00');
    const [referralCount, setReferralCount] = useState(0);
    const [referrals, setReferrals] = useState<Array<{ referredEmail: string; status: string; commission: string | number; createdAt?: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [joinLoading, setJoinLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notJoined, setNotJoined] = useState(false);

    const loadData = () => {
        setLoading(true);
        setError(null);
        setNotJoined(false);
        affiliateApi.get()
            .then((affRes) => {
                const aff = affRes.data;
                setReferralLink(aff.referralLink || '');
                setTotalEarnings(String(aff.totalEarnings ?? '0.00'));
                setNextPayout(String(aff.nextPayout ?? '0.00'));
                return affiliateApi.getReferrals({ page: 1, limit: 10 });
            })
            .then((refRes) => {
                setReferralCount(refRes.data.referrals?.length ?? refRes.data.total ?? 0);
                setReferrals(refRes.data.referrals || []);
            })
            .catch((err: { status?: number; message?: string }) => {
                if (err?.status === 404) {
                    setNotJoined(true);
                    setError(null);
                } else {
                    setReferralLink('');
                    setError(err?.message || 'Could not load affiliate data.');
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    const handleJoin = () => {
        setJoinLoading(true);
        setError(null);
        affiliateApi.join()
            .then(() => { setNotJoined(false); loadData(); })
            .catch((err: { message?: string }) => setError(err?.message || 'Failed to join program'))
            .finally(() => setJoinLoading(false));
    };

    const handleCopy = () => {
        if (referralLink) {
            navigator.clipboard.writeText(referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading && !notJoined) {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <p className="text-slate-500">Loading affiliate data…</p>
            </div>
        );
    }

    if (notJoined) {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="max-w-lg mx-auto text-center bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                    <Gift className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Join the Affiliate Program</h1>
                    <p className="text-slate-600 mb-6">Share KnovaTwin and earn 20% recurring commission on every referral.</p>
                    {error && <p className="text-amber-600 text-sm mb-4">{error}</p>}
                    <button
                        onClick={handleJoin}
                        disabled={joinLoading}
                        className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors"
                    >
                        {joinLoading ? 'Joining…' : 'Join program'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Gift className="text-rose-500" />
                        Affiliate & Rewards
                    </h1>
                    <p className="text-slate-500 mt-2">Share KnovaTwin and earn 20% recurring commission.</p>
                </div>
                <div className="bg-rose-50 text-rose-700 px-4 py-2 rounded-lg font-bold text-sm border border-rose-100 flex items-center gap-2">
                    <TrendingUp size={16} /> Next Payout: ${nextPayout}
                </div>
            </div>

            {error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={20} /></div>
                        <h3 className="font-semibold text-slate-700">Total Earnings</h3>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">${totalEarnings}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
                        <h3 className="font-semibold text-slate-700">Referrals</h3>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{referralCount}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><MousePointer size={20} /></div>
                        <h3 className="font-semibold text-slate-700">Your Link</h3>
                    </div>
                    <p className="text-sm text-slate-600 break-all">{referralLink || '—'}</p>
                </div>
            </div>

            {/* Link Section */}
            <div className="bg-slate-900 text-white rounded-2xl p-8 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-xl font-bold mb-4">Your Unique Referral Link</h2>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                        <div className="flex-1 bg-slate-800 border border-slate-600 rounded-lg flex items-center px-4 py-3">
                            <span className="text-slate-300 truncate">{referralLink || 'No link yet'}</span>
                        </div>
                        <button 
                            onClick={handleCopy}
                            disabled={!referralLink}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                    <div className="mt-8">
                        <h3 className="font-bold mb-3 flex items-center gap-2"><Share2 size={18} /> Share on Social</h3>
                        <div className="flex gap-3">
                            <button className="px-4 py-2 bg-[#1DA1F2] hover:bg-opacity-90 rounded-lg text-sm font-bold transition-colors">Twitter</button>
                            <button className="px-4 py-2 bg-[#0077b5] hover:bg-opacity-90 rounded-lg text-sm font-bold transition-colors">LinkedIn</button>
                            <button className="px-4 py-2 bg-[#EA4335] hover:bg-opacity-90 rounded-lg text-sm font-bold transition-colors">Email</button>
                        </div>
                    </div>
                </div>
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            </div>

            {/* Referral History */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-800">Recent Referrals</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Commission</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {referrals.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No referrals yet.</td></tr>
                            ) : (
                                referrals.map((row) => (
                                    <tr key={row.referredEmail + (row.createdAt || '')} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{row.referredEmail}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${row.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">${row.commission}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Internal icon component for AffiliateView
const CheckCircle = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
