import React from 'react';
import { Sparkles } from 'lucide-react';

const ChangeDeltaPanel = ({ selectedSession }) => {
  if (!selectedSession) return null;

  const isReturning = selectedSession.isReturningPatient || selectedSession.changesSinceLastVisit?.length > 0;

  if (!isReturning) return null;

  return (
    <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-teal-500/30 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            What Changed Since Last Visit (§41 Provenance & Delta Tracker)
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-[10px] font-black uppercase">
          NEW / CHANGED / UNCHANGED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* NEW Items */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
              🆕 NEW
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono font-bold">
              {selectedSession.newMedDate || 'Recent'}
            </span>
          </div>
          <div className="space-y-1 text-xs font-bold text-slate-900 dark:text-white">
            <p>• {selectedSession.newComplaint || selectedSession.chiefComplaint || 'New Complaint / Symptoms'}</p>
            <p className="text-emerald-600 dark:text-emerald-400">• {selectedSession.newMedName || 'New Medication Recorded'}</p>
            {selectedSession.investigationOrders?.length > 0 && (
              <p className="text-teal-600 dark:text-teal-400">• New Investigation: {selectedSession.investigationOrders[0].testName}</p>
            )}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-gray-400 border-t border-emerald-500/20 pt-1">
            {selectedSession.newMedSource || 'Source: Kiosk intake & OCR scan'}
          </p>
        </div>

        {/* CHANGED Items */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
              🔄 CHANGED
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-mono font-bold">
              Today vs Prior
            </span>
          </div>
          <div className="space-y-1 text-xs font-bold text-slate-900 dark:text-white">
            <p>• BP Delta: {selectedSession.vitals?.systolicBP || '130'}/{selectedSession.vitals?.diastolicBP || '85'} (prior {selectedSession.priorBp || '140/90'})</p>
            <p className="text-amber-700 dark:text-amber-300">• Lab Delta: {selectedSession.labTrends?.[0] ? `${selectedSession.labTrends[0].testName}: ${selectedSession.labTrends[0].currentValue}` : 'Hb/Blood Glucose delta'}</p>
            <p className="text-amber-600 dark:text-amber-400">• Medicine Status: Active / Adjusted</p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-gray-400 border-t border-amber-500/20 pt-1">
            {selectedSession.changedVitalDetail || 'Tracked against baseline OPD encounter'}
          </p>
        </div>

        {/* UNCHANGED Items */}
        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-gray-300 text-[9px] font-black uppercase tracking-wider">
              📌 UNCHANGED
            </span>
            <span className="text-[10px] text-gray-500 font-mono">Known Baseline</span>
          </div>
          <div className="space-y-1 text-xs font-bold text-slate-900 dark:text-white">
            <p>• Known Condition: {selectedSession.primaryCondition || selectedSession.pastMedicalHistory?.[0] || 'Osteoarthritis / Hypertension'}</p>
            <p className="text-slate-600 dark:text-gray-300">• Existing Allergy: {selectedSession.allergies?.[0] || 'No new drug allergies'}</p>
            <p className="text-slate-600 dark:text-gray-300">• Long-Term Regimen: Baseline maintenance</p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-gray-400 border-t border-gray-200 dark:border-white/10 pt-1">
            Continuous follow-up OPD tracking
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChangeDeltaPanel;
