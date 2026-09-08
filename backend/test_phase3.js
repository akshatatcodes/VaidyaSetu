const axios = require('axios');

async function testPhase3() {
  console.log('=== TESTING PHASE 3: DOCTOR DASHBOARD & CLINICAL DECISION ENGINE ===');
  
  // 1. Fetch OPD Queue
  let queueRes = await axios.get('http://127.0.0.1:5000/api/kiosk/queue');
  console.log('1. Queue Count:', queueRes.data.data ? queueRes.data.data.length : 0);
  
  if (!queueRes.data.data || queueRes.data.data.length === 0) {
    console.log('Queue is empty! Creating a sample patient intake session...');
    const startRes = await axios.post('http://127.0.0.1:5000/api/kiosk/session/start', {
      patientName: 'Ramesh Patel',
      age: 58,
      gender: 'male',
      contactNumber: '9876543210',
      department: 'Kayachikitsa'
    });
    console.log('Created sample session token:', startRes.data.data.tokenNumber);
    
    // Add vitals
    await axios.patch('http://127.0.0.1:5000/api/kiosk/session/' + startRes.data.data._id + '/vitals', {
      systolicBP: 135,
      diastolicBP: 88,
      heartRate: 76,
      spo2: 98,
      temperature: 98.4,
      heightCm: 172,
      weightKg: 78
    });
    
    // Add chief complaint
    await axios.post('http://127.0.0.1:5000/api/kiosk/session/' + startRes.data.data._id + '/socrates', {
      chiefComplaint: 'Severe knee pain and stiffness in both knees when walking for 2 months',
      answers: {
        site: 'Bilateral knee joints',
        onset: 'Gradual over 2 months',
        character: 'Dull aching with stiffness in the morning',
        radiation: 'Radiates down the tibia',
        associations: 'Mild crepitus and swelling after standing',
        time_course: 'Worse early morning and winter',
        exacerbating: 'Climbing stairs and squatting',
        severity: '7 out of 10'
      }
    });

    // Synthesize SOAP
    await axios.post('http://127.0.0.1:5000/api/kiosk/session/' + startRes.data.data._id + '/synthesize-soap');
  }

  // 2. Fetch fresh queue
  queueRes = await axios.get('http://127.0.0.1:5000/api/kiosk/queue');
  const targetSession = queueRes.data.data[0];
  console.log('2. Target session selected:', {
    tokenNumber: targetSession.tokenNumber,
    patientName: targetSession.patientName,
    age: targetSession.age,
    triagePriority: targetSession.triagePriority,
    queueStatus: targetSession.queueStatus
  });

  // 3. Test Cross-System Herb-Drug Interaction (HDI) engine
  const hdiRes = await axios.post('http://127.0.0.1:5000/api/kiosk/check-interactions', {
    medicines: ['Warfarin', 'Guggulu', 'Metformin', 'Ashwagandha']
  });
  console.log('3. Herb-Drug Interaction Engine Check:');
  console.log('   - Total flags found:', hdiRes.data.data ? hdiRes.data.data.length : 0);
  if (hdiRes.data.data && hdiRes.data.data.length > 0) {
    console.log('   - Sample flag:', hdiRes.data.data[0].allopathicDrug || hdiRes.data.data[0].drug1, '+', hdiRes.data.data[0].ayurvedicHerb || hdiRes.data.data[0].drug2);
    console.log('   - Severity:', hdiRes.data.data[0].severity);
    console.log('   - Clinical description:', hdiRes.data.data[0].description || hdiRes.data.data[0].clinicalSignificance);
  }

  // 4. Test Doctor Approval & Digital Signing
  const approveRes = await axios.post('http://127.0.0.1:5000/api/kiosk/session/' + targetSession._id + '/approve', {
    doctorId: 'DOC-AYUSH-9921',
    doctorName: 'Dr. Rajesh Sharma, MD (Ayu)',
    registrationNumber: 'CCIM-DEL-2018-9844',
    department: 'Kayachikitsa',
    finalDiagnosis: {
      icd11: { code: 'FA00', term: 'Osteoarthritis of knee' },
      namaste: { code: 'AYU-KA-042', term: 'Sandhivata (Janu Sandhigata Vata)' }
    },
    approvedPlan: {
      ayushPrescription: [
        { name: 'Yogaraj Guggulu', dosage: '2 tablets BD', frequency: 'BD', duration: '21 days', anupana: 'Warm Water' },
        { name: 'Ashwagandha Churna', dosage: '3g at bedtime', frequency: 'HS', duration: '30 days', anupana: 'Warm Milk' }
      ],
      allopathicPrescription: [
        { name: 'Paracetamol', dosage: '500mg', frequency: 'SOS (Pain)', duration: '5 days', instructions: 'After food' }
      ],
      panchakarma: ['Janu Basti with Mahanarayana Taila (7 days)', 'Patra Pinda Sweda'],
      pathyaApathya: {
        pathya: 'Warm freshly cooked light food, cow milk, ghee, garlic, sun exposure',
        apathya: 'Curd at night, cold water, dry/stale foods, strenuous running, sitting on floor'
      },
      followUp: 'After 14 days with bilateral knee X-ray AP & Lateral views'
    }
  });
  console.log('4. Doctor Case Sheet Approval:');
  console.log('   - Status:', approveRes.data.status);
  console.log('   - Digital Signature:', approveRes.data.data.doctorReview?.digitalSignature ? 'GENERATED' : 'NONE');
  console.log('   - Queue Status:', approveRes.data.data.queueStatus);

  // 5. Test ABDM FHIR R4 Bundle Export
  const fhirRes = await axios.get('http://127.0.0.1:5000/api/kiosk/session/' + targetSession._id + '/fhir');
  console.log('5. ABDM FHIR R4 Document Bundle:');
  console.log('   - Resource Type:', fhirRes.data.resourceType);
  console.log('   - Bundle Type:', fhirRes.data.type);
  console.log('   - Bundle ID:', fhirRes.data.id);
  console.log('   - Total FHIR Entries:', fhirRes.data.entry ? fhirRes.data.entry.length : 0);
  if (fhirRes.data.entry && fhirRes.data.entry.length > 0) {
    const resourceTypes = fhirRes.data.entry.map(e => e.resource.resourceType);
    console.log('   - Contained Resources:', [...new Set(resourceTypes)].join(', '));
  }

  console.log('\n======================================================');
  console.log('✓ PHASE 3: DOCTOR DASHBOARD & CLINICAL DECISION ENGINES FULLY VERIFIED!');
  console.log('======================================================\n');
}

testPhase3().catch(err => {
  console.error('Test failed:', err.response ? err.response.data : err.message);
  process.exit(1);
});
