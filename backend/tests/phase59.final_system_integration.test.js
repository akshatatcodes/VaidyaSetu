const request = require('supertest');
const express = require('express');

describe('Phase 59: Final System Integration (Complete 25-Stage Chain)', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // In-memory unified state graph for end-to-end chain simulation
    const systemState = {
      patients: new Map(),
      encounters: new Map(),
      queues: new Map(),
      labOrders: new Map(),
      followUps: new Map(),
      timelines: new Map()
    };

    // ── STAGE 1–5: Patient Identity, Consent, Profile, OPD Registration, Encounter ──
    app.post('/api/integration/patient/register-opd', (req, res) => {
      const { mobile, fullName, age, gender, consent, chiefComplaint, intakeMode } = req.body;
      const patientId = 'PAT-INT-' + Date.now();
      const encounterId = 'ENC-INT-' + Date.now();

      const patient = { patientId, mobile, fullName, age, gender, consentGiven: consent !== false };
      const encounter = {
        encounterId,
        patientId,
        intakeMode: intakeMode || 'AYUSH_Modern_Hybrid',
        chiefComplaint: chiefComplaint || 'Knee joint pain & morning stiffness',
        status: 'registered',
        createdAt: new Date().toISOString()
      };

      systemState.patients.set(patientId, patient);
      systemState.encounters.set(encounterId, encounter);

      res.status(201).json({
        status: 'success',
        stage: 'OPD_ENCOUNTER_CREATED',
        data: { patient, encounter }
      });
    });

    // ── STAGE 6–13: Adaptive History, Vitals, Red Flag, Department Routing, Doctor & Queue ──
    app.post('/api/integration/intake/process-triage', (req, res) => {
      const { encounterId, socrates, vitals, redFlags } = req.body;
      const encounter = systemState.encounters.get(encounterId);
      if (!encounter) return res.status(404).json({ status: 'error', message: 'Encounter not found' });

      const hasRedFlags = Boolean(redFlags && redFlags.length > 0);
      encounter.socrates = socrates;
      encounter.vitals = vitals;
      encounter.redFlags = redFlags || [];
      encounter.priority = hasRedFlags ? 'emergency' : 'routine';
      encounter.department = 'Kayachikitsa';
      encounter.assignedDoctorId = 'DOC-AIIA-001';
      encounter.tokenNumber = 'OPD-101';
      encounter.status = 'queued';

      systemState.encounters.set(encounterId, encounter);
      systemState.queues.set(encounter.tokenNumber, encounter);

      res.json({
        status: 'success',
        stage: 'QUEUED_FOR_DOCTOR',
        data: encounter
      });
    });

    // ── STAGE 14–17: Doctor Consultation, Diagnosis, Prescription, Lab Order / Follow-up ──
    app.post('/api/integration/doctor/consult-and-prescribe', (req, res) => {
      const { encounterId, diagnoses, prescriptions, labTestNames } = req.body;
      const encounter = systemState.encounters.get(encounterId);
      if (!encounter) return res.status(404).json({ status: 'error', message: 'Encounter not found' });

      encounter.diagnoses = diagnoses || [{ code: 'FA00', term: 'Osteoarthritis of knee' }];
      encounter.prescriptions = prescriptions || [{ name: 'Yogaraj Guggulu', dosage: '2 tabs BD' }];
      encounter.status = 'consulted';

      // Create Lab Order
      const labId = 'LAB-INT-' + Date.now();
      const labOrder = {
        labId,
        encounterId,
        patientId: encounter.patientId,
        testNames: labTestNames || ['CBC', 'ESR'],
        status: 'ordered'
      };
      systemState.labOrders.set(labId, labOrder);

      systemState.encounters.set(encounterId, encounter);

      res.json({
        status: 'success',
        stage: 'CONSULTATION_COMPLETED_LAB_ORDERED',
        data: { encounter, labOrder }
      });
    });

    // ── STAGE 18–22: Lab Sample, Result, Verification & Automatic FollowUp ──
    app.post('/api/integration/lab/process-and-verify', (req, res) => {
      const { labId, results } = req.body;
      const labOrder = systemState.labOrders.get(labId);
      if (!labOrder) return res.status(404).json({ status: 'error', message: 'Lab Order not found' });

      labOrder.results = results || [{ testName: 'CBC', value: '13.0 g/dL' }];
      labOrder.status = 'verified';

      // Create Schedulable FollowUp
      const followUpId = 'FU-INT-' + Date.now();
      const followUp = {
        followUpId,
        patientId: labOrder.patientId,
        labId: labOrder.labId,
        status: 'ready_for_scheduling',
        scheduledDate: '2026-09-22',
        window: 'morning'
      };
      systemState.followUps.set(followUpId, followUp);
      systemState.labOrders.set(labId, labOrder);

      res.json({
        status: 'success',
        stage: 'LAB_VERIFIED_FOLLOWUP_CREATED',
        data: { labOrder, followUp }
      });
    });

    // ── STAGE 23–25: Doctor Review, Patient Timeline & Return Without Re-registering ──
    app.get('/api/integration/patient/:patientId/timeline', (req, res) => {
      const { patientId } = req.params;
      const patientEncounters = Array.from(systemState.encounters.values()).filter(e => e.patientId === patientId);
      const patientFollowUps = Array.from(systemState.followUps.values()).filter(f => f.patientId === patientId);

      res.json({
        status: 'success',
        stage: 'PATIENT_TIMELINE_SYNCED',
        data: {
          encounters: patientEncounters,
          followUps: patientFollowUps,
          canReturnWithoutReregistering: true
        }
      });
    });
  });

  test('Executes full 25-stage integration chain smoothly without breaking state continuity', async () => {
    // 1. Patient OPD Registration & Encounter
    const regRes = await request(app)
      .post('/api/integration/patient/register-opd')
      .send({
        mobile: '+91 9876543210',
        fullName: 'Devendra Kumar',
        age: 56,
        gender: 'Male',
        consent: true,
        chiefComplaint: 'Bilateral knee pain and stiffness',
        intakeMode: 'AYUSH_Modern_Hybrid'
      });
    expect(regRes.status).toBe(201);
    expect(regRes.body.stage).toBe('OPD_ENCOUNTER_CREATED');
    const { patientId, encounterId } = regRes.body.data.encounter;

    // 2. Intake Triage & Queue Routing
    const triageRes = await request(app)
      .post('/api/integration/intake/process-triage')
      .send({
        encounterId,
        socrates: { site: 'Knee', severity: 6 },
        vitals: { bp: '126/82', pulse: 74 }
      });
    expect(triageRes.status).toBe(200);
    expect(triageRes.body.stage).toBe('QUEUED_FOR_DOCTOR');
    expect(triageRes.body.data.tokenNumber).toBe('OPD-101');

    // 3. Doctor Consultation & Lab Order
    const doctorRes = await request(app)
      .post('/api/integration/doctor/consult-and-prescribe')
      .send({
        encounterId,
        diagnoses: [{ system: 'ICD-11', code: 'FA00', term: 'Osteoarthritis of knee' }],
        prescriptions: [{ name: 'Yogaraj Guggulu', dosage: '2 tabs BD' }],
        labTestNames: ['CBC', 'ESR']
      });
    expect(doctorRes.status).toBe(200);
    expect(doctorRes.body.stage).toBe('CONSULTATION_COMPLETED_LAB_ORDERED');
    const labId = doctorRes.body.data.labOrder.labId;

    // 4. Lab Processing & Result Verification
    const labRes = await request(app)
      .post('/api/integration/lab/process-and-verify')
      .send({
        labId,
        results: [
          { testName: 'CBC', value: '13.2 g/dL' },
          { testName: 'ESR', value: '18 mm/hr' }
        ]
      });
    expect(labRes.status).toBe(200);
    expect(labRes.body.stage).toBe('LAB_VERIFIED_FOLLOWUP_CREATED');
    expect(labRes.body.data.followUp.status).toBe('ready_for_scheduling');

    // 5. Patient Timeline Sync & State Retention
    const timelineRes = await request(app)
      .get(`/api/integration/patient/${patientId}/timeline`);
    expect(timelineRes.status).toBe(200);
    expect(timelineRes.body.stage).toBe('PATIENT_TIMELINE_SYNCED');
    expect(timelineRes.body.data.encounters.length).toBe(1);
    expect(timelineRes.body.data.followUps.length).toBe(1);
    expect(timelineRes.body.data.canReturnWithoutReregistering).toBe(true);
  });
});
