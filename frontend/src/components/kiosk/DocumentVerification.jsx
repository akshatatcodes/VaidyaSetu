import React, { useState } from 'react';
import { Check, X, Pencil } from 'lucide-react';

/** "We found Paracetamol 500mg — correct?" Yes/No/Edit before writing to session */
export default function DocumentVerification({ document, onConfirm, onSkip }) {
  const fields = document?.extractedFields || [];
  const [edits, setEdits] = useState({});
  const [actions, setActions] = useState({});

  if (!document) return null;

  if (document.verificationStatus === 'needs_staff_review') {
    return (
      <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-100 text-sm">
        Handwritten / unverified document stored for staff review — not auto-applied to medications.
        <button type="button" className="block mt-3 underline" onClick={onSkip}>Continue</button>
      </div>
    );
  }

  const submit = () => {
    const confirmations = fields.map((_, i) => ({
      fieldIndex: i,
      action: actions[i] || 'yes',
      editedValue: edits[i]
    }));
    onConfirm(confirmations);
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl border border-white/10 bg-slate-900/60">
      <p className="text-sm text-slate-300 font-medium">
        Confirm extracted fields (AI draft — verify before saving)
      </p>
      {fields.map((f, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white/5">
          <input
            className="flex-1 min-w-[140px] bg-transparent border-b border-white/20 text-white text-sm py-1"
            value={edits[i] ?? f.value}
            onChange={(e) => {
              setEdits({ ...edits, [i]: e.target.value });
              setActions({ ...actions, [i]: 'edit' });
            }}
          />
          <button type="button" title="Yes" onClick={() => setActions({ ...actions, [i]: 'yes' })}
            className={`p-2 rounded-lg ${(actions[i] || 'yes') === 'yes' ? 'bg-emerald-500/30' : 'bg-white/5'}`}>
            <Check className="w-4 h-4 text-emerald-400" />
          </button>
          <button type="button" title="No" onClick={() => setActions({ ...actions, [i]: 'no' })}
            className={`p-2 rounded-lg ${actions[i] === 'no' ? 'bg-rose-500/30' : 'bg-white/5'}`}>
            <X className="w-4 h-4 text-rose-400" />
          </button>
          <Pencil className="w-4 h-4 text-slate-400" />
        </div>
      ))}
      {(document.labFlags || []).length > 0 && (
        <div className="text-xs text-amber-200 space-y-1">
          {document.labFlags.map((lf, i) => (
            <p key={i}>{lf.parameter}: {lf.value} — {lf.flag}</p>
          ))}
        </div>
      )}
      <button type="button" onClick={submit}
        className="w-full py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-sm">
        Save confirmed fields
      </button>
    </div>
  );
}
