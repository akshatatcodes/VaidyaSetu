const fs = require('fs');
const path = require('path');

/**
 * Pure Local Fallback: Matches OCR text against the medicine database.
 * No API key required. Works even if Gemini and Groq are down.
 */
function localFuzzyRefine(rawText) {
  if (!rawText) return [];

  try {
    const medicinesPath = path.join(__dirname, '../data/medicines.json');
    const db = JSON.parse(fs.readFileSync(medicinesPath, 'utf8'));
    const results = new Set();

    const lowerText = rawText.toLowerCase();

    // Strategy 1: Direct Inclusion Check
    db.forEach(med => {
      const name = med.name.toLowerCase();
      // Only match if the word is found clearly (to avoid "Am" matching "Amlodipine" incorrectly)
      if (name.length > 3 && lowerText.includes(name)) {
        results.add(med.name);
      }
    });

    // Strategy 2: Common Indian Shorthands & Mappings
    const shorthands = [
      { key: 'pan-d', target: 'Pantocid' },
      { key: 'panto', target: 'Pantocid' },
      { key: 'eltro', target: 'Eltroxin' },
      { key: 'amdo', target: 'Amdocal' },
      { key: 'amlo', target: 'Amlodipine' },
      { key: 'metf', target: 'Metformin' },
      { key: 'telma', target: 'Telmicheck' }
    ];

    shorthands.forEach(({ key, target }) => {
      if (lowerText.includes(key)) {
        results.add(target);
      }
    });

    // Strategy 3: Regex Pattern Heuristics (Smart Guess)
    // Matches words followed by dosage (e.g., "Eltroxin 50mcg", "Crocin 500")
    const dosePattern = /([A-Z][a-z]+)\s*(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|tab|cap|%|g))/g;
    let match;
    while ((match = rawText.match(dosePattern)) !== null) {
      // If we find a pattern like "Medicine 500mg", extract the word
      const guess = match[0].split(/\s+\d/)[0];
      if (guess.length > 2) results.add(guess);
      break; // Simple one for now to avoid noise
    }

    // fallback if still empty: return all capitalized words over 4 letters
    if (results.size === 0) {
      const caps = rawText.match(/[A-Z][a-z]+/g) || [];
      caps.forEach(word => {
        if (word.length > 4 && !['Clinic', 'Date', 'Address', 'Hospital', 'Daily'].includes(word)) {
          results.add(word);
        }
      });
    }

    return Array.from(results);
  } catch (err) {
    console.error("Local Refiner Error:", err.message);
    return [];
  }
}

module.exports = { localFuzzyRefine };
