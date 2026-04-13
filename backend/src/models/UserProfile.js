const mongoose = require('mongoose');

const FieldSchema = {
  value: mongoose.Schema.Types.Mixed,
  lastUpdated: { type: Date, default: Date.now },
  updateType: { 
    type: String, 
    enum: ['initial', 'correction', 'real_change', 'auto_add', 'auto_remove', 'sync'],
    default: 'initial' 
  },
  previousValue: mongoose.Schema.Types.Mixed,
  unit: String
};

const UserProfileSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Step 1: Biometrics
  name: FieldSchema,
  age: FieldSchema,
  gender: FieldSchema,
  height: FieldSchema, // value in cm
  weight: FieldSchema, // value in kg
  bmi: FieldSchema,
  bmiCategory: FieldSchema,

  // Step 2: Lifestyle
  activityLevel: FieldSchema,
  sleepHours: FieldSchema,
  stressLevel: FieldSchema,
  isSmoker: FieldSchema,
  alcoholConsumption: FieldSchema,

  // Step 3: Diet
  dietType: FieldSchema,
  sugarIntake: FieldSchema,
  saltIntake: FieldSchema,
  eatsLeafyGreens: FieldSchema,
  eatsFruits: FieldSchema,
  junkFoodFrequency: FieldSchema,

  // Step 4: Medical
  // For arrays, value will be the array [String]
  allergies: FieldSchema,
  medicalHistory: FieldSchema,
  otherConditions: FieldSchema,
  
  onboardingComplete: {
    type: Boolean,
    default: true
  },
  
  // Data Quality Score (Phase B)
  dataQualityScore: {
    type: Number,
    default: 0
  },
  dataQualityLabel: {
    type: String,
    default: 'Basic'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  // Step 5: Platform Settings (Phase 1)
  settings: {
    language: { type: String, default: 'English' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    highContrast: { type: Boolean, default: false },
    reduceAnimations: { type: Boolean, default: false },
    voiceGuidance: { type: Boolean, default: false },
    measurementUnits: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    glucoseUnits: { type: String, enum: ['mg/dL', 'mmol/L'], default: 'mg/dL' },
    defaultReminderTime: { type: String, default: '08:00 AM' },
    reminderSound: { type: String, default: 'Chime' },
    snoozeDuration: { type: Number, default: 10 }, // minutes
    refillAlertThreshold: { type: Number, default: 7 } // days
  },

  // --- EXPANDED SCREENING FIELDS (Phase 2) ---
  
  // Thyroid & Metabolic (Step 4/5)
  weightChangeUnexplained: FieldSchema,
  fatiguePersistent: FieldSchema,
  drySkinHairLoss: FieldSchema,
  coldIntolerance: FieldSchema,
  familyHistoryThyroid: FieldSchema,
  autoimmuneHistory: FieldSchema,

  // Women's Health (Step 4 - Female Only)
  menstrualCycleIrregular: FieldSchema,
  facialBodyHairExcess: FieldSchema,
  persistentAcne: FieldSchema,
  tryingToConceiveDifficulty: FieldSchema,
  pcosDiagnosis: FieldSchema,

  // Respiratory & Environment (Step 5)
  wheezing: FieldSchema,
  persistentCough: FieldSchema,
  shortnessBreath: FieldSchema,
  highPollutionArea: FieldSchema,
  biomassFuelUse: FieldSchema,
  seasonalAllergies: FieldSchema,

  // Mental Health (Step 6)
  mentalHealthDepressed: FieldSchema, // PHQ-2
  mentalHealthAnxiety: FieldSchema,    // GAD-2
  energyLevelsLow: FieldSchema,
  lostInterestActivities: FieldSchema,

  // Kidney & Liver (Step 7)
  swellingAnkles: FieldSchema,
  frequentUrination: FieldSchema,
  foamyUrine: FieldSchema,
  nsaidOveruse: FieldSchema,
  liverPain: FieldSchema,
  fattyLiverDiagnosis: FieldSchema,
  alcoholFrequency: FieldSchema
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);
