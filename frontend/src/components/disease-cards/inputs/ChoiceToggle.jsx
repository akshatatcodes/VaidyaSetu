import React from 'react';
import { motion } from 'framer-motion';

const ChoiceToggle = ({ value, onChange, label }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all hover:border-emerald-500/20">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl">
        <button
          onClick={() => onChange('Yes')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${value === 'Yes' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Yes
        </button>
        <button
          onClick={() => onChange('No')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${value === 'No' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
        >
          No
        </button>
      </div>
    </div>
  );
};

export default ChoiceToggle;
