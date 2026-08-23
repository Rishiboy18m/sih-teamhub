import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Zap, Mail, User, Lock, ArrowRight } from 'lucide-react';

export default function RegisterTeam() {
  const [teamName, setTeamName] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('Team Leader & Full-Stack Architect');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { registerTeam } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await registerTeam({
        teamName,
        fullName,
        username,
        email,
        password,
        specialization
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5E8] flex items-center justify-center p-4 selection:bg-[#58C4C4] selection:text-white">
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#58C4C4] flex items-center justify-center text-white mx-auto shadow-md">
            <Shield className="w-7 h-7 text-[#F48B67]" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#2B2523]">
            Register Team Workspace
          </h2>
          <p className="text-xs text-[#6B615C]">
            Create a isolated workspace for your hackathon team (Team Leader account).
          </p>
        </div>

        {error && <div className="p-3.5 rounded-xl bg-[#FDF0EC] border border-[#F48B67] text-[#D86B47] text-xs font-bold text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#2B2523] mb-1">Team Name *</label>
            <input
              type="text"
              placeholder="CyberKnights"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-[#2B2523]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2B2523] mb-1">Leader Name *</label>
              <input
                type="text"
                placeholder="Rishi"
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
                placeholder="rishi_leader"
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
              placeholder="leader@cyberknights.com"
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
            {loading ? 'Creating Workspace...' : 'Register Team Workspace'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-[#EADEC7] text-center text-xs">
          <Link to="/login" className="text-[#37A3A3] font-bold hover:underline">
            Already have a team? Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
