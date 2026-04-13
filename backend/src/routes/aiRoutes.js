const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');
const UserProfile = require('../models/UserProfile');
const Report = require('../models/Report');
const Vital = require('../models/Vital');
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
      1. If the update is a CORRECTION: Use neutral language like "updated," "adjusted," or "recalculated."
      2. If the update is a REAL CHANGE: Use factual language.
      `;
    }

    // Vitals Integration
    const recentVitals = await Vital.find({ clerkId }).sort({ timestamp: -1 }).limit(5);
    let vitalsContext = "";
    if (recentVitals.length > 0) {
      vitalsContext = `
      RECENT VITALS SNAPSHOT:
      ${JSON.stringify(recentVitals.map(v => ({ type: v.type, value: v.value, unit: v.unit, date: v.timestamp })))}
      `;
    }

    // --- Phase 4: Expanded AI Prompt for 20+ Diseases ---
    const prompt = `
    You are VaidyaSetu AI, a comprehensive health assistant for Indian users.
    Analyze this user profile, preliminary risk scores, and vitals telemetry across 20+ disease categories.

    USER PROFILE: ${JSON.stringify(flatProfile)}
    PRELIMINARY RISK SCORES: ${JSON.stringify(riskScores)}
    ${vitalsContext}
    ${changeInstruction}

    NUTRITIONAL GUIDANCE RULES:
    - Prioritize vegetarian and locally available Indian foods.
    - For iron: Suggest palak, methi, beetroot, jaggery, lentils + vitamin C.
    - For B12: Acknowledge vegetarian challenge; suggest fortified foods/supplements.
    - For Vitamin D: Emphasize sunlight exposure.
    - For protein: Emphasize dal, chana, rajma, paneer, soy, sprouts.

    DISEASE CATEGORIES:
    1. METABOLIC: Diabetes, Pre-diabetes, Obesity, Thyroid, PCOS, Fatty Liver.
    2. CARDIOVASCULAR: Hypertension, Heart Disease, Stroke.
    3. RESPIRATORY: Asthma, COPD, Allergic Rhinitis.
    4. RENAL: CKD, Kidney Stones.
    5. NUTRITIONAL: Anemia, Vitamin D, Vitamin B12.
    6. MENTAL HEALTH: Depression, Anxiety, Sleep Disorders.

    STRICT SCORING & MEDICAL RULES:
    1. NEVER show 100% risk. Maximum possible risk is 95% (Extreme Risk).
    2. GENDER SHIELD: If a disease risk is -1, it is "Not Applicable" (e.g., PCOS for males). State "Not applicable for [Gender]" in advice.
    3. NO HALLUCINATIONS: Only use the disease names listed above. DO NOT invent names like "RUTHA", "CRISIS", or others.
    4. REALISM: If BMI is 19.4, Obesity risk must be Low (2-5%). Adhere to the PRELIMINARY RISK SCORES provided.

    OUTPUT SCHEMA (JSON):
    {
      "summary": "2-sentence warm summary of overall health status",
      "advice": {
         "diabetes": "Actionable advice (Current Risk: X%). Explain WHY based on user data.",
         "pcos": "Advice or 'Not applicable for male' if risk is -1",
         ... (include ALL diseases where risk > 10% OR risk is -1. DO NOT omit high risk categories.)
      },
      "category_insights": {
         "metabolic": "Aggregated insight for this category",
         ...
      },
      "general_tips": "2-3 short bullet points of lifestyle advice",
      "disclaimer": "Standard medical disclaimer"
    }
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });

    const reportResponse = completion.choices[0].message.content;
    let aiData;
    try {
      // Robust JSON detection (strips markdown blocks if present)
      const jsonMatch = reportResponse.match(/\{[\s\S]*\}/);
      aiData = JSON.parse(jsonMatch ? jsonMatch[0] : reportResponse);
    } catch (e) {
      console.error("AI JSON Parse Error. Raw response:", reportResponse);
      throw new Error("Invalid AI response format");
    }

    const reportData = {
      clerkId,
      summary: aiData.summary || "Health analysis complete. Please see risk matrix for details.",
      advice: (aiData.advice && typeof aiData.advice === 'object') ? aiData.advice : {},
      category_insights: (aiData.category_insights && typeof aiData.category_insights === 'object') ? aiData.category_insights : {},
      general_tips: Array.isArray(aiData.general_tips) ? aiData.general_tips.join('\n') : (aiData.general_tips || "Maintain a balanced diet and regular exercise."),
      disclaimer: aiData.disclaimer || "VaidyaSetu is an AI screening tool, not a diagnostic service. Please consult a doctor for clinical advice.",
      risk_scores: riskScores,
      createdAt: new Date()
    };

    console.log("Saving report for user:", clerkId);
    try {
      // Cleanup any duplicate reports for this user
      await Report.deleteMany({ clerkId }); 
      
      const savedReport = await Report.findOneAndUpdate(
        { clerkId },
        reportData,
        { upsert: true, new: true, lean: true }
      );
      
      console.log(`[AI-Report] Created fresh report for ${clerkId}. Advice keys: ${Object.keys(savedReport.advice || {}).length}`);
      res.json({ status: 'success', data: savedReport });
    } catch (saveError) {
      console.error("Database save error:", saveError);
      throw saveError;
    }
  } catch (error) {
    console.error('AI Report generation overall error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
