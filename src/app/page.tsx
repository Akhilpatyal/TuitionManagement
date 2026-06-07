'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Sparkles, LogIn, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if already authenticated
    const checkMe = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            router.push(data.user.role === 'ADMIN' ? '/admin' : '/student');
          }
        }
      } catch (e) {
        console.error('Auth verification check failed:', e);
      }
    };
    checkMe();
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(data.user.role === 'ADMIN' ? '/admin' : '/student');
        router.refresh();
      } else {
        setError(data.error || 'Authentication rejected. Verify your credentials.');
        setSubmitting(false);
      }
    } catch (e) {
      setError('Connection to security gateway failed.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#04060d] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">

      {/* Cyber Grid Background */}
      <div className="absolute inset-0 cyber-grid pointer-events-none z-0" />

      {/* Giant radial glow blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-0 animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-3xl pointer-events-none z-0 animate-pulse-slow" style={{ animationDelay: '2s' }} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">

        {/* Logo Hub */}
        <div className="flex items-center gap-3.5 mb-10 animate-float">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20 text-white">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              APEX <span className="font-light text-indigo-400">AI</span>
            </h1>
            <p className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-bold">
              Tuition Management Engine
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md glass-card rounded-3xl p-8 sm:p-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-indigo-400 uppercase">
              Secure Access Node
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-1 text-slate-100">Welcome back</h2>
          <p className="text-sm text-slate-400 mb-8">Sign in to access your portal.</p>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@institution.edu"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-11 py-3 rounded-xl glass-input text-sm"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 leading-relaxed">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/30 transition-all duration-300 btn-glow-primary cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-900/60 flex items-center justify-center gap-2 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Protected by cryptographic role-based access controls.
            </p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900/40 text-center relative z-10 bg-slate-950/20">
        <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
          © 2026 TuitorMonitor . SYSTEMS SECURED // AI MODELS INTEGRATED.
        </p>
      </footer>
    </div>
  );
}
