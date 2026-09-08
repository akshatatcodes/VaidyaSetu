const express = require('express');
const router = express.Router();
const { matchMedicines, checkInteractions } = require('../utils/interactionEngine');
const InteractionHistory = require('../models/InteractionHistory');
const alertService = require('../services/alertService');
const { Groq } = require('groq-sdk');

const isValidGroqKey = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_');
const groq = isValidGroqKey ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// 1. Medicine Fuzzy Matching
router.post('/match', async (req, res) => {
  try {
    const { medicines } = req.body;
    if (!medicines || !Array.isArray(medicines)) {
      return res.status(400).json({ status: 'error', message: 'medicines array is required' });
    }
    const matches = matchMedicines(medicines);
    res.json({ status: 'success', data: matches });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. Interaction Detection
router.post('/check', async (req, res) => {
  try {
    const { clerkId, confirmedMedicines } = req.body;
    if (!confirmedMedicines || !Array.isArray(confirmedMedicines)) {
      return res.status(400).json({ status: 'error', message: 'confirmedMedicines array is required' });
    }
    const findings = checkInteractions(confirmedMedicines);
    if (clerkId) {
       await InteractionHistory.create({ clerkId, confirmedMedicines, foundInteractions: findings });
       
       // Trigger alert if high severity interactions are found
       await alertService.triggerInteractionAlert(clerkId, findings);
    }
    res.json({ status: 'success', data: findings });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. AI Plain-Language Explanation
router.post('/explain-interaction', async (req, res) => {
  try {
    const { drug1, drug2 } = req.body;
    const outputLanguage = req.resolvedLanguage || 'en';

    if (groq) {
      try {
        const prompt = `Explain to a patient in simple, compassionate terms why taking ${drug1} and ${drug2} together might be dangerous. Keep it strictly under 80 words. Reply only in ${outputLanguage}.`;
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'system', content: "You are VaidyaSetu AI, a health safety assistant." }, { role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
        });
        return res.json({ status: 'success', explanation: completion.choices[0]?.message?.content });
      } catch (err) {
        console.warn('[Interactions] Groq explanation failed:', err.message);
      }
    }

    const fallbackExp = outputLanguage === 'en'
      ? `Taking ${drug1} alongside ${drug2} may alter drug absorption or metabolic pathways in the liver (CYP enzymes), potentially amplifying side effects or reducing therapeutic efficacy. Please consult your physician or pharmacist before combining these medications.`
      : `${drug1} और ${drug2} को एक साथ लेने से दवा के असर या लीवर में मेटाबॉलिज्म पर असर पड़ सकता है, जिससे दुष्प्रभाव बढ़ सकते हैं। इन दवाओं को एक साथ लेने से पहले अपने चिकित्सक से परामर्श अवश्य लें।`;

    res.json({ status: 'success', explanation: fallbackExp });
  } catch (error) {
    res.status(200).json({ 
      status: 'success', 
      explanation: `Caution is advised when co-administering ${req.body.drug1 || 'medication 1'} and ${req.body.drug2 || 'medication 2'}. Review with your prescribing doctor.` 
    });
  }
});

// 4. Interaction History Retrieval
router.get('/history/:clerkId', async (req, res) => {
  try {
    const history = await InteractionHistory.find({ clerkId: req.params.clerkId }).sort({ timestamp: -1 });
    res.json({ status: 'success', data: history });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
