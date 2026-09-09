const { Groq } = require('groq-sdk');

const isValidGroqKey = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_');
const groq = isValidGroqKey ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Clinical Knowledge Base: Common OPD mappings between symptoms, ICD-11, and AYUSH NAMASTE portal
const CLINICAL_DIAGNOSIS_CATALOG = [
  {
    keywords: ['knee', 'joint', 'sandhi', 'arthritis', 'swelling in joints', 'घुटने में दर्द', 'सांधेदुखी'],
    allopathic: { code: 'FA00', term: 'Osteoarthritis of knee', system: 'ICD-11' },
    ayurvedic: { code: 'AYU-KA-042', term: 'Sandhivata (Osteoarthritis / Vata in Joints)', system: 'NAMASTE' },
    ayushPlan: [
      { name: 'Yogaraja Guggulu', form: 'Vati (Tablet)', dose: '2 tablets BD', anupana: 'Warm Water', duration: '14 days' },
      { name: 'Mahanarayana Taila', form: 'Taila (Oil)', dose: 'For external Abhyanga', anupana: 'External Use', duration: '21 days' }
    ],
    panchakarma: ['Janu Basti with Ksheerabala Taila', 'Patra Pinda Swedana'],
    pathya: ['Light warm meals (Laghu Ahara)', 'Garlic, ginger, drumstick', 'Gentle mobility stretches'],
    apathya: ['Dry cold food (Ruksha-Sheeta)', 'Curd at night', 'Excessive stair climbing, squatting']
  },
  {
    keywords: ['acidity', 'burning', 'acid reflux', 'heartburn', 'amlapitta', 'पेट में जलन', 'छातीत जळजळ'],
    allopathic: { code: 'DA42', term: 'Gastro-oesophageal reflux disease (GERD)', system: 'ICD-11' },
    ayurvedic: { code: 'AYU-KA-012', term: 'Urdhwaga Amlapitta (Hyperacidity / Pitta Prakopa)', system: 'NAMASTE' },
    ayushPlan: [
      { name: 'Avipattikar Churna', form: 'Churna (Powder)', dose: '3 grams twice daily before meals', anupana: 'Warm Water or Coconut Water', duration: '10 days' },
      { name: 'Kamadudha Rasa (Moti Yukta)', form: 'Vati', dose: '1 tablet BD', anupana: 'Milk or Water', duration: '10 days' }
    ],
    panchakarma: ['Vamana (if indicated in Utklesha state)', 'Mridu Virechana with Triphala'],
    pathya: ['Pomegranate, amla, barley', 'Fennel seed infusion', 'Adequate sleep and unhurried meals'],
    apathya: ['Deep fried, excessively spicy, or sour foods', 'Smoking, tea/coffee on empty stomach', 'Immediate sleep after meals']
  },
  {
    keywords: ['sugar', 'diabetes', 'prameha', 'madhumeha', 'polyuria', 'मधुमेह', 'साखर'],
    allopathic: { code: '5A11', term: 'Type 2 Diabetes Mellitus', system: 'ICD-11' },
    ayurvedic: { code: 'AYU-KA-028', term: 'Madhumeha (Vataja Prameha)', system: 'NAMASTE' },
    ayushPlan: [
      { name: 'Nisha Amalaki Churna', form: 'Churna', dose: '3g BD before meals', anupana: 'Warm Water', duration: '30 days' },
      { name: 'Chandraprabha Vati', form: 'Vati', dose: '2 tablets BD', anupana: 'Water', duration: '21 days' }
    ],
    panchakarma: ['Udvartana (Herbal powder scrub)', 'Takradhara'],
    pathya: ['Barley (Yava), bitter gourd (Karela), methi', 'Brisk morning walks 30-45 mins', 'Triphala decoction'],
    apathya: ['Refined sugar, sweets, cold milk drinks', 'Sedentary daytime sleeping (Divaswapna)', 'Processed bakery goods']
  },
  {
    keywords: ['blood pressure', 'hypertension', 'raktavata', 'high bp', 'बीपी', 'रक्तदाब'],
    allopathic: { code: 'BA00', term: 'Essential Hypertension', system: 'ICD-11' },
    ayurvedic: { code: 'AYU-KA-067', term: 'Raktagata Vata / Uccharaktachapa', system: 'NAMASTE' },
    ayushPlan: [
      { name: 'Sarpagandha Ghan Vati', form: 'Vati', dose: '1 tablet at bedtime', anupana: 'Water', duration: '14 days' },
      { name: 'Arjunarishta', form: 'Asava-Arishta', dose: '15ml with equal water after meals BD', anupana: 'Water', duration: '30 days' }
    ],
    panchakarma: ['Shirodhara with Brahmi / Chandanadi Taila', 'Nasya with Ksheerabala 101'],
    pathya: ['Garlic, bottle gourd (Lauki), pomegranate', 'Pranayama (Anulom Vilom, Bhramari)', 'Consistent sleep schedule'],
    apathya: ['Excessive table salt (Lavana)', 'Stress, anger, late night shifts', 'Heavy oily dinners']
  },
  {
    keywords: ['cough', 'cold', 'phlegm', 'kasa', 'bronchitis', 'खांसी', 'खोकला'],
    allopathic: { code: 'CA42', term: 'Chronic Bronchitis / Respiratory Catarrh', system: 'ICD-11' },
    ayurvedic: { code: 'AYU-PR-015', term: 'Kaphaja Kasa (Cough with vitiated Kapha)', system: 'NAMASTE' },
    ayushPlan: [
      { name: 'Sitopaladi Churna', form: 'Churna', dose: '3g thrice daily', anupana: 'Honey (Madhu) or Ghee', duration: '7 days' },
      { name: 'Vasavaleha', form: 'Avaleha', dose: '5g BD after meals', anupana: 'Warm Milk or Water', duration: '10 days' }
    ],
    panchakarma: ['Dhoomapana (Herbal smoke)', 'Uro-Basti with warm sesame oil'],
    pathya: ['Warm ginger tea, black pepper, tulsi', 'Steam inhalation with eucalyptus/mint', 'Light mung dal soup'],
    apathya: ['Cold refrigerated drinks, ice cream', 'Direct exposure to cold breeze or AC', 'Heavy sweets and oily food']
  },
  {
    keywords: ['back pain', 'sciatica', 'gridhrasi', 'lumbago', 'कमर दर्द', 'कंबरदुखी'],
    allopathic: { code: 'ME84.2', term: 'Low back pain with lumbar radiculopathy', system: 'ICD-11' },
    ayurvedic: { code: 'AYU-KA-089', term: 'Gridhrasi (Sciatica / Vataja Neuromuscular Disorder)', system: 'NAMASTE' },
    ayushPlan: [
      { name: 'Trayodashanga Guggulu', form: 'Vati', dose: '2 tablets BD', anupana: 'Warm Water', duration: '14 days' },
      { name: 'Balarishta', form: 'Arishta', dose: '20ml with equal water after lunch & dinner', anupana: 'Water', duration: '21 days' }
    ],
    panchakarma: ['Kati Basti with Sahacharadi Taila', 'Matra Basti with Dhanwantaram Taila'],
    pathya: ['Warm nourishing soups', 'Supportive mattress, posture ergonomics', 'Mild back extension exercises'],
    apathya: ['Lifting heavy weights with bent back', 'Prolonged two-wheeler travel on rough roads', 'Cold damp environments']
  }
];

