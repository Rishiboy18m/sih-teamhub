import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare, Plus, Search, Filter, AlertTriangle, Calendar, User,
  Flame, Clock, CheckCircle2, MessageSquare, Paperclip, Activity, FileUp, X, Send, Download
} from 'lucide-react';

export default function TasksView({ showToast }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Filter & Search states (Section 10)
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('due_date');

  // Task Details Modal states (Section 9)
  const [taskComments, setTaskComments] = useState([]);
  const [taskActivities, setTaskActivities] = useState([]);
  const [taskAttachments, setTaskAttachments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // New Task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    category: 'Development',
    assignedToId: '',
    dueDate: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasksAndMembers();
  }, [filterTab, sortBy]);

  const fetchTasksAndMembers = async () => {
    try {
      setLoading(true);
      let queryParams = `?sort=${sortBy}`;
      if (filterTab !== 'all') queryParams += `&filter=${filterTab}`;

      const [tRes, mRes] = await Promise.all([
        apiFetch(`/tasks${queryParams}`),
        apiFetch('/project/members')
      ]);

      setTasks(tRes.tasks || []);
      setMembers(mRes.members || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;

    try {
      setSubmitting(true);
      const data = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask)
      });
      setTasks([data.task, ...tasks]);
      setShowCreateModal(false);
      setNewTask({ title: '', description: '', priority: 'medium', status: 'pending', category: 'Development', assignedToId: '', dueDate: '' });
      if (showToast) showToast('Task created successfully!', 'success');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const data = await apiFetch(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      setTasks(tasks.map(t => t.id === taskId ? data.task : t));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(data.task);
      }
      if (showToast) showToast(`Task updated to ${newStatus}!`, 'success');
    } catch (err) {
      alert(err.message);
    }
  };

  const openTaskModal = async (task) => {
    setSelectedTask(task);
    try {
      const [cRes, aRes, fRes] = await Promise.all([
        apiFetch(`/tasks/${task.id}/comments`),
        apiFetch(`/tasks/${task.id}/activities`),
        apiFetch(`/tasks/${task.id}/attachments`)
      ]);
      setTaskComments(cRes.comments || []);
      setTaskActivities(aRes.activities || []);
      setTaskAttachments(fRes.attachments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    try {
      const data = await apiFetch(`/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment: newComment })
      });
      setTaskComments([...taskComments, data.comment]);
      setNewComment('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUploadAttachment = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTask) return;

    try {
      setUploadingAttachment(true);
      const formData = new FormData();
      formData.append('attachment', file);

      const data = await apiFetch(`/tasks/${selectedTask.id}/attachments`, {
        method: 'POST',
        body: formData
      });

      setTaskAttachments([data.attachment, ...taskAttachments]);
      if (showToast) showToast('Attachment uploaded!', 'success');
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#FDF0EC] text-[#D86B47] border border-[#F48B67] flex items-center gap-1"><Flame className="w-3 h-3 text-[#D86B47]" /> Critical</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FFF9E8] text-[#A67D18] border border-[#FCD575]">High</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#E4F7F7] text-[#37A3A3] border border-[#58C4C4]">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-300">Low</span>;
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    if (filterTab === 'my_tasks') return t.assigned_to_id === user?.id;
    if (filterTab === 'assigned_by_me') return t.created_by_id === user?.id;
    if (filterTab === 'overdue') return t.is_overdue === 1;
    if (['pending', 'in_progress', 'review', 'completed'].includes(filterTab)) return t.status === filterTab;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-[#2B2523] flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-[#37A3A3]" /> Task Management Kanban Board
            </h3>
            <p className="text-[#6B615C] text-xs mt-0.5">
              Create, assign, filter, and track hackathon sprint tasks with automatic overdue calculation.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-[#58C4C4] hover:bg-[#37A3A3] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>

        {/* Search & Sort Controls (Section 10) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#EADEC7]">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8E837D]" />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-xs text-[#2B2523] focus:outline-none focus:border-[#58C4C4]"
            />
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-xs text-[#2B2523] font-semibold"
            >
              <option value="due_date">Sort by Deadline</option>
              <option value="priority">Sort by Priority</option>
              <option value="member">Sort by Assigned Member</option>
              <option value="created_at">Sort by Created Date</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs (Section 10) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'my_tasks', label: 'My Tasks' },
            { id: 'assigned_by_me', label: 'Assigned by Me' },
            { id: 'pending', label: 'Pending' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'review', label: 'Review' },
            { id: 'completed', label: 'Completed' },
            { id: 'overdue', label: '⚠️ Overdue' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterTab === tab.id
                  ? 'bg-[#58C4C4] text-white shadow-sm'
                  : 'bg-[#FFFDF7] text-[#6B615C] hover:text-[#2B2523] border border-[#EADEC7]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task Columns / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map(task => (
          <div
            key={task.id}
            className={`bg-[#FFFFFF] border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all relative ${
              task.is_overdue === 1 ? 'border-[#F48B67]' : 'border-[#EADEC7]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                {getPriorityBadge(task.priority)}

                {task.is_overdue === 1 && (
                  <span className="px-2 py-0.5 rounded bg-[#FDF0EC] text-[#D86B47] font-bold text-[10px] uppercase border border-[#F48B67]">
                    ⚠️ Overdue
                  </span>
                )}
              </div>

              <h4
                onClick={() => openTaskModal(task)}
                className="text-base font-bold text-[#2B2523] hover:text-[#37A3A3] cursor-pointer"
              >
                {task.title}
              </h4>
              <p className="text-xs text-[#6B615C] line-clamp-2">{task.description}</p>
            </div>

            {/* Task Card Footer */}
            <div className="pt-3 border-t border-[#EADEC7] space-y-3">
              <div className="flex items-center justify-between text-xs text-[#6B615C]">
                <div className="flex items-center gap-1.5 font-semibold">
                  <User className="w-3.5 h-3.5 text-[#37A3A3]" />
                  <span>{task.assigned_to_name || 'Unassigned'}</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-[#37A3A3]" />
                  <span>{task.due_date || 'No deadline'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  className="px-2.5 py-1 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-xs font-semibold text-[#2B2523]"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                </select>

                <button
                  onClick={() => openTaskModal(task)}
                  className="px-3 py-1 bg-[#E4F7F7] text-[#37A3A3] rounded-lg text-xs font-bold border border-[#58C4C4]"
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#EADEC7] pb-3">
              <h3 className="text-base font-bold text-[#2B2523]">Create New Task</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#6B615C] hover:text-[#2B2523]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block font-semibold text-[#2B2523] mb-1">Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g. Implement Authentication Middleware"
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2B2523] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Task requirements and scope..."
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#2B2523] mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                  >
                    <option value="critical">🔥 Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#2B2523] mb-1">Assigned Member</label>
                  <select
                    value={newTask.assignedToId}
                    onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#2B2523] mb-1">Category</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                  >
                    <option value="Research">Research</option>
                    <option value="Design">Design</option>
                    <option value="Development">Development</option>
                    <option value="Testing">Testing</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Pitch Deck">Pitch Deck</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#2B2523] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EADEC7]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#FFF9E8] border border-[#FCD575] text-[#2B2523] font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#58C4C4] hover:bg-[#37A3A3] text-white font-bold rounded-lg"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal (Section 9: Comments, Attachments, Audit Log) */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EADEC7] pb-3">
              <div className="flex items-center gap-2">
                {getPriorityBadge(selectedTask.priority)}
                <h3 className="text-base font-bold text-[#2B2523]">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-[#6B615C] hover:text-[#2B2523]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#2B2523] bg-[#FFFDF7] p-3 rounded-xl border border-[#EADEC7]">
              {selectedTask.description || 'No description provided.'}
            </p>

            {/* Attachments Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-[#37A3A3] uppercase text-[10px]">
                <span className="flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" /> Task Attachments</span>
                <label className="cursor-pointer text-[#37A3A3] hover:underline flex items-center gap-1">
                  <FileUp className="w-3 h-3" /> Upload File
                  <input type="file" onChange={handleUploadAttachment} className="hidden" />
                </label>
              </div>

              <div className="space-y-1">
                {taskAttachments.map(att => (
                  <div key={att.id} className="p-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg flex items-center justify-between">
                    <span className="truncate max-w-xs font-semibold">{att.original_name}</span>
                    <a href={`/api/files/download/${att.id}`} target="_blank" rel="noreferrer" className="text-[#37A3A3] font-bold">
                      Download
                    </a>
                  </div>
                ))}
                {taskAttachments.length === 0 && <p className="text-[#6B615C] italic text-[11px]">No attachments uploaded.</p>}
              </div>
            </div>

            {/* Comments Thread */}
            <div className="space-y-2">
              <h4 className="font-bold text-[#37A3A3] uppercase text-[10px] flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> Comments ({taskComments.length})
              </h4>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {taskComments.map(c => (
                  <div key={c.id} className="p-2.5 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl space-y-1">
                    <div className="flex justify-between font-bold text-[#2B2523]">
                      <span>{c.user_name}</span>
                      <span className="text-[10px] text-[#8E837D] font-normal">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[#6B615C]">{c.comment}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-[#2B2523]"
                />
                <button type="submit" className="px-4 py-2 bg-[#58C4C4] text-white font-bold rounded-xl">
                  Comment
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
