import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, ChevronRight, Stethoscope } from 'lucide-react';
import EvidenceBadge from './EvidenceBadge';

export default function QueueTable({ queue = [], onSelectSession, selectedEncounterId }) {
  if (queue.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 text-center">
        <p className="text-sm text-slate-500 dark:text-gray-400">No patient tokens found in queue.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-gray-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-400 font-black uppercase text-[10px] tracking-wider">
            <th className="py-3 px-4">Token</th>
            <th className="py-3 px-4">Patient Name</th>
            <th className="py-3 px-4">Age / Gender</th>
            <th className="py-3 px-4">Chief Complaint</th>
            <th className="py-3 px-4">Source</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
          {queue.map((session) => {
            const isSelected = selectedEncounterId === session.id || selectedEncounterId === session._id;
            const isEmergency = session.triagePriority === 'emergency' || session.redFlags?.length > 0;
            return (
              <tr
                key={session.id || session._id || session.tokenNumber}
                onClick={() => onSelectSession && onSelectSession(session)}
                className={`transition-colors cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 ${
                  isSelected ? 'bg-emerald-50 dark:bg-emerald-500/15 font-semibold' : ''
                }`}
              >
                <td className="py-3 px-4 font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {session.tokenNumber}
                </td>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                  {session.patientName}
                </td>
                <td className="py-3 px-4 text-slate-500 dark:text-gray-400">
                  {session.age}y / {session.gender}
                </td>
                <td className="py-3 px-4 text-slate-700 dark:text-gray-300 max-w-xs truncate">
                  {session.chiefComplaint || 'General OPD Consultation'}
                </td>
                <td className="py-3 px-4">
                  <EvidenceBadge source={session.sourceTag || (session.source === 'caregiver' ? 'Caregiver' : 'Kiosk Sensor')} />
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    isEmergency
                      ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                      : session.queueStatus === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-500'
                      : 'bg-amber-500/20 text-amber-500'
                  }`}>
                    {isEmergency ? '⚠️ Emergency' : session.queueStatus || 'Waiting'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSession && onSelectSession(session);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm cursor-pointer"
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
  );
}