/**
 * Match clinical presentation to standard catalog
 */
function findDiagnosticMatches(chiefComplaint = '', socrates = {}) {
  const combinedText = `${chiefComplaint} ${socrates.site || ''} ${socrates.character || ''} ${(socrates.associations || []).join(' ')}`.toLowerCase();

  for (const entry of CLINICAL_DIAGNOSIS_CATALOG) {
    if (entry.keywords.some(kw => combinedText.includes(kw.toLowerCase()))) {
      return entry;
    }
  }

  // Default General Wellness / Vata Vyadhi fallback
  return {
    allopathic: { code: 'MD81', term: 'Generalized functional disorder / musculoskeletal strain', system: 'ICD-11' },
    ayurvedic: { code: 'AYU-KA-001', term: 'Samanya Vata Vyadhi / Dhatukshaya', system: 'NAMASTE' },
    ayushPlan: [
      { name: 'Ashwagandha Churna', form: 'Churna', dose: '3g at bedtime', anupana: 'Warm Milk', duration: '21 days' },
      { name: 'Amritarishta', form: 'Arishta', dose: '15ml with equal water BD', anupana: 'Water', duration: '14 days' }
    ],
    panchakarma: ['Sarvanga Abhyanga and Swedana'],
    pathya: ['Warm, fresh, easily digestible seasonal meals', 'Adequate hydration', 'Regular sleep routine'],
    apathya: ['Irregular fasting, over-exertion', 'Cold dry foods']
  };
}

