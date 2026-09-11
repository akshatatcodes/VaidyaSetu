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
  const [pastTokens, setPastTokens] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const activePatientId = currentUser?.patientId || currentUser?.id || currentUser?.userId;

  const loadQueueAndFollowups = async () => {
    if (!activePatientId) {
      setLoading(false);
      return;
    }
    setRefreshing(true);
    try {
      const [qRes, fRes, encRes] = await Promise.all([
        axios.get(`${API_URL}/queue/my/${activePatientId}`).catch(() => ({ data: { data: null } })),
        axios.get(`${API_URL}/continuity/followups?patientId=${activePatientId}`).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/encounters/patient/${activePatientId}`).catch(() => ({ data: { data: [] } }))
      ]);

      if (qRes.data?.status === 'success') {
        setQueueData(qRes.data.data);
        if (Array.isArray(qRes.data.pastVisits) && qRes.data.pastVisits.length > 0) {
          setPastTokens(qRes.data.pastVisits);
        }
      }
      if (fRes.data?.status === 'success') {
        setFollowUps(fRes.data.data || []);
      }
      if (encRes.data?.status === 'success' && Array.isArray(encRes.data.data) && encRes.data.data.length > 0) {
        setPastTokens(prev => prev.length > 0 ? prev : encRes.data.data);
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
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 font-bold mb-2">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Clock className="text-teal-600" /> Live OPD Queue & Follow-up Status (§18, §19, §33–34)
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Real-time consultation status, estimated wait times, and assigned follow-up slots.
          </p>
        </div>

        <button
          onClick={loadQueueAndFollowups}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-teal-800 border border-slate-300 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Main Queue Status Card */}
      {queueData ? (
        <div className="bg-white border-2 border-teal-500/30 p-8 rounded-3xl mb-8 relative overflow-hidden shadow-xl text-slate-900">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <QrCode size={180} className="text-teal-600" />
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Token Banner */}
            <div className="border-r border-slate-200 pr-6">
              <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                Active OPD Token (§18)
              </span>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mt-3 mb-1">
                {queueData.tokenNumber}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Triage Priority: <span className="text-teal-700 font-black uppercase">{queueData.priority}</span>
              </p>
            </div>

            {/* Patients Ahead & ETA */}
            <div className="border-r border-slate-200 pr-6 space-y-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Patients Ahead</p>
                <p className="text-3xl font-black text-slate-900 mt-1">
                  {queueData.patientsAhead} <span className="text-xs text-slate-500 font-normal">in queue</span>
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Estimated Wait Range (§18)</p>
                <p className="text-lg font-black text-teal-700 mt-0.5 flex items-center gap-1.5">
                  <Clock size={16} /> {queueData.etaRange}
                </p>
              </div>
            </div>

            {/* Department & Room Assignment */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Assigned Department</p>
                <p className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1.5">
                  <Stethoscope size={16} className="text-teal-600" /> {queueData.departmentName}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Assigned OPD Room</p>
                <p className="text-sm font-black text-teal-700 mt-1 flex items-center gap-1.5">
                  <MapPin size={16} className="text-teal-600" /> {queueData.roomNumber}
                </p>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 p-8 rounded-3xl mb-8 text-center space-y-3 shadow-sm">
          <Clock className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-black text-slate-900">No Active Queue Token for Today</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You do not currently have an active OPD token for today. Click below to start an OPD intake visit.
          </p>
          <Link to="/kiosk" className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-black text-xs rounded-xl hover:bg-teal-700 shadow-md">
            Start OPD Intake Visit
          </Link>
        </div>
      )}

      {/* Past OPD Visits & Token History */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-teal-700 flex items-center gap-2">
            <Calendar size={15} /> Past OPD Visits & Token History
          </h2>
          <span className="text-xs text-slate-500 font-bold">
            {pastTokens.length} Previous {pastTokens.length === 1 ? 'Visit' : 'Visits'}
          </span>
        </div>

        {pastTokens.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Token Number</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">Doctor / Room</th>
                    <th className="px-5 py-3.5">Diagnosis / Reason</th>
                    <th className="px-5 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {pastTokens.map((vt, idx) => (
                    <tr key={vt.id || vt._id || idx} className="hover:bg-teal-50/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-black text-teal-700">
                        {vt.tokenNumber || `OPD-${idx + 1}`}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-bold">
                        {vt.date || 'Recent'}
                      </td>
                      <td className="px-5 py-3.5 font-bold">
                        {vt.department || 'Kayachikitsa (Internal Medicine)'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {vt.doctorName || vt.doctor || 'OPD Duty Doctor'}
                      </td>
                      <td className="px-5 py-3.5 max-w-xs truncate text-slate-600">
                        {vt.diagnosis || vt.summary || 'Clinical Consultation'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          (vt.status || '').toLowerCase() === 'queued'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {vt.status || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white border border-slate-200 rounded-3xl text-center text-slate-500 text-xs shadow-sm">
            No previous OPD token visits found in records.
          </div>
        )}
      </div>

      {/* Scheduled Follow-up Slots Section (§33–34) */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-teal-700">
          Scheduled Follow-up Time Windows (§33–34)
        </h2>

        {followUps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {followUps.map((fu) => (
              <div key={fu._id} className="bg-white border border-slate-200 shadow-sm p-6 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {fu.status}
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-bold">
                    Reason: {fu.reason}
                  </span>
                </div>

                {fu.scheduledWindow?.date ? (
                  <div className="bg-teal-50/70 p-4 rounded-2xl border border-teal-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600 font-bold">Assigned Follow-up Slot</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">
                        {fu.scheduledWindow.date} &bull; {fu.scheduledWindow.startTime} – {fu.scheduledWindow.endTime}
                      </p>
                    </div>
                    <CheckCircle2 size={20} className="text-teal-600" />
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 font-medium italic">
                    Waiting for lab results to complete before assigning slot (§36).
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-white border border-slate-200 rounded-3xl text-center text-slate-500 text-xs shadow-sm">
            No upcoming appointments.
          </div>
        )}
      </div>

    </div>
  );
};

export default LiveQueueStatus;
