import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare, Clock, AlertTriangle, CheckCircle2, TrendingUp,
  Layers, ArrowRight, Shield, Zap, Sparkles, UserPlus
} from 'lucide-react';

export default function DashboardView({ onNavigate }) {
  const { user, team } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [tRes, pRes] = await Promise.all([
        apiFetch('/tasks'),
        apiFetch('/project')
      ]);
      setTasks(tRes.tasks || []);
      setProject(pRes.project || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-[#6B615C]">Loading team dashboard...</div>;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const overdueTasks = tasks.filter(t => t.is_overdue === 1).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statCards = [
    { title: 'Total Tasks', value: totalTasks, icon: CheckSquare, color: 'text-[#37A3A3]', bg: 'bg-[#E4F7F7]', border: 'border-[#58C4C4]' },
    { title: 'Completed Tasks', value: completedTasks, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { title: 'In Progress Tasks', value: inProgressTasks, icon: TrendingUp, color: 'text-[#37A3A3]', bg: 'bg-[#E4F7F7]', border: 'border-[#58C4C4]' },
    { title: 'Pending Tasks', value: pendingTasks, icon: Clock, color: 'text-[#A67D18]', bg: 'bg-[#FFF9E8]', border: 'border-[#FCD575]' },
    { title: 'Overdue Tasks', value: overdueTasks, icon: AlertTriangle, color: 'text-[#D86B47]', bg: 'bg-[#FDF0EC]', border: 'border-[#F48B67]' },
    { title: 'Overall Progress', value: `${progressPercentage}%`, icon: Layers, color: 'text-[#37A3A3]', bg: 'bg-[#E4F7F7]', border: 'border-[#58C4C4]' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#58C4C4] to-[#37A3A3] text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-white">
            <Zap className="w-4 h-4" /> Team Workspace • Code: {team?.code}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.fullName}!
          </h2>
          <p className="text-white/90 text-xs md:text-sm max-w-2xl leading-relaxed">
            {project?.title || 'SIH Hackathon Workspace'} is currently at <strong className="text-[#FCD575]">{progressPercentage}% completion</strong>.
          </p>
        </div>
      </div>

      {/* 6 Required Stat Cards (Section 6) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#6B615C] uppercase tracking-wider">{card.title}</span>
                <div className={`p-2 rounded-xl ${card.bg} ${card.border} border`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#2B2523]">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar Widget & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#2B2523] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#37A3A3]" /> Project Progress Overview
            </h3>
            <span className="text-xs font-bold font-mono text-[#37A3A3]">{completedTasks} of {totalTasks} Tasks Done</span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-[#FFF9E8] h-4 rounded-full overflow-hidden border border-[#EADEC7] p-0.5">
              <div
                className="bg-[#58C4C4] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#6B615C] font-semibold">
              <span>0% Kickoff</span>
              <span>50% Prototype</span>
              <span>100% Final Pitch</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <h3 className="text-base font-bold text-[#2B2523]">Quick Shortcuts</h3>
          <div className="space-y-2 text-xs">
            <button
              onClick={() => onNavigate('tasks')}
              className="w-full py-2.5 px-3 bg-[#E4F7F7] hover:bg-[#58C4C4] hover:text-white text-[#37A3A3] rounded-xl font-bold transition-all flex items-center justify-between border border-[#58C4C4]"
            >
              <span>Manage Kanban Tasks</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('ai')}
              className="w-full py-2.5 px-3 bg-[#FDF0EC] hover:bg-[#F48B67] hover:text-white text-[#D86B47] rounded-xl font-bold transition-all flex items-center justify-between border border-[#F48B67]"
            >
              <span>AI Problem Analyzer</span>
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('judge')}
              className="w-full py-2.5 px-3 bg-[#FFF9E8] hover:bg-[#FCD575] hover:text-[#2B2523] text-[#A67D18] rounded-xl font-bold transition-all flex items-center justify-between border border-[#FCD575]"
            >
              <span>Prepare Judge Presentation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
