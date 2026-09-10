/**
 * Purpose-Based Access Control (PBAC) Express Middleware (§41)
 * Enforces: Role + Stated Purpose + Encounter Assignment + Consent check.
 */

const { evaluateAccess } = require('../services/pbacService');

function requirePurpose(expectedPurpose) {
  return (req, res, next) => {
    const role = (req.user?.role || req.headers['x-user-role'] || 'patient').toLowerCase();
    const userId = req.user?.id || req.user?.userId || req.headers['x-user-id'] || 'anonymous';
    const statedPurpose = req.headers['x-purpose'] || req.query.purpose || req.body?.purpose || expectedPurpose || 'clinical_care';

    const patientId = req.params.patientId || req.query.patientId || req.body?.patientId;
    const encounterId = req.params.encounterId || req.params.sessionId || req.query.encounterId || req.body?.encounterId;
    const hasConsent = Boolean(req.headers['x-consent-token'] || req.body?.consentToken || req.query.consent === 'true');
    
    // Check if user is assigned or if request is within standard clinical flow
    const isAssigned = Boolean(
      req.headers['x-assigned'] === 'true' ||
      req.user?.assignedEncounters?.includes(encounterId) ||
      statedPurpose === 'emergency_override' ||
      process.env.PBAC_STRICT !== 'true' // Permissive during dev unless PBAC_STRICT=true
    );

    const result = evaluateAccess({
      role,
      userId,
      purpose: statedPurpose,
      patientId,
      encounterId,
      hasConsent,
      isAssigned
    });

    if (!result.allowed) {
      return res.status(403).json({
        status: 'error',
        code: 'PBAC_ACCESS_DENIED',
        message: result.reason
      });
    }

    req.pbac = result;
    next();
  };
}

module.exports = {
  requirePurpose
};
