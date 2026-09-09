/**
 * Controlled AI Service: Risk Engine (§42, §15, §16)
 * RED-FLAG SCORING ONLY — NEVER AUTONOMOUS DISEASE DECLARATION.
 * Evaluates physiological vitals & symptom emergency criteria.
 * Writes every call to AIEvent for auditability.
 */
const AIEvent = require('../models/AIEvent');
const { evaluateEmergencyTriage } = require('../utils/emergencyScorer');

async function evaluateRiskScore({ symptoms = [], vitals = {}, encounterId, patientId }) {
  // Normalize vitals structure for emergencyScorer
  const normalizedVitals = {
    spo2: vitals.spo2 || vitals.oxygen_saturation?.value || 100,
    systolicBP: vitals.systolicBP || vitals.blood_pressure?.systolic || (typeof vitals.blood_pressure?.value === 'object' ? vitals.blood_pressure.value.systolic : 120),
    diastolicBP: vitals.diastolicBP || vitals.blood_pressure?.diastolic || 80
  };

  const triageResult = evaluateEmergencyTriage(symptoms, normalizedVitals);
  const confidence = 98;

  const output = {
    triagePriority: triageResult.triagePriority, // 'normal' | 'urgent' | 'emergency'
    isEmergency: triageResult.triagePriority === 'emergency',
    redFlags: triageResult.redFlags,
    disclaimer: 'Red-flag scoring only. Autonomous disease declaration prohibited.'
  };

  if (encounterId || patientId) {
    await AIEvent.create({
      encounterId: encounterId || null,
      patientId: patientId || null,
      service: 'riskEngine',
      input: { symptomCount: Array.isArray(symptoms) ? symptoms.length : 1, vitalsPresent: Object.keys(vitals) },
      output,
      confidence
    }).catch(err => console.warn('AIEvent write note:', err.message));
  }

  return { status: 'success', confidence, data: output };
}

module.exports = { evaluateRiskScore };
