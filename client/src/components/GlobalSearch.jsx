import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../api';
import { Search, CheckSquare, Users, FolderGit2, Lightbulb, MessageSquare, Calendar, X } from 'lucide-react';

export default function GlobalSearch({ onNavigate }) {
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (queryText.trim().length >= 2) {
        performSearch(queryText.trim());
      } else {
        setResults(null);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [queryText]);

  const performSearch = async (q) => {
    try {
      setLoading(true);
      const data = await apiFetch(`/search?q=${encodeURIComponent(q)}`);
      setResults(data);
      setOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (tabName) => {
    setOpen(false);
    setQueryText('');
    if (onNavigate) onNavigate(tabName);
  };

  const hasResults = results && (
    (results.tasks && results.tasks.length > 0) ||
    (results.members && results.members.length > 0) ||
    (results.files && results.files.length > 0) ||
    (results.ideas && results.ideas.length > 0) ||
    (results.discussions && results.discussions.length > 0) ||
    (results.events && results.events.length > 0)
  );

  return (
    <div className="relative flex-1 max-w-md" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8E837D]" />
        <input
          type="text"
          placeholder="Global Search (Tasks, Members, Files, Ideas)..."
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onFocus={() => setOpen(true)}
          className="w-full pl-9 pr-8 py-1.5 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-xs text-[#2B2523] placeholder-[#8E837D] focus:outline-none focus:border-[#58C4C4] transition-all"
        />
        {queryText && (
          <button onClick={() => { setQueryText(''); setResults(null); }} className="absolute right-2.5 top-2 text-[#8E837D] hover:text-[#2B2523]">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (queryText.trim().length >= 2) && (
        <div className="absolute left-0 right-0 mt-2 bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl shadow-xl p-4 z-50 max-h-96 overflow-y-auto space-y-4">
          {loading ? (
            <div className="text-center py-4 text-xs text-[#6B615C]">Searching...</div>
          ) : hasResults ? (
            <div className="space-y-4 text-xs">
              {results.tasks && results.tasks.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-[#37A3A3] uppercase text-[10px] flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" /> Tasks ({results.tasks.length})
                  </div>
                  {results.tasks.map(t => (
                    <div key={t.id} onClick={() => handleSelect('tasks')} className="p-2 bg-[#FFFDF7] hover:bg-[#E4F7F7] rounded-lg cursor-pointer border border-[#EADEC7] flex justify-between items-center">
                      <span className="font-bold text-[#2B2523] truncate max-w-xs">{t.title}</span>
                      <span className="text-[10px] uppercase font-bold text-[#37A3A3]">{t.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {results.members && results.members.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-[#D86B47] uppercase text-[10px] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Members ({results.members.length})
                  </div>
                  {results.members.map(m => (
                    <div key={m.id} onClick={() => handleSelect('team')} className="p-2 bg-[#FFFDF7] hover:bg-[#FDF0EC] rounded-lg cursor-pointer border border-[#EADEC7] flex justify-between items-center">
                      <span className="font-bold text-[#2B2523]">{m.full_name}</span>
                      <span className="text-[10px] text-[#6B615C]">{m.specialization}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-[#6B615C] italic">No matching records found.</div>
          )}
        </div>
      )}
    </div>
  );
}
