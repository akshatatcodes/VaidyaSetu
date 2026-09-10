import React from 'react';
import { Stethoscope, ShieldCheck, Award, User, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function DoctorProfile() {
  const { currentUser } = useAuth();

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-teal-950 to-emerald-950 text-white shadow-2xl border border-emerald-500/20 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-2xl">
            MD
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
              CCIM VERIFIED CLINICIAN (§21)
            </span>
            <h1 className="text-2xl font-black text-white mt-1">
              {currentUser?.doctorName || currentUser?.fullName || 'Dr. Vikramaditya Sharma'}
            </h1>
            <p className="text-xs text-emerald-200/70">
              Department of Kayachikitsa • All India Institute of Ayurveda (AIIA), New Delhi
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-sm space-y-4 text-xs">
        <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Physician Registration & Security Scope
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5 space-y-1">
            <span className="font-bold text-slate-400 block">Registration Number</span>
            <span className="font-mono font-black text-slate-900 dark:text-white">CCIM-DEL-2018-9844</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5 space-y-1">
            <span className="font-bold text-slate-400 block">Specialities</span>
            <span className="font-bold text-slate-900 dark:text-white">Kayachikitsa (General Medicine), Panchakarma</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5 space-y-1">
            <span className="font-bold text-slate-400 block">Clinical Room Allocation</span>
            <span className="font-bold text-slate-900 dark:text-white">OPD Room 104 (Kayachikitsa Wing)</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-white/5 space-y-1">
            <span className="font-bold text-slate-400 block">Security Clearance</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Level 3 Authorized Medical Officer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
