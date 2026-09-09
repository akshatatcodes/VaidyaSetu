/**
 * RED-FLAG & EMERGENCY TRIAGE ENGINE (§15, §16)
 * Pure function over Symptom + Vital + History -> { status, redFlags, triagePriority }
 * IMPORTANT: Always routes to human triage / staff review; NEVER claims autonomous diagnosis.
 */

const EMERGENCY_PROTOCOLS = {
  cardiac: {
    id: 'cardiac_emergency',
    title: 'CARDIAC EMERGENCY ALERT',
    message: 'Chest pain / pressure combined with dyspnea or radiation.',
    instructions: 'Route immediately to Human Triage / Staff Review. Prepare ECG.',
    severity: 'critical'
  },
  stroke: {
    id: 'stroke_alert',
    title: 'STROKE / NEUROLOGICAL ALERT',
    message: 'Severe headache with altered sensorium, facial droop, or focal weakness.',
    instructions: 'Route immediately to Urgent Triage / Physician Assessment.',
    severity: 'critical'
  },
  respiratory: {
    id: 'respiratory_emergency',
    title: 'RESPIRATORY DISTRESS ALERT',
    message: 'SpO2 < 92% or severe difficulty breathing.',
    instructions: 'Administer Oxygen therapy under nursing triage supervision.',
    severity: 'critical'
  },
  hypertensive_crisis: {
    id: 'hypertensive_crisis',
    title: 'HYPERTENSIVE CRISIS ALERT',
    message: 'Systolic BP >= 180 mmHg or Diastolic BP >= 120 mmHg.',
    instructions: 'Physician evaluation required immediately.',
    severity: 'critical'
  }
};

/**
 * Pure evaluation function per §15/§16
 */
function evaluateEmergencyTriage(symptoms = {}, vitals = {}, history = {}) {
  const redFlags = [];

  const text = JSON.stringify(symptoms).toLowerCase();

  // 1. Cardiac triggers
  if (text.includes('chest pain') || text.includes('chest pressure') || text.includes('left arm')) {
    redFlags.push(EMERGENCY_PROTOCOLS.cardiac);
  }

  // 2. Stroke / Neuro triggers
  if (text.includes('thunderclap') || text.includes('facial droop') || text.includes('slurred speech')) {
    redFlags.push(EMERGENCY_PROTOCOLS.stroke);
  }

  // 3. Vital triggers
  if (vitals.spo2 && Number(vitals.spo2) < 92) {
    redFlags.push(EMERGENCY_PROTOCOLS.respiratory);
  }
  if (vitals.systolicBP && Number(vitals.systolicBP) >= 180) {
    redFlags.push(EMERGENCY_PROTOCOLS.hypertensive_crisis);
  }

  const hasCritical = redFlags.some(r => r.severity === 'critical');
  const hasHigh = redFlags.length > 0;

  const triagePriority = hasCritical ? 'emergency' : (hasHigh ? 'urgent' : 'normal');

  return {
    status: hasHigh ? 'potential_emergency' : 'normal',
    redFlags,
    triagePriority,
    escalationLadder: hasHigh ? ['warning', 'manual_verification', 'staff_review'] : ['standard_queue'],
    recommendation: hasHigh ? 'Escalated to staff triage review (§16)' : 'Routine OPD consultation queue'
  };
}

function calculateEmergencyAlerts(profile) {
  const res = evaluateEmergencyTriage(profile, profile.vitals || {}, {});
  return res.redFlags;
}

module.exports = { evaluateEmergencyTriage, calculateEmergencyAlerts, EMERGENCY_PROTOCOLS };
