/**
 * RAG Multi-Source Interaction API (Phase 7 & 8)
 * POST /api/rag/check-safety
 *
 * Orchestrates:
 * 1. Live API Data (RxNav, OpenFDA)
 * 2. Vector Knowledge (Knowledge Chunks)
 * 3. Groq LLM with specialized RAG Prompt
 */

const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');
const { retrieveRelevantKnowledge } = require('../utils/ragRetriever');
const { compileRagPrompt } = require('../utils/ragPromptEngine');
const Alert = require('../models/Alert');
const UserProfile = require('../models/UserProfile');
const Medication = require('../models/Medication');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/rag/check-safety
router.post('/check-safety', async (req, res) => {
  try {
    const { medicines, language = 'English', clerkId } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ status: 'error', message: 'medicines array is required.' });
    }

    console.log(`[RAG-Safety] Starting High-Speed Analysis (${language}): ${medicines.join(', ')}`);

    // 1. Unified Parallel Retrieval (Covers Vector Store + Live APIs + Direct RxNav)
    const ragResult = await retrieveRelevantKnowledge(medicines);

    // 1.5 Fetch user context for personalized analysis
    let userContext = '';
    if (clerkId) {
      const [profile, activeMeds] = await Promise.all([
        UserProfile.findOne({ clerkId }),
        Medication.find({ clerkId, active: true })
      ]);
      if (profile) {
        const allergies = profile.allergies?.value || [];
        const conditions = profile.medicalHistory?.value || [];
        const age = profile.age?.value || 'unknown';
        const gender = profile.gender?.value || 'unknown';
        const diet = profile.dietType?.value || 'unknown';
        const otherMeds = activeMeds.filter(m => !medicines.includes(m.name)).map(m => m.name);
        userContext = `\nUSER HEALTH PROFILE:\n- Age: ${age}, Gender: ${gender}, Diet: ${diet}\n- Allergies: ${allergies.join(', ') || 'None'}\n- Medical Conditions: ${conditions.join(', ') || 'None'}\n- Other Active Medications: ${otherMeds.join(', ') || 'None'}\n`;
      }
    }

    // 2. Compile RAG Prompt with language support and user context
    const prompt = compileRagPrompt(medicines, ragResult.groqContext, language, userContext);

    // 3. Resilient Groq Call (Fallback Logic)
    let report = null;
    let modelUsed = 'llama-3.3-70b-versatile';
    let isFallback = false;

    try {
      console.log(`[Groq] Attempting Analysis (70B Model)...`);
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
        model: modelUsed,
        response_format: { type: 'json_object' }
      });
      report = JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch (err) {
      if (err.status === 429 || err.message.includes('rate_limit')) {
        console.warn(`[Groq] 70B Rate Limited. Falling back to 8B Model...`);
        modelUsed = 'llama-3.1-8b-instant';
        isFallback = true;
        
        try {
          const fallbackCompletion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
            model: modelUsed,
            response_format: { type: 'json_object' }
          });
          report = JSON.parse(fallbackCompletion.choices[0]?.message?.content || '{}');
        } catch (fallbackErr) {
          console.error(`[Groq] Fallback Failed: ${fallbackErr.message}`);
          // Tier 3: Return raw context if LLM is completely down
          report = {
            hasInteraction: true,
            severity: 'Review Evidence',
            summary: "AI analysis is currently unavailable due to high demand. Please review the raw evidence sources below for safety guidance.",
            interactions: []
          };
        }
      } else {
        throw err; // Rethrow non-rate-limit errors
      }
    }

    // Step 57: Generate Alert for Severe Interactions if clerkId provided
    if (clerkId && report && (report.severity === 'Severe' || report.severity === 'High Risk' || report.hasInteraction)) {
      try {
        const alertObj = {
          clerkId,
          type: 'interaction_detected',
          priority: report.severity === 'Severe' ? 'critical' : 'high',
          title: `Safety Warning: ${report.severity} Interaction`,
          description: report.summary || `A potential safety risk was detected between ${medicines.join(' and ')}.`,
          actionUrl: '/safety-bridge',
          actionText: 'Review Analysis'
        };
        const newAlert = new Alert(alertObj);
        await newAlert.save();
        console.log(`[ALERT] Interaction alert generated for ${clerkId}`);
      } catch (err) {
        console.error('[ALERT] Failed to save interaction alert:', err.message);
      }
    }

    return res.json({
      status: 'success',
      report,
      isFallback,
      modelUsed,
      debug: {
        latency: ragResult.totalDuration,
        evidenceCount: ragResult.interactionMentions.length
      }
    });

  } catch (error) {
    console.error('[RAG-Safety] Global Route Error:', error.message);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
