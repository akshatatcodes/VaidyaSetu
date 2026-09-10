const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');

const adminRoutes = require('../src/routes/adminRoutes');
const facilityRoutes = require('../src/routes/facilityRoutes');
const Hospital = require('../src/models/Hospital');
const Department = require('../src/models/Department');

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);
app.use('/api/facilities', facilityRoutes);

describe('Phase 32 — Admin Configuration Engine & Dynamic Resolution Tests', () => {
  let testHospital;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    await Hospital.deleteMany({});
    await Department.deleteMany({});

    testHospital = await Hospital.create({
      hospitalId: 'HOSP-P32-001',
      name: 'Phase 32 Test Hospital',
      code: 'P32-HOSP',
      address: { state: 'Delhi', district: 'New Delhi' }
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('Acceptance Check (§32): Create a new department in Admin and verify it immediately resolves for OPD routing and registration', async () => {
    const newDeptName = 'Swasthavritta & Yoga';

    // 1. Create department in Admin
    const createRes = await request(app)
      .post('/api/admin/departments/live')
      .send({
        hospitalId: testHospital._id.toString(),
        name: newDeptName,
        code: 'SWAS-YOGA',
        systemOfMedicine: 'Ayurveda',
        rooms: [{ roomNumber: '301', roomLabel: 'Yoga & Preventive Care Room', isActive: true }]
      })
      .expect(201);

    expect(createRes.body.status).toBe('success');
    expect(createRes.body.data.name).toBe(newDeptName);

    // 2. Immediately fetch live departments from Admin endpoint
    const adminLiveRes = await request(app)
      .get('/api/admin/departments/live')
      .expect(200);

    expect(adminLiveRes.body.status).toBe('success');
    const createdInAdmin = adminLiveRes.body.data.find(d => d.name === newDeptName);
    expect(createdInAdmin).toBeDefined();

    // 3. Immediately fetch departments from Facility Discovery API (§9, §32)
    const facilityRes = await request(app)
      .get(`/api/facilities/hospitals/${testHospital._id.toString()}/departments`)
      .expect(200);

    expect(facilityRes.body.status).toBe('success');
    const createdInFacility = facilityRes.body.data.find(d => d.name === newDeptName);
    expect(createdInFacility).toBeDefined();
    expect(createdInFacility.code).toBe('SWAS-YOGA');
  });
});
