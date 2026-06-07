'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: boolean;
}

export default function StudentAttendance() {
  const [attendancePct, setAttendancePct] = useState(100);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [attendanceRes, meRes] = await Promise.all([
          fetch('/api/attendance'),
          fetch('/api/auth/me')
        ]);

        if (attendanceRes.ok) {
          const data = await attendanceRes.json();
          setRecords(data);
        }

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user?.student) {
            setAttendancePct(meData.user.student.attendancePct ?? 100);
          }
        }
      } catch (e) {
        console.error('Failed to load attendance:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
      </div>
    );
  }

  const totalClasses = records.length;
  const presents = records.filter(r => r.status).length;
  const absents = totalClasses - presents;

  return (
    <div className="space-y-6">
      
      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Attendance Pct */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">Attendance Pct</span>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${attendancePct >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {attendancePct}%
            </span>
            <span className="text-[10px] font-mono text-slate-500">Overall</span>
          </div>
        </div>

        {/* Present Sessions */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">Present Sessions</span>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">{presents}</span>
            <span className="text-[10px] font-mono text-slate-500">Classes</span>
          </div>
        </div>

        {/* Absences Logged */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">Absences Logged</span>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${absents > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {absents}
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">Sessions</span>
          </div>
        </div>

      </div>

      {/* Warning checks */}
      {attendancePct < 75 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px] text-rose-400 font-mono">Eligibility Block Warning</span>
            <p className="leading-relaxed">
              Your overall attendance has dropped below the required 75% limit. Attendance status is critical. Please contact Dr. Jenkins to arrange makeup sessions.
            </p>
          </div>
        </div>
      )}

      {/* Attendance Log sheet */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5 text-indigo-400" />
          <span>Historical Attendance Logs</span>
        </h3>

        {records.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">No attendance records found.</div>
        ) : (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {records.map((rec) => (
              <div 
                key={rec.id} 
                className="p-3.5 rounded-2xl bg-slate-900/30 border border-slate-900/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${
                    rec.status 
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                  }`}>
                    {rec.status ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200">
                      {new Date(rec.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono">Instructional Session Logged</p>
                  </div>
                </div>

                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  rec.status 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {rec.status ? 'Present' : 'Absent'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
