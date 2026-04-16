// Disease-specific questionnaires for detailed risk assessment
// Each disease has targeted questions to calculate accurate risk

const DISEASE_QUESTIONNAIRES = {
    diabetes: {
        title: "Diabetes Risk Assessment",
        description: "Answer these questions to get a personalized diabetes risk calculation based on IDRS (Indian Diabetes Risk Score) and clinical guidelines.",
        estimatedTime: "2-3 minutes",
        questions: [
            {
                id: 'diabetes_family_history',
                question: "Do you have a family history of diabetes?",
                type: 'choice',
                options: [
                    { value: 'no', label: 'No', points: 0 },
                    { value: 'siblings', label: 'Yes - Siblings', points: 15 },
                    { value: 'parents', label: 'Yes - Parents', points: 10 },
                    { value: 'both', label: 'Yes - Both', points: 20 }
                ],
                weight: 'high',
                category: 'demographic'
            },
            {
                id: 'waist_circumference',
                question: "What is your waist circumference?",
                type: 'number',
                unit: 'cm',
                placeholder: 'e.g., 85',
                scoring: (value, gender) => {
                    if (gender === 'Male') {
                        return value >= 90 ? { points: 15, risk: 'high' } : { points: 0, risk: 'low' };
                    } else {
                        return value >= 80 ? { points: 15, risk: 'high' } : { points: 0, risk: 'low' };
                    }
                },
                weight: 'high',
                category: 'demographic'
            },
            {
                id: 'physical_activity',
                question: "How physically active are you?",
                type: 'choice',
                options: [
                    { value: 'sedentary', label: 'Sedentary (No exercise)', points: 30 },
                    { value: 'light', label: 'Light (1-2 days/week)', points: 20 },
                    { value: 'moderate', label: 'Moderate (3-4 days/week)', points: 10 },
                    { value: 'active', label: 'Active (5+ days/week)', points: 0 }
                ],
                weight: 'high',
                category: 'lifestyle'
            },
            {
                id: 'diet_pattern',
                question: "What best describes your diet?",
                type: 'choice',
                options: [
                    { value: 'high_sugar', label: 'High sugar/refined carbs', points: 25 },
                    { value: 'balanced', label: 'Balanced diet', points: 10 },
                    { value: 'healthy', label: 'Healthy, whole foods', points: 0 },
                    { value: 'low_carb', label: 'Low carb/Keto', points: -5 }
                ],
                weight: 'medium',
                category: 'lifestyle'
            },
            {
                id: 'previous_glucose',
                question: "Have you had your blood sugar tested before?",
                type: 'choice',
                options: [
                    { value: 'never', label: 'Never tested', points: 5 },
                    { value: 'normal', label: 'Yes - Normal results', points: 0 },
                    { value: 'prediabetes', label: 'Yes - Pre-diabetes', points: 30 },
                    { value: 'high', label: 'Yes - High/borderline', points: 25 }
                ],
                weight: 'high',
                category: 'clinical'
            },
            {
                id: 'gestational_diabetes',
                question: "For women: Did you have diabetes during pregnancy?",
                type: 'choice',
                conditional: { field: 'gender', value: 'Female' },
                options: [
                    { value: 'no', label: 'No / Not applicable', points: 0 },
                    { value: 'yes', label: 'Yes', points: 25 },
                    { value: 'unsure', label: 'Unsure', points: 10 }
                ],
                weight: 'high',
                category: 'clinical'
            },
            {
                id: 'pcos_history',
                question: "Do you have PCOS (Polycystic Ovary Syndrome)?",
                type: 'choice',
                conditional: { field: 'gender', value: 'Female' },
                options: [
                    { value: 'no', label: 'No', points: 0 },
                    { value: 'yes', label: 'Yes', points: 20 },
                    { value: 'unsure', label: 'Unsure', points: 5 }
                ],
                weight: 'medium',
                category: 'clinical'
            },
            {
                id: 'symptoms',
                question: "Are you experiencing any of these symptoms?",
                type: 'multi-select',
                options: [
                    { value: 'frequent_urination', label: 'Frequent urination', points: 10 },
                    { value: 'excessive_thirst', label: 'Excessive thirst', points: 10 },
                    { value: 'unexplained_weight_loss', label: 'Unexplained weight loss', points: 15 },
                    { value: 'fatigue', label: 'Constant fatigue', points: 5 },
                    { value: 'blurred_vision', label: 'Blurred vision', points: 10 },
                    { value: 'slow_healing', label: 'Slow wound healing', points: 10 },
                    { value: 'none', label: 'None of these', points: 0 }
                ],
                weight: 'medium',
                category: 'symptom'
            }
        ]
    },

    hypertension: {
        title: "Hypertension Risk Assessment",
        description: "Complete this assessment based on ICMR-INDIAB and WHO guidelines for accurate blood pressure risk calculation.",
        estimatedTime: "2-3 minutes",
        questions: [
            {
                id: 'family_history_htn',
                question: "Do you have a family history of high blood pressure?",
                type: 'choice',
                options: [
                    { value: 'no', label: 'No', points: 0 },
                    { value: 'one_parent', label: 'One parent', points: 15 },
                    { value: 'both_parents', label: 'Both parents', points: 25 },
                    { value: 'siblings', label: 'Siblings', points: 10 }
                ],
                weight: 'high',
                category: 'demographic'
            },
            {
                id: 'salt_intake',
                question: "How would you describe your salt intake?",
                type: 'choice',
                options: [
                    { value: 'low', label: 'Low (rarely add salt)', points: -5 },
                    { value: 'moderate', label: 'Moderate (normal use)', points: 5 },
                    { value: 'high', label: 'High (love salty foods)', points: 15 },
                    { value: 'very_high', label: 'Very high (processed foods often)', points: 25 }
                ],
                weight: 'high',
                category: 'lifestyle'
            },
            {
                id: 'alcohol_consumption',
                question: "How much alcohol do you consume?",
                type: 'choice',
                options: [
                    { value: 'none', label: 'None', points: 0 },
                    { value: 'light', label: 'Light (1-2 drinks/week)', points: 5 },
                    { value: 'moderate', label: 'Moderate (3-7 drinks/week)', points: 15 },
                    { value: 'heavy', label: 'Heavy (8+ drinks/week)', points: 25 }
                ],
                weight: 'high',
                category: 'lifestyle'
            },
            {
                id: 'stress_level',
                question: "How would you rate your stress level?",
                type: 'choice',
                options: [
                    { value: 'low', label: 'Low stress', points: 0 },
                    { value: 'moderate', label: 'Moderate stress', points: 10 },
                    { value: 'high', label: 'High stress', points: 20 },
                    { value: 'very_high', label: 'Very high/chronic stress', points: 30 }
                ],
                weight: 'medium',
                category: 'lifestyle'
            },
            {
                id: 'sleep_quality',
                question: "How is your sleep quality?",
                type: 'choice',
                options: [
                    { value: 'good', label: 'Good (7-8 hours, restful)', points: 0 },
                    { value: 'fair', label: 'Fair (6-7 hours)', points: 5 },
                    { value: 'poor', label: 'Poor (<6 hours or restless)', points: 15 },
                    { value: 'insomnia', label: 'Insomnia/sleep disorders', points: 20 }
                ],
                weight: 'medium',
                category: 'lifestyle'
            },
            {
                id: 'previous_bp_readings',
                question: "What were your previous BP readings?",
                type: 'choice',
                options: [
                    { value: 'normal', label: 'Normal (<120/80)', points: 0 },
                    { value: 'elevated', label: 'Elevated (120-129/<80)', points: 15 },
                    { value: 'stage1', label: 'Stage 1 (130-139/80-89)', points: 30 },
                    { value: 'stage2', label: 'Stage 2 (≥140/90)', points: 45 },
                    { value: 'never_checked', label: 'Never checked', points: 10 }
                ],
                weight: 'critical',
                category: 'clinical'
            },
            {
                id: 'headaches_dizziness',
                question: "Do you experience frequent headaches or dizziness?",
                type: 'choice',
                options: [
                    { value: 'never', label: 'Never', points: 0 },
                    { value: 'rarely', label: 'Rarely', points: 5 },
                    { value: 'sometimes', label: 'Sometimes', points: 15 },
                    { value: 'frequently', label: 'Frequently', points: 25 }
                ],
                weight: 'medium',
                category: 'symptom'
            },
            {
                id: 'kidney_disease',
                question: "Do you have any kidney disease?",
                type: 'choice',
                options: [
                    { value: 'no', label: 'No', points: 0 },
                    { value: 'yes', label: 'Yes', points: 30 },
                    { value: 'unsure', label: 'Unsure', points: 10 }
                ],
                weight: 'high',
                category: 'clinical'
            }
        ]
    },

    thyroid: {
        title: "Thyroid Disorder Risk Assessment",
        description: "Answer these questions to assess your risk of thyroid disorders including hypothyroidism and hyperthyroidism.",
        estimatedTime: "2 minutes",
        questions: [
            {
                id: 'family_history_thyroid',
                question: "Do you have a family history of thyroid disorders?",
                type: 'choice',
                options: [
                    { value: 'no', label: 'No', points: 0 },
                    { value: 'yes', label: 'Yes', points: 25 },
                    { value: 'unsure', label: 'Unsure', points: 10 }
                ],
                weight: 'high',
                category: 'demographic'
            },
            {
                id: 'weight_changes',
                question: "Have you experienced unexplained weight changes?",
                type: 'choice',
                options: [
                    { value: 'none', label: 'No changes', points: 0 },
                    { value: 'gain', label: 'Unexplained weight gain', points: 20 },
                    { value: 'loss', label: 'Unexplained weight loss', points: 20 },
                    { value: 'fluctuation', label: 'Frequent fluctuations', points: 15 }
                ],
                weight: 'high',
                category: 'symptom'
            },
            {
                id: 'fatigue_level',
                question: "How is your energy level?",
                type: 'choice',
                options: [
                    { value: 'normal', label: 'Normal energy', points: 0 },
                    { value: 'mild_fatigue', label: 'Mild fatigue', points: 10 },
                    { value: 'severe_fatigue', label: 'Severe fatigue/exhaustion', points: 25 },
                    { value: 'hyperactive', label: 'Restless/hyperactive', points: 15 }
                ],
                weight: 'medium',
                category: 'symptom'
            },
            {
                id: 'temperature_sensitivity',
                question: "Are you sensitive to temperature?",
                type: 'choice',
                options: [
                    { value: 'none', label: 'No sensitivity', points: 0 },
                    { value: 'cold', label: 'Always feel cold', points: 20 },
                    { value: 'heat', label: 'Always feel hot', points: 20 },
                    { value: 'both', label: 'Both cold and heat sensitivity', points: 15 }
                ],
                weight: 'medium',
                category: 'symptom'
            },
            {
                id: 'hair_skin_changes',
                question: "Have you noticed hair or skin changes?",
                type: 'multi-select',
                options: [
                    { value: 'hair_loss', label: 'Hair loss/thinning', points: 10 },
                    { value: 'dry_skin', label: 'Dry skin', points: 10 },
                    { value: 'brittle_nails', label: 'Brittle nails', points: 5 },
                    { value: 'puffy_face', label: 'Puffy face', points: 15 },
                    { value: 'none', label: 'No changes', points: 0 }
                ],
                weight: 'medium',
                category: 'symptom'
            },
            {
                id: 'neck_swelling',
                question: "Do you have any swelling in the neck area?",
                type: 'choice',
                options: [
                    { value: 'no', label: 'No', points: 0 },
                    { value: 'yes_small', label: 'Yes - small lump', points: 20 },
                    { value: 'yes_large', label: 'Yes - visible swelling', points: 30 },
                    { value: 'unsure', label: 'Unsure', points: 10 }
                ],
                weight: 'high',
                category: 'symptom'
            },
            {
                id: 'previous_thyroid_test',
                question: "Have you had thyroid tests (TSH, T3, T4)?",
                type: 'choice',
                options: [
                    { value: 'normal', label: 'Yes - Normal', points: 0 },
                    { value: 'abnormal', label: 'Yes - Abnormal', points: 35 },
                    { value: 'borderline', label: 'Yes - Borderline', points: 20 },
                    { value: 'never', label: 'Never tested', points: 10 }
                ],
                weight: 'critical',
                category: 'clinical'
            },
            {
                id: 'autoimmune_conditions',
                question: "Do you have any autoimmune conditions?",
                type: 'choice',
                options: [
                    { value: 'no', label: 'No', points: 0 },
                    { value: 'type1_diabetes', label: 'Type 1 Diabetes', points: 15 },
                    { value: 'celiac', label: 'Celiac disease', points: 15 },
                    { value: 'rheumatoid', label: 'Rheumatoid arthritis', points: 15 },
                    { value: 'other', label: 'Other autoimmune', points: 15 }
                ],
                weight: 'medium',
                category: 'clinical'
            }
        ]
    },

    heart_disease: {
        title: "Heart Disease Risk Assessment",
        description: "Comprehensive cardiovascular risk assessment based on Framingham and Indian-specific risk factors.",
        estimatedTime: "3 minutes",
        questions: [
            {
                id: 'chest_pain',
                question: "Do you experience chest pain or discomfort?",
                type: 'choice',
                options: [
                    { value: 'never', label: 'Never', points: 0 },
                    { value: 'rarely', label: 'Rarely (with extreme exertion)', points: 15 },
                    { value: 'sometimes', label: 'Sometimes (with moderate activity)', points: 30 },
                    { value: 'frequently', label: 'Frequently (even at rest)', points: 50 }
                ],
                weight: 'critical',
                category: 'symptom'
            },
            {
                id: 'breathlessness',
                question: "Do you get breathless easily?",
                type: 'choice',
                options: [
                    { value: 'never', label: 'Never', points: 0 },
                    { value: 'stairs', label: 'Only climbing stairs', points: 15 },
                    { value: 'walking', label: 'While walking on level ground', points: 30 },
                    { value: 'rest', label: 'Even at rest', points: 50 }
                ],
                weight: 'critical',
                category: 'symptom'
            },
            {
                id: 'cholesterol_history',
                question: "What is your cholesterol history?",
                type: 'choice',
                options: [
                    { value: 'normal', label: 'Normal (<200 mg/dL)', points: 0 },
                    { value: 'borderline', label: 'Borderline (200-239)', points: 20 },
                    { value: 'high', label: 'High (≥240)', points: 35 },
                    { value: 'never_tested', label: 'Never tested', points: 15 }
                ],
                weight: 'critical',
                category: 'clinical'
            },
            {
                id: 'family_heart_history',
                question: "Family history of heart disease?",
                type: 'choice',
                options: [
                    { value: 'no', label: 'No', points: 0 },
                    { value: 'grandparents', label: 'Grandparents', points: 10 },
                    { value: 'parents_late', label: 'Parents (after 65)', points: 20 },
                    { value: 'parents_early', label: 'Parents (before 55M/65F)', points: 35 },
                    { value: 'siblings', label: 'Siblings', points: 30 }
                ],
                weight: 'critical',
                category: 'demographic'
            },
            {
                id: 'palpitations',
                question: "Do you experience heart palpitations?",
                type: 'choice',
                options: [
                    { value: 'never', label: 'Never', points: 0 },
                    { value: 'rarely', label: 'Rarely', points: 10 },
                    { value: 'sometimes', label: 'Sometimes', points: 20 },
                    { value: 'frequently', label: 'Frequently', points: 30 }
                ],
                weight: 'high',
                category: 'symptom'
            },
            {
                id: 'leg_swelling',
                question: "Do you have swelling in your legs/ankles?",
                type: 'choice',
                options: [
                    { value: 'never', label: 'Never', points: 0 },
                    { value: 'end_of_day', label: 'Only at end of day', points: 10 },
                    { value: 'persistent', label: 'Persistent swelling', points: 25 },
                    { value: 'severe', label: 'Severe/pitting edema', points: 35 }
                ],
                weight: 'high',
                category: 'symptom'
            },
            {
                id: 'exercise_tolerance',
                question: "How is your exercise tolerance?",
                type: 'choice',
                options: [
                    { value: 'excellent', label: 'Excellent (can run/exercise)', points: 0 },
                    { value: 'good', label: 'Good (can walk briskly)', points: 5 },
                    { value: 'fair', label: 'Fair (limited activity)', points: 15 },
                    { value: 'poor', label: 'Poor (can\'t exercise)', points: 25 }
                ],
                weight: 'medium',
                category: 'symptom'
            },
            {
                id: 'previous_cardiac_events',
                question: "Have you had any previous cardiac events?",
                type: 'multi-select',
                options: [
                    { value: 'none', label: 'None', points: 0 },
                    { value: 'heart_attack', label: 'Heart attack', points: 50 },
                    { value: 'angioplasty', label: 'Angioplasty/stent', points: 45 },
                    { value: 'bypass', label: 'Bypass surgery', points: 50 },
                    { value: 'stroke', label: 'Stroke/TIA', points: 40 }
                ],
                weight: 'critical',
                category: 'clinical'
            }
        ]
    },

    obesity: {
        title: "Obesity & Metabolic Health Assessment",
        description: "Detailed assessment of obesity risk factors and metabolic health indicators.",
        estimatedTime: "2 minutes",
        questions: [
            {
                id: 'weight_trend',
                question: "How has your weight changed in the past year?",
                type: 'choice',
                options: [
                    { value: 'stable', label: 'Stable (±2 kg)', points: 0 },
                    { value: 'gradual_gain', label: 'Gradual gain (3-5 kg)', points: 15 },
                    { value: 'rapid_gain', label: 'Rapid gain (>5 kg)', points: 25 },
                    { value: 'fluctuating', label: 'Constantly fluctuating', points: 10 }
                ],
                weight: 'high',
                category: 'symptom'
            },
            {
                id: 'eating_patterns',
                question: "What best describes your eating patterns?",
                type: 'multi-select',
                options: [
                    { value: 'emotional_eating', label: 'Emotional eating', points: 10 },
                    { value: 'night_eating', label: 'Late night eating', points: 10 },
                    { value: 'binge_eating', label: 'Binge eating episodes', points: 15 },
                    { value: 'frequent_snacking', label: 'Frequent snacking', points: 10 },
                    { value: 'large_portions', label: 'Large portions', points: 10 },
                    { value: 'none', label: 'None of these', points: 0 }
                ],
                weight: 'high',
                category: 'lifestyle'
            },
            {
                id: 'weight_loss_attempts',
                question: "Have you tried to lose weight before?",
                type: 'choice',
                options: [
                    { value: 'never', label: 'Never tried', points: 5 },
                    { value: 'sometimes', label: 'Tried but regained', points: 15 },
                    { value: 'multiple', label: 'Multiple attempts', points: 20 },
                    { value: 'successful', label: 'Successfully maintained', points: 0 }
                ],
                weight: 'medium',
                category: 'lifestyle'
            },
            {
                id: 'comorbidities',
                question: "Do you have any of these conditions?",
                type: 'multi-select',
                options: [
                    { value: 'none', label: 'None', points: 0 },
                    { value: 'diabetes', label: 'Diabetes/Pre-diabetes', points: 20 },
                    { value: 'hypertension', label: 'High blood pressure', points: 15 },
                    { value: 'pcos', label: 'PCOS', points: 15 },
                    { value: 'sleep_apnea', label: 'Sleep apnea', points: 20 },
                    { value: 'joint_pain', label: 'Joint pain', points: 10 }
                ],
                weight: 'high',
                category: 'clinical'
            },
            {
                id: 'family_obesity',
                question: "Does obesity run in your family?",
                type: 'choice',
                options: [
                    { value: 'no', label: 'No', points: 0 },
                    { value: 'some', label: 'Some family members', points: 10 },
                    { value: 'many', label: 'Many family members', points: 20 },
                    { value: 'parents', label: 'Both parents', points: 25 }
                ],
                weight: 'medium',
                category: 'demographic'
            },
            {
                id: 'physical_limitations',
                question: "Does your weight limit physical activities?",
                type: 'choice',
                options: [
                    { value: 'no', label: 'No limitation', points: 0 },
                    { value: 'mild', label: 'Mild limitation', points: 10 },
                    { value: 'moderate', label: 'Moderate limitation', points: 20 },
                    { value: 'severe', label: 'Severe limitation', points: 30 }
                ],
                weight: 'high',
                category: 'symptom'
            }
        ]
    }
};

