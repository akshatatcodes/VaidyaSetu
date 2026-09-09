const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Import model and routes
const IntakeSession = require('../src/models/IntakeSession');
const kioskRoutes = require('../src/routes/kioskRoutes');
const kioskExtensionRoutes = require('../src/routes/kioskExtensionRoutes');
const { buildTokenPayload, parseTokenPayload } = require('../src/services/qrService');
const { JWT_SECRET } = require('../src/middleware/authMiddleware');

const app = express();
app.use(express.json());
app.use('/api/kiosk', kioskRoutes);
app.use('/api/kiosk', kioskExtensionRoutes);

describe('Phase 5: Secure QR Access-Request Model & Privacy Gate API', () => {
  let dbUri;
  let authToken;
  let testSession;
  const testAbha = '14-5544-3322-1100';

  beforeAll(async () => {
    // Issue doctor JWT authentication token
    authToken = jwt.sign({ id: 'doc-dr-vikram', role: 'doctor' }, JWT_SECRET, { expiresIn: '1h' });

    dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_qr_test';
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(dbUri);
      }
    } catch (err) {
      console.warn('MongoDB connection warning:', err.message);
    }

    // Create test intake session
    testSession = new IntakeSession({
      tokenNumber: 'OPD-20260909-999',
      abhaId: testAbha,
      patientName: 'Sunita Devi',
      age: 45,
      gender: 'Female',
      contactNumber: '9811002233',
      department: 'Kayachikitsa',
      chiefComplaint: 'Severe lower back stiffness and digestive sluggishness',
      consent: {
        dataCapture: true,
        documentStorage: true,
        doctorSharing: true,
        consentedAt: new Date()
      }
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

  test('1. buildTokenPayload creates opaque JSON string with ZERO clinical PII', () => {
    const payloadStr = buildTokenPayload({
      sessionId: testSession._id,
      tokenNumber: testSession.tokenNumber
    });

    expect(typeof payloadStr).toBe('string');
    const parsed = JSON.parse(payloadStr);

    // Verify key fields
    expect(parsed.t).toBe(testSession.tokenNumber);
    expect(parsed.s).toBe(String(testSession._id));
    expect(parsed.v).toBe(1);

    // Verify ZERO clinical PII leaks in raw payload string
    expect(payloadStr).not.toContain('Sunita Devi');
    expect(payloadStr).not.toContain('Severe lower back stiffness');
    expect(payloadStr).not.toContain('Kayachikitsa');
    expect(payloadStr).not.toContain('9811002233');
  });

  test('2. POST /api/kiosk/session/:id/generate-qr generates QR SVG data URI & slip HTML', async () => {
    const res = await request(app)
      .post(`/api/kiosk/session/${testSession._id}/generate-qr`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.qrSvgDataUri).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(res.body.data.slipHtml).toContain('OPD-20260909-999');
    expect(res.body.data.slipHtml).toContain('No clinical data on this slip');
  });

  test('3. POST /api/kiosk/scan-qr returns 401 Unauthorized without auth header', async () => {
    const payload = buildTokenPayload({
      sessionId: testSession._id,
      tokenNumber: testSession.tokenNumber
    });

    const res = await request(app)
      .post('/api/kiosk/scan-qr')
      .send({ payload });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Authentication token is required');
  });

  test('4. POST /api/kiosk/scan-qr with valid JWT resolves session and records qr_scan access log', async () => {
    const payload = buildTokenPayload({
      sessionId: testSession._id,
      tokenNumber: testSession.tokenNumber
    });

    const res = await request(app)
      .post('/api/kiosk/scan-qr')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ payload });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.tokenNumber).toBe(testSession.tokenNumber);
    expect(res.body.data.patientName).toBe('Sunita Devi');

    // Check accessLog entry
    const updated = await IntakeSession.findById(testSession._id);
    const lastLog = updated.accessLog[updated.accessLog.length - 1];
    expect(lastLog).toBeDefined();
    expect(lastLog.action).toBe('qr_scan');
    expect(lastLog.actorId).toBe('doc-dr-vikram');
    expect(lastLog.actorRole).toBe('doctor');
  });
});
