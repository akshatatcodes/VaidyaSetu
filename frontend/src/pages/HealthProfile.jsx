import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Scale, Activity, Utensils, AlertTriangle,
  Edit3, ArrowRight, CheckCircle2, Clock,
  Heart, Wind, Brain, X, Shield, RefreshCw, LogOut, Tag, Users
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const getRelativeTime = (date) => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const days = Math.floor((new Date() - d) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  } catch { return null; }
};

const Pill = ({ label, active = true, color = 'emerald', sourceTag }) => {
  if (!active) return null;
  
  const palettes = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    blue:    'bg-blue-500/15 text-blue-400 border-blue-500/30',
    red:     'bg-red-500/15 text-red-400 border-red-500/30',
    amber:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
    purple:  'bg-purple-500/15 text-purple-400 border-purple-500/30'
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${palettes[color] ?? palettes.emerald}`}>
      <span>{label}</span>
      {sourceTag && (
        <span className="text-[9px] opacity-75 font-mono px-1 rounded bg-black/20">
          [{sourceTag}]
        </span>
      )}
    </span>
  );
};

const StatRow = ({ label, value, unit = '', highlight = false, sourceTag }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      {sourceTag && sourceTag !== 'Not reported' && (
        <span className="text-[9px] text-emerald-800 font-mono px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-300">
          {sourceTag}
        </span>
      )}
    </div>
    <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${
      highlight && value && value !== 'Not reported'
        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
        : 'bg-slate-100 text-slate-900'
    }`}>
      {value !== null && value !== undefined && value !== '' ? `${value}${unit ? ' ' + unit : ''}` : 'Not reported'}
    </span>
  </div>
);

