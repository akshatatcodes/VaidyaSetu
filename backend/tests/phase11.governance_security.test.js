const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

// Import routes & models
const governanceRoutes = require('../src/routes/governanceRoutes');
const Patient = require('../src/models/Patient');
const Encounter = require('../src/models/Encounter');
const History = require('../src/models/History');
const Vital = require('../src/models/Vital');
const LabResult = require('../src/models/LabResult');
const Document = require('../src/models/Document');
const AuditLog = require('../src/models/AuditLog');
const Consent = require('../src/models/Consent');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/governance', governanceRoutes);

describe('Phase 11 — Governance, Access Control & Auditability Tests', () => {
  let testPatient1;
  let testPatient2;
  let testEncounter1;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clear test collections
    await Patient.deleteMany({});
    await Encounter.deleteMany({});
    await History.deleteMany({});
    await Vital.deleteMany({});
    await LabResult.deleteMany({});
    await Document.deleteMany({});
    await AuditLog.deleteMany({});
    await Consent.deleteMany({});

    // Create test Patient 1 (has active encounter)
    testPatient1 = await Patient.create({
      basicInfo: {
        fullName: 'Suresh Kumar',
        dob: new Date('1978-05-12'),
        age: 48,
        gender: 'Male',
        contactNumber: '+919812345678'
      }
    });

    // Active encounter for Patient 1
    testEncounter1 = await Encounter.create({
      patientId: testPatient1._id,
      tokenNumber: 'GOV-TKN-001',
      type: 'opd',
      status: 'in_consultation'
    });

    // Create test Patient 2 (no active encounter and no consent)
    testPatient2 = await Patient.create({
      basicInfo: {
        fullName: 'Pooja Verma',
        dob: new Date('1992-11-04'),
        age: 34,
        gender: 'Female',
        contactNumber: '+919876543219'
      }
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('1. Purpose-based access control (§49): Granted for patient with assigned active encounter', async () => {
    const res = await request(app)
      .post('/api/governance/check-access')
      .send({
        doctorId: 'DOC-AYU-101',
        patientId: testPatient1._id.toString(),
        purpose: 'clinical_care'
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.accessGranted).toBe(true);
  });

  test('2. Purpose-based access control (§49): Denied 403 for doctor querying unassigned patient with no consent', async () => {
    const res = await request(app)
      .post('/api/governance/check-access')
      .send({
        doctorId: 'DOC-AYU-101',
        patientId: testPatient2._id.toString(),
        purpose: 'curiosity'
      })
      .expect(403);

    expect(res.body.status).toBe('denied');
    expect(res.body.message).toContain('Access Denied');
  });

  test('3. Audit Log verification (§50): Every check-access request produces a traceable AuditLog row', async () => {
    const res = await request(app)
      .get('/api/governance/audit-logs')
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.count).toBeGreaterThanOrEqual(2);
    expect(res.body.data[0]).toHaveProperty('actorId');
    expect(res.body.data[0]).toHaveProperty('action');
  });

  test('4. Cascading Delete (§51): Permanently purges Patient and all child records', async () => {
    // Add child records for Patient 1
    await History.create({ encounterId: testEncounter1._id, patientId: testPatient1._id, mode: 'modern' });
    await Vital.create({ encounterId: testEncounter1._id, patientId: testPatient1._id, type: 'heart_rate', value: 72, unit: 'bpm' });

    const deleteRes = await request(app)
      .delete(`/api/governance/patients/${testPatient1._id.toString()}/cascade-delete`)
      .expect(200);

    expect(deleteRes.body.status).toBe('success');
    expect(deleteRes.body.purgedSummary.patientDeleted).toBe(true);

    // Verify patient and children are gone from DB
    const p1 = await Patient.findById(testPatient1._id);
    expect(p1).toBeNull();

    const encs = await Encounter.find({ patientId: testPatient1._id });
    expect(encs.length).toBe(0);

    const hists = await History.find({ patientId: testPatient1._id });
    expect(hists.length).toBe(0);
  });
});
