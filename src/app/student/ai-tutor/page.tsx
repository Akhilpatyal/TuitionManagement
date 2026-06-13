'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Send, Sparkles, User as UserIcon, Loader2 } from 'lucide-react';

type Msg = { role: 'user' | 'model'; text: string };

const SUBJECTS = ['General', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Computer Science'];

const SUGGESTIONS = [
  'Explain Newton\'s second law with an example',
  'How do I balance a chemical equation?',
  'What is the difference between speed and velocity?',
  'Solve: derivative of x² · sin(x)'
];

export default function AiTutorPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState('General');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;

    const history = messages.slice(-8);
    const nextMessages = [...messages, { role: 'user' as const, text: q }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          subject: subject === 'General' ? undefined : subject,
          history
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: 'model', text: data.answer }]);
      } else {
        setMessages((prev) => [...prev, { role: 'model', text: `⚠️ ${data.error || 'The AI tutor is unavailable right now.'}` }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'model', text: '⚠️ Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="glass-card rounded-3xl p-5 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">AI Doubt Solver</h2>
            <p className="text-[11px] text-slate-400">Ask anything — get a clear, step-by-step explanation.</p>
          </div>
        </div>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs text-slate-300 focus:outline-none"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto glass-card rounded-3xl p-4 sm:p-6 space-y-4">
        {messages.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-5 py-8">
            <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Stuck on something? Just ask.</h3>
              <p className="text-xs text-slate-500 mt-1">No question is too small. Try one of these:</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 hover:text-white hover:border-indigo-500/40 transition-all cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                m.role === 'user'
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white'
              }`}>
                {m.role === 'user' ? <UserIcon className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-200 rounded-tl-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-4 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your doubt…"
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-2xl glass-input text-sm"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg transition-all cursor-pointer disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
