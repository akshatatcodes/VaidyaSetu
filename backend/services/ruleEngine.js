const fs = require('fs');
const path = require('path');
const { fetchPubChemData } = require('./pubchemAPI');

// Load databases into memory synchronously on startup
const diseasesDB = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/diseases.json'), 'utf8'));
const medicinesDB = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/medicines.json'), 'utf8'));
const interactionsDB = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/interactions.json'), 'utf8'));

/**
 * Analyzes patient input against static JSON rules and external APIs.
 * @param {Array<string>} userDiseases - Array of disease names.
 * @param {Array<string>} userMedicines - Array of medicine names.
 * @returns {Promise<Object>} Analysis report containing identified conditions, medicines, and warnings.
 */
async function analyzeProfile(userDiseases = [], userMedicines = []) {
  const report = {
    identifiedDiseases: [],
    identifiedMedicines: [],
    interactionWarnings: [],
    diseaseWarnings: []
  };

  // Convert inputs to lowercase for comparison
  const dInput = userDiseases.map(d => d.toLowerCase());
  const mInput = userMedicines.map(m => m.toLowerCase());

  // 1. Identify Diseases
  const matchedDiseases = diseasesDB.filter(d => dInput.includes(d.name.toLowerCase()));
  report.identifiedDiseases = matchedDiseases;

  // 2. Identify Medicines
  const matchedMedicines = medicinesDB.filter(m => mInput.includes(m.name.toLowerCase()));
  
  // Try to resolve unknown medicines through PubChem
  const knownNames = matchedMedicines.map(m => m.name.toLowerCase());
  for (const m of userMedicines) {
    if (!knownNames.includes(m.toLowerCase())) {
      const pubchemEntry = await fetchPubChemData(m);
      if (pubchemEntry) {
        matchedMedicines.push(pubchemEntry);
      }
    }
  }
  
  report.identifiedMedicines = matchedMedicines;

  // 3. Find Drug-Drug Interactions
  for (let i = 0; i < matchedMedicines.length; i++) {
    for (let j = i + 1; j < matchedMedicines.length; j++) {
      const medA = matchedMedicines[i];
      const medB = matchedMedicines[j];

      const interaction = interactionsDB.find(
        int => (int.medA_id === medA.id && int.medB_id === medB.id) ||
               (int.medA_id === medB.id && int.medB_id === medA.id)
      );

      if (interaction) {
        report.interactionWarnings.push({
          medA: medA.name,
          medB: medB.name,
          severity: interaction.severity,
          reason: interaction.reason,
          recommendation: interaction.recommendation
        });
      }
    }
  }

  // 4. Disease-Specific Advice
  if (matchedDiseases.length > 0) {
    matchedDiseases.forEach(d => {
      report.diseaseWarnings.push({
        condition: d.name,
        generalAdvice: d.generalAdvice,
        ayushAdvice: d.ayushAdvice
      });
    });
  }

  return report;
}

module.exports = { analyzeProfile };
