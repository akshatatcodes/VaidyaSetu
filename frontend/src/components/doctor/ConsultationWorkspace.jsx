import React from 'react';
import {
  Edit3, FileText, Pill, Shield, ShieldAlert, RefreshCw, CheckCircle2,
  Trash2, Plus, FlaskConical, ArrowUpRight, Check, ShieldCheck, Layers, Share2, Download
} from 'lucide-react';
import FollowUpDecisionSelector from './FollowUpDecisionSelector';

// ICD-11 & NAMASTE Catalog Presets for Quick Selection
const DIAGNOSIS_PRESETS = [
  {
    name: 'Osteoarthritis of Knee / Sandhivata',
    icd11: { code: 'FA00', term: 'Osteoarthritis of knee' },
    namaste: { code: 'AYU-KA-042', term: 'Sandhivata (Janu Sandhigata Vata)' },
    ayushMeds: [
      { name: 'Ashwagandha Churna', dosage: '3g at bedtime', frequency: 'HS', duration: '30 days', anupana: 'Warm Milk' },
      { name: 'Yogaraj Guggulu', dosage: '2 tablets BD', frequency: 'BD', duration: '21 days', anupana: 'Warm Water' }
    ],
    allopathicMeds: [
      { name: 'Paracetamol', dosage: '500mg', frequency: 'SOS (Pain)', duration: '5 days', instructions: 'After food' }
    ],
    panchakarma: ['Janu Basti with Mahanarayana Taila', 'Patra Pinda Swedana']
  },
  {
    name: 'Gastro-Oesophageal Reflux / Amlapitta',
    icd11: { code: 'DA42', term: 'Gastro-oesophageal reflux disease' },
    namaste: { code: 'AYU-KA-012', term: 'Amlapitta (Urdhwaga Pitta Prakopa)' },
    ayushMeds: [
      { name: 'Avipattikar Churna', dosage: '3g BD before meals', frequency: 'BD', duration: '14 days', anupana: 'Warm Water / Coconut Water' },
      { name: 'Kamadudha Rasa', dosage: '1 tablet BD', frequency: 'BD', duration: '21 days', anupana: 'Milk' }
    ],
    allopathicMeds: [
      { name: 'Pantoprazole', dosage: '40mg', frequency: 'OD (Morning empty stomach)', duration: '7 days', instructions: '30 mins before breakfast' }
    ],
    panchakarma: ['Mridu Virechana', 'Takra Dhara']
  },
  {
    name: 'Type 2 Diabetes Mellitus / Madhumeha',
    icd11: { code: '5A11', term: 'Type 2 diabetes mellitus' },
    namaste: { code: 'AYU-KA-028', term: 'Madhumeha (Kaphaja Prameha)' },
    ayushMeds: [
      { name: 'Nisha Amalaki Churna', dosage: '3g BD before meals', frequency: 'BD', duration: '60 days', anupana: 'Warm Water' },
      { name: 'Chandraprabha Vati', dosage: '2 tablets BD', frequency: 'BD', duration: '30 days', anupana: 'Water' }
    ],
    allopathicMeds: [
      { name: 'Metformin', dosage: '500mg', frequency: 'BD with meals', duration: '30 days', instructions: 'With food' }
    ],
    panchakarma: ['Udwarthana', 'Vasti therapy']
  }
];

