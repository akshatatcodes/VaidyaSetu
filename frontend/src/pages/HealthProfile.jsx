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
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</span>
      {sourceTag && sourceTag !== 'Not reported' && (
        <span className="text-[9px] text-emerald-400/80 font-mono px-1 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          {sourceTag}
        </span>
      )}
    </div>
    <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${
      highlight && value && value !== 'Not reported'
        ? 'bg-emerald-500/15 text-emerald-400' 
        : 'bg-gray-200/50 dark:bg-white/5 text-gray-900 dark:text-gray-100'
    }`}>
      {value !== null && value !== undefined && value !== '' ? `${value}${unit ? ' ' + unit : ''}` : 'Not reported'}
    </span>
  </div>
);

const Card = ({ children, accent = '#10b981', className = '' }) => (
  <div
    className={`relative rounded-3xl border border-white/8 bg-white/4 backdrop-blur-xl overflow-hidden
      hover:-translate-y-1 hover:border-white/15 hover:shadow-2xl transition-all duration-500 group ${className}`}
  >
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-3xl"
      style={{ boxShadow: `inset 0 0 60px ${accent}18` }}
    />
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, title, iconColor, lastUpdated }) => (
  <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/6">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl" style={{ background: `${iconColor}20` }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{title}</h3>
    </div>
    {lastUpdated && (
      <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
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
      // Fallback to profile route if not found in patient collection
      try {
        const profRes = await axios.get(`${API_URL}/profile/${targetId}`);
        if (profRes.data.status === 'success') {
          const p = profRes.data.data;
          setPatient({
            _id: p.clerkId,
            basicInfo: {
              fullName: p.name?.value || currentUser?.patientName || 'Patient',
              age: p.age?.value || 30,
              gender: p.gender?.value || 'Male',
              contactNumber: p.phone?.value || '',
              bloodGroup: 'Unknown'
            },
            healthProfile: {
              allergies: (p.allergies?.value || []).map(a => ({ substance: a, sourceTag: 'Patient reported' })),
              existingDiseases: (p.medicalHistory?.value || []).map(d => ({ condition: d, sourceTag: 'Patient reported' })),
              personalHistory: { smoking: 'Not reported', alcohol: 'Not reported', diet: 'Not reported' }
            },
            ayushProfile: { prakriti: 'Not reported', vikriti: 'Not reported', ahara: 'Not reported', vihara: 'Not reported', agni: 'Not reported', koshtha: 'Not reported' }
          });
        }
      } catch (fErr) {
        console.error('Fallback profile load error:', fErr);
        setError('Patient health record not found.');
      }
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
    loadPatientData(selectedPatientId);
  }, [selectedPatientId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] bg-transparent">
      <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
    </div>
  );

  const basic = patient?.basicInfo || {};
  const health = patient?.healthProfile || {};
  const ayush = patient?.ayushProfile || {};

  return (
    <div className="max-w-7xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
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
      <div className="relative rounded-[2.5rem] overflow-hidden mb-8 border border-white/8 p-8 lg:p-12"
        style={{ background: theme === 'dark' 
          ? 'linear-gradient(135deg, #0a0f1e 0%, #0d1a12 50%, #0a0f1e 100%)' 
          : 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #f0f9ff 100%)' 
        }}>
        
        {/* Family Member Switcher Pill Header */}
        {familyMembers.length > 0 && (
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mr-2">
              <Users size={14} className="text-teal-400" /> Beneficiary:
            </span>
            <button
              onClick={() => setSelectedPatientId(currentUser?.patientId || currentUser?.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPatientId === (currentUser?.patientId || currentUser?.id)
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              Self ({currentUser?.patientName || 'Primary'})
            </button>
            {familyMembers.map(fm => (
              <button
                key={fm.familyMemberId}
                onClick={() => setSelectedPatientId(fm.patient?._id || fm.patientId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedPatientId === (fm.patient?._id || fm.patientId)
                    ? 'bg-teal-500 text-slate-950 shadow-md'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {fm.patient?.basicInfo?.fullName || 'Family Member'} ({fm.relation})
              </button>
            ))}
          </div>
        )}

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black text-white border border-emerald-500/30 shrink-0"
            style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
            {(basic.fullName || 'P').slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                Normalized Patient Record (§4)
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-1 italic uppercase">
              {basic.fullName || 'Patient Profile'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {basic.age} Yrs &bull; {basic.gender} &bull; Blood Group: <span className="text-emerald-400 font-bold">{basic.bloodGroup || 'Unknown'}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <Link to="/profile/edit"
              className="flex justify-center items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-all">
              <Edit3 size={15} /> Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {/* 1. Basic Info */}
        <Card accent="#10b981">
          <CardHeader icon={Scale} title="Basic Info" iconColor="#10b981" />
          <div className="px-6 py-5 space-y-1">
            <StatRow label="Full Name" value={basic.fullName} />
            <StatRow label="Age" value={basic.age} unit="yrs" />
            <StatRow label="Gender" value={basic.gender} />
            <StatRow label="Blood Group" value={basic.bloodGroup} highlight />
            <StatRow label="Contact" value={basic.contactNumber} />
          </div>
        </Card>

        {/* 2. Medical Conditions */}
        <Card accent="#38bdf8">
          <CardHeader icon={AlertTriangle} title="Medical Conditions" iconColor="#38bdf8" />
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Existing Diseases</p>
              <div className="flex flex-wrap gap-2">
                {health.existingDiseases?.length > 0 ? (
                  health.existingDiseases.map((d, idx) => (
                    <Pill key={idx} label={d.condition || d} color="blue" sourceTag={d.sourceTag || 'Patient reported'} />
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">Not reported</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Known Allergies</p>
              <div className="flex flex-wrap gap-2">
                {health.allergies?.length > 0 ? (
                  health.allergies.map((a, idx) => (
                    <Pill key={idx} label={a.substance || a} color="red" sourceTag={a.sourceTag || 'Patient reported'} />
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">Not reported</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 3. AYUSH Dashavidha Profile */}
        <Card accent="#f59e0b">
          <CardHeader icon={Utensils} title="AYUSH Dashavidha Matrix" iconColor="#f59e0b" />
          <div className="px-6 py-5 space-y-1">
            <StatRow label="Prakriti (Constitution)" value={ayush.prakriti} highlight />
            <StatRow label="Vikriti (Morbidity)" value={ayush.vikriti} />
            <StatRow label="Ahara (Diet Pattern)" value={ayush.ahara} />
            <StatRow label="Vihara (Lifestyle)" value={ayush.vihara} />
            <StatRow label="Agni (Digestive Capacity)" value={ayush.agni} />
            <StatRow label="Koshtha (Bowel Habits)" value={ayush.koshtha} />
          </div>
        </Card>

        {/* 4. Personal History */}
        <Card accent="#8b5cf6">
          <CardHeader icon={Activity} title="Personal & Family History" iconColor="#8b5cf6" />
          <div className="px-6 py-5 space-y-1">
            <StatRow label="Smoking Habit" value={health.personalHistory?.smoking} />
            <StatRow label="Alcohol Consumption" value={health.personalHistory?.alcohol} />
            <StatRow label="Diet Pattern" value={health.personalHistory?.diet} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HealthProfile;
