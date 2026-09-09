const mongoose = require('mongoose');

/**
 * Document Schema — Patient medical document vault (§7)
 */
const DocumentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  encounterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Encounter',
    index: true
  },
  type: {
    type: String,
    enum: [
      'prescription',
      'lab_report',
      'discharge_summary',
      'imaging',
      'referral_letter',
      'other'
    ],
    default: 'other',
    required: true
  },
  title: {
    type: String,
    default: 'Medical Document'
  },
  originalFileUrl: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
    index: true
  }
}, { timestamps: true });

DocumentSchema.index({ patientId: 1, uploadedAt: -1 });

module.exports = mongoose.models.Document || mongoose.model('Document', DocumentSchema);
