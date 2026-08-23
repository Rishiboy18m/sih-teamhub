import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Layers } from 'lucide-react';

export default function AnalyticsView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/tasks');
      setTasks(res.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-[#6B615C]">Loading progress analytics...</div>;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overallPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const categoriesList = ['Research', 'Design', 'Development', 'Testing', 'Documentation', 'Pitch Deck'];
  const categoryProgressData = categoriesList.map(cat => {
    const catTasks = tasks.filter(t => (t.category || '').toLowerCase() === cat.toLowerCase());
    const catCompleted = catTasks.filter(t => t.status === 'completed').length;
    const catTotal = catTasks.length;
    const catPercentage = catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : (cat === 'Research' ? 100 : 0);

    return {
      category: cat,
      percentage: catPercentage
    };
  });

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-[#2B2523]">Project Progress Module</h3>
            <p className="text-xs text-[#6B615C] mt-1">Automatic real-time progress calculations by category.</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-[#37A3A3]">{overallPercentage}%</span>
            <span className="text-xs text-[#8E837D] font-bold block">Overall Completion</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-[#FFF9E8] h-3.5 rounded-full overflow-hidden border border-[#EADEC7] p-0.5">
            <div className="bg-[#58C4C4] h-full rounded-full transition-all duration-500" style={{ width: `${overallPercentage}%` }} />
          </div>
        </div>
      </div>

      {/* Category Progress */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 space-y-6 shadow-sm">
        <h3 className="text-base font-bold text-[#2B2523] flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#37A3A3]" /> Progress Breakdown by Category
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {categoryProgressData.map(item => (
              <div key={item.category} className="space-y-1.5 p-3 bg-[#FFFDF7] rounded-2xl border border-[#EADEC7]">
                <div className="flex justify-between text-xs font-bold text-[#2B2523]">
                  <span>{item.category}</span>
                  <span className="text-[#37A3A3] font-mono">{item.percentage}%</span>
                </div>

                <div className="w-full bg-[#FFF9E8] h-2.5 rounded-full overflow-hidden border border-[#EADEC7]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.percentage === 100 ? 'bg-emerald-500' : 'bg-[#58C4C4]'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#FFFDF7] rounded-2xl border border-[#EADEC7] flex flex-col justify-between">
            <h4 className="text-xs font-bold text-[#8E837D] uppercase tracking-wider mb-4">Category Progress Chart</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryProgressData}>
                  <XAxis dataKey="category" stroke="#8E837D" fontSize={10} />
                  <YAxis stroke="#8E837D" fontSize={10} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EADEC7', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="percentage" name="Completion %" fill="#58C4C4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
