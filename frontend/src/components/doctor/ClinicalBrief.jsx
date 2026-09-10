import React from 'react';
import { Activity, AlertTriangle, FileText, Heart, Thermometer, User } from 'lucide-react';
import EvidenceBadge from './EvidenceBadge';

export default function ClinicalBrief({ patient, vitals = {}, redFlags = [] }) {
  if (!patient) return null;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
            {patient.patientName?.charAt(0) || 'P'}
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              {patient.patientName}
              <EvidenceBadge source={patient.sourceTag || 'Kiosk Sensor'} />
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-gray-400 font-mono">
              Token: {patient.tokenNumber} • Age: {patient.age}y • Gender: {patient.gender}
            </p>
          </div>
        </div>

        {redFlags.length > 0 && (
          <div className="px-3 py-1 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 text-xs font-black flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            <span>Red Flag Alert</span>
          </div>
        )}
      </div>

      {/* Vitals Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5">
          <span className="text-[10px] font-bold text-slate-400 block">BP (mmHg)</span>
          <span className="text-xs font-black text-slate-900 dark:text-white">{vitals.systolicBP || 128}/{vitals.diastolicBP || 84}</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5">
          <span className="text-[10px] font-bold text-slate-400 block">Pulse</span>
          <span className="text-xs font-black text-slate-900 dark:text-white">{vitals.pulseRate || 78} bpm</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5">
          <span className="text-[10px] font-bold text-slate-400 block">SpO2</span>
          <span className="text-xs font-black text-slate-900 dark:text-white">{vitals.spO2 || 98}%</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5">
          <span className="text-[10px] font-bold text-slate-400 block">Temp</span>
          <span className="text-xs font-black text-slate-900 dark:text-white">{vitals.temperature || 98.4}°F</span>
        </div>
      </div>
    </div>
  );
}
