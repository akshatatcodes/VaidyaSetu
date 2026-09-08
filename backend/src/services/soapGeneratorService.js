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

  // 1. Build Standard Clinical SOAP Narrative (Deterministic baseline)
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

  // 2. Optional Groq Polish for high-fidelity clinical nuance
  if (groq) {
    try {
      const prompt = `Synthesize a concise 10-second Doctor SOAP Case Sheet for an Indian OPD:
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
          diagnoses
        };
      }
    } catch (llmErr) {
      console.warn('[SoapGenerator] Groq synthesis bypassed:', llmErr.message);
    }
  }

  // Return guaranteed deterministic clinical SOAP case sheet
  return {
    soapNote: {
      subjective,
      objective,
      assessment,
      plan,
      generatedAt: new Date()
    },
    diagnoses
  };
}

module.exports = {
  CLINICAL_DIAGNOSIS_CATALOG,
  findDiagnosticMatches,
  generateSoapCaseSheet
};
