/**
 * Indian Prevalence Baselines - Government Approved Data
 * Sources: ICMR-INDIAB (2023), NFHS-5 (2021), NMHS (2016), WHO GHO (2024)
 */
const PREVALENCE_DATA = {
  diabetes: {
    overall: 11.4, // ICMR-INDIAB Phase III (2023)
    urbanTrend: 'higher',
    sources: ['ICMR-INDIAB 2023', 'WHO GHO 2024'],
    ageBrackets: {
      '20-34': 5.0,
      '35-49': 12.0,
      '50-64': 20.0,
      '65+': 25.0
    },
    gender: {
      male: 12.1,
      female: 10.8
    }
  },
  pre_diabetes: {
    overall: 15.3, // ICMR-INDIAB (2023)
    sources: ['ICMR-INDIAB 2023']
  },
  hypertension: {
    overall: 35.5, // ICMR-INDIAB (2023) - more accurate than NFHS
    sources: ['ICMR-INDIAB 2023', 'NFHS-5', 'WHO GHO'],
    gender: {
      male: 37.2,
      female: 33.8
    },
    ageBrackets: {
      '18-29': 15.0,
      '30-39': 25.0,
      '40-49': 35.0,
      '50-59': 45.0,
      '60+': 55.0
    }
  },
  obesity: {
    generalized: 28.6, // BMI ≥25
    abdominal: 39.5, // Waist ≥90cm male, ≥80cm female
    sources: ['ICMR-INDIAB 2023', 'NFHS-5'],
    gender: {
      male: 22.9,
      female: 34.3
    }
  },
  thyroid: {
    selfReported: 2.9,
    clinicalEstimate: 4.5,
    sources: ['NFHS-5', 'ITS Guidelines', 'ICMR'],
    gender: {
      male: 1.0,
      female: 3.5
    }
  },
  anemia: {
    overall: 57.2, // NFHS-5 (2021) - more recent
    sources: ['NFHS-5 2021', 'ICMR'],
    gender: {
      male: 25.0,
      female: 57.0
    },
    ageBrackets: {
      'children': 40.2,
      'adults': 57.2
    }
  },
  depression: {
    overall: 2.7,
    lifetime: 5.2,
    sources: ['NMHS 2016', 'ICMR Mental Health']
  },
  anxiety: {
    overall: 3.0,
    sources: ['NMHS 2016', 'WHO GHO']
  },
  asthma: {
    overall: 2.4, // ICMR-NCDIR (2023)
    sources: ['ICMR-NCDIR 2023', 'WHO GHO']
  },
  copd: {
    overall: 4.2,
    sources: ['ICMR-NCDIR', 'WHO GHO']
  },
  heart_disease: {
    overall: 2.8, // ICMR-INDIAB CVD data
    sources: ['ICMR-INDIAB 2023', 'WHO GHO'],
    gender: {
      male: 3.2,
      female: 2.4
    }
  },
  fatty_liver: {
    overall: 35.0, // ICMR-INDIAB
    sources: ['ICMR-INDIAB 2023']
  },
  pcos: {
    overall: 8.2, // ICMR estimates for reproductive age women
    sources: ['ICMR', 'WHO']
  },
  vitamin_d: {
    overall: 70.0, // ICMR deficiency estimates
    sources: ['ICMR', 'NFHS-5']
  },
  vitamin_b12: {
    overall: 47.0, // ICMR nutritional studies
    sources: ['ICMR', 'NFHS-5']
  },
  sleep_disorders: {
    overall: 12.0, // ICMR mental health surveys
    sources: ['ICMR', 'WHO']
  },
  osteoporosis: {
    overall: 18.0, // Post-menopausal women
    sources: ['ICMR', 'WHO'],
    gender: {
      male: 8.0,
      female: 28.0
    }
  },
  osteoarthritis: {
    overall: 22.0, // ICMR musculoskeletal data
    sources: ['ICMR', 'WHO']
  },
  ckd: {
    overall: 17.2, // ICMR-INDIAB kidney disease
    sources: ['ICMR-INDIAB 2023']
  },
  stroke: {
    overall: 1.8, // ICMR-NCDIR
    sources: ['ICMR-NCDIR', 'WHO GHO']
  }
};

/**
 * Validated Screening Tool Thresholds
 */
const SCREENING_TOOLS = {
  IDRS: {
    high: 60,
    moderate: 30,
    low: 0
  },
  PHQ2: {
    positive: 3
  },
  GAD2: {
    positive: 3
  }
};

module.exports = { PREVALENCE_DATA, SCREENING_TOOLS };
