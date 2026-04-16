const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractFromImage } = require('../services/visionOcr');

// Use memory storage - no temp files needed since we pass base64 directly to AI
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * POST /api/ocr/scan
 * 1. Receives image from frontend
 * 2. Converts to base64
 * 3. Passes directly to Gemini Vision (cascades to Groq/Tesseract on failure)
 * 4. Returns clean medicine list
 */
router.post('/scan', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No image file uploaded.' });
  }

  try {
    console.log(`[OCR] Image received: ${req.file.originalname} (${req.file.size} bytes)`);

    const base64Image = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype;

    // Run the cascading AI vision pipeline
    const result = await extractFromImage(base64Image, mediaType);

    console.log(`[OCR] Extraction complete via: ${result.method}. Found: ${result.medicines?.length || 0} medicines.`);

    return res.json({
      status: 'success',
      medicines: result.medicines || [],
      method: result.method,
      warning: result.warning || null
    });

  } catch (error) {
    console.error('[OCR] All extraction methods failed:', error.message);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Could not extract medicines from image. Please try again or enter medicines manually.' 
    });
  }
});

const { normalizeMedicineNames } = require('../services/normalizationService');

/**
 * POST /api/ocr/normalize
 * Normalizes brand names to generics using fuzzy matching.
 */
router.post('/normalize', async (req, res) => {
  try {
    const { medicines } = req.body;
    if (!medicines || !Array.isArray(medicines)) {
      return res.status(400).json({ status: 'error', message: 'Medicines array is required.' });
    }

    const normalized = await normalizeMedicineNames(medicines);
    return res.json({ status: 'success', normalized });
  } catch (error) {
    console.error('[Normalization] Error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Standardization failed.' });
  }
});

module.exports = router;
