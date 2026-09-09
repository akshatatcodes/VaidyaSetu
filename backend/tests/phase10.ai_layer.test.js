const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

// Import routes & models
const aiLayerRoutes = require('../src/routes/aiLayerRoutes');
const AIEvent = require('../src/models/AIEvent');
const Encounter = require('../src/models/Encounter');
const Patient = require('../src/models/Patient');
const History = require('../src/models/History');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/ai', aiLayerRoutes);

describe('Phase 10 — AI Layer & Controlled Services Tests', () => {
  let testPatient;
  let testEncounter;
  let testHistory;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clear test collections
    await AIEvent.deleteMany({});
    await Patient.deleteMany({});
    await Encounter.deleteMany({});
    await History.deleteMany({});

    // Create test Patient
    testPatient = await Patient.create({
      basicInfo: {
        fullName: 'Deepak Verma',
        dob: new Date('1982-03-10'),
        age: 44,
        gender: 'Male',
        contactNumber: '+919776655443'
      }
    });

    // Create test Encounter
    testEncounter = await Encounter.create({
      patientId: testPatient._id,
      tokenNumber: 'AI-TKN-001',
      type: 'opd',
      status: 'opened'
    });

    // Create test History with standardized clinical terms
    testHistory = await History.create({
      encounterId: testEncounter._id,
      patientId: testPatient._id,
      mode: 'ayush',
      sections: {
        chiefComplaint: 'Sandhivata (Osteoarthritis of Knee)',
        pastMedicalHistory: ['Hypertension']
      }
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('1. ASR service processes speech and logs AIEvent with confidence score', async () => {
    const res = await request(app)
      .post('/api/ai/asr')
      .send({
        audioData: 'Patient reports joint pain in knee',
        language: 'hi',
        encounterId: testEncounter._id.toString(),
        patientId: testPatient._id.toString()
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.confidence).toBeGreaterThan(80);

    // Verify AIEvent row in DB (§42)
    const event = await AIEvent.findOne({ service: 'asr', encounterId: testEncounter._id });
    expect(event).not.toBeNull();
    expect(event.confidence).toBeGreaterThan(80);
  });

  test('2. Summary pipeline (§64) enforces mandatory doctor-review gate and sets status to doctor_review', async () => {
    const res = await request(app)
      .post('/api/ai/summary-pipeline')
      .send({
        encounterId: testEncounter._id.toString(),
        patientId: testPatient._id.toString(),
        asrInput: 'Severe knee pain',
        ocrDocs: [{ extractedMedicines: ['Yogaraj Guggulu'] }]
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.doctorReviewRequired).toBe(true);
    expect(res.body.data.aiNotice).toContain('physician verification required');

    // Verify encounter status moved to doctor_review, NEVER automatically closed
    const encDoc = await Encounter.findById(testEncounter._id);
    expect(encDoc.status).toBe('doctor_review');
    expect(encDoc.status).not.toBe('closed');
  });

  test('3. Risk Engine (§15/§16) computes red-flag score with disease declaration disclaimer', async () => {
    const res = await request(app)
      .post('/api/ai/risk-engine')
      .send({
        encounterId: testEncounter._id.toString(),
        patientId: testPatient._id.toString(),
        symptoms: ['Chest Pain', 'Shortness of Breath'],
        vitals: { blood_pressure: { systolic: 185, diastolic: 110 } }
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.triagePriority).toBe('emergency');
    expect(res.body.data.disclaimer).toContain('Autonomous disease declaration prohibited');
  });

  test('4. Routing service labels suggestions explicitly as AI-assisted routing', async () => {
    const res = await request(app)
      .post('/api/ai/routing')
      .send({
        chiefComplaint: 'Knee Pain & Stiffness',
        systemOfMedicine: 'ayurvedic',
        encounterId: testEncounter._id.toString(),
        patientId: testPatient._id.toString()
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.label).toBe('AI-assisted routing');
    expect(res.body.data.suggestedDepartment).toBe('Kayachikitsa');
  });

  test('5. Multilingual interaction layer (§44): changing UI language does not alter stored medical terms', async () => {
    const res = await request(app)
      .post('/api/ai/multilingual-interaction')
      .send({
        uiLanguage: 'hi',
        textToTranslate: 'Where does it hurt?',
        historyId: testHistory._id.toString()
      })
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.translatedUI).toBe('आपको कहां दर्द है?');
    expect(res.body.storedClinicalOntologyUnchanged).toBe(true);

    // Verify stored History doc in DB is untouched
    const histDoc = await History.findById(testHistory._id);
    expect(histDoc.sections.chiefComplaint).toBe('Sandhivata (Osteoarthritis of Knee)');
  });
});
