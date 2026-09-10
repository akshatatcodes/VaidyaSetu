import React from 'react';
import { Pill, AlertCircle } from 'lucide-react';

export default function MedicationSummary({ ayushMeds = [], alloMeds = [] }) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm space-y-3">
      <h4 className="font-black text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-2">
        <Pill className="w-4 h-4 text-emerald-500" /> Active Medication Profile
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5 space-y-2">
          <span className="font-black text-slate-900 dark:text-white text-xs block">🌿 AYUSH Formulations ({ayushMeds.length})</span>
          {ayushMeds.length === 0 ? (
            <p className="text-slate-400 text-[11px]">No active AYUSH medications recorded.</p>
          ) : (
            <ul className="space-y-1 text-slate-700 dark:text-gray-300">
              {ayushMeds.map((m, i) => (
                <li key={i} className="flex justify-between border-b border-gray-100 dark:border-white/5 pb-1">
                  <span className="font-bold">{m.name}</span>
                  <span className="text-[11px] text-slate-500">{m.dosage} ({m.anupana || 'Water'})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5 space-y-2">
          <span className="font-black text-slate-900 dark:text-white text-xs block">💊 Allopathic Prescriptions ({alloMeds.length})</span>
          {alloMeds.length === 0 ? (
            <p className="text-slate-400 text-[11px]">No active allopathic medications recorded.</p>
          ) : (
            <ul className="space-y-1 text-slate-700 dark:text-gray-300">
              {alloMeds.map((m, i) => (
                <li key={i} className="flex justify-between border-b border-gray-100 dark:border-white/5 pb-1">
                  <span className="font-bold">{m.name}</span>
                  <span className="text-[11px] text-slate-500">{m.dosage} ({m.frequency})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
