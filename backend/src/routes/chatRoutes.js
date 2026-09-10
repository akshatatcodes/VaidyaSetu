const express = require('express');
const router = express.Router();

/**
 * VaidyaSetu AI Healthcare & Platform Assistant Engine
 * Trained for SIH 2026 PS 26047 (AIIA & Ministry of Ayush)
 */

const KNOWLEDGE_RESPONSES = [
  {
    keywords: ['emergency', 'chest pain', 'heart attack', 'cannot breathe', 'stroke', 'unconscious', 'bleeding severely'],
    reply: `🚨 **EMERGENCY CLINICAL ALERT**\n\nYour symptoms indicate a potentially serious emergency. Please take immediate action:\n- **Call 112 / 102** or visit the nearest Hospital Emergency Room / Casualty immediately.\n- If experiencing acute chest pressure, shortness of breath, or numbness on one side, sit upright and rest.\n- In hospital triage, inform the staff immediately for priority OPD / Emergency admission.`,
    suggestions: ['Where is nearest emergency?', 'Call 112 Emergency', 'Talk to hospital staff']
  },
  {
    keywords: ['kiosk', 'medikiosk', 'token', 'opd', 'queue'],
    reply: `🏥 **MediKiosk Smart Intake System**\n\nOur bilingual self-service kiosk streamlines hospital OPD intake in 6 automated steps:\n1. **ABHA Verification**: Fast scan of your Ayushman Bharat Health Account QR or mobile OTP.\n2. **Voice Intake**: Speak your symptoms in English, Hindi, or Marathi powered by Bhashini AI.\n3. **Vitals Station**: Live telemetry (Pulse, BP, SpO2, Temp) plus direct smartwatch sync (Google Fit / Apple Health).\n4. **Structured Clinical Review**: SOCRATES symptom assessment.\n5. **Medical History & Prior Records**: Review conditions, allergies, and prescriptions.\n6. **Instant OPD Token**: Generates your live queue number with estimated doctor consultation time.\n\n👉 *You can try the MediKiosk anytime at [/kiosk](/kiosk).*`,
    suggestions: ['Go to MediKiosk', 'How does smartwatch sync work?', 'What happens after token generation?']
  },
  {
    keywords: ['safety bridge', 'drug safety', 'interaction', 'herb', 'allopathy', 'ayush', 'ashwagandha', 'warfarin', 'guggulu', 'metformin'],
    reply: `🛡️ **Safety Bridge (Herb-Drug Interaction RAG)**\n\nVaidyaSetu's Safety Bridge engine protects patients combining traditional Ayush formulations with modern Allopathic medications:\n- **Bi-Directional Safety**: Analyzes classical Ayurvedic texts against modern CDSCO / FDA pharmacopoeia databases.\n- **Known Interactions Flagged**: e.g., *Warfarin + Guggulu* (antiplatelet potentiation), *Metformin + Shilajit* (additive hypoglycemia).\n- **Actionable Guidance**: Provides clinical dosage timing (Kala Nirnaya) and monitoring advice.\n\n👉 *Test your active prescriptions right now under [Clinical Records & Safety Bridge](/patient/records).*`,
    suggestions: ['Check my medications', 'Can I take Ashwagandha with BP medicine?', 'What is Kala Nirnaya?']
  },
  {
    keywords: ['smartwatch', 'apple health', 'google fit', 'wearable', 'vital', 'blood pressure', 'pulse', 'spo2'],
    reply: `⌚ **Smartwatch & Health Hub Integration**\n\nVaidyaSetu connects directly with your personal health devices:\n- **Supported Platforms**: Google Fit Hub, Apple Health (HealthKit), and Wear OS / watchOS smartwatches.\n- **Where to Sync**: Available both in your personal [Vitals Sanctuary](/patient/vitals) and during **Step 3** of the [MediKiosk Intake](/kiosk).\n- **Telemetry Captured**: Real-time Systolic/Diastolic BP, Heart Rate (BPM), Blood Oxygen (SpO2), Temperature, and Respiratory Rate.\n- **Clinical Continuity**: All captured vitals are encrypted and attached to your doctor's consultation queue for instant diagnosis.`,
    suggestions: ['Open Vitals Page', 'Sync Google Fit now', 'Go to MediKiosk']
  },
  {
    keywords: ['abha', 'ayushman', 'pmjay', 'health id', 'card'],
    reply: `🆔 **ABHA (Ayushman Bharat Health Account)**\n\nYour 14-digit ABHA ID acts as your unified digital health identifier under ABDM guidelines:\n- **Milestone Compliant**: Supports ABDM M1 (ABHA Creation), M2 (Health Facility Registry), and M3 (Health Information Exchange).\n- **Digital Card**: View and download your official ABHA QR Card on your [Dashboard](/) or [Health Profile](/patient/profile).\n- **Privacy Protected**: Secured under India's Digital Personal Data Protection (DPDP) Act 2023 with granular patient consent.`,
    suggestions: ['View my ABHA Card', 'Manage Consent Settings', 'Add Family Beneficiary']
  },
  {
    keywords: ['joint pain', 'arthritis', 'sandhivata', 'amavata', 'knee pain'],
    reply: `🦴 **Joint Pain & Mobility Care (Sandhivata Guidance)**\n\nFor joint pain and stiffness:\n- **Ayush Perspective**: Often linked to aggravated *Vata dosha* and accumulated *Ama* (metabolic toxins).\n- **Home Care**: Warm sesame oil (Tila Taila) massage, mild Mahanarayan Taila application, and gentle joint mobilization.\n- **Dietary Tip**: Sip warm ginger water; avoid refrigerated, dry, or excessively sour foods.\n- **Clinical Alert**: If accompanied by redness, intense swelling, or fever, consult an Ayush specialist or Orthopedic physician.\n\n👉 *You can register for an OPD consultation at the [MediKiosk](/kiosk).*`,
    suggestions: ['What herbs help joint pain?', 'Check drug interactions', 'Book OPD token']
  },
  {
    keywords: ['fever', 'temperature', 'jvara', 'cold', 'cough'],
    reply: `🌡️ **Fever & Respiratory Comfort (Jvara Guidance)**\n\n- **Immediate Steps**: Rest adequately, stay hydrated with warm water or herbal decoction (Kadha with Tulsi, Ginger, Black Pepper, and Honey).\n- **Diet**: Keep meals light (Peya / Moong dal khichdi) to preserve digestive fire (*Agni*).\n- **Monitoring**: Check temperature every 4 hours. If temperature exceeds 102°F (38.9°C), or lasts longer than 48 hours, seek immediate medical consultation.\n- **Red Flags**: Severe headache, stiff neck, shortness of breath, or rash require urgent ER evaluation.`,
    suggestions: ['Log my temperature', 'Herbal remedies for cough', 'Find nearest doctor']
  },
  {
    keywords: ['acidity', 'gerd', 'amlapitta', 'heartburn', 'stomach'],
    reply: `🔥 **Digestive Harmony (Amlapitta & Acidity)**\n\n- **Ayush Balance**: Result of aggravated *Pitta dosha* affecting digestive secretions.\n- **Soothing Tips**: Cold milk or tender coconut water provides immediate cooling relief. Fennel seeds (Saunf) chewed post-meals aid digestion.\n- **Avoid**: Extremely spicy, deep-fried, sour foods, and skipping meals.\n- **Medication Check**: If taking NSAIDs or pain relievers, always take after food or consult for gastro-protective pairing.`,
    suggestions: ['Foods to avoid for acidity', 'Check drug safety', 'Analyze my vitals']
  },
  {
    keywords: ['stress', 'sleep', 'insomnia', 'anxiety', 'nidra'],
    reply: `🌙 **Sleep & Mental Well-being (Nidra & Manas Swasthya)**\n\n- **Dinacharya (Daily Routine)**: Maintain a consistent sleep schedule; avoid screens 45 minutes before bed.\n- **Ayush Restoratives**: Warm milk with a pinch of Nutmeg (Jaiphal) or Ashwagandha at bedtime calms the nervous system (*Vata-Pitta balance*).\n- **Padabhyanga**: Massaging soles of feet with warm Brahmi or sesame oil before sleep enhances deep restorative rest.`,
    suggestions: ['Ashwagandha benefits', 'Breathing exercises for sleep', 'View health profile']
  }
];

