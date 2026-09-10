import React, { useState } from 'react';
import { Calendar, Clock, Check } from 'lucide-react';

export default function FollowUpPanel({ decision = {}, onUpdateDecision }) {
  const [choice, setChoice] = useState(decision.choice || 'after_lab');
  const [date, setDate] = useState(decision.date || '');
  const [windowSlot, setWindowSlot] = useState(decision.window || '10:30-11:00');
  const [notes, setNotes] = useState(decision.notes || '');

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateDecision && onUpdateDecision({ choice, date, window: windowSlot, notes });
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm space-y-4">
      <h4 className="font-black text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-emerald-500" /> Follow-Up Decision & Continuity Slot (§37)
      </h4>

      <form onSubmit={handleSave} className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
            <input
              type="radio"
              name="choice"
              value="after_lab"
              checked={choice === 'after_lab'}
              onChange={e => setChoice(e.target.value)}
            />
            <span className="font-bold">After Lab Results</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
            <input
              type="radio"
              name="choice"
              value="specific_date"
              checked={choice === 'specific_date'}
              onChange={e => setChoice(e.target.value)}
            />
            <span className="font-bold">Specific Date</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
            <input
              type="radio"
              name="choice"
              value="no_followup"
              checked={choice === 'no_followup'}
              onChange={e => setChoice(e.target.value)}
            />
            <span className="font-bold">No Follow-Up</span>
          </label>
        </div>

        {choice === 'specific_date' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white"
            />
            <select
              value={windowSlot}
              onChange={e => setWindowSlot(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="10:30-11:00">10:30 AM – 11:00 AM Window</option>
              <option value="11:00-11:30">11:00 AM – 11:30 AM Window</option>
              <option value="02:30-03:00">02:30 PM – 03:00 PM Window</option>
            </select>
          </div>
        )}

        <textarea
          rows={2}
          placeholder="Follow-up clinical instructions / milestones..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer shadow-md"
          >
            <Check className="w-3.5 h-3.5" /> Save Follow-Up Plan
          </button>
        </div>
      </form>
    </div>
  );
}
