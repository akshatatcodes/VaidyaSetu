const mongoose = require('mongoose');

/**
 * InvestigationOrder Schema — Doctor lab order (§27)
 */
const InvestigationOrderSchema = new mongoose.Schema({
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
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  testName: {
    type: String,
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['routine', 'urgent', 'stat'],
    default: 'routine',
    required: true
  },
  status: {
    type: String,
    enum: ['ordered', 'scanned', 'collected', 'processing', 'resulted', 'verified', 'cancelled'],
    default: 'ordered',
    required: true,
    index: true
  },
  qrPayload: {
    type: String
  },
  orderedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

InvestigationOrderSchema.index({ patientId: 1, orderedAt: -1 });

module.exports = mongoose.models.InvestigationOrder || mongoose.model('InvestigationOrder', InvestigationOrderSchema);
