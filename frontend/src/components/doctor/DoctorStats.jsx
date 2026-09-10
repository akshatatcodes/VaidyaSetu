import React from 'react';
import { Users, Clock, AlertTriangle, CheckCircle2, Stethoscope, Calendar } from 'lucide-react';

export default function DoctorStats({ waitingCount = 4, completedCount = 8, emergencyCount = 1, followUpCount = 3 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400">Waiting in Queue</span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{waitingCount}</div>
        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Patients in waiting lounge</p>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400">Completed Today</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{completedCount}</div>
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Encounters completed</p>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-red-500/20 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400">Emergency / Triage</span>
          <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-red-500 mt-1">{emergencyCount}</div>
        <p className="text-[10px] text-red-600 dark:text-red-400 font-medium">Urgent clinical review required</p>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400">Scheduled Follow-Ups</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{followUpCount}</div>
        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Pending results / review</p>
      </div>
    </div>
  );
}
