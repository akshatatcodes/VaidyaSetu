const { extractFromImageGroq } = require('./groqVision');

/**
 * visionOcr Service Wrapper
 * Cascades through available OCR methods.
 */
async function extractFromImage(base64Image, mediaType) {
  try {
    // Primary check: Groq Vision (fastest current alternative for this setup)
    const medicines = await extractFromImageGroq(base64Image, mediaType);
    
    return {
      status: 'success',
      medicines: medicines,
      method: 'Groq-Vision-Llama3',
      warning: null
    };
  } catch (error) {
    console.error("[visionOcr] Groq Logic Failed:", error.message);
    throw new Error("Medicine extraction failed across all available methods.");
  }
}

module.exports = { extractFromImage };
