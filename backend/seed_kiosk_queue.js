const mongoose = require('mongoose');
const IntakeSession = require('./src/models/IntakeSession');
require('dotenv').config();

async function seedKioskQueue() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB for Kiosk Queue seeding...');

  // Remove existing demo kiosk sessions
  await IntakeSession.deleteMany({ tokenNumber: { $in: ['OPD-DEMO-001', 'OPD-DEMO-002', 'OPD-DEMO-003'] } });

  const sessions = [
    // 1. Critical Red Flag Patient (Chest discomfort + Hypertension)
    {
      tokenNumber: 'OPD-DEMO-001',
      abhaId: '14-8921-3401-9921',
      patientName: 'Harishchandra Patil',
      age: 62,
      gender: 'Male',
      contactNumber: '+91 9820192834',
      languagePreference: 'mr',
      department: 'Kayachikitsa',
      queueStatus: 'flagged_emergency',
      triagePriority: 'emergency',
      vitals: {
        systolicBP: 184,
        diastolicBP: 108,
        heartRate: 104,
        spo2: 91,
        temperature: 98.4,
        respiratoryRate: 24,
        heightCm: 168,
        weightKg: 82,
        bmi: 29.1,
        bmiCategory: 'Overweight',
        capturedAt: new Date()
      },
      chiefComplaint: 'छातीत जडपणा, डाव्या हातात वेदना आणि धाप लागणे',
      socrates: {
        site: 'Substernal chest radiating to left arm and jaw',
        onset: 'Acute onset 45 minutes ago while walking',
        character: 'Heavy crushing pressure and tightness',
        radiation: 'Left upper arm, medial forearm, and left angle of jaw',
        associations: ['Profuse cold diaphoresis', 'Breathlessness', 'Nausea'],
        timeCourse: 'Continuous and escalating',
        exacerbatingRelieving: 'Aggravated by exertion, no relief on sitting',
        severity: 9
      },
      dashavidhaPariksha: {
        prakriti: { primaryDosha: 'Pitta', secondaryDosha: 'Vata', vataScore: 40, pittaScore: 70, kaphaScore: 20 },
        vikriti: 'Pitta-Vata Vriddhi with Hrid-Dhamani Rodha (Srotorodha)',
        sara: 'Madhyama (Medium)',
        samhanana: 'Madhyama (Moderate)',
        pramana: 'Atisthaulya (Obese)',
        satmya: 'Sarva-rasa (All tastes adaptable)',
        satva: 'Avara (Low resilience)',
        aharaShakti: { abhyavaharana: 'Avara (Poor)', jaranaShakti: 'Vishamagni (Irregular)' },
        vyayamaShakti: 'Avara (Poor capacity)',
        vaya: 'Vriddha (Geriatric)'
      },
      redFlags: [
        { flag: 'Suspected Acute Coronary Syndrome / Angina', category: 'Cardiovascular', severity: 'critical', detectedAt: new Date() },
        { flag: 'Hypertensive Crisis (Systolic BP 184 mmHg)', category: 'Cardiovascular', severity: 'critical', detectedAt: new Date() },
        { flag: 'Critical Hypoxemia (SpO2 91%)', category: 'Respiratory', severity: 'critical', detectedAt: new Date() }
      ],
      soapNote: {
        subjective: '62yo male presents with acute crushing substernal chest pressure radiating to left arm with cold diaphoresis and breathlessness for 45 mins. High cardiovascular risk profile.',
        objective: 'VITALS: BP 184/108 mmHg, HR 104 bpm, SpO2 91% on room air, RR 24/min. Patient pale and diaphoretic. Dashavidha indicates Pitta-Vata Srotorodha.',
        assessment: 'High suspicion of Acute Coronary Syndrome / Unstable Angina (ICD-11: BA41) with Hypertensive Crisis (BA00). Ayurvedic correlation: Hridroga with Pitta-Vata Vriddhi (NAMASTE: AYU-KA-054). URGENT TRIAGE ESCALATION REQUIRED.',
        plan: {
          allopathicMeds: [
            { name: 'Aspirin Dispersible', system: 'Allopathic', dosage: '300mg', frequency: 'STAT', duration: 'Immediate', instructions: 'Chew immediately' },
            { name: 'Sorbitrate (Isosorbide Dinitrate)', system: 'Allopathic', dosage: '5mg', frequency: 'Sublingual STAT', duration: 'Immediate', instructions: 'Under tongue under BP monitoring' }
          ],
          ayurvedicMeds: [
            { name: 'Prabhakar Vati', form: 'Vati', dose: '1 tab', anupana: 'Arjunarishta with warm water', duration: 'Post-stabilization' }
          ],
          panchakarmaRecommendations: ['Contraindicated in acute crisis. Stabilize hemodynamics first.'],
          pathyaApathya: {
            pathya: ['High-flow oxygen', 'Absolute bed rest in propped up cardiac position'],
            apathya: ['Physical exertion', 'Heavy oral fluids/meals until stabilized']
          },
          followUp: 'Immediate CCU / Emergency Dept Transfer'
        },
        generatedAt: new Date()
      },
      diagnoses: [
        { system: 'ICD-11', code: 'BA41', term: 'Acute coronary syndrome / Myocardial ischaemia' },
        { system: 'NAMASTE', code: 'AYU-KA-054', term: 'Vata-Pittaja Hridroga (Cardiac Ischaemic Syndrome)' }
      ]
    },

    // 2. High Value Ayurvedic Case: Knee Osteoarthritis with Drug Interaction Risk
    {
      tokenNumber: 'OPD-DEMO-002',
      abhaId: '82-1920-4491-0029',
      patientName: 'Subhadra Devi',
      age: 54,
      gender: 'Female',
      contactNumber: '+91 9412345678',
      languagePreference: 'hi',
      department: 'Kayachikitsa',
      queueStatus: 'intake_completed',
      triagePriority: 'normal',
      vitals: {
        systolicBP: 132,
        diastolicBP: 84,
        heartRate: 72,
        spo2: 98,
        temperature: 98.6,
        respiratoryRate: 16,
        heightCm: 154,
        weightKg: 66,
        bmi: 27.8,
        bmiCategory: 'Overweight',
        capturedAt: new Date()
      },
      chiefComplaint: 'दोनों घुटनों में तेज दर्द, सुबह उठने पर भारी अकड़न और सीढ़ी चढ़ने पर चरचराहट',
      socrates: {
        site: 'Bilateral knee joints (Right > Left)',
        onset: 'Gradual progression over past 8 months',
        character: 'Deep aching pain with mechanical grating crepitus',
        radiation: 'Downwards along tibial tuberosity',
        associations: ['Morning stiffness lasting 25 minutes', 'Difficulty sitting on floor (Palthi)'],
        timeCourse: 'Aggravated in cold weather and upon initial weight-bearing',
        exacerbatingRelieving: 'Relieved by warm mustard oil application and rest; worse after walking > 15 minutes',
        severity: 6
      },
      dashavidhaPariksha: {
        prakriti: { primaryDosha: 'Vata', secondaryDosha: 'Kapha', vataScore: 65, pittaScore: 25, kaphaScore: 45 },
        vikriti: 'Asthi-Majjagata Kupita Vata with Shleshaka Kapha Kshaya',
        sara: 'Madhyama (Medium)',
        samhanana: 'Madhyama (Moderate)',
        pramana: 'Atisthaulya (Obese)',
        satmya: 'Sarva-rasa (All tastes adaptable)',
        satva: 'Pravara (High mental endurance)',
        aharaShakti: { abhyavaharana: 'Madhyama (Moderate)', jaranaShakti: 'Mandagni (Sluggish)' },
        vyayamaShakti: 'Avara (Poor capacity)',
        vaya: 'Madhyama (Adult)'
      },
      ocrPrescriptions: [{
        imageUrl: '/demo-prescription-1.jpg',
        scannedAt: new Date(),
        extractedMedicines: [
          { name: 'Warfarin', dosage: '2mg', frequency: 'OD', duration: 'Ongoing (Atrial fibrillation)' },
          { name: 'Metformin', dosage: '500mg', frequency: 'BD', duration: 'Ongoing' }
        ],
        detectedInteractions: [
          {
            drugA: 'Guggulu',
            drugB: 'Warfarin',
            severity: 'Moderate',
            description: 'Guggulu has mild antiplatelet effects and may potentiate anticoagulation risk with Warfarin.'
          }
        ]
      }],
      soapNote: {
        subjective: '54yo female with 8-month history of bilateral knee pain (VAS 6/10), morning stiffness <30 mins, and crepitus. Known diabetic on Metformin and anticoagulated with Warfarin.',
        objective: 'VITALS: BP 132/84, HR 72, BMI 27.8. Bilateral knee joint line tenderness, bony enlargement, crepitus on passive flexion. Dashavidha: Vata-Kapha Prakriti with Asthi-Majjagata Vata.',
        assessment: 'Bilateral Primary Knee Osteoarthritis (ICD-11: FA00) corresponding to Sandhivata with Shleshaka Kapha Kshaya (NAMASTE: AYU-KA-042). Co-morbid T2DM and Anticoagulation therapy.',
        plan: {
          allopathicMeds: [
            { name: 'Paracetamol', system: 'Allopathic', dosage: '650mg', frequency: 'SOS (Max 2g/day)', duration: '5 days', instructions: 'Safe with Warfarin (monitor INR if used daily)' }
          ],
          ayurvedicMeds: [
            { name: 'Shallaki (Boswellia serrata)', form: 'Capsule', dose: '1 cap BD', anupana: 'Warm Water', duration: '30 days', pathya: 'Safe joint anti-inflammatory with minimal INR interference' },
            { name: 'Mahanarayana Taila', form: 'Taila', dose: 'Gentle external application around joint without heavy pressure', anupana: 'External', duration: '21 days' }
          ],
          panchakarmaRecommendations: ['Janu Basti with warm Ksheerabala Taila', 'Patra Pinda Swedana twice weekly'],
          pathyaApathya: {
            pathya: ['Warm light soups', 'Quadriceps isometric strengthening exercises', 'Warm water bathing'],
            apathya: ['Cross-legged sitting on floor', 'Squatting', 'Curd and fermented sour foods at night']
          },
          followUp: '14 days with repeat INR test'
        },
        generatedAt: new Date()
      },
      diagnoses: [
        { system: 'ICD-11', code: 'FA00', term: 'Primary osteoarthritis of knee' },
        { system: 'NAMASTE', code: 'AYU-KA-042', term: 'Sandhivata (Osteoarthritis of Sandhi)' }
      ],
      interactionAlerts: [
        {
          herb: 'Guggulu',
          drug: 'Warfarin',
          severity: 'Moderate',
          mechanism: 'Inhibition of platelet aggregation; potential INR fluctuation.',
          clinicalAdvice: 'Shallaki substituted instead of Yogaraja Guggulu to protect patient from bleeding diathesis.'
        }
      ]
    },

    // 3. Acid Reflux & Dyspepsia Patient
    {
      tokenNumber: 'OPD-DEMO-003',
      abhaId: '77-3819-2049-1182',
      patientName: 'Vikram Joshi',
      age: 38,
      gender: 'Male',
      contactNumber: '+91 9988776655',
      languagePreference: 'en',
      department: 'Kayachikitsa',
      queueStatus: 'waiting_intake',
      triagePriority: 'normal',
      vitals: {
        systolicBP: 124,
        diastolicBP: 80,
        heartRate: 78,
        spo2: 99,
        temperature: 98.2,
        respiratoryRate: 16,
        heightCm: 174,
        weightKg: 74,
        bmi: 24.4,
        bmiCategory: 'Normal',
        capturedAt: new Date()
      },
      chiefComplaint: 'Recurrent retrosternal burning, sour belching, and morning nausea for 3 weeks',
      socrates: {
        site: 'Epigastrium and retrosternal area',
        onset: 'Gradual, worsened during late-night work shifts',
        character: 'Burning sensation and acidic regurgitation',
        radiation: 'Upwards into mid-chest and throat',
        associations: ['Sour eructation (Tikta-Amla Udgara)', 'Loss of appetite'],
        timeCourse: 'Worse 1-2 hours post meals and when lying flat at night',
        exacerbatingRelieving: 'Aggravated by coffee, spicy fast food; temporarily eased by cold milk',
        severity: 5
      },
      dashavidhaPariksha: {
        prakriti: { primaryDosha: 'Pitta', secondaryDosha: 'Vata', vataScore: 35, pittaScore: 75, kaphaScore: 20 },
        vikriti: 'Pitta Prakopa with Vidagdhajirna',
        sara: 'Madhyama (Medium)',
        samhanana: 'Madhyama (Moderate)',
        pramana: 'Prakrita (Proportionate)',
        satmya: 'Sarva-rasa (All tastes adaptable)',
        satva: 'Madhyama (Moderate)',
        aharaShakti: { abhyavaharana: 'Madhyama (Moderate)', jaranaShakti: 'Tivra (Fast/Tikshnagni)' },
        vyayamaShakti: 'Madhyama (Moderate)',
        vaya: 'Madhyama (Adult)'
      },
      diagnoses: [
        { system: 'ICD-11', code: 'DA42', term: 'Gastro-oesophageal reflux disease' },
        { system: 'NAMASTE', code: 'AYU-KA-012', term: 'Amlapitta (Urdhwaga Pitta Prakopa)' }
      ]
    }
  ];

  await IntakeSession.insertMany(sessions);
  console.log(`Successfully seeded ${sessions.length} realistic OPD Kiosk sessions!`);
  process.exit(0);
}

seedKioskQueue().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
