const mongoose = require('mongoose');

const LabParameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  unit: { type: String, default: '' },
  referenceRange: { type: String, default: '' },
  flag: { type: String, enum: ['normal', 'low', 'high', 'critical'], default: 'normal' }
}, { _id: false });

/**
 * LabResult Schema — Laboratory test results (§30)
 * Versioned rows to ensure original lab values are never overwritten silently.
 */
const LabResultSchema = new mongoose.Schema({
  labSampleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabSample',
    index: true
  },
  investigationOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestigationOrder',
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    index: true
  },
  encounterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Encounter',
    index: true
  },
  clerkId: {
    type: String,
    index: true
  },
  testName: {
    type: String,
    required: true,
    index: true
  },
  parameters: [LabParameterSchema],
  resultValue: {
    type: mongoose.Schema.Types.Mixed
  },
  unit: {
    type: String
  },
  referenceRange: {
    type: String
  },
  sampleDate: {
    type: Date,
    default: Date.now
  },
  verifiedBy: {
    type: String
  },
  verifiedAt: {
    type: Date
  },
  version: {
    type: Number,
    default: 1
  },
  originalValuePreserved: {
    type: Boolean,
    default: true
  },
  previousVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabResult'
  }
}, { timestamps: true });

LabResultSchema.index({ patientId: 1, sampleDate: -1 });

module.exports = mongoose.models.LabResult || mongoose.model('LabResult', LabResultSchema);
