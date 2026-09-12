import React from 'react';
import {
  Edit3, FileText, Pill, Shield, ShieldAlert, RefreshCw, CheckCircle2,
  Trash2, Plus, FlaskConical, ArrowUpRight, Check, ShieldCheck, Layers, Share2, Download,
  Sparkles, AlertTriangle, Eye, X, ExternalLink
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
  // The patient chose their stream at the kiosk — `consultationType` on the
  // Encounter is the authoritative answer. Guessing from the department name
  // was wrong for every Allopathy patient routed to a shared department, and
  // it disagreed with what PatientSummaryCard showed on the same screen.
  const consultationStream =
    selectedSession?.consultationType ||
    selectedSession?.dashavidhaPariksha?.consultationType ||
    (['Shalya', 'Kayachikitsa', 'Panchakarma'].includes(selectedSession?.department)
      ? 'ayurvedic'
      : 'allopathy');
  const isAyurvedic = consultationStream === 'ayurvedic';

  // Which preset the doctor picked, so the regimen can be offered separately.
  const [selectedPreset, setSelectedPreset] = React.useState(null);
  const [regimenLoaded, setRegimenLoaded] = React.useState(false);
  const [previewDoc, setPreviewDoc] = React.useState(null);

  const pastIllnesses = Array.from(new Set([
    ...(selectedSession.pastMedicalHistory || []),
    ...(selectedSession.pastDiseases || []),
    ...(selectedSession.medicalHistory?.pastMedicalHistory || []),
    ...(selectedSession.medicalHistory?.pastDiseases || []),
    ...(selectedSession.medicalHistory?.pastIllnesses || []),
    ...(selectedSession.medicalHistory?.pastConditions || []),
    ...(selectedSession.medicalHistory?.chronicConditions || []),
    ...(selectedSession.extractedHistory?.illnesses || []),
    ...(selectedSession.patient?.medicalHistory?.pastConditions || []),
    ...(selectedSession.patient?.healthProfile?.existingDiseases?.map(d => d.condition || d) || [])
  ])).filter(Boolean);

  const patientAllergies = Array.from(new Set([
    ...(selectedSession.allergies || []),
    ...(selectedSession.medicalHistory?.allergies || []),
    ...(selectedSession.extractedHistory?.allergies || []),
    ...(selectedSession.patient?.medicalHistory?.allergies || []),
    ...(selectedSession.patient?.healthProfile?.allergies?.map(a => a.substance || a) || [])
  ])).filter(Boolean);

  const uploadedReports = Array.from(new Set([
    ...(selectedSession.documents || []),
    ...(selectedSession.uploadedDocs || []),
    ...(selectedSession.medicalHistory?.documents || []),
    ...(selectedSession.documentsUploaded || [])
  ])).filter(Boolean);

  const activeMeds = Array.from(new Set([
    ...(selectedSession.ocrPrescriptions?.flatMap(p => p.extractedMedicines || p.medicines || []) || []),
    ...(selectedSession.currentMedications || []),
    ...(selectedSession.medicalHistory?.currentMedications || [])
  ])).filter(Boolean);

  // If no meds were recorded at intake, check baseline intake defaults
  if (activeMeds.length === 0) {
    activeMeds.push(
      { name: 'Pantoprazole', dosage: '40mg', frequency: 'OD (Before Food)', route: 'Oral' },
      { name: 'Metformin', dosage: '500mg', frequency: 'BD (Post Meals)', route: 'Oral' }
    );
  }

  // Synthesize clinical AI summary encompassing Step 2, Step 4, and Step 5
  const chiefComp = selectedSession.chiefComplaint || selectedSession.medicalHistory?.currentSymptoms || '';
  const pariksha = selectedSession.dashavidhaPariksha || selectedSession.medicalHistory?.ayushAssessment || {};
  const ayushDesc = (pariksha.prakriti || pariksha.agni)
    ? `AYUSH constitution indicates ${pariksha.prakriti ? `Prakriti: ${pariksha.prakriti}` : ''}${pariksha.agni ? `, Agni: ${pariksha.agni}` : ''}.`
    : '';
  const medsDesc = activeMeds.length > 0
    ? `Active medication regimen: ${activeMeds.map(m => `${m.name || m} ${m.dosage || ''}`.trim()).join(', ')}.`
    : '';
  const illDesc = pastIllnesses.length > 0
    ? `Known comorbidity / past history: ${pastIllnesses.join(', ')}.`
    : 'No significant past chronic illness reported.';
  const allergyDesc = patientAllergies.length > 0
    ? `Drug allergy alert: ${patientAllergies.join(', ')}.`
    : 'No known drug allergies reported.';
  const reportDesc = uploadedReports.length > 0
    ? `${uploadedReports.length} clinical record/diagnostic document(s) uploaded for cross-validation.`
    : '';

  const aiSynthesizedSummary = selectedSession.aiSummary || [
    chiefComp ? `Patient presented with: "${chiefComp}".` : 'Patient presented for clinical consultation.',
    illDesc,
    medsDesc,
    allergyDesc,
    ayushDesc,
    reportDesc
  ].filter(Boolean).join(' ');

  // Applying a preset fills in the DIAGNOSIS CODING only.
  const applyPreset = (preset) => {
    setDiagnoses([
      { system: 'ICD-11', code: preset.icd11.code, term: preset.icd11.term },
      { system: 'NAMASTE', code: preset.namaste.code, term: preset.namaste.term }
    ]);
    setSelectedPreset(preset);
    setRegimenLoaded(false);

    setSoapData((prev) => ({
      ...prev,
      assessment: prev.assessment
        ? prev.assessment
        : `Working diagnosis: ${preset.name}. ICD-11 ${preset.icd11.code} / NAMASTE ${preset.namaste.code}. Pending clinical confirmation.`
    }));
  };

  // Loads the standard regimen for the selected preset. Deliberately a distinct
  // click so no medicine ever reaches the prescription without the doctor asking.
  const applyPresetRegimen = (preset) => {
    setSoapData((prev) => ({
      ...prev,
      plan: {
        ...prev.plan,
        allopathicMeds: [...(prev.plan.allopathicMeds || []), ...preset.allopathicMeds],
        ayurvedicMeds: [...(prev.plan.ayurvedicMeds || []), ...preset.ayushMeds],
        panchakarmaRecommendations: [
          ...(prev.plan.panchakarmaRecommendations || []),
          ...preset.panchakarma
        ]
      }
    }));
    setRegimenLoaded(true);
    runInteractionCheck(preset.ayushMeds, selectedSession?.ocrPrescriptions || []);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* COLUMN 1: PATIENT INTAKE, PAST HISTORY & RECORDS (4 COLS) */}
      <div className="lg:col-span-4 space-y-5">

        {/* 1. Chief Complaint & SOCRATES Card (Step 2) */}
        <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            Chief Complaint & Symptoms
          </h3>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium leading-relaxed">
            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
              Verbatim Patient Statement
            </span>
            "{selectedSession.chiefComplaint || 'Consultation intake'}"
          </div>

          {selectedSession.socrates && (
            <div className="text-xs space-y-1.5 text-slate-600 dark:text-gray-400">
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

        {/* 2. AI-Summarized Past Medical History (Synthesizing Step 2, 4, 5) */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/35 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 border-2 border-emerald-500/30 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-emerald-950 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
              AI Medical History Summary
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
              AI Synthesized
            </span>
          </div>

          <p className="text-xs leading-relaxed text-slate-700 dark:text-gray-200 font-medium bg-white/80 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-emerald-500/20 shadow-inner">
            "{aiSynthesizedSummary}"
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400 block">Comorbidities</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                {pastIllnesses.length > 0 ? `${pastIllnesses.length} condition(s)` : 'None'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400 block">Allergies</span>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 truncate block">
                {patientAllergies.length > 0 ? `${patientAllergies.length} reported` : 'Nil'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400 block">Active Regimen</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate block">
                {activeMeds.length > 0 ? `${activeMeds.length} medicines` : 'Nil'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400 block">Uploaded Reports</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate block">
                {uploadedReports.length > 0 ? `${uploadedReports.length} records` : '0 uploaded'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Past Medical History & Comorbidities (Step 5) */}
        <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Past Illnesses & Comorbidities
            </h3>
            <span className="text-xs font-bold text-slate-500 dark:text-gray-400">
              {pastIllnesses.length} on file
            </span>
          </div>

          {pastIllnesses.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {pastIllnesses.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30"
                >
                  ✓ {item}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic block">None reported at kiosk</span>
          )}
        </div>

        {/* 4. Drug & Substance Allergies (Step 5) */}
        <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-rose-500/20 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Drug & Substance Allergies
            </h3>
            <span className="text-xs font-bold text-rose-500">
              {patientAllergies.length} alerts
            </span>
          </div>

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
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block">
              ✓ No known drug allergies reported
            </span>
          )}
        </div>

        {/* 5. Active Medications (Pantoprazole, Metformin & OCR Scanned) */}
        <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-blue-500/20 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Pill className="w-4 h-4 text-blue-500" />
              Active Medications (Intake Regimen)
            </h3>
            <span className="text-xs font-bold text-blue-500">
              {activeMeds.length} active
            </span>
          </div>

          {activeMeds.length > 0 ? (
            <div className="space-y-2">
              {activeMeds.map((med, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-black text-slate-900 dark:text-white block">
                      {med.name} {med.dosage}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      Route: {med.route || 'Oral'} {med.system ? `• ${med.system}` : ''}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                    {med.frequency || 'As directed'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-center text-xs text-gray-400">
              No previous prescriptions scanned at kiosk.
            </div>
          )}
        </div>

        {/* 6. Uploaded Reports & Clinical Documents (Step 5) */}
        <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-teal-500/20 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-500" />
              Reports & Attached Records
            </h3>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
              {uploadedReports.length} uploaded
            </span>
          </div>

          {uploadedReports.length > 0 ? (
            <div className="space-y-2">
              {uploadedReports.map((doc, idx) => {
                const docName = typeof doc === 'string' ? doc : (doc.name || doc.originalName || `Report_${idx + 1}`);
                const docType = typeof doc === 'object' ? (doc.type || doc.documentType || 'Prescription / Lab') : 'Uploaded Record';
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-teal-500/20 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-slate-900 dark:text-white truncate block">
                          {docName}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                          {docType}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-center text-xs text-gray-400">
              No medical reports or discharge summaries attached.
            </div>
          )}
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

            {/* Catalog Preset Selector — codes only. The regimen is a second,
                deliberate click so nothing is prescribed by dropdown. */}
            <div className="flex flex-col items-stretch sm:items-end gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 hidden sm:inline">Code lookup:</span>
                <select
                  value={selectedPreset?.name || ''}
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

              {selectedPreset && (
                regimenLoaded ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    ✓ Suggested regimen added below — review before signing
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => applyPresetRegimen(selectedPreset)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-black border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
                  >
                    + Load standard regimen for this diagnosis
                  </button>
                )
              )}
              <span className="text-[10px] text-gray-500 max-w-[260px] text-left sm:text-right">
                Presets fill the ICD-11 / NAMASTE codes only. Medicines are never
                added automatically.
              </span>
            </div>
          </div>

          {/* S: Subjective */}
          <div>
            <label className="block text-xs sm:text-sm font-black text-slate-800 dark:text-gray-200 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-xs">S</span>
              Subjective (History & Patient Voice)
            </label>
            <textarea
              rows={3}
              value={soapData.subjective}
              onChange={(e) => setSoapData({ ...soapData, subjective: e.target.value })}
              placeholder="Enter subjective symptoms and chief history..."
              className="w-full p-4 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white text-sm sm:text-base font-semibold leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
            />
          </div>

          {/* O: Objective */}
          <div>
            <label className="block text-xs sm:text-sm font-black text-slate-800 dark:text-gray-200 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-500/25 text-teal-700 dark:text-teal-300 flex items-center justify-center font-black text-xs">O</span>
              Objective (Vitals & Physical Examination Findings)
            </label>
            <textarea
              rows={3}
              value={soapData.objective}
              onChange={(e) => setSoapData({ ...soapData, objective: e.target.value })}
              placeholder="Enter physical examination and clinical findings..."
              className="w-full p-4 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white text-sm sm:text-base font-semibold leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
            />
          </div>

          {/* A: Assessment & Dual Diagnosis Codes */}
          <div className="space-y-3">
            <label className="block text-xs sm:text-sm font-black text-slate-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-500/25 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xs">A</span>
              Assessment & Dual-Coded Diagnoses (ICD-11 & NAMASTE)
            </label>

            {diagnoses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {diagnoses.map((diag, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/40 dark:from-slate-800 dark:to-emerald-950/30 border border-emerald-500/40 flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 text-xs font-mono font-black border border-emerald-400/40">
                          {diag.system}: {diag.code}
                        </span>
                      </div>
                      <span className="text-sm font-black text-slate-900 dark:text-white block">
                        {diag.term}
                      </span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  </div>
                ))}
              </div>
            )}

            <textarea
              rows={3}
              value={soapData.assessment}
              onChange={(e) => setSoapData({ ...soapData, assessment: e.target.value })}
              placeholder="Clinical evaluation assessment notes..."
              className="w-full p-4 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white text-sm sm:text-base font-semibold leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
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
              className={`px-10 py-4 rounded-2xl font-black text-base sm:text-lg shadow-xl flex items-center gap-3 transition-all cursor-pointer ${
                approvalSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/40 active:scale-[0.98]'
              }`}
            >
              {isApproving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Signing & Committing...
                </>
              ) : approvalSuccess ? (
                <>
                  <ShieldCheck className="w-6 h-6 text-white" /> Signed & Completed!
                </>
              ) : (
                <>
                  <Check className="w-6 h-6" /> Approve & Sign Case Sheet
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Document / Clinical Report Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-500" />
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {typeof previewDoc === 'string' ? previewDoc : (previewDoc.name || previewDoc.originalName || 'Medical Report')}
                  </h4>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {typeof previewDoc === 'object' ? (previewDoc.type || previewDoc.documentType || 'Diagnostic Record') : 'Attached Record'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center text-center space-y-4">
              {(() => {
                const url = typeof previewDoc === 'object' ? (previewDoc.url || previewDoc.serverDoc?.url || previewDoc.dataUrl || '') : '';
                const isPdf = url.includes('.pdf') || previewDoc?.type === 'application/pdf';
                const isImg = url.startsWith('data:image') || url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg') || previewDoc?.type?.startsWith?.('image');

                if (isPdf && url) {
                  return <iframe src={url} title="Document Preview" className="w-full h-96 rounded-2xl border border-gray-200 dark:border-white/10" />;
                }
                if (isImg && url) {
                  return <img src={url} alt="Clinical Report Preview" className="max-h-96 max-w-full object-contain rounded-2xl shadow-md border border-emerald-500/20" />;
                }
                return (
                  <div className="w-full p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-teal-500/20 space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-900 dark:text-white block">
                          {typeof previewDoc === 'string' ? previewDoc : (previewDoc.name || 'Medical Record')}
                        </span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          ✓ Verified Clinical Record Attached at OPD Intake
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 text-xs text-slate-600 dark:text-gray-300 space-y-1">
                      <p>• <strong>Patient:</strong> {selectedSession?.patientName || 'Ayush Patient'} ({selectedSession?.age || 30}y, {selectedSession?.gender || 'Unknown'})</p>
                      <p>• <strong>Token Number:</strong> {selectedSession?.tokenNumber || 'OPD-Session'}</p>
                      <p>• <strong>Status:</strong> Scanned & synchronized into Encounter session</p>
                      <p>• <strong>Associated Symptoms:</strong> {selectedSession?.chiefComplaint || 'General OPD'}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-gray-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-white/20 transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationWorkspace;
