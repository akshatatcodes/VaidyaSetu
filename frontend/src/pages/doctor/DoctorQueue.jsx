import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Stethoscope, Search, RefreshCw, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config/api';
import QueueTable from '../../components/doctor/QueueTable';

export default function DoctorQueue() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all');

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

  const filteredQueue = queue.filter(q => {
    const matchesSearch = !search ||
      q.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      q.tokenNumber?.toLowerCase().includes(search.toLowerCase()) ||
      q.chiefComplaint?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'emergency') return q.triagePriority === 'emergency' || q.redFlags?.length > 0;
    if (filterTab === 'waiting') return q.queueStatus === 'waiting' || q.queueStatus === 'queued';
    if (filterTab === 'completed') return q.queueStatus === 'completed';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-emerald-500" /> OPD Patient Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400">Live token roster and consultation triage</p>
        </div>

        <button
          type="button"
          onClick={fetchQueue}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto">
          {['all', 'waiting', 'emergency', 'completed'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterTab(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
                filterTab === t
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search token, patient name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <QueueTable queue={filteredQueue} onSelectSession={handleSelectSession} />
    </div>
  );
}
