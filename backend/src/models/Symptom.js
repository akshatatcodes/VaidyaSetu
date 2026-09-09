const mongoose = require('mongoose');

/**
 * Symptom Schema — Captured patient symptoms per encounter (§10)
 */
const SymptomSchema = new mongoose.Schema({
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
  captureMode: {
    type: String,
    enum: ['voice', 'text', 'touch', 'bodymap'],
    required: true
  },
  rawInput: {
    type: String
  },
  structuredComplaint: {
    chiefComplaint: { type: String, required: true },
    duration: { type: String },
    severity: { type: String },
    character: { type: String },
    aggravatingFactors: [String],
    relievingFactors: [String]
  },
  bodyRegion: {
    type: String
  },
  capturedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Symptom || mongoose.model('Symptom', SymptomSchema);
