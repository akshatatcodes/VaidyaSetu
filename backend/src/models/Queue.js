const mongoose = require('mongoose');

/**
 * Queue Schema — Live OPD / Follow-up queue tracking collection (§18-19)
 */
const QueueEntrySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.Mixed, ref: 'Patient', required: true },
  encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter' },
  tokenNumber: { type: String, required: true },
  priority: { type: String, enum: ['normal', 'urgent', 'emergency'], default: 'normal' },
  joinedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['waiting', 'in_consultation', 'completed', 'skipped'], default: 'waiting' },
  estimatedWaitMinutes: { type: Number, default: 15 }
}, { _id: true });

const QueueSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    index: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    index: true
  },
  queueType: {
    type: String,
    enum: ['normal', 'emergency', 'followup', 'lab', 'opd'],
    default: 'normal',
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  entries: [QueueEntrySchema]
}, {
  timestamps: true
});

QueueSchema.index({ hospitalId: 1, departmentId: 1, date: 1, queueType: 1 }, { unique: true });

module.exports = mongoose.models.Queue || mongoose.model('Queue', QueueSchema);
