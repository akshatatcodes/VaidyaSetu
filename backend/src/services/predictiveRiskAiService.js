const { Groq } = require('groq-sdk');
const UserProfile = require('../models/UserProfile');
const Vital = require('../models/Vital');
const Medication = require('../models/Medication');
const Report = require('../models/Report');
const DiseaseInsight = require('../models/DiseaseInsight');
const MitigationCompletion = require('../models/MitigationCompletion');

const { HYBRID_DISEASE_IDS, calculateDetailedInsights, getRiskVerificationMeta, getScoreCategory } = require('../utils/riskScorer');
const { PREVALENCE_DATA } = require('../utils/prevalenceData');
const { getPrevalenceEvidenceBatch } = require('../utils/evidenceProviders');
const { generateMitigationSteps } = require('./aiService');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

function clampScore(score) {
  // riskScorer uses `-1` to represent "N/A" (not applicable due to gender/conditions).
  if (score === -1) return -1;
  if (typeof score !== 'number' || Number.isNaN(score)) return 2;
  return Math.round(Math.min(95, Math.max(2, score)));
}

function normalizeToArray(maybeArray) {
  if (!maybeArray) return [];
  if (Array.isArray(maybeArray)) return maybeArray;
  // Some onboarding fields might be stored as { value: [...] }
  if (typeof maybeArray === 'object' && maybeArray.value !== undefined) {
    return Array.isArray(maybeArray.value) ? maybeArray.value : [];
  }
  return [];
}

function mapAllergies(allergies) {
  return normalizeToArray(allergies).map((a) => {
    if (typeof a === 'string') return a;
    if (!a) return '';
    return a.name || a.substance || '';
  }).filter(Boolean);
}

function mapMedicationNames(activeMeds) {
  if (!Array.isArray(activeMeds)) return [];
  return activeMeds.map((m) => (typeof m === 'string' ? m : (m?.name || ''))).filter(Boolean);
}

function latestVitalsByType(vitals) {
  const map = {};
  for (const v of vitals) {
    if (!v?.type) continue;
    if (!map[v.type]) map[v.type] = v;
  }
  return map;
}

