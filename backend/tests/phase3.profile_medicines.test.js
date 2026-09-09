const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

const patientRoutes = require('../src/routes/patientRoutes');
const medicationRoutes = require('../src/routes/medicationRoutes');

const Patient = require('../src/models/Patient');
const Medication = require('../src/models/Medication');

const app = express();
app.use(express.json());
app.use('/api/patients', patientRoutes);
app.use('/api/medications', medicationRoutes);

describe('Phase 3 — Patient Health Profile & Medicines Module', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test_phase3';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await Patient.deleteMany({});
      await Medication.deleteMany({});
      await mongoose.connection.close();
    }
  });

  describe('1. Patient Health Profile & Source Provenance (§4, §5, §66)', () => {
    let testPatientId;

    beforeAll(async () => {
      const patient = await Patient.create({
        basicInfo: { fullName: 'Rajesh Sharma', age: 45, gender: 'Male' }
      });
      testPatientId = patient._id;
    });

    test('PUT /api/patients/:patientId/health-profile should update health profile with Caregiver source tag', async () => {
      const res = await request(app)
        .put(`/api/patients/${testPatientId}/health-profile`)
        .send({
          basicInfo: { bloodGroup: 'O+' },
          healthProfile: {
            allergies: ['Penicillin'],
            existingDiseases: ['Type 2 Diabetes'],
            personalHistory: { smoking: 'No', alcohol: 'Occasional' }
          },
          ayushProfile: { prakriti: 'Vata-Pitta' },
          sourceTag: 'Caregiver'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.healthProfile.allergies[0].substance).toBe('Penicillin');
      expect(res.body.data.healthProfile.allergies[0].sourceTag).toBe('Caregiver');
      expect(res.body.data.ayushProfile.prakriti).toBe('Vata-Pitta');
      expect(res.body.data.ayushProfile.agni).toBe('Not reported'); // Defaulting unasked fields to Not reported
    });

    test('GET /api/patients/:patientId should fetch full profile', async () => {
      const res = await request(app)
        .get(`/api/patients/${testPatientId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.basicInfo.fullName).toBe('Rajesh Sharma');
    });
  });

  describe('2. Medicines 4-Bucket Module & Transitions (§6)', () => {
    let testPatientId;
    let medId;

    beforeAll(async () => {
      const patient = await Patient.create({
        basicInfo: { fullName: 'Subhadra Devi', age: 54, gender: 'Female' }
      });
      testPatientId = patient._id;
    });

    test('POST /api/medications should add medication with NEEDS CONFIRMATION status', async () => {
      const res = await request(app)
        .post('/api/medications')
        .send({
          patientId: testPatientId.toString(),
          name: 'Metformin 500mg',
          system: 'modern',
          dosage: '1 tablet twice daily',
          status: 'NEEDS CONFIRMATION',
          sourceTag: 'Document derived'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.name).toBe('Metformin 500mg');
      expect(res.body.data.status).toBe('NEEDS CONFIRMATION');
      expect(res.body.data.sourceTag).toBe('Document derived');
      
      medId = res.body.data._id;
    });

    test('GET /api/medications/needs-confirmation/:patientId should list pending confirmation items', async () => {
      const res = await request(app)
        .get(`/api/medications/needs-confirmation/${testPatientId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].name).toBe('Metformin 500mg');
    });

    test('PATCH /api/medications/:id/status should transition medication to CURRENT', async () => {
      const res = await request(app)
        .patch(`/api/medications/${medId}/status`)
        .send({ status: 'CURRENT' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('CURRENT');
    });

    test('GET /api/medications/patient/:patientId should return medications grouped in 4 buckets', async () => {
      const res = await request(app)
        .get(`/api/medications/patient/${testPatientId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.buckets.CURRENT.length).toBe(1);
      expect(res.body.buckets.CURRENT[0].name).toBe('Metformin 500mg');
    });
  });
});
