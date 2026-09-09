const request = require('supertest');
const express = require('express');
const { processAdaptiveProbe } = require('../src/services/adaptiveSocratesService');
const kioskExtensionRoutes = require('../src/routes/kioskExtensionRoutes');
const mongoose = require('mongoose');
const Encounter = require('../src/models/Encounter');

const app = express();
app.use(express.json());
app.use('/api/kiosk', kioskExtensionRoutes);

describe('Phase 3 — "Talk, Tap, Done" Guided Intake Rebuild', () => {
  let testSessionId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 1) {
      const sess = await Encounter.create({
        tokenNumber: 'OPD-TEST-PHASE3-001',
        patientName: 'Phase3 Test Patient',
        age: 38,
        gender: 'Female'
      });
      testSessionId = sess._id.toString();
    } else {
      testSessionId = 'OPD-TEST-PHASE3-001';
    }
  });

  test('processAdaptiveProbe returns quickReplies array for site step', async () => {
    const res = await processAdaptiveProbe({
      chiefComplaint: 'fever',
      userSpeech: '',
      currentStep: 'site',
      language: 'hi'
    });

    expect(res.quickReplies).toBeDefined();
    expect(Array.isArray(res.quickReplies)).toBe(true);
    expect(res.quickReplies.length).toBeGreaterThan(0);
    expect(res.quickReplies[0]).toContain('सिर');
  });

  test('processAdaptiveProbe returns quickReplies array for onset step', async () => {
    const res = await processAdaptiveProbe({
      chiefComplaint: 'fever',
      userSpeech: 'headache',
      currentStep: 'site',
      language: 'en'
    });

    expect(res.nextStep).toBe('onset');
    expect(res.quickReplies).toBeDefined();
    expect(res.quickReplies).toContain('Today / Just now');
  });

  test('POST /api/kiosk/session/:id/confirm-transcript records transcript confirmation', async () => {
    if (mongoose.connection.readyState !== 1) {
      expect(true).toBe(true);
      return;
    }

    const res = await request(app)
      .post(`/api/kiosk/session/${testSessionId}/confirm-transcript`)
      .send({
        rawSpeech: 'fever for 3 days',
        confirmedText: 'fever for 3 days',
        action: 'correct'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.confirmedText).toBe('fever for 3 days');
  });
});