function safeJsonParse(raw) {
  try {
    const jsonMatch = String(raw || '').match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : raw;
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

function extractBp(vitalsLatest) {
  const bp = vitalsLatest?.blood_pressure?.value;
  if (!bp || typeof bp !== 'object') return null;
  const systolic = Number(bp.systolic);
  const diastolic = Number(bp.diastolic);
  if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) return null;
  return { systolic, diastolic, unit: vitalsLatest?.blood_pressure?.unit || 'mmHg' };
}

function extractGlucose(vitalsLatest) {
  const g = vitalsLatest?.blood_glucose?.value;
  const value = Number(g);
  if (!Number.isFinite(value)) return null;
  return { value, unit: vitalsLatest?.blood_glucose?.unit || 'mg/dL' };
}

function applyDeterministicVitalsAdjustment({ diseaseId, score, factorBreakdown = [], vitalsLatest }) {
  // If baseline is N/A, do not apply vitals deltas.
  if (score === -1) return { score, factorBreakdown };

  const factors = Array.isArray(factorBreakdown) ? [...factorBreakdown] : [];

  const hasVitalsFactorAlready = factors.some((f) => {
    const id = String(f?.id || '');
    return f?.source === 'vitals' || id.startsWith('vitals_');
  });
  if (hasVitalsFactorAlready) return { score, factorBreakdown: factors };

  let delta = 0;
  let vitalsLabel = '';
  let vitalsExplanation = '';

  const bp = extractBp(vitalsLatest);
  if (bp) {
    const crisis = bp.systolic >= 180 || bp.diastolic >= 120;
    const high = bp.systolic >= 140 || bp.diastolic >= 90;

    const bpDisplay = `${bp.systolic}/${bp.diastolic} ${bp.unit}`;
    if (crisis) {
      if (diseaseId === 'hypertension') delta += 25;
      if (diseaseId === 'stroke') delta += 20;
      if (diseaseId === 'heart_disease') delta += 15;
      if (diseaseId === 'ckd') delta += 10;

      vitalsLabel = `Blood pressure (hypertensive crisis)`;
      vitalsExplanation = `Your latest BP (${bpDisplay}) is in the hypertensive crisis range. This significantly raises cardiovascular risk.`;
    } else if (high) {
      if (diseaseId === 'hypertension') delta += 12;
      if (diseaseId === 'stroke') delta += 10;
      if (diseaseId === 'heart_disease') delta += 8;
      if (diseaseId === 'ckd') delta += 5;

      vitalsLabel = `Blood pressure (high)`;
      vitalsExplanation = `Your latest BP (${bpDisplay}) is above normal. This increases cardiovascular risk.`;
    }
    if (delta > 0) {
      factors.push({
        id: `vitals_bp_${bp.systolic}_${bp.diastolic}`,
        name: vitalsLabel,
        displayValue: bpDisplay,
        rawValue: bp,
        impact: delta,
        direction: 'increase',
        explanation: vitalsExplanation,
        category: 'clinical',
        source: 'vitals'
      });
    }
  }

  const glucose = extractGlucose(vitalsLatest);
  if (glucose) {
    // Only apply if BP didn't already add a vitals factor (avoid spamming UI).
    // If needed later, we can support multiple vitals factors.
    const alreadyAdded = factors.some((f) => String(f?.id || '').startsWith('vitals_'));
    if (!alreadyAdded) {
      if (glucose.value >= 250) {
        let gDelta = 0;
        if (diseaseId === 'diabetes') gDelta = 18;
        if (diseaseId === 'pre_diabetes') gDelta = 12;
        if (diseaseId === 'fatty_liver') gDelta = 6;
        if (gDelta > 0) {
          factors.push({
            id: `vitals_glucose_${glucose.value}`,
            name: 'Blood glucose (very high)',
            displayValue: `${glucose.value} ${glucose.unit}`,
            rawValue: glucose,
            impact: gDelta,
            direction: 'increase',
            explanation: 'Very high glucose readings increase metabolic risk and should be reviewed by a clinician.',
            category: 'lab',
            source: 'vitals'
          });
          delta += gDelta;
        }
      }
    }
  }

  return { score: score + delta, factorBreakdown: factors };
}

/**
 * AI-first predictive risk calculation.
 *
 * Design choice (stability):
 * - We compute baselineScore + questionnaireScore deterministically using `riskScorer`.
 * - AI is used to compute *finalScore* and explainable factor adjustments using vitals/records context.
 * - We always validate AI output; if invalid, we fall back to deterministic questionnaireScore.
 */
async function computePredictiveRiskForDiseases({
  clerkId,
  diseaseIds = HYBRID_DISEASE_IDS,
  language = 'en'
}) {
  if (!clerkId) throw new Error('clerkId is required');

  // Load core context from Mongo
  const [profileDoc, activeMeds, vitals, insightsForDiseases, mitigationCompletions] = await Promise.all([
    UserProfile.findOne({ clerkId }).lean(),
    Medication.find({ clerkId, active: true }).lean(),
    Vital.find({ clerkId }).sort({ timestamp: -1 }).limit(60).lean(),
    DiseaseInsight.find({ clerkId, diseaseId: { $in: diseaseIds } }).lean(),
    MitigationCompletion.find({ clerkId, diseaseId: { $in: diseaseIds }, status: true }).lean()
  ]);

  if (!profileDoc) throw new Error('User profile not found');

  const allergies = mapAllergies(profileDoc.allergies);
  const medNames = mapMedicationNames(activeMeds);
  const vitalsLatest = latestVitalsByType(vitals);

  const insightMap = {};
  for (const ins of insightsForDiseases || []) {
    if (ins?.diseaseId) insightMap[ins.diseaseId] = ins;
  }

  const completedStepIdsByDisease = {};
  for (const mc of mitigationCompletions || []) {
    if (!mc?.diseaseId || !mc?.stepId) continue;
    if (!completedStepIdsByDisease[mc.diseaseId]) completedStepIdsByDisease[mc.diseaseId] = new Set();
    completedStepIdsByDisease[mc.diseaseId].add(mc.stepId);
  }

  // Deterministic anchors (baseline + questionnaire score)
  const deterministicPerDisease = {};
  for (const diseaseId of diseaseIds) {
    const insight = insightMap[diseaseId];

    const completedStepIds = Array.from(completedStepIdsByDisease[diseaseId] || []);
    const mitigationReduction = Math.min(15, completedStepIds.length * 3); // capped reduction per disease

    // If we have a saved onboarding snapshot, use it to compute baselineScore
    const baselineSnapshot = insight?.rawInputData?.onboardingData ? insight.rawInputData.onboardingData : profileDoc;

    // riskScorer expects activeMedications + allergies to exist on the profile-like object
    const baselineProfile = {
      ...baselineSnapshot,
      activeMedications: activeMeds
    };
    if (!baselineProfile.allergies && profileDoc.allergies) baselineProfile.allergies = profileDoc.allergies;

    const currentProfile = {
      ...profileDoc,
      activeMedications: activeMeds
    };

    const baselineInsight = calculateDetailedInsights(baselineProfile, diseaseId);
    const questionnaireInsight = calculateDetailedInsights(currentProfile, diseaseId);

    const mitigationProtectiveFactor = mitigationReduction > 0 ? {
      id: 'mitigation_completed',
      name: 'Mitigation completed',
      displayValue: `${completedStepIds.length} step(s)`,
      rawValue: completedStepIds,
      impact: mitigationReduction,
      direction: 'decrease',
      explanation: 'Your completed mitigation steps reduce risk according to the predictive scoring policy.',
      category: 'lifestyle',
      source: 'mitigation_completion'
    } : null;

    deterministicPerDisease[diseaseId] = {
      baselineScore: baselineInsight?.riskScore ?? -1,
      baselineRiskCategory: baselineInsight?.riskCategory,
      questionnaireScore: questionnaireInsight?.riskScore ?? -1,
      questionnaireRiskCategory: questionnaireInsight?.riskCategory,
      baselineFactorBreakdown: baselineInsight?.factorBreakdown || [],
      questionnaireFactorBreakdown: questionnaireInsight?.factorBreakdown || [],
      protectiveFactors: [
        ...(questionnaireInsight?.protectiveFactors || []),
        ...(mitigationProtectiveFactor ? [mitigationProtectiveFactor] : [])
      ],
      missingDataFactors: questionnaireInsight?.missingDataFactors || [],
      dataCompleteness: questionnaireInsight?.dataCompleteness ?? 0,
      verification: getRiskVerificationMeta(diseaseId),
      questionnaireCompletedAt: insight?.questionnaireCompletedAt || null,
      completedMitigationStepIds: completedStepIds,
      mitigationReduction
    };
  }

  // If Groq is not configured, skip AI and use deterministic final scores
  if (!groq) {
    const result = {};
    for (const diseaseId of diseaseIds) {
      const det = deterministicPerDisease[diseaseId];
      const mitigationSteps = await generateMitigationSteps(profileDoc, diseaseId, det.questionnaireScore, language);

      const vitalsAdjusted = applyDeterministicVitalsAdjustment({
        diseaseId,
        score: det.questionnaireScore,
        factorBreakdown: det.questionnaireFactorBreakdown,
        vitalsLatest
      });

      let finalScore = vitalsAdjusted.score;
      if (finalScore !== -1 && det.mitigationReduction > 0) {
        finalScore = finalScore - det.mitigationReduction;
      }
      const finalScoreClamped = clampScore(finalScore);
      const baselineScoreClamped = clampScore(det.baselineScore);

      result[diseaseId] = {
        riskScore: finalScoreClamped,
        riskCategory: getScoreCategory(finalScoreClamped),
        baselineScore: baselineScoreClamped,
        questionnaireScore: clampScore(det.questionnaireScore),
        assessmentDelta: finalScoreClamped !== -1 && baselineScoreClamped !== -1 ? finalScoreClamped - baselineScoreClamped : 0,
        factorBreakdown: vitalsAdjusted.factorBreakdown,
        protectiveFactors: det.protectiveFactors,
        missingDataFactors: det.missingDataFactors,
        mitigationSteps,
        precautions: (mitigationSteps || []).filter((s) => s?.category === 'precaution').map((s) => s.description),
        verification: det.verification,
        dataCompleteness: det.dataCompleteness
      };
    }
    return result;
  }

  // Build AI prompt (compact but structured)
  const evidence = await getPrevalenceEvidenceBatch(diseaseIds, {
    runtimeFetch: true
  }).catch(() => ({}));

  const diseasesPayload = diseaseIds.map((d) => {
    const det = deterministicPerDisease[d];
    return {
      diseaseId: d,
      baselineScore: det.baselineScore,
      questionnaireScore: det.questionnaireScore,
      // Give only top factors to keep prompt short.
      questionnaireFactorsTop: (det.questionnaireFactorBreakdown || []).slice(0, 6),
      missingDataCount: (det.missingDataFactors || []).length,
      hasQuestionnaire: Boolean(det.questionnaireCompletedAt),
      completedMitigationCount: det.completedMitigationStepIds?.length || 0,
      prevalence: evidence?.[d]?.whoGho?.latestValue
        ? {
            stored: PREVALENCE_DATA[d] || {},
            whoGho: evidence[d].whoGho
          }
        : (PREVALENCE_DATA[d] || {})
    };
  });

  const prompt = `
You are VaidyaSetu AI, generating predictive disease risk scores for Indian users.
You MUST output strict JSON ONLY (no markdown).

INPUTS:
- clerkId: ${clerkId}
- onboarding profile (FieldSchema-like objects): ${JSON.stringify(profileDoc)}
- allergies: ${JSON.stringify(allergies)}
- activeMedications: ${JSON.stringify(medNames)}
- latestVitalsByType (latest record per type): ${JSON.stringify(vitalsLatest)}
- diseaseDeterministicAnchors: ${JSON.stringify(diseasesPayload)}

RULES:
1) baselineScore and questionnaireScore must match the deterministic anchors exactly (do not change them).
2) finalScore must be an integer between 2 and 95.
3) finalScore must start from questionnaireScore and then adjust ONLY based on vitals/records context.
3.1) If completedMitigationCount is > 0, finalScore must be reduced compared to questionnaireScore (risk decreases after completed mitigations).
4) assessmentDelta = finalScore - baselineScore.
5) riskCategory: return one of ["N/A","Very Low","Low","Moderate","High","Very High"].
6) factors: return an array of factor objects. Each factor object must include:
   { id, name, displayValue, impact, direction, explanation, category, source }
   - Include at least the top 1-3 questionnaireFactorsTop.
   - If vitals cause adjustment, add ONE extra factor with category="lab" or "clinical" and name like "Vitals/Records adjustment".
7) mitigationSteps: return 3-6 mitigation steps array objects with:
   { id, title, description, priority ("high"|"medium"|"low"), category ("dietary"|"lifestyle"|"monitoring"|"precaution"), isRegional (boolean) }
   - Ensure precautions/steps do not conflict with allergies/medications.
8) precautions: return an array of short strings (3 items max) derived from mitigationSteps category="precaution".

OUTPUT SCHEMA:
{
  "results": {
    "<diseaseId>": {
      "finalScore": number,
      "baselineScore": number,
      "questionnaireScore": number,
      "assessmentDelta": number,
      "riskCategory": "N/A"|"Very Low"|"Low"|"Moderate"|"High"|"Very High",
      "factorBreakdown": [ { id,name,displayValue,impact,direction,explanation,category,source } ],
      "protectiveFactors": [ { id,name,displayValue,impact,direction,explanation,category,source } ],
      "missingDataFactors": [ { id,name,prompt,impact,type,category } ],
      "mitigationSteps": [ { id,title,description,priority,category,isRegional } ],
      "precautions": [ string ],
      "verification": { "source": string, "allSources": [string], "datasetVersion": string, "verificationLevel": string, "lastValidatedAt": string, "algorithmVersion": string }
    }
  }
}`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    response_format: { type: 'json_object' }
  });

  const raw = chatCompletion?.choices?.[0]?.message?.content || '{}';
  const parsed = safeJsonParse(raw);

  if (!parsed?.results || typeof parsed.results !== 'object') {
    // Deterministic fallback (finalScore = questionnaireScore)
    const result = {};
    for (const diseaseId of diseaseIds) {
      const det = deterministicPerDisease[diseaseId];
      const mitigationSteps = await generateMitigationSteps(profileDoc, diseaseId, det.questionnaireScore, language);

      let finalScore = det.questionnaireScore;
      if (finalScore !== -1 && det.mitigationReduction > 0) {
        finalScore = finalScore - det.mitigationReduction;
      }
      const finalScoreClamped = clampScore(finalScore);
      const baselineScoreClamped = clampScore(det.baselineScore);

      result[diseaseId] = {
        riskScore: finalScoreClamped,
        riskCategory: getScoreCategory(finalScoreClamped),
        baselineScore: baselineScoreClamped,
        questionnaireScore: clampScore(det.questionnaireScore),
        assessmentDelta: finalScoreClamped !== -1 && baselineScoreClamped !== -1 ? finalScoreClamped - baselineScoreClamped : 0,
        factorBreakdown: det.questionnaireFactorBreakdown,
        protectiveFactors: det.protectiveFactors,
        missingDataFactors: det.missingDataFactors,
        mitigationSteps,
        precautions: (mitigationSteps || []).filter((s) => s?.category === 'precaution').map((s) => s.description),
        verification: det.verification,
        dataCompleteness: det.dataCompleteness
      };
    }
    return result;
  }

  // Validate/normalize output
  const result = {};
  for (const diseaseId of diseaseIds) {
    const det = deterministicPerDisease[diseaseId];
    const ai = parsed.results?.[diseaseId];

    const baselineScore = Number(ai?.baselineScore);
    const questionnaireScore = Number(ai?.questionnaireScore);
    const finalScore = Number(ai?.finalScore);

    // baseline/questionnaire must match deterministic anchors to prevent score jumps.
    const baselineOk = (det.baselineScore === -1 && baselineScore === -1) ||
      (det.baselineScore !== -1 && baselineScore === clampScore(det.baselineScore));
    const qOk = (det.questionnaireScore === -1 && questionnaireScore === -1) ||
      (det.questionnaireScore !== -1 && questionnaireScore === clampScore(det.questionnaireScore));

    if (!ai || !baselineOk || !qOk || !Number.isFinite(finalScore)) {
      const mitigationSteps = await generateMitigationSteps(profileDoc, diseaseId, det.questionnaireScore, language);

      let finalScoreAdjusted = det.questionnaireScore;
      if (finalScoreAdjusted !== -1 && det.mitigationReduction > 0) {
        finalScoreAdjusted = finalScoreAdjusted - det.mitigationReduction;
      }
      const finalScoreClamped = clampScore(finalScoreAdjusted);
      const baselineScoreClamped = clampScore(det.baselineScore);

      result[diseaseId] = {
        riskScore: finalScoreClamped,
        riskCategory: getScoreCategory(finalScoreClamped),
        baselineScore: baselineScoreClamped,
        questionnaireScore: clampScore(det.questionnaireScore),
        assessmentDelta: finalScoreClamped !== -1 && baselineScoreClamped !== -1 ? finalScoreClamped - baselineScoreClamped : 0,
        factorBreakdown: det.questionnaireFactorBreakdown,
        protectiveFactors: det.protectiveFactors,
        missingDataFactors: det.missingDataFactors,
        mitigationSteps,
        precautions: (mitigationSteps || []).filter((s) => s?.category === 'precaution').map((s) => s.description),
        verification: det.verification,
        dataCompleteness: det.dataCompleteness
      };
      continue;
    }

    const mitigationSteps = Array.isArray(ai.mitigationSteps) ? ai.mitigationSteps : [];
    const protectiveFromAi = Array.isArray(ai.protectiveFactors) ? ai.protectiveFactors : [];
    const protectiveById = new Map();
    (det.protectiveFactors || []).forEach((p) => {
      if (p?.id) protectiveById.set(p.id, p);
    });
    protectiveFromAi.forEach((p) => {
      if (p?.id) protectiveById.set(p.id, p);
    });
    const mergedProtectiveFactors = Array.from(protectiveById.values());

    let finalScoreAdjusted = finalScore;
    if (finalScoreAdjusted !== -1 && det.mitigationReduction > 0) {
      finalScoreAdjusted = finalScoreAdjusted - det.mitigationReduction;
    }
    const finalScoreClamped = clampScore(finalScoreAdjusted);
    const baselineScoreClamped = clampScore(baselineScore);

    const vitalsAdjusted = applyDeterministicVitalsAdjustment({
      diseaseId,
      score: finalScoreClamped,
      factorBreakdown: Array.isArray(ai.factorBreakdown) ? ai.factorBreakdown : det.questionnaireFactorBreakdown,
      vitalsLatest
    });

    result[diseaseId] = {
      riskScore: clampScore(vitalsAdjusted.score),
      riskCategory: getScoreCategory(clampScore(vitalsAdjusted.score)),
      baselineScore: baselineScoreClamped,
      questionnaireScore: clampScore(questionnaireScore),
      assessmentDelta: clampScore(vitalsAdjusted.score) !== -1 && baselineScoreClamped !== -1 ? clampScore(vitalsAdjusted.score) - baselineScoreClamped : 0,
      factorBreakdown: vitalsAdjusted.factorBreakdown,
      protectiveFactors: mergedProtectiveFactors,
      missingDataFactors: Array.isArray(ai.missingDataFactors) ? ai.missingDataFactors : det.missingDataFactors,
      mitigationSteps,
      precautions: Array.isArray(ai.precautions) ? ai.precautions : [],
      verification: det.verification,
      dataCompleteness: det.dataCompleteness
    };
  }

  return result;
}

module.exports = {
  computePredictiveRiskForDiseases
};

