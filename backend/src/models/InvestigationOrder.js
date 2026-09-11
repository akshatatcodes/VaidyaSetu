const mongoose = require('mongoose');

/**
 * InvestigationOrder Schema — Doctor lab order (§27)
 *
 * IDs are Mixed rather than strict ObjectId so that demo/kiosk flows using ABHA or
 * string doctor codes cannot hard-fail on a CastError. Real ObjectIds still populate.
 */
const InvestigationOrderSchema = new mongoose.Schema({
  encounterId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Encounter',
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Patient',
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Doctor',
    index: true
  },
  testName: {
    type: String,
    required: true,
    index: true
  },

  // ── Denormalised display fields ──
  // The lab bench needs to identify the specimen without a join. Previously these
  // were absent, so every lab card rendered "Token: undefined · undefinedy undefined".
  labTokenNumber: {
    type: String,
    index: true
  },
  tokenNumber: {
    type: String,
    index: true
  },
  patientName: { type: String, default: '' },
  age: { type: Number },
  gender: { type: String, default: '' },
  department: { type: String, default: '' },
  doctorName: { type: String, default: '' },
  section: { type: String, default: 'Pathology' },
  clinicalNotes: { type: String, default: '' },

  priority: {
    type: String,
    enum: ['routine', 'urgent', 'stat'],
    default: 'routine',
    required: true
  },
  status: {
    type: String,
    enum: [
      'ordered', 'scanned', 'queued', 'collected', 'processing',
      'resulted', 'verified', 'reported', 'cancelled'
    ],
    default: 'ordered',
    required: true,
    index: true
  },
  critical: {
    type: Boolean,
    default: false,
    index: true
  },
  qrPayload: {
    type: String
  },
  orderedAt: {
    type: Date,
    default: Date.now
  },
  collectedAt: { type: Date },
  resultedAt: { type: Date },
  verifiedAt: { type: Date }
}, { timestamps: true });

InvestigationOrderSchema.index({ patientId: 1, orderedAt: -1 });

/**
 * Lab tokens are their own series (LAB-001), separate from the OPD token, so a patient
 * sent for investigation receives a fresh queue position at the lab counter.
 */
InvestigationOrderSchema.statics.generateLabToken = async function () {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const count = await this.countDocuments({ createdAt: { $gte: startOfDay } });
  return `LAB-${(count + 1).toString().padStart(3, '0')}`;
};

module.exports = mongoose.models.InvestigationOrder || mongoose.model('InvestigationOrder', InvestigationOrderSchema);
