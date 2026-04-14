import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clipboard, CheckCircle, Search, Stethoscope, Hospital } from 'lucide-react';
import DoctorFinderModule from './DoctorFinderModule';

const DoctorConsultation = ({ triggers, diseaseName, riskScore, profile, profileSettings, clerkId }) => {
  const [copied, setCopied] = useState(false);

  if (!triggers || triggers.triggers.length === 0) return null;

  const generateSummary = () => {
    const lines = [
      `VaidyaSetu - Clinical Screening Summary`,
      `=======================================`,
      `Context: Patient-reported screening for ${diseaseName.replace('_', ' ')}`,
      `Screening Date: ${new Date().toLocaleDateString()}`,
      ``,
      `Reported Metrics:`,
      `- Age: ${profile.age?.value || profile.age}`,
      `- Gender: ${profile.gender?.value || profile.gender}`,
      `- BMI: ${profile.bmi?.value || profile.bmi}`,
      `- Reported Symptoms: ${Object.entries(profile).filter(([k, v]) => v?.value === 'Yes').map(([k]) => k).join(', ') || 'None reported'}`,
      ``,
      `Engine Results:`,
      `- Estimated Risk Score: ${riskScore}%`,
      `- Suggested Specialist: ${triggers.specialist}`,
      `- Triggers for Consultation:`,
      ...triggers.triggers.map(t => `  * ${t}`),
      ``,
      `DISCLAIMER: This is an AI-generated health summary based on self-reported data. It is NOT a clinical diagnosis. Please share this with your professional healthcare provider during your consultation.`
    ];
    return lines.join('\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateSummary());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-6 rounded-[2rem] border ${triggers.urgent ? 'bg-rose-500/5 border-rose-500/20' : 'bg-amber-500/5 border-amber-500/20'} space-y-5`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${triggers.urgent ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'}`}>
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h5 className={`font-black uppercase tracking-tighter text-sm ${triggers.urgent ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
              Clinical Consultation {triggers.urgent ? 'Required' : 'Recommended'}
            </h5>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
              Target Specialist: {triggers.specialist}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {triggers.triggers.map((trigger, i) => (
          <div key={i} className="flex items-start space-x-3">
            <AlertCircle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${triggers.urgent ? 'text-rose-500' : 'text-amber-500'}`} />
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
              {trigger}
            </p>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-4">
        {/* Step 47: Shareable Summary Tool */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleCopy}
          className="w-full py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-3 transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {copied ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-500 tracking-normal">Medical Summary Copied to Clipboard</span>
            </>
          ) : (
            <>
              <Clipboard className="w-4 h-4 text-gray-400" />
              <span>Generate Summary for Doctor Visit</span>
            </>
          )}
        </motion.button>

        {/* Step 51: Intelligent Discovery Module */}
        <DoctorFinderModule 
          specialistData={triggers.specialistData}
          riskScore={riskScore}
          diseaseId={diseaseName}
          clerkId={clerkId}
          profileSettings={profileSettings}
          isUrgent={triggers.urgent}
        />
      </div>
    </div>
  );
};

export default DoctorConsultation;
