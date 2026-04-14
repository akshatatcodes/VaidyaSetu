const { Groq } = require('groq-sdk');
const { getDrugComposition } = require('../utils/rxnav');
const { getDrugWarnings } = require('../utils/openfda');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

/**
 * Generate detailed medicine breakdown with composition, dosage, warnings
 * @param {string[]} medicines - Array of medicine names
 * @param {string} language - Language for the response
 * @returns {Object} Detailed medicine information
 */
async function generateMedicineBreakdown(medicines, language = 'English') {
  try {
    // Step 1: Fetch real data from RxNav and OpenFDA for each medicine
    const medicineDataPromises = medicines.map(async (med) => {
      const [compositionData, warningsData] = await Promise.all([
        getDrugComposition(med),
        getDrugWarnings(med)
      ]);
      
      return {
        name: med,
        compositionData,
        warningsData
      };
    });
    
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
    
    // If Groq is not available, return fallback with real API data
    if (!groq) {
      console.warn('[MedicineInfo] Groq API key not configured, returning fallback with real API data');
      return generateFallbackBreakdown(medicines, medicineDataArray);
    }
    
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

    const responseContent = response.choices[0]?.message?.content;

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
  
  // If we have real API data, use it
  if (medicineDataArray.length > 0) {
    return {
      medicines: medicineDataArray.map(data => ({
        name: data.name,
        correctedName: data.compositionData.normalizedName || null,
        composition: data.compositionData.composition || 'Information not available',
        dosage: takeAsDirected,
        warnings: [
          data.warningsData.warnings || noWarnings,
          'Do not self-medicate'
        ],
        sideEffects: ['Consult your physician'],
        category: 'Unknown',
        usedFor: 'As prescribed by physician'
      })),
      safetyAnalysis: {
        overallRisk: 'CAUTION',
        summary: 'Please consult a healthcare provider for detailed analysis',
        interactions: [],
        alternatives: [{ name: 'Please consult a doctor', type: 'Notice', reason: 'AI service connection error' }]
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
      alternatives: [{ name: 'Please consult a doctor', type: 'Notice', reason: 'AI service connection error' }]
    },
    disclaimer: 'This tool is for informational purposes only. Do not use this as a substitute for professional medical advice. Always consult a doctor or pharmacist.'
  };
}

module.exports = { generateMedicineBreakdown };
