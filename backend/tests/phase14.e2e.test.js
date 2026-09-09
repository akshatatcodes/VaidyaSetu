const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

// Import routes & models
const authRoutes = require('../src/routes/authRoutes');
const patientRoutes = require('../src/routes/patientRoutes');
const encounterRoutes = require('../src/routes/encounterRoutes');
const doctorRoutes = require('../src/routes/doctorRoutes');
const labWorkflowRoutes = require('../src/routes/labWorkflowRoutes');
const continuityRoutes = require('../src/routes/continuityRoutes');

const Patient = require('../src/models/Patient');
const Encounter = require('../src/models/Encounter');
const InvestigationOrder = require('../src/models/InvestigationOrder');
const LabSample = require('../src/models/LabSample');
const LabResult = require('../src/models/LabResult');
const FollowUp = require('../src/models/FollowUp');
const Doctor = require('../src/models/Doctor');
const Hospital = require('../src/models/Hospital');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/encounters', encounterRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/lab', labWorkflowRoutes);
app.use('/api/continuity', continuityRoutes);

describe('Phase 14 — End-to-End Proof of Concept Workflows Tests', () => {
  let testHospital;
  let testDoctor;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clear test collections
    await Patient.deleteMany({});
    await Encounter.deleteMany({});
    await InvestigationOrder.deleteMany({});
    await LabSample.deleteMany({});
    await LabResult.deleteMany({});
    await FollowUp.deleteMany({});
    await Doctor.deleteMany({});
    await Hospital.deleteMany({});

    testHospital = await Hospital.create({
      hospitalId: 'IN-DL-AIIA-E2E',
      name: 'AIIA Hospital E2E',
      code: 'AIIA-E2E'
    });

    testDoctor = await Doctor.create({
      doctorId: 'DOC-E2E-001',
      fullName: 'Dr. Vikramaditya Sharma',
      hospital: testHospital._id,
      department: new mongoose.Types.ObjectId(),
      specialities: ['Kayachikitsa'],
      verification: { status: 'verified', method: 'hospital_admin' }
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('WORKFLOW A: Full OPD visit -> Lab Order -> Result Verification -> Auto Next-Day FollowUp Generation (§31, §36)', async () => {
    // 1. Patient Registration & Intake
    const patientRes = await request(app)
      .post('/api/patients')
      .send({
        basicInfo: {
          fullName: 'Rameshwar Prasad',
          dob: new Date('1965-07-20'),
          age: 61,
          gender: 'Male',
          contactNumber: '+919811122233'
        }
      })
      .expect(201);

    const patient = patientRes.body.data;

    // 2. Open OPD Encounter
    const encounterRes = await request(app)
      .post('/api/encounters')
      .send({
        patientId: patient._id,
        type: 'opd',
        triagePriority: 'normal',
        structuredComplaint: { chiefComplaint: 'Chronic joint stiffness & fatigue', duration: '1 month' }
      })
      .expect(201);

    const encounter = encounterRes.body.data;

    // 3. Doctor Consultation Sign-Off with Lab Test Order (§26)
    const doctorSignOffRes = await request(app)
      .post('/api/doctor/consultation/complete')
      .send({
        encounterId: encounter._id,
        doctorId: testDoctor._id.toString(),
        diagnoses: [{ system: 'ICD-11', code: 'FA00', term: 'Osteoarthritis' }],
        investigationOrders: [{ testName: 'Serum Uric Acid', priority: 'routine' }],
        advice: 'Fasting lab investigation advised'
      })
      .expect(200);

    expect(doctorSignOffRes.body.data.newStatus).toBe('lab_pending');
    expect(doctorSignOffRes.body.data.investigationOrdersCreated).toBe(1);

    // Fetch created InvestigationOrder
    const orderDoc = await InvestigationOrder.findOne({ encounterId: encounter._id });
    expect(orderDoc).not.toBeNull();

    // 4. Lab Specimen Collection (§29)
    const collectRes = await request(app)
      .post('/api/lab/samples/collect')
      .send({
        investigationOrderId: orderDoc._id.toString(),
        patientId: patient._id
      })
      .expect(200);

    const sample = collectRes.body.data.sample;

    // 5. Result Entry (§30)
    const resultEntryRes = await request(app)
      .post('/api/lab/results/entry')
      .send({
        investigationOrderId: orderDoc._id.toString(),
        labSampleId: sample._id,
        patientId: patient._id,
        testName: 'Serum Uric Acid',
        resultValue: '8.1',
        unit: 'mg/dL',
        referenceRange: '3.5 - 7.2 mg/dL'
      })
      .expect(200);

    const labResult = resultEntryRes.body.data;

    // 6. Result Verification by Lab Supervisor (§29)
    await request(app)
      .post(`/api/lab/results/${labResult._id}/verify`)
      .send({ supervisorId: 'PATH-HEAD-01' })
      .expect(200);

    // 7. Auto-Trigger FollowUp Check (§31)
    const followUpTriggerRes = await request(app)
      .post('/api/continuity/followups/trigger-lab-check')
      .send({
        encounterId: encounter._id,
        patientId: patient._id,
        investigationOrderId: orderDoc._id.toString()
      })
      .expect(200);

    expect(followUpTriggerRes.body.status).toBe('success');
    expect(followUpTriggerRes.body.data.status).toBe('schedulable');
    expect(followUpTriggerRes.body.data.scheduledWindow).toHaveProperty('date');
  });

  test('WORKFLOW B: Family Beneficiary Account with Caregiver Provenance Source-Tagging Throughout (§4, §6)', async () => {
    // 1. Primary User Mobile OTP Authentication
    const otpSend = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '+919988776655' })
      .expect(200);

    const otpVerify = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: '+919988776655', otp: otpSend.body.demoOtp || '123456' })
      .expect(200);

    const caregiverUserId = otpVerify.body.data.userId;

    // 2. Caregiver registers elderly parent (Family Beneficiary)
    const familyMemberRes = await request(app)
      .post('/api/patients/beneficiaries')
      .send({
        caregiverUserId,
        basicInfo: {
          fullName: 'Savitri Devi',
          dob: new Date('1948-03-15'),
          age: 78,
          gender: 'Female',
          contactNumber: '+919988776655'
        },
        relation: 'mother',
        healthProfile: {
          allergies: [{ substance: 'Sulfa Drugs', sourceTag: 'Caregiver', status: 'Confirmed' }]
        }
      })
      .expect(201);

    const beneficiary = familyMemberRes.body.data.beneficiaryPatient;

    // Verify Patient record created with distinct ID
    expect(beneficiary._id).toBeDefined();

    // 3. Update Health Profile with Caregiver Source-Tagging (§6)
    const profileUpdateRes = await request(app)
      .put(`/api/patients/${beneficiary._id}/health-profile`)
      .send({
        healthProfile: {
          allergies: [{ substance: 'Sulfa Drugs', sourceTag: 'Caregiver' }],
          existingDiseases: [{ condition: 'Hypertension', sourceTag: 'Caregiver' }]
        }
      })
      .expect(200);

    expect(profileUpdateRes.body.status).toBe('success');
    expect(profileUpdateRes.body.data.healthProfile.allergies[0].sourceTag).toBe('Caregiver');
    expect(profileUpdateRes.body.data.healthProfile.existingDiseases[0].sourceTag).toBe('Caregiver');
  });
});
