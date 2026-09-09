const { Groq } = require('groq-sdk');

const isValidGroqKey = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 15;
const groq = isValidGroqKey ? new Groq({ apiKey: process.env.GROQ_API_KEY.trim() }) : null;

// Multi-model Groq fallback list optimized for speed and clinical reasoning
const GROQ_FALLBACK_MODELS = [
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant'
];

/**
 * Robust Groq caller with multi-model fallback and structured response handling
 */
async function callGroqWithFallback({ systemPrompt, userPrompt, json = false, temperature = 0.3 }) {
  if (!groq) return null;
  for (const model of GROQ_FALLBACK_MODELS) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
      const params = {
        messages,
        model,
        temperature,
        max_tokens: json ? 350 : 120
      };
      if (json) {
        params.response_format = { type: 'json_object' };
      }
      const completion = await groq.chat.completions.create(params);
      const content = completion.choices[0]?.message?.content?.trim();
      if (content) {
        return content;
      }
    } catch (err) {
      console.warn(`[AdaptiveSocrates] Groq model ${model} bypass:`, err.message);
    }
  }
  return null;
}

// Standard rapid SOCRATES steps (Capped to max 4 focused questions to prevent patient fatigue)
const SOCRATES_STEPS = [
  'site',
  'onset',
  'character',
  'severity'
];

