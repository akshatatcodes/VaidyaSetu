import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Stethoscope, Pill, FlaskConical, Activity, Clock, CalendarClock,
  ChevronRight, Loader2, ArrowRight, Sparkles, FileText, CheckCircle2
} from 'lucide-react';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activeQueue, setActiveQueue] = useState(null);
  const [nextFollowUp, setNextFollowUp] = useState(null);
  const [recentActivity, setRecentActivity] = useState({ medsCount: 0, vitalsCount: 0, lastVisit: null });

  const activePatientId = currentUser?.patientId || currentUser?.id || currentUser?.userId;

  useEffect(() => {
    if (!activePatientId) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const loadDashboardData = async () => {
      const safeGet = async (url) => {
        try {
          const res = await axios.get(url);
          return res.data?.status === 'success' ? res.data.data : null;
        } catch {
          return null;
        }
      };

      const [p, q, f, meds, vitals] = await Promise.all([
        safeGet(`${API_URL}/patients/${activePatientId}`),
        safeGet(`${API_URL}/queues/patient/${activePatientId}`),
        safeGet(`${API_URL}/followups/patient/${activePatientId}`),
        safeGet(`${API_URL}/medications/patient/${activePatientId}`),
        safeGet(`${API_URL}/vitals/latest/${activePatientId}`)
      ]);

      if (cancelled) return;

      setProfile(p);
      if (q && Array.isArray(q) && q.length > 0) {
        setActiveQueue(q[0]);
      } else if (q && typeof q === 'object' && !Array.isArray(q)) {
        setActiveQueue(q);
      } else {
        setActiveQueue(null);
      }

      if (f && Array.isArray(f) && f.length > 0) {
        setNextFollowUp(f[0]);
      } else if (f && typeof f === 'object' && !Array.isArray(f)) {
        setNextFollowUp(f);
      } else {
        setNextFollowUp(null);
      }

      const activeMeds = Array.isArray(meds) ? meds.filter(m => m.active !== false).length : 0;
      const vitalsArr = Array.isArray(vitals) ? vitals : [];
      
      setRecentActivity({
        medsCount: activeMeds,
        vitalsCount: vitalsArr.length,
        lastVisit: p?.updatedAt || p?.createdAt || new Date().toISOString()
      });

      setLoading(false);
    };

    loadDashboardData();
    return () => { cancelled = true; };
  }, [activePatientId]);

  const displayName =
    profile?.basicInfo?.fullName || profile?.fullName?.value ||
    currentUser?.patientName || currentUser?.name || currentUser?.firstName || 'Patient';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading Health Sanctuary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full pb-20 space-y-6 animate-in fade-in duration-500">
      
      {/* ── GREETING & PATIENT HEADER ── */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
            {t('dashboard.greeting', 'Health Sanctuary')}
          </p>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Namaste, {displayName}
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> ABDM Linked
        </div>
      </header>

      {/* ── PRIORITY 1: CURRENT ACTION ── */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/40">
              <CheckCircle2 className="w-3 h-3" /> Priority Action
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {activeQueue ? `OPD Token Active: #${activeQueue.tokenNumber || activeQueue.ticketNumber || 'OPD-101'}` : 'Need a Consultation Today?'}
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              {activeQueue
                ? `You are in line for ${activeQueue.department || 'Kayachikitsa'}. Position #${activeQueue.queuePosition || 1} • Room ${activeQueue.roomNumber || '4'}.`
                : 'Start instant OPD intake, scan token, or register for specialized Ayurvedic consultation.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(activeQueue ? '/patient/queue' : '/patient/opd')}
            className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-center"
          >
            <span>{activeQueue ? 'Track Live Queue' : 'Start OPD Intake'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── PRIORITY 2, 3, 4: THREE-COLUMN CORE METRIC STRIP ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PRIORITY 2: Current Appointment / Queue */}
        <div className="bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-3 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">2. Queue & Appointment</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 dark:text-white">
              {activeQueue ? `Token ${activeQueue.tokenNumber || 'OPD-101'}` : 'No Active Queue'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {activeQueue ? `Est Wait: ${activeQueue.estimatedWaitTime || '10 mins'}` : 'Register token at Kiosk or online'}
            </p>
          </div>
          <button
            onClick={() => navigate('/patient/queue')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer pt-1"
          >
            Check Live Queue Status <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* PRIORITY 3: Next Follow-Up */}
        <div className="bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-3 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">3. Next Follow-up</span>
            <CalendarClock className="w-4 h-4 text-teal-500" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 dark:text-white">
              {nextFollowUp?.scheduledDate ? new Date(nextFollowUp.scheduledDate).toLocaleDateString() : 'None Scheduled'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {nextFollowUp?.doctorName ? `Dr. ${nextFollowUp.doctorName}` : 'Check doctor advice in visit history'}
            </p>
          </div>
          <button
            onClick={() => navigate('/patient/followups')}
            className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 hover:underline cursor-pointer pt-1"
          >
            View Scheduled Follow-ups <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* PRIORITY 4: Recent Health Activity */}
        <div className="bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-3 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">4. Recent Activity</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 dark:text-white">
              {recentActivity.medsCount} Active Meds
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {recentActivity.vitalsCount} vitals logged · Last updated recently
            </p>
          </div>
          <button
            onClick={() => navigate('/patient/visits')}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline cursor-pointer pt-1"
          >
            View Visit Timeline <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── PRIORITY 5: FOUR QUICK ACTIONS ── */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          5. Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => navigate('/patient/opd')}
            className="group p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 hover:border-emerald-500/40 shadow-sm hover:shadow-md transition-all text-left cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">See a Doctor</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Start OPD Intake & Register</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/patient/medicines')}
            className="group p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 hover:border-emerald-500/40 shadow-sm hover:shadow-md transition-all text-left cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">My Prescriptions</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Active & past medications</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/patient/labs')}
            className="group p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 hover:border-emerald-500/40 shadow-sm hover:shadow-md transition-all text-left cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">Lab Reports</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Diagnostic test results</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/patient/vitals')}
            className="group p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 hover:border-emerald-500/40 shadow-sm hover:shadow-md transition-all text-left cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white">Health Records</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Vitals & document vault</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
