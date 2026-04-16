import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import RiskDetailModal from './RiskDetailModal';
import QuestionnaireModal from './QuestionnaireModal';

import { API_URL } from '../../config/api';

const DiseaseCard = ({ diseaseId, initialScore, verificationMeta, clerkId, profile, onScoreUpdated }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReviewed, setIsReviewed] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'up' or 'down'
  const [isPulsing, setIsPulsing] = useState(false); // For score updates
  const [dataSnapshot, setDataSnapshot] = useState(null); // Step 39: Snapshot for Undo
  const [showRiskDetailModal, setShowRiskDetailModal] = useState(false);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [currentScore, setCurrentScore] = useState(initialScore);

  // Update local score when prop changes from Dashboard
  useEffect(() => {
    setCurrentScore(initialScore);
  }, [initialScore]);

  useEffect(() => {
    if (showRiskDetailModal && !details && !loading) {
      fetchDetails();
      trackEvent('card_expand', { diseaseId });
    }
  }, [showRiskDetailModal]);

  const trackEvent = async (event, meta = {}) => {
    try {
      await axios.post(`${API_URL}/analytics/track`, {
        clerkId,
        event,
        diseaseId,
        metadata: { ...meta, timestamp: new Date() }
      });
    } catch (err) {
      console.warn('Analytics tracking failed');
    }
  };

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[DiseaseCard] Fetching details for:', diseaseId, 'clerkId:', clerkId);
      const res = await axios.get(`${API_URL}/diseases/${diseaseId}/details`, {
        params: { clerkId }
      });
      console.log('[DiseaseCard] Response:', res.data.status, res.data.message || '');
      if (res.data.status === 'success') {
        const data = res.data.data;
        console.log('[DiseaseCard] Details received:', {
          riskScore: data.riskScore,
          riskCategory: data.riskCategory,
          factorBreakdown: data.factorBreakdown?.length || 0,
          protectiveFactors: data.protectiveFactors?.length || 0,
          mitigationSteps: data.mitigationSteps?.length || 0
        });
        setDetails(data);
        setIsReviewed(!!data.reviewedAt);
      } else {
        setError(res.data.message || 'Failed to load clinical baseline.');
      }
    } catch (err) {
      console.error('[DiseaseCard] Fetch disease details error:', err.response?.data || err.message);
      const errMsg = err.response?.data?.message || err.message || 'Technical error: Could not load clinical baseline.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleReview = async () => {
    try {
      const newStatus = !isReviewed;
      setIsReviewed(newStatus);
      if (newStatus) {
        await axios.patch(`${API_URL}/diseases/${diseaseId}/review`, { clerkId });
      }
    } catch (err) {
      console.error('Review update failed:', err);
    }
  };

  const handleFeedback = async (rating) => {
    setFeedback(rating);
    try {
      await axios.post(`${API_URL}/feedback`, {
        clerkId,
        context: `${diseaseId}_card`,
        rating,
        query: 'Disease Details Exploration',
        response: details.riskCategory
      });
    } catch (err) {
      console.error('Feedback failed:', err);
    }
  };

  const handleDataSubmit = async (formData) => {
    setLoading(true);
    // Step 39: Capture snapshot of current values for these fields if they exist
    const snapshot = {};
    Object.keys(formData).forEach(key => {
      snapshot[key] = (details?.rawInputData?.[key]?.value !== undefined) 
        ? details.rawInputData[key].value 
        : details?.rawInputData?.[key];
    });
    setDataSnapshot(snapshot);

    try {
      const res = await axios.post(`${API_URL}/diseases/${diseaseId}/add-data`, {
        clerkId,
        data: formData
      });
      if (res.data.status === 'success') {
        const newData = res.data.data;
        setDetails(newData);
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 2000); // Pulse for 2s
        
        console.log('[DiseaseCard] Data submitted successfully, new riskScore:', newData.riskScore);
        
        // Notify parent with Undo capability
        if (window.onHealthDataUpdate) {
          window.onHealthDataUpdate(diseaseId, () => handleUndo(snapshot));
        }
        
        if (window.refreshDashboard) {
          window.refreshDashboard(false);
        }
      }
    } catch (err) {
      console.error('Data submission failed:', err);
      setError('Failed to update clinical metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (snapshot) => {
    if (!snapshot) return;
    setLoading(true);
    try {
      // Revert to snapshot values
      const res = await axios.post(`${API_URL}/diseases/${diseaseId}/add-data`, {
        clerkId,
        data: snapshot
      });
      if (res.data.status === 'success') {
        setDetails(res.data.data);
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 1000);
      }
    } catch (err) {
      console.error('Undo failed:', err);
    } finally {
      setLoading(false);
    }
  };



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

  const getRiskGuidance = (score) => {
    if (score === -1) return 'Add more data for assessment';
    if (score > 70) return 'Recommend assessment';
    if (score >= 40) return 'Consider screening';
    return 'Current profile stable';
  };

  const handleQuestionnaireComplete = async (diseaseId, newScore, breakdown) => {
    console.log('[DiseaseCard] Questionnaire completed for:', diseaseId, 'New score:', newScore);
    
    // Update the score immediately with animation
    setCurrentScore(newScore);
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 2000);
    
    // Refresh the details from backend
    await fetchDetails();
    
    // Notify parent (Dashboard) to refresh all scores
    if (onScoreUpdated) {
      console.log('[DiseaseCard] Notifying dashboard to refresh scores');
      onScoreUpdated(diseaseId);
    }
  };

  return (
    <motion.div 
      layout
      transition={{ layout: { duration: 0.4, type: 'spring', damping: 25, stiffness: 120 } }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-gray-950/40 backdrop-blur-3xl border-2 border-slate-100 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none p-4 sm:p-6 rounded-3xl transition-all hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/10 w-full relative overflow-hidden group"
    >
      {/* Ambient Background Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
        currentScore >= 70 ? 'bg-red-500/10' : currentScore >= 40 ? 'bg-amber-500/10' : 'bg-emerald-500/10'
      }`} />
      
      {/* Collapsed Header - Always clickable for popup */}
      <div 
        className="flex items-center justify-between cursor-pointer select-none relative z-10"
        onClick={() => setShowRiskDetailModal(true)}
      >
        <div className="flex items-center space-x-4 flex-1">
          {/* Enhanced Circular Progress Indicator */}
          <div className="relative w-14 h-14 flex items-center justify-center hover:scale-110 transition-transform">
            <svg viewBox="0 0 48 48" className="w-full h-full transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="19"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                className="text-gray-100 dark:text-gray-800"
              />
              <motion.circle
                cx="24"
                cy="24"
                r="19"
                stroke={currentScore === -1 ? '#6b7280' : getRiskColor(currentScore)}
                strokeWidth="3"
                fill="transparent"
                strokeDasharray={119.4}
                initial={{ strokeDashoffset: 119.4 }}
                animate={{ strokeDashoffset: 119.4 - (119.4 * (currentScore === -1 ? 0 : currentScore)) / 100 }}
                transition={{ duration: 1, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                 currentScore >= 70 ? 'bg-red-100 dark:bg-red-900/30' : 
                 currentScore >= 40 ? 'bg-amber-100 dark:bg-amber-900/30' : 
                 currentScore === -1 ? 'bg-gray-100 dark:bg-gray-800' :
                 'bg-emerald-100 dark:bg-emerald-900/30'
               }`}>
                 <AlertCircle className={`w-4 h-4 ${
                   currentScore >= 70 ? 'text-red-600 dark:text-red-400' :
                   currentScore >= 40 ? 'text-amber-600 dark:text-amber-400' :
                   currentScore === -1 ? 'text-gray-400' :
                   'text-emerald-600 dark:text-emerald-400'
                 }`} />
               </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              {diseaseId.replace(/_/g, ' ')}
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-lg flex items-center">
              {getRiskLabel(currentScore)} Risk
              {isReviewed && <CheckCircle2 className="w-4 h-4 ml-2 text-emerald-500" />}
            </h4>
            {verificationMeta?.source && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified: {verificationMeta.source}
              </p>
            )}
            <p className={`text-xs font-semibold mt-1 ${
              currentScore >= 70 ? 'text-red-600 dark:text-red-400' :
              currentScore >= 40 ? 'text-amber-600 dark:text-amber-400' :
              'text-gray-500 dark:text-gray-400'
            }`}>
              {getRiskGuidance(currentScore)}
            </p>
          </div>
        </div>

        {/* Right side - Enhanced Score Display */}
        <div className="text-right">
          <motion.div 
            animate={isPulsing ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.5 }}
            className={`text-2xl sm:text-3xl font-black ${currentScore === -1 ? 'text-gray-500' : ''}`} 
            style={{ color: currentScore !== -1 ? getRiskColor(currentScore) : undefined }}
          >
            {currentScore === -1 ? 'N/A' : `${currentScore}`}
          </motion.div>
          <div className="text-[10px] text-gray-400 font-bold mt-0.5">/ 100</div>
          <div className="text-[9px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View details →</div>
        </div>
      </div>

      {details?.missingDataFactors?.length > 0 && (
        <button
          type="button"
          onClick={() => setShowRiskDetailModal(true)}
          className="mt-4 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3" />
          Missing data ({details.missingDataFactors.length}) - improve accuracy
        </button>
      )}

      {/* New Comprehensive Risk Detail Modal */}
      <RiskDetailModal
        isOpen={showRiskDetailModal}
        onClose={() => setShowRiskDetailModal(false)}
        diseaseId={diseaseId}
        score={currentScore}
        details={details}
        clerkId={clerkId}
        userProfile={details?.userProfile}
        loading={loading}
        onOpenQuestionnaire={() => {
          setShowRiskDetailModal(false);
          setShowQuestionnaireModal(true);
        }}
      />

      {/* Disease-Specific Questionnaire Modal */}
      <QuestionnaireModal
        isOpen={showQuestionnaireModal}
        onClose={() => setShowQuestionnaireModal(false)}
        diseaseId={diseaseId}
        profile={{ ...profile, clerkId }}
        onScoreUpdate={handleQuestionnaireComplete}
      />
    </motion.div>
  );
};

export default DiseaseCard;
