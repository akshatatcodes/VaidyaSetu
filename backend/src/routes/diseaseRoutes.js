const express = require('express');
const router = express.Router();
const DiseaseMetadata = require('../models/DiseaseMetadata');
const DiseaseInsight = require('../models/DiseaseInsight');
const UserProfile = require('../models/UserProfile');
const Report = require('../models/Report');
const { calculateDetailedInsights } = require('../utils/riskScorer');
const aiService = require('../services/aiService');
const { DISEASE_QUESTIONNAIRES, generateGenericQuestionnaire } = require('../utils/diseaseQuestionnaires');

// Auto-seed helper: creates DiseaseMetadata if missing
function getAutoMetadata(diseaseId) {
  const label = diseaseId.replace(/_/g, ' ');
  const map = {
    diabetes: 'Endocrinologist',
    pre_diabetes: 'Endocrinologist',
    thyroid: 'Endocrinologist',
    pcos: 'Gynecologist',
    obesity: 'Bariatric Specialist',
    heart_disease: 'Cardiologist',
    hypertension: 'Cardiologist',
    asthma: 'Pulmonologist',
    copd: 'Pulmonologist',
    respiratory: 'Pulmonologist',
    depression: 'Psychiatrist',
    anxiety: 'Psychiatrist',
    fatty_liver: 'Hepatologist',
    anemia: 'General Physician',
    vitamin_d: 'General Physician',
    vitamin_b12: 'General Physician',
    ckd: 'Nephrologist',
    stroke: 'Neurologist',
    osteoporosis: 'Rheumatologist',
    osteoarthritis: 'Orthopedist',
    surgical: 'General Surgeon'
  };
  return {
    diseaseId,
    displayName: label.charAt(0).toUpperCase() + label.slice(1),
    specialty: map[diseaseId] || 'General Physician',
    sources: ['Auto-generated'],
    alternativeSpecialists: []
  };
}

