const { Groq } = require('groq-sdk');
const { GoogleGenAI } = require('@google/genai');
const { getDrugComposition } = require('../utils/rxnav');
const { getDrugWarnings } = require('../utils/openfda');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

function isUsefulComposition(value) {
  const v = String(value || '').toLowerCase();
  if (!v) return false;
  return !(
    v.includes('information not available') ||
    v.includes('not found') ||
    v.includes('error') ||
    v.includes('not specified')
  );
}

function isUsefulWarning(value) {
  const v = String(value || '').toLowerCase();
  if (!v) return false;
  return !(
    v.includes('information not available') ||
    v.includes('not found') ||
    v.includes('error') ||
    v.includes('no warnings found')
  );
}

function buildMedicineCandidates(rawName) {
  const src = String(rawName || '').trim();
  if (!src) return [];

  // Remove common dose/form fragments.
  const cleaned = src
    .replace(/[(),]/g, ' ')
    .replace(/\b\d+(\.\d+)?\s?(mg|mcg|g|ml|iu|tablet|tab|capsule|cap|syrup|inj|injection)\b/gi, ' ')
    .replace(/\b(od|bd|tid|qid|hs|prn)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = cleaned.split(' ').filter(Boolean);
  const alphaTokens = tokens.filter((t) => /[a-z]/i.test(t) && !/\d/.test(t));
  const longest = [...alphaTokens].sort((a, b) => b.length - a.length)[0];
  const last = alphaTokens[alphaTokens.length - 1];

  // Prefer generic-looking suffixes if present.
  const genericLike = alphaTokens.find((t) =>
    /(mycin|cillin|azole|pril|sartan|olol|formin|xetine|prazole|dine|pine|mide|ide)$/i.test(t)
  );

  const out = [];
  [src, cleaned, genericLike, longest, last].forEach((c) => {
    const candidate = String(c || '').trim();
    if (!candidate) return;
    if (!out.includes(candidate)) out.push(candidate);
  });
  return out;
}

async function fetchBestMedicineData(rawMedName) {
  const candidates = buildMedicineCandidates(rawMedName);
  let best = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    const warningsData = await getDrugWarnings(candidate);
    let compositionData = await getDrugComposition(candidate);

    if (
      (!compositionData?.rxcui || !isUsefulComposition(compositionData?.composition)) &&
      warningsData?.genericName &&
      typeof warningsData.genericName === 'string'
    ) {
      const retryComp = await getDrugComposition(warningsData.genericName);
      if (retryComp) compositionData = retryComp;
    }

    let score = 0;
    if (compositionData?.rxcui) score += 3;
    if (isUsefulComposition(compositionData?.composition)) score += 2;
    if (warningsData?.genericName) score += 1;
    if (isUsefulWarning(warningsData?.warnings)) score += 1;

    const candidateResult = {
      name: rawMedName,
      queriedName: candidate,
      compositionData: { ...(compositionData || {}), name: rawMedName },
      warningsData: warningsData || {}
    };

    if (score > bestScore) {
      bestScore = score;
      best = candidateResult;
    }
    if (score >= 5) break; // strong enough match
  }

  return best || {
    name: rawMedName,
    queriedName: rawMedName,
    compositionData: { name: rawMedName, composition: 'Information not available', rxcui: null },
    warningsData: { name: rawMedName, warnings: 'Information not available' }
  };
}

/**
 * Generate detailed medicine breakdown with composition, dosage, warnings
 * @param {string[]} medicines - Array of medicine names
 * @param {string} language - Language for the response
 * @returns {Object} Detailed medicine information
 */
