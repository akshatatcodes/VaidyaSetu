import React, { useEffect } from 'react';
import useOnboardingStore from '../../store/useOnboardingStore';
import { ChevronRight, Weight, ArrowUpCircle, User } from 'lucide-react';

const Step1Biometrics = () => {
  const { formData, updateFormData, setStep } = useOnboardingStore();

  const calculateBMI = (h, w) => {
    if (!h || !w) return null;
    const heightInMeters = h / 100;
    const bmi = (w / (heightInMeters * heightInMeters)).toFixed(1);
    
    let category = '';
    let colorClass = '';
    
    // ICMR Indian Cutoffs
    if (bmi < 18.5) {
      category = 'Underweight';
      colorClass = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    } else if (bmi >= 18.5 && bmi < 23) {
      category = 'Normal';
      colorClass = 'text-green-400 bg-green-500/10 border-green-500/20';
    } else if (bmi >= 23 && bmi < 27.5) {
      category = 'Overweight';
      colorClass = 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    } else {
      category = 'Obese';
      colorClass = 'text-red-400 bg-red-500/10 border-red-500/20';
    }
    
    return { value: bmi, category, colorClass };
  };

  useEffect(() => {
    const bmiInfo = calculateBMI(formData.height, formData.weight);
    if (bmiInfo) {
      updateFormData({ 
        bmi: bmiInfo.value, 
        bmiCategory: bmiInfo.category 
      });
    }
  }, [formData.height, formData.weight]);

  const bmiInfo = calculateBMI(formData.height, formData.weight);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center">
            <User className="w-4 h-4 mr-2 text-emerald-500" />
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName || ''}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
            placeholder="e.g. Rahul"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center">
            <User className="w-4 h-4 mr-2 text-emerald-500" />
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName || ''}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
            placeholder="e.g. Sharma"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center">
            <User className="w-4 h-4 mr-2 text-emerald-500" />
            Age
          </label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => updateFormData({ age: e.target.value })}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            placeholder="e.g. 28"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center">
            <User className="w-4 h-4 mr-2 text-emerald-500" />
            Gender
          </label>
          <select
            value={formData.gender}
            onChange={(e) => updateFormData({ gender: e.target.value })}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-gray-300 focus:outline-none focus:border-emerald-500 transition-all font-medium appearance-none"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center">
            <ArrowUpCircle className="w-4 h-4 mr-2 text-emerald-500" />
            Height (cm)
          </label>
          <input
            type="number"
            value={formData.height}
            onChange={(e) => updateFormData({ height: e.target.value })}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
            placeholder="e.g. 175"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center">
            <Weight className="w-4 h-4 mr-2 text-emerald-500" />
            Weight (kg)
          </label>
          <input
            type="number"
            value={formData.weight}
            onChange={(e) => updateFormData({ weight: e.target.value })}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
            placeholder="e.g. 70"
          />
        </div>
      </div>

      {/* BMI Indicator */}
      {bmiInfo && (
        <div className={`mt-6 p-4 rounded-2xl border ${bmiInfo.colorClass} flex items-center justify-between animate-in zoom-in duration-300`}>
          <div>
             <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">Real-time BMI (ICMR)</span>
             <div className="text-2xl font-bold">{bmiInfo.value}</div>
          </div>
          <div className="text-right">
             <div className={`text-sm font-bold uppercase tracking-tight`}>{bmiInfo.category}</div>
             <p className="text-[9px] opacity-60">Indian Standards</p>
          </div>
        </div>
      )}

      <button
        onClick={() => setStep(2)}
        disabled={!formData.firstName || !formData.lastName || !formData.age || !formData.gender || !formData.height || !formData.weight}
        className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center group shadow-lg shadow-emerald-500/10"
      >
        Next Step
        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

export default Step1Biometrics;
