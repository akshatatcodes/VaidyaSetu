/**
 * Purpose-Based Access Policy Declarations (§47)
 * Maps route actions to required PBAC evaluation scopes.
 */
const { evaluateAccess } = require('../services/pbacService');

const POLICY_PURPOSES = {
  CLINICAL_CARE: 'clinical_care',
  DIAGNOSTIC_PROCESSING: 'diagnostic_processing',
  PATIENT_SELF: 'patient_self_access',
  EMERGENCY_OVERRIDE: 'emergency_override',
  ADMIN_AUDIT: 'administrative_audit'
};

function checkPolicy(actionContext) {
  return evaluateAccess(actionContext);
}

module.exports = {
  POLICY_PURPOSES,
  checkPolicy
};
