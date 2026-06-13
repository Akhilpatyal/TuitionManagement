'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Users,
  GraduationCap,
  Sparkles,
  X,
  LogOut,
  ShieldCheck,
  Check,
  LogIn
} from 'lucide-react';

interface Institute {
  id: string;
  name: string;
  slug: string;
  status: string;
  primaryColor: string | null;
  createdAt: string;
  studentCount: number;
  userCount: number;
}

export default function SuperAdminPortal() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Create form
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');

  const fetchInstitutes = async () => {
    try {
      const res = await fetch('/api/super-admin/institutes');
      if (res.ok) setInstitutes(await res.json());
    } catch (e) {
      console.error('Failed to load institutes:', e);
    }
  };

  useEffect(() => {
    const guard = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.role === 'SUPER_ADMIN') {
            setAuthChecked(true);
            fetchInstitutes();
            return;
          }
        }
      } catch (e) {
        console.error('Auth check failed:', e);
      }
      router.push('/');
    };
    guard();
  }, [router]);

  const openCreate = () => {
    setName('');
    setOwnerName('');
    setOwnerEmail('');
    setOwnerPassword('');
    setPrimaryColor('#6366f1');
    setError('');
    setIsCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !ownerName || !ownerEmail || !ownerPassword) {
      setError('All fields are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/super-admin/institutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ownerName, ownerEmail, ownerPassword, primaryColor })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsCreateOpen(false);
        fetchInstitutes();
      } else {
        setError(data.error || 'Failed to create institute.');
      }
    } catch (err) {
      setError('Network error creating institute.');
    } finally {
      setSubmitting(false);
    }
  };

  const openInstitute = async (instituteId: string) => {
    try {
      const res = await fetch('/api/super-admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instituteId })
      });
      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to open institute');
      }
    } catch (e) {
      console.error('Failed to open institute:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/');
    router.refresh();
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#04060d] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04060d] text-slate-100 relative overflow-hidden font-sans">
      <div className="absolute inset-0 cyber-grid pointer-events-none z-0" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-0 animate-pulse-slow" />

      <div className="relative z-10 max-w-6xl mx-auto p-6 sm:p-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20 text-white">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Super Admin
              </h1>
              <p className="text-[11px] uppercase font-mono tracking-widest text-indigo-400 font-bold">
                Platform Control Center
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-rose-500/10 hover:border-rose-500/30 transition-all cursor-pointer text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Stats + Create */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-200">{institutes.length}</span>
            <span className="text-slate-500">institute{institutes.length === 1 ? '' : 's'} on the platform</span>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Institute</span>
          </button>
        </div>

        {/* Institute grid */}
        {institutes.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-900 rounded-3xl glass-card">
            <Building2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No institutes yet. Create your first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {institutes.map((inst) => (
              <div key={inst.id} className="glass-card rounded-3xl p-6 hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ background: `linear-gradient(135deg, ${inst.primaryColor || '#6366f1'}, #a855f7)` }}
                  >
                    {inst.name.charAt(0)}
                  </div>
                  <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                    inst.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                  }`}>
                    {inst.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white truncate">{inst.name}</h3>
                <p className="text-[10px] font-mono text-slate-500 mb-4">/{inst.slug}</p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-900/60">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    {inst.studentCount} students
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    {inst.userCount} users
                  </span>
                </div>

                <button
                  onClick={() => openInstitute(inst.id)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Open Admin Panel</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Institute Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#04060d]/80 backdrop-blur-md" onClick={() => setIsCreateOpen(false)}>
          <div className="w-full max-w-lg glass-card rounded-3xl p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-400 uppercase">New Tenant</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-6">Create Institute</h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs text-slate-300">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1.5">Institute Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sunrise Coaching Center"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-900/60">
                <p className="text-[10px] font-mono uppercase text-slate-500 mb-3">First Owner / Admin Account</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1.5">Owner Name</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Owner full name"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1.5">Owner Email</label>
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="owner@institute.com"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1.5">Temp Password</label>
                    <input
                      type="text"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      placeholder="Set a password"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1.5">Brand Color</label>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full h-[42px] px-1 py-1 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">{error}</div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Create</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
