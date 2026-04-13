import React from 'react';
import useOnboardingStore from '../../store/useOnboardingStore';
import { Venus, Calendar, Activity, AlertCircle } from 'lucide-react';

const Step4WomenHealth = () => {
  const { formData, updateFormData, setStep } = useOnboardingStore();

  const handleToggle = (field) => {
    updateFormData({ [field]: !formData[field] });
  };

  const isFemale = formData.gender?.toLowerCase() === 'female';

  if (!isFemale) {
    return (
      <div className="space-y-6 text-center py-8 animate-in fade-in duration-500">
        <div className="flex justify-center mb-4">
          <Venus className="w-12 h-12 text-gray-600" />
        </div>
        <h2 className="text-xl font-bold text-white">Gender-Specific Screening</h2>
        <p className="text-gray-400">This section is tailored for women's health metrics. Based on your profile, we'll skip to the next section.</p>
        <div className="flex gap-4 mt-8">
          <button onClick={() => setStep(3)} className="btn-secondary flex-1 py-4 border border-gray-800 rounded-2xl font-bold hover:bg-gray-800 transition-all text-white">Back</button>
          <button 
            onClick={() => setStep(5)}
            className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95"
          >
            Continue to Respiratory Health
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Venus className="w-5 h-5 mr-3 text-fuchsia-400" /> Women's Health Screening
        </h2>
        <p className="text-gray-400 text-sm">Help us understand PCOS and reproductive health indicators.</p>
      </div>

      <div className="grid gap-4">
        {[
          { id: 'menstrualCycleIrregular', label: 'Irregular Menstrual Cycles', icon: Calendar, desc: 'Periods more than 35 days apart or highly unpredictable' },
          { id: 'facialBodyHairExcess', label: 'Excessive Facial/Body Hair', icon: Activity, desc: 'Noticeable growth in areas like face, chest, or back' },
          { id: 'persistentAcne', label: 'Persistent Adult Acne', icon: AlertCircle, desc: 'Acne that doesn\'t respond to standard treatments' },
          { id: 'tryingToConceiveDifficulty', label: 'Difficulty Conceiving', icon: Venus, desc: 'Trying for >6 months without success' },
          { id: 'pcosDiagnosis', label: 'Previous PCOS Diagnosis', icon: Activity, desc: 'Previously diagnosed by a gynecologist' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => handleToggle(item.id)}
            className={`flex items-start p-4 rounded-2xl border transition-all text-left group ${
              formData[item.id] 
                ? 'bg-fuchsia-500/10 border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.1)]' 
                : 'bg-gray-950/50 border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className={`p-2 rounded-xl mr-4 ${formData[item.id] ? 'bg-fuchsia-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <div className={`font-bold text-sm ${formData[item.id] ? 'text-fuchsia-400' : 'text-gray-200'}`}>{item.label}</div>
              <div className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{item.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-4 pt-4">
        <button onClick={() => setStep(3)} className="btn-secondary flex-1 py-4 border border-gray-800 rounded-2xl font-bold hover:bg-gray-800 transition-all">Back</button>
        <button onClick={() => setStep(5)} className="btn-primary flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95">Next Step</button>
      </div>
    </div>
  );
};

export default Step4WomenHealth;
