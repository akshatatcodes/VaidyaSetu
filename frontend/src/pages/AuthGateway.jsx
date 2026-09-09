import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Stethoscope, User, Shield, Lock, Activity, CheckCircle2,
  ArrowRight, Sparkles, Building2, Eye, EyeOff, AlertCircle,
  FileText, Heart, Phone, Mail, IdCard, Hospital, Zap, Loader2, AlertTriangle, TestTubes,
  Plus, Users, Link as LinkIcon
} from 'lucide-react';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const AuthGateway = ({ initialPortal = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginDoctor, registerDoctor, loginPatient, loginPatientSession, registerPatient, loginLab, loginAdmin } = useAuth();
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

  // Compliant Identity & ABHA Flow State (§2 Diagram & §48)
  const [otpStep, setOtpStep] = useState('request'); // 'request' | 'verify' | 'family_select'
  const [otpMobile, setOtpMobile] = useState('');
  const [otpCode, setOtpCode] = useState('123456');
  const [otpToken, setOtpToken] = useState(null);
  const [familyProfiles, setFamilyProfiles] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    fullName: '',
    age: '',
    gender: 'Male',
    relation: 'Spouse',
    bloodGroup: 'Unknown'
  });
  const [linkingAbhaFor, setLinkingAbhaFor] = useState(null);
  const [inputAbhaVal, setInputAbhaVal] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const cleanDigits = otpMobile.replace(/\D/g, '').slice(-10);
    if (!cleanDigits || cleanDigits.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await axios.post(`${API_URL}/auth/otp/request`, { mobile: cleanDigits });
      if (res.data?.status === 'success') {
        setOtpStep('verify');
      } else {
        setErrorMessage(res.data?.message || 'Failed to send OTP');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const cleanDigits = otpMobile.replace(/\D/g, '').slice(-10);
      const res = await axios.post(`${API_URL}/auth/otp/verify`, { mobile: cleanDigits, otp: otpCode });
      if (res.data?.status === 'success') {
        const { token, familyMembers, user } = res.data.data;
        setOtpToken(token);

        // Query linked family members for this mobile number/userId
        const famRes = await axios.get(`${API_URL}/patients/family-members/${cleanDigits}`);
        const profiles = (famRes.data?.data && famRes.data.data.length > 0) ? famRes.data.data : (familyMembers || []);
        setFamilyProfiles(profiles);
        setOtpStep('family_select');
      } else {
        setErrorMessage(res.data?.message || 'OTP Verification failed');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFamilyProfile = (profile) => {
    const patientObj = profile.patient || profile;
    loginPatientSession(patientObj, otpToken || 'dev_token');
    navigate('/', { replace: true });
  };

  const handleAddFamilyMember = async (e) => {
    e.preventDefault();
    if (!newMember.fullName || !newMember.age) {
      setErrorMessage('Full name and age are required.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const cleanDigits = otpMobile.replace(/\D/g, '').slice(-10);
      const res = await axios.post(`${API_URL}/patients/family-member`, {
        userId: cleanDigits,
        fullName: newMember.fullName,
        relation: newMember.relation,
        age: Number(newMember.age),
        gender: newMember.gender,
        bloodGroup: newMember.bloodGroup
      });
      if (res.data?.status === 'success') {
        const famRes = await axios.get(`${API_URL}/patients/family-members/${cleanDigits}`);
        setFamilyProfiles(famRes.data?.data || []);
        setShowAddMember(false);
        setNewMember({ fullName: '', age: '', gender: 'Male', relation: 'Spouse', bloodGroup: 'Unknown' });
      } else {
        setErrorMessage(res.data?.message || 'Failed to register beneficiary profile');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error registering beneficiary profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAbhaRequest = async (patientId) => {
    if (!inputAbhaVal) {
      setErrorMessage('Please enter a 14-digit ABHA ID or ABHA address');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await axios.post(`${API_URL}/abha/link-request`, {
        patientId,
        abhaId: inputAbhaVal
      });
      if (res.data?.status === 'success' || res.status === 202) {
        setLinkingAbhaFor(null);
        setInputAbhaVal('');
        const cleanDigits = otpMobile.replace(/\D/g, '').slice(-10);
        const famRes = await axios.get(`${API_URL}/patients/family-members/${cleanDigits}`);
        setFamilyProfiles(famRes.data?.data || []);
      } else {
        setErrorMessage(res.data?.message || 'ABHA link request failed');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error submitting ABHA link request');
    } finally {
      setLoading(false);
    }
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

            {/* ════════════ PATIENT FORMS (§2 Diagram & §48 Compliant Identity Flow) ════════════ */}
            {activePortal === 'patient' && (
              <div className="space-y-4">
                
                {/* 1-Tap Demo Patient Shortcut */}
                {otpStep === 'request' && (
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

                {/* ── STEP 1: MOBILE OTP REQUEST ── */}
                {otpStep === 'request' && (
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                          Mobile Phone Number (§2 Head-of-Account) *
                        </label>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          6-Digit SMS Verification
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
                          value={otpMobile}
                          onChange={e => setOtpMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="10-Digit Mobile Number"
                          className="w-full pl-20 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      <span>Send Verification OTP</span>
                    </button>
                  </form>
                )}

                {/* ── STEP 2: VERIFY OTP ── */}
                {otpStep === 'verify' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">OTP sent to: <strong>+91 {otpMobile}</strong></span>
                      <button
                        type="button"
                        onClick={() => setOtpStep('request')}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        Enter 6-Digit Verification OTP (Dev Default: 123456) *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-mono tracking-widest font-black focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Verify OTP & Load Profiles</span>
                    </button>
                  </form>
                )}

                {/* ── STEP 3: FAMILY MEMBER / BENEFICIARY SELECTION (§2 Diagram & §48) ── */}
                {otpStep === 'family_select' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-white">
                          Select Beneficiary Profile
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Linked to +91 {otpMobile} (§2 Mobile Head-of-Account)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpStep('request')}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        Switch Mobile
                      </button>
                    </div>

                    {/* Family Members List */}
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {familyProfiles.map((item, idx) => {
                        const pat = item.patient || item;
                        const patId = pat._id || pat.patientId;
                        const isLinking = linkingAbhaFor === patId;
                        const hasAbha = Boolean(pat.abhaId || pat.abhaAddress);
                        const linkStatus = pat.abhaLinkStatus || (hasAbha ? 'linked' : 'unlinked');

                        return (
                          <div
                            key={patId || idx}
                            className="p-3.5 bg-gray-50 dark:bg-white/5 hover:bg-emerald-50/60 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl transition-all space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                                  {(pat.basicInfo?.fullName || pat.patientName || 'P')[0]}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-gray-900 dark:text-white truncate">
                                      {pat.basicInfo?.fullName || pat.patientName || 'Beneficiary'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-black uppercase">
                                      {item.relation || pat.relationshipToHead || 'Self'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-2 font-medium">
                                    <span>{pat.basicInfo?.age || pat.age || '30'} yrs • {pat.basicInfo?.gender || pat.gender || 'Male'}</span>
                                    {hasAbha && (
                                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                        ABHA: {pat.abhaId || pat.abhaAddress}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSelectFamilyProfile(item)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <span>Select</span>
                                <ArrowRight size={12} />
                              </button>
                            </div>

                            {/* ABHA Link Intent Status / Button */}
                            <div className="pt-1 border-t border-gray-200/60 dark:border-white/5 flex items-center justify-between text-[10px]">
                              {linkStatus === 'pending_abdm_flow' ? (
                                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                  <AlertTriangle size={10} /> Pending ABDM M1/M2 OTP Linkage
                                </span>
                              ) : hasAbha ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 size={10} /> ABHA Linked
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => { setLinkingAbhaFor(isLinking ? null : patId); setInputAbhaVal(''); }}
                                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <LinkIcon size={10} /> Link ABHA Number (§2)
                                </button>
                              )}
                            </div>

                            {/* Inline ABHA Input Form */}
                            {isLinking && (
                              <div className="pt-2 space-y-2 animate-in fade-in">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={inputAbhaVal}
                                    onChange={e => setInputAbhaVal(e.target.value)}
                                    placeholder="Enter 14-digit ABHA or ABHA address"
                                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-white/15 rounded-xl text-xs font-mono outline-none text-gray-900 dark:text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleLinkAbhaRequest(patId)}
                                    disabled={loading}
                                    className="px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-500 cursor-pointer"
                                  >
                                    Submit Link Intent
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* "+ Add New Beneficiary Profile" Action */}
                    {!showAddMember ? (
                      <button
                        type="button"
                        onClick={() => setShowAddMember(true)}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-2xl transition-all border border-dashed border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>+ Add New Beneficiary Profile (§2)</span>
                      </button>
                    ) : (
                      <form onSubmit={handleAddFamilyMember} className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3 animate-in fade-in">
                        <h5 className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                          Register New Family Beneficiary Profile
                        </h5>
                        <div className="space-y-2">
                          <input
                            type="text"
                            required
                            value={newMember.fullName}
                            onChange={e => setNewMember({ ...newMember, fullName: e.target.value })}
                            placeholder="Beneficiary Full Name *"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-medium outline-none text-gray-900 dark:text-white"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="number"
                              required
                              value={newMember.age}
                              onChange={e => setNewMember({ ...newMember, age: e.target.value })}
                              placeholder="Age *"
                              className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none text-gray-900 dark:text-white"
                            />
                            <select
                              value={newMember.gender}
                              onChange={e => setNewMember({ ...newMember, gender: e.target.value })}
                              className="px-2 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none text-gray-900 dark:text-white"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                            <select
                              value={newMember.relation}
                              onChange={e => setNewMember({ ...newMember, relation: e.target.value })}
                              className="px-2 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none text-gray-900 dark:text-white"
                            >
                              <option value="Spouse">Spouse</option>
                              <option value="Child">Child</option>
                              <option value="Parent">Parent</option>
                              <option value="Sibling">Sibling</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddMember(false)}
                            className="px-3 py-1.5 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                          >
                            Save Beneficiary Profile
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

              </div>
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
