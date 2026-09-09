const { Groq } = require('groq-sdk');
const {
  LOCALES,
  QUESTION_TEMPLATES,
  COMPLETION_MESSAGES,
  QUICK_REPLIES,
  CHIEF_COMPLAINT_CATEGORIES
} = require('../data/socratesQuestionTemplates');

const isValidGroqKey = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_');
const groq = isValidGroqKey ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Standard rapid SOCRATES steps (Capped to max 4 focused questions to prevent patient fatigue)
const SOCRATES_STEPS = [
  'site',
  'onset',
  'character',
  'severity'
];

const LANGUAGE_NAME_MAP = {
  english: 'en', hindi: 'hi', marathi: 'mr', tamil: 'ta', telugu: 'te',
  bengali: 'bn', gujarati: 'gu', kannada: 'kn', malayalam: 'ml', odia: 'or',
  punjabi: 'pa', assamese: 'as', urdu: 'ur'
};

function resolveLang(language = 'hi') {
  if (!language) return 'en';
  const clean = String(language).toLowerCase().trim();
  if (LOCALES.includes(clean)) return clean;
  if (LANGUAGE_NAME_MAP[clean]) return LANGUAGE_NAME_MAP[clean];
  const base = clean.split('-')[0].slice(0, 2);
  if (LOCALES.includes(base)) return base;
  return 'en';
}

// Clinical Red Flag patterns for immediate triage escalation
const RED_FLAG_PATTERNS = [
  {
    regex: /(chest pain|chest tightness|छाती में दर्द|छातीत दुखणे|pressure in chest|left arm|डावे हात|बाएं हाथ)/i,
    flag: "Suspected Acute Coronary Syndrome / Angina",
    category: "Cardiovascular",
    severity: "critical"
  },
  {
    regex: /(breathless|shortness of breath|सांस फूलना|दम लागणे|difficulty breathing|oxygen|gasping)/i,
    flag: "Acute Respiratory Distress / Hypoxia Risk",
    category: "Respiratory",
    severity: "critical"
  },
  {
    regex: /(unconscious|fainting|blackout|बेहोश|चक्कर खाकर गिरना|अचानक चक्कर|slurred speech|facial droop)/i,
    flag: "Neurological Event / Syncope / TIA Risk",
    category: "Neurological",
    severity: "critical"
  },
  {
    regex: /(blood in vomit|blood in cough|खून की उल्टी|रक्ताची उलटी|coughing blood|haemoptysis|black stool)/i,
    flag: "Internal Bleeding / Hemorrhage Warning",
    category: "Surgical",
    severity: "critical"
  },
  {
    regex: /(severe unbearable pain|असहनीय दर्द|असह्य वेदना|pain 9|pain 10|rating 10|rating 9)/i,
    flag: "Severe Acute Pain Episode (VAS >= 9/10)",
    category: "Vitals",
    severity: "high"
  }
];

/**
 * Scan patient response for clinical red flags
 */
function detectRedFlags(text = '', vitals = {}) {
  const flags = [];
  
  // Text pattern matching
  for (const item of RED_FLAG_PATTERNS) {
    if (item.regex.test(text)) {
      flags.push({
        flag: item.flag,
        category: item.category,
        severity: item.severity,
        detectedAt: new Date()
      });
    }
  }

  // Vital threshold red flags
  if (vitals.spo2 && vitals.spo2 < 92) {
    flags.push({
      flag: `Critical Hypoxemia (SpO2 ${vitals.spo2}%)`,
      category: 'Respiratory',
      severity: 'critical',
      detectedAt: new Date()
    });
  }
  if (vitals.systolicBP && vitals.systolicBP >= 180) {
    flags.push({
      flag: `Hypertensive Crisis (Systolic BP ${vitals.systolicBP} mmHg)`,
      category: 'Cardiovascular',
      severity: 'critical',
      detectedAt: new Date()
    });
  }
  if (vitals.heartRate && (vitals.heartRate > 130 || vitals.heartRate < 45)) {
    flags.push({
      flag: `Significant Arrhythmia Risk (HR ${vitals.heartRate} bpm)`,
      category: 'Cardiovascular',
      severity: 'high',
      detectedAt: new Date()
    });
  }

  return flags;
}

/**
 * Deterministic parser for mapping patient utterance to current SOCRATES step
 */
