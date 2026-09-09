/**
 * MediSahayak Phase regression tests (Jest)
 * Run: cd backend && npx jest tests/medisahayak.phases.test.js --forceExit
 */
const {
  QUESTION_TEMPLATES,
  COMPLETION_MESSAGES,
  LOCALES
} = require('../src/data/socratesQuestionTemplates');
const {
  processAdaptiveProbe,
  detectRedFlags
} = require('../src/services/adaptiveSocratesService');
const {
  processAyurvedaProbe,
  isAyurvedaDepartment
} = require('../src/services/dashavidhaService');
const {
  buildTokenPayload,
  parseTokenPayload,
  generateQrSvgDataUri
} = require('../src/services/qrService');
const abdmAdapter = require('../src/services/abdmAdapter');
const { flagLabsFromExtractedText, flagLabValue } = require('../src/utils/vitalRanges');

describe('Phase 1 — multilingual SOCRATES templates', () => {
  test('all locales present for site + severity', () => {
    expect(LOCALES.length).toBeGreaterThanOrEqual(12);
    for (const lang of LOCALES) {
      expect(QUESTION_TEMPLATES.site[lang]).toBeTruthy();
      expect(QUESTION_TEMPLATES.severity[lang]).toBeTruthy();
      expect(COMPLETION_MESSAGES[lang]).toBeTruthy();
    }
  });

  test('processAdaptiveProbe returns Tamil question when language=ta', async () => {
    const result = await processAdaptiveProbe({
      chiefComplaint: 'fever',
      userSpeech: 'head',
      currentStep: 'site',
      socratesState: {},
      language: 'ta'
    });
    expect(result.socrates.site).toBeTruthy();
    expect(result.nextQuestion).toContain('எப்போது');
  });
});

describe('Phase 1 — red flag escalation', () => {
  test('chest pain → critical cardiovascular flag', () => {
    const flags = detectRedFlags('I have severe chest pain and left arm pain');
    expect(flags.some(f => f.category === 'Cardiovascular' && f.severity === 'critical')).toBe(true);
  });

  test('SpO2 < 92 → respiratory critical', () => {
    const flags = detectRedFlags('', { spo2: 88 });
    expect(flags.some(f => f.category === 'Respiratory')).toBe(true);
  });
});

describe('Phase 4 — Ayurveda probe never auto-classifies', () => {
  test('isAyurvedaDepartment', () => {
    expect(isAyurvedaDepartment('Kayachikitsa')).toBe(true);
    expect(isAyurvedaDepartment('General Medicine')).toBe(false);
  });

  test('probe returns null classification', () => {
    const r = processAyurvedaProbe({
      userSpeech: 'good appetite',
      currentStep: 'agni',
      ayurvedaState: {},
      language: 'hi'
    });
    expect(r.suggestedClassification).toBeNull();
    expect(r.physicianConfirmationRequired).toBe(true);
    expect(r.ayurvedaAnswers.agni).toBe('good appetite');
  });
});

describe('Phase 5 — QR payload privacy', () => {
  test('payload has only token + session id', () => {
    const raw = buildTokenPayload({ sessionId: 'abc123', tokenNumber: 'OPD-20260101-001' });
    const parsed = parseTokenPayload(raw);
    expect(parsed.tokenNumber).toBe('OPD-20260101-001');
    expect(parsed.sessionId).toBe('abc123');
    expect(raw).not.toMatch(/chest|diagnosis|complaint/i);
    const svg = generateQrSvgDataUri(raw);
    expect(svg.startsWith('data:image/svg+xml')).toBe(true);
  });
});

describe('Phase 2 — lab flagging (no diagnosis)', () => {
  test('HbA1c 8.2 flagged with clinical interpretation required', () => {
    const flags = flagLabsFromExtractedText('HbA1c 8.2%');
    expect(flags.length).toBeGreaterThan(0);
    expect(flags[0].flag).toMatch(/clinical interpretation required/i);
  });

  test('normal hemoglobin not flagged', () => {
    expect(flagLabValue('hemoglobin', 13.5)).toBeNull();
  });
});

describe('Phase 8 — FHIR adapter stub', () => {
  test('sessionToFhirBundle shapes Patient + Encounter', () => {
    const session = {
      _id: 'sid1',
      tokenNumber: 'OPD-TEST-001',
      patientName: 'Test Patient',
      gender: 'Female',
      abhaId: '14-1234-5678-9012',
      contactNumber: '9999999999',
      queueStatus: 'intake_completed',
      department: 'Kayachikitsa',
      vitals: { systolicBP: 120, diastolicBP: 80, heartRate: 72, spo2: 98 },
      diagnoses: [{ system: 'ICD-11', code: 'FA00', term: 'OA knee' }],
      soapNote: { plan: { allopathicMeds: [{ name: 'Paracetamol', dosage: '500mg' }], ayurvedicMeds: [] } },
      documents: []
    };
    const bundle = abdmAdapter.sessionToFhirBundle(session);
    expect(bundle.resourceType).toBe('Bundle');
    const types = bundle.entry.map(e => e.resource.resourceType);
    expect(types).toContain('Patient');
    expect(types).toContain('Encounter');
    expect(types).toContain('Observation');
    expect(types).toContain('Condition');
    expect(types).toContain('MedicationRequest');
  });
});
