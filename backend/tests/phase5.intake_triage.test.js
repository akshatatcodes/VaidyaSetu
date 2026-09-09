const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

const encounterRoutes = require('../src/routes/encounterRoutes');
const Patient = require('../src/models/Patient');
const Encounter = require('../src/models/Encounter');
const Symptom = require('../src/models/Symptom');
const Vital = require('../src/models/Vital');
const { evaluateEmergencyTriage } = require('../src/utils/emergencyScorer');

const app = express();
app.use(express.json());
app.use('/api/encounters', encounterRoutes);

describe('Phase 5 — OPD Registration & Adaptive Clinical Intake (§9-16)', () => {
  let testPatientId;
  let testEncounterId;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test_phase5';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const patient = await Patient.create({
      basicInfo: { fullName: 'Subhadra Devi', age: 54, gender: 'Female' }
    });
    testPatientId = patient._id;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await Patient.deleteMany({});
      await Encounter.deleteMany({});
      await Symptom.deleteMany({});
      await Vital.deleteMany({});
      await mongoose.connection.close();
    }
  });

  describe('1. OPD Registration & Encounter Opening (§9)', () => {
    test('POST /api/encounters should open a new Encounter entity', async () => {
      const res = await request(app)
        .post('/api/encounters')
        .send({
          patientId: testPatientId.toString(),
          type: 'opd',
          triagePriority: 'normal'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.tokenNumber).toBeDefined();
      expect(res.body.data.status).toBe('opened');

      testEncounterId = res.body.data._id;
    });
  });

  describe('2. Unified Symptom Capture Across 4 Input Modes (§10)', () => {
    const inputModes = [
      { mode: 'touch', input: 'Knee Pain' },
      { mode: 'bodymap', input: 'Knee Pain', region: 'Lower Limb' },
      { mode: 'voice', input: 'Severe knee pain for 3 days' },
      { mode: 'text', input: 'Bilateral knee stiffness' }
    ];

    test.each(inputModes)('Mode %s should produce identical structuredComplaint shape', async ({ mode, input, region }) => {
      const res = await request(app)
        .post(`/api/encounters/${testEncounterId}/symptoms`)
        .send({
          captureMode: mode,
          chiefComplaint: 'Bilateral Knee Osteoarthritis',
          duration: '3 days',
          severity: 'Moderate',
          rawInput: input,
          bodyRegion: region || 'Lower Limb'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.captureMode).toBe(mode);

      // Verify unified structured complaint shape
      const sc = res.body.data.structuredComplaint;
      expect(sc.chiefComplaint).toBeDefined();
      expect(sc.duration).toBeDefined();
      expect(sc.severity).toBeDefined();
      expect(sc.character).toBeDefined();
      expect(Array.isArray(sc.aggravatingFactors)).toBe(true);
      expect(Array.isArray(sc.relievingFactors)).toBe(true);
    });
  });

  describe('3. Adaptive Questioning Probe (§11, §43)', () => {
    test('POST /api/encounters/:encounterId/socrates-probe should return Clinical Ontology probe', async () => {
      const res = await request(app)
        .post(`/api/encounters/${testEncounterId}/socrates-probe`)
        .send({
          chiefComplaint: 'chest_pain',
          userSpeech: 'Pain radiating to left arm',
          language: 'hi'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.ontologyConfig).toBeDefined();
      expect(res.body.data.ontologyConfig.requiredAttributes).toContain('site');
    });
  });

  describe('4. Vitals Capture Sources (§14)', () => {
    test('POST /api/encounters/:encounterId/vitals should record vital with kiosk-peripheral source', async () => {
      const res = await request(app)
        .post(`/api/encounters/${testEncounterId}/vitals`)
        .send({
          source: 'kiosk-peripheral',
          systolicBP: 130,
          diastolicBP: 85,
          spo2: 98,
          heartRate: 76
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.vital.source).toBe('kiosk-peripheral');
    });
  });

  describe('5. Red-Flag & Emergency Triage Engine (§15, §16)', () => {
    test('evaluateEmergencyTriage should route critical cardiac hit to emergency priority', () => {
      const result = evaluateEmergencyTriage(
        { chiefComplaint: 'chest pain radiating to left arm' },
        { spo2: 90, systolicBP: 190 },
        {}
      );

      expect(result.status).toBe('potential_emergency');
      expect(result.triagePriority).toBe('emergency');
      expect(result.redFlags.length).toBeGreaterThan(0);
      expect(result.escalationLadder).toContain('staff_review');
    });
  });
});
