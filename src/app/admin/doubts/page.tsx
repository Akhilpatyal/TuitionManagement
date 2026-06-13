'use client';

import React, { useState, useEffect } from 'react';
import {
  MessagesSquare,
  Send,
  CheckCircle2,
  CornerDownRight,
  ShieldCheck,
  HelpCircle,
  Filter
} from 'lucide-react';

export default function AdminDoubtsPage() {
  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open'>('open');

  const load = async () => {
    try {
      const res = await fetch('/api/doubts');
      if (res.ok) setDoubts(await res.json());
    } catch (e) {
      console.error('Failed to load doubts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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

  const timeAgo = (d: string) =>
    new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const visible = doubts.filter((d) => (filter === 'open' ? !d.resolved : true));
  const openCount = doubts.filter((d) => !d.resolved).length;

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
            <p className="text-[11px] text-slate-400">
              Answer student doubts as a teacher. <span className="text-amber-400 font-semibold">{openCount} open</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'open')}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs text-slate-300 focus:outline-none"
          >
            <option value="open">Open only</option>
            <option value="all">All doubts</option>
          </select>
        </div>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-900 rounded-3xl glass-card">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm text-slate-400">
            {filter === 'open' ? 'No open doubts — all caught up!' : 'No doubts posted yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((d) => {
            const open = expandedId === d.id;
            return (
              <div key={d.id} className="glass-card rounded-3xl p-5">
                <button onClick={() => setExpandedId(open ? null : d.id)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white">{d.title}</h3>
                        {d.resolved ? (
                          <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Resolved
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25">
                            Open
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 mt-1">
                        {d.subject} · {d.batch} · by {d.authorName} · {timeAgo(d.createdAt)}
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

                    <div className="space-y-2.5">
                      {d.replies.length === 0 ? (
                        <p className="text-[11px] text-slate-600 italic font-mono">No answers yet.</p>
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

                    {/* Reply as teacher */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={replyText[d.id] || ''}
                        onChange={(e) => setReplyText((p) => ({ ...p, [d.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') sendReply(d.id); }}
                        placeholder="Write your answer as a teacher…"
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

                    {!d.resolved && (
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
    </div>
  );
}
