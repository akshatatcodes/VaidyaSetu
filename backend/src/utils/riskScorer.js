const { PREVALENCE_DATA, SCREENING_TOOLS } = require('./prevalenceData');
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
    const age = parseInt(profile.age?.value || profile.age) || 30;
    const gender = (profile.gender?.value || profile.gender || 'Other').toLowerCase();
    const isFemale = gender === 'female';
    const bmi = parseFloat(profile.bmi?.value || profile.bmi) || 22;
    
    // Evaluate Global Emergency Conditions (Step 58)
    const emergencyAlerts = calculateEmergencyAlerts(profile);
    
    let score = 0;
    let factors = [];
    let protective = [];
    let missingFactors = [];

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

    score = baseline;

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
            const waist = profile.waistCircumference?.value;
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
            const activity = profile.activityLevel?.value;
            let actPts = activity === 'Regular' ? 0 : (activity === 'Occasional' ? 10 : 20);
            idrs += actPts;
            factors.push({ id: 'idrs_activity', name: 'Physical Activity', displayValue: activity || 'Sedentary', impact: actPts, category: 'lifestyle', explanation: 'Sedentary lifestyle reduces glucose uptake.' });

            // Family History
            const famHist = profile.familyHistoryDiabetes?.value;
            let famPts = famHist === 'Both' ? 20 : (famHist === 'One' ? 10 : 0);
            idrs += famPts;
            factors.push({ id: 'idrs_family', name: 'Genetics', displayValue: famHist || 'None', impact: famPts, category: 'demographic', explanation: 'Family history indicates genetic predisposition.' });

            score = idrs; // Overwrite baseline with validated score
            
            // Allergy & Medication Impact (Applied to all diseases)
            const allergies = profile.allergies?.value || profile.allergies || [];
            const activeMeds = profile.activeMedications?.value || profile.activeMedications || [];
            
            if (allergies.length > 0) {
                const relevantAllergies = allergies.filter(a => 
                    a.toLowerCase().includes('medication') || 
                    a.toLowerCase().includes('drug') ||
                    a.toLowerCase().includes('insulin') ||
                    a.toLowerCase().includes('metformin')
                );
                if (relevantAllergies.length > 0) {
                    score += 10;
                    factors.push({ 
                        id: 'diabetes_allergies', 
                        name: 'Medication Allergies', 
                        displayValue: relevantAllergies.join(', '), 
                        impact: 10, 
                        direction: 'increase',
                        category: 'clinical', 
                        explanation: 'Allergies may limit treatment options and require careful medication selection.' 
                    });
                }
            }
            
            if (activeMeds.length > 0) {
                const diabetesMeds = activeMeds.filter(m => 
                    m.name?.toLowerCase().includes('metformin') || 
                    m.name?.toLowerCase().includes('insulin') ||
                    m.name?.toLowerCase().includes('glucose')
                );
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
            if (bmi >= 25 && bmi < 30) {
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
            const saltIntake = profile.saltIntake?.value;
            if (saltIntake) {
                let saltPts = saltIntake === 'Low' ? -5 : (saltIntake === 'Moderate' ? 5 : 15);
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
            const famHtn = profile.familyHistoryHypertension?.value;
            if (famHtn) {
                let famHtnPts = famHtn === 'Both' ? 20 : (famHtn === 'One' ? 10 : 0);
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

            // Stress Level
            const stressLevel = profile.stressLevel?.value;
            if (stressLevel) {
                let stressPts = stressLevel === 'Low' ? 0 : (stressLevel === 'Moderate' ? 10 : 20);
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
            if (profile.isSmoker?.value === true) {
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
            const alcohol = profile.alcoholConsumption?.value;
            if (alcohol) {
                let alcPts = alcohol === 'None' ? -5 : (alcohol === 'Moderate' ? 5 : 15);
                htnScore += alcPts;
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

            // Existing Blood Pressure Readings
            const bpSystolic = profile.blood_pressure?.value?.systolic;
            const bpDiastolic = profile.blood_pressure?.value?.diastolic;
            if (bpSystolic && bpDiastolic) {
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
                } else if (bpSystolic >= 120) {
                    htnScore += 10;
                    factors.push({ 
                        id: 'htn_bp_reading_pre', 
                        name: 'Current BP Reading', 
                        displayValue: `${bpSystolic}/${bpDiastolic} mmHg`, 
                        impact: 10, 
                        direction: 'increase',
                        category: 'clinical', 
                        explanation: 'Current reading indicates Elevated BP (120-129/<80 mmHg).' 
                    });
                }
            } else {
                missingFactors.push({ 
                    id: 'blood_pressure', 
                    name: 'Blood Pressure Reading', 
                    prompt: 'Enter your recent blood pressure reading (e.g., 120/80)', 
                    impact: 25, 
                    type: 'blood_pressure'
                });
            }

            score = htnScore;
            
            // Allergy & Medication Impact
            const htnAllergies = profile.allergies?.value || profile.allergies || [];
            const htnActiveMeds = profile.activeMedications?.value || profile.activeMedications || [];
            
            if (htnAllergies.length > 0) {
                const relevantAllergies = htnAllergies.filter(a => 
                    a.toLowerCase().includes('ace') || 
                    a.toLowerCase().includes('beta') ||
                    a.toLowerCase().includes('diuretic') ||
                    a.toLowerCase().includes('lisinopril') ||
                    a.toLowerCase().includes('amlodipine') ||
                    a.toLowerCase().includes('ARB') ||
                    a.toLowerCase().includes('calcium channel')
                );
                if (relevantAllergies.length > 0) {
                    score += 10;
                    factors.push({ 
                        id: 'htn_allergies', 
                        name: 'BP Medication Allergies', 
                        displayValue: relevantAllergies.join(', '), 
                        impact: 10, 
                        direction: 'increase',
                        category: 'clinical', 
                        explanation: 'Allergies to common BP medications limit treatment options.' 
                    });
                }
            }
            
            if (htnActiveMeds.length > 0) {
                const bpMeds = htnActiveMeds.filter(m => 
                    m.name?.toLowerCase().includes('amlodipine') || 
                    m.name?.toLowerCase().includes('losartan') ||
                    m.name?.toLowerCase().includes('lisinopril') ||
                    m.name?.toLowerCase().includes('metoprolol') ||
                    m.name?.toLowerCase().includes('hydrochlorothiazide')
                );
                if (bpMeds.length > 0) {
                    score -= 15; // Already being treated
                    factors.push({ 
                        id: 'htn_current_meds', 
                        name: 'Current BP Medication', 
                        displayValue: bpMeds.map(m => m.name).join(', '), 
                        impact: 15, 
                        direction: 'decrease',
                        category: 'clinical', 
                        explanation: 'Currently on hypertension medication - risk being actively managed.' 
                    });
                }
            }
            break;

        case 'thyroid':
            // STEP 13: LIKELIHOOD RATIO MODEL
            let p = baseline / 100;
            let odds = p / (1 - p);
            if (profile.fatiguePersistent?.value) odds *= 1.5;
            if (profile.weightChangeUnexplained?.value) odds *= 2.0;
            if (profile.coldIntolerance?.value) odds *= 2.5;
            if (profile.drySkinHairLoss?.value) odds *= 1.8;
            score = (odds / (1 + odds)) * 100;
            score = Math.min(80, score);
            if (profile.fatiguePersistent?.value) factors.push({ id: 'lr_fatigue', name: 'Persistent Fatigue', impact: 15, direction: 'increase', category: 'symptom', explanation: 'Strong indicator of metabolic slowdown.' });
            break;

        case 'anemia':
            if (profile.dietType?.value === 'Veg') addFactor('diet_veg', 'Vegetarian Diet', 'Veg', 15, 'increase', 'Lower absorption of non-heme iron.', 'lifestyle');
            if (profile.ironSupplementation?.value) addProtective('iron_supp', 'Iron Supplementation', 'Yes', 20, 'Reduces risk of nutritional deficiency.');
            break;

        case 'asthma':
            if (profile.wheezing?.value) addFactor('wheeze', 'Wheezing', 'Yes', 30, 'increase', 'Clinical hallmark of asthma.', 'symptom');
            if (profile.highPollutionArea?.value) addFactor('pollution', 'Pollution Expo', 'Yes', 10, 'increase', 'Triggers airway inflammation.', 'lifestyle');
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

        case 'pcos':
            if (!isFemale) {
                score = -1;
            } else {
                if (profile.menstrualCycleIrregular?.value) addFactor('cycle', 'Irregular Periods', 'Yes', 30, 'increase', 'Common hormonal imbalance symptom.', 'symptom');
                if (profile.facialBodyHairExcess?.value) addFactor('hirsutism', 'Excess Hair Growth', 'Yes', 20, 'increase', 'Indicator of high androgen levels.', 'symptom');
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
            if (bmi >= 25 && bmi < 30) {
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
    const diseases = [
        'diabetes', 'pre_diabetes', 'obesity', 'thyroid', 'pcos', 'hypertension', 
        'heart_disease', 'stroke', 'asthma', 'copd', 'ckd', 'fatty_liver', 
        'anemia', 'vitamin_d', 'vitamin_b12', 'depression', 'anxiety', 
        'sleep_disorders', 'osteoporosis', 'osteoarthritis'
    ];
    
    const scores = {};
    diseases.forEach(d => {
        const insight = calculateDetailedInsights(profile, d);
        scores[d] = insight.riskScore;
    });
    
    return scores;
}

module.exports = { 
    calculatePreliminaryRisk,
    calculateDetailedInsights,
    getScoreCategory
};
