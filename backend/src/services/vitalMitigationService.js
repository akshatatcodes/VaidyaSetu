/**
 * AI-Powered Vital Mitigation Generator
 * Generates personalized mitigation steps based on:
 * - Current vital readings
 * - User profile (age, gender, BMI, etc.)
 * - Medical history and conditions
 * - Current medications
 * - Allergies
 * - Lifestyle factors (diet, activity)
 */

const { Groq } = require('groq-sdk');
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

/**
 * Generate personalized mitigation steps for abnormal vitals
 * @param {Object} params
 * @param {string} params.vitalType - Type of vital (blood_pressure, blood_glucose, etc.)
 * @param {number|object} params.currentValue - Current vital value
 * @param {string} params.status - Status (high, low, critical, borderline)
 * @param {Object} params.userProfile - Complete user profile
 * @returns {Object} Mitigation steps and precautions
 */
async function generateVitalMitigations({ vitalType, currentValue, status, userProfile }) {
  // If Groq is not available, return rule-based mitigations
  if (!groq) {
    console.warn('[VitalMitigations] Groq not available, using rule-based fallback');
    return getRuleBasedMitigations(vitalType, status, userProfile);
  }

  try {
    const prompt = buildMitigationPrompt(vitalType, currentValue, status, userProfile);
    
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert medical advisor specializing in personalized health recommendations for Indian patients. Provide practical, culturally appropriate mitigation steps.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1500
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    // Validate and enhance result
    return {
      vitalType,
      status,
      currentValue,
      normalRange: result.normalRange || 'Consult your doctor',
      immediateActions: result.immediateActions || [],
      lifestyleChanges: result.lifestyleChanges || [],
      dietaryAdvice: result.dietaryAdvice || [],
      precautions: result.precautions || [],
      whenToSeeDoctor: result.whenToSeeDoctor || '',
      medications: result.medications || [],
      monitoring: result.monitoring || '',
      personalizedNote: result.personalizedNote || ''
    };
  } catch (error) {
    console.error('[VitalMitigations] AI generation failed:', error.message);
    return getRuleBasedMitigations(vitalType, status, userProfile);
  }
}

/**
 * Build prompt for AI mitigation generation
 */
function buildMitigationPrompt(vitalType, currentValue, status, profile) {
  const vitalDisplay = formatVitalValue(vitalType, currentValue);
  const userContext = extractUserContext(profile);

  return `
A patient has an abnormal vital sign reading. Generate personalized mitigation steps.

PATIENT PROFILE:
- Age: ${userContext.age} years
- Gender: ${userContext.gender}
- BMI: ${userContext.bmi}
- Diet: ${userContext.diet}
- Activity Level: ${userContext.activity}
- Medical Conditions: ${userContext.conditions}
- Current Medications: ${userContext.medications}
- Allergies: ${userContext.allergies}
- Smoker: ${userContext.smoker}

CURRENT VITAL:
- Type: ${vitalType}
- Reading: ${vitalDisplay}
- Status: ${status.toUpperCase()}

Generate a JSON response with this structure:
{
  "normalRange": "What is the normal range for this vital",
  "immediateActions": ["3-5 immediate actions to normalize this vital"],
  "lifestyleChanges": ["3-5 lifestyle changes for long-term management"],
  "dietaryAdvice": ["3-5 specific dietary recommendations considering patient's diet type and conditions"],
  "precautions": ["3-5 precautions to prevent worsening"],
  "whenToSeeDoctor": "Clear guidance on when to consult a doctor",
  "medications": ["Any medication adjustments to discuss with doctor (consider current medications and allergies)"],
  "monitoring": "How often to monitor this vital",
  "personalizedNote": "A personalized note considering the patient's full profile"
}

IMPORTANT:
1. Consider the patient's age, medical conditions, and current medications
2. Avoid recommending anything that conflicts with their allergies
3. Provide Indian dietary context (vegetarian/non-vegetarian options)
4. Be specific and actionable
5. Keep language simple (10-year-old reading level)
6. If the patient is already on medication for this condition, mention consulting their doctor before any changes
`;
}

/**
 * Extract relevant user context for the prompt
 */
