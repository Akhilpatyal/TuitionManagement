'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar, { User } from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { Sparkles, ShieldAlert, Building2, ArrowLeft } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [actingInstitute, setActingInstitute] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/');
          return;
        }
        const data = await res.json();
        if (!data.user) {
          router.push('/');
        } else if (data.user.role !== 'ADMIN') {
          router.push(data.user.realRole === 'SUPER_ADMIN' ? '/super-admin' : '/student');
        } else {
          setCurrentUser(data.user);
          setActingInstitute(data.isImpersonating ? data.actingInstitute : null);
        }
      } catch (e) {
        console.error('Failed auth check:', e);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const exitImpersonation = async () => {
    try {
      await fetch('/api/super-admin/stop-impersonate', { method: 'POST' });
    } catch {}
    router.push('/super-admin');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        {/* Loading Spinner */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-b-2 border-l-2 border-purple-500 animate-spin-reverse" />
          </div>
          <p className="text-xs font-mono tracking-widest text-indigo-400 font-bold uppercase animate-pulse">
            Authorizing Secure Shell...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  // Compute Page Title from Pathname
  let title = 'Analytics Console';
  if (pathname.includes('/students')) title = 'Student Directory';
  else if (pathname.includes('/attendance')) title = 'Attendance logs';
  else if (pathname.includes('/fees')) title = 'Financial Ledger';
  else if (pathname.includes('/quizzes')) title = 'AI Quiz generator';
  else if (pathname.includes('/materials')) title = 'Resource Vault';
  else if (pathname.includes('/doubts')) title = 'Class Doubts';

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans relative">
      
      {/* Background aesthetics */}
      <div className="fixed inset-0 cyber-grid pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Sidebar Panel */}
      <Sidebar user={currentUser} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Panel Viewport */}
      <div className="flex-1 flex flex-col lg:pl-72 z-10 relative">
        {/* Super-admin impersonation banner */}
        {actingInstitute && (
          <div className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-amber-500/15 to-orange-500/10 border-b border-amber-500/30 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-amber-300 min-w-0">
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="truncate">
                Viewing <strong className="text-amber-200">{actingInstitute.name}</strong> as Super Admin
              </span>
            </div>
            <button
              onClick={exitImpersonation}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 hover:text-white text-[11px] font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to Super Admin</span>
            </button>
          </div>
        )}

        <Navbar user={currentUser} title={title} />

        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
