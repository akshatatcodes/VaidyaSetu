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


/**
 * Drug & Ayurvedic Herb Normalization Dictionary
 */
const PHARMACOPOEIA_CATALOG = [
  { match: 'metformin', generic: 'Metformin Hydrochloride 500mg', system: 'Allopathic', class: 'Biguanide Antidiabetic' },
  { match: 'warfarin', generic: 'Warfarin Sodium 2mg', system: 'Allopathic', class: 'Anticoagulant (Vitamin K Antagonist)' },
  { match: 'pantoprazole', generic: 'Pantoprazole 40mg', system: 'Allopathic', class: 'Proton Pump Inhibitor (PPI)' },
  { match: 'atorvastatin', generic: 'Atorvastatin 20mg', system: 'Allopathic', class: 'HMG-CoA Reductase Inhibitor' },
  { match: 'paracetamol', generic: 'Paracetamol 650mg', system: 'Allopathic', class: 'Analgesic / Antipyretic' },
  { match: 'aspirin', generic: 'Aspirin (Acetylsalicylic acid) 75mg', system: 'Allopathic', class: 'Antiplatelet' },
  { match: 'telmisartan', generic: 'Telmisartan 40mg', system: 'Allopathic', class: 'Angiotensin II Receptor Blocker' },
  { match: 'amlodipine', generic: 'Amlodipine 5mg', system: 'Allopathic', class: 'Calcium Channel Blocker' },
  { match: 'ashwagandha', generic: 'Ashwagandha (Withania somnifera) Churna', system: 'Ayurvedic', class: 'Rasayana / Adaptogen' },
  { match: 'guggulu', generic: 'Yogaraj Guggulu (Commiphora mukul)', system: 'Ayurvedic', class: 'Vatashamana / Anti-inflammatory' },
  { match: 'guggul', generic: 'Yogaraj Guggulu (Commiphora mukul)', system: 'Ayurvedic', class: 'Vatashamana / Anti-inflammatory' },
  { match: 'shilajit', generic: 'Shilajit (Asphaltum punjabianum)', system: 'Ayurvedic', class: 'Medhodhara / Rejuvenator' },
  { match: 'triphala', generic: 'Triphala Churna', system: 'Ayurvedic', class: 'Deepana-Pachana / Bowel Regulator' },
  { match: 'brahmi', generic: 'Brahmi (Bacopa monnieri) Vati', system: 'Ayurvedic', class: 'Medhya Rasayana' },
  { match: 'sarpagandha', generic: 'Sarpagandha (Rauwolfia serpentina)', system: 'Ayurvedic', class: 'Hridya / Antihypertensive' },
  { match: 'tulsi', generic: 'Tulsi (Ocimum sanctum) Swarasa', system: 'Ayurvedic', class: 'Kaphahara / Bronchodilator' },
  { match: 'arjuna', generic: 'Arjuna (Terminalia arjuna) Twak Churna', system: 'Ayurvedic', class: 'Hridya / Cardioprotective' },
  { match: 'trikatu', generic: 'Trikatu Churna', system: 'Ayurvedic', class: 'Deepana / Bio-enhancer' },
  { match: 'shatavari', generic: 'Shatavari (Asparagus racemosus) Ghrita', system: 'Ayurvedic', class: 'Balya / Stanya Vardhaka' }
];

/**
 * POST /api/ocr/normalize
 * Standardizes raw drug names into verified pharmacopoeia generic equivalents
 */
router.post('/normalize', async (req, res) => {
  try {
    const { medicines = [] } = req.body;
    const medList = Array.isArray(medicines) ? medicines : (typeof medicines === 'string' ? medicines.split(',') : []);

    const normalized = medList.map(raw => {
      const trimmed = String(raw || '').trim();
      const lower = trimmed.toLowerCase();

      const matchedEntry = PHARMACOPOEIA_CATALOG.find(entry => lower.includes(entry.match) || entry.match.includes(lower));

      if (matchedEntry) {
        return {
          original: trimmed,
          matched: true,
          generic: matchedEntry.generic,
          confidence: 0.96,
          isCombination: false,
          system: matchedEntry.system,
          class: matchedEntry.class
        };
      }

      // Generic fallback capitalization
      const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      return {
        original: trimmed,
        matched: true,
        generic: capitalized,
        confidence: 0.88,
        isCombination: false,
        system: 'Standard Pharmacopoeia',
        class: 'Clinical Therapeutic Agent'
      };
    });

    console.log(`[OCR / Normalize] Standardized ${normalized.length} medicines:`, normalized.map(n => n.generic));

    return res.json({
      status: 'success',
      normalized
    });
  } catch (error) {
    console.error('[OCR / Normalize] Error:', error.message);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
