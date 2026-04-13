function calculatePreliminaryRisk(profile) {
    const scores = {
        diabetes: 0,
        pre_diabetes: 0,
        obesity: 0,
        thyroid: 0,
        pcos: 0,
        hypertension: 0,
        heart_disease: 0,
        stroke: 0,
        asthma: 0,
        copd: 0,
        ckd: 0,
        fatty_liver: 0,
        anemia: 0,
        vitamin_d: 0,
        vitamin_b12: 0,
        depression: 0,
        anxiety: 0,
        osteoporosis: 0
    };

    // --- Core Metrics ---
    const bmi = parseFloat(profile.bmi) || 22;
    const age = parseInt(profile.age) || 30;
    const gender = (profile.gender || 'Other').toLowerCase();
    const isFemale = gender === 'female';
    const isMale = gender === 'male';
    const meds = profile.medicalHistory || [];
    
    // Diagnosis Overrides
    const hasDiabetes = meds.includes('Type 2 Diabetes') || meds.includes('Diabetes');
    const hasHypertension = meds.includes('Hypertension');
    const hasAnemia = meds.includes('Anemia');
    const hasThyroid = meds.includes('Thyroid Disorders');
    const hasPCOS = meds.includes('PCOS');

    // --- 1. METABOLIC CALIBRATION ---
    
    // Diabetes Risk (User Formula: 5% base + adders)
    let diabetesBase = 5;
    if (bmi > 27.5) diabetesBase += 20;
    else if (bmi > 23) diabetesBase += 10;
    if (age > 45) diabetesBase += 10;
    if (profile.sugarIntake === 'High') diabetesBase += 10;
    if (profile.activityLevel === 'Sedentary') diabetesBase += 10;
    if (hasHypertension) diabetesBase += 10;
    // Family history isn't explicitly in profile model but mentioned in user request
    if (profile.familyHistoryDiabetes) diabetesBase += 15; 
    scores.diabetes = diabetesBase;
    scores.pre_diabetes = Math.max(0, diabetesBase - 5);

    // Obesity (User Formula: 19.4 -> 2-5%)
    if (bmi < 18.5) scores.obesity = 5; // Underweight risk
    else if (bmi >= 18.5 && bmi < 23) scores.obesity = 3 + Math.random() * 2; // Normal range (Indian)
    else if (bmi >= 23 && bmi < 27.5) scores.obesity = 25 + (bmi - 23) * 5;
    else scores.obesity = 60 + (bmi - 27.5) * 4;

    // Thyroid
    let thyroidBase = 10;
    if (isFemale) thyroidBase += 15;
    if (profile.fatiguePersistent) thyroidBase += 15;
    if (profile.weightChangeUnexplained) thyroidBase += 15;
    if (profile.familyHistoryThyroid) thyroidBase += 20;
    scores.thyroid = thyroidBase;

    // PCOS (Gender Shield)
    if (isMale) {
        scores.pcos = -1; // -1 represents N/A
    } else if (isFemale) {
        let pcosBase = 10;
        if (profile.menstrualCycleIrregular) pcosBase += 30;
        if (profile.facialBodyHairExcess) pcosBase += 20;
        if (profile.pcosDiagnosis) pcosBase = 95;
        scores.pcos = pcosBase;
    } else {
        scores.pcos = 5; // Unknown for other gender without context
    }

    // --- 2. CARDIOVASCULAR ---
    let hyperBase = 5;
    if (bmi > 23) hyperBase += 15;
    if (profile.saltIntake === 'High') hyperBase += 20;
    if (profile.age > 40) hyperBase += 10;
    scores.hypertension = hyperBase;
    scores.heart_disease = (scores.hypertension * 0.4) + (scores.diabetes * 0.3);

    // --- 3. RESPIRATORY ---
    let asthmaBase = 5;
    if (profile.wheezing || profile.persistentCough) asthmaBase += 30;
    if (profile.highPollutionArea) asthmaBase += 15;
    scores.asthma = asthmaBase;
    scores.copd = (profile.isSmoker ? 40 : 5) + (profile.biomassFuelUse ? 20 : 0);

    // --- 4. RENAL & HEPATIC ---
    scores.ckd = (scores.diabetes * 0.2) + (scores.hypertension * 0.2) + (profile.swellingAnkles ? 20 : 0);
    scores.fatty_liver = (scores.obesity * 0.5) + (profile.alcoholFrequency === 'Frequently' ? 30 : 0);

    // --- 5. NUTRITIONAL CALIBRATION ---
    // Anemia (User Formula: M 5% / F 15%)
    let anemiaBase = isFemale ? 15 : 5;
    if (profile.dietType === 'Veg') anemiaBase += 10;
    if (profile.fatiguePersistent) anemiaBase += 10;
    if (bmi < 18.5) anemiaBase += 10;
    scores.anemia = anemiaBase;

    // --- Final Processing & 95% Cap ---
    Object.keys(scores).forEach(key => {
        if (scores[key] === -1) return; // Preserve N/A
        
        // Diagnosis Overrides (Capped at 95)
        if (key === 'diabetes' && hasDiabetes) scores[key] = 95;
        if (key === 'hypertension' && hasHypertension) scores[key] = 95;
        if (key === 'anemia' && hasAnemia) scores[key] = 95;
        if (key === 'thyroid' && hasThyroid) scores[key] = 95;
        if (key === 'pcos' && hasPCOS && isFemale) scores[key] = 95;

        // Apply Global Cap
        scores[key] = Math.round(Math.min(95, Math.max(2, scores[key])));
    });

    return scores;
}

module.exports = { calculatePreliminaryRisk };