// Generic questionnaire template for other diseases
const generateGenericQuestionnaire = (diseaseId, diseaseName) => {
    return {
        title: `${diseaseName} Risk Assessment`,
        description: `Complete this assessment to get a personalized ${diseaseName} risk calculation.`,
        estimatedTime: "2 minutes",
        questions: [
            {
                id: `${diseaseId}_family_history`,
                question: `Do you have a family history of ${diseaseName}?`,
                type: 'choice',
                options: [
                    { value: 'no', label: 'No', points: 0 },
                    { value: 'yes', label: 'Yes', points: 25 },
                    { value: 'unsure', label: 'Unsure', points: 10 }
                ],
                weight: 'high',
                category: 'demographic'
            },
            {
                id: `${diseaseId}_symptoms`,
                question: `Are you experiencing any symptoms related to ${diseaseName}?`,
                type: 'choice',
                options: [
                    { value: 'none', label: 'No symptoms', points: 0 },
                    { value: 'mild', label: 'Mild symptoms', points: 15 },
                    { value: 'moderate', label: 'Moderate symptoms', points: 30 },
                    { value: 'severe', label: 'Severe symptoms', points: 45 }
                ],
                weight: 'high',
                category: 'symptom'
            },
            {
                id: `${diseaseId}_previous_diagnosis`,
                question: `Have you been previously diagnosed with ${diseaseName}?`,
                type: 'choice',
                options: [
                    { value: 'no', label: 'No', points: 0 },
                    { value: 'yes', label: 'Yes', points: 40 },
                    { value: 'borderline', label: 'Borderline/Unsure', points: 20 }
                ],
                weight: 'critical',
                category: 'clinical'
            },
            {
                id: `${diseaseId}_lifestyle`,
                question: `How would you rate your lifestyle habits?`,
                type: 'choice',
                options: [
                    { value: 'healthy', label: 'Healthy lifestyle', points: 0 },
                    { value: 'moderate', label: 'Moderate', points: 10 },
                    { value: 'unhealthy', label: 'Unhealthy habits', points: 20 },
                    { value: 'very_unhealthy', label: 'Very unhealthy', points: 30 }
                ],
                weight: 'medium',
                category: 'lifestyle'
            },
            {
                id: `${diseaseId}_medications`,
                question: `Are you currently taking medications for ${diseaseName}?`,
                type: 'choice',
                options: [
                    { value: 'no', label: 'No', points: 0 },
                    { value: 'yes', label: 'Yes', points: 35 },
                    { value: 'past', label: 'Past medications', points: 15 }
                ],
                weight: 'high',
                category: 'clinical'
            },
            {
                id: `${diseaseId}_related_conditions`,
                question: `Do you have any related health conditions?`,
                type: 'multi-select',
                options: [
                    { value: 'none', label: 'None', points: 0 },
                    { value: 'diabetes', label: 'Diabetes', points: 10 },
                    { value: 'hypertension', label: 'Hypertension', points: 10 },
                    { value: 'obesity', label: 'Obesity', points: 10 },
                    { value: 'autoimmune', label: 'Autoimmune disorders', points: 15 }
                ],
                weight: 'medium',
                category: 'clinical'
            }
        ]
    };
};

module.exports = {
    DISEASE_QUESTIONNAIRES,
    generateGenericQuestionnaire
};
