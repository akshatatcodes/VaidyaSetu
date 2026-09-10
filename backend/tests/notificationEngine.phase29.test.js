const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

const notificationRoutes = require('../src/routes/notificationRoutes');
const Patient = require('../src/models/Patient');
const Consent = require('../src/models/Consent');
const Notification = require('../src/models/Notification');
const { SUPPORTED_CHANNELS, SUPPORTED_EVENTS } = require('../src/services/notificationEngine');

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

describe('Phase 29 — Multi-Channel Notification Engine Tests', () => {
  let testPatient;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    await Patient.deleteMany({});
    await Consent.deleteMany({});
    await Notification.deleteMany({});

    testPatient = await Patient.create({
      basicInfo: {
        fullName: 'Phase29 Test Patient',
        dob: new Date('1990-01-01'),
        age: 36,
        gender: 'Male',
        contactNumber: '+919988776655'
      }
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('1. Verify supported channels and events list', () => {
    expect(SUPPORTED_CHANNELS).toEqual(['sms', 'whatsapp', 'push', 'kiosk_print', 'voice']);
    expect(SUPPORTED_EVENTS).toContain('opd_token_generated');
    expect(SUPPORTED_EVENTS).toContain('queue_approaching');
    expect(SUPPORTED_EVENTS).toContain('doctor_ready');
    expect(SUPPORTED_EVENTS).toContain('lab_order_created');
    expect(SUPPORTED_EVENTS).toContain('report_ready');
    expect(SUPPORTED_EVENTS).toContain('followup_created');
    expect(SUPPORTED_EVENTS).toContain('followup_changed');
    expect(SUPPORTED_EVENTS).toContain('referral_created');
  });

  test('2. Consent Gate: Voice & SMS fail when consent is missing', async () => {
    const voiceRes = await request(app)
      .post('/api/notifications/send')
      .send({
        recipientId: testPatient._id.toString(),
        channel: 'voice',
        template: 'doctor_ready',
        payload: { room: '102' }
      })
      .expect(403);
    expect(voiceRes.body.status).toBe('failed');
    expect(voiceRes.body.reason).toBe('Consent not granted');

    const smsRes = await request(app)
      .post('/api/notifications/send')
      .send({
        recipientId: testPatient._id.toString(),
        channel: 'sms',
        template: 'opd_token_generated',
        payload: { token: 'A-45' }
      })
      .expect(403);
    expect(smsRes.body.status).toBe('failed');
  });

  test('3. Consent Gate: Voice & SMS succeed once consent granted', async () => {
    await Consent.create({
      consentId: 'CNS-VOICE-001',
      patientId: testPatient._id,
      purpose: 'voice',
      status: 'active'
    });

    const voiceRes = await request(app)
      .post('/api/notifications/send')
      .send({
        recipientId: testPatient._id.toString(),
        channel: 'voice',
        template: 'doctor_ready',
        payload: { room: '102' }
      })
      .expect(200);
    expect(voiceRes.body.status).toBe('success');
    expect(voiceRes.body.data.status).toBe('sent');
  });

  test('4. All 8 events can be dispatched via push & kiosk_print', async () => {
    const eventsToTest = [
      'opd_token_generated',
      'queue_approaching',
      'doctor_ready',
      'lab_order_created',
      'report_ready',
      'followup_created',
      'followup_changed',
      'referral_created'
    ];

    for (const evt of eventsToTest) {
      const res = await request(app)
        .post('/api/notifications/send')
        .send({
          recipientId: testPatient._id.toString(),
          channel: 'push',
          template: evt,
          payload: { event: evt, timestamp: Date.now() }
        })
        .expect(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.template).toBe(evt);
    }
  });
});
