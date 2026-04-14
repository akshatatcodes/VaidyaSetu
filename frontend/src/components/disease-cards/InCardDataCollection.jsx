import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import ChoiceToggle from './inputs/ChoiceToggle';
import NumericInput from './inputs/NumericInput';
import FrequencySlider from './inputs/FrequencySlider';
import DatePicker from './inputs/DatePicker';

const InCardDataCollection = ({ missingFactors, onSubmit, loading }) => {
  const [formData, setFormData] = useState({});
  const [testDates, setTestDates] = useState({});

  const ranges = {
    waistCircumference: { min: 60, max: 90, unit: 'cm' },
    hba1c: { min: 4.0, max: 5.6, unit: '%' },
    fastingBloodSugar: { min: 70, max: 99, unit: 'mg/dL' },
    postPrandialSugar: { min: 70, max: 140, unit: 'mg/dL' },
    bmi: { min: 18.5, max: 24.9, unit: 'kg/m2' }
  };

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Object.keys(formData).length === 0) return;
    
    // Combine data with dates if applicable
    const submission = { ...formData };
    Object.keys(testDates).forEach(key => {
      if (submission[key]) {
        submission[`${key}_date`] = testDates[key];
      }
    });
    onSubmit(submission);
  };

  if (missingFactors.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] text-center"
      >
        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <h5 className="text-emerald-700 dark:text-emerald-400 font-bold mb-1">Assessment Optimized</h5>
        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60 font-medium">
          You have provided all high-impact data points for this condition. Your risk score is currently at peak clinical accuracy.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h5 className="font-bold text-gray-900 dark:text-white flex items-center">
            Refine Calculation Accuracy
          </h5>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">
            Your risk score is currently an estimate. Provide these details for a validated clinical screening.
          </p>
        </div>
        <div className="flex -space-x-2">
           {missingFactors.slice(0, 3).map((f, i) => (
             <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-950 bg-amber-500 flex items-center justify-center text-[8px] text-white font-bold" title={f.name}>
               !
             </div>
           ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {missingFactors.map((factor) => (
          <motion.div 
            key={factor.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {factor.type === 'number' ? (
              <NumericInput
                label={factor.name}
                value={formData[factor.id]}
                onChange={(val) => handleInputChange(factor.id, val)}
                unit={ranges[factor.id]?.unit || factor.id === 'waistCircumference' ? 'cm' : undefined}
                min={ranges[factor.id]?.min}
                max={ranges[factor.id]?.max}
                placeholder={factor.prompt}
                testDate={testDates[factor.id]}
                onDateChange={(date) => setTestDates(prev => ({ ...prev, [factor.id]: date }))}
              />
            ) : factor.id.toLowerCase().includes('date') ? (
              <DatePicker
                label={factor.prompt || factor.name}
                value={formData[factor.id]}
                onChange={(val) => handleInputChange(factor.id, val)}
              />
            ) : factor.id.toLowerCase().includes('fatigue') || factor.id.toLowerCase().includes('weight') || factor.id.toLowerCase().includes('frequency') ? (
              <FrequencySlider
                label={factor.prompt || factor.name}
                value={formData[factor.id]}
                onChange={(val) => handleInputChange(factor.id, val)}
              />
            ) : (
              <ChoiceToggle
                label={factor.prompt || factor.name}
                value={formData[factor.id]}
                onChange={(val) => handleInputChange(factor.id, val)}
              />
            )}
          </motion.div>
        ))}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || Object.keys(formData).length === 0}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all disabled:opacity-50 shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-2 border-t border-emerald-400/20 mt-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Update Biometric Profile</span>
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
};

export default InCardDataCollection;
