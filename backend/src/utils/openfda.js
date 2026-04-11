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

module.exports = { searchFDA };
