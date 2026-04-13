import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import CreatableSelect from 'react-select/creatable';
import useOnboardingStore from '../../store/useOnboardingStore';
import { ChevronLeft, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import axios from 'axios';

const ALLERGY_OPTIONS = [
  { value: 'Dust Mites', label: 'Dust Mites' },
  { value: 'Pollen (Parthenium)', label: 'Pollen (Parthenium)' },
  { value: 'Peanuts', label: 'Peanuts' },
  { value: 'Dairy (Lactose)', label: 'Dairy (Lactose)' },
  { value: 'Shellfish', label: 'Shellfish' },
  { value: 'Soy', label: 'Soy' },
  { value: 'Wheat (Gluten)', label: 'Wheat (Gluten)' },
  { value: 'Egg', label: 'Egg' },
  { value: 'Sulfa Drugs', label: 'Sulfa Drugs' },
  { value: 'Penicillin', label: 'Penicillin' },
  { value: 'Latex', label: 'Latex' },
  { value: 'Cockroaches', label: 'Cockroaches' },
  { value: 'Mold', label: 'Mold' },
  { value: 'Pet Dander', label: 'Pet Dander' },
  { value: 'Brinjal', label: 'Brinjal' },
  { value: 'Mustard', label: 'Mustard' },
  { value: 'Cashews', label: 'Cashews' },
  { value: 'Walnuts', label: 'Walnuts' },
  { value: 'Red Meat', label: 'Red Meat' },
  { value: 'Fragrances', label: 'Fragrances' },
];

const CONDITION_OPTIONS = [
  'Type 2 Diabetes', 'Hypertension', 'Thyroid Disorders', 
  'Asthma', 'Heart Disease', 'PCOS', 'Anemia', 'CKD', 'Fatty Liver'
];

const Step7History = () => {
  const { user } = useUser();
  const { formData, updateFormData, setStep } = useOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleToggle = (field) => {
    updateFormData({ [field]: !formData[field] });
  };

  const handleAllergyChange = (newValue) => {
    updateFormData({ allergies: newValue ? newValue.map(v => v.value) : [] });
  };

  const toggleCondition = (condition) => {
    const current = formData.medicalHistory || [];
    if (current.includes(condition)) {
      updateFormData({ medicalHistory: current.filter(c => c !== condition) });
    } else {
      updateFormData({ medicalHistory: [...current, condition] });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
        clerkId: user?.id,
      };
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
      const response = await axios.post(`${API_URL}/user/profile`, payload);

      if (response.data.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (error) {
      console.error('Final submission failed:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to activate ecosystem: ${errorMsg}. Please check connection.`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-emerald-500">
          <ShieldCheck className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Ecosystem Activated</h2>
        <p className="text-gray-400 text-center">Redirecting you to your health bridge...</p>
      </div>
    );
  }

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: '#030712',
      borderColor: state.isFocused ? '#10b981' : '#1f2937',
      borderRadius: '0.75rem',
      padding: '4px',
      color: 'white',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#374151'
      }
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#111827',
      border: '1px solid #374151',
      borderRadius: '0.75rem',
      overflow: 'hidden'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#059669' : 'transparent',
      color: state.isFocused ? 'white' : '#9ca3af',
      '&:active': {
        backgroundColor: '#10b981'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderRadius: '0.5rem',
      border: '1px solid rgba(16, 185, 129, 0.2)'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#10b981',
      fontWeight: '500'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#10b981',
      '&:hover': {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        color: '#34d399'
      }
    }),
    input: (base) => ({
      ...base,
      color: 'white'
    })
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white flex items-center">
          <ShieldCheck className="w-5 h-5 mr-3 text-emerald-400" /> Final Assessment
        </h2>
        <p className="text-gray-400 text-sm">One last step to build your complete health matrix.</p>
      </div>

      {/* Advanced Screening Sections */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">Thyroid & Metabolic Indicators</h3>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'weightChangeUnexplained', label: 'Unexplained Weight Change' },
              { id: 'fatiguePersistent', label: 'Persistent Fatigue/Tiredness' },
              { id: 'drySkinHairLoss', label: 'Dry Skin or Brittle Hair' },
              { id: 'coldIntolerance', label: 'Feeling Cold when others are comfortable' },
              { id: 'familyHistoryThyroid', label: 'Family History of Thyroid Issues' },
              { id: 'autoimmuneHistory', label: 'History of Autoimmune disease' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                  formData?.[item.id] ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-gray-950 border-gray-800 text-gray-500'
                }`}
              >
                {item.label}
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData?.[item.id] ? 'bg-emerald-500 border-none' : 'border-gray-700'}`}>
                  {formData?.[item.id] && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">Kidney & Liver Screening</h3>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'swellingAnkles', label: 'Swelling in Ankles/Feet' },
              { id: 'frequentUrination', label: 'Frequent Urination (at night)' },
              { id: 'foamyUrine', label: 'Foamy or Bubbly Urine' },
              { id: 'nsaidOveruse', label: 'Take Painkillers >2x a week' },
              { id: 'liverPain', label: 'Discomfort in Upper Right Abdomen' },
              { id: 'fattyLiverDiagnosis', label: 'Previous Fatty Liver Diagnosis' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                  formData?.[item.id] ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-gray-950 border-gray-800 text-gray-500'
                }`}
              >
                {item.label}
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData?.[item.id] ? 'bg-emerald-500 border-none' : 'border-gray-700'}`}>
                  {formData?.[item.id] && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gray-800 my-4" />

      {/* Allergies (Original) */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Allergies</label>
        <CreatableSelect
          isMulti
          options={ALLERGY_OPTIONS}
          value={(formData.allergies || []).map(a => ({ value: a, label: a }))}
          onChange={handleAllergyChange}
          placeholder="Select or type..."
          styles={selectStyles}
        />
      </div>

      {/* Medical History (Original) */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Clinical Diagnosis History</label>
        <div className="flex flex-wrap gap-2">
          {CONDITION_OPTIONS.map((condition) => {
            const isSelected = (formData.medicalHistory || []).includes(condition);
            return (
              <button
                key={condition}
                onClick={() => toggleCondition(condition)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                  isSelected ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-500'
                }`}
              >
                {condition}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 pt-8">
        <button onClick={() => setStep(6)} className="flex-1 py-4 bg-gray-950 border border-gray-800 text-gray-400 font-bold rounded-2xl hover:bg-gray-900 transition-all flex items-center justify-center group">
          <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Back
        </button>
        <button onClick={handleSubmit} disabled={loading} className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center group shadow-lg shadow-emerald-500/20 border border-emerald-400/20">
          {loading ? 'Activating...' : 'Initiate Full Scan'}
          <Check className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default Step7History;
