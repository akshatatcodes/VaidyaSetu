/**
 * Quick check to see what's currently in the database for this user
 */

const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000/api';
const TEST_USER_ID = 'user_3CCUdC7v0RUJBqSIOIr3JKsd8Eh';

async function checkCurrentState() {
  console.log('=== Current Database State ===\n');

  try {
    // Check Report
    console.log('1. Checking Report collection...');
    const reportRes = await axios.get(`${API_URL}/reports/${TEST_USER_ID}`);
    const report = reportRes.data.data;
    console.log('Report diabetes score:', report.risk_scores.diabetes);
    console.log('All risk scores:', report.risk_scores);
    console.log('');

    // Check DiseaseInsight
    console.log('2. Checking DiseaseInsight for diabetes...');
    const detailsRes = await axios.get(`${API_URL}/diseases/diabetes/details`, {
      params: { clerkId: TEST_USER_ID }
    });
    const details = detailsRes.data.data;
    console.log('DiseaseInsight diabetes score:', details.riskScore);
    console.log('Missing factors:', details.missingDataFactors.length);
    console.log('Factor breakdown:', details.factorBreakdown.length, 'factors');
    console.log('');

    // Check UserProfile
    console.log('3. Checking UserProfile for waist circumference...');
    const profileRes = await axios.get(`${API_URL}/profile/${TEST_USER_ID}`);
    const profile = profileRes.data.data;
    console.log('Waist circumference:', profile.waistCircumference);
    console.log('');

    console.log('=== Summary ===');
    console.log('Report score:', report.risk_scores.diabetes);
    console.log('DiseaseInsight score:', details.riskScore);
    console.log('Match:', report.risk_scores.diabetes === details.riskScore ? '✅ YES' : '❌ NO');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkCurrentState();