// Multilingual Prompt Templates for instant zero-latency probing
const QUESTION_TEMPLATES = {
  site: {
    en: "Where exactly in your body are you experiencing this problem or pain?",
    hi: "आपको यह समस्या या दर्द शरीर में ठीक किस जगह पर हो रहा है?",
    mr: "तुम्हाला हा त्रास किंवा वेदना शरीराच्या नेमक्या कोणत्या भागात जाणवत आहे?"
  },
  onset: {
    en: "When did this trouble start? Did it come on suddenly or gradually over time?",
    hi: "यह समस्या कब शुरू हुई? क्या यह अचानक शुरू हुई या धीरे-धीरे बढ़ी?",
    mr: "हा त्रास कधी सुरू झाला? तो अचानक सुरू झाला की हळूहळू वाढला?"
  },
  character: {
    en: "How would you describe the feeling? Is it sharp, burning, a dull ache, throbbing, or heaviness?",
    hi: "यह किस प्रकार का दर्द या अनुभव है? तेज चुभन, जलन, भारीपन, या मीठा-मीठा दर्द?",
    mr: "या वेदनेचे स्वरूप कसे आहे? तीव्र टोचल्यासारखे, जळजळ, जडपणा की धडधडणारे दुखणे?"
  },
  radiation: {
    en: "Does this pain or discomfort spread anywhere else, like your back, arm, neck, or legs?",
    hi: "क्या यह दर्द शरीर के किसी अन्य हिस्से में भी फैलता है, जैसे पीठ, कंधे, गर्दन या पैरों में?",
    mr: "ही वेदना शरीराच्या इतर भागात पसरते का, जसे की पाठ, खांदा, मान किंवा पायांमध्ये?"
  },
  associations: {
    en: "Are you noticing any other symptoms, such as fever, nausea, vomiting, dizziness, or sweating?",
    hi: "क्या इसके साथ आपको बुखार, जी मिचलाना, उल्टी, चक्कर या पसीना आने जैसी कोई अन्य समस्या है?",
    mr: "यासोबत तुम्हाला ताप, मळमळ, उलट्या, चक्कर येणे किंवा जास्त घाम येणे असा काही त्रास होतोय का?"
  },
  timeCourse: {
    en: "Does the discomfort change during the day or night? Does it come and go, or stay constant?",
    hi: "क्या यह दिन या रात में किसी खास समय बढ़ता है? क्या यह लगातार रहता है या रुक-रुक कर आता है?",
    mr: "हा त्रास दिवसभरात किंवा रात्री कधी वाढतो का? तो सतत राहतो की अधूनमधून येतो?"
  },
  exacerbatingRelieving: {
    en: "What makes it better (like rest, food, or warm water) and what makes it worse?",
    hi: "किस चीज़ से आपको आराम मिलता है (जैसे आराम करने या गर्म पानी से) और किस चीज़ से यह बढ़ जाता है?",
    mr: "कशाने तुम्हाला आराम वाटतो (उदा. विश्रांती, गरम पाणी) आणि कशामुळे त्रास वाढतो?"
  },
  severity: {
    en: "On a scale of 1 to 10 (where 1 is very mild and 10 is unbearable), how severe is it right now?",
    hi: "1 से 10 के पैमाने पर (जहाँ 1 बहुत हल्का है और 10 असहनीय), यह दर्द अभी कितना तीव्र है?",
    mr: "१ ते १० च्या मोजपट्टीवर (जिथे १ म्हणजे अगदी कमी आणि १० म्हणजे असह्य), हा त्रास सध्या किती तीव्र आहे?"
  }
};

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
  const lang = ['en', 'hi', 'mr'].includes(language) ? language : 'hi';

  // 1. Red flag scan on incoming speech + vitals
  const redFlags = detectRedFlags(`${chiefComplaint || ''} ${userSpeech || ''}`, vitals);

  // 2. Parse current utterance into structured field
  let updatedSocrates = updateSocratesStateDeterministic(currentStep, userSpeech, socratesState);

  // 3. Dynamic LLM Extraction of all stated symptom parameters
  if (groq && userSpeech) {
    try {
      const extractionSystem = 'You are an expert clinical NLP triage extractor at an Indian hospital. Extract symptom parameters into a single valid JSON object. Do not invent details not mentioned by the patient.';
      const extractionUser = `Patient Complaint: "${chiefComplaint || ''}"
Current Step: "${currentStep || ''}"
Patient Utterance: "${userSpeech}"
Existing SOCRATES Context: ${JSON.stringify(socratesState)}

Return ONLY JSON:
{
  "site": "anatomical region or null",
  "onset": "duration or onset pattern or null",
  "character": "pain description or null",
  "radiation": "radiation area or null",
  "associations": ["symptoms array"],
  "timeCourse": "timing pattern or null",
  "exacerbatingRelieving": "modifying factors or null",
  "severity": number 1-10 or null
}`;

      const rawJson = await callGroqWithFallback({
        systemPrompt: extractionSystem,
        userPrompt: extractionUser,
        json: true,
        temperature: 0.1
      });

      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        Object.keys(parsed).forEach(k => {
          if (parsed[k] !== null && parsed[k] !== undefined && parsed[k] !== '') {
            if (Array.isArray(parsed[k]) && parsed[k].length > 0) {
              updatedSocrates[k] = parsed[k];
            } else if (!Array.isArray(parsed[k])) {
              updatedSocrates[k] = parsed[k];
            }
          }
        });
      }
    } catch (llmErr) {
      console.warn('[AdaptiveSocrates] Groq extraction bypassed:', llmErr.message);
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

  // 5. Determine next missing step (Max 4 steps)
  const nextStep = getNextStep(updatedSocrates);
  const isComplete = nextStep === null;

  // 6. Formulate smart dynamic doctor question
  let nextQuestion = null;
  if (!isComplete) {
    // Dynamic doctor follow-up probe via Groq
    if (groq && userSpeech) {
      try {
        const langName = lang === 'hi' ? 'Hindi (हिन्दी)' : lang === 'mr' ? 'Marathi (मराठी)' : 'English';
        const doctorSystem = `You are a warm, empathetic, and experienced Indian OPD Doctor conducting a voice intake at a hospital kiosk.
Your goal is to make the patient feel heard, comfortable, and respected.
1. Briefly acknowledge what the patient said with natural medical empathy.
2. Ask ONE focused, natural follow-up question to probe the missing clinical dimension ("${nextStep}").
Strict Rules:
- Language: Respond ONLY in ${langName}.
- Length: Maximum 1 to 2 short spoken sentences. Never overwhelm the patient.
- No repetition: Never re-ask for details the patient already provided.
- Output ONLY the doctor's spoken question. No preamble, no quotes, no labels.`;

        const doctorUser = `Chief Complaint: "${chiefComplaint || ''}"
Patient statement: "${userSpeech}"
Known clinical details: ${JSON.stringify(updatedSocrates)}
Missing dimension to probe: "${nextStep}"
Target Spoken Language: ${langName}`;

        const dynamicDoctorQuestion = await callGroqWithFallback({
          systemPrompt: doctorSystem,
          userPrompt: doctorUser,
          temperature: 0.3
        });

        if (dynamicDoctorQuestion && dynamicDoctorQuestion.length > 5) {
          nextQuestion = dynamicDoctorQuestion.replace(/^["'\s]+|["'\s]+$/g, '');
        }
      } catch (err) {
        console.warn('[AdaptiveSocrates] Dynamic doctor question generation failed, falling back:', err.message);
      }
    }

    // High quality template fallback if LLM is unavailable or takes too long
    if (!nextQuestion) {
      nextQuestion = QUESTION_TEMPLATES[nextStep]?.[lang] || QUESTION_TEMPLATES[nextStep]?.en;
    }
  } else {
    // Consultation completed
    if (groq && userSpeech) {
      try {
        const langName = lang === 'hi' ? 'Hindi' : lang === 'mr' ? 'Marathi' : 'English';
        const closingSystem = `You are a doctor at an Indian hospital concluding the initial voice triage intake. Give a 1-sentence warm closing thanking the patient and reassuring them the doctor has their full details. Respond ONLY in ${langName}. Keep it short and polite.`;
        const closingUser = `Patient symptoms: ${JSON.stringify(updatedSocrates)}. Language: ${langName}`;
        const dynamicClosing = await callGroqWithFallback({
          systemPrompt: closingSystem,
          userPrompt: closingUser,
          temperature: 0.2
        });
        if (dynamicClosing && dynamicClosing.length > 5) {
          nextQuestion = dynamicClosing.replace(/^["'\s]+|["'\s]+$/g, '');
        }
      } catch (e) {
        // fallback
      }
    }

    if (!nextQuestion) {
      nextQuestion = {
        en: "Thank you. Your symptom details have been recorded for the doctor.",
        hi: "धन्यवाद। आपके लक्षणों का पूरा विवरण डॉक्टर के अवलोकन हेतु सुरक्षित कर लिया गया है।",
        mr: "धन्यवाद. आपल्या लक्षणांचा संपूर्ण तपशील डॉक्टरांच्या तपासणीसाठी नोंदवला गेला आहे."
      }[lang];
    }
  }

  return {
    nextStep,
    nextQuestion,
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
