import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Shield, User, KeyRound, Copy, Check, Save } from 'lucide-react';

export default function SettingsView({ showToast }) {
  const { user, team } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!team?.code) return;
    navigator.clipboard.writeText(team.code);
    setCopied(true);
    if (showToast) showToast('Team code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-[#2B2523] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#37A3A3]" /> Workspace & Account Settings
        </h3>
        <p className="text-xs text-[#6B615C] mt-1">Manage team code, role permissions, and security settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 space-y-4 shadow-sm">
          <h4 className="text-sm font-bold text-[#2B2523] uppercase tracking-wider">Team Workspace Information</h4>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[#8E837D] font-bold mb-1">Team Name</label>
              <input type="text" value={team?.name || ''} className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-[#2B2523] font-bold" disabled />
            </div>

            <div>
              <label className="block text-[#8E837D] font-bold mb-1">Team Join Code</label>
              <div className="flex items-center gap-2">
                <input type="text" value={team?.code || ''} className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl font-mono text-[#37A3A3] font-bold" disabled />
                <button onClick={handleCopyCode} className="px-4 py-2 bg-[#58C4C4] text-white rounded-xl font-bold flex items-center gap-1">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 space-y-4 shadow-sm">
          <h4 className="text-sm font-bold text-[#2B2523] uppercase tracking-wider">User Account Profile</h4>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[#8E837D] font-bold mb-1">Full Name</label>
              <input type="text" value={user?.fullName || ''} className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-[#2B2523] font-bold" disabled />
            </div>

            <div>
              <label className="block text-[#8E837D] font-bold mb-1">Role & Specialization</label>
              <input type="text" value={`${user?.role === 'leader' ? 'Team Leader' : 'Team Member'} - ${user?.specialization || 'Developer'}`} className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-[#37A3A3] font-bold" disabled />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
