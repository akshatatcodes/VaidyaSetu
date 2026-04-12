const Tesseract = require('tesseract.js');
const sharp = require('sharp');

/**
 * Local OCR fallback using Tesseract.js
 * Optimized with Sharp preprocessing to handle handwritten prescriptions.
 * Adapted from MediScan for VaidyaSetu.
 */
async function extractFromImageLocal(base64Image, mediaType) {
  console.log("⚙️ Starting optimized local Tesseract OCR extraction...");
  
  try {
    // PRE-PROCESSING: Convert to grayscale and boost contrast
    // This helps Tesseract distinguish ink from paper in handwritten shots
    const rawBuffer = Buffer.from(base64Image, 'base64');
    const processedBuffer = await sharp(rawBuffer)
      .grayscale()
      .normalize() // Boosts contrast
      .sharpen()
      .toBuffer();
    
    const { data: { text } } = await Tesseract.recognize(processedBuffer, 'eng', {
      logger: m => console.log(`[Tesseract] ${m.status}: ${Math.round((m.progress || 0) * 100)}%`),
    });

    console.log("📄 Raw OCR Text Extracted (Local Tesseract).");
    return text;
  } catch (err) {
    console.error("❌ Local OCR Error:", err.message);
    throw new Error("Local OCR failed: " + err.message);
  }
}

module.exports = { extractFromImageLocal };
