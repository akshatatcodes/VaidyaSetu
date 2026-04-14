import React from 'react';
import { Calendar } from 'lucide-react';

const DatePicker = ({ value, onChange, label, maxDate }) => {
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <div className="flex flex-col space-y-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all hover:border-emerald-500/20">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1 flex items-center">
        <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400" />
        {label}
      </label>
      <input
        type="date"
        value={value || ''}
        max={maxDate || today}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white dark:bg-gray-800 border-none rounded-xl py-3 px-4 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
      />
    </div>
  );
};

export default DatePicker;
