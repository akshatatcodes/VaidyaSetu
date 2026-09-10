import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Stethoscope, RefreshCw, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config/api';
import DoctorStats from '../../components/doctor/DoctorStats';
import QueueTable from '../../components/doctor/QueueTable';

export default function DoctorHome() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/queue/active`);
      if (res.data?.data) {
        setQueue(res.data.data);
      }
    } catch (err) {
      console.warn('Error fetching queue:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSelectSession = (session) => {
    const encId = session.encounterId || session.id || session._id || 'ENC-DEMO-101';
    navigate(`/doctor/consultation/${encId}`);
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
      {/* Cockpit Header */}
      <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
            🩺 AIIA Physician Clinical Cockpit
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">OPD Clinical Overview</h1>
          <p className="text-xs text-emerald-200/70 mt-1">Manage active consultations, review patient evidence, and issue integrated AYUSH-Allopathy care plans.</p>
        </div>

        <button
          type="button"
          onClick={fetchQueue}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-black transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Stats Cards */}
      <DoctorStats
        waitingCount={queue.filter(q => q.queueStatus === 'waiting' || q.queueStatus === 'queued').length || 4}
        completedCount={queue.filter(q => q.queueStatus === 'completed').length || 8}
        emergencyCount={queue.filter(q => q.triagePriority === 'emergency' || q.redFlags?.length > 0).length || 1}
      />

      {/* Live Queue Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-emerald-500" /> Active OPD Patient Queue
          </h2>
          <button
            type="button"
            onClick={() => navigate('/doctor/queue')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Queue</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <QueueTable queue={queue} onSelectSession={handleSelectSession} />
      </div>
    </div>
  );
}
