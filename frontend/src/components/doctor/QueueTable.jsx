import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, ChevronRight, Stethoscope, User, AlertOctagon } from 'lucide-react';
import EvidenceBadge from './EvidenceBadge';

export default function QueueTable({ queue = [], onSelectSession, selectedEncounterId }) {
  if (queue.length === 0) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-black text-slate-900 dark:text-white">No Patient Tokens in Queue</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Patients registered via MediKiosk or Patient Portal will automatically appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── MOBILE VIEW: HIGH DENSITY INTERACTIVE PATIENT CARDS ── */}
      <div className="md:hidden space-y-2.5">
        {queue.map((session) => {
          const isSelected = selectedEncounterId === session.id || selectedEncounterId === session._id;
          const isEmergency = session.triagePriority === 'emergency' || session.redFlags?.length > 0;

          return (
            <div
              key={session.id || session._id || session.tokenNumber}
              onClick={() => onSelectSession && onSelectSession(session)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden active:scale-[0.98] shadow-xs ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-400/60'
              }`}
            >
              {isEmergency && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 animate-pulse" />
              )}

              {/* Card Top: Token + Status Badge + Consult Arrow */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-black border border-emerald-200/60 dark:border-emerald-800/60">
                    {session.tokenNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    isEmergency
                      ? 'bg-rose-500 text-white animate-pulse'
                      : session.queueStatus === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {isEmergency ? '⚠️ Emergency' : session.queueStatus || 'Waiting'}
                  </span>
                </div>

                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-0.5">
                  <span>Consult</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Patient Name & Details */}
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {session.patientName}
                </h3>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                  {session.age}y • {session.gender}
                </span>
              </div>

              {/* Chief Complaint */}
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                {session.chiefComplaint || 'General OPD Consultation'}
              </p>

              {/* Card Footer: Source & Department */}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">
                  Source: <span className="font-semibold text-slate-700 dark:text-slate-300">{session.sourceTag || (session.source === 'caregiver' ? 'Caregiver' : 'Kiosk')}</span>
                </span>
                {session.department && (
                  <span className="text-teal-700 dark:text-teal-400 font-bold">
                    {session.department}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DESKTOP VIEW: CLEAN DATA TABLE ── */}
      <div className="hidden md:block overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-wider">
              <th className="py-3.5 px-4">Token</th>
              <th className="py-3.5 px-4">Patient Name</th>
              <th className="py-3.5 px-4">Age / Gender</th>
              <th className="py-3.5 px-4">Chief Complaint</th>
              <th className="py-3.5 px-4">Source</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {queue.map((session) => {
              const isSelected = selectedEncounterId === session.id || selectedEncounterId === session._id;
              const isEmergency = session.triagePriority === 'emergency' || session.redFlags?.length > 0;
              return (
                <tr
                  key={session.id || session._id || session.tokenNumber}
                  onClick={() => onSelectSession && onSelectSession(session)}
                  className={`transition-colors cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 ${
                    isSelected ? 'bg-emerald-50 dark:bg-emerald-950/30 font-semibold' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono font-black text-emerald-700 dark:text-emerald-400">
                    {session.tokenNumber}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {session.patientName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                    {session.age}y / {session.gender}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate font-medium">
                    {session.chiefComplaint || 'General OPD Consultation'}
                  </td>
                  <td className="py-3.5 px-4">
                    <EvidenceBadge source={session.sourceTag || (session.source === 'caregiver' ? 'Caregiver' : 'Kiosk Sensor')} />
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      isEmergency
                        ? 'bg-rose-500 text-white shadow-2xs animate-pulse'
                        : session.queueStatus === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {isEmergency ? '⚠️ Emergency' : session.queueStatus || 'Waiting'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSession && onSelectSession(session);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      <span>Consult</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
