import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';
import { 
  User, Calendar, Scale, Activity, Droplets, Utensils, AlertTriangle, 
  ChevronDown, ChevronUp, Save, X, Info, AlertCircle, CheckCircle2,
  Weight, ArrowUpCircle, Heart, Wind, Coffee, Moon, Flame, Zap,
  Cigarette, Wine, Salad, Pizza, Cookie, Plus, HeartPulse, RefreshCw
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

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
    backgroundColor: '#030712',
    borderColor: state.isFocused ? '#10b981' : '#1f2937',
    borderRadius: '0.75rem',
    padding: '4px',
    color: 'white',
    boxShadow: 'none',
    '&:hover': { borderColor: '#374151' }
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '0.75rem',
    zIndex: 200
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? '#059669' : 'transparent',
    color: 'white',
    '&:active': { backgroundColor: '#10b981' }
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '0.5rem',
    border: '1px solid rgba(16, 185, 129, 0.2)'
  }),
  multiValueLabel: (base) => ({ ...base, color: '#10b981' }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#10b981',
    '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }
  }),
  input: (base) => ({ ...base, color: 'white' })
};

const ProfileEditor = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const hasLoadedInitial = useRef(false);
  
  // FORM STATE: Using strings for numbers to prevent cursor jumping/NaN issues
  const [formData, setFormData] = useState({
    name: '', age: '', gender: '', height: '', weight: '',
    activityLevel: '', sleepHours: '', stressLevel: '', isSmoker: false, alcoholConsumption: '',
    dietType: '', sugarIntake: '', saltIntake: '', junkFoodFrequency: '', eatsLeafyGreens: false, eatsFruits: false,
    allergies: [], medicalHistory: [], otherConditions: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [intentData, setIntentData] = useState({
    intent: 'real_change',
    notes: '',
    changeDate: new Date().toISOString()
  });

  // Expand all sections by default for full visibility
  const [sections, setSections] = useState({
    biometrics: true,
    lifestyle: true,
    diet: true,
    medical: true
  });

  useEffect(() => {
    if (user && !hasLoadedInitial.current) {
      axios.get(`${API_URL}/profile/${user.id}`)
        .then(res => {
          if (res.data.status === 'success' && !hasLoadedInitial.current) {
            const p = res.data.data;
            setProfile(p);
            const flatData = {};
            Object.keys(formData).forEach(key => {
              if (p[key] && p[key].value !== undefined) {
                flatData[key] = p[key].value;
              }
            });
            setFormData(prev => ({ ...prev, ...flatData }));
            if (!hasLoadedInitial.current) {
              setFormData({
                name: p.name?.value || '',
                age: p.age?.value || '',
                gender: p.gender?.value || '',
                height: p.height?.value || '',
                weight: p.weight?.value || '',
                activityLevel: p.activityLevel?.value || '',
                sleepHours: p.sleepHours?.value || '',
                stressLevel: p.stressLevel?.value || '',
                isSmoker: p.isSmoker?.value || false,
                alcoholConsumption: p.alcoholConsumption?.value || '',
                dietType: p.dietType?.value || '',
                sugarIntake: p.sugarIntake?.value || '',
                saltIntake: p.saltIntake?.value || '',
                junkFoodFrequency: p.junkFoodFrequency?.value || '',
                eatsLeafyGreens: p.eatsLeafyGreens?.value || false,
                eatsFruits: p.eatsFruits?.value || false,
                allergies: p.allergies?.value || [],
                medicalHistory: p.medicalHistory?.value || [],
                otherConditions: p.otherConditions?.value || ''
              });
              hasLoadedInitial.current = true;
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const toggleSection = (s) => setSections(prev => ({ ...prev, [s]: !prev[s] }));
  
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.age || Number(formData.age) < 1) newErrors.age = "Invalid age";
    if (!formData.height || Number(formData.height) < 50) newErrors.height = "Invalid height";
    if (!formData.weight || Number(formData.weight) < 20) newErrors.weight = "Invalid weight";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInitialSave = (e) => {
    e.preventDefault();
    if (!validate()) {
       alert("Please correct the entries in Physical Baseline.");
       return;
    }
    setShowIntentModal(true);
  };

  const handleFinalSave = async () => {
    setSaving(true);
    try {
      const updates = {};
      Object.keys(formData).forEach(key => {
         const oldValue = profile[key]?.value;
         const newValue = formData[key];
         const processedNew = (key === 'age' || key === 'height' || key === 'weight') ? (newValue === '' ? 0 : Number(newValue)) : newValue;
         if (JSON.stringify(oldValue) !== JSON.stringify(processedNew)) {
            updates[key] = processedNew;
         }
      });

      const response = await axios.post(`${API_URL}/profile/update`, {
        clerkId: user.id,
        updates,
        intent: intentData.intent,
        notes: intentData.notes,
        changeDate: intentData.changeDate
      });

      if (response.data.status === 'success') {
         await axios.post(`${API_URL}/reports/hybrid-assessment`, { clerkId: user.id, persist: true }).catch(() => null);
         await axios.post(`${API_URL}/ai/generate-report`, { clerkId: user.id }).catch(() => null);
         window.dispatchEvent(new CustomEvent('vaidya-profile-updated'));
         navigate('/profile', { state: { toast: 'Your questionnaire-based risk scores and insights have been refreshed.' } });
      }
    } catch (err) {
      console.error('Save failed:', err);
      alert("Encryption failure. Connection unstable.");
    } finally {
      setSaving(false);
    }
  };

  const OptionButton = ({ label, value, current, onClick, icon: Icon }) => (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex-1 px-4 py-3 rounded-xl border text-sm font-black transition-all flex items-center justify-center min-h-[50px] ${
        current === value
          ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
          : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'
      }`}
    >
      {Icon && <Icon className={`w-4 h-4 mr-2 ${current === value ? 'text-white' : 'text-emerald-500'}`} />}
      {label}
    </button>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Accessing Bio-Ledger...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-10 pt-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Secure <span className="text-emerald-500">Matrix Update</span></h1>
          <p className="text-gray-500 mt-1 font-medium italic">Synchronizing biometric parameters with core medical archive.</p>
        </div>
        <Link to="/profile" className="p-3 bg-gray-900 hover:bg-gray-800 rounded-2xl text-gray-500 border border-gray-800 transition-colors">
          <X size={24} />
        </Link>
      </div>

      <div className="space-y-6">
        {/* SECTION 1: BIOMETRICS */}
        <div className="bg-gray-950 border border-gray-800 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="p-6 bg-gray-900/40 border-b border-gray-800 flex items-center justify-between cursor-pointer" onClick={() => toggleSection('biometrics')}>
            <div className="flex items-center space-x-4">
              <Scale size={20} className="text-emerald-500" />
              <h3 className="text-lg font-bold text-white uppercase tracking-widest">Physical Baseline</h3>
            </div>
            {sections.biometrics ? <ChevronUp size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
          </div>
          {sections.biometrics && (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Current Age</label>
                  <input type="number" value={formData.age} onChange={e => updateField('age', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 text-white font-bold focus:border-emerald-500 outline-none transition-all" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Biological Gender</label>
                  <div className="flex gap-2">
                    {['Male', 'Female', 'Other'].map(g => (
                      <OptionButton key={g} label={g} value={g} current={formData.gender} onClick={v => updateField('gender', v)} />
                    ))}
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Stature (cm)</label>
                  <input type="number" value={formData.height} onChange={e => updateField('height', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 text-white font-bold focus:border-emerald-500 outline-none transition-all" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Body Mass (kg)</label>
                  <input type="number" value={formData.weight} onChange={e => updateField('weight', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 text-white font-bold focus:border-emerald-500 outline-none transition-all" />
               </div>
            </div>
          )}
        </div>

        {/* SECTION 2: LIFESTYLE */}
        <div className="bg-gray-950 border border-gray-800 rounded-[2rem] overflow-hidden">
          <div className="p-6 bg-gray-900/40 border-b border-gray-800 flex items-center justify-between cursor-pointer" onClick={() => toggleSection('lifestyle')}>
            <div className="flex items-center space-x-4">
              <Activity size={20} className="text-emerald-500" />
              <h3 className="text-lg font-bold text-white uppercase tracking-widest">Active Lifestyle</h3>
            </div>
            {sections.lifestyle ? <ChevronUp size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
          </div>
          {sections.lifestyle && (
            <div className="p-8 space-y-8 animate-in slide-in-from-top-4">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Activity Vectors</label>
                  <div className="flex flex-wrap gap-2">
                    {['Sedentary', 'Moderate', 'Active'].map(v => (
                      <OptionButton key={v} label={v} value={v} current={formData.activityLevel} onClick={val => updateField('activityLevel', val)} />
                    ))}
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Regenerative Sleep (hrs)</label>
                    <div className="flex gap-2">
                       {['<5', '5-7', '7-9', '>9'].map(v => (
                         <OptionButton key={v} label={`${v} hrs`} value={v} current={formData.sleepHours} onClick={val => updateField('sleepHours', val)} />
                       ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Stress Coefficient</label>
                    <div className="flex gap-2">
                       {['Low', 'Medium', 'High'].map(v => (
                         <OptionButton key={v} label={v} value={v} current={formData.stressLevel} onClick={val => updateField('stressLevel', val)} />
                       ))}
                    </div>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Nicotine Intake</label>
                    <div className="flex gap-2">
                       <OptionButton label="Non-smoker" value={false} current={formData.isSmoker} onClick={v => updateField('isSmoker', v)} />
                       <OptionButton label="Active Smoker" value={true} current={formData.isSmoker} onClick={v => updateField('isSmoker', v)} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Alcohol Consistency</label>
                    <div className="flex gap-2">
                       {['Never', 'Occasionally', 'Frequently'].map(v => (
                         <OptionButton key={v} label={v} value={v} current={formData.alcoholConsumption} onClick={val => updateField('alcoholConsumption', val)} />
                       ))}
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* SECTION 3: DIET (Restored) */}
        <div className="bg-gray-950 border border-gray-800 rounded-[2rem] overflow-hidden">
          <div className="p-6 bg-gray-900/40 border-b border-gray-800 flex items-center justify-between cursor-pointer" onClick={() => toggleSection('diet')}>
            <div className="flex items-center space-x-4">
              <Utensils size={20} className="text-emerald-500" />
              <h3 className="text-lg font-bold text-white uppercase tracking-widest">Nutritional Balance</h3>
            </div>
            {sections.diet ? <ChevronUp size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
          </div>
          {sections.diet && (
            <div className="p-8 space-y-8 animate-in slide-in-from-top-4">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Primary Fuel Type</label>
                  <div className="flex gap-2">
                    {['Veg', 'Non-Veg', 'Mixed'].map(v => (
                      <OptionButton key={v} label={v} value={v} current={formData.dietType} onClick={val => updateField('dietType', val)} />
                    ))}
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Refined Sugar Intake</label>
                    <div className="flex gap-2">
                       {['Low', 'Medium', 'High'].map(v => (
                         <OptionButton key={v} label={v} value={v} current={formData.sugarIntake} onClick={val => updateField('sugarIntake', val)} />
                       ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Sodium/Salt Profile</label>
                    <div className="flex gap-2">
                       {['Low', 'Medium', 'High'].map(v => (
                         <OptionButton key={v} label={v} value={v} current={formData.saltIntake} onClick={val => updateField('saltIntake', val)} />
                       ))}
                    </div>
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Junk Food Frequency</label>
                  <div className="flex gap-3">
                    {['Rare', 'Weekly', 'Daily'].map(v => (
                      <OptionButton key={v} label={v} value={v} current={formData.junkFoodFrequency} onClick={val => updateField('junkFoodFrequency', val)} />
                    ))}
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex items-center justify-between p-5 bg-gray-900 rounded-2xl border border-gray-800">
                     <span className="text-sm font-bold text-gray-300">Daily Leafy Greens?</span>
                     <div className="flex gap-2">
                        <button onClick={() => updateField('eatsLeafyGreens', true)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.eatsLeafyGreens ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-500'}`}><CheckCircle2 size={18} /></button>
                        <button onClick={() => updateField('eatsLeafyGreens', false)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${!formData.eatsLeafyGreens ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-500'}`}><X size={18} /></button>
                     </div>
                  </div>
                  <div className="flex items-center justify-between p-5 bg-gray-900 rounded-2xl border border-gray-800">
                     <span className="text-sm font-bold text-gray-300">Daily Fresh Fruits?</span>
                     <div className="flex gap-2">
                        <button onClick={() => updateField('eatsFruits', true)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.eatsFruits ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-500'}`}><CheckCircle2 size={18} /></button>
                        <button onClick={() => updateField('eatsFruits', false)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${!formData.eatsFruits ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-500'}`}><X size={18} /></button>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* SECTION 4: MEDICAL (Restored) */}
        <div className="bg-gray-950 border border-gray-800 rounded-[2rem] overflow-hidden">
          <div className="p-6 bg-gray-900/40 border-b border-gray-800 flex items-center justify-between cursor-pointer" onClick={() => toggleSection('medical')}>
            <div className="flex items-center space-x-4">
              <HeartPulse size={20} className="text-emerald-500" />
              <h3 className="text-lg font-bold text-white uppercase tracking-widest">Medical Archive</h3>
            </div>
            {sections.medical ? <ChevronUp size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
          </div>
          {sections.medical && (
            <div className="p-8 space-y-8 animate-in slide-in-from-top-4">
               <div className="space-y-4">
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Allergies (Multi-Select)</label>
                 <CreatableSelect
                    isMulti
                    options={ALLERGY_OPTIONS}
                    value={(formData.allergies || []).map(a => ({ value: a, label: a }))}
                    onChange={v => updateField('allergies', v ? v.map(opt => opt.value) : [])}
                    styles={selectStyles}
                    placeholder="Search e.g. Penicillin..."
                 />
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-2">Documented Pathologies</label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITION_OPTIONS.map(c => {
                      const isSel = (formData.medicalHistory || []).includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            const cur = formData.medicalHistory || [];
                            const next = cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c];
                            updateField('medicalHistory', next);
                          }}
                          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                            isSel
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                              : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600'
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Contextual Observations</label>
                  <textarea 
                    value={formData.otherConditions} 
                    onChange={e => updateField('otherConditions', e.target.value)}
                    placeholder="Type additional health notes here..."
                    rows={4}
                    className="w-full bg-gray-900 border border-gray-800 rounded-[1.5rem] px-6 py-5 text-white font-medium focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                  />
               </div>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col md:flex-row gap-4 pt-10">
           <button 
             onClick={handleInitialSave}
             disabled={saving}
             className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 transition-all"
           >
             {saving ? 'Processing Matrix...' : 'Synchronize Health Profile'}
           </button>
           <button 
             onClick={() => navigate('/profile')}
             className="flex-1 bg-gray-900 text-gray-500 py-6 rounded-[2rem] font-bold uppercase tracking-widest hover:bg-gray-800 hover:text-white transition-all border border-gray-800"
           >
             Discard Edits
           </button>
        </div>
      </div>

      {/* INTENT MODAL (AUDIT LOG) */}
      {showIntentModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => !saving && setShowIntentModal(false)}></div>
          <div className="relative bg-[#030712] border border-gray-800 rounded-[3rem] p-12 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 pb-8">
            <h2 className="text-3xl font-black text-white mb-3 uppercase italic tracking-tighter">Update <span className="text-emerald-500">Context</span></h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium italic">Select the catalyst for this data update.</p>
            
            <div className="space-y-4 mb-8">
               {[
                 { id: 'correction', label: "Correction", sub: "Rectifying previous input error", tip: "Does not trigger 'progress' tracking." },
                 { id: 'real_change', label: "Baseline Shift", sub: "Actual change in physiology or habit", tip: "Triggers AI progress/regression analysis." },
                 { id: 'initial', label: "Missing Data", sub: "Populating archival health records", tip: "Backfilling missing historical data." }
               ].map(opt => (
                 <button 
                   key={opt.id}
                   type="button"
                   onClick={() => setIntentData({...intentData, intent: opt.id})}
                   className={`w-full p-6 rounded-[1.5rem] border text-left transition-all relative group ${
                     intentData.intent === opt.id ? 'bg-emerald-500/10 border-emerald-500 ring-4 ring-emerald-500/10' : 'border-gray-800 hover:bg-gray-800'
                   }`}
                 >
                   <div className="font-black text-white uppercase tracking-widest mb-1 text-sm flex items-center justify-between">
                     {opt.label}
                     <Info size={14} className="text-gray-600 group-hover:text-emerald-500 transition-colors" title={opt.tip} />
                   </div>
                   <div className="text-[10px] text-gray-500 font-bold italic">{opt.sub}</div>
                 </button>
               ))}
            </div>

            <div className="mb-10">
               <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2 mb-2 block">Optional Notes</label>
               <textarea 
                 value={intentData.notes}
                 onChange={e => setIntentData({...intentData, notes: e.target.value})}
                 placeholder="e.g., Started keto diet..."
                 rows={2}
                 className="w-full bg-gray-900 border border-gray-800 rounded-[1.5rem] px-5 py-4 text-sm text-white font-medium focus:outline-none focus:border-emerald-500 transition-all shadow-inner resize-none"
               />
            </div>

            <button 
              onClick={handleFinalSave}
              disabled={saving}
              className="w-full bg-white text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all hover:bg-emerald-500 hover:text-white shadow-2xl active:scale-95 translate-z-0"
            >
              {saving ? 'Encrypting Archive...' : 'Push Matrix Update'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileEditor;
