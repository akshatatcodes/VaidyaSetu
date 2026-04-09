const { GoogleGenerativeAI } = require('@google/generative-ai');
const { extractFromImageGroq } = require('./groqVision');
const { extractFromImageLocal } = require('./ocr');
const { prepareImageForAI } = require('./image');
const { localFuzzyRefine } = require('./localRefiner');

const isMock = !process.env.GEMINI_API_KEY;
const genAI = isMock ? null : new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Universal normalization helper
 */
function normalizeMedicines(data) {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map(m => (typeof m === 'string' ? m : (m.name || JSON.stringify(m)))).filter(Boolean);
  }
  return [];
}

/**
 * Robust JSON Array Extractor
 */
function extractJsonArray(text) {
  try {
    if (!text) return [];
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(cleanText);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object') {
        const list = parsed.medicines || parsed.list || parsed.names || Object.values(parsed).find(Array.isArray);
        if (list) return list;
      }
    } catch (e) {
      const match = cleanText.match(/\[.*\]/s);
      if (match) {
        try { return JSON.parse(match[0]); } catch { return []; }
      }
    }
    return [];
  } catch (err) {
    return [];
  }
}

const DUAL_MODE_PROMPT = `Extract medicine names into a simple JSON array. Output ONLY the array.`;

/**
 * Triple-Fallback Extraction Engine (Highly Resilient)
 */
async function extractFromImage(fileBuffer, mimeType) {
  const base64Image = fileBuffer.toString('base64');
  const optimizedBase64 = await prepareImageForAI(base64Image);

  // Stage 1: Gemini (Try despite potential quota error)
  console.log("💎 Stage 1: Checking Gemini (Flash Latest)...");
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ inlineData: { data: optimizedBase64, mimeType: 'image/jpeg' } }, { text: DUAL_MODE_PROMPT }] }]
      });
      const medicines = normalizeMedicines(extractJsonArray(result.response.text()));
      if (medicines.length > 0) return medicines;
    } catch (e) {
      console.warn("Gemini Stage Skipped (Quota Likely).");
    }
  }

  // Stage 2: Local Tesseract + AI Refinement (The reliable part)
  console.log("🛡️ Stage 2: Local Tesseract OCR...");
  try {
    const ocrText = await extractFromImageLocal(optimizedBase64, 'image/jpeg');
    console.log("📄 OCR Text Extracted. Now refining with Llama 70B...");
    return await refineTextAI(ocrText);
  } catch (err) {
    console.error("Local OCR Failed. Using Fuzzy Match.");
    return localFuzzyRefine("");
  }
}

/**
 * Refinement Bridge - Groq 70B Focus
 */
async function refineTextAI(rawText) {
  if (!rawText) return [];

  // Attempt 1: Groq Llama 3.3 70B
  console.log("🧠 Refinement: Using Llama-3.3-70b-versatile...");
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: `You are a medical OCR purifier. Identify all medicine brand or generic names from this messy OCR text and return them ONLY as a JSON array of strings: "${rawText}"` }],
    });
    const result = extractJsonArray(completion.choices[0].message.content);
    if (result && result.length > 0) return normalizeMedicines(result);
  } catch (e) {
    console.warn("Groq 70B Refinement Failed:", e.message);
  }

  // Attempt 2: Local Smart Matcher (Regex + Database)
  console.log("🧱 Refinement: Using Local Safety Net (Fuzzy + Patterns)...");
  return localFuzzyRefine(rawText);
}

module.exports = { extractFromImage, refineTextAI, extractJsonArray };
