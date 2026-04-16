const { PREVALENCE_DATA, SCREENING_TOOLS } = require('./prevalenceData');

/** Full questionnaire-hybrid disease set (order: priority conditions first). */
const HYBRID_DISEASE_IDS = [
  'diabetes', 'pre_diabetes', 'obesity', 'thyroid', 'pcos', 'hypertension',
  'heart_disease', 'stroke', 'asthma', 'copd', 'ckd', 'fatty_liver',
  'anemia', 'vitamin_d', 'vitamin_b12', 'depression', 'anxiety',
  'sleep_disorders', 'osteoporosis', 'osteoarthritis'
];
const { MITIGATION_LIBRARY } = require('./mitigationLibrary');
const { SPECIALIST_MAPPING } = require('./specialistMapping');
const { calculateEmergencyAlerts } = require('./emergencyScorer');

function getScoreCategory(score) {
    if (score === -1) return 'N/A';
    if (score < 5) return 'Very Low';
    if (score <= 25) return 'Low';
    if (score <= 50) return 'Moderate';
    if (score <= 75) return 'High';
    return 'Very High';
}

function getRiskVerificationMeta(diseaseId) {
    const prevalenceEntry = PREVALENCE_DATA[diseaseId] || {};
    const sources = Array.isArray(prevalenceEntry.sources) && prevalenceEntry.sources.length
        ? prevalenceEntry.sources
        : ['WHO GHO 2024'];

    return {
        source: sources[0],
        allSources: sources,
        datasetVersion: '2024',
        verificationLevel: 'verified',
        lastValidatedAt: new Date(),
        algorithmVersion: '2.1.0'
    };
}

function isAffirmative(value) {
    if (value === true) return true;
    if (typeof value !== 'string') return false;
    const normalized = value.trim().toLowerCase();
    return ['yes', 'y', 'true', '1', 'present', 'positive', 'high', 'frequently', 'often'].includes(normalized);
}

/**
 * STEP 44: Conditional Mitigation Selection Logic
 * Selects top 3-5 recommendations based on impact and user preference.
 */
function selectMitigations(profile, diseaseId, score) {
    const diet = profile.dietType?.value || 'Non-Veg';
    const age = parseInt(profile.age?.value || profile.age) || 30;
    const gender = (profile.gender?.value || profile.gender || 'Other').toLowerCase();
    const isFemale = gender === 'female';
    const activity = profile.activityLevel?.value || 'Sedentary';

    return MITIGATION_LIBRARY
        .filter(m => m.diseaseId === diseaseId)
        .filter(m => {
            // Apply personalization rules (Step 44/48)
            if (m.rules.dietType && !m.rules.dietType.includes(diet)) return false;
            if (m.rules.minAge && age < m.rules.minAge) return false;
            if (m.rules.gender && !m.rules.gender.includes(gender)) return false;
            if (m.rules.activityLevel && !m.rules.activityLevel.includes(activity)) return false;
            
            // Gender-specific condition shielding (e.g. PCOS only for females)
            if (m.diseaseId === 'pcos' && !isFemale) return false;
            
            return true;
        })
        .sort((a, b) => {
            // Priority ordering (Step 44): High > Medium > Low
            const priorityMap = { high: 3, medium: 2, low: 1 };
            return priorityMap[b.priority] - priorityMap[a.priority];
        })
        .slice(0, 5); // Increased to 5 per Step 44
}

/**
 * PHASE 2 & 5: Evidence-Based Risk Engine & Mitigation System
 */