async function generateMedicineBreakdown(medicines, language = 'English') {
  try {
    // Step 1: Fetch real data from RxNav and OpenFDA for each medicine
    const medicineDataPromises = medicines.map((med) => fetchBestMedicineData(med));
    
    const medicineDataArray = await Promise.all(medicineDataPromises);
    
    // Step 2: Clean drug data (remove "Not found" or "Error" messages)
    const cleanDrugData = medicineDataArray.map(data => {
      const cleanD = {
        name: data.name,
        normalizedName: data.compositionData.normalizedName || data.name
      };
      
      // Only include composition if it has real data
      const comp = data.compositionData.composition;
      if (comp && !comp.includes('Not found') && !comp.includes('Error') && !comp.includes('Information not available')) {
        cleanD.composition = comp;
      }
      
      // Only include warnings if it has real data
      const warn = data.warningsData.warnings;
      if (warn && !warn.includes('Not found') && !warn.includes('Error') && !warn.includes('Information not available')) {
        cleanD.warnings = warn;
      }
      
      return cleanD;
    });
    
    // Step 3: Use AI to enhance and format the data with additional insights
    const medicineNames = medicines.join(', ');
    
    const prompt = `You are a highly experienced Indian Pharmacist and Safety Expert.
Please analyze the following medicines: ${medicineNames}.

CRITICAL INSTRUCTIONS:
1. Translate ALL text VALUES into ${language}. DO NOT translate the JSON property keys!
2. Use EXTREMELY SIMPLE language (10-year-old level).
3. For each medicine, provide: simple composition, dosage, and allergy warnings.
4. Check for drug-drug interactions between ALL medicines in the list.
5. SUGGESTED ALTERNATIVES: Identify 2-3 TRULY BEST choices for the patient.
   - Focus on "Generic Equivalents" (same salt, lower price) or "Safer Alternatives" (different salt, fewer side effects).
   - Provide a clear reason WHY it is better.
   - Ensure these are common in India.
6. Use your own knowledge. DO NOT say "I don't know".
7. If medicine name is misspelled, GUESS the most likely Indian drug and analyze it. Mention you corrected the name.

(Optional context from medical databases):
${JSON.stringify(cleanDrugData, null, 2)}

Return output STRICTLY as this JSON structure:
{
  "medicines": [
    {
      "name": "Medicine name as provided",
      "correctedName": "Correct medical name if misspelled, otherwise same as name",
      "composition": "Active ingredient(s) - use database data if available, otherwise use your knowledge",
      "dosage": "Standard dosage instructions",
      "warnings": ["Warning 1", "Warning 2", "Warning 3"],
      "sideEffects": ["Side effect 1", "Side effect 2"],
      "category": "Drug category (e.g., Antidiabetic, Thyroid hormone, Antidepressant)",
      "usedFor": "What condition it treats"
    }
  ],
  "safetyAnalysis": {
    "overallRisk": "LOW | MEDIUM | HIGH | CAUTION",
    "summary": "Brief summary of safety considerations in ${language}",
    "interactions": [
      {
        "medicine1": "Drug name",
        "medicine2": "Drug name",
        "severity": "MILD | MODERATE | SEVERE",
        "description": "Description of interaction"
      }
    ],
    "alternatives": [
      {
        "originalMedicine": "Original drug name",
        "alternative": "Alternative drug name",
        "reason": "Why this alternative (cheaper, safer, fewer side effects)",
        "type": "Generic Equivalent | Safer Alternative | Cheaper Option"
      }
    ]
  },
  "disclaimer": "Standard medical disclaimer"
}`;

    let responseContent = null;

    if (groq) {
      try {
        const response = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: 'You are a medical pharmacist assistant. Return ONLY valid JSON, no markdown formatting.' },
            { role: 'user', content: prompt }
          ],
          model: 'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 3000
        });
        responseContent = response.choices[0]?.message?.content;
      } catch (groqError) {
        console.warn('[MedicineInfo] Groq failed, trying Gemini:', groqError.message);
      }
    }

    // Gemini fallback when Groq is unavailable or failed.
    if (!responseContent && gemini) {
      try {
        const response = await gemini.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json'
          }
        });
        responseContent = response?.text || null;
      } catch (geminiError) {
        console.warn('[MedicineInfo] Gemini fallback failed:', geminiError.message);
      }
    }

    if (!responseContent) {
      console.warn('[MedicineInfo] AI unavailable (Groq/Gemini), returning data-backed fallback');
      return generateFallbackBreakdown(medicines, medicineDataArray);
    }

    // Try to parse JSON from the response
    let parsed;
    try {
      // Remove any markdown code blocks if present
      const cleaned = responseContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('[MedicineInfo] JSON parse error:', parseError.message);
      console.error('[MedicineInfo] Raw response:', responseContent?.substring(0, 500));
      
      // Return fallback with real API data
      return generateFallbackBreakdown(medicines, medicineDataArray);
    }

    return parsed;
  } catch (error) {
    console.error('[MedicineInfo] Generation error:', error.message);
    // Fallback with real API data
    return generateFallbackBreakdown(medicines, []);
  }
}

