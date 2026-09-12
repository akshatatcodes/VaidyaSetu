import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Search, RefreshCw, AlertOctagon, UserCheck, Calendar, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';
import QueueTable from '../../components/doctor/QueueTable';

export default function DoctorQueue() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('normal'); // normal | emergency | followup | appointment

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/kiosk/queue`);
      if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
        setQueue(res.data.data);
      } else {
        setQueue([]);
      }
    } catch (err) {
      console.warn('Error fetching queue:', err.message);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSelectSession = (session) => {
    const encId = session.encounterId || session.id || session._id || 'ENC-DEMO-001';
    navigate(`/doctor/queue/${encId}`);
  };

  const filteredQueue = queue.filter(q => {
    // Department Scoping: Doctor only sees queue data for their specific department if department is set
    if (currentUser?.department && q.department) {
      const docDept = currentUser.department.toLowerCase().replace('department of ', '').trim();
      const itemDept = q.department.toLowerCase().replace('department of ', '').trim();
      if (!docDept.includes(itemDept) && !itemDept.includes(docDept)) {
        return false;
      }
    }

    const matchesSearch = !search ||
      q.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      q.tokenNumber?.toLowerCase().includes(search.toLowerCase()) ||
      q.chiefComplaint?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'emergency') return q.triagePriority === 'emergency' || q.redFlags?.length > 0;
    if (filterTab === 'followup') return q.type === 'followup' || q.isReturningPatient;
    if (filterTab === 'appointment') return q.isAppointment === true || q.queueStatus === 'scheduled';
    return q.triagePriority !== 'emergency' && q.queueStatus !== 'completed';
  });

  const deptScopedQueue = queue.filter(q => {
    if (currentUser?.department && q.department) {
      const docDept = currentUser.department.toLowerCase().replace('department of ', '').trim();
      const itemDept = q.department.toLowerCase().replace('department of ', '').trim();
      return docDept.includes(itemDept) || itemDept.includes(docDept);
    }
    return true;
  });

  const tabOptions = [
    { 
      id: 'normal', 
      label: 'Normal', 
      fullLabel: 'Regular OPD Queue', 
      icon: UserCheck, 
      count: deptScopedQueue.filter(q => q.triagePriority !== 'emergency' && q.queueStatus !== 'completed').length 
    },
    { 
      id: 'emergency', 
      label: 'Emergency', 
      fullLabel: 'Verified Priority', 
      icon: AlertOctagon, 
      count: deptScopedQueue.filter(q => q.triagePriority === 'emergency').length 
    },
    { 
      id: 'followup', 
      label: 'Follow-up', 
      fullLabel: 'Returning for Reports', 
      icon: RotateCcw, 
      count: deptScopedQueue.filter(q => q.type === 'followup' || q.isReturningPatient).length 
    },
    { 
      id: 'appointment', 
      label: 'Appointment', 
      fullLabel: 'Scheduled Patients', 
      icon: Calendar, 
      count: deptScopedQueue.filter(q => q.isAppointment || q.queueStatus === 'scheduled').length 
    }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-28 sm:pb-16 space-y-4 sm:space-y-6 animate-in fade-in duration-300 px-1 sm:px-0">
      {/* ── UNIFIED OPD HEADER NAVBAR ── */}
      <div className="bg-gradient-to-r from-emerald-50/90 via-white/95 to-teal-50/90 dark:from-slate-900/95 dark:via-slate-900/95 dark:to-slate-950/95 text-slate-900 dark:text-white rounded-3xl p-4 sm:p-6 shadow-md shadow-emerald-900/5 border border-emerald-200/80 dark:border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3.5 backdrop-blur-xl select-none">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
              📋 OPD TRIAGE & LIVE PATIENT QUEUE
            </span>
            {currentUser?.department && (
              <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-[10px] font-bold border border-teal-200/60 dark:border-teal-800/60">
                {currentUser.department}
              </span>
            )}
          </div>
          
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black !text-slate-900 dark:!text-white tracking-tight mt-1.5 flex items-center gap-2.5">
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-500 p-0.5 shadow-md shadow-emerald-600/20 inline-flex items-center justify-center shrink-0">
              <span className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              </span>
            </span>
            <span>OPD Live Patient Queue</span>
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
            Categorized OPD roster by clinical priority, emergency triage flags, and appointment schedules.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchQueue}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl sm:rounded-2xl transition-all shadow-md shadow-teal-600/20 active:scale-[0.98] cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* ── 4 CATEGORIZED QUEUE TABS (2x2 GRID ON MOBILE TO SAVE 80% HEIGHT) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {tabOptions.map((tab) => {
          const IconComp = tab.icon;
          const isActive = filterTab === tab.id;
          const isEmergency = tab.id === 'emergency';
          
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`p-3 sm:p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer active:scale-[0.98] shadow-xs ${
                isActive
                  ? isEmergency
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-[1.01]'
                    : 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.01]'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-emerald-400/50'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className={`p-2 rounded-xl shrink-0 ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : isEmergency
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <IconComp className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-black block truncate leading-snug">
                    {tab.label}
                  </span>
                  <span className={`text-[10px] hidden sm:block truncate ${isActive ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {tab.fullLabel}
                  </span>
                </div>
              </div>
              
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black tabular-nums shrink-0 ml-1.5 ${
                isActive 
                  ? 'bg-white text-slate-900' 
                  : isEmergency && tab.count > 0
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search patient name, token number, ABHA..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500/50 focus:outline-none shadow-xs"
        />
      </div>

      {/* ── QUEUE TABLE & MOBILE RESPONSIVE CARDS ── */}
      <QueueTable queue={filteredQueue} onSelectSession={handleSelectSession} />
    </div>
  );
}