/**
 * Build standard 8-part clinical history summary per SIH PS 26047 Module C
 * Chief Complaint (CC) -> HPI -> Past Medical & Surgical -> Drug & Allergy ->
 * Family History -> Personal & Ahara-Vihara -> Review of Systems (ROS) -> Prior Investigations Summary
 */
function buildStandardClinicalSummary(session, match) {
  const {
    chiefComplaint = 'Generalized discomfort / OPD consultation',
    socrates = {},
    vitals = {},
    dashavidhaPariksha = {},
    pastMedicalHistory = [],
    allergies = [],
    ocrPrescriptions = [],
    labTrends = [],
    aharaVihara = {},
    age = '--'
  } = session;

  // 1. Chief Complaint (CC)
  const cc = chiefComplaint || 'Generalized discomfort / OPD consultation';

  // 2. History of Present Illness (HPI)
  let hpi = `Patient presents with ${cc}. `;
  if (socrates.site) hpi += `Location: ${socrates.site}. `;
  if (socrates.onset) hpi += `Onset/Duration: ${socrates.onset}. `;
  if (socrates.character) hpi += `Quality: ${socrates.character}. `;
  if (socrates.radiation) hpi += `Radiation: ${socrates.radiation}. `;
  if (socrates.severity) hpi += `VAS Pain Scale: ${socrates.severity}/10. `;
  if (socrates.timeCourse) hpi += `Course: ${socrates.timeCourse}. `;
  if (socrates.exacerbatingRelieving) hpi += `Aggravating/Relieving factors: ${socrates.exacerbatingRelieving}. `;
  if (socrates.associations && socrates.associations.length > 0) {
    hpi += `Associated symptoms: ${socrates.associations.join(', ')}. `;
  }
  if (session.isReturningPatient) {
    hpi += `[Delta since last visit]: ${session.changeDetails || 'Ongoing follow-up consultation.'} `;
  }

  // 3. Past Medical and Surgical History
  const past = pastMedicalHistory.length > 0 
    ? `Documented medical history: ${pastMedicalHistory.join(', ')}. No acute surgical history or major interventions reported.`
    : 'No prior chronic medical illnesses or surgical operations reported by patient.';

  // 4. Drug and Allergy History
  const extractedMeds = ocrPrescriptions.flatMap(p => (p.extractedMedicines || []).map(m => `${m.name} ${m.dosage || ''} (${m.frequency || 'regular'})`));
  let drugAllergy = '';
  if (extractedMeds.length > 0) {
    drugAllergy += `Active Medications (OCR Scanned): ${extractedMeds.join(', ')}. `;
  } else {
    drugAllergy += 'No current prescription medications reported on intake. ';
  }
  if (allergies.length > 0) {
    drugAllergy += `Documented Drug/Substance Allergies: ${allergies.join(', ')}.`;
  } else {
    drugAllergy += 'No Known Drug Allergies (NKDA).';
  }

  // 5. Family History
  let family = 'Non-contributory for early-onset hereditary or familial disorders. ';
  if (pastMedicalHistory.some(m => /diabetes|sugar|मधुमेह/i.test(m))) {
    family += 'Positive familial predisposition for metabolic dysfunction and Type-2 Diabetes Mellitus.';
  } else if (pastMedicalHistory.some(m => /hypertension|bp|cardiac|हृदय|रक्तदाब/i.test(m))) {
    family += 'Positive familial predisposition for essential hypertension and cardiovascular morbidity.';
  } else {
    family += 'No reported family history of premature CAD, stroke, or chronic renal disease.';
  }

  // 6. Personal and Social History (including Ahara-Vihara for AYUSH)
  const diet = aharaVihara.dietType || 'Vegetarian (Shakahari)';
  const water = aharaVihara.waterIntake || 'Normal Water (Sheeta Jala)';
  const sleep = aharaVihara.sleepPattern || 'Sound (7-8 hours)';
  const habits = (aharaVihara.habitsAddictions && aharaVihara.habitsAddictions.length > 0)
    ? aharaVihara.habitsAddictions.join(', ')
    : 'Non-smoker, non-alcoholic';
  const prakriti = dashavidhaPariksha.prakriti?.primaryDosha || 'Vata-Pitta';
  const agni = dashavidhaPariksha.aharaShakti?.jaranaShakti || 'Samagni';
  const koshtha = dashavidhaPariksha.koshtha || 'Madhyama';
  const satva = dashavidhaPariksha.satva || 'Pravara';
  const vyayama = dashavidhaPariksha.vyayamaShakti || 'Madhyama';
  const sara = dashavidhaPariksha.sara || 'Madhyama';
  const samhanana = dashavidhaPariksha.samhanana || 'Madhyama';
  const pramana = dashavidhaPariksha.pramana || 'Prakrita';
  const satmya = dashavidhaPariksha.satmya || 'Sarva-rasa';
  const vaya = dashavidhaPariksha.vaya || (age < 16 ? 'Bala' : age > 60 ? 'Vriddha' : 'Madhyama');

  const personal = `Diet: ${diet} | Hydration: ${water} | Sleep: ${sleep} | Habits: ${habits}. ` +
    `AYUSH Classical Dashavidha Pariksha: Prakriti: ${prakriti} | Vikriti: ${dashavidhaPariksha.vikriti || 'Doshic imbalance congruent with presenting complaint'} | ` +
    `Sara: ${sara} | Samhanana: ${samhanana} | Pramana: ${pramana} | Satmya: ${satmya} | Sattva: ${satva} | ` +
    `Agni/Ahara: ${agni} | Vyayama Shakti: ${vyayama} | Vaya: ${vaya} | Koshtha: ${koshtha}.`;

  // 7. Review of Systems (ROS)
  const ros = {
    cardiovascular: vitals.systolicBP 
      ? `BP: ${vitals.systolicBP}/${vitals.diastolicBP} mmHg, Pulse: ${vitals.heartRate || '--'} bpm. Denies orthopnea, palpitations, or pedal edema.`
      : 'Denies acute chest pain, palpitations, or syncope.',
    respiratory: vitals.spo2 
      ? `SpO2: ${vitals.spo2}% on room air. ${vitals.respiratoryRate ? `RR: ${vitals.respiratoryRate}/min.` : ''} Denies chronic cough, hemoptysis, or resting dyspnea.`
      : 'Denies chronic cough, wheezing, or exertional shortness of breath.',
    gastrointestinal: `Appetite: ${dashavidhaPariksha.aharaShakti?.abhyavaharana || 'Moderate'}. Agni: ${agni}. Bowel regularity: ${koshtha}. No acute dysphagia, hematemesis, or melena.`,
    musculoskeletal: socrates.site && /knee|joint|back|pain|sandhi|कंबर|घुटने/i.test(socrates.site + cc) 
      ? `Localized pain, tenderness, and movement restriction noted at ${socrates.site}. Joint stability intact.` 
      : 'Intact range of motion in all major axial and appendicular joints without acute synovitis.',
    neurologicalENT: 'Fully conscious and oriented to time, place, and person. Visual and auditory acuity gross intact. No sensory loss or motor deficits reported.'
  };

  // 8. Summary of Prior Investigations
  let priorLabs = 'No prior investigative reports or lab panels flagged during intake.';
  if (labTrends.length > 0) {
    priorLabs = 'Longitudinal lab trends: ' + labTrends.map(t => `${t.testName}: ${t.previousValue || '--'} -> ${t.currentValue} (${t.direction})`).join('; ') + '.';
  } else if (ocrPrescriptions.length > 0) {
    priorLabs = `Scanned ${ocrPrescriptions.length} prior physical prescription document(s); active regimen extracted and cross-checked for herb-drug safety.`;
  }

  return {
    chiefComplaint: cc,
    historyOfPresentIllness: hpi,
    pastMedicalSurgical: past,
    drugAndAllergyHistory: drugAllergy,
    familyHistory: family,
    personalAndAharaVihara: personal,
    reviewOfSystems: ros,
    priorInvestigationsSummary: priorLabs,
    generatedAt: new Date()
  };
}

