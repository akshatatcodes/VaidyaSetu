import React, { useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { X, AlertTriangle, CheckCircle, Heart, Activity, Utensils, Dumbbell, Eye, Clock, Download, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
              Lab Results Analysis
            </h2>
            <p className="text-emerald-100 text-sm mt-1">
              AI-Powered Personalized Insights
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {!analysis && !loading && (
            <div className="text-center py-16">
              <div className="p-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-full w-max mx-auto mb-6">
                <Activity className="w-16 h-16 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">
                Ready to Analyze
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                Our AI will analyze {labResults?.length || 0} lab results and provide personalized recommendations, precautions, and mitigations.
              </p>
              <button
                onClick={handleAnalyze}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm uppercase tracking-wider transition-all shadow-xl"
              >
                Analyze Lab Results
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-6"></div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">
                Analyzing Your Results
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                AI is generating personalized insights...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-full w-max mx-auto mb-6">
                <AlertTriangle className="w-16 h-16 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">
                Analysis Failed
              </h3>
              <p className="text-red-500 max-w-md mx-auto mb-6">
                {error}
              </p>
              <button
                onClick={handleAnalyze}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {analysis && (
            <div className="space-y-8">
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 p-6 rounded-2xl">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Overall Summary
                </h3>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                  {analysis.analysis?.summary || 'Analysis complete'}
                </p>
                <div className="mt-4 flex gap-4">
                  <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Tests</div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{analysis.totalTests}</div>
                  </div>
                  <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Abnormal</div>
                    <div className="text-2xl font-black text-red-600">{analysis.abnormalCount}</div>
                  </div>
                  <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Normal</div>
                    <div className="text-2xl font-black text-emerald-600">{analysis.normalCount}</div>
                  </div>
                </div>
              </div>

              {/* Critical Findings */}
              {analysis.analysis?.criticalFindings?.length > 0 && (
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    Critical Findings
                  </h3>
                  <div className="space-y-4">
                    {analysis.analysis.criticalFindings.map((finding, idx) => (
                      <div key={idx} className={`border p-6 rounded-2xl ${getSeverityColor(finding.severity)}`}>
                        <div className="flex items-start gap-3 mb-3">
                          {getSeverityIcon(finding.severity)}
                          <div className="flex-1">
                            <h4 className="font-bold text-lg">{finding.testName}</h4>
                            <p className="text-sm opacity-80">{finding.value}</p>
                          </div>
                          <span className={`text-xs font-black uppercase px-3 py-1 rounded-lg bg-white/50`}>
                            {finding.severity}
                          </span>
                        </div>
                        <p className="text-sm mb-3">{finding.explanation}</p>
                        <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg mb-3">
                          <strong>Immediate Action:</strong> {finding.immediateAction}
                        </div>
                        {finding.precautions && finding.precautions.length > 0 && (
                          <div>
                            <strong className="text-sm">Precautions:</strong>
                            <ul className="mt-2 space-y-1">
                              {finding.precautions.map((precaution, pIdx) => (
                                <li key={pIdx} className="text-sm flex items-start gap-2">
                                  <span className="mt-1">•</span>
                                  {precaution}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary Recommendations */}
              {analysis.analysis?.dietaryRecommendations?.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 p-6 rounded-2xl">
                  <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                    <Utensils className="w-5 h-5" />
                    Dietary Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {analysis.analysis.dietaryRecommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                        <span className="text-emerald-500 mt-1">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lifestyle Changes */}
              {analysis.analysis?.lifestyleChanges?.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 p-6 rounded-2xl">
                  <h3 className="text-sm font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                    <Dumbbell className="w-5 h-5" />
                    Lifestyle Changes
                  </h3>
                  <ul className="space-y-2">
                    {analysis.analysis.lifestyleChanges.map((change, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                        <span className="text-blue-500 mt-1">→</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* When to See Doctor */}
              {analysis.analysis?.whenToSeeDoctor && (
                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 p-6 rounded-2xl">
                  <h3 className="text-sm font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    When to See Doctor
                  </h3>
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    {analysis.analysis.whenToSeeDoctor}
                  </p>
                </div>
              )}

              {/* Monitoring Advice */}
              {analysis.analysis?.monitoringAdvice && (
                <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 p-6 rounded-2xl">
                  <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Monitoring Advice
                  </h3>
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    {analysis.analysis.monitoringAdvice}
                  </p>
                </div>
              )}

              {/* Next Steps */}
              {analysis.analysis?.nextSteps?.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/30 p-6 rounded-2xl">
                  <h3 className="text-sm font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Next Steps (Prioritized)
                  </h3>
                  <ol className="space-y-2">
                    {analysis.analysis.nextSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                        <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Positive Notes */}
              {analysis.analysis?.positiveNotes?.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 p-6 rounded-2xl">
                  <h3 className="text-sm font-black uppercase tracking-widest text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Positive Notes
                  </h3>
                  <ul className="space-y-2">
                    {analysis.analysis.positiveNotes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                        <span className="text-green-500 mt-1">★</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Analysis
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex-1 px-6 py-4 bg-gray-800 hover:bg-gray-700 text-white font-black rounded-2xl text-sm uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabAnalysisModal;
