const DrugMapping = require('../models/DrugMapping');
const Fuse = require('fuse.js');

/**
 * Normalization Service
 * Handles Brand-to-Generic mapping and fuzzy matching for Indian drugs.
 */

// Pre-normalization alias map for common typos and alternate spellings of critical drugs.
// These are matched BEFORE Fuse.js so even bad typos are caught.
const ALIAS_MAP = [
  { aliases: ['warafin', 'warfarin', 'worfarin', 'coumadin', 'jantoven'], canonical: 'Warfarin' },
  { aliases: ['guggol', 'guggul', 'guggulu', 'commiphora', 'mukul'], canonical: 'Guggul' },
  { aliases: ['metformin', 'glucophage', 'glyciphage', 'metfora'], canonical: 'Metformin' },
  { aliases: ['aspirin', 'ecosprin', 'disprin', 'acetylsalicylic'], canonical: 'Aspirin' },
  { aliases: ['paracetamol', 'crocin', 'dolo', 'calpol', 'acetaminophen'], canonical: 'Paracetamol' },
  { aliases: ['lisinopril', 'zestril', 'prinivil'], canonical: 'Lisinopril' },
  { aliases: ['amlodipine', 'stamlo', 'amlogard'], canonical: 'Amlodipine' },
  { aliases: ['atorvastatin', 'lipitor', 'atorva'], canonical: 'Atorvastatin' },
  { aliases: ['digoxin', 'lanoxin'], canonical: 'Digoxin' },
  { aliases: ['phenytoin', 'eptoin', 'dilantin'], canonical: 'Phenytoin' },
  { aliases: ['ashwagandha', 'withania', 'aswagandha'], canonical: 'Ashwagandha' },
  { aliases: ['giloy', 'guduchi', 'tinospora'], canonical: 'Giloy' },
  { aliases: ['tulsi', 'holy basil', 'ocimum'], canonical: 'Tulsi' },
  { aliases: ['turmeric', 'haldi', 'curcumin', 'curcuma'], canonical: 'Turmeric' },
  { aliases: ['garlic', 'lasun', 'allium', 'lahsun'], canonical: 'Garlic' },
  { aliases: ['triphala', 'triphal'], canonical: 'Triphala' },
  { aliases: ['arnica', 'arnica montana'], canonical: 'Arnica Montana' },
  { aliases: ['brahmi', 'bacopa', 'bacopin'], canonical: 'Brahmi' },
  { aliases: ['neem', 'azadirachta', 'nimba'], canonical: 'Neem' },
  { aliases: ['ginger', 'adrak', 'zingiber'], canonical: 'Ginger' },
  { aliases: ['fenugreek', 'methi', 'trigonella'], canonical: 'Fenugreek' },
  { aliases: ['clopidogrel', 'clopilet', 'deplatt'], canonical: 'Clopidogrel' },
];

/**
 * First-pass alias resolution before Fuse search.
 * Handles typos like "Warafin" → "Warfarin", "Guggol" → "Guggul"
 */
function resolveAlias(input) {
  const lower = input.toLowerCase().trim();
  for (const entry of ALIAS_MAP) {
    for (const alias of entry.aliases) {
      // Exact match OR close enough (starts with alias or alias starts with input)
      if (lower === alias || lower.startsWith(alias.substring(0, 5)) || alias.startsWith(lower.substring(0, 5))) {
        return entry.canonical;
      }
    }
  }
  return null;
}

async function normalizeMedicineNames(inputList) {
  if (!inputList || !Array.isArray(inputList) || inputList.length === 0) {
    return [];
  }

  // 1. Fetch all mappings for matching
  const allMappings = await DrugMapping.find({});
  
  // 2. Configure Fuse.js with higher threshold for typo tolerance
  const options = {
    keys: ['brand_name', 'brand_aliases', 'generic_name'],
    threshold: 0.55, // Increased from 0.4 to handle Indian brand name typos better
    includeScore: true
  };
  
  const fuse = new Fuse(allMappings, options);
  const normalizedResults = [];

  for (const query of inputList) {
    // Step 1: Try alias map first (handles critical drug typos like Warafin → Warfarin)
    const aliasResolved = resolveAlias(query);
    if (aliasResolved) {
      normalizedResults.push({
        original: query,
        matched: aliasResolved,
        generic: aliasResolved,
        confidence: 0.95,
        isCombination: false,
        resolvedViaAlias: true
      });
      continue;
    }

    // Step 2: Try Fuse.js fuzzy match against DrugMapping DB
    const searchResults = fuse.search(query);
    
    if (searchResults.length > 0) {
      const bestMatch = searchResults[0].item;
      
      // If it's a combination drug, expand it
      if (bestMatch.combination_drug && bestMatch.components.length > 0) {
        bestMatch.components.forEach(comp => {
          normalizedResults.push({
            original: query,
            matched: bestMatch.brand_name,
            generic: comp,
            confidence: (1 - searchResults[0].score).toFixed(2),
            isCombination: true
          });
        });
      } else {
        normalizedResults.push({
          original: query,
          matched: bestMatch.brand_name,
          generic: bestMatch.generic_name,
          confidence: (1 - searchResults[0].score).toFixed(2),
          isCombination: false
        });
      }
    } else {
      // No match found - keep original as a fallback (capitalize for consistency)
      const capitalized = query.trim().charAt(0).toUpperCase() + query.trim().slice(1).toLowerCase();
      normalizedResults.push({
        original: query,
        matched: null,
        generic: capitalized,
        confidence: 0,
        isFallback: true
      });
    }
  }

  return normalizedResults;
}

module.exports = { normalizeMedicineNames };
