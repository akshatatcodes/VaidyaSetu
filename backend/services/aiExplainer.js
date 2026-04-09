const Groq = require("groq-sdk");

// Create Groq SDK client using the API Key loaded dynamically via dotenv in server.js
let groqClient = null;

try {
  if (process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  } else {
    console.warn("GROQ_API_KEY is missing! Using Mock AI fallback.");
  }
} catch (e) {
  console.error("Groq initialization failed:", e);
}

/**
 * Pipes the strict static JSON flags into Llama 3 to get a rich, biological explanation.
 * @param {Object} staticReport The generated JSON static report object.
 */
async function generateAIInsight(staticReport) {
  // If there are absolutely no warnings, AI isn't strictly necessary.
  if (staticReport.interactionWarnings.length === 0 && staticReport.diseaseWarnings.length === 0) {
    return "Your profile looks excellent! No known severe medical conflicts were found in our database. Continue following standard medical advice.";
  }

  if (!groqClient) {
    return "API Key for generative insights missing. Please consult the static warnings strictly.";
  }

  // Construct context prompt securely referencing the static output
  const prompt = `
  You are VaidyaSetu, a highly intelligent hybrid AI health advisor. 
  Your job is NOT to diagnose new conditions. Your job is exclusively to explain the biological WHY behind the following hardcoded database interactions flag. 
  
  Static Engine Flags detected:
  - Interaction Warnings: ${JSON.stringify(staticReport.interactionWarnings)}
  - Disease Advice Flags: ${JSON.stringify(staticReport.diseaseWarnings)}

  Explain the mechanism of these specific conflicts in simple, patient-friendly terms (max 3 paragraphs). 
  Be empathetic but extremely clinically precise. Do not invent new interactions.
  `;

  try {
    const chatCompletion = await groqClient.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.3, // Keep hallucinations at near-zero
      max_tokens: 500
    });

    return chatCompletion.choices[0]?.message?.content || "No AI insight generated.";
  } catch (error) {
    console.error("Llama-3 API Error:", error.message);
    return "AI Insight module is temporarily down. Please refer strictly to the static warnings.";
  }
}

module.exports = { generateAIInsight };
