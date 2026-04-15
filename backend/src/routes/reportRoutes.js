const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const Report = require('../models/Report');
const DiseaseInsight = require('../models/DiseaseInsight');
const Medication = require('../models/Medication');
const InteractionHistory = require('../models/InteractionHistory');
const Feedback = require('../models/Feedback');
const { calculateHybridRiskFromProfile } = require('../utils/hybridRiskAssessment');

// Get Latest Report
router.get('/:clerkId', async (req, res) => {
  try {
    const clerkId = req.params.clerkId;
    const [report, profile, insights] = await Promise.all([
      Report.findOne({ clerkId }).sort({ createdAt: -1 }).lean(),
      UserProfile.findOne({ clerkId }).lean(),
      DiseaseInsight.find({ clerkId }).lean()
    ]);

    if (!report) {
      console.log(`[ReportPoll] No report found for ${clerkId}`);
      return res.status(404).json({ status: 'not_found', message: 'Report not found' });
    }

    // UNIFIED SYNC: Merge clinical scores from DiseaseInsight into the Report
    const mergedRiskScores = { ...(report.risk_scores || {}) };
    const mergedDetails = {};
    
    if (insights && insights.length > 0) {
      insights.forEach(insight => {
        // Only override if the insight is newer or specifically marked as questionnaire-based
        // For simplicity now, we assume DiseaseInsight is the more accurate source
        mergedRiskScores[insight.diseaseId] = insight.riskScore;
        mergedDetails[insight.diseaseId] = {
          riskScore: insight.riskScore,
          riskCategory: insight.riskCategory,
          factorBreakdown: insight.factorBreakdown,
          lastCalculated: insight.lastCalculated
        };
      });
    }

    // Explicit Serialization to prevent data loss in transfer
    const serializedData = JSON.parse(JSON.stringify({
      ...report,
      risk_scores: mergedRiskScores,
      clinical_details: mergedDetails,
      userProfile: profile || {}
    }));

    console.log(`[ReportPoll] Found report for ${clerkId}. Synced with ${insights.length} insights.`);

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

    const flatProfile = {};
    Object.keys(profile).forEach((key) => {
      if (profile[key] && profile[key].value !== undefined) {
        flatProfile[key] = profile[key].value;
      } else {
        flatProfile[key] = profile[key];
      }
    });

    // Fetch active medications for hybrid assessment
    try {
      const activeMeds = await Medication.find({ clerkId, active: true }).lean();
      flatProfile.activeMedications = activeMeds;
    } catch (medErr) {
      console.warn('[HybridAssessment] Could not fetch medications:', medErr.message);
    }

    const hybrid = calculateHybridRiskFromProfile(flatProfile);

    let report = null;
    if (persist) {
      const existing = await Report.findOne({ clerkId }).sort({ createdAt: -1 });
      if (existing) {
        existing.risk_scores = { ...(existing.risk_scores || {}), ...(hybrid.risk_scores || {}) };
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
          category_insights: {},
          mitigations: {}
        });
      }
    }

    res.json({
      status: 'success',
      data: {
        risk_scores: hybrid.risk_scores,
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

module.exports = router;
