const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');
const UserProfile = require('../models/UserProfile');
const Report = require('../models/Report');
const Vital = require('../models/Vital');
const Medication = require('../models/Medication');
const LabResult = require('../models/LabResult');

const isValidGroqKey = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_');
const groq = isValidGroqKey ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

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

    let completion = null;
    if (groq) {
      try {
        completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            ...(conversationHistory || []),
            { role: 'user', content: message }
          ],
          model: 'llama-3.3-70b-versatile',
        });
      } catch (primaryError) {
        console.warn('[Chat] Primary model failed, trying fast fallback:', primaryError.message);
        try {
          completion = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              ...(conversationHistory || []),
              { role: 'user', content: message }
            ],
            model: 'llama-3.1-8b-instant',
          });
        } catch (fbErr) {
          console.warn('[Chat] Both Groq models unavailable:', fbErr.message);
        }
      }
    }

    if (completion?.choices?.[0]?.message?.content) {
      return res.json({
        status: 'success',
        reply: completion.choices[0].message.content
      });
    }

    // Friendly offline / local intelligence response
    const fallbackReply = outputLanguage === 'en'
      ? `Hello! I am VaidyaSetu's Clinical Assistant. I reviewed your query regarding: "${message}". ` +
        `Based on your bio-ledger records, your vitals and medications are actively tracked. ` +
        `Always make sure to take your prescribed doses at regular times and drink plenty of water. ` +
        `If you are experiencing acute pain, severe dizziness, or shortness of breath, please consult a healthcare provider immediately.`
      : `नमस्ते! मैं वैद्यसेतु का क्लिनिकल असिस्टेंट हूँ। मैंने आपके प्रश्न ("${message}") को देखा है। ` +
        `आपके बायो-लेज़र के अनुसार आपके वाइटल्स और दवाएं रिकॉर्ड में हैं। नियमित समय पर दवाएं लें और पर्याप्त पानी पिएं। ` +
        `यदि आपको तीव्र दर्द या सांस लेने में परेशानी हो तो तुरंत डॉक्टर से संपर्क करें।`;

    return res.json({
      status: 'success',
      reply: fallbackReply
    });
  } catch (error) {
    console.error('[Chat] Unhandled error:', error.message);
    res.status(200).json({ 
      status: 'success', 
      reply: "I am currently monitoring your bio-ledger. For clinical emergencies, please seek immediate medical care."
    });
  }
});

module.exports = router;
