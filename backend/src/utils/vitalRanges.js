/**
 * Vital Signs Reference Ranges
 * Defines normal, borderline, and abnormal ranges for all vital signs
 * Based on medical guidelines (AHA, ADA, WHO)
 */

const VITAL_RANGES = {
  blood_pressure: {
    name: 'Blood Pressure',
    unit: 'mmHg',
    format: 'systolic/diastolic',
    normal: {
      systolic: { min: 90, max: 120 },
      diastolic: { min: 60, max: 80 }
    },
    borderline: {
      systolic: { min: 121, max: 139 },
      diastolic: { min: 81, max: 89 }
    },
    high: {
      systolic: { min: 140, max: 180 },
      diastolic: { min: 90, max: 120 }
    },
    critical: {
      systolic: { min: 181, max: 999 },
      diastolic: { min: 121, max: 999 }
    },
    low: {
      systolic: { min: 0, max: 89 },
      diastolic: { min: 0, max: 59 }
    }
  },

  blood_glucose: {
    name: 'Blood Glucose',
    unit: 'mg/dL',
    normal: { min: 70, max: 100 },
    borderline: { min: 101, max: 125 },
    high: { min: 126, max: 250 },
    critical: { min: 251, max: 999 },
    low: { min: 0, max: 69 }
  },

  heart_rate: {
    name: 'Heart Rate',
    unit: 'bpm',
    normal: { min: 60, max: 100 },
    borderline: { min: 101, max: 110 },
    high: { min: 111, max: 150 },
    critical: { min: 151, max: 999 },
    low: { min: 0, max: 59 }
  },

  body_temperature: {
    name: 'Body Temperature',
    unit: '°F',
    normal: { min: 97.8, max: 99.1 },
    borderline: { min: 99.2, max: 100.3 },
    high: { min: 100.4, max: 103 },
    critical: { min: 103.1, max: 999 },
    low: { min: 0, max: 97.7 }
  },

  oxygen_saturation: {
    name: 'Oxygen Saturation (SpO2)',
    unit: '%',
    normal: { min: 95, max: 100 },
    borderline: { min: 91, max: 94 },
    high: { min: 101, max: 999 },
    critical: { min: 0, max: 90 },
    low: { min: 0, max: 90 }
  },

  respiratory_rate: {
    name: 'Respiratory Rate',
    unit: 'breaths/min',
    normal: { min: 12, max: 20 },
    borderline: { min: 21, max: 24 },
    high: { min: 25, max: 40 },
    critical: { min: 41, max: 999 },
    low: { min: 0, max: 11 }
  },

  weight: {
    name: 'Weight',
    unit: 'kg',
    // Weight ranges are personalized based on height and BMI
    // This will be calculated dynamically
    personalized: true
  },

  bmi: {
    name: 'BMI',
    unit: 'kg/m²',
    normal: { min: 18.5, max: 24.9 },
    borderline: { min: 25, max: 29.9 },
    high: { min: 30, max: 40 },
    critical: { min: 40.1, max: 999 },
    low: { min: 0, max: 18.4 }
  },

  steps: {
    name: 'Daily Steps',
    unit: 'steps',
    normal: { min: 7000, max: 999999 },
    borderline: { min: 5000, max: 6999 },
    high: { min: 10000, max: 999999 },
    low: { min: 0, max: 4999 }
  },

  sleep_duration: {
    name: 'Sleep Duration',
    unit: 'hours',
    normal: { min: 7, max: 9 },
    borderline: { min: 6, max: 6.9 },
    high: { min: 10, max: 24 },
    low: { min: 0, max: 5.9 }
  },

  water_intake: {
    name: 'Water Intake',
    unit: 'glasses',
    normal: { min: 8, max: 999 },
    borderline: { min: 6, max: 7 },
    low: { min: 0, max: 5 }
  },

  cholesterol_total: {
    name: 'Total Cholesterol',
    unit: 'mg/dL',
    normal: { min: 0, max: 200 },
    borderline: { min: 201, max: 239 },
    high: { min: 240, max: 999 }
  },

  hba1c: {
    name: 'HbA1c',
    unit: '%',
    normal: { min: 0, max: 5.6 },
    borderline: { min: 5.7, max: 6.4 },
    high: { min: 6.5, max: 14 }
  },

  // Common lab parameters for kiosk OCR flagging (never diagnose — flag only)
  hemoglobin: {
    name: 'Hemoglobin',
    unit: 'g/dL',
    normal: { min: 12, max: 17 },
    borderline: { min: 10, max: 11.9 },
    high: { min: 17.1, max: 25 },
    low: { min: 0, max: 9.9 }
  },
  fasting_glucose: {
    name: 'Fasting Glucose',
    unit: 'mg/dL',
    normal: { min: 70, max: 99 },
    borderline: { min: 100, max: 125 },
    high: { min: 126, max: 400 },
    low: { min: 0, max: 69 }
  },
  creatinine: {
    name: 'Serum Creatinine',
    unit: 'mg/dL',
    normal: { min: 0.6, max: 1.2 },
    borderline: { min: 1.21, max: 1.5 },
    high: { min: 1.51, max: 20 },
    low: { min: 0, max: 0.59 }
  },
  tsh: {
    name: 'TSH',
    unit: 'mIU/L',
    normal: { min: 0.4, max: 4.0 },
    borderline: { min: 4.01, max: 10 },
    high: { min: 10.01, max: 100 },
    low: { min: 0, max: 0.39 }
  }
};

