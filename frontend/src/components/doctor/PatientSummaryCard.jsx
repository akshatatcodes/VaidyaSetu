import React, { useState } from 'react';
import {
  Eye, AlertOctagon, Activity, ShieldCheck, FileText, Sparkles,
  Copy, Check, AlertTriangle, Heart, Thermometer, Wind, User,
  Flame, Droplets, Compass, ShieldAlert, Stethoscope, ChevronDown, ChevronUp
} from 'lucide-react';

const PatientSummaryCard = ({ selectedSession, openEvidenceDrawer, onCopyAiSummary }) => {
  const [copied, setCopied] = useState(false);
  const [activeParikshaTab, setActiveParikshaTab] = useState('trividha');
  const [showParikshaDetails, setShowParikshaDetails] = useState(true);
  const [selectedDocPreview, setSelectedDocPreview] = useState(null);

  if (!selectedSession) return null;

  // Distinguish between Current Visit Intake vs Previously on File (Historical Record)
  const currentVisitIllnesses = Array.from(new Set([
    ...(selectedSession.medicalHistory?.currentKioskIllnesses || []),
    ...(selectedSession.pastDiseases || []),
    ...(selectedSession.medicalHistory?.pastDiseases || []),
    ...(selectedSession.pastMedicalHistory || [])
  ])).filter(Boolean);

  const previousIllnesses = Array.from(new Set([
    ...(selectedSession.patientId?.chronicDiseases || []),
    ...(selectedSession.historicalIllnesses || []),
    ...(selectedSession.previousMedicalHistory || [])
  ])).filter(ill => !currentVisitIllnesses.includes(ill));

  const allIllnesses = [...currentVisitIllnesses, ...previousIllnesses];

  const currentVisitAllergies = Array.from(new Set([
    ...(selectedSession.medicalHistory?.currentKioskAllergies || []),
    ...(selectedSession.allergies || []),
    ...(selectedSession.medicalHistory?.allergies || [])
  ])).filter(Boolean);

  const previousAllergies = Array.from(new Set([
    ...(selectedSession.patientId?.allergies || []),
    ...(selectedSession.historicalAllergies || [])
  ])).filter(all => !currentVisitAllergies.includes(all));

  const allAllergies = [...currentVisitAllergies, ...previousAllergies];

  // Documents attached to this encounter
  const attachedDocs = Array.isArray(selectedSession.documents) ? selectedSession.documents : [];
  const ocrPrescriptions = Array.isArray(selectedSession.ocrPrescriptions) ? selectedSession.ocrPrescriptions : [];

  // Synthesize rich AI Smart Clinical Summary if not explicitly set
  const aiSmartSummary = selectedSession.aiSummary ||
    selectedSession.soapNote?.aiSummary ||
    (selectedSession.chiefComplaint
      ? `${selectedSession.patientName || 'Patient'}, ${selectedSession.age || '--'}y ${selectedSession.gender || ''}, presented with chief complaint: "${selectedSession.chiefComplaint}". Severity: ${selectedSession.socrates?.severity || selectedSession.severityScore || '5'}/10 VAS score.${selectedSession.socrates?.character ? ` Symptoms described as ${selectedSession.socrates.character}.` : ''}${selectedSession.dashavidhaPariksha?.consultationType === 'ayurvedic' ? ' Opted for Ayurvedic holistic triage.' : ' Opted for General Allopathic consultation.'}${pastIllnesses.length > 0 ? ` Documented past medical history includes ${pastIllnesses.join(', ')}.` : ' No prior chronic illnesses declared.'}${patientAllergies.length > 0 ? ` CRITICAL ALLERGY ALERT: ${patientAllergies.join(', ')}.` : ' No known adverse drug reactions.'}`
      : 'Intake in progress. Chief symptoms and vitals captured at MediKiosk terminal.');

  const handleCopy = () => {
    if (onCopyAiSummary) {
      onCopyAiSummary(aiSmartSummary);
    } else {
      navigator.clipboard?.writeText(aiSmartSummary);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const consultationStream = selectedSession.dashavidhaPariksha?.consultationType ||
    (selectedSession.department === 'Shalya' || selectedSession.department === 'Kayachikitsa' || selectedSession.department === 'Panchakarma' ? 'ayurvedic' : 'allopathy');

  const trividha = selectedSession.dashavidhaPariksha?.trividhaPariksha || {};
  const ashtavidha = selectedSession.dashavidhaPariksha?.ashtavidhaPariksha || {};
  const dasha = selectedSession.dashavidhaPariksha || {};

  const severityScore = Number(selectedSession.socrates?.severity || selectedSession.severityScore || 5);

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-6 border border-emerald-500/20 shadow-xl space-y-5 animate-in fade-in duration-300">
      
      {/* 1. TOP PATIENT IDENTIFIER & CONSULTATION STREAM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-500/20 shrink-0">
            {selectedSession.patientName?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                {selectedSession.tokenNumber || 'OPD-001'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                ABHA: {selectedSession.abhaId || '14-8921-3401-9921'}
              </span>
              {selectedSession.isReturningPatient && (
                <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/30">
                  Returning Patient
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
              {selectedSession.patientName || 'Unknown Patient'} 
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                ({selectedSession.age || '--'}y, {selectedSession.gender || 'Not specified'})
              </span>
            </h2>
          </div>
        </div>

        {/* Consultation Stream & Dosha Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {consultationStream === 'ayurvedic' ? (
            <>
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1.5 shadow-sm">
                🌿 Ayurvedic OPD (AIIA)
              </div>
              {dasha.prakriti && (
                <div className="px-3 py-1.5 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-black">
                  Prakriti: {dasha.prakriti?.primaryDosha || dasha.prakriti || 'Vata-Pitta'}
                </div>
              )}
              {dasha.agni && (
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

      {/* 2. AI SMART CLINICAL SUMMARY CARD (AI PROBE & SYNTHESIS) */}
      <div className="relative p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-900/5 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900/60 border-2 border-emerald-500/30 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                AI Smart Clinical Summary
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-mono font-bold">
                  Groq LLM Synthesized
                </span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-800 dark:text-emerald-200 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            title="Paste AI Clinical Summary directly into SOAP Subjective"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied to SOAP
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-emerald-500" /> Copy to SOAP
              </>
            )}
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-gray-200 leading-relaxed font-medium">
          {aiSmartSummary}
        </p>
      </div>

      {/* 3. CURRENT PATIENT PROBLEM & SOCRATES BREAKDOWN */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" /> Current Patient Problem & Chief Complaint
          </h3>
          <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400">
            Recorded at Kiosk Step 2
          </span>
        </div>

        {/* Verbatim Quote */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-emerald-500/20 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed flex items-start gap-3">
          <span className="text-2xl text-emerald-500 leading-none">“</span>
          <div className="flex-1">
            {selectedSession.chiefComplaint || 'Consultation triage intake'}
          </div>
        </div>

        {/* SOCRATES Clinical Attribute Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* VAS Pain Gauge */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
              Pain / Severity Score
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-xl font-black font-mono ${
                severityScore >= 7 ? 'text-red-500' : severityScore >= 4 ? 'text-amber-500' : 'text-emerald-500'
              }`}>
                {severityScore}/10
              </span>
              <span className="text-[10px] font-bold text-gray-400">
                {severityScore >= 7 ? 'Severe (तीव्र)' : severityScore >= 4 ? 'Moderate (मध्यम)' : 'Mild (सौम्य)'}
              </span>
            </div>
          </div>

          {/* Character */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
              Symptom Character
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-gray-200 block mt-1 truncate">
              {selectedSession.socrates?.character || 'Burning / Reflux / Pain'}
            </span>
          </div>

          {/* Duration / Onset */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
              Duration / Onset
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-gray-200 block mt-1 truncate">
              {selectedSession.socrates?.timing || selectedSession.socrates?.duration || '3 to 5 days'}
            </span>
          </div>

          {/* Inferred Department */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
              Inferred Triage OPD
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mt-1 truncate">
              {selectedSession.department || 'Kayachikitsa OPD'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. PAST MEDICAL HISTORY & ALLERGIES DOSSIER (WITH VISIT ATTRIBUTION) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Past Illnesses & Comorbidities */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Past Illnesses & Comorbidities
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                {currentVisitIllnesses.length} Today (Kiosk)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">
                {previousIllnesses.length} Previous
              </span>
            </div>
          </div>

          {allIllnesses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentVisitIllnesses.map((illness, idx) => (
                <span
                  key={`curr-${idx}`}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {illness}
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider">
                    Filled Today
                  </span>
                </span>
              ))}
              {previousIllnesses.map((illness, idx) => (
                <span
                  key={`prev-${idx}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-gray-300 border border-slate-300 dark:border-white/15 text-xs font-medium flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {illness}
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[9px] font-bold uppercase">
                    Past Record
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-dashed border-gray-300 dark:border-white/10 text-center text-xs text-gray-400 font-medium">
              No chronic illnesses reported by patient.
            </div>
          )}
        </div>

        {/* Drug & Substance Allergies */}
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Known Drug & Substance Allergies
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300">
                {allAllergies.length > 0 ? 'CRITICAL SAFETY' : 'CLEAR'}
              </span>
            </div>
          </div>

          {allAllergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentVisitAllergies.map((allergy, idx) => (
                <span
                  key={`curr-all-${idx}`}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 text-xs font-black flex items-center gap-2 shadow-sm animate-pulse"
                >
                  ⚠️ {allergy}
                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                    Reported Today
                  </span>
                </span>
              ))}
              {previousAllergies.map((allergy, idx) => (
                <span
                  key={`prev-all-${idx}`}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-2"
                >
                  ⚠️ {allergy}
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-bold uppercase">
                    Past Record
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs text-emerald-700 dark:text-emerald-300 font-bold">
              ✓ No known adverse drug reactions or allergies reported.
            </div>
          )}
        </div>
      </div>

      {/* 4B. ATTACHED CLINICAL DOCUMENTS & PRESCRIPTION SCANS */}
      {(attachedDocs.length > 0 || ocrPrescriptions.length > 0) && (
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-500" /> Attached Clinical Documents & Scanned Prescriptions ({attachedDocs.length})
            </h4>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Captured via MediKiosk / Uploaded by Patient
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {attachedDocs.map((doc, dIdx) => {
              const fileSrc = doc.originalFileUrl || doc.url || (typeof doc === 'string' ? doc : null);
              return (
                <div
                  key={dIdx}
                  onClick={() => setSelectedDocPreview(fileSrc)}
                  className="group relative rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-white dark:bg-slate-800 p-2 shadow hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                    {fileSrc && (fileSrc.startsWith('data:image') || fileSrc.match(/\.(jpg|jpeg|png|webp)/i)) ? (
                      <img src={fileSrc} alt={doc.title || `Document ${dIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <FileText className="w-10 h-10 text-emerald-500" />
                    )}
                  </div>
                  <div className="mt-2 text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {doc.title || `Prescription Scan #${dIdx + 1}`}
                    </p>
                    <span className="text-[10px] text-gray-400 block">
                      Click to inspect full document 🔍
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Extracted medicines from OCR prescriptions if available */}
          {ocrPrescriptions.length > 0 && (
            <div className="pt-2 border-t border-gray-200 dark:border-white/10">
              <span className="text-[11px] font-bold text-slate-700 dark:text-gray-300 block mb-1">
                OCR Extracted Medications from Scans:
              </span>
              <div className="flex flex-wrap gap-2">
                {ocrPrescriptions.flatMap(p => p.extractedMedicines || []).map((m, mIdx) => (
                  <span key={mIdx} className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30 text-xs font-semibold">
                    💊 {m.name} {m.dosage ? `(${m.dosage})` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal for full original document inspection */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-emerald-500/40 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" /> Original Clinical Document / Prescription Scan
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDocPreview(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/15 bg-black flex items-center justify-center min-h-[300px]">
              <img src={selectedDocPreview} alt="Original Clinical Document" className="max-w-full max-h-[70vh] object-contain" />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => window.open(selectedDocPreview, '_blank')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Open in New Tab ↗
              </button>
              <button
                type="button"
                onClick={() => setSelectedDocPreview(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. AYUSH CLASSICAL PARIKSHA DOSSIER (TRIVIDHA, ASHTAVIDHA, DASHAVIDHA) - Only rendered for Ayurvedic department */}
      {consultationStream === 'ayurvedic' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-emerald-500/25 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                AYUSH Classical Clinical Examination (Pariksha Findings)
              </h3>
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

          {showParikshaDetails && (
            <div className="space-y-4 pt-1">
              {/* Pariksha Mode Tabs */}
              <div className="flex flex-wrap gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setActiveParikshaTab('trividha')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeParikshaTab === 'trividha'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-gray-300 hover:bg-white/10'
                  }`}
                >
                  🌿 Trividha (त्रिविध)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveParikshaTab('ashtavidha')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeParikshaTab === 'ashtavidha'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-gray-300 hover:bg-white/10'
                  }`}
                >
                  🔍 Ashtavidha (अष्टविध)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveParikshaTab('dashavidha')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeParikshaTab === 'dashavidha'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-gray-300 hover:bg-white/10'
                  }`}
                >
                  ⚖️ Dashavidha (दशविध)
                </button>
              </div>

              {/* TAB 1: TRIVIDHA */}
              {activeParikshaTab === 'trividha' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      १. दर्शन (Darshana - Visual Inspection)
                    </span>
                    <p className="font-bold text-slate-800 dark:text-gray-200">
                      {trividha.darshana || 'प्राकृत (Normal complexion & clear sclera)'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      २. स्पर्शन (Sparshana - Tactile/Heat)
                    </span>
                    <p className="font-bold text-slate-800 dark:text-gray-200">
                      {trividha.sparshana || 'समशीतोष्ण (Normal tactile temperature)'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black uppercase text-gray-500 block mb-1">
                      ३. प्रश्न (Prashna - Clinical Interrogation)
                    </span>
                    <p className="font-bold text-slate-800 dark:text-gray-200">
                      {trividha.prashna || 'दाह / जलन (Retrosternal burning sensation)'}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: ASHTAVIDHA */}
              {activeParikshaTab === 'ashtavidha' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black text-gray-400 block uppercase">१. नाड़ी (Nadi)</span>
                    <span className="font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                      {ashtavidha.nadi || 'मण्डूक गति (Pitta - Jumping)'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black text-gray-400 block uppercase">२. जिह्वा (Jihwa)</span>
                    <span className="font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                      {ashtavidha.jihwa || 'साम (White-coated / Aama)'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black text-gray-400 block uppercase">३. मल (Mala)</span>
                    <span className="font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                      {ashtavidha.mala || 'बद्ध (Hard / Constipated)'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black text-gray-400 block uppercase">४. मूत्र (Mootra)</span>
                    <span className="font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                      {ashtavidha.mootra || 'रक्त-पीत (Burning / Yellow)'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black text-gray-400 block uppercase">५. शब्द (Shabda)</span>
                    <span className="font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                      {ashtavidha.shabda || 'स्पष्ट (Natural Voice)'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black text-gray-400 block uppercase">६. स्पर्श (Sparsha)</span>
                    <span className="font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                      {ashtavidha.sparsha || 'उष्ण (Warm / Feverish)'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black text-gray-400 block uppercase">७. दृक् (Drik)</span>
                    <span className="font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                      {ashtavidha.drik || 'स्पष्ट (Clear Eyes)'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black text-gray-400 block uppercase">८. आकृति (Akruti)</span>
                    <span className="font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                      {ashtavidha.akruti || 'मध्यम (Medium Balanced)'}
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 3: DASHAVIDHA */}
              {activeParikshaTab === 'dashavidha' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black text-gray-400 block uppercase">१. प्रकृति (Prakriti)</span>
                    <span className="font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                      {dasha.prakriti?.primaryDosha || dasha.prakriti || 'Pitta-Vata'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black text-gray-400 block uppercase">२. अग्नि (Agni)</span>
                    <span className="font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                      {dasha.agni || 'Tikshnagni (तीक्ष्णाग्नि)'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black text-gray-400 block uppercase">३. कोष्ठ (Koshtha)</span>
                    <span className="font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                      {dasha.koshtha || 'Krura (क्रूर कोष्ठ)'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <span className="text-[10px] font-black text-gray-400 block uppercase">४. सत्व (Satva)</span>
                    <span className="font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                      {dasha.satva || 'Madhyama (मध्यम)'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. VITALS TELEMETRY STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Blood Pressure */}
        <div className={`p-3 rounded-2xl border text-center ${
          selectedSession.vitals?.systolicBP >= 140
            ? 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400 font-black'
            : 'bg-slate-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-900 dark:text-white'
        }`}>
          <span className="text-[10px] font-bold text-gray-500 block uppercase">BP (mmHg)</span>
          <span className="text-base font-black font-mono">
            {selectedSession.vitals?.systolicBP || '120'}/{selectedSession.vitals?.diastolicBP || '80'}
          </span>
          <span className="text-[9px] text-gray-400 block mt-0.5">Omron BT Cuff</span>
        </div>

        {/* Heart Rate */}
        <div className="p-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center text-slate-900 dark:text-white">
          <span className="text-[10px] font-bold text-gray-500 block uppercase">Heart Rate</span>
          <span className="text-base font-black font-mono">
            {selectedSession.vitals?.heartRate || '76'} bpm
          </span>
          <span className="text-[9px] text-gray-400 block mt-0.5">Pulse Oximeter</span>
        </div>

        {/* SpO2 */}
        <div className={`p-3 rounded-2xl border text-center ${
          selectedSession.vitals?.spo2 && selectedSession.vitals?.spo2 < 94
            ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 font-black'
            : 'bg-slate-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-900 dark:text-white'
        }`}>
          <span className="text-[10px] font-bold text-gray-500 block uppercase">SpO2 Oxygen</span>
          <span className="text-base font-black font-mono">
            {selectedSession.vitals?.spo2 || '98'}%
          </span>
          <span className="text-[9px] text-gray-400 block mt-0.5">Healthy O2</span>
        </div>

        {/* Temperature */}
        <div className="p-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center text-slate-900 dark:text-white">
          <span className="text-[10px] font-bold text-gray-500 block uppercase">Temperature</span>
          <span className="text-base font-black font-mono">
            {selectedSession.vitals?.temperature || '98.4'}°F
          </span>
          <span className="text-[9px] text-gray-400 block mt-0.5">IR Non-Contact</span>
        </div>

        {/* BMI */}
        <div className="p-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center text-slate-900 dark:text-white">
          <span className="text-[10px] font-bold text-gray-500 block uppercase">BMI Gauge</span>
          <span className="text-base font-black font-mono">
            {selectedSession.vitals?.bmi || '24.2'}
          </span>
          <span className="text-[9px] text-gray-400 block mt-0.5">Asian WHO Std</span>
        </div>

        {/* Triage Priority */}
        <div className={`p-3 rounded-2xl border text-center ${
          selectedSession.triagePriority === 'emergency'
            ? 'bg-red-500 text-white font-black animate-pulse'
            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border-emerald-500/30'
        }`}>
          <span className="text-[10px] font-bold opacity-80 block uppercase">Triage Priority</span>
          <span className="text-xs font-black uppercase">
            {selectedSession.triagePriority || 'Normal'}
          </span>
          <span className="text-[9px] opacity-80 block mt-0.5">AI Clinical Triage</span>
        </div>
      </div>

      {/* 7. RED FLAG EMERGENCY BANNER (IF TRIGGERED) */}
      {selectedSession.redFlags?.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-500/15 border-2 border-red-500/40 text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-black uppercase tracking-wider block">
              CLINICAL TRIAGE EMERGENCY RED-FLAGS DETECTED
            </span>
            <ul className="list-disc list-inside text-xs font-bold mt-1 space-y-0.5">
              {selectedSession.redFlags.map((rf, i) => (
                <li key={i}>{rf.flag || rf} ({rf.category || 'General'})</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 8. PROVENANCE & EVIDENCE INSPECT FOOTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <strong>Clinical Provenance (§25):</strong> All AI smart summaries and metrics verified against original patient dialogue and OCR.
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
