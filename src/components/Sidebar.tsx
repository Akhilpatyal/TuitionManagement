'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  CreditCard, 
  BookOpen, 
  Trophy, 
  Sparkles, 
  Bell,
  LogOut,
  Menu,
  X,
  GraduationCap,
  BrainCircuit,
  MessagesSquare
} from 'lucide-react';
export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  name: string;
}

interface SidebarProps {
  user: User;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ user, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  const adminLinks = [
    { name: 'Analytics', href: '/admin', icon: LayoutDashboard },
    { name: 'Students Management', href: '/admin/students', icon: Users },
    { name: 'Attendance control', href: '/admin/attendance', icon: CalendarCheck },
    { name: 'Fees tracking', href: '/admin/fees', icon: CreditCard },
    { name: 'Quiz generator', href: '/admin/quizzes', icon: Sparkles },
    { name: 'Study materials', href: '/admin/materials', icon: BookOpen },
    { name: 'Class Doubts', href: '/admin/doubts', icon: MessagesSquare },
  ];

  const studentLinks = [
    { name: 'My Dashboard', href: '/student', icon: LayoutDashboard },
    { name: 'Practice Quizzes', href: '/student/quizzes', icon: Sparkles },
    { name: 'AI Doubt Solver', href: '/student/ai-tutor', icon: BrainCircuit },
    { name: 'Class Doubts', href: '/student/doubts', icon: MessagesSquare },
    { name: 'My Attendance', href: '/student/attendance', icon: CalendarCheck },
    { name: 'Fee Details', href: '/student/fees', icon: CreditCard },
    { name: 'Study Hub', href: '/student/materials', icon: BookOpen },
    { name: 'Leaderboard', href: '/student/leaderboard', icon: Trophy },
  ];

  const links = user.role === 'ADMIN' ? adminLinks : studentLinks;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl glass-card bg-slate-900/80 text-slate-200 border border-slate-700/50 hover:bg-slate-800 transition-all duration-200"
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 lg:w-72 bg-slate-950/70 border-r border-slate-900 backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="relative p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent">
                Acu <span className="font-light text-slate-400">Mind</span>
              </span>
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold font-mono">
                Learning Portal
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/5 text-white border-l-2 border-indigo-500 pl-3.5'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-300'
                  }`} />
                  <span>{link.name}</span>
                  {link.name.toLowerCase().includes('ai') || link.name.toLowerCase().includes('quiz') ? (
                    <span className="ml-auto text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      AI
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-6 border-t border-slate-900/60 bg-slate-950/40">
          <div className="flex items-center gap-3.5 mb-5 p-2 rounded-xl bg-white/[0.01] border border-white/[0.02]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-indigo-900/50 flex items-center justify-center font-bold text-indigo-300 border border-indigo-500/10 uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] font-mono text-slate-500 truncate capitalize">
                {user.role.toLowerCase()} Account
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/5 text-rose-400 hover:text-rose-300 text-xs font-medium transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
