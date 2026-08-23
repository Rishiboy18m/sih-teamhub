import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { Lightbulb, ThumbsUp, Plus, Tag, Trash2, HelpCircle, BookOpen, ExternalLink, MessageSquare, Send, X } from 'lucide-react';

export default function IdeasView({ showToast }) {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    url: '',
    tags: '',
    category: 'idea'
  });
  const [submitting, setSubmitting] = useState(false);

  const isLeader = user?.role === 'leader';

  useEffect(() => {
    fetchIdeas();
  }, [activeTab]);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const url = activeTab === 'all' ? '/ideas' : `/ideas?category=${activeTab}`;
      const data = await apiFetch(url);
      setIdeas(data.ideas || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    try {
      setSubmitting(true);
      const data = await apiFetch('/ideas', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setIdeas([data.idea, ...ideas]);
      setShowModal(false);
      setFormData({ title: '', content: '', url: '', tags: '', category: 'idea' });
      if (showToast) showToast('Idea posted successfully!', 'success');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (ideaId) => {
    try {
      const data = await apiFetch(`/ideas/${ideaId}/upvote`, { method: 'POST' });
      setIdeas(ideas.map(i => i.id === ideaId ? { ...i, upvotes: data.upvotes } : i));
    } catch (err) {
      alert(err.message);
    }
  };

  const openCommentsModal = async (idea) => {
    setSelectedIdea(idea);
    try {
      const data = await apiFetch(`/ideas/${idea.id}/comments`);
      setComments(data.comments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedIdea) return;

    try {
      const data = await apiFetch(`/ideas/${selectedIdea.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment: newComment })
      });
      setComments([...comments, data.comment]);
      setNewComment('');
      setIdeas(ideas.map(i => i.id === selectedIdea.id ? { ...i, comment_count: (i.comment_count || 0) + 1 } : i));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (ideaId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await apiFetch(`/ideas/${ideaId}`, { method: 'DELETE' });
      setIdeas(ideas.filter(i => i.id !== ideaId));
    } catch (err) {
      alert(err.message);
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'research':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#E4F7F7] text-[#37A3A3] border border-[#58C4C4] flex items-center gap-1"><BookOpen className="w-3 h-3" /> Research Resource</span>;
      case 'question':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FDF0EC] text-[#D86B47] border border-[#F48B67] flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Team Question</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FFF9E8] text-[#A67D18] border border-[#FCD575] flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Feature Idea</span>;
    }
  };

  if (loading) return <div className="p-8 text-center text-[#6B615C]">Loading ideas & research...</div>;

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-[#FFFFFF] border border-[#EADEC7] p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-[#2B2523] flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-[#A67D18]" /> Ideas, Research & Questions Module
            </h3>
            <p className="text-[#6B615C] text-xs mt-0.5">
              Brainstorm feature ideas, share research resource links, ask technical questions, and vote.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-[#F48B67] hover:bg-[#D86B47] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Create Item
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#EADEC7]">
          {['all', 'idea', 'research', 'question'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === cat
                  ? 'bg-[#58C4C4] text-white shadow-sm'
                  : 'bg-[#FFFDF7] text-[#6B615C] border border-[#EADEC7]'
              }`}
            >
              {cat === 'all' && 'All Items'}
              {cat === 'idea' && '💡 Ideas'}
              {cat === 'research' && '📚 Research'}
              {cat === 'question' && '❓ Questions'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ideas.map(item => (
          <div
            key={item.id}
            className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                {getCategoryBadge(item.category)}

                {(isLeader || item.author_id === user?.id) && (
                  <button onClick={() => handleDelete(item.id)} className="text-[#6B615C] hover:text-[#D86B47] p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <h4 className="text-base font-bold text-[#2B2523]">{item.title}</h4>
              <p className="text-xs text-[#2B2523] leading-relaxed whitespace-pre-line bg-[#FFFDF7] p-3 rounded-xl border border-[#EADEC7]">
                {item.content}
              </p>

              {item.url && (
                <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#37A3A3] hover:underline font-mono font-bold">
                  <ExternalLink className="w-3.5 h-3.5" /> {item.url}
                </a>
              )}

              {item.tags && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.tags.split(',').map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-[#FFF9E8] border border-[#FCD575] rounded-md text-[10px] text-[#2B2523] font-bold">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#EADEC7] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <img src={item.author_avatar} alt="" className="w-5 h-5 rounded-full" />
                <span className="text-[#6B615C] font-semibold">{item.author_name}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openCommentsModal(item)}
                  className="px-3 py-1.5 bg-[#E4F7F7] border border-[#58C4C4] rounded-xl text-[#37A3A3] font-bold flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> {item.comment_count || 0}
                </button>

                <button
                  onClick={() => handleUpvote(item.id)}
                  className="px-3 py-1.5 bg-[#FFF9E8] border border-[#FCD575] rounded-xl text-[#A67D18] font-bold flex items-center gap-1.5"
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> {item.upvotes || 0}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-[#2B2523]">Create Idea / Research / Question</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block font-semibold text-[#2B2523] mb-1">Item Type *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                >
                  <option value="idea">💡 Idea</option>
                  <option value="research">📚 Research Resource</option>
                  <option value="question">❓ Question</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#2B2523] mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2B2523] mb-1">Description *</label>
                <textarea
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                  required
                />
              </div>

              {formData.category === 'research' && (
                <div>
                  <label className="block font-semibold text-[#2B2523] mb-1">Resource URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#2B2523] mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-[#2B2523]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EADEC7]">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-[#FFF9E8] border border-[#FCD575] text-[#2B2523] font-bold rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#58C4C4] hover:bg-[#37A3A3] text-white font-bold rounded-lg">
                  Post Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments Thread Modal */}
      {selectedIdea && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#EADEC7] pb-3">
              <h3 className="text-base font-bold text-[#2B2523]">{selectedIdea.title} - Comments</h3>
              <button onClick={() => setSelectedIdea(null)} className="text-[#6B615C] hover:text-[#2B2523]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {comments.map(c => (
                <div key={c.id} className="p-3 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl space-y-1">
                  <div className="flex items-center justify-between font-bold text-[#37A3A3]">
                    <span>{c.user_name}</span>
                    <span className="text-[10px] text-[#8E837D] font-normal">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[#2B2523]">{c.comment}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-[#EADEC7]">
              <input
                type="text"
                placeholder="Write a comment..."
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
      )}
    </div>
  );
}
