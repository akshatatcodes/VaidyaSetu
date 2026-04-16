const express = require('express');
const router = express.Router();
const DiseaseMetadata = require('../models/DiseaseMetadata');
const DiseaseInsight = require('../models/DiseaseInsight');
const UserProfile = require('../models/UserProfile');
const Report = require('../models/Report');
const Medication = require('../models/Medication');
const MitigationCompletion = require('../models/MitigationCompletion');
const { HYBRID_DISEASE_IDS, calculateDetailedInsights, getRiskVerificationMeta } = require('../utils/riskScorer');
const aiService = require('../services/aiService');
const { DISEASE_QUESTIONNAIRES, generateGenericQuestionnaire } = require('../utils/diseaseQuestionnaires');
const { schedulePredictiveRecompute } = require('../services/predictiveRiskRecomputeScheduler');
const { computePredictiveRiskForDiseases } = require('../services/predictiveRiskAiService');

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

const QUESTIONNAIRE_FIELD_MAPPING = {
  waist_circumference: 'waistCircumference',
  diabetes_family_history: 'familyHistoryDiabetes',
  physical_activity: 'activityLevel',
  gestational_diabetes: 'gestationalDiabetesHistory',
  frequent_thirst: 'frequentThirst',
  frequent_urination: 'frequentUrination',
  blurred_vision: 'blurredVision',
  slow_healing: 'slowHealingWounds',
  tingling_extremities: 'tinglingExtremities',
  family_history_htn: 'familyHistoryHypertension',
  salt_intake: 'saltIntake',
  stress_level: 'stressLevel',
  sleep_quality: 'sleepQuality',
  previous_bp_readings: 'previous_bp_readings',
  family_history_thyroid: 'familyHistoryThyroid',
  weight_changes: 'weightChangeUnexplained',
  fatigue_level: 'fatiguePersistent',
  temperature_sensitivity: 'coldIntolerance',
  chest_pain: 'chestPainActivity',
  breathlessness: 'shortnessBreath',
  cholesterol_history: 'cholesterolHistory',
  family_heart_history: 'familyHistoryHeartDisease',
  palpitations: 'palpitations',
  leg_swelling: 'legSwelling',
  exercise_tolerance: 'exerciseTolerance',
  weight_trend: 'weightGainTrend',
  physical_limitations: 'physicalLimitations',
  weight_loss_attempts: 'weightLossAttempts',
  family_obesity: 'familyHistoryObesity',
  menstrual_cycle: 'menstrualCycleIrregular',
  hirsutism: 'facialBodyHairExcess',
  weight_gain_pcos: 'weightGainPCOS',
  family_history_anemia: 'familyHistoryAnemia',
  recent_blood_donation: 'recentBloodDonation',
  heavy_menstrual_flow: 'heavyMenstrualFlow',
  iron_supplementation: 'ironSupplementation',
  wheezing: 'wheezing',
  high_pollution_area: 'highPollutionArea',
  pack_years: 'packYears',
  biomass_fuel_use: 'biomassFuelUse',
  occupational_dust_exposure: 'occupationalDustExposure',
  anxiety_screen: 'mentalHealthAnxiety',
  sleep_hours: 'sleepHours',
  depression_screen: 'mentalHealthDepressed',
  lost_interest: 'lostInterestActivities'
};

const QUESTIONNAIRE_MULTI_SELECT_MAPPING = {
  symptoms: {
    frequent_urination: 'frequentUrination',
    excessive_thirst: 'frequentThirst',
    blurred_vision: 'blurredVision',
    slow_healing: 'slowHealingWounds',
    tingling_extremities: 'tinglingExtremities',
    unexplained_weight_loss: 'weightChangeUnexplained',
    fatigue: 'fatiguePersistent'
  },
  anemia_symptoms: {
    pale_skin: 'paleSkinObservation',
    brittle_nails: 'brittleNails',
    dizziness: 'dizzinessOnStanding',
    fatigue: 'fatiguePersistent'
  },
  hair_skin_changes: {
    hair_loss: 'drySkinHairLoss',
    dry_skin: 'drySkinHairLoss',
    brittle_nails: 'brittleNails'
  },
  previous_cardiac_events: {
    heart_attack: 'priorHeartAttack',
    angioplasty: 'angioplastyHistory',
    bypass: 'bypassHistory',
    stroke: 'strokeHistory'
  },
  eating_patterns: {
    emotional_eating: 'emotionalEating',
    night_eating: 'nightEating',
    binge_eating: 'bingeEating',
    frequent_snacking: 'frequentSnacking',
    large_portions: 'largePortions'
  }
};

