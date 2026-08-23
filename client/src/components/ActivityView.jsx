import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Activity, CheckCircle2, FileUp, MessageSquare, UserPlus } from 'lucide-react';

export default function ActivityView() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityFeed();
  }, []);

  const fetchActivityFeed = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/notifications');
      setActivities(data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-[#6B615C]">Loading activity feed...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 shadow-sm">
        <h3 className="text-xl font-bold text-[#2B2523] flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#37A3A3]" /> Project Activity Feed
        </h3>
        <p className="text-xs text-[#6B615C] mt-1">
          Chronological timeline tracking task updates, file uploads, comments, and team events.
        </p>
      </div>

      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="space-y-3">
          {activities.map(item => (
            <div key={item.id} className="p-4 bg-[#FFFDF7] border border-[#EADEC7] rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#E4F7F7] rounded-xl border border-[#58C4C4] shrink-0">
                  <Activity className="w-4 h-4 text-[#37A3A3]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#2B2523]">{item.title}</h4>
                  <p className="text-xs text-[#6B615C] mt-0.5">{item.message}</p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-[#37A3A3] bg-[#E4F7F7] px-2.5 py-1 rounded-lg border border-[#58C4C4]">
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
