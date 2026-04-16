const express = require('express');
const router = express.Router();
const LabResult = require('../models/LabResult');
const UserProfile = require('../models/UserProfile');
const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

/**
 * POST /api/lab-results/analyze
 * Analyze lab results and generate personalized recommendations
 */
router.post('/analyze', async (req, res) => {
  try {
    const { clerkId, labIds } = req.body;
    const outputLanguage = req.resolvedLanguage || 'en';
    
    if (!clerkId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'User ID required' 
      });
    }

    console.log('[Lab Analysis] Starting analysis for user:', clerkId);

    // Fetch user profile for personalization
    const profile = await UserProfile.findOne({ clerkId });
    
    // Fetch selected lab results or all recent ones
    let labResults;
    if (labIds && labIds.length > 0) {
      labResults = await LabResult.find({ 
        clerkId, 
        _id: { $in: labIds } 
      }).sort({ sampleDate: -1 });
    } else {
      labResults = await LabResult.find({ clerkId })
        .sort({ sampleDate: -1 })
        .limit(20);
    }

    if (labResults.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No lab results found'
      });
    }

    console.log(`[Lab Analysis] Analyzing ${labResults.length} lab results`);

    // Build lab data summary for AI
    const labSummary = labResults.map(lab => {
      const isInRange = checkIfInRange(lab.resultValue, lab.referenceRange);
      return {
        testName: lab.testName,
        resultValue: lab.resultValue,
        unit: lab.unit,
        referenceRange: lab.referenceRange,
        sampleDate: lab.sampleDate,
        isInRange: isInRange,
        status: isInRange === true ? 'normal' : isInRange === false ? 'abnormal' : 'unknown'
      };
    });

    // Group abnormal results
    const abnormalResults = labSummary.filter(lab => lab.status === 'abnormal');
    const normalResults = labSummary.filter(lab => lab.status === 'normal');

    console.log(`[Lab Analysis] Found ${abnormalResults.length} abnormal, ${normalResults.length} normal results`);

    // Build user context
    const userContext = profile ? {
      age: profile.age?.value || 'unknown',
      gender: profile.gender?.value || 'unknown',
      conditions: profile.medicalHistory?.value || [],
      medications: profile.medications?.value || [],
      allergies: profile.allergies?.value || [],
      diet: profile.diet?.value || 'unknown',
      lifestyle: profile.lifestyle?.value || 'unknown'
    } : {};

    // Generate AI analysis if available
    let aiAnalysis = null;
    if (groq && abnormalResults.length > 0) {
      try {
        aiAnalysis = await generateAIAnalysis(labSummary, abnormalResults, userContext, outputLanguage);
        console.log('[Lab Analysis] AI analysis generated successfully');
      } catch (aiError) {
        console.warn('[Lab Analysis] AI analysis failed:', aiError.message);
        // Fallback to rule-based analysis
        aiAnalysis = generateRuleBasedAnalysis(abnormalResults, userContext);
      }
    } else if (abnormalResults.length > 0) {
      // No Groq, use rule-based
      aiAnalysis = generateRuleBasedAnalysis(abnormalResults, userContext);
    }

    res.json({
      status: 'success',
      data: {
        totalTests: labResults.length,
        abnormalCount: abnormalResults.length,
        normalCount: normalResults.length,
        labResults: labSummary,
        analysis: aiAnalysis,
        userContext: userContext
      }
    });

  } catch (error) {
    console.error('[Lab Analysis] Error:', error.message);
    console.error('[Lab Analysis] Stack:', error.stack);
    
    res.status(500).json({
      status: 'error',
      message: 'Lab analysis failed: ' + error.message
    });
  }
});

/**
 * Generate AI-powered analysis using Groq
 */