function getQuestionnaireDefinition(diseaseId) {
  return DISEASE_QUESTIONNAIRES[diseaseId] || generateGenericQuestionnaire(diseaseId, diseaseId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
}

function setProfileField(target, field, value, now) {
  target[field] = {
    value,
    lastUpdated: now,
    updateType: 'real_change'
  };
}

function applyQuestionnaireAnswersToProfile(target, answers = {}, now = new Date()) {
  let appliedFieldCount = 0;

  Object.entries(answers).forEach(([key, value]) => {
    const profileField = QUESTIONNAIRE_FIELD_MAPPING[key];
    if (!profileField) return;
    setProfileField(target, profileField, value, now);
    appliedFieldCount += 1;
  });

  Object.entries(QUESTIONNAIRE_MULTI_SELECT_MAPPING).forEach(([answerKey, fieldMap]) => {
    const selectedValues = answers[answerKey];
    if (!Array.isArray(selectedValues)) return;

    const mappedFields = Object.values(fieldMap);
    if (selectedValues.includes('none')) {
      mappedFields.forEach((field) => setProfileField(target, field, false, now));
      appliedFieldCount += mappedFields.length;
      return;
    }

    mappedFields.forEach((field) => setProfileField(target, field, false, now));
    selectedValues.forEach((selectedValue) => {
      const field = fieldMap[selectedValue];
      if (!field) return;
      setProfileField(target, field, true, now);
      appliedFieldCount += 1;
    });
  });

  return appliedFieldCount;
}

function buildQuestionnaireAnswerBreakdown(questionnaire, answers = {}, profile = {}) {
  if (!questionnaire?.questions?.length) {
    return { totalPoints: 0, details: [] };
  }

  const gender = profile?.gender?.value || profile?.gender;
  let totalPoints = 0;
  const details = [];

  questionnaire.questions.forEach((question) => {
    const answer = answers[question.id];
    if (answer === undefined || answer === null || answer === '') return;

    if (question.type === 'choice') {
      const selectedOption = (question.options || []).find((option) => option.value === answer);
      if (!selectedOption) return;

      let points = selectedOption.points || 0;
      if (question.scoring && typeof question.scoring === 'function') {
        const result = question.scoring(parseInt(answer, 10), gender);
        points = result?.points || 0;
      }

      totalPoints += points;
      details.push({
        question: question.question,
        answer: selectedOption.label,
        points,
        weight: question.weight,
        category: question.category,
        source: 'questionnaire'
      });
      return;
    }

    if (question.type === 'multi-select' && Array.isArray(answer)) {
      let questionPoints = 0;
      const labels = [];

      answer.forEach((value) => {
        const option = (question.options || []).find((candidate) => candidate.value === value);
        if (!option) return;
        questionPoints += option.points || 0;
        labels.push(option.label);
      });

      totalPoints += questionPoints;
      details.push({
        question: question.question,
        answer: labels.join(', ') || 'None',
        points: questionPoints,
        weight: question.weight,
        category: question.category,
        source: 'questionnaire'
      });
    }
  });

  return { totalPoints, details };
}

// @route   GET /api/diseases/:diseaseId/details
// @desc    Get complete disease info for a specific user
router.get('/:diseaseId/details', async (req, res) => {
  try {
    const { diseaseId } = req.params;
    const { clerkId } = req.query; // Expecting clerkId in query for now

    console.log(`[DiseaseDetails] Fetching for diseaseId=${diseaseId}, clerkId=${clerkId}`);
    const questionnaireDefinition = getQuestionnaireDefinition(diseaseId);

    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'clerkId is required' });
    }

    // 1. Fetch Metadata and Profile
    let [metadata, profile] = await Promise.all([
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

    const completedMitigationRows = await MitigationCompletion.find({
      clerkId,
      diseaseId,
      status: true
    }).lean();
    const completedMitigationStepIds = (completedMitigationRows || []).map((r) => r.stepId);

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
        currentInsight?.riskScore || 0,
        req.resolvedLanguage || 'en'
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
          questionnaireLength: questionnaireDefinition?.questions?.length || 0,
          verification: currentInsight?.verification || getRiskVerificationMeta(diseaseId),
          emergencyAlerts: currentInsight?.emergencyAlerts,
          rawInputData: currentInsight?.rawInputData,
          completedMitigationStepIds,
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
          questionnaireLength: questionnaireDefinition?.questions?.length || 0,
          verification: currentInsight?.verification || getRiskVerificationMeta(diseaseId),
          emergencyAlerts: currentInsight?.emergencyAlerts,
          rawInputData: currentInsight?.rawInputData,
          completedMitigationStepIds,
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
          {
            $set: {
              [`risk_scores.${diseaseId}`]: newInsightData.riskScore,
              [`risk_score_meta.${diseaseId}`]: newInsightData.verification || getRiskVerificationMeta(diseaseId)
            }
          }
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

    // Debounced predictive-risk refresh:
    // Exclude the disease being updated to avoid score "jumping" after the modal response.
    const diseaseIdsToRecompute = Array.isArray(HYBRID_DISEASE_IDS)
      ? HYBRID_DISEASE_IDS.filter((d) => d !== diseaseId)
      : undefined;
    schedulePredictiveRecompute({ clerkId, diseaseIds: diseaseIdsToRecompute });

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
    
    // Get active medications
    let activeMeds = [];
    try {
      activeMeds = await Medication.find({ clerkId, active: true }).lean();
    } catch (medErr) {
      console.warn('[Questionnaire] Could not fetch medications:', medErr.message);
    }
    
    // Merge database profile with frontend profile data (use most complete data)
    const comprehensiveProfile = {
      // Database data
      ...dbProfile,
      
      // Frontend profile data (overrides if more complete)
      ...(userProfile || {}),
      
      // Questionnaire answers
      questionnaireAnswers: answers,
      
      // Ensure arrays exist and are populated
      allergies: userProfile?.allergies || dbProfile?.allergies || [],
      activeMedications: activeMeds.length > 0 ? activeMeds : (userProfile?.activeMedications || dbProfile?.activeMedications || [])
    };
    
    console.log(`[Questionnaire] Considering:`);
    console.log(`  - Age: ${comprehensiveProfile?.age?.value || comprehensiveProfile?.age}`);
    console.log(`  - BMI: ${comprehensiveProfile?.bmi?.value || comprehensiveProfile?.bmi}`);
    console.log(`  - Allergies: ${comprehensiveProfile.allergies.length} known`);
    console.log(`  - Medications: ${comprehensiveProfile.activeMedications.length} active`);
    console.log(`  - Questionnaire answers: ${Object.keys(answers || {}).length}`);

    const now = new Date();
    const questionnaireDefinition = getQuestionnaireDefinition(diseaseId);
    const questionnaireBreakdown = buildQuestionnaireAnswerBreakdown(
      questionnaireDefinition,
      answers || {},
      comprehensiveProfile
    );

    // Baseline profile for scoring (onboarding-only), but still includes allergies & medications.
    const profileForBaseline = {
      ...dbProfile,
      ...(userProfile || {}),
      allergies: userProfile?.allergies || dbProfile?.allergies || [],
      activeMedications: activeMeds.length > 0 ? activeMeds : (userProfile?.activeMedications || dbProfile?.activeMedications || [])
    };

    // Questionnaire-enriched profile: apply answers in-memory immediately so scoring uses them.
    const profileForQuestionnaire = { ...profileForBaseline };
    const appliedFieldCount = applyQuestionnaireAnswersToProfile(
      profileForQuestionnaire,
      answers || {},
      now
    );

    // Calculate baseline and questionnaire-enriched scores separately.
    const baselineInsights = calculateDetailedInsights(profileForBaseline, diseaseId);
    const scorerQuestionnaireInsights = calculateDetailedInsights(profileForQuestionnaire, diseaseId);

    // If questionnaire answers did not map into scorer fields, fall back to canonical
    // answer-point scoring so generic questionnaires still affect the backend result.
    let questionnaireScore = scorerQuestionnaireInsights.riskScore;
    let questionnaireInsights = scorerQuestionnaireInsights;

    const usedQuestionnairePointFallback =
      appliedFieldCount === 0 &&
      questionnaireBreakdown.totalPoints > 0 &&
      baselineInsights.riskScore !== -1;

    if (usedQuestionnairePointFallback) {
      questionnaireScore = Math.max(
        2,
        Math.min(95, Math.round(baselineInsights.riskScore + questionnaireBreakdown.totalPoints))
      );
      questionnaireInsights = {
        ...scorerQuestionnaireInsights,
        riskScore: questionnaireScore,
        factorBreakdown: questionnaireBreakdown.details
      };
    }

    const baselineScore = baselineInsights.riskScore;
    const baselineFactors = baselineInsights.factorBreakdown || [];
    let finalRiskScore = questionnaireScore;
    if (baselineScore === -1 && questionnaireScore !== -1) {
      finalRiskScore = questionnaireScore;
    }
    let questionnaireDelta =
      baselineScore !== -1 && finalRiskScore !== -1
        ? finalRiskScore - baselineScore
        : 0;
    const questionnaireMeta = {
      title: questionnaireDefinition?.title || `${diseaseId.replace(/_/g, ' ')} Risk Assessment`,
      questionCount: questionnaireDefinition?.questions?.length || 0,
      isSpecific: Boolean(DISEASE_QUESTIONNAIRES[diseaseId]),
      diseaseId
    };

    const insights = {
      ...questionnaireInsights,
      riskScore: finalRiskScore
    };
    let assessmentFactors = (insights.factorBreakdown && insights.factorBreakdown.length > 0)
      ? insights.factorBreakdown
      : questionnaireBreakdown.details;
    
    // PERSIST QUESTIONNAIRE ANSWERS TO USER PROFILE (CRITICAL FIX)
    try {
      const profileToUpdate = await UserProfile.findOne({ clerkId });
      if (profileToUpdate) {
        const updates = {};
        applyQuestionnaireAnswersToProfile(updates, answers || {}, now);

        if (Object.keys(updates).length > 0) {
          console.log(`[Questionnaire] Persisting ${Object.keys(updates).length} fields to UserProfile for ${clerkId}`);
          await UserProfile.updateOne({ clerkId }, { $set: updates });
        }
      }
    } catch (saveErr) {
      console.warn('[Questionnaire] Failed to persist answers to UserProfile:', saveErr.message);
    }
    
    // Generate AI-powered mitigation steps considering allergies & medications
    const aiMitigations = await aiService.generateMitigationSteps(
      comprehensiveProfile,
      diseaseId,
      finalRiskScore,
      req.resolvedLanguage || 'en'
    ).catch(err => {
      console.error('AI mitigation generation failed, using library:', err.message);
      return [];
    });
    
    // Combine AI mitigations with library-based mitigations
    let allMitigations = [
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
      },
      verification: insights.verification || getRiskVerificationMeta(diseaseId)
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
          {
            $set: {
              [`risk_scores.${diseaseId}`]: finalRiskScore,
              [`risk_score_meta.${diseaseId}`]: insights.verification || getRiskVerificationMeta(diseaseId)
            }
          }
        );
        
        console.log(`[Questionnaire] Update result:`, updateResult);
        
        // Verify the update
        const verifyReport = await Report.findById(report._id).lean();
        console.log(`[Questionnaire] ✅ Verified: Report.risk_scores[${diseaseId}] = ${verifyReport.risk_scores[diseaseId]}`);
        console.log(`[Questionnaire] ✅ Updated Report risk_scores[${diseaseId}] = ${finalRiskScore}`);
      } else {
        // Create new report if none exists
        const newReport = await Report.create({
          clerkId,
          summary: 'Risk assessment initiated via questionnaire.',
          advice: {},
          general_tips: 'Complete additional screenings for comprehensive health insights.',
          disclaimer: 'This is a screening support tool, not a diagnosis.',
          risk_scores: { [diseaseId]: finalRiskScore },
          risk_score_meta: { [diseaseId]: insights.verification || getRiskVerificationMeta(diseaseId) },
          category_insights: {},
          mitigations: {}
        });
        console.log(`[Questionnaire] ✅ Created new Report for ${clerkId} with risk_scores[${diseaseId}] = ${finalRiskScore}`);
      }
    } catch (err) {
      console.error('[Questionnaire] ❌ Failed to update Report:', err.message);
      console.error('[Questionnaire] Error stack:', err.stack);
      // Don't fail the request if Report update fails
    }

    // Best-effort AI authoritative scoring for this disease.
    // If AI scoring fails/times out, we keep deterministic `finalRiskScore` to preserve stability.
    try {
      // If we relied on questionnaire-point fallback (no scorer field mapping),
      // keep this route deterministic for this response. AI recompute may not
      // fully reflect generic point-only answers and can appear as "score reset".
      if (!usedQuestionnairePointFallback) {
        const aiResults = await computePredictiveRiskForDiseases({
          clerkId,
          diseaseIds: [diseaseId],
          language: req.resolvedLanguage || 'en'
        });

        const ai = aiResults?.[diseaseId];
        if (ai && typeof ai.riskScore === 'number') {
          finalRiskScore = ai.riskScore;

          // Update insight fields used by the response/UI
          insights.riskScore = finalRiskScore;
          insights.riskCategory = ai.riskCategory || insights.riskCategory;
          if (Array.isArray(ai.factorBreakdown)) insights.factorBreakdown = ai.factorBreakdown;
          if (Array.isArray(ai.protectiveFactors)) insights.protectiveFactors = ai.protectiveFactors;
          if (Array.isArray(ai.missingDataFactors)) insights.missingDataFactors = ai.missingDataFactors;
          if (ai.verification) insights.verification = ai.verification;
          if (typeof ai.dataCompleteness === 'number') insights.dataCompleteness = ai.dataCompleteness;

          // Recompute delta shown to user (baseline stays deterministic)
          questionnaireDelta = baselineScore !== -1 && finalRiskScore !== -1 ? finalRiskScore - baselineScore : 0;

          // Update modal breakdown + mitigation steps to match AI output
          assessmentFactors = Array.isArray(ai.factorBreakdown) && ai.factorBreakdown.length ? ai.factorBreakdown : assessmentFactors;
          allMitigations = Array.isArray(ai.mitigationSteps) && ai.mitigationSteps.length ? ai.mitigationSteps : allMitigations;

          // Persist AI-updated values so Dashboard/details match this response
          await Report.updateOne(
            { clerkId },
            {
              $set: {
                [`risk_scores.${diseaseId}`]: finalRiskScore,
                [`risk_score_meta.${diseaseId}`]: ai.verification || getRiskVerificationMeta(diseaseId)
              }
            }
          );

          if (typeof DiseaseInsight.updateOne === 'function') {
            await DiseaseInsight.updateOne(
              { clerkId, diseaseId },
              {
                $set: {
                  riskScore: finalRiskScore,
                  riskCategory: insights.riskCategory,
                  factorBreakdown: insights.factorBreakdown || [],
                  protectiveFactors: insights.protectiveFactors || [],
                  missingDataFactors: insights.missingDataFactors || [],
                  mitigationSteps: allMitigations || [],
                  dataCompleteness: insights.dataCompleteness || 0,
                  verification: insights.verification || getRiskVerificationMeta(diseaseId)
                }
              }
            );
          }
        }
      } else {
        console.log('[Questionnaire] Skipping AI overwrite: using questionnaire-point fallback for this response.');
      }
    } catch (aiErr) {
      console.warn('[Questionnaire] AI scoring update failed; using deterministic finalScore:', aiErr.message);
    }
    
    // Debounced predictive-risk refresh:
    // Exclude the disease being assessed to avoid score "jumping" after the modal response.
    const diseaseIdsToRecompute = Array.isArray(HYBRID_DISEASE_IDS)
      ? HYBRID_DISEASE_IDS.filter((d) => d !== diseaseId)
      : undefined;
    schedulePredictiveRecompute({ clerkId, diseaseIds: diseaseIdsToRecompute });

    // Return comprehensive response
    res.json({
      status: 'success',
      data: {
        finalScore: finalRiskScore,
        riskScore: finalRiskScore,
        riskCategory: insights.riskCategory,
        baselineScore: Math.round(baselineScore),
        questionnaireScore: Math.round(questionnaireScore),
        assessmentDelta: Math.round(questionnaireDelta),
        questionnaireDelta: Math.round(questionnaireDelta),
        totalPoints: questionnaireBreakdown.totalPoints,
        baselineFactors,
        assessmentFactors,
        factorBreakdown: insights.factorBreakdown,
        questionnaireBreakdown: questionnaireBreakdown.details,
        protectiveFactors: insights.protectiveFactors,
        mitigationSteps: allMitigations,
        allergyConsiderations,
        medicationConsiderations,
        questionnaireMeta,
        verification: insights.verification || getRiskVerificationMeta(diseaseId),
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
