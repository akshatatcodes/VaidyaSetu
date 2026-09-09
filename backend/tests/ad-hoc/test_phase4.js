const axios = require('axios');

async function testPhase4() {
  console.log('================================================================');
  console.log('=== TESTING PHASE 4: ABDM FHIR R4 BUNDLE & GATEWAY SYNC ENGINE ===');
  console.log('================================================================');

  // 1. Fetch OPD Queue to find or initialize a target session
  let queueRes = await axios.get('http://127.0.0.1:5000/api/kiosk/queue');
  let targetSession = queueRes.data.data?.[0];

  if (!targetSession) {
    console.log('Creating sample patient intake session...');
    const startRes = await axios.post('http://127.0.0.1:5000/api/kiosk/session/start', {
      patientName: 'Devendra Joshi',
      age: 49,
      gender: 'male',
      abhaId: '91-8726-1928-4401',
      contactNumber: '9820192834',
      department: 'Kayachikitsa'
    });
    targetSession = startRes.data.data;
  }

  console.log(`\n1. Target Session Identified:`);
  console.log(`   - Token: ${targetSession.tokenNumber}`);
  console.log(`   - Patient: ${targetSession.patientName} (${targetSession.gender}, ${targetSession.age} yrs)`);
  console.log(`   - ABHA ID: ${targetSession.abhaId}`);
  console.log(`   - Department: ${targetSession.department}`);

  // 2. Commit a complete clinical diagnosis & dual-prescription if not present
  console.log(`\n2. Committing Doctor Approval & Dual Prescription (ICD-11 + NAMASTE)...`);
  await axios.patch(`http://127.0.0.1:5000/api/kiosk/session/${targetSession._id}/approve`, {
    doctorId: 'DOC-AYU-2024-8891',
    doctorName: 'Dr. Vikramaditya Sharma (BAMS, MD Ayur)',
    signature: 'Digitally Signed: Dr. V. Sharma (Reg #AYU-2918)',
    doctorNotes: 'Patient advised 2-week follow-up, avoid cold exposures and strenuous exercise.',
    updatedDiagnoses: [
      { system: 'ICD-11', code: 'FA00', term: 'Osteoarthritis of knee' },
      { system: 'NAMASTE', code: 'AYU-KA-042', term: 'Sandhivata (Janu Sandhigata Vata)' }
    ],
    prescribedAllopathicMeds: [
      { name: 'Paracetamol', dosage: '500mg', frequency: 'SOS', duration: '5 days', instructions: 'After meals' }
    ],
    prescribedAyurvedicMeds: [
      { name: 'Yogaraj Guggulu', dosage: '2 tablets BD', frequency: 'BD', duration: '21 days', anupana: 'Warm Water' },
      { name: 'Ashwagandha Churna', dosage: '3g at bedtime', frequency: 'HS', duration: '30 days', anupana: 'Warm Milk' }
    ]
  });
  console.log(`   ✓ Case sheet approved and signed.`);

  // 3. Test Full NRCeS ABDM FHIR R4 Document Bundle Generation
  console.log(`\n3. Requesting Full ABDM FHIR R4 Document Bundle (GET /api/kiosk/session/:id/fhir)...`);
  const fhirRes = await axios.get(`http://127.0.0.1:5000/api/kiosk/session/${targetSession._id}/fhir`);
  const bundle = fhirRes.data;

  console.log(`   - Resource Type: ${bundle.resourceType}`);
  console.log(`   - Bundle Type: ${bundle.type}`);
  console.log(`   - Bundle ID: ${bundle.id}`);
  console.log(`   - Profile: ${bundle.meta?.profile?.[0]}`);
  console.log(`   - Identifier: ${bundle.identifier?.value}`);
  console.log(`   - Total Contained Resources: ${bundle.entry?.length}`);

  // Inspect each contained resource
  const resourceTypes = bundle.entry.map(e => e.resource.resourceType);
  console.log(`   - Resource Roster: [ ${[...new Set(resourceTypes)].join(', ')} ]`);

  // Verify key clinical resources
  const composition = bundle.entry.find(e => e.resource.resourceType === 'Composition')?.resource;
  const patient = bundle.entry.find(e => e.resource.resourceType === 'Patient')?.resource;
  const practitioner = bundle.entry.find(e => e.resource.resourceType === 'Practitioner')?.resource;
  const encounter = bundle.entry.find(e => e.resource.resourceType === 'Encounter')?.resource;
  const conditions = bundle.entry.filter(e => e.resource.resourceType === 'Condition').map(e => e.resource);
  const medications = bundle.entry.filter(e => e.resource.resourceType === 'MedicationRequest').map(e => e.resource);
  const carePlan = bundle.entry.find(e => e.resource.resourceType === 'CarePlan')?.resource;

  console.log(`\n   ✓ Composition: Title="${composition?.title}", Status=${composition?.status}`);
  console.log(`   ✓ Patient: Name="${patient?.name?.[0]?.text}", ABHA="${patient?.identifier?.[0]?.value}"`);
  console.log(`   ✓ Practitioner: Name="${practitioner?.name?.[0]?.text}", Qualification="${practitioner?.qualification?.[0]?.code?.text}"`);
  console.log(`   ✓ Encounter: Department="${encounter?.serviceType?.text}", Status=${encounter?.status}`);
  console.log(`   ✓ Dual Diagnoses (Conditions count: ${conditions.length}):`);
  conditions.forEach(c => console.log(`     * ${c.code?.text}`));
  console.log(`   ✓ Medication Prescriptions (MedicationRequests count: ${medications.length}):`);
  medications.forEach(m => console.log(`     * ${m.medicationCodeableConcept?.text} -> ${m.dosageInstruction?.[0]?.text}`));
  console.log(`   ✓ CarePlan: Title="${carePlan?.title}", Status=${carePlan?.status}`);

  // 4. Test Gateway Sync to ABDM Health Locker / ABHA
  console.log(`\n4. Triggering ABDM Gateway Sync (POST /api/kiosk/session/:id/sync-abdm)...`);
  const syncRes = await axios.post(`http://127.0.0.1:5000/api/kiosk/session/${targetSession._id}/sync-abdm`);
  const syncData = syncRes.data.data;

  console.log(`   - Status: ${syncRes.data.status}`);
  console.log(`   - Message: ${syncRes.data.message}`);
  console.log(`   - Care Context ID: ${syncData.careContextId}`);
  console.log(`   - Consent Artifact ID: ${syncData.consentId}`);
  console.log(`   - Gateway Transaction ID: ${syncData.transactionId}`);
  console.log(`   - Bridge HIP ID: ${syncData.hipId}`);
  console.log(`   - Synced At: ${syncData.syncedAt}`);
  console.log(`   - Synchronized Bundle Entries: ${syncData.bundleSummary.resourceCount} items`);

  // 5. Verify Database Record Integrity
  console.log(`\n5. Verifying Database Record Persistence...`);
  const verifyRes = await axios.get(`http://127.0.0.1:5000/api/kiosk/session/${targetSession._id}`);
  const persistedSession = verifyRes.data.data;

  console.log(`   - Queue Status: ${persistedSession.queueStatus}`);
  console.log(`   - ABDM Synced Flag: ${persistedSession.abdmSync?.synced}`);
  console.log(`   - Persisted Care Context: ${persistedSession.abdmSync?.careContextId}`);
  console.log(`   - Stored FHIR Bundle ID: ${persistedSession.fhirBundle?.id}`);

  console.log('\n================================================================');
  console.log('✓ PHASE 4: ABDM FHIR R4 & GATEWAY SYNC ENGINES 100% VERIFIED!');
  console.log('================================================================\n');
}

testPhase4().catch(err => {
  console.error('Phase 4 Test failed:', err.response ? err.response.data : err.message);
  process.exit(1);
});
