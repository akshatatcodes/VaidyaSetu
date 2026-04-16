import React, { useEffect } from 'react';
import useOnboardingStore from '../../store/useOnboardingStore';
import { ChevronRight, Weight, ArrowUpCircle, User, Calendar, Users, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const InputWrapper = ({ label, icon: Icon, children }) => (
  <div className="group space-y-1.5 focus-within:z-20">
    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 flex items-center ml-1 transition-colors group-focus-within:text-emerald-500">
      <Icon className="w-2.5 h-2.5 mr-1.5" />
      {label}
    </label>
    <div className="relative">
      {children}
      <div className="absolute inset-x-4 bottom-0 h-[1.5px] bg-emerald-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 transform-gpu" />
    </div>
  </div>
);

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
      colorClass = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
    } else if (bmi >= 18.5 && bmi < 23) {
      category = 'Normal';
      colorClass = 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20';
    } else if (bmi >= 23 && bmi < 27.5) {
      category = 'Overweight';
      colorClass = 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20';
    } else {
      category = 'Obese';
      colorClass = 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
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

  const inputClasses = "w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium placeholder:text-gray-300 dark:placeholder:text-gray-700";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputWrapper label="First Name" icon={User}>
          <input
            type="text"
            value={formData.firstName || ''}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            className={inputClasses}
            placeholder="e.g. Rahul"
          />
        </InputWrapper>

        <InputWrapper label="Last Name" icon={User}>
          <input
            type="text"
            value={formData.lastName || ''}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            className={inputClasses}
            placeholder="e.g. Sharma"
          />
        </InputWrapper>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InputWrapper label="Age" icon={Calendar}>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => updateFormData({ age: e.target.value })}
            className={inputClasses}
            placeholder="25"
          />
        </InputWrapper>

        <InputWrapper label="Height" icon={ArrowUpCircle}>
          <div className="relative">
            <input
              type="number"
              value={formData.height}
              onChange={(e) => updateFormData({ height: e.target.value })}
              className={`${inputClasses} pr-10`}
              placeholder="175"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400">CM</span>
          </div>
        </InputWrapper>

        <InputWrapper label="Weight" icon={Weight}>
          <div className="relative">
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => updateFormData({ weight: e.target.value })}
              className={`${inputClasses} pr-10`}
              placeholder="70"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400">KG</span>
          </div>
        </InputWrapper>

        <InputWrapper label="Gender" icon={Users}>
          <select
            value={formData.gender}
            onChange={(e) => updateFormData({ gender: e.target.value })}
            className={`${inputClasses} appearance-none cursor-pointer`}
          >
            <option value="">--</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </InputWrapper>
      </div>

      {bmiInfo && (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border ${bmiInfo.colorClass} relative overflow-hidden group shadow-md transition-all duration-500`}
        >
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-125 transition-transform duration-700">
             <Activity className="w-12 h-12" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
               <p className="text-[8px] uppercase tracking-widest font-black opacity-60 mb-0.5">Live BMI Status</p>
               <div className="flex items-baseline space-x-1.5">
                 <span className="text-2xl font-black">{bmiInfo.value}</span>
                 <span className="text-[10px] font-bold opacity-70">kg/m²</span>
               </div>
            </div>
            <div className="text-right">
               <div className="px-3 py-1 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-black/5 dark:border-white/5 inline-block mb-0.5">
                 <span className="text-[11px] font-black uppercase tracking-tight">{bmiInfo.category}</span>
               </div>
               <p className="text-[8px] font-bold opacity-50 block uppercase tracking-tighter italic">ICMR Indian Standard</p>
            </div>
          </div>
        </motion.div>
      )}

      <button
        onClick={() => setStep(2)}
        disabled={!formData.firstName || !formData.lastName || !formData.age || !formData.gender || !formData.height || !formData.weight}
        className="w-full mt-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed text-white text-sm font-black rounded-2xl transition-all flex items-center justify-center group shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
      >
        Continue to Lifestyle
        <ChevronRight className="w-5 h-5 ml-1.5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

export default Step1Biometrics;
