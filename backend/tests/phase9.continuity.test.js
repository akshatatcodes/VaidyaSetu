const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

// Import routes & models
const continuityRoutes = require('../src/routes/continuityRoutes');
const documentRoutes = require('../src/routes/documentRoutes');
const Patient = require('../src/models/Patient');
const Encounter = require('../src/models/Encounter');
const InvestigationOrder = require('../src/models/InvestigationOrder');
const FollowUp = require('../src/models/FollowUp');
const Referral = require('../src/models/Referral');
const Department = require('../src/models/Department');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/continuity', continuityRoutes);
app.use('/api/documents', documentRoutes);

describe('Phase 9 — Continuity Engine Tests (Follow-up & Referral)', () => {
  let testPatient;
  let testEncounter;
  let testOrder1;
  let testOrder2;
  let testDept;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clear test collections
    await Patient.deleteMany({});
    await Encounter.deleteMany({});
    await InvestigationOrder.deleteMany({});
    await FollowUp.deleteMany({});
    await Referral.deleteMany({});

    // Create test Patient
    testPatient = await Patient.create({
      basicInfo: {
        fullName: 'Kavita Verma',
        dob: new Date('1990-08-20'),
        age: 36,
        gender: 'Female',
        contactNumber: '+919811223344'
      }
    });

    // Create test Encounter
    testEncounter = await Encounter.create({
      patientId: testPatient._id,
      tokenNumber: 'CONT-TKN-001',
      type: 'opd',
      status: 'lab_pending'
    });

    const dummyDocId = new mongoose.Types.ObjectId();

    // Create 2 linked InvestigationOrders for Linked Care Task test (§36)
    testOrder1 = await InvestigationOrder.create({
      encounterId: testEncounter._id,
      patientId: testPatient._id,
      doctorId: dummyDocId,
      testName: 'Complete Blood Count (CBC)',
      priority: 'routine',
      status: 'verified' // First test is verified
    });

    testOrder2 = await InvestigationOrder.create({
      encounterId: testEncounter._id,
      patientId: testPatient._id,
      doctorId: dummyDocId,
      testName: 'Thyroid Profile (T3, T4, TSH)',
      priority: 'routine',
      status: 'ordered' // Second test is pending
    });

    testDept = new mongoose.Types.ObjectId();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('1. Linked Care Task (§36): FollowUp stays in waiting_for_results while 1 test is pending', async () => {
    const res = await request(app)
      .post('/api/continuity/followups/trigger-lab-check')
      .send({
        encounterId: testEncounter._id.toString(),
        patientId: testPatient._id.toString()
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.status).toBe('waiting_for_results');
    expect(res.body.data.originEncounterId.toString()).toBe(testEncounter._id.toString());
  });

  test('2. Linked Care Task (§36): FollowUp becomes schedulable with time window once all tests are verified', async () => {
    // Verify second order
    testOrder2.status = 'verified';
    await testOrder2.save();

    const res = await request(app)
      .post('/api/continuity/followups/trigger-lab-check')
      .send({
        encounterId: testEncounter._id.toString(),
        patientId: testPatient._id.toString()
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.status).toBe('schedulable');
    expect(res.body.data.scheduledWindow).toHaveProperty('date');
    expect(res.body.data.scheduledWindow).toHaveProperty('startTime');
  });

  test('3. Next-Day Review (§35): Doctor schedules Next-Day review without requiring re-registration', async () => {
    const res = await request(app)
      .post('/api/continuity/followups/next-day')
      .send({
        encounterId: testEncounter._id.toString(),
        patientId: testPatient._id.toString(),
        reason: 'review',
        startTime: '10:00',
        endTime: '10:30'
      })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data.reason).toBe('review');
    expect(res.body.data.status).toBe('schedulable');
  });

  test('4. Referral Creation & Visibility (§38): Referral created and scoped to receiving department', async () => {
    const res = await request(app)
      .post('/api/continuity/referrals')
      .send({
        encounterId: testEncounter._id.toString(),
        patientId: testPatient._id.toString(),
        fromDoctorId: new mongoose.Types.ObjectId().toString(),
        toDepartmentId: testDept.toString(),
        referralScope: 'same_hospital',
        reason: 'Panchakarma Detox Consultation',
        priority: 'routine'
      })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data.qrPayload).toContain('REF-SAME_HOSPITAL-');

    // Fetch department scoped referrals
    const deptRes = await request(app)
      .get(`/api/continuity/referrals/department/${testDept.toString()}`)
      .expect(200);

    expect(deptRes.body.status).toBe('success');
    expect(deptRes.body.count).toBe(1);
    expect(deptRes.body.data[0].reason).toBe('Panchakarma Detox Consultation');
  });

  test('5. Medical Timeline Threading (§40): Timeline includes FollowUp and Referral events', async () => {
    const res = await request(app)
      .get(`/api/documents/patient/${testPatient._id.toString()}/timeline`)
      .expect(200);

    expect(res.body.status).toBe('success');
    const types = res.body.timeline.map(e => e.eventType);
    expect(types).toContain('encounter');
    expect(types).toContain('followup');
    expect(types).toContain('referral');
  });
});
