/**
 * Purpose-Based Access Control (PBAC) Engine (§41)
 * Enforces: Role + Purpose + Assigned/Current Encounter + Consent.
 */

const ALLOWED_PURPOSES = [
  'clinical_care',          // Active OPD consultation / treatment
  'diagnostic_processing',  // Lab technician processing test orders
  'patient_self_access',    // Patient viewing own records
  'emergency_override',     // Break-glass emergency access (logged)
  'administrative_audit'    // Operations governance & audit
];

/**
 * Validate Purpose-Based Access Request
 * @param {Object} params
 * @param {string} params.role User role (doctor, patient, lab, admin)
 * @param {string} params.userId Requesting user ID
 * @param {string} params.purpose Stated purpose of access
 * @param {string} [params.patientId] Target patient ID
 * @param {string} [params.encounterId] Target encounter/session ID
 * @param {boolean} [params.hasConsent] Active consent granted
 * @param {boolean} [params.isAssigned] User assigned to encounter/patient
 */
function evaluateAccess({ role, userId, purpose, patientId, encounterId, hasConsent = false, isAssigned = false }) {
  const normalizedRole = (role || '').toLowerCase();
  const normalizedPurpose = (purpose || '').toLowerCase();

  // 1. Purpose Validation
  if (!normalizedPurpose || !ALLOWED_PURPOSES.includes(normalizedPurpose)) {
    return {
      allowed: false,
      reason: `Invalid or missing access purpose. Stated purpose [${purpose || 'none'}] must be one of: [${ALLOWED_PURPOSES.join(', ')}].`
    };
  }

  // 2. Admin Override for Audit Purpose
  if (normalizedRole === 'admin' && normalizedPurpose === 'administrative_audit') {
    return { allowed: true, reason: 'Admin authorized for governance audit.' };
  }

  // 3. Patient Self Access Rule
  if (normalizedRole === 'patient') {
    if (normalizedPurpose === 'patient_self_access') {
      const isSelf = !patientId || String(patientId) === String(userId);
      if (isSelf || hasConsent) {
        return { allowed: true, reason: 'Patient authorized for self record access.' };
      }
      return { allowed: false, reason: 'Patients can only access their own records or consented family profiles.' };
    }
    return { allowed: false, reason: 'Patients cannot access records for non-patient purposes.' };
  }

  // 4. Lab Technician Rule
  if (normalizedRole === 'lab') {
    if (normalizedPurpose === 'diagnostic_processing') {
      return { allowed: true, reason: 'Lab technician authorized for diagnostic processing.' };
    }
    return { allowed: false, reason: 'Lab personnel require diagnostic_processing purpose.' };
  }

  // 5. Doctor Rule (§41 PBAC Enforcement)
  if (normalizedRole === 'doctor') {
    if (normalizedPurpose === 'emergency_override') {
      return { allowed: true, reason: 'Emergency break-glass access granted and audit-logged.', emergencyBreakGlass: true };
    }

    if (normalizedPurpose === 'clinical_care') {
      // Role alone is NOT sufficient. Requires assigned encounter OR active consent.
      if (isAssigned || hasConsent) {
        return { allowed: true, reason: 'Doctor authorized for clinical care of assigned patient/encounter.' };
      }

      // If no patientId/encounterId provided (e.g. general doctor queue), allow queue view
      if (!patientId && !encounterId) {
        return { allowed: true, reason: 'Doctor authorized to view assigned queue.' };
      }

      return {
        allowed: false,
        reason: 'PBAC Violation (§41): Doctor role alone does not grant access to all patient records. Active assigned encounter or patient consent required.'
      };
    }

    return { allowed: false, reason: `Doctor role does not support purpose [${normalizedPurpose}].` };
  }

  return { allowed: false, reason: 'Access denied by default PBAC policy.' };
}

module.exports = {
  ALLOWED_PURPOSES,
  evaluateAccess
};
