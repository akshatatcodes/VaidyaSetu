/**
 * Indian Prevalence Baselines
 * Sources: ICMR-INDIAB (2023), NFHS-5 (2021), NMHS (2016)
 */
const PREVALENCE_DATA = {
  diabetes: {
    overall: 11.4,
    urbanTrend: 'higher',
    sources: ['ICMR-INDIAB 2023'],
    ageBrackets: {
      '20-34': 5.0,
      '35-49': 12.0,
      '50-64': 20.0,
      '65+': 25.0
    }
  },
  pre_diabetes: {
    overall: 15.3,
    sources: ['ICMR-INDIAB 2023']
  },
  hypertension: {
    overall: 30.0, // Consensus between ICMR (35.5) and NFHS (24)
    sources: ['ICMR-INDIAB 2023', 'NFHS-5'],
    gender: {
      male: 32.0,
      female: 28.0
    }
  },
  obesity: {
    generalized: 28.6,
    abdominal: 39.5,
    sources: ['ICMR-INDIAB 2023']
  },
  thyroid: {
    selfReported: 2.9,
    clinicalEstimate: 4.5,
    sources: ['NFHS-5', 'ITS Guidelines'],
    gender: {
      male: 1.0,
      female: 3.5
    }
  },
  anemia: {
    overall: 50.0,
    sources: ['NFHS-5'],
    gender: {
      male: 25.0,
      female: 57.0
    }
  },
  depression: {
    overall: 2.7,
    lifetime: 5.2,
    sources: ['NMHS 2016']
  },
  anxiety: {
    overall: 3.0,
    sources: ['NMHS 2016']
  },
  asthma: {
    overall: 3.5,
    sources: ['ICMR-NCDIR']
  },
  copd: {
    overall: 4.2,
    sources: ['ICMR-NCDIR']
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
