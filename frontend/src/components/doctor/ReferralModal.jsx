import React from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, X } from 'lucide-react';

const ReferralModal = ({
  isOpen,
  onClose,
  referralData,
  setReferralData,
  handleCreateReferral
}) => {
  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-slate-900 dark:text-white animate-in zoom-in-95 duration-200"
        style={{ maxWidth: '520px' }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Initiate Departmental Referral (§38)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Cross-consultation transfer order</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Clinical Department *
            </label>
            <select
              value={referralData.targetDepartment}
              onChange={(e) => setReferralData({ ...referralData, targetDepartment: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="Shalya">शल्य तंत्र (Shalya Tantra - Orthopedics & Surgery)</option>
              <option value="Shalakya">शालाक्य तंत्र (Shalakya Tantra - ENT & Head/Neck)</option>
              <option value="Prasuti & Stri Roga">प्रसूति व स्त्री रोग (Prasuti & Stri Roga)</option>
              <option value="Kaumarbhritya">कौमारभृत्य (Kaumarbhritya - Pediatrics)</option>
              <option value="Panchakarma">पंचकर्म (Panchakarma Specialty Unit)</option>
              <option value="Kayachikitsa">कायचिकित्सा (Kayachikitsa - Internal Medicine)</option>
              <option value="General Medicine">General Allopathic Medicine</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Preferred Specialist (Optional)
            </label>
            <input
              type="text"
              value={referralData.doctorName}
              onChange={(e) => setReferralData({ ...referralData, doctorName: e.target.value })}
              placeholder="e.g. Dr. Ananya Roy (MS Ortho)"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Referral Priority *
            </label>
            <select
              value={referralData.priority}
              onChange={(e) => setReferralData({ ...referralData, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Immediate Emergency</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Clinical Reason for Referral
            </label>
            <textarea
              rows={2}
              value={referralData.reason}
              onChange={(e) => setReferralData({ ...referralData, reason: e.target.value })}
              placeholder="e.g. Evaluate joint space narrowing & surgical / Panchakarma candidacy"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateReferral}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <ArrowUpRight className="w-4 h-4" /> Issue Referral
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};

export default ReferralModal;
