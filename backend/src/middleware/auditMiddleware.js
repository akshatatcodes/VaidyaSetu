/**
 * Audit Logging Middleware & Helper (§50)
 * Automatically writes traceable AuditLog rows on sensitive reads and writes.
 */
const AuditLog = require('../models/AuditLog');

async function logAuditEvent({ actorId = 'system', actorRole = 'system', action, targetType, targetId, patientId, reason }) {
  try {
    await AuditLog.create({
      actorId,
      actorRole,
      action: action || 'read_patient_record',
      targetType: targetType || 'patient',
      targetId: targetId ? String(targetId) : undefined,
      patientId: patientId || undefined,
      reason: reason || 'Clinical Consultation'
    });
  } catch (err) {
    console.warn('AuditLog error:', err.message);
  }
}

function autoAuditMiddleware(targetType = 'patient_record') {
  return async (req, res, next) => {
    const actorId = req.headers['x-user-id'] || req.user?.id || 'DOC-DEFAULT';
    const actorRole = req.headers['x-user-role'] || req.user?.role || 'doctor';
    const action = `${req.method.toLowerCase()}_${targetType}`;
    const patientId = req.params?.patientId || req.body?.patientId;

    res.on('finish', () => {
      if (res.statusCode < 400) {
        logAuditEvent({
          actorId,
          actorRole,
          action,
          targetType,
          targetId: req.params?.id || req.params?.encounterId || patientId,
          patientId,
          reason: `HTTP ${req.method} ${req.originalUrl}`
        });
      }
    });

    next();
  };
}

module.exports = { logAuditEvent, autoAuditMiddleware };
