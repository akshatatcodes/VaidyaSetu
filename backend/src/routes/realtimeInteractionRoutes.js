/**
 * Real-Time API Integration Route (Steps 39, 41)
 * Master orchestrator for RxNav + OpenFDA combined drug interaction lookup.
 * 
 * POST /api/interaction/realtime
 * Body: { drugs: ['Warfarin', 'Aspirin', 'Ashwagandha'] }
 */

const express = require('express');
const router = express.Router();
const { getRxCui, getRxNavInteractions } = require('../utils/rxnav');
const { searchFDA } = require('../utils/openfda');
const ApiCache = require('../models/ApiCache');

// ===== Rate Limiter State (Step 41) =====
const rateLimiter = {
  callsThisMinute: 0,
  windowStart: Date.now(),
  MAX_PER_MINUTE: 200, // Stay safely below the 240/min OpenFDA limit with headroom

  check() {
    const now = Date.now();
    // Reset window every 60 seconds
    if (now - this.windowStart > 60000) {
      this.callsThisMinute = 0;
      this.windowStart = now;
    }
    if (this.callsThisMinute >= this.MAX_PER_MINUTE) {
      return false; // Rate limit hit
    }
    this.callsThisMinute++;
    return true;
  },

  isAvailable() {
    const now = Date.now();
    if (now - this.windowStart > 60000) return true;
    return this.callsThisMinute < this.MAX_PER_MINUTE;
  }
};

/**
 * Checks MongoDB cache before hitting external APIs (Step 40)
 */
async function getFromCache(key) {
  try {
    const cached = await ApiCache.findOne({ cacheKey: key });
    return cached ? cached.data : null;
  } catch (err) {
    console.error('[Cache] Read error:', err.message);
    return null;
  }
}

/**
 * Saves a fresh API response into the MongoDB cache (Step 40)
 */
async function saveToCache(key, source, data) {
  try {
    await ApiCache.findOneAndUpdate(
      { cacheKey: key },
      { cacheKey: key, source, data, createdAt: new Date() },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('[Cache] Write error:', err.message);
  }
}

/**
 * Step 39: Combined API Orchestrator for a single drug
 * Queries RxNav + OpenFDA, merges and deduplicates results
 */
async function fetchDrugData(drugName) {
  const cacheKey = `combined:${drugName.trim().toLowerCase()}`;

  // Check cache first
  const cached = await getFromCache(cacheKey);
  if (cached) {
    console.log(`[Cache] HIT for "${drugName}"`);
    return { ...cached, fromCache: true };
  }

  console.log(`[API] Fetching live data for "${drugName}"...`);

  // Step 35: Normalize name via RxNav
  const rxData = await getRxCui(drugName);

  let rxInteractions = [];
  if (rxData?.rxcui) {
    // Step 36: Fetch RxNav interactions using the RxCUI
    rxInteractions = await getRxNavInteractions(rxData.rxcui);
  }

  // Step 38: OpenFDA label search
  const fdaData = await searchFDA(drugName);

  // Step 39: Merge results, remove duplicates by interacting drug name
  const seen = new Set();
  const mergedInteractions = [];

  for (const item of rxInteractions) {
    const key = item.interactingDrug?.toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      mergedInteractions.push(item);
    }
  }

  const result = {
    queryDrug: drugName,
    normalizedName: rxData?.normalizedName || drugName,
    rxcui: rxData?.rxcui || null,
    isFuzzyMatch: rxData?.isFuzzyMatch || false,
    rxnavInteractions: mergedInteractions,
    fdaLabel: fdaData,
    timestamp: new Date().toISOString()
  };

  // Save fresh result to cache (Step 40)
  await saveToCache(cacheKey, 'combined', result);

  return result;
}

// ===== Route: POST /api/interaction/realtime =====
router.post('/realtime', async (req, res) => {
  try {
    const { drugs } = req.body;

    if (!drugs || !Array.isArray(drugs) || drugs.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'drugs array is required. Example: { "drugs": ["Warfarin", "Aspirin"] }'
      });
    }

    // Step 41: Rate limit check
    if (!rateLimiter.isAvailable()) {
      return res.status(429).json({
        status: 'rate_limited',
        message: 'Real-time API is temporarily busy. Please wait 1 minute and try again.',
        retryAfter: 60
      });
    }

    // Log current rate limit usage
    console.log(`[RateLimit] Calls this minute: ${rateLimiter.callsThisMinute}/${rateLimiter.MAX_PER_MINUTE}`);

    // Step 39: Process all drugs in parallel using Promise.allSettled for resilience
    const results = await Promise.allSettled(
      drugs.map(drug => {
        rateLimiter.check();
        return fetchDrugData(drug);
      })
    );

    const successfulResults = [];
    const failedDrugs = [];

    results.forEach((outcome, idx) => {
      if (outcome.status === 'fulfilled') {
        successfulResults.push(outcome.value);
      } else {
        failedDrugs.push({ drug: drugs[idx], reason: outcome.reason?.message });
      }
    });

    return res.json({
      status: 'success',
      totalQueried: drugs.length,
      successCount: successfulResults.length,
      failedCount: failedDrugs.length,
      data: successfulResults,
      failed: failedDrugs.length > 0 ? failedDrugs : undefined
    });

  } catch (error) {
    console.error('[Realtime API] Error:', error.message);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// ===== Route: GET /api/interaction/cache-stats =====
// Returns cache health for monitoring (Step 41)
router.get('/cache-stats', async (req, res) => {
  try {
    const totalCached = await ApiCache.countDocuments();
    res.json({
      status: 'success',
      totalCachedEntries: totalCached,
      rateLimiterStatus: {
        callsThisMinute: rateLimiter.callsThisMinute,
        maxPerMinute: rateLimiter.MAX_PER_MINUTE,
        isAvailable: rateLimiter.isAvailable()
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
module.exports.fetchDrugData = fetchDrugData;
module.exports.rateLimiter = rateLimiter;
