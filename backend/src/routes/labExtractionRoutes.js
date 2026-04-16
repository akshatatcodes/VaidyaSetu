const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const Groq = require('groq-sdk');

// Use memory storage for AI processing
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

/**
 * POST /api/lab-results/extract
 * Extract lab test data from uploaded PDF or image using AI Vision
 */
router.post('/extract', upload.single('report'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No file uploaded' 
      });
    }

    console.log('[Lab Extract] Processing file:', req.file.originalname);

    // Convert file to base64
    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    // AI prompt for lab report extraction
    const extractionPrompt = `You are an expert medical lab report analyzer. 

Task: Extract ALL laboratory test results from this medical report image.

For EACH test found, extract:
1. Test name (e.g., "Glucose", "Hemoglobin", "TSH")
2. Result value (numeric only)
3. Unit (e.g., "mg/dL", "g/dL", "mIU/L")
4. Reference range (e.g., "70-100", "< 200")

Return ONLY a JSON object with this exact structure:
{
  "tests": [
    {
      "testName": "Glucose (Fasting)",
      "resultValue": 92,
      "unit": "mg/dL",
      "referenceRange": "70-100"
    },
    {
      "testName": "Hemoglobin",
      "resultValue": 14.5,
      "unit": "g/dL",
      "referenceRange": "13.5-17.5"
    }
  ],
  "reportDate": "2024-01-15",
  "labName": "Optional lab name"
}

IMPORTANT:
- Return ONLY valid JSON, no markdown or explanation
- Extract ALL tests visible in the report
- If a field is not found, use null
- Ensure resultValue is always a number
- Standardize test names to common medical terminology`;

    let extractedText;
    let method = '';

    // Try Groq Vision first (more reliable, better quota)
    if (groq) {
      try {
        console.log('[Lab Extract] Using Groq Vision (Llama 4 Scout)');
        const dataUri = `data:${mimeType};base64,${base64Data}`;
        
        const chatCompletion = await groq.chat.completions.create({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: extractionPrompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: dataUri
                  }
                }
              ]
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        });

        extractedText = chatCompletion.choices[0].message.content;
        method = 'Groq Vision';
        console.log('[Lab Extract] Groq Vision successful');
      } catch (groqError) {
        console.warn('[Lab Extract] Groq failed:', groqError.message);
      }
    }

    // Fallback to Gemini if Groq failed
    if (!extractedText && process.env.GEMINI_API_KEY) {
      try {
        console.log('[Lab Extract] Falling back to Gemini Vision');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: extractionPrompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        });

        extractedText = response.text;
        method = 'Gemini Vision';
        console.log('[Lab Extract] Gemini Vision successful');
      } catch (geminiError) {
        console.warn('[Lab Extract] Gemini failed:', geminiError.message);
      }
    }

    // If both failed
    if (!extractedText) {
      return res.status(503).json({
        status: 'error',
        message: 'AI extraction service unavailable. Please use manual entry.',
        fallback: 'manual'
      });
    }

    console.log(`[Lab Extract] Extraction completed via: ${method}`);

    // Parse the JSON response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = extractedText.replace(/^```[\s\S]*?\n|```$/g, '').trim();
      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('[Lab Extract] JSON parse error:', parseError);
      console.error('[Lab Extract] Raw response:', extractedText.substring(0, 500));
      return res.status(500).json({
        status: 'error',
        message: 'Failed to parse extraction results'
      });
    }

    // Validate and format the extracted data
    if (!extractedData.tests || !Array.isArray(extractedData.tests)) {
      console.error('[Lab Extract] Invalid format - missing tests array');
      return res.status(500).json({
        status: 'error',
        message: 'Invalid extraction format'
      });
    }

    // Filter out invalid entries
    const validTests = extractedData.tests.filter(test => 
      test.testName && test.resultValue !== null && test.resultValue !== undefined
    ).map(test => ({
      testName: test.testName.trim(),
      resultValue: parseFloat(test.resultValue),
      unit: test.unit || '',
      referenceRange: test.referenceRange || '',
      sampleDate: extractedData.reportDate || new Date().toISOString().split('T')[0],
      source: 'ai_extracted'
    }));

    console.log(`[Lab Extract] Successfully extracted ${validTests.length} tests via ${method}`);

    res.json({
      status: 'success',
      data: {
        tests: validTests,
        reportDate: extractedData.reportDate,
        labName: extractedData.labName,
        totalTests: validTests.length,
        method: method
      }
    });

  } catch (error) {
    console.error('[Lab Extract] Error:', error.message);
    console.error('[Lab Extract] Stack:', error.stack);
    
    res.status(500).json({
      status: 'error',
      message: 'AI extraction failed: ' + error.message
    });
  }
});

module.exports = router;
