/**
 * Encounter Controller (§47)
 * Decouples clinical encounter business logic from Express route definitions.
 */
const Encounter = require('../models/Encounter');
const Patient = require('../models/Patient');
const { evaluateRiskScore } = require('../ai/riskEngine');
const { generateSoapCaseSheet } = require('../services/soapGeneratorService');
const { logAuditEvent } = require('../middleware/auditMiddleware');

async function startSession(req, res) {
  try {
    const { abhaId, patientName, age, gender, contactNumber, department } = req.body;
    if (!patientName || !age || !gender) {
      return res.status(400).json({ status: 'error', message: 'patientName, age, and gender are required.' });
    }

    const idempotencyKey = req.headers['x-idempotency-key'] || req.body.idempotencyKey;
    if (idempotencyKey) {
      const existing = await Encounter.findOne({ idempotencyKey });
      if (existing) {
        return res.status(200).json({ status: 'success', idempotent: true, data: existing });
      }
    }

    const tokenNumber = await Encounter.generateNextToken();
    const newSession = new Encounter({
      tokenNumber,
      idempotencyKey: idempotencyKey || undefined,
      patientName,
      age: Number(age),
      gender,
      contactNumber: contactNumber || '',
      department: department || 'Kayachikitsa',
      queueStatus: 'waiting_intake'
    });

    await newSession.save();
    await logAuditEvent({
      actor: req.headers['x-user-id'] || 'kiosk',
      role: 'patient',
      action: 'start_opd_encounter',
      targetType: 'encounter',
      targetId: newSession.tokenNumber,
      reason: 'OPD Intake Session Start'
    });

    return res.status(201).json({ status: 'success', data: newSession });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

async function getEncounterById(req, res) {
  try {
    const { id } = req.params;
    const session = await Encounter.findById(id).catch(() => Encounter.findOne({ tokenNumber: id }));
    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Encounter not found' });
    }
    return res.json({ status: 'success', data: session });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

module.exports = {
  startSession,
  getEncounterById
};
