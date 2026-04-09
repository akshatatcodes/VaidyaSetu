const { GoogleGenAI } = require('@google/genai');
const { extractFromImageGroq } = require('./groqVision');
const { extractFromImageLocal } = require('./ocr');
const { prepareImageForAI } = require('./image');

const isMock = !process.env.GEMINI_API_KEY;
const ai = isMock ? null : new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Universal normalization helper to extract a clean string array.
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

/**
 * PROMPT UPGRADE: Medical Deciphering
 * Specifically tuned for Indian Doctor Handwriting and shorthands.
 */
const MEDICAL_DECIPHER_PROMPT = `
System: You are an expert Indian Medical Pharmacist and Handwriting Decipherer.
Task: Identify all valid medicines from this handwritten prescription.

DECODING RULES:
1. Doctors often use shorthand: "Ts." or "Tabs." means Tablets, "Cap." means Capsules, "Sy." means Syrup.
2. Use medical logic to decipher sloppy handwriting (e.g., "Amdoc.." is likely Amdocal, "Eltrox.." is Eltroxin).
3. Ignore unrelated text like clinic names, dates, or blood pressure numbers.
4. ONLY return a JSON array of clean medicine names. No categories, no dosages.

Example Output: ["Amdocal Plus", "Eltroxin", "Panical"]
`;

/**
 * Refinement Bridge - Consolidation with Auto-Fallback
 */
async function refineTextAI(rawText) {
  if (!rawText) return [];
  
  const prompt = `Refine this messy medical OCR text into a clean JSON array of medicine names.
  Text: "${rawText}"
  Return ONLY the array. e.g. ["Med1", "Med2"]`;

  // Attempt 1: Groq (Fast)
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
    });
    let content = completion.choices[0].message.content || "[]";
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return normalizeMedicines(JSON.parse(content));
  } catch (e) {
    console.warn("Groq refinement failed (Rate limit?). Falling back to Gemini...");
    
    // Attempt 2: Gemini Fallback (High capacity)
    try {
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      return normalizeMedicines(JSON.parse(text));
    } catch (geminiError) {
      console.error("Critical: All refinement failed.");
      return [];
    }
  }
}

/**
 * Triple-Fallback Extraction Engine
 */
async function extractFromImage(fileBuffer, mimeType) {
  if (isMock) throw new Error("GEMINI_API_KEY missing");

  const base64Image = fileBuffer.toString('base64');
  const optimizedBase64 = await prepareImageForAI(base64Image);

  // Stage 1: Gemini 2.0 Flash (Intuitive Vision)
  console.log("💎 Attempting Gemini 2.0 Flash (Intuitive Mode)...");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: optimizedBase64, mimeType: 'image/jpeg' } },
            { text: MEDICAL_DECIPHER_PROMPT }
          ]
        }
      ],
      config: { 
        responseMimeType: "application/json",
        temperature: 0.2 // Slight temperature allows for handwriting "guessing"
      }
    });

    const rawResult = JSON.parse(response.text);
    return normalizeMedicines(rawResult);
  } catch (e) {
    console.warn("Gemini Vision failed. Trying Groq...");
  }

  // Stage 2: Groq Vision (Fallback)
  try {
    return await extractFromImageGroq(optimizedBase64, 'image/jpeg');
  } catch (groqError) {
    console.warn("Groq Vision failed. Trying Local OCR...");
  }

  // Stage 3: Local OCR + Resilient Refinement
  try {
    const ocrText = await extractFromImageLocal(optimizedBase64, 'image/jpeg');
    return await refineTextAI(ocrText);
  } catch (err) {
    throw new Error("Medicine extraction failed across all engines.");
  }
}

module.exports = { extractFromImage, refineTextAI };
