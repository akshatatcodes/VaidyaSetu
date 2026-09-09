const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

// Import routes & models
const labWorkflowRoutes = require('../src/routes/labWorkflowRoutes');
const Patient = require('../src/models/Patient');
const Encounter = require('../src/models/Encounter');
const InvestigationOrder = require('../src/models/InvestigationOrder');
const LabSample = require('../src/models/LabSample');
const LabResult = require('../src/models/LabResult');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/lab', labWorkflowRoutes);

describe('Phase 8 — Laboratory System Tests', () => {
  let testPatient;
  let testEncounter;
  let testOrder;
  let testSample;
  let testResultV1;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clear test collections
    await Patient.deleteMany({});
    await Encounter.deleteMany({});
    await InvestigationOrder.deleteMany({});
    await LabSample.deleteMany({});
    await LabResult.deleteMany({});

    // Create test Patient
    testPatient = await Patient.create({
      basicInfo: {
        fullName: 'Meera Sharma',
        dob: new Date('1988-04-12'),
        age: 38,
        gender: 'Female',
        contactNumber: '+919988776655'
      }
    });

    // Create test Encounter
    testEncounter = await Encounter.create({
      patientId: testPatient._id,
      tokenNumber: 'LAB-TKN-001',
      type: 'opd',
      status: 'opened'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('1. POST /api/lab/orders creates InvestigationOrder with QR payload', async () => {
    const res = await request(app)
      .post('/api/lab/orders')
      .send({
        encounterId: testEncounter._id.toString(),
        patientId: testPatient._id.toString(),
        testName: 'HbA1c Glycated Hemoglobin',
        priority: 'urgent'
      })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data.testName).toBe('HbA1c Glycated Hemoglobin');
    expect(res.body.data.status).toBe('ordered');
    expect(res.body.data.qrPayload).toContain('LAB-ORD-');

    testOrder = res.body.data;
  });

  test('2. POST /api/lab/samples/collect creates LabSample and updates order status to collected', async () => {
    const res = await request(app)
      .post('/api/lab/samples/collect')
      .send({
        investigationOrderId: testOrder._id,
        patientId: testPatient._id.toString(),
        collectedBy: 'Phlebotomist Rajesh'
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.sample.sampleId).toContain('SMP-');
    expect(res.body.data.order.status).toBe('collected');

    testSample = res.body.data.sample;
  });

  test('3. POST /api/lab/results/entry enters result value and updates order status to resulted', async () => {
    const res = await request(app)
      .post('/api/lab/results/entry')
      .send({
        investigationOrderId: testOrder._id,
        labSampleId: testSample._id,
        patientId: testPatient._id.toString(),
        testName: 'HbA1c Glycated Hemoglobin',
        resultValue: '8.4',
        unit: '%',
        referenceRange: '< 5.7%'
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.version).toBe(1);
    expect(res.body.data.resultValue).toBe('8.4');

    testResultV1 = res.body.data;
  });

  test('4. POST /api/lab/results/entry versioning check: amending result creates new version V2 referencing previousVersionId', async () => {
    const res = await request(app)
      .post('/api/lab/results/entry')
      .send({
        investigationOrderId: testOrder._id,
        labSampleId: testSample._id,
        patientId: testPatient._id.toString(),
        testName: 'HbA1c Glycated Hemoglobin',
        resultValue: '8.2',
        unit: '%',
        referenceRange: '< 5.7%'
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.version).toBe(2);
    expect(res.body.data.previousVersionId.toString()).toBe(testResultV1._id.toString());
    expect(res.body.data.originalValuePreserved).toBe(true);

    // Verify V1 still exists untouched in DB
    const v1Doc = await LabResult.findById(testResultV1._id);
    expect(v1Doc).not.toBeNull();
    expect(v1Doc.resultValue).toBe('8.4');
  });

  test('5. POST /api/lab/results/:resultId/verify verifies result and advances order status to verified', async () => {
    const res = await request(app)
      .post(`/api/lab/results/${testResultV1._id}/verify`)
      .send({ supervisorId: 'LAB-HEAD-01' })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.verifiedBy).toBe('LAB-HEAD-01');

    // Verify order status updated to verified in DB
    const orderDoc = await InvestigationOrder.findById(testOrder._id);
    expect(orderDoc.status).toBe('verified');
  });

  test('6. GET /api/lab/dashboard-counts returns §28 column statistics', async () => {
    const res = await request(app)
      .get('/api/lab/dashboard-counts')
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('todaysSamples');
    expect(res.body.data).toHaveProperty('pending');
    expect(res.body.data).toHaveProperty('completed');
    expect(res.body.data).toHaveProperty('verified');
  });
});
