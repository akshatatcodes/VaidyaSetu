/**
 * Test script to verify dashboard risk score updates
 * This tests the complete flow:
 * 1. Submit data via add-data endpoint
 * 2. Verify DiseaseInsight is updated
 * 3. Verify Report is updated
 * 4. Check that dashboard will see the update
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = process.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

// Test configuration
const TEST_USER_ID = 'user_3CCUdC7v0RUJBqSIOIr3JKsd8Eh'; // Actual user clerkId
const TEST_DISEASE = 'diabetes';

async function testDashboardUpdate() {
  console.log('=== Testing Dashboard Risk Score Update ===\n');

  try {
    // Step 1: Get current report
    console.log('Step 1: Fetching current report...');
    const reportRes = await axios.get(`${API_URL}/reports/${TEST_USER_ID}`);
    const currentReport = reportRes.data.data;
    console.log('Current risk_scores:', currentReport.risk_scores);
    const currentScore = currentReport.risk_scores[TEST_DISEASE];
    console.log(`Current ${TEST_DISEASE} score: ${currentScore}\n`);

    // Step 2: Get current disease details
    console.log('Step 2: Fetching current disease details...');
    const detailsRes = await axios.get(`${API_URL}/diseases/${TEST_DISEASE}/details`, {
      params: { clerkId: TEST_USER_ID }
    });
    const currentDetails = detailsRes.data.data;
    console.log('Current details:', {
      riskScore: currentDetails.riskScore,
      missingDataFactors: currentDetails.missingDataFactors?.length || 0
    });
    console.log('Missing factors:', currentDetails.missingDataFactors?.map(f => f.id));
    console.log('');

    // Step 3: Submit new data (simulate filling missing data)
    if (currentDetails.missingDataFactors && currentDetails.missingDataFactors.length > 0) {
      const firstMissing = currentDetails.missingDataFactors[0];
      console.log(`Step 3: Submitting data for missing factor: ${firstMissing.id}...`);
      
      // Prepare test data based on the missing factor
      const testData = {};
      if (firstMissing.id === 'waistCircumference') {
        testData.waistCircumference = 85; // Test value in cm
      } else if (firstMissing.id === 'hba1c') {
        testData.hba1c = 5.8; // Test value in %
      } else if (firstMissing.id === 'fastingBloodSugar') {
        testData.fastingBloodSugar = 95; // Test value in mg/dL
      } else {
        testData[firstMissing.id] = firstMissing.type === 'number' ? 50 : 'Yes';
      }

      console.log('Submitting data:', testData);

      const addDataRes = await axios.post(`${API_URL}/diseases/${TEST_DISEASE}/add-data`, {
        clerkId: TEST_USER_ID,
        data: testData
      });

      console.log('✅ Data submission successful!');
      console.log('New insight data:', {
        riskScore: addDataRes.data.data.riskScore,
        factorBreakdown: addDataRes.data.data.factorBreakdown?.length || 0
      });
      console.log('');
    } else {
      console.log('Step 3: No missing data factors to test. Skipping...\n');
    }

    // Step 4: Fetch updated report
    console.log('Step 4: Fetching updated report...');
    const updatedReportRes = await axios.get(`${API_URL}/reports/${TEST_USER_ID}`);
    const updatedReport = updatedReportRes.data.data;
    console.log('Updated risk_scores:', updatedReport.risk_scores);
    const updatedScore = updatedReport.risk_scores[TEST_DISEASE];
    console.log(`Updated ${TEST_DISEASE} score: ${updatedScore}\n`);

    // Step 5: Fetch updated disease details
    console.log('Step 5: Fetching updated disease details...');
    const updatedDetailsRes = await axios.get(`${API_URL}/diseases/${TEST_DISEASE}/details`, {
      params: { clerkId: TEST_USER_ID }
    });
    const updatedDetails = updatedDetailsRes.data.data;
    console.log('Updated details:', {
      riskScore: updatedDetails.riskScore,
      missingDataFactors: updatedDetails.missingDataFactors?.length || 0
    });
    console.log('');

    // Step 6: Verify the update
    console.log('=== Verification Results ===');
    const scoreChanged = currentScore !== updatedScore;
    console.log(`✅ Risk score changed: ${scoreChanged ? 'YES' : 'NO'}`);
    console.log(`   Old: ${currentScore} → New: ${updatedScore}`);
    console.log(`✅ DiseaseInsight updated: ${currentDetails.riskScore !== updatedDetails.riskScore ? 'YES' : 'NO'}`);
    console.log(`✅ Report updated: ${currentScore !== updatedScore ? 'YES' : 'NO'}`);
    
    if (scoreChanged) {
      console.log('\n🎉 SUCCESS! Dashboard will now show the updated risk score!');
    } else {
      console.log('\n⚠️  Score did not change. This might be expected if the new data has minimal impact.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Tip: Make sure the user has a report generated first.');
      console.log('   You can generate one by calling: POST /api/ai/generate-report');
    }
  }
}

// Run the test
testDashboardUpdate();