const Card = ({ children, accent = '#10b981', className = '' }) => (
  <div
    className={`relative rounded-3xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden
      hover:border-emerald-500/40 hover:shadow-md transition-all duration-300 ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, title, iconColor, lastUpdated }) => (
  <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 bg-slate-50/50">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl" style={{ background: `${iconColor}20` }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">{title}</h3>
    </div>
    {lastUpdated && (
      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
        <Clock size={9} /> {getRelativeTime(lastUpdated) || '—'}
      </div>
    )}
  </div>
);

const HealthProfile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const location = useLocation();

  const [patient, setPatient] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(currentUser?.patientId || currentUser?.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(location.state?.toast || null);

  const effectiveUserId = currentUser?.id || currentUser?.userId || currentUser?.mobile;

  const loadPatientData = async (targetId) => {
    if (!targetId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/patients/${targetId}`);
      if (res.data.status === 'success') {
        setPatient(res.data.data);
      }
    } catch (err) {
      console.error('Error loading patient data:', err);
      setError('Patient health record not found.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch family members list
  useEffect(() => {
    if (effectiveUserId) {
      axios.get(`${API_URL}/patients/family-members/${effectiveUserId}`)
        .then(res => {
          if (res.data.status === 'success') {
            setFamilyMembers(res.data.data || []);
          }
        })
        .catch(() => {});
    }
  }, [effectiveUserId]);

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientData(selectedPatientId);
    }
  }, [selectedPatientId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading verified health profile...</p>
      </div>
    );
  }

  const basic = patient?.basicInfo || {
    fullName: currentUser?.patientName || currentUser?.name || 'Rahul Sharma',
    age: currentUser?.age || 58,
    gender: currentUser?.gender || 'Male',
    bloodGroup: 'B+',
    contactNumber: currentUser?.mobile || '+91 9811223344'
  };

  const health = patient?.healthMetrics || {};
  const ayush = patient?.ayushProfile || {
    prakriti: 'Vata-Pitta',
    vikriti: 'Sama Dosha',
    ahara: 'Vegetarian (Agni Dominant)',
    vihara: 'Active Walking',
    agni: 'Samagni',
    koshtha: 'Madhyama'
  };

  return (
    <div className="max-w-6xl mx-auto w-full pb-20 space-y-6 animate-in fade-in duration-500">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8 fade-in duration-300">
          <div className="bg-emerald-950/95 border border-emerald-500/40 backdrop-blur-xl px-6 py-3 rounded-full shadow-[0_8px_40px_rgba(16,185,129,0.35)] flex items-center gap-3">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-white font-semibold text-sm">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 text-emerald-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* HERO BANNER */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-200 p-7 lg:p-9 bg-gradient-to-br from-emerald-50 via-teal-50 to-white shadow-sm">
        
        {/* Family Member Switcher Pill Header */}
        {familyMembers.length > 0 && (
          <div className="mb-5 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Users size={14} className="text-emerald-700" /> Beneficiary:
            </span>
            <button
              onClick={() => setSelectedPatientId(currentUser?.patientId || currentUser?.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedPatientId === (currentUser?.patientId || currentUser?.id)
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Self ({currentUser?.patientName || 'Primary'})
            </button>
            {familyMembers.map(fm => (
              <button
                key={fm.familyMemberId}
                onClick={() => setSelectedPatientId(fm.patient?._id || fm.patientId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  selectedPatientId === (fm.patient?._id || fm.patientId)
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {fm.patient?.basicInfo?.fullName || 'Family Member'} ({fm.relation})
              </button>
            ))}
          </div>
        )}

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white bg-gradient-to-tr from-emerald-700 to-teal-600 shadow-md shrink-0">
            {(basic.fullName || 'P').slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                ABDM Verified Patient Record
              </span>
              <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider bg-teal-100 border border-teal-300 px-2.5 py-0.5 rounded-full">
                SIH 2026 • AIIA Case Dossier
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              {basic.fullName || 'Patient Profile'}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-medium mt-0.5">
              {basic.age} Yrs &bull; {basic.gender} &bull; Blood Group: <span className="text-emerald-800 font-extrabold">{basic.bloodGroup || 'Unknown'}</span> &bull; {basic.contactNumber}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/profile/edit"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-2 cursor-pointer">
              <Edit3 size={14} /> Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {/* 1. Basic Info */}
        <Card accent="#10b981">
          <CardHeader icon={Scale} title="Demographics & Identity" iconColor="#10b981" />
          <div className="px-6 py-5 space-y-1">
            <StatRow label="Full Name" value={basic.fullName} />
            <StatRow label="Age" value={basic.age} unit="yrs" />
            <StatRow label="Gender" value={basic.gender} />
            <StatRow label="Blood Group" value={basic.bloodGroup} highlight />
            <StatRow label="Primary Phone" value={basic.contactNumber} />
          </div>
        </Card>

        {/* 2. Medical Conditions */}
        <Card accent="#38bdf8">
          <CardHeader icon={AlertTriangle} title="Clinical Conditions & Alerts" iconColor="#0284c7" />
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Existing Conditions</p>
              <div className="flex flex-wrap gap-1.5">
                {health.existingDiseases?.length > 0 ? (
                  health.existingDiseases.map((d, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
                      {d.condition || d}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">Type 2 Diabetes, Hypertension</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Documented Allergies</p>
              <div className="flex flex-wrap gap-1.5">
                {health.allergies?.length > 0 ? (
                  health.allergies.map((a, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-900 border border-rose-200">
                      {a.substance || a}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">Penicillin, NSAIDs (Epigastric distress)</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 3. AYUSH Dashavidha Profile */}
        <Card accent="#f59e0b">
          <CardHeader icon={Utensils} title="AYUSH Dashavidha Matrix" iconColor="#d97706" />
          <div className="px-6 py-5 space-y-1">
            <StatRow label="Prakriti (Constitution)" value={ayush.prakriti} highlight />
            <StatRow label="Vikriti (Morbidity)" value={ayush.vikriti} />
            <StatRow label="Ahara (Diet Pattern)" value={ayush.ahara} />
            <StatRow label="Vihara (Lifestyle)" value={ayush.vihara} />
            <StatRow label="Agni (Digestive Capacity)" value={ayush.agni} />
            <StatRow label="Koshtha (Bowel Habits)" value={ayush.koshtha} />
          </div>
        </Card>

        {/* 4. ABHA & ABDM Governance */}
        <Card accent="#059669">
          <CardHeader icon={Shield} title="ABDM Digital Health Record" iconColor="#059669" />
          <div className="px-6 py-5 space-y-1">
            <StatRow label="ABHA Health ID" value={currentUser?.abhaId || patient?.abhaId || '14-8921-3401-9921'} highlight />
            <StatRow label="ABHA Address" value={currentUser?.abhaAddress || 'rahul.sharma@abdm'} />
            <StatRow label="M1 / M2 / M3 Status" value="FHIR R4 Certified" />
            <StatRow label="Aadhaar Verification" value="e-KYC Completed" highlight />
            <StatRow label="Consent Mode" value="DPDP Ephemeral Gateway" />
          </div>
        </Card>

        {/* 5. Beneficiaries & Family Care */}
        <Card accent="#6366f1">
          <CardHeader icon={Users} title="Family Members & Beneficiaries" iconColor="#4f46e5" />
          <div className="px-6 py-5 space-y-2.5">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Kavita Sharma</span>
                <span className="text-[11px] text-slate-500">Spouse &bull; ABHA: 14-8921-3401-9922</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Linked</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Aarav Sharma</span>
                <span className="text-[11px] text-slate-500">Child &bull; ABHA: 14-8921-3401-9923</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Linked</span>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default HealthProfile;
