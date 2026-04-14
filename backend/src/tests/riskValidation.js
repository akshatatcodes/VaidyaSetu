/**
 * RISK ENGINE VALIDATION (PHASE 8)
 * Verifies clinical accuracy of the risk scorer and emergency sentinel.
 */

const { calculateDetailedInsights } = require('../utils/riskScorer');
const { calculateEmergencyAlerts } = require('../utils/emergencyScorer');

const TEST_CASES = [
  {
    name: 'Healthy Young Male',
    profile: {
      age: 25,
      gender: 'male',
      bmi: 22,
      activityLevel: 'Regular',
      waistCircumference: 85,
      isSmoker: false
    },
    checks: [
      { disease: 'diabetes', max: 15 },
      { disease: 'heart_disease', max: 10 }
    ]
  },
  {
    name: 'High Risk Diabetic (Incomplete)',
    profile: {
      age: 55,
      gender: 'male',
      bmi: 32,
      activityLevel: { value: 'Sedentary' },
      familyHistoryDiabetes: { value: 'Both' }
      // Waist is missing
    },
    checks: [
      { disease: 'diabetes', min: 70 },
      { disease: 'diabetes', hasMissing: 'waistCircumference' }
    ]
  },
  {
    name: 'Cardiac Emergency Sentinel',
    profile: {
      age: 60,
      gender: 'male',
      chestPain: true,
      shortnessBreath: true
    },
    checks: [
      { emergency: 'cardiac_emergency' }
    ]
  },
  {
    name: 'Mental Health Crisis Sentinel',
    profile: {
      suicidalThoughts: true
    },
    checks: [
      { emergency: 'mental_health_crisis' }
    ]
  },
  {
    name: 'Gender Specificity (PCOS for Male)',
    profile: {
      gender: 'male',
      menstrualCycleIrregular: true // Invalid field for male
    },
    checks: [
      { disease: 'pcos', value: -1 } // Should be N/A
    ]
  }
];

function runTests() {
  console.log('🚀 Starting Risk Engine Validation...\n');
  let passed = 0;
  let failed = 0;

  TEST_CASES.forEach(tc => {
    console.log(`Testing: ${tc.name}`);
    let tcFailed = false;

    tc.checks.forEach(check => {
      if (check.disease) {
        const result = calculateDetailedInsights(tc.profile, check.disease);
        if (check.max && result.riskScore > check.max) {
          console.error(`  ❌ [FAIL] ${check.disease} score ${result.riskScore} > ${check.max}`);
          tcFailed = true;
        } else if (check.min && result.riskScore < check.min) {
          console.error(`  ❌ [FAIL] ${check.disease} score ${result.riskScore} < ${check.min}`);
          tcFailed = true;
        } else if (check.value !== undefined && result.riskScore !== check.value) {
          console.error(`  ❌ [FAIL] ${check.disease} score ${result.riskScore} !== ${check.value}`);
          tcFailed = true;
        } else if (check.hasMissing && !result.missingDataFactors.find(f => f.id === check.hasMissing)) {
          console.error(`  ❌ [FAIL] ${check.disease} missing factors did not include ${check.hasMissing}`);
          tcFailed = true;
        }
      }

      if (check.emergency) {
        const alerts = calculateEmergencyAlerts(tc.profile);
        if (!alerts.find(a => a.id === check.emergency)) {
          console.error(`  ❌ [FAIL] Emergency Sentinel did NOT trigger ${check.emergency}`);
          tcFailed = true;
        }
      }
    });

    if (!tcFailed) {
      console.log('  ✅ [PASS]');
      passed++;
    } else {
      failed++;
    }
  });

  console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests();
