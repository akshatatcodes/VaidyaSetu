const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

const documentRoutes = require('../src/routes/documentRoutes');
const Patient = require('../src/models/Patient');
const Document = require('../src/models/Document');
const OCRExtraction = require('../src/models/OCRExtraction');
const Encounter = require('../src/models/Encounter');
const LabResult = require('../src/models/LabResult');

const app = express();
app.use(express.json());
app.use('/api/documents', documentRoutes);

describe('Phase 4 — Document Intelligence Pipeline & Medical Timeline (§7, §8, §39, §40)', () => {
  let testPatientId;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test_phase4';
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
      await Document.deleteMany({});
      await OCRExtraction.deleteMany({});
      await Encounter.deleteMany({});
      await LabResult.deleteMany({});
      await mongoose.connection.close();
    }
  });

  describe('1. Document Upload & Evidence-Linked OCR Pipeline (§7, §8)', () => {
    let createdDocId;

    test('POST /api/documents/upload should create Document and OCRExtraction with evidence tags', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .send({
          patientId: testPatientId.toString(),
          type: 'prescription',
          title: 'OPD Prescription Scan',
          imageUrl: 'https://example.com/prescription.jpg'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.document).toBeDefined();
      expect(res.body.data.document.type).toBe('prescription');
      expect(res.body.data.document.verificationStatus).toBe('pending'); // Handwritten prescription defaults to pending
      expect(res.body.data.ocrExtraction).toBeDefined();
      expect(res.body.data.ocrExtraction.extractedFields[0].sourceDocName).toBe('OPD Prescription Scan');
      expect(res.body.data.ocrExtraction.extractedFields[0].confidence).toBeGreaterThan(0);

      createdDocId = res.body.data.document._id;
    });

    test('GET /api/documents/patient/:patientId should fetch uploaded documents', async () => {
      const res = await request(app)
        .get(`/api/documents/patient/${testPatientId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(1);
    });

    test('POST /api/documents/:documentId/verify should update verificationStatus (§39)', async () => {
      const res = await request(app)
        .post(`/api/documents/${createdDocId}/verify`)
        .send({ status: 'verified' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.verificationStatus).toBe('verified');
    });
  });

  describe('2. Medical Timeline Aggregation Endpoint (§40)', () => {
    beforeAll(async () => {
      // Create test Encounter and LabResult to verify chronological aggregation
      await Encounter.create({
        patientId: testPatientId,
        tokenNumber: 'OPD-TEST-101',
        type: 'opd',
        status: 'opened',
        openedAt: new Date(Date.now() - 3600000) // 1 hour ago
      });

      await LabResult.create({
        patientId: testPatientId,
        testName: 'Complete Blood Count (CBC)',
        parameters: [{ name: 'Hemoglobin', value: '12.5', unit: 'g/dL', referenceRange: '12-15' }],
        verifiedAt: new Date(Date.now() - 1800000) // 30 mins ago
      });
    });

    test('GET /api/documents/patient/:patientId/timeline should return chronologically ordered events', async () => {
      const res = await request(app)
        .get(`/api/documents/patient/${testPatientId}/timeline`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.count).toBeGreaterThanOrEqual(3); // 1 doc, 1 encounter, 1 lab result
      
      // Verify chronological sorting (newest first)
      const timeline = res.body.timeline;
      expect(new Date(timeline[0].timestamp).getTime()).toBeGreaterThanOrEqual(new Date(timeline[1].timestamp).getTime());
    });
  });
});
