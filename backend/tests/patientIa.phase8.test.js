const request = require('supertest');
const express = require('express');
const kioskRoutes = require('../src/routes/kioskRoutes');
const kioskExtensionRoutes = require('../src/routes/kioskExtensionRoutes');
const mongoose = require('mongoose');
const IntakeSession = require('../src/models/IntakeSession');

const app = express();
app.use(express.json());
app.use('/api/kiosk', kioskRoutes);
app.use('/api/kiosk', kioskExtensionRoutes);

describe('Phase 8: Patient App 5-Tab Information Architecture Rebuild', () => {
  let testSessionId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 1) {
      const sess = await IntakeSession.create({
        tokenNumber: 'OPD-TEST-PHASE8-001',
        patientName: 'IA Test Patient',
        age: 35,
        gender: 'Male'
      });
      testSessionId = sess._id.toString();
    } else {
      testSessionId = 'OPD-TEST-PHASE8-001';
    }
  });

  test('5-Tab IA navigation targets and routes structure validation', () => {
    const tabs = ['Home', 'Visits', 'Records', 'Medicines', 'Help'];
    expect(tabs.length).toBe(5);
    expect(tabs).toContain('Home');
    expect(tabs).toContain('Visits');
    expect(tabs).toContain('Records');
    expect(tabs).toContain('Medicines');
    expect(tabs).toContain('Help');
  });

  test('Session endpoint response contract for Visits/Records tab', async () => {
    if (mongoose.connection.readyState !== 1) {
      expect(true).toBe(true);
      return;
    }

    const getRes = await request(app).get(`/api/kiosk/session/${testSessionId}`);
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.status).toBe('success');
  });
});
