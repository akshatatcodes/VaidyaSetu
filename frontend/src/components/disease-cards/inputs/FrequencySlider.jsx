import React from 'react';
import { motion } from 'framer-motion';

const FrequencySlider = ({ value, onChange, label }) => {
  const options = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
  const currentIndex = options.indexOf(value) === -1 ? 0 : options.indexOf(value);

  return (
    <div className="flex flex-col space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all hover:border-emerald-500/20">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          {options[currentIndex]}
        </span>
      </div>
      
      <div className="relative pt-2 pb-6 px-2">
        <input
          type="range"
          min="0"
          max="4"
          step="1"
          value={currentIndex}
          onChange={(e) => onChange(options[parseInt(e.target.value)])}
          className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between mt-2">
          {options.map((opt, i) => (
            <div key={opt} className="flex flex-col items-center">
               <div className={`w-1 h-1 rounded-full mb-1 ${i === currentIndex ? 'bg-emerald-500 scale-150' : 'bg-gray-300 dark:bg-gray-700'}`} />
               <span className={`text-[8px] font-bold uppercase tracking-tighter ${i === currentIndex ? 'text-emerald-500' : 'text-gray-400'}`}>
                 {opt}
               </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FrequencySlider;
