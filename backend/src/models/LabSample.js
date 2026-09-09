const mongoose = require('mongoose');

/**
 * LabSample Schema — Laboratory specimen collection (§29)
 */
const LabSampleSchema = new mongoose.Schema({
  investigationOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestigationOrder',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  sampleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  collectedAt: {
    type: Date,
    default: Date.now
  },
  collectedBy: {
    type: String
  },
  status: {
    type: String,
    enum: ['collected', 'in_transit', 'received', 'rejected'],
    default: 'collected',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.models.LabSample || mongoose.model('LabSample', LabSampleSchema);
