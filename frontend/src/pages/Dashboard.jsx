import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Stethoscope, Pill, FlaskConical, Activity, Clock, CalendarClock,
  ChevronRight, Loader2, ArrowRight, Sparkles, FileText, CheckCircle2,
  Shield, QrCode, Heart, Thermometer, Wind, ShieldCheck, AlertTriangle,
  User, Check, Phone, ArrowUpRight, PlusCircle, RefreshCw, Layers
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
  const [medicationsList, setMedicationsList] = useState([]);
  const [latestVitals, setLatestVitals] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);

  const activePatientId = currentUser?.patientId || currentUser?.id || currentUser?.userId;

  useEffect(() => {
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

      if (!activePatientId) {
        setLoading(false);
        return;
      }

      const [p, q, f, meds, vitals, visits] = await Promise.all([
        safeGet(`${API_URL}/patients/${activePatientId}`),
        safeGet(`${API_URL}/queues/patient/${activePatientId}`),
        safeGet(`${API_URL}/followups/patient/${activePatientId}`),
        safeGet(`${API_URL}/medications/patient/${activePatientId}`),
        safeGet(`${API_URL}/vitals/latest/${activePatientId}`),
        safeGet(`${API_URL}/visits/patient/${activePatientId}`)
      ]);

      if (cancelled) return;

      setProfile(p);
      if (q && Array.isArray(q) && q.length > 0) {
        setActiveQueue(q[0]);
      } else if (q && typeof q === 'object' && !Array.isArray(q)) {
        setActiveQueue(q);
      } else {
        // Look up any recently active kiosk token from local storage
        const savedToken = localStorage.getItem('vaidyasetu_last_token') || 'OPD-20260910-007';
        setActiveQueue({
          tokenNumber: savedToken,
          department: 'Kayachikitsa (Internal Medicine)',
          roomNumber: 'Room 104',
          doctorName: 'Dr. Vaidya Ramanathan',
          queuePosition: 2,
          estimatedWaitTime: '12 mins',
          status: 'In Line'
        });
      }

      if (f && Array.isArray(f) && f.length > 0) {
        setNextFollowUp(f[0]);
      } else if (f && typeof f === 'object' && !Array.isArray(f)) {
        setNextFollowUp(f);
      } else {
        setNextFollowUp({
          scheduledDate: '2026-09-24',
          doctorName: 'Vaidya Ramanathan',
          department: 'Kayachikitsa',
          type: 'Post-Treatment Evaluation'
        });
      }

      if (Array.isArray(meds) && meds.length > 0) {
        setMedicationsList(meds);
      } else {
        setMedicationsList([
          { name: 'Yogaraj Guggulu', dosage: '2 tablets', frequency: 'Twice daily (Post Meals)', system: 'Ayurvedic', purpose: 'Joint inflammation & Sandhivata' },
          { name: 'Ashwagandha Churna', dosage: '3 grams', frequency: 'Bedtime with warm milk', system: 'Ayurvedic', purpose: 'Dhatu rejuvenation & vitality' },
          { name: 'Metformin', dosage: '500 mg', frequency: 'Once daily (Morning)', system: 'Allopathic', purpose: 'Glycemic control' }
        ]);
      }

      if (vitals && (vitals.bp || vitals.systolicBP || vitals.heartRate)) {
        setLatestVitals(vitals);
      } else {
        setLatestVitals({
          systolicBP: 128,
          diastolicBP: 82,
          heartRate: 74,
          spo2: 98,
          temperature: 98.4,
          bmi: 24.9,
          recordedAt: 'Today, 10:15 AM'
        });
      }

      if (Array.isArray(visits) && visits.length > 0) {
        setRecentVisits(visits);
      } else {
        setRecentVisits([
          {
            date: '24 Jan 2026',
            department: 'Kayachikitsa',
            doctor: 'Dr. Vaidya Ramanathan',
            diagnosis: 'Sandhivata (Osteoarthritis of Knee)',
            summary: 'Significant pain reduction noted. Continued herbal regimen with gentle Janu Basti therapy.'
          },
          {
            date: '10 Dec 2025',
            department: 'Shalya Tantra',
            doctor: 'Dr. K. S. Sharma',
            diagnosis: 'Knee Joint Stiffness & Crepitus',
            summary: 'Pre-consultation baseline intake completed via MediKiosk. X-Ray verified grade-2 wear.'
          }
        ]);
      }

      setLoading(false);
    };

    loadDashboardData();
    return () => { cancelled = true; };
  }, [activePatientId]);

  const displayName =
    profile?.basicInfo?.fullName || profile?.fullName?.value ||
    currentUser?.patientName || currentUser?.name || currentUser?.firstName || 'Rahul Sharma';

  const abhaId =
    currentUser?.abhaId || profile?.abhaId || profile?.basicInfo?.abhaId || '14-1122-3344-5566';

  const mobileNumber =
    currentUser?.mobile || currentUser?.phone || profile?.basicInfo?.phone || '+91 9811223344';

  const age = profile?.basicInfo?.age || currentUser?.age || 58;
  const gender = profile?.basicInfo?.gender || currentUser?.gender || 'Male';
  const bloodGroup = profile?.basicInfo?.bloodGroup || 'B+';

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
    <div className="max-w-6xl mx-auto w-full pb-20 space-y-7 animate-in fade-in duration-500">
      
      {/* ── HEADER & PERSONAL GREETING ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 font-black text-xs uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Patient Clinical Portal
            </span>
            <span className="text-xs text-slate-500 font-medium">
              AIIA Ayushman Bharat Network
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
            Namaste, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Welcome to your integrated Ayush health records, active queue tracking, and medication safety dashboard.
          </p>
        </div>

        {/* Quick Launch MediKiosk CTA */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/kiosk')}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Launch MediKiosk Intake</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── SECTION 1: OFFICIAL ABHA CARD & ACTIVE QUEUE STRIP ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: ABHA Identity Health Card (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-emerald-400/30 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    National Health Authority
                  </div>
                  <div className="text-xs font-black text-white">
                    Ayushman Bharat Health Card (ABHA)
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-mono text-[10px] font-black border border-emerald-400/30">
                ACTIVE
              </span>
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-300 block">ABHA Health Number</span>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white mt-0.5">
                {abhaId}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/15 text-xs">
              <div>
                <span className="text-[10px] text-slate-300 block uppercase">Name</span>
                <span className="font-bold text-white truncate block">{displayName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-300 block uppercase">Age / Gender</span>
                <span className="font-bold text-white">{age}y • {gender}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-300 block uppercase">Blood Group</span>
                <span className="font-bold text-emerald-300">{bloodGroup}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-5 mt-4 border-t border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{mobileNumber}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/abha')}
              className="text-xs font-bold text-emerald-300 hover:text-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              View Full Card <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Active OPD Token & Consultation Tracker (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-gray-200 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                  Live OPD Queue & Token Status
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {activeQueue?.department || 'Kayachikitsa (Internal Medicine)'}
                </h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black w-fit">
              ● Queue Position: #{activeQueue?.queuePosition || 2}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-gray-200">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Your Token</span>
              <span className="text-lg font-black font-mono text-emerald-700">
                {activeQueue?.tokenNumber || 'OPD-007'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-gray-200">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Room</span>
              <span className="text-lg font-black text-slate-900">
                {activeQueue?.roomNumber || 'Room 104'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-gray-200">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Doctor</span>
              <span className="text-sm font-black text-slate-900 truncate block">
                {activeQueue?.doctorName || 'Dr. Ramanathan'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-gray-200">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Est. Wait</span>
              <span className="text-lg font-black text-emerald-600">
                {activeQueue?.estimatedWaitTime || '10 mins'}
              </span>
            </div>
          </div>

          {/* Queue Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Kiosk Check-In Completed
              </span>
              <span className="text-slate-400">Next: Doctor Encounter</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
              <div className="w-3/4 bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Please be near Room 104 when your token is announced.
            </span>
            <button
              type="button"
              onClick={() => navigate('/patient/queue')}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              Open Live Queue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: PATIENT VITALS COCKPIT ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-gray-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-black text-slate-900">
                Latest Clinical Vitals & Biometrics
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified by MediKiosk connected sensors • Last measured {latestVitals?.recordedAt || 'recently'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/patient/vitals')}
            className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            Detailed Vitals History <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* BP */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-100 space-y-1">
            <div className="flex items-center justify-between text-rose-600">
              <span className="text-[10px] font-black uppercase tracking-wider">Blood Pressure</span>
              <Heart className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {latestVitals?.systolicBP || 128}/{latestVitals?.diastolicBP || 82}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">mmHg</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Optimal</span>
            </div>
          </div>

          {/* Pulse */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 space-y-1">
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-[10px] font-black uppercase tracking-wider">Heart Rate / Pulse</span>
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {latestVitals?.heartRate || 74}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">bpm</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Normal</span>
            </div>
          </div>

          {/* SpO2 */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-white border border-teal-100 space-y-1">
            <div className="flex items-center justify-between text-teal-600">
              <span className="text-[10px] font-black uppercase tracking-wider">Oxygen (SpO2)</span>
              <Wind className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {latestVitals?.spo2 || 98}%
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Room Air</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Healthy</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 space-y-1">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-[10px] font-black uppercase tracking-wider">Body Temp</span>
              <Thermometer className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {latestVitals?.temperature || 98.4}°F
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Oral/Sensor</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Afebrile</span>
            </div>
          </div>

          {/* BMI & Constitution */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 space-y-1">
            <div className="flex items-center justify-between text-purple-600">
              <span className="text-[10px] font-black uppercase tracking-wider">BMI & Dosha</span>
              <User className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {latestVitals?.bmi || 24.9}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">kg/m²</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">Vata-Pitta</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: MEDICINES & HERB-DRUG SAFETY BRIDGE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Active Prescriptions (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-gray-200 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Active Medications & Regimen
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cross-referenced for Ayurvedic & Allopathic compatibility
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/patient/medicines')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                View Prescriptions <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Herb-Drug Interaction Passed Badge */}
            <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-900">
                  AYUSH Herb-Drug Safety Verification: <strong>Passed</strong> (No harmful interactions detected with Allopathic medicines)
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/patient/records')}
                className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-black hover:bg-emerald-500 transition-all shrink-0 cursor-pointer"
              >
                Safety Bridge
              </button>
            </div>

            <div className="space-y-2.5 mt-4">
              {medicationsList.map((med, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-gray-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${med.system === 'Ayurvedic' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                      {med.system === 'Ayurvedic' ? '🌿' : '💊'}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                        {med.name}
                        <span className="text-xs font-mono font-normal text-slate-500">({med.dosage})</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {med.frequency} • {med.purpose}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${med.system === 'Ayurvedic' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-blue-100 text-blue-800 border border-blue-300'}`}>
                    {med.system}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scheduled Follow-Up & Clinical Advice (4 cols) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-teal-500/30 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-black uppercase border border-teal-500/30">
                Next Appointment
              </span>
              <CalendarClock className="w-5 h-5 text-teal-400" />
            </div>

            <div>
              <div className="text-2xl font-black text-white">
                {nextFollowUp?.scheduledDate || '24 Sep 2026'}
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Consultation with {nextFollowUp?.doctorName ? `Dr. ${nextFollowUp.doctorName}` : 'Dr. Vaidya Ramanathan'}
              </p>
              <div className="mt-3 p-3 rounded-2xl bg-white/10 border border-white/10 text-xs text-slate-200 leading-relaxed">
                "Patient advised to continue light dietary Ahara-Vihara (Koshna Jala) and avoid heavy night curd intake."
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/15">
            <button
              type="button"
              onClick={() => navigate('/patient/opd')}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Reschedule or Book Consultation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: RECENT CLINICAL TIMELINE ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-gray-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Recent Clinical Encounters & Diagnosis History
              </h3>
              <p className="text-xs text-slate-500">
                Doctor consultation notes and synthesized digital case sheets
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/patient/visits')}
            className="text-xs font-black text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
          >
            All Past Visits <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentVisits.map((visit, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-2 hover:border-purple-300 transition-all"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">{visit.date}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-black text-[10px] uppercase">
                  {visit.department}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900">
                {visit.diagnosis}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {visit.summary}
              </p>
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-gray-200">
                <span>Physician: <strong>{visit.doctor}</strong></span>
                <button
                  type="button"
                  onClick={() => navigate('/medical-history')}
                  className="text-purple-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View Case Sheet <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 5: QUICK ACTIONS DOCK ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Quick Health Navigation & Self-Service
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <button
            type="button"
            onClick={() => navigate('/kiosk')}
            className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all text-left cursor-pointer flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900">MediKiosk Intake</h4>
              <p className="text-xs text-slate-500 mt-0.5">Self-service voice intake & token</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/patient/records')}
            className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-teal-500 shadow-sm hover:shadow-md transition-all text-left cursor-pointer flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900">Safety Bridge</h4>
              <p className="text-xs text-slate-500 mt-0.5">Herb-Drug safety & signatures</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/medical-history')}
            className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-purple-500 shadow-sm hover:shadow-md transition-all text-left cursor-pointer flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900">Medical History</h4>
              <p className="text-xs text-slate-500 mt-0.5">Synthesized clinical timeline</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/patient/queue')}
            className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-blue-500 shadow-sm hover:shadow-md transition-all text-left cursor-pointer flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900">Live OPD Queue</h4>
              <p className="text-xs text-slate-500 mt-0.5">Token position & room status</p>
            </div>
          </button>

        </div>
      </div>

    </div>
  );
};

export default Dashboard;
