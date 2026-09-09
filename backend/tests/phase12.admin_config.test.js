const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

// Import routes & models
const adminRoutes = require('../src/routes/adminRoutes');
const Hospital = require('../src/models/Hospital');
const Department = require('../src/models/Department');
const Doctor = require('../src/models/Doctor');
const Kiosk = require('../src/models/Kiosk');
const Laboratory = require('../src/models/Laboratory');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Phase 12 — Hospital Admin & Configuration Engine Tests', () => {
  let testHosp;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clear test collections
    await Hospital.deleteMany({});
    await Department.deleteMany({});
    await Doctor.deleteMany({});
    await Kiosk.deleteMany({});
    await Laboratory.deleteMany({});

    // Create test Hospital
    testHosp = await Hospital.create({
      hospitalId: 'IN-DL-AIIA-001',
      name: 'All India Institute of Ayurveda',
      code: 'AIIA',
      address: { state: 'Delhi', district: 'New Delhi' }
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('1. POST /api/admin/hospitals creates a new hospital', async () => {
    const res = await request(app)
      .post('/api/admin/hospitals')
      .send({
        hospitalId: 'IN-MH-AYU-002',
        name: 'Government Ayurveda Hospital Pune',
        code: 'GAHP'
      })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Government Ayurveda Hospital Pune');
  });

  test('2. POST /api/admin/departments/live creates a new department dynamically (§54)', async () => {
    const res = await request(app)
      .post('/api/admin/departments/live')
      .send({
        hospitalId: testHosp._id.toString(),
        name: 'Kaumarbhritya (Pediatrics)',
        code: 'KAUM',
        systemOfMedicine: 'Ayurveda',
        rooms: [{ roomNumber: '204', name: 'Pediatrics Consultation Room' }]
      })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Kaumarbhritya (Pediatrics)');

    // Verify it is immediately selectable in live list (§54)
    const listRes = await request(app)
      .get('/api/admin/departments/live')
      .expect(200);

    expect(listRes.body.status).toBe('success');
    expect(listRes.body.count).toBeGreaterThanOrEqual(1);
    expect(listRes.body.data[0].name).toBe('Kaumarbhritya (Pediatrics)');
  });

  test('3. POST /api/admin/doctors/live creates a new clinician record dynamically', async () => {
    const res = await request(app)
      .post('/api/admin/doctors/live')
      .send({
        doctorId: 'DOC-AYU-309',
        fullName: 'Dr. Devavrat Shastri',
        specialities: ['Shalya Tantra', 'General Surgery']
      })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data.fullName).toBe('Dr. Devavrat Shastri');
  });

  test('4. POST /api/admin/kiosks/live registers a new MediKiosk terminal', async () => {
    const res = await request(app)
      .post('/api/admin/kiosks/live')
      .send({
        kioskId: 'KIOSK-GATE-02',
        label: 'OPD Entrance Terminal 2',
        location: 'OPD Block A'
      })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data.kioskId).toBe('KIOSK-GATE-02');
  });

  test('5. POST /api/admin/labs/live registers a laboratory facility', async () => {
    const res = await request(app)
      .post('/api/admin/labs/live')
      .send({
        laboratoryId: 'LAB-PATH-01',
        name: 'Department of Clinical Pathology',
        code: 'PATH-01'
      })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Department of Clinical Pathology');
  });
});
