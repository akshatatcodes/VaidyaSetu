const mongoose = require('mongoose');

/**
 * Consent Schema — Granular, traceable, per-purpose consent model (§46-48)
 */
const ConsentSchema = new mongoose.Schema({
  consentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  purpose: {
    type: String,
    enum: [
      'clinical_history',
      'document_scanning',
      'document_processing',
      'doctor_sharing',
      'lab_sharing',
      'followup_notification',
      'abdm_exchange',
      'secondary_use',
      'whatsapp',
      'sms',
      'voice',
      'push',
      'kiosk_print',
      'all_communications'
    ],
    required: true,
    index: true
  },
  dataScope: {
    type: String,
    default: 'opd_encounter_data'
  },
  recipient: {
    type: String,
    default: 'assigned_clinical_team'
  },
  method: {
    type: String,
    enum: ['audio_touchscreen', 'web_app', 'kiosk_ui', 'written'],
    default: 'kiosk_ui'
  },
  language: {
    type: String,
    default: 'en'
  },
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active',
    index: true
  },
  grantedAt: {
    type: Date,
    default: Date.now
  },
  revokedAt: {
    type: Date
  }
}, {
  timestamps: true
});

ConsentSchema.index({ patientId: 1, purpose: 1, status: 1 });

module.exports = mongoose.models.Consent || mongoose.model('Consent', ConsentSchema);
