import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Activity, Heart, Shield, TrendingUp, Info
} from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import { API_URL } from '../../config/api';

const QuestionnaireModal = ({ isOpen, onClose, diseaseId, profile, onScoreUpdate }) => {
  const { t } = useTranslation();
  const [questionnaire, setQuestionnaire] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [calculatedScore, setCalculatedScore] = useState(null);
  const [scoreBreakdown, setScoreBreakdown] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestionnaire = useCallback(async () => {
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/diseases/${diseaseId}/questionnaire`);
      if (res.data.status === 'success') {
        setQuestionnaire(res.data.data);
      } else {
        setError(res.data.message || 'Failed to load assessment data');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Network error occurred');
    }
  }, [diseaseId]);

  useEffect(() => {
    if (isOpen && !questionnaire) {
      fetchQuestionnaire();
    }
    if (!isOpen) {
      // Reset state on close
      setAnswers({});
      setCurrentStep(0);
      setCalculatedScore(null);
      setScoreBreakdown(null);
    }
  }, [isOpen, diseaseId, fetchQuestionnaire]);

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultiSelect = (questionId, optionValue) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      if (optionValue === 'none') return { ...prev, [questionId]: ['none'] };
      const filtered = current.filter(v => v !== 'none');
      return filtered.includes(optionValue) 
        ? { ...prev, [questionId]: filtered.filter(v => v !== optionValue) }
        : { ...prev, [questionId]: [...filtered, optionValue] };
    });
  };

  const handleSubmit = async () => {
    if (!profile?.clerkId) {
      setError('Missing session. Please refresh.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/diseases/${diseaseId}/questionnaire`, {
        clerkId: profile.clerkId,
        answers,
        userProfile: profile,
        recalculateFullRisk: true
      });
      
      if (res.data.status === 'success') {
        const d = res.data.data;
        setCalculatedScore(d.finalScore ?? d.riskScore);
        setScoreBreakdown({
          baseline: d.baselineScore,
          delta: d.assessmentDelta ?? d.questionnaireDelta ?? 0,
          details: d.assessmentFactors || d.factorBreakdown || []
        });
      }
    } catch (err) {
      setError('Calculation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async () => {
    if (onScoreUpdate && calculatedScore !== null) {
      await onScoreUpdate(diseaseId, calculatedScore, scoreBreakdown);
      onClose();
    }
  };

  if (!isOpen) return null;

  const questions = questionnaire?.questions || [];
  const currentQuestion = questions[currentStep];
  const progress = questions.length > 0 ? ((currentStep + (calculatedScore !== null ? questions.length : 0)) / (questions.length * 2)) * 100 : 0;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const hasCurrentAnswer = Array.isArray(currentAnswer)
    ? currentAnswer.length > 0
    : currentQuestion?.type === 'number'
      ? currentAnswer !== undefined && currentAnswer !== null && String(currentAnswer).trim() !== ''
      : currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '';

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6 lg:p-8 pointer-events-none">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="fixed inset-0 bg-gray-950/80 backdrop-blur-md pointer-events-auto"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-950 rounded-[2.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-auto border border-white/10"
        >
          {/* Header */}
          <div className="p-8 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl shrink-0">
             <div className="flex items-center justify-between mb-6">
                <div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1 block">Vector Refinement Protocol</span>
                   <h2 className="text-2xl font-black text-slate-900 dark:text-white capitalize tracking-tighter">
                      {diseaseId?.replace(/_/g, ' ')} Assessment
                   </h2>
                </div>
                <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all">
                   <X className="w-6 h-6" />
                </button>
             </div>
             
             <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                   animate={{ width: `${calculatedScore !== null ? 100 : progress}%` }}
                   className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" 
                />
             </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
             {!questionnaire && !error ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                   <Activity className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                   <p className="font-bold text-gray-400">Loading assessment matrix...</p>
                </div>
             ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
                   <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                   <h3 className="text-xl font-bold mb-2">Protocol Error</h3>
                   <p className="text-gray-500 mb-6">{error}</p>
                   <button onClick={fetchQuestionnaire} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold">Retry Connection</button>
                </div>
             ) : calculatedScore !== null ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                   <div className="p-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] text-white text-center shadow-2xl shadow-emerald-500/20">
                      <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-4 opacity-70">Recalculated Score</h3>
                      <div className="text-8xl font-black tracking-tighter mb-4">{calculatedScore}%</div>
                      <p className="max-w-md mx-auto font-medium opacity-90 leading-relaxed uppercase text-[11px] tracking-widest">
                         High precision analysis complete. Vector delta: {scoreBreakdown.delta > 0 ? '+' : ''}{scoreBreakdown.delta}%.
                      </p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10">
                         <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-5 h-5 text-blue-500" />
                            <h4 className="font-black text-xs uppercase tracking-widest">Baseline Profile</h4>
                         </div>
                         <div className="text-3xl font-black">{scoreBreakdown.baseline}%</div>
                         <p className="text-xs text-gray-500 mt-2">Initial score based on onboard markers.</p>
                      </div>
                      <div className="p-8 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10">
                         <div className="flex items-center gap-3 mb-4">
                            <Activity className="w-5 h-5 text-emerald-500" />
                            <h4 className="font-black text-xs uppercase tracking-widest">Assessment Impact</h4>
                         </div>
                         <div className="text-3xl font-black" style={{ color: scoreBreakdown.delta > 0 ? '#ef4444' : '#10b981' }}>
                            {scoreBreakdown.delta > 0 ? '+' : ''}{scoreBreakdown.delta}%
                         </div>
                         <p className="text-xs text-gray-500 mt-2">Change from questionnaire responses.</p>
                      </div>
                   </div>
                </motion.div>
             ) : (
                <div className="max-w-2xl mx-auto">
                   <AnimatePresence mode="wait">
                      <motion.div
                         key={currentStep}
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, x: -20 }}
                         className="space-y-8"
                      >
                         <div>
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-full mb-4 inline-block">
                               Question {currentStep + 1} of {questions.length}
                            </span>
                            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-gray-100 leading-tight tracking-tight">
                               {currentQuestion.question}
                            </h3>
                         </div>

                         <div className="grid grid-cols-1 gap-4">
                            {!currentQuestion ? (
                              <div className="p-6 rounded-3xl border border-red-200 bg-red-50 text-red-600 text-sm font-bold">
                                Unable to load this question. Please close and reopen the assessment.
                              </div>
                            ) : currentQuestion.type === 'number' ? (
                              <div className="p-6 rounded-3xl border-2 border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 block">
                                  Enter value {currentQuestion.unit ? `(${currentQuestion.unit})` : ''}
                                </label>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  min="0"
                                  value={answers[currentQuestion.id] ?? ''}
                                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                                  placeholder={currentQuestion.placeholder || 'Enter value'}
                                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-4 text-lg font-black text-slate-900 dark:text-white outline-none focus:border-blue-500"
                                />
                              </div>
                            ) : (currentQuestion.options || []).map((opt) => {
                               const selected = currentQuestion.type === 'multi-select' 
                                 ? (answers[currentQuestion.id] || []).includes(opt.value)
                                 : answers[currentQuestion.id] === opt.value;
                               
                               return (
                                  <button
                                     key={opt.value}
                                     onClick={() => currentQuestion.type === 'multi-select' 
                                        ? handleMultiSelect(currentQuestion.id, opt.value)
                                        : handleAnswer(currentQuestion.id, opt.value)
                                     }
                                     className={`p-6 rounded-3xl border-2 text-left transition-all ${
                                        selected 
                                        ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10' 
                                        : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'
                                     }`}
                                  >
                                     <div className="flex items-center justify-between">
                                        <span className={`font-bold text-lg ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-gray-400'}`}>
                                           {opt.label}
                                        </span>
                                        {selected && <CheckCircle className="w-6 h-6 text-blue-500" />}
                                     </div>
                                  </button>
                               );
                            })}
                         </div>
                      </motion.div>
                   </AnimatePresence>
                </div>
             )}
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-gray-950/50 shrink-0">
             <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
                {calculatedScore !== null ? (
                   <button 
                      onClick={handleFinish}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                   >
                      Integrate Results <CheckCircle className="w-5 h-5" />
                   </button>
                ) : (
                   <>
                      <button
                         onClick={() => setCurrentStep(s => s - 1)}
                         disabled={currentStep === 0}
                         className="px-8 py-4 font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 disabled:opacity-0 transition-all"
                      >
                         Phase Back
                      </button>
                      
                      {currentStep === questions.length - 1 ? (
                         <button
                            onClick={handleSubmit}
                            disabled={submitting || !hasCurrentAnswer}
                            className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 disabled:opacity-30 transition-all flex items-center gap-3"
                         >
                            {submitting ? 'Synthesizing...' : 'Generate Matrix'} <ChevronRight className="w-4 h-4" />
                         </button>
                      ) : (
                         <button
                            onClick={() => setCurrentStep(s => s + 1)}
                            disabled={!hasCurrentAnswer}
                            className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl disabled:opacity-30 transition-all flex items-center gap-3"
                         >
                            Next Vector <ChevronRight className="w-4 h-4" />
                         </button>
                      )}
                   </>
                )}
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default QuestionnaireModal;
