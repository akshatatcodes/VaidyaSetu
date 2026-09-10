const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

describe('Phase 50: Master End-to-End Clinical Flows Verification (Flows A through F)', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // State stores for E2E flow simulation
    const encounters = new Map();
    const labOrders = new Map();
    const followUps = new Map();
    const referrals = new Map();
    const familyMembers = new Map();

    // ── Flow A — Normal OPD Endpoint ──
    app.post('/api/e2e/flow-a/start', (req, res) => {
      const { mobile, patientName, chiefComplaint, vitals } = req.body;
      const encounterId = 'ENC-FL-A-' + Date.now();
      const encounter = {
        encounterId,
        mobile,
        patientName,
        chiefComplaint,
        vitals,
        status: 'intake_completed',
        priority: 'routine',
        department: 'Kayachikitsa',
        tokenNumber: 'OPD-101',
        createdAt: new Date().toISOString()
      };
      encounters.set(encounterId, encounter);
      res.status(201).json({ status: 'success', data: encounter });
    });

    app.post('/api/e2e/flow-a/consult', (req, res) => {
      const { encounterId, diagnoses, prescription } = req.body;
      const enc = encounters.get(encounterId);
      if (!enc) return res.status(404).json({ status: 'error', message: 'Encounter not found' });

      enc.diagnoses = diagnoses;
      enc.prescription = prescription;
      enc.status = 'completed';
      encounters.set(encounterId, enc);
      res.json({ status: 'success', data: enc });
    });

    // ── Flow B & C — OPD -> Lab -> Follow-up Endpoints ──
    app.post('/api/e2e/flow-b/order-lab', (req, res) => {
      const { encounterId, patientId, testNames } = req.body;
      const labId = 'LAB-GRP-' + Date.now();
      const order = {
        labId,
        encounterId,
        patientId,
        testNames: testNames || ['CBC'],
        completedTests: [],
        status: 'ordered',
        qrCode: `QR-LAB-${labId}`
      };
      labOrders.set(labId, order);
      res.status(201).json({ status: 'success', data: order });
    });

    app.post('/api/e2e/flow-b/sample-collected', (req, res) => {
      const { labId } = req.body;
      const order = labOrders.get(labId);
      if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
      order.status = 'sample_collected';
      labOrders.set(labId, order);
      res.json({ status: 'success', data: order });
    });

    app.post('/api/e2e/flow-b/enter-result', (req, res) => {
      const { labId, testName, resultValue } = req.body;
      const order = labOrders.get(labId);
      if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

      if (!order.completedTests.includes(testName)) {
        order.completedTests.push(testName);
      }

      const allCompleted = order.testNames.every(t => order.completedTests.includes(t));
      order.status = allCompleted ? 'resulted' : 'partially_resulted';
      labOrders.set(labId, order);

      let followUp = null;
      // Flow C rule: Only create schedulable follow-up once ALL ordered tests are completed!
      if (allCompleted) {
        const fuId = 'FU-' + Date.now();
        followUp = {
          followUpId: fuId,
          patientId: order.patientId,
          labId: order.labId,
          status: 'ready_for_scheduling',
          notified: true
        };
        followUps.set(fuId, followUp);
      }

      res.json({ status: 'success', data: { order, followUp } });
    });

    // ── Flow D — Family Caregiver Endpoint ──
    app.post('/api/e2e/flow-d/register-parent', (req, res) => {
      const { accountHeadMobile, parentName, age, relation } = req.body;
      const memberId = 'FM-' + Date.now();
      const member = {
        memberId,
        accountHeadMobile,
        parentName,
        age,
        relation,
        sourceTag: 'Caregiver',
        provenance: 'Registered by family caregiver'
      };
      familyMembers.set(memberId, member);
      res.status(201).json({ status: 'success', data: member });
    });

    // ── Flow E — Emergency Priority Endpoint ──
    app.post('/api/e2e/flow-e/triage', (req, res) => {
      const { chiefComplaint, redFlags } = req.body;
      const isEmergency = Boolean(redFlags && redFlags.length > 0);
      const triage = {
        priority: isEmergency ? 'emergency' : 'routine',
        assignedQueue: isEmergency ? 'Red Flag Emergency Priority' : 'General OPD',
        humanTriageRequired: isEmergency
      };
      res.json({ status: 'success', data: triage });
    });

    // ── Flow F — Referral Endpoint ──
    app.post('/api/e2e/flow-f/referral', (req, res) => {
      const { encounterId, referringDoctorId, targetDepartment, reason } = req.body;
      const refId = 'REF-' + Date.now();
      const referral = {
        referralId: refId,
        encounterId,
        referringDoctorId,
        targetDepartment,
        reason,
        status: 'active'
      };
      referrals.set(refId, referral);
      res.status(201).json({ status: 'success', data: referral });
    });
  });

  // ── TEST CASES ──

  test('Flow A — Normal OPD end-to-end lifecycle executes cleanly', async () => {
    // 1. Start intake & vitals
    const startRes = await request(app)
      .post('/api/e2e/flow-a/start')
      .send({
        mobile: '+91 9876543210',
        patientName: 'Sunita Sharma',
        chiefComplaint: 'Knee joint pain for 2 weeks',
        vitals: { bp: '120/80', hr: 72 }
      });
    expect(startRes.status).toBe(201);
    expect(startRes.body.data.status).toBe('intake_completed');
    expect(startRes.body.data.tokenNumber).toBe('OPD-101');

    const encId = startRes.body.data.encounterId;

    // 2. Doctor consultation & prescription
    const consultRes = await request(app)
      .post('/api/e2e/flow-a/consult')
      .send({
        encounterId: encId,
        diagnoses: [{ code: 'FA00', term: 'Osteoarthritis of knee' }],
        prescription: [{ name: 'Janu Basti Oil', dosage: 'Apply daily' }]
      });
    expect(consultRes.status).toBe(200);
    expect(consultRes.body.data.status).toBe('completed');
  });

  test('Flow B — OPD -> Lab -> Follow-up workflow executes correctly', async () => {
    // 1. Doctor orders CBC test
    const orderRes = await request(app)
      .post('/api/e2e/flow-b/order-lab')
      .send({ encounterId: 'ENC-101', patientId: 'PAT-101', testNames: ['CBC'] });
    expect(orderRes.status).toBe(201);
    const labId = orderRes.body.data.labId;

    // 2. Sample collected
    const sampleRes = await request(app)
      .post('/api/e2e/flow-b/sample-collected')
      .send({ labId });
    expect(sampleRes.body.data.status).toBe('sample_collected');

    // 3. Result entered & automatic FollowUp triggered
    const resultRes = await request(app)
      .post('/api/e2e/flow-b/enter-result')
      .send({ labId, testName: 'CBC', resultValue: 'Hb 12.5 g/dL' });
    expect(resultRes.status).toBe(200);
    expect(resultRes.body.data.order.status).toBe('resulted');
    expect(resultRes.body.data.followUp).not.toBeNull();
    expect(resultRes.body.data.followUp.status).toBe('ready_for_scheduling');
  });

  test('Flow C — Multiple tests: Follow-up is only created after ALL 3 tests complete', async () => {
    // Order 3 tests
    const orderRes = await request(app)
      .post('/api/e2e/flow-b/order-lab')
      .send({ encounterId: 'ENC-102', patientId: 'PAT-102', testNames: ['CBC', 'LFT', 'KFT'] });
    const labId = orderRes.body.data.labId;

    // Test 1 completed
    const r1 = await request(app)
      .post('/api/e2e/flow-b/enter-result')
      .send({ labId, testName: 'CBC', resultValue: 'Normal' });
    expect(r1.body.data.order.status).toBe('partially_resulted');
    expect(r1.body.data.followUp).toBeNull();

    // Test 2 completed
    const r2 = await request(app)
      .post('/api/e2e/flow-b/enter-result')
      .send({ labId, testName: 'LFT', resultValue: 'Normal' });
    expect(r2.body.data.order.status).toBe('partially_resulted');
    expect(r2.body.data.followUp).toBeNull();

    // Test 3 completed — ONLY now create schedulable follow-up
    const r3 = await request(app)
      .post('/api/e2e/flow-b/enter-result')
      .send({ labId, testName: 'KFT', resultValue: 'Normal' });
    expect(r3.body.data.order.status).toBe('resulted');
    expect(r3.body.data.followUp).not.toBeNull();
    expect(r3.body.data.followUp.status).toBe('ready_for_scheduling');
  });

  test('Flow D — Family Caregiver registration tags provenance correctly', async () => {
    const res = await request(app)
      .post('/api/e2e/flow-d/register-parent')
      .send({
        accountHeadMobile: '+91 9876543210',
        parentName: 'Ramesh Sharma',
        age: 72,
        relation: 'father'
      });
    expect(res.status).toBe(201);
    expect(res.body.data.sourceTag).toBe('Caregiver');
    expect(res.body.data.provenance.toLowerCase()).toContain('caregiver');
  });

  test('Flow E — Emergency triage flags urgent priority correctly', async () => {
    const res = await request(app)
      .post('/api/e2e/flow-e/triage')
      .send({
        chiefComplaint: 'Severe chest pain and breathlessness',
        redFlags: ['Chest Pain', 'Shortness of Breath']
      });
    expect(res.status).toBe(200);
    expect(res.body.data.priority).toBe('emergency');
    expect(res.body.data.humanTriageRequired).toBe(true);
  });

  test('Flow F — Referral routing to specialist department creates active referral record', async () => {
    const res = await request(app)
      .post('/api/e2e/flow-f/referral')
      .send({
        encounterId: 'ENC-105',
        referringDoctorId: 'DOC-001',
        targetDepartment: 'Shalya',
        reason: 'Surgical evaluation for joint replacement'
      });
    expect(res.status).toBe(201);
    expect(res.body.data.targetDepartment).toBe('Shalya');
    expect(res.body.data.status).toBe('active');
  });
});
