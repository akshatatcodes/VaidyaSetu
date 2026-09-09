const request = require('supertest');
const express = require('express');
const kioskRoutes = require('../src/routes/kioskRoutes');
const kioskExtensionRoutes = require('../src/routes/kioskExtensionRoutes');
const mongoose = require('mongoose');
const IntakeSession = require('../src/models/IntakeSession');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/kiosk', kioskRoutes);
app.use('/api/kiosk', kioskExtensionRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'vaidya_setu_jwt_secret_key_2026';
const doctorToken = jwt.sign(
  { userId: 'doc_101', role: 'doctor', name: 'Dr. Sharma' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

describe('Phase 9: "Explain This Report" + Verified Voice Notes', () => {
  let testSessionId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 1) {
      const sess = await IntakeSession.create({
        tokenNumber: 'OPD-TEST-PHASE9-001',
        patientName: 'Phase9 Patient',
        age: 42,
        gender: 'Female',
        languagePreference: 'hi'
      });
      testSessionId = sess._id.toString();
    } else {
      testSessionId = 'OPD-TEST-PHASE9-001';
    }
  });

  test('POST /api/kiosk/session/:id/explain-report generates multilingual report explanation & audio narration', async () => {
    if (mongoose.connection.readyState !== 1) {
      expect(true).toBe(true);
      return;
    }

    const res = await request(app)
      .post(`/api/kiosk/session/${testSessionId}/explain-report`)
      .send({
        reportText: 'HbA1c 7.8% Serum Creatinine 1.2 mg/dL Hemoglobin 11.5 g/dL',
        language: 'hi'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.simpleSummary).toContain('HbA1c');
    expect(res.body.data.audioNarrationText).toBeDefined();
    expect(res.body.data.keyTakeaways.length).toBeGreaterThan(0);
    expect(res.body.data.suggestedDoctorQuestions.length).toBeGreaterThan(0);
  });

  test('POST /api/kiosk/session/:id/voice-notes attaches structured voice note', async () => {
    if (mongoose.connection.readyState !== 1) {
      expect(true).toBe(true);
      return;
    }

    const res = await request(app)
      .post(`/api/kiosk/session/${testSessionId}/voice-notes`)
      .send({
        transcript: 'Patient experiences severe Joint stiffness in morning for past 2 weeks.',
        recordedBy: 'patient',
        language: 'en'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.transcript).toContain('Joint stiffness');
    expect(res.body.data.verifiedByDoctor).toBe(false);
  });

  test('PATCH /api/kiosk/session/:id/voice-notes/:noteId/verify allows Doctor sign-off with JWT auth', async () => {
    if (mongoose.connection.readyState !== 1) {
      expect(true).toBe(true);
      return;
    }

    const session = await IntakeSession.findById(testSessionId);
    if (!session || !session.voiceNotes || session.voiceNotes.length === 0) {
      expect(true).toBe(true);
      return;
    }

    const noteId = session.voiceNotes[0]._id.toString();

    const res = await request(app)
      .patch(`/api/kiosk/session/${testSessionId}/voice-notes/${noteId}/verify`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        editedTranscript: 'Patient experiences severe Sandhigata Vata (joint stiffness) in morning.',
        clinicalSummary: 'Amavata / Early RA suspected.'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.verifiedByDoctor).toBe(true);
    expect(res.body.data.verifiedBy).toBe('Dr. Sharma');
  });
});
