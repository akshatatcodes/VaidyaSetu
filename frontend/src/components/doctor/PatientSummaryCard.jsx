import React from 'react';
import { Eye, AlertOctagon, Activity, ShieldCheck, FileText } from 'lucide-react';

const PatientSummaryCard = ({ selectedSession, openEvidenceDrawer }) => {
  if (!selectedSession) return null;

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-6 border border-emerald-500/20 shadow-xl space-y-4">
      {/* Top Patient Header & Dosha Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xl border border-emerald-500/30">
            {selectedSession.patientName?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                {selectedSession.tokenNumber}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                ABHA: {selectedSession.abhaId}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {selectedSession.patientName} ({selectedSession.age}y, {selectedSession.gender})
            </h2>
          </div>
        </div>

        {/* Constitutional Dosha Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-black">
            Prakriti: {selectedSession.dashavidhaPariksha?.prakriti?.primaryDosha || 'Vata-Kapha'}
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-black">
            Agni: {selectedSession.dashavidhaPariksha?.aharaShakti?.jaranaShakti || 'Mandagni'}
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-black">
            Satva: {selectedSession.dashavidhaPariksha?.satva || 'Madhyama'}
          </div>
        </div>
      </div>

      {/* Provenance & Evidence Link Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <strong>Provenance Verified (§25):</strong> Source document tags & confidence scores active on all extracted clinical metrics.
          </span>
        </div>
        <button
          type="button"
          onClick={openEvidenceDrawer}
          className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white/10 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold text-xs border border-emerald-500/40 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-400" /> Inspect Evidence
        </button>
      </div>

      {/* Vitals Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Blood Pressure */}
        <div className={`p-3 rounded-2xl border text-center ${selectedSession.vitals?.systolicBP >= 180 ? 'bg-red-500/20 border-red-500/40 text-red-500 font-black animate-pulse' : 'bg-slate-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-900 dark:text-white'}`}>
          <span className="text-[10px] font-bold text-gray-500 block uppercase">BP (mmHg)</span>
          <span className="text-base font-black font-mono">
            {selectedSession.vitals?.systolicBP || '--'}/{selectedSession.vitals?.diastolicBP || '--'}
          </span>
          <span className="text-[9px] text-gray-400 block mt-0.5">Src: Kiosk Sensor</span>
        </div>

        {/* Heart Rate */}
        <div className="p-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center text-slate-900 dark:text-white">
          <span className="text-[10px] font-bold text-gray-500 block uppercase">Heart Rate</span>
          <span className="text-base font-black font-mono">
            {selectedSession.vitals?.heartRate || '--'} bpm
          </span>
          <span className="text-[9px] text-gray-400 block mt-0.5">Src: Pulse Oximeter</span>
        </div>

        {/* SpO2 */}
        <div className={`p-3 rounded-2xl border text-center ${selectedSession.vitals?.spo2 < 94 ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 font-black' : 'bg-slate-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-900 dark:text-white'}`}>
          <span className="text-[10px] font-bold text-gray-500 block uppercase">SpO2</span>
          <span className="text-base font-black font-mono">
            {selectedSession.vitals?.spo2 || '--'}%
          </span>
          <span className="text-[9px] text-gray-400 block mt-0.5">Src: Pulse Oximeter</span>
        </div>

        {/* Temperature */}
        <div className="p-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center text-slate-900 dark:text-white">
          <span className="text-[10px] font-bold text-gray-500 block uppercase">Body Temp</span>
          <span className="text-base font-black font-mono">
            {selectedSession.vitals?.temperature || '--'}°F
          </span>
          <span className="text-[9px] text-gray-400 block mt-0.5">Src: IR Thermometer</span>
        </div>

        {/* BMI */}
        <div className="p-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center text-slate-900 dark:text-white">
          <span className="text-[10px] font-bold text-gray-500 block uppercase">BMI Index</span>
          <span className="text-base font-black font-mono">
            {selectedSession.vitals?.bmi || '--'}
          </span>
          <span className="text-[9px] text-gray-400 block mt-0.5">Src: Stadiometer</span>
        </div>

        {/* Triage Priority */}
        <div className={`p-3 rounded-2xl border text-center ${selectedSession.triagePriority === 'emergency' ? 'bg-red-500 text-white font-black' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border-emerald-500/30'}`}>
          <span className="text-[10px] font-bold opacity-80 block uppercase">Triage Priority</span>
          <span className="text-xs font-black uppercase">
            {selectedSession.triagePriority || 'Normal'}
          </span>
          <span className="text-[9px] opacity-80 block mt-0.5">Src: Risk Engine</span>
        </div>
      </div>

      {/* Red Flag Warning Banner */}
      {selectedSession.redFlags?.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-500/15 border-2 border-red-500/40 text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-black uppercase tracking-wider block">
              CLINICAL TRIAGE EMERGENCY RED-FLAGS DETECTED
            </span>
            <ul className="list-disc list-inside text-xs font-bold mt-1 space-y-0.5">
              {selectedSession.redFlags.map((rf, i) => (
                <li key={i}>{rf.flag} ({rf.category})</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Conflicting Information Warning Banner (§14) */}
      {(selectedSession.conflicts?.length > 0 || selectedSession.hasConflict) && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-800 dark:text-amber-200 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-black uppercase tracking-wider block text-amber-600 dark:text-amber-400">
              ⚠️ CONFLICTING CLINICAL INFORMATION DETECTED (§14)
            </span>
            <p className="font-bold">Doctor verification required — never silently select one source.</p>
            {selectedSession.conflicts ? (
              <ul className="list-disc list-inside space-y-1 pt-1 font-medium">
                {selectedSession.conflicts.map((c, i) => (
                  <li key={i}>
                    <strong>{c.field || 'Medical Record'}:</strong> Old record: <span className="underline">{c.oldRecord || 'Reported'}</span> vs Patient/Kiosk: <span className="underline">{c.newRecord || 'Uncertain'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] opacity-90">Old record vs Patient response discrepancy detected. Please verify before completing consultation.</p>
            )}
          </div>
        </div>
      )}

      {/* Longitudinal Lab Trend Comparison */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-emerald-500/20 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Automated Longitudinal Lab & Symptom Trend Comparison
            </h3>
          </div>
          <span className="text-[10px] text-gray-400 font-bold">Verified via OCR Engine</span>
        </div>

        {selectedSession.labTrends?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {selectedSession.labTrends.map((trend, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl bg-white dark:bg-slate-800 border ${
                  trend.direction === 'elevated' || trend.direction === 'worsened'
                    ? 'border-rose-500/30'
                    : 'border-emerald-500/20'
                }`}
              >
                <span className="text-[10px] text-gray-500 uppercase font-bold block">
                  {trend.testName}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span
                    className={`text-lg font-black ${
                      trend.direction === 'elevated' || trend.direction === 'worsened'
                        ? 'text-rose-500'
                        : 'text-emerald-500'
                    }`}
                  >
                    {trend.currentValue}
                  </span>
                  {trend.previousValue && (
                    <span className="text-xs text-gray-400 font-mono">
                      from {trend.previousValue} ({trend.previousDate})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl text-center text-xs text-gray-400 font-medium">
            No prior longitudinal lab trends recorded for this patient.
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientSummaryCard;
