const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

const queueRoutes = require('../src/routes/queueRoutes');
const Queue = require('../src/models/Queue');
const Encounter = require('../src/models/Encounter');
const Doctor = require('../src/models/Doctor');
const Hospital = require('../src/models/Hospital');
const Department = require('../src/models/Department');
const Patient = require('../src/models/Patient');

const app = express();
app.use(express.json());
app.use('/api/routing', queueRoutes);
app.use('/api/queue', queueRoutes);

describe('Phase 6 — Queue, Department Routing & Token Engine (§17-20)', () => {
  let testHospitalId;
  let testDeptId;
  let testDoctorId;
  let testPatientId;
  let testEncounterId;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test_phase6';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const hospital = await Hospital.create({
      hospitalId: 'IN-DL-AIIA-001',
      code: 'AIIA-DEL',
      name: 'All India Institute of Ayurveda'
    });
    testHospitalId = hospital._id;

    const dept = await Department.create({
      hospital: testHospitalId,
      code: 'KAY',
      name: 'Kayachikitsa'
    });
    testDeptId = dept._id;

    const doctor = await Doctor.create({
      doctorId: 'DOC-TEST-601',
      hospital: testHospitalId,
      department: testDeptId,
      fullName: 'Dr. Vikramaditya Sharma',
      consultationStats: { sampleSize: 2, rollingAverageMinutes: 10 }
    });
    testDoctorId = doctor._id;

    const patient = await Patient.create({
      basicInfo: { fullName: 'Subhadra Devi', age: 54, gender: 'Female' }
    });
    testPatientId = patient._id;

    const encounter = await Encounter.create({
      patientId: testPatientId,
      hospitalId: testHospitalId,
      departmentId: testDeptId,
      doctorId: testDoctorId,
      tokenNumber: 'OPD-20260910-501',
      type: 'opd',
      status: 'opened'
    });
    testEncounterId = encounter._id;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await Hospital.deleteMany({});
      await Department.deleteMany({});
      await Doctor.deleteMany({});
      await Patient.deleteMany({});
      await Encounter.deleteMany({});
      await Queue.deleteMany({});
      await mongoose.connection.close();
    }
  });

  describe('1. AI-Assisted Department Routing (§17)', () => {
    test('POST /api/routing/suggest should return department suggestion labeled AI-assisted routing', async () => {
      const res = await request(app)
        .post('/api/routing/suggest')
        .send({
          chiefComplaint: 'Bilateral knee osteoarthritis pain',
          age: 54,
          gender: 'Female'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.label).toBe('AI-assisted routing');
      expect(res.body.data.department).toBeDefined();
    });
  });

  describe('2. Token & QR Slip Generation (§18, §20)', () => {
    test('POST /api/queue/token should compute ETA range string and generate QR without clinical fields', async () => {
      const res = await request(app)
        .post('/api/queue/token')
        .send({
          encounterId: testEncounterId.toString(),
          patientId: testPatientId.toString(),
          hospitalId: testHospitalId.toString(),
          departmentId: testDeptId.toString(),
          doctorId: testDoctorId.toString()
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.tokenNumber).toBe('OPD-20260910-501');
      expect(res.body.data.etaRange).toContain('mins'); // Always a range string (e.g., "0 - 5 mins")
      expect(res.body.data.qrSvgDataUri).toContain('data:image/svg+xml');

      // Verify QR payload contains ZERO clinical data
      const qrParsed = JSON.parse(res.body.data.qrPayload);
      expect(qrParsed.t).toBe('OPD-20260910-501');
      expect(qrParsed.s).toBe(testEncounterId.toString());
      expect(qrParsed.chiefComplaint).toBeUndefined();
      expect(qrParsed.symptoms).toBeUndefined();
    });
  });

  describe('3. Live Queue & Doctor Consultation Speed Update (§18, §19)', () => {
    test('GET /api/queue/live should return live queue entries and ETA range', async () => {
      const res = await request(app)
        .get('/api/queue/live')
        .query({
          hospitalId: testHospitalId.toString(),
          departmentId: testDeptId.toString()
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.entries.length).toBeGreaterThan(0);
      expect(res.body.data.etaRange).toContain('mins');
    });

    test('POST /api/queue/consult-end should update doctor rolling average consultation speed', async () => {
      const res = await request(app)
        .post('/api/queue/consult-end')
        .send({
          tokenNumber: 'OPD-20260910-501',
          doctorId: testDoctorId.toString(),
          actualDurationMinutes: 14
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');

      // Verify doctor's rolling average was updated in DB
      const updatedDoctor = await Doctor.findById(testDoctorId);
      expect(updatedDoctor.consultationStats.sampleSize).toBe(3);
      expect(updatedDoctor.consultationStats.rollingAverageMinutes).toBeGreaterThan(0);
    });
  });
});
