import React, { useState } from 'react';
import {
  Eye, AlertOctagon, Activity, ShieldCheck, FileText, Sparkles,
  Copy, Check, AlertTriangle, Compass, ChevronDown, ChevronUp,
  Paperclip, HelpCircle
} from 'lucide-react';

/**
 * PatientSummaryCard — the doctor's view of what the patient entered at the kiosk.
 *
 * DESIGN RULE (the whole point of this rewrite):
 * This screen must never invent a clinical value. Every field previously had a
 * plausible-looking `|| fallback` — BP defaulted to 120/80 under a label reading
 * "Omron BT Cuff", all eight Ashtavidha findings defaulted to real pathological
 * findings, and a missing pain score rendered as a confident "5/10 Moderate".
 * A patient who answered three questions produced a screen that looked like a
 * complete examination, with no way for the doctor to tell captured from invented.
 *
 * Now: if the kiosk didn't capture it, the doctor sees "Not recorded".
 */

/** Renders a value, or an explicit, visually-distinct absence. */
const Value = ({ children, className = '' }) => {
  const empty =
    children === undefined ||
    children === null ||
    children === '' ||
    (typeof children === 'number' && Number.isNaN(children));

  if (empty) {
    return (
      <span className="text-gray-400 dark:text-gray-500 font-medium italic text-[11px]">
        Not recorded
      </span>
    );
  }
  return <span className={className}>{children}</span>;
};

/** True if a value was actually captured. */
const has = (v) => v !== undefined && v !== null && v !== '';

