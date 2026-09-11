import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * ChangeDeltaPanel — "what changed since last visit" for returning patients.
 *
 * This panel previously fabricated an entire longitudinal trend. Line 59 read:
 *   BP Delta: {vitals?.systolicBP || '130'}/{vitals?.diastolicBP || '85'} (prior {priorBp || '140/90'})
 * `priorBp` is not a field any backend writes, so for every returning patient the
 * doctor was shown "BP improved from 140/90 to 130/85" — a complete fiction with
 * no prior-visit data source behind it. "Medicine Status: Active / Adjusted" was
 * hardcoded JSX asserting a medication change that may never have happened.
 *
 * Now each row renders only from real data and the row disappears if absent. If
 * nothing real is available, the whole panel returns null rather than filling
 * three columns with invented deltas.
 */

const has = (v) => v !== undefined && v !== null && v !== '';

const Row = ({ children, className = '' }) => (
  <p className={className}>• {children}</p>
);

const ChangeDeltaPanel = ({ selectedSession }) => {
  if (!selectedSession) return null;

  const isReturning =
    selectedSession.isReturningPatient ||
    selectedSession.changesSinceLastVisit?.length > 0;

  if (!isReturning) return null;

  const vitals = selectedSession.vitals || {};
  const priorVitals = selectedSession.previousVitals || {};

  // NEW column
  const newComplaint = selectedSession.newComplaint || selectedSession.chiefComplaint;
  const newMed = selectedSession.newMedName;
  const newInvestigation = selectedSession.investigationOrders?.[0]?.testName;
  const declaredChanges = (selectedSession.changesSinceLastVisit || []).filter(Boolean);
  const hasNew = has(newComplaint) || has(newMed) || has(newInvestigation) || declaredChanges.length > 0;

  // CHANGED column — only a real pair of readings is a delta.
  const currentBp = has(vitals.systolicBP) && has(vitals.diastolicBP)
    ? `${vitals.systolicBP}/${vitals.diastolicBP}`
    : null;
  const priorBp = has(priorVitals.systolicBP) && has(priorVitals.diastolicBP)
    ? `${priorVitals.systolicBP}/${priorVitals.diastolicBP}`
    : (has(selectedSession.priorBp) ? selectedSession.priorBp : null);
  const labTrend = selectedSession.labTrends?.[0];
  const hasChanged = currentBp || labTrend;

  // UNCHANGED column
  const knownCondition = selectedSession.primaryCondition || selectedSession.pastMedicalHistory?.[0];
  const knownAllergy = selectedSession.allergies?.[0];
  const hasUnchanged = has(knownCondition) || has(knownAllergy);

  if (!hasNew && !hasChanged && !hasUnchanged) return null;

  return (
    <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-teal-500/30 shadow-xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            What Changed Since Last Visit
          </h3>
        </div>
        {selectedSession.previousVisitDate && (
          <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-[10px] font-black uppercase">
            Prior visit: {new Date(selectedSession.previousVisitDate).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* NEW */}
        {hasNew && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                🆕 NEW
              </span>
              {has(selectedSession.newMedDate) && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                  {selectedSession.newMedDate}
                </span>
              )}
            </div>
            <div className="space-y-1 text-xs font-bold text-slate-900 dark:text-white">
              {has(newComplaint) && <Row>{newComplaint}</Row>}
              {has(newMed) && (
                <Row className="text-emerald-600 dark:text-emerald-400">{newMed}</Row>
              )}
              {has(newInvestigation) && (
                <Row className="text-teal-600 dark:text-teal-400">
                  New investigation: {newInvestigation}
                </Row>
              )}
              {declaredChanges.map((c, i) => (
                <Row key={i}>{typeof c === 'string' ? c : (c.detail || c.change || '')}</Row>
              ))}
            </div>
            {has(selectedSession.newMedSource) && (
              <p className="text-[10px] text-slate-500 dark:text-gray-400 border-t border-emerald-500/20 pt-1">
                {selectedSession.newMedSource}
              </p>
            )}
          </div>
        )}

        {/* CHANGED */}
        {hasChanged && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                🔄 CHANGED
              </span>
            </div>
            <div className="space-y-1 text-xs font-bold text-slate-900 dark:text-white">
              {currentBp && (
                <Row>
                  BP today: {currentBp}
                  {priorBp
                    ? ` (prior ${priorBp})`
                    : <span className="font-medium italic text-gray-500"> — no prior reading on file</span>}
                </Row>
              )}
              {labTrend && (
                <Row className="text-amber-700 dark:text-amber-300">
                  {labTrend.testName}: {labTrend.currentValue}
                  {has(labTrend.previousValue) ? ` (prior ${labTrend.previousValue})` : ''}
                </Row>
              )}
            </div>
            {has(selectedSession.changedVitalDetail) && (
              <p className="text-[10px] text-slate-500 dark:text-gray-400 border-t border-amber-500/20 pt-1">
                {selectedSession.changedVitalDetail}
              </p>
            )}
          </div>
        )}

        {/* UNCHANGED */}
        {hasUnchanged && (
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-gray-300 text-[9px] font-black uppercase tracking-wider">
                📌 UNCHANGED
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Known baseline</span>
            </div>
            <div className="space-y-1 text-xs font-bold text-slate-900 dark:text-white">
              {has(knownCondition) && <Row>Known condition: {knownCondition}</Row>}
              {has(knownAllergy) && (
                <Row className="text-slate-600 dark:text-gray-300">
                  Existing allergy: {knownAllergy}
                </Row>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangeDeltaPanel;
