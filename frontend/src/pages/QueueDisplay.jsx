import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { API_URL } from '../config/api';
import { Clock, Users, Stethoscope, AlertTriangle } from 'lucide-react';

/** Live OPD Waiting-Room Display (§19) */
export default function QueueDisplay({ department: departmentProp }) {
  const params = useParams();
  const department = departmentProp || params.department || 'Kayachikitsa';
  const [liveData, setLiveData] = useState(null);
  const lastAnnounce = useRef('');

  const loadQueue = async () => {
    try {
      const res = await axios.get(`${API_URL}/queue/live?departmentId=${encodeURIComponent(department)}`);
      if (res.data.status === 'success') {
        setLiveData(res.data.data);
      }
    } catch (e) {
      console.warn('Queue live fetch fallback', e.message);
    }
  };

  useEffect(() => {
    loadQueue();
    const t = setInterval(loadQueue, 5000);
    return () => clearInterval(t);
  }, [department]);

  const currentlyServing = liveData?.currentlyServing || '—';
  const totalWaiting = liveData?.totalWaiting || 0;
  const etaRange = liveData?.etaRange || '0 - 5 mins';
  const entries = liveData?.entries || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              Live OPD Board (§19)
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mt-2">
              {department} Department
            </h1>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl flex items-center gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Wait Time Range</p>
              <p className="text-xl font-black text-teal-400 flex items-center gap-1.5 mt-0.5">
                <Clock size={18} /> {etaRange}
              </p>
            </div>
            <div className="border-l border-slate-800 pl-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patients Ahead</p>
              <p className="text-xl font-black text-white flex items-center gap-1.5 mt-0.5">
                <Users size={18} /> {totalWaiting}
              </p>
            </div>
          </div>
        </div>

        {/* Currently Serving Hero Card */}
        <div className="bg-gradient-to-br from-teal-900/60 to-slate-900 border border-teal-500/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-teal-500/20 border border-teal-500/40 rounded-2xl grid place-items-center text-teal-300">
              <Stethoscope size={36} />
            </div>
            <div>
              <p className="text-xs font-bold text-teal-300 uppercase tracking-widest">Now Serving at Desk</p>
              <p className="text-5xl md:text-6xl font-black text-white tracking-tight mt-1 font-mono">
                {currentlyServing}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Consulting Room</p>
            <p className="text-2xl font-black text-white mt-1">Room 104 &bull; OPD Wing A</p>
          </div>
        </div>

        {/* Queue Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming Patients in Queue</h3>
          {entries.length > 0 ? (
            <div className="grid gap-2">
              {entries.slice(0, 12).map((row, idx) => (
                <div
                  key={row.tokenNumber || idx}
                  className={`flex items-center justify-between px-5 py-4 rounded-2xl border ${
                    row.priority === 'emergency'
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                      : row.priority === 'urgent'
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                        : 'border-slate-800 bg-slate-900/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                    <span className="font-mono font-black text-lg tracking-wider">{row.tokenNumber}</span>
                    {row.priority === 'emergency' && (
                      <span className="px-2 py-0.5 rounded bg-rose-500 text-slate-950 text-[10px] font-black uppercase">
                        Emergency Priority
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm font-semibold">
                    <span className="capitalize">{row.status?.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-500">
              No pending patients in the queue for this session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
