const axios = require('axios');
const { PREVALENCE_DATA } = require('./prevalenceData');

// Simple in-memory cache to avoid repeated WHO API calls
const cache = new Map(); // key -> { value, expiresAt }

function getCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) return null;
  return hit.value;
}

function setCache(key, value, ttlMs) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function getStoredPrevalenceBaseline(diseaseId) {
  const entry = PREVALENCE_DATA[diseaseId] || {};
  // Align with riskScorer baseline logic: it uses `overall` (else falls back to 5)
  return typeof entry.overall === 'number' ? entry.overall : 5;
}

function diseaseWhoGhoSearchConfig(diseaseId) {
  // Best-effort keyword mapping for WHO GHO indicator search.
  // Note: WHO may not provide an exact "overall prevalence of X" matching NFHS/ICMR definitions.
  // We only use runtime values as "evidence hints" and always keep deterministic scoring stable.
  switch (diseaseId) {
    case 'anemia':
      return {
        keyword: 'Anaemia',
        prefers: ['prevalence', 'women', '15-49']
      };
    case 'diabetes':
    case 'pre_diabetes':
      return {
        keyword: 'Diabetes',
        prefers: ['prevalence']
      };
    case 'hypertension':
      return {
        keyword: 'Hypertension',
        prefers: ['prevalence']
      };
    default:
      return null;
  }
}

async function whoGhoFindIndicatorCode({ keyword, prefers = [] }) {
  const baseUrl = 'https://ghoapi.azureedge.net/api/Indicator';
  const filter = `contains(IndicatorName,'${keyword.replace(/'/g, '')}')`;
  const url = `${baseUrl}?$filter=${encodeURIComponent(filter)}&$top=40`;

  const resp = await axios.get(url, { timeout: 8000 });
  const list = Array.isArray(resp?.data?.value) ? resp.data.value : [];
  if (!list.length) return null;

  // Pick the best match by simple keyword scoring
  const scored = list.map((it) => {
    const name = String(it?.IndicatorName || '').toLowerCase();
    let score = 0;
    for (const p of prefers) {
      if (p && name.includes(String(p).toLowerCase())) score += 2;
    }
    if (name.includes(String(keyword).toLowerCase())) score += 1;
    return { it, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.it?.IndicatorCode || null;
}

async function whoGhoFetchLatestValueByIndicatorCode(indicatorCode, { countryCode = 'IND', yearTo = 2024 }) {
  // GHO docs show filtering by date(TimeDimensionBegin) and ordering.
  const baseUrl = `https://ghoapi.azureedge.net/api/${indicatorCode}`;
  const since = yearTo - 5;

  const filter = `SpatialDim eq '${countryCode}' and date(TimeDimensionBegin) ge ${since}-01-01 and date(TimeDimensionBegin) lt ${yearTo}-01-01`;
  const url = `${baseUrl}?$filter=${encodeURIComponent(filter)}&$orderby=TimeDimensionBegin desc&$top=1`;

  const resp = await axios.get(url, { timeout: 8000 });
  const rows = Array.isArray(resp?.data?.value) ? resp.data.value : [];
  const row = rows[0];
  if (!row) return null;

  const val =
    row.NumericValue ??
    row.Value ??
    row.value ??
    (typeof row === 'number' ? row : null);

  const parsed = typeof val === 'string' ? Number(val) : val;
  if (typeof parsed !== 'number' || Number.isNaN(parsed)) return null;
  return parsed;
}

/**
 * Returns stored baseline prevalence and (optionally) runtime WHO GHO evidence.
 * This does NOT replace deterministic scoring values unless we later wire it into riskScorer.
 */
async function getPrevalenceEvidence(diseaseId, { runtimeFetch = true, countryCode = 'IND', yearTo = 2024 } = {}) {
  const stored = PREVALENCE_DATA[diseaseId] || {};
  const hasWhoGho = Array.isArray(stored.sources) && stored.sources.some((s) => String(s).toLowerCase().includes('who gho'));

  const cfg = diseaseWhoGhoSearchConfig(diseaseId);
  if (!runtimeFetch || !hasWhoGho || !cfg) {
    return {
      diseaseId,
      stored,
      whoGho: null,
      runtimeAttempted: false
    };
  }

  const cacheKey = `whoGho:${diseaseId}:${countryCode}:${yearTo}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return {
      diseaseId,
      stored,
      whoGho: cached,
      runtimeAttempted: true
    };
  }

  try {
    const indicatorCode = await whoGhoFindIndicatorCode(cfg);
    if (!indicatorCode) {
      setCache(cacheKey, null, 6 * 60 * 60 * 1000);
      return { diseaseId, stored, whoGho: null, runtimeAttempted: true };
    }

    const latest = await whoGhoFetchLatestValueByIndicatorCode(indicatorCode, { countryCode, yearTo });
    const whoGho = latest === null
      ? null
      : {
          indicatorCode,
          indicatorKeyword: cfg.keyword,
          latestValue: latest,
          yearTo,
          retrievedAt: new Date().toISOString(),
          sourceUrl: `https://ghoapi.azureedge.net/api/${indicatorCode}`
        };

    setCache(cacheKey, whoGho, 24 * 60 * 60 * 1000);
    return {
      diseaseId,
      stored,
      whoGho,
      runtimeAttempted: true
    };
  } catch (e) {
    // Fail soft: never break scoring due to evidence fetch
    setCache(cacheKey, null, 6 * 60 * 60 * 1000);
    return {
      diseaseId,
      stored,
      whoGho: null,
      runtimeAttempted: true,
      error: e?.message || String(e)
    };
  }
}

async function getPrevalenceEvidenceBatch(diseaseIds, opts = {}) {
  const promises = (diseaseIds || []).map((d) => getPrevalenceEvidence(d, opts));
  const results = await Promise.all(promises);
  return Object.fromEntries(results.map((r) => [r.diseaseId, r]));
}

module.exports = {
  getStoredPrevalenceBaseline,
  getPrevalenceEvidence,
  getPrevalenceEvidenceBatch
};

