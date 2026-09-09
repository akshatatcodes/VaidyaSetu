const mongoose = require('mongoose');

/**
 * ABHAIdentity Schema — ABDM-governed identity entity
 */
const ABHAIdentitySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  abhaId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  abhaAddress: {
    type: String,
    trim: true
  },
  linkStatus: {
    type: String,
    enum: ['unlinked', 'pending_abdm_flow', 'linked', 'revoked'],
    default: 'pending_abdm_flow',
    required: true
  },
  linkedAt: {
    type: Date
  },
  consentArtifactRef: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.ABHAIdentity || mongoose.model('ABHAIdentity', ABHAIdentitySchema);
