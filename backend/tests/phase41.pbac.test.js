const { evaluateAccess } = require('../src/services/pbacService');

describe('Phase 41 — Privacy & Purpose-Based Access Control (PBAC)', () => {
  test('1. Doctor role ALONE without purpose or assignment is DENIED access to arbitrary patient record', () => {
    const result = evaluateAccess({
      role: 'doctor',
      userId: 'doc-101',
      purpose: 'clinical_care',
      patientId: 'patient-999', // Arbitrary unassigned patient
      isAssigned: false,
      hasConsent: false
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('PBAC Violation');
  });

  test('2. Doctor with clinical_care purpose AND assigned encounter is GRANTED access', () => {
    const result = evaluateAccess({
      role: 'doctor',
      userId: 'doc-101',
      purpose: 'clinical_care',
      patientId: 'patient-123',
      encounterId: 'enc-456',
      isAssigned: true,
      hasConsent: false
    });

    expect(result.allowed).toBe(true);
    expect(result.reason).toContain('authorized for clinical care');
  });

  test('3. Doctor with clinical_care purpose AND active patient consent is GRANTED access', () => {
    const result = evaluateAccess({
      role: 'doctor',
      userId: 'doc-102',
      purpose: 'clinical_care',
      patientId: 'patient-789',
      isAssigned: false,
      hasConsent: true
    });

    expect(result.allowed).toBe(true);
  });

  test('4. Doctor with emergency_override purpose gets break-glass access', () => {
    const result = evaluateAccess({
      role: 'doctor',
      userId: 'doc-103',
      purpose: 'emergency_override',
      patientId: 'patient-999',
      isAssigned: false,
      hasConsent: false
    });

    expect(result.allowed).toBe(true);
    expect(result.emergencyBreakGlass).toBe(true);
  });

  test('5. Patient accessing own record with patient_self_access purpose is GRANTED access', () => {
    const result = evaluateAccess({
      role: 'patient',
      userId: 'patient-123',
      purpose: 'patient_self_access',
      patientId: 'patient-123'
    });

    expect(result.allowed).toBe(true);
  });

  test('6. Patient attempting to access another patient record without consent is DENIED', () => {
    const result = evaluateAccess({
      role: 'patient',
      userId: 'patient-123',
      purpose: 'patient_self_access',
      patientId: 'patient-456',
      hasConsent: false
    });

    expect(result.allowed).toBe(false);
  });
});