// @route   GET /api/diseases/:diseaseId/details
// @desc    Get complete disease info for a specific user
router.get('/:diseaseId/details', async (req, res) => {
  try {
    const { diseaseId } = req.params;
    const { clerkId } = req.query; // Expecting clerkId in query for now

    console.log(`[DiseaseDetails] Fetching for diseaseId=${diseaseId}, clerkId=${clerkId}`);

    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'clerkId is required' });
    }

    // 1. Fetch Metadata and Profile
    const [metadata, profile] = await Promise.all([
      DiseaseMetadata.findOne({ diseaseId }),
      UserProfile.findOne({ clerkId })
    ]);

    console.log(`[DiseaseDetails] metadata found: ${!!metadata}, profile found: ${!!profile}`);

    if (!metadata) {
      console.log(`[DiseaseDetails] Metadata missing for ${diseaseId}, auto-creating...`);
      const autoMeta = getAutoMetadata(diseaseId);
      metadata = await DiseaseMetadata.create(autoMeta);
      console.log(`[DiseaseDetails] Auto-created metadata for ${diseaseId}`);
    }

    // 2. Fetch or Calculate Insight
    let currentInsight = await DiseaseInsight.findOne({ clerkId, diseaseId });
    if (!currentInsight) {
      if (profile) {
        console.log(`[DiseaseDetails] No insight found, calculating for ${diseaseId}`);
        const calculated = calculateDetailedInsights(profile, diseaseId);
        currentInsight = new DiseaseInsight({
          clerkId,
          ...calculated
        });
        await currentInsight.save();
        console.log(`[DiseaseDetails] Insight calculated and saved. riskScore=${calculated.riskScore}`);
      } else {
        // No profile yet — create empty insight
        console.log(`[DiseaseDetails] No profile for ${clerkId}, creating empty insight for ${diseaseId}`);
        currentInsight = new DiseaseInsight({
          clerkId,
          diseaseId,
          riskScore: -1,
          riskCategory: 'N/A',
          dataCompleteness: 0,
          factorBreakdown: [],
          protectiveFactors: [],
          missingDataFactors: [],
          consultationTriggers: []
        });
        await currentInsight.save();
      }
    }

    // 3. Generate Personalized Mitigations (Step 1.5 & 1.6)
    // We generate these fresh to ensure allergies/medications are processed
    try {
      // Build comprehensive profile with all user data
      const comprehensiveProfile = {
        ...(profile || {}),
        // Include onboarding data
        age: profile?.age || { value: 30 },
        gender: profile?.gender || { value: 'Other' },
        bmi: profile?.bmi || { value: 22 },
        // Include allergies and medications explicitly
        allergies: profile?.allergies || [],
        activeMedications: profile?.activeMedications || [],
        // Include lifestyle factors
        activityLevel: profile?.activityLevel || { value: 'Sedentary' },
        dietType: profile?.dietType || { value: 'Non-Veg' },
        isSmoker: profile?.isSmoker || { value: false },
        // Include any missing vital signs
        blood_pressure: profile?.blood_pressure || {},
        blood_glucose: profile?.blood_glucose || {},
        heart_rate: profile?.heart_rate || {}
      };

      const mitigationSteps = await aiService.generateMitigationSteps(
        comprehensiveProfile, 
        diseaseId, 
        currentInsight?.riskScore || 0
      );
      console.log(`[DiseaseDetails] Generated ${mitigationSteps.length} mitigation steps`);
      
      res.json({
        status: 'success',
        data: {
          diseaseMetadata: metadata,
          riskScore: currentInsight?.riskScore,
          riskCategory: currentInsight?.riskCategory,
          dataCompleteness: currentInsight?.dataCompleteness,
          factorBreakdown: currentInsight?.factorBreakdown,
          protectiveFactors: currentInsight?.protectiveFactors,
          missingDataFactors: currentInsight?.missingDataFactors,
          mitigationSteps: mitigationSteps,
          consultationTriggers: currentInsight?.consultationTriggers,
          specialistInformation: {
            primary: metadata.specialty,
            alternatives: metadata.alternativeSpecialists
          },
          sourceAttributions: metadata.sources,
          emergencyAlerts: currentInsight?.emergencyAlerts,
          rawInputData: currentInsight?.rawInputData,
          userProfile: {
            allergies: profile?.allergies || [],
            activeMedications: profile?.activeMedications || [],
            age: profile?.age?.value,
            gender: profile?.gender?.value,
            bmi: profile?.bmi?.value,
            activityLevel: profile?.activityLevel?.value,
            dietType: profile?.dietType?.value,
            isSmoker: profile?.isSmoker?.value,
            onboardingCompleted: profile?.onboardingCompleted
          },
          reviewedAt: currentInsight?.reviewedAt
        }
      });
    } catch (mitErr) {
      console.error(`[DiseaseDetails] Mitigation generation failed:`, mitErr.message);
      // Return response without mitigations rather than failing entirely
      res.json({
        status: 'success',
        data: {
          diseaseMetadata: metadata,
          riskScore: currentInsight?.riskScore,
          riskCategory: currentInsight?.riskCategory,
          dataCompleteness: currentInsight?.dataCompleteness,
          factorBreakdown: currentInsight?.factorBreakdown,
          protectiveFactors: currentInsight?.protectiveFactors,
          missingDataFactors: currentInsight?.missingDataFactors,
          mitigationSteps: [],
          consultationTriggers: currentInsight?.consultationTriggers,
          specialistInformation: {
            primary: metadata.specialty,
            alternatives: metadata.alternativeSpecialists
          },
          sourceAttributions: metadata.sources,
          emergencyAlerts: currentInsight?.emergencyAlerts,
          rawInputData: currentInsight?.rawInputData,
          userProfile: {
            allergies: profile?.allergies || [],
            activeMedications: profile?.activeMedications || [],
            age: profile?.age?.value,
            gender: profile?.gender?.value,
            bmi: profile?.bmi?.value,
            activityLevel: profile?.activityLevel?.value,
            dietType: profile?.dietType?.value,
            isSmoker: profile?.isSmoker?.value,
            onboardingCompleted: profile?.onboardingCompleted
          },
          reviewedAt: currentInsight?.reviewedAt
        }
      });
    }
  } catch (error) {
    console.error('[DiseaseDetails] Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// @route   POST /api/diseases/:diseaseId/add-data
// @desc    Accept new data and return recalculated risk
router.post('/:diseaseId/add-data', async (req, res) => {
  try {
    const { diseaseId } = req.params;
    const { clerkId, field, value, unit, data } = req.body;

    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'clerkId is required' });
    }

    // 1. Update User Profile
    const profile = await UserProfile.findOne({ clerkId });
    if (!profile) {
      return res.status(404).json({ status: 'error', message: 'Profile not found' });
    }

    // Handle both single field and multiple fields
    const fieldsToUpdate = data || (field && value ? { [field]: value } : {});
    
    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({ status: 'error', message: 'No data provided to update' });
    }

    console.log(`[AddData] Updating ${Object.keys(fieldsToUpdate).length} field(s) for ${diseaseId}:`, Object.keys(fieldsToUpdate));

    // Update each field in the profile
    for (const [fieldName, fieldValue] of Object.entries(fieldsToUpdate)) {
      // Skip date fields (they're stored separately)
      if (fieldName.endsWith('_date')) continue;
      
      // Update the specific field (following the FieldSchema pattern)
      profile[fieldName] = {
        value: fieldValue,
        lastUpdated: new Date(),
        updateType: 'real_change',
        unit: profile[fieldName]?.unit
      };
    }
    
    // Save profile changes
    await profile.save();
    console.log('[AddData] ✅ Profile updated successfully');

    // 2. Recalculate Insight
    const newInsightData = calculateDetailedInsights(profile, diseaseId);
    console.log(`[AddData] Recalculated riskScore: ${newInsightData.riskScore}`);
    
    // 3. Update or Create Insight record
    const updatedInsight = await DiseaseInsight.findOneAndUpdate(
      { clerkId, diseaseId },
      { $set: newInsightData },
      { new: true, upsert: true }
    );

    // CRITICAL: Also update the Report's risk_scores to ensure dashboard reflects changes
    try {
      const report = await Report.findOne({ clerkId }).sort({ createdAt: -1 });
      if (report) {
        console.log(`[AddData] Before update - Report risk_scores[${diseaseId}]:`, report.risk_scores?.[diseaseId]);
        
        // Direct update using MongoDB updateOne
        const updateResult = await Report.updateOne(
          { _id: report._id },
          { $set: { [`risk_scores.${diseaseId}`]: newInsightData.riskScore } }
        );
        
        console.log(`[AddData] Update result:`, updateResult);
        
        // Verify the update
        const verifyReport = await Report.findById(report._id).lean();
        console.log(`[AddData] ✅ Verified - Report now has:`, verifyReport.risk_scores?.[diseaseId]);
        console.log(`[AddData] ✅ Updated Report risk_scores[${diseaseId}] = ${newInsightData.riskScore}`);
      } else {
        console.log('[AddData] ⚠️ No report found for this user');
      }
    } catch (err) {
      console.error('[AddData] ❌ Failed to update Report:', err.message);
      console.error('[AddData] Error stack:', err.stack);
      // Don't fail the request if Report update fails
    }

    res.json({
      status: 'success',
      message: 'Data updated and risk recalculated',
      data: updatedInsight
    });
  } catch (error) {
    console.error('Add data error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// @route   PATCH /api/diseases/:diseaseId/review
// @desc    Mark an insight as reviewed
router.patch('/:diseaseId/review', async (req, res) => {
  try {
    const { diseaseId } = req.params;
    const { clerkId } = req.body;

    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'clerkId is required' });
    }

    const updated = await DiseaseInsight.findOneAndUpdate(
      { clerkId, diseaseId },
      { $set: { reviewedAt: new Date() } },
      { new: true }
    );

    res.json({ status: 'success', data: updated });
  } catch (error) {
    console.error('Review update error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// @route   GET /api/diseases/:diseaseId/questionnaire
// @desc    Get disease-specific questionnaire
router.get('/:diseaseId/questionnaire', async (req, res) => {
  try {
    const { diseaseId } = req.params;
    
    // Check if we have a specific questionnaire for this disease
    let questionnaire = DISEASE_QUESTIONNAIRES[diseaseId];
    
    // If not, generate a generic one
    if (!questionnaire) {
      const diseaseName = diseaseId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      questionnaire = generateGenericQuestionnaire(diseaseId, diseaseName);
    }
    
    res.json({
      status: 'success',
      data: questionnaire
    });
  } catch (error) {
    console.error('Questionnaire fetch error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// @route   POST /api/diseases/:diseaseId/questionnaire
// @desc    Submit questionnaire answers and calculate updated risk
router.post('/:diseaseId/questionnaire', async (req, res) => {
  try {
    const { diseaseId } = req.params;
    const { clerkId, answers, userProfile, recalculateFullRisk } = req.body;
    
    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'clerkId is required' });
    }
    
    console.log(`[Questionnaire] Recalculating risk for ${diseaseId} with comprehensive data...`);
    
    // Get user profile from database
    const dbProfile = await UserProfile.findOne({ clerkId }).lean();
    if (!dbProfile) {
      return res.status(404).json({ status: 'error', message: 'User profile not found' });
    }
    
    // Merge database profile with frontend profile data (use most complete data)
    const comprehensiveProfile = {
      // Database data
      ...dbProfile,
      
      // Frontend profile data (overrides if more complete)
      ...(userProfile || {}),
      
      // Questionnaire answers
      questionnaireAnswers: answers,
      
      // Ensure arrays exist
      allergies: userProfile?.allergies || dbProfile?.allergies || [],
      activeMedications: userProfile?.activeMedications || dbProfile?.activeMedications || []
    };
    
    console.log(`[Questionnaire] Considering:`);
    console.log(`  - Age: ${comprehensiveProfile?.age?.value || comprehensiveProfile?.age}`);
    console.log(`  - BMI: ${comprehensiveProfile?.bmi?.value || comprehensiveProfile?.bmi}`);
    console.log(`  - Allergies: ${comprehensiveProfile.allergies.length} known`);
    console.log(`  - Medications: ${comprehensiveProfile.activeMedications.length} active`);
    console.log(`  - Questionnaire answers: ${Object.keys(answers || {}).length}`);
    
    // Calculate comprehensive risk using ALL data
    const insights = calculateDetailedInsights(comprehensiveProfile, diseaseId);
    
    // Generate AI-powered mitigation steps considering allergies & medications
    const aiMitigations = await aiService.generateMitigationSteps(
      comprehensiveProfile,
      diseaseId,
      insights.riskScore
    ).catch(err => {
      console.error('AI mitigation generation failed, using library:', err.message);
      return [];
    });
    
    // Combine AI mitigations with library-based mitigations
    const allMitigations = [
      ...aiMitigations,
      ...insights.mitigationSteps
    ].slice(0, 10); // Top 10 recommendations
    
    // Update or create disease insight with comprehensive data
    let diseaseInsight = await DiseaseInsight.findOne({ clerkId, diseaseId });
    
    const insightData = {
      riskScore: insights.riskScore,
      riskCategory: insights.riskCategory,
      factorBreakdown: insights.factorBreakdown,
      protectiveFactors: insights.protectiveFactors,
      missingDataFactors: insights.missingDataFactors,
      mitigationSteps: allMitigations,
      questionnaireAnswers: answers,
      questionnaireCompletedAt: new Date(),
      lastCalculated: new Date(),
      dataCompleteness: insights.dataCompleteness,
      rawInputData: {
        onboardingData: dbProfile,
        questionnaireAnswers: answers,
        calculatedAt: new Date()
      }
    };
    
    if (diseaseInsight) {
      Object.assign(diseaseInsight, insightData);
      await diseaseInsight.save();
      console.log(`[Questionnaire] Updated existing insight for ${diseaseId}`);
    } else {
      diseaseInsight = new DiseaseInsight({
        clerkId,
        diseaseId,
        ...insightData
      });
      await diseaseInsight.save();
      console.log(`[Questionnaire] Created new insight for ${diseaseId}`);
    }
    
    // Analyze allergy considerations
    const allergies = comprehensiveProfile.allergies || [];
    const allergyConsiderations = Array.isArray(allergies) 
      ? allergies.filter(a => a).map(a => {
          // Handle both string arrays and object arrays
          const allergyName = typeof a === 'string' ? a : (a.name || a.substance || 'Unknown');
          return {
            allergy: allergyName,
            severity: typeof a === 'object' ? (a.severity || 'unknown') : 'unknown',
            precaution: `Avoid medications/treatments containing ${allergyName}`
          };
        })
      : [];
    
    // Analyze medication interactions
    const medications = comprehensiveProfile.activeMedications || [];
    const medicationConsiderations = Array.isArray(medications)
      ? medications.filter(m => m && (typeof m === 'string' || m.name)).map(m => {
          // Handle both string arrays and object arrays
          const medName = typeof m === 'string' ? m : (m.name || 'Unknown');
          return {
            medication: medName,
            dosage: typeof m === 'object' ? (m.dosage || 'unknown') : 'unknown',
            note: 'Consider drug interactions when prescribing'
          };
        })
      : [];
    
    // CRITICAL: Update the Report's risk_scores BEFORE sending response
    try {
      const report = await Report.findOne({ clerkId }).sort({ createdAt: -1 });
      if (report) {
        // Initialize risk_scores if not present
        if (!report.risk_scores) {
          report.risk_scores = {};
        }
        
        console.log(`[Questionnaire] Before update - Report.risk_scores[${diseaseId}]:`, report.risk_scores[diseaseId]);
        
        // Direct update using MongoDB updateOne
        const updateResult = await Report.updateOne(
          { _id: report._id },
          { $set: { [`risk_scores.${diseaseId}`]: insights.riskScore } }
        );
        
        console.log(`[Questionnaire] Update result:`, updateResult);
        
        // Verify the update
        const verifyReport = await Report.findById(report._id).lean();
        console.log(`[Questionnaire] ✅ Verified: Report.risk_scores[${diseaseId}] = ${verifyReport.risk_scores[diseaseId]}`);
        console.log(`[Questionnaire] ✅ Updated Report risk_scores[${diseaseId}] = ${insights.riskScore}`);
      } else {
        // Create new report if none exists
        const newReport = await Report.create({
          clerkId,
          summary: 'Risk assessment initiated via questionnaire.',
          advice: {},
          general_tips: 'Complete additional screenings for comprehensive health insights.',
          disclaimer: 'This is a screening support tool, not a diagnosis.',
          risk_scores: { [diseaseId]: insights.riskScore },
          category_insights: {},
          mitigations: {}
        });
        console.log(`[Questionnaire] ✅ Created new Report for ${clerkId} with risk_scores[${diseaseId}] = ${insights.riskScore}`);
      }
    } catch (err) {
      console.error('[Questionnaire] ❌ Failed to update Report:', err.message);
      console.error('[Questionnaire] Error stack:', err.stack);
      // Don't fail the request if Report update fails
    }
    
    // Return comprehensive response
    res.json({
      status: 'success',
      data: {
        riskScore: insights.riskScore,
        riskCategory: insights.riskCategory,
        baselineScore: Math.round(insights.riskScore * 0.4),
        questionnaireScore: Math.round(insights.riskScore * 0.6),
        totalPoints: insights.riskScore,
        factorBreakdown: insights.factorBreakdown,
        protectiveFactors: insights.protectiveFactors,
        mitigationSteps: allMitigations,
        allergyConsiderations,
        medicationConsiderations,
        dataCompleteness: insights.dataCompleteness,
        questionnaireCompleted: true,
        message: `Risk recalculated considering onboarding data, questionnaire answers, ${comprehensiveProfile.allergies.length} allergies, and ${comprehensiveProfile.activeMedications.length} medications`
      }
    });
  } catch (error) {
    console.error('Questionnaire submission error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
