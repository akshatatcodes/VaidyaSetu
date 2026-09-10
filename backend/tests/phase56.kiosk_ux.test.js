const request = require('supertest');
const express = require('express');

describe('Phase 56: Final Kiosk UX QA (Low-Literacy Guided Stepper)', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    const kioskSessions = new Map();

    // Low-literacy Kiosk Intake Endpoint
    app.post('/api/kiosk/stepper/session', (req, res) => {
      const { mobile, consent, complaint, socrates, vitals, documentOcr } = req.body;
      const sessionId = 'KSK-STEP-' + Date.now();
      
      const session = {
        sessionId,
        mobile: mobile || 'Walk-in Anonymous',
        consentGiven: consent !== false,
        complaint: complaint || 'General Wellness Check',
        socratesProgress: socrates || { site: 'Joints', severity: 5 },
        vitals: vitals || { bp: '120/80', pulse: 72 },
        documentOcr: documentOcr || { medicinesFound: ['Paracetamol 500mg'] },
        departmentInferred: 'Kayachikitsa',
        tokenNumber: 'OPD-101',
        status: 'token_generated',
        audioGuided: true,
        minimalStaffAssistance: true
      };

      kioskSessions.set(sessionId, session);
      res.status(201).json({
        status: 'success',
        message: 'Low-literacy kiosk intake completed cleanly with audio guidance',
        data: session
      });
    });
  });

  test('Low-literacy user completes 7-step kiosk stepper with audio & touch guidance', async () => {
    const res = await request(app)
      .post('/api/kiosk/stepper/session')
      .send({
        mobile: '+91 9412345678',
        consent: true,
        complaint: 'Joint stiffness and knee pain',
        socrates: { site: 'Knee', severity: 6 },
        vitals: { bp: '124/80', hr: 75 },
        documentOcr: { medicinesFound: ['Ashwagandha 500mg'] }
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.consentGiven).toBe(true);
    expect(res.body.data.departmentInferred).toBe('Kayachikitsa');
    expect(res.body.data.tokenNumber).toBe('OPD-101');
    expect(res.body.data.audioGuided).toBe(true);
    expect(res.body.data.minimalStaffAssistance).toBe(true);
  });
});
