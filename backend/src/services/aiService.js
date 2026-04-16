const Groq = require('groq-sdk');
const { MITIGATION_LIBRARY } = require('../utils/mitigationLibrary');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

/**
 * PROBLEM 1: Step 1.6 - Generate mitigation steps using LLM or robust fallback.
 * Incorporates allergies, medications, and user profile context.
 */
async function generateMitigationSteps(profile, diseaseId, riskScore, language = 'en') {
  const age = parseInt(profile.age?.value || profile.age) || 30;
  const bmi = parseFloat(profile.bmi?.value || profile.bmi) || 22;
  const gender = profile.gender?.value || 'Other';
  const activity = profile.activityLevel?.value || 'Sedentary';
  // Handle both array formats
  const allergies = profile.allergies?.value || profile.allergies || [];
  const medications = profile.activeMedications?.value || profile.activeMedications || profile.currentMedications || [];
  const diet = profile.dietType?.value || 'Non-Veg';
  const isSmoker = profile.isSmoker?.value || false;

  // Convert allergies array to string if it's an array of objects
  const allergyNames = allergies.map(a => typeof a === 'string' ? a : (a.name || a.substance || '')).filter(a => a);
  const medNames = medications.map(m => typeof m === 'string' ? m : (m.name || m.medication || '')).filter(m => m);

  // 1. Try LLM Generation first if key exists
  if (groq) {
    try {
      const prompt = `
        As a clinical health advisor, generate 3-5 personalized recovery and mitigation steps for:
        Disease/Condition: ${diseaseId.replace('_', ' ')}
        Risk Score: ${riskScore}%
        
        USER CONTEXT:
        - Age: ${age} years
        - Gender: ${gender}
        - BMI: ${bmi}
        - Diet: ${diet}
        - Activity Level: ${activity}
        - Smoker: ${isSmoker ? 'Yes' : 'No'}
        - Known Allergies: ${allergyNames.join(', ') || 'None reported'}
        - Current Medications: ${medNames.join(', ') || 'None reported'}

        REQUIREMENTS:
        - Return all content in ${language}.
        - Avoid foods or substances that trigger reported allergies.
        - Ensure recommendations do not conflict with current medications.
        - Provide title, description, and priority (high/medium/low).
        - Use categories (dietary, lifestyle, monitoring, precaution).
        - Use Indian cultural context (ingredients/habits) where relevant.
        - Include specific precautions based on the user's profile.

        Return ONLY a JSON object with this structure:
        {
          "steps": [
            {
              "id": "step_1",
              "title": "Step title",
              "description": "Detailed description",
              "priority": "high",
              "category": "dietary",
              "isRegional": true
            }
          ]
        }
      `;

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(chatCompletion.choices[0].message.content);
      const steps = response.steps || response.mitigations || [];
      
      if (steps.length > 0) {
        console.log(`[AI Service] Generated ${steps.length} mitigation steps for ${diseaseId}`);
        return steps;
      }
    } catch (err) {
      console.warn('[AI Service] LLM generation failed, using fallback library.', err.message);
    }
  } else {
    console.log('[AI Service] GROQ_API_KEY not configured, using fallback library');
  }

  // 2. High-Quality Fallback (Rules-based from MITIGATION_LIBRARY)
  const fallbackSteps = MITIGATION_LIBRARY
    .filter(m => m.diseaseId === diseaseId)
    .filter(m => {
      // Personalization logic
      if (m.rules.dietType && !m.rules.dietType.includes(diet)) return false;
      if (m.rules.minAge && age < m.rules.minAge) return false;
      if (m.rules.gender && !m.rules.gender.includes(gender.toLowerCase())) return false;
      if (m.rules.activityLevel && !m.rules.activityLevel.includes(activity)) return false;
      
      // Allergy awareness (Naive filter)
      const contentStr = (m.title + ' ' + m.description).toLowerCase();
      const hasAllergyConflict = allergyNames.some(a => contentStr.includes(a.toLowerCase()));
      if (hasAllergyConflict) return false;

      return true;
    })
    .sort((a, b) => {
      const priorityMap = { high: 3, medium: 2, low: 1 };
      return priorityMap[b.priority] - priorityMap[a.priority];
    })
    .slice(0, 5);

  console.log(`[AI Service] Using fallback library, found ${fallbackSteps.length} steps for ${diseaseId}`);
  return fallbackSteps;
}

module.exports = {
  generateMitigationSteps
};
