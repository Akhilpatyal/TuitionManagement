'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Sparkles, Check } from 'lucide-react';

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  name: string;
}

export interface Notification {
  id: string;
  studentId: string | null;
  title: string;
  message: string;
  read: boolean;
  type: 'QUIZ' | 'FEE' | 'ATTENDANCE' | 'SYSTEM';
  createdAt: string;
}

interface NavbarProps {
  user: User;
  title: string;
}

export default function Navbar({ user, title }: NavbarProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (e) {
        console.error('Failed to load notifications:', e);
      }
    };
    fetchNotifs();
    
    // Refresh interval
    const interval = setInterval(fetchNotifs, 10000); // 10 seconds refresh
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
      }
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
  };

  const getNotifColor = (type: Notification['type']) => {
    switch (type) {
      case 'QUIZ': return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
      case 'FEE': return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case 'ATTENDANCE': return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border border-slate-700/30';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-slate-950/40 backdrop-blur-md border-b border-slate-900 flex items-center justify-between px-6 lg:px-10">
      
      {/* Title / Action */}
      <div className="flex items-center gap-3 pl-12 lg:pl-0">
        <h1 className="text-xl font-bold tracking-wide text-white lg:text-2xl capitalize">
          {title}
        </h1>
        {title.toLowerCase().includes('analytics') || title.toLowerCase().includes('generator') ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold text-indigo-400 font-mono">
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>AI ENGINE ACTIVE</span>
          </div>
        ) : null}
      </div>

      {/* Right widgets */}
      <div className="flex items-center gap-4">
        
        {/* Date block */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/40 border border-slate-900 text-[11px] font-mono text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`p-2.5 rounded-xl border transition-all duration-200 ${
              isNotifOpen 
                ? 'bg-slate-800 border-indigo-500/30 text-white' 
                : 'bg-slate-900/50 border-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {isNotifOpen && (
            <>
              {/* Overlay blocker */}
              <div onClick={() => setIsNotifOpen(false)} className="fixed inset-0 z-30" />
              
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl glass-card z-40 border border-slate-800/80 shadow-2xl p-4 overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-900/60 mb-2">
                  <span className="text-xs font-semibold text-slate-200">Alert Notification Center</span>
                  <span className="text-[10px] font-mono text-slate-500">{unreadCount} Unread notifications</span>
                </div>
                
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-xs text-slate-500">No notifications found.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-3 rounded-xl border flex gap-3 transition-all duration-200 ${
                          notif.read 
                            ? 'bg-slate-950/20 border-slate-950 text-slate-400' 
                            : 'bg-slate-900/40 border-slate-900 text-slate-200'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md ${getNotifColor(notif.type)}`}>
                              {notif.type}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 ml-auto">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h4 className={`text-xs font-semibold ${notif.read ? 'text-slate-400' : 'text-slate-200'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                            {notif.message}
                          </p>
                        </div>

                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="self-center p-1 rounded-md bg-slate-900 border border-slate-800 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all duration-200"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
