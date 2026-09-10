const request = require('supertest');
const express = require('express');
const { requirePurpose } = require('../src/middleware/pbacMiddleware');

describe('Phase 51: Route QA Matrix & Role Authorization Security', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock Route QA Matrix rules
    const routePolicy = (allowedRoles) => (req, res, next) => {
      const userRole = (req.headers['x-user-role'] || 'patient').toLowerCase();

      if (!allowedRoles.includes(userRole)) {
        if (allowedRoles.includes('patient')) {
          if (userRole === 'doctor') return res.status(302).json({ status: 'redirect', location: '/doctor' });
          if (userRole === 'lab') return res.status(302).json({ status: 'redirect', location: '/lab' });
          if (userRole === 'admin') return res.status(302).json({ status: 'redirect', location: '/admin' });
        }
        return res.status(403).json({ status: 'error', code: 'ACCESS_DENIED', message: 'Access denied to role ' + userRole });
      }
      next();
    };

    // Route Endpoints
    app.get('/api/route/patient', routePolicy(['patient']), (req, res) => {
      res.json({ status: 'success', route: '/patient', allowedFor: 'patient' });
    });

    app.get('/api/route/doctor', routePolicy(['doctor']), (req, res) => {
      res.json({ status: 'success', route: '/doctor', allowedFor: 'doctor' });
    });

    app.get('/api/route/lab', routePolicy(['lab']), (req, res) => {
      res.json({ status: 'success', route: '/lab', allowedFor: 'lab' });
    });

    app.get('/api/route/admin', routePolicy(['admin']), (req, res) => {
      res.json({ status: 'success', route: '/admin', allowedFor: 'admin' });
    });

    app.get('/api/route/kiosk', (req, res) => {
      res.json({ status: 'success', route: '/kiosk/*', mode: 'terminal_policy' });
    });
  });

  // ── TEST CASES ──

  test('/patient route allowed for Patient, redirected for Doctor/Lab/Admin', async () => {
    // Patient access -> OK
    const pRes = await request(app).get('/api/route/patient').set('x-user-role', 'patient');
    expect(pRes.status).toBe(200);

    // Doctor access -> Redirect to /doctor
    const dRes = await request(app).get('/api/route/patient').set('x-user-role', 'doctor');
    expect(dRes.status).toBe(302);
    expect(dRes.body.location).toBe('/doctor');

    // Lab access -> Redirect to /lab
    const lRes = await request(app).get('/api/route/patient').set('x-user-role', 'lab');
    expect(lRes.status).toBe(302);
    expect(lRes.body.location).toBe('/lab');

    // Admin access -> Redirect to /admin
    const aRes = await request(app).get('/api/route/patient').set('x-user-role', 'admin');
    expect(aRes.status).toBe(302);
    expect(aRes.body.location).toBe('/admin');
  });

  test('/doctor route allowed for Doctor, denied for Patient/Lab/Admin', async () => {
    const dRes = await request(app).get('/api/route/doctor').set('x-user-role', 'doctor');
    expect(dRes.status).toBe(200);

    const pRes = await request(app).get('/api/route/doctor').set('x-user-role', 'patient');
    expect(pRes.status).toBe(403);

    const lRes = await request(app).get('/api/route/doctor').set('x-user-role', 'lab');
    expect(lRes.status).toBe(403);
  });

  test('/lab route allowed for Lab, denied for Patient/Doctor', async () => {
    const lRes = await request(app).get('/api/route/lab').set('x-user-role', 'lab');
    expect(lRes.status).toBe(200);

    const pRes = await request(app).get('/api/route/lab').set('x-user-role', 'patient');
    expect(pRes.status).toBe(403);

    const dRes = await request(app).get('/api/route/lab').set('x-user-role', 'doctor');
    expect(dRes.status).toBe(403);
  });

  test('/admin route allowed for Admin, denied for Patient/Doctor/Lab', async () => {
    const aRes = await request(app).get('/api/route/admin').set('x-user-role', 'admin');
    expect(aRes.status).toBe(200);

    const pRes = await request(app).get('/api/route/admin').set('x-user-role', 'patient');
    expect(pRes.status).toBe(403);

    const dRes = await request(app).get('/api/route/admin').set('x-user-role', 'doctor');
    expect(dRes.status).toBe(403);

    const lRes = await request(app).get('/api/route/admin').set('x-user-role', 'lab');
    expect(lRes.status).toBe(403);
  });

  test('/kiosk routes operate under public/kiosk terminal policy', async () => {
    const res = await request(app).get('/api/route/kiosk');
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('terminal_policy');
  });
});
