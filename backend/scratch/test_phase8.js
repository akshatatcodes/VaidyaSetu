require('dotenv').config();
const mongoose = require('mongoose');
const { Groq } = require('groq-sdk');
const { retrieveRelevantKnowledge } = require('../src/utils/ragRetriever');
const { fetchDrugData } = require('../src/routes/realtimeInteractionRoutes');
const { compileRagPrompt } = require('../src/utils/ragPromptEngine');

// Connect to DB for vector search and cache
mongoose.connect(process.env.MONGODB_URI);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testRAG() {
  const medicines = ["Warfarin", "Guggul"];
  console.log(`Testing RAG for: ${medicines.join(', ')}`);
  
  try {
    // 1. API Data
    console.log('Fetching live API data...');
    const apiData = await Promise.all(medicines.map(m => fetchDrugData(m)));
    
    // 2. Vector Knowledge
    console.log('Retrieving vector knowledge...');
    const ragResult = await retrieveRelevantKnowledge(medicines, apiData);
    
    // 3. Prompt
    const prompt = compileRagPrompt(medicines, ragResult.groqContext);
    
    // 4. Groq
    console.log('Calling Groq LLM...');
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });
    
    const report = JSON.parse(completion.choices[0]?.message?.content || '{}');
    console.log('\n--- FINAL REPORT ---');
    console.log(JSON.stringify(report, null, 2));
    
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testRAG();
