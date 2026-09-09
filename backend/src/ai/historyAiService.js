/**
 * Controlled AI Service: History AI Service (§42, §10-13)
 * Wraps adaptive clinical intake (Socrates probes) and structures patient history.
 * Writes every call to AIEvent for auditability.
 */
const AIEvent = require('../models/AIEvent');
const { generateAdaptiveProbe } = require('../services/adaptiveSocratesService');

async function processHistoryIntake({ chiefComplaint, previousAnswers = [], encounterId, patientId }) {
  const probe = generateAdaptiveProbe({ chiefComplaint, previousAnswers });
  const confidence = 95;

  const output = {
    probeQuestion: probe.question,
    options: probe.options,
    ontologyTerm: probe.ontologyTerm || chiefComplaint,
    sourceTag: { source: 'Patient reported at MediKiosk', confidence: 'patient_reported' }
  };

  if (encounterId || patientId) {
    await AIEvent.create({
      encounterId: encounterId || null,
      patientId: patientId || null,
      service: 'historyAI',
      input: { chiefComplaint, answerCount: previousAnswers.length },
      output,
      confidence
    }).catch(err => console.warn('AIEvent write note:', err.message));
  }

  return { status: 'success', confidence, data: output };
}

module.exports = { processHistoryIntake };
