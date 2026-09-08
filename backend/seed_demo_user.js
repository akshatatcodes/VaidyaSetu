const mongoose = require('mongoose');

const UserProfile = require('./src/models/UserProfile');
const Vital = require('./src/models/Vital');
const Medication = require('./src/models/Medication');
const LabResult = require('./src/models/LabResult');
const Report = require('./src/models/Report');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    const demoClerkId = 'demo_user_123';

    // 1. Seed User Profile
    await UserProfile.deleteMany({ clerkId: demoClerkId });
    const profile = await UserProfile.create({
      clerkId: demoClerkId,
      name: { value: 'Rajesh Sharma', updateType: 'initial' },
      phone: { value: '+91 9876543210', updateType: 'initial' },
      dob: { value: '1982-08-15', updateType: 'initial' },
      age: { value: 44, updateType: 'initial' },
      gender: { value: 'Male', updateType: 'initial' },
      height: { value: 172, unit: 'cm', updateType: 'initial' },
      weight: { value: 74, unit: 'kg', updateType: 'initial' },
      bmi: { value: 25.0, updateType: 'initial' },
      bmiCategory: { value: 'Overweight', updateType: 'initial' },

      activityLevel: { value: 'Moderate', updateType: 'initial' },
      sleepHours: { value: 7, updateType: 'initial' },
      stressLevel: { value: 'Medium', updateType: 'initial' },
      isSmoker: { value: false, updateType: 'initial' },
      alcoholConsumption: { value: 'Occasional', updateType: 'initial' },

      dietType: { value: 'Vegetarian', updateType: 'initial' },
      sugarIntake: { value: 'Moderate', updateType: 'initial' },
      saltIntake: { value: 'Normal', updateType: 'initial' },
      eatsLeafyGreens: { value: true, updateType: 'initial' },
      eatsFruits: { value: true, updateType: 'initial' },
      junkFoodFrequency: { value: 'Rarely', updateType: 'initial' },

      allergies: { value: ['Penicillin'], updateType: 'initial' },
      medicalHistory: { value: ['Hypertension', 'Pre-diabetes'], updateType: 'initial' },
      otherConditions: { value: 'Mild joint stiffness', updateType: 'initial' },
      onboardingComplete: true,
      dataQualityScore: 92
    });
    console.log('✅ Seeded UserProfile for demo_user_123');

    // 2. Seed Vitals
    await Vital.deleteMany({ clerkId: demoClerkId });
    const vitalsData = [
      {
        clerkId: demoClerkId,
        type: 'blood_pressure',
        value: { systolic: 128, diastolic: 84 },
        unit: 'mmHg',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000)
      },
      {
        clerkId: demoClerkId,
        type: 'heart_rate',
        value: 74,
        unit: 'bpm',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000)
      },
      {
        clerkId: demoClerkId,
        type: 'blood_glucose',
        value: 108,
        unit: 'mg/dL',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000)
      },
      {
        clerkId: demoClerkId,
        type: 'oxygen_saturation',
        value: 98,
        unit: '%',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000)
      },
      {
        clerkId: demoClerkId,
        type: 'body_temperature',
        value: 98.4,
        unit: '°F',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000)
      },
      {
        clerkId: demoClerkId,
        type: 'weight',
        value: 74,
        unit: 'kg',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000)
      },
      {
        clerkId: demoClerkId,
        type: 'steps',
        value: 6840,
        unit: 'steps',
        timestamp: new Date(Date.now() - 1 * 3600 * 1000)
      }
    ];
    await Vital.insertMany(vitalsData);
    console.log('✅ Seeded Vitals');

    // 3. Seed Medications
    await Medication.deleteMany({ clerkId: demoClerkId });
    const medicationsData = [
      {
        clerkId: demoClerkId,
        name: 'Amlodipine',
        dosage: '5mg',
        frequency: 'daily',
        timings: ['08:00'],
        active: true,
        adherence: { totalDoses: 30, takenDoses: 28 }
      },
      {
        clerkId: demoClerkId,
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice_daily',
        timings: ['09:00', '21:00'],
        active: true,
        adherence: { totalDoses: 60, takenDoses: 56 }
      },
      {
        clerkId: demoClerkId,
        name: 'Ashwagandha Churna',
        dosage: '1 tsp with warm milk',
        frequency: 'daily',
        timings: ['21:30'],
        active: true,
        adherence: { totalDoses: 30, takenDoses: 27 }
      }
    ];
    await Medication.insertMany(medicationsData);
    console.log('✅ Seeded Medications');

    // 4. Seed Lab Results
    await LabResult.deleteMany({ clerkId: demoClerkId });
    const labData = [
      {
        clerkId: demoClerkId,
        testName: 'HbA1c (Glycated Hemoglobin)',
        sampleDate: new Date(Date.now() - 15 * 24 * 3600 * 1000),
        resultValue: '5.9',
        unit: '%',
        referenceRange: '4.0 - 5.6'
      },
      {
        clerkId: demoClerkId,
        testName: 'Fasting Blood Glucose',
        sampleDate: new Date(Date.now() - 15 * 24 * 3600 * 1000),
        resultValue: '104',
        unit: 'mg/dL',
        referenceRange: '70 - 99'
      },
      {
        clerkId: demoClerkId,
        testName: 'Serum Creatinine',
        sampleDate: new Date(Date.now() - 15 * 24 * 3600 * 1000),
        resultValue: '0.9',
        unit: 'mg/dL',
        referenceRange: '0.7 - 1.3'
      },
      {
        clerkId: demoClerkId,
        testName: 'Total Cholesterol',
        sampleDate: new Date(Date.now() - 15 * 24 * 3600 * 1000),
        resultValue: '192',
        unit: 'mg/dL',
        referenceRange: '< 200'
      }
    ];
    await LabResult.insertMany(labData);
    console.log('✅ Seeded LabResults');

    // 5. Seed Initial AI Health Report
    await Report.deleteMany({ clerkId: demoClerkId });
    await Report.create({
      clerkId: demoClerkId,
      summary: 'Patient exhibits mild pre-hypertension and pre-diabetic indicators. Good cardiovascular reserve and regular physical activity noted.',
      advice: {
        hypertension: 'Monitor BP weekly. Continue low-sodium diet and daily brisk walking.',
        diabetes: 'Target HbA1c below 5.7%. Limit processed sugars and carbohydrates in the evening.'
      },
      general_tips: 'Maintain hydration, prioritize 7-8 hours of quality sleep, and follow integrative dietary principles.',
      disclaimer: 'This AI health assessment is for informational and triage support only and does not replace medical consultation.',
      risk_scores: {
        diabetes: 35,
        hypertension: 28,
        anemia: 10,
        cardiovascular: 22
      },
      risk_score_meta: {
        diabetes: { category: 'Moderate Risk', basis: 'ICMR IDRS Guidelines' },
        hypertension: { category: 'Mild Risk', basis: 'JNC-8 Classification' }
      }
    });
    console.log('✅ Seeded Report');

    console.log('🎉 All demo data successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedData();
