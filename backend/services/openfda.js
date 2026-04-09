const axios = require('axios');

/**
 * Fetches clinical Boxed Warnings and Side Effects from the official US FDA database.
 * @param {string} drugName The name of the medicine.
 * @returns {Promise<Object>} Boxed warnings and interaction summaries.
 */
async function getFDAWarnings(drugName) {
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(drugName)}"+openfda.brand_name:"${encodeURIComponent(drugName)}"&limit=1`;
    const res = await axios.get(url);
    const result = res.data.results[0];
    
    return {
      name: drugName,
      warnings: result.warnings?.join(' ') || result.boxed_warning?.join(' ') || "No specific warnings in openFDA label.",
      interactions: result.drug_interactions?.join(' ') || "No known interaction section found in FDA labels."
    };
  } catch (error) {
    // 404 is common if the drug isn't in openFDA by exact matching
    console.warn(`openFDA fetch warn for ${drugName}:`, error.response?.status === 404 ? 'Not Found' : error.message);
    return { 
      name: drugName, 
      warnings: "Information not verified by FDA database", 
      interactions: "Information not verified by FDA database" 
    };
  }
}

module.exports = { getFDAWarnings };
