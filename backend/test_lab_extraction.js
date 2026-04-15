const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testLabExtraction() {
  const imagePath = path.join(__dirname, '..', 'a.png');
  
  console.log('🧪 Testing Lab Extraction with a.png...');
  console.log('📁 Image path:', imagePath);
  
  if (!fs.existsSync(imagePath)) {
    console.error('❌ File not found:', imagePath);
    return;
  }
  
  const form = new FormData();
  form.append('report', fs.createReadStream(imagePath));
  
  try {
    console.log('📤 Sending request to backend...');
    const response = await axios.post(
      'http://127.0.0.1:5000/api/lab-results/extract',
      form,
      {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    console.log('✅ Response received!');
    console.log('📊 Status:', response.data.status);
    console.log('🔢 Total tests:', response.data.data?.totalTests);
    console.log('\n📋 Extracted Tests:');
    console.log(JSON.stringify(response.data.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
}

testLabExtraction();
