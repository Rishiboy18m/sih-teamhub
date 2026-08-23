import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Users, KeyRound, ArrowRight } from 'lucide-react';

export default function JoinTeam() {
  const [teamCode, setTeamCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('Developer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { joinTeam } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await joinTeam({
        teamCode,
        fullName,
        username,
        email,
        password,
        specialization
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to join team. Check code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5E8] flex items-center justify-center p-4 selection:bg-[#58C4C4] selection:text-white">
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#58C4C4] flex items-center justify-center text-white mx-auto shadow-md">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#2B2523]">
            Join Team Workspace
          </h2>
          <p className="text-xs text-[#6B615C]">
            Enter your Team Leader's unique invitation code to join their workspace.
          </p>
        </div>

        {error && <div className="p-3.5 rounded-xl bg-[#FDF0EC] border border-[#F48B67] text-[#D86B47] text-xs font-bold text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#2B2523] mb-1">Team Code *</label>
            <input
              type="text"
              placeholder="SIH-2026-X"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2.5 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-[#37A3A3] font-mono font-bold tracking-wider uppercase"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2B2523] mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="Arun"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-[#2B2523]"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-[#2B2523] mb-1">Username *</label>
              <input
                type="text"
                placeholder="arun_dev"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-[#2B2523]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#2B2523] mb-1">Email Address *</label>
            <input
              type="email"
              placeholder="dev@cyberknights.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-[#2B2523]"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-[#2B2523] mb-1">Password *</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-[#2B2523]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#58C4C4] hover:bg-[#37A3A3] text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? 'Joining Team...' : 'Join Team Workspace'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-[#EADEC7] text-center text-xs">
          <Link to="/login" className="text-[#37A3A3] font-bold hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
