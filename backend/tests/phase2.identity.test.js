const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

const authRoutes = require('../src/routes/authRoutes');
const patientRoutes = require('../src/routes/patientRoutes');
const consentRoutes = require('../src/routes/consentRoutes');
const abhaRoutes = require('../src/routes/abhaRoutes');

const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const FamilyMember = require('../src/models/FamilyMember');
const Consent = require('../src/models/Consent');
const ABHAIdentity = require('../src/models/ABHAIdentity');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/abha', abhaRoutes);

describe('Phase 2 — Identity, Family Accounts, Consent & Access Control', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test_phase2';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({});
      await Patient.deleteMany({});
      await FamilyMember.deleteMany({});
      await Consent.deleteMany({});
      await ABHAIdentity.deleteMany({});
      await mongoose.connection.close();
    }
  });

  describe('1. Mobile OTP Patient Auth (§2)', () => {
    test('POST /api/auth/otp/request should return success with dev OTP', async () => {
      const res = await request(app)
        .post('/api/auth/otp/request')
        .send({ mobile: '9876543210' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.mobile).toBe('9876543210');
    });

    test('POST /api/auth/otp/verify should verify OTP and issue patient token', async () => {
      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ mobile: '9876543210', otp: '123456' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('patient');
      expect(res.body.data.noProfilesYet).toBe(true);
    });
  });

  describe('2. Staff Credentials Login (§21)', () => {
    test('POST /api/auth/staff/login should authenticate doctor credentials', async () => {
      const res = await request(app)
        .post('/api/auth/staff/login')
        .send({ identifier: 'dr.vikram@aiia.gov.in', password: 'password123', role: 'doctor' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.role).toBe('doctor');
      expect(res.body.data.token).toBeDefined();
    });

    test('POST /api/auth/staff/login should reject patient role', async () => {
      const res = await request(app)
        .post('/api/auth/staff/login')
        .send({ identifier: '9876543210', role: 'patient' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Patients must use Mobile OTP authentication');
    });
  });

  describe('3. Family Member & Beneficiary Registration (§2)', () => {
    let parentUserId;
    let createdPatientId;

    test('POST /api/patients/family-member should register beneficiary with distinct Patient document', async () => {
      const user = await User.create({ mobile: '9876543210', role: 'patient' });
      parentUserId = user._id;

      const res = await request(app)
        .post('/api/patients/family-member')
        .send({
          userId: parentUserId.toString(),
          fullName: 'Kaveri Devi',
          relation: 'mother',
          age: 65,
          gender: 'Female',
          bloodGroup: 'B+'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.relation).toBe('mother');
      expect(res.body.data.patient).toBeDefined();
      expect(res.body.data.patient.basicInfo.fullName).toBe('Kaveri Devi');
      
      createdPatientId = res.body.data.patient._id;
    });

    test('GET /api/patients/family-members/:userId should return family members list', async () => {
      const res = await request(app)
        .get(`/api/patients/family-members/${parentUserId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].patient.basicInfo.fullName).toBe('Kaveri Devi');
    });
  });

  describe('4. Granular Consent CRUD (§46-48)', () => {
    let testPatientId;

    beforeAll(async () => {
      const patient = await Patient.create({
        basicInfo: { fullName: 'Test Patient', age: 40, gender: 'Male' }
      });
      testPatientId = patient._id;
    });

    test('POST /api/consent/grant should record active consent with all §47 fields', async () => {
      const res = await request(app)
        .post('/api/consent/grant')
        .send({
          patientId: testPatientId.toString(),
          purpose: 'clinical_history',
          dataScope: 'opd_encounter_data',
          recipient: 'assigned_clinical_team',
          method: 'kiosk_ui',
          language: 'hi'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.purpose).toBe('clinical_history');
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.language).toBe('hi');
    });

    test('GET /api/consent/my/:patientId should list patient consents', async () => {
      const res = await request(app)
        .get(`/api/consent/my/${testPatientId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].purpose).toBe('clinical_history');
    });

    test('POST /api/consent/revoke should revoke active consent', async () => {
      const res = await request(app)
        .post('/api/consent/revoke')
        .send({
          patientId: testPatientId.toString(),
          purpose: 'clinical_history'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('revoked');
      expect(res.body.data.revokedAt).toBeDefined();
    });
  });

  describe('5. ABHA Identity Link Request (§2)', () => {
    let testPatientId;

    beforeAll(async () => {
      const patient = await Patient.create({
        basicInfo: { fullName: 'ABHA Test Patient', age: 30, gender: 'Female' }
      });
      testPatientId = patient._id;
    });

    test('POST /api/abha/link-request should record intent with pending_abdm_flow status', async () => {
      const res = await request(app)
        .post('/api/abha/link-request')
        .send({
          patientId: testPatientId.toString(),
          abhaId: '91-1234-5678-9012',
          abhaAddress: 'patient@abdm'
        });

      expect(res.statusCode).toBe(202);
      expect(res.body.status).toBe('success');
      expect(res.body.data.linkStatus).toBe('pending_abdm_flow');
      expect(res.body.data.abhaId).toBe('91-1234-5678-9012');
    });

    test('GET /api/abha/status/:patientId should return ABHA link status', async () => {
      const res = await request(app)
        .get(`/api/abha/status/${testPatientId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.linkStatus).toBe('pending_abdm_flow');
    });
  });
});
