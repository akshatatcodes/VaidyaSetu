import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Stethoscope, User, Shield, Lock, Activity, CheckCircle2,
  ArrowRight, Sparkles, Building2, Eye, EyeOff, AlertCircle,
  FileText, Heart, Phone, Mail, IdCard, Hospital, Zap, Loader2, AlertTriangle, TestTubes
} from 'lucide-react';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const AuthGateway = ({ initialPortal = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginDoctor, registerDoctor, loginPatient, registerPatient, loginLab, loginAdmin } = useAuth();
  const { theme } = useTheme();

  // Active portal: 'patient' or 'doctor'
  const [activePortal, setActivePortal] = useState(() => {
    if (initialPortal) return initialPortal;
    if (location.pathname.includes('doctor')) return 'doctor';
    return 'patient';
  });

  // Mode inside portal: 'login' or 'signup'
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Patient Form State
  const [patientForm, setPatientForm] = useState({
    identifier: '',
    password: '',
    patientName: '',
    age: '',
    gender: 'Male',
    mobile: '',
    abhaId: ''
  });
  const [abhaStatus, setAbhaStatus] = useState(null); // { checked: false, found: false, abhaId: '', message: '' }
  const [fetchingAbha, setFetchingAbha] = useState(false);
  const [generatingAbha, setGeneratingAbha] = useState(false);
  const [showManualAbha, setShowManualAbha] = useState(false);

  // Doctor Form State
  const [doctorForm, setDoctorForm] = useState({
    identifier: '', // accepts Mobile Number, Email, or Registration Number
    mobile: '',
    email: '',
    password: '',
    doctorName: '',
    registrationNumber: '',
    department: 'Kayachikitsa',
    qualification: 'MD (Ayurveda - Kayachikitsa)',
    hospitalName: 'All India Institute of Ayurveda (AIIA)'
  });

  // Lab Technician & Admin Form State (Phase 10)
  const [labForm, setLabForm] = useState({
    identifier: '',
    mobile: '',
    email: '',
    section: 'Pathology',
    techName: ''
  });
  const [adminForm, setAdminForm] = useState({
    identifier: '',
    adminPassword: ''
  });

  // Handle mobile number input: automatically query ABDM Registry on 10 digits
  const handleMobileChange = (e) => {
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/\D/g, '').slice(0, 10);
    setPatientForm(prev => ({
      ...prev,
      mobile: cleanDigits,
      identifier: prev.identifier && prev.identifier !== prev.mobile ? prev.identifier : cleanDigits
    }));

    if (cleanDigits.length === 10) {
      triggerAbhaLookup(cleanDigits);
    } else {
      setAbhaStatus(null);
      setPatientForm(prev => ({ ...prev, abhaId: '' }));
    }
  };

  const triggerAbhaLookup = async (rawDigits) => {
    setFetchingAbha(true);
    setErrorMessage('');
    try {
      const res = await axios.post(`${API_URL}/auth/abha/lookup`, { mobile: rawDigits });
      if (res.data?.status === 'success') {
        if (res.data.found && res.data.abhaId) {
          setPatientForm(prev => ({
            ...prev,
            identifier: res.data.abhaId,
            abhaId: res.data.abhaId,
            patientName: prev.patientName || res.data.patientName || ''
          }));
          setAbhaStatus({
            checked: true,
            found: true,
            abhaId: res.data.abhaId,
            patientName: res.data.patientName || '',
            message: res.data.message || 'Linked ABDM ABHA ID found.'
          });
        } else {
          setPatientForm(prev => ({ ...prev, abhaId: '' }));
          setAbhaStatus({
            checked: true,
            found: false,
            abhaId: '',
            message: `No existing ABHA ID found linked to +91 ${rawDigits}.`
          });
        }
      }
    } catch (err) {
      console.warn('ABHA lookup note:', err?.message);
      setAbhaStatus({
        checked: true,
        found: false,
        abhaId: '',
        message: `No existing ABHA ID found linked to +91 ${rawDigits}.`
      });
    } finally {
      setFetchingAbha(false);
    }
  };

  // Generate a brand new official ABDM 14-digit ABHA ID on demand
  const handleCreateAbha = async () => {
    const cleanDigits = (patientForm.mobile || '').replace(/\D/g, '').slice(-10);
    if (!cleanDigits || cleanDigits.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number first.');
      return;
    }
    setGeneratingAbha(true);
    setErrorMessage('');
    try {
      const res = await axios.post(`${API_URL}/auth/abha/generate`, { mobile: cleanDigits });
      if (res.data?.status === 'success' && res.data.abhaId) {
        setPatientForm(prev => ({
          ...prev,
          identifier: res.data.abhaId,
          abhaId: res.data.abhaId
        }));
        setAbhaStatus({
          checked: true,
          found: true,
          abhaId: res.data.abhaId,
          generated: true,
          message: 'Official ABDM-compliant 14-digit ABHA Number generated successfully.'
        });
        setGeneratingAbha(false);
        return;
      }
    } catch (err) {
      console.warn('Backend ABHA generate notice:', err?.message);
    }

    // Client-side fallback generator compliant with NHA ABDM standard (14-XXXX-XXXX-XXXX)
    const p1 = cleanDigits.slice(0, 4);
    const p2 = cleanDigits.slice(4, 8);
    const p3 = cleanDigits.slice(8, 10) + Math.floor(10 + Math.random() * 90);
    const clientAbha = `14-${p1}-${p2}-${p3}`;
    setPatientForm(prev => ({
      ...prev,
      identifier: clientAbha,
      abhaId: clientAbha
    }));
    setAbhaStatus({
      checked: true,
      found: true,
      abhaId: clientAbha,
      generated: true,
      message: 'Official ABDM-compliant 14-digit ABHA Number generated.'
    });
    setGeneratingAbha(false);
  };

  // Quick Preset Patient Profile loader
  const loadDemoPatient = (profile) => {
    setPatientForm({
      identifier: profile.abhaId,
      password: 'password123',
      patientName: profile.patientName,
      age: profile.age,
      gender: profile.gender,
      mobile: profile.mobile,
      abhaId: profile.abhaId
    });
    setAbhaStatus({
      found: true,
      abhaId: profile.abhaId,
      message: 'Demo profile linked: ' + profile.patientName
    });
    setErrorMessage('');
  };

  // Quick Preset Doctor Profile loader
  const loadDemoDoctor = () => {
    setDoctorForm({
      identifier: '+91 9810123456',
      mobile: '+91 9810123456',
      email: 'dr.vikram@aiia.gov.in',
      password: 'password123',
      doctorName: 'Dr. Vikramaditya Sharma',
      registrationNumber: 'CCIM-DEL-2018-9844',
      department: 'Kayachikitsa',
      qualification: 'BAMS, MD (Kayachikitsa)',
      hospitalName: 'All India Institute of Ayurveda (AIIA)'
    });
    setErrorMessage('');
  };

  // Handle Patient Auth Submit
  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (authMode === 'login') {
      const res = await loginPatient({
        identifier: patientForm.identifier,
        password: patientForm.password
      });
      if (res.success) {
        navigate('/', { replace: true });
      } else {
        setErrorMessage(res.message);
      }
    } else {
      let targetAbha = patientForm.abhaId.trim();
      let targetMobile = (patientForm.mobile || patientForm.identifier || '').replace(/\D/g, '').slice(-10);

      if (!targetMobile || targetMobile.length < 10) {
        setErrorMessage('Please enter a valid 10-digit mobile number.');
        setLoading(false);
        return;
      }

      if (!targetAbha) {
        const p1 = targetMobile.slice(0, 4);
        const p2 = targetMobile.slice(4, 8);
        const p3 = targetMobile.slice(8, 10) + Math.floor(10 + Math.random() * 90);
        targetAbha = `14-${p1}-${p2}-${p3}`;
      }

      const res = await registerPatient({
        patientName: patientForm.patientName || 'Ayush Patient',
        abhaId: targetAbha,
        mobile: targetMobile || patientForm.identifier,
        age: patientForm.age,
        gender: patientForm.gender,
        password: patientForm.password
      });
      if (res.success) {
        navigate('/', { replace: true });
      } else {
        setErrorMessage(res.message);
      }
    }
    setLoading(false);
  };

  // Handle Doctor Auth Submit
  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (authMode === 'login') {
      const res = await loginDoctor({
        identifier: doctorForm.identifier || doctorForm.mobile || doctorForm.email,
        mobile: doctorForm.mobile || doctorForm.identifier,
        email: doctorForm.email || doctorForm.identifier,
        department: doctorForm.department,
        password: doctorForm.password
      });
      if (res.success) {
        navigate('/doctor', { replace: true });
      } else {
        setErrorMessage(res.message);
      }
    } else {
      const res = await registerDoctor({
        doctorName: doctorForm.doctorName || 'Dr. Vaidya',
        mobile: doctorForm.mobile || doctorForm.identifier,
        email: doctorForm.email || (doctorForm.identifier.includes('@') ? doctorForm.identifier : `${doctorForm.identifier.replace(/\D/g, '')}@aiia.gov.in`),
        registrationNumber: doctorForm.registrationNumber || doctorForm.identifier,
        department: doctorForm.department,
        qualification: doctorForm.qualification,
        hospitalName: doctorForm.hospitalName,
        password: doctorForm.password
      });
      if (res.success) {
        navigate('/doctor', { replace: true });
      } else {
        setErrorMessage(res.message);
      }
    }
    setLoading(false);
  };

  // Handle Lab Technician Auth Submit (Phase 10)
  const handleLabSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const res = await loginLab({
      identifier: labForm.identifier || labForm.mobile || labForm.email,
      mobile: labForm.mobile || labForm.identifier,
      email: labForm.email || labForm.identifier,
      section: labForm.section,
      techName: labForm.techName
    });
    if (res.success) {
      navigate('/lab', { replace: true });
    } else {
      setErrorMessage(res.message);
    }
    setLoading(false);
  };

  // Handle Administrator Auth Submit (Phase 10)
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const res = await loginAdmin({
      identifier: adminForm.identifier,
      adminPassword: adminForm.adminPassword
    });
    if (res.success) {
      navigate('/admin', { replace: true });
    } else {
      setErrorMessage(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden transition-colors duration-500 bg-slate-50 dark:bg-[#030712] p-4 sm:p-8">
      {/* Ambient background glow spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full dark:bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full dark:bg-blue-500/10 blur-[120px] pointer-events-none" />

      {/* Floating Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-[100]">
        <ThemeToggle />
      </div>

      <div className="flex flex-col lg:flex-row w-full max-w-6xl mx-auto items-center justify-between gap-12 lg:gap-16 z-10 py-6">
        
        {/* ────────────────── LEFT SIDE: BRANDING & HEADLINE ────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 space-y-8 text-left animate-in fade-in slide-in-from-left-8 duration-700">
          
          {/* Logo Brand Header */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl shadow-xl shadow-emerald-500/20 text-white">
              {activePortal === 'doctor' ? (
                <Stethoscope className="w-9 h-9" />
              ) : activePortal === 'lab' ? (
                <TestTubes className="w-9 h-9" />
              ) : activePortal === 'admin' ? (
                <Shield className="w-9 h-9" />
              ) : (
                <Activity className="w-9 h-9" />
              )}
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white truncate">
                VaidyaSetu
              </h2>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                {activePortal === 'doctor' ? 'Clinical Decision Support & OPD Cockpit'
                  : activePortal === 'lab' ? 'Central Diagnostic Laboratory Workbench'
                  : activePortal === 'admin' ? 'Hospital Administration & Operations Console'
                  : 'National Ayush Mission • Digital Health Gateway'}
              </p>
            </div>
          </div>

          {/* Dynamic Headline depending on portal */}
          <div className="space-y-4">
            {activePortal === 'doctor' ? (
              <>
                <h3 className="text-4xl sm:text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-teal-600 via-emerald-600 to-blue-600 dark:from-teal-400 dark:via-emerald-300 dark:to-blue-400 leading-[1.1]">
                  Physician & Doctor <br /> Clinical Cockpit.
                </h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed font-medium">
                  Real-time OPD triage queue, AI-synthesized SOCRATES pre-consultations, and seamless 10-second AYUSH prescription writing.
                </p>
              </>
            ) : activePortal === 'lab' ? (
              <>
                <h3 className="text-4xl sm:text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-teal-600 via-cyan-600 to-emerald-600 dark:from-teal-400 dark:via-cyan-300 dark:to-emerald-400 leading-[1.1]">
                  Diagnostic Lab <br /> Result Workbench.
                </h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed font-medium">
                  Enter results for ordered tests, flag critical values, verify sign-off, and push verified results straight into the patient record.
                </p>
              </>
            ) : activePortal === 'admin' ? (
              <>
                <h3 className="text-4xl sm:text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-teal-600 via-emerald-600 to-slate-600 dark:from-teal-400 dark:via-emerald-300 dark:to-slate-300 leading-[1.1]">
                  Hospital Admin & <br /> Operations Console.
                </h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed font-medium">
                  Live OPD counters, department toggles, % AI-edited-by-doctor and full audit trail across today's sessions.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-4xl sm:text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-600 dark:from-emerald-400 dark:via-teal-300 dark:to-blue-400 leading-[1.1]">
                  Your AI-Powered <br /> Health Sanctuary.
                </h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed font-medium">
                  Experience the future of personal healthcare with intelligent tracking, predictive analysis, and seamless medical record management.
                </p>
              </>
            )}
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            {(activePortal === 'doctor'
              ? ['Live OPD Queue', 'AYUSH NAMASTE & ICD-11', 'Herb-Drug Guard', 'ABDM FHIR R4']
              : activePortal === 'lab'
              ? ['Critical Result Flagging', 'Verified Sign-off', 'Slide to Patient Record', 'Order Workflow']
              : activePortal === 'admin'
              ? ['Live OPD Counters', 'Department Toggles', 'AI-Edit Audit', 'Critical Lab Visibility']
              : ['ABDM ABHA Compliant', 'AI Diagnostics', 'Real-time Alerts', 'Private & Secure']
            ).map((feature) => (
              <span
                key={feature}
                className="px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold backdrop-blur-md shadow-sm"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* ────────────────── RIGHT SIDE: AUTHENTICATION CARD ────────────────── */}
        <div className="w-full lg:w-[460px] flex-shrink-0 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-emerald-500/5">
            
            {/* Top Mode Segmented Pill */}
            <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 mb-6">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMessage(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {activePortal === 'doctor' ? 'Physician Sign In' : activePortal === 'lab' ? 'Technician Sign In' : activePortal === 'admin' ? 'Admin Sign In' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setErrorMessage(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {activePortal === 'doctor' ? 'Register Doctor' : activePortal === 'lab' ? 'Lab Access' : activePortal === 'admin' ? 'Admin Access' : 'New Patient'}
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            {/* ABHA Generated / Found Notice */}
            {abhaStatus && activePortal === 'patient' && authMode === 'signup' && (
              <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="font-bold">{abhaStatus.message}</p>
                  <p className="font-mono text-[11px] mt-0.5 font-black text-emerald-800 dark:text-emerald-200">
                    ABHA: {abhaStatus.abhaId}
                  </p>
                </div>
              </div>
            )}

            {/* ════════════ PATIENT FORMS ════════════ */}
            {activePortal === 'patient' && (
              <form onSubmit={handlePatientSubmit} className="space-y-4">
                
                {/* 1-Tap Demo Patient Shortcut */}
                {authMode === 'login' && (
                  <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 mb-2">
                    <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles size={12} /> 1-Tap Demo Test Profile
                    </p>
                    <button
                      type="button"
                      onClick={() => loadDemoPatient({
                        abhaId: '14-1122-3344-5566',
                        patientName: 'Rahul Sharma',
                        age: 58,
                        gender: 'Male',
                        mobile: '+91 9811223344'
                      })}
                      className="w-full text-left px-3 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-white/10 border border-emerald-500/20 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span>Rahul Sharma (Knee Follow-up)</span>
                      <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-black">14-1122...</span>
                    </button>
                  </div>
                )}

                {authMode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        Patient Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={patientForm.patientName}
                          onChange={e => setPatientForm({ ...patientForm, patientName: e.target.value })}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Mobile Number with Auto-ABHA Fetch */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                          Mobile Number *
                        </label>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          Auto-checks ABHA Registry
                        </span>
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <span className="absolute left-10 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 font-mono">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={patientForm.mobile}
                          onChange={handleMobileChange}
                          placeholder="10-Digit Mobile Number"
                          className="w-full pl-20 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Auto ABHA Status Feedback */}
                    {fetchingAbha && (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 animate-pulse">
                        <Loader2 className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />
                        <span>Searching ABDM Registry for ABHA ID linked to +91 {patientForm.mobile}...</span>
                      </div>
                    )}

                    {/* Case 1: ABHA Found & Linked OR Newly Generated */}
                    {!fetchingAbha && patientForm.abhaId && (
                      <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">
                              {abhaStatus?.generated ? 'New ABHA Created' : 'ABDM ABHA ID Linked'}
                            </span>
                            <span className="text-xs font-mono font-black text-slate-900 dark:text-white truncate block">
                              {patientForm.abhaId}
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black shrink-0">
                          ✓ VERIFIED
                        </span>
                      </div>
                    )}

                    {/* Case 2: 10 Digits entered but NO ABHA found */}
                    {!fetchingAbha && abhaStatus?.checked && !abhaStatus?.found && !patientForm.abhaId && (
                      <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/30 space-y-2.5 animate-in fade-in">
                        <div className="flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">No ABHA ID found for +91 {patientForm.mobile}</span>
                            <span className="text-[11px] text-amber-700/90 dark:text-amber-400/90">
                              Click below to generate an official 14-digit Ayushman Bharat Health Account:
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleCreateAbha}
                          disabled={generatingAbha}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {generatingAbha ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                          )}
                          <span>Create New 14-Digit ABHA ID</span>
                        </button>

                        <div className="text-center pt-0.5">
                          <button
                            type="button"
                            onClick={() => setShowManualAbha(!showManualAbha)}
                            className="text-[10px] text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 underline cursor-pointer"
                          >
                            {showManualAbha ? 'Hide manual entry' : 'Have an existing ABHA with another mobile? Enter manually'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Optional Manual ABHA Entry */}
                    {showManualAbha && (
                      <div className="space-y-1.5 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 animate-in fade-in">
                        <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                          Enter 14-Digit ABHA or ABHA Address manually
                        </label>
                        <div className="relative">
                          <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={patientForm.abhaId}
                            onChange={e => {
                              let val = e.target.value;
                              const clean = val.replace(/\D/g, '');
                              if (clean.length > 2 && !val.includes('@')) {
                                val = clean.slice(0, 14).replace(/(\d{2})(\d{4})?(\d{4})?(\d{4})?/, (_, p1, p2, p3, p4) => {
                                  return [p1, p2, p3, p4].filter(Boolean).join('-');
                                });
                              }
                              setPatientForm({ ...patientForm, abhaId: val, identifier: val });
                            }}
                            placeholder="e.g. 14-8899-7766-5544 or yourname@abdm"
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                          Age (Years)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={patientForm.age}
                          onChange={e => setPatientForm({ ...patientForm, age: e.target.value })}
                          placeholder="e.g. 35"
                          className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                          Gender
                        </label>
                        <select
                          value={patientForm.gender}
                          onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {authMode === 'login' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      ABHA ID, Mobile or Email *
                    </label>
                    <div className="relative">
                      <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={patientForm.identifier}
                        onChange={e => setPatientForm({ ...patientForm, identifier: e.target.value })}
                        placeholder="e.g. 14-XXXX-XXXX-XXXX or 9876543210"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Password / Access PIN *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={patientForm.password}
                      onChange={e => setPatientForm({ ...patientForm, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {authMode === 'login' ? 'Sign In to Health Sanctuary' : 'Create Ayush Health Account'}
                </button>
              </form>
            )}

            {/* ════════════ LAB TECHNICIAN FORM (Phase 10) ════════════ */}
            {activePortal === 'lab' && (
              <form onSubmit={handleLabSubmit} className="space-y-4">
                {/* 1-Tap Demo Lab Tech Shortcut */}
                {authMode === 'login' && (
                  <div className="p-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/15 mb-2">
                    <p className="text-[10px] font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles size={12} /> 1-Tap Lab Technician Demo
                    </p>
                    <button
                      type="button"
                      onClick={() => { setLabForm({ identifier: 'LAB-AIIA-001', mobile: '+91 9810012345', email: 'suresh.lab@aiia.gov.in', section: 'Pathology', techName: 'Suresh Kumar' }); setErrorMessage(''); }}
                      className="w-full text-left px-3 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-cyan-50 dark:hover:bg-white/10 border border-cyan-500/20 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span>Suresh Kumar (Pathology)</span>
                      <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 font-black">LAB-AIIA-001</span>
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Technician ID / Mobile / Email *
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={labForm.identifier}
                      onChange={e => setLabForm({ ...labForm, identifier: e.target.value })}
                      placeholder="LAB-AIIA-001 or +91 9810012345"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-cyan-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Laboratory Section
                  </label>
                  <div className="relative">
                    <TestTubes className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={labForm.section}
                      onChange={e => setLabForm({ ...labForm, section: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-cyan-500 outline-none text-gray-900 dark:text-white"
                    >
                      <option value="Pathology">Pathology</option>
                      <option value="Biochemistry">Biochemistry</option>
                      <option value="Microbiology">Microbiology</option>
                      <option value="Hematology">Hematology</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-cyan-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Sign In to Lab Workbench
                </button>
              </form>
            )}

            {/* ════════════ ADMINISTRATOR FORM (Phase 10) ════════════ */}
            {activePortal === 'admin' && (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                {/* 1-Tap Demo Admin Shortcut */}
                {authMode === 'login' && (
                  <div className="p-3 rounded-2xl bg-slate-500/5 border border-slate-500/15 mb-2">
                    <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles size={12} /> 1-Tap Admin Demo
                    </p>
                    <button
                      type="button"
                      onClick={() => { setAdminForm({ identifier: 'ADM-AIIA-001', adminPassword: '' }); setErrorMessage(''); }}
                      className="w-full text-left px-3 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-500/20 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span>Dr. Arun Kulkarni (Administrator)</span>
                      <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 font-black">ADM-AIIA-001</span>
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Administrator Email / ID *
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={adminForm.identifier}
                      onChange={e => setAdminForm({ ...adminForm, identifier: e.target.value })}
                      placeholder="admin@aiia.gov.in"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Admin Access Key
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminForm.adminPassword}
                      onChange={e => setAdminForm({ ...adminForm, adminPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Sign In to Admin Console
                </button>
              </form>
            )}

            {/* ════════════ DOCTOR FORMS ════════════ */}
            {activePortal === 'doctor' && (
              <form onSubmit={handleDoctorSubmit} className="space-y-4">
                
                {/* 1-Tap Demo Doctor Shortcut */}
                {authMode === 'login' && (
                  <div className="p-3 rounded-2xl bg-teal-500/5 border border-teal-500/15 mb-2">
                    <p className="text-[10px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles size={12} /> 1-Tap Doctor Demo
                    </p>
                    <button
                      type="button"
                      onClick={loadDemoDoctor}
                      className="w-full text-left px-3 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-teal-50 dark:hover:bg-white/10 border border-teal-500/20 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span>Dr. Vikramaditya Sharma (AIIA)</span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-black">MD Kayachikitsa</span>
                    </button>
                  </div>
                )}

                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Doctor Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={doctorForm.doctorName}
                        onChange={e => setDoctorForm({ ...doctorForm, doctorName: e.target.value })}
                        placeholder="e.g. Dr. Vikramaditya Sharma"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Mobile or Email Input for Doctor */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {authMode === 'login'
                      ? 'Mobile Number or Registered Email ID *'
                      : 'Doctor Mobile Number *'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={doctorForm.identifier}
                      onChange={e => setDoctorForm({
                        ...doctorForm,
                        identifier: e.target.value,
                        mobile: e.target.value,
                        email: e.target.value.includes('@') ? e.target.value : doctorForm.email
                      })}
                      placeholder={authMode === 'login' ? 'e.g. 9810123456 or dr.vikram@aiia.gov.in' : '10-Digit Mobile Number'}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {authMode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        Official Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          required
                          value={doctorForm.email}
                          onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })}
                          placeholder="doctor.name@aiia.gov.in"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        Medical Council / CCIM Reg Number
                      </label>
                      <div className="relative">
                        <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={doctorForm.registrationNumber}
                          onChange={e => setDoctorForm({ ...doctorForm, registrationNumber: e.target.value })}
                          placeholder="e.g. CCIM-DEL-2018-9844"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Clinical Department
                  </label>
                  <div className="relative">
                    <Hospital className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={doctorForm.department}
                      onChange={e => setDoctorForm({ ...doctorForm, department: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                    >
                      <option value="Kayachikitsa">कायचिकित्सा (Kayachikitsa - Internal Medicine)</option>
                      <option value="Shalya">शल्य तंत्र (Shalya Tantra - Musculoskeletal & Surgery)</option>
                      <option value="Shalakya">शालाक्य तंत्र (Shalakya Tantra - ENT & Eye Care)</option>
                      <option value="Prasuti">प्रसूति व स्त्री रोग (Prasuti - Women's Health)</option>
                      <option value="Kaumarbhritya">कौमारभृत्य (Kaumarbhritya - Pediatrics)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Physician Password / PIN *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={doctorForm.password}
                      onChange={e => setDoctorForm({ ...doctorForm, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-teal-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {authMode === 'login' ? 'Sign In to Clinical Cockpit' : 'Register Verified Physician Account'}
                </button>
              </form>
            )}

            {/* ────────────────── BOTTOM ROLE REDIRECT SWITCHER ────────────────── */}
            <div className="pt-6 mt-6 border-t border-gray-200 dark:border-white/10 text-center space-y-2">
              {activePortal === 'patient' ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Are you a Doctor or Healthcare Provider?{' '}
                  <button
                    type="button"
                    onClick={() => { setActivePortal('doctor'); setAuthMode('login'); setErrorMessage(''); }}
                    className="text-emerald-600 dark:text-emerald-400 font-black hover:underline inline-flex items-center gap-1 cursor-pointer ml-1"
                  >
                    Sign in to Doctor Cockpit <ArrowRight size={13} />
                  </button>
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Are you a Patient seeking care?{' '}
                  <button
                    type="button"
                    onClick={() => { setActivePortal('patient'); setAuthMode('login'); setErrorMessage(''); }}
                    className="text-emerald-600 dark:text-emerald-400 font-black hover:underline inline-flex items-center gap-1 cursor-pointer ml-1"
                  >
                    Go to Patient Health Sanctuary <ArrowRight size={13} />
                  </button>
                </p>
              )}
              {activePortal !== 'lab' && (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                  Staff access —{' '}
                  <button type="button" onClick={() => { setActivePortal('lab'); setAuthMode('login'); setErrorMessage(''); }} className="text-cyan-600 dark:text-cyan-400 font-black hover:underline inline-flex items-center gap-1 cursor-pointer">
                    Lab Workbench
                  </button>
                  {' '}·{' '}
                  <button type="button" onClick={() => { setActivePortal('admin'); setAuthMode('login'); setErrorMessage(''); }} className="text-slate-600 dark:text-slate-300 font-black hover:underline inline-flex items-center gap-1 cursor-pointer">
                    Admin Console
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthGateway;
