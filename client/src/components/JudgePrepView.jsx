import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Award, Save, CheckCircle2, Shield, HelpCircle, FileText } from 'lucide-react';

export default function JudgePrepView({ showToast }) {
  const [pitchSections, setPitchSections] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('Problem');
  const [sectionContent, setSectionContent] = useState('');
  const [savingSection, setSavingSection] = useState(false);

  const [editingAnswers, setEditingAnswers] = useState({});
  const [savingQuestionId, setSavingQuestionId] = useState(null);

  const requiredPitchSections = [
    'Problem',
    'Existing Solution',
    'Proposed Solution',
    'USP',
    'Innovation',
    'Technical Architecture',
    'Feasibility',
    'Scalability',
    'Social Impact',
    'Business/Deployment Model',
    'Future Scope'
  ];

  useEffect(() => {
    fetchJudgePrepData();
  }, []);

  const fetchJudgePrepData = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/judge');
      setPitchSections(data.pitchSections || []);
      setQuestions(data.questions || []);

      const firstSec = (data.pitchSections || []).find(s => s.section_name.toLowerCase() === 'problem');
      setSectionContent(firstSec ? firstSec.content_text : 'Hackathon teams rely on fragmented apps, causing scattered tasks and data leak risks.');

      const ansObj = {};
      (data.questions || []).forEach(q => {
        ansObj[q.id] = q.saved_answer || q.default_answer || '';
      });
      setEditingAnswers(ansObj);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSection = (secName) => {
    setActiveSection(secName);
    const sec = pitchSections.find(s => s.section_name.toLowerCase() === secName.toLowerCase());
    setSectionContent(sec ? sec.content_text : '');
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    try {
      setSavingSection(true);
      await apiFetch('/judge/sections', {
        method: 'PUT',
        body: JSON.stringify({
          sectionName: activeSection,
          contentText: sectionContent
        })
      });

      if (showToast) showToast(`Saved "${activeSection}" section details!`, 'success');
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingSection(false);
    }
  };

  const handleSaveAnswer = async (qId) => {
    const text = editingAnswers[qId];
    if (!text || !text.trim()) return;

    try {
      setSavingQuestionId(qId);
      await apiFetch(`/judge/answers/${qId}`, {
        method: 'PUT',
        body: JSON.stringify({ answerText: text })
      });

      if (showToast) showToast('Saved team answer to database!', 'success');
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingQuestionId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-[#6B615C]">Loading Judge Preparation module...</div>;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#37A3A3] text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4 text-[#F48B67]" /> Grand Finale Jury Preparation
          </div>
          <h3 className="text-2xl font-extrabold text-[#2B2523]">SIH 3-Minute Presentation & Mock Q&A</h3>
        </div>
      </div>

      {/* 11 Pitch Sections */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-[#2B2523] flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#37A3A3]" /> 11 Pitch Presentation Sections
        </h3>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#EADEC7]">
          {requiredPitchSections.map(secName => {
            const isActive = activeSection.toLowerCase() === secName.toLowerCase();
            return (
              <button
                key={secName}
                onClick={() => handleSelectSection(secName)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#58C4C4] text-white shadow-sm'
                    : 'bg-[#FFFDF7] text-[#6B615C] border border-[#EADEC7]'
                }`}
              >
                {secName}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSaveSection} className="space-y-4">
          <textarea
            rows={5}
            value={sectionContent}
            onChange={(e) => setSectionContent(e.target.value)}
            className="w-full px-4 py-3 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-xs text-[#2B2523] focus:outline-none focus:border-[#58C4C4] leading-relaxed font-mono"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSection}
              className="px-5 py-2.5 bg-[#58C4C4] hover:bg-[#37A3A3] text-white font-bold rounded-xl text-xs shadow-sm"
            >
              <Save className="w-4 h-4" /> Save {activeSection} Details
            </button>
          </div>
        </form>
      </div>

      {/* Mock Judge Questions & Saved Answers */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-[#2B2523] flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#F48B67]" /> Mock Judge Questions & Saved Team Answers
        </h3>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id || idx} className="p-5 bg-[#FFFDF7] border border-[#EADEC7] rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-[#D86B47] flex items-center gap-2">
                <span>Q{idx + 1}:</span> {q.question_text}
              </h4>

              <textarea
                rows={3}
                value={editingAnswers[q.id] || ''}
                onChange={(e) => setEditingAnswers({ ...editingAnswers, [q.id]: e.target.value })}
                className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EADEC7] rounded-xl text-xs text-[#2B2523]"
              />

              <div className="flex justify-end">
                <button
                  onClick={() => handleSaveAnswer(q.id)}
                  className="px-4 py-2 bg-[#E4F7F7] text-[#37A3A3] rounded-xl text-xs font-bold border border-[#58C4C4]"
                >
                  <Save className="w-3.5 h-3.5" /> Save Answer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