function updateSocratesStateDeterministic(currentStep, userText, currentState = {}) {
  const updated = { ...currentState };

  if (currentStep === 'site') {
    updated.site = userText;
  } else if (currentStep === 'onset') {
    updated.onset = userText;
  } else if (currentStep === 'character') {
    updated.character = userText;
  } else if (currentStep === 'radiation') {
    updated.radiation = userText;
  } else if (currentStep === 'associations') {
    const tokens = userText.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    updated.associations = tokens.length > 0 ? tokens : [userText];
  } else if (currentStep === 'timeCourse') {
    updated.timeCourse = userText;
  } else if (currentStep === 'exacerbatingRelieving') {
    updated.exacerbatingRelieving = userText;
  } else if (currentStep === 'severity') {
    const numMatch = userText.match(/\b(10|[1-9])\b/);
    updated.severity = numMatch ? parseInt(numMatch[1], 10) : (updated.severity || 5);
  }

  return updated;
}

/**
 * Get next question in SOCRATES progression
 */
function getNextStep(socratesState = {}) {
  for (const step of SOCRATES_STEPS) {
    if (step === 'associations') {
      if (!socratesState.associations || socratesState.associations.length === 0) return step;
    } else if (step === 'severity') {
      if (!socratesState.severity) return step;
    } else if (!socratesState[step]) {
      return step;
    }
  }
  return null; // All steps answered
}

/**
 * Main function: Process patient input, extract clinical values, return next prompt
 */
async function processAdaptiveProbe({
  chiefComplaint,
  userSpeech,
  currentStep,
  socratesState = {},
  vitals = {},
  language = 'hi',
  transcript = [],
  patientContext = {}
}) {
  const lang = resolveLang(language);

  // 1. Red flag scan on incoming speech + vitals
  const redFlags = detectRedFlags(`${chiefComplaint || ''} ${userSpeech || ''}`, vitals);

  // 2. Parse current utterance into structured field
  let updatedSocrates = updateSocratesStateDeterministic(currentStep, userSpeech, socratesState);

  // 3. Optional LLM Refinement if Groq is active
  if (groq && userSpeech) {
    try {
      const prompt = `Extract medical symptom parameters from patient response.
Patient Complaint: "${chiefComplaint || ''}"
Current Step: "${currentStep || ''}"
Patient Utterance: "${userSpeech}"
Existing SOCRATES: ${JSON.stringify(socratesState)}

Return ONLY JSON matching:
{
  "site": "anatomical region or null",
  "onset": "duration or onset pattern or null",
  "character": "pain description or null",
  "radiation": "radiation area or null",
  "associations": ["symptoms"],
  "timeCourse": "timing pattern or null",
  "exacerbatingRelieving": "modifying factors or null",
  "severity": number 1-10 or null
}`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      // Merge only non-null values
      Object.keys(parsed).forEach(k => {
        if (parsed[k] !== null && parsed[k] !== undefined && parsed[k] !== '') {
          if (Array.isArray(parsed[k]) && parsed[k].length > 0) {
            updatedSocrates[k] = parsed[k];
          } else if (!Array.isArray(parsed[k])) {
            updatedSocrates[k] = parsed[k];
          }
        }
      });
    } catch (llmErr) {
      console.warn('[AdaptiveSocrates] Groq refinement bypassed:', llmErr.message);
    }
  }

  // 4. Auto-infer OPD Department based on cumulative symptoms, age, and gender
  const inferredDepartment = inferDepartmentFromSymptoms({
    chiefComplaint,
    userSpeech,
    socratesState: updatedSocrates,
    age: patientContext?.age || vitals.age,
    gender: patientContext?.gender || vitals.gender
  });

  // 5. Determine next step (Max 4 steps)
  const nextStep = getNextStep(updatedSocrates);
  const isComplete = nextStep === null;

  // 6. Formulate next clinical question
  let nextQuestion = null;
  if (!isComplete) {
    nextQuestion = QUESTION_TEMPLATES[nextStep]?.[lang] || QUESTION_TEMPLATES[nextStep]?.en;
  } else {
    nextQuestion = COMPLETION_MESSAGES[lang] || COMPLETION_MESSAGES.en;
  }

  const quickReplies = !isComplete ? (QUICK_REPLIES[nextStep]?.[lang] || QUICK_REPLIES[nextStep]?.en || []) : [];

  return {
    nextStep,
    nextQuestion,
    quickReplies,
    isComplete,
    socrates: updatedSocrates,
    inferredDepartment,
    redFlags,
    hasCriticalRedFlag: redFlags.some(f => f.severity === 'critical')
  };
}

