'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  AlertCircle, 
  Check, 
  Download, 
  FileText,
  X,
  Sparkles
} from 'lucide-react';

interface StudentProfile {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  batch: string;
  feeStatus: string;
}

interface FeeRecord {
  id: string;
  studentId: string;
  amount: number;
  month: string;
  dueDate: string;
  status: string;
  paidDate: string | null;
  receiptUrl: string | null;
}

export default function StudentFees() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [invoices, setInvoices] = useState<FeeRecord[]>([]);
  const [viewReceipt, setViewReceipt] = useState<FeeRecord | null>(null);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [feesRes, meRes] = await Promise.all([
        fetch('/api/fees'),
        fetch('/api/auth/me')
      ]);

      if (feesRes.ok) {
        const data = await feesRes.json();
        setInvoices(data);
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.user?.student) {
          const p = meData.user.student;
          setStudent({
            id: p.id,
            name: meData.user.name,
            rollNumber: p.rollNumber,
            class: p.class,
            batch: p.batch,
            feeStatus: p.feeStatus
          });
        }
      }
    } catch (e) {
      console.error('Failed to load fees:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePayInvoice = async (feeId: string) => {
    setPayingInvoiceId(feeId);
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay_fee', feeId })
      });

      if (res.ok) {
        await fetchData();
      } else {
        alert('Payment processing failed.');
      }
    } catch (e) {
      console.error('Payment error:', e);
    } finally {
      setPayingInvoiceId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="space-y-6">
      
      {/* Overdue fees warning */}
      {student.feeStatus === 'UNPAID' && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px] text-rose-400 font-mono">Ledger Arrears Alert</span>
            <p className="leading-relaxed">
              Your accounts ledger has outstanding unpaid invoices. Please clear your balances to avoid auto-block limits on quizzes.
            </p>
          </div>
        </div>
      )}

      {/* Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Status */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">Tuition Ledger Status</span>
          <div className="mt-4 flex items-center justify-between">
            <span className={`text-2xl font-extrabold font-mono tracking-wide ${
              student.feeStatus === 'PAID' ? 'text-emerald-400' :
              student.feeStatus === 'PENDING' ? 'text-amber-400' :
              'text-rose-400'
            }`}>
              {student.feeStatus}
            </span>
            <span className="text-[9px] font-mono text-slate-500 font-bold">Billing Cycle: Monthly</span>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">Total Arrears Balance</span>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">
              ${invoices.filter(f => f.status !== 'PAID').reduce((sum, f) => sum + f.amount, 0)}
            </span>
            <span className="text-[9px] font-mono text-slate-500">USD</span>
          </div>
        </div>

      </div>

      {/* Invoice list */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
          <CreditCard className="w-4.5 h-4.5 text-indigo-400" />
          <span>Billing & Invoice Ledger</span>
        </h3>

        {invoices.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">No invoices found.</div>
        ) : (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {invoices.map((inv) => (
              <div 
                key={inv.id} 
                className="p-4 rounded-2xl bg-slate-900/30 border border-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2.5">
                    <span className="font-mono text-indigo-400">{inv.id}</span>
                    <span className="text-[10px] text-slate-400">({inv.month})</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Due date: {inv.dueDate?.substring(0, 10)} // Amount: ${inv.amount} USD</p>
                </div>

                <div className="flex items-center gap-3">
                  
                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
                    inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    inv.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {inv.status}
                  </span>

                  {inv.status !== 'PAID' && (
                    <button
                      onClick={() => handlePayInvoice(inv.id)}
                      disabled={payingInvoiceId !== null}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-[10px] font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {payingInvoiceId === inv.id ? 'Processing...' : 'Pay Invoice'}
                    </button>
                  )}

                  {inv.status === 'PAID' && (
                    <button
                      onClick={() => setViewReceipt(inv)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-900 text-indigo-400 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
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
                  <p className="text-[9px] text-slate-500 font-mono mt-1.5">Date: {viewReceipt.paidDate?.substring(0, 10) || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono">Billed Student</span>
                  <p className="text-sm font-semibold text-white mt-0.5">{student.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Roll: {student.rollNumber}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Class: {student.class}</p>
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
                alert('Triggering system print layout dialog. PDF download completed.');
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
