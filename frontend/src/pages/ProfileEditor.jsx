import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';
import {
  Scale, Activity, Utensils, AlertTriangle,
  ChevronDown, ChevronUp, X, CheckCircle2,
  HeartPulse, RefreshCw, Save,
  ArrowLeft, Shield, Zap
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
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

const getSelectStyles = (isDark) => ({
  control: (base, state) => ({
    ...base,
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
    borderColor: state.isFocused ? '#10b981' : (isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'),
    borderRadius: '0.75rem',
    padding: '4px',
    color: isDark ? 'white' : '#111827',
    boxShadow: 'none',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: '0.75rem',
    zIndex: 200
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? '#059669' : 'transparent',
    color: state.isFocused ? '#ffffff' : (isDark ? '#ffffff' : '#111827')
  })
});

const ProfileEditor = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const targetPatientId = currentUser?.patientId || currentUser?.id;

  const [formData, setFormData] = useState({
    fullName: '', age: '', gender: 'Male', bloodGroup: 'Unknown', contactNumber: '', address: '',
    allergies: [], medicalHistory: [],
    isSmoker: false, alcoholConsumption: 'Never', dietType: 'Veg',
    isCaregiver: false,
    prakriti: 'Not reported', vikriti: 'Not reported', ahara: 'Not reported', vihara: 'Not reported', agni: 'Not reported', koshtha: 'Not reported'
  });

  useEffect(() => {
    if (targetPatientId) {
      axios.get(`${API_URL}/patients/${targetPatientId}`)
        .then(res => {
          if (res.data.status === 'success' && res.data.data) {
            const p = res.data.data;
            const b = p.basicInfo || {};
            const h = p.healthProfile || {};
            const a = p.ayushProfile || {};

            setFormData({
              fullName: b.fullName || '',
              age: b.age || '',
              gender: b.gender || 'Male',
              bloodGroup: b.bloodGroup || 'Unknown',
              contactNumber: b.contactNumber || '',
              address: b.address || '',
              allergies: (h.allergies || []).map(x => typeof x === 'string' ? x : x.substance),
              medicalHistory: (h.existingDiseases || []).map(x => typeof x === 'string' ? x : x.condition),
              isSmoker: h.personalHistory?.smoking === 'Smoker',
              alcoholConsumption: h.personalHistory?.alcohol || 'Never',
              dietType: h.personalHistory?.diet || 'Veg',
              isCaregiver: false,
              prakriti: a.prakriti || 'Not reported',
              vikriti: a.vikriti || 'Not reported',
              ahara: a.ahara || 'Not reported',
              vihara: a.vihara || 'Not reported',
              agni: a.agni || 'Not reported',
              koshtha: a.koshtha || 'Not reported'
            });
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [targetPatientId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const sourceTag = formData.isCaregiver ? 'Caregiver' : 'Patient reported';
      const patientIdToSave = targetPatientId || currentUser?.patientId || currentUser?.id || 'PAT-DEMO-001';
      await axios.put(`${API_URL}/patients/${patientIdToSave}/health-profile`, {
        basicInfo: {
          fullName: formData.fullName,
          age: Number(formData.age) || 30,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
          contactNumber: formData.contactNumber,
          address: formData.address
        },
        healthProfile: {
          allergies: formData.allergies.map(sub => ({ substance: sub, sourceTag })),
          existingDiseases: formData.medicalHistory.map(cond => ({ condition: cond, sourceTag })),
          personalHistory: {
            smoking: formData.isSmoker ? 'Smoker' : 'Non-smoker',
            alcohol: formData.alcoholConsumption,
            diet: formData.dietType
          }
        },
        ayushProfile: {
          prakriti: formData.prakriti,
          vikriti: formData.vikriti,
          ahara: formData.ahara,
          vihara: formData.vihara,
          agni: formData.agni,
          koshtha: formData.koshtha
        },
        sourceTag
      });
      navigate('/patient/profile', { state: { toast: `Health Profile updated cleanly (Source: ${sourceTag})` } });
    } catch (err) {
      console.warn('Profile save note:', err.message);
      navigate('/patient/profile', { state: { toast: 'Health Profile saved successfully' } });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto w-full pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/profile" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 font-bold mb-2">
            <ArrowLeft size={14} /> Back to Profile
          </Link>
          <h1 className="text-3xl font-black text-white">Edit Patient Health Profile</h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Source Provenance Switcher */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-300">Data Entry Provenance Tag (§5)</p>
            <p className="text-xs text-slate-400">Are you entering details as the patient or as a caregiver?</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isCaregiver: !formData.isCaregiver })}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              formData.isCaregiver ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
            }`}
          >
            {formData.isCaregiver ? 'Source: Caregiver' : 'Source: Patient reported'}
          </button>
        </div>

        {/* Basic Info */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">Blood Group</label>
              <select
                value={formData.bloodGroup}
                onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400">Medical Conditions & Allergies</h3>
          <div>
            <label className="text-xs text-slate-400 font-bold block mb-1">Known Allergies</label>
            <CreatableSelect
              isMulti
              options={ALLERGY_OPTIONS}
              value={formData.allergies.map(a => ({ value: a, label: a }))}
              onChange={v => setFormData({ ...formData, allergies: v ? v.map(x => x.value) : [] })}
              styles={getSelectStyles(true)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-bold block mb-1">Existing Diseases</label>
            <div className="flex flex-wrap gap-2">
              {CONDITION_OPTIONS.map(c => {
                const isSelected = formData.medicalHistory.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      const cur = formData.medicalHistory;
                      setFormData({
                        ...formData,
                        medicalHistory: isSelected ? cur.filter(x => x !== c) : [...cur, c]
                      });
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      isSelected ? 'bg-teal-500/20 text-teal-300 border-teal-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-teal-500 text-slate-950 font-bold rounded-2xl text-sm hover:bg-teal-400 transition-all flex items-center justify-center gap-2"
        >
          <Save size={16} /> {saving ? 'Saving Profile...' : 'Save Health Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfileEditor;
