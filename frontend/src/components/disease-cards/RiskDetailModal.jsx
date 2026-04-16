import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  X, TrendingUp, Shield, AlertTriangle, Lightbulb, 
  Info, Activity, Coffee, Star, Leaf,
  CheckCircle, ArrowRight, Heart
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../../config/api';

const RiskDetailModal = ({ isOpen, onClose, diseaseId, score, details, userProfile, loading, onOpenQuestionnaire, clerkId }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('calculation'); // 'calculation' or 'mitigation'
  const [expandedStep, setExpandedStep] = useState(null);
  const [localCompletedMitigationStepIds, setLocalCompletedMitigationStepIds] = useState(() => details?.completedMitigationStepIds || []);

  useEffect(() => {
    setLocalCompletedMitigationStepIds(details?.completedMitigationStepIds || []);
  }, [details?.completedMitigationStepIds]);

  const getRiskColor = (score) => {
    if (score === -1) return '#6b7280';
    if (score > 70) return '#ef4444';
    if (score >= 40) return '#f59e0b';
    return '#10b981';
  };

  const getRiskLabel = (score) => {
    if (score === -1) return 'N/A';
    if (score > 70) return 'Elevated';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

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

  const normalizeFactor = (factor, idx) => {
    if (!factor || typeof factor !== 'object') {
      return { id: `f_${idx}`, name: 'Factor', displayValue: '—', impact: 0, direction: 'increase', category: 'General' };
    }
    const name = factor.name || factor.question || 'Risk factor';
    const displayValue = factor.displayValue || factor.answer || '—';
    const impactNum = Math.abs(Number(factor.impact || factor.points || 0));
    const direction = factor.direction || (factor.points < 0 ? 'decrease' : 'increase');

    return {
      id: factor.id || `f_${idx}`,
      name,
      displayValue,
      explanation: factor.explanation || '',
      category: factor.category || factor.meta || 'profile',
      impact: impactNum,
      direction
    };
  };

  const handleMarkMitigationDone = async (stepId) => {
    if (!clerkId || !stepId) return;
    try {
      await axios.post(`${API_URL}/mitigations/${diseaseId}/${stepId}/complete`, { clerkId });
      setLocalCompletedMitigationStepIds((prev) => (prev.includes(stepId) ? prev : [...prev, stepId]));
      if (window.refreshDashboard) {
        setTimeout(() => window.refreshDashboard(false), 2500);
      }
    } catch (err) {
      console.error('[RiskDetailModal] Mitigation complete error:', err);
    }
  };

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300, duration: 0.4 }}
            className="relative w-full max-w-5xl h-[90vh] md:h-[85vh] bg-white dark:bg-gray-950 rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-auto border border-white/10 mx-4"
          >
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                 <Activity className="w-16 h-16 text-emerald-500 animate-pulse mb-6" />
                 <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Analyzing Vectors...</h2>
              </div>
            ) : !details ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                 <AlertTriangle className="w-16 h-16 text-amber-500 mb-6" />
                 <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Data Unavailable</h2>
                 <p className="text-gray-500 mb-8 max-w-sm">We couldn't retrieve the clinical breakdown. Please try again.</p>
                 <button onClick={onClose} className="px-8 py-3 bg-gray-100 rounded-2xl font-bold">Return</button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-6 md:p-10 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl sticky top-0 z-20">
                  <div className="flex items-center gap-6">
                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white dark:bg-gray-900 flex items-center justify-center shadow-2xl border border-gray-100 dark:border-white/10">
                       <Activity className="w-8 h-8 md:w-10 md:h-10" style={{ color: getRiskColor(score) }} />
                    </div>
                    <div>
                      <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white capitalize tracking-tighter leading-none">
                        {diseaseId?.replace(/_/g, ' ')}
                      </h2>
                      <div className="flex items-center gap-4 mt-3">
                         <span className="text-sm font-black uppercase tracking-widest text-gray-500">{getRiskLabel(score)} Risk</span>
                         <span className="text-2xl font-black" style={{ color: getRiskColor(score) }}>{score}%</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-4 bg-gray-100 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex px-10 border-b border-gray-100 dark:border-white/5">
                  <button onClick={() => setActiveTab('calculation')} className={`px-8 py-5 font-black text-[11px] uppercase tracking-[0.2em] relative ${activeTab === 'calculation' ? 'text-emerald-500' : 'text-gray-400'}`}>
                    Risk Vectors
                    {activeTab === 'calculation' && <motion.div layoutId="tLine" className="absolute bottom-0 left-8 right-8 h-1 bg-emerald-500 rounded-t-full" />}
                  </button>
                  <button onClick={() => setActiveTab('mitigation')} className={`px-8 py-5 font-black text-[11px] uppercase tracking-[0.2em] relative ${activeTab === 'mitigation' ? 'text-blue-500' : 'text-gray-400'}`}>
                    Action Strategy
                    {activeTab === 'mitigation' && <motion.div layoutId="tLine" className="absolute bottom-0 left-8 right-8 h-1 bg-blue-500 rounded-t-full" />}
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
                   {activeTab === 'calculation' ? (
                     <div className="max-w-4xl mx-auto space-y-10">
                        <div className="p-8 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-[2.5rem] border border-indigo-500/10">
                           <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500 mb-4">Clinical Perspective</h3>
                           <p className="text-lg md:text-xl font-bold italic text-slate-800 dark:text-gray-100 leading-relaxed">
                              "{details.summary || `Analysis indicates ${details.factorBreakdown?.length || 0} active biomarkers driving this profile.`}"
                           </p>
                           <button onClick={onOpenQuestionnaire} className="mt-8 flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/5 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                              Refine Clinical Score <ArrowRight className="w-4 h-4" />
                           </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-4">
                              <h3 className="font-black text-gray-900 dark:text-white pb-2 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-red-500" /> Aggravating Vectors
                              </h3>
                              {details.factorBreakdown?.map((f, i) => {
                                const factor = normalizeFactor(f, i);
                                return (
                                  <div key={i} className="p-5 bg-red-500/5 border border-red-500/10 rounded-3xl flex items-center justify-between">
                                     <div>
                                        <div className="text-[10px] uppercase font-black text-gray-400">{factor.category}</div>
                                        <div className="font-bold">{factor.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">Observed: <span className="text-red-500 font-bold">{factor.displayValue}</span></div>
                                     </div>
                                     <div className="text-right">
                                        <div className="text-lg font-black text-red-500">+{factor.impact}%</div>
                                     </div>
                                  </div>
                                );
                              })}
                           </div>

                           <div className="space-y-4">
                              <h3 className="font-black text-gray-900 dark:text-white pb-2 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-500" /> Protective Buffers
                              </h3>
                              {details.protectiveFactors?.map((f, i) => (
                                <div key={i} className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-center justify-between">
                                   <div>
                                      <div className="font-bold">{f.name}</div>
                                      <div className="text-xs text-emerald-500 mt-1">{f.explanation}</div>
                                   </div>
                                   <div className="text-right">
                                      <div className="text-lg font-black text-emerald-500">-{f.impact}%</div>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="max-w-4xl mx-auto space-y-6">
                        {details.mitigationSteps?.map((step, idx) => (
                          <div key={idx} className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-white/10 p-8 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row gap-8">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${getCategoryColor(step.category)}`}>
                                {getCategoryIcon(step.category)}
                             </div>
                             <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getPriorityColor(step.priority)}`}>{step.priority} Priority</span>
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{step.title}</h4>
                                <p className="text-slate-600 dark:text-gray-400 text-base leading-relaxed mb-6 font-medium">{step.description}</p>
                                <button
                                   onClick={() => handleMarkMitigationDone(step.id)}
                                   disabled={localCompletedMitigationStepIds.includes(step.id)}
                                   className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                                      localCompletedMitigationStepIds.includes(step.id) ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
                                   }`}
                                >
                                   {localCompletedMitigationStepIds.includes(step.id) ? 'Integrated' : 'Mark as Applied'}
                                </button>
                             </div>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default RiskDetailModal;
