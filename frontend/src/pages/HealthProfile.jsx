import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import {
  Scale, Activity, Utensils, AlertTriangle,
  History, Edit3, ArrowRight, CheckCircle2, Clock,
  Heart, Wind, Brain, Venus, X, Zap, Shield,
  Cigarette, Wine, Salad, Apple, TrendingUp, RefreshCw, Download
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
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

const bmiColor = (bmi) => {
  if (!bmi || isNaN(bmi) || bmi <= 0) return '#6b7280';
  if (bmi < 18.5) return '#60a5fa';
  if (bmi < 25)   return '#10b981';
  if (bmi < 30)   return '#f59e0b';
  return '#f87171';
};

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

const RingGauge = ({ value = 0, max = 100, color = '#10b981', size = 120, label }) => {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const numericValue = parseFloat(value);
  const fill = isNaN(numericValue) ? circ : circ * (1 - Math.min(numericValue, max) / max);
  
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={isNaN(fill) ? circ : fill}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-white text-xl leading-none">{isNaN(numericValue) ? '—' : value}</span>
        {label && <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{label}</span>}
      </div>
    </div>
  );
};

const Pill = ({ label, active, color = 'emerald' }) => {
  const palettes = {
    emerald: active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-white/3 text-gray-600 border-white/8 line-through',
    fuchsia: active ? 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30' : 'bg-white/3 text-gray-600 border-white/8 line-through',
    blue:    active ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'           : 'bg-white/3 text-gray-600 border-white/8 line-through',
    red:     active ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-white/3 text-gray-600 border-white/8 line-through',
    sky:     active ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-white/3 text-gray-600 border-white/8 line-through',
  };
  return (
    <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${palettes[color] ?? palettes.emerald}`}>
      {label}
    </span>
  );
};

const StatRow = ({ label, value, unit = '', highlight = false }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
    <span className="text-xs font-bold text-slate-400 dark:text-gray-500">{label}</span>
    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-lg ${
      highlight ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-gray-100'
    }`}>
      {value !== null && value !== undefined && value !== '' ? `${value}${unit ? ' ' + unit : ''}` : '—'}
    </span>
  </div>
);

