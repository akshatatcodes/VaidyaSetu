const Groq = require("groq-sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Clients
let groqClient = null;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

try {
  if (process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
} catch (e) {
  console.error("Groq initialization failed:", e);
}

/**
 * Pipes the static flags + live medical data into Llama 3 for a rich, multilingual analysis.
 * Fallback to Gemini 1.5 Flash if Groq is rate-limited.
 */
async function generateAIInsight(staticReport, liveData = [], language = 'English') {
  const prompt = `
  You are VaidyaSetu, a highly experienced Indian Pharmacist and Hybrid AI Safety Expert.
  TASK: Analyze the patient's medical profile based on these inputs.
  
  SYSTEM DATA (Static Engine Flags):
  - Interaction Warnings: ${JSON.stringify(staticReport.interactionWarnings)}
  - AYUSH/Disease Advice: ${JSON.stringify(staticReport.diseaseWarnings)}

  LIVE CLINICAL DATA (RxNav/openFDA):
  ${JSON.stringify(liveData)}

  INSTRUCTIONS:
  1. EXPLAIN the biological mechanism and the "WHY" behind any conflicts in ${language}.
  2. SUGGESTED ALTERNATIVES: For high-risk medications, identify 2-3 safer choices common in India.
  3. LANGUAGE: Use simple, patient-friendly terms (10-year-old level).
  4. FORMAT: Return the output strictly as a JSON object:
  {
    "explanation": "...",
    "alternatives": [{ "name": "...", "type": "...", "reason": "..." }]
  }
  `;

  // Attempt 1: Groq (Llama-3)
  if (groqClient) {
    try {
      const chatCompletion = await groqClient.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        response_format: { type: "json_object" }
      });
      return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
    } catch (error) {
      console.warn("Groq Insight Rate Limited. Falling back to Gemini...");
    }
  }

  // Attempt 2: Gemini 2.0 Flash Fallback
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt + "\nIMPORTANT: Return ONLY valid JSON.");
    const response = await result.response;
    let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Critical: All Insight Engines failed.", error.message);
    return {
      explanation: "AI Safety module is currently busy. Please strictly follow the static database warnings below.",
      alternatives: []
    };
  }
}

/**
 * Extracts medicine names with auto-fallback.
 */
async function extractMedicinesFromOCR(rawText) {
  const { refineTextAI } = require('./gemini');
  return await refineTextAI(rawText);
}

module.exports = { generateAIInsight, extractMedicinesFromOCR };
