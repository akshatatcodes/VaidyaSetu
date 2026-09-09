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
    required: true,
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
  type: {
    type: String,
    enum: ['opd', 'followup', 'emergency'],
    default: 'opd',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['opened', 'in_consultation', 'lab_pending', 'doctor_review', 'closed', 'cancelled'],
    default: 'opened',
    required: true,
    index: true
  },
  triagePriority: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal',
    index: true
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
  }
}, {
  timestamps: true
});

EncounterSchema.index({ patientId: 1, openedAt: -1 });

module.exports = mongoose.models.Encounter || mongoose.model('Encounter', EncounterSchema);
