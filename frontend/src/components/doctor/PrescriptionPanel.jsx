import React, { useState } from 'react';
import { Pill, Plus, Trash2, ShieldAlert } from 'lucide-react';

export default function PrescriptionPanel({ plan = {}, onAddAyuMed, onAddAlloMed, onDeleteMed }) {
  const [ayuForm, setAyuForm] = useState({ name: '', dosage: '', frequency: 'BD', duration: '14 days', anupana: 'Warm Water' });
  const [alloForm, setAlloForm] = useState({ name: '', dosage: '', frequency: 'OD', duration: '5 days', instructions: 'After meals' });

  const handleAddAyu = (e) => {
    e.preventDefault();
    if (!ayuForm.name) return;
    onAddAyuMed && onAddAyuMed({ ...ayuForm });
    setAyuForm({ name: '', dosage: '', frequency: 'BD', duration: '14 days', anupana: 'Warm Water' });
  };

  const handleAddAllo = (e) => {
    e.preventDefault();
    if (!alloForm.name) return;
    onAddAlloMed && onAddAlloMed({ ...alloForm });
    setAlloForm({ name: '', dosage: '', frequency: 'OD', duration: '5 days', instructions: 'After meals' });
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm space-y-4">
      <h4 className="font-black text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-2">
        <Pill className="w-4 h-4 text-emerald-500" /> Integrated Clinical Prescription (§30)
      </h4>

      {/* AYUSH Formulations Form */}
      <div className="space-y-2">
        <span className="text-xs font-black text-slate-900 dark:text-white block">🌿 Ayurvedic Formulations</span>
        <form onSubmit={handleAddAyu} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <input
            type="text"
            placeholder="Formulation (e.g. Yograj Guggulu)"
            value={ayuForm.name}
            onChange={e => setAyuForm({ ...ayuForm, name: e.target.value })}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Dosage (2 tabs)"
            value={ayuForm.dosage}
            onChange={e => setAyuForm({ ...ayuForm, dosage: e.target.value })}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Anupana (Warm Water)"
            value={ayuForm.anupana}
            onChange={e => setAyuForm({ ...ayuForm, anupana: e.target.value })}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Duration (14 days)"
            value={ayuForm.duration}
            onChange={e => setAyuForm({ ...ayuForm, duration: e.target.value })}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add AYUSH
          </button>
        </form>
      </div>

      {/* Allopathic Prescriptions Form */}
      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/10">
        <span className="text-xs font-black text-slate-900 dark:text-white block">💊 Allopathic Medications</span>
        <form onSubmit={handleAddAllo} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <input
            type="text"
            placeholder="Medicine (e.g. Paracetamol 500mg)"
            value={alloForm.name}
            onChange={e => setAlloForm({ ...alloForm, name: e.target.value })}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Dosage (1 tab)"
            value={alloForm.dosage}
            onChange={e => setAlloForm({ ...alloForm, dosage: e.target.value })}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Instructions (After meals)"
            value={alloForm.instructions}
            onChange={e => setAlloForm({ ...alloForm, instructions: e.target.value })}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Duration (5 days)"
            value={alloForm.duration}
            onChange={e => setAlloForm({ ...alloForm, duration: e.target.value })}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Allo
          </button>
        </form>
      </div>
    </div>
  );
}
