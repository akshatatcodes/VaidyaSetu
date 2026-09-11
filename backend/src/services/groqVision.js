const Groq = require('groq-sdk');

let groq = null;
function getGroq() {
  if (groq) return groq;
  const key = process.env.GROQ_API_KEY;
  if (!key || !String(key).startsWith('gsk_')) {
    throw new Error('No GROQ_API_KEY for vision fallback');
  }
  groq = new Groq({ apiKey: key });
  return groq;
}

/**
 * Groq Vision Fallback - Uses LLaMA Vision model to directly read the image.
 * Adapted from MediScan for VaidyaSetu.
 */
async function extractFromImageGroq(base64Image, mediaType) {
  const client = getGroq();

  try {
    const dataUri = `data:${mediaType};base64,${base64Image}`;

    const chatCompletion = await client.chat.completions.create({
      model: "llama-3.2-11b-vision-instruct", // Active Groq multimodal vision model
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "System: You are an expert medical OCR assistant for Indian prescriptions.\nTask: Extract all medicine brand names and generic names from this image. Include dosage/strength (e.g. 500mg) where visible.\nInstruction: Return ONLY a JSON array of strings e.g. [\"Medicine 1 500mg\", \"Medicine 2\"]. No chat or markdown."
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
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0].message.content;

    try {
      const parsed = JSON.parse(content);
      const normalize = (data) => {
        if (Array.isArray(data)) return data.map(m => typeof m === 'string' ? m : (m.name || JSON.stringify(m)));
        if (typeof data === 'object') {
          const list = data.medicines || data.list || data.names || Object.values(data).find(Array.isArray);
          return list ? normalize(list) : ["Unknown Medicine"];
        }
        return ["Unknown Medicine"];
      };
      
      return normalize(parsed);
    } catch (e) {
      const match = content.match(/\[.*\]/s);
      if (match) return JSON.parse(match[0]);
      throw new Error("Failed to parse medicines from Groq Vision response");
    }
  } catch (error) {
    console.error("Groq Vision Fallback Error:", error.message);
    throw error;
  }
}

module.exports = { extractFromImageGroq };
