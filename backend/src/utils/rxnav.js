/**
 * RxNav API Utility (Steps 34, 35, 36)
 * National Library of Medicine - No API key required
 * Base URL: https://rxnav.nlm.nih.gov/REST
 */

const axios = require('axios');

const RXNAV_BASE = 'https://rxnav.nlm.nih.gov/REST';

/**
 * Step 35: Drug Name Normalization
 * Accepts a user-entered drug name and returns the best RxCUI match
 */
async function getRxCui(drugName) {
  if (!drugName || typeof drugName !== 'string') return null;

  try {
    const response = await axios.get(`${RXNAV_BASE}/rxcui.json`, {
      params: { name: drugName.trim(), search: 1 },
      timeout: 8000
    });

    const idGroup = response.data?.idGroup;
    if (idGroup?.rxnormId?.length > 0) {
      return {
        rxcui: idGroup.rxnormId[0],
        normalizedName: idGroup.name || drugName
      };
    }

    // Fuzzy fallback: try approximateTerm endpoint
    const approxResponse = await axios.get(`${RXNAV_BASE}/approximateTerm.json`, {
      params: { term: drugName.trim(), maxEntries: 5 },
      timeout: 8000
    });

    const candidates = approxResponse.data?.approximateGroup?.candidate;
    if (candidates?.length > 0) {
      // Prioritize TTY='IN' (Ingredient) for better interaction mapping
      const ingredientMatch = candidates.find(c => c.rxcui && c.score === candidates[0].score); // simplified heuristic
      return {
        rxcui: ingredientMatch?.rxcui || candidates[0].rxcui,
        normalizedName: ingredientMatch?.name || candidates[0].name || drugName,
        isFuzzyMatch: true
      };
    }

    return null;
  } catch (err) {
    console.error(`[RxNav] getRxCui failed for "${drugName}":`, err.message);
    return null;
  }
}

/**
 * Step 59: High-Precision Interaction Check for Multiple Drugs
 * Queries interactions SPECIFICALLY between the provided RxCUIs.
 */
async function getInteractionsBetween(rxcuis = []) {
  if (rxcuis.length < 2) return [];

  try {
    const response = await axios.get(`${RXNAV_BASE}/interaction/list.json`, {
      params: { rxcuis: rxcuis.join(' ') },
      timeout: 8000
    });

    const groups = response.data?.fullInteractionTypeGroup;
    if (!groups) return [];

    const interactions = [];
    for (const group of groups) {
      for (const type of (group.fullInteractionType || [])) {
        for (const pair of (type.interactionPair || [])) {
          interactions.push({
            drugA: pair.interactionConcept?.[0]?.minConceptItem?.name,
            drugB: pair.interactionConcept?.[1]?.minConceptItem?.name,
            description: pair.description,
            severity: pair.severity,
            source: 'RxNav'
          });
        }
      }
    }
    return interactions;
  } catch (err) {
    console.error(`[RxNav] getInteractionsBetween failed:`, err.message);
    return [];
  }
}

/**
 * Step 36: RxNorm Interaction Query
 * Accepts an RxCUI and returns known drug interactions with severity
 */
async function getRxNavInteractions(rxcui) {
  // Fault Injection for Step 61
  if (process.env.SIMULATE_RXNAV_FAILURE === 'true') {
    throw new Error('RxNav Simulated Failure');
  }

  if (!rxcui) return [];

  try {
    const response = await axios.get(`${RXNAV_BASE}/interaction/interaction.json`, {
      params: { rxcui },
      timeout: 8000
    });

    const groups = response.data?.interactionTypeGroup;
    if (!groups || groups.length === 0) return [];

    const interactions = [];

    for (const group of groups) {
      for (const type of (group.interactionType || [])) {
        for (const pair of (type.interactionPair || [])) {
          interactions.push({
            interactingDrug: pair.interactionConcept?.[1]?.minConceptItem?.name || 'Unknown',
            description: pair.description || 'No description available.',
            severity: pair.severity || 'Unknown',
            source: 'RxNav'
          });
        }
      }
    }

    return interactions;
  } catch (err) {
    console.error(`[RxNav] getInteractions failed for rxcui ${rxcui}:`, err.message);
    return [];
  }
}

/**
 * Fetch drug composition and active ingredients from RxNav
 * @param {string} drugName - The name of the drug
 * @returns {Object} Drug composition information
 */
async function getDrugComposition(drugName) {
  if (!drugName || typeof drugName !== 'string') {
    return { name: drugName, composition: 'Information not available', rxcui: null };
  }

  try {
    // Step 1: Get RxCUI
    const rxCuiData = await getRxCui(drugName);
    
    if (!rxCuiData || !rxCuiData.rxcui) {
      return { name: drugName, composition: 'Not found in RxNav database', rxcui: null };
    }

    // Step 2: Get drug properties including active ingredients
    const propsResponse = await axios.get(`${RXNAV_BASE}/rxcui/${rxCuiData.rxcui}/allProperties.json`, {
      params: { prop: 'ATTRIBUTES' },
      timeout: 8000
    });

    const props = propsResponse.data?.propConceptGroup?.propConcept || [];
    
    // Extract active ingredients
    const activeIngredients = props
      .filter(p => p.propName === 'Active_ingredient')
      .map(p => p.propValue)
      .join(', ');

    // Extract strength/ dosage form if available
    const strength = props
      .filter(p => p.propName === 'STRENGTH')
      .map(p => p.propValue)
      .join(', ');

    const dosageForm = props
      .filter(p => p.propName === 'DOSAGE_FORM')
      .map(p => p.propValue)
      .join(', ');

    return {
      name: drugName,
      rxcui: rxCuiData.rxcui,
      normalizedName: rxCuiData.normalizedName,
      composition: activeIngredients || 'Active ingredients not specified',
      strength: strength || null,
      dosageForm: dosageForm || null
    };
  } catch (err) {
    console.error(`[RxNav] getDrugComposition failed for "${drugName}":`, err.message);
    return { name: drugName, composition: 'Error fetching composition data', rxcui: null };
  }
}

module.exports = { getRxCui, getRxNavInteractions, getInteractionsBetween, getDrugComposition };
