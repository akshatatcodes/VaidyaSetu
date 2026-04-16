const { HYBRID_DISEASE_IDS } = require('../utils/riskScorer');
const { computePredictiveRiskForDiseases } = require('./predictiveRiskAiService');
const Report = require('../models/Report');
const DiseaseInsight = require('../models/DiseaseInsight');

// Debounce recompute per user to avoid storms from multiple writes
const timers = new Map(); // clerkId -> timeoutId
const defaultDebounceMs = 2000;

async function persistResults(clerkId, results) {
  // Update/create Report
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

  // Update DiseaseInsight for each disease (preserve questionnaireCompletedAt)
  const diseaseIds = Object.keys(results || {});
  const existing = await DiseaseInsight.find({
    clerkId,
    diseaseId: { $in: diseaseIds }
  }).select({ questionnaireCompletedAt: 1 }).lean();

  const questionnaireCompletedAtByDisease = {};
  (existing || []).forEach((r) => {
    if (!r?.diseaseId) return;
    questionnaireCompletedAtByDisease[r.diseaseId] = r.questionnaireCompletedAt || null;
  });

  const upserts = Object.entries(results).map(([diseaseId, data]) => {
    const preservedQuestionnaireCompletedAt =
      data?.questionnaireCompletedAt ?? questionnaireCompletedAtByDisease[diseaseId] ?? null;

    return DiseaseInsight.updateOne(
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
          questionnaireCompletedAt: preservedQuestionnaireCompletedAt,
          verification: data.verification
        }
      },
      { upsert: true }
    );
  });

  await Promise.all(upserts);
}

async function recomputePredictiveRiskNow({ clerkId, diseaseIds, language = 'en' }) {
  const diseaseList = diseaseIds && diseaseIds.length ? diseaseIds : HYBRID_DISEASE_IDS;
  // In unit tests, `riskScorer` may be mocked and HYBRID_DISEASE_IDS may be undefined.
  // Fail soft: don't attempt recompute if we can't build a disease list.
  if (!Array.isArray(diseaseList) || diseaseList.length === 0) return;
  const results = await computePredictiveRiskForDiseases({
    clerkId,
    diseaseIds: diseaseList,
    language
  });
  await persistResults(clerkId, results);
}

function schedulePredictiveRecompute({ clerkId, diseaseIds, language = 'en', debounceMs = defaultDebounceMs } = {}) {
  if (!clerkId) return;

  if (timers.has(clerkId)) {
    clearTimeout(timers.get(clerkId));
  }

  const timeoutId = setTimeout(async () => {
    timers.delete(clerkId);
    try {
      await recomputePredictiveRiskNow({ clerkId, diseaseIds, language });
    } catch (e) {
      console.error('[PredictiveRiskScheduler] Recompute failed:', e?.message || e);
    }
  }, debounceMs);

  // Don't keep the Node event loop alive just for this debounce timer.
  // Helps Jest workers exit cleanly.
  if (typeof timeoutId?.unref === 'function') {
    timeoutId.unref();
  }

  timers.set(clerkId, timeoutId);
}

module.exports = {
  schedulePredictiveRecompute
};

