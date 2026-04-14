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
        const age = profile.age?.value || 'unknown';
        const gender = profile.gender?.value || 'unknown';
        const conditions = profile.medicalHistory?.value || [];
        const allergies = profile.allergies?.value || [];
        const diet = profile.diet?.value || 'unknown';
        const lifestyle = profile.lifestyle?.value || 'unknown';
        const smoking = profile.smoking?.value || 'unknown';
        const alcohol = profile.alcohol?.value || 'unknown';
        const exercise = profile.exerciseFrequency?.value || 'unknown';
        const familyHistory = profile.familyHistory?.value || [];
        const height = profile.height?.value || 'unknown';
        const weight = profile.weight?.value || 'unknown';
        
        profileContext = `COMPLETE USER HEALTH PROFILE:
- Age: ${age}, Gender: ${gender}
- Height: ${height} cm, Weight: ${weight} kg
- Diet: ${diet}, Lifestyle: ${lifestyle}
- Smoking: ${smoking}, Alcohol: ${alcohol}, Exercise: ${exercise}
- Known Conditions: ${conditions.join(', ') || 'None'}
- Allergies: ${allergies.join(', ') || 'None'}
- Family History: ${familyHistory.join(', ') || 'None'}`;

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
          const highRisks = Object.entries(riskScores).filter(([, v]) => v > 40).map(([k, v]) => `${k}: ${v}%`);
          profileContext += `\n\nAI RISK ASSESSMENT: ${report.summary || 'No summary'}`;
          if (highRisks.length > 0) {
            profileContext += `\nElevated risks: ${highRisks.join(', ')}`;
          }
        }
      }
    }

    const systemPrompt = `You are VaidyaSetu's AI Health Assistant, a professional, empathetic, and knowledgeable healthcare bot specializing in Indian health contexts.

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

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...(conversationHistory || []),
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
    });

    res.json({
      status: 'success',
      reply: completion.choices[0]?.message?.content || "I apologize, but I am unable to process your request."
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
