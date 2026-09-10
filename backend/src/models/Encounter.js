const mongoose = require('mongoose');

/**
 * Encounter Schema — THE CENTRAL OBJECT (§61)
 * All clinical data (symptoms, vitals, history, documents, lab orders, SOAP, referrals, followups)
 * attaches to an Encounter instance, maintaining clear parent/child clinical provenance.
 */
const EncounterSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: false,
    index: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    index: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    index: true
  },
  kioskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kiosk',
    index: true
  },
  tokenNumber: {
    type: String,
    required: true,
    index: true
  },
  idempotencyKey: {
    type: String,
    sparse: true,
    index: true
  },
  type: {
    type: String,
    enum: ['opd', 'followup', 'emergency'],
    default: 'opd',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: [
      'draft',
      'intake',
      'queued',
      'in_consultation',
      'awaiting_investigation',
      'followup_pending',
      'completed',
      'cancelled',
      'opened',
      'lab_pending',
      'doctor_review',
      'closed'
    ],
    default: 'intake',
    required: true,
    index: true
  },
  triagePriority: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal',
    index: true
  },
  queueStatus: {
    type: String,
    default: 'waiting_intake',
    index: true
  },
  department: {
    type: String,
    default: ''
  },
  openedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  closedAt: {
    type: Date
  },
  qrPayload: {
    type: String
  },
  isReturningPatient: {
    type: Boolean,
    default: false
  },
  previousEncounterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Encounter'
  },
  // Demographic snapshots for kiosk session speed & provenance
  patientName: { type: String },
  age: { type: Number },
  gender: { type: String },
  contactNumber: { type: String },
  abhaId: { type: String, index: true },
  enteredBy: { type: mongoose.Schema.Types.Mixed, default: { type: 'patient' } },
  languagePreference: { type: String, default: 'hi' },
  previousVisitDate: { type: Date },
  changesSinceLastVisit: { type: Array, default: [] },
  changeDetails: { type: String, default: '' },
  // Clinical data blocks & governance
  chiefComplaint: { type: String, default: '' },
  vitals: { type: mongoose.Schema.Types.Mixed, default: {} },
  socrates: { type: mongoose.Schema.Types.Mixed, default: {} },
  dashavidhaPariksha: { type: mongoose.Schema.Types.Mixed, default: {} },
  medicalHistory: { type: mongoose.Schema.Types.Mixed, default: {} },
  soapNote: { type: mongoose.Schema.Types.Mixed, default: {} },
  redFlags: { type: Array, default: [] },
  documents: { type: Array, default: [] },
  consent: { type: mongoose.Schema.Types.Mixed, default: {} },
  evidenceSnippets: { type: Array, default: [] },
  labTrends: { type: Array, default: [] },
  labOrders: { type: Array, default: [] },
  accessLog: { type: Array, default: [] },
  abdmSync: { type: mongoose.Schema.Types.Mixed, default: {} },
  doctorReview: { type: mongoose.Schema.Types.Mixed, default: {} },
  fhirBundle: { type: mongoose.Schema.Types.Mixed, default: {} },
  questionnaireFlags: { type: mongoose.Schema.Types.Mixed, default: {} },
  ayurvedaAnswers: { type: mongoose.Schema.Types.Mixed, default: {} },
  ocrPrescriptions: { type: mongoose.Schema.Types.Mixed, default: [] },
  transcriptConfirmations: { type: Array, default: [] },
  diagnoses: { type: Array, default: [] },
  allergies: { type: Array, default: [] }
}, {
  timestamps: true,
  strict: false
});

EncounterSchema.index({ patientId: 1, openedAt: -1 });

EncounterSchema.statics.generateNextToken = async function() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const count = await this.countDocuments({ createdAt: { $gte: startOfDay } });
  const num = (count + 1).toString().padStart(3, '0');
  return `OPD-${num}`;
};

module.exports = mongoose.models.Encounter || mongoose.model('Encounter', EncounterSchema);

