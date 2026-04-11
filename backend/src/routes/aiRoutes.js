const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');
const UserProfile = require('../models/UserProfile');
const Report = require('../models/Report');
const { calculatePreliminaryRisk } = require('../utils/riskScorer');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Phase E: AI Report Generation with Change Context
router.post('/generate-report', async (req, res) => {
  try {
    const { clerkId, changeContext } = req.body;
    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'clerkId is required' });
    }

    const profile = await UserProfile.findOne({ clerkId });
    if (!profile) {
      return res.status(404).json({ status: 'error', message: 'User profile not found' });
    }

    // Flatten profile for riskScorer if it expects flat data
    // The current riskScorer likely expects profile.age, profile.weight etc.
    // We need to pass the values.
    const flatProfile = {};
    Object.keys(profile.toObject()).forEach(key => {
      if (profile[key] && profile[key].value !== undefined) {
          flatProfile[key] = profile[key].value;
      } else {
          flatProfile[key] = profile[key];
      }
    });

    const riskScores = calculatePreliminaryRisk(flatProfile);

    // AI Prompt Modification (Phase E.1 & E.2)
    let changeInstruction = "";
    if (changeContext) {
      changeInstruction = `
      CONTEXT ON RECENT PROFILE UPDATE:
      "${changeContext}"
      
      IMPORTANT GUIDELINES FOR THIS REPORT:
      1. If the update is a CORRECTION: Use neutral language like "updated," "adjusted," or "recalculated." Never congratulate the user or imply health progress.
      2. If the update is a REAL CHANGE (Positive): Use factual but mildly encouraging language.
      3. If the update is a REAL CHANGE (Negative): State the change factually and provide supportive, neutral recommendations.
      4. If the update is an ADDITION: Acknowledge the new information has been recorded for future assessments.
      5. Do not use false celebratory language for data corrections.
      `;
    }

    const prompt = `
    You are VaidyaSetu AI, a compassionate health assistant for Indian users. 
    Analyze this user profile and preliminary risk scores.
    
    Profile: ${JSON.stringify(flatProfile)}
    Risk Scores: ${JSON.stringify(riskScores)}
    ${changeInstruction}
    
    Output a valid JSON object matching exactly this schema:
    {
      "summary": "2-sentence warm, slightly clinical summary of their health status",
      "diabetes_advice": "Actionable advice based on their diabetes risk",
      "hypertension_advice": "Actionable advice based on their hypertension risk",
      "anemia_advice": "Actionable advice based on their anemia risk",
      "general_tips": "2-3 short bullet points of general lifestyle advice, formatted as a single string with '\\n' for newlines",
      "disclaimer": "Standard short medical disclaimer"
    }
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });

    const aiData = JSON.parse(completion.choices[0].message.content);

    const reportData = {
      clerkId,
      summary: aiData.summary,
      diabetes_advice: aiData.diabetes_advice,
      hypertension_advice: aiData.hypertension_advice,
      anemia_advice: aiData.anemia_advice,
      general_tips: aiData.general_tips,
      disclaimer: aiData.disclaimer,
      risk_scores: riskScores,
      createdAt: new Date()
    };

    const savedReport = await Report.findOneAndUpdate(
      { clerkId },
      reportData,
      { returnDocument: 'after', upsert: true }
    );

    res.json({ status: 'success', data: savedReport });
  } catch (error) {
    console.error('AI Report generation error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
