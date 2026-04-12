/**
 * VaidyaSetu AI Vision Service - Prescription OCR Engine
 * Adapted from MediScan's multi-tier extraction pipeline.
 * 
 * Cascade Order:
 * 1. Gemini 2.5 Flash Vision (Primary - directly reads image)
 * 2. Gemini 2.0 Flash Vision (Secondary)
 * 3. Groq LLaMA Vision (Tertiary fallback)
 * 4. Tesseract.js Local OCR (Final offline safety net)
 */

const { GoogleGenAI } = require('@google/genai');
const { extractFromImageGroq } = require('./groqVision');
const { extractFromImageLocal } = require('./ocr');
const { prepareImageForAI } = require('./image');

const isMock = !process.env.GEMINI_API_KEY;
const ai = isMock ? null : new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Universal normalization - handles any shape of JSON returned by the AI
 */
function normalizeMedicines(data) {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data.map(m => (typeof m === 'string' ? m : (m.name || JSON.stringify(m)))).filter(Boolean);
  }

  if (typeof data === 'object') {
    const list = data.medicines || data.list || data.names || Object.values(data).find(Array.isArray);
    if (list && Array.isArray(list)) {
      return normalizeMedicines(list);
    }
  }

  return [];
}

function getFriendlyError(err) {
  const msg = err?.message || String(err);
  if (msg.includes("404") || msg.includes("not found")) return "Model not available";
  if (msg.includes("429") || msg.includes("quota")) return "Rate limit / High traffic";
  if (msg.includes("location") || msg.includes("region")) return "Regional restriction";
  return "AI temporarily unavailable";
}

/**
 * STRICT OCR PROMPT - reads medicine names EXACTLY as printed
 */
const STRICT_OCR_PROMPT = `
System: You are a highly accurate Medical OCR Auditor for Indian prescriptions.
Task: Identify every medicine name (brand or generic) visible in the provided image.

STRICT RULES - FOLLOW EXACTLY:
1. Read and extract medicine names EXACTLY as printed. Do NOT guess, correct, or invent any name.
2. Include dosage strength if clearly visible (e.g. "Paracetamol 500mg", "Amoxicillin 250mg").
3. If text is blurry, partial, or unclear, write it as "unclear: [partial text]".
4. Focus especially on bold/large text (this usually contains the main medicine name).
5. ONLY list medicines that are clearly visible and readable.
6. Prescription text may be in English, Hindi, Marathi, Tamil, Telugu, or Bengali - extract all.
7. Extract names as a flat JSON array of strings.
8. If no medicines are found or the image is unreadable, return [].
9. No additional text, markdown tags, or explanations.
`;

/**
 * Main extraction function - cascades through all available AI engines
 */
async function extractFromImage(base64Image, mediaType) {
  if (isMock) return { medicines: [], method: "Offline Mode" };

  const optimizedBase64 = await prepareImageForAI(base64Image);
  let lastError = "AI Busy";

  // Priority order: Gemini 2.5 Flash → Gemini 2.0 Flash → Groq Vision → Local Tesseract
  const modelAttempts = [
    { name: 'gemini-2.5-flash',   label: "Gemini 2.5 Flash" },
    { name: 'gemini-2.0-flash',   label: "Gemini 2.0 Flash" },
  ];

  for (const attempt of modelAttempts) {
    console.log(`💎 Attempting ${attempt.label} Vision...`);
    try {
      const response = await ai.models.generateContent({
        model: attempt.name,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: optimizedBase64, mimeType: 'image/jpeg' } },
              { text: STRICT_OCR_PROMPT }
            ]
          }
        ],
        config: { 
          responseMimeType: "application/json",
          temperature: 0.0 
        }
      });

      const rawResult = JSON.parse(response.text);
      const medicines = normalizeMedicines(rawResult);
      
      console.log(`✅ ${attempt.label} Extraction Success: ${medicines.length} medicines.`);
      return { medicines, method: attempt.label + " Vision" };
    } 
    catch (e) {
      lastError = getFriendlyError(e);
      console.warn(`⚠️ ${attempt.name} failed: ${lastError}`);
      continue;
    }
  }

  // Gemini models all failed → Groq Vision Fallback
  console.log("🌪️ All Gemini models failed. Trying Groq Vision fallback...");
  try {
    const groqMedicines = await extractFromImageGroq(optimizedBase64, 'image/jpeg');
    console.log(`✅ Groq Vision Extraction Success: ${groqMedicines.length} found.`);
    return { 
      medicines: groqMedicines, 
      method: "Groq Vision", 
      warning: `Gemini unavailable (${lastError})` 
    };
  } catch (groqError) {
    console.warn("⚠️ Groq Vision failed:", groqError.message);
    
    // Final fallback: Local Tesseract OCR
    console.log("🛡️ Using Local Tesseract OCR...");
    try {
      const rawOcrText = await extractFromImageLocal(optimizedBase64, 'image/jpeg');
      // Clean up the raw Tesseract text into a rough medicine list
      const lines = rawOcrText
        .split(/[\n,;]+/)
        .map(t => t.trim())
        .filter(t => t.length > 3 && !/^(od|bid|tid|after|before|food)$/i.test(t));
      
      return { 
        medicines: [...new Set(lines)], 
        method: "Local Tesseract OCR", 
        warning: `Local extraction active (${lastError})`
      };
    } catch (ocrError) {
      console.error("❌ All extraction methods failed");
      throw new Error(`All extraction methods failed: ${lastError}`);
    }
  }
}

module.exports = { extractFromImage };
