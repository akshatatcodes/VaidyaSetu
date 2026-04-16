import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, CheckCircle2, Activity, ArrowUp, ArrowDown, Heart, Utensils, Shield, Eye, Clock, FileText } from 'lucide-react';
import axios from 'axios';

import { API_URL } from '../config/api';

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

  return createPortal(
    <div className="fixed inset-0 bg-[#030712]/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 pointer-events-auto">
      <div 
        className="bg-white dark:bg-gray-900 rounded-[2.5rem] max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 pointer-events-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-8 flex justify-between items-center rounded-t-[2.5rem]">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <Activity className="w-6 h-6 text-emerald-500" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  Vital Analysis
                </h2>
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Biometric Intelligence Protocol</p>
             </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="text-center py-20">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                Analyzing biometric signatures...
              </p>
            </div>
          ) : analysis ? (
            <>
              {/* Current Reading */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                    Current Diagnostic State
                  </h3>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(analysis.status)}`}>
                    {analysis.status}
                  </div>
                </div>
                
                <div className="flex items-center gap-8 relative z-10">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-xl">
                    {getStatusIcon(analysis.status)}
                  </div>
                  <div>
                    <div className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                      {typeof analysis.currentValue === 'object' 
                        ? `${analysis.currentValue.systolic}/${analysis.currentValue.diastolic}`
                        : analysis.currentValue}
                    </div>
                    <div className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-wide">
                      Standard Range: <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">{analysis.normalRange}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mitigations */}
              {analysis.status !== 'normal' && analysis.mitigations && (
                <div className="grid grid-cols-1 gap-6">
                  {/* Immediate Actions */}
                  {analysis.mitigations.immediateActions && analysis.mitigations.immediateActions.length > 0 && (
                    <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-[2rem]">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-400 mb-6 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        Urgent Stabilization Matrix
                      </h3>
                      <div className="space-y-3">
                        {analysis.mitigations.immediateActions.map((action, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-950/50 rounded-2xl text-sm font-bold text-gray-800 dark:text-gray-200 shadow-sm border border-red-500/10">
                            <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0" />
                            {action}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lifestyle & Dietary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {analysis.mitigations.lifestyleChanges && analysis.mitigations.lifestyleChanges.length > 0 && (
                      <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-[2rem]">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Lifestyle Protocol
                        </h3>
                        <div className="space-y-2">
                          {analysis.mitigations.lifestyleChanges.map((change, idx) => (
                            <div key={idx} className="text-xs font-bold text-gray-700 dark:text-gray-300 flex gap-2">
                              <span className="text-blue-500">•</span>
                              {change}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.mitigations.dietaryAdvice && analysis.mitigations.dietaryAdvice.length > 0 && (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-[2rem]">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                          <Utensils className="w-5 h-5" />
                          Nutritional Strategy
                        </h3>
                        <div className="space-y-2">
                          {analysis.mitigations.dietaryAdvice.map((advice, idx) => (
                            <div key={idx} className="text-xs font-bold text-gray-700 dark:text-gray-300 flex gap-2">
                              <span className="text-emerald-500">•</span>
                              {advice}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Risks & Precautions */}
                  {analysis.mitigations.precautions && analysis.mitigations.precautions.length > 0 && (
                    <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-[2rem]">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Preventative Guardrails
                      </h3>
                      <div className="flex flex-wrap gap-2">
                         {analysis.mitigations.precautions.map((precaution, idx) => (
                           <span key={idx} className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-xl text-[10px] font-black text-gray-700 dark:text-gray-200 shadow-sm border border-amber-500/10 tracking-tight">
                             {precaution}
                           </span>
                         ))}
                      </div>
                    </div>
                  )}

                  {/* Healthcare Guidance */}
                  <div className="bg-purple-900 dark:bg-purple-100 p-8 rounded-[2.5rem] text-white dark:text-purple-900 shadow-xl">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Professional Directives
                    </h3>
                    <p className="text-lg font-black tracking-tight leading-tight">
                      {analysis.mitigations.whenToSeeDoctor}
                    </p>
                    {analysis.mitigations.monitoring && (
                       <div className="mt-6 pt-6 border-t border-white/10 dark:border-black/10 flex items-center gap-3">
                          <Clock className="w-5 h-5 opacity-60" />
                          <p className="text-sm font-bold opacity-80">{analysis.mitigations.monitoring}</p>
                       </div>
                    )}
                  </div>
                </div>
              )}

              {/* Normal Status Message */}
              {analysis.status === 'normal' && (
                <div className="bg-emerald-500 p-10 rounded-[3rem] text-white text-center shadow-2xl shadow-emerald-500/20">
                  <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                     <CheckCircle2 className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-black mb-2 tracking-tight uppercase">
                    Optimal Health State
                  </h3>
                  <p className="text-emerald-50 font-bold opacity-80 uppercase tracking-[0.1em] text-xs">
                    Continuous monitoring suggested to maintain homeostasis
                  </p>
                </div>
              )}
            </>
          ) : !currentValue ? (
            <div className="text-center py-20">
              <div className="p-10 bg-gray-100 dark:bg-gray-800 rounded-[3rem] w-max mx-auto mb-8">
                <Activity className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                No Data Stream Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                Please record <span className="text-emerald-500">{vitalType?.replace(/_/g, ' ')}</span> data to trigger analysis protocol
              </p>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="p-10 bg-red-500/10 rounded-[3rem] w-max mx-auto mb-8">
                <AlertCircle className="w-16 h-16 text-red-500" />
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                Intelligence Protocol Error
              </p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">
                Unable to synthesize analysis • Please retry
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VitalAnalysisModal;
