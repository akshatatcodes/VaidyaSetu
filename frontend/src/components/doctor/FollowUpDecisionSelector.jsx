import React from 'react';
import { Calendar } from 'lucide-react';

// The three outcomes a consultation can end in (§37):
//   1. labs ordered  → patient goes to the lab with a new token, reviewed after
//   2. follow-up     → patient returns (2 days is the standard OPD default)
//   3. complete      → treatment finished, case sheet signed and closed
const FOLLOW_UP_OPTIONS = [
  { id: 'after_lab', label: 'Review after Lab Test', desc: 'Patient goes to lab now; review when results are verified' },
  { id: 'in_2_days', label: 'Follow-up in 2 Days', desc: 'Standard OPD review window' },
  { id: 'fixed_date', label: 'Fixed Date Follow-up', desc: 'Specific OPD appointment date' },
  { id: 'discharge', label: 'Discharge / Treatment Complete', desc: 'No scheduled follow-up needed' },
  { id: 'sos', label: 'SOS / As Needed', desc: 'Return if symptoms worsen' },
  { id: 'teleconsult', label: 'Tele-Consultation', desc: 'Remote follow-up via patient portal' }
];

const FollowUpDecisionSelector = ({ followUpDecision, setFollowUpDecision }) => {
  return (
    <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-emerald-500/20 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-emerald-500" />
        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Consultation Outcome
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {FOLLOW_UP_OPTIONS.map((option) => {
          const isSelected = followUpDecision.choice === option.id;

          return (
            <div
              key={option.id}
              onClick={() =>
                setFollowUpDecision((prev) => ({
                  ...prev,
                  choice: option.id,
                  // Carry the day count so the backend can date the appointment.
                  afterDays: option.id === 'in_2_days' ? 2 : prev.afterDays
                }))
              }
              className={`p-3 rounded-2xl border-2 transition-all cursor-pointer select-none text-left ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800/80 hover:border-emerald-400/40'
              }`}
            >
              <span className="text-xs font-black text-slate-900 dark:text-white block">
                {option.label}
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                {option.desc}
              </span>
            </div>
          );
        })}
      </div>

      {followUpDecision.choice === 'fixed_date' && (
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
              Select Follow-up Date
            </label>
            <input
              type="date"
              value={followUpDecision.date || ''}
              onChange={(e) =>
                setFollowUpDecision((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
              Time Slot / Window
            </label>
            <select
              value={followUpDecision.window || 'morning'}
              onChange={(e) =>
                setFollowUpDecision((prev) => ({ ...prev, window: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="morning">Morning Slot (09:00 AM - 12:00 PM)</option>
              <option value="afternoon">Afternoon Slot (01:00 PM - 04:00 PM)</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <input
          type="text"
          placeholder="Follow-up instructions or notes for patient portal..."
          value={followUpDecision.notes || ''}
          onChange={(e) =>
            setFollowUpDecision((prev) => ({ ...prev, notes: e.target.value }))
          }
          className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
        />
      </div>
    </div>
  );
};

export default FollowUpDecisionSelector;