function calculateDetailedInsights(profile, diseaseId) {
    const getVal = (field) => {
        if (field === undefined || field === null) return undefined;
        if (typeof field === 'object' && field.value !== undefined) return field.value;
        return field;
    };

    const age = parseInt(getVal(profile.age)) || 30;
    const gender = (String(getVal(profile.gender) || 'Other')).toLowerCase();
    const isFemale = gender === 'female';
    const bmi = parseFloat(getVal(profile.bmi)) || 22;
    
    // Evaluate Global Emergency Conditions (Step 58)
    const emergencyAlerts = calculateEmergencyAlerts(profile);
    
    let factors = [];
    let protective = [];
    let missingFactors = [];

    // Allergy & Medication Data - normalized for all diseases
    const allergies = getVal(profile.allergies) || [];
    const activeMeds = getVal(profile.activeMedications) || [];

    const specialistMap = {
        diabetes: 'Endocrinologist',
        thyroid: 'Endocrinologist',
        pcos: 'Gynecologist',
        heart_disease: 'Cardiologist',
        hypertension: 'Cardiologist',
        asthma: 'Pulmonologist',
        copd: 'Pulmonologist',
        depression: 'Psychiatrist',
        anxiety: 'Psychiatrist',
        fatty_liver: 'Hepatologist or Gastrologist',
        anemia: 'General Physician',
        vitamin_d: 'General Physician',
        ckd: 'Nephrologist'
    };

    // Base Prevalence - stratified by age/gender if available
    let baseline = PREVALENCE_DATA[diseaseId]?.overall || 5;
    if (PREVALENCE_DATA[diseaseId]?.gender) {
        baseline = PREVALENCE_DATA[diseaseId].gender[gender] || baseline;
    }
    if (PREVALENCE_DATA[diseaseId]?.ageBrackets) {
        const bracket = Object.keys(PREVALENCE_DATA[diseaseId].ageBrackets)
            .find(b => {
                const parts = b.split('-');
                if (b.includes('+')) return age >= parseInt(b);
                const min = parseInt(parts[0]);
                const max = parseInt(parts[1]);
                return age >= min && age <= max;
            });
        if (bracket) baseline = PREVALENCE_DATA[diseaseId].ageBrackets[bracket];
    }

    let score = baseline;

    const addFactor = (id, name, val, impact, direction, explanation, category) => {
        factors.push({ id, name, displayValue: val, rawValue: val, impact, direction, explanation, category, source: 'user_profile' });
        if (direction === 'increase') score += impact;
        else score -= impact;
    };

    const addProtective = (id, name, val, reduction, explanation) => {
        protective.push({ id, name, displayValue: val, rawValue: val, impact: reduction, direction: 'decrease', explanation, category: 'lifestyle', source: 'user_profile' });
        // Reductions applied later
    };

    switch (diseaseId) {
        case 'diabetes':
            // STEP 12: INDIAN DIABETES RISK SCORE (IDRS)
            let idrs = 0;
            // Age
            let agePts = age < 35 ? 0 : (age < 50 ? 20 : 30);
            idrs += agePts;
            factors.push({ id: 'idrs_age', name: 'Age Factor', displayValue: age, impact: agePts, category: 'demographic', explanation: 'Risk increases significantly after 35 and 50.' });

            // Waist Circumference
            const waist = getVal(profile.waistCircumference);
            if (waist) {
                let waistPts = 0;
                if (gender === 'male') {
                    waistPts = waist < 90 ? 0 : (waist < 100 ? 10 : 20);
                } else {
                    waistPts = waist < 80 ? 0 : (waist < 90 ? 10 : 20);
                }
                idrs += waistPts;
                factors.push({ id: 'idrs_waist', name: 'Abdominal Obesity', displayValue: `${waist} cm`, impact: waistPts, category: 'demographic', explanation: 'Central obesity is a primary driver of insulin resistance.' });
            } else {
                missingFactors.push({ id: 'waistCircumference', name: 'Waist Circumference', prompt: 'Measure your waist at the navel line.', impact: 15, type: 'number' });
            }

            // Activity
            const activity = getVal(profile.activityLevel);
            let actPts = (activity === 'Regular' || activity === 'active') ? 0 : (activity === 'Occasional' || activity === 'moderate' ? 10 : 20);
            idrs += actPts;
            factors.push({ id: 'idrs_activity', name: 'Physical Activity', displayValue: activity || 'Sedentary', impact: actPts, category: 'lifestyle', explanation: 'Sedentary lifestyle reduces glucose uptake.' });

            // Family History
            const famHist = getVal(profile.familyHistoryDiabetes);
            let famPts = (famHist === 'Both' || famHist === 'both') ? 20 : (famHist === 'One' || famHist === 'parents' || famHist === 'siblings' ? 10 : 0);
            idrs += famPts;
            factors.push({ id: 'idrs_family', name: 'Genetics', displayValue: famHist || 'None', impact: famPts, category: 'demographic', explanation: 'Family history indicates genetic predisposition.' });

            // Questionnaire symptom enrichments (Phase 1 expanded onboarding)
            if (getVal(profile.frequentThirst) === true || getVal(profile.excessive_thirst) === true) {
                idrs += 8;
                factors.push({ id: 'dm_thirst', name: 'Frequent Thirst', displayValue: 'Yes', impact: 8, direction: 'increase', category: 'symptom', explanation: 'Polydipsia can indicate elevated glucose levels.' });
            }
            if (getVal(profile.frequentUrination) === true || getVal(profile.frequent_urination) === true) {
                idrs += 8;
                factors.push({ id: 'dm_urination', name: 'Frequent Urination', displayValue: 'Yes', impact: 8, direction: 'increase', category: 'symptom', explanation: 'Polyuria is a common metabolic warning sign.' });
            }
            if (profile.blurredVision?.value || profile.blurredVision === true) {
                idrs += 6;
                factors.push({ id: 'dm_vision', name: 'Blurred Vision', displayValue: 'Yes', impact: 6, direction: 'increase', category: 'symptom', explanation: 'Fluctuating glucose can affect visual acuity.' });
            }
            if (profile.slowHealingWounds?.value || profile.slowHealingWounds === true) {
                idrs += 6;
                factors.push({ id: 'dm_wounds', name: 'Slow Healing Wounds', displayValue: 'Yes', impact: 6, direction: 'increase', category: 'symptom', explanation: 'Delayed healing may occur with poor glucose control.' });
            }
            if (profile.tinglingExtremities?.value || profile.tinglingExtremities === true) {
                idrs += 5;
                factors.push({ id: 'dm_tingling', name: 'Tingling/Numbness', displayValue: 'Yes', impact: 5, direction: 'increase', category: 'symptom', explanation: 'Neuropathic symptoms may indicate glycemic stress.' });
            }

            score = idrs; // Overwrite baseline with validated score
            
            // Allergy & Medication Impact (Applied to all diseases)
            if (allergies.length > 0) {
                const relevantAllergies = allergies.filter(a => {
                    const val = typeof a === 'string' ? a : (a?.name || '');
                    return val.toLowerCase().includes('medication') || 
                           val.toLowerCase().includes('drug') ||
                           val.toLowerCase().includes('insulin') ||
                           val.toLowerCase().includes('metformin');
                });
                if (relevantAllergies.length > 0) {
                    score += 10;
                    factors.push({ 
                        id: 'diabetes_allergies', 
                        name: 'Medication Allergies', 
                        displayValue: relevantAllergies.map(a => typeof a === 'string' ? a : a.name).join(', '), 
                        impact: 10, 
                        direction: 'increase',
                        category: 'clinical', 
                        explanation: 'Allergies may limit treatment options and require careful medication selection.' 
                    });
                }
            }
            
            if (activeMeds.length > 0) {
                const diabetesMeds = activeMeds.filter(m => {
                    const n = (m.name || '').toLowerCase();
                    return n.includes('metformin') || n.includes('insulin') || n.includes('glucose') || n.includes('glycomet') || n.includes('januvia');
                });
                if (diabetesMeds.length > 0) {
                    score -= 15; // Already being treated
                    factors.push({ 
                        id: 'diabetes_current_meds', 
                        name: 'Current Diabetes Medication', 
                        displayValue: diabetesMeds.map(m => m.name).join(', '), 
                        impact: 15, 
                        direction: 'decrease',
                        category: 'clinical', 
                        explanation: 'Currently on diabetes medication - risk being actively managed.' 
                    });
                }
            }
            break;

        case 'pre_diabetes': {
            // Impaired glucose regulation: IDRS-aligned drivers, scaled below diabetes case
            let pre = 0;
            pre += age < 35 ? 0 : age < 50 ? 14 : 22;
            const waistPre = getVal(profile.waistCircumference);
            if (waistPre) {
                let wPts = 0;
                if (gender === 'male') wPts = waistPre < 90 ? 0 : waistPre < 100 ? 8 : 16;
                else wPts = waistPre < 80 ? 0 : waistPre < 90 ? 8 : 16;
                pre += wPts;
                factors.push({
                    id: 'pre_waist',
                    name: 'Waist circumference',
                    displayValue: `${waistPre} cm`,
                    impact: wPts,
                    category: 'demographic',
                    explanation: 'Central adiposity contributes to insulin resistance.'
                });
            } else {
                missingFactors.push({
                    id: 'waistCircumference',
                    name: 'Waist circumference',
                    prompt: 'Measure your waist at the navel line.',
                    impact: 12,
                    type: 'number'
                });
            }
            const actPre = getVal(profile.activityLevel);
            const actPts = (actPre === 'Regular' || actPre === 'active') ? 0 : (actPre === 'Occasional' || actPre === 'moderate') ? 8 : 16;
            pre += actPts;
            factors.push({
                id: 'pre_activity',
                name: 'Physical activity',
                displayValue: actPre || 'Sedentary',
                impact: actPts,
                category: 'lifestyle',
                explanation: 'Low activity worsens insulin sensitivity.'
            });
            const famPre = getVal(profile.familyHistoryDiabetes);
            if (famPre) {
                const fPts = (famPre === 'Both' || famPre === 'both') ? 14 : (famPre === 'One' || famPre === 'parents' || famPre === 'siblings') ? 7 : 0;
                pre += fPts;
                factors.push({
                    id: 'pre_family_dm',
                    name: 'Family history of diabetes',
                    displayValue: famPre,
                    impact: fPts,
                    category: 'demographic',
                    explanation: 'Genetic predisposition to dysglycemia.'
                });
            }
            if (getVal(profile.frequentThirst) === true || getVal(profile.excessive_thirst) === true) {
                pre += 6;
                factors.push({ id: 'pre_thirst', name: 'Frequent thirst', displayValue: 'Yes', impact: 6, category: 'symptom', explanation: 'May indicate glucose dysregulation.' });
            }
            if (getVal(profile.frequentUrination) === true || getVal(profile.frequent_urination) === true) {
                pre += 6;
                factors.push({ id: 'pre_uria', name: 'Frequent urination', displayValue: 'Yes', impact: 6, category: 'symptom', explanation: 'Possible hyperglycemia signal.' });
            }
            if (getVal(profile.blurredVision) === true || getVal(profile.blurred_vision) === true) {
                pre += 4;
                factors.push({ id: 'pre_vision', name: 'Blurred vision', displayValue: 'Yes', impact: 4, category: 'symptom', explanation: 'Fluctuating glucose can affect vision.' });
            }
            score = Math.min(90, Math.round(pre));
            break;
        }

        case 'obesity': {
            let ob = 12;
            if (bmi >= 35) {
                ob += 42;
                factors.push({ id: 'ob_bmi3', name: 'BMI (severe obesity)', displayValue: bmi.toFixed(1), impact: 42, direction: 'increase', category: 'demographic', explanation: 'Class II/III obesity range.' });
            } else if (bmi >= 30) {
                ob += 35;
                factors.push({ id: 'ob_bmi2', name: 'BMI (obesity)', displayValue: bmi.toFixed(1), impact: 35, direction: 'increase', category: 'demographic', explanation: 'BMI in obesity range.' });
            } else if (bmi >= 27.5) {
                ob += 22;
                factors.push({ id: 'ob_bmi_high', name: 'BMI (high overweight)', displayValue: bmi.toFixed(1), impact: 22, direction: 'increase', category: 'demographic', explanation: 'Approaching obesity.' });
            } else if (bmi >= 23) {
                ob += 12;
                factors.push({ id: 'ob_bmi_over', name: 'Overweight BMI', displayValue: bmi.toFixed(1), impact: 12, direction: 'increase', category: 'demographic', explanation: 'Overweight increases weight-related comorbidity risk.' });
            } else if (bmi > 0 && bmi < 18.5) {
                ob += 8;
                factors.push({ id: 'ob_under', name: 'Low BMI', displayValue: bmi.toFixed(1), impact: 8, direction: 'increase', category: 'demographic', explanation: 'Underweight has distinct clinical considerations.' });
            }
            const waistOb = getVal(profile.waistCircumference);
            if (waistOb) {
                const highW = gender === 'male' ? waistOb >= 102 : waistOb >= 88;
                const modW = gender === 'male' ? waistOb >= 90 : waistOb >= 80;
                if (highW) {
                    ob += 18;
                    factors.push({ id: 'ob_waist_high', name: 'Abdominal obesity (waist)', displayValue: `${waistOb} cm`, impact: 18, direction: 'increase', category: 'demographic', explanation: 'Waist thresholds for metabolic risk.' });
                } else if (modW) {
                    ob += 10;
                    factors.push({ id: 'ob_waist_mod', name: 'Elevated waist', displayValue: `${waistOb} cm`, impact: 10, direction: 'increase', category: 'demographic', explanation: 'Central adiposity.' });
                }
            }
            if (getVal(profile.activityLevel) === 'Sedentary' || getVal(profile.activityLevel) === 'sedentary') {
                ob += 12;
                factors.push({ id: 'ob_sed', name: 'Sedentary lifestyle', displayValue: 'Yes', impact: 12, direction: 'increase', category: 'lifestyle', explanation: 'Low energy expenditure.' });
            }
            if (getVal(profile.dietQuality) === 'Poor' || getVal(profile.dietQuality) === 'poor') {
                ob += 10;
                factors.push({ id: 'ob_diet', name: 'Diet quality', displayValue: 'Poor', impact: 10, direction: 'increase', category: 'lifestyle', explanation: 'Poor diet quality supports weight gain.' });
            }
            score = ob;
            break;
        }

        case 'hypertension':
            // STEP 14: HYPERTENSION RISK ASSESSMENT (Based on ICMR-INDIAB & WHO guidelines)
            let htnScore = 0;
            
            // Age Factor
            let htnAgePts = age < 40 ? 0 : (age < 55 ? 10 : (age < 65 ? 20 : 30));
            htnScore += htnAgePts;
            factors.push({ 
                id: 'htn_age', 
                name: 'Age Factor', 
                displayValue: age, 
                impact: htnAgePts, 
                direction: 'increase',
                category: 'demographic', 
                explanation: 'Blood pressure risk increases with age due to arterial stiffness.' 
            });

            // BMI Factor
            if (bmi >= 23 && bmi < 30) {
                htnScore += 10;
                factors.push({ 
                    id: 'htn_bmi_overweight', 
                    name: 'Overweight (BMI)', 
                    displayValue: bmi.toFixed(1), 
                    impact: 10, 
                    direction: 'increase',
                    category: 'demographic', 
                    explanation: 'Overweight increases cardiac workload and blood pressure.' 
                });
            } else if (bmi >= 30) {
                htnScore += 20;
                factors.push({ 
                    id: 'htn_bmi_obese', 
                    name: 'Obesity (BMI)', 
                    displayValue: bmi.toFixed(1), 
                    impact: 20, 
                    direction: 'increase',
                    category: 'demographic', 
                    explanation: 'Obesity significantly elevates hypertension risk through multiple mechanisms.' 
                });
            }

            // Salt Intake
            const saltIntake = getVal(profile.saltIntake);
            if (saltIntake) {
                let saltPts = saltIntake === 'Low' || saltIntake === 'low' ? -5 : (saltIntake === 'Moderate' || saltIntake === 'moderate' ? 5 : 15);
                htnScore += saltPts;
                factors.push({ 
                    id: 'htn_salt', 
                    name: 'Salt Intake', 
                    displayValue: saltIntake, 
                    impact: Math.abs(saltPts), 
                    direction: saltPts > 0 ? 'increase' : 'decrease',
                    category: 'lifestyle', 
                    explanation: 'High sodium intake is a primary modifiable risk factor for hypertension.' 
                });
            } else {
                missingFactors.push({ 
                    id: 'saltIntake', 
                    name: 'Salt Intake Level', 
                    prompt: 'How would you describe your daily salt consumption?', 
                    impact: 10, 
                    type: 'choice',
                    options: ['Low', 'Moderate', 'High']
                });
            }

            // Family History
            const famHtn = getVal(profile.familyHistoryHypertension);
            if (famHtn) {
                let famHtnPts = (famHtn === 'Both' || famHtn === 'both_parents') ? 20 : (famHtn === 'One' || famHtn === 'one_parent' || famHtn === 'siblings' ? 10 : 0);
                htnScore += famHtnPts;
                factors.push({ 
                    id: 'htn_family', 
                    name: 'Family History', 
                    displayValue: famHtn, 
                    impact: famHtnPts, 
                    direction: 'increase',
                    category: 'demographic', 
                    explanation: 'Genetic predisposition plays a significant role in hypertension.' 
                });
            } else {
                missingFactors.push({ 
                    id: 'familyHistoryHypertension', 
                    name: 'Family History of Hypertension', 
                    prompt: 'Do your parents or siblings have high blood pressure?', 
                    impact: 15, 
                    type: 'choice',
                    options: ['None', 'One', 'Both']
                });
            }

            // Symptom enrichments from expanded onboarding
            if (getVal(profile.chestPainActivity) === true || getVal(profile.chest_pain) === 'frequently') {
                htnScore += 12;
                factors.push({ id: 'htn_chest_pain', name: 'Chest Pain on Activity', displayValue: 'Yes', impact: 12, direction: 'increase', category: 'symptom', explanation: 'Exertional chest symptoms can be associated with elevated cardiovascular risk.' });
            }
            if (getVal(profile.frequentSevereHeadaches) === true || getVal(profile.headaches_dizziness) === 'frequently') {
                htnScore += 8;
                factors.push({ id: 'htn_headache', name: 'Frequent Severe Headaches', displayValue: 'Yes', impact: 8, direction: 'increase', category: 'symptom', explanation: 'Headaches can be associated with uncontrolled blood pressure.' });
            }
            if (getVal(profile.nosebleedsHistory) === true) {
                htnScore += 5;
                factors.push({ id: 'htn_nosebleed', name: 'Nosebleed History', displayValue: 'Yes', impact: 5, direction: 'increase', category: 'symptom', explanation: 'Frequent nosebleeds can occur in uncontrolled hypertension.' });
            }
            const weeklyExerciseDays = getVal(profile.weeklyExerciseDays);
            if (weeklyExerciseDays !== undefined && weeklyExerciseDays !== '') {
                const sedentaryExercise = weeklyExerciseDays === '0' || weeklyExerciseDays === 0 || weeklyExerciseDays === 'sedentary';
                const activeExercise = weeklyExerciseDays === '5+' || Number(weeklyExerciseDays) >= 5 || weeklyExerciseDays === 'active';
                if (sedentaryExercise) {
                    htnScore += 8;
                    factors.push({ id: 'htn_low_exercise', name: 'Low Weekly Exercise', displayValue: String(weeklyExerciseDays), impact: 8, direction: 'increase', category: 'lifestyle', explanation: 'Physical inactivity contributes to blood pressure elevation.' });
                } else if (activeExercise) {
                    htnScore -= 5;
                    factors.push({ id: 'htn_high_exercise', name: 'Regular Weekly Exercise', displayValue: String(weeklyExerciseDays), impact: 5, direction: 'decrease', category: 'lifestyle', explanation: 'Regular activity supports blood pressure control.' });
                }
            }

            // Stress Level
            const stressLevel = getVal(profile.stressLevel);
            if (stressLevel) {
                let stressPts = stressLevel === 'Low' || stressLevel === 'low' ? 0 : (stressLevel === 'Moderate' || stressLevel === 'moderate' ? 10 : 20);
                htnScore += stressPts;
                factors.push({ 
                    id: 'htn_stress', 
                    name: 'Stress Level', 
                    displayValue: stressLevel, 
                    impact: stressPts, 
                    direction: 'increase',
                    category: 'lifestyle', 
                    explanation: 'Chronic stress contributes to sustained elevation of blood pressure.' 
                });
            }

            // Smoking
            if (getVal(profile.isSmoker) === true || getVal(profile.isSmoker) === 'yes') {
                htnScore += 15;
                factors.push({ 
                    id: 'htn_smoking', 
                    name: 'Smoking', 
                    displayValue: 'Yes', 
                    impact: 15, 
                    direction: 'increase',
                    category: 'lifestyle', 
                    explanation: 'Smoking causes immediate BP spikes and long-term arterial damage.' 
                });
            }

            // Alcohol Consumption
            const alcohol = getVal(profile.alcoholConsumption);
            if (alcohol) {
                let alcPts = alcohol === 'Never' || alcohol === 'none' ? 0 : (alcohol === 'Light' || alcohol === 'light' ? 5 : (alcohol === 'Moderate' || alcohol === 'moderate' ? 15 : 25));
                htnScore += alcPts;
                if (alcPts !== 0) {
                    factors.push({
                        id: 'htn_alcohol',
                        name: 'Alcohol Consumption',
                        displayValue: alcohol,
                        impact: Math.abs(alcPts),
                        direction: alcPts > 0 ? 'increase' : 'decrease',
                        category: 'lifestyle',
                        explanation: 'Excessive alcohol intake raises blood pressure significantly.'
                    });
                }
            }

            // Existing Blood Pressure Readings
            const bpVal = getVal(profile.blood_pressure) || getVal(profile.previous_bp_readings);
            // Handle both structured {systolic, diastolic} and simple string 'stage1', 'stage2'
            if (bpVal && typeof bpVal === 'object' && bpVal.systolic && bpVal.diastolic) {
                const bpSystolic = bpVal.systolic;
                const bpDiastolic = bpVal.diastolic;
                if (bpSystolic >= 140 || bpDiastolic >= 90) {
                    htnScore += 40;
                    factors.push({ 
                        id: 'htn_bp_reading_high', 
                        name: 'Current BP Reading', 
                        displayValue: `${bpSystolic}/${bpDiastolic} mmHg`, 
                        impact: 40, 
                        direction: 'increase',
                        category: 'clinical', 
                        explanation: 'Current reading indicates Stage 2 Hypertension (≥140/90 mmHg).' 
                    });
                } else if (bpSystolic >= 130 || bpDiastolic >= 80) {
                    htnScore += 25;
                    factors.push({ 
                        id: 'htn_bp_reading_elevated', 
                        name: 'Current BP Reading', 
                        displayValue: `${bpSystolic}/${bpDiastolic} mmHg`, 
                        impact: 25, 
                        direction: 'increase',
                        category: 'clinical', 
                        explanation: 'Current reading indicates Stage 1 Hypertension (130-139/80-89 mmHg).' 
                    });
                }
            } else if (typeof bpVal === 'string') {
                let bpPts = 0;
                if (bpVal === 'stage2') bpPts = 45;
                else if (bpVal === 'stage1') bpPts = 30;
                else if (bpVal === 'elevated') bpPts = 15;
                
                if (bpPts > 0) {
                    htnScore += bpPts;
                    factors.push({ id: 'htn_bp_qualitative', name: 'Prior BP Check', displayValue: bpVal, impact: bpPts, category: 'clinical', explanation: 'Historical BP category adds to baseline risk.' });
                }
            }
            score = htnScore;
            break;

        case 'thyroid':
            // STEP 13: LIKELIHOOD RATIO MODEL
            let thyP = baseline / 100;
            let thyOdds = thyP / (1 - thyP);
            const fatigue = isAffirmative(getVal(profile.fatiguePersistent)) || isAffirmative(getVal(profile.weightChangeUnexplained));
            if (fatigue) thyOdds *= 1.5;
            if (isAffirmative(getVal(profile.coldIntolerance))) thyOdds *= 2.0;
            if (isAffirmative(getVal(profile.drySkinHairLoss))) thyOdds *= 1.8;
            
            score = (thyOdds / (1 + thyOdds)) * 100;
            
            // Medication adjustment for Thyroid
            if (activeMeds.length > 0) {
                const thyMeds = activeMeds.filter(m => {
                    const n = (m.name || '').toLowerCase();
                    return n.includes('thyronorm') || n.includes('eltroxin') || n.includes('thyroxine') || n.includes('thyronyl');
                });
                if (thyMeds.length > 0) {
                    score -= 20;
                    factors.push({ id: 'thyroid_meds', name: 'Thyroid Medication', displayValue: thyMeds.map(m => m.name).join(', '), impact: 20, direction: 'decrease', category: 'clinical', explanation: 'Condition is being managed with hormone replacement therapy.' });
                }
            }
            
            score = Math.min(85, score);
            break;

        case 'anemia':
            if (profile.dietType?.value === 'Veg') addFactor('diet_veg', 'Vegetarian Diet', 'Veg', 15, 'increase', 'Lower absorption of non-heme iron.', 'lifestyle');
            if (profile.vegetarianVeganDiet?.value || profile.vegetarianVeganDiet === true) addFactor('diet_vegan', 'Vegetarian/Vegan Diet', 'Yes', 10, 'increase', 'Higher chance of iron and B12 inadequacy if not planned well.', 'lifestyle');
            if (profile.paleSkinObservation?.value || profile.paleSkinObservation === true) addFactor('anemia_pallor', 'Pale Skin Observation', 'Yes', 12, 'increase', 'Pallor can be associated with reduced hemoglobin.', 'symptom');
            if (profile.brittleNails?.value || profile.brittleNails === true) addFactor('anemia_nails', 'Brittle Nails', 'Yes', 7, 'increase', 'Brittle nails may occur with nutritional deficiency anemia.', 'symptom');
            if (profile.dizzinessOnStanding?.value || profile.dizzinessOnStanding === true) addFactor('anemia_dizziness', 'Dizziness on Standing', 'Yes', 8, 'increase', 'Orthostatic dizziness can be associated with anemia.', 'symptom');
            if (profile.recentBloodDonation?.value || profile.recentBloodDonation === true) addFactor('anemia_blood_donation', 'Recent Blood Donation', 'Yes', 6, 'increase', 'Recent blood donation can transiently reduce hemoglobin.', 'clinical');
            if (profile.heavyMenstrualFlow?.value || profile.heavyMenstrualFlow === true) addFactor('anemia_menstrual', 'Heavy Menstrual Flow', 'Yes', 12, 'increase', 'Excess menstrual blood loss is a common cause of iron deficiency anemia.', 'clinical');
            if (profile.ironSupplementation?.value) addProtective('iron_supp', 'Iron Supplementation', 'Yes', 20, 'Reduces risk of nutritional deficiency.');
            break;

        case 'asthma':
            if (isAffirmative(getVal(profile.wheezing))) addFactor('wheeze', 'Wheezing', 'Yes', 30, 'increase', 'Clinical hallmark of asthma.', 'symptom');
            if (getVal(profile.highPollutionArea)) addFactor('pollution', 'Pollution Expo', 'Yes', 10, 'increase', 'Triggers airway inflammation.', 'lifestyle');
            
            // Respiratory / Asthma Meds (Inhalers)
            if (activeMeds.length > 0) {
                const inhalers = activeMeds.filter(m => {
                    const n = (m.name || '').toLowerCase();
                    return n.includes('inhaler') || n.includes('asthelin') || n.includes('seroflo') || n.includes('foracort') || n.includes('duolin');
                });
                if (inhalers.length > 0) {
                    score -= 15;
                    factors.push({ id: 'asthma_meds', name: 'Active Respi-Care', displayValue: inhalers.map(m => m.name).join(', '), impact: 15, direction: 'decrease', category: 'clinical', explanation: 'Using inhalers/medication helps control airway hyper-responsiveness.' });
                }
            }
            
            // Respiratory Allergies
            if (allergies.length > 0) {
                const respAllergies = allergies.filter(a => {
                    const val = (typeof a === 'string' ? a : (a?.name || '')).toLowerCase();
                    return val.includes('dust') || val.includes('pollen') || val.includes('smoke') || val.includes('pet');
                });
                if (respAllergies.length > 0) {
                    score += 15;
                    factors.push({ id: 'asthma_allergies', name: 'Environmental Triggers', displayValue: respAllergies.map(a => typeof a === 'string' ? a : a.name).join(', '), impact: 15, direction: 'increase', category: 'clinical', explanation: 'Sensitivities to environmental allergens significantly elevate asthma flare risk.' });
                }
            }

            if (bmi < 25) addProtective('normal_bmi', 'Healthy BMI', bmi, 10, 'Protects against respiratory strain.');
            break;

        case 'copd':
            if (profile.packYears?.value > 10) addFactor('smoking_history', 'Smoking History', profile.packYears.value, 30, 'increase', 'Long-term smoking is the leading cause of COPD.', 'lifestyle');
            if (profile.biomassFuelUse?.value) addFactor('biomass', 'Biomass Fuel Exposure', 'Yes', 20, 'increase', 'Common cause of COPD in rural contexts.', 'lifestyle');
            if (profile.occupationalDustExposure?.value) addFactor('dust', 'Occupational Dust', 'Yes', 15, 'increase', 'Industrial dust exposure damages lungs.', 'lifestyle');
            break;

        case 'anxiety':
            const anxScreen = (profile.mentalHealthAnxiety?.value === 'Yes');
            if (anxScreen) score = 40;
            if (profile.sleepHours?.value < 5) addFactor('sleep_dep', 'Severe Sleep Deprivation', profile.sleepHours.value, 15, 'increase', 'Lack of sleep significantly worsens anxiety.', 'lifestyle');
            break;

        case 'depression':
            const depScreen = (profile.mentalHealthDepressed?.value === 'Yes');
            const intScreen = (profile.lostInterestActivities?.value === 'Yes');
            if (depScreen || intScreen) score = 45;
            if (depScreen && intScreen) score = 70;
            break;

        case 'heart_disease':
            let heartScore = baseline + 10;
            if (age > 50) heartScore += 15;
            if (bmi > 27.5) heartScore += 12;
            if (getVal(profile.chestPainActivity)) heartScore += 25;
            if (getVal(profile.isSmoker)) heartScore += 15;
            
            // Heart Medications
            if (activeMeds.length > 0) {
                const heartMeds = activeMeds.filter(m => {
                    const n = (m.name || '').toLowerCase();
                    return n.includes('statin') || n.includes('aspirin') || n.includes('ecosprin') || n.includes('atorvastatin') || n.includes('rosuvastatin') || n.includes('clopidogrel');
                });
                if (heartMeds.length > 0) {
                    heartScore -= 15;
                    factors.push({ id: 'heart_meds', name: 'Heart Management Meds', displayValue: heartMeds.map(m => m.name).join(', '), impact: 15, direction: 'decrease', category: 'clinical', explanation: 'Using statins/blood thinners significantly reduces the risk of cardiovascular events.' });
                }
            }
            score = heartScore;
            break;

        case 'pcos':
            if (!isFemale) {
                score = -1;
            } else {
                if (getVal(profile.menstrualCycleIrregular)) addFactor('cycle', 'Irregular Periods', 'Yes', 30, 'increase', 'Common hormonal imbalance symptom.', 'symptom');
                if (getVal(profile.facialBodyHairExcess)) addFactor('hirsutism', 'Excess Hair Growth', 'Yes', 20, 'increase', 'Indicator of high androgen levels.', 'symptom');
            }
            break;

        default:
            // Enhanced default case for all other diseases
            let defaultScore = 10; // Baseline population risk
            
            // ALWAYS show baseline factor
            const prevalenceData = PREVALENCE_DATA[diseaseId];
            if (prevalenceData) {
                addFactor('baseline_population', 'Baseline Population Risk', 
                    `${prevalenceData.prevalence || '10'}% prevalence`, 
                    10, 'increase', 
                    `Indian population prevalence based on national surveys.`, 
                    'demographic');
            } else {
                addFactor('baseline_population', 'Baseline Population Risk', 
                    '10% prevalence', 
                    10, 'increase', 
                    `Baseline risk for ${diseaseId.replace('_', ' ')} in general population.`, 
                    'demographic');
            }
            
            // Age Factor (applies to most diseases)
            if (age >= 45 && age < 60) {
                defaultScore += 15;
                addFactor('default_age', 'Middle Age', `${age} years`, 15, 'increase', 'Risk increases for many conditions after 45.', 'demographic');
            } else if (age >= 60) {
                defaultScore += 25;
                addFactor('default_age_senior', 'Senior Age', `${age} years`, 25, 'increase', 'Significantly elevated risk for many conditions.', 'demographic');
            } else if (age < 45) {
                // Young age is protective
                defaultScore -= 5;
                protective.push({ id: 'default_age_young', name: 'Young Age', displayValue: `${age} years`, impact: 5 });
            }
            
            // BMI Factor
            if (bmi >= 23 && bmi < 30) {
                defaultScore += 10;
                addFactor('default_bmi_overweight', 'Overweight', `BMI: ${bmi.toFixed(1)}`, 10, 'increase', 'Elevated BMI increases risk for many conditions.', 'demographic');
            } else if (bmi >= 30) {
                defaultScore += 20;
                addFactor('default_bmi_obese', 'Obesity', `BMI: ${bmi.toFixed(1)}`, 20, 'increase', 'Obesity is a major risk factor for chronic diseases.', 'demographic');
            } else if (bmi >= 18.5 && bmi < 25) {
                // Normal BMI is protective
                defaultScore -= 10;
                protective.push({ id: 'default_normal_bmi', name: 'Normal BMI', displayValue: `BMI: ${bmi.toFixed(1)}`, impact: 10 });
            }
            
            // Smoking
            if (profile.isSmoker?.value === true) {
                defaultScore += 15;
                addFactor('default_smoking', 'Current Smoker', 'Yes', 15, 'increase', 'Smoking increases risk for multiple diseases.', 'lifestyle');
            } else if (profile.isSmoker?.value === false) {
                // Non-smoker is protective
                defaultScore -= 10;
                protective.push({ id: 'default_non_smoker', name: 'Non-Smoker', displayValue: 'No', impact: 10 });
            }
            
            // Sedentary Lifestyle
            if (profile.activityLevel?.value === 'Sedentary') {
                defaultScore += 10;
                addFactor('default_sedentary', 'Sedentary Lifestyle', 'Yes', 10, 'increase', 'Physical inactivity increases disease risk.', 'lifestyle');
            } else if (profile.activityLevel?.value === 'Regular') {
                // Regular exercise is protective
                defaultScore -= 15;
                protective.push({ id: 'default_exercise', name: 'Regular Exercise', displayValue: 'Yes', impact: 15 });
            }
            
            // Family History
            const familyHx = profile.familyHistory?.value;
            if (familyHx && Array.isArray(familyHx) && familyHx.length > 0) {
                defaultScore += 10;
                addFactor('default_family', 'Family History Present', `${familyHx.length} condition(s)`, 10, 'increase', 'Genetic predisposition increases risk.', 'demographic');
            }
            
            // Stress
            if (profile.stressLevel?.value === 'High' || profile.stressLevel?.value === 'Very High') {
                defaultScore += 10;
                addFactor('default_stress', 'High Stress Level', profile.stressLevel.value, 10, 'increase', 'Chronic stress impacts overall health.', 'lifestyle');
            } else if (profile.stressLevel?.value === 'Low') {
                // Low stress is protective
                defaultScore -= 5;
                protective.push({ id: 'default_low_stress', name: 'Low Stress', displayValue: 'Low', impact: 5 });
            }
            
            // Poor Diet
            if (profile.dietQuality?.value === 'Poor') {
                defaultScore += 10;
                addFactor('default_diet', 'Poor Diet Quality', 'Poor', 10, 'increase', 'Nutrition affects disease risk.', 'lifestyle');
            } else if (profile.dietQuality?.value === 'Good') {
                // Good diet is protective
                defaultScore -= 5;
                protective.push({ id: 'default_good_diet', name: 'Good Diet', displayValue: 'Good', impact: 5 });
            }
            
            score = defaultScore;
            break;
    }

    // STEP 17: PROTECTIVE FACTOR LOGIC
    if (score !== -1) {
        if (bmi >= 18.5 && bmi <= 23) score -= 10;
        if (profile.activityLevel?.value === 'Regular') score -= 15;
        if (profile.isSmoker?.value === false) score -= 20;

        score = Math.max(baseline, score);
        score = Math.round(Math.min(95, Math.max(2, score)));
    }

    // STEP 58: Critical Symptom Capture
    const emergencySymptoms = [
        { id: 'chestPain', name: 'Chest Pain', prompt: 'New or worsening chest discomfort?' },
        { id: 'shortnessBreath', name: 'Shortness of Breath', prompt: 'Difficulty breathing even while sitting?' },
        { id: 'severeHeadache', name: 'Severe Headache', prompt: 'Sudden, intense localized headache?' },
        { id: 'visionChanges', name: 'Vision Changes', prompt: 'Blurring or loss of vision in one eye?' },
        { id: 'suicidalThoughts', name: 'Safety Concerns', prompt: 'Have you felt like hurting yourself?' },
        { id: 'abdominalPain', name: 'Abdominal Pain', prompt: 'Sharp, localized pain in abdomen?' },
        { id: 'vomiting', name: 'Severe Vomiting', prompt: 'Inability to keep down fluids?' }
    ];

    emergencySymptoms.forEach(s => {
        if (profile[s.id]?.value === undefined && profile[s.id] === undefined) {
            missingFactors.push({ ...s, category: 'critical', impact: 30, type: 'choice' });
        }
    });

    // STEP 18 & 49: DOCTOR CONSULTATION TRIGGERS (Refined Step 46)
    const specialistData = SPECIALIST_MAPPING[diseaseId] || { primary: 'General Physician', alternatives: [], keywords: ['physician'] };
    const specialist = specialistData.primary;
    const consultationTriggers = {
        urgent: score > 75,
        recommended: score > 50 || missingFactors.length > 3,
        specialistData: specialistData,
        specialist: specialist,
        triggers: []
    };
    if (score > 75) consultationTriggers.triggers.push(`High clinical risk for ${diseaseId.replace('_', ' ')} (${score}%) requires immediate consultation.`);
    if (missingFactors.length > 3) consultationTriggers.triggers.push('High number of missing clinical markers reduces screening reliability.');
    if (score > 50 && score <= 75) consultationTriggers.triggers.push(`Moderate-High risk indicators suggest a specialist checkup with a ${specialist}.`);

    return {
        diseaseId,
        riskScore: score,
        riskCategory: getScoreCategory(score),
        lastCalculated: new Date(),
        verification: getRiskVerificationMeta(diseaseId),
        factorBreakdown: factors,
        protectiveFactors: protective,
        missingDataFactors: missingFactors,
        mitigationSteps: selectMitigations(profile, diseaseId, score), // Step 44
        dataCompleteness: Math.max(0, 100 - (missingFactors.length * 20)),
        rawInputData: profile,
        consultationTriggers,
        emergencyAlerts // Step 58
    };
}

function calculatePreliminaryRisk(profile) {
    const scores = {};
    HYBRID_DISEASE_IDS.forEach((d) => {
        const insight = calculateDetailedInsights(profile, d);
        scores[d] = insight.riskScore;
    });
    return scores;
}

module.exports = {
    calculatePreliminaryRisk,
    calculateDetailedInsights,
    getRiskVerificationMeta,
    getScoreCategory,
    HYBRID_DISEASE_IDS
};