const ConsultationWorkspace = ({
  selectedSession,
  soapData,
  setSoapData,
  diagnoses,
  setDiagnoses,
  newAyuMed,
  setNewAyuMed,
  addAyurvedicMedicine,
  removeAyurvedicMedicine,
  newAlloMed,
  setNewAlloMed,
  addAllopathicMedicine,
  removeAllopathicMedicine,
  interactionAlerts,
  checkingInteractions,
  runInteractionCheck,
  investigations,
  handleRemoveInvestigation,
  setIsOrderModalOpen,
  referralData,
  setIsReferralModalOpen,
  followUpDecision,
  setFollowUpDecision,
  doctorNotes,
  setDoctorNotes,
  isApproving,
  approvalSuccess,
  handleApproveCaseSheet,
  handleOpenFhirModal,
  handleSyncToAbdm,
  abdmSyncStatus,
  handleDownloadFhir
}) => {
  const consultationStream = selectedSession?.dashavidhaPariksha?.consultationType ||
    (selectedSession?.department === 'Shalya' || selectedSession?.department === 'Kayachikitsa' || selectedSession?.department === 'Panchakarma' ? 'ayurvedic' : 'allopathy');
  const isAyurvedic = consultationStream === 'ayurvedic';

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

  const applyPreset = (preset) => {
    const newDiagnoses = [
      { system: 'ICD-11', code: preset.icd11.code, term: preset.icd11.term },
      { system: 'NAMASTE', code: preset.namaste.code, term: preset.namaste.term }
    ];
    setDiagnoses(newDiagnoses);

    const updatedPlan = {
      ...soapData.plan,
      allopathicMeds: preset.allopathicMeds,
      ayurvedicMeds: preset.ayushMeds,
      panchakarmaRecommendations: preset.panchakarma
    };

    setSoapData((prev) => ({
      ...prev,
      assessment: `Clinical evaluation confirms ${preset.name}. Coded under ICD-11 (${preset.icd11.code}) and AYUSH NAMASTE (${preset.namaste.code}).`,
      plan: updatedPlan
    }));

    runInteractionCheck(preset.ayushMeds, selectedSession?.ocrPrescriptions || []);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* COLUMN 1: PATIENT INTAKE & PREVIOUS MEDICATIONS (4 COLS) */}
      <div className="lg:col-span-4 space-y-6">
        {/* Chief Complaint & SOCRATES Card */}
        <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            Chief Complaint & Voice Record
          </h3>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium leading-relaxed">
            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
              Verbatim Patient Statement
            </span>
            "{selectedSession.chiefComplaint || 'Consultation intake'}"
          </div>

          {selectedSession.socrates && (
            <div className="text-xs space-y-2 text-slate-600 dark:text-gray-400">
              {selectedSession.socrates.character && (
                <div>
                  <span className="font-bold text-slate-800 dark:text-gray-200">Character: </span>
                  {selectedSession.socrates.character}
                </div>
              )}
              {selectedSession.socrates.severity && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-gray-200">VAS Severity: </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-bold font-mono">
                    {selectedSession.socrates.severity}/10
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active Medications (OCR Scanned) */}
        <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Pill className="w-4 h-4 text-blue-500" />
            Active Medications (OCR Scanned)
          </h3>

          {selectedSession.ocrPrescriptions?.length > 0 ? (
            <div className="space-y-2">
              {selectedSession.ocrPrescriptions.flatMap((p) => p.extractedMedicines || []).map((med, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between text-xs"
                >
                  <span className="font-black text-slate-900 dark:text-white">
                    {med.name} {med.dosage}
                  </span>
                  <span className="text-[10px] text-gray-500">{med.frequency}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-center text-xs text-gray-400">
              No previous prescriptions scanned at kiosk.
            </div>
          )}
        </div>

        {/* Past Medical History & Allergies Card */}
        <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            Medical History & Allergies
          </h3>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                Comorbidities & Past Illnesses
              </span>
              {pastIllnesses.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {pastIllnesses.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic">None reported at kiosk</span>
              )}
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-white/10">
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                Drug & Substance Allergies
              </span>
              {patientAllergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {patientAllergies.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-black border border-rose-500/40"
                    >
                      ⚠️ {item}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  No known drug allergies reported
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COLUMN 2: 10-SECOND EDITABLE SOAP CASE SHEET (8 COLS) */}
      <div className="lg:col-span-8 space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200 dark:border-white/10">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-500" />
                SOAP Case Sheet & Prescriptions
              </h3>
              <p className="text-xs text-gray-500">
                Synthesized with dual ICD-11 & AYUSH NAMASTE clinical morbidity coding.
              </p>
            </div>

            {/* Catalog Preset Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 hidden sm:inline">1-Click Preset:</span>
              <select
                onChange={(e) => {
                  const found = DIAGNOSIS_PRESETS.find((p) => p.name === e.target.value);
                  if (found) applyPreset(found);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="">Choose Clinical Preset...</option>
                {DIAGNOSIS_PRESETS.map((p, i) => (
                  <option key={i} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* S: Subjective */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-xs">S</span>
              Subjective (History & Patient Voice)
            </label>
            <textarea
              rows={2}
              value={soapData.subjective}
              onChange={(e) => setSoapData({ ...soapData, subjective: e.target.value })}
              placeholder="Enter subjective symptoms and chief history..."
              className="w-full p-3 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* O: Objective */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-600 flex items-center justify-center font-bold text-xs">O</span>
              Objective (Vitals & Physical Examination Findings)
            </label>
            <textarea
              rows={2}
              value={soapData.objective}
              onChange={(e) => setSoapData({ ...soapData, objective: e.target.value })}
              placeholder="Enter physical examination and clinical findings..."
              className="w-full p-3 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* A: Assessment & Dual Diagnosis Codes */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-xs">A</span>
              Assessment & Dual-Coded Diagnoses (ICD-11 & NAMASTE)
            </label>

            {diagnoses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {diagnoses.map((diag, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/30 dark:from-slate-800 dark:to-emerald-950/20 border border-emerald-500/30 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-black">
                          {diag.system}: {diag.code}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block mt-1">
                        {diag.term}
                      </span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  </div>
                ))}
              </div>
            )}

            <textarea
              rows={2}
              value={soapData.assessment}
              onChange={(e) => setSoapData({ ...soapData, assessment: e.target.value })}
              placeholder="Clinical evaluation assessment notes..."
              className="w-full p-3 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* P: Plan (Prescription Builder) */}
          <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-white/10">
            <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-600 flex items-center justify-center font-bold text-xs">P</span>
              Plan: {isAyurvedic ? 'Ayurvedic & Integrated Rx Regimen' : 'Allopathic Prescription & Treatment Plan'}
            </label>

            {/* Ayurvedic Medications Table — Rendered for Ayurvedic OPD */}
            {isAyurvedic && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase">
                  <span>🌿 Ayurvedic Shamana Formulations</span>
                  <span>{soapData.plan?.ayurvedicMeds?.length || 0} Prescribed</span>
                </div>

                {soapData.plan?.ayurvedicMeds?.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-black text-slate-900 dark:text-white">
                        {med.name} • {med.dosage}
                      </span>
                      <span className="text-gray-500 block text-[11px]">
                        {med.frequency} • Anupana: {med.anupana || 'Water'} • Duration: {med.duration}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAyurvedicMedicine(idx)}
                      className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Formulation (e.g. Ashwagandha)"
                    value={newAyuMed.name}
                    onChange={(e) => setNewAyuMed({ ...newAyuMed, name: e.target.value })}
                    className="sm:col-span-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Dose (e.g. 3g BD)"
                    value={newAyuMed.dosage}
                    onChange={(e) => setNewAyuMed({ ...newAyuMed, dosage: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Anupana (e.g. Milk)"
                    value={newAyuMed.anupana}
                    onChange={(e) => setNewAyuMed({ ...newAyuMed, anupana: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addAyurvedicMedicine}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Herb
                  </button>
                </div>
              </div>
            )}

            {/* Allopathic Medications Table */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-black text-blue-700 dark:text-blue-400 uppercase">
                <span>💊 Allopathic Medications & Prescriptions</span>
                <span>{soapData.plan?.allopathicMeds?.length || 0} Prescribed</span>
              </div>

              {soapData.plan?.allopathicMeds?.map((med, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/30 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-black text-slate-900 dark:text-white">
                      {med.name} • {med.dosage}
                    </span>
                    <span className="text-gray-500 block text-[11px]">
                      {med.frequency} • {med.instructions || med.duration}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAllopathicMedicine(idx)}
                    className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Medicine (e.g. Paracetamol)"
                  value={newAlloMed.name}
                  onChange={(e) => setNewAlloMed({ ...newAlloMed, name: e.target.value })}
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g. 500mg SOS)"
                  value={newAlloMed.dosage}
                  onChange={(e) => setNewAlloMed({ ...newAlloMed, dosage: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addAllopathicMedicine}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Drug
                </button>
              </div>
            </div>
          </div>

          {/* INVESTIGATION ORDERS (§27) */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-teal-400" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Investigation Orders (§27)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Order Lab Test
              </button>
            </div>

            {investigations.length > 0 ? (
              <div className="space-y-2">
                {investigations.map((inv, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase ${
                          inv.priority === 'stat'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : inv.priority === 'urgent'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        {inv.priority}
                      </span>
                      <div>
                        <span className="font-black text-slate-900 dark:text-white block">
                          {inv.testName}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          Section: {inv.section || 'Pathology'} {inv.notes ? `• ${inv.notes}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 text-[10px] font-bold uppercase">
                        {inv.status || 'ordered'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInvestigation(idx)}
                        className="text-gray-400 hover:text-rose-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-white/40 dark:bg-white/5 text-center text-xs text-gray-400">
                No lab investigations ordered yet. Click "+ Order Lab Test" above.
              </div>
            )}
          </div>

          {/* CLINICAL REFERRALS (§38) */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Clinical Department Referrals (§38)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsReferralModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Referral
              </button>
            </div>

            {referralData?.targetDepartment ? (
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500 text-slate-950 text-[10px] font-black uppercase">
                      REFERRAL: {referralData.targetDepartment}
                    </span>
                    {referralData.doctorName && (
                      <span className="text-slate-900 dark:text-white font-bold">{referralData.doctorName}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{referralData.reason}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase">
                  {referralData.priority || 'routine'}
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-white/40 dark:bg-white/5 text-center text-xs text-gray-400">
                No inter-departmental referral created for this visit.
              </div>
            )}
          </div>

          {/* FOLLOW-UP DECISION SELECTOR (§37) */}
          <FollowUpDecisionSelector
            followUpDecision={followUpDecision}
            setFollowUpDecision={setFollowUpDecision}
          />

          {/* DOCTOR NOTES */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Doctor Consultation Notes & Advice
            </label>
            <textarea
              rows={3}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Enter final dietary advice (Pathya/Apathya), follow-up notes, or clinical remarks..."
              className="w-full p-3 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* ACTION BUTTONS: ABDM Sync, FHIR Modal, Sign Case Sheet */}
          <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenFhirModal}
                className="px-4 py-2.5 rounded-2xl border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2 hover:bg-emerald-500/10 cursor-pointer shadow-sm transition-all"
              >
                <Layers className="w-4 h-4 text-emerald-500" /> ABDM FHIR R4
              </button>

              <button
                type="button"
                onClick={handleSyncToAbdm}
                disabled={abdmSyncStatus.syncing}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all ${
                  abdmSyncStatus.synced || selectedSession?.abdmSync?.synced
                    ? 'bg-emerald-500/15 border border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'border border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10'
                }`}
              >
                {abdmSyncStatus.syncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-500" /> Syncing ABDM...
                  </>
                ) : abdmSyncStatus.synced || selectedSession?.abdmSync?.synced ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> ABDM Synced
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-blue-500" /> Sync ABHA Locker
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadFhir}
                className="p-2.5 rounded-2xl border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer shadow-sm"
                title="Download FHIR Bundle JSON file"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={isApproving || approvalSuccess}
              onClick={handleApproveCaseSheet}
              className={`px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2.5 transition-all cursor-pointer ${
                approvalSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 active:scale-[0.98]'
              }`}
            >
              {isApproving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Signing & Committing...
                </>
              ) : approvalSuccess ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-white" /> Signed & Completed!
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" /> Approve & Sign Case Sheet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationWorkspace;
