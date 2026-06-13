'use client';

import React, { useState, useEffect } from 'react';
import {
  MessagesSquare,
  Plus,
  X,
  Send,
  CheckCircle2,
  CornerDownRight,
  ShieldCheck,
  Sparkles,
  HelpCircle
} from 'lucide-react';

const SUBJECTS = ['General', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Computer Science'];

export default function ClassDoubtsPage() {
  const [doubts, setDoubts] = useState<any[]>([]);
  const [myStudentId, setMyStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // Ask form
  const [showAsk, setShowAsk] = useState(false);
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [subject, setSubject] = useState('General');

  const load = async () => {
    try {
      const [doubtsRes, meRes] = await Promise.all([
        fetch('/api/doubts'),
        fetch('/api/auth/me')
      ]);
      if (doubtsRes.ok) setDoubts(await doubtsRes.json());
      if (meRes.ok) {
        const me = await meRes.json();
        setMyStudentId(me.user?.studentId || null);
      }
    } catch (e) {
      console.error('Failed to load doubts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const postDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !bodyText.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', title, body: bodyText, subject })
      });
      if (res.ok) {
        setShowAsk(false);
        setTitle(''); setBodyText(''); setSubject('General');
        load();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to post doubt');
      }
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async (doubtId: string) => {
    const text = (replyText[doubtId] || '').trim();
    if (!text) return;
    setBusy(true);
    try {
      const res = await fetch('/api/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', doubtId, body: text })
      });
      if (res.ok) {
        setReplyText((p) => ({ ...p, [doubtId]: '' }));
        load();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to reply');
      }
    } finally {
      setBusy(false);
    }
  };

  const resolveDoubt = async (doubtId: string) => {
    setBusy(true);
    try {
      const res = await fetch('/api/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', doubtId })
      });
      if (res.ok) load();
    } finally {
      setBusy(false);
    }
  };

  const timeAgo = (d: string) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="glass-card rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white">
            <MessagesSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Class Doubts</h2>
            <p className="text-[11px] text-slate-400">Post a doubt — classmates and teachers can answer.</p>
          </div>
        </div>
        <button
          onClick={() => setShowAsk(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ask a Doubt</span>
        </button>
      </div>

      {/* Doubt list */}
      {doubts.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-900 rounded-3xl glass-card">
          <HelpCircle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No doubts yet. Be the first to ask one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {doubts.map((d) => {
            const open = expandedId === d.id;
            return (
              <div key={d.id} className="glass-card rounded-3xl p-5">
                <button
                  onClick={() => setExpandedId(open ? null : d.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white">{d.title}</h3>
                        {d.resolved && (
                          <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 mt-1">
                        {d.subject} · by {d.authorName} · {timeAgo(d.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono text-indigo-400 flex items-center gap-1">
                      <MessagesSquare className="w-3.5 h-3.5" />
                      {d.replies.length}
                    </span>
                  </div>
                </button>

                {open && (
                  <div className="mt-4 space-y-4">
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 border border-slate-900 rounded-2xl p-3 whitespace-pre-wrap">
                      {d.body}
                    </p>

                    {/* Replies */}
                    <div className="space-y-2.5">
                      {d.replies.length === 0 ? (
                        <p className="text-[11px] text-slate-600 italic font-mono">No answers yet — help out!</p>
                      ) : (
                        d.replies.map((r: any) => (
                          <div key={r.id} className="flex gap-2.5">
                            <CornerDownRight className="w-3.5 h-3.5 text-slate-600 mt-1 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[11px] font-semibold text-slate-200">{r.authorName}</span>
                                {(r.authorRole === 'ADMIN' || r.authorRole === 'TEACHER') && (
                                  <span className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25 flex items-center gap-0.5">
                                    <ShieldCheck className="w-2.5 h-2.5" /> Teacher
                                  </span>
                                )}
                                <span className="text-[9px] font-mono text-slate-600">{timeAgo(r.createdAt)}</span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">{r.body}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Reply box */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={replyText[d.id] || ''}
                        onChange={(e) => setReplyText((p) => ({ ...p, [d.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') sendReply(d.id); }}
                        placeholder="Write a solution…"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:border-indigo-500 focus:outline-none text-xs text-slate-200"
                      />
                      <button
                        onClick={() => sendReply(d.id)}
                        disabled={busy}
                        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer disabled:opacity-50"
                        aria-label="Send reply"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Resolve (author only) */}
                    {!d.resolved && d.studentId === myStudentId && (
                      <button
                        onClick={() => resolveDoubt(d.id)}
                        disabled={busy}
                        className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as resolved</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ask modal */}
      {showAsk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#04060d]/80 backdrop-blur-md" onClick={() => setShowAsk(false)}>
          <div className="w-full max-w-lg glass-card rounded-3xl p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAsk(false)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-400 uppercase">New Doubt</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-6">Ask your class</h3>

            <form onSubmit={postDoubt} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. How does projectile range depend on angle?"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1.5">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none text-slate-200"
                >
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1.5">Describe your doubt</label>
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={4}
                  placeholder="Explain what you're stuck on…"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-200"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAsk(false)} className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 transition-colors">Cancel</button>
                <button type="submit" disabled={busy} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold transition-all disabled:opacity-50 cursor-pointer">
                  <Send className="w-4 h-4" />
                  <span>Post Doubt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
