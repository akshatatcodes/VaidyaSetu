import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Lightbulb, Star, Coffee, Leaf, Activity, AlertTriangle, 
  Shield, Heart, CheckCircle, ArrowRight
} from 'lucide-react';

const MitigationModal = ({ isOpen, onClose, steps, userProfile, diseaseId }) => {
  const [expandedId, setExpandedId] = useState(null);

  if (!isOpen) return null;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      case 'low': return 'bg-emerald-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'dietary': return <Coffee className="w-4 h-4" />;
      case 'lifestyle': return <Activity className="w-4 h-4" />;
      case 'monitoring': return <Star className="w-4 h-4" />;
      case 'precaution': return <Shield className="w-4 h-4" />;
      default: return <Leaf className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'dietary': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'lifestyle': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'monitoring': return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'precaution': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-white dark:bg-gray-950 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center">
                  <Lightbulb className="w-6 h-6 mr-2 text-yellow-500" />
                  Recovery Strategy & Precautions
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Personalized mitigation plan for {diseaseId?.replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* User Profile Considerations */}
              {userProfile && (
                <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/30">
                  <h3 className="text-sm font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3 flex items-center">
                    <Heart className="w-4 h-4 mr-2" />
                    Considering Your Profile
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {userProfile.allergies?.length > 0 && (
                      <div className="p-3 bg-white/50 dark:bg-gray-900/30 rounded-lg">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Allergies</p>
                        <p className="font-bold text-red-600 dark:text-red-400 mt-1">
                          {userProfile.allergies.join(', ')}
                        </p>
                      </div>
                    )}
                    {userProfile.activeMedications?.length > 0 && (
                      <div className="p-3 bg-white/50 dark:bg-gray-900/30 rounded-lg">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Medications</p>
                        <p className="font-bold text-blue-600 dark:text-blue-400 mt-1">
                          {userProfile.activeMedications.map(m => m.name).join(', ')}
                        </p>
                      </div>
                    )}
                    {userProfile.age && (
                      <div className="p-3 bg-white/50 dark:bg-gray-900/30 rounded-lg">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Age</p>
                        <p className="font-bold text-gray-900 dark:text-white mt-1">{userProfile.age} years</p>
                      </div>
                    )}
                    {userProfile.bmi && (
                      <div className="p-3 bg-white/50 dark:bg-gray-900/30 rounded-lg">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">BMI</p>
                        <p className="font-bold text-gray-900 dark:text-white mt-1">{userProfile.bmi}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Critical Precautions */}
              <div className="mb-8">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                  Critical Precautions
                </h3>
                <div className="space-y-3">
                  {steps?.filter(s => s.priority === 'high').map((step, idx) => (
                    <motion.div
                      key={step.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-500 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                            {step.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* All Mitigation Steps */}
              <div className="mb-8">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />
                  All Mitigation Steps
                </h3>
                <div className="space-y-3">
                  {steps?.map((step, idx) => (
                    <motion.div
                      key={step.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-colors"
                    >
                      <button
                        onClick={() => setExpandedId(expandedId === step.id ? null : step.id)}
                        className="w-full p-4 text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className={`p-2 rounded-lg ${getCategoryColor(step.category)}`}>
                            {getCategoryIcon(step.category)}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getPriorityColor(step.priority)}`}>
                                {step.priority}
                              </span>
                              <h4 className="font-bold text-gray-900 dark:text-white">
                                {step.title}
                              </h4>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {step.description}
                            </p>
                          </div>
                        </div>
                        <ArrowRight 
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedId === step.id ? 'rotate-90' : ''
                          }`} 
                        />
                      </button>

                      <AnimatePresence>
                        {expandedId === step.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-3 ${getCategoryColor(step.category)}`}>
                                {getCategoryIcon(step.category)}
                                <span className="ml-2">{step.category}</span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {step.description}
                              </p>
                              {step.isRegional && (
                                <div className="mt-3 inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                                  🇮🇳 Indian Context Applied
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Important Note */}
              <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Medical Disclaimer:</strong> These recommendations are based on clinical guidelines and your health profile. 
                  Always consult with a qualified healthcare provider before making significant changes to your treatment plan.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MitigationModal;
