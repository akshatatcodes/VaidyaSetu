/**
 * OpenFDA Drug API Utility (Steps 37, 38)
 * U.S. Food & Drug Administration - No API key required
 * Rate limit: 240 requests/min (unauthenticated)
 * Base URL: https://api.fda.gov/drug/label.json
 */

const axios = require('axios');

const FDA_BASE = 'https://api.fda.gov/drug/label.json';

/**
 * Step 38: OpenFDA Interaction Query
 * Accepts a drug name, queries the FDA label database for interactions
 * and adverse reactions sections specifically.
 */
async function searchFDA(drugName) {
  // Fault Injection for Step 61
  if (process.env.SIMULATE_FDA_FAILURE === 'true') {
    throw new Error('OpenFDA Simulated Rate Limit / Failure');
  }

  if (!drugName || typeof drugName !== 'string') return null;

  try {
    // Search in drug_interactions and adverse_reactions label sections
    const query = `openfda.generic_name:"${drugName.trim()}" OR openfda.brand_name:"${drugName.trim()}"`;

    const response = await axios.get(FDA_BASE, {
      params: {
        search: query,
        limit: 1
      },
      timeout: 10000
    });

    const results = response.data?.results;
    if (!results || results.length === 0) {
      // Fallback: broader free-text field search
      const fallback = await axios.get(FDA_BASE, {
        params: {
          search: `drug_interactions:"${drugName.trim()}"`,
          limit: 1
        },
        timeout: 10000
      });
      if (!fallback.data?.results?.length) return null;
      return extractFDAData(fallback.data.results[0], drugName);
    }

    return extractFDAData(results[0], drugName);
  } catch (err) {
    // Handle 'no results' 404 gracefully — FDA returns 404 when no matches are found
    if (err.response?.status === 404) {
      return null;
    }
    console.error(`[OpenFDA] search failed for "${drugName}":`, err.message);
    return null;
  }
}

/**
 * Extracts only the relevant interaction and adverse reaction sections
 * from a raw FDA label response object.
 */
function extractFDAData(labelDocument, originalQuery) {
  const drugInteractions = labelDocument.drug_interactions?.[0] || null;
  const adverseReactions = labelDocument.adverse_reactions?.[0] || null;
  const warnings = labelDocument.warnings?.[0] || null;

  // Extract brand name and generic name for clarity
  const brandName = labelDocument.openfda?.brand_name?.[0] || originalQuery;
  const genericName = labelDocument.openfda?.generic_name?.[0] || originalQuery;

  return {
    brandName,
    genericName,
    drugInteractionsText: drugInteractions,
    adverseReactionsText: adverseReactions,
    warningsText: warnings,
    source: 'OpenFDA'
  };
}

/**
 * Fetch drug warnings and safety information from OpenFDA
 * @param {string} drugName - The name of the drug
 * @returns {Object} Drug warnings and safety information
 */
async function getDrugWarnings(drugName) {
  if (!drugName || typeof drugName !== 'string') {
    return { 
      name: drugName, 
      warnings: 'Information not available',
      sideEffects: 'Information not available',
      interactions: 'Information not available'
    };
  }

  try {
    const fdaData = await searchFDA(drugName);
    
    if (!fdaData) {
      return {
        name: drugName,
        warnings: 'No warnings found in FDA database',
        sideEffects: 'No side effects listed in FDA database',
        interactions: 'No interaction data found in FDA database'
      };
    }

    // Extract warnings (simplified for display)
    let warnings = 'No major warnings found';
    if (fdaData.warningsText) {
      // Take first 500 chars of warnings for brevity
      warnings = fdaData.warningsText.length > 500 
        ? fdaData.warningsText.substring(0, 500) + '...'
        : fdaData.warningsText;
    }

    // Extract side effects from adverse reactions
    let sideEffects = 'Consult your physician for side effects';
    if (fdaData.adverseReactionsText) {
      sideEffects = fdaData.adverseReactionsText.length > 500
        ? fdaData.adverseReactionsText.substring(0, 500) + '...'
        : fdaData.adverseReactionsText;
    }

    // Extract drug interactions
    let interactions = 'No specific interactions found';
    if (fdaData.drugInteractionsText) {
      interactions = fdaData.drugInteractionsText.length > 500
        ? fdaData.drugInteractionsText.substring(0, 500) + '...'
        : fdaData.drugInteractionsText;
    }

    return {
      name: drugName,
      brandName: fdaData.brandName,
      genericName: fdaData.genericName,
      warnings: warnings,
      sideEffects: sideEffects,
      interactions: interactions,
      source: fdaData.source
    };
  } catch (err) {
    console.error(`[OpenFDA] getDrugWarnings failed for "${drugName}":`, err.message);
    return {
      name: drugName,
      warnings: 'Error fetching warning data',
      sideEffects: 'Error fetching side effects data',
      interactions: 'Error fetching interaction data'
    };
  }
}

module.exports = { searchFDA, getDrugWarnings };