/**
 * Generate fallback breakdown if AI fails
 * @param {string[]} medicines - Array of medicine names
 * @param {Array} medicineDataArray - Array of real API data
 */
function generateFallbackBreakdown(medicines, medicineDataArray = []) {
  const takeAsDirected = 'Take as directed by physician';
  const noWarnings = 'No major warnings found.';
  const fallbackAlternatives = (medList) =>
    (medList || []).slice(0, 3).map((m) => ({
      originalMedicine: m,
      alternative: `Generic equivalent for ${m}`,
      reason: 'AI service is unavailable right now. A pharmacist can suggest the best generic equivalent based on the exact salt/strength.',
      type: 'Generic Equivalent'
    }));
  
  // If we have real API data, use it
  if (medicineDataArray.length > 0) {
    return {
      medicines: medicineDataArray.map(data => ({
        name: data.name,
        correctedName: data.compositionData.normalizedName || data.warningsData?.genericName || null,
        // If RxNav is unreachable, use OpenFDA generic name as best-effort composition label.
        composition: (data.compositionData?.composition &&
          !String(data.compositionData.composition).includes('Not found') &&
          !String(data.compositionData.composition).includes('Error') &&
          !String(data.compositionData.composition).toLowerCase().includes('not specified'))
          ? data.compositionData.composition
          : (data.warningsData?.genericName || 'Information not available'),
        dosage: takeAsDirected,
        warnings: [
          (data.warningsData?.warnings && !String(data.warningsData.warnings).includes('No warnings found'))
            ? data.warningsData.warnings
            : (data.warningsData?.interactions || noWarnings),
          'Do not self-medicate'
        ],
        sideEffects: [
          (data.warningsData?.sideEffects && !String(data.warningsData.sideEffects).includes('No side effects'))
            ? data.warningsData.sideEffects
            : 'Consult your physician'
        ],
        category: 'Unknown',
        usedFor: 'As prescribed by physician'
      })),
      safetyAnalysis: {
        overallRisk: 'CAUTION',
        summary: 'Please consult a healthcare provider for detailed analysis',
        interactions: [],
        alternatives: fallbackAlternatives(medicines)
      },
      disclaimer: 'This tool is for informational purposes only. Do not use this as a substitute for professional medical advice. Always consult a doctor or pharmacist.'
    };
  }
  
  // No API data available, use generic fallback
  return {
    medicines: medicines.map(med => ({
      name: med,
      correctedName: null,
      composition: 'Information not available',
      dosage: takeAsDirected,
      warnings: ['Always consult a doctor before use', 'Do not self-medicate'],
      sideEffects: ['Consult your physician'],
      category: 'Unknown',
      usedFor: 'As prescribed by physician'
    })),
    safetyAnalysis: {
      overallRisk: 'CAUTION',
      summary: 'Please consult a healthcare provider for detailed analysis',
      interactions: [],
      alternatives: fallbackAlternatives(medicines)
    },
    disclaimer: 'This tool is for informational purposes only. Do not use this as a substitute for professional medical advice. Always consult a doctor or pharmacist.'
  };
}

module.exports = { generateMedicineBreakdown };
