const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

// Import routes & models
const doctorRoutes = require('../src/routes/doctorRoutes');
const Patient = require('../src/models/Patient');
const Encounter = require('../src/models/Encounter');
const Hospital = require('../src/models/Hospital');
const Vital = require('../src/models/Vital');
const Medication = require('../src/models/Medication');
const Symptom = require('../src/models/Symptom');
const History = require('../src/models/History');
const Doctor = require('../src/models/Doctor');
const InvestigationOrder = require('../src/models/InvestigationOrder');
const Prescription = require('../src/models/Prescription');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/doctor', doctorRoutes);

describe('Phase 7 — Doctor System Tests', () => {
  let testHospital;
  let testPatient;
  let testEncounter;
  let testDoctor;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clear test collections
    await Patient.deleteMany({});
    await Encounter.deleteMany({});
    await Hospital.deleteMany({});
    await Vital.deleteMany({});
    await Medication.deleteMany({});
    await Symptom.deleteMany({});
    await History.deleteMany({});
    await Doctor.deleteMany({});
    await InvestigationOrder.deleteMany({});
    await Prescription.deleteMany({});

    // Create test Hospital
    testHospital = await Hospital.create({
      hospitalId: 'IN-DL-TEST-001',
      name: 'Test General Hospital',
      code: 'TGH-001',
      address: { state: 'Delhi', district: 'New Delhi' }
    });

    // Create test Patient
    testPatient = await Patient.create({
      basicInfo: {
        fullName: 'Vikram Singhania',
        dob: new Date('1975-06-15'),
        age: 50,
        gender: 'Male',
        contactNumber: '+919876543210',
        bloodGroup: 'O+'
      },
      healthProfile: {
        allergies: [{ substance: 'Penicillin', sourceTag: 'Confirmed', status: 'Confirmed' }],
        existingDiseases: [{ condition: 'Hypertension', sourceTag: 'Confirmed', diagnosedAt: new Date('2020-01-01') }]
      }
    });

    // Create test Doctor
    testDoctor = await Doctor.create({
      doctorId: 'DOC-ANANYA-001',
      fullName: 'Dr. Ananya Roy',
      hospital: testHospital._id,
      department: new mongoose.Types.ObjectId(),
      specialities: ['Kayachikitsa', 'General Medicine'],
      verification: { status: 'verified', method: 'hospital_admin' },
      consultationStats: { rollingAverageMinutes: 12, sampleSize: 5 }
    });

    // Create test Encounter
    testEncounter = await Encounter.create({
      patientId: testPatient._id,
      hospitalId: testHospital._id,
      doctorId: testDoctor._id,
      tokenNumber: 'DOC-TKN-001',
      type: 'opd',
      status: 'in_consultation',
      triagePriority: 'normal'
    });

    // Create Symptom for Encounter
    await Symptom.create({
      encounterId: testEncounter._id,
      patientId: testPatient._id,
      captureMode: 'text',
      structuredComplaint: {
        chiefComplaint: 'Severe Joint Pain & Morning Stiffness',
        duration: '2 weeks',
        severity: 'Moderate'
      }
    });

    // Create Vitals for Encounter
    await Vital.create({
      encounterId: testEncounter._id,
      patientId: testPatient._id,
      type: 'blood_pressure',
      value: { systolic: 130, diastolic: 85 },
      unit: 'mmHg',
      source: 'kiosk-peripheral'
    });

    // Create History
    await History.create({
      encounterId: testEncounter._id,
      patientId: testPatient._id,
      mode: 'ayush',
      sections: {
        pastMedicalHistory: ['Hypertension'],
        allergies: ['Penicillin']
      }
    });

    // Create Active Medication
    await Medication.create({
      patientId: testPatient._id,
      encounterId: testEncounter._id,
      name: 'Amlodipine',
      system: 'modern',
      dosage: '5mg',
      frequency: 'OD',
      bucket: 'CURRENT',
      status: 'CURRENT'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('1. GET /api/doctor/summary/:encounterId returns 30-second summary with provenance tags', async () => {
    const res = await request(app)
      .get(`/api/doctor/summary/${testEncounter._id}`)
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.currentComplaint.chiefComplaint).toBe('Severe Joint Pain & Morning Stiffness');
    expect(res.body.data.currentComplaint.sourceTag).toBeDefined();
    expect(res.body.data.knownConditions.length).toBeGreaterThan(0);
    expect(res.body.data.currentMedicines.length).toBeGreaterThan(0);
    expect(res.body.data.aiDraftNotice).toContain('AI-generated draft');
  });

  test('2. GET /api/doctor/diff/:encounterId returns server-computed diff', async () => {
    const res = await request(app)
      .get(`/api/doctor/diff/${testEncounter._id}`)
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('new');
    expect(res.body.data).toHaveProperty('changed');
    expect(res.body.data).toHaveProperty('unchanged');
  });

  test('3. POST /api/doctor/check-conflicts detects allergy contradiction and sets verification flag', async () => {
    const res = await request(app)
      .post('/api/doctor/check-conflicts')
      .send({
        patientId: testPatient._id.toString(),
        encounterId: testEncounter._id.toString(),
        statement: { type: 'allergy', value: 'No allergy to any drug' }
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.hasConflict).toBe(true);
    expect(res.body.conflicts[0].flag).toBe('Doctor verification required');
  });

  test('4. POST /api/doctor/consultation/complete signs consultation, creates lab orders & prescription, closes encounter', async () => {
    const res = await request(app)
      .post('/api/doctor/consultation/complete')
      .send({
        encounterId: testEncounter._id.toString(),
        doctorId: testDoctor._id.toString(),
        diagnoses: [
          { system: 'ICD-11', code: 'FA00', term: 'Osteoarthritis of knee' },
          { system: 'NAMASTE', code: 'AYU-KA-042', term: 'Sandhivata' }
        ],
        investigationOrders: [
          { testName: 'X-Ray Knee Joint AP & Lateral', priority: 'routine' }
        ],
        prescriptionItems: [
          { name: 'Yogaraj Guggulu', system: 'ayurvedic', dosage: '2 tabs', frequency: 'BD', duration: '14 days' }
        ],
        advice: 'Rest, warm fomentation with Mahanarayana Taila',
        followUpDecision: { option: 'After lab result' },
        signature: 'Digitally signed by Dr. Ananya Roy'
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.investigationOrdersCreated).toBe(1);
    expect(res.body.data.newStatus).toBe('lab_pending');

    // Verify InvestigationOrder created in DB
    const order = await InvestigationOrder.findOne({ encounterId: testEncounter._id });
    expect(order).not.toBeNull();
    expect(order.testName).toBe('X-Ray Knee Joint AP & Lateral');

    // Verify Prescription created in DB
    const rx = await Prescription.findOne({ encounterId: testEncounter._id });
    expect(rx).not.toBeNull();
    expect(rx.items.length).toBe(1);
  });
});
