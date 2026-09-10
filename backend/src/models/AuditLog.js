const mongoose = require('mongoose');

/**
 * AuditLog Schema — Centralized DPDP/ABDM/HIPAA Audit Trail (§42)
 * Logs every sensitive operation with 8 required attributes:
 * actor, role, action, targetType, targetId, patient, reason, timestamp.
 */
const AuditLogSchema = new mongoose.Schema({
  actor: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  targetType: {
    type: String,
    required: true,
    index: true
  },
  targetId: {
    type: String,
    default: null
  },
  patient: {
    type: String,
    default: null,
    index: true
  },
  reason: {
    type: String,
    default: 'clinical_care'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Compatibility fields for legacy queries
  actorId: { type: String },
  actorRole: { type: String },
  patientId: { type: String },
  at: { type: Date, default: Date.now }
}, { timestamps: true });

AuditLogSchema.index({ actor: 1, timestamp: -1 });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
