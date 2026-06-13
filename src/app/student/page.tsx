'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Target,
  Award,
  Sparkles,
  ArrowRight,
  Play,
  FileCheck2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  BookOpen,
  CheckCircle2,
  Check,
  X
} from 'lucide-react';
import Link from 'next/link';

type StudentAIReport = {
  weakTopics: string[];
  strongTopics: string[];
  suggestions: string[];
};

type ReviewQuestion = {
  id: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

type ReviewQuiz = {
  id: string;
  title: string;
  subject: string;
  questions: ReviewQuestion[];
};

export default function StudentDashboard() {
  const [student, setStudent] = useState<any | null>(null);
  const [studentName, setStudentName] = useState('');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [aiReport, setAiReport] = useState<StudentAIReport | null>(null);

  // Result review modal state
  const [reviewAttempt, setReviewAttempt] = useState<any | null>(null);
  const [reviewQuiz, setReviewQuiz] = useState<ReviewQuiz | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const openReview = async (attempt: any) => {
    setReviewAttempt(attempt);
    setReviewQuiz(null);
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/quizzes?id=${attempt.quizId}`);
      if (res.ok) {
        const quiz = await res.json();
        // Normalize question IDs the same way the quiz player does, so the
        // stored answer keys line up with each question.
        const normalized: ReviewQuiz = {
          id: quiz.id,
          title: quiz.title,
          subject: quiz.subject,
          questions: (quiz.questions || []).map((qn: any, idx: number) => ({
            ...qn,
            id: qn.id || `q-${quiz.id}-${idx}`
          }))
        };
        setReviewQuiz(normalized);
      }
    } catch (e) {
      console.error('Failed to load quiz review:', e);
    } finally {
      setReviewLoading(false);
    }
  };

  const closeReview = () => {
    setReviewAttempt(null);
    setReviewQuiz(null);
  };

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) return;

        const meData = await meRes.json();
        const studentProfile = meData.user?.student;
        setStudentName(meData.user?.name || '');
        if (studentProfile) {
          // Set student profile with all computed ranks/stats
          setStudent(studentProfile);

          // Fetch attempts, quizzes, and AI report in parallel
          const [attemptsRes, quizzesRes, reportRes] = await Promise.all([
            fetch('/api/quizzes?attempts=true'),
            fetch('/api/quizzes'),
            fetch('/api/reports')
          ]);

          if (attemptsRes.ok) {
            const attemptsData = await attemptsRes.json();
            setAttempts(attemptsData);
          }
          if (quizzesRes.ok) {
            const quizzesData = await quizzesRes.json();
            setQuizzes(quizzesData);
          }
          if (reportRes.ok) {
            const reportData = await reportRes.json();
            setAiReport(reportData);
          }
        }
      } catch (e) {
        console.error('Failed to load student dashboard metrics:', e);
      }
    };

    loadStudentData();
  }, []);

  if (!student) return null;

  // ---- Real analytics derived from this student's attempts ----
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyXp = attempts
    .filter((a) => new Date(a.completedAt).getTime() >= weekAgo)
    .reduce((sum, a) => sum + (a.xpGained || 0), 0);

  // Cumulative XP trajectory over time
  const chrono = [...attempts].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );
  const xpChart = (() => {
    if (chrono.length < 2) return null;
    let cum = 0;
    const pts = chrono.map((a) => (cum += a.xpGained || 0));
    const maxV = Math.max(...pts, 1);
    const n = pts.length;
    const xAt = (i: number) => 20 + (i / (n - 1)) * 460;
    const yAt = (v: number) => 130 - (v / maxV) * 110;
    const coords = pts.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
    const d = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(' ');
    const area = `${d} L ${coords[coords.length - 1].x.toFixed(1)},140 L ${coords[0].x.toFixed(1)},140 Z`;
    return { coords, d, area };
  })();

  // Subject-wise accuracy breakdown
  const subjectMap: Record<string, number[]> = {};
  attempts.forEach((a) => {
    const subj = a.quiz?.subject || 'Other';
    (subjectMap[subj] ||= []).push(a.accuracyPct || 0);
  });
  const subjectStats = Object.entries(subjectMap)
    .map(([subject, accs]) => ({
      subject,
      avg: Math.round(accs.reduce((x, y) => x + y, 0) / accs.length),
      count: accs.length
    }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="space-y-8">
      
      {/* Welcome Streak Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-950 border border-indigo-500/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">Apex Academy Portal</span>
          </div>
          <h2 className="text-xl font-bold text-white md:text-2xl">
            Welcome back, {studentName || 'Student'}!
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Your adaptive AI tutor has parsed your latest attempt histories. Head over to practice quizzes to target your key weak areas.
          </p>
        </div>

        {student.quizStreak > 0 ? (
          <div className="flex items-center gap-4 bg-orange-500/10 border border-orange-500/25 p-4 rounded-2xl shrink-0">
            <Flame className="w-10 h-10 text-orange-500 animate-bounce" />
            <div>
              <span className="text-2xl font-extrabold text-white font-mono">{student.quizStreak} Days</span>
              <p className="text-[10px] uppercase font-mono tracking-widest text-orange-400 font-bold">Active Quiz Streak</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shrink-0">
            <Flame className="w-10 h-10 text-slate-600" />
            <div>
              <span className="text-lg font-bold text-slate-400">Streak Inactive</span>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Take a test to trigger</p>
            </div>
          </div>
        )}

      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Leaderboard Rank */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
              Leaderboard Rank
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white">#{student.rank}</h3>
            <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
              Class: {student.class}
            </p>
          </div>
        </div>

        {/* XP Points */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
              Total XP Points
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Award className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white font-mono">{student.xpPoints} XP</h3>
            <p className="text-[9px] text-purple-400 flex items-center gap-1 mt-1 font-semibold">
              <span>{weeklyXp > 0 ? `+${weeklyXp} XP gained this week` : 'No XP gained this week yet'}</span>
            </p>
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
              Overall Accuracy
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Target className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white font-mono">{student.accuracyPct}%</h3>
            <p className="text-[9px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
              <span>Target: &gt;75% benchmark</span>
            </p>
          </div>
        </div>

        {/* Attendance */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
              Attendance Ratio
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileCheck2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white font-mono">{student.attendancePct}%</h3>
            <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
              Status: {student.attendancePct >= 75 ? 'ELIGIBLE' : 'CRITICAL'}
            </p>
          </div>
        </div>

      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left side: Upcoming Quizzes & Recent Attempts (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Upcoming Quizzes */}
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
              <span>Assigned Task Quizzes</span>
            </h3>

            <div className="space-y-3.5">
              {quizzes.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-900 rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-mono">All assigned quizzes cleared! Good work.</p>
                </div>
              ) : (
                quizzes.map((quiz) => (
                  <div 
                    key={quiz.id} 
                    className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900/80 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{quiz.title}</span>
                        {quiz.isAiGenerated && (
                          <span className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            AI Personalized
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        {quiz.subject} // {quiz.durationMin} Mins // {quiz.questions.length} Questions
                      </p>
                    </div>

                    <Link
                      href={`/student/quizzes?start=${quiz.id}`}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-md"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Start Quiz</span>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance XP Trajectory (real data) */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-indigo-400" />
                <span>Performance XP Trajectory</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">{attempts.length} attempt{attempts.length === 1 ? '' : 's'}</span>
            </div>

            <div className="h-44 w-full relative">
              {xpChart ? (
                <svg viewBox="0 0 500 150" className="w-full h-full">
                  <defs>
                    <linearGradient id="xpGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="10" y1="20" x2="490" y2="20" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                  <line x1="10" y1="75" x2="490" y2="75" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                  <line x1="10" y1="130" x2="490" y2="130" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                  <path d={xpChart.area} fill="url(#xpGlow)" />
                  <path d={xpChart.d} fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {xpChart.coords.map((c, i) => (
                    <circle key={i} cx={c.x} cy={c.y} r="3.5" fill={i === xpChart.coords.length - 1 ? '#6366f1' : '#a855f7'} stroke="#060913" strokeWidth="1.5" />
                  ))}
                  <text x="15" y="145" fill="#64748b" fontSize="8" className="font-mono">First quiz</text>
                  <text x="430" y="145" fill="#64748b" fontSize="8" className="font-mono">Latest</text>
                </svg>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center border border-dashed border-slate-900 rounded-2xl">
                  <TrendingUp className="w-7 h-7 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 font-mono">Take at least 2 quizzes to see your XP trajectory.</p>
                </div>
              )}
            </div>
          </div>

          {/* Subject-wise Accuracy Breakdown (real data) */}
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Target className="w-4.5 h-4.5 text-emerald-400" />
              <span>Subject-wise Accuracy</span>
            </h3>

            {subjectStats.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono text-center py-6">Complete a quiz to see your subject breakdown.</p>
            ) : (
              <div className="space-y-3.5">
                {subjectStats.map((s) => (
                  <div key={s.subject}>
                    <div className="flex items-center justify-between mb-1 text-[11px]">
                      <span className="font-semibold text-slate-300">{s.subject}</span>
                      <span className="font-mono text-slate-400">
                        <span className={s.avg >= 80 ? 'text-emerald-400' : s.avg >= 60 ? 'text-amber-400' : 'text-rose-400'}>{s.avg}%</span>
                        <span className="text-slate-600"> · {s.count} quiz{s.count === 1 ? '' : 'zes'}</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.avg >= 80 ? 'bg-emerald-500' : s.avg >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${s.avg}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right side: AI Tutor Insights & streaks/badges (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* AI Tutor Insights */}
          <div className="glass-card rounded-3xl p-6 bg-gradient-to-b from-[#0a0d17] to-slate-950">
            <div className="flex items-center gap-2 mb-4">
              <BrainCircuit className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">AI Tutor Engine Recommendations</h3>
            </div>

            {aiReport ? (
              <div className="space-y-4 text-xs text-slate-300">
                
                {/* Weak Topics */}
                <div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-400 block mb-2">Focus Revision Areas</span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiReport.weakTopics.map(t => (
                      <span key={t} className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-300 text-[10px] border border-rose-500/25 font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Strong Topics */}
                <div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400 block mb-2">Mastered Strengths</span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiReport.strongTopics.map(t => (
                      <span key={t} className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 text-[10px] border border-emerald-500/25 font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 mt-2 space-y-2">
                  <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">Custom Study Path</span>
                  <ul className="space-y-2 text-[11px] text-slate-400 list-disc pl-3">
                    {aiReport.suggestions.map((s, idx) => (
                      <li key={idx} className="leading-relaxed">{s}</li>
                    ))}
                  </ul>
                </div>

              </div>
            ) : (
              <p className="text-xs text-slate-500 italic font-mono text-center py-6">Analyzing attempt data...</p>
            )}
          </div>

          {/* Recent Quiz Scores */}
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-indigo-400" />
              <span>Latest Practice Results</span>
            </h3>

            <div className="space-y-3">
              {attempts.length === 0 ? (
                <p className="text-xs text-slate-500 italic font-mono text-center py-6">No previous attempts logged.</p>
              ) : (
                attempts.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => openReview(a)}
                    className="w-full text-left flex justify-between items-center gap-3 p-3 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-indigo-500/40 hover:bg-indigo-500/[0.04] transition-all duration-200 cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-200 truncate max-w-xs group-hover:text-white transition-colors">{a.quiz?.title || 'Practice Quiz'}</h4>
                      <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                        {new Date(a.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        <span className="text-indigo-400/70">// Tap to review</span>
                      </span>
                    </div>
                    <div className="text-right font-mono flex items-center gap-2 shrink-0">
                      <div>
                        <span className={`text-xs font-bold ${a.accuracyPct >= 80 ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {a.accuracyPct}% Score
                        </span>
                        <p className="text-[9px] text-purple-400 font-bold">+{a.xpGained} XP</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Result Review Modal */}
      {reviewAttempt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#04060d]/80 backdrop-blur-md"
          onClick={closeReview}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-indigo-500/15 bg-gradient-to-tr from-slate-950 via-[#0a0d17] to-slate-950 shadow-2xl shadow-indigo-900/30 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow accents */}
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Sticky header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-6 border-b border-slate-900/70 bg-[#070a12]/80 backdrop-blur-md rounded-t-3xl">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Quiz Summary</span>
                </div>
                <h3 className="text-base font-bold text-white truncate">{reviewAttempt.quiz?.title || 'Practice Quiz'}</h3>
                <div className="flex items-center gap-4 font-mono text-[11px] pt-1">
                  <span className="text-slate-200 font-bold">{reviewAttempt.accuracyPct}% <span className="text-slate-500 font-normal">Accuracy</span></span>
                  <span className="text-emerald-400 font-bold">+{reviewAttempt.xpGained} XP</span>
                  <span className="text-slate-400">{reviewAttempt.correctAnswers}/{reviewAttempt.totalQuestions} Correct</span>
                </div>
              </div>
              <button
                onClick={closeReview}
                className="shrink-0 p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-rose-500/10 hover:border-rose-500/30 transition-all cursor-pointer"
                aria-label="Close review"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 relative">
              {reviewLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-9 h-9 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
                </div>
              ) : !reviewQuiz ? (
                <p className="text-xs text-slate-500 italic font-mono text-center py-12">Unable to load this quiz's questions.</p>
              ) : (
                <div className="space-y-5">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <BookOpen className="w-4.5 h-4.5 text-indigo-400" />
                    <span>Diagnostic Review Sheet</span>
                  </h4>

                  {reviewQuiz.questions.map((q, idx) => {
                    const sAns = reviewAttempt.answers?.[q.id];
                    const isCorrect = sAns !== undefined && String(sAns).toLowerCase() === q.correctAnswer.toLowerCase();

                    return (
                      <div key={q.id} className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-purple-400 uppercase">Question {idx + 1}</span>
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                            isCorrect
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                          }`}>
                            {isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>{isCorrect ? 'Correct' : 'Incorrect'}</span>
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-200">{q.question}</p>

                        {/* Option review */}
                        {q.options ? (
                          <div className="grid grid-cols-1 gap-2 text-[11px] mt-2">
                            {q.options.map((opt, oIdx) => {
                              const isPicked = sAns === oIdx.toString();
                              const isRight = q.correctAnswer === oIdx.toString();

                              let optClass = 'bg-slate-950 border-slate-950 text-slate-400';
                              if (isPicked && isRight) optClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium';
                              else if (isPicked && !isRight) optClass = 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-medium';
                              else if (isRight) optClass = 'bg-emerald-500/5 border-emerald-500/15 text-emerald-500/80 font-medium';

                              return (
                                <div key={oIdx} className={`p-2.5 rounded-xl border flex items-center gap-2 ${optClass}`}>
                                  <span className="font-mono text-[9px] uppercase px-1 rounded bg-slate-900 border border-slate-800">
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span>{opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[11px] space-y-1.5 mt-2 bg-slate-950/40 p-3 rounded-xl border border-slate-900 font-mono">
                            <p><span className="text-slate-500">Your choice:</span> <span className={isCorrect ? 'text-emerald-400' : 'text-rose-400'}>{sAns || 'Blank'}</span></p>
                            <p><span className="text-slate-500">Correct key:</span> <span className="text-emerald-400">{q.correctAnswer}</span></p>
                          </div>
                        )}

                        {/* AI Explanation */}
                        <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.02] text-[10px] leading-relaxed text-slate-400">
                          <strong className="text-indigo-400 font-mono">AI Tutor Insight:</strong> {q.explanation}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={closeReview}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Close Review</span>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
