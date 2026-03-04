import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, CheckCircle, Search, Loader2 } from 'lucide-react';
import { UserRole } from '../types';
import { teamsApi } from '../services/api';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: string;
    riskScore: number;
    coursesCompleted: number;
}

interface Team {
    id: string;
    name: string;
    members?: { id: string; user?: { id: string; name: string; email: string }; role: string; status: string }[];
}

export const TeamManagement: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadTeams = () => {
        setLoading(true);
        teamsApi.list()
            .then((res: { data?: Team[] }) => {
                const list = Array.isArray(res.data) ? res.data : [];
                setTeams(list);
                if (list.length > 0 && !selectedTeam) setSelectedTeam(list[0]);
            })
            .catch(() => setTeams([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadTeams(); }, []);

    const members: TeamMember[] = selectedTeam?.members?.map((m: { id: string; user?: { id: string; name: string; email: string }; role: string; status: string }) => ({
        id: m.user?.id || m.id,
        name: m.user?.name || '—',
        email: m.user?.email || '—',
        role: m.role === 'OWNER' ? UserRole.ADMIN : UserRole.LEARNER,
        status: m.status || 'Active',
        riskScore: 0,
        coursesCompleted: 0
    })) || [];

    const handleCreateTeam = () => {
        teamsApi.create('My Team').then(() => loadTeams()).catch(() => setError('Failed to create team'));
    };

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeam || !newMemberEmail.trim()) return;
        setInviteLoading(true);
        setError(null);
        teamsApi.invite(selectedTeam.id, newMemberEmail.trim())
            .then(() => {
                setIsInviteModalOpen(false);
                setNewMemberEmail('');
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
                loadTeams();
            })
            .catch((err: { message?: string }) => setError(err?.message || 'Invite failed'))
            .finally(() => setInviteLoading(false));
    };

    const handleDelete = (id: string) => {
        if (!selectedTeam || !confirm('Remove this member?')) return;
        teamsApi.removeMember(selectedTeam.id, id).then(() => { loadTeams(); if (selectedTeam) teamsApi.getById(selectedTeam.id).then((r: { data?: Team }) => r.data && setSelectedTeam(r.data)); }).catch(() => {});
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (teams.length === 0) {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">No team yet</h1>
                <p className="text-slate-500 mb-4">Create a team to invite members.</p>
                <button onClick={handleCreateTeam} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700">Create team</button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 relative animate-in fade-in">
            {showSuccess && (
                <div className="absolute top-4 right-4 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-4 z-50">
                    <CheckCircle size={20} />
                    <span>Invitation sent!</span>
                </div>
            )}
            {error && <div className="bg-amber-50 text-amber-800 px-4 py-2 rounded-lg">{error}</div>}

            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Workforce Intelligence</h1>
                    <p className="text-slate-500">Monitor engagement and retention risk.</p>
                </div>
                <div className="flex gap-2 items-center">
                    {teams.length > 1 && (
                        <select
                            value={selectedTeam?.id || ''}
                            onChange={(e) => setSelectedTeam(teams.find(t => t.id === e.target.value) || null)}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        >
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    )}
                    <button onClick={() => setIsInviteModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700">
                        <UserPlus size={18} /> Invite
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
                    <Search className="text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search team..." 
                        className="bg-transparent outline-none flex-1 text-sm"
                    />
                </div>
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Member</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Engagement Risk</th>
                            <th className="px-6 py-4">Progress</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredMembers.length > 0 ? filteredMembers.map(member => (
                            <tr key={member.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{member.name}</div>
                                    <div className="text-xs text-slate-500">{member.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${member.role === UserRole.FACILITATOR ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {member.role === UserRole.FACILITATOR ? 'Expert' : 'Learner'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${member.riskScore > 70 ? 'bg-red-500' : member.riskScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${member.riskScore}%` }}
                                            ></div>
                                        </div>
                                        <span className={`text-xs font-bold ${member.riskScore > 70 ? 'text-red-600' : 'text-slate-600'}`}>
                                            {member.riskScore > 70 ? 'High' : member.riskScore > 40 ? 'Medium' : 'Low'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {member.coursesCompleted} Courses
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDelete(member.id)} className="text-slate-400 hover:text-red-500">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    No team members found. Invite someone to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Logic (Simplified for brevity, keep existing modal code structure) */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Invite Member</h2>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <input type="email" placeholder="Email" className="w-full p-2 border rounded" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} required />
                            <div className="flex gap-2 justify-end pt-4">
                                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 text-slate-500">Cancel</button>
                                <button type="submit" disabled={inviteLoading} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold disabled:opacity-50">{inviteLoading ? 'Sending…' : 'Send Invite'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
