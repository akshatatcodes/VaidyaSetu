import React from 'react';
import { ArrowUpRight, X } from 'lucide-react';

const ReferralModal = ({
  isOpen,
  onClose,
  referralData,
  setReferralData,
  handleCreateReferral
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Initiate Departmental Referral (§38)
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Target Clinical Department *
            </label>
            <select
              value={referralData.targetDepartment}
              onChange={(e) => setReferralData({ ...referralData, targetDepartment: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Preferred Specialist (Optional)
            </label>
            <input
              type="text"
              value={referralData.doctorName}
              onChange={(e) => setReferralData({ ...referralData, doctorName: e.target.value })}
              placeholder="e.g. Dr. Ananya Roy (MS Ortho)"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Referral Priority *
            </label>
            <select
              value={referralData.priority}
              onChange={(e) => setReferralData({ ...referralData, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Immediate Emergency</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Clinical Reason for Referral
            </label>
            <textarea
              rows={2}
              value={referralData.reason}
              onChange={(e) => setReferralData({ ...referralData, reason: e.target.value })}
              placeholder="e.g. Evaluate joint space narrowing & surgical / Panchakarma candidacy"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-xs font-bold text-gray-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateReferral}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" /> Issue Referral
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralModal;
