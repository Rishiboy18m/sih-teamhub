import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Lock, Mail, ArrowRight, Shield, UserCheck, KeyRound } from 'lucide-react';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId || !password) {
      setError('Please provide email/username and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(loginId, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email, pwd) => {
    setLoginId(email);
    setPassword(pwd);
    try {
      setLoading(true);
      setError('');
      await login(email, pwd);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5E8] flex items-center justify-center p-4 selection:bg-[#58C4C4] selection:text-white">
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-8 shadow-xl space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#58C4C4] flex items-center justify-center text-white mx-auto shadow-md">
            <Zap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#2B2523]">
            SIH TeamHub
          </h2>
          <p className="text-xs text-[#6B615C]">
            Collaborative Hackathon Workspace Platform
          </p>
        </div>

        {/* 1-Click Demo Buttons */}
        <div className="p-4 bg-[#FFF9E8] rounded-2xl border border-[#FCD575] space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#A67D18] block text-center">
            ⚡ 1-Click Demo Logins
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleDemoLogin('leader@cyberknights.com', 'password123')}
              className="px-3 py-2 bg-[#FFFFFF] hover:bg-[#E4F7F7] border border-[#58C4C4] text-[#37A3A3] rounded-xl font-bold transition-all flex items-center justify-center gap-1"
            >
              <Shield className="w-3.5 h-3.5 text-[#F48B67]" /> Team Leader
            </button>
            <button
              onClick={() => handleDemoLogin('dev@cyberknights.com', 'password123')}
              className="px-3 py-2 bg-[#FFFFFF] hover:bg-[#E4F7F7] border border-[#58C4C4] text-[#37A3A3] rounded-xl font-bold transition-all flex items-center justify-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5" /> Team Member
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#FDF0EC] border border-[#F48B67] text-[#D86B47] text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#2B2523] mb-1">Email or Username</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#8E837D]" />
              <input
                type="text"
                placeholder="leader@cyberknights.com"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-[#2B2523] focus:outline-none focus:border-[#58C4C4]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#2B2523] mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#8E837D]" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#FFFDF7] border border-[#EADEC7] rounded-xl text-[#2B2523] focus:outline-none focus:border-[#58C4C4]"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <Link to="/forgot-password" className="text-[#37A3A3] font-bold hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#58C4C4] hover:bg-[#37A3A3] text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-[#EADEC7] text-center space-y-2 text-xs">
          <p className="text-[#6B615C]">Need a workspace for your hackathon team?</p>
          <div className="flex justify-center gap-4 font-bold text-[#37A3A3]">
            <Link to="/register-team" className="hover:underline">Register New Team</Link>
            <span>•</span>
            <Link to="/join-team" className="hover:underline">Join with Team Code</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
