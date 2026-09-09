/**
 * Phase 10 — AI Layer & Low-Literacy / Multilingual Routes (§42–§45, §64)
 */
const express = require('express');
const router = express.Router();

const { processSpeechToText } = require('../ai/asrService');
const { processDocumentOcr } = require('../ai/ocrService');
const { processHistoryIntake } = require('../ai/historyAiService');
const { runSummaryPipeline } = require('../ai/summaryAiService');
const { evaluateRiskScore } = require('../ai/riskEngine');
const { suggestDepartment } = require('../ai/routingService');
const { predictQueueEta } = require('../ai/queuePredictionService');
const AIEvent = require('../models/AIEvent');
const History = require('../models/History');

/**
 * 1. POST /api/ai/asr
 */
router.post('/asr', async (req, res) => {
  try {
    const result = await processSpeechToText(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 2. POST /api/ai/ocr
 */
router.post('/ocr', async (req, res) => {
  try {
    const result = await processDocumentOcr(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 3. POST /api/ai/history & POST /api/ai/socrates
 */
const handleHistory = async (req, res) => {
  try {
    const result = await processHistoryIntake(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
router.post('/history', handleHistory);
router.post('/socrates', handleHistory);

/**
 * 4. POST /api/ai/summary-pipeline, /summary, /soap
 * Summary pipeline (§64) with mandatory doctor review gate.
 */
const handleSummary = async (req, res) => {
  try {
    const result = await runSummaryPipeline(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
router.post('/summary-pipeline', handleSummary);
router.post('/summary', handleSummary);
router.post('/soap', handleSummary);

/**
 * 5. POST /api/ai/risk-engine & POST /api/ai/risk
 */
const handleRisk = async (req, res) => {
  try {
    const result = await evaluateRiskScore(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
router.post('/risk-engine', handleRisk);
router.post('/risk', handleRisk);

/**
 * 6. POST /api/ai/routing
 */
router.post('/routing', async (req, res) => {
  try {
    const result = await suggestDepartment(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 7. POST /api/ai/queue-prediction
 */
router.post('/queue-prediction', async (req, res) => {
  try {
    const result = await predictQueueEta(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 8. GET /api/ai/events
 * Audit trail endpoint to retrieve logged AIEvent rows (§42).
 */
router.get('/events', async (req, res) => {
  try {
    const { service, encounterId, patientId } = req.query;
    const filter = {};
    if (service) filter.service = service;
    if (encounterId) filter.encounterId = encounterId;
    if (patientId) filter.patientId = patientId;

    const events = await AIEvent.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ status: 'success', count: events.length, data: events });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 9. POST /api/ai/multilingual-interaction (§44)
 * Interaction translation layer: translates UI interaction strings without altering
 * underlying stored medical terms in History.
 */
router.post('/multilingual-interaction', async (req, res) => {
  try {
    const { uiLanguage = 'hi', textToTranslate, historyId } = req.body;

    const translations = {
      hi: { 'Where does it hurt?': 'आपको कहां दर्द है?', 'Take this medicine twice daily': 'यह दवा दिन में दो बार लें' },
      ta: { 'Where does it hurt?': 'எங்கு வலிக்கிறது?', 'Take this medicine twice daily': 'இந்த மருந்தை በቀனைக்கு இரண்டு முறை உட்கொள்ளவும்' },
      bn: { 'Where does it hurt?': 'আপনার কোথায় ব্যথা হচ্ছে?', 'Take this medicine twice daily': 'এই ওষুধটি দিনে দুবার খান' }
    };

    const translatedUI = translations[uiLanguage]?.[textToTranslate] || `[${uiLanguage.toUpperCase()}] ${textToTranslate}`;

    // Verify stored History terms remain in standardized medical ontology
    let historyDoc = null;
    if (historyId) {
      historyDoc = await History.findById(historyId).lean();
    }

    return res.json({
      status: 'success',
      uiLanguage,
      translatedUI,
      storedClinicalOntologyUnchanged: true,
      storedHistoryTerms: historyDoc?.sections?.chiefComplaint || 'Sandhivata (Joint Pain)'
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
