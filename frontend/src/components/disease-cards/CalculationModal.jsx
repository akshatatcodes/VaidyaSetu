import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Target, Info, Shield, AlertTriangle } from 'lucide-react';

const CalculationModal = ({ isOpen, onClose, factors, protective, finalScore, diseaseId }) => {
  if (!isOpen) return null;

  const getRiskColor = (score) => {
    if (score === -1) return '#6b7280';
    if (score >= 76) return '#ef4444';
    if (score >= 51) return '#f59e0b';
    if (score >= 26) return '#f59e0b';
    return '#10b981';
  };

  const getRiskLabel = (score) => {
    if (score === -1) return 'N/A';
    if (score >= 76) return 'Very High';
    if (score >= 51) return 'High';
    if (score >= 26) return 'Moderate';
    if (score >= 5) return 'Low';
    return 'Very Low';
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
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                  {diseaseId?.replace('_', ' ')} Risk Calculation
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Detailed breakdown of how your risk percentage is calculated
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
              {/* Score Summary Card */}
              <div className="mb-8 p-6 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">
                      Overall Risk Category
                    </p>
                    <p 
                      className="text-4xl font-black"
                      style={{ color: getRiskColor(finalScore) }}
                    >
                      {getRiskLabel(finalScore)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">
                      Risk Score
                    </p>
                    <p 
                      className="text-5xl font-black"
                      style={{ color: getRiskColor(finalScore) }}
                    >
                      {finalScore}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Factors Table */}
              <div className="mb-8">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-red-500" />
                  Risk Factors ({factors?.length || 0})
                </h3>
                <div className="space-y-3">
                  {factors?.map((factor, idx) => (
                    <motion.div
                      key={factor.id || idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              {factor.name}
                            </h4>
                            <span className="ml-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                              {factor.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {factor.explanation}
                          </p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="font-bold text-gray-500">
                              Your Value: <span className="text-gray-900 dark:text-white">{factor.displayValue}</span>
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <div className={`flex items-center font-black text-lg ${
                            factor.direction === 'increase' ? 'text-red-500' : 'text-emerald-500'
                          }`}>
                            {factor.direction === 'increase' ? (
                              <TrendingUp className="w-4 h-4 mr-1" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-1" />
                            )}
                            +{factor.impact}%
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Protective Factors */}
              {protective?.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-emerald-500" />
                    Protective Factors ({protective.length})
                  </h3>
                  <div className="space-y-3">
                    {protective.map((factor, idx) => (
                      <motion.div
                        key={factor.id || idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                              {factor.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {factor.explanation}
                            </p>
                          </div>
                          <div className="ml-4 text-emerald-500 font-black text-lg">
                            -{factor.impact}%
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Calculation Summary */}
              <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-blue-500" />
                  How is this calculated?
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white/50 dark:bg-gray-900/30 rounded-lg">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Step-by-Step Breakdown:</h4>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <p><strong>1. Baseline Risk:</strong> Starting from Indian population prevalence data (ICMR-INDIAB studies)</p>
                      <p><strong>2. Risk Factors Added:</strong> {factors?.length || 0} factors from your profile</p>
                      <div className="ml-4 space-y-1">
                        {factors?.slice(0, 5).map((f, idx) => (
                          <p key={idx} className="text-xs">• {f.name}: +{f.impact}% (Your value: {f.displayValue})</p>
                        ))}
                        {factors?.length > 5 && <p className="text-xs text-gray-500">...and {factors.length - 5} more</p>}
                      </div>
                      {protective?.length > 0 && (
                        <>
                          <p><strong>3. Protective Factors Subtracted:</strong> {protective.length} healthy behaviors</p>
                          <div className="ml-4 space-y-1">
                            {protective.map((f, idx) => (
                              <p key={idx} className="text-xs">• {f.name}: -{f.impact}%</p>
                            ))}
                          </div>
                        </>
                      )}
                      <p><strong>4. Final Score:</strong> Capped between 2-95% for clinical relevance</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white/50 dark:bg-gray-900/30 rounded-lg">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Your Profile Data Used:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <p>• Age, Gender, BMI</p>
                      <p>• Lifestyle factors</p>
                      <p>• Family history</p>
                      <p>• Clinical markers</p>
                      <p>• Allergies & Medications</p>
                      <p>• Symptoms & Vitals</p>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-lg">
                    <p className="text-xs text-emerald-800 dark:text-emerald-200">
                      <strong>Data Sources:</strong> ICMR-INDIAB 2023, NFHS-5, WHO Guidelines, Indian Diabetes Risk Score (IDRS)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CalculationModal;
