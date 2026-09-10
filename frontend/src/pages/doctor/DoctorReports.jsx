import React from 'react';
import {
  BarChart3, TrendingUp, Clock, Users, ShieldCheck, CheckCircle2,
  AlertOctagon, RotateCcw, Share2, Award, Sparkles, Activity
} from 'lucide-react';

export default function DoctorReports() {
  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider">
            📊 CLINIC PERFORMANCE & TIME-SAVING ANALYTICS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
            Doctor OPD Performance & Analytics
          </h1>
          <p className="text-xs text-emerald-200/70 font-medium mt-1">
            Real-time consultation efficiency metrics, MediKiosk time-reduction, and queue flow analytics.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center">
          <span className="text-[10px] font-bold text-emerald-300 uppercase block">Consultation Efficiency</span>
          <span className="text-2xl font-black text-white font-mono">8.1 min / patient</span>
          <span className="text-[10px] text-emerald-400 block font-semibold mt-0.5">⚡ 1.9 min faster than baseline (10 min)</span>
        </div>
      </div>

      {/* Daily Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl text-center space-y-1">
          <Users className="w-5 h-5 text-emerald-500 mx-auto" />
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Patients Seen</span>
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">24</span>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block">+4 vs yesterday</span>
        </div>

        <div className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl text-center space-y-1">
          <Clock className="w-5 h-5 text-teal-500 mx-auto" />
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Avg Duration</span>
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">8.1m</span>
          <span className="text-[9px] text-teal-600 dark:text-teal-400 font-bold block">Target: &lt; 9m</span>
        </div>

        <div className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl text-center space-y-1">
          <AlertOctagon className="w-5 h-5 text-rose-500 mx-auto" />
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Emergency Triage</span>
          <span className="text-2xl font-black font-mono text-rose-500">2</span>
          <span className="text-[9px] text-rose-400 font-bold block">100% Attended</span>
        </div>

        <div className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl text-center space-y-1">
          <RotateCcw className="w-5 h-5 text-blue-500 mx-auto" />
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Follow-ups</span>
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">6</span>
          <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold block">No re-registration</span>
        </div>

        <div className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl text-center space-y-1">
          <Activity className="w-5 h-5 text-purple-500 mx-auto" />
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Lab Orders</span>
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">9</span>
          <span className="text-[9px] text-purple-600 dark:text-purple-400 font-bold block">Auto-routed</span>
        </div>

        <div className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl text-center space-y-1">
          <Share2 className="w-5 h-5 text-amber-500 mx-auto" />
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Referrals</span>
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">3</span>
          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold block">Cross-dept</span>
        </div>
      </div>

      {/* Impact Benchmark & Trends Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 text-white border border-emerald-500/30 shadow-xl space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Award className="w-4 h-4" /> MediKiosk Prototype Impact Measurements
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed font-medium">
            Pre-visit AI intake and voice SOCRATES telemetry significantly compress physician data entry time, allowing doctors to focus on clinical decision-making.
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex justify-between text-xs font-black">
                <span>Average Consultation Duration</span>
                <span className="text-emerald-400">8.1 min (Current)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '81%' }} />
              </div>
              <span className="text-[10px] text-gray-400 block">Baseline before MediKiosk: 10.0 min</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex justify-between text-xs font-black">
                <span>Doctor SOAP Note Preparation Time</span>
                <span className="text-teal-400">1.2 min (Current)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: '40%' }} />
              </div>
              <span className="text-[10px] text-gray-400 block">Baseline manual typing: 4.5 min</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Weekly Patient Flow Trends
          </h3>

          <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold pt-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => {
              const counts = [22, 28, 24, 30, 26];
              return (
                <div key={day} className="space-y-2">
                  <div className="h-28 bg-slate-100 dark:bg-white/5 rounded-2xl flex flex-col justify-end p-1">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-xl transition-all"
                      style={{ height: `${counts[i] * 3}%` }}
                    />
                  </div>
                  <span className="text-slate-900 dark:text-white font-black block">{day}</span>
                  <span className="text-[10px] text-gray-400 font-mono block">{counts[i]} pts</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
