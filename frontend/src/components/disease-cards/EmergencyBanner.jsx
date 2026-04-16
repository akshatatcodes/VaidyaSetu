import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, X, ShieldAlert, Check } from 'lucide-react';

const EmergencyBanner = ({ alert, onTrackCall }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!alert) return null;

  const handleDial = () => {
    if (onTrackCall) onTrackCall(alert.id, alert.callContact);
    window.location.href = `tel:${alert.callContact}`;
    setShowConfirm(false);
  };

  return (
    <>
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="mb-4 overflow-hidden"
      >
        <div className="p-4 bg-rose-600 rounded-3xl text-white shadow-xl shadow-rose-600/20 border border-rose-500/50">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-[11px] font-black uppercase tracking-widest bg-white/20 inline-block px-2 py-0.5 rounded-lg mb-2">
                CRITICAL WARNING
              </h4>
              <h5 className="font-black text-lg leading-tight mb-1">{alert.title}</h5>
              <p className="text-sm font-bold opacity-90 leading-relaxed mb-4">
                {alert.message}
              </p>
              
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10 mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2 underline decoration-skip-ink">Immediate Actions:</p>
                <div className="space-y-1">
                  {alert.instructions.split('\n').map((line, i) => (
                    <p key={i} className="text-xs font-bold flex items-start space-x-2">
                      <span className="opacity-60">{i + 1}.</span>
                      <span>{line.replace(/^\d+\.\s*/, '')}</span>
                    </p>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setShowConfirm(true)}
                className="w-full py-4 bg-white text-rose-600 rounded-2xl font-black text-sm flex items-center justify-center space-x-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Phone className="w-5 h-5" />
                <span>START EMERGENCY CALL (108)</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal (User Request) */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-gray-950 rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 text-center"
            >
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
                Confirm Emergency Call?
              </h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                You are about to call <strong>{alert.callContact}</strong> ({alert.helplineName}). Are you sure you wish to proceed with this emergency request?
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4 mr-1 inline" /> Cancel
                </button>
                <button 
                  onClick={handleDial}
                  className="py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20"
                >
                  <Check className="w-4 h-4 mr-1 inline" /> YES, CALL NOW
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EmergencyBanner;