function extractUserContext(profile) {
  const age = profile.age?.value || profile.age || 'Unknown';
  const gender = profile.gender?.value || profile.gender || 'Unknown';
  const bmi = profile.bmi?.value || profile.bmi || 'Unknown';
  const diet = profile.dietType?.value || profile.dietType || 'Unknown';
  const activity = profile.activityLevel?.value || profile.activityLevel || 'Unknown';
  const smoker = profile.isSmoker?.value || profile.isSmoker || false;
  
  const conditions = (profile.medicalHistory?.value || profile.medicalHistory || [])
    .map(c => typeof c === 'string' ? c : c.condition || c.name || '').filter(c => c);
  
  const medications = (profile.activeMedications?.value || profile.activeMedications || [])
    .map(m => typeof m === 'string' ? m : m.name || m.medication || '').filter(m => m);
  
  const allergies = (profile.allergies?.value || profile.allergies || [])
    .map(a => typeof a === 'string' ? a : a.name || a.substance || '').filter(a => a);

  return {
    age,
    gender,
    bmi,
    diet,
    activity,
    smoker: smoker ? 'Yes' : 'No',
    conditions: conditions.length > 0 ? conditions.join(', ') : 'None reported',
    medications: medications.length > 0 ? medications.join(', ') : 'None reported',
    allergies: allergies.length > 0 ? allergies.join(', ') : 'None reported'
  };
}

/**
 * Format vital value for display
 */
function formatVitalValue(type, value) {
  if (type === 'blood_pressure') {
    return `${value.systolic}/${value.diastolic} mmHg`;
  }
  return `${value}`;
}

/**
 * Rule-based fallback mitigations (when AI is unavailable)
 */
