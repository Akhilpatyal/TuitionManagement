'use client';

import React, { useState, useEffect } from 'react';
import { Student, Attendance } from '@prisma/client';
import { 
   CalendarCheck, 
   Search, 
   Filter, 
   AlertTriangle, 
   Check, 
   X, 
   Save,
   Sparkles
} from 'lucide-react';
type StudentWithUser = Student & {
  name: string;
};
export default function AttendanceControl() {
 const [students, setStudents] = useState<StudentWithUser[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  
  // Controls
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchFilter, setBatchFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification banner
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchAttendanceData = async () => {
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/attendance')
      ]);
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }
      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setAttendanceRecords(attendanceData);
      }
    } catch (e) {
      console.error('Failed to load attendance details:', e);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const handleMark = async (studentId: string, status: boolean) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          date: selectedDate,
          status
        })
      });
      if (res.ok) {
        fetchAttendanceData();
      } else {
        alert('Failed to update student attendance mark');
      }
    } catch (err) {
      console.error('Error marking attendance:', err);
    }
  };

  const handleLockRegister = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Attendance Register Locked',
          message: `Daily attendance for date ${selectedDate} has been locked and verified by Dr. Jenkins.`,
          type: 'SYSTEM'
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to lock register:', err);
    }
  };

  // Find record status for student on selectedDate
  const getStatus = (studentId: string): boolean => {
    const record = attendanceRecords.find(a => a.studentId === studentId && new Date(a.date).toISOString().split('T')[0] === selectedDate);
    return record ? record.status : false; // Default false (Absent) if not marked
  };

  // Low attendance warning list (<75%)
  const lowAttendanceStudents = students.filter(s => s.attendancePct < 75);

  // Filters
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = batchFilter === 'All' || s.batch === batchFilter;
    return matchesSearch && matchesBatch;
  });

  return (
    <div className="space-y-6">
      
      {/* Attendance Warnings */}
      {lowAttendanceStudents.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400">
              Low Attendance Action Required
            </span>
            <p className="leading-relaxed">
              The following student profiles are under the 75% attendance threshold: 
              {lowAttendanceStudents.map((s, idx) => (
                <span key={s.id} className="font-semibold text-white">
                  {s.name} ({s.attendancePct}%){idx < lowAttendanceStudents.length - 1 ? ', ' : ''}
                </span>
              ))}. Automated alert notifications have been delivered to their panels.
            </p>
          </div>
        </div>
      )}

      {/* Control Actions Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 glass-card rounded-2xl">
        
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Date Picker */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Marking Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs text-slate-200 focus:outline-none"
            />
          </div>

          {/* Batch Selector */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Filter Batch</label>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs text-slate-300 focus:outline-none"
            >
              <option value="All">All Batches</option>
              <option value="Alpha Batch">Alpha Batch</option>
              <option value="Beta Batch">Beta Batch</option>
              <option value="Gamma Batch">Gamma Batch</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Search Students</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Name or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-900 text-xs text-slate-200 focus:outline-none w-48"
              />
            </div>
          </div>

        </div>

        {/* Lock Buttons */}
        <div className="flex items-center gap-3 self-end md:self-center">
          {saveSuccess && (
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Locked & Synced</span>
            </span>
          )}
          <button
            onClick={handleLockRegister}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-all duration-300 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lock Daily Register</span>
          </button>
        </div>

      </div>

      {/* Attendance Sheet Grid */}
      <div className="glass-card rounded-3xl overflow-hidden border border-indigo-500/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                <th className="p-4 pl-6">Roll Number</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Batch Allocation</th>
                <th className="p-4 text-center">Cumulative Pct</th>
                <th className="p-4 text-center">T26 Attendance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 font-mono">
                    No student profiles matched the filter requirements.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const isPresent = getStatus(s.id);
                  return (
                    <tr key={s.id} className="hover:bg-white/[0.01] transition-all duration-150">
                      <td className="p-4 pl-6 font-mono text-indigo-400 font-semibold">{s.rollNumber}</td>
                      <td className="p-4 font-semibold text-white">{s.name}</td>
                      <td className="p-4 font-mono text-[11px] text-slate-400">{s.batch}</td>
                      <td className="p-4 text-center">
                        <span className={`font-mono font-semibold px-2 py-0.5 rounded ${
                          s.attendancePct >= 90 ? 'text-emerald-400 bg-emerald-500/5' :
                          s.attendancePct >= 75 ? 'text-amber-400 bg-amber-500/5' :
                          'text-rose-400 bg-rose-500/5 font-bold border border-rose-500/10'
                        }`}>
                          {s.attendancePct}%
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleMark(s.id, true)}
                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold font-mono flex items-center gap-1 transition-all duration-200 cursor-pointer ${
                              isPresent 
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                                : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>PRESENT</span>
                          </button>
                          
                          <button
                            onClick={() => handleMark(s.id, false)}
                            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold font-mono flex items-center gap-1 transition-all duration-200 cursor-pointer ${
                              !isPresent 
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                                : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>ABSENT</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
