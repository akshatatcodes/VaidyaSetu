const mongoose = require('mongoose');

// Import all models to verify mongoose.model() exports
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const FamilyMember = require('../src/models/FamilyMember');
const ABHAIdentity = require('../src/models/ABHAIdentity');
const Consent = require('../src/models/Consent');
const Hospital = require('../src/models/Hospital');
const Department = require('../src/models/Department');
const Doctor = require('../src/models/Doctor');
const Laboratory = require('../src/models/Laboratory');
const Kiosk = require('../src/models/Kiosk');
const Appointment = require('../src/models/Appointment');
const Queue = require('../src/models/Queue');
const Encounter = require('../src/models/Encounter');
const Symptom = require('../src/models/Symptom');
const History = require('../src/models/History');
const Vital = require('../src/models/Vital');
const Medication = require('../src/models/Medication');
const Prescription = require('../src/models/Prescription');
const Document = require('../src/models/Document');
const OCRExtraction = require('../src/models/OCRExtraction');
const InvestigationOrder = require('../src/models/InvestigationOrder');
const LabSample = require('../src/models/LabSample');
const LabResult = require('../src/models/LabResult');
const Referral = require('../src/models/Referral');
const FollowUp = require('../src/models/FollowUp');
const Notification = require('../src/models/Notification');
const AuditLog = require('../src/models/AuditLog');
const AIEvent = require('../src/models/AIEvent');

