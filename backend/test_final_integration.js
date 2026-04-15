/**
 * Final integration test - verify the complete flow works
 */

const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000/api';
const TEST_USER_ID = 'user_3CCUdC7v0RUJBqSIOIr3JKsd8Eh';

async function finalTest() {
  console.log('=== Final Integration Test ===\n');

  try {
    // Step 1: Submit data
    console.log('Step 1: Submitting waist circumference = 105...');
    await axios.post(`${API_URL}/diseases/diabetes/add-data`, {
      clerkId: TEST_USER_ID,
      data: { waistCircumference: 105 }
    });
    console.log('✅ Data submitted\n');

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 2: Fetch report (simulates dashboard fetch WITHOUT hybrid-assessment)
    console.log('Step 2: Fetching report (dashboard fetch)...');
    const reportRes = await axios.get(`${API_URL}/reports/${TEST_USER_ID}?t=${Date.now()}`);
    const scoreAfterFetch = reportRes.data.data.risk_scores.diabetes;
    console.log(`Diabetes score after fetch: ${scoreAfterFetch}\n`);

    // Step 3: Simulate dashboard refresh (calling fetchData but NOT hybrid-assessment)
    console.log('Step 3: Simulating dashboard refresh (no hybrid-assessment)...');
    const reportRes2 = await axios.get(`${API_URL}/reports/${TEST_USER_ID}?t=${Date.now()}`);
    const scoreAfterRefresh = reportRes2.data.data.risk_scores.diabetes;
    console.log(`Diabetes score after refresh: ${scoreAfterRefresh}\n`);

    // Verify
    console.log('=== Results ===');
    console.log(`Score after data submit: 40 (expected)`);
    console.log(`Score after first fetch:  ${scoreAfterFetch}`);
    console.log(`Score after refresh:      ${scoreAfterRefresh}`);
    
    if (scoreAfterFetch === 40 && scoreAfterRefresh === 40) {
      console.log('\n🎉 SUCCESS! Dashboard will now show updated scores!');
      console.log('The fix is working correctly!');
    } else {
      console.log('\n❌ FAILED - Score is being reset');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

finalTest();
