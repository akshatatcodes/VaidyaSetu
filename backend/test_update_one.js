/**
 * Test updateOne approach
 */

const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000/api';
const TEST_USER_ID = 'user_3CCUdC7v0RUJBqSIOIr3JKsd8Eh';

async function testUpdateOne() {
  console.log('=== Testing updateOne Approach ===\n');

  try {
    // Submit data
    console.log('Submitting waist circumference = 95...');
    const res = await axios.post(`${API_URL}/diseases/diabetes/add-data`, {
      clerkId: TEST_USER_ID,
      data: { waistCircumference: 95 }
    });
    console.log('✅ Data submitted\n');

    await new Promise(resolve => setTimeout(resolve, 500));

    // Check report
    console.log('Fetching report...');
    const reportRes = await axios.get(`${API_URL}/reports/${TEST_USER_ID}?t=${Date.now()}`);
    const score = reportRes.data.data.risk_scores.diabetes;
    console.log(`Diabetes score in Report: ${score}\n`);

    if (score === 30 || score === 40) { // Should be different from 20
      console.log('🎉 SUCCESS! Report was updated!');
    } else {
      console.log('❌ FAILED - Report still has old score');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testUpdateOne();
