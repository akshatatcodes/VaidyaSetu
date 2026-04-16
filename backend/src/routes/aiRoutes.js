const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');
const UserProfile = require('../models/UserProfile');
const Report = require('../models/Report');
const Vital = require('../models/Vital');
const { calculatePreliminaryRisk } = require('../utils/riskScorer');

const Medication = require('../models/Medication');
const aiService = require('../services/aiService');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Phase E: AI Report Generation with Change Context
router.post('/generate-report', async (req, res) => {
  try {
    const { clerkId, changeContext } = req.body;
    const outputLanguage = req.resolvedLanguage || 'en';
    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'clerkId is required' });
    }

    const profile = await UserProfile.findOne({ clerkId });
    if (!profile) {
      return res.status(404).json({ status: 'error', message: 'User profile not found' });
    }

    // Keep FieldSchema `{ value: ... }` structure for scoring.
    // Flattening breaks disease scorers that access `.field?.value` directly (e.g., anemia).
    // We'll still build a flattened view for prompt text only.
    const profileObj = profile.toObject();
    const flatProfile = {};
    Object.keys(profileObj).forEach((key) => {
      if (profileObj[key] && profileObj[key].value !== undefined) {
        flatProfile[key] = profileObj[key].value;
      } else {
        flatProfile[key] = profileObj[key];
      }
    });

    const riskScores = calculatePreliminaryRisk(profileObj);

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

    // Medications Integration
    const activeMeds = await Medication.find({ clerkId, active: true });
    let medsContext = "";
    if (activeMeds.length > 0) {
      medsContext = `
      ACTIVE MEDICATIONS:
      ${activeMeds.map(m => `${m.name} (${m.dosage}, ${m.frequency})`).join(', ')}
      Consider drug-disease interactions and medication side effects in your analysis.
      `;
    }

    // Allergies context
    const allergies = flatProfile.allergies || [];
    let allergyContext = "";
    if (allergies.length > 0) {
      allergyContext = `
      DECLARED ALLERGIES: ${allergies.join(', ')}
      IMPORTANT: All dietary and supplement recommendations MUST avoid these allergens.
      `;
    }

    // --- Phase 4: Expanded AI Prompt for 20+ Diseases ---
    const prompt = `
    You are VaidyaSetu AI, a comprehensive health assistant for Indian users.
    IMPORTANT LANGUAGE RULE: Respond only in ${outputLanguage}. Keep medical terms understandable in ${outputLanguage}.
    Analyze this user profile, preliminary risk scores, and vitals telemetry across 20+ disease categories.

    USER PROFILE: ${JSON.stringify(flatProfile)}
    PRELIMINARY RISK SCORES: ${JSON.stringify(riskScores)}
    ${vitalsContext}
    ${medsContext}
    ${allergyContext}
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
      "mitigations": {
         "diabetes": {
           "exercise": ["Specific exercise recommendation 1", "Exercise tip 2"],
           "diet": ["Specific Indian food to eat", "Food to avoid"],
           "lifestyle": ["Lifestyle change 1", "Lifestyle change 2"],
           "precautions": ["Key precaution based on user profile and medications"]
         },
         ... (include for ALL diseases where risk > 10%)
      },
      "category_insights": {
         "metabolic": "Aggregated insight for this category",
         ...
      },
      "general_tips": "2-3 short bullet points of lifestyle advice",
      "disclaimer": "Standard medical disclaimer"
    }

    MITIGATION RULES:
    - For each disease with risk > 10%, provide specific, actionable mitigations.
    - Exercise: Suggest specific exercises (yoga asanas, walking duration, etc.).
    - Diet: Recommend specific Indian foods (dal, palak, methi, etc.) and foods to avoid.
    - Lifestyle: Sleep, stress management, habits to change.
    - Precautions: Consider user's allergies (${allergies.join(', ') || 'none'}) and active medications (${activeMeds.map(m => m.name).join(', ') || 'none'}).
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

    const existingReport = await Report.findOne({ clerkId }).sort({ createdAt: -1 }).lean();

    const reportData = {
      clerkId,
      summary: aiData.summary || "Health analysis complete. Please see risk matrix for details.",
      advice: (aiData.advice && typeof aiData.advice === 'object') ? aiData.advice : {},
      category_insights: (aiData.category_insights && typeof aiData.category_insights === 'object') ? aiData.category_insights : {},
      mitigations: (aiData.mitigations && typeof aiData.mitigations === 'object') ? aiData.mitigations : {},
      general_tips: Array.isArray(aiData.general_tips) ? aiData.general_tips.join('\n') : (aiData.general_tips || "Maintain a balanced diet and regular exercise."),
      disclaimer: aiData.disclaimer || "VaidyaSetu is an AI screening tool, not a diagnostic service. Please consult a doctor for clinical advice.",
      // Keep hybrid/questionnaire-updated scores canonical if present
      risk_scores: (existingReport?.risk_scores && Object.keys(existingReport.risk_scores).length > 0)
        ? existingReport.risk_scores
        : riskScores,
      risk_score_meta: existingReport?.risk_score_meta || {},
      createdAt: new Date()
    };

    console.log("Saving report for user:", clerkId);
    try {
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

// Medicine Insight - AI analysis for a single medicine
router.post('/medicine-insight', async (req, res) => {
  try {
    const { clerkId, medicineName } = req.body;
    const outputLanguage = req.resolvedLanguage || 'en';
    if (!medicineName) {
      return res.status(400).json({ status: 'error', message: 'medicineName is required' });
    }

    let userContext = '';
    if (clerkId) {
      const [profile, meds, vitals] = await Promise.all([
        UserProfile.findOne({ clerkId }),
        Medication.find({ clerkId, active: true }),
        Vital.find({ clerkId }).sort({ timestamp: -1 }).limit(5)
      ]);
      if (profile) {
        const allergies = profile.allergies?.value || [];
        const conditions = profile.medicalHistory?.value || [];
        const age = profile.age?.value || 'unknown';
        const gender = profile.gender?.value || 'unknown';
        const diet = profile.dietType?.value || 'unknown';
        const otherMeds = meds.map(m => `${m.name} ${m.dosage}`).join(', ') || 'None';
        const latestVitals = vitals.map(v => `${v.type}: ${typeof v.value === 'object' ? JSON.stringify(v.value) : v.value} ${v.unit}`).join('; ') || 'None';
        userContext = `
        USER CONTEXT:
        - Age: ${age}, Gender: ${gender}, Diet: ${diet}
        - Allergies: ${allergies.join(', ') || 'None declared'}
        - Medical Conditions: ${conditions.join(', ') || 'None'}
        - Other Active Medications: ${otherMeds}
        - Recent Vitals: ${latestVitals}
        IMPORTANT: Check for contraindications with the user's allergies and other medications.
        `;
      }
    }

    const prompt = `You are VaidyaSetu AI, a comprehensive health assistant specializing in Indian healthcare systems (Allopathy, Ayurveda, Homeopathy).
