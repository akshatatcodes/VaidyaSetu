import React from 'react';
import useOnboardingStore from '../../store/useOnboardingStore';
import { Brain, Smile, Zap, Activity, AlertCircle } from 'lucide-react';

const Step6MentalHealth = () => {
  const { formData, updateFormData, setStep } = useOnboardingStore();

  const handleToggle = (field) => {
    updateFormData({ [field]: !formData[field] });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Brain className="w-5 h-5 mr-3 text-emerald-400" /> Mental Wellbeing
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">A brief screening for stress, anxiety, and mood. All data is strictly confidential.</p>
      </div>

      <div className="grid gap-4">
        {[
          { id: 'mentalHealthDepressed', label: 'Feeling Down or Depressed', icon: Smile, desc: 'Felt down, depressed, or hopeless over the last 2 weeks (PHQ-2)' },
          { id: 'lostInterestActivities', label: 'Loss of Interest', icon: Zap, desc: 'Little interest or pleasure in doing things you usually enjoy' },
          { id: 'mentalHealthAnxiety', label: 'Feeling Anxious or On edge', icon: AlertCircle, desc: 'Felt nervous, anxious, or on edge over the last 2 weeks (GAD-2)' },
          { id: 'energyLevelsLow', label: 'Low Energy or Fatigue', icon: Activity, desc: 'Feeling tired or having little energy most days' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => handleToggle(item.id)}
            className={`flex items-start p-4 rounded-2xl border transition-all text-left group ${
              formData[item.id] 
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                : 'bg-gray-950/50 border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className={`p-2 rounded-xl mr-4 ${formData[item.id] ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <div className={`font-bold text-sm ${formData[item.id] ? 'text-emerald-400' : 'text-gray-200'}`}>{item.label}</div>
              <div className="text-[10px] text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">{item.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-4 pt-4">
        <button onClick={() => setStep(5)} className="btn-secondary flex-1 py-4 border border-gray-800 rounded-2xl font-bold hover:bg-gray-800 transition-all">Back</button>
        <button onClick={() => setStep(7)} className="btn-primary flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95">Next Step</button>
      </div>
    </div>
  );
};

export default Step6MentalHealth;
