const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DiseaseMetadata = require('../models/DiseaseMetadata');

dotenv.config({ path: './.env' });

const diseases = [
  {
    diseaseId: 'diabetes',
    displayName: 'Diabetes',
    icon: '🩸',
    specialty: 'Endocrinologist',
    category: 'Metabolic',
    priority: 1,
    searchKeywords: ['diabetes', 'sugar', 'endocrinology'],
    clinicalSources: ['WHO', 'ADA'],
    prevalenceBaseline: { region: 'India', value: '11.4%' }
  },
  {
    diseaseId: 'hypertension',
    displayName: 'Hypertension',
    icon: '🫀',
    specialty: 'Cardiologist',
    category: 'Cardiovascular',
    priority: 2,
    searchKeywords: ['blood pressure', 'hypertension', 'heart'],
    prevalenceBaseline: { region: 'India', value: '28.5%' }
  },
  {
    diseaseId: 'obesity',
    displayName: 'Obesity',
    icon: '⚖️',
    specialty: 'Bariatric Specialist',
    category: 'Metabolic',
    priority: 3,
    searchKeywords: ['weight', 'obesity', 'dietician']
  },
  {
    diseaseId: 'pcos',
    displayName: 'PCOS',
    icon: '🌸',
    specialty: 'Gynecologist',
    category: 'Women\'s Health',
    priority: 4,
    searchKeywords: ['pcos', 'pcod', 'hormones']
  },
  {
    diseaseId: 'thyroid',
    displayName: 'Thyroid Dysfunction',
    icon: '🦋',
    specialty: 'Endocrinologist',
    category: 'Metabolic',
    priority: 5,
    searchKeywords: ['thyroid', 'goiter', 'hormonal']
  },
  {
    diseaseId: 'anemia',
    displayName: 'Anemia',
    icon: '🍷',
    specialty: 'Hematologist',
    category: 'Nutritional',
    priority: 6,
    searchKeywords: ['iron', 'anemia', 'blood']
  },
  {
    diseaseId: 'asthma',
    displayName: 'Asthma',
    icon: '🫁',
    specialty: 'Pulmonologist',
    category: 'Respiratory',
    priority: 7,
    searchKeywords: ['asthma', 'breathing', 'lungs']
  },
  {
    diseaseId: 'depression',
    displayName: 'Depression',
    icon: '🧠',
    specialty: 'Psychiatrist',
    category: 'Mental Health',
    priority: 8,
    searchKeywords: ['depression', 'mental health', 'psychology']
  },
  {
    diseaseId: 'vitamin_d',
    displayName: 'Vitamin D Deficiency',
    icon: '☀️',
    specialty: 'General Physician',
    category: 'Nutritional',
    priority: 9,
    searchKeywords: ['vitamin d', 'bones', 'sunlight']
  },
  {
    diseaseId: 'vitamin_b12',
    displayName: 'Vitamin B12 Deficiency',
    icon: '💊',
    specialty: 'General Physician',
    category: 'Nutritional',
    priority: 10,
    searchKeywords: ['b12', 'nerve', 'fatigue']
  },
  {
    diseaseId: 'fatty_liver',
    displayName: 'Fatty Liver',
    icon: '🧼',
    specialty: 'Gastroenterologist',
    category: 'Hepatic',
    priority: 11,
    searchKeywords: ['liver', 'fatty liver', 'digestion']
  },
  {
    diseaseId: 'ckd',
    displayName: 'Chronic Kidney Disease',
    icon: '💧',
    specialty: 'Nephrologist',
    category: 'Renal',
    priority: 12,
    searchKeywords: ['kidney', 'renal', 'ckd']
  },
  {
    diseaseId: 'heart_disease',
    displayName: 'Heart Disease',
    icon: '❤️',
    specialty: 'Cardiologist',
    category: 'Cardiovascular',
    priority: 13,
    searchKeywords: ['heart', 'cardiac', 'chest pain']
  },
  {
    diseaseId: 'stroke',
    displayName: 'Stroke',
    icon: '⚡',
    specialty: 'Neurologist',
    category: 'Cardiovascular',
    priority: 14,
    searchKeywords: ['stroke', 'brain', 'neurology']
  },
  {
    diseaseId: 'copd',
    displayName: 'COPD',
    icon: '💨',
    specialty: 'Pulmonologist',
    category: 'Respiratory',
    priority: 15,
    searchKeywords: ['copd', 'lungs', 'smoking']
  },
  {
    diseaseId: 'allergic_rhinitis',
    displayName: 'Allergic Rhinitis',
    icon: '🤧',
    specialty: 'ENT / Allergist',
    category: 'Respiratory',
    priority: 16,
    searchKeywords: ['allergy', 'rhinitis', 'sneezing']
  },
  {
    diseaseId: 'kidney_stones',
    displayName: 'Kidney Stones',
    icon: '💎',
    specialty: 'Urologist',
    category: 'Renal',
    priority: 17,
    searchKeywords: ['stone', 'kidney stone', 'urology']
  },
  {
    diseaseId: 'anxiety',
    displayName: 'Anxiety',
    icon: '🌪️',
    specialty: 'Psychiatrist',
    category: 'Mental Health',
    priority: 18,
    searchKeywords: ['anxiety', 'panic', 'stress']
  },
  {
    diseaseId: 'sleep_disorders',
    displayName: 'Sleep Disorders',
    icon: '😴',
    specialty: 'Sleep Specialist',
    category: 'Mental Health',
    priority: 19,
    searchKeywords: ['sleep', 'insomnia', 'apnea']
  },
  {
    diseaseId: 'osteoporosis',
    displayName: 'Osteoporosis',
    icon: '🦴',
    specialty: 'Rheumatologist',
    category: 'Musculoskeletal',
    priority: 20,
    searchKeywords: ['bone', 'osteoporosis', 'fracture']
  },
  {
    diseaseId: 'osteoarthritis',
    displayName: 'Osteoarthritis',
    icon: '🦵',
    specialty: 'Orthopedist',
    category: 'Musculoskeletal',
    priority: 21,
    searchKeywords: ['joint', 'arthritis', 'knee']
  }
];

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not found in .env');

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing
    await DiseaseMetadata.deleteMany({});
    console.log('Cleared existing disease metadata');

    // Insert new
    await DiseaseMetadata.insertMany(diseases);
    console.log(`Seeded ${diseases.length} diseases successfully`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
