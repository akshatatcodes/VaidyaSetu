import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, 
  Activity, Heart, Brain, Scale, Moon, Stethoscope, TrendingUp, TrendingDown, ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import { API_URL } from '../../config/api';

const QuestionnaireModal = ({ isOpen, onClose, diseaseId, currentScore, profile, onScoreUpdate }) => {
  const { t } = useTranslation();
  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [calculatedScore, setCalculatedScore] = useState(null);
  const [scoreBreakdown, setScoreBreakdown] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && diseaseId) {
      setError(null);
      fetchQuestionnaire();
      setAnswers({});
      setCurrentStep(0);
      setCalculatedScore(null);
      setScoreBreakdown(null);
      setIsSubmitting(false);
    }
  }, [isOpen, diseaseId]);

  const fetchQuestionnaire = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[QuestionnaireModal] Fetching questionnaire for:', diseaseId);
      const res = await axios.get(`${API_URL}/diseases/${diseaseId}/questionnaire`);
      console.log('[QuestionnaireModal] Response:', res.data.status);
      if (res.data.status === 'success') {
        setQuestionnaire(res.data.data);
        console.log('[QuestionnaireModal] Questions loaded:', res.data.data.questions?.length || 0);
      } else {
        const errorMsg = res.data.message || 'Failed to load questionnaire data';
        console.error('[QuestionnaireModal] Failed to load:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Network error occurred';
      console.error('[QuestionnaireModal] Failed to fetch questionnaire:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleMultiSelect = (questionId, optionValue) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      if (optionValue === 'none') {
        return { ...prev, [questionId]: ['none'] };
      }
      const filtered = current.filter(v => v !== 'none');
      if (filtered.includes(optionValue)) {
        return { ...prev, [questionId]: filtered.filter(v => v !== optionValue) };
      } else {
        return { ...prev, [questionId]: [...filtered, optionValue] };
      }
    });
  };

  const calculateRisk = () => {
    if (!questionnaire || Object.keys(answers).length === 0) return;

    let totalPoints = 0;
    const breakdown = [];
    const gender = profile?.gender?.value || profile?.gender;

    questionnaire.questions.forEach(q => {
      const answer = answers[q.id];
      if (!answer) return;

      if (q.type === 'choice') {
        const selectedOption = q.options.find(opt => opt.value === answer);
        if (selectedOption) {
          let points = selectedOption.points || 0;
          
          // Apply special scoring if defined
          if (q.scoring && typeof q.scoring === 'function') {
            const result = q.scoring(parseInt(answer), gender);
            points = result.points;
          }

          totalPoints += points;
          breakdown.push({
            question: q.question,
            answer: selectedOption.label,
            points,
            weight: q.weight,
            category: q.category
          });
        }
      } else if (q.type === 'multi-select') {
        let questionPoints = 0;
        const selectedLabels = [];
        
        if (Array.isArray(answer)) {
          answer.forEach(val => {
            const option = q.options.find(opt => opt.value === val);
            if (option) {
              questionPoints += option.points || 0;
              selectedLabels.push(option.label);
            }
          });
        }

        totalPoints += questionPoints;
        breakdown.push({
          question: q.question,
          answer: selectedLabels.join(', ') || 'None',
          points: questionPoints,
          weight: q.weight,
          category: q.category
        });
      }
    });

    // Combine with baseline risk from onboarding
    const baselineRisk = currentScore || 10;
    const questionnaireImpact = Math.round(totalPoints * 0.6); // 60% weight to questionnaire
    const onboardingImpact = Math.round(baselineRisk * 0.4); // 40% weight to onboarding data
    
    const finalScore = Math.min(95, Math.max(2, onboardingImpact + questionnaireImpact));

    return {
      finalScore,
      scoreBreakdown: {
        baseline: onboardingImpact,
        questionnaire: questionnaireImpact,
        totalPoints,
        details: breakdown
      }
    };
  };

  const handleSubmit = async () => {
    const previousScore = currentScore;
    setIsSubmitting(true);
    
    // Generate an initial estimate but don't show it yet to avoid flicker
    const estimate = calculateRisk();
    
    // Prepare comprehensive user data for backend recalculation
    const comprehensiveUserData = {
      clerkId: profile?.clerkId,
      answers,
      userProfile: {
        // Core profile
        age: profile?.age,
        gender: profile?.gender,
        height: profile?.height,
        weight: profile?.weight,
        bmi: profile?.bmi,
        
        // Lifestyle/Medical
        activityLevel: profile?.activityLevel,
        isSmoker: profile?.isSmoker,
        alcoholUse: profile?.alcoholUse,
        familyHistory: profile?.familyHistory,
        existingConditions: profile?.existingConditions,
        
        // Detailed collections
        allergies: profile?.allergies || [],
        activeMedications: profile?.activeMedications || [],
        
        // Other metrics
        ...profile // Spread remaining profile fields
      },
      questionnaireAnswers: answers,
      recalculateFullRisk: true
    };
    
    try {
      console.log('[QuestionnaireModal] Submitting for deep recalculation...');
      const res = await axios.post(
        `${API_URL}/diseases/${diseaseId}/questionnaire`, 
        comprehensiveUserData
      );
      
      if (res.data.status === 'success') {
        const backendData = res.data.data;
        const newScore = backendData.riskScore;
        
        setScoreBreakdown({
          baseline: backendData.baselineScore,
          questionnaire: backendData.questionnaireScore,
          totalPoints: backendData.totalPoints,
          details: backendData.factorBreakdown || [],
          protectiveFactors: backendData.protectiveFactors || [],
          mitigations: backendData.mitigationSteps || [],
          allergies: backendData.allergyConsiderations || [],
          medications: backendData.medicationConsiderations || [],
          previousScore: previousScore,
          newScore: newScore,
          scoreChange: newScore - previousScore
        });
        setCalculatedScore(newScore);
      } else {
        throw new Error(res.data.message || 'Backend failed');
      }
    } catch (err) {
      console.error('[QuestionnaireModal] Backend error, falling back to estimate:', err);
      if (estimate) {
        setCalculatedScore(estimate.finalScore);
        setScoreBreakdown({
          ...estimate.scoreBreakdown,
          previousScore: previousScore,
          newScore: estimate.finalScore,
          scoreChange: estimate.finalScore - previousScore
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRisk = async () => {
    if (onScoreUpdate && calculatedScore !== null) {
      console.log('[QuestionnaireModal] Updating risk score:', calculatedScore, 'for disease:', diseaseId);

      // First update the local DiseaseCard state immediately
      await onScoreUpdate(diseaseId, calculatedScore, scoreBreakdown);

      // Small delay to ensure backend update is processed
      await new Promise(resolve => setTimeout(resolve, 800));

      // Force refresh the entire dashboard data to ensure Report is updated
      try {
        console.log('[QuestionnaireModal] Triggering full dashboard refresh...');
        // Trigger the global refresh function if available
        if (window.refreshDashboard) {
          // Do NOT full-recompute after questionnaire; just pull canonical report scores
          window.refreshDashboard(false);
          console.log('[QuestionnaireModal] ✅ Dashboard refresh triggered');
        } else {
          console.warn('[QuestionnaireModal] No global refresh function available');
          // Fallback: manually trigger a window event that Dashboard listens to
          window.dispatchEvent(new CustomEvent('vaidya-profile-updated'));
        }
      } catch (err) {
        console.warn('[QuestionnaireModal] Dashboard refresh failed:', err);
      }

      onClose();
    }
  };

  const nextStep = () => {
    if (questionnaire && currentStep < questionnaire.questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentQuestion = questionnaire?.questions?.[currentStep];
  const questionCount = questionnaire?.questions?.length || 0;
  const progress = questionCount > 0 ? ((currentStep + 1) / questionCount) * 100 : 0;

  if (!isOpen) return null;

  // Show loading state while fetching questionnaire
  if (!questionnaire) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-6 lg:inset-8 bg-white dark:bg-gray-950 rounded-3xl shadow-2xl z-50 flex items-center justify-center"
            >
              <div className="absolute top-6 right-6">
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="text-center p-8 max-w-sm">
                {error ? (
                  <>
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('questionnaire.fetch_failed', { defaultValue: 'Fetch Protocol Failed' })}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                      We couldn't retrieve the assessment for <span className="text-emerald-500 font-bold uppercase tracking-wider">{diseaseId.replace(/_/g, ' ')}</span>.
                      <br/><span className="text-[10px] opacity-50 mt-1 block">Log: {error}</span>
                    </p>
                    <div className="space-y-3">
                      <button 
                        onClick={fetchQuestionnaire}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
                      >
                        {t('questionnaire.retry_fetch', { defaultValue: 'Re-attempt Fetch' })}
                      </button>
                      <button 
                        onClick={onClose}
                        className="w-full py-3 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 font-bold rounded-2xl transition-all"
                      >
                        {t('questionnaire.abort', { defaultValue: 'Abort Assessment' })}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative w-24 h-24 mx-auto mb-8">
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                      <div className="animate-spin rounded-full h-full w-full border-b-4 border-emerald-500 relative z-10" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{t('questionnaire.syncing', { defaultValue: 'Syncing Disease Logic' })}</h3>
                    <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">{t('questionnaire.initializing', { defaultValue: 'Initializing questionnaire modules...' })}</p>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-2xl h-auto max-h-[90vh] bg-white/95 dark:bg-gray-950/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] z-[500] overflow-hidden flex flex-col border border-slate-100 dark:border-white/10"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">{questionnaire.title}</h2>
                  <p className="text-xs text-white/80 mt-1">{questionnaire.description}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span>{t('questionnaire.question_progress', { defaultValue: 'Question' })} {Math.min(currentStep + 1, Math.max(1, questionCount))} {t('questionnaire.of', { defaultValue: 'of' })} {Math.max(1, questionCount)}</span>
                  <span>{Math.round(progress)}% {t('questionnaire.complete', { defaultValue: 'Complete' })}</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="bg-white rounded-full h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              {isSubmitting ? (
                /* Deep Analysis Loading State */
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in duration-500">
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-full h-full rounded-full border-t-4 border-r-4 border-emerald-500 border-b-4 border-l-4 border-b-transparent border-l-transparent"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Activity className="w-12 h-12 text-emerald-500 animate-bounce" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      {t('questionnaire.analyzing', { defaultValue: 'Deep Analysis in Progress' })}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 font-medium max-w-sm mx-auto">
                      {t('questionnaire.analyzing_desc', { defaultValue: 'Our RAG engine is correlating your answers with clinical guidelines and your longitudinal profile data...' })}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Profile Sync</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping [animation-delay:0.2s]" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Context Map</span>
                    </div>
                  </div>
                </div>
              ) : calculatedScore === null ? (
                /* Question View */
                <div className="max-w-lg mx-auto">
                  {!currentQuestion && (
                    <div className="p-6 bg-amber-50/80 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/30 text-sm text-amber-700 dark:text-amber-300">
                      No questionnaire questions available for this condition yet.
                    </div>
                  )}
                  {currentQuestion && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="mb-6 flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                          {currentQuestion.category}
                        </span>
                        <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                          {currentQuestion.weight} priority
                        </span>
                      </div>

                      <h3 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tight leading-tight">
                        {currentQuestion.question}
                      </h3>

                      {/* Choice Type */}
                      {currentQuestion.type === 'choice' && (
                        <div className="space-y-3">
                          {currentQuestion.options.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleAnswer(currentQuestion.id, option.value)}
                              className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 group hover:-translate-y-1 ${
                                answers[currentQuestion.id] === option.value
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-xl shadow-emerald-500/20'
                                  : 'border-slate-100 dark:border-white/5 hover:border-emerald-300 hover:shadow-lg dark:hover:border-emerald-500/50 bg-white/50 dark:bg-transparent'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900 dark:text-white text-lg">
                                  {option.label}
                                </span>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                  answers[currentQuestion.id] === option.value
                                    ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30'
                                }`}>
                                  {answers[currentQuestion.id] === option.value && (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Multi-Select Type */}
                      {currentQuestion.type === 'multi-select' && (
                        <div className="space-y-3">
                          {currentQuestion.options.map((option) => {
                            const isSelected = (answers[currentQuestion.id] || []).includes(option.value);
                            return (
                              <button
                                key={option.value}
                                onClick={() => handleMultiSelect(currentQuestion.id, option.value)}
                                className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 group hover:-translate-y-1 ${
                                  isSelected
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-xl shadow-emerald-500/20'
                                    : 'border-slate-100 dark:border-white/5 hover:border-emerald-300 hover:shadow-lg dark:hover:border-emerald-500/50 bg-white/50 dark:bg-transparent'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-gray-900 dark:text-white text-lg">
                                    {option.label}
                                  </span>
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30'
                                  }`}>
                                    {isSelected && (
                                      <CheckCircle className="w-4 h-4 text-white" />
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Number Input Type */}
                      {currentQuestion.type === 'number' && (
                        <div className="relative">
                            <input
                              type="number"
                              value={answers[currentQuestion.id] || ''}
                              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                              placeholder={currentQuestion.placeholder}
                              className="w-full p-6 border-2 border-slate-100 dark:border-white/5 rounded-2xl text-xl font-bold text-gray-900 dark:text-white bg-white/50 dark:bg-black/20 focus:border-emerald-500 focus:bg-emerald-50/50 dark:focus:bg-emerald-900/10 outline-none transition-all shadow-inner focus:shadow-emerald-500/20"
                            />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Results View */
                <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
                  {/* Score Comparison Display */}
                  <div className={`rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative overflow-hidden border ${
                    calculatedScore >= 70 ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-red-200 dark:border-red-800/30 shadow-red-500/10' :
                    calculatedScore >= 40 ? 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 border-amber-200 dark:border-amber-800/30 shadow-amber-500/10' :
                    'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/30 border-emerald-200 dark:border-emerald-800/30 shadow-emerald-500/10'
                  }`}>
                    <div className={`absolute top-[-50%] right-[-20%] w-[150%] h-[150%] blur-[120px] rounded-full pointer-events-none ${
                        calculatedScore >= 70 ? 'bg-red-500/10' :
                        calculatedScore >= 40 ? 'bg-amber-500/10' :
                        'bg-emerald-500/10'
                    }`} />
                    
                    {/* Before/After Comparison */}
                    <div className="relative z-10">
                      <h3 className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-4 text-center ${
                          calculatedScore >= 70 ? 'text-red-500' :
                          calculatedScore >= 40 ? 'text-amber-500' :
                          'text-emerald-600 dark:text-emerald-400'
                      }`}>Risk Assessment Results</h3>
                      
                      <div className="flex flex-wrap items-stretch justify-center gap-4 mb-6">
                        {/* Previous Score */}
                        <div className="flex-1 min-w-[110px] flex flex-col items-center justify-center bg-white/40 dark:bg-black/20 px-4 py-4 rounded-3xl border border-white/40 dark:border-white/5">
                          <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Previous</div>
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl md:text-5xl font-black text-slate-500/50 dark:text-white/30"
                          >
                            {scoreBreakdown.previousScore}%
                          </motion.div>
                        </div>
                        
                        {/* Arrow */}
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="flex items-center justify-center shrink-0 text-slate-400 hidden sm:flex"
                        >
                          <ArrowRight className="w-6 h-6" />
                        </motion.div>
                        <div className="w-[2px] h-4 bg-slate-400/30 rounded-full sm:hidden shrink-0 mx-auto" />
                        
                        {/* New Score */}
                        <div className={`flex-1 min-w-[110px] flex flex-col items-center justify-center px-4 py-4 rounded-3xl border shadow-xl relative overflow-hidden ${
                          calculatedScore >= 70 ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-400/30 shadow-red-500/20' :
                          calculatedScore >= 40 ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 border-amber-400/30 shadow-amber-500/20' :
                          'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30 shadow-emerald-500/20'
                        }`}>
                          <div className="absolute inset-0 bg-white/40 dark:bg-black/20 blur-[10px]" />
                          <div className={`relative z-10 text-[9px] font-black uppercase tracking-widest mb-1 ${
                            calculatedScore >= 70 ? 'text-red-600 dark:text-red-400' :
                            calculatedScore >= 40 ? 'text-amber-600 dark:text-amber-400' :
                            'text-emerald-600 dark:text-emerald-400'
                          }`}>Updated</div>
                          <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                            className={`text-5xl md:text-6xl font-black relative z-10 leading-none ${
                                calculatedScore >= 70 ? 'text-red-700 dark:text-red-300' :
                                calculatedScore >= 40 ? 'text-amber-700 dark:text-amber-300' :
                                'text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {calculatedScore}%
                          </motion.div>
                        </div>
                      </div>
                      
                      {/* Score Change Indicator */}
                      <div className="flex justify-center">
                        <motion.div
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.8 }}
                          className="inline-flex flex-wrap items-center justify-center gap-2 px-5 py-2.5 bg-white/50 dark:bg-black/20 rounded-full border border-white/50 dark:border-white/5"
                        >
                          {scoreBreakdown.scoreChange > 0 ? (
                            <>
                              <TrendingUp className="w-5 h-5 text-red-500 dark:text-red-400" />
                              <span className="text-sm font-bold text-red-600 dark:text-red-400">+{scoreBreakdown.scoreChange}% increase</span>
                            </>
                          ) : scoreBreakdown.scoreChange < 0 ? (
                            <>
                              <TrendingDown className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{Math.abs(scoreBreakdown.scoreChange)}% decrease</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className={`w-5 h-5 ${
                                calculatedScore >= 70 ? 'text-red-500' :
                                calculatedScore >= 40 ? 'text-amber-500' :
                                'text-emerald-500'
                              }`} />
                              <span className={`text-sm font-bold ${
                                calculatedScore >= 70 ? 'text-red-600 dark:text-red-400' :
                                calculatedScore >= 40 ? 'text-amber-600 dark:text-amber-400' :
                                'text-emerald-600 dark:text-emerald-400'
                              }`}>Impact verified</span>
                            </>
                          )}
                        </motion.div>
                      </div>
                    </div>
                    
                    <p className={`text-[9px] font-bold uppercase tracking-[0.2em] text-center mt-6 pt-4 border-t ${
                        calculatedScore >= 70 ? 'text-red-500/60 border-red-500/20' :
                        calculatedScore >= 40 ? 'text-amber-500/60 border-amber-500/20' :
                        'text-emerald-600/60 border-emerald-500/20'
                    }`}>
                      Completed • {new Date().toLocaleDateString()}
                    </p>
                  </div>

                  {/* Impact Analysis Grid */}
                  <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[100px] p-4 bg-white shadow-sm dark:bg-white/[0.03] rounded-3xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center group transition-colors">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Profile Data</div>
                      <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white italic leading-tight">
                        {scoreBreakdown.baseline}%
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">40% weight</div>
                    </div>
                    
                    <div className="flex-1 min-w-[100px] p-4 bg-emerald-50 dark:bg-emerald-500/[0.05] rounded-3xl border border-emerald-200 dark:border-emerald-500/10 flex flex-col items-center justify-center text-center group transition-colors">
                      <div className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-1">Assessment</div>
                      <div className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 italic leading-tight">
                        {scoreBreakdown.questionnaire}%
                      </div>
                      <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter mt-1">60% weight</div>
                    </div>

                    <div className="flex-1 min-w-[100px] p-4 bg-blue-50 dark:bg-blue-500/[0.05] rounded-3xl border border-blue-200 dark:border-blue-500/10 flex flex-col items-center justify-center text-center group transition-colors">
                      <div className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500 mb-1">Factors</div>
                      <div className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400 italic leading-tight">
                        {scoreBreakdown.details.length}
                      </div>
                      <div className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter mt-1">analyzed</div>
                    </div>
                  </div>

                  {/* Risk Factors Breakdown */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-red-500" />
                      Risk Factors ({scoreBreakdown.details.length})
                    </h4>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {scoreBreakdown.details.map((detail, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-between group hover:border-emerald-500/30 transition-all"
                        >
                          <div className="flex-1">
                            <div className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                              {detail.question || detail.name}
                            </div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">
                              {detail.answer || detail.displayValue}
                            </div>
                          </div>
                          <div className={`ml-4 flex items-center gap-2 font-black text-sm italic ${
                            (detail.points || detail.impact) > 0 ? 'text-red-500' : 'text-emerald-500'
                          }`}>
                            {(detail.points || detail.impact) > 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            {(detail.points || detail.impact) > 0 ? '+' : ''}{detail.points || detail.impact}%
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Protective Factors */}
                  {scoreBreakdown.protectiveFactors?.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Protective Factors ({scoreBreakdown.protectiveFactors.length})
                      </h4>
                      
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {scoreBreakdown.protectiveFactors.map((factor, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/30 flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                                {factor.name}
                              </div>
                              <div className="text-[10px] text-gray-600 dark:text-gray-400 uppercase font-bold tracking-tight">
                                {factor.explanation}
                              </div>
                            </div>
                            <div className="ml-4 flex items-center gap-2 font-black text-sm italic text-emerald-500">
                              <TrendingDown className="w-4 h-4" />
                              -{factor.impact}%
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Message */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/30"
                  >
                    <h5 className="font-bold text-blue-900 dark:text-blue-400 mb-2 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Assessment Summary
                    </h5>
                    <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                      Your risk assessment for <strong>{diseaseId?.replace('_', ' ')}</strong> has been updated based on:
                    </p>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 mt-3 ml-4">
                      <li>✓ Your existing health profile data (age, BMI, lifestyle)</li>
                      <li>✓ {Object.keys(answers).length} questionnaire responses</li>
                      <li>✓ {profile?.allergies?.length || 0} known allergies reviewed</li>
                      <li>✓ {profile?.activeMedications?.length || 0} current medications considered</li>
                    </ul>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 font-bold">
                      💡 Tip: Complete your health profile for even more accurate assessments.
                    </p>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-6">
              {isSubmitting ? (
                <div className="text-center py-2">
                   <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 animate-pulse">
                     Finalizing Recalculation...
                   </p>
                </div>
              ) : calculatedScore === null ? (
                <div className="flex items-center justify-between">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="flex items-center px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    {t('common.previous', { defaultValue: 'Previous' })}
                  </button>

                  <div className="flex items-center space-x-2">
                    {(questionnaire?.questions || []).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentStep ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>

                  {currentQuestion && currentStep < questionCount - 1 ? (
                    <button
                      onClick={nextStep}
                      disabled={!answers[currentQuestion?.id]}
                      className="flex items-center px-6 py-2 bg-emerald-500 text-white text-sm font-bold rounded-lg disabled:opacity-30 hover:bg-emerald-600 transition-colors"
                    >
                      {t('common.next', { defaultValue: 'Next' })}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!currentQuestion || Object.keys(answers).length < Math.max(1, questionCount * 0.5)}
                      className="flex items-center px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-lg disabled:opacity-30 hover:from-emerald-600 hover:to-teal-600 transition-all"
                    >
                      {t('questionnaire.calculate_risk', { defaultValue: 'Calculate Risk' })}
                      <Activity className="w-4 h-4 ml-2" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:space-x-3 w-full">
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-3 sm:py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 sm:bg-transparent sm:hover:bg-transparent rounded-xl transition-all"
                  >
                    {t('common.close', { defaultValue: 'Close' })}
                  </button>
                  <button
                    onClick={handleUpdateRisk}
                    className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5 transition-all"
                  >
                    {t('questionnaire.update_risk_score', { defaultValue: 'Update Risk Score' })}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuestionnaireModal;
