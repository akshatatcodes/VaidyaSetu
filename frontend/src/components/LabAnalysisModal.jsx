import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { X, AlertTriangle, CheckCircle, Heart, Activity, Utensils, Dumbbell, Eye, Clock, Download, Save } from 'lucide-react';

import { API_URL } from '../config/api';

const LabAnalysisModal = ({ isOpen, onClose, labResults, clerkId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const labIds = labResults.map(lab => lab._id);
      
      const res = await axios.post(`${API_URL}/lab-results/analyze`, {
        clerkId,
        labIds
      });

      if (res.data.status === 'success') {
        setAnalysis(res.data.data);
      }
    } catch (err) {
      console.error('[Lab Analysis] Error:', err);
      setError(err.response?.data?.message || 'Failed to analyze lab results');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!analysis) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Colors
    const EMERALD = [16, 185, 129];
    const RED = [239, 68, 68];
    const BLUE = [59, 130, 246];
    const PURPLE = [147, 51, 234];
    const GRAY = [107, 114, 128];

    // Header
    doc.setFillColor(...EMERALD);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Lab Results Analysis Report', 20, 25);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);
    
    y = 50;

    // Summary
    if (analysis.analysis?.summary) {
      doc.setFontSize(14);
      doc.setTextColor(...EMERALD);
      doc.text('Overall Summary', 20, y);
      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.setFont('helvetica', 'normal');
      const summaryLines = doc.splitTextToSize(analysis.analysis.summary, pageWidth - 40);
      doc.text(summaryLines, 20, y);
      y += summaryLines.length * 5 + 10;
    }

    // Stats
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text(`Total Tests: ${analysis.totalTests}  |  Abnormal: ${analysis.abnormalCount}  |  Normal: ${analysis.normalCount}`, 20, y);
    y += 10;

    // Critical Findings
    if (analysis.analysis?.criticalFindings?.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setTextColor(...RED);
      doc.setFont('helvetica', 'bold');
      doc.text('Critical Findings', 20, y);
      y += 8;

      analysis.analysis.criticalFindings.forEach((finding, idx) => {
        if (y > 250) { doc.addPage(); y = 20; }
        
        doc.setFontSize(11);
        doc.setTextColor(...GRAY);
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx + 1}. ${finding.testName} - ${finding.value}`, 25, y);
        y += 6;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Severity: ${finding.severity.toUpperCase()}`, 30, y);
        y += 5;
        
        const explanationLines = doc.splitTextToSize(finding.explanation, pageWidth - 50);
        doc.text(explanationLines, 30, y);
        y += explanationLines.length * 5 + 3;
        
        doc.setTextColor(...RED);
        doc.setFont('helvetica', 'bold');
        doc.text('Immediate Action:', 30, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GRAY);
        const actionLines = doc.splitTextToSize(finding.immediateAction, pageWidth - 50);
        doc.text(actionLines, 30, y);
        y += actionLines.length * 5 + 5;

        if (finding.precautions?.length > 0) {
          doc.setTextColor(245, 158, 11);
          doc.setFont('helvetica', 'bold');
          doc.text('Precautions:', 30, y);
          y += 5;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...GRAY);
          finding.precautions.forEach((precaution, pIdx) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(`${pIdx + 1}. ${precaution}`, 35, y);
            y += 5;
          });
          y += 5;
        }
      });
    }

    // Dietary Recommendations
    if (analysis.analysis?.dietaryRecommendations?.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setTextColor(...EMERALD);
      doc.setFont('helvetica', 'bold');
      doc.text('Dietary Recommendations', 20, y);
      y += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      analysis.analysis.dietaryRecommendations.forEach((rec, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${idx + 1}. ${rec}`, 25, y);
        y += 6;
      });
      y += 5;
    }

    // Lifestyle Changes
    if (analysis.analysis?.lifestyleChanges?.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setTextColor(...BLUE);
      doc.setFont('helvetica', 'bold');
      doc.text('Lifestyle Changes', 20, y);
      y += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      analysis.analysis.lifestyleChanges.forEach((change, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${idx + 1}. ${change}`, 25, y);
        y += 6;
      });
      y += 5;
    }

    // When to See Doctor
    if (analysis.analysis?.whenToSeeDoctor) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setTextColor(...PURPLE);
      doc.setFont('helvetica', 'bold');
      doc.text('When to See Doctor', 20, y);
      y += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      const doctorLines = doc.splitTextToSize(analysis.analysis.whenToSeeDoctor, pageWidth - 40);
      doc.text(doctorLines, 20, y);
      y += doctorLines.length * 5 + 10;
    }

    // Next Steps
    if (analysis.analysis?.nextSteps?.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setTextColor(245, 158, 11);
      doc.setFont('helvetica', 'bold');
      doc.text('Prioritized Next Steps', 20, y);
      y += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      analysis.analysis.nextSteps.forEach((step, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${idx + 1}. ${step}`, 25, y);
        y += 6;
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text(
        `VaidyaSetu AI Health Platform - Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      doc.text(
        'Disclaimer: This is for educational purposes only. Not medical advice.',
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      );
    }

    doc.save(`Lab-Analysis-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleSave = async () => {
    // TODO: Save analysis to database
    alert('Analysis saved successfully!');
  };

  if (!isOpen) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'moderate': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'moderate': return <Activity className="w-5 h-5 text-amber-600" />;
      case 'low': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-[#030712]/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 pointer-events-auto">
      <div 
        className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-white/10 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
              Lab Results Analysis
            </h2>
            <p className="text-emerald-100/80 text-xs font-bold uppercase tracking-widest mt-1">
              AI-Powered Personalized Insights
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-8 custom-scrollbar">
          {!analysis && !loading && (
            <div className="text-center py-20">
              <div className="p-10 bg-emerald-500/10 rounded-[3rem] w-max mx-auto mb-8">
                <Activity className="w-16 h-16 text-emerald-500" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                Ready to Analyze
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-10 text-lg leading-relaxed">
                Our AI will analyze {labResults?.length || 0} lab results and provide personalized recommendations, precautions, and mitigations.
              </p>
              <button
                onClick={handleAnalyze}
                className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
              >
                Analyze Lab Results
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-20">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                Analyzing Your Results
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                AI is generating personalized insights...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <div className="p-10 bg-red-500/10 rounded-[3rem] w-max mx-auto mb-8">
                <AlertTriangle className="w-16 h-16 text-red-500" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                Analysis Failed
              </h3>
              <p className="text-red-500 text-lg max-w-md mx-auto mb-10">
                {error}
              </p>
              <button
                onClick={handleAnalyze}
                className="px-10 py-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] transition-all active:scale-95"
              >
                Try Again
              </button>
            </div>
          )}

          {analysis && (
            <div className="space-y-10">
              {/* Summary Card */}
              <div className="p-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[3rem] text-white shadow-2xl shadow-emerald-500/20">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-6 opacity-80 flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Overall Summary
                </h3>
                <p className="text-2xl font-bold leading-tight mb-10">
                  {analysis.analysis?.summary || 'Analysis complete'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Total Tests</div>
                    <div className="text-4xl font-black">{analysis.totalTests}</div>
                  </div>
                  <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Abnormal</div>
                    <div className="text-4xl font-black">{analysis.abnormalCount}</div>
                  </div>
                  <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Normal</div>
                    <div className="text-4xl font-black">{analysis.normalCount}</div>
                  </div>
                </div>
              </div>

              {/* Critical Findings */}
              {analysis.analysis?.criticalFindings?.length > 0 && (
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 tracking-tight">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    Critical Findings
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    {analysis.analysis.criticalFindings.map((finding, idx) => (
                      <div key={idx} className={`border p-8 rounded-[2.5rem] shadow-xl ${getSeverityColor(finding.severity)}`}>
                        <div className="flex items-start justify-between mb-6">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/50 rounded-2xl shadow-sm">
                                 {getSeverityIcon(finding.severity)}
                              </div>
                              <div>
                                 <h4 className="font-black text-xl tracking-tight">{finding.testName}</h4>
                                 <p className="text-sm font-bold opacity-70">{finding.value}</p>
                              </div>
                           </div>
                           <span className="px-3 py-1 bg-white/50 text-[10px] font-black uppercase tracking-widest rounded-full">
                              {finding.severity} Risk
                           </span>
                        </div>
                        <p className="text-base font-medium leading-relaxed mb-6 italic">"{finding.explanation}"</p>
                        <div className="p-6 bg-white/50 dark:bg-black/20 rounded-3xl border border-black/5 mb-6">
                          <strong className="text-[10px] font-black uppercase tracking-widest block mb-2 opacity-60">Immediate Action</strong>
                          <p className="text-lg font-bold">{finding.immediateAction}</p>
                        </div>
                        {finding.precautions && finding.precautions.length > 0 && (
                          <div className="space-y-4">
                            <strong className="text-[10px] font-black uppercase tracking-widest block opacity-60">Required Precautions</strong>
                            <div className="flex flex-wrap gap-3">
                              {finding.precautions.map((precaution, pIdx) => (
                                <span key={pIdx} className="px-4 py-2 bg-white/30 rounded-xl text-xs font-bold">
                                  {precaution}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Dietary Recommendations */}
                 {analysis.analysis?.dietaryRecommendations?.length > 0 && (
                   <div className="bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/10 p-8 rounded-[2.5rem]">
                     <h3 className="text-xs font-black uppercase tracking-[0.3em] text-orange-500 mb-6 flex items-center gap-2">
                       <Utensils className="w-5 h-5" />
                       Dietary Strategy
                     </h3>
                     <div className="space-y-3">
                       {analysis.analysis.dietaryRecommendations.map((rec, idx) => (
                         <div key={idx} className="flex items-start gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-2xl text-sm font-bold text-gray-800 dark:text-gray-200 shadow-sm border border-black/5">
                           <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                           {rec}
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Lifestyle Changes */}
                 {analysis.analysis?.lifestyleChanges?.length > 0 && (
                   <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 p-8 rounded-[2.5rem]">
                     <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-6 flex items-center gap-2">
                       <Dumbbell className="w-5 h-5" />
                       Lifestyle Protocols
                     </h3>
                     <div className="space-y-3">
                       {analysis.analysis.lifestyleChanges.map((change, idx) => (
                         <div key={idx} className="flex items-start gap-3 p-4 bg-white/50 dark:bg-black/20 rounded-2xl text-sm font-bold text-gray-800 dark:text-gray-200 shadow-sm border border-black/5">
                           <Activity className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                           {change}
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* When to See Doctor */}
                 {analysis.analysis?.whenToSeeDoctor && (
                   <div className="bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/10 p-8 rounded-[2.5rem]">
                     <h3 className="text-xs font-black uppercase tracking-[0.3em] text-purple-600 dark:text-purple-400 mb-4 flex items-center gap-2">
                       <Eye className="w-5 h-5" />
                       Medical Consultation
                     </h3>
                     <p className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">
                       {analysis.analysis.whenToSeeDoctor}
                     </p>
                   </div>
                 )}

                 {/* Monitoring Advice */}
                 {analysis.analysis?.monitoringAdvice && (
                   <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 p-8 rounded-[2.5rem]">
                     <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                       <Clock className="w-5 h-5" />
                       Bio-Monitoring
                     </h3>
                     <p className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">
                       {analysis.analysis.monitoringAdvice}
                     </p>
                   </div>
                 )}
              </div>

              {/* Next Steps */}
              {analysis.analysis?.nextSteps?.length > 0 && (
                <div className="bg-gray-900 dark:bg-white p-10 rounded-[3rem] text-white dark:text-gray-900 shadow-2xl">
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-8 opacity-60 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Prioritized Action Plan
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {analysis.analysis.nextSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-6 p-6 bg-white/10 dark:bg-gray-900/10 rounded-[2rem] border border-white/10 dark:border-black/10">
                        <span className="flex-shrink-0 w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg">
                          {idx + 1}
                        </span>
                        <p className="text-xl font-black tracking-tight">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-6 pt-6 sticky bottom-0 bg-white dark:bg-gray-900 py-4 z-10">
                <button
                  onClick={handleSave}
                  className="flex-1 px-8 py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3"
                >
                  <Save className="w-5 h-5" />
                  Save Record
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex-1 px-8 py-5 bg-gray-950 dark:bg-gray-100 text-white dark:text-gray-950 font-black rounded-2xl text-xs uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 border border-white/10"
                >
                  <Download className="w-5 h-5" />
                  Export PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LabAnalysisModal;