/**
 * Auto-infer primary AYUSH OPD Department based on symptoms, complaint, age, and gender
 */
function inferDepartmentFromSymptoms({ chiefComplaint = '', userSpeech = '', socratesState = {}, age = null, gender = '' }) {
  const combinedText = `${chiefComplaint || ''} ${userSpeech || ''} ${socratesState.site || ''} ${socratesState.character || ''} ${socratesState.onset || ''} ${socratesState.associations?.join(' ') || ''}`.trim().toLowerCase();
  
  // If no symptom or complaint details provided yet, do not preselect or infer
  if (!combinedText || combinedText.length < 2) {
    return null;
  }

  const patientAge = Number(age);
  const isFemale = String(gender).toLowerCase() === 'female' || String(gender).toLowerCase() === 'महिला' || String(gender).toLowerCase() === 'स्त्री';

  // 1. Kaumarbhritya (Pediatrics) - Age under 14
  if (patientAge && patientAge < 14) {
    return {
      department: 'Kaumarbhritya',
      departmentId: 'Kaumarbhritya',
      departmentName: 'कौमारभृत्य (Kaumarbhritya)',
      sub: 'Pediatrics & Child Wellness',
      confidence: 96,
      reason: 'Patient age is pediatric (< 14 years).'
    };
  }

  // 2. Prasuti Tantra (Women's Health & Maternity)
  const prasutiKeywords = /(pregnancy|pregnant|maternity|menstrual|period|periods|bleeding|uterus|ovary|pcos|गर्भावस्था|मासिक धर्म|प्रसूति|योनि|गर्भाशय|स्तन दर्द)/i;
  if (isFemale && prasutiKeywords.test(combinedText)) {
    return {
      department: 'Prasuti',
      departmentId: 'Prasuti',
      departmentName: 'प्रसूति व स्त्री रोग (Prasuti Tantra)',
      sub: "Women's Health & Maternity",
      confidence: 95,
      reason: 'Identified women’s health / gynecological symptoms.'
    };
  }

  // 3. Shalakya Tantra (ENT, Eye, Head, Neck, Dental)
  const shalakyaKeywords = /(eye|vision|ear|hearing|nose|sinus|throat|tonsil|headache|migraine|tooth|dental|mouth ulcer|आंख|कान|नाक|गला|सिरदर्द|माइग्रेन|दांत|नेत्र|कर्ण|नासिका)/i;
  if (shalakyaKeywords.test(combinedText)) {
    return {
      department: 'Shalakya',
      departmentId: 'Shalakya',
      departmentName: 'शालाक्य तंत्र (Shalakya Tantra)',
      sub: 'ENT, Eye, Head & Neck Care',
      confidence: 93,
      reason: 'Identified supra-clavicular (ENT, Eye, Head, Neck) symptoms.'
    };
  }

  // 4. Shalya Tantra (Musculoskeletal, Ortho, Joints, Trauma, Surgery, Anorectal)
  const shalyaKeywords = /(joint|knee|arthritis|sandhivata|fracture|bone|spine|back pain|shoulder|injury|wound|swelling|pile|fistula|fissure|घुटने|जोड़ों में दर्द|कमर दर्द|हड्डी|मोच|चोट|घाव|अर्श|बवासीर|भगंदर)/i;
  if (!shalakyaKeywords.test(combinedText) && shalyaKeywords.test(combinedText)) {
    return {
      department: 'Shalya',
      departmentId: 'Shalya',
      departmentName: 'शल्य तंत्र (Shalya Tantra)',
      sub: 'Musculoskeletal, Joints & Surgery',
      confidence: 94,
      reason: 'Identified musculoskeletal / orthopedic / surgical symptoms.'
    };
  }

  // 5. Default: Kayachikitsa (Internal Medicine & General Care)
  return {
    department: 'Kayachikitsa',
    departmentId: 'Kayachikitsa',
    departmentName: 'कायचिकित्सा (Kayachikitsa)',
    sub: 'Internal Medicine & General Care',
    confidence: 90,
    reason: 'Identified internal medicine / metabolic / constitutional symptoms.'
  };
}

module.exports = {
  SOCRATES_STEPS,
  QUESTION_TEMPLATES,
  detectRedFlags,
  getNextStep,
  processAdaptiveProbe,
  inferDepartmentFromSymptoms
};
