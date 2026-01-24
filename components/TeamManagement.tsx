
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Crown, GraduationCap, CheckCircle, Search, AlertCircle, X, AlertTriangle, TrendingDown } from 'lucide-react';
import { UserRole } from '../types';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: 'Active' | 'Pending';
    lastActive: string;
    coursesCompleted: number;
    riskScore: number; // 0-100
}

const STORAGE_KEY = 'knovatwin_team_members';

const INITIAL_MEMBERS: TeamMember[] = [];

export const TeamManagement: React.FC = () => {
    const [members, setMembers] = useState<TeamMember[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
        } catch (e) {
            return INITIAL_MEMBERS;
        }
    });

    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<UserRole>(UserRole.LEARNER);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    }, [members]);

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        const newMember: TeamMember = {
            id: `tm-${Date.now()}`,
            name: newMemberName,
            email: newMemberEmail,
            role: newMemberRole,
            status: 'Pending',
            lastActive: '-',
            coursesCompleted: 0,
            riskScore: 0
        };
        setMembers([...members, newMember]);
        setIsInviteModalOpen(false);
        setNewMemberName('');
        setNewMemberEmail('');
        
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to remove this member?')) {
            setMembers(members.filter(m => m.id !== id));
        }
    };

    const filteredMembers = members.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 relative animate-in fade-in">
            {showSuccess && (
                <div className="absolute top-4 right-4 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-4 z-50">
                    <CheckCircle size={20} />
                    <span>Invitation sent!</span>
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Workforce Intelligence</h1>
                    <p className="text-slate-500">Monitor engagement and retention risk.</p>
                </div>
                <button onClick={() => setIsInviteModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700">
                    <UserPlus size={18} /> Invite
                </button>
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
                            <input type="text" placeholder="Name" className="w-full p-2 border rounded" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} required />
                            <input type="email" placeholder="Email" className="w-full p-2 border rounded" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} required />
                            <div className="flex gap-2 justify-end pt-4">
                                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 text-slate-500">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded font-bold">Send Invite</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
