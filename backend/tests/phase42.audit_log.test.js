const mongoose = require('mongoose');
const AuditLog = require('../src/models/AuditLog');
const { logAuditEvent } = require('../src/middleware/auditMiddleware');

describe('Phase 42 — Centralized Audit Log (§42)', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test('1. logAuditEvent writes all 8 required fields (actor, role, action, targetType, targetId, patient, reason, timestamp)', async () => {
    const testPayload = {
      actor: 'DOC-108',
      role: 'doctor',
      action: 'Doctor viewed CBC report',
      targetType: 'lab_report',
      targetId: 'LAB-ORD-902',
      patient: 'PAT-771',
      reason: 'clinical_care'
    };

    await logAuditEvent(testPayload);

    const log = await AuditLog.findOne({ action: 'Doctor viewed CBC report' });
    expect(log).toBeDefined();
    expect(log.actor).toBe('DOC-108');
    expect(log.role).toBe('doctor');
    expect(log.action).toBe('Doctor viewed CBC report');
    expect(log.targetType).toBe('lab_report');
    expect(log.targetId).toBe('LAB-ORD-902');
    expect(log.patient).toBe('PAT-771');
    expect(log.reason).toBe('clinical_care');
    expect(log.timestamp).toBeInstanceOf(Date);
  });

  test('2. AuditLog correctly logs Lab viewing investigation order', async () => {
    await logAuditEvent({
      actor: 'LAB-TECH-01',
      role: 'lab',
      action: 'Lab viewed investigation order',
      targetType: 'investigation_order',
      targetId: 'ORD-554',
      patient: 'PAT-123',
      reason: 'diagnostic_processing'
    });

    const log = await AuditLog.findOne({ action: 'Lab viewed investigation order' });
    expect(log).toBeDefined();
    expect(log.role).toBe('lab');
    expect(log.targetType).toBe('investigation_order');
  });

  test('3. AuditLog correctly logs Admin changing department configuration', async () => {
    await logAuditEvent({
      actor: 'ADMIN-OFFICER',
      role: 'admin',
      action: 'Admin changed department configuration',
      targetType: 'department',
      targetId: 'Kayachikitsa',
      patient: null,
      reason: 'administrative_audit'
    });

    const log = await AuditLog.findOne({ action: 'Admin changed department configuration' });
    expect(log).toBeDefined();
    expect(log.role).toBe('admin');
  });

  test('4. AuditLog correctly logs Patient revoking consent', async () => {
    await logAuditEvent({
      actor: 'PAT-771',
      role: 'patient',
      action: 'Patient revoked consent',
      targetType: 'consent',
      targetId: 'CONSENT-001',
      patient: 'PAT-771',
      reason: 'patient_self_access'
    });

    const log = await AuditLog.findOne({ action: 'Patient revoked consent' });
    expect(log).toBeDefined();
    expect(log.role).toBe('patient');
  });
});