async function generateAIAnalysis(allLabs, abnormalLabs, userContext, language = 'en') {
  const prompt = `You are an expert medical laboratory analyst providing personalized health insights.
IMPORTANT LANGUAGE RULE: Return all values in ${language}.

USER PROFILE:
- Age: ${userContext.age}
- Gender: ${userContext.gender}
- Medical Conditions: ${userContext.conditions.join(', ') || 'None reported'}
- Current Medications: ${userContext.medications.join(', ') || 'None reported'}
- Allergies: ${userContext.allergies.join(', ') || 'None reported'}
- Diet: ${userContext.diet}
- Lifestyle: ${userContext.lifestyle}

LAB RESULTS SUMMARY:
Total Tests: ${allLabs.length}
Abnormal Results: ${abnormalLabs.length}
Normal Results: ${allLabs.length - abnormalLabs.length}

ABNORMAL TESTS (Require Attention):
${abnormalLabs.map(lab => `- ${lab.testName}: ${lab.resultValue} ${lab.unit} (Reference: ${lab.referenceRange})`).join('\n')}

ALL TESTS:
${allLabs.map(lab => `- ${lab.testName}: ${lab.resultValue} ${lab.unit} [${lab.status.toUpperCase()}]`).join('\n')}

Provide a comprehensive JSON analysis with this exact structure:
{
  "summary": "Brief 2-3 sentence overall health summary based on all lab results",
  "criticalFindings": [
    {
      "testName": "Test name",
      "value": "Current value with unit",
      "severity": "high|moderate|low",
      "explanation": "Simple explanation of what this means",
      "immediateAction": "What to do right now",
      "precautions": ["3 specific precautions to take"]
    }
  ],
  "dietaryRecommendations": [
    "5 specific dietary recommendations considering user's diet type and conditions"
  ],
  "lifestyleChanges": [
    "5 lifestyle modifications to improve abnormal results"
  ],
  "monitoringAdvice": "How often to retest and what to monitor",
  "whenToSeeDoctor": "Clear guidance on when to consult a doctor urgently",
  "positiveNotes": [
    "2-3 encouraging notes about normal/healthy results"
  ],
  "potentialInteractions": [
    "Any potential interactions between abnormal results and existing conditions/medications"
  ],
  "nextSteps": [
    "5 actionable next steps prioritized by importance"
  ]
}

IMPORTANT GUIDELINES:
1. Consider the user's medical conditions and medications when giving advice
2. Avoid recommendations that conflict with allergies
3. Provide culturally appropriate advice (Indian context)
4. Use simple language (10-year-old reading level)
5. Be specific and actionable, not generic
6. Prioritize critical findings first
7. Include both immediate and long-term recommendations
8. Always include medical disclaimer context`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are VaidyaSetu AI, an expert medical laboratory analyst specializing in personalized health insights for Indian patients.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 2000
  });

  const analysisText = completion.choices[0]?.message?.content || '{}';
  
  // Remove markdown code blocks if present
  const cleanedText = analysisText.replace(/^```[\s\S]*?\n|```$/g, '').trim();
  
  return JSON.parse(cleanedText);
}

/**
 * Rule-based analysis fallback
 */
function generateRuleBasedAnalysis(abnormalLabs, userContext) {
  const criticalFindings = abnormalLabs.map(lab => {
    const severity = getSeverity(lab.testName, lab.resultValue, lab.referenceRange);
    
    return {
      testName: lab.testName,
      value: `${lab.resultValue} ${lab.unit}`,
      severity: severity,
      explanation: `Your ${lab.testName} level is outside the normal range (${lab.referenceRange})`,
      immediateAction: getImmediateAction(lab.testName, lab.resultValue),
      precautions: getPrecautions(lab.testName)
    };
  });

  return {
    summary: `Your lab report shows ${abnormalLabs.length} test(s) outside the normal range. Please review the detailed findings below and consult your healthcare provider.`,
    criticalFindings: criticalFindings,
    dietaryRecommendations: [
      'Eat a balanced diet rich in fruits and vegetables',
      'Stay hydrated with 8-10 glasses of water daily',
      'Limit processed foods and excessive sugar',
      'Include fiber-rich foods in your meals',
      'Consider portion control and mindful eating'
    ],
    lifestyleChanges: [
      'Exercise for 30 minutes daily',
      'Get 7-8 hours of quality sleep',
      'Manage stress through meditation or yoga',
      'Avoid smoking and limit alcohol',
      'Maintain a healthy weight'
    ],
    monitoringAdvice: 'Retest abnormal parameters in 2-4 weeks or as advised by your doctor',
    whenToSeeDoctor: 'Consult your doctor immediately if you experience severe symptoms or if abnormal values persist',
    positiveNotes: ['Several of your test results are within normal range, which is encouraging'],
    potentialInteractions: [],
    nextSteps: [
      'Review all abnormal findings carefully',
      'Schedule appointment with your healthcare provider',
      'Follow dietary and lifestyle recommendations',
      'Monitor symptoms and report any changes',
      'Retest as recommended by your doctor'
    ]
  };
}

