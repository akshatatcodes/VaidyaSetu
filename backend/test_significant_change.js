/**
 * Advanced test to verify dashboard updates with significant data changes
 */

const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000/api';
const TEST_USER_ID = 'user_3CCUdC7v0RUJBqSIOIr3JKsd8Eh';

async function testWithSignificantChange() {
  console.log('=== Testing with Significant Data Change ===\n');

  try {
    // Get current state
    console.log('Step 1: Getting current diabetes score...');
    const reportRes = await axios.get(`${API_URL}/reports/${TEST_USER_ID}`);
    const initialScore = reportRes.data.data.risk_scores.diabetes;
    console.log(`Initial diabetes score: ${initialScore}\n`);

    // Submit waist circumference that will definitely impact the score
    console.log('Step 2: Submitting waist circumference = 105cm (high risk)...');
    const res1 = await axios.post(`${API_URL}/diseases/diabetes/add-data`, {
      clerkId: TEST_USER_ID,
      data: { waistCircumference: 105 }
    });
    console.log('✅ Data submitted');
    console.log('');

    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch updated report
    console.log('Step 3: Fetching updated report...');
    const reportRes2 = await axios.get(`${API_URL}/reports/${TEST_USER_ID}`);
    const newScore = reportRes2.data.data.risk_scores.diabetes;
    console.log(`New diabetes score: ${newScore}\n`);

    // Verify
    console.log('=== Results ===');
    console.log(`Initial Score: ${initialScore}`);
    console.log(`New Score:     ${newScore}`);
    console.log(`Change:        ${newScore - initialScore}`);
    
    if (newScore !== initialScore) {
      console.log('\n🎉 SUCCESS! Score changed - dashboard will show the update!');
    } else {
      console.log('\n⚠️  Score unchanged - checking if data was saved...');
      
      // Check disease details
      const detailsRes = await axios.get(`${API_URL}/diseases/diabetes/details`, {
        params: { clerkId: TEST_USER_ID }
      });
      console.log('Missing factors now:', detailsRes.data.data.missingDataFactors.length);
      console.log('Data was saved:', detailsRes.data.data.factorBreakdown.some(f => f.id === 'idrs_waist'));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testWithSignificantChange();
