const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DrugMapping = require('./src/models/DrugMapping');

dotenv.config();

const brandMappings = [
  // Allopathy - Provided in request
  { brand_name: "Amdocal", generic_name: "Amlodipine", brand_aliases: ["Amdocal Plus", "Amdoccal"], combination_drug: true, components: ["Amlodipine", "Hydrochlorothiazide"] },
  { brand_name: "Eltroxin", generic_name: "Levothyroxine" },
  { brand_name: "Paricel", generic_name: "Paracetamol", brand_aliases: ["Acetaminophen"] },
  { brand_name: "Vare", generic_name: "Warfarin" },
  { brand_name: "Crocin", generic_name: "Paracetamol" },
  { brand_name: "Calpol", generic_name: "Paracetamol" },
  { brand_name: "Ecosprin", generic_name: "Aspirin" },
  { brand_name: "Glycomet", generic_name: "Metformin", combination_drug: true, components: ["Metformin", "Glimepiride"] },
  { brand_name: "Storvas", generic_name: "Atorvastatin", combination_drug: true, components: ["Atorvastatin", "Clopidogrel"] },
  { brand_name: "Thyronorm", generic_name: "Levothyroxine" },
  { brand_name: "Losar", generic_name: "Losartan" },
  { brand_name: "Cilacar", generic_name: "Cilnidipine" },
  
  // Ayurveda - Provided in request
  { brand_name: "Himalaya Guggul", generic_name: "Guggul", brand_aliases: ["Commiphora mukul"], category: "Ayurveda" },
  { brand_name: "Dabur Giloy", generic_name: "Giloy", brand_aliases: ["Tinospora cordifolia"], category: "Ayurveda" },
  { brand_name: "Zandu Tulsi", generic_name: "Tulsi", brand_aliases: ["Ocimum sanctum"], category: "Ayurveda" },
  { brand_name: "Patanjali Ashwagandha", generic_name: "Ashwagandha", brand_aliases: ["Withania somnifera"], category: "Ayurveda" },
  { brand_name: "Baidyanath Triphala", generic_name: "Triphala", category: "Ayurveda" }
];

async function seedMappings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');
    
    // Clear existing to avoid dupes during dev
    await DrugMapping.deleteMany({});
    
    const docs = await DrugMapping.insertMany(brandMappings);
    console.log(`Success: Seeded ${docs.length} drug brand mappings.`);
    
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedMappings();
