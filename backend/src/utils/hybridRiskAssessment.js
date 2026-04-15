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

  if (normalizedProfile.familyHistoryDiabetes === true) {
    normalizedProfile.familyHistoryDiabetes = 'One';
  } else if (normalizedProfile.familyHistoryDiabetes === false) {
    normalizedProfile.familyHistoryDiabetes = 'None';
  }

  if (normalizedProfile.familyHistoryHypertension === true) {
    normalizedProfile.familyHistoryHypertension = 'One';
  } else if (normalizedProfile.familyHistoryHypertension === false) {
    normalizedProfile.familyHistoryHypertension = 'None';
  }

  if (typeof normalizedProfile.frequentUrination === 'boolean') {
    normalizedProfile.frequentUrination = boolToYesNo(normalizedProfile.frequentUrination);
  }

  const risk_scores = {};
  const details = {};

  for (const diseaseId of HYBRID_DISEASE_IDS) {
    const insight = calculateDetailedInsights(normalizedProfile, diseaseId);
    risk_scores[diseaseId] = insight.riskScore;
    details[diseaseId] = {
      riskScore: insight.riskScore,
      riskBand: getRiskBand(insight.riskScore),
      riskCategory: insight.riskCategory,
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
  return { risk_scores, details, missingData, maxRisk };
}

module.exports = { calculateHybridRiskFromProfile, HYBRID_DISEASE_IDS };
