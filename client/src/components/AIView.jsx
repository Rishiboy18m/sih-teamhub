import React, { useState } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Bot, BrainCircuit, ListTodo, Map, AlertTriangle, Search, HelpCircle, Check, Plus, CheckCircle2 } from 'lucide-react';

export default function AIView({ showToast }) {
  const { team } = useAuth();
  const [mode, setMode] = useState('problem-analysis');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [convertingTask, setConvertingTask] = useState(null);
  const [taskCreatedMessage, setTaskCreatedMessage] = useState('');

  const handleGenerate = async (targetMode = mode) => {
    try {
      setLoading(true);
      setResponse(null);
      setTaskCreatedMessage('');
      const data = await apiFetch('/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          mode: targetMode,
          projectTitle: team?.name
        })
      });
      setResponse(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToTask = async (suggestedTask) => {
    if (!window.confirm(`Convert "${suggestedTask.title}" into an actual project task?`)) return;

    try {
      setConvertingTask(suggestedTask.title);
      await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: suggestedTask.title,
          description: suggestedTask.description || 'AI Suggested Task',
          priority: suggestedTask.priority || 'medium',
          category: suggestedTask.category || 'Development',
          status: 'pending',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      });

      if (showToast) showToast(`Task "${suggestedTask.title}" added to Kanban!`, 'success');
    } catch (err) {
      alert(err.message);
    } finally {
      setConvertingTask(null);
    }
  };

  const modes = [
    { id: 'problem-analysis', label: 'Problem Analysis', icon: BrainCircuit },
    { id: 'task-suggestions', label: 'Task Suggestions', icon: ListTodo },
    { id: 'roadmap', label: 'Roadmap', icon: Map },
    { id: 'risk-analysis', label: 'Risk Analysis', icon: AlertTriangle },
    { id: 'research-suggestions', label: 'Research Suggestions', icon: Search },
    { id: 'judge-questions', label: 'Judge Questions', icon: HelpCircle }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#58C4C4] flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#2B2523]">Context-Aware SIH AI Assistant</h3>
            <p className="text-xs text-[#6B615C]">
              AI recommendations automatically conditioned on <strong>{team?.name}</strong> project context.
            </p>
          </div>
        </div>

        {/* 6 AI Tool Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {modes.map(m => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); handleGenerate(m.id); }}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                  isActive
                    ? 'bg-[#58C4C4] text-white border-[#58C4C4] shadow-sm'
                    : 'bg-[#FFFDF7] border-[#EADEC7] text-[#6B615C] hover:text-[#2B2523]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-center">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Output Area */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 shadow-sm space-y-4">
        {loading ? (
          <div className="p-12 text-center text-[#6B615C] space-y-2">
            <Sparkles className="w-8 h-8 text-[#37A3A3] animate-spin mx-auto" />
            <p className="text-xs font-bold">Generating AI recommendations...</p>
          </div>
        ) : response ? (
          <div className="space-y-6 text-xs text-[#2B2523]">
            {response.type === 'problem-analysis' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#FFFDF7] rounded-2xl border border-[#EADEC7] space-y-1">
                  <span className="text-[10px] text-[#37A3A3] font-bold uppercase">Core Problem</span>
                  <p className="text-sm font-bold text-[#2B2523]">{response.content.coreProblem}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#FFFDF7] rounded-2xl border border-[#EADEC7] space-y-1">
                    <span className="text-[10px] text-[#D86B47] font-bold uppercase">Target Users</span>
                    <ul className="list-disc list-inside space-y-1 text-[#2B2523]">
                      {response.content.targetUsers.map((u, i) => <li key={i}>{u}</li>)}
                    </ul>
                  </div>

                  <div className="p-4 bg-[#FFFDF7] rounded-2xl border border-[#EADEC7] space-y-1">
                    <span className="text-[10px] text-[#D86B47] font-bold uppercase">Technical Challenges</span>
                    <ul className="list-disc list-inside space-y-1 text-[#2B2523]">
                      {response.content.challenges.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {response.type === 'task-suggestions' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {response.suggestedTasks.map((t, idx) => (
                  <div key={idx} className="p-4 bg-[#FFFDF7] rounded-2xl border border-[#EADEC7] space-y-3 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#2B2523] text-sm">{t.title}</span>
                        <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold bg-[#E4F7F7] text-[#37A3A3] border border-[#58C4C4] rounded-full">
                          {t.category}
                        </span>
                      </div>
                      <p className="text-[#6B615C]">{t.description}</p>
                    </div>

                    <button
                      onClick={() => handleConvertToTask(t)}
                      className="w-full py-2 bg-[#E4F7F7] hover:bg-[#58C4C4] hover:text-white text-[#37A3A3] rounded-xl text-xs font-bold border border-[#58C4C4] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Convert to Actual Task
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-[#6B615C] text-xs italic">
            Select an AI tool above to generate recommendations!
          </div>
        )}
      </div>
    </div>
  );
}
