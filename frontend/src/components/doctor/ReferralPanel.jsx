import React, { useState } from 'react';
import { ArrowRightLeft, Send } from 'lucide-react';

export default function ReferralPanel({ onSubmitReferral }) {
  const [targetDept, setTargetDept] = useState('Shalya');
  const [priority, setPriority] = useState('routine');
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState('same_hospital');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason) return;
    onSubmitReferral && onSubmitReferral({ targetDepartment: targetDept, priority, reason, referralScope: scope });
    setReason('');
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm space-y-4">
      <h4 className="font-black text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-2">
        <ArrowRightLeft className="w-4 h-4 text-emerald-500" /> Clinical Referral Creation (§38)
      </h4>

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select
            value={scope}
            onChange={e => setScope(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white"
          >
            <option value="same_hospital">Same Hospital Referral</option>
            <option value="other_hospital">Cross-Hospital Referral</option>
          </select>

          <select
            value={targetDept}
            onChange={e => setTargetDept(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white"
          >
            <option value="Shalya">Shalya Tantra (Surgery)</option>
            <option value="Shalakya">Shalakya Tantra (ENT/Eye)</option>
            <option value="Panchakarma">Panchakarma Therapy</option>
            <option value="Kayachikitsa">Kayachikitsa (Medicine)</option>
            <option value="Prasuti">Prasuti Tantra (Gynecology)</option>
          </select>

          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white"
          >
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="stat">STAT / Emergency</option>
          </select>
        </div>

        <textarea
          rows={2}
          placeholder="Clinical reasoning and diagnostic background for referral..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Send className="w-3.5 h-3.5" /> Submit Referral
          </button>
        </div>
      </form>
    </div>
  );
}
