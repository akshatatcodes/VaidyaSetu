import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';
import {
  Scale, Activity, Utensils, AlertTriangle,
  ChevronDown, ChevronUp, X, Info, CheckCircle2,
  HeartPulse, RefreshCw, Brain, Venus, Wind, Save,
  ArrowLeft, Shield, Zap
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

import { API_URL } from '../config/api';

const ALLERGY_OPTIONS = [
  { value: 'Dust Mites', label: 'Dust Mites' },
  { value: 'Pollen (Parthenium)', label: 'Pollen (Parthenium)' },
  { value: 'Peanuts', label: 'Peanuts' },
  { value: 'Dairy (Lactose)', label: 'Dairy (Lactose)' },
  { value: 'Wheat (Gluten)', label: 'Wheat (Gluten)' },
  { value: 'Sulfa Drugs', label: 'Sulfa Drugs' },
  { value: 'Penicillin', label: 'Penicillin' },
];

const CONDITION_OPTIONS = [
  'Type 2 Diabetes', 'Hypertension', 'Thyroid Disorders',
  'Asthma', 'Heart Disease', 'PCOS', 'Anemia'
];

const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: state.isFocused ? '#10b981' : 'rgba(255,255,255,0.1)',
    borderRadius: '0.75rem', padding: '4px', color: 'white',
    boxShadow: 'none', '&:hover': { borderColor: 'rgba(255,255,255,0.2)' }
  }),
  menu: (base) => ({
    ...base, backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.75rem', zIndex: 200
  }),
  option: (base, state) => ({
    ...base, backgroundColor: state.isFocused ? '#059669' : 'transparent',
    color: 'white', '&:active': { backgroundColor: '#10b981' }
  }),
  multiValue: (base) => ({
    ...base, backgroundColor: 'rgba(16,185,129,0.12)', borderRadius: '0.5rem',
    border: '1px solid rgba(16,185,129,0.25)'
  }),
  multiValueLabel: (base) => ({ ...base, color: '#10b981' }),
  multiValueRemove: (base) => ({
    ...base, color: '#10b981',
    '&:hover': { backgroundColor: 'rgba(16,185,129,0.2)', color: '#34d399' }
  }),
  input: (base) => ({ ...base, color: 'white' }),
  placeholder: (base) => ({ ...base, color: '#6b7280' }),
};

/* ─── Section config ─── */
const SECTIONS = [
  { key: 'biometrics', label: 'Biometrics',             icon: Scale,      accent: '#10b981' },
  { key: 'lifestyle',  label: 'Lifestyle',              icon: Activity,   accent: '#8b5cf6' },
  { key: 'diet',       label: 'Diet & Nutrition',       icon: Utensils,   accent: '#f59e0b' },
  { key: 'womens',     label: "Women's Health",         icon: Venus,      accent: '#e879f9' },
  { key: 'respiratory',label: 'Respiratory',            icon: Wind,       accent: '#38bdf8' },
  { key: 'mental',     label: 'Mental Wellbeing',       icon: Brain,      accent: '#6ee7b7' },
  { key: 'medical',    label: 'Medical Archive',        icon: HeartPulse, accent: '#f87171' },
];

/* ─── Reusable sub-components ─── */
const SectionCard = ({ sectionKey, label, icon: Icon, accent, open, onToggle, children }) => (
  <div className="rounded-3xl border border-white/8 bg-white/4 backdrop-blur overflow-hidden transition-all duration-300"
    style={{ boxShadow: open ? `0 0 30px ${accent}12` : 'none' }}>
    <button type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-5 md:p-6 text-left group">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl transition-all" style={{ background: `${accent}18` }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
        <span className="text-sm font-black text-white uppercase tracking-widest">{label}</span>
      </div>
      <div className="p-1.5 rounded-xl bg-white/5 text-gray-600 group-hover:text-gray-300 transition-colors">
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </div>
    </button>
    {open && (
      <div className="px-5 md:px-6 pb-6 border-t border-white/6 pt-5 space-y-6 animate-in slide-in-from-top-2 duration-200">
        {children}
      </div>
    )}
  </div>
);

const FieldLabel = ({ children }) => (
  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{children}</p>
);

const TextInput = ({ value, onChange, type = 'text', placeholder = '' }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-semibold text-sm
      focus:border-emerald-500 focus:bg-white/8 outline-none transition-all placeholder:text-gray-700"
  />
);

const ChipGroup = ({ options, value, onChange, accent = '#10b981' }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => {
      const isSelected = value === opt.value;
      return (
        <button key={String(opt.value)} type="button" onClick={() => onChange(opt.value)}
          className="px-4 py-2.5 rounded-xl border text-sm font-bold transition-all"
          style={isSelected
            ? { background: `${accent}20`, borderColor: accent, color: accent }
            : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}>
          {opt.label}
        </button>
      );
    })}
  </div>
);