/**
 * Check if value is within reference range
 */
function checkIfInRange(value, referenceRange) {
  if (!referenceRange || typeof value !== 'number') return null;
  
  // Range format: "70-100"
  const range = referenceRange.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  if (range) {
    return value >= parseFloat(range[1]) && value <= parseFloat(range[2]);
  }
  
  // Less than: "< 200"
  const lt = referenceRange.match(/<\s*([\d.]+)/);
  if (lt) {
    return value < parseFloat(lt[1]);
  }
  
  // Greater than: "> 5.0"
  const gt = referenceRange.match(/>\s*([\d.]+)/);
  if (gt) {
    return value > parseFloat(gt[1]);
  }
  
  return null;
}

/**
 * Get severity level
 */
function getSeverity(testName, value, referenceRange) {
  if (!referenceRange) return 'moderate';
  
  const range = referenceRange.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  if (!range) return 'moderate';
  
  const min = parseFloat(range[1]);
  const max = parseFloat(range[2]);
  const deviation = Math.abs(value - ((min + max) / 2)) / ((max - min) / 2);
  
  if (deviation > 1.5) return 'high';
  if (deviation > 0.8) return 'moderate';
  return 'low';
}

/**
 * Get immediate action for specific test
 */
function getImmediateAction(testName, value) {
  const actions = {
    glucose: value > 200 ? 'Monitor blood sugar every 2 hours and contact your doctor' : 'Reduce sugar intake and monitor',
    hemoglobin: value < 10 ? 'Seek immediate medical attention' : 'Increase iron-rich foods',
    cholesterol: value > 240 ? 'Avoid fatty foods and consult doctor' : 'Adopt heart-healthy diet',
    creatinine: value > 2.0 ? 'Contact nephrologist immediately' : 'Stay hydrated and avoid NSAIDs'
  };
  
  const lowerName = testName.toLowerCase();
  for (const [key, action] of Object.entries(actions)) {
    if (lowerName.includes(key)) return action;
  }
  
  return 'Consult your healthcare provider for guidance';
}

/**
 * Get precautions for specific test
 */
function getPrecautions(testName) {
  const precautions = {
    glucose: ['Monitor blood sugar regularly', 'Avoid sugary foods', 'Stay physically active', 'Take medications as prescribed'],
    hemoglobin: ['Eat iron-rich foods', 'Avoid tea/coffee with meals', 'Include vitamin C sources', 'Get adequate rest'],
    cholesterol: ['Limit saturated fats', 'Exercise regularly', 'Avoid trans fats', 'Monitor blood pressure'],
    creatinine: ['Stay well hydrated', 'Avoid high-protein diet', 'Limit salt intake', 'Monitor blood pressure']
  };
  
  const lowerName = testName.toLowerCase();
  for (const [key, precaut] of Object.entries(precautions)) {
    if (lowerName.includes(key)) return precaut;
  }
  
  return ['Follow up with your doctor', 'Monitor for symptoms', 'Maintain healthy lifestyle'];
}

module.exports = router;
