import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Activity, ArrowUp, ArrowDown, Heart, Utensils, Shield, Eye, Clock, FileText } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://vaidyasetu-eyg9.onrender.com/api';

const VitalAnalysisModal = ({ isOpen, onClose, vitalType, currentValue, clerkId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Always reset analysis when modal opens with a new vitalType
  useEffect(() => {
    if (isOpen && vitalType) {
      setAnalysis(null);
      if (currentValue !== null && currentValue !== undefined && clerkId) {
        fetchAnalysis();
      }
    }
    if (!isOpen) {
      setAnalysis(null);
    }
  }, [isOpen, vitalType]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      console.log('[VitalAnalysis] Fetching analysis for:', { vitalType, currentValue, clerkId });
      
      const res = await axios.post(`${API_URL}/vitals/${clerkId}/analyze`, {
        vitalType,
        value: currentValue
      });
      
      console.log('[VitalAnalysis] Response:', res.data);
      
      if (res.data.status === 'success') {
        setAnalysis(res.data.data);
      } else {
        console.error('[VitalAnalysis] Failed:', res.data.message);
      }
    } catch (error) {
      console.error('[VitalAnalysis] Failed to fetch vital analysis:', error);
      console.error('[VitalAnalysis] Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'normal': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'borderline': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'high':
      case 'warning': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'critical': return 'text-red-600 bg-red-600/20 border-red-600/30';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'normal': return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      case 'critical': return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'high':
      case 'warning': return <ArrowUp className="w-6 h-6 text-red-500" />;
      case 'low': return <ArrowDown className="w-6 h-6 text-blue-500" />;
      default: return <Activity className="w-6 h-6 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center rounded-t-3xl">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            Vital Analysis
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
              <p className="mt-4 text-sm font-bold text-gray-600 dark:text-gray-400">
                Analyzing your vital signs...
              </p>
            </div>
          ) : analysis ? (
            <>
              {/* Current Reading */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">
                    Current Reading
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusColor(analysis.status)}`}>
                    {analysis.status}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {getStatusIcon(analysis.status)}
                  <div>
                    <div className="text-4xl font-black text-gray-900 dark:text-white">
                      {typeof analysis.currentValue === 'object' 
                        ? `${analysis.currentValue.systolic}/${analysis.currentValue.diastolic}`
                        : analysis.currentValue}
                    </div>
                    <div className="text-sm font-bold text-gray-600 dark:text-gray-400 mt-1">
                      Normal Range: <span className="text-emerald-500">{analysis.normalRange}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mitigations - Only show if not normal */}
              {analysis.status !== 'normal' && analysis.mitigations && (
                <>
                  {/* Immediate Actions */}
                  {analysis.mitigations.immediateActions && analysis.mitigations.immediateActions.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 p-6 rounded-2xl">
                      <h3 className="text-sm font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Immediate Actions
                      </h3>
                      <ul className="space-y-2">
                        {analysis.mitigations.immediateActions.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                            <span className="text-red-500 mt-1">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lifestyle Changes */}
                  {analysis.mitigations.lifestyleChanges && analysis.mitigations.lifestyleChanges.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 p-6 rounded-2xl">
                      <h3 className="text-sm font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Lifestyle Changes
                      </h3>
                      <ul className="space-y-2">
                        {analysis.mitigations.lifestyleChanges.map((change, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                            <span className="text-blue-500 mt-1">•</span>
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Dietary Advice */}
                  {analysis.mitigations.dietaryAdvice && analysis.mitigations.dietaryAdvice.length > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 p-6 rounded-2xl">
                      <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                        <Utensils className="w-5 h-5" />
                        Dietary Advice
                      </h3>
                      <ul className="space-y-2">
                        {analysis.mitigations.dietaryAdvice.map((advice, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                            <span className="text-emerald-500 mt-1">•</span>
                            {advice}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Precautions */}
                  {analysis.mitigations.precautions && analysis.mitigations.precautions.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-6 rounded-2xl">
                      <h3 className="text-sm font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Precautions
                      </h3>
                      <ul className="space-y-2">
                        {analysis.mitigations.precautions.map((precaution, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                            <span className="text-amber-500 mt-1">•</span>
                            {precaution}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* When to See Doctor */}
                  {analysis.mitigations.whenToSeeDoctor && (
                    <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 p-6 rounded-2xl">
                      <h3 className="text-sm font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        When to See Doctor
                      </h3>
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                        {analysis.mitigations.whenToSeeDoctor}
                      </p>
                    </div>
                  )}

                  {/* Monitoring */}
                  {analysis.mitigations.monitoring && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 p-6 rounded-2xl">
                      <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Monitoring
                      </h3>
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                        {analysis.mitigations.monitoring}
                      </p>
                    </div>
                  )}

                  {/* Personalized Note */}
                  {analysis.mitigations.personalizedNote && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-800/30 p-6 rounded-2xl">
                      <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                        <Heart className="w-5 h-5" />
                        Personalized Note
                      </h3>
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed italic">
                        {analysis.mitigations.personalizedNote}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Normal Status Message */}
              {analysis.status === 'normal' && (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 p-8 rounded-2xl text-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
                    Great Job! Your {vitalType.replace('_', ' ')} is Normal
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Keep maintaining your healthy lifestyle and continue regular monitoring.
                  </p>
                </div>
              )}
            </>
          ) : !currentValue ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-black text-gray-700 dark:text-gray-300 mb-2">
                No Reading Logged Yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Log a <span className="capitalize font-bold text-emerald-500">{vitalType?.replace(/_/g, ' ')}</span> reading first to see your personalised analysis.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                Unable to load analysis. Please try again.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Check console for details (F12)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VitalAnalysisModal;
