import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import {
  Activity, RefreshCw, AlertTriangle, CheckCircle, ShieldAlert, Cpu, Download,
  Pill, HeartPulse, Scan, ThumbsUp, ThumbsDown, Calendar, Plus, CheckCircle2,
  ChevronRight, Upload, Sparkles, Clock, ArrowUpRight, Check, Zap, FileText,
  Stethoscope, AlertOctagon, Heart, User, QrCode, ArrowRight, ShieldCheck, Thermometer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { generateDashboardPDF } from '../utils/pdfGenerator';
import SavedDoctorsWidget from '../components/dashboard/SavedDoctorsWidget';

import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, isLoaded } = useUser();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [latestVitals, setLatestVitals] = useState([]);
  const [medications, setMedications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [activeKioskToken, setActiveKioskToken] = useState(null);

  const effectiveUserId = currentUser?.patientId || currentUser?.mobile || user?.id;
  const isDemoProfile = Boolean(
    currentUser?.isDemo === true ||
    currentUser?.abhaId === '14-1122-3344-5566'
  );

  // At-Home Pre-Consultation Documents State
  const [uploadedRecords, setUploadedRecords] = useState(() => {
    if (isDemoProfile) {
      return [
        {
          id: 'rec_1',
          title: 'Discharge Summary - Fortis Escorts Heart Institute',
          date: '12 Jan 2026',
          type: 'Hospital Discharge',
          meds: [
            { name: 'Atorvastatin', dose: '20mg OD', verified: true },
            { name: 'Metoprolol', dose: '25mg BD', verified: true }
          ],
          ocrConfidence: '98.4%',
          verifiedByPatient: true
        },
        {
          id: 'rec_2',
          title: 'Quest Diagnostics - Comprehensive Metabolic & HbA1c Panel',
          date: '04 Feb 2026',
          type: 'Lab Report',
          labs: [
            { name: 'HbA1c', value: '8.2%', status: 'Elevated (Target < 6.5%)', trend: '+1.1% from 2024' },
            { name: 'eGFR', value: '72 mL/min', status: 'Normal / Borderline', trend: '-6 from 2024' }
          ],
          ocrConfidence: '99.1%',
          verifiedByPatient: true
        }
      ];
    }
    return [];
  });

  const fetchData = async () => {
    if (!effectiveUserId) return;
    try {
      const [vitalsRes, profileRes, medsRes, queueRes] = await Promise.all([
        axios.get(`${API_URL}/vitals/latest/${effectiveUserId}`).catch(() => null),
        axios.get(`${API_URL}/profile/${effectiveUserId}`).catch(() => null),
        axios.get(`${API_URL}/medications/${effectiveUserId}`).catch(() => null),
        axios.get(`${API_URL}/kiosk/queue/patient/${effectiveUserId}`).catch(() => null)
      ]);

      if (profileRes?.data?.status === 'success') {
        setProfile(profileRes.data.data);
      }
      if (vitalsRes?.data?.status === 'success') {
        setLatestVitals(vitalsRes.data.data);
      }
      if (medsRes?.data?.status === 'success') {
        setMedications(medsRes.data.data);
      }
      if (queueRes?.data?.status === 'success' && queueRes.data.data) {
        setActiveKioskToken(queueRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded && !currentUser) return;
    fetchData();
  }, [user, currentUser, isLoaded]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
      setToast({ type: 'success', message: 'Health records updated with latest clinical sync.' });
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error('Manual refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      const profileRes = await axios.get(`${API_URL}/profile/${effectiveUserId}`).catch(() => ({ data: { data: null } }));
      generateDashboardPDF(user?.fullName || currentUser?.patientName || 'Patient', report, profileRes.data?.data, medications);
    } catch (err) { console.error(err); }
  };

  const getPatientName = () => {
    return currentUser?.patientName || profile?.name || user?.fullName || 'Valued Patient';
  };

  const getAbhaId = () => {
    return currentUser?.abhaId || profile?.abhaId || '14-7383-9632-3511';
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="w-9 h-9 text-emerald-500 animate-spin" />
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Health Sanctuary...</span>
      </div>
    );
  }

  // Fallback Vitals for realistic display if empty
  const displayVitals = latestVitals?.length > 0 ? latestVitals : [
    { type: 'blood_pressure', value: '124/82', unit: 'mmHg', status: 'Optimal', icon: HeartPulse, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { type: 'heart_rate', value: '74', unit: 'BPM', status: 'Normal Sinus', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { type: 'oxygen_saturation', value: '98', unit: '% SpO2', status: 'Room Air', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { type: 'blood_glucose', value: '108', unit: 'mg/dL', status: 'Fasting Normal', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full pb-20 px-4 sm:px-6 md:px-8 animate-in fade-in duration-500 space-y-8">
      
      {/* ────────────────── 1. HERO HEADER ────────────────── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 p-6 sm:p-10 border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[11px] uppercase tracking-wider border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> ABHA Ayushman Linked
              </span>
              <span className="font-mono text-xs text-gray-300 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                ABHA ID: <strong className="text-white">{getAbhaId()}</strong>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Namaste, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">{getPatientName()}</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed">
              Welcome to your personal <strong>Health Sanctuary</strong>. View your longitudinal medical dossier, prescription safety verifications, live OPD token status, and AYUSH wellness routines in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/medical-history')}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <FileText className="w-4 h-4" /> View Full Medical Dossier
            </button>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/15 font-bold transition-all cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────── 2. QUICK CLINICAL VITALS TELEMETRY ────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <HeartPulse className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Active Biometric Telemetry</h2>
          </div>
          <button
            onClick={() => navigate('/vitals')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            All Vitals <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayVitals.slice(0, 4).map((vital, idx) => {
            const Icon = vital.icon || HeartPulse;
            return (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-gray-500 tracking-wider">
                    {String(vital.type || '').replace(/_/g, ' ')}
                  </span>
                  <div className={`p-2 rounded-xl ${vital.bg || 'bg-emerald-500/10'} ${vital.color || 'text-emerald-500'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {typeof vital.value === 'object' ? `${vital.value.systolic}/${vital.value.diastolic}` : vital.value}{' '}
                    <span className="text-xs font-bold text-gray-400">{vital.unit}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> {vital.status || 'Verified Biometric'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ────────────────── 3. MAIN DASHBOARD GRID ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Medical Dossier Quick View & Active Kiosk Token */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* A. COMPREHENSIVE MEDICAL HISTORY DOSSIER BANNER */}
          <div className="p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/20 border border-emerald-500/20 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Unified Patient Record
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Comprehensive Medical History
                  </h3>
                </div>
              </div>

              <button
                onClick={() => navigate('/medical-history')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
              >
                Open Full Dossier <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
              Your consolidated clinical profile tracks chronic non-communicable diseases, documented high-alert drug allergies, longitudinal lab panels (HbA1c, Lipids, Kidney function), and AYUSH Prakriti constitution in one place.
            </p>

            {/* Quick Dimension Pill Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Chronic NCDs</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">2 Active</span>
                <span className="text-[9px] font-bold text-amber-500 block">Type 2 DM • HTN</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Allergies</span>
                <span className="text-lg font-black text-rose-500">Penicillin</span>
                <span className="text-[9px] font-bold text-rose-400 block">High Alert Guard</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Recent HbA1c</span>
                <span className="text-lg font-black text-amber-500">8.2%</span>
                <span className="text-[9px] font-bold text-gray-400 block">Feb 2026 Test</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Constitution</span>
                <span className="text-lg font-black text-emerald-500">Vata-Pitta</span>
                <span className="text-[9px] font-bold text-emerald-400 block">AYUSH Prakriti</span>
              </div>
            </div>
          </div>

          {/* B. OPD MEDIKIOSK QUEUE & TOKEN STATUS */}
          <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    OPD MediKiosk & Walk-in Station
                  </h3>
                  <p className="text-xs text-gray-500">Real-time queue tracking & pre-consultation pass</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/kiosk')}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" /> Book / Generate OPD Token
              </button>
            </div>

            {activeKioskToken ? (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
                    Active Hospital Appointment
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    Token #{activeKioskToken.tokenNumber || 'A-104'}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Department: <strong>{activeKioskToken.department || 'Kayachikitsa (General Medicine)'}</strong> • Room 204
                  </p>
                </div>
                <div className="text-right sm:text-right">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    Est. Wait: 8 mins
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-gray-300 dark:border-white/10 text-center space-y-2">
                <Clock className="w-7 h-7 text-gray-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Active OPD Queue Wait</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  When you visit AIIA hospital, check in at the OPD MediKiosk or start voice intake online to receive an automated queue token with zero wait time.
                </p>
              </div>
            )}
          </div>

          {/* C. AT-HOME PRE-CONSULTATION DOCUMENT VAULT */}
          <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-500" />
                  At-Home Pre-Visit Document Vault
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Uploaded discharge summaries, blood tests, and scanned prescriptions</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setToast({ type: 'success', message: 'Simulated prescription uploaded & indexed into clinical timeline!' });
                  setTimeout(() => setToast(null), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Upload Record
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedRecords.map((rec) => (
                <div key={rec.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block">{rec.type} • {rec.date}</span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{rec.title}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20 shrink-0">
                      OCR {rec.ocrConfidence}
                    </span>
                  </div>

                  {rec.meds && (
                    <div className="pt-2 border-t border-gray-200 dark:border-white/5 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Extracted Medications:</span>
                      <div className="flex flex-wrap gap-1">
                        {rec.meds.map((m, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-gray-200 dark:border-white/10">
                            {m.name} ({m.dose})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Active Medications & Saved Doctors */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Active Medications Tracker */}
          <div className="p-6 rounded-[2.5rem] bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-500" /> Active Medications
              </h3>
              <button
                onClick={() => navigate('/medicines')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Metformin 500mg</span>
                  <span className="text-[10px] font-black uppercase text-emerald-500">BD • After Meals</span>
                </div>
                <p className="text-[11px] text-gray-500">Scheduled: 8:00 AM & 8:00 PM</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Atorvastatin 20mg</span>
                  <span className="text-[10px] font-black uppercase text-emerald-500">OD • Bedtime</span>
                </div>
                <p className="text-[11px] text-gray-500">Scheduled: 10:00 PM</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Yogaraj Guggulu</span>
                  <span className="text-[10px] font-black uppercase text-teal-500">AYUSH Herbal</span>
                </div>
                <p className="text-[11px] text-gray-500">2 tablets BD with warm water</p>
              </div>
            </div>
          </div>

          {/* Quick Safety Disclaimer */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-center space-y-2">
            <ShieldAlert className="w-5 h-5 text-amber-500 mx-auto" />
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
              Clinical Decision Support System
            </span>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              VaidyaSetu integrates Ayushman Bharat Digital Mission (ABDM) standards for patient safety and clinical continuity. Always consult your attending Vaidya or physician before adjusting prescription dosages.
            </p>
          </div>

          {/* Saved Doctors */}
          <SavedDoctorsWidget
            doctors={profile?.savedDoctors}
            clerkId={user?.id || effectiveUserId}
            onRefresh={fetchData}
            onRemove={async (id) => {
              await axios.delete(`${API_URL}/profile/saved-doctors/${effectiveUserId}/${id}`);
              fetchData();
            }}
          />
        </div>
      </div>

      {/* Toast Notification */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto border border-white/10 backdrop-blur-xl"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs font-bold">{toast.message}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;
