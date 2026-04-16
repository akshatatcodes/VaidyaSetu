import React from 'react';
import useOnboardingStore from '../../store/useOnboardingStore';
import { ChevronRight, ChevronLeft, Moon, Zap, AlertTriangle, Cigarette, Wine } from 'lucide-react';

const Step2Lifestyle = () => {
  const { formData, updateFormData, setStep } = useOnboardingStore();

  const OptionButton = ({ label, value, current, onClick, icon: Icon }) => (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center ${current === value
          ? 'bg-emerald-500/10 dark:bg-emerald-600/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-lg shadow-emerald-500/10'
          : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-emerald-500/50 hover:text-emerald-500 transition-colors'
        }`}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {label}
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Activity Level */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 flex items-center">
          <Zap className="w-4 h-4 mr-2 text-emerald-500" />
          Physical Activity Level
        </label>
        <div className="flex gap-3">
          {['Sedentary', 'Moderate', 'Active'].map((level) => (
            <OptionButton
              key={level}
              label={level}
              value={level}
              current={formData.activityLevel}
              onClick={(v) => updateFormData({ activityLevel: v })}
            />
          ))}
        </div>
      </div>

      {/* Sleep */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 flex items-center">
          <Moon className="w-4 h-4 mr-2 text-emerald-500" />
          Daily Sleep Duration
        </label>
        <div className="flex gap-3">
          {['<5', '5-7', '7-9', '>9'].map((hours) => (
            <OptionButton
              key={hours}
              label={`${hours} hrs`}
              value={hours}
              current={formData.sleepHours}
              onClick={(v) => updateFormData({ sleepHours: v })}
            />
          ))}
        </div>
      </div>

      {/* Stress */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 text-emerald-500" />
          General Stress Level
        </label>
        <div className="flex gap-3">
          {['Low', 'Medium', 'High'].map((level) => (
            <OptionButton
              key={level}
              label={level}
              value={level}
              current={formData.stressLevel}
              onClick={(v) => updateFormData({ stressLevel: v })}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 flex items-center">
            <Cigarette className="w-4 h-4 mr-2 text-emerald-500" />
            Smoking Habit
          </label>
          <div className="flex gap-3">
            <OptionButton label="Yes" value={true} current={formData.isSmoker} onClick={(v) => updateFormData({ isSmoker: v })} />
            <OptionButton label="No" value={false} current={formData.isSmoker} onClick={(v) => updateFormData({ isSmoker: v })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 flex items-center">
            <Wine className="w-4 h-4 mr-2 text-emerald-500" />
            Alcohol Consumption
          </label>
          <div className="flex gap-3">
            {['Never', 'Occasionally', 'Frequently'].map((v) => (
              <OptionButton key={v} label={v} value={v} current={formData.alcoholConsumption} onClick={(val) => updateFormData({ alcoholConsumption: val })} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => setStep(1)}
          className="flex-1 py-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all flex items-center justify-center group"
        >
          <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
        <button
          onClick={() => setStep(3)}
          disabled={!formData.activityLevel || !formData.sleepHours || !formData.stressLevel || formData.alcoholConsumption === ''}
          className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center group shadow-lg shadow-emerald-500/10"
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default Step2Lifestyle;
