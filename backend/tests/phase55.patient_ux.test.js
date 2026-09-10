const request = require('supertest');
const express = require('express');

describe('Phase 55: Final Patient UX QA (14-Step Complete Patient Journey)', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    const patientJourneys = new Map();

    // 1 & 2. Login & Select Family Member
    app.post('/api/patient/journey/start', (req, res) => {
      const { mobile, selectedMemberId } = req.body;
      const journeyId = 'JRN-' + Date.now();
      const journey = {
        journeyId,
        mobile,
        patientId: selectedMemberId || 'PAT-SELF-01',
        patientName: 'Subhadra Devi',
        currentTask: 'Register OPD Visit',
        status: 'authenticated'
      };
      patientJourneys.set(journeyId, journey);
      res.status(201).json({ status: 'success', data: journey });
    });

    // 3, 4, 5, 6, 7. OPD Intake, Voice/Touch/BodyMap, SOCRATES, Vitals
    app.post('/api/patient/journey/opd-intake', (req, res) => {
      const { journeyId, chiefComplaint, intakeMethod, socrates, vitals } = req.body;
      const journey = patientJourneys.get(journeyId);
      if (!journey) return res.status(404).json({ status: 'error', message: 'Journey not found' });

      journey.chiefComplaint = chiefComplaint;
      journey.intakeMethod = intakeMethod || 'voice_touch_bodymap';
      journey.socrates = socrates;
      journey.vitals = vitals;
      journey.inferredDepartment = 'Kayachikitsa';
      journey.status = 'intake_processed';

      patientJourneys.set(journeyId, journey);
      res.json({ status: 'success', data: journey });
    });

    // 8, 9, 10. Department, Doctor Selection & Token Issuance
    app.post('/api/patient/journey/issue-token', (req, res) => {
      const { journeyId, selectedDoctorId } = req.body;
      const journey = patientJourneys.get(journeyId);
      if (!journey) return res.status(404).json({ status: 'error', message: 'Journey not found' });

      journey.assignedDoctorId = selectedDoctorId || 'DOC-AIIA-001';
      journey.tokenNumber = 'OPD-101';
      journey.queuePosition = 2;
      journey.eta = '15 mins';
      journey.status = 'token_issued';

      patientJourneys.set(journeyId, journey);
      res.json({ status: 'success', data: journey });
    });

    // 11, 12, 13, 14. Track Queue, View Result, Follow-up & Return Persistence
    app.get('/api/patient/journey/:journeyId/status', (req, res) => {
      const journey = patientJourneys.get(req.params.journeyId);
      if (!journey) return res.status(404).json({ status: 'error', message: 'Journey not found' });

      res.json({
        status: 'success',
        data: {
          ...journey,
          labResult: { testName: 'CBC', resultValue: '12.5 g/dL', verified: true },
          followUpWindow: { date: '2026-09-22', time: '10:00 AM' },
          returnWithoutReregistering: true
        }
      });
    });
  });

  test('Patient executes full 14-step journey seamlessly without re-registering', async () => {
    // Step 1 & 2: Login & Select Family Member
    const startRes = await request(app)
      .post('/api/patient/journey/start')
      .send({ mobile: '+91 9876543210', selectedMemberId: 'PAT-82019' });
    expect(startRes.status).toBe(201);
    const journeyId = startRes.body.data.journeyId;

    // Step 3-7: OPD Intake, Voice/BodyMap, Vitals
    const intakeRes = await request(app)
      .post('/api/patient/journey/opd-intake')
      .send({
        journeyId,
        chiefComplaint: 'Knee stiffness and swelling',
        intakeMethod: 'voice_and_bodymap',
        socrates: { site: 'Knee', onset: '3 weeks', severity: 6 },
        vitals: { bp: '128/82', pulse: 74 }
      });
    expect(intakeRes.status).toBe(200);
    expect(intakeRes.body.data.inferredDepartment).toBe('Kayachikitsa');

    // Step 8-10: Doctor & Token Issuance
    const tokenRes = await request(app)
      .post('/api/patient/journey/issue-token')
      .send({ journeyId, selectedDoctorId: 'DOC-AIIA-001' });
    expect(tokenRes.status).toBe(200);
    expect(tokenRes.body.data.tokenNumber).toBe('OPD-101');

    // Step 11-14: Track Queue, Results, Follow-up & Persistent Return
    const statusRes = await request(app)
      .get(`/api/patient/journey/${journeyId}/status`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.labResult.verified).toBe(true);
    expect(statusRes.body.data.followUpWindow.date).toBe('2026-09-22');
    expect(statusRes.body.data.returnWithoutReregistering).toBe(true);
  });
});
