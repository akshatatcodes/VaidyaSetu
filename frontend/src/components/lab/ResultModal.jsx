import React, { useState } from 'react';
import { TestTube2, X, Save, Loader2 } from 'lucide-react';

export default function ResultModal({ order, onClose, onSave }) {
  const [value, setValue] = useState(order?.result?.value || '');
  const [unit, setUnit] = useState(order?.result?.unit || 'mg/dL');
  const [refRange, setRefRange] = useState(order?.result?.referenceRange || '70 - 100');
  const [critical, setCritical] = useState(order?.critical || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ value, unit, referenceRange: refRange, critical });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TestTube2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {order.status === 'verified' || order.status === 'resulted' ? 'Amend Lab Result (§30 Versioning)' : 'Enter Result Value'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Test & Department</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{order.testName}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Patient Details</p>
            <p className="text-xs text-slate-600 dark:text-gray-300">
              {order.patientName} · Token: {order.tokenNumber} · {order.age}y {order.gender}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Result Value *</label>
            <input
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="e.g. 8.2% or 126 mg/dL"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-cyan-500 outline-none text-slate-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="mg/dL"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-cyan-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Reference Range</label>
              <input
                type="text"
                value={refRange}
                onChange={e => setRefRange(e.target.value)}
                placeholder="< 5.7 %"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-cyan-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-red-500/20 bg-red-500/5 cursor-pointer">
            <input type="checkbox" checked={critical} onChange={e => setCritical(e.target.checked)} className="w-4 h-4 accent-red-500" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">Flag as CRITICAL — Trigger urgent clinician notification</span>
          </label>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !value}
          className="mt-5 w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-cyan-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save & Preserved Version (§30)
        </button>
      </div>
    </div>
  );
}
