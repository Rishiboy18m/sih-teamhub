import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { Flag, Calendar, Plus, CheckCircle2, Clock, Trash2, CalendarDays, Shield } from 'lucide-react';

export default function MilestonesView() {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  // Forms
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', dueDate: '', status: 'pending' });
  const [newEvent, setNewEvent] = useState({ title: '', description: '', eventDate: '', eventType: 'general' });

  const isLeader = user?.role === 'leader';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/milestones');
      setMilestones(data.milestones || []);
      setCalendarEvents(data.calendarEvents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/milestones', {
        method: 'POST',
        body: JSON.stringify(newMilestone)
      });
      setMilestones([...milestones, data.milestone]);
      setShowMilestoneModal(false);
      setNewMilestone({ title: '', description: '', dueDate: '', status: 'pending' });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateMilestoneStatus = async (id, newStatus) => {
    try {
      const data = await apiFetch(`/milestones/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      setMilestones(milestones.map(m => m.id === id ? data.milestone : m));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMilestone = async (id) => {
    if (!window.confirm('Delete milestone?')) return;
    try {
      await apiFetch(`/milestones/${id}`, { method: 'DELETE' });
      setMilestones(milestones.filter(m => m.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/milestones/calendar', {
        method: 'POST',
        body: JSON.stringify(newEvent)
      });
      setCalendarEvents([...calendarEvents, data.event]);
      setShowEventModal(false);
      setNewEvent({ title: '', description: '', eventDate: '', eventType: 'general' });
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading milestones & calendar...</div>;

  return (
    <div className="space-y-8">
      {/* SIH Milestones Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Flag className="w-5 h-5 text-cyan-400" /> SIH Hackathon Milestones
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Key project deliverables tracked step-by-step for submission readiness.
            </p>
          </div>

          {isLeader && (
            <button
              onClick={() => setShowMilestoneModal(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Milestone
            </button>
          )}
        </div>

        {/* Milestone Timeline */}
        <div className="space-y-4">
          {milestones.map((m, index) => (
            <div
              key={m.id}
              className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  m.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                  m.status === 'in_progress' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {index + 1}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">{m.title}</h4>
                    {m.due_date && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-500" /> Due: {m.due_date}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{m.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 justify-end">
                <select
                  value={m.status}
                  onChange={(e) => handleUpdateMilestoneStatus(m.id, e.target.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase ${
                    m.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    m.status === 'in_progress' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                    'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>

                {isLeader && (
                  <button
                    onClick={() => handleDeleteMilestone(m.id)}
                    className="p-2 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Hackathon Calendar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-orange-400" /> Hackathon Calendar & Schedule
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Submission deadlines, team sync calls, and live presentation rounds.
            </p>
          </div>

          <button
            onClick={() => setShowEventModal(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calendarEvents.map(event => (
            <div key={event.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-orange-950 text-orange-400 border border-orange-800 text-[10px] font-bold uppercase rounded">
                  {event.event_type}
                </span>
                <span className="text-xs text-slate-400 font-mono font-semibold">{event.event_date}</span>
              </div>
              <h4 className="text-sm font-bold text-white">{event.title}</h4>
              <p className="text-xs text-slate-400">{event.description}</p>
            </div>
          ))}

          {calendarEvents.length === 0 && (
            <div className="col-span-full p-6 text-center text-slate-500 text-xs italic">
              No calendar events scheduled yet.
            </div>
          )}
        </div>
      </div>

      {/* Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create SIH Milestone</h3>
            <form onSubmit={handleCreateMilestone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  placeholder="e.g. System Architecture & Pitch Deck"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  placeholder="Deliverable details..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Date</label>
                <input
                  type="date"
                  value={newMilestone.dueDate}
                  onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 text-white text-xs font-semibold rounded-lg"
                >
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add Calendar Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g. Mock Jury Demo Call"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Date *</label>
                <input
                  type="date"
                  value={newEvent.eventDate}
                  onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Type</label>
                <select
                  value={newEvent.eventType}
                  onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
                >
                  <option value="deadline">Submission Deadline</option>
                  <option value="meeting">Team Meeting</option>
                  <option value="submission">Pitch Presentation</option>
                  <option value="general">General Event</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white text-xs font-semibold rounded-lg"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