const ToggleRow = ({ label, desc, checked, onChange, accent = '#10b981' }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={`w-full flex items-start p-4 rounded-2xl border transition-all text-left`}
    style={checked
      ? { background: `${accent}12`, borderColor: `${accent}50` }
      : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
    <div className="p-1.5 rounded-xl mr-3 mt-0.5 flex-shrink-0 transition-all"
      style={checked ? { background: accent, color: '#fff' } : { background: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
      {checked ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-bold text-sm" style={{ color: checked ? accent : '#d1d5db' }}>{label}</div>
      {desc && <div className="text-[10px] text-gray-600 mt-0.5 leading-relaxed">{desc}</div>}
    </div>
    {checked && <CheckCircle2 size={15} className="ml-2 flex-shrink-0 mt-0.5" style={{ color: accent }} />}
  </button>
);

const YesNoToggle = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-white/4 border border-white/8 rounded-2xl">
    <span className="text-sm font-semibold text-gray-300">{label}</span>
    <div className="flex gap-2">
      <button type="button" onClick={() => onChange(true)}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all text-sm font-bold ${value ? 'bg-emerald-600 text-white' : 'bg-white/5 text-gray-600'}`}>
        ✓
      </button>
      <button type="button" onClick={() => onChange(false)}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all text-sm ${!value ? 'bg-gray-700 text-white' : 'bg-white/5 text-gray-600'}`}>
        <X size={14} />
      </button>
    </div>
  </div>
);

/* ─── Main component ─── */
const ProfileEditor = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const hasLoadedInitial = useRef(false);

  const [formData, setFormData] = useState({
    name: '', age: '', gender: '', height: '', weight: '',
    activityLevel: '', sleepHours: '', stressLevel: '', isSmoker: false, alcoholConsumption: '',
    dietType: '', sugarIntake: '', saltIntake: '', junkFoodFrequency: '', eatsLeafyGreens: false, eatsFruits: false,
    menstrualCycleIrregular: false, facialBodyHairExcess: false, persistentAcne: false,
    tryingToConceiveDifficulty: false, pcosDiagnosis: false,
    wheezing: false, persistentCough: false, shortnessBreath: false,
    highPollutionArea: false, biomassFuelUse: false, seasonalAllergies: false,
    mentalHealthDepressed: false, lostInterestActivities: false,
    mentalHealthAnxiety: false, energyLevelsLow: false,
    allergies: [], medicalHistory: [], otherConditions: ''
  });

  const [errors, setErrors] = useState({});
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [intentData, setIntentData] = useState({ intent: 'real_change', notes: '', changeDate: new Date().toISOString() });
  const [sections, setSections] = useState({ biometrics: true, lifestyle: false, diet: false, womens: false, respiratory: false, mental: false, medical: false });

  useEffect(() => {
    if (user && !hasLoadedInitial.current) {
      axios.get(`${API_URL}/profile/${user.id}`)
        .then(res => {
          if (res.data.status === 'success' && !hasLoadedInitial.current) {
            const p = res.data.data;
            setProfile(p);
            setFormData({
              name: p.name?.value || '', age: p.age?.value || '',
              gender: p.gender?.value || '', height: p.height?.value || '', weight: p.weight?.value || '',
              activityLevel: p.activityLevel?.value || '', sleepHours: p.sleepHours?.value || '',
              stressLevel: p.stressLevel?.value || '', isSmoker: p.isSmoker?.value || false,
              alcoholConsumption: p.alcoholConsumption?.value || '', dietType: p.dietType?.value || '',
              sugarIntake: p.sugarIntake?.value || '', saltIntake: p.saltIntake?.value || '',
              junkFoodFrequency: p.junkFoodFrequency?.value || '',
              eatsLeafyGreens: p.eatsLeafyGreens?.value || false, eatsFruits: p.eatsFruits?.value || false,
              menstrualCycleIrregular: p.menstrualCycleIrregular?.value || false,
              facialBodyHairExcess: p.facialBodyHairExcess?.value || false,
              persistentAcne: p.persistentAcne?.value || false,
              tryingToConceiveDifficulty: p.tryingToConceiveDifficulty?.value || false,
              pcosDiagnosis: p.pcosDiagnosis?.value || false,
              wheezing: p.wheezing?.value || false, persistentCough: p.persistentCough?.value || false,
              shortnessBreath: p.shortnessBreath?.value || false,
              highPollutionArea: p.highPollutionArea?.value || false,
              biomassFuelUse: p.biomassFuelUse?.value || false,
              seasonalAllergies: p.seasonalAllergies?.value || false,
              mentalHealthDepressed: p.mentalHealthDepressed?.value || false,
              lostInterestActivities: p.lostInterestActivities?.value || false,
              mentalHealthAnxiety: p.mentalHealthAnxiety?.value || false,
              energyLevelsLow: p.energyLevelsLow?.value || false,
              allergies: p.allergies?.value || [], medicalHistory: p.medicalHistory?.value || [],
              otherConditions: p.otherConditions?.value || ''
            });
            hasLoadedInitial.current = true;
          }
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const toggleSection = (s) => setSections(prev => ({ ...prev, [s]: !prev[s] }));
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) { const e = { ...errors }; delete e[field]; setErrors(e); }
  };

  const validate = () => {
    const e = {};
    if (!formData.age || Number(formData.age) < 1) e.age = 'Invalid';
    if (!formData.height || Number(formData.height) < 50) e.height = 'Invalid';
    if (!formData.weight || Number(formData.weight) < 20) e.weight = 'Invalid';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleInitialSave = (e) => {
    e.preventDefault();
    if (!validate()) { alert('Please correct Biometrics entries.'); return; }
    setShowIntentModal(true);
  };

  const handleFinalSave = async () => {
    setSaving(true);
    try {
      const updates = {};
      Object.keys(formData).forEach(key => {
        const oldVal = profile[key]?.value;
        const newVal = formData[key];
        const processed = ['age', 'height', 'weight'].includes(key) ? (newVal === '' ? 0 : Number(newVal)) : newVal;
        if (JSON.stringify(oldVal) !== JSON.stringify(processed)) updates[key] = processed;
      });
      const response = await axios.post(`${API_URL}/profile/update`, {
        clerkId: user.id, updates, intent: intentData.intent,
        notes: intentData.notes, changeDate: intentData.changeDate
      });
      if (response.data.status === 'success') {
         await axios.post(`${API_URL}/reports/hybrid-assessment`, { clerkId: user.id, persist: true }).catch(() => null);
         await axios.post(`${API_URL}/ai/generate-report`, { clerkId: user.id }).catch(() => null);
         window.dispatchEvent(new CustomEvent('vaidya-profile-updated'));
         navigate('/profile', { state: { toast: 'Your questionnaire-based risk scores and insights have been refreshed.' } });
      }
    } catch { alert('Save failed. Please try again.'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Accessing Bio-Ledger…</p>
      </div>
    </div>
  );

  const isFemale = formData.gender?.toLowerCase() === 'female';
  const completedSections = SECTIONS.filter(s => {
    if (s.key === 'biometrics') return formData.age && formData.height && formData.weight;
    if (s.key === 'lifestyle')  return formData.activityLevel;
    if (s.key === 'diet')       return formData.dietType;
    return true;
  }).length;

  return (
    <div className="max-w-7xl mx-auto w-full pb-20 animate-in fade-in duration-500">

      {/* ── HEADER ── */}
      <div className="relative rounded-[2rem] overflow-hidden mb-8 border border-white/8 p-7 md:p-8"
        style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #061310 60%, #0a0f1e 100%)' }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }} />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex-1">
            <Link to="/profile"
              className="inline-flex items-center gap-1.5 text-[10px] font-black text-gray-600 hover:text-emerald-400 transition-colors mb-4 uppercase tracking-widest">
              <ArrowLeft size={11} /> Back to Profile
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <Shield size={15} className="text-emerald-400" />
              </div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Secure Update</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
              Matrix <span className="text-emerald-400">Update</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Synchronize your health parameters with the core archive.</p>
          </div>
          <Link to="/profile" className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/8 rounded-2xl text-gray-500 hover:text-white transition-all flex-shrink-0">
            <X size={18} />
          </Link>
        </div>

        {/* Progress bar */}
        <div className="relative z-10 mt-6">
          <div className="flex justify-between text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">
            <span>Profile Completion</span>
            <span className="text-emerald-400">{completedSections}/{SECTIONS.length} Sections</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${(completedSections / SECTIONS.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* ── SECTIONS ── */}
      <div className="space-y-3">

        {/* 1. Biometrics */}
        <SectionCard sectionKey="biometrics" label="Biometrics" icon={Scale} accent="#10b981"
          open={sections.biometrics} onToggle={() => toggleSection('biometrics')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Age (years)</FieldLabel>
              <TextInput type="number" value={formData.age} onChange={e => updateField('age', e.target.value)} />
              {errors.age && <p className="text-red-400 text-[10px] mt-1 ml-1">Invalid age</p>}
            </div>
            <div>
              <FieldLabel>Biological Gender</FieldLabel>
              <ChipGroup
                options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]}
                value={formData.gender} onChange={v => updateField('gender', v)} />
            </div>
            <div>
              <FieldLabel>Height (cm)</FieldLabel>
              <TextInput type="number" value={formData.height} onChange={e => updateField('height', e.target.value)} />
              {errors.height && <p className="text-red-400 text-[10px] mt-1 ml-1">Invalid height</p>}
            </div>
            <div>
              <FieldLabel>Weight (kg)</FieldLabel>
              <TextInput type="number" value={formData.weight} onChange={e => updateField('weight', e.target.value)} />
              {errors.weight && <p className="text-red-400 text-[10px] mt-1 ml-1">Invalid weight</p>}
            </div>
          </div>
        </SectionCard>

        {/* 2. Lifestyle */}
        <SectionCard sectionKey="lifestyle" label="Lifestyle & Habits" icon={Activity} accent="#8b5cf6"
          open={sections.lifestyle} onToggle={() => toggleSection('lifestyle')}>
          <div>
            <FieldLabel>Activity Level</FieldLabel>
            <ChipGroup options={['Sedentary', 'Moderate', 'Active'].map(v => ({ value: v, label: v }))}
              value={formData.activityLevel} onChange={v => updateField('activityLevel', v)} accent="#8b5cf6" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Sleep Hours</FieldLabel>
              <ChipGroup options={['<5', '5-7', '7-9', '>9'].map(v => ({ value: v, label: `${v} hrs` }))}
                value={formData.sleepHours} onChange={v => updateField('sleepHours', v)} accent="#8b5cf6" />
            </div>
            <div>
              <FieldLabel>Stress Level</FieldLabel>
              <ChipGroup options={['Low', 'Medium', 'High'].map(v => ({ value: v, label: v }))}
                value={formData.stressLevel} onChange={v => updateField('stressLevel', v)} accent="#8b5cf6" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Smoking Status</FieldLabel>
              <ChipGroup options={[{ value: false, label: '🚭 Non-smoker' }, { value: true, label: '🚬 Smoker' }]}
                value={formData.isSmoker} onChange={v => updateField('isSmoker', v)} accent="#8b5cf6" />
            </div>
            <div>
              <FieldLabel>Alcohol Consumption</FieldLabel>
              <ChipGroup options={['Never', 'Occasionally', 'Frequently'].map(v => ({ value: v, label: v }))}
                value={formData.alcoholConsumption} onChange={v => updateField('alcoholConsumption', v)} accent="#8b5cf6" />
            </div>
          </div>
        </SectionCard>

        {/* 3. Diet */}
        <SectionCard sectionKey="diet" label="Diet & Nutrition" icon={Utensils} accent="#f59e0b"
          open={sections.diet} onToggle={() => toggleSection('diet')}>
          <div>
            <FieldLabel>Primary Diet Type</FieldLabel>
            <ChipGroup options={['Veg', 'Non-Veg', 'Mixed'].map(v => ({ value: v, label: v }))}
              value={formData.dietType} onChange={v => updateField('dietType', v)} accent="#f59e0b" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Sugar Intake</FieldLabel>
              <ChipGroup options={['Low', 'Medium', 'High'].map(v => ({ value: v, label: v }))}
                value={formData.sugarIntake} onChange={v => updateField('sugarIntake', v)} accent="#f59e0b" />
            </div>
            <div>
              <FieldLabel>Salt Intake</FieldLabel>
              <ChipGroup options={['Low', 'Medium', 'High'].map(v => ({ value: v, label: v }))}
                value={formData.saltIntake} onChange={v => updateField('saltIntake', v)} accent="#f59e0b" />
            </div>
          </div>
          <div>
            <FieldLabel>Junk Food Frequency</FieldLabel>
            <ChipGroup options={['Rare', 'Weekly', 'Daily'].map(v => ({ value: v, label: v }))}
              value={formData.junkFoodFrequency} onChange={v => updateField('junkFoodFrequency', v)} accent="#f59e0b" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <YesNoToggle label="🥬 Daily Leafy Greens?" value={formData.eatsLeafyGreens} onChange={v => updateField('eatsLeafyGreens', v)} />
            <YesNoToggle label="🍎 Daily Fresh Fruits?" value={formData.eatsFruits} onChange={v => updateField('eatsFruits', v)} />
          </div>
        </SectionCard>

        {/* 4. Women's Health */}
        <SectionCard sectionKey="womens" label="Women's Health" icon={Venus} accent="#e879f9"
          open={sections.womens} onToggle={() => toggleSection('womens')}>
          {!isFemale ? (
            <div className="text-center py-6">
              <Venus className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">This section is tailored for female profiles. Update Biometrics → Gender to unlock.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { id: 'menstrualCycleIrregular', label: 'Irregular Menstrual Cycles', desc: 'Periods more than 35 days apart or highly unpredictable' },
                { id: 'facialBodyHairExcess', label: 'Excessive Facial / Body Hair', desc: 'Noticeable growth in face, chest, or back' },
                { id: 'persistentAcne', label: 'Persistent Adult Acne', desc: "Acne that doesn't respond to standard treatments" },
                { id: 'tryingToConceiveDifficulty', label: 'Difficulty Conceiving', desc: 'Trying for >6 months without success' },
                { id: 'pcosDiagnosis', label: 'Previous PCOS Diagnosis', desc: 'Previously diagnosed by a gynecologist' },
              ].map(item => (
                <ToggleRow key={item.id} label={item.label} desc={item.desc}
                  checked={formData[item.id]} onChange={v => updateField(item.id, v)} accent="#e879f9" />
              ))}
            </div>
          )}
        </SectionCard>

        {/* 5. Respiratory */}
        <SectionCard sectionKey="respiratory" label="Respiratory & Environment" icon={Wind} accent="#38bdf8"
          open={sections.respiratory} onToggle={() => toggleSection('respiratory')}>
          <div className="space-y-2">
            {[
              { id: 'wheezing', label: 'Wheezing or Whistling', desc: 'Whistling sound when breathing, especially on exhale' },
              { id: 'persistentCough', label: 'Persistent Cough', desc: 'Cough lasting >2 weeks or at night/early morning' },
              { id: 'shortnessBreath', label: 'Shortness of Breath', desc: 'Difficulty breathing during normal activities' },
              { id: 'highPollutionArea', label: 'High Pollution Area', desc: 'Live/work in polluted zones (e.g., NCR, Industrial)' },
              { id: 'biomassFuelUse', label: 'Biomass Fuel Use', desc: 'Cook using wood, coal, or dung regularly' },
              { id: 'seasonalAllergies', label: 'Seasonal Allergies', desc: 'Frequent hay fever or seasonal respiratory triggers' },
            ].map(item => (
              <ToggleRow key={item.id} label={item.label} desc={item.desc}
                checked={formData[item.id]} onChange={v => updateField(item.id, v)} accent="#38bdf8" />
            ))}
          </div>
        </SectionCard>

        {/* 6. Mental Health */}
        <SectionCard sectionKey="mental" label="Mental Wellbeing" icon={Brain} accent="#6ee7b7"
          open={sections.mental} onToggle={() => toggleSection('mental')}>
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">🔒 All data is strictly confidential</p>
          <div className="space-y-2">
            {[
              { id: 'mentalHealthDepressed', label: 'Feeling Down or Depressed', desc: 'Felt down or hopeless over the last 2 weeks (PHQ-2)' },
              { id: 'lostInterestActivities', label: 'Loss of Interest', desc: 'Little interest or pleasure in usual activities' },
              { id: 'mentalHealthAnxiety', label: 'Feeling Anxious or On Edge', desc: 'Felt nervous or anxious over the last 2 weeks (GAD-2)' },
              { id: 'energyLevelsLow', label: 'Low Energy or Fatigue', desc: 'Feeling tired or having little energy most days' },
            ].map(item => (
              <ToggleRow key={item.id} label={item.label} desc={item.desc}
                checked={formData[item.id]} onChange={v => updateField(item.id, v)} accent="#6ee7b7" />
            ))}
          </div>
        </SectionCard>

        {/* 7. Medical Archive */}
        <SectionCard sectionKey="medical" label="Medical Archive" icon={HeartPulse} accent="#f87171"
          open={sections.medical} onToggle={() => toggleSection('medical')}>
          <div>
            <FieldLabel>Allergies (multi-select)</FieldLabel>
            <CreatableSelect isMulti options={ALLERGY_OPTIONS}
              value={(formData.allergies || []).map(a => ({ value: a, label: a }))}
              onChange={v => updateField('allergies', v ? v.map(o => o.value) : [])}
              styles={selectStyles} placeholder="Search e.g. Penicillin…" />
          </div>
          <div>
            <FieldLabel>Medical History</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {CONDITION_OPTIONS.map(c => {
                const isSel = (formData.medicalHistory || []).includes(c);
                return (
                  <button key={c} type="button"
                    onClick={() => {
                      const cur = formData.medicalHistory || [];
                      updateField('medicalHistory', cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c]);
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                    style={isSel
                      ? { background: 'rgba(248,113,113,0.15)', borderColor: 'rgba(248,113,113,0.4)', color: '#fca5a5' }
                      : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <FieldLabel>Contextual Observations</FieldLabel>
            <textarea value={formData.otherConditions}
              onChange={e => updateField('otherConditions', e.target.value)}
              placeholder="Type additional health notes here…"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-medium
                focus:outline-none focus:border-emerald-500 transition-all shadow-inner resize-none placeholder:text-gray-700" />
          </div>
        </SectionCard>

        {/* ── ACTIONS ── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button onClick={handleInitialSave} disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-900/30 active:scale-[0.98] disabled:opacity-50 transition-all">
            <Zap size={16} />
            {saving ? 'Synchronizing…' : 'Synchronize Health Profile'}
          </button>
          <button onClick={() => navigate('/profile')}
            className="flex-1 py-4 rounded-2xl font-bold uppercase tracking-widest bg-white/4 border border-white/10 text-gray-500 hover:bg-white/8 hover:text-white transition-all">
            Discard
          </button>
        </div>
      </div>

      {/* ── INTENT MODAL ── */}
      {showIntentModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => !saving && setShowIntentModal(false)} />
          <div className="relative bg-[#070d1a] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Modal header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <Shield size={16} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tighter">Update <span className="text-emerald-400">Context</span></h2>
            </div>
            <p className="text-gray-600 text-sm mb-6">Select the reason for this data update.</p>

            <div className="space-y-3 mb-6">
              {[
                { id: 'correction',  label: 'Correction',     sub: 'Fixing a previous input error — no progress tracked' },
                { id: 'real_change', label: 'Baseline Shift',  sub: 'Actual physiological or lifestyle change — AI re-analysis triggered' },
                { id: 'initial',     label: 'Missing Data',   sub: 'Backfilling archival records' },
              ].map(opt => (
                <button key={opt.id} type="button" onClick={() => setIntentData({ ...intentData, intent: opt.id })}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${
                    intentData.intent === opt.id
                      ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/20'
                      : 'border-white/8 bg-white/3 hover:bg-white/6'
                  }`}>
                  <div className="font-black text-white text-sm mb-0.5 flex items-center justify-between">
                    {opt.label}
                    <Info size={12} className="text-gray-600" />
                  </div>
                  <div className="text-[10px] text-gray-600 font-semibold">{opt.sub}</div>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <FieldLabel>Optional Notes</FieldLabel>
              <textarea value={intentData.notes}
                onChange={e => setIntentData({ ...intentData, notes: e.target.value })}
                placeholder="e.g., Started a keto diet, lost 3 kg…"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white
                  focus:outline-none focus:border-emerald-500 transition-all shadow-inner resize-none placeholder:text-gray-700" />
            </div>

            <button onClick={handleFinalSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-emerald-900/30 disabled:opacity-50">
              <Save size={15} />
              {saving ? 'Encrypting Archive…' : 'Push Matrix Update'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileEditor;
