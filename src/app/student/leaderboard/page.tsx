'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Target, 
  Award, 
  Sparkles, 
  Crown,
  Lock,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  class: string;
  batch: string;
  attendancePct: number;
  feeStatus: string;
  rank: number;
  accuracyPct: number;
  xpPoints: number;
  quizStreak: number;
  badges: string[];
}

interface BadgeDefinition {
  name: string;
  description: string;
  iconColor: string;
}

const ALL_BADGES: BadgeDefinition[] = [
  { name: 'Quick Starter', description: 'Enrolled in APEX Academy and synchronized profile nodes.', iconColor: 'text-indigo-400 border-indigo-500/25 bg-indigo-500/10' },
  { name: 'First Blood', description: 'Complete your first quiz evaluation sheet.', iconColor: 'text-rose-400 border-rose-500/25 bg-rose-500/10' },
  { name: 'Constancy', description: 'Maintain an active quiz streak of 3 consecutive days.', iconColor: 'text-orange-400 border-orange-500/25 bg-orange-500/10' },
  { name: 'Perfect Week', description: 'Maintain an active quiz streak of 5 consecutive days.', iconColor: 'text-amber-400 border-amber-500/25 bg-amber-500/10' },
  { name: 'Sharp Shooter', description: 'Register a 100% accuracy evaluation on any quiz.', iconColor: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10' },
  { name: 'AI Solver', description: 'Conclude an adaptive AI generated revision challenge.', iconColor: 'text-purple-400 border-purple-500/25 bg-purple-500/10' },
  { name: 'Speed Demon', description: 'Complete any MCQ quiz in under 5 minutes with over 80% accuracy.', iconColor: 'text-cyan-400 border-cyan-500/25 bg-cyan-500/10' }
];

export default function LeaderboardPage() {
  const [myStudentId, setMyStudentId] = useState<string | null>(null);
  const [myBadges, setMyBadges] = useState<string[]>([]);
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<'XP' | 'ACCURACY'>('XP');
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async (sort: string) => {
    try {
      const res = await fetch(`/api/leaderboard?sortBy=${sort}`);
      if (res.ok) {
        const data = await res.json();
        setRankings(data);
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user?.student) {
            setMyStudentId(meData.user.student.id);
            setMyBadges(meData.user.student.badges || []);
          }
        }

        await fetchLeaderboard('XP');
      } catch (e) {
        console.error('Failed to load leaderboard data:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSortChange = (newSort: 'XP' | 'ACCURACY') => {
    setSortBy(newSort);
    fetchLeaderboard(newSort);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
      </div>
    );
  }

  const topper = rankings[0];

  return (
    <div className="space-y-6">
      
      {/* Spotlight row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Weekly Topper */}
        <div className="p-5 rounded-3xl bg-gradient-to-tr from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/20 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/35 relative">
            <Crown className="w-8 h-8 animate-float" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest block">Weekly Apex Topper</span>
            <h3 className="text-sm font-extrabold text-white mt-1">
              {topper ? topper.name : 'TBD'}
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              XP Points: {topper ? topper.xpPoints : 0} // Streak: {topper ? topper.quizStreak : 0}🔥
            </p>
          </div>
        </div>

        {/* Monthly Topper */}
        <div className="p-5 rounded-3xl bg-gradient-to-tr from-purple-500/10 via-slate-950 to-slate-950 border border-purple-500/20 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="p-3.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/35 relative">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-purple-400 uppercase tracking-widest block">Monthly Champion</span>
            <h3 className="text-sm font-extrabold text-white mt-1">
              {topper ? topper.name : 'TBD'}
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Accuracy: {topper ? topper.accuracyPct : 0}% // Class Rank #1
            </p>
          </div>
        </div>

      </div>

      {/* Main Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Rankings Table (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Trophy className="w-4.5 h-4.5 text-indigo-400" />
                <span>Scholar Leaderboard Rankings</span>
              </h3>

              {/* Sorting triggers */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSortChange('XP')}
                  className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-bold font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    sortBy === 'XP' 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  XP Points
                </button>
                <button
                  onClick={() => handleSortChange('ACCURACY')}
                  className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-bold font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    sortBy === 'ACCURACY' 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Accuracy
                </button>
              </div>
            </div>

            {rankings.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 font-mono">No rankings data available yet.</div>
            ) : (
              <div className="space-y-2">
                {rankings.map((r, idx) => {
                  const isSelf = r.id === myStudentId;
                  return (
                    <div 
                      key={r.id} 
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all duration-150 ${
                        isSelf 
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-white shadow shadow-indigo-500/5' 
                          : 'bg-slate-900/30 border-slate-900/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold border ${
                          idx === 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          idx === 1 ? 'bg-slate-300/20 text-slate-200 border-slate-400/30' :
                          idx === 2 ? 'bg-amber-700/20 text-amber-600 border-amber-800/30' :
                          'bg-slate-950 border-slate-900 text-slate-500'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                            <span>{r.name}</span>
                            {isSelf && (
                              <span className="text-[7px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500 text-white">
                                YOU
                              </span>
                            )}
                          </h4>
                          <span className="text-[9px] text-slate-500 font-mono capitalize">{r.batch.toLowerCase()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right font-mono">
                          <span className="text-xs font-bold text-slate-200">{r.accuracyPct}%</span>
                          <p className="text-[8px] uppercase tracking-wider text-slate-500">ACCURACY</p>
                        </div>

                        <div className="text-right font-mono">
                          <span className="text-xs font-bold text-purple-400">{r.xpPoints} XP</span>
                          <p className="text-[8px] uppercase tracking-wider text-slate-500">POINTS</p>
                        </div>

                        {r.quizStreak > 0 && (
                          <div className="flex items-center gap-0.5 text-orange-400 font-mono text-xs font-bold">
                            <span>{r.quizStreak}</span>
                            <Flame className="w-3.5 h-3.5 fill-orange-400/20" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Achievements Grid (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200">Achievement Badges</h3>
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {ALL_BADGES.map((b) => {
              const isUnlocked = myBadges.includes(b.name);
              return (
                <div 
                  key={b.name} 
                  className={`p-3 rounded-2xl border flex gap-3 transition-all duration-200 ${
                    isUnlocked 
                      ? 'bg-slate-900/30 border-slate-900' 
                      : 'opacity-40 bg-slate-950/20 border-slate-950'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border h-fit shrink-0 ${
                    isUnlocked ? b.iconColor : 'text-slate-600 border-slate-900 bg-slate-950'
                  }`}>
                    {isUnlocked ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>

                  <div>
                    <h4 className={`text-xs font-bold ${isUnlocked ? 'text-slate-200' : 'text-slate-500'}`}>
                      {b.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                      {b.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
