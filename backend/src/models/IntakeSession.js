const mongoose = require('mongoose');

const DiagnosisSchema = new mongoose.Schema({
  system: {
    type: String,
    enum: ['ICD-11', 'NAMASTE', 'SNOMED-CT', 'AYUSH'],
    default: 'ICD-11'
  },
  code: { type: String, required: true },
  term: { type: String, required: true },
  category: { type: String } // e.g., 'Ayurvedic Syndromic' or 'Allopathic Etiologic'
}, { _id: false });

const MedicationItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  system: { type: String, enum: ['Allopathic', 'Ayurvedic', 'Homeopathic', 'Siddha', 'Unani'], default: 'Allopathic' },
  dosage: { type: String }, // e.g., '500mg' or '2 Vati'
  frequency: { type: String }, // e.g., 'BD (Twice Daily)', 'TDS'
  duration: { type: String }, // e.g., '7 days'
  instructions: { type: String }, // e.g., 'After meals with warm water (Ushnodaka)'
  anupana: { type: String } // Ayurvedic vehicle: Honey, Warm Milk, Ghee, Water
}, { _id: false });

const RedFlagSchema = new mongoose.Schema({
  flag: { type: String, required: true },
  category: { type: String, enum: ['Cardiovascular', 'Respiratory', 'Neurological', 'Metabolic', 'Vitals', 'Surgical'], default: 'Vitals' },
  severity: { type: String, enum: ['moderate', 'high', 'critical'], default: 'high' },
  detectedAt: { type: Date, default: Date.now }
}, { _id: false });

