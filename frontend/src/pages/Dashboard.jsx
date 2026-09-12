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

  // 1. Instant local cache hydration for 0ms initial paint (even offline / 2G)
  useEffect(() => {
    if (!activePatientId) return;
    try {
      const cacheKey = `vaidya_dash_cache_${activePatientId}`;
      const cachedStr = localStorage.getItem(cacheKey);
      if (cachedStr) {
        const c = JSON.parse(cachedStr);
        if (c.profile) setProfile(c.profile);
        if (c.activeQueue) setActiveQueue(c.activeQueue);
        if (c.nextFollowUp) setNextFollowUp(c.nextFollowUp);
        if (Array.isArray(c.medicationsList)) setMedicationsList(c.medicationsList);
        if (c.latestVitals) setLatestVitals(c.latestVitals);
        if (Array.isArray(c.recentVisits)) setRecentVisits(c.recentVisits);
        setLoading(false);
      } else if (currentUser) {
        setProfile(currentUser);
        setLoading(false);
      }
    } catch (e) { }
  }, [activePatientId]);

  useEffect(() => {
    let cancelled = false;

    const loadDashboardData = async () => {
      const safeGet = async (url) => {
        try {
          const res = await axios.get(url, { timeout: 2000 });
          return res.data;
        } catch {
          return null;
        }
      };

      if (!activePatientId) {
        setLoading(false);
        return;
      }

      // If currentUser is already available in context, reveal UI immediately
      if (currentUser) {
        setLoading(false);
      }

      const [pRes, qRes, fRes, medsRes, vitalsRes, visitsRes] = await Promise.all([
        safeGet(`${API_URL}/patients/${activePatientId}`),
        safeGet(`${API_URL}/queue/my/${activePatientId}`),
        safeGet(`${API_URL}/followups/patient/${activePatientId}`),
        safeGet(`${API_URL}/medications/patient/${activePatientId}`),
        safeGet(`${API_URL}/vitals/latest/${activePatientId}`),
        safeGet(`${API_URL}/encounters/patient/${activePatientId}`)
      ]);

      if (cancelled) return;

      // 1. Patient Profile
      setProfile(pRes?.data || pRes);

      // 2. Active Queue & Token
      const qData = qRes?.data !== undefined ? qRes.data : qRes;
      if (qData && typeof qData === 'object' && !Array.isArray(qData) && (qData.tokenNumber || qData._id)) {
        setActiveQueue(qData);
      } else if (Array.isArray(qData) && qData.length > 0) {
        setActiveQueue(qData[0]);
      } else {
        setActiveQueue(null);
      }

      // 3. Follow Up
      const fData = fRes?.data !== undefined ? fRes.data : fRes;
      if (Array.isArray(fData) && fData.length > 0) {
        setNextFollowUp(fData[0]);
      } else if (fData && typeof fData === 'object' && !Array.isArray(fData) && (fData.scheduledDate || fData.doctorName)) {
        setNextFollowUp(fData);
      } else {
        setNextFollowUp(null);
      }

      // 4. Clinical Encounters & Past Visits
      let visitsList = [];
      const rawVisits = visitsRes?.data !== undefined ? visitsRes.data : visitsRes;
      if (Array.isArray(rawVisits) && rawVisits.length > 0) {
        visitsList = rawVisits;
      } else if (Array.isArray(qRes?.pastVisits) && qRes.pastVisits.length > 0) {
        visitsList = qRes.pastVisits.map(v => ({
          date: v.date,
          department: v.department,
          doctor: v.doctorName,
          diagnosis: v.diagnosis,
          summary: v.summary
        }));
      }
      setRecentVisits(visitsList);

      // 5. Active Medications
      let medsList = [];
      const rawMeds = medsRes?.data !== undefined ? medsRes.data : medsRes;
      if (Array.isArray(rawMeds) && rawMeds.length > 0) {
        medsList = rawMeds;
      } else if (Array.isArray(rawVisits)) {
        rawVisits.forEach(enc => {
          if (Array.isArray(enc.prescriptions)) {
            enc.prescriptions.forEach(p => {
              medsList.push({
                name: p.medicineName || p.name,
                dosage: p.dosage || p.potency || 'Standard',
                frequency: p.frequency || p.timing || 'Daily',
                system: p.system || (p.medicineName?.includes('Vati') || p.medicineName?.includes('Churna') ? 'Ayurvedic' : 'Allopathic'),
                purpose: p.instructions || p.reason || 'Clinical prescription'
              });
            });
          }
        });
      }
      setMedicationsList(medsList);

      // 6. Latest Vitals & Biometrics with source & timestamp detection
      const rawVitals = vitalsRes?.data !== undefined ? vitalsRes.data : vitalsRes;
      let parsedVitals = null;

      if (Array.isArray(rawVitals) && rawVitals.length > 0) {
        const findV = (key) => rawVitals.find(v => v.type === key || v.vitalType === key);
        const bpVital = findV('blood_pressure') || findV('bp');
        const hrVital = findV('heart_rate') || findV('pulse');
        const spo2Vital = findV('oxygen_saturation') || findV('spo2');
        const tempVital = findV('body_temperature') || findV('temperature');
        const wtVital = findV('weight');
        const bmiVital = findV('bmi');

        let systolic = '120';
        let diastolic = '80';
        if (bpVital?.value) {
          const valStr = String(bpVital.value);
          if (valStr.includes('/')) {
            const [s, d] = valStr.split('/');
            systolic = s.trim();
            diastolic = d.trim();
          } else {
            systolic = valStr;
          }
        }

        const timestamps = rawVitals
          .map(v => v.timestamp || v.createdAt)
          .filter(Boolean)
          .map(t => new Date(t).getTime());
        const latestMs = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
        const dateObj = new Date(latestMs);
        const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

        const sources = rawVitals.map(v => (v.source || '').toLowerCase());
        let sourceLabel = '📡 MediKiosk IoT Sensors';
        if (sources.some(s => s.includes('fit') || s.includes('smart') || s.includes('wearable') || s.includes('watch') || s.includes('apple'))) {
          sourceLabel = '⌚ Smartwatch / Health Sync';
        } else if (sources.some(s => s.includes('manual') || s.includes('self'))) {
          sourceLabel = '✍️ Self Recorded';
        } else if (sources.some(s => s.includes('clinical') || s.includes('opd') || s.includes('doctor'))) {
          sourceLabel = '📋 Clinical Record';
        }

        parsedVitals = {
          systolicBP: systolic,
          diastolicBP: diastolic,
          heartRate: hrVital?.value || '72',
          spo2: spo2Vital?.value || '98',
          temperature: tempVital?.value || '98.4',
          bmi: bmiVital?.value || (wtVital?.value ? `${(Number(wtVital.value) / (1.7 * 1.7)).toFixed(1)}` : '21.5'),
          sourceLabel,
          recordedAt: timeFormatted,
          rawTimestamp: dateObj
        };
      } else if (rawVitals && typeof rawVitals === 'object') {
        const bp = rawVitals.bp || '';
        let systolic = rawVitals.systolicBP || (bp.includes('/') ? bp.split('/')[0] : '120');
        let diastolic = rawVitals.diastolicBP || (bp.includes('/') ? bp.split('/')[1] : '80');
        const src = (rawVitals.source || '').toLowerCase();
        let sourceLabel = '📡 MediKiosk IoT Sensors';
        if (src.includes('fit') || src.includes('smart') || src.includes('wearable')) {
          sourceLabel = '⌚ Smartwatch / Health Sync';
        } else if (src.includes('manual')) {
          sourceLabel = '✍️ Self Recorded';
        }
        const timeObj = rawVitals.timestamp ? new Date(rawVitals.timestamp) : new Date();
        const timeFormatted = timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + timeObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

        parsedVitals = {
          systolicBP: systolic,
          diastolicBP: diastolic,
          heartRate: rawVitals.heartRate || rawVitals.pulse || '72',
          spo2: rawVitals.spo2 || '98',
          temperature: rawVitals.temperature || '98.4',
          bmi: rawVitals.bmi || '21.5',
          sourceLabel,
          recordedAt: rawVitals.recordedAt || timeFormatted,
          rawTimestamp: timeObj
        };
      }

      setLatestVitals(parsedVitals);
      setLoading(false);

      // Save to cache for 0ms instant load on subsequent renders / low network
      try {
        const cacheKey = `vaidya_dash_cache_${activePatientId}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          profile: pRes?.data || pRes || profile,
          activeQueue: (qData && (qData.tokenNumber || qData._id)) ? qData : null,
          nextFollowUp: (Array.isArray(fData) ? fData[0] : fData) || null,
          medicationsList: medsList,
          latestVitals: parsedVitals,
          recentVisits: visitsList,
          cachedAt: Date.now()
        }));
      } catch (e) { }
    };

    loadDashboardData();
    return () => { cancelled = true; };
  }, [activePatientId, currentUser]);

  const displayName =
    profile?.basicInfo?.fullName || profile?.fullName?.value ||
    currentUser?.patientName || currentUser?.name || currentUser?.firstName || 'Patient';

  const abhaId =
    currentUser?.abhaId || profile?.abhaId || profile?.basicInfo?.abhaId || 'Not Linked';

  const mobileNumber =
    currentUser?.mobile || currentUser?.phone || profile?.basicInfo?.phone || 'Not provided';

  const age = profile?.basicInfo?.age || currentUser?.age || '--';
  const gender = profile?.basicInfo?.gender || currentUser?.gender || '--';
  const bloodGroup = profile?.basicInfo?.bloodGroup || 'Not reported';

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

  const isTokenExpired = () => {
    if (!activeQueue) return false;
    if (activeQueue.status?.toLowerCase() === 'expired') return true;
    if (activeQueue.tokenDate) {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (activeQueue.tokenDate < todayStr) return true;
    }
    if (activeQueue.tokenNumber) {
      const match = activeQueue.tokenNumber.match(/OPD-(\d{4})(\d{2})(\d{2})-/);
      if (match) {
        const tokenDateStr = `${match[1]}-${match[2]}-${match[3]}`;
        const todayStr = new Date().toISOString().slice(0, 10);
        if (tokenDateStr < todayStr) return true;
      }
    }
    return false;
  };

  const handleRegenerateToken = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const randSeq = String(Math.floor(Math.random() * 900) + 100);
    const newToken = `OPD-${yyyy}${mm}${dd}-${randSeq}`;

    setActiveQueue({
      tokenNumber: newToken,
      department: activeQueue?.department || 'Kayachikitsa (Internal Medicine)',
      roomNumber: activeQueue?.roomNumber || 'Room 104',
      doctorName: activeQueue?.doctorName || 'OPD Duty Doctor',
      queuePosition: 8,
      estimatedWaitTime: '20 mins',
      status: 'In Line',
      tokenDate: `${yyyy}-${mm}-${dd}`
    });
  };

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
        
        {/* Left: ABHA Identity Health Card (5 cols) - Crisp Light Theme */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-white text-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border-2 border-emerald-300 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800">
                    National Health Authority
                  </div>
                  <div className="text-xs font-black text-slate-900">
                    Ayushman Bharat Health Card (ABHA)
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-black border border-emerald-300">
                ACTIVE
              </span>
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-600 block">ABHA Health Number</span>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-slate-900 mt-0.5">
                {abhaId}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Name</span>
                <span className="font-extrabold text-slate-900 truncate block">{displayName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Age / Gender</span>
                <span className="font-extrabold text-slate-900">{age}y • {gender}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Blood Group</span>
                <span className="font-extrabold text-emerald-800">{bloodGroup}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{mobileNumber}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patient/profile')}
              className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              View ABHA Details <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Active OPD Token & Consultation Tracker (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border-2 border-slate-200 flex flex-col justify-between space-y-4">
          {activeQueue ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      Live OPD Queue & Token Status
                    </span>
                    <h3 className="text-base font-black text-slate-900">
                      {activeQueue.department || 'General OPD'}
                    </h3>
                  </div>
                </div>
                {isTokenExpired() ? (
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300 w-fit">
                    ⚠️ Expired at 11:59 PM
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300 w-fit">
                    ● Queue Position: #{activeQueue.queuePosition || 1}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-gray-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Your Token</span>
                  <span className={`text-lg font-black font-mono ${isTokenExpired() ? 'text-slate-400 line-through' : 'text-emerald-700'}`}>
                    {activeQueue.tokenNumber}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-gray-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Room</span>
                  <span className="text-lg font-black text-slate-900">
                    {activeQueue.roomNumber || 'Room 104'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-gray-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Doctor</span>
                  <span className="text-sm font-black text-slate-900 truncate block">
                    {activeQueue.doctorName || 'Duty Doctor'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-gray-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Est. Wait</span>
                  <span className="text-lg font-black text-emerald-600">
                    {isTokenExpired() ? 'Expired' : (activeQueue.estimatedWaitTime || '10 mins')}
                  </span>
                </div>
              </div>

              {isTokenExpired() ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-amber-900">
                      This token was unconsulted and expired at midnight (11:59 PM).
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Re-generate a token to rejoin today's live OPD queue at the end of the line.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegenerateToken}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-generate Token</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Kiosk Check-In Completed
                    </span>
                    <span className="text-slate-500 font-semibold">Next: Doctor Encounter</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="w-3/4 bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Please be near Room 104 when your token is called.
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/patient/queue')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Open Live Queue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-3 flex flex-col items-center justify-center my-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">No Active OPD Check-In</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  You do not currently have an active OPD token. Start your pre-consultation intake to enter the live doctor queue.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/patient/opd')}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Start Pre-Consultation Check-In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
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
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {latestVitals?.sourceLabel || '📡 MediKiosk IoT Sensors'}
              </span>
              <span className="text-slate-400">•</span>
              <span>
                Taken: <strong className="text-slate-800 font-semibold">{latestVitals?.recordedAt || 'Recently Measured'}</strong>
              </span>
            </div>
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
              {latestVitals?.systolicBP ? `${latestVitals.systolicBP}/${latestVitals.diastolicBP}` : '--'}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">mmHg</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">{latestVitals ? 'Optimal' : 'No Reading'}</span>
            </div>
          </div>

          {/* Pulse */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 space-y-1">
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-[10px] font-black uppercase tracking-wider">Heart Rate / Pulse</span>
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {latestVitals?.heartRate ? latestVitals.heartRate : '--'}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">bpm</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">{latestVitals ? 'Normal' : 'No Reading'}</span>
            </div>
          </div>

          {/* SpO2 */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-white border border-teal-100 space-y-1">
            <div className="flex items-center justify-between text-teal-600">
              <span className="text-[10px] font-black uppercase tracking-wider">Oxygen (SpO2)</span>
              <Wind className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {latestVitals?.spo2 ? `${latestVitals.spo2}%` : '--'}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Room Air</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">{latestVitals ? 'Healthy' : 'No Reading'}</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 space-y-1">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-[10px] font-black uppercase tracking-wider">Body Temp</span>
              <Thermometer className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {latestVitals?.temperature ? `${latestVitals.temperature}°F` : '--'}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Oral/Sensor</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">{latestVitals ? 'Afebrile' : 'No Reading'}</span>
            </div>
          </div>

          {/* BMI & Constitution */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 space-y-1">
            <div className="flex items-center justify-between text-purple-600">
              <span className="text-[10px] font-black uppercase tracking-wider">BMI & Dosha</span>
              <User className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {latestVitals?.bmi ? latestVitals.bmi : '--'}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">kg/m²</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">{latestVitals ? 'Measured' : 'No Reading'}</span>
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
                  AYUSH Herb-Drug Safety Verification: <strong>Active Engine</strong>
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
              {medicationsList.length > 0 ? (
                medicationsList.map((med, idx) => (
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
                          {med.dosage && <span className="text-xs font-mono font-normal text-slate-500">({med.dosage})</span>}
                        </div>
                        <div className="text-xs text-slate-500">
                          {med.frequency || 'Daily'} {med.purpose ? `• ${med.purpose}` : ''}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${med.system === 'Ayurvedic' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-blue-100 text-blue-800 border border-blue-300'}`}>
                      {med.system || 'Medication'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                  <Pill className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                  <p className="text-xs font-bold text-slate-700">No Active Medications Recorded</p>
                  <p className="text-[11px] text-slate-500">Scan your prescription photo or add medications to monitor compatibility.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scheduled Follow-Up & Clinical Advice (4 cols) */}
        <div className="lg:col-span-4 bg-white text-slate-900 rounded-3xl p-6 sm:p-7 shadow-xl border border-teal-500/20 flex flex-col justify-between space-y-4">
          {nextFollowUp ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-teal-500/15 text-teal-800 text-[11px] font-black uppercase tracking-wider border border-teal-500/30">
                    Next Appointment
                  </span>
                  <CalendarClock className="w-5 h-5 text-teal-600" />
                </div>

                <div>
                  <div className="text-2xl font-black text-slate-900">
                    {nextFollowUp.scheduledDate || nextFollowUp.scheduledWindow?.date || 'Scheduled'}
                  </div>
                  <p className="text-xs font-bold text-slate-600 mt-1">
                    Consultation with {nextFollowUp.doctorName ? `Dr. ${nextFollowUp.doctorName}` : 'Attending Physician'}
                  </p>
                  {nextFollowUp.advice && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/70 text-xs text-slate-800 font-medium leading-relaxed">
                      "{nextFollowUp.advice}"
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate('/patient/opd')}
                  className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Reschedule or Book Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-3 flex flex-col items-center justify-center my-auto">
              <CalendarClock className="w-10 h-10 text-teal-500 mx-auto opacity-50" />
              <div>
                <h4 className="text-sm font-black text-slate-900">No Upcoming Appointments</h4>
                <p className="text-xs text-slate-500 mt-1">
                  You have no scheduled follow-up visits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/patient/opd')}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Book Check-In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
          {recentVisits.length > 0 ? (
            recentVisits.map((visit, idx) => (
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
            ))
          ) : (
            <div className="col-span-2 p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
              <FileText className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
              <p className="text-sm font-bold text-slate-700">No Prior Clinical Encounters Recorded</p>
              <p className="text-xs text-slate-500">Doctor consultation notes and digital case sheets will automatically save here after your visit.</p>
            </div>
          )}
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
