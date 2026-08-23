import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, AtSign, CornerDownRight, X } from 'lucide-react';

export default function DiscussionsView() {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [postCategory, setPostCategory] = useState('General');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const categories = ['General', 'Technical', 'Research', 'Design', 'Presentation'];

  useEffect(() => {
    fetchDiscussionsAndMembers();
  }, [selectedCategory]);

  const fetchDiscussionsAndMembers = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'all' ? '/discussions' : `/discussions?category=${selectedCategory}`;
      const [dRes, mRes] = await Promise.all([
        apiFetch(url),
        apiFetch('/project/members')
      ]);
      setDiscussions(dRes.discussions || []);
      setMembers(mRes.members || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSubmitting(true);
      const data = await apiFetch('/discussions', {
        method: 'POST',
        body: JSON.stringify({
          message: newMessage,
          category: postCategory
        })
      });

      setDiscussions([data.message, ...discussions]);
      setNewMessage('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMention = (username) => {
    setNewMessage(prev => `${prev} @${username} `);
  };

  const openRepliesModal = async (discussion) => {
    setReplyingTo(discussion);
    try {
      const data = await apiFetch(`/discussions/${discussion.id}/replies`);
      setReplies(data.replies || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingTo) return;

    try {
      const data = await apiFetch(`/discussions/${replyingTo.id}/replies`, {
        method: 'POST',
        body: JSON.stringify({ reply: replyText })
      });
      setReplies([...replies, data.reply]);
      setReplyText('');
      setDiscussions(discussions.map(d => d.id === replyingTo.id ? { ...d, reply_count: (d.reply_count || 0) + 1 } : d));
    } catch (err) {
      alert(err.message);
    }
  };

  const renderFormattedMessage = (text) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="px-1.5 py-0.5 rounded bg-[#E4F7F7] text-[#37A3A3] font-bold border border-[#58C4C4]">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-6 shadow-sm flex flex-col h-[750px]">
      {/* Header & Categories */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EADEC7] shrink-0">
        <div>
          <h3 className="text-xl font-bold text-[#2B2523] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#37A3A3]" /> Team Discussion Feed
          </h3>
          <p className="text-[#6B615C] text-xs mt-0.5">
            Lightweight team chat channels with `@teammate` mentions.
          </p>
        </div>

        {/* 5 Channels */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              selectedCategory === 'all' ? 'bg-[#58C4C4] text-white shadow-sm' : 'bg-[#FFFDF7] text-[#6B615C] border border-[#EADEC7]'
            }`}
          >
            All Channels
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                selectedCategory === cat ? 'bg-[#58C4C4] text-white shadow-sm' : 'bg-[#FFFDF7] text-[#6B615C] border border-[#EADEC7]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mention Bar */}
      <div className="flex items-center gap-2 py-2 border-b border-[#EADEC7] shrink-0 text-xs text-[#6B615C]">
        <span className="font-semibold flex items-center gap-1 shrink-0"><AtSign className="w-3.5 h-3.5 text-[#37A3A3]" /> Quick Mention:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {members.map(m => (
            <button
              key={m.id}
              onClick={() => handleMention(m.username)}
              className="px-2 py-0.5 bg-[#FFF9E8] border border-[#FCD575] rounded-md text-[11px] text-[#2B2523] font-bold"
            >
              @{m.full_name}
            </button>
          ))}
        </div>
      </div>

      {/* Discussion List */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
        {discussions.map(msg => (
          <div key={msg.id} className="p-4 bg-[#FFFDF7] border border-[#EADEC7] rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={msg.author_avatar} alt="" className="w-6 h-6 rounded-full" />
                <span className="text-xs font-bold text-[#2B2523]">{msg.author_name}</span>
                <span className="text-[10px] text-[#8E837D]">({msg.author_role})</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#E4F7F7] border border-[#58C4C4] rounded text-[10px] font-bold uppercase text-[#37A3A3]">
                  {msg.category}
                </span>
                <span className="text-[10px] text-[#8E837D]">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#2B2523] leading-relaxed whitespace-pre-wrap">
              {renderFormattedMessage(msg.message)}
            </p>

            <div className="pt-2 border-t border-[#EADEC7] flex justify-end">
              <button
                onClick={() => openRepliesModal(msg)}
                className="text-[11px] font-bold text-[#37A3A3] hover:underline flex items-center gap-1"
              >
                <CornerDownRight className="w-3.5 h-3.5" /> Reply ({msg.reply_count || 0})
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <form onSubmit={handlePost} className="pt-3 border-t border-[#EADEC7] shrink-0 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6B615C] font-semibold">Channel:</span>
          <select
            value={postCategory}
            onChange={(e) => setPostCategory(e.target.value)}
            className="px-2.5 py-1 bg-[#FFFDF7] border border-[#EADEC7] rounded-lg text-xs text-[#2B2523] font-bold"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type message (use @name to mention teammate)..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-xs text-[#2B2523]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-[#58C4C4] hover:bg-[#37A3A3] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm"
          >
            <Send className="w-4 h-4" /> Post
          </button>
        </div>
      </form>

      {/* Replies Modal */}
      {replyingTo && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#EADEC7] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#EADEC7] pb-3">
              <h4 className="font-bold text-[#2B2523]">Replies to {replyingTo.author_name}</h4>
              <button onClick={() => setReplyingTo(null)} className="text-[#6B615C] hover:text-[#2B2523]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#EADEC7]">
              <span className="text-[10px] text-[#8E837D] font-bold block">{replyingTo.author_name}</span>
              <p className="text-[#2B2523] mt-1">{replyingTo.message}</p>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {replies.map(r => (
                <div key={r.id} className="p-3 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl flex items-start gap-2">
                  <CornerDownRight className="w-3.5 h-3.5 text-[#37A3A3] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#37A3A3]">{r.user_name}</span>
                    <p className="text-[#2B2523] mt-0.5">{r.reply}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handlePostReply} className="flex gap-2 pt-2 border-t border-[#EADEC7]">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-[#2B2523]"
              />
              <button type="submit" className="px-4 py-2 bg-[#58C4C4] text-white font-bold rounded-xl">
                Reply
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
