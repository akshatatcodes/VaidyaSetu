const axios = require('axios');

/**
 * Fetches standardized drug information from the NIH RxNav (RxNorm) database.
 * @param {string} drugName The name of the medicine.
 * @returns {Promise<Object>} The RxCUI and active ingredients.
 */
async function getDrugDetails(drugName) {
  try {
    // 1. Get RxCUI (Standard Identifier)
    const searchRes = await axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(drugName)}`);
    const rxcui = searchRes.data?.idGroup?.rxnormId?.[0];
    
    if (!rxcui) return { name: drugName, rxcui: null, composition: "Unknown (Localized salt)" };

    // 2. Get properties (composition/ingredients)
    const propsRes = await axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/allProperties.json?prop=ATTRIBUTES`);
    const props = propsRes.data?.propConceptGroup?.propConcept || [];
    
    // Attempt to extract the active molecular ingredients
    const activeIngredients = props
      .filter(p => p.propName === 'Active_ingredient')
      .map(p => p.propValue)
      .join(', ');
    
    return {
      name: drugName,
      rxcui,
      composition: activeIngredients || "Not found in RxNav database"
    };
  } catch (error) {
    console.warn(`RxNav fetch warn for ${drugName}:`, error.message);
    return { name: drugName, rxcui: null, composition: "Service timeout" };
  }
}

module.exports = { getDrugDetails };