function getRuleBasedMitigations(vitalType, status, profile) {
  const mitigations = {
    blood_pressure: {
      high: {
        normalRange: '90-120 / 60-80 mmHg',
        immediateActions: [
          'Sit quietly and rest for 15 minutes',
          'Practice deep breathing exercises',
          'Avoid caffeine and salty foods',
          'Take prescribed BP medication if missed'
        ],
        lifestyleChanges: [
          'Reduce sodium intake to less than 2,300mg per day',
          'Exercise for 30 minutes daily (walking, cycling)',
          'Maintain healthy weight',
          'Limit alcohol consumption',
          'Manage stress through yoga or meditation'
        ],
        dietaryAdvice: [
          'Eat more fruits and vegetables',
          'Choose whole grains over refined grains',
          'Include potassium-rich foods (bananas, spinach)',
          'Avoid processed and packaged foods',
          'Use herbs and spices instead of salt'
        ],
        precautions: [
          'Monitor BP twice daily',
          'Avoid sudden position changes',
          'Don\'t skip medications',
          'Limit stress and anxiety'
        ],
        whenToSeeDoctor: 'If BP remains above 140/90 for 3 consecutive days, or if you experience severe headache, chest pain, or vision changes',
        monitoring: 'Check BP twice daily (morning and evening) at the same time',
        personalizedNote: `Based on your profile${profile.age ? ` (age ${profile.age})` : ''}, maintaining healthy blood pressure is crucial for long-term heart health.`
      },
      low: {
        normalRange: '90-120 / 60-80 mmHg',
        immediateActions: [
          'Lie down and elevate your legs',
          'Drink plenty of water',
          'Eat small, frequent meals',
          'Stand up slowly from sitting position'
        ],
        lifestyleChanges: [
          'Stay well hydrated throughout the day',
          'Avoid prolonged standing',
          'Wear compression stockings if recommended',
          'Exercise regularly to improve circulation'
        ],
        dietaryAdvice: [
          'Increase salt intake slightly (consult doctor first)',
          'Eat small, frequent meals',
          'Include vitamin B12 rich foods',
          'Stay hydrated with water and electrolytes'
        ],
        precautions: [
          'Avoid hot showers or baths',
          'Don\'t stand for long periods',
          'Rise slowly from bed or chair',
          'Avoid heavy meals'
        ],
        whenToSeeDoctor: 'If you experience frequent dizziness, fainting, or confusion',
        monitoring: 'Check BP when experiencing symptoms',
        personalizedNote: 'Low blood pressure is usually not dangerous unless causing symptoms. Stay hydrated and monitor regularly.'
      }
    },

    blood_glucose: {
      high: {
        normalRange: '70-100 mg/dL (fasting)',
        immediateActions: [
          'Take prescribed diabetes medication',
          'Drink water to help flush excess glucose',
          'Take a 15-20 minute walk',
          'Avoid eating carbohydrates until levels normalize'
        ],
        lifestyleChanges: [
          'Exercise regularly (30 minutes daily)',
          'Maintain healthy weight',
          'Monitor blood sugar regularly',
          'Get adequate sleep (7-9 hours)',
          'Manage stress levels'
        ],
        dietaryAdvice: [
          'Choose low glycemic index foods',
          'Include fiber-rich vegetables',
          'Limit refined carbohydrates and sugars',
          'Eat regular, balanced meals',
          'Include protein with each meal'
        ],
        precautions: [
          'Don\'t skip meals',
          'Monitor for symptoms of hyperglycemia',
          'Keep fast-acting insulin if prescribed',
          'Wear medical ID bracelet'
        ],
        whenToSeeDoctor: 'If blood glucose remains above 250 mg/dL, or if you experience excessive thirst, frequent urination, or blurred vision',
        monitoring: 'Check fasting and post-meal glucose as advised by your doctor',
        personalizedNote: `Managing blood sugar is critical${Array.isArray(profile.medicalHistory) && profile.medicalHistory.includes('Diabetes') ? ' especially since you have diabetes' : ''}. Follow your medication schedule strictly.`
      },
      low: {
        normalRange: '70-100 mg/dL (fasting)',
        immediateActions: [
          'Consume 15g fast-acting sugar (juice, candy, glucose tablets)',
          'Wait 15 minutes and recheck',
          'Eat a small snack if next meal is more than 1 hour away',
          'Rest and avoid physical activity'
        ],
        lifestyleChanges: [
          'Eat regular meals and snacks',
          'Don\'t skip meals',
          'Carry emergency sugar source',
          'Monitor glucose before exercise'
        ],
        dietaryAdvice: [
          'Keep juice or candy readily available',
          'Eat balanced meals with protein',
          'Include complex carbohydrates',
          'Avoid alcohol on empty stomach'
        ],
        precautions: [
          'Always carry glucose tablets',
          'Inform family/friends about hypoglycemia',
          'Wear medical ID',
          'Check glucose before driving'
        ],
        whenToSeeDoctor: 'If hypoglycemia occurs frequently or doesn\'t improve after treatment',
        monitoring: 'Check glucose before meals, bedtime, and when experiencing symptoms',
        personalizedNote: 'Low blood sugar can be dangerous. Always keep emergency sugar with you and never skip meals.'
      }
    },

    heart_rate: {
      high: {
        normalRange: '60-100 bpm',
        immediateActions: [
          'Sit down and rest',
          'Practice deep, slow breathing',
          'Drink water',
          'Avoid caffeine and stimulants'
        ],
        lifestyleChanges: [
          'Practice stress management (meditation, yoga)',
          'Exercise regularly to improve heart health',
          'Limit caffeine and alcohol',
          'Quit smoking if applicable',
          'Maintain healthy weight'
        ],
        dietaryAdvice: [
          'Reduce caffeine intake',
          'Stay hydrated',
          'Include omega-3 rich foods (fish, flaxseeds)',
          'Avoid energy drinks',
          'Eat magnesium-rich foods (nuts, leafy greens)'
        ],
        precautions: [
          'Avoid excessive caffeine',
          'Manage stress levels',
          'Get adequate sleep',
          'Don\'t overexert during exercise'
        ],
        whenToSeeDoctor: 'If heart rate remains above 100 bpm at rest, or if you experience chest pain, dizziness, or shortness of breath',
        monitoring: 'Check heart rate when resting and during symptoms',
        personalizedNote: 'A consistently high heart rate can strain your heart. Focus on stress management and regular exercise.'
      }
    },

    body_temperature: {
      high: {
        normalRange: '97.8-99.1°F',
        immediateActions: [
          'Take paracetamol if fever above 100.4°F',
          'Stay hydrated with water and electrolytes',
          'Rest in a cool environment',
          'Apply cool compress to forehead'
        ],
        lifestyleChanges: [
          'Get adequate rest',
          'Stay hydrated',
          'Wear light clothing',
          'Keep room temperature comfortable'
        ],
        dietaryAdvice: [
          'Drink plenty of fluids',
          'Eat light, easy-to-digest foods',
          'Include vitamin C rich foods',
          'Avoid heavy, spicy meals',
          'Have warm soups and broths'
        ],
        precautions: [
          'Monitor temperature every 4 hours',
          'Don\'t overdress',
          'Avoid cold baths (use lukewarm)',
          'Rest and avoid exertion'
        ],
        whenToSeeDoctor: 'If fever exceeds 103°F, lasts more than 3 days, or is accompanied by severe headache, rash, or difficulty breathing',
        monitoring: 'Check temperature every 4-6 hours',
        personalizedNote: 'Fever is your body\'s way of fighting infection. Stay hydrated and rest.'
      }
    },

    oxygen_saturation: {
      low: {
        normalRange: '95-100%',
        immediateActions: [
          'Sit upright and stay calm',
          'Practice pursed-lip breathing',
          'Use prescribed oxygen if available',
          'Seek medical attention if below 90%'
        ],
        lifestyleChanges: [
          'Practice breathing exercises daily',
          'Stay physically active',
          'Avoid smoking and pollutants',
          'Maintain good posture'
        ],
        dietaryAdvice: [
          'Eat iron-rich foods (spinach, lentils)',
          'Include vitamin C for better absorption',
          'Stay hydrated',
          'Eat antioxidant-rich foods'
        ],
        precautions: [
          'Avoid high altitudes',
          'Don\'t smoke',
          'Avoid secondhand smoke',
          'Monitor SpO2 regularly'
        ],
        whenToSeeDoctor: 'If SpO2 drops below 92%, or if you experience severe shortness of breath, chest pain, or confusion',
        monitoring: 'Check SpO2 2-3 times daily or when experiencing symptoms',
        personalizedNote: 'Low oxygen levels need immediate attention. Use breathing exercises and seek medical help if levels remain low.'
      }
    },

    sleep_duration: {
      low: {
        normalRange: '7-9 hours',
        immediateActions: [
          'Establish a consistent sleep schedule',
          'Create a dark, cool sleep environment',
          'Avoid screens 1 hour before bed',
          'Practice relaxation techniques'
        ],
        lifestyleChanges: [
          'Maintain regular sleep-wake times',
          'Exercise regularly (but not before bed)',
          'Limit daytime naps to 20-30 minutes',
          'Create a bedtime routine',
          'Manage stress through meditation'
        ],
        dietaryAdvice: [
          'Avoid caffeine after 2 PM',
          'Don\'t eat heavy meals before bed',
          'Include magnesium-rich foods (almonds, bananas)',
          'Try warm milk or herbal tea before bed',
          'Limit alcohol consumption'
        ],
        precautions: [
          'Avoid long naps',
          'Don\'t use bed for work/study',
          'Limit screen time at night',
          'Avoid stimulating activities before bed'
        ],
        whenToSeeDoctor: 'If insomnia persists for more than 2 weeks, or if sleep issues affect daily functioning',
        monitoring: 'Track sleep duration and quality daily',
        personalizedNote: 'Quality sleep is essential for overall health. Focus on sleep hygiene and consistency.'
      }
    },

    steps: {
      low: {
        normalRange: '7,000-10,000 steps/day',
        immediateActions: [
          'Take a 10-minute walk right now',
          'Set hourly movement reminders',
          'Park farther from destinations',
          'Take stairs instead of elevator'
        ],
        lifestyleChanges: [
          'Aim for 30 minutes of walking daily',
          'Break activity into 10-minute sessions',
          'Walk during phone calls',
          'Do household chores actively',
          'Join a walking group or class'
        ],
        dietaryAdvice: [
          'Stay hydrated during walks',
          'Eat balanced meals for energy',
          'Include complex carbohydrates',
          'Don\'t exercise on empty stomach'
        ],
        precautions: [
          'Wear comfortable shoes',
          'Start gradually if sedentary',
          'Listen to your body',
          'Avoid overexertion initially'
        ],
        whenToSeeDoctor: 'Before starting exercise if you have heart conditions, joint problems, or have been sedentary',
        monitoring: 'Track daily steps and aim to increase by 10% each week',
        personalizedNote: 'Even small increases in activity make a big difference. Start where you are and build gradually.'
      }
    }
  };

  return mitigations[vitalType]?.[status] || {
    normalRange: 'Consult your doctor for normal ranges',
    immediateActions: ['Monitor the vital sign', 'Consult your doctor if concerned'],
    lifestyleChanges: ['Maintain healthy lifestyle', 'Follow medical advice'],
    dietaryAdvice: ['Eat balanced diet', 'Stay hydrated'],
    precautions: ['Monitor regularly', 'Don\'t ignore symptoms'],
    whenToSeeDoctor: 'If symptoms persist or worsen',
    monitoring: 'Monitor as advised by your doctor',
    personalizedNote: 'Consult your healthcare provider for personalized advice.'
  };
}

module.exports = {
  generateVitalMitigations
};
