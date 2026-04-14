/**
 * Direct JSON Interaction Checker
 * Checks interactions.json file for known drug-herb interactions
 * This ensures curated interactions are ALWAYS checked, even if RAG retriever fails
 */

const path = require('path');
const fs = require('fs');

// Load interactions database
const interactionsPath = path.join(__dirname, '../data/interactions.json');
let interactionsDB = null;

function loadInteractionsDB() {
  if (!interactionsDB) {
    try {
      const rawData = fs.readFileSync(interactionsPath, 'utf8');
      interactionsDB = JSON.parse(rawData).interactions || [];
      console.log(`[InteractionChecker] Loaded ${interactionsDB.length} interactions from database`);
    } catch (error) {
      console.error('[InteractionChecker] Failed to load interactions.json:', error.message);
      interactionsDB = [];
    }
  }
  return interactionsDB;
}

/**
 * Check for interactions between medicines
 * @param {string[]} medicines - Array of medicine/herb names
 * @returns {Array} Found interactions
 */
function checkDirectInteractions(medicines) {
  const db = loadInteractionsDB();
  const foundInteractions = [];
  
  if (!db || db.length === 0) {
    console.warn('[InteractionChecker] No interactions loaded from database');
    return foundInteractions;
  }
  
  // Normalize medicine names for comparison
  const normalizedMeds = medicines.map(m => m.toLowerCase().trim());
  
  // Check each interaction in database
  for (const interaction of db) {
    const allopathyDrug = interaction.allopathy_drug.toLowerCase();
    const allopathyAliases = (interaction.allopathy_aliases || []).map(a => a.toLowerCase());
    const ayurvedaHerbs = (interaction.ayurveda_herb || []).map(h => h.toLowerCase());
    const homeopathyRemedies = (interaction.homeopathy_remedy || []).map(r => r.toLowerCase());
    
    // Combine all known names for this interaction
    const allNames1 = [allopathyDrug, ...allopathyAliases];
    const allNames2 = [...ayurvedaHerbs, ...homeopathyRemedies];
    
    // Check if any two medicines from the user's list match this interaction
    for (let i = 0; i < normalizedMeds.length; i++) {
      for (let j = i + 1; j < normalizedMeds.length; j++) {
        const med1 = normalizedMeds[i];
        const med2 = normalizedMeds[j];
        
        // Check if med1 and med2 match the interaction pair
        const med1Matches = allNames1.some(name => 
          med1.includes(name) || name.includes(med1)
        );
        const med2Matches = allNames2.some(name => 
          med2.includes(name) || name.includes(med2)
        );
        
        const med1MatchesReverse = allNames2.some(name => 
          med1.includes(name) || name.includes(med1)
        );
        const med2MatchesReverse = allNames1.some(name => 
          med2.includes(name) || name.includes(med2)
        );
        
        // If both medicines match (in either order)
        if ((med1Matches && med2Matches) || (med1MatchesReverse && med2MatchesReverse)) {
          foundInteractions.push({
            id: interaction.id,
            medicines_involved: [interaction.allopathy_drug, ...interaction.ayurveda_herb, ...interaction.homeopathy_remedy],
            severity: capitalizeFirst(interaction.severity),
            confidence: 'High',
            effect: interaction.effect,
            mechanism: interaction.mechanism,
            recommendation: interaction.recommendation,
            source_citation: interaction.source,
            dietary_advice: getDietaryAdvice(interaction.severity),
            natural_alternative: getSuggestionForAlternative(interaction),
            matchType: 'direct_database_match'
          });
        }
      }
    }
  }
  
  return foundInteractions;
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str) {
  if (!str) return 'Unknown';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Get dietary advice based on severity
 */
function getDietaryAdvice(severity) {
  const severityLower = severity.toLowerCase();
  
  if (severityLower === 'high' || severityLower === 'severe') {
    return 'Avoid this combination completely. Consult your doctor immediately.';
  } else if (severityLower === 'moderate') {
    return 'Monitor symptoms closely. Avoid excessive amounts of herbs. Take medicines as prescribed.';
  } else {
    return 'Use with caution. Monitor for any unusual symptoms.';
  }
}

/**
 * Get suggestion for alternative
 */
function getSuggestionForAlternative(interaction) {
  if (interaction.ayurveda_herb && interaction.ayurveda_herb.length > 0) {
    return `Consider discussing alternative herbs with your Ayurvedic practitioner that don't interact with ${interaction.allopathy_drug}.`;
  }
  return 'Consult your doctor for safer alternatives.';
}

module.exports = {
  checkDirectInteractions,
  loadInteractionsDB
};
