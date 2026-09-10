import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Clock, Calendar, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw,
  MapPin, Stethoscope, Users, UserCheck, ShieldCheck, QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const LiveQueueStatus = () => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [queueData, setQueueData] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const activePatientId = currentUser?.patientId || currentUser?.id;

  const loadQueueAndFollowups = async () => {
    if (!activePatientId) {
      setLoading(false);
      return;
    }
    setRefreshing(true);
    try {
      const [qRes, fRes] = await Promise.all([
        axios.get(`${API_URL}/queue/my/${activePatientId}`).catch(() => ({ data: { data: null } })),
        axios.get(`${API_URL}/continuity/followups?patientId=${activePatientId}`).catch(() => ({ data: { data: [] } }))
      ]);

      if (qRes.data.status === 'success') {
        setQueueData(qRes.data.data);
      }
      if (fRes.data.status === 'success') {
        setFollowUps(fRes.data.data || []);
      }
    } catch (err) {
      console.error('Error loading live queue status:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQueueAndFollowups();
    const interval = setInterval(loadQueueAndFollowups, 15000); // Live poll every 15s (§19)
    return () => clearInterval(interval);
  }, [activePatientId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <RefreshCw className="w-10 h-10 text-teal-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto w-full pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 font-bold mb-2">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Clock className="text-teal-500" /> Live OPD Queue & Follow-up Status (§18, §19, §33–34)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time consultation status, estimated wait times, and assigned follow-up slots.
          </p>
        </div>

        <button
          onClick={loadQueueAndFollowups}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Main Queue Status Card */}
      {queueData ? (
        <div className="bg-gradient-to-br from-teal-950/80 to-slate-900 border border-teal-500/30 p-8 rounded-3xl mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <QrCode size={180} className="text-teal-400" />
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Token Banner */}
            <div className="border-r border-teal-500/20 pr-6">
              <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full">
                Active OPD Token (§18)
              </span>
              <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mt-3 mb-1">
                {queueData.tokenNumber}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Triage Priority: <span className="text-teal-300 font-bold uppercase">{queueData.priority}</span>
              </p>
            </div>

            {/* Patients Ahead & ETA */}
            <div className="border-r border-teal-500/20 pr-6 space-y-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Patients Ahead</p>
                <p className="text-3xl font-black text-white mt-1">
                  {queueData.patientsAhead} <span className="text-xs text-slate-400 font-normal">in queue</span>
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Estimated Wait Range (§18)</p>
                <p className="text-lg font-bold text-teal-300 mt-0.5 flex items-center gap-1.5">
                  <Clock size={16} /> {queueData.etaRange}
                </p>
              </div>
            </div>

            {/* Department & Room Assignment */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Assigned Department</p>
                <p className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                  <Stethoscope size={16} className="text-teal-400" /> {queueData.departmentName}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Assigned OPD Room</p>
                <p className="text-sm font-bold text-teal-300 mt-1 flex items-center gap-1.5">
                  <MapPin size={16} className="text-teal-400" /> {queueData.roomNumber}
                </p>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl mb-8 text-center space-y-3">
          <Clock className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Active Queue Token for Today</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You do not currently have an active OPD token for today. Click below to start an OPD intake visit.
          </p>
          <Link to="/kiosk" className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-teal-400">
            Start OPD Intake Visit
          </Link>
        </div>
      )}

      {/* Scheduled Follow-up Slots Section (§33–34) */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-teal-500">
          Scheduled Follow-up Time Windows (§33–34)
        </h2>

        {followUps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {followUps.map((fu) => (
              <div key={fu._id} className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {fu.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Reason: {fu.reason}
                  </span>
                </div>

                {fu.scheduledWindow?.date ? (
                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-bold">Assigned Follow-up Slot</p>
                      <p className="text-sm font-black text-white mt-0.5">
                        {fu.scheduledWindow.date} &bull; {fu.scheduledWindow.startTime} – {fu.scheduledWindow.endTime}
                      </p>
                    </div>
                    <CheckCircle2 size={20} className="text-teal-400" />
                  </div>
                ) : (
                  <p className="text-xs text-amber-400 italic">
                    Waiting for lab results to complete before assigning slot (§36).
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl text-center text-slate-400 text-xs">
            No upcoming appointments.
          </div>
        )}
      </div>

    </div>
  );
};

export default LiveQueueStatus;
