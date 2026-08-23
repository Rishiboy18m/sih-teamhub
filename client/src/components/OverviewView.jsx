import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { FileText, ExternalLink, Edit3, Save, CheckCircle2, Shield, Calendar, Code, Sparkles, FolderGit2 } from 'lucide-react';

export default function OverviewView() {
  const { user, team } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    problemCode: '',
    category: '',
    description: '',
    repoUrl: '',
    demoUrl: '',
    deadline: ''
  });
  const [saveSuccess, setSaveSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProject();
  }, []);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/project');
      setProject(data.project);
      setFormData({
        title: data.project.title || '',
        problemCode: data.project.problem_code || '',
        category: data.project.category || '',
        description: data.project.description || '',
        repoUrl: data.project.repo_url || '',
        demoUrl: data.project.demo_url || '',
        deadline: data.project.deadline || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSaveSuccess('');
      const data = await apiFetch('/project', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      setProject(data.project);
      setSaveSuccess('Project info updated successfully!');
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading project overview...</div>;
  }

  const isLeader = user?.role === 'leader';

  return (
    <div className="space-y-6">
      {/* Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-950 border border-cyan-800/50 p-6 md:p-8">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono">
                {project?.problem_code || 'SIH-2026'}
              </span>
              <span className="text-xs text-slate-400 font-medium">Team {team?.name}</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {project?.title}
            </h2>

            <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
              {project?.description}
            </p>
          </div>

          {isLeader && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0"
            >
              <Edit3 className="w-4 h-4" /> Edit Problem Statement
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-200 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-cyan-400" /> {saveSuccess}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Edit Form (Leader Only) */}
      {editing ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" /> Edit SIH Problem Statement & Project Details
            </h3>
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">SIH Problem Code</label>
                <input
                  type="text"
                  value={formData.problemCode}
                  onChange={(e) => setFormData({ ...formData, problemCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category / Domain</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Problem Description / Abstract</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">GitHub Repo URL</label>
                <input
                  type="url"
                  value={formData.repoUrl}
                  onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Live Demo / Pitch URL</label>
                <input
                  type="url"
                  value={formData.demoUrl}
                  onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                  placeholder="https://demo.app"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Submission Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Grid Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <FolderGit2 className="w-4 h-4" /> Repository & Links
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-xs text-slate-400 block">GitHub Repository</span>
              {project?.repo_url ? (
                <a
                  href={project.repo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-cyan-400 hover:underline flex items-center gap-1.5 truncate"
                >
                  {project.repo_url} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-sm text-slate-500 italic">Not set</span>
              )}
            </div>

            <div>
              <span className="text-xs text-slate-400 block">Live Prototype Demo</span>
              {project?.demo_url ? (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-orange-400 hover:underline flex items-center gap-1.5 truncate"
                >
                  {project.demo_url} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-sm text-slate-500 italic">Not set</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-orange-400 text-xs font-semibold uppercase tracking-wider">
            <Calendar className="w-4 h-4" /> Submission Countdown
          </div>

          <div>
            <span className="text-xs text-slate-400 block">Target Deadline</span>
            <span className="text-lg font-bold text-white">
              {project?.deadline ? new Date(project.deadline).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Team Role</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isLeader ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'}`}>
              {isLeader ? '🛡️ Team Leader' : '👤 Team Member'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Solution Domain
          </div>

          <div>
            <span className="text-xs text-slate-400 block">Category</span>
            <span className="text-sm font-semibold text-slate-200">
              {project?.category || 'General Software & Innovation'}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Isolated team workspace with strict data privacy for Team {team?.name}.
          </p>
        </div>
      </div>
    </div>
  );
}
