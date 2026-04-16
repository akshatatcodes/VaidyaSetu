import React from 'react';
import useOnboardingStore from '../../store/useOnboardingStore';
import { Wind, CloudRain, Flame, Activity, AlertCircle } from 'lucide-react';

const Step5Respiratory = () => {
  const { formData, updateFormData, setStep } = useOnboardingStore();

  const handleToggle = (field) => {
    updateFormData({ [field]: !formData[field] });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Wind className="w-5 h-5 mr-3 text-blue-400" /> Respiratory & Environment
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">Help us assess risks from air quality and environmental factors.</p>
      </div>

      <div className="grid gap-4">
        {[
          { id: 'wheezing', label: 'Wheezing or Whistling', icon: Activity, desc: 'Whistling sound when breathing, especially during exhale' },
          { id: 'persistentCough', label: 'Persistent Cough', icon: CloudRain, desc: 'Cough that lasts >2 weeks or occurs at night/early morning' },
          { id: 'shortnessBreath', label: 'Shortness of Breath', icon: Wind, desc: 'Difficulty breathing during normal activities' },
          { id: 'highPollutionArea', label: 'High Pollution Area', icon: AlertCircle, desc: 'Live/work in a highly polluted zone (e.g., NCR, Industrial Hubs)' },
          { id: 'biomassFuelUse', label: 'Biomass Fuel Use', icon: Flame, desc: 'Cook using wood, coal, or dung regularly' },
          { id: 'seasonalAllergies', label: 'Seasonal Allergies', icon: CloudRain, desc: 'Frequent hay fever or seasonal respiratory triggers' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => handleToggle(item.id)}
            className={`flex items-start p-4 rounded-2xl border transition-all text-left group ${
              formData[item.id] 
                ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                : 'bg-gray-950/50 border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className={`p-2 rounded-xl mr-4 ${formData[item.id] ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <div className={`font-bold text-sm ${formData[item.id] ? 'text-blue-400' : 'text-gray-200'}`}>{item.label}</div>
              <div className="text-[10px] text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">{item.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-4 pt-4">
        <button onClick={() => setStep(4)} className="btn-secondary flex-1 py-4 border border-gray-800 rounded-2xl font-bold hover:bg-gray-800 transition-all">Back</button>
        <button onClick={() => setStep(6)} className="btn-primary flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95">Next Step</button>
      </div>
    </div>
  );
};

export default Step5Respiratory;
