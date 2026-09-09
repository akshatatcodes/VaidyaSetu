const mongoose = require('mongoose');

/**
 * History Schema — Clinical History record keyed off Encounter & Patient (§12-13)
 * Supports Mode 1 (Modern) and Mode 2 (AYUSH) clinical intake
 */
const HistorySchema = new mongoose.Schema({
  encounterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Encounter',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  mode: {
    type: String,
    enum: ['modern', 'ayush'],
    default: 'modern',
    required: true
  },
  sections: {
    chiefComplaint: { type: String },
    hpi: { type: String },
    pastMedicalHistory: [String],
    pastSurgicalHistory: [String],
    drugHistory: [String],
    allergies: [String],
    familyHistory: [String],
    personalHistory: { type: String },
    reviewOfSystems: { type: String },
    // Mode 2 AYUSH specific assessment block (§13)
    dashavidhaPariksha: {
      duchya: { type: String },
      desha: { type: String },
      bala: { type: String },
      kala: { type: String },
      anala: { type: String },
      prakriti: { type: String },
      vaya: { type: String },
      sattva: { type: String },
      satmya: { type: String },
      ahara: { type: String }
    },
    aharaVihara: {
      dietDetails: { type: String },
      lifestyleDetails: { type: String },
      agniStatus: { type: String },
      koshthaStatus: { type: String }
    }
  },
  sourceTags: [{
    field: String,
    source: String, // e.g., 'Patient reported', 'Prescription dated 03 Sep 2026', 'Caregiver'
    confidence: String
  }]
}, {
  timestamps: true
});

HistorySchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.models.History || mongoose.model('History', HistorySchema);
