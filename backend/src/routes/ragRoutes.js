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
const { fetchDrugData, rateLimiter } = require('./realtimeInteractionRoutes');
const { compileRagPrompt } = require('../utils/ragPromptEngine');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/rag/check-safety
router.post('/check-safety', async (req, res) => {
  try {
    const { medicines } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ status: 'error', message: 'medicines array is required.' });
    }

    console.log(`[RAG-Safety] Starting High-Speed Analysis: ${medicines.join(', ')}`);

    // 1. Unified Parallel Retrieval (Covers Vector Store + Live APIs + Direct RxNav)
    const ragResult = await retrieveRelevantKnowledge(medicines);

    // 2. Compile RAG Prompt
    const prompt = compileRagPrompt(medicines, ragResult.groqContext);

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
