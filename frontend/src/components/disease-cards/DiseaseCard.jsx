import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, TrendingUp, Info, ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck, ExternalLink, Lightbulb } from 'lucide-react';
import axios from 'axios';
import DiseaseCardSkeleton from './DiseaseCardSkeleton';
import CalculationBreakdown from './CalculationBreakdown';
import InCardDataCollection from './InCardDataCollection';
import FrequencySlider from './inputs/FrequencySlider';
import DatePicker from './inputs/DatePicker';
import MitigationSteps from './MitigationSteps';
import DoctorConsultation from './DoctorConsultation';
import EmergencyBanner from './EmergencyBanner';
import CalculationModal from './CalculationModal';
import MitigationModal from './MitigationModal';
import RiskDetailModal from './RiskDetailModal';
import QuestionnaireModal from './QuestionnaireModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const DiseaseCard = ({ diseaseId, initialScore, isExpanded, onToggle, clerkId, profile, onScoreUpdated }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReviewed, setIsReviewed] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'up' or 'down'
  const [isPulsing, setIsPulsing] = useState(false); // For score updates
  const [dataSnapshot, setDataSnapshot] = useState(null); // Step 39: Snapshot for Undo
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [showMitigationModal, setShowMitigationModal] = useState(false);
  const [showRiskDetailModal, setShowRiskDetailModal] = useState(false);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [currentScore, setCurrentScore] = useState(initialScore);

  // Update local score when prop changes from Dashboard
  useEffect(() => {
    setCurrentScore(initialScore);
  }, [initialScore]);

  useEffect(() => {
    if ((isExpanded || showRiskDetailModal) && !details && !loading) {
      fetchDetails();
      trackEvent('card_expand', { diseaseId });
    }
  }, [isExpanded, showRiskDetailModal]);

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
        
        // CRITICAL: Force refresh the dashboard MULTIPLE times to ensure update
        console.log('[DiseaseCard] Scheduling dashboard refreshes...');
        
        // Immediate refresh after 300ms
        setTimeout(() => {
          if (window.refreshDashboard) {
            console.log('[DiseaseCard] Triggering immediate dashboard refresh...');
            window.refreshDashboard();
          }
        }, 300);
        
        // Second refresh after 1 second to catch any delayed updates
        setTimeout(() => {
          if (window.refreshDashboard) {
            console.log('[DiseaseCard] Triggering delayed dashboard refresh...');
            window.refreshDashboard();
          }
        }, 1000);
        
        // Third refresh after 2 seconds as final catch
        setTimeout(() => {
          if (window.refreshDashboard) {
            console.log('[DiseaseCard] Triggering final dashboard refresh...');
            window.refreshDashboard();
          }
        }, 2000);
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
      className={`bg-white dark:bg-gray-950 border ${isExpanded ? 'border-emerald-500/30 ring-1 ring-emerald-500/10 shadow-2xl z-10' : 'border-gray-100 dark:border-gray-800 shadow-sm'} p-5 rounded-[2rem] transition-all hover:border-emerald-500/20 w-full relative overflow-hidden group`}
    >
      {/* Collapsed Header - Always clickable for popup */}
      <div 
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setShowRiskDetailModal(true)}
      >
        <div className="flex items-center space-x-4 flex-1">
          {/* Circular Progress Indicator */}
          <div className="relative w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-gray-100 dark:text-gray-800"
              />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                stroke={currentScore === -1 ? '#6b7280' : getRiskColor(currentScore)}
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={125.6}
                initial={{ strokeDashoffset: 125.6 }}
                animate={{ strokeDashoffset: 125.6 - (125.6 * (currentScore === -1 ? 0 : currentScore)) / 100 }}
                transition={{ duration: 1, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
               <AlertCircle className={`w-5 h-5 ${isExpanded ? 'text-emerald-500' : 'text-gray-400 group-hover:text-emerald-500'}`} />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
              {diseaseId.replace('_', ' ')}
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white flex items-center">
              {getRiskLabel(currentScore)} Risk
              {isReviewed && <CheckCircle2 className="w-3.5 h-3.5 ml-2 text-emerald-500" />}
            </h4>
            <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
              {getRiskGuidance(currentScore)}
            </p>
          </div>
        </div>

        {/* Right side - Score only */}
        <div className="text-right">
          <motion.div 
            animate={isPulsing ? { scale: [1, 1.2, 1], color: ['#6b7280', '#10b981', getRiskColor(currentScore)] } : {}}
            className={`text-2xl font-black ${currentScore === -1 ? 'text-gray-500' : ''}`} 
            style={{ color: currentScore !== -1 ? getRiskColor(currentScore) : undefined }}
          >
            {currentScore === -1 ? 'N/A' : `${currentScore}%`}
          </motion.div>
          <div className="text-[9px] text-gray-400 font-bold mt-0.5">Click card for details</div>
        </div>
      </div>

      {details?.missingDataFactors?.length > 0 && (
        <button
          type="button"
          onClick={() => setShowRiskDetailModal(true)}
          className="mt-3 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors"
        >
          Missing data ({details.missingDataFactors.length}) - improve accuracy
        </button>
      )}

      {/* Removed inline expanded content - using popup modal only */}

      {/* New Comprehensive Risk Detail Modal */}
      <RiskDetailModal
        isOpen={showRiskDetailModal}
        onClose={() => setShowRiskDetailModal(false)}
        diseaseId={diseaseId}
        score={currentScore}
        details={details}
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
        currentScore={currentScore}
        profile={{ ...profile, clerkId }}
        onScoreUpdate={handleQuestionnaireComplete}
      />
    </motion.div>
  );
};

export default DiseaseCard;
