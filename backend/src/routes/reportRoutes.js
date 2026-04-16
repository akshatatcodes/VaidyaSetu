const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const Report = require('../models/Report');
const Medication = require('../models/Medication');
const InteractionHistory = require('../models/InteractionHistory');
const Feedback = require('../models/Feedback');
const DiseaseInsight = require('../models/DiseaseInsight');
const { calculateHybridRiskFromProfile } = require('../utils/hybridRiskAssessment');
const { computePredictiveRiskForDiseases } = require('../services/predictiveRiskAiService');

// Get Latest Report
router.get('/:clerkId', async (req, res) => {
  try {
    const clerkId = req.params.clerkId;
    const [report, profile] = await Promise.all([
      Report.findOne({ clerkId }).sort({ createdAt: -1 }).lean(),
      UserProfile.findOne({ clerkId }).lean()
    ]);

    if (!report) {
      console.log(`[ReportPoll] No report found for ${clerkId}`);
      return res.status(404).json({ status: 'not_found', message: 'Report not found' });
    }

    // Explicit Serialization to prevent data loss in transfer
    const serializedData = JSON.parse(JSON.stringify({
      ...report,
      userProfile: profile || {}
    }));

    console.log(`[ReportPoll] Found report for ${clerkId}. RiskScores: ${Object.keys(serializedData.risk_scores || {}).length}, Advice: ${Object.keys(serializedData.advice || {}).length}`);

    res.json({ 
      status: 'success', 
      data: serializedData
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Hybrid questionnaire-first risk assessment for key disease cards
router.post('/hybrid-assessment', async (req, res) => {
  try {
    const { clerkId, persist = true } = req.body;
    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'clerkId is required' });
    }

    const profile = await UserProfile.findOne({ clerkId }).lean();
    if (!profile) {
      return res.status(404).json({ status: 'error', message: 'Profile not found' });
    }

    // Fetch active medications for hybrid assessment
    try {
      const activeMeds = await Medication.find({ clerkId, active: true }).lean();
      profile.activeMedications = activeMeds;
    } catch (medErr) {
      console.warn('[HybridAssessment] Could not fetch medications:', medErr.message);
    }

    // IMPORTANT: keep the `{ value: ... }` FieldSchema shape intact so
    // riskScorer gets the correct inputs (anemia dietType, etc).
    const hybrid = calculateHybridRiskFromProfile(profile);

    let report = null;
    if (persist) {
      const existing = await Report.findOne({ clerkId }).sort({ createdAt: -1 });
      if (existing) {
        const questionnaireInsights = await DiseaseInsight.find({
          clerkId,
          questionnaireCompletedAt: { $ne: null }
        }).lean();

        const preservedScores = {};
        const preservedMeta = {};
        questionnaireInsights.forEach((insight) => {
          if (insight?.diseaseId) {
            preservedScores[insight.diseaseId] = insight.riskScore;
            preservedMeta[insight.diseaseId] = insight.verification || null;
          }
        });

        existing.risk_scores = {
          ...(existing.risk_scores || {}),
          ...(hybrid.risk_scores || {}),
          ...preservedScores
        };
        existing.risk_score_meta = {
          ...(existing.risk_score_meta || {}),
          ...(hybrid.risk_score_meta || {}),
          ...preservedMeta
        };
        await existing.save();
        report = existing;
      } else {
        report = await Report.create({
          clerkId,
          summary: 'Hybrid questionnaire risk profile generated.',
          advice: {},
          general_tips: 'Complete additional screenings and vitals for better accuracy.',
          disclaimer: 'This is a screening support tool, not a diagnosis.',
          risk_scores: hybrid.risk_scores,
          risk_score_meta: hybrid.risk_score_meta || {},
          category_insights: {},
          mitigations: {}
        });
      }
    }

    res.json({
      status: 'success',
      data: {
        risk_scores: hybrid.risk_scores,
        risk_score_meta: hybrid.risk_score_meta,
        details: hybrid.details,
        missingData: hybrid.missingData,
        reportId: report?._id || null
      }
    });
  } catch (error) {
    console.error('Hybrid assessment error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Predictive risk initialization (baseline from onboarding first)
router.post('/predictive-risk/init', async (req, res) => {
  try {
    const { clerkId, diseaseIds, persist = true } = req.body || {};
    if (!clerkId) return res.status(400).json({ status: 'error', message: 'clerkId is required' });

    const results = await computePredictiveRiskForDiseases({
      clerkId,
      diseaseIds,
      language: req.resolvedLanguage || 'en'
    });

    if (persist) {
      const report = await Report.findOne({ clerkId }).sort({ createdAt: -1 });
      const risk_scores = {};
      const risk_score_meta = {};

      Object.entries(results).forEach(([diseaseId, data]) => {
        risk_scores[diseaseId] = data.riskScore;
        risk_score_meta[diseaseId] = data.verification;
      });

      if (report) {
        report.risk_scores = {
          ...(report.risk_scores || {}),
          ...risk_scores
        };
        report.risk_score_meta = {
          ...(report.risk_score_meta || {}),
          ...risk_score_meta
        };
        await report.save();
      } else {
        await Report.create({
          clerkId,
          summary: 'Predictive risk baseline initialized.',
          advice: {},
          general_tips: 'Complete additional screenings and log vitals for better accuracy.',
          disclaimer: 'This is a screening support tool, not a diagnosis.',
          risk_scores,
          risk_score_meta,
          category_insights: {},
          mitigations: {}
        });
      }

      // Persist DiseaseInsight (factors + mitigation suggestions)
      const upserts = Object.entries(results).map(async ([diseaseId, data]) => {
        const existing = await DiseaseInsight.findOne({ clerkId, diseaseId });
        const questionnaireCompletedAt = existing?.questionnaireCompletedAt || data.questionnaireCompletedAt || null;

        await DiseaseInsight.updateOne(
          { clerkId, diseaseId },
          {
            $set: {
              riskScore: data.riskScore,
              riskCategory: data.riskCategory,
              factorBreakdown: data.factorBreakdown || [],
              protectiveFactors: data.protectiveFactors || [],
              missingDataFactors: data.missingDataFactors || [],
              mitigationSteps: data.mitigationSteps || [],
              dataCompleteness: data.dataCompleteness || 0,
              questionnaireCompletedAt,
              verification: data.verification
            }
          },
          { upsert: true }
        );
      });

      await Promise.all(upserts);
    }

    res.json({ status: 'success', data: { risk_scores: Object.fromEntries(Object.entries(results).map(([d, v]) => [d, v.riskScore])) } });
  } catch (error) {
    console.error('Predictive risk init error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Predictive risk recomputation (baseline + questionnaire state, plus latest records)
router.post('/predictive-risk/recompute', async (req, res) => {
  try {
    const { clerkId, diseaseIds, persist = true } = req.body || {};
    if (!clerkId) return res.status(400).json({ status: 'error', message: 'clerkId is required' });

    const results = await computePredictiveRiskForDiseases({
      clerkId,
      diseaseIds,
      language: req.resolvedLanguage || 'en'
    });

    if (persist) {
      const report = await Report.findOne({ clerkId }).sort({ createdAt: -1 });
      const risk_scores = {};
      const risk_score_meta = {};

      Object.entries(results).forEach(([diseaseId, data]) => {
        risk_scores[diseaseId] = data.riskScore;
        risk_score_meta[diseaseId] = data.verification;
      });

      if (report) {
        report.risk_scores = {
          ...(report.risk_scores || {}),
          ...risk_scores
        };
        report.risk_score_meta = {
          ...(report.risk_score_meta || {}),
          ...risk_score_meta
        };
        await report.save();
      } else {
        await Report.create({
          clerkId,
          summary: 'Predictive risk recomputed.',
          advice: {},
          general_tips: 'Risk scores have been updated based on your latest inputs.',
          disclaimer: 'This is a screening support tool, not a diagnosis.',
          risk_scores,
          risk_score_meta,
          category_insights: {},
          mitigations: {}
        });
      }

      const upserts = Object.entries(results).map(async ([diseaseId, data]) => {
        const existing = await DiseaseInsight.findOne({ clerkId, diseaseId });
        const questionnaireCompletedAt = existing?.questionnaireCompletedAt || null;

        await DiseaseInsight.updateOne(
          { clerkId, diseaseId },
          {
            $set: {
              riskScore: data.riskScore,
              riskCategory: data.riskCategory,
              factorBreakdown: data.factorBreakdown || [],
              protectiveFactors: data.protectiveFactors || [],
              missingDataFactors: data.missingDataFactors || [],
              mitigationSteps: data.mitigationSteps || [],
              dataCompleteness: data.dataCompleteness || 0,
              questionnaireCompletedAt,
              verification: data.verification
            }
          },
          { upsert: true }
        );
      });
      await Promise.all(upserts);
    }

    res.json({ status: 'success', data: { risk_scores: Object.fromEntries(Object.entries(results).map(([d, v]) => [d, v.riskScore])) } });
  } catch (error) {
    console.error('Predictive risk recompute error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
