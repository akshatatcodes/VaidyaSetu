import React from 'react';
import { Thermometer, Calendar } from 'lucide-react';

const NumericInput = ({ value, onChange, label, unit, placeholder, min, max, testDate, onDateChange }) => {
  const numVal = parseFloat(value);
  let status = null;
  let statusColor = 'text-gray-400';
  
  if (!isNaN(numVal) && min !== undefined && max !== undefined) {
    if (numVal < min) {
      status = 'Low';
      statusColor = 'text-blue-500';
    } else if (numVal > max) {
      status = 'High';
      statusColor = 'text-rose-500';
    } else {
      status = 'Normal';
      statusColor = 'text-emerald-500';
    }
  }

  return (
    <div className="flex flex-col space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all hover:border-emerald-500/20">
      <div className="flex justify-between items-center px-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {status && (
          <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor} bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-current opacity-70`}>
            {status}
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white dark:bg-gray-800 border-none rounded-xl py-3 px-4 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-gray-400">
            {unit}
          </span>
        )}
      </div>

      {/* Test Date Option (Step 33) */}
      <div className="flex items-center mt-1 px-1">
        <Calendar className="w-3 h-3 text-gray-400 mr-2" />
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mr-2">Test Date:</span>
        <input 
          type="date"
          value={testDate || ''}
          max={new Date().toISOString().split('T')[0]}
          onChange={(e) => onDateChange(e.target.value)}
          className="bg-transparent border-none p-0 text-[10px] font-bold text-emerald-500 focus:ring-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default NumericInput;
