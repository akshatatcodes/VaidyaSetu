import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { X, AlertTriangle, CheckCircle, Activity, Eye, Download, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react';

import { API_URL } from '../config/api';

/**
 * LAB RESULT REVIEW — MediKiosk
 *
 * NOTE (MediKiosk refactor):
 * This modal used to render LLM-generated dietary strategy, lifestyle protocols,
 * severity "risk" badges, immediate actions and a prioritised action plan. All of
 * that was the wellness/risk-coaching product and has been removed along with the
 * backend that produced it.
 *
 * §15 — an out-of-range lab value is a TRIAGE TRIGGER for a clinician. The
 *       platform reports the value against its own printed reference range and
 *       stops there. It does not interpret, score, or advise.
 * §5  — a result whose reference range cannot be read is reported as "Not
 *       compared", never quietly counted as normal.
 *
 * Phase 8 rebuilds this on InvestigationOrder → LabSample → LabResult with §66
 * confidence states.
 */

const LabAnalysisModal = ({ isOpen, onClose, labResults, clerkId }) => {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReview = async () => {
    setLoading(true);
    setError(null);

    try {
      const labIds = (labResults || []).map(lab => lab._id);

      const res = await axios.post(`${API_URL}/lab-results/analyze`, {
        clerkId,
        labIds
      });

      if (res.data.status === 'success') {
        setReview(res.data.data);
      } else {
        setError(res.data.message || 'Could not read your lab results.');
      }
    } catch (err) {
      console.error('[Lab Review] Error:', err);
      setError(err.response?.data?.message || 'Could not read your lab results.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!review) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const EMERALD = [16, 185, 129];
    const RED = [239, 68, 68];
    const GRAY = [107, 114, 128];
    let y = 20;

    doc.setFillColor(...EMERALD);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Lab Results', 20, 25);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);

    y = 52;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(doc.splitTextToSize(review.summary || '', pageWidth - 40), 20, y);
    y += 16;

    doc.text(
      `Total: ${review.totalTests}   Outside range: ${review.abnormalCount}   Within range: ${review.normalCount}   Not compared: ${review.unknownCount ?? 0}`,
      20, y
    );
    y += 12;

    if (review.flagged?.length > 0) {
      doc.setFontSize(13);
      doc.setTextColor(...RED);
      doc.setFont('helvetica', 'bold');
      doc.text('Outside reference range', 20, y);
      y += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      review.flagged.forEach((f, idx) => {
        if (y > 265) { doc.addPage(); y = 20; }
        const arrow = f.direction === 'above' ? 'above' : f.direction === 'below' ? 'below' : 'outside';
        doc.text(`${idx + 1}. ${f.testName}: ${f.value} — ${arrow} range ${f.referenceRange || '(not recorded)'}`, 25, y);
        y += 6;
      });
      y += 6;
    }

    if (review.guidance) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setTextColor(...RED);
      doc.setFont('helvetica', 'bold');
      doc.text(doc.splitTextToSize(review.guidance, pageWidth - 40), 20, y);
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      doc.text(
        `VaidyaSetu — Page ${i} of ${pageCount}`,
        pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' }
      );
      doc.text(
        'This report lists recorded values against their reference ranges. It is not a diagnosis.',
        pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' }
      );
    }

    doc.save(`Lab-Results-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!isOpen) return null;

  const statusChip = (status) => {
    if (status === 'abnormal') return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20';
    if (status === 'normal') return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    return 'text-slate-500 dark:text-slate-400 bg-slate-500/10 border-slate-500/20';
  };

  const statusIcon = (result) => {
    if (result.status === 'abnormal') {
      return result.direction === 'below'
        ? <ArrowDown className="w-5 h-5 text-red-500" />
        : <ArrowUp className="w-5 h-5 text-red-500" />;
    }
    if (result.status === 'normal') return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    return <HelpCircle className="w-5 h-5 text-slate-400" />;
  };

  return createPortal(
    <div className="fixed inset-0 bg-[#030712]/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 pointer-events-auto">
      <div
        className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/10 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Lab Results
            </h2>
            <p className="text-teal-100/80 text-xs font-bold uppercase tracking-widest mt-1">
              Values checked against their reference range
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
          {!review && !loading && !error && (
            <div className="text-center py-20">
              <div className="p-10 bg-teal-500/10 rounded-[3rem] w-max mx-auto mb-8">
                <Activity className="w-16 h-16 text-teal-500" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                Check your results
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-10 text-lg leading-relaxed">
                We&apos;ll compare {labResults?.length || 0} recorded {labResults?.length === 1 ? 'result' : 'results'} against
                the reference range printed on each report, and show which ones fall outside it.
              </p>
              <button
                onClick={handleReview}
                className="px-10 py-5 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-teal-500/20 active:scale-95"
              >
                Check results
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-20">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-teal-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Reading your results...
              </h3>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-20">
              <div className="p-10 bg-red-500/10 rounded-[3rem] w-max mx-auto mb-8">
                <AlertTriangle className="w-16 h-16 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                Couldn&apos;t read your results
              </h3>
              <p className="text-red-500 text-lg max-w-md mx-auto mb-10">{error}</p>
              <button
                onClick={handleReview}
                className="px-10 py-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] transition-all active:scale-95"
              >
                Try again
              </button>
            </div>
          )}

          {review && !loading && (
            <div className="space-y-8">
              {/* Counts — factual only */}
              <div className="p-8 bg-gradient-to-br from-teal-600 to-teal-700 rounded-[2.5rem] text-white shadow-xl shadow-teal-900/20">
                <p className="text-xl font-bold leading-snug mb-8">
                  {review.summary}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Total</div>
                    <div className="text-3xl font-black">{review.totalTests}</div>
                  </div>
                  <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Outside range</div>
                    <div className="text-3xl font-black">{review.abnormalCount}</div>
                  </div>
                  <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Within range</div>
                    <div className="text-3xl font-black">{review.normalCount}</div>
                  </div>
                  <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Not compared</div>
                    <div className="text-3xl font-black">{review.unknownCount ?? 0}</div>
                  </div>
                </div>
              </div>

              {/* Guidance — fixed text, not model output */}
              {review.guidance && (
                <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] flex items-start gap-4">
                  <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
                  <p className="text-base font-bold text-gray-800 dark:text-gray-100 leading-relaxed">
                    {review.guidance}
                  </p>
                </div>
              )}

              {/* Every result, with its own range */}
              {review.labResults?.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">
                    All results
                  </h3>
                  <div className="space-y-3">
                    {review.labResults.map((result) => (
                      <div
                        key={result.id}
                        className={`border p-5 rounded-2xl flex items-center gap-4 ${statusChip(result.status)}`}
                      >
                        <div className="p-2.5 bg-white/60 dark:bg-black/20 rounded-xl shrink-0">
                          {statusIcon(result)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-base text-slate-900 dark:text-white truncate">
                            {result.testName}
                          </h4>
                          <p className="text-sm font-bold opacity-80">
                            {result.resultValue}{result.unit ? ` ${result.unit}` : ''}
                            {result.referenceRange
                              ? ` · reference ${result.referenceRange}`
                              : ' · no reference range recorded'}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-white/60 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest rounded-full shrink-0">
                          {result.status === 'abnormal'
                            ? (result.direction === 'below' ? 'Below range' : 'Above range')
                            : result.status === 'normal' ? 'In range' : 'Not compared'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white dark:bg-gray-900 py-4 z-10">
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
