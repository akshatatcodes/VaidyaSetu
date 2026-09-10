import React, { useState } from 'react';
import { FlaskConical, Plus, Trash2 } from 'lucide-react';

export default function LabOrderPanel({ orders = [], onAddOrder, onDeleteOrder }) {
  const [testName, setTestName] = useState('');
  const [section, setSection] = useState('Pathology');
  const [priority, setPriority] = useState('routine');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!testName) return;
    onAddOrder && onAddOrder({ testName, section, priority, id: Date.now() });
    setTestName('');
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm space-y-4">
      <h4 className="font-black text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-emerald-500" /> Diagnostic Investigation Orders (§27)
      </h4>

      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <input
          type="text"
          placeholder="Test Name (e.g. Lipid Profile, Serum Creatinine)"
          value={testName}
          onChange={e => setTestName(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white"
        />
        <select
          value={section}
          onChange={e => setSection(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white"
        >
          <option value="Pathology">Pathology</option>
          <option value="Biochemistry">Biochemistry</option>
          <option value="Microbiology">Microbiology</option>
          <option value="Radiology">Radiology</option>
        </select>
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white"
        >
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
          <option value="stat">STAT / Emergency</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Order Test
        </button>
      </form>

      {orders.length > 0 && (
        <div className="space-y-2 pt-2">
          {orders.map((o, idx) => (
            <div key={o.id || idx} className="p-2.5 rounded-xl border border-gray-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">{o.testName}</span>
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">{o.section}</span>
              </div>
              <button
                type="button"
                onClick={() => onDeleteOrder && onDeleteOrder(o.id || idx)}
                className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
