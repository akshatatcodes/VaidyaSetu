import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Activity
} from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import { API_URL } from '../../config/api';

const QuestionnaireModal = ({ isOpen, onClose, diseaseId, profile, onScoreUpdate }) => {
  const { t } = useTranslation();
  const MotionDiv = motion.div;
  const [questionnaire, setQuestionnaire] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [calculatedScore, setCalculatedScore] = useState(null);
  const [scoreBreakdown, setScoreBreakdown] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const getCount = (value) => {
    if (Array.isArray(value)) return value.length;
    if (Array.isArray(value?.value)) return value.value.length;
    return 0;
  };

  const normalizeBreakdownDetail = (detail) => {
    if (!detail) return null;
    if (detail.question || detail.answer || detail.points !== undefined) {
      return {
        title: detail.question || 'Questionnaire factor',
        subtitle: detail.answer ? `Your answer: ${detail.answer}` : detail.explanation || 'Questionnaire response considered',
        impact: detail.points ?? 0,
        meta: detail.weight || detail.category || 'questionnaire'
      };
    }

    return {
      title: detail.name || 'Risk factor',
      subtitle: detail.displayValue ? `Observed: ${detail.displayValue}` : detail.explanation || 'Profile factor considered',
      impact: detail.direction === 'decrease' ? -(detail.impact ?? 0) : (detail.impact ?? 0),
      meta: detail.category || detail.source || 'profile'
    };
  };

  const normalizedDetails = (scoreBreakdown?.details || [])
    .map(normalizeBreakdownDetail)
    .filter(Boolean);

  const fetchQuestionnaire = useCallback(async () => {
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
    }
  }, [diseaseId]);

  useEffect(() => {
    if (isOpen && diseaseId) {
      setError(null);
      fetchQuestionnaire();
      setAnswers({});
      setCurrentStep(0);
      setCalculatedScore(null);
      setScoreBreakdown(null);
    }
  }, [isOpen, diseaseId, fetchQuestionnaire]);

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

  const handleSubmit = async () => {
    if (!questionnaire || Object.keys(answers).length === 0) return;

    // Prepare comprehensive user data for backend recalculation
    const comprehensiveUserData = {
      clerkId: profile?.clerkId,
      answers,
      
      // Include ALL user profile data for accurate recalculation
      userProfile: {
        // Onboarding data
        age: profile?.age,
        gender: profile?.gender,
        height: profile?.height,
        weight: profile?.weight,
        bmi: profile?.bmi,
        
        // Lifestyle factors
        activityLevel: profile?.activityLevel,
        dietType: profile?.dietType,
        isSmoker: profile?.isSmoker,
        alcoholUse: profile?.alcoholUse,
        stressLevel: profile?.stressLevel,
        sleepQuality: profile?.sleepQuality,
        
        // Medical history
        familyHistory: profile?.familyHistory,
        knownAllergies: profile?.knownAllergies,
        existingConditions: profile?.existingConditions,
        previousSurgeries: profile?.previousSurgeries,
        
        // Allergies (detailed)
        allergies: profile?.allergies || [],
        
        // Current medications
        activeMedications: profile?.activeMedications || [],
        
        // Vital signs
        bloodPressure: profile?.bloodPressure,
        heartRate: profile?.heartRate,
        temperature: profile?.temperature,
        oxygenSaturation: profile?.oxygenSaturation,
        
        // Lab results
        fastingBloodSugar: profile?.fastingBloodSugar,
        hba1c: profile?.hba1c,
        cholesterol: profile?.cholesterol,
        triglycerides: profile?.triglycerides,
        
        // Additional health data
        waistCircumference: profile?.waistCircumference,
        menstrualCycleIrregular: profile?.menstrualCycleIrregular,
        facialBodyHairExcess: profile?.facialBodyHairExcess
      },
      
      // Questionnaire answers
      questionnaireAnswers: answers,
      
      // Request full recalculation
      recalculateFullRisk: true
    };
    
    console.log('[QuestionnaireModal] Submitting comprehensive data for recalculation...');
    
    // Save to backend and get full recalculation
    try {
      setSubmitting(true);
      const res = await axios.post(
        `${API_URL}/diseases/${diseaseId}/questionnaire`, 
        comprehensiveUserData
      );
      
      console.log('[QuestionnaireModal] Recalculation response:', res.data);
      
      if (res.data.status === 'success') {
        const backendData = res.data.data;
        setCalculatedScore(backendData.finalScore ?? backendData.riskScore);
        setScoreBreakdown({
          baseline: backendData.baselineScore,
          questionnaire: backendData.questionnaireScore,
          delta: backendData.assessmentDelta ?? backendData.questionnaireDelta ?? 0,
          totalPoints: backendData.totalPoints,
          details: backendData.assessmentFactors || backendData.factorBreakdown || backendData.questionnaireBreakdown || [],
          baselineFactors: backendData.baselineFactors || [],
          mitigations: backendData.mitigationSteps || [],
          allergies: backendData.allergyConsiderations || [],
          medications: backendData.medicationConsiderations || [],
          questionnaireMeta: backendData.questionnaireMeta || null
        });
      }
    } catch (err) {
      console.error('[QuestionnaireModal] Failed to save and recalculate:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Could not calculate assessment results.');
    } finally {
      setSubmitting(false);
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
          // Pull saved report scores only; avoid recomputing and overwriting questionnaire results.
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
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <MotionDiv
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
            </MotionDiv>
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
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-6 lg:inset-8 bg-white dark:bg-gray-950 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-black">{questionnaire.title}</h2>
                  <p className="text-sm text-white/80 mt-1">{questionnaire.description}</p>
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
                <div className="flex justify-between text-xs font-bold">
                  <span>{t('questionnaire.question_progress', { defaultValue: 'Question' })} {Math.min(currentStep + 1, Math.max(1, questionCount))} {t('questionnaire.of', { defaultValue: 'of' })} {Math.max(1, questionCount)}</span>
                  <span>{Math.round(progress)}% {t('questionnaire.complete', { defaultValue: 'Complete' })}</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-2">
                  <MotionDiv
                    className="bg-white rounded-full h-2"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {calculatedScore === null ? (
                /* Question View */
                <div className="max-w-2xl mx-auto">
                  {submitting && (
                    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                      Calculating your updated risk score...
                    </div>
                  )}
                  {!currentQuestion && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30 text-sm text-amber-700 dark:text-amber-300">
                      No questionnaire questions available for this condition yet.
                    </div>
                  )}
                  {currentQuestion && (
                    <>
                  <div className="mb-6">
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-wider rounded-full">
                      {currentQuestion.category}
                    </span>
                    <span className="ml-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-black uppercase tracking-wider rounded-full">
                      {currentQuestion.weight} priority
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">
                    {currentQuestion.question}
                  </h3>

                  {/* Choice Type */}
                  {currentQuestion.type === 'choice' && (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleAnswer(currentQuestion.id, option.value)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            answers[currentQuestion.id] === option.value
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 dark:border-gray-800 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {option.label}
                            </span>
                            {answers[currentQuestion.id] === option.value && (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            )}
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
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                : 'border-gray-200 dark:border-gray-800 hover:border-emerald-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900 dark:text-white">
                                {option.label}
                              </span>
                              {isSelected && (
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Number Input Type */}
                  {currentQuestion.type === 'number' && (
                    <input
                      type="number"
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                      placeholder={currentQuestion.placeholder}
                      className="w-full p-4 border-2 border-gray-200 dark:border-gray-800 rounded-xl text-lg font-bold text-gray-900 dark:text-white bg-transparent focus:border-emerald-500 outline-none transition-colors"
                    />
                  )}
                    </>
                  )}
                </div>
              ) : (
                /* Results View */
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Score Display */}
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 text-white text-center">
                    <h3 className="text-lg font-bold mb-2">{t('questionnaire.updated_score', { defaultValue: 'Your Updated Risk Score' })}</h3>
                    <div className="text-6xl font-black mb-2">{calculatedScore}%</div>
                    <p className="text-sm text-white/80">
                      {t('questionnaire.updated_score_desc', { defaultValue: 'Based on comprehensive assessment with' })} {questionnaire.questions.length} {t('questionnaire.targeted_questions', { defaultValue: 'targeted questions' })}
                    </p>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-gray-900 dark:text-white">{t('questionnaire.score_breakdown', { defaultValue: 'Score Breakdown' })}</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <div className="text-sm text-gray-500 mb-1">Baseline Risk Score</div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white">
                          {scoreBreakdown.baseline}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">This is the original disease-card score.</div>
                      </div>
                      
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        <div className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Assessment Change</div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {scoreBreakdown.delta > 0 ? '+' : ''}{scoreBreakdown.delta}%
                        </div>
                        <div className="text-xs text-emerald-500 mt-1">Difference introduced by your assessment answers.</div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Factor Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-black text-gray-900 dark:text-white">
                      Detailed Risk Factors ({normalizedDetails.length})
                    </h4>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {normalizedDetails.map((detail, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                                {detail.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                <span className="font-bold text-gray-700 dark:text-gray-300">{detail.subtitle}</span>
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <div className={`font-black text-lg ${
                                detail.impact > 0 ? 'text-red-500' : 'text-emerald-500'
                              }`}>
                                {detail.impact > 0 ? '+' : ''}{detail.impact}%
                              </div>
                              <div className="text-[10px] text-gray-400 uppercase">
                                {detail.meta}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Factors Considered */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
                    <h5 className="font-bold text-blue-900 dark:text-blue-400 mb-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Additional Factors Considered
                    </h5>
                    <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                      <li>✓ Your age, gender, and BMI from onboarding</li>
                      <li>✓ Known allergies: {getCount(profile?.allergies)} identified</li>
                      <li>✓ Current medications: {getCount(profile?.activeMedications)} reviewed</li>
                      <li>✓ Lifestyle factors: diet, exercise, smoking status</li>
                      <li>✓ Previous medical history and vital signs</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-6">
              {calculatedScore === null ? (
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
                      disabled={submitting || !currentQuestion || Object.keys(answers).length < Math.max(1, questionCount * 0.5)}
                      className="flex items-center px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-lg disabled:opacity-30 hover:from-emerald-600 hover:to-teal-600 transition-all"
                    >
                      {submitting ? 'Calculating...' : t('questionnaire.calculate_risk', { defaultValue: 'Calculate Risk' })}
                      <Activity className="w-4 h-4 ml-2" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {t('common.close', { defaultValue: 'Close' })}
                  </button>
                  <button
                    onClick={handleUpdateRisk}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all"
                  >
                    {t('questionnaire.update_risk_score', { defaultValue: 'Update Risk Score' })}
                  </button>
                </div>
              )}
            </div>
          </MotionDiv>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuestionnaireModal;
