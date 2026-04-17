const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');
const UserProfile = require('../models/UserProfile');
const Report = require('../models/Report');
const Vital = require('../models/Vital');
const Medication = require('../models/Medication');
const LabResult = require('../models/LabResult');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// AI Symptom Chatbot
router.post('/symptom', async (req, res) => {
  try {
    const { clerkId, message, conversationHistory } = req.body;
    const outputLanguage = req.resolvedLanguage || 'en';
    
    let profileContext = "";
    if (clerkId) {
      const [profile, report, vitals, medications, labResults] = await Promise.all([
        UserProfile.findOne({ clerkId }),
        Report.findOne({ clerkId }).sort({ createdAt: -1 }),
        Vital.find({ clerkId }).sort({ timestamp: -1 }).limit(20),
        Medication.find({ clerkId, active: true }),
        LabResult.find({ clerkId }).sort({ sampleDate: -1 }).limit(10)
      ]);
      
      if (profile) {
        const fv = (key, fallback = 'unknown') => {
          const field = profile?.[key];
          if (field && typeof field === 'object' && Object.prototype.hasOwnProperty.call(field, 'value')) {
            const v = field.value;
            if (v === undefined || v === null || v === '') return fallback;
            return v;
          }
          if (field === undefined || field === null || field === '') return fallback;
          return field;
        };

        const asArray = (key) => {
          const v = fv(key, []);
          if (Array.isArray(v)) return v;
          if (typeof v === 'string' && v.trim()) return [v];
          return [];
        };

        const age = fv('age');
        const gender = fv('gender');
        const height = fv('height');
        const weight = fv('weight');
        const waist = fv('waistCircumference', 'not recorded');
        const bmi = fv('bmi', 'not recorded');
        const conditions = asArray('medicalHistory');
        const allergies = asArray('allergies');
        const diet = fv('dietType');
        const activityLevel = fv('activityLevel');
        const sleepHours = fv('sleepHours');
        const stressLevel = fv('stressLevel');
        const smoking = fv('isSmoker', 'unknown');
        const alcohol = fv('alcoholConsumption');
        const familyHistory = [
          fv('familyHistoryDiabetes', null) ? 'Diabetes' : null,
          fv('familyHistoryHypertension', null) ? 'Hypertension' : null,
          fv('familyHistoryThyroid', null) ? 'Thyroid' : null
        ].filter(Boolean);

        profileContext = `COMPLETE USER HEALTH PROFILE:
- Age: ${age}, Gender: ${gender}
- Height: ${height} cm, Weight: ${weight} kg, BMI: ${bmi}, Waist: ${waist}
- Diet: ${diet}, Activity: ${activityLevel}, Sleep: ${sleepHours} hours, Stress: ${stressLevel}
- Smoking: ${smoking}, Alcohol: ${alcohol}
- Known Conditions: ${conditions.join(', ') || 'None'}
- Allergies: ${allergies.join(', ') || 'None'}
- Family History: ${familyHistory.join(', ') || 'None recorded'}`;

        if (vitals.length > 0) {
          const vitalSummary = {};
          vitals.forEach(v => {
            if (!vitalSummary[v.type]) {
              vitalSummary[v.type] = v.type === 'blood_pressure' 
                ? `${v.value.systolic}/${v.value.diastolic} ${v.unit}` 
                : `${v.value} ${v.unit}`;
            }
          });
          profileContext += `\n\nLATEST VITALS:\n${Object.entries(vitalSummary).map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${v}`).join('\n')}`;
        }

        if (medications.length > 0) {
          profileContext += `\n\nACTIVE MEDICATIONS:\n${medications.map(m => `- ${m.name} (${m.dosage}, ${m.frequency})`).join('\n')}`;
        }

        if (labResults.length > 0) {
          profileContext += `\n\nRECENT LAB RESULTS:\n${labResults.map(l => `- ${l.testName}: ${l.resultValue} ${l.unit} (Ref: ${l.referenceRange || 'N/A'}) on ${new Date(l.sampleDate).toLocaleDateString()}`).join('\n')}`;
        }

        if (report) {
          const riskScores = report.risk_scores || {};
          const allRisks = Object.entries(riskScores)
            .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
            .slice(0, 8)
            .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}%`);
          const highRisks = Object.entries(riskScores).filter(([, v]) => v > 40).map(([k, v]) => `${k}: ${v}%`);
          profileContext += `\n\nAI RISK ASSESSMENT: ${report.summary || 'No summary'}`;
          if (allRisks.length > 0) {
            profileContext += `\nTop risks: ${allRisks.join(', ')}`;
          }
          if (highRisks.length > 0) {
            profileContext += `\nElevated risks: ${highRisks.join(', ')}`;
          }
        }
      }
    }

    const systemPrompt = `You are VaidyaSetu's AI Health Assistant, a professional, empathetic, and knowledgeable healthcare bot specializing in Indian health contexts.
IMPORTANT LANGUAGE RULE: Reply only in ${outputLanguage}.

You have access to the user's COMPLETE health profile below. Use it to provide highly personalized, specific, and actionable health advice.

${profileContext || 'No profile context available.'}

IMPORTANT GUIDELINES:
1. Give SPECIFIC advice based on the user's actual vitals, medications, conditions, and lab results
2. If the user asks about symptoms, consider their existing conditions, allergies, and medications for potential interactions
3. Suggest Ayurvedic and natural alternatives when appropriate, considering their diet preferences
4. Reference their actual vital trends when discussing health concerns
5. Alert if any symptom might interact with their current medications
6. Provide dietary advice considering their diet type (vegetarian/non-veg) and cultural context
7. Always include a standard medical disclaimer
8. Be warm, conversational, and supportive`;

    let completion;
    try {
      // Try primary model first
      completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...(conversationHistory || []),
          { role: 'user', content: message }
        ],
        model: 'llama-3.3-70b-versatile',
      });
    } catch (primaryError) {
      // Fallback to smaller model if rate limited
      if (primaryError.status === 429 || primaryError.message?.includes('rate_limit')) {
        console.log('[Chat] Rate limited, falling back to llama-3.1-8b-instant');
        completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            ...(conversationHistory || []),
            { role: 'user', content: message }
          ],
          model: 'llama-3.1-8b-instant',
        });
      } else {
        throw primaryError;
      }
    }

    res.json({
      status: 'success',
      reply: completion.choices[0]?.message?.content || "I apologize, but I am unable to process your request."
    });
  } catch (error) {
    console.error('[Chat] Error:', error.message);
    const outputLanguage = req.resolvedLanguage || 'en';
    
    // If Groq is completely unavailable, return a friendly message
    if (error.status === 429 || error.message?.includes('rate_limit')) {
      return res.json({
        status: 'success',
        reply: outputLanguage === 'en'
          ? "I'm currently experiencing high demand and my AI services are temporarily unavailable. Please try again in a few minutes. Your health data is safe and I'll be ready to help you shortly! 🙏"
          : `AI सेवा अभी व्यस्त है। कृपया कुछ मिनट बाद फिर प्रयास करें। आपकी health data सुरक्षित है और मैं जल्द आपकी मदद के लिए तैयार रहूंगा।`
      });
    }
    
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

module.exports = router;
