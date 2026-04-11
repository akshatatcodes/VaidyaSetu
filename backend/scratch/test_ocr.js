const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testOCR() {
  const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Prescription_pad.jpg/800px-Prescription_pad.jpg";
  const outputPath = path.join(__dirname, 'sample.jpg');

  console.log("🌐 Downloading sample prescription...");
  const response = await axios({ url: imageUrl, responseType: 'stream' });
  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);

  await new Promise((resolve) => writer.on('finish', resolve));
  console.log("✅ Image downloaded.");

  console.log("🧪 Sending to /api/ocr...");
  const form = new FormData();
  form.append('prescription', fs.createReadStream(outputPath));

  try {
    const res = await axios.post('http://localhost:5000/api/ocr', form, {
      headers: form.getHeaders(),
    });
    console.log("📄 API Response:", JSON.stringify(res.data, null, 2));
    
    if (res.data.status === 'success' && res.data.data.length > 0) {
      console.log("🚀 SUCCESS! Medicines identified without Gemini quota.");
    } else {
      console.log("⚠️ OCR returned empty. Check Groq logs.");
    }
  } catch (err) {
    console.error("❌ API Test Failed:", err.message);
  }
}

testOCR();