IMPORTANT LANGUAGE RULE: Respond only in ${outputLanguage}.

Analyze this medicine: "${medicineName}"
${userContext}

Provide a detailed analysis in JSON format:
{
  "medicine_name": "Standardized name",
  "category": "Drug class/category",
  "general_use": "What this medicine is generally prescribed for (2-3 sentences)",
  "how_it_works": "Brief mechanism of action",
  "common_side_effects": ["side effect 1", "side effect 2", ...],
  "serious_warnings": ["warning 1 if any"],
  "allergy_alert": "Any allergy concern based on user profile, or 'None detected'",
  "drug_interactions": "Interaction warnings with user's other medications, or 'No known interactions'",
  "natural_alternatives": [
    { "name": "Ayurvedic/natural alternative", "description": "How it helps", "source": "Ayurveda/Homeopathy/Naturopathy" }
  ],
  "dietary_suggestions": [
    "Indian food/diet suggestion 1 that supports this treatment",
    "Food to avoid while on this medicine"
  ],
  "exercise_tips": ["Relevant exercise recommendation"],
  "lifestyle_advice": "Personalized lifestyle advice considering user's profile",
  "when_to_consult_doctor": "Signs that require immediate medical attention"
}

Prioritize Indian foods, Ayurvedic herbs, and locally available alternatives. Be specific and actionable.`;

    let aiData;
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });
      const raw = completion.choices[0]?.message?.content || '{}';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      aiData = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (err) {
      if (err.status === 429 || err.message?.includes('rate_limit')) {
        const fallback = await groq.chat.completions.create({
          messages: [{ role: 'system', content: prompt }],
          model: 'llama-3.1-8b-instant',
          response_format: { type: 'json_object' }
        });
        const raw = fallback.choices[0]?.message?.content || '{}';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        aiData = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      } else {
        throw err;
      }
    }

    res.json({ status: 'success', data: aiData });
  } catch (error) {
    console.error('Medicine insight error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Phase 3: Generate personalized mitigation plan for elevated risks
router.post('/mitigation-plan', async (req, res) => {
  try {
    const { clerkId, riskScores } = req.body;
    const outputLanguage = req.resolvedLanguage || 'en';
    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'clerkId is required' });
    }

    const profile = await UserProfile.findOne({ clerkId }).lean();
    if (!profile) {
      return res.status(404).json({ status: 'error', message: 'User profile not found' });
    }

    const scores = riskScores || (await Report.findOne({ clerkId }).sort({ createdAt: -1 }).lean())?.risk_scores || {};
    const elevatedDiseases = Object.entries(scores)
      .filter(([, score]) => Number(score) >= 40)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 6);

    const mitigationByDisease = {};
    for (const [diseaseId, score] of elevatedDiseases) {
      mitigationByDisease[diseaseId] = await aiService.generateMitigationSteps(profile, diseaseId, Number(score), outputLanguage);
    }

    res.json({
      status: 'success',
      data: {
        elevatedDiseases: elevatedDiseases.map(([diseaseId, score]) => ({ diseaseId, score: Number(score) })),
        mitigationByDisease,
        disclaimer: 'Recommendations are supportive and not a substitute for medical advice.'
      }
    });
  } catch (error) {
    console.error('Mitigation plan generation error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
