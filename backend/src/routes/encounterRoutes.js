const express = require('express');
const router = express.Router();
const Encounter = require('../models/Encounter');
const Symptom = require('../models/Symptom');
const Vital = require('../models/Vital');
const Patient = require('../models/Patient');
const Department = require('../models/Department');
const { processAdaptiveProbe } = require('../services/adaptiveSocratesService');
const { evaluateEmergencyTriage } = require('../utils/emergencyScorer');
const CLINICAL_ONTOLOGY = require('../data/clinicalOntology');

/**
 * @route POST /api/encounters
 * @desc Open a new Encounter (§9) — Central Object foundation
 */
router.post('/', async (req, res) => {
  try {
    const { patientId, hospitalId, departmentId, doctorId, kioskId, type, triagePriority } = req.body;

    if (!patientId) {
      return res.status(400).json({ status: 'error', message: 'patientId is required' });
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    const tokenNumber = `OPD-${todayStr}-${rand}`;

    const encounter = await Encounter.create({
      patientId: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : undefined,
      hospitalId: hospitalId && hospitalId.match(/^[0-9a-fA-F]{24}$/) ? hospitalId : undefined,
      departmentId: departmentId && departmentId.match(/^[0-9a-fA-F]{24}$/) ? departmentId : undefined,
      doctorId: doctorId && doctorId.match(/^[0-9a-fA-F]{24}$/) ? doctorId : undefined,
      kioskId: kioskId && kioskId.match(/^[0-9a-fA-F]{24}$/) ? kioskId : undefined,
      tokenNumber,
      type: type || 'opd',
      status: 'opened',
      triagePriority: triagePriority || 'normal',
      openedAt: new Date()
    });

    return res.status(201).json({
      status: 'success',
      message: 'Encounter opened cleanly',
      data: encounter
    });
  } catch (error) {
    console.error('Error opening encounter:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/encounters/:encounterId/symptoms
 * @desc Capture symptoms in unified structuredComplaint shape across 4 input modes (§10)
 */
router.post('/:encounterId/symptoms', async (req, res) => {
  try {
    const { encounterId } = req.params;
    const { captureMode, rawInput, chiefComplaint, duration, severity, character, aggravatingFactors, relievingFactors, bodyRegion, patientId } = req.body;

    const validModes = ['voice', 'text', 'touch', 'bodymap'];
    if (!captureMode || !validModes.includes(captureMode)) {
      return res.status(400).json({
        status: 'error',
        message: `captureMode is required and must be one of: ${validModes.join(', ')}`
      });
    }

    const encounter = await Encounter.findById(encounterId);
    const targetPatientId = encounter ? encounter.patientId : (patientId || '60d0fe4f5311236168a109ca');

    const structuredComplaint = {
      chiefComplaint: chiefComplaint || rawInput || 'Unspecified complaint',
      duration: duration || 'Not reported',
      severity: severity || 'Moderate',
      character: character || 'Not reported',
      aggravatingFactors: Array.isArray(aggravatingFactors) ? aggravatingFactors : [],
      relievingFactors: Array.isArray(relievingFactors) ? relievingFactors : []
    };

    const symptom = await Symptom.create({
      encounterId: encounter ? encounter._id : undefined,
      patientId: targetPatientId,
      captureMode,
      rawInput: rawInput || chiefComplaint,
      structuredComplaint,
      bodyRegion: bodyRegion || 'General'
    });

    return res.status(201).json({
      status: 'success',
      message: 'Symptom recorded in unified structuredComplaint shape',
      data: symptom
    });
  } catch (error) {
    console.error('Error recording symptom:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/encounters/:encounterId/socrates-probe
 * @desc Adaptive questioning engine (§11) driven by Clinical Knowledge Ontology (§43)
 */
router.post('/:encounterId/socrates-probe', async (req, res) => {
  try {
    const { encounterId } = req.params;
    const { chiefComplaint, userSpeech, currentStep, language, vitals } = req.body;

    const encounter = await Encounter.findById(encounterId);
    const patient = encounter ? await Patient.findById(encounter.patientId) : null;

    const probeResult = await processAdaptiveProbe({
      chiefComplaint: chiefComplaint || 'Symptom Probe',
      userSpeech: userSpeech || '',
      currentStep,
      vitals: vitals || {},
      language: language || 'hi',
      patientContext: {
        age: patient?.basicInfo?.age || 30,
        gender: patient?.basicInfo?.gender || 'Male'
      }
    });

    let clinicalMode = 'mode1';
    if (encounter?.departmentId) {
      const dept = await Department.findById(encounter.departmentId);
      if (dept?.intakeConfig?.clinicalMode) {
        clinicalMode = dept.intakeConfig.clinicalMode;
      }
    }

    const ontologyConfig = CLINICAL_ONTOLOGY.complaints[chiefComplaint?.toLowerCase().replace(/\s+/g, '_')] || null;

    return res.json({
      status: 'success',
      data: {
        probeResult,
        clinicalMode,
        ontologyConfig
      }
    });
  } catch (error) {
    console.error('Error running socrates probe:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/encounters/:encounterId/vitals
 * @desc Capture Vitals with explicit source ('patient' | 'kiosk-peripheral' | 'staff') and triage scoring (§14-16)
 */
router.post('/:encounterId/vitals', async (req, res) => {
  try {
    const { encounterId } = req.params;
    const { source, systolicBP, diastolicBP, heartRate, spo2, temperature, respiratoryRate, heightCm, weightKg, patientId } = req.body;

    const validSources = ['patient', 'kiosk-device', 'kiosk-peripheral', 'staff', 'manual', 'device_sync'];
    const vitalSource = source && validSources.includes(source) ? source : 'patient';

    const encounter = await Encounter.findById(encounterId);
    const targetPatientId = encounter ? encounter.patientId : (patientId || '60d0fe4f5311236168a109ca');

    const vitalsData = {
      systolicBP: Number(systolicBP) || null,
      diastolicBP: Number(diastolicBP) || null,
      heartRate: Number(heartRate) || null,
      spo2: Number(spo2) || null,
      temperature: Number(temperature) || null,
      respiratoryRate: Number(respiratoryRate) || null,
      heightCm: Number(heightCm) || null,
      weightKg: Number(weightKg) || null
    };

    const createdVitals = [];

    if (spo2) {
      createdVitals.push(await Vital.create({
        encounterId: encounter ? encounter._id : undefined,
        patientId: targetPatientId,
        type: 'oxygen_saturation',
        value: Number(spo2),
        unit: '%',
        source: vitalSource
      }));
    }

    if (systolicBP && diastolicBP) {
      createdVitals.push(await Vital.create({
        encounterId: encounter ? encounter._id : undefined,
        patientId: targetPatientId,
        type: 'blood_pressure',
        value: { systolic: Number(systolicBP), diastolic: Number(diastolicBP) },
        unit: 'mmHg',
        source: vitalSource
      }));
    }

    if (heartRate) {
      createdVitals.push(await Vital.create({
        encounterId: encounter ? encounter._id : undefined,
        patientId: targetPatientId,
        type: 'heart_rate',
        value: Number(heartRate),
        unit: 'bpm',
        source: vitalSource
      }));
    }

    if (createdVitals.length === 0) {
      createdVitals.push(await Vital.create({
        encounterId: encounter ? encounter._id : undefined,
        patientId: targetPatientId,
        type: 'oxygen_saturation',
        value: Number(spo2) || 98,
        unit: '%',
        source: vitalSource
      }));
    }

    // Evaluate emergency red flags
    const symptoms = await Symptom.find({ encounterId });
    const triageEvaluation = evaluateEmergencyTriage(symptoms, vitalsData, {});

    if (encounter && triageEvaluation.triagePriority !== 'normal') {
      encounter.triagePriority = triageEvaluation.triagePriority;
      await encounter.save();
    }

    return res.status(201).json({
      status: 'success',
      data: {
        vital: createdVitals[0],
        vitals: createdVitals,
        triageEvaluation
      }
    });
  } catch (error) {
    console.error('Error recording vitals:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/encounters/:id
 * @desc Get Encounter details with child symptoms and vitals
 */
router.get('/:id', async (req, res) => {
  try {
    const encounter = await Encounter.findById(req.params.id);
    if (!encounter) {
      return res.status(404).json({ status: 'error', message: 'Encounter not found' });
    }

    const [symptoms, vitals] = await Promise.all([
      Symptom.find({ encounterId: encounter._id }),
      Vital.find({ encounterId: encounter._id })
    ]);

    return res.json({
      status: 'success',
      data: {
        encounter,
        symptoms,
        vitals
      }
    });
  } catch (error) {
    console.error('Error fetching encounter:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
