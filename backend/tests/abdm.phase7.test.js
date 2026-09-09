const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Import model, routes, and adapter
const IntakeSession = require('../src/models/IntakeSession');
const kioskRoutes = require('../src/routes/kioskRoutes');
const kioskExtensionRoutes = require('../src/routes/kioskExtensionRoutes');
const abdmAdapter = require('../src/services/abdmAdapter');
const { JWT_SECRET } = require('../src/middleware/authMiddleware');

const app = express();
app.use(express.json());
app.use('/api/kiosk', kioskRoutes);
app.use('/api/kiosk', kioskExtensionRoutes);

describe('Phase 7: Honest ABDM Gateway & Sandbox Adapter API', () => {
  let dbUri;
  let doctorToken;
  let testSession;
  const testAbha = '14-3322-1100-9988';

  beforeAll(async () => {
    doctorToken = jwt.sign({ id: 'doc-dr-sharma', role: 'doctor' }, JWT_SECRET, { expiresIn: '1h' });

    dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_abdm_test';
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(dbUri);
      }
    } catch (err) {
      console.warn('MongoDB connection warning:', err.message);
    }

    testSession = new IntakeSession({
      tokenNumber: 'OPD-20260909-555',
      abhaId: testAbha,
      patientName: 'Ananya Roy',
      age: 29,
      gender: 'Female',
      contactNumber: '9876543210',
      department: 'Kayachikitsa',
      queueStatus: 'intake_completed',
      chiefComplaint: 'Acid reflux and bloating after meals'
    });
    await testSession.save();
  });

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await IntakeSession.deleteMany({ abhaId: testAbha });
        await mongoose.connection.close();
      }
    } catch (e) {}
  });

  test('1. abdmAdapter defaults mode to "simulated" unless ABDM_PROD=true', () => {
    delete process.env.ABDM_PROD;
    const mode = abdmAdapter.getAbdmMode();
    expect(mode).toBe('simulated');

    const bundle = abdmAdapter.sessionToFhirBundle(testSession);
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.mode).toBe('simulated');
    expect(bundle.meta.tag[0].code).toBe('simulated');
    expect(bundle.meta.tag[0].display).toContain('Simulated Sync Mode');
  });

  test('2. pushToHIS returns honest simulated status and transactionId', () => {
    const res = abdmAdapter.pushToHIS(testSession);
    expect(res.status).toBe('simulated');
    expect(res.mode).toBe('simulated');
    expect(res.transactionId).toMatch(/^TXN-SIMULATED-/);
    expect(res.careContextId).toBe(`CC-${testSession.tokenNumber}`);
    expect(res.message).toContain('simulated successfully');
  });

  test('3. POST /api/kiosk/session/:id/sync-abdm returns mode: "simulated" with doctor auth', async () => {
    const res = await request(app)
      .post(`/api/kiosk/session/${testSession._id}/sync-abdm`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.mode).toBe('simulated');
    expect(res.body.message).toContain('ABDM Sandbox / Simulated Mode');
    expect(res.body.data.mode).toBe('simulated');
    expect(res.body.data.transactionId).toBeDefined();

    const updated = await IntakeSession.findById(testSession._id);
    expect(updated.abdmSync.synced).toBe(true);
    expect(updated.abdmSync.mode).toBe('simulated');
  });
});
