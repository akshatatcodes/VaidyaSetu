require('dotenv').config({ path: '../.env' });
const { localFuzzyRefine } = require('./localRefiner');
const { extractJsonArray } = require('./gemini');

// Test Case 1: Messy local OCR output
const messyText = "Clinic Name\nDate: 2026\nPatient: John\nRx:\nEltroxin 50mcg\nAmdo lo 5mg\nPan-D daily\nBP: 120/80";

console.log("🧪 Testing Local Fuzzy Refiner...");
const results = localFuzzyRefine(messyText);
console.log("📄 Local Match Results:", results);

if (results.includes('Eltroxin') && results.includes('Amdocal') && results.includes('Pantocid')) {
  console.log("✅ SUCCESS: Local Fuzzy Matching found correct medicines from messy text!");
} else {
  console.log("⚠️ FAILURE: Local matching insufficient.");
}

// Test Case 2: JSON Extractor
const chattyAI = "Here is the list: ```json [\"Metformin\", \"Telma\"] ``` Hope it helps!";
console.log("\n🧪 Testing JSON Extractor...");
const extracted = extractJsonArray(chattyAI);
console.log("📄 Extracted:", extracted);

if (extracted.length === 2) {
  console.log("✅ SUCCESS: JSON Extractor handled markdown perfectly.");
}