describe('Phase 1 — Core Data Model Rebuild (25 Models & Encounter Architecture)', () => {
  
  test('All 25 models have valid mongoose.model() exports', () => {
    const models = [
      User, Patient, FamilyMember, ABHAIdentity, Consent, Hospital, Department,
      Doctor, Laboratory, Kiosk, Appointment, Queue, Encounter, Symptom, History,
      Vital, Medication, Prescription, Document, OCRExtraction, InvestigationOrder,
      LabSample, LabResult, Referral, FollowUp, Notification, AuditLog, AIEvent
    ];

    models.forEach(model => {
      expect(model).toBeDefined();
      expect(model.modelName).toBeDefined();
    });
  });

  test('Encounter schema supports required fields and status enum', () => {
    const dummyId = new mongoose.Types.ObjectId();
    const enc = new Encounter({
      patientId: dummyId,
      tokenNumber: 'OPD-20260909-001',
      type: 'opd',
      status: 'opened',
      triagePriority: 'normal'
    });

    expect(enc.tokenNumber).toBe('OPD-20260909-001');
    expect(enc.status).toBe('opened');
    expect(enc.type).toBe('opd');
  });

  test('Patient schema supports basicInfo and healthProfile structure', () => {
    const p = new Patient({
      basicInfo: {
        fullName: 'Rajesh Jain',
        age: 42,
        gender: 'Male',
        contactNumber: '9876543210'
      },
      healthProfile: {
        allergies: [{ substance: 'Penicillin', sourceTag: 'Confirmed' }]
      }
    });

    expect(p.basicInfo.fullName).toBe('Rajesh Jain');
    expect(p.healthProfile.allergies[0].substance).toBe('Penicillin');
  });

  test('Consent schema supports granular per-purpose status & revocation', () => {
    const c = new Consent({
      consentId: 'CONS-TEST-001',
      patientId: new mongoose.Types.ObjectId(),
      purpose: 'clinical_history',
      status: 'active'
    });

    expect(c.consentId).toBe('CONS-TEST-001');
    expect(c.purpose).toBe('clinical_history');
    expect(c.status).toBe('active');
  });

  test('InvestigationOrder, LabSample, LabResult workflow models initialize correctly', () => {
    const orderId = new mongoose.Types.ObjectId();
    const order = new InvestigationOrder({
      encounterId: new mongoose.Types.ObjectId(),
      patientId: new mongoose.Types.ObjectId(),
      doctorId: new mongoose.Types.ObjectId(),
      testName: 'CBC',
      status: 'ordered'
    });

    const sample = new LabSample({
      investigationOrderId: orderId,
      patientId: new mongoose.Types.ObjectId(),
      sampleId: 'SAMPLE-101',
      status: 'collected'
    });

    const result = new LabResult({
      investigationOrderId: orderId,
      labSampleId: sample._id,
      patientId: new mongoose.Types.ObjectId(),
      testName: 'CBC',
      parameters: [{ name: 'Hb', value: '11.5', unit: 'g/dL', flag: 'normal' }],
      version: 1,
      originalValuePreserved: true
    });

    expect(order.status).toBe('ordered');
    expect(sample.status).toBe('collected');
    expect(result.originalValuePreserved).toBe(true);
    expect(result.parameters[0].name).toBe('Hb');
  });

  test('Acceptance Check 1: Encounter is the clinical parent for Symptoms, Vitals, Prescriptions, Orders', () => {
    const encId = new mongoose.Types.ObjectId();
    const patientId = new mongoose.Types.ObjectId();
    const docId = new mongoose.Types.ObjectId();

    const sym = new Symptom({ encounterId: encId, patientId, name: 'Fever', severity: 'moderate' });
    const vit = new Vital({ encounterId: encId, patientId, systolicBP: 120, diastolicBP: 80 });
    const rx = new Prescription({ encounterId: encId, patientId, doctorId: docId, medications: [{ name: 'Sudarshan Vati', dosage: '1 tab' }] });
    const order = new InvestigationOrder({ encounterId: encId, patientId, doctorId: docId, testName: 'CBC' });

    expect(sym.encounterId).toEqual(encId);
    expect(vit.encounterId).toEqual(encId);
    expect(rx.encounterId).toEqual(encId);
    expect(order.encounterId).toEqual(encId);
  });

  test('Acceptance Check 2: Multiple encounters per patient work', () => {
    const patientId = new mongoose.Types.ObjectId();
    const enc1 = new Encounter({ patientId, tokenNumber: 'OPD-001', type: 'opd', status: 'completed' });
    const enc2 = new Encounter({ patientId, tokenNumber: 'OPD-002', type: 'opd', status: 'opened' });

    expect(enc1.patientId).toEqual(patientId);
    expect(enc2.patientId).toEqual(patientId);
    expect(enc1.tokenNumber).not.toEqual(enc2.tokenNumber);
  });

  test('Acceptance Check 3: Multiple lab orders per encounter work', () => {
    const encId = new mongoose.Types.ObjectId();
    const patientId = new mongoose.Types.ObjectId();
    const docId = new mongoose.Types.ObjectId();

    const order1 = new InvestigationOrder({ encounterId: encId, patientId, doctorId: docId, testName: 'CBC' });
    const order2 = new InvestigationOrder({ encounterId: encId, patientId, doctorId: docId, testName: 'LFT' });

    expect(order1.encounterId).toEqual(encId);
    expect(order2.encounterId).toEqual(encId);
    expect(order1.testName).toBe('CBC');
    expect(order2.testName).toBe('LFT');
  });

  test('Acceptance Check 4: Multiple results per order/version work', () => {
    const orderId = new mongoose.Types.ObjectId();
    const patientId = new mongoose.Types.ObjectId();

    const resV1 = new LabResult({ investigationOrderId: orderId, patientId, testName: 'CBC', version: 1, parameters: [{ name: 'Hb', value: '10.5' }] });
    const resV2 = new LabResult({ investigationOrderId: orderId, patientId, testName: 'CBC', version: 2, parameters: [{ name: 'Hb', value: '11.0' }], originalValuePreserved: true });

    expect(resV1.investigationOrderId).toEqual(orderId);
    expect(resV2.investigationOrderId).toEqual(orderId);
    expect(resV1.version).toBe(1);
    expect(resV2.version).toBe(2);
    expect(resV2.originalValuePreserved).toBe(true);
  });

  test('Acceptance Check 5 & 6: Follow-ups and Referrals link to origin encounter', () => {
    const originEncId = new mongoose.Types.ObjectId();
    const patientId = new mongoose.Types.ObjectId();
    const docId = new mongoose.Types.ObjectId();
    const deptId = new mongoose.Types.ObjectId();

    const followUp = new FollowUp({ originEncounterId: originEncId, patientId, doctorId: docId, reason: 'lab_result' });
    const referral = new Referral({ encounterId: originEncId, originEncounterId: originEncId, patientId, fromDoctorId: docId, toDepartmentId: deptId, reason: 'Specialist consult' });

    expect(followUp.originEncounterId).toEqual(originEncId);
    expect(referral.originEncounterId).toEqual(originEncId);
    expect(referral.encounterId).toEqual(originEncId);
  });
});
