/**
 * EMERGENCY SCORER (PHASE 7)
 * Detects critical symptom combinations that require immediate medical intervention.
 * Aligned with Indian emergency protocols.
 */

const EMERGENCY_PROTOCOLS = {
  cardiac: {
    id: 'cardiac_emergency',
    title: 'CARDIAC EMERGENCY DETECTED',
    message: 'Chest pain combined with shortness of breath is a major warning of a heart event.',
    instructions: '1. Stop all physical activity immediately.\n2. Do NOT drive yourself to the hospital.\n3. Chew 300mg of Aspirin if available and not allergic.\n4. CALL AMBULANCE (108).',
    callContact: '108',
    helplineName: 'Ambulance (Dial 108)'
  },
  stroke: {
    id: 'stroke_alert',
    title: 'STROKE ALERT DETECTED',
    message: 'Severe headache with vision changes or confusion indicates a possible stroke.',
    instructions: '1. Note the time when symptoms first started.\n2. Check for face drooping or slurred speech.\n3. CALL AMBULANCE (108) IMMEDIATELY.',
    callContact: '108',
    helplineName: 'Ambulance (Dial 108)'
  },
  mental_health: {
    id: 'mental_health_crisis',
    title: 'MENTAL HEALTH CRISIS',
    message: 'We are concerned about your safety and well-being.',
    instructions: '1. Reach out to a trusted friend or family member right now.\n2. You are not alone. Professional help is available 24/7.\n3. CALL KIRAN HELPLINE (1800-599-0019).',
    callContact: '18005990019',
    helplineName: 'KIRAN Helpline'
  },
  surgical: {
    id: 'surgical_emergency',
    title: 'SURGICAL EMERGENCY ALERT',
    message: 'Severe abdominal pain with vomiting can indicate acute appendicitis or obstruction.',
    instructions: '1. Do NOT eat or drink anything (NPO).\n2. Do NOT take pain medication as it may mask symptoms.\n3. Proceed to the nearest Emergency Department.',
    callContact: '108',
    helplineName: 'Ambulance (Dial 108)'
  },
  respiratory: {
    id: 'respiratory_emergency',
    title: 'RESPIRATORY EMERGENCY',
    message: 'Difficulty breathing at rest is a critical clinical indicator.',
    instructions: '1. Sit upright to help airway opening.\n2. If you have a rescue inhaler, use it now.\n3. CALL AMBULANCE (108) if breathing does not improve in 5 minutes.',
    callContact: '108',
    helplineName: 'Ambulance (Dial 108)'
  }
};

/**
 * Evaluates the profile for emergency triggers.
 * @param {Object} profile User profile object with symptom fields
 * @returns {Array} List of active emergency protocols
 */
function calculateEmergencyAlerts(profile) {
  const alerts = [];
  
  const getValue = (field) => {
    const val = profile[field]?.value || profile[field];
    return val === true || val === 'Yes';
  };

  // Cardiac: Chest pain + Shortness of breath
  if (getValue('chestPain') && getValue('shortnessBreath')) {
    alerts.push(EMERGENCY_PROTOCOLS.cardiac);
  }

  // Stroke: Severe headache + (Vision changes OR Confusion)
  if (getValue('severeHeadache') && (getValue('visionChanges') || getValue('confusion'))) {
    alerts.push(EMERGENCY_PROTOCOLS.stroke);
  }

  // Mental Health: Suicidal thoughts
  if (getValue('suicidalThoughts')) {
    alerts.push(EMERGENCY_PROTOCOLS.mental_health);
  }

  // Surgical: Abdominal pain + Vomiting
  if (getValue('abdominalPain') && getValue('vomiting')) {
    alerts.push(EMERGENCY_PROTOCOLS.surgical);
  }

  // Respiratory: Difficulty breathing (at rest implied if separate from exertion)
  if (getValue('difficultyBreathing')) {
    alerts.push(EMERGENCY_PROTOCOLS.respiratory);
  }

  return alerts;
}

module.exports = { calculateEmergencyAlerts, EMERGENCY_PROTOCOLS };
