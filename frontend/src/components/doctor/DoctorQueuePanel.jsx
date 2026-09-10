import React from 'react';
import { UserCheck, Search, AlertOctagon, Sparkles, Stethoscope, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DoctorQueuePanel = ({
  filteredQueue,
  searchQuery,
  setSearchQuery,
  waitingCount,
  emergencyCount,
  selectedSession,
  loadSessionDetails,
  showDemoQueue,
  toggleQueueMode
}) => {
  const navigate = useNavigate();

  // Filter out completed/signed patients so only active waiting patients appear in queue
  const activeWaitingQueue = filteredQueue.filter((s) => s.queueStatus !== 'completed');

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-5 border border-emerald-500/20 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            Live OPD Queue
          </h2>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
            Patients waiting for consultation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-black border border-emerald-500/30">
            {activeWaitingQueue.length} Waiting
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search patient name, token, ABHA..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
      </div>

      {/* Patient Cards List */}
      <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
        {activeWaitingQueue.length === 0 ? (
          <div className="p-8 text-center space-y-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-300 dark:border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Queue Clear — All Patients Attended
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {showDemoQueue
                  ? 'Demo queue completed. Toggle mode or refresh to restart test queue.'
                  : 'No patients currently waiting in line. New check-ins from MediKiosk will appear automatically.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate('/kiosk')}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                Open MediKiosk Check-In
              </button>
              {!showDemoQueue && (
                <button
                  type="button"
                  onClick={() => toggleQueueMode(true)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 text-slate-800 dark:text-gray-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Load Demo Patients
                </button>
              )}
            </div>
          </div>
        ) : (
          activeWaitingQueue.map((session) => {
            const isSelected = selectedSession?._id === session._id;
            const isEmergency = session.triagePriority === 'emergency';

            return (
              <div
                key={session._id}
                onClick={() => loadSessionDetails(session)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer select-none text-left relative overflow-hidden ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg scale-[1.01]'
                    : 'border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-emerald-400/40'
                }`}
              >
                {isEmergency && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />
                )}

                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">
                      {session.tokenNumber}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[180px]">
                      {session.patientName}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isEmergency ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3" /> EMERGENCY
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase">
                        WAITING
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-gray-400 truncate mb-2">
                  {session.chiefComplaint || 'Consultation Intake'}
                </p>

                <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-200 dark:border-white/5 pt-2">
                  <span>{session.age}y • {session.gender}</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-gray-300">
                    BP: {session.vitals?.systolicBP || '--'}/{session.vitals?.diastolicBP || '--'}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {session.department || 'Kayachikitsa'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DoctorQueuePanel;
