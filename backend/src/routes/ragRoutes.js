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
const { generateMedicineBreakdown } = require('../services/medicineInfoService');
const { checkDirectInteractions } = require('../utils/interactionChecker');
const Alert = require('../models/Alert');
const UserProfile = require('../models/UserProfile');
const Medication = require('../models/Medication');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/rag/check-safety
router.post('/check-safety', async (req, res) => {
  try {
    const { medicines, language: requestLanguage, clerkId } = req.body;
    const language = requestLanguage || req.resolvedLanguage || 'en';

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ status: 'error', message: 'medicines array is required.' });
    }

    console.log(`[RAG-Safety] Starting High-Speed Analysis (${language}): ${medicines.join(', ')}`);

    // LAYER 1: Direct JSON Database Check (FASTEST & MOST RELIABLE)
    console.log('[RAG-Safety] Layer 1: Checking direct interaction database...');
    const directMatches = checkDirectInteractions(medicines);
    if (directMatches.length > 0) {
      console.log(`[RAG-Safety] ✅ Found ${directMatches.length} direct database match(es)!`);
    }

    // LAYER 2: Vector Search (RAG)
    console.log('[RAG-Safety] Layer 2: Searching knowledge base...');
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

    // 2. Compile RAG Prompt with language support, user context, and direct database matches
    const prompt = compileRagPrompt(medicines, ragResult.groqContext, language, userContext, directMatches);

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

    // LAYER 3: Post-Processing Verification - Ensure direct database matches are included
    if (directMatches.length > 0 && report) {
      console.log('[RAG-Safety] Layer 3: Verifying direct database matches are included...');
      
      // Merge direct matches into report interactions
      if (!report.interactions) {
        report.interactions = [];
      }
      
      // Add any direct matches that AI didn't include
      for (const directMatch of directMatches) {
        const alreadyIncluded = report.interactions.some(existing => 
          existing.source_citation === 'direct_database_match' ||
          (existing.medicines_involved && 
           directMatch.medicines_involved.some(m => 
             existing.medicines_involved.some(em => em.toLowerCase().includes(m.toLowerCase()))
           ))
        );
        
        if (!alreadyIncluded) {
          console.log(`[RAG-Safety] Adding missing direct match: ${directMatch.id}`);
          report.interactions.push(directMatch);
        }
      }
      
      // Update total risks and status if we found interactions
      report.total_risks_found = report.interactions.length;
      
      // If we have direct matches, ensure status is at least CAUTION
      if (report.interactions.length > 0 && report.status === 'SAFE') {
        const hasModerateOrHigher = report.interactions.some(i => 
          i.severity === 'Critical' || i.severity === 'High' || i.severity === 'Moderate'
        );
        if (hasModerateOrHigher) {
          report.status = 'CAUTION';
          report.summary = 'Potential interactions detected. Please review the warnings below and consult your doctor.';
          console.log('[RAG-Safety] ⚠️  Upgraded status from SAFE to CAUTION due to direct database matches');
        }
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

/**
 * POST /api/rag/medicine-breakdown
 * Generate detailed medicine information with composition, dosage, warnings, and alternatives
 */
router.post('/medicine-breakdown', async (req, res) => {
  try {
    const { medicines, language: requestLanguage } = req.body;
    const language = requestLanguage || req.resolvedLanguage || 'en';

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ status: 'error', message: 'medicines array is required.' });
    }

    console.log(`[MedicineInfo] Generating breakdown for: ${medicines.join(', ')} (${language})`);

    const breakdown = await generateMedicineBreakdown(medicines, language);

    console.log(`[MedicineInfo] ✅ Generated breakdown for ${breakdown.medicines?.length || 0} medicines`);

    return res.json({
      status: 'success',
      data: breakdown
    });
  } catch (error) {
    console.error('[MedicineInfo] Route Error:', error.message);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
