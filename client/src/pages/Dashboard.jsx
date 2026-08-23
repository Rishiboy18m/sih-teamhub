import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import {
  LayoutDashboard, FileText, CheckSquare, Calendar, Users, FolderGit2,
  Lightbulb, MessageSquare, Sparkles, Flag, Award, Activity, Settings,
  LogOut, Copy, Check, Shield, KeyRound, Zap, Menu, X, Bell
} from 'lucide-react';

import DashboardView from '../components/DashboardView';
import ProblemStatementView from '../components/ProblemStatementView';
import TasksView from '../components/TasksView';
import TeamView from '../components/TeamView';
import FilesView from '../components/FilesView';
import IdeasView from '../components/IdeasView';
import DiscussionsView from '../components/DiscussionsView';
import AIView from '../components/AIView';
import AnalyticsView from '../components/AnalyticsView';
import JudgePrepView from '../components/JudgePrepView';
import SIHTrackerView from '../components/SIHTrackerView';
import ActivityView from '../components/ActivityView';
import SettingsView from '../components/SettingsView';
import CalendarView from '../components/CalendarView';
import GlobalSearch from '../components/GlobalSearch';
import Toast from '../components/Toast';

export default function Dashboard() {
  const { user, team, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const isLeader = user?.role === 'leader';

  useEffect(() => {
    fetchNotifications();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async () => {
    setShowNotifications(!showNotifications);
    if (unreadCount > 0) {
      try {
        await apiFetch('/notifications/mark-read', { method: 'POST' });
        setUnreadCount(0);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCopyCode = () => {
    if (!team?.code) return;
    navigator.clipboard.writeText(team.code);
    setCopied(true);
    showToast('Team code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'problem', label: 'Problem Statement', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'progress', label: 'Progress Module', icon: Activity },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'files', label: 'Files', icon: FolderGit2 },
    { id: 'ideas', label: 'Ideas & Research', icon: Lightbulb },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles, badge: 'AI' },
    { id: 'tracker', label: 'SIH Tracker', icon: Flag },
    { id: 'judge', label: 'Judge Preparation', icon: Award },
    { id: 'activity', label: 'Activity Feed', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'problem':
        return <ProblemStatementView showToast={showToast} />;
      case 'tasks':
        return <TasksView showToast={showToast} />;
      case 'progress':
        return <AnalyticsView />;
      case 'calendar':
        return <CalendarView />;
      case 'team':
        return <TeamView />;
      case 'files':
        return <FilesView showToast={showToast} />;
      case 'ideas':
        return <IdeasView showToast={showToast} />;
      case 'discussions':
        return <DiscussionsView />;
      case 'ai':
        return <AIView showToast={showToast} />;
      case 'tracker':
        return <SIHTrackerView showToast={showToast} />;
      case 'judge':
        return <JudgePrepView showToast={showToast} />;
      case 'activity':
        return <ActivityView />;
      case 'settings':
        return <SettingsView showToast={showToast} />;
      default:
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5E8] text-[#2B2523] flex flex-col selection:bg-[#58C4C4] selection:text-white relative">
      {/* Toast Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#EADEC7] backdrop-blur-xl px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#6B615C] hover:text-[#2B2523]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#58C4C4] flex items-center justify-center text-white shadow-sm shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-[#2B2523] leading-tight">
                SIH TeamHub
              </h1>
              <span className="text-[11px] text-[#37A3A3] font-bold block">
                Team: {team?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Global Search Component */}
        <div className="hidden md:block flex-1 max-w-md mx-4">
          <GlobalSearch onNavigate={(tab) => setActiveTab(tab)} />
        </div>

        {/* Right Header Utilities */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Invite Code Button */}
          <button
            onClick={handleCopyCode}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#FFF9E8] hover:bg-[#FCD575]/40 border border-[#FCD575] rounded-xl text-xs text-[#2B2523] font-mono transition-all"
            title="Copy Team Code"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#37A3A3]" />
            <span>Code: <strong className="text-[#37A3A3]">{team?.code}</strong></span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#6B615C]" />}
          </button>

          {/* Color-Coded Notification Dropdown */}
          <div className="relative">
            <button
              onClick={handleMarkRead}
              className="p-2 text-[#6B615C] hover:text-[#2B2523] hover:bg-[#E4F7F7] rounded-xl transition-all relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#F48B67] animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl shadow-xl p-4 z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-[#EADEC7] pb-2">
                  <h4 className="text-xs font-bold text-[#2B2523] uppercase tracking-wider">Notifications</h4>
                  <span className="text-[10px] text-[#37A3A3] font-bold">{notifications.length} recent</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="p-2.5 bg-[#FFFDF7] rounded-xl border border-[#EADEC7] text-xs space-y-1">
                      <div className="font-bold text-[#2B2523] flex items-center gap-1.5">
                        <span>{n.color === 'red' ? '🔴' : n.color === 'green' ? '🟢' : n.color === 'amber' ? '🟡' : '🔵'}</span>
                        <span>{n.title}</span>
                      </div>
                      <div className="text-[#6B615C] text-[11px] pl-5">{n.message}</div>
                      <div className="text-[10px] text-slate-400 text-right">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center text-xs text-[#6B615C] py-4 italic">No notifications</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-[#EADEC7]">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`}
              alt={user?.fullName}
              className="w-8 h-8 rounded-full border border-[#58C4C4] bg-[#FFF9E8]"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-[#2B2523] leading-tight">{user?.fullName}</div>
              <div className="text-[10px] text-[#37A3A3] capitalize font-bold flex items-center gap-1">
                {isLeader ? (
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[#F48B67]" /> Leader
                  </span>
                ) : (
                  <span>Member</span>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-[#6B615C] hover:text-[#D86B47] hover:bg-[#FDF0EC] rounded-xl transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#FFFFFF] border-r border-[#EADEC7] flex flex-col justify-between p-4 transition-transform duration-200 lg:translate-x-0 overflow-y-auto ${
            mobileMenuOpen ? 'translate-x-0 top-[55px]' : '-translate-x-full'
          }`}
        >
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-[#8E837D] uppercase tracking-wider">
              Workspace Navigation
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#58C4C4] text-white shadow-sm'
                      : 'text-[#6B615C] hover:text-[#2B2523] hover:bg-[#E4F7F7]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#37A3A3]'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FCD575] text-[#2B2523]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#EADEC7]">
            <div className="p-3 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-xs space-y-1">
              <div className="text-[10px] text-[#8E837D] font-semibold uppercase">Active Team</div>
              <div className="font-bold text-[#37A3A3] truncate">{team?.name}</div>
            </div>
          </div>
        </aside>

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#FAF5E8]">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
}
