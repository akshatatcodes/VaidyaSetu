import React from 'react';
import useOnboardingStore from '../../store/useOnboardingStore';
import { ChevronRight, ChevronLeft, Salad, Coffee, Cookie, Pizza } from 'lucide-react';

const Step3Diet = () => {
  const { formData, updateFormData, setStep } = useOnboardingStore();

  const OptionButton = ({ label, value, current, onClick, icon: Icon }) => (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center ${current === value
          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
          : 'bg-gray-950 border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-600'
        }`}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {label}
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Diet Type */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 flex items-center">
          <Salad className="w-4 h-4 mr-2 text-emerald-500" />
          Primary Diet Type
        </label>
        <div className="flex gap-3">
          {['Veg', 'Non-Veg', 'Mixed'].map((type) => (
            <OptionButton
              key={type}
              label={type}
              value={type}
              current={formData.dietType}
              onClick={(v) => updateFormData({ dietType: v })}
            />
          ))}
        </div>
      </div>

      {/* Sugar & Salt */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 flex items-center">
            <Coffee className="w-4 h-4 mr-2 text-emerald-500" />
            Sugar Intake
          </label>
          <div className="flex gap-2">
            {['Low', 'Medium', 'High'].map((v) => (
              <OptionButton key={v} label={v} value={v} current={formData.sugarIntake} onClick={(val) => updateFormData({ sugarIntake: val })} />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 flex items-center">
            <Cookie className="w-4 h-4 mr-2 text-emerald-500" />
            Salt Intake
          </label>
          <div className="flex gap-2">
            {['Low', 'Medium', 'High'].map((v) => (
              <OptionButton key={v} label={v} value={v} current={formData.saltIntake} onClick={(val) => updateFormData({ saltIntake: val })} />
            ))}
          </div>
        </div>
      </div>

      {/* Junk Food */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 flex items-center">
          <Pizza className="w-4 h-4 mr-2 text-emerald-500" />
          Junk Food Frequency
        </label>
        <div className="flex gap-3">
          {['Rare', 'Weekly', 'Daily'].map((v) => (
            <OptionButton
              key={v}
              label={v}
              value={v}
              current={formData.junkFoodFrequency}
              onClick={(val) => updateFormData({ junkFoodFrequency: val })}
            />
          ))}
        </div>
      </div>

      {/* Greens & Fruits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-4">
            Regular Leafy Greens?
          </label>
          <div className="flex gap-3">
            <OptionButton label="Yes" value={true} current={formData.eatsLeafyGreens} onClick={(v) => updateFormData({ eatsLeafyGreens: v })} />
            <OptionButton label="No" value={false} current={formData.eatsLeafyGreens} onClick={(v) => updateFormData({ eatsLeafyGreens: v })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-4">
            Regular Fresh Fruits?
          </label>
          <div className="flex gap-3">
            <OptionButton label="Yes" value={true} current={formData.eatsFruits} onClick={(v) => updateFormData({ eatsFruits: v })} />
            <OptionButton label="No" value={false} current={formData.eatsFruits} onClick={(v) => updateFormData({ eatsFruits: v })} />
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => setStep(2)}
          className="flex-1 py-4 bg-gray-950 border border-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-900 transition-all flex items-center justify-center group"
        >
          <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
        <button
          onClick={() => setStep(4)}
          disabled={!formData.dietType || !formData.sugarIntake || !formData.saltIntake || !formData.junkFoodFrequency}
          className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center group shadow-lg shadow-emerald-500/10"
        >
          Final Step
          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default Step3Diet;