const IntakeSessionSchema = new mongoose.Schema({
  tokenNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  abhaId: {
    type: String,
    trim: true,
    index: true
  },
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 0,
    max: 125
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  languagePreference: {
    type: String,
    enum: ['en', 'hi', 'mr'],
    default: 'hi'
  },
  department: {
    type: String,
    enum: ['Kayachikitsa', 'Panchakarma', 'Shalya', 'Shalakya', 'Prasuti & Stri Roga', 'Prasuti', 'Kaumarbhritya', 'Swasthavritta', 'General Medicine', ''],
    default: ''
  },
  queueStatus: {
    type: String,
    enum: ['waiting_intake', 'intake_completed', 'in_consultation', 'completed', 'flagged_emergency'],
    default: 'waiting_intake',
    index: true
  },
  triagePriority: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal',
    index: true
  },

  // Biometric Vitals captured at Kiosk
  vitals: {
    systolicBP: { type: Number },
    diastolicBP: { type: Number },
    heartRate: { type: Number },
    spo2: { type: Number },
    temperature: { type: Number },
    respiratoryRate: { type: Number },
    heightCm: { type: Number },
    weightKg: { type: Number },
    bmi: { type: Number },
    bmiCategory: { type: String },
    capturedAt: { type: Date, default: Date.now }
  },

  // Chief Complaint & SOCRATES Adaptive Voice Probing
  chiefComplaint: {
    type: String,
    trim: true
  },
  socrates: {
    site: { type: String }, // Anatomical region
    onset: { type: String }, // Sudden vs gradual, duration
    character: { type: String }, // Sharp, dull, burning, cramping, throbbing
    radiation: { type: String }, // Radiation pathway
    associations: [{ type: String }], // Nausea, sweating, numbness, dizziness
    timeCourse: { type: String }, // Worsens morning, nocturnal, continuous
    exacerbatingRelieving: { type: String }, // Relieved by rest, food, aggravated by cold
    severity: { type: Number, min: 1, max: 10, default: 5 } // 1-10 visual analogue score
  },

  // Full SOCRATES Conversation transcript for Doctor review
  intakeTranscript: [{
    speaker: { type: String, enum: ['kiosk', 'patient'] },
    text: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],

  // AYUSH Dashavidha Pariksha (10-fold clinical constitutional assessment)
  dashavidhaPariksha: {
    prakriti: {
      primaryDosha: { type: String, enum: ['Vata', 'Pitta', 'Kapha', 'Sama', '', null], default: 'Vata' },
      secondaryDosha: { type: String, enum: ['Vata', 'Pitta', 'Kapha', 'None', '', null], default: 'Pitta' },
      vataScore: { type: Number, default: 0 },
      pittaScore: { type: Number, default: 0 },
      kaphaScore: { type: Number, default: 0 },
      summary: { type: String }
    },
    vikriti: { type: String, default: '' }, // Present doshic disturbance: Vata Vriddhi, Pitta Prakopa, etc.
    sara: { type: String, default: 'Madhyama (Medium)' }, // Tissue essence
    samhanana: { type: String, default: 'Madhyama (Moderate)' }, // Compactness of body
    pramana: { type: String, default: 'Prakrita (Proportionate)' },
    satmya: { type: String, default: 'Sarva-rasa (All tastes adaptable)' },
    satva: { type: String, default: 'Madhyama (Moderate)' },
    aharaShakti: {
      abhyavaharana: { type: String, default: 'Madhyama (Moderate)' },
      jaranaShakti: { type: String, default: 'Samagni (Balanced)' }
    },
    vyayamaShakti: { type: String, default: 'Madhyama (Moderate)' },
    vaya: { type: String, default: 'Madhyama (Adult)' },
    koshtha: { type: String, default: 'Madhyama' }
  },

  // Red Flags
  redFlags: [RedFlagSchema],

  // OCR Prescriptions Scanned at Kiosk
  ocrPrescriptions: [{
    imageUrl: { type: String },
    scannedAt: { type: Date, default: Date.now },
    extractedMedicines: [MedicationItemSchema],
    detectedInteractions: [{
      drugA: { type: String },
      drugB: { type: String },
      severity: { type: String },
      description: { type: String }
    }]
  }],

  // Comorbidities, Past Disease & Known Allergies
  pastMedicalHistory: [{ type: String }],
  allergies: [{ type: String }],

  // DPDP Act 2023 Statutory Consent & ABDM Consent Layer
  dpdpConsent: {
    granted: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now },
    audioListened: { type: Boolean, default: false },
    consentVersion: { type: String, default: 'DPDP-2023-ABDM-v1.0' }
  },

  // Ahara-Vihara (Diet, Hydration, Sleep & Daily Lifestyle)
  aharaVihara: {
    dietType: { type: String, default: 'Vegetarian' },
    waterIntake: { type: String, default: 'Normal' },
    sleepPattern: { type: String, default: 'Sound (7-8 hours)' },
    habitsAddictions: [{ type: String }]
  },

  // Standard 8-Part Clinical History Summary (PS 26047 Module C Specification)
  clinicalSummary: {
    chiefComplaint: { type: String },
    historyOfPresentIllness: { type: String },
    pastMedicalSurgical: { type: String },
    drugAndAllergyHistory: { type: String },
    familyHistory: { type: String },
    personalAndAharaVihara: { type: String },
    reviewOfSystems: {
      cardiovascular: { type: String },
      respiratory: { type: String },
      gastrointestinal: { type: String },
      musculoskeletal: { type: String },
      neurologicalENT: { type: String }
    },
    priorInvestigationsSummary: { type: String },
    generatedAt: { type: Date }
  },

  // 10-Second Doctor SOAP Case Sheet
  soapNote: {
    subjective: { type: String },
    objective: { type: String },
    assessment: { type: String },
    plan: {
      allopathicMeds: [MedicationItemSchema],
      ayurvedicMeds: [MedicationItemSchema],
      panchakarmaRecommendations: [{ type: String }],
      pathyaApathya: {
        pathya: [{ type: String }], // Recommended foods & habits
        apathya: [{ type: String }] // Contraindicated foods & habits
      },
      followUp: { type: String }
    },
    generatedAt: { type: Date }
  },

  // Diagnoses mapped to ICD-11 and NAMASTE
  diagnoses: [DiagnosisSchema],

  // Safety Matrix (Herb-Drug Interactions evaluated)
  interactionAlerts: [{
    herb: { type: String },
    drug: { type: String },
    severity: { type: String, enum: ['Minor', 'Moderate', 'Severe', 'Critical'] },
    mechanism: { type: String },
    clinicalAdvice: { type: String }
  }],

  // Doctor Review & Final Sign-Off
  doctorReview: {
    doctorId: { type: String },
    doctorName: { type: String },
    signature: { type: String },
    doctorNotes: { type: String },
    reviewedAt: { type: Date },
    approved: { type: Boolean, default: false }
  },

  // Returning Patient & Delta Detection ("What Has Changed Since Last Visit?")
  isReturningPatient: {
    type: Boolean,
    default: false
  },
  previousVisitDate: {
    type: Date
  },
  changesSinceLastVisit: [{
    type: String // 'new_medicine', 'stopped_medicine', 'new_report', 'new_allergy', 'hospitalization', 'none'
  }],
  changeDetails: {
    type: String
  },

  // Clinical Source & Evidence Verification ("Trust the AI")
  evidenceSnippets: [{
    item: { type: String }, // e.g. "Metformin 500mg" or "HbA1c 8.2%"
    sourceDocName: { type: String }, // e.g. "Prescription_DrSharma_Aug2026.pdf"
    docDate: { type: String },
    snippetUrl: { type: String },
    confidence: { type: Number, default: 95 }, // percentage confidence
    verified: { type: Boolean, default: true }
  }],

  // Longitudinal Lab Trend Comparison Engine
  labTrends: [{
    testName: { type: String }, // e.g. "HbA1c", "Hemoglobin", "Fasting Glucose"
    previousValue: { type: String }, // e.g. "7.1%"
    previousDate: { type: String }, // e.g. "Aug 2024"
    currentValue: { type: String }, // e.g. "8.2%"
    currentDate: { type: String }, // e.g. "Sep 2026"
    direction: { type: String, enum: ['elevated', 'decreased', 'stable', 'improved'] },
    changeDelta: { type: String }, // e.g. "+1.1%"
    clinicalSignificance: { type: String }
  }],

  // At-Home Pre-Visit Preparation (uploaded from patient dashboard prior to OPD)
  visitPreparation: {
    preparedAtHome: { type: Boolean, default: false },
    preparedAt: { type: Date },
    documentsUploadedCount: { type: Number, default: 0 },
    verifiedMedicinesCount: { type: Number, default: 0 }
  },

  // Generated ABDM FHIR R4 Bundle Storage
  fhirBundle: {
    type: mongoose.Schema.Types.Mixed
  },

  // ABDM Gateway Interoperability & Sync Log
  abdmSync: {
    synced: { type: Boolean, default: false },
    syncedAt: { type: Date },
    careContextId: { type: String },
    consentId: { type: String },
    transactionId: { type: String },
    hipId: { type: String, default: 'IN-DL-AIIA-001' }
  }
}, {
  timestamps: true
});

// Helper: Generate next sequential daily token number
IntakeSessionSchema.statics.generateNextToken = async function() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const prefix = `OPD-${dateStr}`;

  const latest = await this.findOne({
    tokenNumber: { $regex: `^${prefix}` }
  }).sort({ createdAt: -1 });

  let seq = 1;
  if (latest && latest.tokenNumber) {
    const parts = latest.tokenNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  const padded = String(seq).padStart(3, '0');
  return `${prefix}-${padded}`;
};

module.exports = mongoose.model('IntakeSession', IntakeSessionSchema);