const PatientSummaryCard = ({ selectedSession, openEvidenceDrawer, onCopyAiSummary }) => {
  const [copied, setCopied] = useState(false);
  const [activeParikshaTab, setActiveParikshaTab] = useState('trividha');
  const [showParikshaDetails, setShowParikshaDetails] = useState(true);

  if (!selectedSession) return null;

  const pastIllnesses = Array.from(new Set([
    ...(selectedSession.pastMedicalHistory || []),
    ...(selectedSession.pastDiseases || []),
    ...(selectedSession.medicalHistory?.pastMedicalHistory || []),
    ...(selectedSession.medicalHistory?.pastDiseases || []),
    ...(selectedSession.extractedHistory?.illnesses || [])
  ])).filter(Boolean);

  const patientAllergies = Array.from(new Set([
    ...(selectedSession.allergies || []),
    ...(selectedSession.medicalHistory?.allergies || []),
    ...(selectedSession.extractedHistory?.allergies || [])
  ])).filter(Boolean);

  // The AI summary is generated server-side by buildAiSummary() from the encounter.
  // It is NOT synthesized here: the old code string-concatenated a sentence in the
  // browser and displayed it under a "Groq LLM Synthesized" badge.
  const aiSummary = selectedSession.aiSummary || selectedSession.soapNote?.aiSummary || '';
  const hasAiSummary = has(aiSummary);

  const handleCopy = () => {
    if (!hasAiSummary) return;
    if (onCopyAiSummary) onCopyAiSummary(aiSummary);
    else navigator.clipboard?.writeText(aiSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // consultationType is written by the kiosk care-pathway step onto the encounter.
  const consultationStream =
    selectedSession.consultationType ||
    selectedSession.dashavidhaPariksha?.consultationType ||
    'allopathy';

  const socrates = selectedSession.socrates || {};
  const trividha = selectedSession.dashavidhaPariksha?.trividhaPariksha || {};
  const ashtavidha = selectedSession.dashavidhaPariksha?.ashtavidhaPariksha || {};
  const dasha = selectedSession.dashavidhaPariksha || {};
  const vitals = selectedSession.vitals || {};
  const documents = selectedSession.documents || [];

  const rawSeverity = socrates.severity ?? selectedSession.severityScore;
  const severityScore = has(rawSeverity) ? Number(rawSeverity) : null;

  const prakriti = dasha.prakriti?.primaryDosha ||
    (typeof dasha.prakriti === 'string' ? dasha.prakriti : '');

  // Count how much the patient actually answered, so the doctor knows up front
  // how complete this intake is rather than inferring it from a full-looking screen.
  const parikshaAnswered =
    Object.values(trividha).filter(has).length +
    Object.values(ashtavidha).filter(has).length +
    [prakriti, dasha.agni, dasha.koshtha, dasha.satva].filter(has).length;

  const socratesAnswered = ['site', 'onset', 'character', 'severity', 'timing', 'duration', 'radiation', 'associated']
    .filter((k) => has(socrates[k])).length;

  const vitalsMeasured = ['systolicBP', 'diastolicBP', 'heartRate', 'spo2', 'temperature', 'bmi']
    .filter((k) => has(vitals[k])).length;

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-6 border border-emerald-500/20 shadow-xl space-y-5 animate-in fade-in duration-300">

      {/* 1. PATIENT IDENTIFIER & CONSULTATION STREAM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-500/20 shrink-0">
            {selectedSession.patientName?.charAt(0) || '?'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <Value>{selectedSession.tokenNumber}</Value>
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                ABHA: <Value>{selectedSession.abhaId}</Value>
              </span>
              {selectedSession.isReturningPatient && (
                <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/30">
                  Returning Patient
                </span>
              )}
              {selectedSession.visitMode === 'home' && (
                <span className="px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400 text-[10px] font-bold border border-violet-500/30">
                  Pre-registered from home
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 flex flex-wrap items-center gap-2">
              <Value>{selectedSession.patientName}</Value>
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                ({has(selectedSession.age) ? `${selectedSession.age}y` : 'age not recorded'}
                {has(selectedSession.gender) ? `, ${selectedSession.gender}` : ''})
              </span>
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {consultationStream === 'ayurvedic' ? (
            <>
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1.5 shadow-sm">
                🌿 Ayurvedic OPD
              </div>
              {has(prakriti) && (
                <div className="px-3 py-1.5 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-black">
                  Prakriti: {prakriti}
                </div>
              )}
              {has(dasha.agni) && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-black">
                  Agni: {dasha.agni}
                </div>
              )}
            </>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/40 text-xs font-black flex items-center gap-1.5 shadow-sm">
              💊 Allopathy General OPD
            </div>
          )}
        </div>
      </div>

      {/* 2. AI CLINICAL SUMMARY — rendered only when the backend actually produced one */}
      <div className="relative p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-900/5 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900/60 border-2 border-emerald-500/30 shadow-lg space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex flex-wrap items-center gap-1.5">
              AI Intake Summary
              {hasAiSummary && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-mono font-bold">
                  Generated from intake answers
                </span>
              )}
            </span>
          </div>

          {hasAiSummary && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-800 dark:text-emerald-200 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
              title="Paste the intake summary into the SOAP Subjective field"
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied to SOAP</>
              ) : (
                <><Copy className="w-3.5 h-3.5 text-emerald-500" /> Copy to SOAP</>
              )}
            </button>
          )}
        </div>

        {hasAiSummary ? (
          <p className="text-xs sm:text-sm text-slate-700 dark:text-gray-200 leading-relaxed font-medium">
            {aiSummary}
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic font-medium">
            No summary generated yet — the patient has not completed kiosk intake.
          </p>
        )}
      </div>

      {/* 3. CHIEF COMPLAINT & SOCRATES */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" /> Chief Complaint & Symptom Detail
          </h3>
          <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400">
            {socratesAnswered} of 4 questions answered at kiosk
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-emerald-500/20 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed flex items-start gap-3">
          <span className="text-2xl text-emerald-500 leading-none">“</span>
          <div className="flex-1">
            <Value>{selectedSession.chiefComplaint}</Value>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Severity — no invented midpoint */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 block">
              Pain / Severity
            </span>
            {severityScore !== null ? (
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-xl font-black font-mono ${
                  severityScore >= 7 ? 'text-red-500' : severityScore >= 4 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {severityScore}/10
                </span>
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                  {severityScore >= 7 ? 'Severe (तीव्र)' : severityScore >= 4 ? 'Moderate (मध्यम)' : 'Mild (सौम्य)'}
                </span>
              </div>
            ) : (
              <div className="mt-2"><Value /></div>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 block">
              Symptom Character
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-gray-200 block mt-1">
              <Value>{socrates.character}</Value>
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 block">
              Onset / Duration
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-gray-200 block mt-1">
              <Value>{socrates.onset || socrates.timing || socrates.duration}</Value>
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 block">
              Site
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-gray-200 block mt-1">
              <Value>{socrates.site}</Value>
            </span>
          </div>
        </div>

        {/* Routed department + whether a human or the inference engine chose it */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
            Routed to
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black">
            <Value>{selectedSession.department}</Value>
          </span>
          {selectedSession.departmentManuallySet ? (
            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
              chosen by patient
            </span>
          ) : has(selectedSession.inferredDepartment?.confidence) ? (
            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
              AI-inferred ({Math.round(
                selectedSession.inferredDepartment.confidence > 1
                  ? selectedSession.inferredDepartment.confidence
                  : selectedSession.inferredDepartment.confidence * 100
              )}% confidence) — please confirm
            </span>
          ) : null}
        </div>
      </div>

      {/* 4. PAST HISTORY & ALLERGIES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Past Illnesses & Comorbidities
            </h4>
            {/* Completeness counters were `text-gray-400` with no dark variant
                — the faintest thing on the card, despite being the signal that
                tells the doctor how sparse this intake actually was. */}
            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
              {pastIllnesses.length} Documented
            </span>
          </div>

          {pastIllnesses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pastIllnesses.map((illness, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {illness}
                </span>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-dashed border-gray-300 dark:border-white/10 text-center text-xs text-gray-400 font-medium">
              None reported by patient at intake.
            </div>
          )}
        </div>

        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Known Drug & Substance Allergies
            </h4>
            {patientAllergies.length > 0 && (
              <span className="text-[10px] font-bold text-rose-500">CRITICAL SAFETY</span>
            )}
          </div>

          {patientAllergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patientAllergies.map((allergy, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 text-xs font-black flex items-center gap-1.5 shadow-sm"
                >
                  ⚠️ {allergy}
                </span>
              ))}
            </div>
          ) : (
            /* "None reported" is a patient statement, not a cleared allergy screen.
               The old copy read "✓ No known adverse drug reactions" in reassuring
               green, which reads as a verified finding. */
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-dashed border-gray-300 dark:border-white/10 text-center text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
              None reported at intake — confirm verbally before prescribing.
            </div>
          )}
        </div>
      </div>

      {/* 5. AYUSH PARIKSHA — Ayurvedic stream only, and only what was filled in */}
      {consultationStream === 'ayurvedic' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-emerald-500/25 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                AYUSH Pariksha Findings
              </h3>
              <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                {parikshaAnswered} field{parikshaAnswered === 1 ? '' : 's'} filled by patient
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowParikshaDetails(!showParikshaDetails)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              {showParikshaDetails ? 'Collapse' : 'Expand'}
              {showParikshaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {parikshaAnswered === 0 ? (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
              Pariksha assessment was optional and the patient skipped it — examine at the chair.
            </div>
          ) : showParikshaDetails && (
            <div className="space-y-4 pt-1">
              <div className="flex flex-wrap gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-black">
                {[
                  { id: 'trividha', label: '🌿 Trividha (त्रिविध)', active: 'bg-emerald-600' },
                  { id: 'ashtavidha', label: '🔍 Ashtavidha (अष्टविध)', active: 'bg-teal-600' },
                  { id: 'dashavidha', label: '⚖️ Dashavidha (दशविध)', active: 'bg-amber-600' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveParikshaTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      activeParikshaTab === tab.id
                        ? `${tab.active} text-white shadow-sm`
                        : 'text-slate-700 dark:text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeParikshaTab === 'trividha' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {[
                    ['१. दर्शन (Darshana — Visual Inspection)', trividha.darshana],
                    ['२. स्पर्शन (Sparshana — Tactile / Heat)', trividha.sparshana],
                    ['३. प्रश्न (Prashna — Interrogation)', trividha.prashna]
                  ].map(([label, val]) => (
                    <div key={label} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                      <span className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 block mb-1">{label}</span>
                      <p className="font-bold text-slate-800 dark:text-gray-200"><Value>{val}</Value></p>
                    </div>
                  ))}
                </div>
              )}

              {activeParikshaTab === 'ashtavidha' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    ['१. नाड़ी (Nadi)', ashtavidha.nadi],
                    ['२. जिह्वा (Jihwa)', ashtavidha.jihwa],
                    ['३. मल (Mala)', ashtavidha.mala],
                    ['४. मूत्र (Mootra)', ashtavidha.mootra],
                    ['५. शब्द (Shabda)', ashtavidha.shabda],
                    ['६. स्पर्श (Sparsha)', ashtavidha.sparsha],
                    ['७. दृक् (Drik)', ashtavidha.drik],
                    ['८. आकृति (Akruti)', ashtavidha.akruti]
                  ].map(([label, val]) => (
                    <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                      <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 block uppercase">{label}</span>
                      <span className="font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                        <Value>{val}</Value>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeParikshaTab === 'dashavidha' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    ['१. प्रकृति (Prakriti)', prakriti],
                    ['२. अग्नि (Agni)', dasha.agni],
                    ['३. कोष्ठ (Koshtha)', dasha.koshtha],
                    ['४. सत्व (Satva)', dasha.satva],
                    ['५. सार (Sara)', dasha.sara],
                    ['६. संहनन (Samhanana)', dasha.samhanana],
                    ['७. व्यायाम शक्ति (Vyayama Shakti)', dasha.vyayamaShakti]
                  ].map(([label, val]) => (
                    <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                      <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 block uppercase">{label}</span>
                      <span className="font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                        <Value>{typeof val === 'object' ? (val?.type || val?.primaryDosha || '') : val}</Value>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. VITALS — labels no longer claim a device that may not have been used */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Vitals Captured at Kiosk
          </h4>
          <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
            {vitalsMeasured} of 6 measured
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className={`p-3 rounded-2xl border text-center ${
            vitals.systolicBP >= 140
              ? 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400 font-black'
              : 'bg-slate-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-900 dark:text-white'
          }`}>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block uppercase">BP (mmHg)</span>
            <span className="text-base font-black font-mono">
              {has(vitals.systolicBP) && has(vitals.diastolicBP)
                ? `${vitals.systolicBP}/${vitals.diastolicBP}`
                : <Value />}
            </span>
          </div>

          <div className="p-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center text-slate-900 dark:text-white">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block uppercase">Heart Rate</span>
            <span className="text-base font-black font-mono">
              {has(vitals.heartRate) ? `${vitals.heartRate} bpm` : <Value />}
            </span>
          </div>

          <div className={`p-3 rounded-2xl border text-center ${
            has(vitals.spo2) && vitals.spo2 < 94
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 font-black'
              : 'bg-slate-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-900 dark:text-white'
          }`}>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block uppercase">SpO2</span>
            <span className="text-base font-black font-mono">
              {has(vitals.spo2) ? `${vitals.spo2}%` : <Value />}
            </span>
          </div>

          <div className="p-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center text-slate-900 dark:text-white">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block uppercase">Temperature</span>
            <span className="text-base font-black font-mono">
              {has(vitals.temperature) ? `${vitals.temperature}°F` : <Value />}
            </span>
          </div>

          <div className="p-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center text-slate-900 dark:text-white">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block uppercase">BMI</span>
            <span className="text-base font-black font-mono">
              {has(vitals.bmi) ? vitals.bmi : <Value />}
            </span>
          </div>

          <div className={`p-3 rounded-2xl border text-center ${
            selectedSession.triagePriority === 'emergency'
              ? 'bg-red-500 text-white font-black animate-pulse'
              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border-emerald-500/30'
          }`}>
            <span className="text-[10px] font-bold opacity-80 block uppercase">Triage</span>
            <span className="text-xs font-black uppercase">
              <Value>{selectedSession.triagePriority}</Value>
            </span>
          </div>
        </div>
      </div>

      {/* 7. UPLOADED DOCUMENTS — the doctor needs to see what the patient brought */}
      {documents.length > 0 && (
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-emerald-500" />
            Documents Uploaded by Patient ({documents.length})
          </h4>
          <div className="space-y-2">
            {documents.map((doc, idx) => {
              const meds = (doc.extractedFields || []).filter((f) => has(f.value));
              const needsReview = doc.verificationStatus === 'needs_staff_review';
              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-gray-200 block truncate">
                      {doc.originalName || 'Untitled document'}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {doc.type || 'document'}
                      {doc.isHandwritten ? ' · handwritten' : ''}
                      {doc.uploadedAt ? ` · ${new Date(doc.uploadedAt).toLocaleDateString()}` : ''}
                    </span>
                    {meds.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {meds.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold"
                          >
                            {f.value}
                            <span className="opacity-70"> · unconfirmed</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-600 dark:text-gray-300 italic block mt-1">
                        No medication text extracted
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg shrink-0 ${
                    needsReview
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {needsReview ? 'Needs review' : 'Awaiting confirm'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. RED FLAGS */}
      {selectedSession.redFlags?.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-500/15 border-2 border-red-500/40 text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-black uppercase tracking-wider block">
              Triage red flags detected at intake
            </span>
            <ul className="list-disc list-inside text-xs font-bold mt-1 space-y-0.5">
              {selectedSession.redFlags.map((rf, i) => (
                <li key={i}>
                  {rf.flag || rf}{rf.category ? ` (${rf.category})` : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 9. PROVENANCE FOOTER — states what this data is, without over-claiming */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
        <div className="flex items-start gap-2 text-emerald-800 dark:text-emerald-200 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            <strong>Provenance:</strong> Self-reported at kiosk and AI-summarised.
            Fields marked “Not recorded” were never captured. Confirm clinically before prescribing.
          </span>
        </div>
        <button
          type="button"
          onClick={openEvidenceDrawer}
          className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white/10 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold text-xs border border-emerald-500/40 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-400" /> Inspect Evidence
        </button>
      </div>

    </div>
  );
};

export default PatientSummaryCard;
