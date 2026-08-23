import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { CalendarDays, Plus, Calendar as CalendarIcon, Clock, CheckCircle2, Flag, Video, FileText, X } from 'lucide-react';

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventDate: new Date().toISOString().split('T')[0],
    eventType: 'meeting'
  });

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const [mRes, tRes] = await Promise.all([
        apiFetch('/milestones'),
        apiFetch('/tasks')
      ]);

      const calEvents = mRes.calendarEvents || [];
      const taskDeadlines = (tRes.tasks || [])
        .filter(t => t.due_date)
        .map(t => ({
          id: `task-${t.id}`,
          title: `Task Deadline: ${t.title}`,
          description: `Priority: ${t.priority.toUpperCase()} | Assigned: ${t.assigned_to_name || 'Unassigned'}`,
          event_date: t.due_date,
          event_type: 'deadline'
        }));

      setEvents([...calEvents, ...taskDeadlines]);
      setTasks(tRes.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.eventDate) return;

    try {
      const data = await apiFetch('/milestones/calendar', {
        method: 'POST',
        body: JSON.stringify(newEvent)
      });
      setEvents([data.event, ...events]);
      setShowEventModal(false);
      setNewEvent({ title: '', description: '', eventDate: new Date().toISOString().split('T')[0], eventType: 'meeting' });
    } catch (err) {
      alert(err.message);
    }
  };

  const getEventTypeBadge = (type) => {
    switch (type) {
      case 'deadline':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-[#FDF0EC] text-[#D86B47] border border-[#F48B67]">Deadline</span>;
      case 'meeting':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-[#E4F7F7] text-[#37A3A3] border border-[#58C4C4]">Meeting</span>;
      case 'presentation':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-[#FFF9E8] text-[#A67D18] border border-[#FCD575]">Presentation</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-600">Event</span>;
    }
  };

  if (loading) return <div className="p-8 text-center text-[#6B615C]">Loading project calendar...</div>;

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-[#2B2523] flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#F48B67]" /> Interactive Project Calendar
            </h3>
            <p className="text-[#6B615C] text-xs mt-0.5">
              Task deadlines, meetings, SIH milestones, reviews, and presentation dates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#FFFDF7] p-1 rounded-2xl border border-[#EADEC7]">
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'monthly' ? 'bg-[#58C4C4] text-white shadow-sm' : 'text-[#6B615C]'
                }`}
              >
                📅 Monthly
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'weekly' ? 'bg-[#58C4C4] text-white shadow-sm' : 'text-[#6B615C]'
                }`}
              >
                🗓️ Weekly
              </button>
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'daily' ? 'bg-[#58C4C4] text-white shadow-sm' : 'text-[#6B615C]'
                }`}
              >
                📋 Daily
              </button>
            </div>

            <button
              onClick={() => setShowEventModal(true)}
              className="px-4 py-2 bg-[#F48B67] hover:bg-[#D86B47] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" /> Create Event
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(event => (
            <div key={event.id} className="p-4 bg-[#FFFDF7] border border-[#EADEC7] rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                {getEventTypeBadge(event.event_type)}
                <span className="text-xs font-mono font-bold text-[#37A3A3]">{event.event_date}</span>
              </div>
              <h5 className="text-sm font-bold text-[#2B2523]">{event.title}</h5>
              <p className="text-xs text-[#6B615C]">{event.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#EADEC7] pb-3">
              <h3 className="text-base font-bold text-[#2B2523]">Create Calendar Event</h3>
              <button onClick={() => setShowEventModal(false)} className="text-[#6B615C] hover:text-[#2B2523]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block font-semibold text-[#2B2523] mb-1">Event Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2B2523] mb-1">Event Date *</label>
                <input
                  type="date"
                  value={newEvent.eventDate}
                  onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EADEC7]">
                <button type="button" onClick={() => setShowEventModal(false)} className="px-4 py-2 bg-[#FFF9E8] border border-[#FCD575] text-[#2B2523] font-bold rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#58C4C4] hover:bg-[#37A3A3] text-white font-bold rounded-lg">
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
