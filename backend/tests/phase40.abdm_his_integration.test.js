const abdmIntegrationService = require('../src/services/abdmIntegrationService');
const hisIntegrationService = require('../src/services/hisIntegrationService');

describe('Phase 40 — ABDM / HIS Integration Layer', () => {
  const mockSession = {
    _id: '507f1f77bcf86cd799439011',
    tokenNumber: 'OPD-20260910-101',
    patientName: 'Aarav Sharma',
    contactNumber: '+919876543210',
    gender: 'Male',
    abhaId: 'aarav@sbx',
    queueStatus: 'completed',
    department: 'Kayachikitsa',
    vitals: { systolicBP: 120, diastolicBP: 80, heartRate: 72 },
    diagnoses: [{ code: '1B10', term: 'Essential Hypertension', system: 'ICD-11' }],
    soapNote: {
      plan: {
        ayurvedicMeds: [{ name: 'Ashwagandha Churna', dosage: '1 tsp', frequency: 'BD' }]
      }
    }
  };

  test('1. abdmIntegrationService generates sanitized sync summary for clinical UI', () => {
    const summary = abdmIntegrationService.getAbdmSyncSummary(mockSession);
    expect(summary.synced).toBe(true);
    expect(summary.badgeText).toContain('ABDM Sync: ✓');
    expect(summary).not.toHaveProperty('entry'); // Raw FHIR JSON hidden from UI summary
  });

  test('2. abdmIntegrationService exports FHIR R4 Bundle for authorized tech inspection', () => {
    const bundle = abdmIntegrationService.generateFhirBundle(mockSession);
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('collection');
    expect(Array.isArray(bundle.entry)).toBe(true);
    expect(bundle.entry.length).toBeGreaterThan(0);
  });

  test('3. abdmIntegrationService pushes encounter to ABDM gateway via adapter', () => {
    const res = abdmIntegrationService.pushEncounterToAbdm(mockSession);
    expect(res.status).toBeDefined();
    expect(res.careContextId).toBe('CC-OPD-20260910-101');
  });

  test('4. hisIntegrationService syncs prescriptions to pharmacy module', () => {
    const pharm = hisIntegrationService.syncPrescriptionsToPharmacy(mockSession);
    expect(pharm.status).toBe('success');
    expect(pharm.itemCount).toBe(1);
  });

  test('5. hisIntegrationService returns clean HIS status summary', () => {
    const summary = hisIntegrationService.getHisSyncSummary(mockSession);
    expect(summary.synced).toBe(true);
    expect(summary.badgeText).toBe('HIS Sync: ✓');
  });
});
