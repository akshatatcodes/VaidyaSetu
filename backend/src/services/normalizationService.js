const Fuse = require('fuse.js');
const interactionsData = require('../data/interactions.json');

// Map of common aliases for Indian drug names/typos
const ALIAS_MAP = {
  'warafin': 'Warfarin',
  'warafen': 'Warfarin',
  'warfaren': 'Warfarin',
  'guggol': 'Guggul',
  'guggal': 'Guggul',
  'gugul': 'Guggul',
  'ashwaganda': 'Ashwagandha',
  'asvagnadha': 'Ashwagandha',
  'amoxy': 'Amoxicillin',
  'amoxycilin': 'Amoxicillin',
  'pcm': 'Paracetamol',
  'para': 'Paracetamol'
};

/**
 * Prepares the master list of all valid medicine names for fuzzy search
 */
const prepareMedicineList = () => {
    const names = new Set();
    interactionsData.interactions.forEach(item => {
        if (item.allopathy_drug) names.add(item.allopathy_drug);
        if (item.allopathy_aliases) item.allopathy_aliases.forEach(a => names.add(a));
        if (item.ayurveda_herb) item.ayurveda_herb.forEach(h => names.add(h));
        if (item.homeopathy_remedy) item.homeopathy_remedy.forEach(r => names.add(r));
    });
    // Add common aliases to the search list
    Object.values(ALIAS_MAP).forEach(val => names.add(val));
    return Array.from(names);
};

const medicineList = prepareMedicineList();

const fuse = new Fuse(medicineList, {
  threshold: 0.5,
  distance: 100,
  includeScore: true
});

/**
 * Normalizes medicine names (handles typos and aliases)
 * @param {string[]} names 
 */
async function normalizeMedicineNames(names) {
  return names.map(name => {
    const cleanName = name.trim().toLowerCase();
    
    // 1. Direct Alias Check (Case insensitive)
    for (const [alias, canonical] of Object.entries(ALIAS_MAP)) {
        if (cleanName === alias) {
          return {
            original: name,
            matched: 'Exact Alias',
            generic: canonical,
            confidence: 1.0,
            isCombination: false
          };
        }
    }

    // 2. Fuzzy Match
    const results = fuse.search(name);
    if (results.length > 0 && results[0].score < 0.4) {
      return {
        original: name,
        matched: 'Fuzzy Match',
        generic: results[0].item,
        confidence: 1 - results[0].score,
        isCombination: false
      };
    }

    // 3. Keep original if no confident match
    return {
      original: name,
      matched: null,
      generic: null,
      confidence: 0,
      isCombination: false
    };
  });
}

module.exports = { normalizeMedicineNames };
