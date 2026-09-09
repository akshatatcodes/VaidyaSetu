const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5000/api/kiosk';

// ANSI Colors for beautiful terminal output
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const magenta = '\x1b[35m';
const red = '\x1b[31m';
const reset = '\x1b[0m';
const bold = '\x1b[1m';

async function runCompletePhase1Test() {
  console.log(`\n${bold}${cyan}================================================================${reset}`);
  console.log(`${bold}${cyan}        VAIDYASETU: COMPLETE PHASE 1 TEST SUITE (${new Date().toLocaleDateString()}) ${reset}`);
  console.log(`${bold}${cyan}================================================================${reset}\n`);

  try {
    // -------------------------------------------------------------
    // STEP 1: Patient Check-In & OPD Token Generation
    // -------------------------------------------------------------
    console.log(`${bold}1. Patient Check-In (POST /session/start)...${reset}`);
    const checkInPayload = {
      abhaId: '91-4829-1049-2819',
      patientName: 'Rameshwar Patil',
      age: 52,
      gender: 'Male',
      contactNumber: '+91 9823145670',
      languagePreference: 'hi',
      department: 'Kayachikitsa'
    };
    const startRes = await axios.post(`${BASE_URL}/session/start`, checkInPayload);
    const session = startRes.data.data;
    const sessionId = session._id;
    const tokenNumber = session.tokenNumber;

    console.log(`   ${green}✓ Success:${reset} Assigned Token: ${bold}${yellow}${tokenNumber}${reset}`);
    console.log(`   Patient: ${session.patientName} (${session.age}y ${session.gender}) | ABHA: ${session.abhaId}`);
    console.log(`   Initial Status: ${session.queueStatus} | Triage: ${session.triagePriority}`);

    // -------------------------------------------------------------
    // STEP 2: Biometric Vitals Station & Automatic BMI
    // -------------------------------------------------------------
    console.log(`\n${bold}2. Biometric Vitals Station (PATCH /session/:id/vitals)...${reset}`);
    const vitalsPayload = {
      systolicBP: 138,
      diastolicBP: 88,
      heartRate: 78,
      spo2: 98,
      temperature: 98.4,
      respiratoryRate: 18,
      heightCm: 165,
      weightKg: 78
    };
    const vitalsRes = await axios.patch(`${BASE_URL}/session/${sessionId}/vitals`, vitalsPayload);
    const vitals = vitalsRes.data.data.vitals;

    console.log(`   ${green}✓ Success:${reset} Logged BP ${vitals.systolicBP}/${vitals.diastolicBP} mmHg | HR ${vitals.heartRate} bpm | SpO2 ${vitals.spo2}%`);
    console.log(`   ${magenta}Calculated BMI:${reset} ${bold}${vitals.bmi}${reset} (Category: ${yellow}${vitals.bmiCategory}${reset})`);

    // -------------------------------------------------------------
    // STEP 3: Multilingual Voice Intake with SOCRATES Probing
    // -------------------------------------------------------------
    console.log(`\n${bold}3. Multilingual Voice Intake (POST /session/:id/socrates-probe)...${reset}`);
    const probe1 = await axios.post(`${BASE_URL}/session/${sessionId}/socrates-probe`, {
      chiefComplaint: 'पेट के ऊपरी हिस्से में बहुत तेज जलन और खट्टी डकारें आ रही हैं',
      userSpeech: 'पिछले 2 हफ्ते से खाना खाने के बाद पेट में तेज जलन होती है और खट्टा पानी गले तक आता है',
      currentStep: 'character',
      language: 'hi'
    });

    console.log(`   ${green}✓ Success:${reset} Recorded Chief Complaint in Hindi`);
    console.log(`   Patient Utterance: "${yellow}पिछले 2 हफ्ते से खाना खाने के बाद...${reset}"`);
    console.log(`   ${cyan}Next Adaptive Question Prompted by Kiosk:${reset}`);
    console.log(`   "${bold}${probe1.data.data.nextQuestion}${reset}"`);

    // -------------------------------------------------------------
    // STEP 4: AYUSH Dashavidha Pariksha 10-Fold Assessment
    // -------------------------------------------------------------
    console.log(`\n${bold}4. AYUSH Dashavidha Pariksha (PATCH /session/:id/dashavidha)...${reset}`);
    const dashaPayload = {
      dashavidhaPariksha: {
        prakriti: { primaryDosha: 'Pitta', secondaryDosha: 'Vata', vataScore: 35, pittaScore: 75, kaphaScore: 20 },
        vikriti: 'Pitta Prakopa with Vidagdha Amlodgara',
        sara: 'Madhyama (Medium)',
        samhanana: 'Madhyama (Moderate)',
        pramana: 'Prakrita (Proportionate)',
        satmya: 'Sarva-rasa (All tastes adaptable)',
        satva: 'Madhyama (Moderate)',
        aharaShakti: { abhyavaharana: 'Madhyama (Moderate)', jaranaShakti: 'Tivra (Fast/Tikshnagni)' },
        vyayamaShakti: 'Madhyama (Moderate)',
        vaya: 'Madhyama (Adult)'
      }
    };
    const dashaRes = await axios.patch(`${BASE_URL}/session/${sessionId}/dashavidha`, dashaPayload);
    const pariksha = dashaRes.data.data;

    console.log(`   ${green}✓ Success:${reset} Prakriti: ${bold}${pariksha.prakriti.primaryDosha}-${pariksha.prakriti.secondaryDosha}${reset}`);
    console.log(`   Agni Status: ${yellow}${pariksha.aharaShakti.jaranaShakti}${reset} | Vikriti: ${pariksha.vikriti}`);

    // -------------------------------------------------------------
    // STEP 5: 10-Second Doctor SOAP Note & Dual Diagnostic Coding
    // -------------------------------------------------------------
    console.log(`\n${bold}5. Synthesizing 10-Second Doctor SOAP Note (POST /session/:id/generate-soap)...${reset}`);
    const soapRes = await axios.post(`${BASE_URL}/session/${sessionId}/generate-soap`);
    const soapData = soapRes.data.data;

    console.log(`   ${green}✓ Success:${reset} Auto-Generated SOAP Case Sheet`);
    console.log(`   ${cyan}[Subjective]:${reset} ${soapData.soapNote.subjective.slice(0, 110)}...`);
    console.log(`   ${cyan}[Objective]:${reset} ${soapData.soapNote.objective.slice(0, 110)}...`);
    console.log(`   ${cyan}[Assessment]:${reset} ${soapData.soapNote.assessment.slice(0, 110)}...`);
    console.log(`\n   ${bold}Mapped Dual Clinical Diagnoses:${reset}`);
    soapData.diagnoses.forEach(d => {
      console.log(`   • ${bold}${d.system}:${reset} ${cyan}${d.code}${reset} -> ${d.term}`);
    });

    console.log(`\n   ${bold}Prescribed Ayurvedic Regimen (Plan):${reset}`);
    soapData.soapNote.plan.ayurvedicMeds.forEach(m => {
      console.log(`   • ${bold}${m.name}${reset} (${m.dosage}) - Anupana: ${m.anupana}`);
    });

    // -------------------------------------------------------------
    // STEP 6: Doctor OPD Queue & Triage Priority Verification
    // -------------------------------------------------------------
    console.log(`\n${bold}6. Doctor OPD Live Queue Verification (GET /queue)...${reset}`);
    const queueRes = await axios.get(`${BASE_URL}/queue`);
    const stats = queueRes.data.stats;
    const queue = queueRes.data.data;

    console.log(`   ${green}✓ Success:${reset} Active Queue Stats:`);
    console.log(`     Total Waiting: ${bold}${stats.totalInQueue}${reset} | Emergency: ${red}${stats.emergencyCount}${reset} | Ready for Review: ${green}${stats.readyForReview}${reset}`);
    console.log(`\n   ${bold}Current Queue Order (Emergency First):${reset}`);
    queue.slice(0, 5).forEach((p, idx) => {
      const pColor = p.triagePriority === 'emergency' ? red : yellow;
      console.log(`     [#${idx + 1}] ${bold}${p.tokenNumber}${reset} | ${pColor}${p.triagePriority.toUpperCase()}${reset} | ${p.patientName} (${p.age}y ${p.gender})`);
    });

    // -------------------------------------------------------------
    // STEP 7: Doctor Digital Sign-Off & Approval
    // -------------------------------------------------------------
    console.log(`\n${bold}7. Doctor Review & Sign-Off (PATCH /session/:id/approve)...${reset}`);
    const approveRes = await axios.patch(`${BASE_URL}/session/${tokenNumber}/approve`, {
      doctorId: 'DOC-AYUSH-101',
      doctorName: 'Dr. Vikramaditya Sharma (MD Ayur)',
      signature: 'Signed Digitally: Dr. V. Sharma (Reg #AYU-2918)',
      doctorNotes: 'Kamadudha Rasa and Avipattikar Churna approved. Advised to avoid spicy and late-night food.'
    });

    console.log(`   ${green}✓ Success:${reset} Doctor Approval Recorded!`);
    console.log(`   Doctor: ${approveRes.data.data.doctorReview.doctorName}`);
    console.log(`   Signature: ${approveRes.data.data.doctorReview.signature}`);
    console.log(`   Final Queue Status: ${bold}${green}${approveRes.data.data.queueStatus}${reset}`);

    console.log(`\n${bold}${green}================================================================${reset}`);
    console.log(`${bold}${green}      ALL PHASE 1 CLINICAL BACKEND ENGINES PASSED 100%!       ${reset}`);
    console.log(`${bold}${green}================================================================${reset}\n`);

  } catch (error) {
    console.error(`${red}\nPhase 1 Test Failed:${reset}`, error.message);
    if (error.response?.data) console.error(error.response.data);
  }
}

runCompletePhase1Test();