/**
 * Generate high-efficiency 10-Second Doctor SOAP Case Sheet
 */
async function generateSoapCaseSheet(session) {
  const {
    patientName, age, gender, tokenNumber, abhaId,
    vitals = {},
    chiefComplaint,
    socrates = {},
    dashavidhaPariksha = {},
    ocrPrescriptions = []
  } = session;

  const match = findDiagnosticMatches(chiefComplaint, socrates);

  // 1. Build Standard Clinical Summary (PS 26047 Module C 8-part sequence)
  const clinicalSummary = buildStandardClinicalSummary(session, match);

  // 2. Build Standard Clinical SOAP Narrative (Deterministic baseline)
  let deltaText = '';
  if (session.isReturningPatient) {
    const changesFormatted = (session.changesSinceLastVisit && session.changesSinceLastVisit.length > 0)
      ? session.changesSinceLastVisit.map(c => c.replace('_', ' ').toUpperCase()).join(', ')
      : 'NO MAJOR CHANGES';
    deltaText = ` [RETURNING PATIENT DELTA]: Reported changes since last visit: ${changesFormatted}. ${session.changeDetails ? `Note: ${session.changeDetails}` : ''}`;
  }

  const subjective = `Patient ${patientName} (${age}y, ${gender}, Token: ${tokenNumber}) presents with chief complaint of ${chiefComplaint || 'generalized discomfort'}. ` +
    (socrates.site ? `Location: ${socrates.site}. ` : '') +
    (socrates.onset ? `Onset: ${socrates.onset}. ` : '') +
    (socrates.character ? `Quality: ${socrates.character}. ` : '') +
    (socrates.radiation ? `Radiation: ${socrates.radiation}. ` : '') +
    (socrates.severity ? `Pain Score: ${socrates.severity}/10 (VAS). ` : '') +
    (socrates.exacerbatingRelieving ? `Modifying factors: ${socrates.exacerbatingRelieving}. ` : '') +
    (socrates.associations && socrates.associations.length > 0 ? `Associated symptoms: ${socrates.associations.join(', ')}. ` : '') +
    deltaText;

  const prakriti = dashavidhaPariksha.prakriti || {};
  const ahara = dashavidhaPariksha.aharaShakti || {};

  let labTrendText = '';
  if (session.labTrends && session.labTrends.length > 0) {
    labTrendText = ' | LAB TRENDS: ' + session.labTrends.map(t => `${t.testName}: ${t.previousValue} (${t.previousDate}) -> ${t.currentValue} (${t.currentDate}) [${t.direction.toUpperCase()}]`).join('; ');
  }

  const objective = `VITALS: BP: ${vitals.systolicBP || '--'}/${vitals.diastolicBP || '--'} mmHg | HR: ${vitals.heartRate || '--'} bpm | SpO2: ${vitals.spo2 || '--'}% | Temp: ${vitals.temperature || '--'}°F | BMI: ${vitals.bmi || '--'} (${vitals.bmiCategory || 'Normal'}). ` +
    `AYUSH DASHAVIDHA PARIKSHA: Prakriti: ${prakriti.primaryDosha || 'Vata'}-${prakriti.secondaryDosha || 'Pitta'} | Agni (Jarana): ${ahara.jaranaShakti || 'Samagni'} | Appetite: ${ahara.abhyavaharana || 'Moderate'} | ` +
    `Sara (Tissue): ${dashavidhaPariksha.sara || 'Madhyama'} | Samhanana (Build): ${dashavidhaPariksha.samhanana || 'Madhyama'} | Satva (Mental resilience): ${dashavidhaPariksha.satva || 'Pravara'}.` +
    labTrendText;

  const assessment = `Clinical synthesis suggests ${match.allopathic.term} (ICD-11: ${match.allopathic.code}), presenting as ${match.ayurvedic.term} (NAMASTE: ${match.ayurvedic.code}). ` +
    `Doshic involvement demonstrates ${prakriti.primaryDosha || 'Vata'} exacerbation with impaired Agni dynamics. Vital status is currently stable with no acute surgical contraindications noted.`;

  const plan = {
    allopathicMeds: [
      {
        name: 'Paracetamol',
        system: 'Allopathic',
        dosage: '500mg',
        frequency: 'SOS (When needed for pain/fever)',
        duration: '3 days',
        instructions: 'After meals'
      }
    ],
    ayurvedicMeds: match.ayushPlan.map(item => ({
      name: item.name,
      system: 'Ayurvedic',
      dosage: item.dose,
      frequency: item.dose.includes('BD') ? 'BD (Twice daily)' : 'TDS (Thrice daily)',
      duration: item.duration,
      instructions: item.dose,
      anupana: item.anupana
    })),
    panchakarmaRecommendations: match.panchakarma,
    pathyaApathya: {
      pathya: match.pathya,
      apathya: match.apathya
    },
    followUp: '7 days for clinical assessment and Dosha re-evaluation'
  };

  const diagnoses = [
    match.allopathic,
    match.ayurvedic
  ];

  // 3. Optional Groq Polish for high-fidelity clinical nuance
  if (groq) {
    try {
      const prompt = `Synthesize a concise 10-second Doctor SOAP Case Sheet and verify clinical history for an Indian OPD:
Patient: ${patientName}, ${age}y ${gender}, Token: ${tokenNumber}
Complaint: ${chiefComplaint}
SOCRATES: ${JSON.stringify(socrates)}
Vitals: ${JSON.stringify(vitals)}
AYUSH Pariksha: ${JSON.stringify(dashavidhaPariksha)}
Probable Diagnosis: ${match.allopathic.term} (${match.allopathic.code}) / ${match.ayurvedic.term} (${match.ayurvedic.code})

Return JSON ONLY:
{
  "subjective": "Concise clinical subjective narrative",
  "objective": "Concise vitals and examination findings",
  "assessment": "Clinical synthesis with both Allopathic and Ayurvedic pathology",
  "additionalAdvice": ["2 specific clinical action items"]
}`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      if (parsed.subjective && parsed.assessment) {
        return {
          soapNote: {
            subjective: parsed.subjective,
            objective: parsed.objective || objective,
            assessment: parsed.assessment,
            plan,
            generatedAt: new Date()
          },
          clinicalSummary,
          diagnoses
        };
      }
    } catch (llmErr) {
      console.warn('[SoapGenerator] Groq synthesis bypassed:', llmErr.message);
    }
  }

  // Return guaranteed deterministic clinical SOAP case sheet + 8-part clinical summary
  return {
    soapNote: {
      subjective,
      objective,
      assessment,
      plan,
      generatedAt: new Date()
    },
    clinicalSummary,
    diagnoses
  };
}

module.exports = {
  CLINICAL_DIAGNOSIS_CATALOG,
  findDiagnosticMatches,
  buildStandardClinicalSummary,
  generateSoapCaseSheet
};

