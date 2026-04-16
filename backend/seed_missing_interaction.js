const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { pipeline } = require('@xenova/transformers');

dotenv.config();

async function seedMissingInteraction() {
  try {
    const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('knowledge_chunks');

    const interactionText = "Amlodipine and Levothyroxine Interaction: Calcium-containing products like certain formulations of Amdocal Plus can interfere with the absorption of Levothyroxine (Eltroxin). Levothyroxine absorption is significantly reduced when taken concurrently with calcium carbonate or other calcium salts. Mechanism: Calcium ions form insoluble complexes with levothyroxine in the gastrointestinal tract. Recommendation: Separate administration by at least 4 hours to ensure adequate thyroid hormone absorption. Source: Clinical Pharmacology / RxNav.";

    const output = await pipe(interactionText, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data);

    const doc = {
      text: interactionText,
      embedding: embedding,
      source_database: "Clinical Overrides",
      document_title: "Common Indian Drug Interactions",
      content_type: "interaction",
      metadata: {
        drugs: ["Amlodipine", "Levothyroxine", "Calcium"],
        brands: ["Amdocal", "Eltroxin"],
        severity: "Moderate"
      },
      createdAt: new Date()
    };

    await collection.insertOne(doc);
    console.log("Success: Seeded Calcium-Levothyroxine interaction.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seedMissingInteraction();