// Fallback intelligent response generator
function generateIntelligentResponse(userText) {
  const lower = userText.toLowerCase();

  // 1. Check knowledge base keywords
  for (const item of KNOWLEDGE_RESPONSES) {
    if (item.keywords.some(k => lower.includes(k))) {
      return item.reply;
    }
  }

  // 2. Multilingual detection
  if (/[\u0900-\u097F]/.test(userText)) {
    // Hindi / Marathi detected
    return `नमस्ते! 🙏 वैद्यसेतु AI आरोग्य सहाय्यक मध्ये आपले स्वागत आहे.\n\nमी आपल्याला खालील विषयांमध्ये मदत करू शकतो:\n- **मेडीकिओस्क (MediKiosk)**: ओपीडी टोकन आणि लक्षण नोंदणी ([/kiosk](/kiosk))\n- **सेफ्टी ब्रिज (Safety Bridge)**: आयुर्वेदिक आणि ॲलोपॅथिक औषधांमधील सुरक्षितता तपासणी ([/patient/records](/patient/records))\n- **स्मार्टवॉच आणि व्हाइटल्स**: रक्तदाब, पल्स आणि SpO2 ट्रॅकिंग ([/patient/vitals](/patient/vitals))\n- **ABHA डिजिटल कार्ड**: आपले आरोग्य खाते व्यवस्थापन\n\nकृपया आपल्या लक्षणांचे किंवा प्रश्नाचे तपशील सांगा!`;
  }

  // 3. Generic intelligent health advice
  return `Thank you for sharing. Based on clinical and Ayush integrative health protocols:\n\n1. **Personalized Evaluation**: Symptoms like yours should be tracked alongside your vital signs (BP, Pulse, SpO2).\n2. **Platform Tools Available**:\n   - **Live Telemetry & Wearables**: Sync your smartwatch or record vitals under [Vitals Sanctuary](/patient/vitals).\n   - **Herb-Drug Cross Safety**: Ensure your current medicines are compatible under [Clinical Records](/patient/records).\n   - **Hospital OPD Visit**: Generate an instant queue token using our bilingual [MediKiosk](/kiosk).\n\n*Would you like me to analyze your vitals, check medicine safety, or guide you through OPD token booking?*`;
}

/**
 * POST /api/chat/symptom
 * Symptom intake & assistant dialogue endpoint
 */
router.post('/symptom', async (req, res) => {
  try {
    const { message, conversationHistory = [], clerkId } = req.body;
    const userText = String(message || '').trim();

    if (!userText) {
      return res.status(400).json({ status: 'error', message: 'Message content is required.' });
    }

    const reply = generateIntelligentResponse(userText);

    res.json({
      status: 'success',
      reply,
      timestamp: new Date().toISOString(),
      model: 'VaidyaSetu-Clinical-Health-Engine'
    });
  } catch (err) {
    console.error('[Chat / Symptom] Error:', err.message);
    res.status(500).json({
      status: 'error',
      reply: 'I am experiencing a momentary connection issue. Please check your network or try again shortly.'
    });
  }
});

module.exports = router;
