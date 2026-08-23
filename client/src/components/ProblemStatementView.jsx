import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { FileText, Edit3, Save, Shield, ExternalLink, Building2, Tag, CheckCircle2, X } from 'lucide-react';

export default function ProblemStatementView({ showToast }) {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    problemCode: '',
    organizationMinistry: '',
    theme: '',
    category: '',
    description: '',
    proposedSolution: '',
    objectives: '',
    expectedOutcome: '',
    importantLinks: '',
    additionalNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const isLeader = user?.role === 'leader';

  useEffect(() => {
    fetchProblemStatement();
  }, []);

  const fetchProblemStatement = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/project');
      setProject(data.project || null);
      if (data.project) {
        setFormData({
          title: data.project.title || '',
          problemCode: data.project.problem_code || '',
          organizationMinistry: data.project.organization_ministry || '',
          theme: data.project.theme || '',
          category: data.project.category || '',
          description: data.project.description || '',
          proposedSolution: data.project.proposed_solution || '',
          objectives: data.project.objectives || '',
          expectedOutcome: data.project.expected_outcome || '',
          importantLinks: data.project.important_links || '',
          additionalNotes: data.project.additional_notes || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const data = await apiFetch('/project', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      setProject(data.project);
      setShowEditModal(false);
      if (showToast) showToast('Problem Statement updated successfully!', 'success');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-[#6B615C]">Loading Problem Statement...</div>;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#FFF9E8] border border-[#FCD575] text-[#2B2523] rounded-full text-xs font-bold font-mono">
              ID: {project?.problem_code || 'SIH-1492'}
            </span>
            <span className="px-3 py-1 bg-[#E4F7F7] border border-[#58C4C4] text-[#37A3A3] rounded-full text-xs font-bold">
              {project?.theme || 'Software Development'}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#2B2523]">{project?.title}</h2>
          <p className="text-xs text-[#6B615C] flex items-center gap-1.5 font-semibold">
            <Building2 className="w-4 h-4 text-[#37A3A3]" /> Organization: {project?.organization_ministry || 'Ministry of Education'}
          </p>
        </div>

        {isLeader && (
          <button
            onClick={() => setShowEditModal(true)}
            className="px-5 py-2.5 bg-[#F48B67] hover:bg-[#D86B47] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm shrink-0"
          >
            <Edit3 className="w-4 h-4" /> Edit Problem Statement
          </button>
        )}
      </div>

      {/* Grid displaying 10 fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl p-6 space-y-3 shadow-sm">
          <h4 className="text-xs font-bold text-[#37A3A3] uppercase tracking-wider">1. Problem Statement</h4>
          <p className="text-xs text-[#2B2523] leading-relaxed whitespace-pre-line bg-[#FFFDF7] p-4 rounded-xl border border-[#EADEC7]">
            {project?.description}
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl p-6 space-y-3 shadow-sm">
          <h4 className="text-xs font-bold text-[#37A3A3] uppercase tracking-wider">2. Proposed Solution</h4>
          <p className="text-xs text-[#2B2523] leading-relaxed whitespace-pre-line bg-[#FFFDF7] p-4 rounded-xl border border-[#EADEC7]">
            {project?.proposed_solution}
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl p-6 space-y-3 shadow-sm">
          <h4 className="text-xs font-bold text-[#37A3A3] uppercase tracking-wider">3. Objectives</h4>
          <p className="text-xs text-[#2B2523] leading-relaxed whitespace-pre-line bg-[#FFFDF7] p-4 rounded-xl border border-[#EADEC7]">
            {project?.objectives}
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl p-6 space-y-3 shadow-sm">
          <h4 className="text-xs font-bold text-[#37A3A3] uppercase tracking-wider">4. Expected Outcome</h4>
          <p className="text-xs text-[#2B2523] leading-relaxed whitespace-pre-line bg-[#FFFDF7] p-4 rounded-xl border border-[#EADEC7]">
            {project?.expected_outcome}
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl p-6 space-y-3 shadow-sm">
          <h4 className="text-xs font-bold text-[#37A3A3] uppercase tracking-wider">5. Important Links</h4>
          <p className="text-xs text-[#2B2523] leading-relaxed whitespace-pre-line bg-[#FFFDF7] p-4 rounded-xl border border-[#EADEC7] font-mono">
            {project?.important_links}
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl p-6 space-y-3 shadow-sm">
          <h4 className="text-xs font-bold text-[#37A3A3] uppercase tracking-wider">6. Additional Notes</h4>
          <p className="text-xs text-[#2B2523] leading-relaxed whitespace-pre-line bg-[#FFFDF7] p-4 rounded-xl border border-[#EADEC7]">
            {project?.additional_notes}
          </p>
        </div>
      </div>

      {/* Leader Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-[#EADEC7] pb-3">
              <h3 className="text-base font-bold text-[#2B2523] flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#F48B67]" /> Edit Problem Statement (Leader)
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-[#6B615C] hover:text-[#2B2523]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#2B2523] mb-1">Problem Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2B2523] mb-1">SIH Problem Code *</label>
                  <input
                    type="text"
                    value={formData.problemCode}
                    onChange={(e) => setFormData({ ...formData, problemCode: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#2B2523] mb-1">Organization / Ministry</label>
                  <input
                    type="text"
                    value={formData.organizationMinistry}
                    onChange={(e) => setFormData({ ...formData, organizationMinistry: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2B2523] mb-1">Theme</label>
                  <input
                    type="text"
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2B2523] mb-1">Problem Statement Abstract</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2B2523] mb-1">Proposed Solution</label>
                <textarea
                  rows={4}
                  value={formData.proposedSolution}
                  onChange={(e) => setFormData({ ...formData, proposedSolution: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EADEC7]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-[#FFF9E8] border border-[#FCD575] text-[#2B2523] font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#58C4C4] hover:bg-[#37A3A3] text-white font-bold rounded-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Problem Statement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
