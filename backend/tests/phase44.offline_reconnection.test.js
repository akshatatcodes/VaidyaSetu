const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

const kioskRoutes = require('../src/routes/kioskRoutes');
const Encounter = require('../src/models/Encounter');

const app = express();
app.use(express.json());
app.use('/api/kiosk', kioskRoutes);

describe('Phase 44 — Offline Mode & Idempotent Reconnection Sync (§44)', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    await Encounter.deleteMany({});
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test('1. Initial kiosk intake session submission generates OPD token', async () => {
    const res = await request(app)
      .post('/api/kiosk/session/start')
      .set('X-Idempotency-Key', 'IDEMP-OFFLINE-TEST-9001')
      .send({
        patientName: 'Karan Mehra',
        age: 38,
        gender: 'Male',
        contactNumber: '+919999999999',
        department: 'Kayachikitsa'
      })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data.tokenNumber).toBeDefined();
    expect(res.body.data.idempotencyKey).toBe('IDEMP-OFFLINE-TEST-9001');
  });

  test('2. Reconnection retry with SAME idempotency key returns existing encounter without duplicating tokens (§44)', async () => {
    const res = await request(app)
      .post('/api/kiosk/session/start')
      .set('X-Idempotency-Key', 'IDEMP-OFFLINE-TEST-9001')
      .send({
        patientName: 'Karan Mehra',
        age: 38,
        gender: 'Male',
        contactNumber: '+919999999999',
        department: 'Kayachikitsa'
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.idempotent).toBe(true);
    expect(res.body.data.idempotencyKey).toBe('IDEMP-OFFLINE-TEST-9001');

    // Verify DB count remains exactly 1
    const count = await Encounter.countDocuments({ idempotencyKey: 'IDEMP-OFFLINE-TEST-9001' });
    expect(count).toBe(1);
  });
});
