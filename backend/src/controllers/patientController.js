/**
 * Patient Controller (§47)
 * Decouples patient profile and history business logic from routes.
 */
const Patient = require('../models/Patient');
const Encounter = require('../models/Encounter');

async function getPatientProfile(req, res) {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id).catch(() => Patient.findOne({ abhaId: id }));
    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Patient record not found' });
    }
    return res.json({ status: 'success', data: patient });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

async function getPatientHistory(req, res) {
  try {
    const { id } = req.params;
    const encounters = await Encounter.find({
      $or: [{ patientId: id }, { abhaId: id }]
    }).sort({ createdAt: -1 });

    return res.json({ status: 'success', count: encounters.length, data: encounters });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

module.exports = {
  getPatientProfile,
  getPatientHistory
};
