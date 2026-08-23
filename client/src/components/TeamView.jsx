import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, Copy, Check, UserMinus, KeyRound, CheckCircle2 } from 'lucide-react';

export default function TeamView() {
  const { user, team } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isLeader = user?.role === 'leader';

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/project/members');
      setMembers(data.members || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!team?.code) return;
    navigator.clipboard.writeText(team.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from the team?`)) return;

    try {
      setError('');
      setMessage('');
      const data = await apiFetch(`/project/members/${memberId}`, { method: 'DELETE' });
      setMessage(data.message);
      setMembers(members.filter(m => m.id !== memberId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-[#6B615C]">Loading team members...</div>;

  return (
    <div className="space-y-6">
      {/* Top Invite Banner */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center gap-2 text-[#37A3A3] text-xs font-bold uppercase tracking-wider justify-center md:justify-start">
            <KeyRound className="w-4 h-4" /> Team Workspace Invite Code
          </div>
          <h3 className="text-xl font-extrabold text-[#2B2523]">Team Roster ({members.length})</h3>
          <p className="text-[#6B615C] text-xs max-w-xl">
            Teammates can join this workspace during registration using this unique code.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#FFFDF7] p-3 rounded-2xl border border-[#EADEC7] shrink-0">
          <div className="font-mono text-lg font-bold text-[#37A3A3] tracking-wider px-2">
            {team?.code}
          </div>
          <button
            onClick={handleCopyCode}
            className="px-4 py-2 bg-[#58C4C4] hover:bg-[#37A3A3] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-[#E4F7F7] border border-[#58C4C4] text-[#37A3A3] text-sm flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-5 h-5 text-[#58C4C4]" /> {message}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-[#FDF0EC] border border-[#F48B67] text-[#D86B47] text-sm font-bold">
          {error}
        </div>
      )}

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => {
          const isMemberLeader = member.role === 'leader';
          return (
            <div
              key={member.id}
              className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <img
                    src={member.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.username}`}
                    alt={member.full_name}
                    className="w-14 h-14 rounded-full border-2 border-[#58C4C4] bg-[#FFF9E8] shrink-0"
                  />
                  <div>
                    <h4 className="text-lg font-bold text-[#2B2523] leading-tight">{member.full_name}</h4>
                    <span className="text-xs text-[#37A3A3] font-bold block mt-0.5">
                      {member.specialization || (isMemberLeader ? 'Team Leader' : 'Developer')}
                    </span>
                    <span className="text-[11px] text-[#8E837D]">@{member.username}</span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                    isMemberLeader
                      ? 'bg-[#FDF0EC] text-[#D86B47] border border-[#F48B67]'
                      : 'bg-[#E4F7F7] text-[#37A3A3] border border-[#58C4C4]'
                  }`}
                >
                  {isMemberLeader ? '🛡️ Leader' : '👤 Member'}
                </span>
              </div>

              {/* 3 Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#EADEC7] text-xs">
                <div className="bg-[#FFFDF7] p-3 rounded-xl border border-[#EADEC7] text-center">
                  <span className="text-[#8E837D] block text-[10px] uppercase font-bold">Assigned</span>
                  <span className="text-base font-extrabold text-[#2B2523] mt-0.5 block">{member.task_count || 0} Tasks</span>
                </div>

                <div className="bg-[#FFFDF7] p-3 rounded-xl border border-[#EADEC7] text-center">
                  <span className="text-[#8E837D] block text-[10px] uppercase font-bold">Completed</span>
                  <span className="text-base font-extrabold text-emerald-600 mt-0.5 block">{member.completed_tasks || 0}</span>
                </div>

                <div className="bg-[#FFFDF7] p-3 rounded-xl border border-[#EADEC7] text-center">
                  <span className="text-[#8E837D] block text-[10px] uppercase font-bold">Current</span>
                  <span className="text-base font-extrabold text-[#37A3A3] mt-0.5 block">{member.active_tasks || 0}</span>
                </div>
              </div>

              {/* Leader Actions */}
              {isLeader && !isMemberLeader && (
                <div className="pt-3 border-t border-[#EADEC7] flex justify-end">
                  <button
                    onClick={() => handleRemoveMember(member.id, member.full_name)}
                    className="px-3 py-1.5 bg-[#FDF0EC] hover:bg-[#F48B67] hover:text-white text-[#D86B47] text-xs font-bold rounded-xl border border-[#F48B67] transition-all flex items-center gap-1.5"
                  >
                    <UserMinus className="w-3.5 h-3.5" /> Remove Member
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
