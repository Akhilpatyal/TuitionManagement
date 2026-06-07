'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  HelpCircle, 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  BookOpen, 
  Clock 
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    avgAttendance: 0,
    pendingFees: 0,
    activeQuizzes: 0
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsRes, studentsRes, attemptsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/students'),
          fetch('/api/quizzes?attempts=true')
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData);
        }
        if (attemptsRes.ok) {
          const attemptsData = await attemptsRes.json();
          setAttempts(attemptsData);
        }
      } catch (e) {
        console.error('Failed to load dashboard statistics:', e);
      }
    };

    loadDashboardData();
  }, []);

  // Compute metric calculations
  const totalStudents = stats.totalStudents;
  
  // Total Revenue: sum of PAID fees
  const totalRevenue = stats.totalRevenue;

  // Average Attendance
  const avgAttendance = stats.avgAttendance;

  // Pending Fees
  const pendingFees = stats.pendingFees;

  // Active Quizzes Count
  const quizzesCount = stats.activeQuizzes;

  // Top Performing Students
  const topStudents = [...students]
    .sort((a, b) => b.accuracyPct - a.accuracyPct)
    .slice(0, 3);

  // Weak Performing Students (accuracy < 70% or attendance < 75%)
  const weakStudents = students
    .filter(s => s.accuracyPct < 70 || s.attendancePct < 75)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        
        {/* Metric 1 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold tracking-wider">
              Total Students
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white">{totalStudents}</h3>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>+12% vs last month</span>
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold tracking-wider">
              Total Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white">${totalRevenue}</h3>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>+$300 this week</span>
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold tracking-wider">
              Avg Attendance
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white">{avgAttendance}%</h3>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
              Target: 75% min
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold tracking-wider">
              Pending Fees
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white">${pendingFees}</h3>
            <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-1 font-semibold">
              <span>3 Overdue Invoices</span>
            </p>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold tracking-wider">
              Active Quizzes
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white">{quizzesCount}</h3>
            <p className="text-[10px] text-cyan-400 flex items-center gap-1 mt-1 font-mono">
              2 AI-generated
            </p>
          </div>
        </div>

      </div>

      {/* SVG Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Growth line chart */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-md font-bold text-slate-200">Revenue Stream Growth</h3>
              <p className="text-xs text-slate-400">Monthly receipt tracking (USD)</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              +15.8% YTD
            </span>
          </div>

          <div className="h-64 w-full relative">
            {/* Draw beautiful SVG Line Chart */}
            <svg viewBox="0 0 500 200" className="w-full h-full">
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Gridlines */}
              <line x1="10" y1="40" x2="490" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="10" y1="90" x2="490" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="10" y1="140" x2="490" y2="140" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              
              {/* Glow Fill */}
              <path 
                d="M 20,150 Q 120,110 220,130 T 420,50 L 420,170 L 20,170 Z" 
                fill="url(#chartGlow)"
              />
              
              {/* Vector Path */}
              <path 
                d="M 20,150 Q 120,110 220,130 T 420,50" 
                fill="none" 
                stroke="#6366f1" 
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              
              {/* Nodes */}
              <circle cx="20" cy="150" r="4.5" fill="#6366f1" stroke="#060913" strokeWidth="1.5" />
              <circle cx="120" cy="120" r="4.5" fill="#6366f1" stroke="#060913" strokeWidth="1.5" />
              <circle cx="220" cy="130" r="4.5" fill="#6366f1" stroke="#060913" strokeWidth="1.5" />
              <circle cx="320" cy="90" r="4.5" fill="#a855f7" stroke="#060913" strokeWidth="1.5" />
              <circle cx="420" cy="50" r="4.5" fill="#a855f7" stroke="#060913" strokeWidth="1.5" />

              {/* Text labels */}
              <text x="20" y="190" fill="#64748b" fontSize="9" className="font-mono">Jan</text>
              <text x="120" y="190" fill="#64748b" fontSize="9" className="font-mono">Feb</text>
              <text x="220" y="190" fill="#64748b" fontSize="9" className="font-mono">Mar</text>
              <text x="320" y="190" fill="#64748b" fontSize="9" className="font-mono">Apr</text>
              <text x="420" y="190" fill="#64748b" fontSize="9" className="font-mono">May</text>
            </svg>
          </div>
        </div>

        {/* Attendance trend bar chart */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-md font-bold text-slate-200">Daily Attendance Rate</h3>
              <p className="text-xs text-slate-400">Past 5 instructional periods (%)</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
              Goal: &gt;90%
            </span>
          </div>

          <div className="h-64 w-full relative">
            {/* Draw beautiful SVG Bar Chart */}
            <svg viewBox="0 0 500 200" className="w-full h-full">
              {/* Gridlines */}
              <line x1="10" y1="35" x2="490" y2="35" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="10" y1="100" x2="490" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="10" y1="165" x2="490" y2="165" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

              {/* Bars (gradient style) */}
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>

              {/* Bar 1: 94% */}
              <rect x="40" y="44" width="28" height="121" rx="6" fill="url(#barGrad)" opacity="0.8" />
              <text x="45" y="32" fill="#a855f7" fontSize="9" fontWeight="bold">94%</text>

              {/* Bar 2: 90% */}
              <rect x="130" y="50" width="28" height="115" rx="6" fill="url(#barGrad)" opacity="0.8" />
              <text x="135" y="38" fill="#a855f7" fontSize="9" fontWeight="bold">90%</text>

              {/* Bar 3: 88% */}
              <rect x="220" y="54" width="28" height="111" rx="6" fill="url(#barGrad)" opacity="0.8" />
              <text x="225" y="42" fill="#a855f7" fontSize="9" fontWeight="bold">88%</text>

              {/* Bar 4: 92% */}
              <rect x="310" y="48" width="28" height="117" rx="6" fill="url(#barGrad)" opacity="0.8" />
              <text x="315" y="36" fill="#a855f7" fontSize="9" fontWeight="bold">92%</text>

              {/* Bar 5: 82% */}
              <rect x="400" y="66" width="28" height="99" rx="6" fill="#f43f5e" opacity="0.8" />
              <text x="405" y="54" fill="#f43f5e" fontSize="9" fontWeight="bold">82%</text>

              {/* X Labels */}
              <text x="42" y="185" fill="#64748b" fontSize="8" className="font-mono">May 15</text>
              <text x="132" y="185" fill="#64748b" fontSize="8" className="font-mono">May 18</text>
              <text x="222" y="185" fill="#64748b" fontSize="8" className="font-mono">May 20</text>
              <text x="312" y="185" fill="#64748b" fontSize="8" className="font-mono">May 22</text>
              <text x="402" y="185" fill="#64748b" fontSize="8" className="font-mono">May 24</text>
            </svg>
          </div>
        </div>

      </div>

      {/* Performers grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Performers */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-md font-bold text-slate-200">Top Performing Scholars</h3>
          </div>

          <div className="space-y-4">
            {topStudents.map((s, idx) => (
              <div 
                key={s.id} 
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/30 border border-slate-900/60"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                    idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                    'bg-amber-700/20 text-amber-600 border border-amber-800/30'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{s.name}</h4>
                    <p className="text-[10px] text-indigo-400 font-mono">{s.class} {s.batch}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-200">{s.accuracyPct}%</span>
                    <p className="text-[8px] uppercase tracking-wider text-slate-500">Accuracy</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-purple-400">{s.xpPoints} XP</span>
                    <p className="text-[8px] uppercase tracking-wider text-slate-500">Points</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <Link 
              href="/admin/students" 
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
            >
              Inspect all students &rarr;
            </Link>
          </div>
        </div>

        {/* Needs Attention / Weak Performers */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <h3 className="text-md font-bold text-slate-200">Critical Support Actions</h3>
          </div>

          <div className="space-y-4">
            {weakStudents.map((s) => {
              const needsAcc = s.accuracyPct < 70;
              const needsAtt = s.attendancePct < 75;
              return (
                <div 
                  key={s.id} 
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/30 border border-slate-900/60"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{s.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">{s.class} // {s.batch}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {needsAcc && (
                      <span className="text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
                        Accuracy: {s.accuracyPct}%
                      </span>
                    )}
                    {needsAtt && (
                      <span className="text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        Attendance: {s.attendancePct}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-center">
            <Link 
              href="/admin/students" 
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
            >
              Analyze topic metrics &rarr;
            </Link>
          </div>
        </div>

      </div>

      {/* Activity logs */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-indigo-400" />
          <h3 className="text-md font-bold text-slate-200">Recent Campus Activities</h3>
        </div>

        <div className="space-y-4">
          {attempts.slice(0, 3).map((a) => (
            <div key={a.id} className="flex gap-4 p-3 rounded-2xl border border-white/[0.01] bg-slate-950/20">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 h-fit border border-indigo-500/20">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Quiz Completed by Student
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(a.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Student <span className="text-indigo-400 font-semibold">{students.find(s => s.id === a.studentId)?.name || 'Anonymous'}</span> completed the quiz <span className="italic text-slate-300">"{a.quiz?.title || 'Practice Quiz'}"</span> with an accuracy score of <span className="font-mono text-emerald-400">{a.accuracyPct}%</span>.
                </p>
              </div>
            </div>
          ))}
          
          {/* Static fee ledger action log */}
          <div className="flex gap-4 p-3 rounded-2xl border border-white/[0.01] bg-slate-950/20">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 h-fit border border-purple-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  Billing Ledger Synced
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  09:00 AM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                May 2026 tuition invoices were distributed to batches Alpha, Beta, and Gamma. 3 reminders triggered.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
