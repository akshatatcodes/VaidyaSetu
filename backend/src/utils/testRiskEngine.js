const { calculateDetailedInsights } = require('./riskScorer');

const personas = [
    {
        name: 'Healthy Young Adult',
        profile: {
            age: { value: 25 },
            gender: { value: 'female' },
            bmi: { value: 21 },
            activityLevel: { value: 'Regular' },
            isSmoker: { value: false }
        }
    },
    {
        name: 'Sedentary Obese Adult (Diabetes Risk)',
        profile: {
            age: { value: 52 },
            gender: { value: 'male' },
            bmi: { value: 31 },
            waistCircumference: { value: 105 },
            activityLevel: { value: 'Sedentary' },
            familyHistoryDiabetes: { value: 'Both' }
        }
    },
    {
        name: 'Urban Smoker (Respiratory Risk)',
        profile: {
            age: { value: 45 },
            gender: { value: 'male' },
            bmi: { value: 24 },
            isSmoker: { value: true },
            packYears: { value: 15 },
            highPollutionArea: { value: 'Yes' },
            wheezing: { value: 'Yes' }
        }
    }
];

const diseasesToTest = ['diabetes', 'hypertension', 'asthma', 'copd', 'depression'];

personas.forEach(p => {
    console.log(`\n--- Testing Persona: ${p.name} ---`);
    diseasesToTest.forEach(d => {
        const insight = calculateDetailedInsights(p.profile, d);
        console.log(`Disease: ${d}`);
        console.log(`Risk Score: ${insight.riskScore} (${insight.riskCategory})`);
        console.log(`Factors: ${insight.factorBreakdown.map(f => f.name).join(', ') || 'None'}`);
        if (insight.missingDataFactors.length > 0) {
            console.log(`Missing Data: ${insight.missingDataFactors.map(f => f.name).join(', ')}`);
        }
    });
});
