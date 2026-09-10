import React from 'react';
import { Activity, Heart, Thermometer, Gauge, Scale } from 'lucide-react';

export default function VitalsSummary({ vitals = {} }) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm space-y-3">
      <h4 className="font-black text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-2">
        <Activity className="w-4 h-4 text-emerald-500" /> Vital Signs & Sensor Measurement
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block flex items-center gap-1"><Gauge className="w-3 h-3 text-emerald-500" /> Blood Pressure</span>
          <span className="text-sm font-black text-slate-900 dark:text-white">{vitals.systolicBP || 128}/{vitals.diastolicBP || 84} <span className="text-[10px] font-normal text-slate-400">mmHg</span></span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block flex items-center gap-1"><Heart className="w-3 h-3 text-rose-500" /> Pulse Rate</span>
          <span className="text-sm font-black text-slate-900 dark:text-white">{vitals.pulseRate || 78} <span className="text-[10px] font-normal text-slate-400">bpm</span></span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block flex items-center gap-1"><Activity className="w-3 h-3 text-cyan-500" /> SpO2</span>
          <span className="text-sm font-black text-slate-900 dark:text-white">{vitals.spO2 || 98}%</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block flex items-center gap-1"><Thermometer className="w-3 h-3 text-amber-500" /> Temperature</span>
          <span className="text-sm font-black text-slate-900 dark:text-white">{vitals.temperature || 98.4}°F</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block flex items-center gap-1"><Scale className="w-3 h-3 text-purple-500" /> BMI</span>
          <span className="text-sm font-black text-slate-900 dark:text-white">{vitals.bmi || 23.4}</span>
        </div>
      </div>
    </div>
  );
}