/**
 * Flag lab values outside reference — never labels as diagnosis.
 * Returns message: "value outside reference range — clinical interpretation required"
 */
function flagLabValue(parameterKey, numericValue) {
  const range = VITAL_RANGES[parameterKey];
  if (!range || numericValue === null || numericValue === undefined || Number.isNaN(Number(numericValue))) {
    return null;
  }
  const status = getVitalStatus(parameterKey, Number(numericValue));
  if (status === 'normal') return null;
  return {
    parameter: range.name,
    value: String(numericValue),
    flag: 'value outside reference range — clinical interpretation required',
    referenceRange: getNormalRange(parameterKey),
    status
  };
}

/**
 * Heuristic: parse common lab strings from OCR text into flags
 */
function flagLabsFromExtractedText(text = '') {
  const flags = [];
  const patterns = [
    { key: 'hba1c', re: /hba1c[:\s]*([0-9]+(?:\.[0-9]+)?)\s*%?/i },
    { key: 'hemoglobin', re: /(?:hemoglobin|hb)[:\s]*([0-9]+(?:\.[0-9]+)?)\s*g/i },
    { key: 'fasting_glucose', re: /(?:fasting\s*(?:blood\s*)?glucose|fbs|fbg)[:\s]*([0-9]+(?:\.[0-9]+)?)/i },
    { key: 'creatinine', re: /creatinine[:\s]*([0-9]+(?:\.[0-9]+)?)/i },
    { key: 'tsh', re: /tsh[:\s]*([0-9]+(?:\.[0-9]+)?)/i },
    { key: 'cholesterol_total', re: /(?:total\s*)?cholesterol[:\s]*([0-9]+(?:\.[0-9]+)?)/i }
  ];
  for (const p of patterns) {
    const m = text.match(p.re);
    if (m) {
      const flagged = flagLabValue(p.key, parseFloat(m[1]));
      if (flagged) flags.push(flagged);
    }
  }
  return flags;
}

/**
 * Determine the status of a vital sign based on its value
 * @param {string} type - Vital sign type
 * @param {number|object} value - Vital sign value (or {systolic, diastolic} for BP)
 * @returns {string} Status: 'normal', 'borderline', 'high', 'low', 'critical'
 */
function getVitalStatus(type, value) {
  const range = VITAL_RANGES[type];
  if (!range || range.personalized) return 'normal';

  if (type === 'blood_pressure') {
    const { systolic, diastolic } = value;
    if (systolic >= 181 || diastolic >= 121) return 'critical';
    if (systolic >= 140 || diastolic >= 90) return 'high';
    if (systolic >= 121 || diastolic >= 81) return 'borderline';
    if (systolic <= 89 || diastolic <= 59) return 'low';
    return 'normal';
  }

  if (range.critical && value >= range.critical.min && (!range.critical.max || value <= range.critical.max)) {
    // critical low ranges like SpO2 use low end
    if (range.critical.min === 0 && value <= range.critical.max) return 'critical';
  }
  if (range.critical && range.critical.max != null && value <= range.critical.max && range.critical.min === 0) {
    return 'critical';
  }
  if (range.high && value >= range.high.min) return 'high';
  if (range.low && value <= range.low.max) return 'low';
  if (range.borderline && value >= range.borderline.min && value <= range.borderline.max) return 'borderline';
  if (range.normal && value >= range.normal.min && value <= range.normal.max) return 'normal';

  return 'normal';
}

function getNormalRange(type) {
  const range = VITAL_RANGES[type];
  if (!range) return 'Consult your doctor';

  if (type === 'blood_pressure') {
    return `${range.normal.systolic.min}-${range.normal.systolic.max} / ${range.normal.diastolic.min}-${range.normal.diastolic.max} ${range.unit}`;
  }

  if (range.normal) {
    return `${range.normal.min}-${range.normal.max} ${range.unit}`;
  }

  return 'Varies by individual';
}

module.exports = {
  VITAL_RANGES,
  getVitalStatus,
  getNormalRange,
  flagLabValue,
  flagLabsFromExtractedText
};

