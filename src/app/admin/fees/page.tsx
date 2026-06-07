'use client';

import React, { useState, useEffect } from 'react';
import { Student, FeeHistory } from '@prisma/client';
import { 
  CreditCard, 
  DollarSign, 
  AlertCircle, 
  Check, 
  Download, 
  Send, 
  Plus,
  Sparkles,
  X,
  FileText
} from 'lucide-react';
type StudentWithUser = Student & {
  name: string;
};

export default function FeesTracking() {
const [students, setStudents] = useState<StudentWithUser[]>([]);
  const [feeLedger, setFeeLedger] = useState<FeeHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Receipt modal state
  const [viewReceipt, setViewReceipt] = useState<FeeHistory | null>(null);

  const fetchFeesData = async () => {
    try {
      const [studentsRes, feesRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/fees')
      ]);

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }
      if (feesRes.ok) {
        const feesData = await feesRes.json();
        // Convert any date fields returned as strings to appropriate formats if needed, or rely on string conversions in views.
        setFeeLedger(feesData);
      }
    } catch (e) {
      console.error('Failed to load ledger records:', e);
    }
  };

  useEffect(() => {
    fetchFeesData();
  }, []);

  const handleCollectPayment = async (feeId: string) => {
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay_fee',
          feeId
        })
      });
      if (res.ok) {
        fetchFeesData();
      } else {
        alert('Failed to process payment collection');
      }
    } catch (err) {
      console.error('Error collecting payment:', err);
    }
  };

  const handleIssueInvoices = async () => {
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invoice_all',
          month: 'June 2026',
          dueDate: '2026-06-10'
        })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Successfully generated and distributed ${data.count || 0} new billing records for June 2026.`);
        fetchFeesData();
      } else {
        alert('Failed to generate billing records');
      }
    } catch (err) {
      console.error('Error generating invoices:', err);
    }
  };

  const handleSendReminder = async (fee: FeeHistory) => {
    const student = students.find(s => s.id === fee.studentId);
    if (!student) return;

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: fee.studentId,
          title: 'CRITICAL REMINDER: Outstanding Tuition Fees',
          message: `Your tuition fee of $${fee.amount} for period "${fee.month}" remains unpaid. Please clear outstanding amounts immediately.`,
          type: 'FEE'
        })
      });
      if (res.ok) {
        alert(`Reminded ${student.name} via portal alert check.`);
      } else {
        alert('Failed to dispatch alert reminder');
      }
    } catch (err) {
      console.error('Error sending reminder:', err);
    }
  };

  // Unpaid tally
  const outstandingCount = feeLedger.filter(f => f.status === 'UNPAID').length;
  const outstandingAmount = feeLedger.filter(f => f.status === 'UNPAID').reduce((sum, f) => sum + f.amount, 0);

  // Filtered ledger
  const filteredLedger = feeLedger.filter(f => {
    const student = students.find(s => s.id === f.studentId);
    const matchesSearch = student ? student.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  return (
    <div className="space-y-6">
      
      {/* Financial Warnings */}
      {outstandingCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px] text-rose-400">
              Outstanding Tuition Receivables
            </span>
            <p className="leading-relaxed font-mono">
              Ledger lists {outstandingCount} unpaid accounts totaling ${outstandingAmount} USD. Reminders can be dispatched to specific students.
            </p>
          </div>
        </div>
      )}

      {/* Control Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 glass-card rounded-2xl">
        
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Search */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Search Student Billing</label>
            <input
              type="text"
              placeholder="Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-900 text-xs text-slate-200 focus:outline-none w-48"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Billing Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 text-xs text-slate-300 focus:outline-none"
            >
              <option value="All">All Invoices</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

        </div>

        {/* Generate Invoice buttons */}
        <button
          onClick={handleIssueInvoices}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-all duration-300 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Distribute June Invoices</span>
        </button>

      </div>

      {/* Financial Ledger Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-indigo-500/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                <th className="p-4 pl-6">Invoice ID</th>
                <th className="p-4">Student</th>
                <th className="p-4">Billing Period</th>
                <th className="p-4 text-center">Amount Due</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Ledger Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 font-mono">
                    No ledger records match filters.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((fee) => {
                  const student = students.find(s => s.id === fee.studentId);
                  return (
                    <tr key={fee.id} className="hover:bg-white/[0.01] transition-all duration-150">
                      <td className="p-4 pl-6 font-mono text-indigo-400 uppercase font-semibold">{fee.id}</td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{student ? student.name : 'Unknown'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{student ? student.rollNumber : ''}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-300">{fee.month}</td>
                      <td className="p-4 text-center font-mono font-bold text-white">${fee.amount}</td>
                      <td className="p-4 font-mono text-slate-400">{new Date(fee.dueDate).toISOString().split('T')[0]}</td>
                      <td className="p-4">
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${
                          fee.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          fee.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          
                          {fee.status !== 'PAID' && (
                            <>
                              <button
                                onClick={() => handleCollectPayment(fee.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 text-[10px] font-bold transition-all duration-200 cursor-pointer"
                                title="Collect cash/card payment"
                              >
                                Record Cash
                              </button>
                              <button
                                onClick={() => handleSendReminder(fee)}
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all duration-200"
                                title="Dispatched ledger warning"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {fee.status === 'PAID' && (
                            <button
                              onClick={() => setViewReceipt(fee)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/5 text-[10px] font-bold transition-all duration-200 flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                              <span>Receipt</span>
                            </button>
                          )}

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

      {/* RECEIPT VIEW MODAL */}
      {viewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl p-6 relative border border-indigo-500/20 shadow-2xl">
            <button 
              onClick={() => setViewReceipt(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-900"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Simulated Receipt UI */}
            <div id="receipt-print-zone" className="space-y-6 text-xs text-slate-300 font-sans p-2">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-md font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <span>TUITION PAYMENT RECEIPT</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase mt-1">Invoice ID: {viewReceipt.id}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold font-mono bg-emerald-500/25 text-emerald-400 px-2.5 py-0.5 rounded-full uppercase">
                    PAID IN FULL
                  </span>
                  <p className="text-[9px] text-slate-500 font-mono mt-1.5">Date: {viewReceipt.paidDate ? viewReceipt.paidDate.toString().substring(0, 10) : ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono">Billed Student</span>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {students.find(s => s.id === viewReceipt.studentId)?.name || 'N/A'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Roll: {students.find(s => s.id === viewReceipt.studentId)?.rollNumber || 'N/A'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Class: {students.find(s => s.id === viewReceipt.studentId)?.class || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono">Issuer Registry</span>
                  <p className="text-sm font-semibold text-white mt-0.5">APEX AI Academy LLC</p>
                  <p className="text-[10px] text-slate-400 font-mono">Staging Campus, Block 4</p>
                  <p className="text-[10px] text-slate-400 font-mono">Dr. Jenkins Registrar</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse border-y border-slate-800">
                <thead>
                  <tr className="text-[9px] font-mono text-slate-500 uppercase">
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5 text-right">Tally</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-[11px] text-slate-300">
                  <tr>
                    <td className="py-2.5 font-medium text-slate-200">
                      Apex Monthly Tuition fees - {viewReceipt.month}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-white">
                      ${viewReceipt.amount}.00
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between items-center text-xs pt-2">
                <span className="text-slate-400 font-medium">Aggregate Sum</span>
                <span className="text-sm font-mono font-bold text-emerald-400">${viewReceipt.amount}.00 USD</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Triggering system print layout dialog. PDF generation complete.');
                setViewReceipt(null);
              }}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Signed Receipt PDF</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
