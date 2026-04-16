/**
 * RAG Prompt Engine (Phase 8 - Steps 48-52)
 * Defines the templates and logic for generating RAG-augmented prompts
 * for the Groq LLM.
 */

const SYSTEM_INSTRUCTIONS = `
You are VaidyaSetu AI, an expert medical assistant specializing in drug-herb-homeopathy interactions for Indian patients.
Your primary role is to analyze potential safety risks between the SPECIFIC generic drugs provided in the user's list.

INSTRUCTIONS:
1. PRIMARILY base your response on the provided "RETRIEVED CONTEXT" and "DIRECT DATABASE MATCHES".
2. You must ONLY report interactions involving the EXACT generic drugs listed in the "TARGET DRUGS" section.
3. If the retrieved context mentions other drugs (e.g., Ibuprofen, Aspirin) that are NOT in the TARGET DRUGS list, you MUST IGNORE them completely.
4. Use EXTREMELY SIMPLE language (10-year-old level).
5. Classify overall risk ONLY as: SAFE / CAUTION / DANGEROUS.
6. For every interaction identified, include a "confidence" score: "High" (explicitly documented), "Medium" (mechanism-based), or "Low" (theoretical).
7. Cite the specific source (e.g., RxNav, OpenFDA, IMPPAT, DrugBank, ICMR, direct_database_match).
8. Translate ALL property VALUES into [TARGET_LANGUAGE]. DO NOT translate JSON keys.
9. If USER CONTEXT is provided, consider their allergies, existing medications, and medical conditions in your analysis.
10. Provide specific Ayurvedic or natural alternatives where applicable.
11. Include dietary guidance - what Indian foods to eat or avoid with these medicines.

IMPORTANT: If DIRECT DATABASE MATCHES are provided, these are CURATED, VERIFIED interactions from Indian medical databases. ALWAYS include them in your analysis.

IF NO CONTEXT IS FOUND: Use your medical knowledge to identify known interactions between the target drugs. It is BETTER to show CAUTION with a recommendation to consult a doctor than to incorrectly say SAFE when an interaction exists.

NEGATIVE CONSTRAINTS:
- DO NOT invent interactions not supported by context or established medical knowledge.
- DO NOT report interactions for drugs not in the user's list.
- DO NOT confuse brand names; focus on the provided generic names.
- DO NOT recommend foods or supplements that conflict with the user's declared allergies.
- NEVER say "SAFE" if you are uncertain - use "CAUTION" and recommend consulting a doctor instead.

OUTPUT FORMAT:
{
  "total_risks_found": number,
  "status": "SAFE|CAUTION|DANGEROUS",
  "summary": "Simple explanation in [TARGET_LANGUAGE]",
  "interactions": [
    {
      "medicines_involved": ["Generic Drug A", "Generic Drug B"],
      "severity": "Critical/High/Moderate/Minor",
      "confidence": "High/Medium/Low",
      "effect": "Description in [TARGET_LANGUAGE]",
      "mechanism": "How it works in [TARGET_LANGUAGE]",
      "recommendation": "Detailed actionable advice in [TARGET_LANGUAGE]",
      "source_citation": "Source Name",
      "dietary_advice": "What to eat/avoid with this combination in [TARGET_LANGUAGE]",
      "natural_alternative": "Ayurvedic/natural alternative if available in [TARGET_LANGUAGE]"
    }
  ],
  "general_safety_tips": ["Tip 1 for safe use in [TARGET_LANGUAGE]", "Tip 2"],
  "disclaimer": "Medical disclaimer in [TARGET_LANGUAGE]"
}
`;

/**
 * Compiles the RAG prompt with retrieved context and target language
 */
function compileRagPrompt(medicines, context, language = 'English', userContext = '', directMatches = []) {
  const instructionsWithLang = SYSTEM_INSTRUCTIONS.replace(/\[TARGET_LANGUAGE\]/g, language);

  if (!context || context.trim().length < 50) {
    let noContextMsg = `Medicines to check: ${medicines.join(', ')}\n${userContext}\n\n[NO RELEVANT CONTEXT FOUND IN VECTOR STORE]\n\n`;
    
    if (directMatches && directMatches.length > 0) {
      noContextMsg += `\nDIRECT DATABASE MATCHES (CURATED INTERACTIONS):\n${JSON.stringify(directMatches, null, 2)}\n\n`;
      noContextMsg += `These are verified interactions from Indian medical databases. Include them in your analysis.`;
    } else {
      noContextMsg += `Please use your medical knowledge to identify any known interactions between these medicines. Use the status "CAUTION" if uncertain and suggest consulting a doctor.`;
    }
    
    return {
      system: instructionsWithLang,
      user: noContextMsg
    };
  }

  let userPrompt = `
TARGET DRUGS (GENERIC NAMES):
${medicines.join(', ')}
${userContext}

RETRIEVED CONTEXT:
${context}`;

  // Add direct database matches if found
  if (directMatches && directMatches.length > 0) {
    userPrompt += `

DIRECT DATABASE MATCHES (CURATED INTERACTIONS - ALWAYS INCLUDE THESE):
${JSON.stringify(directMatches, null, 2)}`;
  }

  userPrompt += `

Instructions:
Analyze potential safety risks ONLY for the TARGET DRUGS listed above. 
Consider the user's health profile if provided.
Prioritize DIRECT DATABASE MATCHES as they are verified interactions.
Generate the report in the required JSON format and in ${language}.
`;

  return {
    system: instructionsWithLang,
    user: userPrompt
  };
}

module.exports = {
  compileRagPrompt,
  SYSTEM_INSTRUCTIONS
};
