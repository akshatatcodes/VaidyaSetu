const { calculateDetailedInsights, HYBRID_DISEASE_IDS } = require('./riskScorer');

function boolToYesNo(value) {
  return value ? 'Yes' : 'No';
}

function getRiskBand(score) {
  if (score === -1) return 'N/A';
  if (score > 70) return 'Elevated Risk - Recommend Assessment';
  if (score >= 40) return 'Moderate Risk - Consider Screening';
  return 'Low Risk';
}

function calculateHybridRiskFromProfile(profile) {
  const normalizedProfile = { ...profile };

  const extract = (v) => {
    if (v && typeof v === 'object' && v.value !== undefined) return v.value;
    return v;
  };

  // Many onboarding fields are stored as `{ value: ... }`. Risk scorer expects
  // specific string encodings for family history; normalize booleans here.
  const famDiab = extract(normalizedProfile.familyHistoryDiabetes);
  if (famDiab === true) normalizedProfile.familyHistoryDiabetes = 'One';
  else if (famDiab === false) normalizedProfile.familyHistoryDiabetes = 'None';

  const famHtn = extract(normalizedProfile.familyHistoryHypertension);
  if (famHtn === true) normalizedProfile.familyHistoryHypertension = 'One';
  else if (famHtn === false) normalizedProfile.familyHistoryHypertension = 'None';

  // IMPORTANT: Do NOT convert frequentUrination into 'Yes/No' strings.
  // The risk scorer checks for boolean `true` for diabetes symptom enrichment.
  // So we leave it as-is (FieldSchema object or boolean).

  const risk_scores = {};
  const risk_score_meta = {};
  const details = {};

  for (const diseaseId of HYBRID_DISEASE_IDS) {
    const insight = calculateDetailedInsights(normalizedProfile, diseaseId);
    risk_scores[diseaseId] = insight.riskScore;
    risk_score_meta[diseaseId] = insight.verification || null;
    details[diseaseId] = {
      riskScore: insight.riskScore,
      riskBand: getRiskBand(insight.riskScore),
      riskCategory: insight.riskCategory,
      verification: insight.verification || null,
      missingDataFactors: insight.missingDataFactors || [],
      dataCompleteness: insight.dataCompleteness || 0
    };
  }

  const missingData = {};
  Object.entries(details).forEach(([diseaseId, item]) => {
    missingData[diseaseId] = (item.missingDataFactors || []).map((f) => ({
      id: f.id,
      name: f.name,
      prompt: f.prompt
    }));
  });

  const maxRisk = Math.max(0, ...Object.values(risk_scores).map((v) => Number(v) || 0));
  return { risk_scores, risk_score_meta, details, missingData, maxRisk };
}

module.exports = { calculateHybridRiskFromProfile, HYBRID_DISEASE_IDS };
