import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Search, RefreshCw, AlertOctagon, UserCheck, Calendar, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';
import QueueTable from '../../components/doctor/QueueTable';
import { FALLBACK_DEMO_CASES } from '../DoctorDashboard';

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
      if (res.data?.status === 'success' && res.data.data?.length > 0) {
        setQueue(res.data.data);
      } else {
        setQueue(FALLBACK_DEMO_CASES);
      }
    } catch (err) {
      console.warn('Error fetching queue, using demo fallback:', err.message);
      setQueue(FALLBACK_DEMO_CASES);
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
    { id: 'normal', label: 'Normal (Regular OPD Queue)', icon: UserCheck, count: deptScopedQueue.filter(q => q.triagePriority !== 'emergency' && q.queueStatus !== 'completed').length },
    { id: 'emergency', label: 'Emergency (Human-Verified Priority)', icon: AlertOctagon, count: deptScopedQueue.filter(q => q.triagePriority === 'emergency').length },
    { id: 'followup', label: 'Follow-up (Returning for Reports)', icon: RotateCcw, count: deptScopedQueue.filter(q => q.type === 'followup' || q.isReturningPatient).length },
    { id: 'appointment', label: 'Appointment (Scheduled Patients)', icon: Calendar, count: deptScopedQueue.filter(q => q.isAppointment || q.queueStatus === 'scheduled').length }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider">
            📋 OPD TRIAGE & LIVE PATIENT QUEUE
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2 flex items-center gap-2">
            <Clock className="w-7 h-7 text-emerald-400" /> OPD Live Patient Queue
          </h1>
          <p className="text-xs text-emerald-200/70 font-medium mt-1">
            Categorized OPD roster by clinical priority, emergency triage flags, and appointment schedules.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchQueue}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl transition-all cursor-pointer shadow-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* 4 Categorized Queue Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tabOptions.map((tab) => {
          const IconComp = tab.icon;
          const isActive = filterTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xl scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-gray-200 border-gray-200 dark:border-white/10 hover:border-emerald-400/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black block">{tab.label.split(' (')[0]}</span>
                  <span className={`text-[10px] ${isActive ? 'text-emerald-100' : 'text-gray-500'}`}>
                    {tab.label.split(' (')[1]?.replace(')', '') || ''}
                  </span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-black ${
                isActive ? 'bg-white text-slate-950' : 'bg-slate-100 dark:bg-white/10 text-emerald-600 dark:text-emerald-400'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search patient name, token number, ABHA..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
        />
      </div>

      <QueueTable queue={filteredQueue} onSelectSession={handleSelectSession} />
    </div>
  );
}
