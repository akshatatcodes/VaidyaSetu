/**
 * SPECIALIST MAPPING (PHASE 6 - EXPANDED)
 * Maps screening results to the appropriate medical specialties.
 * Aligned with Indian Medical Association (IMA) & Medical Council categories.
 */
const SPECIALIST_MAPPING = {
  // --- METABOLIC & ENDOCRINE ---
  diabetes: {
    primary: 'Endocrinologist',
    alternatives: ['Diabetologist', 'Internal Medicine'],
    keywords: ['diabetes clinic', 'endocrinology'],
    ima_code: 'END-01',
    urgency: 'high'
  },
  pre_diabetes: {
    primary: 'Endocrinologist',
    alternatives: ['General Physician'],
    keywords: ['lifestyle medicine', 'general physician'],
    ima_code: 'GEN-01',
    urgency: 'moderate'
  },
  thyroid: {
    primary: 'Endocrinologist',
    alternatives: ['Thyroid Specialist'],
    keywords: ['thyroid clinic', 'hormone specialist'],
    ima_code: 'END-02',
    urgency: 'moderate'
  },
  pcos: {
    primary: 'Gynecologist',
    alternatives: ['Endocrinologist'],
    keywords: ['womens health', 'fertility clinic'],
    ima_code: 'OBG-03',
    urgency: 'moderate'
  },
  obesity: {
    primary: 'Bariatric Specialist',
    alternatives: ['Endocrinologist', 'Dietitian'],
    keywords: ['weight management', 'obesity clinic'],
    ima_code: 'SUR-05',
    urgency: 'moderate'
  },

  // --- CARDIOVASCULAR ---
  heart_disease: {
    primary: 'Cardiologist',
    alternatives: ['Heart Specialist'],
    keywords: ['cardiac center', 'heart hospital'],
    ima_code: 'CAR-01',
    urgency: 'very_high'
  },
  hypertension: {
    primary: 'Cardiologist',
    alternatives: ['General Physician'],
    keywords: ['hypertension specialist', 'bp clinic'],
    ima_code: 'CAR-02',
    urgency: 'high'
  },

  // --- RESPIRATORY ---
  asthma: {
    primary: 'Pulmonologist',
    alternatives: ['Chest Physician'],
    keywords: ['pulmonary clinic', 'allergy specialist'],
    ima_code: 'PUL-01',
    urgency: 'high'
  },
  copd: {
    primary: 'Pulmonologist',
    alternatives: ['Chest Physician'],
    keywords: ['lung specialist', 'respiratory care'],
    ima_code: 'PUL-02',
    urgency: 'very_high'
  },

  // --- HEPATO-GASTRO ---
  fatty_liver: {
    primary: 'Hepatologist',
    alternatives: ['Gastroenterologist'],
    keywords: ['liver clinic', 'gastrology'],
    ima_code: 'GAS-02',
    urgency: 'moderate'
  },
  gerd: {
    primary: 'Gastroenterologist',
    alternatives: ['General Surgeon'],
    keywords: ['gastroscopy', 'digestive health'],
    ima_code: 'GAS-01',
    urgency: 'moderate'
  },

  // --- NEPHRO-URO ---
  ckd: {
    primary: 'Nephrologist',
    alternatives: ['Kidney Specialist'],
    keywords: ['nephrology center', 'dialysis'],
    ima_code: 'NEP-01',
    urgency: 'very_high'
  },
  kidney_stones: {
    primary: 'Urologist',
    alternatives: ['Nephrologist'],
    keywords: ['urology clinic', 'stone removal'],
    ima_code: 'URO-01',
    urgency: 'high'
  },

  // --- ORTHO & RHEUMA ---
  arthritis: {
    primary: 'Rheumatologist',
    alternatives: ['Orthopedic Surgeon'],
    keywords: ['joint pain clinic', 'rheumatology'],
    ima_code: 'RHE-01',
    urgency: 'moderate'
  },
  spondylosis: {
    primary: 'Orthopedic Surgeon',
    alternatives: ['Physiotherapist', 'Neurologist'],
    keywords: ['spine specialist', 'orthopedics'],
    ima_code: 'ORT-01',
    urgency: 'moderate'
  },
  osteoporosis: {
    primary: 'Orthopedic Surgeon',
    alternatives: ['Endocrinologist'],
    keywords: ['bone density clinic', 'orthopedics'],
    ima_code: 'ORT-02',
    urgency: 'moderate'
  },

  // --- MENTAL HEALTH ---
  depression: {
    primary: 'Psychiatrist',
    alternatives: ['Clinical Psychologist'],
    keywords: ['mental health', 'counseling'],
    ima_code: 'PSY-01',
    urgency: 'high'
  },
  anxiety: {
    primary: 'Psychiatrist',
    alternatives: ['Counseling Psychologist'],
    keywords: ['anxiety treatment', 'psychotherapy'],
    ima_code: 'PSY-02',
    urgency: 'moderate'
  },

  // --- OTHERS ---
  anemia: {
    primary: 'General Physician',
    alternatives: ['Hematologist'],
    keywords: ['blood specialist', 'physician'],
    ima_code: 'HEM-01',
    urgency: 'moderate'
  },
  vitamin_d_deficiency: {
    primary: 'General Physician',
    alternatives: ['Orthopedic Surgeon'],
    keywords: ['vitamin clinic', 'physician'],
    ima_code: 'GEN-02',
    urgency: 'low'
  },
  vitamin_b12_deficiency: {
    primary: 'General Physician',
    alternatives: ['Neurologist'],
    keywords: ['neurovitamins', 'physician'],
    ima_code: 'GEN-03',
    urgency: 'low'
  }
};

module.exports = { SPECIALIST_MAPPING };
