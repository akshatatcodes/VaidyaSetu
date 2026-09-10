/**
 * Centralized Audit Logging Middleware & Helper (§42)
 * Automatically captures traceable AuditLog records on sensitive operations.
 */
const AuditLog = require('../models/AuditLog');

async function logAuditEvent({ actor, role, action, targetType, targetId, patient, reason, actorId, actorRole, patientId }) {
  try {
    const finalActor = actor || actorId || 'system';
    const finalRole = role || actorRole || 'system';
    const finalPatient = patient || patientId || null;
    const now = new Date();

    return await AuditLog.create({
      actor: finalActor,
      role: finalRole,
      action: action || 'sensitive_data_access',
      targetType: targetType || 'patient_record',
      targetId: targetId ? String(targetId) : null,
      patient: finalPatient ? String(finalPatient) : null,
      reason: reason || 'clinical_care',
      timestamp: now,

      // Compatibility fields for legacy queries
      actorId: finalActor,
      actorRole: finalRole,
      patientId: finalPatient ? String(finalPatient) : null,
      at: now
    });
  } catch (err) {
    console.warn('[AuditLog] Error writing audit log:', err.message);
    return null;
  }
}

/**
 * Express Middleware for Automatic Audit Logging on Sensitive Reads & Writes (§42)
 */
function auditSensitiveAccess(actionName, targetType = 'patient_record') {
  return (req, res, next) => {
    const actor = req.user?.id || req.headers['x-user-id'] || 'DOC-DEFAULT';
    const role = req.user?.role || req.headers['x-user-role'] || 'doctor';
    const patient = req.params?.patientId || req.body?.patientId || req.query?.patientId || null;
    const targetId = req.params?.id || req.params?.orderId || req.params?.encounterId || patient;
    const reason = req.headers['x-purpose'] || req.query?.purpose || req.body?.purpose || 'clinical_care';

    res.on('finish', () => {
      if (res.statusCode < 400) {
        logAuditEvent({
          actor,
          role,
          action: actionName || `${req.method.toUpperCase()} ${req.originalUrl}`,
          targetType,
          targetId,
          patient,
          reason
        });
      }
    });

    next();
  };
}

module.exports = {
  logAuditEvent,
  auditSensitiveAccess,
  autoAuditMiddleware: auditSensitiveAccess
};
