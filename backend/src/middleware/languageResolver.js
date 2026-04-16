const UserProfile = require('../models/UserProfile');

const SUPPORTED_LANGS = new Set(['en', 'hi', 'mr', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'or', 'pa', 'as', 'ur']);
const LANGUAGE_NAME_MAP = {
  english: 'en',
  hindi: 'hi',
  marathi: 'mr',
  tamil: 'ta',
  telugu: 'te',
  bengali: 'bn',
  gujarati: 'gu',
  kannada: 'kn',
  malayalam: 'ml',
  odia: 'or',
  punjabi: 'pa',
  assamese: 'as',
  urdu: 'ur'
};

function normalizeLang(lang) {
  if (!lang || typeof lang !== 'string') return null;
  const normalized = lang.toLowerCase().trim();
  const mapped = LANGUAGE_NAME_MAP[normalized];
  const base = (mapped || normalized).split('-')[0].trim();
  return SUPPORTED_LANGS.has(base) ? base : null;
}

async function resolveLanguage(req, _res, next) {
  try {
    const fromBody = normalizeLang(req.body?.language);
    const fromQuery = normalizeLang(req.query?.lang);
    const fromHeader = normalizeLang(req.headers['x-user-language']);

    let resolved = fromBody || fromQuery || fromHeader;
    if (!resolved) {
      const clerkId = req.body?.clerkId || req.params?.clerkId || req.query?.clerkId;
      if (clerkId) {
        const profile = await UserProfile.findOne({ clerkId }).lean();
        resolved = normalizeLang(profile?.settings?.language);
      }
    }

    req.resolvedLanguage = resolved || 'en';
    next();
  } catch (error) {
    req.resolvedLanguage = 'en';
    next();
  }
}

module.exports = { resolveLanguage, normalizeLang };
