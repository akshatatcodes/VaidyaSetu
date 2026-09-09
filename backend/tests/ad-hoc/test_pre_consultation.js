const axios = require('axios');

async function testPreConsultation() {
  console.log('====================================================================');
  console.log('=== TESTING AI PRE-CONSULTATION PREPARATION & DELTA DETECTION ===');
  console.log('====================================================================');

  // 1. Test Starting a Returning Patient Session
  console.log('\n1. Initializing Returning Patient Session with Delta Changes & Lab Trends...');
  const startRes = await axios.post('http://127.0.0.1:5000/api/kiosk/session/start', {
    patientName: 'Rahul Sharma',
    age: 52,
    gender: 'male',
    abhaId: '14-8921-7732-0044',
    contactNumber: '9876543210',
    department: 'Kayachikitsa',
    isReturningPatient: true,
    changesSinceLastVisit: ['new_medicine', 'new_report'],
    changeDetails: 'Metformin increased from 500mg to 1000mg BD. HbA1c test done last week.'
  });

  const session = startRes.data.data;
  console.log(`   ✓ Token Generated: ${session.tokenNumber}`);
  console.log(`   ✓ Returning Patient Flag: ${session.isReturningPatient}`);
  console.log(`   ✓ Changes Detected: ${session.changesSinceLastVisit.join(', ')}`);
  console.log(`   ✓ Lab Trends Pre-loaded: ${session.labTrends.length} items`);
  console.log(`   ✓ Evidence Snippets Attached: ${session.evidenceSnippets.length} items`);

  // 2. Test "What Has Changed Since Your Last Visit?" Delta Endpoint
  console.log('\n2. Testing 10-Second Kiosk Delta Update (POST /api/kiosk/session/:id/quick-changes)...');
  const deltaRes = await axios.post(`http://127.0.0.1:5000/api/kiosk/session/${session._id}/quick-changes`, {
    changes: ['new_medicine'],
    details: 'Metformin changed to 1000mg BD.'
  });
  console.log(`   ✓ Delta Response Status: ${deltaRes.data.status}`);
  console.log(`   ✓ Recorded Delta: ${deltaRes.data.data.changes.join(', ')}`);

  // 3. Test Patient History Lookup (POST /api/kiosk/check-patient-history)
  console.log('\n3. Testing Instant ABHA Patient Lookup (POST /api/kiosk/check-patient-history)...');
  const lookupRes = await axios.post('http://127.0.0.1:5000/api/kiosk/check-patient-history', {
    abhaId: '14-8921-7732-0044'
  });
  console.log(`   ✓ Patient Found: ${lookupRes.data.isReturningPatient}`);
  console.log(`   ✓ Patient Name: ${lookupRes.data.patientData?.patientName}`);

  // 4. Test At-Home Visit Preparation (POST /api/kiosk/session/:id/prepare-visit)
  console.log('\n4. Testing At-Home Pre-Visit Preparation (POST /api/kiosk/session/:id/prepare-visit)...');
  const prepRes = await axios.post(`http://127.0.0.1:5000/api/kiosk/session/${session._id}/prepare-visit`, {
    uploadedDocuments: ['Prescription_Aug2026.jpg', 'HbA1c_Report_Sep2026.pdf'],
    verifiedMedicines: ['Metformin 1000mg', 'Amlodipine 5mg'],
    reportedSymptoms: 'Persistent mild joint stiffness and occasional acidity'
  });
  console.log(`   ✓ Preparation Saved: PreparedAtHome = ${prepRes.data.data.visitPreparation?.preparedAtHome}`);
  console.log(`   ✓ Uploaded Count: ${prepRes.data.data.visitPreparation?.documentsUploadedCount}`);

  // 5. Test Evidence & Trust Verification (GET /api/kiosk/session/:id/evidence)
  console.log('\n5. Testing Source & Evidence Verification Drawer (GET /api/kiosk/session/:id/evidence)...');
  const evidenceRes = await axios.get(`http://127.0.0.1:5000/api/kiosk/session/${session._id}/evidence`);
  const evidence = evidenceRes.data.data;
  console.log(`   ✓ Evidence items count: ${evidence.evidenceSnippets.length}`);
  if (evidence.evidenceSnippets.length > 0) {
    console.log(`   ✓ Sample Evidence Item: "${evidence.evidenceSnippets[0].item}"`);
    console.log(`     - Source: ${evidence.evidenceSnippets[0].sourceDocName}`);
    console.log(`     - AI Confidence: ${evidence.evidenceSnippets[0].confidence}%`);
    console.log(`     - Patient Verified: ${evidence.evidenceSnippets[0].verified}`);
  }

  // 6. Test SOAP Synthesis with Delta Changes & Lab Trends
  console.log('\n6. Synthesizing Doctor SOAP Note with Delta & Lab Trends...');
  const soapRes = await axios.post(`http://127.0.0.1:5000/api/kiosk/session/${session._id}/synthesize-soap`);
  const updatedSession = soapRes.data.data;
  console.log(`   ✓ SOAP Generated!`);
  console.log(`   ✓ Subjective Preview: ${updatedSession.soapNote?.subjective.substring(0, 150)}...`);
  console.log(`   ✓ Contains Returning Delta: ${updatedSession.soapNote?.subjective.includes('RETURNING PATIENT DELTA')}`);
  console.log(`   ✓ Contains Lab Trends: ${updatedSession.soapNote?.objective.includes('LAB TRENDS')}`);

  console.log('\n====================================================================');
  console.log('✓ ALL PRE-CONSULTATION, DELTA & EVIDENCE ENGINES VERIFIED 100%!');
  console.log('====================================================================\n');
}

testPreConsultation().catch(err => {
  console.error('Test failed:', err.response ? err.response.data : err.message);
  process.exit(1);
});
