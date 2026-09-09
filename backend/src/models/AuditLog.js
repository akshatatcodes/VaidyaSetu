const mongoose = require('mongoose');

/**
 * AuditLog Schema — Traceable DPDP/ABDM audit logging collection (§50)
 */
const AuditLogSchema = new mongoose.Schema({
  actorId: {
    type: String,
    required: true,
    index: true
  },
  actorRole: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  targetType: {
    type: String,
    required: true
  },
  targetId: {
    type: String
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    index: true
  },
  reason: {
    type: String
  },
  at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

AuditLogSchema.index({ actorId: 1, at: -1 });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
