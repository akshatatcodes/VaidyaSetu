const request = require('supertest');
const express = require('express');

describe('Phase 49: Empty States & Zero-Fabrication Integrity', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock new patient dashboard query
    app.get('/api/patients/new-patient-123/dashboard', (req, res) => {
      res.json({
        status: 'success',
        data: {
          profile: { fullName: 'New Patient', isNew: true },
          activeQueue: null,
          nextFollowUp: null,
          medications: [],
          vitals: [],
          labReports: []
        }
      });
    });

    // Mock new doctor consultation session query
    app.get('/api/encounters/new-encounter-999', (req, res) => {
      res.json({
        status: 'success',
        data: {
          encounterId: 'ENC-NEW-999',
          patientName: 'Unassigned Intake Patient',
          chiefComplaint: 'Primary consultation request',
          soapNote: {
            subjective: '',
            objective: '',
            assessment: '',
            plan: { allopathicMeds: [], ayurvedicMeds: [], panchakarmaRecommendations: [], pathyaApathya: { pathya: [], apathya: [] } }
          },
          diagnoses: [],
          investigationOrders: [],
          doctorNotes: ''
        }
      });
    });

    // Mock new lab queue endpoint
    app.get('/api/lab/queue/empty-facility', (req, res) => {
      res.json({
        status: 'success',
        data: [],
        total: 0
      });
    });

    // Mock demo accounts seed endpoint
    app.get('/api/auth/demo-accounts', (req, res) => {
      res.json({
        status: 'success',
        data: {
          doctors: [{ doctorId: 'DOC-DEMO-1', isDemo: true, isDemoData: true }],
          patients: [{ patientId: 'PAT-DEMO-1', isDemo: true, isDemoData: true }]
        }
      });
    });
  });

  test('New patient dashboard returns empty datasets without fabricated entries', async () => {
    const res = await request(app).get('/api/patients/new-patient-123/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.data.activeQueue).toBeNull();
    expect(res.body.data.nextFollowUp).toBeNull();
    expect(res.body.data.medications).toEqual([]);
    expect(res.body.data.vitals).toEqual([]);
    expect(res.body.data.labReports).toEqual([]);
  });

  test('New doctor consultation contains no fabricated diagnosis, medicine, or symptoms', async () => {
    const res = await request(app).get('/api/encounters/new-encounter-999');
    expect(res.status).toBe(200);
    expect(res.body.data.diagnoses).toEqual([]);
    expect(res.body.data.soapNote.plan.allopathicMeds).toEqual([]);
    expect(res.body.data.soapNote.plan.ayurvedicMeds).toEqual([]);
    expect(res.body.data.investigationOrders).toEqual([]);
    expect(res.body.data.soapNote.assessment).toBe('');
  });

  test('New lab queue returns empty array without fake patients', async () => {
    const res = await request(app).get('/api/lab/queue/empty-facility');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  test('Seed data is explicitly tagged as demo data', async () => {
    const res = await request(app).get('/api/auth/demo-accounts');
    expect(res.status).toBe(200);
    expect(res.body.data.doctors[0].isDemoData).toBe(true);
    expect(res.body.data.patients[0].isDemoData).toBe(true);
  });
});
