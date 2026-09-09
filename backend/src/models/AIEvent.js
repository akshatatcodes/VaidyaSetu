const mongoose = require('mongoose');

/**
 * AIEvent Schema — Auditability & confidence tracking for controlled AI services (§42, §64)
 */
const AIEventSchema = new mongoose.Schema({
  encounterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Encounter',
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    index: true
  },
  service: {
    type: String,
    enum: ['asr', 'ocr', 'historyAI', 'summaryAI', 'riskEngine', 'routing', 'queuePrediction'],
    required: true,
    index: true
  },
  input: {
    type: mongoose.Schema.Types.Mixed
  },
  output: {
    type: mongoose.Schema.Types.Mixed
  },
  confidence: {
    type: Number,
    default: 100
  },
  reviewedByDoctor: {
    type: Boolean,
    default: false
  },
  at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.models.AIEvent || mongoose.model('AIEvent', AIEventSchema);
