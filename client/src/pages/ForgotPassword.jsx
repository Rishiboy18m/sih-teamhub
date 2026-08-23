import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF5E8] flex items-center justify-center p-4 selection:bg-[#58C4C4] selection:text-white">
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#EADEC7] rounded-3xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#58C4C4] flex items-center justify-center text-white mx-auto shadow-md">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#2B2523]">
            Reset Password
          </h2>
          <p className="text-xs text-[#6B615C]">
            Enter your team account email to receive reset instructions.
          </p>
        </div>

        {submitted ? (
          <div className="p-6 bg-[#E4F7F7] border border-[#58C4C4] rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-[#58C4C4] mx-auto" />
            <h4 className="font-bold text-[#37A3A3] text-sm">Reset Link Sent</h4>
            <p className="text-xs text-[#6B615C]">
              Password reset link has been dispatched to <strong>{email}</strong>.
            </p>
            <Link to="/login" className="inline-block pt-2 text-xs text-[#37A3A3] font-bold hover:underline">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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

            <button
              type="submit"
              className="w-full py-3 bg-[#58C4C4] hover:bg-[#37A3A3] text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              Send Password Reset Link
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <Link to="/login" className="text-[#37A3A3] font-bold hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
