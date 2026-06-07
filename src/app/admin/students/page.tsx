'use client';

import React, { useState, useEffect } from 'react';
import { FeeStatus, Student } from '@prisma/client';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Eye, 
  X, 
  Check,
  UserCheck,
  Award,
  Sparkles
} from 'lucide-react';
type StudentWithUser = Student & {
  name: string;
  email: string;
};

export default function StudentsManagement() {
 const [students, setStudents] = useState<StudentWithUser[]>([]);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('All');
  const [feeFilter, setFeeFilter] = useState('All');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  // Selected Student for View/Edit
  const [selectedStudent, setSelectedStudent] = useState<StudentWithUser | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [className, setClassName] = useState('Grade 12');
  const [batch, setBatch] = useState('Alpha Batch');
  const [parentContact, setParentContact] = useState('');
  const [subjects, setSubjects] = useState<string[]>(['Physics']);
  
  // Available Subjects choices
  const availableSubjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'];

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (e) {
      console.error('Failed to fetch students:', e);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSubjectChange = (subject: string) => {
    if (subjects.includes(subject)) {
      setSubjects(subjects.filter(s => s !== subject));
    } else {
      setSubjects([...subjects, subject]);
    }
  };

  const openAddModal = () => {
    setName('');
    setEmail('');
    setRollNumber(`T26-${Math.floor(100 + Math.random() * 900)}`);
    setClassName('Grade 12');
    setBatch('Alpha Batch');
    setParentContact('');
    setSubjects(['Physics']);
    setIsAddOpen(true);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !parentContact) return;

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          rollNumber,
          class: className,
          batch,
          parentContact,
          subjects
        })
      });

      if (res.ok) {
        setIsAddOpen(false);
        fetchStudents();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to enroll student');
      }
    } catch (err) {
      console.error('Error adding student:', err);
    }
  };

  const openEditModal = (student: StudentWithUser) => {
    setSelectedStudent(student);
    setName(student.name);
    setEmail(student.email);
    setRollNumber(student.rollNumber);
    setClassName(student.class);
    setBatch(student.batch);
    setParentContact(student.parentContact);
    setSubjects(student.subjects);
    setIsEditOpen(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !name || !email) return;

    try {
      const res = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          class: className,
          batch,
          parentContact,
          subjects
        })
      });

      if (res.ok) {
        setIsEditOpen(false);
        setSelectedStudent(null);
        fetchStudents();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update student profile');
      }
    } catch (err) {
      console.error('Error updating student:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to purge this student profile from the ledger?')) {
      try {
        const res = await fetch(`/api/students/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          fetchStudents();
        } else {
          alert('Failed to delete student');
        }
      } catch (err) {
        console.error('Error deleting student:', err);
      }
    }
  };

  // Filter calculations
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                          s.rollNumber.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = batchFilter === 'All' || s.batch === batchFilter;
    const matchesFee = feeFilter === 'All' || s.feeStatus === feeFilter;
    return matchesSearch && matchesBatch && matchesFee;
  });

  return (
    <div className="space-y-6">
      
      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by student name or roll..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-xs"
          />
        </div>

        {/* Filters and Add button */}
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="All">All Batches</option>
              <option value="Alpha Batch">Alpha Batch</option>
              <option value="Beta Batch">Beta Batch</option>
              <option value="Gamma Batch">Gamma Batch</option>
            </select>

            <select
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="All">All Fees</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all duration-300 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Student</span>
          </button>

        </div>

      </div>

      {/* Main Student Directory Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-indigo-500/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                <th className="p-4 pl-6">Roll Number</th>
                <th className="p-4">Name</th>
                <th className="p-4">Class & Batch</th>
                <th className="p-4 text-center">Avg Accuracy</th>
                <th className="p-4 text-center">Attendance %</th>
                <th className="p-4">Fee Status</th>
                <th className="p-4 text-right pr-6">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 font-mono">
                    No matching student entities found in database.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.01] transition-all duration-150">
                    <td className="p-4 pl-6 font-mono font-semibold text-indigo-400">{s.rollNumber}</td>
                    <td className="p-4 font-semibold text-white">{s.name}</td>
                    <td className="p-4">
                      <div>{s.class}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{s.batch}</div>
                    </td>
                    <td className="p-4 text-center font-semibold font-mono">
                      <span className={`${s.accuracyPct >= 80 ? 'text-emerald-400' : s.accuracyPct >= 65 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {s.accuracyPct}%
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono">
                      <span className={`${s.attendancePct >= 75 ? 'text-slate-300' : 'text-rose-400 font-semibold'}`}>
                        {s.attendancePct}%
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${
                        s.feeStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        s.feeStatus === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {s.feeStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedStudent(s); setIsViewOpen(true); }}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all duration-200"
                          title="View Profile Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all duration-200"
                          title="Edit Student"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 hover:text-white hover:border-rose-500/40 hover:bg-rose-500/5 transition-all duration-200"
                          title="Delete student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Mock Pagination Footer */}
        <div className="p-4 bg-slate-950/20 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Showing 1-{filteredStudents.length} of {filteredStudents.length} Students</span>
          <div className="flex gap-2">
            <button className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-30" disabled>Prev</button>
            <button className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 disabled:opacity-30" disabled>Next</button>
          </div>
        </div>

      </div>

      {/* VIEW DETAILS DIALOG */}
      {isViewOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl glass-card rounded-3xl p-6 relative">
            <button 
              onClick={() => { setIsViewOpen(false); setSelectedStudent(null); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold font-mono text-white">
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedStudent.name}</h3>
                <p className="text-xs font-mono text-indigo-400">Roll: {selectedStudent.rollNumber} , {selectedStudent.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 text-xs text-slate-300">
              <div className="space-y-2 p-4 rounded-2xl bg-slate-950/40 border border-slate-900">
                <p><strong className="text-slate-400">Class:</strong> {selectedStudent.class}</p>
                <p><strong className="text-slate-400">Batch:</strong> {selectedStudent.batch}</p>
                <p><strong className="text-slate-400">Parent contact:</strong> {selectedStudent.parentContact}</p>
                <p>
                  <strong className="text-slate-400">Subjects assigned:</strong>
                  <span className="flex flex-wrap gap-1 mt-1">
                    {selectedStudent.subjects.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[10px] border border-indigo-500/20">{s}</span>
                    ))}
                  </span>
                </p>
              </div>

              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950/40 border border-slate-900">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Rank:</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>#{selectedStudent.rank}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">XP Points:</span>
                  <span className="font-mono text-purple-400 font-bold">{selectedStudent.xpPoints} XP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Quiz Streak:</span>
                  <span className="font-mono text-orange-400 font-bold">{selectedStudent.quizStreak} 🔥</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Accuracy %:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedStudent.accuracyPct}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Attendance:</span>
                  <span className={`font-mono font-bold ${selectedStudent.attendancePct >= 75 ? 'text-white' : 'text-rose-400'}`}>{selectedStudent.attendancePct}%</span>
                </div>
              </div>
            </div>

            {/* Badges Earned */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Earned Achievements</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedStudent.badges.length === 0 ? (
                  <span className="text-slate-600 text-xs italic">No badges unlocked yet.</span>
                ) : (
                  selectedStudent.badges.map(badge => (
                    <span 
                      key={badge} 
                      className="px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/25 text-[10px] font-bold font-mono shadow-sm"
                    >
                      {badge}
                    </span>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ADD / EDIT DIALOGS */}
      {(isAddOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-card rounded-3xl p-6 relative">
            <button 
              onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setSelectedStudent(null); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white mb-6">
              {isAddOpen ? 'Enroll New Student Account' : 'Edit Student Profile'}
            </h3>

            <form onSubmit={isAddOpen ? handleAddStudent : handleEditStudent} className="space-y-4 text-xs text-slate-300">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none"
                    placeholder="student@tuition.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1.5">Class</label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none"
                  >
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1.5">Batch</label>
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none"
                  >
                    <option value="Alpha Batch">Alpha Batch</option>
                    <option value="Beta Batch">Beta Batch</option>
                    <option value="Gamma Batch">Gamma Batch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1.5">Parent Contact Details</label>
                <input
                  type="text"
                  required
                  value={parentContact}
                  onChange={(e) => setParentContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none"
                  placeholder="+1 (555) 012-3456"
                />
              </div>

              {/* Subjects Checklist */}
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-2">Subject Assignments</label>
                <div className="flex flex-wrap gap-2">
                  {availableSubjects.map(subject => {
                    const isSelected = subjects.includes(subject);
                    return (
                      <button
                        type="button"
                        key={subject}
                        onClick={() => handleSubjectChange(subject)}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-medium flex items-center gap-1 transition-all duration-200 ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{subject}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setSelectedStudent(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold transition-all"
                >
                  {isAddOpen ? 'Add Student' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
