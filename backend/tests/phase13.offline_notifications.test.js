const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

// Import routes & models
const notificationRoutes = require('../src/routes/notificationRoutes');
const Patient = require('../src/models/Patient');
const Consent = require('../src/models/Consent');
const Notification = require('../src/models/Notification');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

describe('Phase 13 — Offline Mode & Notifications Tests', () => {
  let testPatient;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clear test collections
    await Patient.deleteMany({});
    await Consent.deleteMany({});
    await Notification.deleteMany({});

    // Create test Patient
    testPatient = await Patient.create({
      basicInfo: {
        fullName: 'Sunita Patel',
        dob: new Date('1985-02-14'),
        age: 41,
        gender: 'Female',
        contactNumber: '+919899887766'
      }
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('1. Consent Gate (§56): Rejects WhatsApp notification when patient has not granted consent', async () => {
    const res = await request(app)
      .post('/api/notifications/send')
      .send({
        recipientId: testPatient._id.toString(),
        channel: 'whatsapp',
        template: 'report_ready',
        payload: { tokenNumber: 'OPD-101' }
      })
      .expect(403);

    expect(res.body.status).toBe('failed');
    expect(res.body.reason).toBe('Consent not granted');
  });

  test('2. Consent Gate (§56): Dispatches WhatsApp notification successfully once consent is granted', async () => {
    // Grant WhatsApp consent
    await Consent.create({
      consentId: 'CNS-WA-001',
      patientId: testPatient._id,
      purpose: 'whatsapp',
      status: 'active'
    });

    const res = await request(app)
      .post('/api/notifications/send')
      .send({
        recipientId: testPatient._id.toString(),
        channel: 'whatsapp',
        template: 'report_ready',
        payload: { tokenNumber: 'OPD-101' }
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.status).toBe('sent');
  });

  test('3. Multi-Channel Support (§56): Dispatches push and kiosk_print notifications without requiring SMS consent', async () => {
    const res = await request(app)
      .post('/api/notifications/send')
      .send({
        recipientId: testPatient._id.toString(),
        channel: 'kiosk_print',
        template: 'proceed_to_room',
        payload: { roomNumber: '104' }
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.channel).toBe('kiosk_print');
  });

  test('4. Offline Kiosk Reconnect (§55): Syncs queued items, but rejects caching ABDM health data offline', async () => {
    // Test ABDM offline rejection rule (§55)
    const abdmSyncRes = await request(app)
      .post('/api/notifications/kiosk-offline-sync')
      .send({
        queuedItems: [{ isAbdm: true, url: '/api/abha/verify' }]
      })
      .expect(400);

    expect(abdmSyncRes.body.status).toBe('error');
    expect(abdmSyncRes.body.message).toContain('ABDM / external health-record data cannot be cached');

    // Test valid offline queue sync
    const validSyncRes = await request(app)
      .post('/api/notifications/kiosk-offline-sync')
      .send({
        queuedItems: [{ method: 'post', url: '/api/encounters/intake', data: { patientName: 'Sunita' } }]
      })
      .expect(200);

    expect(validSyncRes.body.status).toBe('success');
    expect(validSyncRes.body.syncedCount).toBe(1);
  });
});
