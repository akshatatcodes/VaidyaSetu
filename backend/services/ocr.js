const Tesseract = require('tesseract.js');
const path = require('path');
const sharp = require('sharp');

/**
 * Local OCR fallback using Tesseract.js
 * Heavily optimized with grayscale + sharpen to handle handwriting better.
 */
async function extractFromImageLocal(base64Image, mediaType) {
  console.log("⚙️ Starting optimized local OCR extraction...");
  
  try {
    const rawBuffer = Buffer.from(base64Image, 'base64');
    const processedBuffer = await sharp(rawBuffer)
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();
    
    // Use the workspace root for Tesseract training data if needed
    const { data: { text } } = await Tesseract.recognize(processedBuffer, 'eng', {
      gzip: false,
      logger: m => console.log(`[OCR] ${m.status}: ${Math.round(m.progress * 100)}%`),
      init_oem: 1, // LSTM only
      tessedit_pageseg_mode: 3, 
    });

    console.log("📄 Raw OCR Text Extracted (Local).");
    return text;
  } catch (err) {
    console.error("❌ Local OCR Error:", err.message);
    throw new Error("Local OCR failed: " + err.message);
  }
}

module.exports = { extractFromImageLocal };
