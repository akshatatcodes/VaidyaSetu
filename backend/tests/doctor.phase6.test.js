const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Import model and routes
const Encounter = require('../src/models/Encounter');
const kioskRoutes = require('../src/routes/kioskRoutes');
const kioskExtensionRoutes = require('../src/routes/kioskExtensionRoutes');
const { JWT_SECRET } = require('../src/middleware/authMiddleware');

const app = express();
app.use(express.json());
app.use('/api/kiosk', kioskRoutes);
app.use('/api/kiosk', kioskExtensionRoutes);

describe('Phase 6: Doctor One-Screen Cockpit & Physician Sign-Off API', () => {
  let dbUri;
  let doctorToken;
  let patientToken;
  let testSession;
  const testAbha = '14-7766-5544-3322';

  beforeAll(async () => {
    // Generate doctor & patient tokens
    doctorToken = jwt.sign({ id: 'doc-dr-sharma', role: 'doctor' }, JWT_SECRET, { expiresIn: '1h' });
    patientToken = jwt.sign({ id: 'pat-123', role: 'patient' }, JWT_SECRET, { expiresIn: '1h' });

    dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_doctor_test';
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(dbUri);
      }
    } catch (err) {
      console.warn('MongoDB connection warning:', err.message);
    }

    testSession = new Encounter({
      tokenNumber: 'OPD-20260909-777',
      abhaId: testAbha,
      patientName: 'Master Devansh Sharma',
      age: 12,
      gender: 'Male',
      contactNumber: '9876500112',
      department: 'Kaumarbhritya',
      queueStatus: 'intake_completed',
      triagePriority: 'normal',
      chiefComplaint: 'Recurrent wheezing and cough worse at night',
      evidenceSnippets: [
        { item: 'Salbutamol Inhaler 100mcg', sourceDocName: 'Prescription_Sep2025.jpg', confidence: 95, verified: false }
      ],
      allergies: ['Dust Mites']
    });
    await testSession.save();
  });

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await Encounter.deleteMany({ abhaId: testAbha });
        await mongoose.connection.close();
      }
    } catch (e) {}
  });

  test('1. GET /api/kiosk/queue retrieves active OPD queue list', async () => {
    const res = await request(app).get('/api/kiosk/queue');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.stats).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('2. PATCH /api/kiosk/session/:id/doctor-verify requires authentication (401 without auth)', async () => {
    const res = await request(app)
      .patch(`/api/kiosk/session/${testSession._id}/doctor-verify`)
      .send({ doctorNotes: 'Patient evaluated.' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Authentication token is required');
  });

  test('3. PATCH /api/kiosk/session/:id/doctor-verify updates doctor notes, evidence, triage & lab orders', async () => {
    const res = await request(app)
      .patch(`/api/kiosk/session/${testSession._id}/doctor-verify`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        doctorId: 'DOC-AYU-8891',
        doctorName: 'Dr. Vikramaditya Sharma',
        doctorNotes: 'Child examined. Lungs clear with mild expiratory rhonchi.',
        triagePriority: 'urgent',
        evidenceActions: [{ index: 0, action: 'accept' }],
        labOrders: [{ testName: 'Absolute Eosinophil Count (AEC)', urgency: 'routine' }]
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.triagePriority).toBe('urgent');
    expect(res.body.data.doctorReview.doctorNotes).toBe('Child examined. Lungs clear with mild expiratory rhonchi.');
    expect(res.body.data.evidenceSnippets[0].verified).toBe(true);
    expect(res.body.data.labOrders).toHaveLength(1);
    expect(res.body.data.labOrders[0].testName).toBe('Absolute Eosinophil Count (AEC)');
  });

  test('4. POST /api/kiosk/session/:id/approve digitally signs and completes consultation', async () => {
    const res = await request(app)
      .post(`/api/kiosk/session/${testSession._id}/approve`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        doctorId: 'DOC-AYU-8891',
        doctorName: 'Dr. Vikramaditya Sharma',
        signature: 'Digitally Signed via VaidyaSetu PKI',
        prescribedAyurvedicMeds: [
          { name: 'Kanthakari Avaleha', dosage: '5g BD', frequency: 'BD', duration: '14 days', anupana: 'Warm Water' }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.queueStatus).toBe('completed');
    expect(res.body.data.doctorReview.approved).toBe(true);
    expect(res.body.data.doctorReview.signature).toContain('Digitally Signed');
  });
});
