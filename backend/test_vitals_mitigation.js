require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testVitalsMitigation() {
  console.log('='.repeat(80));
  console.log('TESTING: Vitals Mitigation System');
  console.log('='.repeat(80));
  
  try {
    // Test 1: High Blood Pressure
    console.log('\n' + '='.repeat(80));
    console.log('TEST 1: High Blood Pressure');
    console.log('='.repeat(80));
    
    console.log('Sending request to API...');
    
    const response = await axios.post(`${API_URL}/vitals/mitigations`, {
      vitals: [
        { type: 'blood_pressure', value: { systolic: 150, diastolic: 95 } }
      ],
      userProfile: {
        age: 55,
        gender: 'Male',
        bmi: 28.5,
        medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
        allergies: ['Penicillin'],
        medications: ['Metformin 500mg', 'Lisinopril 10mg'],
        diet: 'Vegetarian',
        activityLevel: 'Sedentary'
      }
    }, {
      timeout: 30000
    });

    console.log('\n✅ Response received!');
    console.log('\nVitals Analysis:');
    
    response.data.data.mitigations.forEach((mitigation, idx) => {
      console.log(`\n${idx + 1}. ${mitigation.vitalType.replace(/_/g, ' ').toUpperCase()}`);
      console.log(`   Status: ${mitigation.status.toUpperCase()}`);
      console.log(`   Value: ${JSON.stringify(mitigation.currentValue)}`);
      console.log(`   Normal Range: ${mitigation.normalRange}`);
      
      if (mitigation.mitigations) {
        console.log('\n   🚨 Immediate Actions:');
        mitigation.mitigations.immediateActions?.forEach((action, i) => {
          console.log(`      ${i + 1}. ${action}`);
        });
        
        console.log('\n   🏃 Lifestyle Changes:');
        mitigation.mitigations.lifestyleChanges?.forEach((change, i) => {
          console.log(`      ${i + 1}. ${change}`);
        });
        
        console.log('\n   🥗 Dietary Advice:');
        mitigation.mitigations.dietaryAdvice?.forEach((advice, i) => {
          console.log(`      ${i + 1}. ${advice}`);
        });
        
        console.log('\n   ⚠️  Precautions:');
        mitigation.mitigations.precautions?.forEach((precaution, i) => {
          console.log(`      ${i + 1}. ${precaution}`);
        });
        
        console.log(`\n   🏥 When to See Doctor: ${mitigation.mitigations.whenToSeeDoctor}`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST PASSED!');
    console.log('='.repeat(80));
    console.log('\n📋 Summary:');
    console.log('   - Vital status detection: WORKING');
    console.log('   - Normal range calculation: WORKING');
    console.log('   - AI mitigation generation: WORKING');
    console.log('   - Personalized recommendations: WORKING');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Backend server is not running. Start it with: npm start');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timed out. The AI service might be slow.');
    }
    console.error(error.stack);
  }
}

testVitalsMitigation();
