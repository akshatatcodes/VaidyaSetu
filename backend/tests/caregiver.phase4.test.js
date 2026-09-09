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

describe('Phase 4: Caregiver Mode & Auth Gated Records API', () => {
  let dbUri;
  let authToken;
  let testSessionId;
  const testAbha = '14-9988-7766-5544';
  const caregiverMobile = '9876543210';

  beforeAll(async () => {
    // Generate valid JWT auth token for testing protected endpoints
    authToken = jwt.sign({ id: 'test-user-123', role: 'patient' }, JWT_SECRET, { expiresIn: '1h' });

    // Connect to in-memory or fallback MongoDB connection for tests
    dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_caregiver_test';
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(dbUri);
      }
    } catch (err) {
      console.warn('MongoDB connection warning:', err.message);
    }
  });

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await Encounter.deleteMany({ abhaId: testAbha });
        await mongoose.connection.close();
      }
    } catch (e) {}
  });

  test('1. POST /api/kiosk/session/start initializes session with enteredBy caregiver metadata', async () => {
    const res = await request(app)
      .post('/api/kiosk/session/start')
      .send({
        abhaId: testAbha,
        patientName: 'Master Aarav Sharma',
        age: 8,
        gender: 'Male',
        contactNumber: '9988776655',
        enteredBy: {
          type: 'caregiver',
          caregiverName: 'Suman Sharma',
          relation: 'Parent',
          caregiverMobile: caregiverMobile
        },
        languagePreference: 'hi',
        department: 'Kaumarbhritya'
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.enteredBy).toBeDefined();
    expect(res.body.data.enteredBy.type).toBe('caregiver');
    expect(res.body.data.enteredBy.caregiverName).toBe('Suman Sharma');
    expect(res.body.data.enteredBy.relation).toBe('Parent');
    expect(res.body.data.enteredBy.caregiverMobile).toBe(caregiverMobile);

    testSessionId = res.body.data._id;
  });

  test('2. POST /api/kiosk/caregiver/link requires authentication token (401 without auth)', async () => {
    const res = await request(app)
      .post('/api/kiosk/caregiver/link')
      .send({
        abhaId: testAbha,
        caregiverMobile: caregiverMobile,
        caregiverName: 'Suman Sharma',
        relation: 'Parent'
      });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Authentication token is required');
  });

  test('3. POST /api/kiosk/caregiver/link successfully links caregiver with valid JWT', async () => {
    const res = await request(app)
      .post('/api/kiosk/caregiver/link')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        abhaId: testAbha,
        caregiverMobile: caregiverMobile,
        caregiverName: 'Suman Sharma',
        relation: 'Parent'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.caregiverMobile).toBe(caregiverMobile);
    expect(res.body.data.linkedPatients).toHaveLength(1);
    expect(res.body.data.linkedPatients[0].patientName).toBe('Master Aarav Sharma');
  });

  test('4. GET /api/kiosk/caregiver/:mobile/patients requires auth & returns linked patients list', async () => {
    // Unauthenticated call -> 401
    const unauthRes = await request(app)
      .get(`/api/kiosk/caregiver/${caregiverMobile}/patients`);
    expect(unauthRes.status).toBe(401);

    // Authenticated call -> 200
    const res = await request(app)
      .get(`/api/kiosk/caregiver/${caregiverMobile}/patients`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const patient = res.body.data.find(p => p.abhaId === testAbha);
    expect(patient).toBeDefined();
    expect(patient.patientName).toBe('Master Aarav Sharma');
    expect(patient.relation).toBe('Parent');
  });
});
