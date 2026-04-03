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
    isInvitation?: boolean;
}

interface Team {
    id: string;
    name: string;
    members?: { id: string; user?: { id: string; name: string; email: string }; role: string; status: string }[];
    invitations?: { id: string; email: string; status: string; expiresAt?: string }[];
}

interface TeamManagementProps {
    /** When opening from URL e.g. /workforce/teams/:teamId */
    initialTeamId?: string | null;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ initialTeamId }) => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('Invitation sent by email!');
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');

    const loadTeams = () => {
        setLoading(true);
        setError(null);
        teamsApi.list()
            .then((res) => {
                const list = Array.isArray(res.data) ? res.data : [];
                setTeams(list as Team[]);
                setSelectedTeam((prev) => {
                    const teamsList = list as Team[];
                    if (teamsList.length === 0) return null;
                    const next = teamsList.find((t) => t.id === prev?.id) ?? teamsList[0];
                    return next ?? null;
                });
            })
            .catch((err: { message?: string }) => {
                setTeams([]);
                setError(err?.message || 'Failed to load teams');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadTeams(); }, []);

    useEffect(() => {
        if (initialTeamId && teams.length > 0) {
            const team = teams.find((t) => t.id === initialTeamId);
            if (team) setSelectedTeam(team);
        }
    }, [initialTeamId, teams]);

    const members: (TeamMember & { memberRole: string })[] = [
        ...(selectedTeam?.members?.map((m: { id: string; user?: { id: string; name: string; email: string }; role: string; status: string }) => ({
            id: m.user?.id || m.id,
            name: m.user?.name || '—',
            email: m.user?.email || '—',
            role: m.role === 'OWNER' ? UserRole.ADMIN : UserRole.LEARNER,
            memberRole: m.role || 'MEMBER',
            status: 'Active',
            riskScore: 0,
            coursesCompleted: 0,
            isInvitation: false,
        })) || []),
        ...(selectedTeam?.invitations?.filter((inv: { status: string }) => (inv.status || 'PENDING').toUpperCase() !== 'ACCEPTED').map((inv: { id: string; email: string; status: string }) => ({
            id: `inv-${inv.id}`,
            name: '—',
            email: inv.email,
            role: UserRole.LEARNER,
            memberRole: 'Invited',
            status: inv.status === 'PENDING' ? 'Pending' : inv.status,
            riskScore: 0,
            coursesCompleted: 0,
            isInvitation: true,
        })) || []),
    ];

    const handleCreateTeam = (name?: string) => {
        const teamName = (name || newTeamName || 'My Team').trim() || 'My Team';
        setError(null);
        teamsApi.create(teamName)
            .then((res) => {
                const created = res?.data as Team | undefined;
                setIsCreateModalOpen(false);
                setNewTeamName('');
                loadTeams();
                if (created) setSelectedTeam(created);
            })
            .catch((err: { message?: string }) => setError(err?.message || 'Failed to create team'));
    };

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeam || !newMemberEmail.trim()) return;
        setInviteLoading(true);
        setError(null);
        teamsApi.invite(selectedTeam.id, newMemberEmail.trim())
            .then((res) => {
                const inviteData = res?.data as { emailSent?: boolean } | undefined;
                setIsInviteModalOpen(false);
                setNewMemberEmail('');
                setShowSuccess(true);
                setSuccessMessage(inviteData?.emailSent === false ? 'Invitation created. (Email could not be sent.)' : 'Invitation sent by email!');
                setTimeout(() => { setShowSuccess(false); setSuccessMessage('Invitation sent!'); }, 4000);
                loadTeams();
                teamsApi.getById(selectedTeam.id).then((r) => {
                    const team = r.data as Team | undefined;
                    if (team) setSelectedTeam(team);
                }).catch(() => {});
            })
            .catch((err: { message?: string }) => setError(err?.message || 'Invite failed'))
            .finally(() => setInviteLoading(false));
    };

    const handleRemoveMember = (id: string) => {
        if (!selectedTeam || !confirm('Remove this member from the team?')) return;
        setError(null);
        teamsApi.removeMember(selectedTeam.id, id)
            .then(() => {
                loadTeams();
                teamsApi.getById(selectedTeam.id).then((r) => {
                    const team = r.data as Team | undefined;
                    if (team) setSelectedTeam(team);
                }).catch(() => {});
            })
            .catch((err: { message?: string }) => setError(err?.message || 'Failed to remove member'));
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
                {error && <div className="mb-4 bg-amber-50 text-amber-800 px-4 py-2 rounded-lg max-w-md mx-auto">{error}</div>}
                <h1 className="text-2xl font-bold text-slate-900 mb-2">No team yet</h1>
                <p className="text-slate-500 mb-4">Create a team to invite members.</p>
                <button type="button" onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700">Create team</button>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                            <h2 className="text-xl font-bold mb-4">Create team</h2>
                            <input type="text" placeholder="Team name" className="w-full p-3 border border-slate-200 rounded-lg mb-4" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
                            <div className="flex gap-2 justify-end">
                                <button type="button" onClick={() => { setIsCreateModalOpen(false); setNewTeamName(''); }} className="px-4 py-2 text-slate-500">Cancel</button>
                                <button type="button" onClick={() => handleCreateTeam()} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold">Create</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 relative animate-in fade-in">
            {showSuccess && (
                <div className="absolute top-4 right-4 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-4 z-50 max-w-sm">
                    <CheckCircle size={20} className="shrink-0" />
                    <span>{successMessage}</span>
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
                    <button type="button" onClick={() => { setIsInviteModalOpen(true); setError(null); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700">
                        <UserPlus size={18} /> Invite
                    </button>
                    <button type="button" onClick={() => { setIsCreateModalOpen(true); setNewTeamName(''); setError(null); }} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-50">
                        New team
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
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Engagement Risk</th>
                            <th className="px-6 py-4">Progress</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredMembers.length > 0 ? filteredMembers.map(member => (
                            <tr key={member.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{member.isInvitation ? '—' : member.name}</div>
                                    <div className="text-xs text-slate-500">{member.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        member.memberRole === 'OWNER' ? 'bg-indigo-100 text-indigo-700' :
                                        member.memberRole === 'Invited' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                        {member.memberRole === 'OWNER' ? 'Owner' : member.memberRole === 'Invited' ? 'Invited' : 'Member'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        member.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                                    }`}>
                                        {member.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {member.isInvitation ? (
                                        <span className="text-xs text-slate-400">—</span>
                                    ) : (
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
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {member.isInvitation ? '—' : `${member.coursesCompleted} Courses`}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {member.memberRole === 'OWNER' ? (
                                        <span className="text-xs text-slate-400">—</span>
                                    ) : member.isInvitation ? (
                                        <span className="text-xs text-slate-400">Pending</span>
                                    ) : (
                                        <button type="button" onClick={() => handleRemoveMember(member.id)} className="text-slate-400 hover:text-red-500" title="Remove member">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    No team members found. Invite someone to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Invite Member</h2>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <input type="email" placeholder="Email address" className="w-full p-3 border border-slate-200 rounded-lg" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} required />
                            <div className="flex gap-2 justify-end pt-4">
                                <button type="button" onClick={() => { setIsInviteModalOpen(false); setNewMemberEmail(''); }} className="px-4 py-2 text-slate-500">Cancel</button>
                                <button type="submit" disabled={inviteLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold disabled:opacity-50">{inviteLoading ? 'Sending…' : 'Send Invite'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Create team</h2>
                        <input type="text" placeholder="Team name" className="w-full p-3 border border-slate-200 rounded-lg mb-4" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => { setIsCreateModalOpen(false); setNewTeamName(''); }} className="px-4 py-2 text-slate-500">Cancel</button>
                            <button type="button" onClick={() => handleCreateTeam()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
