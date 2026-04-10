/**
 * Rule-Based Scoring Utility
 * Calculates preliminary risk percentages (0-100) based on ICMR thresholds and user demographic data.
 */
function calculatePreliminaryRisk(profile) {
    let diabetes = 0;
    let hypertension = 0;
    let anemia = 0;

    // --- Base Metric Flags ---
    const bmi = profile.bmi || 22; // default normal
    const age = parseInt(profile.age) || 30;
    const isFemale = profile.gender === 'Female';
    const diet = profile.dietType?.toLowerCase() || '';
    const otherCond = (profile.otherConditions || '').toLowerCase();
    
    // Family History parsing (heuristic)
    const hasFamilyHistory = otherCond.includes('family history') || otherCond.includes('father') || otherCond.includes('mother');
    
    // Explicit Diagnosis Overrides - if they selected it in medical history, set risk extreme
    const meds = profile.medicalHistory || [];
    const hasDiabetes = meds.includes('Type 2 Diabetes');
    const hasHypertension = meds.includes('Hypertension');
    const hasAnemia = meds.includes('Anemia');

    // --- DIABETES RISK LOGIC ---
    // BMI points
    if (bmi > 27.5) diabetes += 40; // Obese (ICMR)
    else if (bmi > 23) diabetes += 25; // Overweight (ICMR)
    
    // High sugar
    if (profile.sugarIntake === 'High') diabetes += 20;

    // Family History
    if (hasFamilyHistory) diabetes += 30;

    // Age factor
    if (age > 45) diabetes += 10;
    
    // Activity Factor
    if (profile.activityLevel === 'Sedentary') diabetes += 15;


    // --- HYPERTENSION RISK LOGIC ---
    if (bmi > 27.5) hypertension += 35;
    else if (bmi > 23) hypertension += 20;

    if (profile.saltIntake === 'High') hypertension += 25;
    if (profile.stressLevel === 'High') hypertension += 15;
    
    // Substance factors
    if (profile.isSmoker) hypertension += 20;
    if (profile.alcoholConsumption === 'Frequently') hypertension += 10;
    
    if (hasFamilyHistory) hypertension += 20;


    // --- ANEMIA RISK LOGIC ---
    if (isFemale) anemia += 15;

    // Diet factors
    if (diet === 'veg') anemia += 20;
    if (!profile.eatsLeafyGreens) anemia += 15;

    // Symptom heuristics
    if (otherCond.includes('fatigue') || otherCond.includes('tired')) anemia += 20;
    if (otherCond.includes('pale')) anemia += 15;
    if (otherCond.includes('period') || otherCond.includes('menstruation') && isFemale) anemia += 25;


    // --- FINAL NORMALIZATION ---
    // Cap all at 100
    diabetes = Math.min(100, diabetes);
    hypertension = Math.min(100, hypertension);
    anemia = Math.min(100, anemia);

    // Apply exact diagnosis overrides
    if (hasDiabetes) diabetes = 100;
    if (hasHypertension) hypertension = 100;
    if (hasAnemia) anemia = 100;

    return {
        diabetes,
        hypertension,
        anemia
    };
}

module.exports = { calculatePreliminaryRisk };