const Card = ({ children, accent = '#10b981', className = '' }) => (
  <div
    className={`relative rounded-3xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/4 backdrop-blur-xl overflow-hidden
      hover:-translate-y-1 hover:border-emerald-500/30 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-500 group ${className}`}
  >
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-3xl"
      style={{ boxShadow: `inset 0 0 60px ${accent}18` }}
    />
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, title, iconColor, lastUpdated }) => (
  <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-white/6">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl" style={{ background: `${iconColor}15` }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">{title}</h3>
    </div>
    {lastUpdated && (
      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
        <Clock size={10} /> {getRelativeTime(lastUpdated) || '—'}
      </div>
    )}
  </div>
);

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
const HealthProfile = () => {
  const { user } = useUser();
  const { t } = useTranslation();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [dataQuality, setDataQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(location.state?.toast || null);

  useEffect(() => {
    if (user) {
      axios.get(`${API_URL}/profile/${user.id}`)
        .then(res => {
          if (res.data.status === 'success') {
            setProfile(res.data.data);
            setDataQuality(res.data.dataQuality);
          } else {
            setError(t('profile.errors.failed_load', { defaultValue: 'Failed to synchronize bio-ledger.' }));
          }
        })
        .catch(err => {
          console.error('Error fetching profile:', err);
          setError(t('profile.errors.connection', { defaultValue: 'Gateway connection failed.' }));
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading || !profile) return (
    <div className="flex items-center justify-center min-h-[60vh] bg-transparent">
      <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
    </div>
  );

  const bmiRaw = profile?.bmi?.value;
  const bmi = (bmiRaw && !isNaN(parseFloat(bmiRaw))) ? parseFloat(bmiRaw).toFixed(1) : null;
  const bmiCat = profile?.bmiCategory?.value || '';
  const qualityScore = dataQuality?.score || 0;
  const dqLabel = (dataQuality?.label || 'Basic').toLowerCase();
  const isFemale = profile?.gender?.value?.toString().toLowerCase() === 'female';
  
  const getInitials = () => {
    try {
      const rawName = profile?.name?.value || user?.fullName || 'User';
      if (!rawName || typeof rawName !== 'string') return 'U';
      const parts = rawName.split(' ').filter(Boolean);
      return parts.length > 0 ? parts.map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U';
    } catch (e) { return 'U'; }
  };
  const initials = getInitials();

  return (
    <div className="max-w-7xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ── Toast ── */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-8 fade-in duration-300">
          <div className="bg-emerald-950/95 border border-emerald-500/40 backdrop-blur-xl px-6 py-3 rounded-full shadow-[0_8px_40px_rgba(16,185,129,0.35)] flex items-center gap-3">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-white font-semibold text-sm">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 text-emerald-400 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── HERO BANNER ── */}
      <div className="relative rounded-[2.5rem] overflow-hidden mb-8 border border-slate-200 dark:border-white/10 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-white/5 backdrop-blur-3xl group transition-all duration-500">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 dark:opacity-20 transition-transform duration-700 group-hover:scale-150"
            style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }} />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full opacity-5 dark:opacity-10"
            style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
        </div>

        <div className="relative z-10 p-8 lg:p-12 flex flex-col md:flex-row md:items-center gap-8">
          <div className="relative flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={profile?.name?.value || user?.fullName || 'User'}
                className="w-24 h-24 rounded-3xl object-cover border-4 border-white dark:border-white/10 shadow-2xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black text-white border-4 border-white dark:border-white/10 shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
                {initials}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                {t('profile.title', { defaultValue: 'Bio-Ledger' })}
              </span>
              {dataQuality?.label && (
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                  dataQuality.label === 'Excellent' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : dataQuality.label === 'Good' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}>
                  {t(`profile.quality_${dqLabel}`, { defaultValue: dataQuality.label })} {t('profile.profile_label', { defaultValue: 'Profile' })}
                </span>
              )}
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 italic uppercase leading-none">
              {profile?.name?.value || user?.fullName || t('profile.errors.no_profile', { defaultValue: 'Legacy Entity' })}
            </h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm max-w-lg leading-relaxed font-semibold">
              {t('profile.health_overview_subtitle', { defaultValue: 'Real-time overview of your foundational health metrics.' })}
            </p>
          </div>

          <div className="flex flex-col gap-3 flex-shrink-0 w-full md:w-auto">
            <button onClick={() => window.print()} className="flex justify-center items-center gap-2 px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-all uppercase tracking-widest text-[10px] shadow-sm">
              <Download size={16} className="text-emerald-500" /> {t('profile.export_profile', { defaultValue: 'Export Data' })}
            </button>
            <Link to="/profile/edit"
              className="flex justify-center items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.4)] transition-all active:scale-95 uppercase tracking-widest text-[10px]">
              <Edit3 size={16} /> {t('profile.edit_profile', { defaultValue: 'Edit Ledger' })}
            </Link>
          </div>
        </div>
      </div>

      {/* ── DATA QUALITY BANNER ── */}
      {dataQuality && (
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 lg:p-10 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500 mb-8">
          <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none group-hover:scale-[1.2] transition-transform duration-700"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
            <RingGauge value={qualityScore} max={100} color="#10b981" size={112} label="Quality" />
            <div className="flex-1">
               <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                  dataQuality?.label === 'Excellent' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                  dataQuality?.label === 'Good' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  {t(`profile.quality_${dqLabel}`, { defaultValue: dataQuality.label })} {t('profile.profile_label', { defaultValue: 'Profile' })}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{t('profile.data_quality', { defaultValue: 'Bio-Data Quality' })}</h2>
              <p className="text-slate-500 dark:text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed font-semibold">
                {dataQuality?.message || t('profile.action.update_stats', { defaultValue: 'Complete your bio-matrix for deeper AI assessment.' })}
              </p>
            </div>
            {/* Mini progress bars */}
            <div className="flex flex-col gap-2 min-w-[180px]">
              {[
                { label: t('profile.identity', { defaultValue: 'Biometrics' }), pct: profile?.weight?.value ? 100 : 40 },
                { label: t('profile.vitals_summary', { defaultValue: 'Vital Trends' }), pct: profile?.activityLevel?.value ? 100 : 30 },
                { label: t('profile.diet_nutrition', { defaultValue: 'Nutrition Matrix' }), pct: profile?.dietType?.value ? 100 : 30 },
              ].map(bar => (
                <div key={bar.label}>
                  <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    <span>{bar.label}</span><span>{bar.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                      style={{ width: `${bar.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {/* 1. Biometrics */}
        <Card accent="#10b981">
          <CardHeader icon={Scale} title={t('profile.identity', { defaultValue: 'Biometrics' })} iconColor="#10b981" lastUpdated={profile?.weight?.lastUpdated} />
          <div className="px-6 py-5 flex gap-5 items-center">
            {bmi && (
              <div className="flex-shrink-0 text-center">
                <RingGauge
                  value={bmi}
                  max={40}
                  color={bmiColor(parseFloat(bmi))}
                  size={84}
                  label="BMI"
                />
                <p className="text-[10px] font-bold mt-1.5" style={{ color: bmiColor(parseFloat(bmi)) }}>
                  {bmiCat}
                </p>
              </div>
            )}
            <div className="flex-1">
              <StatRow label={t('profile.labels.height', { defaultValue: 'Height' })} value={profile?.height?.value} unit="cm" />
              <StatRow label={t('profile.labels.weight', { defaultValue: 'Weight' })} value={profile?.weight?.value} unit="kg" />
              <StatRow label={t('profile.labels.age', { defaultValue: 'Age' })} value={profile?.age?.value} unit="yrs" />
              <StatRow label={t('profile.labels.gender', { defaultValue: 'Gender' })} value={profile?.gender?.value} />
            </div>
          </div>
        </Card>

        {/* 2. Lifestyle */}
        <Card accent="#8b5cf6">
          <CardHeader icon={Activity} title={t('profile.vitals_summary', { defaultValue: 'Vital Trends' })} iconColor="#8b5cf6" lastUpdated={profile?.activityLevel?.lastUpdated} />
          <div className="px-6 py-5 space-y-1">
            <StatRow label={t('profile.labels.activity', { defaultValue: 'Activity' })} value={profile?.activityLevel?.value} />
            <StatRow label={t('profile.labels.sleep_quality', { defaultValue: 'Sleep' })} value={profile?.sleepHours?.value} unit="hrs" />
            <StatRow label={t('profile.labels.stress', { defaultValue: 'Stress' })} value={profile?.stressLevel?.value} />
            <div className="flex gap-2 pt-3 flex-wrap">
              <Pill label={profile?.isSmoker?.value ? t('profile.values.smoking_pill', { defaultValue: '🚬 Smoker' }) : t('profile.values.non_smoker', { defaultValue: '🚭 Non-Smoker' })}
                active={!profile?.isSmoker?.value} color="emerald" />
              <Pill label={`${t('profile.labels.alcohol', { defaultValue: 'Alcohol' })}: ${profile?.alcoholConsumption?.value || '—'}`}
                active={!!(profile?.alcoholConsumption?.value)} color="blue" />
            </div>
          </div>
        </Card>

        {/* 3. Diet */}
        <Card accent="#f59e0b">
          <CardHeader icon={Utensils} title={t('profile.diet_nutrition', { defaultValue: 'Nutrition Matrix' })} iconColor="#f59e0b" lastUpdated={profile?.dietType?.lastUpdated} />
          <div className="px-6 py-5 space-y-1">
            <StatRow label={t('profile.labels.diet_type', { defaultValue: 'Diet Type' })} value={profile?.dietType?.value} highlight />
            <StatRow label={t('profile.labels.sugar', { defaultValue: 'Sugar' })} value={profile?.sugarIntake?.value} />
            <StatRow label={t('profile.labels.salt', { defaultValue: 'Salt' })} value={profile?.saltIntake?.value} />
            <StatRow label={t('profile.labels.junk_food', { defaultValue: 'Junk Food' })} value={profile?.junkFoodFrequency?.value} />
            <div className="flex gap-2 pt-3 flex-wrap">
              <Pill label="🥬 Leafy Greens" active={!!profile?.eatsLeafyGreens?.value} color="emerald" />
              <Pill label="🍎 Daily Fruits" active={!!profile?.eatsFruits?.value} color="emerald" />
            </div>
          </div>
        </Card>

        {/* 4. Women's Health (conditional) */}
        {isFemale && (
          <Card accent="#e879f9">
            <CardHeader icon={Venus} title={t('profile.womens_health', { defaultValue: "Women's Health" })} iconColor="#e879f9" lastUpdated={profile?.pcosDiagnosis?.lastUpdated} />
            <div className="px-6 py-5">
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3">Reported Indicators</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'menstrualCycleIrregular', label: 'Irregular Cycles' },
                  { id: 'facialBodyHairExcess',    label: 'Excess Hair Growth' },
                  { id: 'persistentAcne',           label: 'Persistent Acne' },
                  { id: 'tryingToConceiveDifficulty', label: 'Conception Difficulty' },
                  { id: 'pcosDiagnosis',            label: 'PCOS Diagnosis' },
                ].map(item => (
                  <Pill key={item.id} label={item.label} active={!!profile?.[item.id]?.value} color="fuchsia" />
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* 5. Respiratory */}
        <Card accent="#38bdf8">
          <CardHeader icon={Wind} title={t('profile.respiratory', { defaultValue: "Respiratory" })} iconColor="#38bdf8" lastUpdated={profile?.wheezing?.lastUpdated} />
          <div className="px-6 py-5">
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3">Reported Indicators</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'wheezing',          label: 'Wheezing' },
                { id: 'persistentCough',   label: 'Persistent Cough' },
                { id: 'shortnessBreath',   label: 'Shortness of Breath' },
                { id: 'highPollutionArea', label: 'High Pollution Area' },
                { id: 'biomassFuelUse',    label: 'Biomass Fuel Use' },
                { id: 'seasonalAllergies', label: 'Seasonal Allergies' },
              ].map(item => (
                <Pill key={item.id} label={item.label} active={!!profile?.[item.id]?.value} color="blue" />
              ))}
            </div>
          </div>
        </Card>

        {/* 6. Mental Wellbeing */}
        <Card accent="#6ee7b7">
          <CardHeader icon={Brain} title={t('profile.mental_health', { defaultValue: "Mental Wellbeing" })} iconColor="#6ee7b7" lastUpdated={profile?.mentalHealthDepressed?.lastUpdated} />
          <div className="px-6 py-5">
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3">🔒 Strictly Confidential</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'mentalHealthDepressed',  label: 'Feeling Depressed' },
                { id: 'lostInterestActivities', label: 'Loss of Interest' },
                { id: 'mentalHealthAnxiety',    label: 'Anxiety / On Edge' },
                { id: 'energyLevelsLow',        label: 'Low Energy / Fatigue' },
              ].map(item => (
                <Pill key={item.id} label={item.label} active={!!profile?.[item.id]?.value} color="emerald" />
              ))}
            </div>
          </div>
        </Card>

        {/* 7. Allergies & Medical */}
        <Card accent="#f87171">
          <CardHeader icon={AlertTriangle} title={t('profile.allergies_medical', { defaultValue: 'Alerts & History' })} iconColor="#f87171" lastUpdated={profile?.allergies?.lastUpdated} />
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">{t('profile.labels.allergies', { defaultValue: 'Known Allergies' })}</p>
              <div className="flex flex-wrap gap-2">
                {profile?.allergies?.value?.length > 0
                  ? profile.allergies.value.map(a => <Pill key={a} label={a} active color="red" />)
                  : <span className="text-xs text-gray-600 italic">{t('profile.values.none', { defaultValue: 'No known allergies' })}</span>}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">{t('profile.labels.conditions', { defaultValue: 'Medical Conditions' })}</p>
              <div className="flex flex-wrap gap-2">
                {profile?.medicalHistory?.value?.length > 0
                  ? profile.medicalHistory.value.map(c => <Pill key={c} label={c} active color="sky" />)
                  : <span className="text-xs text-gray-600 italic">{t('profile.values.no_history', { defaultValue: 'No records reported' })}</span>}
              </div>
            </div>
            {profile?.otherConditions?.value && (
              <div className="border-t border-white/6 pt-3">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">{t('profile.labels.obs_title', { defaultValue: 'Observations' })}</p>
                <p className="text-xs text-gray-400 italic leading-relaxed">"{profile.otherConditions.value}"</p>
              </div>
            )}
          </div>
        </Card>

        {/* 8. CTA Card */}
        <Card accent="#10b981" className="md:col-span-2 xl:col-span-1">
          <div className="relative overflow-hidden h-full min-h-[200px]"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #047857 100%)' }}>
            <div className="absolute -top-8 -right-8 opacity-[0.12] pointer-events-none">
              <TrendingUp size={180} className="text-white" />
            </div>
            <div className="relative z-10 p-8 flex flex-col h-full justify-between">
              <div>
                <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center mb-4">
                  <Zap size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">{t('profile.action.checkup', { defaultValue: 'Diagnostics' })}</h3>
                <p className="text-emerald-100/80 text-sm leading-relaxed">
                  {profile?.createdAt
                    ? `${t('profile.action.report_generated', { defaultValue: 'Ledger initialized' })} ${getRelativeTime(profile.createdAt) || 'some time ago'}. ${t('profile.action.update_stats', { defaultValue: 'Keep syncing your matrix.' })}`
                    : t('profile.action.update_stats', { defaultValue: 'Sync your data for AI assessment.' })}
                </p>
              </div>
              <Link to="/"
                className="mt-6 flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur border border-white/20 text-white font-bold py-3 rounded-2xl transition-all active:scale-95 text-sm">
                {t('profile.action.go_dashboard', { defaultValue: 'Dashboard' })} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Dedicated Contextual Observations Section - Center Aligned */}
      {profile?.otherConditions?.value && (
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 lg:p-12 text-center animate-in zoom-in duration-500 shadow-xl group hover:border-emerald-500/30 transition-all mt-8">
           <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform">
              <History size={24} />
           </div>
           <h3 className="text-xs text-gray-400 uppercase tracking-[0.3em] font-black mb-4">{t('profile.labels.obs_title', { defaultValue: 'Clinical Context' })}</h3>
          <p className="text-xl md:text-2xl text-white font-black italic max-w-4xl mx-auto leading-relaxed">
            "{profile.otherConditions.value}"
          </p>
          <div className="mt-8 flex justify-center">
             <div className="h-1 w-12 bg-emerald-500/30 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthProfile;
