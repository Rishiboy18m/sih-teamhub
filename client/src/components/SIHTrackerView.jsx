import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { Flag, Edit3, Save, Shield, X } from 'lucide-react';

export default function SIHTrackerView({ showToast }) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMilestone, setEditingMilestone] = useState(null);

  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    status: 'pending',
    completionPercentage: 0
  });

  const isLeader = user?.role === 'leader';

  const officialSIHMilestones = [
    'Problem Selection',
    'Team Formation',
    'Ideation',
    'Research',
    'Solution Design',
    'Prototype',
    'Testing',
    'PPT',
    'Demo Preparation',
    'Internal Review',
    'Final Submission'
  ];

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/milestones');
      const fetched = data.milestones || [];

      const merged = officialSIHMilestones.map((mTitle, idx) => {
        const found = fetched.find(f => f.title.toLowerCase() === mTitle.toLowerCase());
        if (found) return found;
        return {
          id: `default-${idx}`,
          title: mTitle,
          description: `Official SIH milestone phase ${idx + 1}.`,
          due_date: new Date(Date.now() + (idx + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: idx < 3 ? 'completed' : idx === 3 ? 'in_progress' : 'pending',
          completion_percentage: idx < 3 ? 100 : idx === 3 ? 60 : 0
        };
      });

      setMilestones(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (m) => {
    setEditingMilestone(m);
    setEditFormData({
      title: m.title,
      description: m.description || '',
      dueDate: m.due_date || '',
      status: m.status || 'pending',
      completionPercentage: m.completion_percentage || 0
    });
  };

  const handleUpdateMilestone = async (e) => {
    e.preventDefault();
    if (!editingMilestone) return;

    try {
      let data;
      if (typeof editingMilestone.id === 'string' && editingMilestone.id.startsWith('default-')) {
        data = await apiFetch('/milestones', {
          method: 'POST',
          body: JSON.stringify(editFormData)
        });
      } else {
        data = await apiFetch(`/milestones/${editingMilestone.id}`, {
          method: 'PUT',
          body: JSON.stringify(editFormData)
        });
      }

      setMilestones(milestones.map(m => m.title.toLowerCase() === editFormData.title.toLowerCase() ? data.milestone : m));
      setEditingMilestone(null);
      if (showToast) showToast('Milestone updated successfully!', 'success');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-[#6B615C]">Loading SIH milestone tracker...</div>;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-[#37A3A3] text-xs font-bold uppercase tracking-wider mb-1">
            <Flag className="w-4 h-4 text-[#F48B67]" /> Official SIH Submission Tracker
          </div>
          <h3 className="text-2xl font-extrabold text-[#2B2523]">SIH 11-Milestone Progress Roadmap</h3>
        </div>
      </div>

      {/* 11 Milestones */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="space-y-4">
          {milestones.map((m, idx) => {
            const percentage = m.completion_percentage !== undefined ? m.completion_percentage : (m.status === 'completed' ? 100 : 0);
            return (
              <div key={m.id || idx} className="p-5 bg-[#FFFDF7] border border-[#EADEC7] rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    percentage === 100 ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                    percentage > 0 ? 'bg-[#E4F7F7] text-[#37A3A3] border border-[#58C4C4]' :
                    'bg-[#FFF9E8] text-[#A67D18] border border-[#FCD575]'
                  }`}>
                    {idx + 1}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h5 className="text-base font-bold text-[#2B2523]">{m.title}</h5>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-[#E4F7F7] text-[#37A3A3] border border-[#58C4C4]">
                        {m.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#6B615C]">{m.description}</p>

                    <div className="space-y-1 max-w-md">
                      <div className="flex justify-between text-[11px] font-bold text-[#6B615C]">
                        <span>Completion Progress</span>
                        <span className="font-mono text-[#37A3A3]">{percentage}%</span>
                      </div>
                      <div className="w-full bg-[#FFF9E8] h-2 rounded-full overflow-hidden border border-[#EADEC7]">
                        <div className="h-full rounded-full bg-[#58C4C4]" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 justify-between lg:justify-end">
                  <div className="text-right text-xs">
                    <span className="text-[#8E837D] block text-[10px] uppercase font-bold">Deadline</span>
                    <span className="font-mono font-bold text-[#2B2523]">{m.due_date || 'No deadline'}</span>
                  </div>

                  {isLeader && (
                    <button
                      onClick={() => openEditModal(m)}
                      className="px-3 py-1.5 bg-[#E4F7F7] text-[#37A3A3] rounded-xl text-xs font-bold border border-[#58C4C4]"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#EADEC7] pb-3">
              <h3 className="text-base font-bold text-[#2B2523]">Edit Milestone Deadline</h3>
              <button onClick={() => setEditingMilestone(null)} className="text-[#6B615C] hover:text-[#2B2523]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMilestone} className="space-y-4">
              <div>
                <label className="block font-semibold text-[#2B2523] mb-1">Phase Title</label>
                <input type="text" value={editFormData.title} className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523] font-bold" disabled />
              </div>

              <div>
                <label className="block font-semibold text-[#2B2523] mb-1">Deadline Date</label>
                <input
                  type="date"
                  value={editFormData.dueDate}
                  onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2B2523] mb-1">Completion Percentage (0-100%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editFormData.completionPercentage}
                  onChange={(e) => setEditFormData({ ...editFormData, completionPercentage: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523] font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EADEC7]">
                <button type="button" onClick={() => setEditingMilestone(null)} className="px-4 py-2 bg-[#FFF9E8] border border-[#FCD575] text-[#2B2523] font-bold rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#58C4C4] hover:bg-[#37A3A3] text-white font-bold rounded-lg">
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
