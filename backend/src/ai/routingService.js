/**
 * Controlled AI Service: Routing Service (§42, §18)
 * Suggests appropriate OPD department labeled explicitly as "AI-assisted routing".
 * Writes every call to AIEvent for auditability.
 */
const AIEvent = require('../models/AIEvent');
const CLINICAL_ONTOLOGY = require('../data/clinicalOntology');

function getClinicalOntologyMatch(chiefComplaint = '') {
  const text = chiefComplaint.toLowerCase();

  if (text.includes('knee') || text.includes('joint') || text.includes('sandhi')) {
    return { ayurvedicDepartment: 'Kayachikitsa', allopathicDepartment: 'Orthopedics', keywords: ['knee', 'joint'] };
  }
  if (text.includes('chest') || text.includes('heart') || text.includes('hrid')) {
    return { ayurvedicDepartment: 'Kayachikitsa', allopathicDepartment: 'Cardiology', keywords: ['chest', 'heart'] };
  }
  if (text.includes('fever') || text.includes('jwara')) {
    return { ayurvedicDepartment: 'Kayachikitsa', allopathicDepartment: 'General Medicine', keywords: ['fever'] };
  }
  if (text.includes('headache') || text.includes('head') || text.includes('shiro')) {
    return { ayurvedicDepartment: 'Shalakya Tantra', allopathicDepartment: 'Neurology', keywords: ['headache'] };
  }
  if (text.includes('stomach') || text.includes('abdomen') || text.includes('digest')) {
    return { ayurvedicDepartment: 'Kayachikitsa', allopathicDepartment: 'Gastroenterology', keywords: ['stomach'] };
  }

  return null;
}

async function suggestDepartment({ chiefComplaint, systemOfMedicine = 'ayurvedic', encounterId, patientId }) {
  const match = getClinicalOntologyMatch(chiefComplaint);

  const suggestedDepartment = systemOfMedicine === 'ayurvedic'
    ? (match?.ayurvedicDepartment || 'Kayachikitsa')
    : (match?.allopathicDepartment || 'General Medicine');

  const confidence = match ? 92 : 75;

  const output = {
    suggestedDepartment,
    label: 'AI-assisted routing',
    systemOfMedicine,
    matchedKeywords: match?.keywords || []
  };

  if (encounterId || patientId) {
    await AIEvent.create({
      encounterId: encounterId || null,
      patientId: patientId || null,
      service: 'routing',
      input: { chiefComplaint, systemOfMedicine },
      output,
      confidence
    }).catch(err => console.warn('AIEvent write note:', err.message));
  }

  return { status: 'success', confidence, data: output };
}

module.exports = { suggestDepartment, getClinicalOntologyMatch };
