/**
 * Phase 10 - Step 59: Comprehensive RAG Test Suite
 * Executes 20 known interaction checks and measures performance/accuracy.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { retrieveRelevantKnowledge } = require('../src/utils/ragRetriever');
const { fetchDrugData } = require('../src/routes/realtimeInteractionRoutes');
const { compileRagPrompt } = require('../src/utils/ragPromptEngine');
const { Groq } = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TEST_CASES = [
  { name: "Warfarin + St. John's Wort", drugs: ["Warfarin", "St. John's Wort"] },
  { name: "Warfarin + Guggul", drugs: ["Warfarin", "Guggul"] },
  { name: "Aspirin + Ginkgo", drugs: ["Aspirin", "Ginkgo Biloba"] },
  { name: "Aspirin + Ginger", drugs: ["Aspirin", "Ginger"] },
  { name: "Metformin + Berberine", drugs: ["Metformin", "Berberine"] },
  { name: "Digoxin + St. John's Wort", drugs: ["Digoxin", "St. John's Wort"] },
  { name: "Simvastatin + Red Yeast Rice", drugs: ["Simvastatin", "Red Yeast Rice"] },
  { name: "L-Dopa + Mucuna Pruriens", drugs: ["L-Dopa", "Mucuna Pruriens"] },
  { name: "Cyclosporine + St. John's Wort", drugs: ["Cyclosporine", "St. John's Wort"] },
  { name: "Eliquis + Ashwagandha", drugs: ["Eliquis", "Ashwagandha"] },
  { name: "Metformin + Aloe Vera", drugs: ["Metformin", "Aloe Vera"] },
  { name: "Losartan + Garlic", drugs: ["Losartan", "Garlic"] },
  { name: "Sertraline + St. John's Wort", drugs: ["Sertraline", "St. John's Wort"] },
  { name: "Warfarin + Green Tea", drugs: ["Warfarin", "Green Tea"] },
  { name: "Levothyroxine + Ashwagandha", drugs: ["Levothyroxine", "Ashwagandha"] },
  { name: "Alprazolam + Valerian", drugs: ["Alprazolam", "Valerian Root"] },
  { name: "Aspirin + Turmeric (High Dose)", drugs: ["Aspirin", "Turmeric"] },
  { name: "Arnica + Warfarin", drugs: ["Arnica", "Warfarin"] },
  { name: "Grapefruit + Statins", drugs: ["Grapefruit", "Atorvastatin"] },
  { name: "Sildenafil + Nitrates", drugs: ["Sildenafil", "Nitroglycerin"] }
];

async function runTest(testCase) {
  const start = Date.now();
  console.log(`\n[TEST] Running: ${testCase.name}...`);
  
  try {
    // 1. API Fetch
    const apiData = await Promise.all(testCase.drugs.map(d => fetchDrugData(d)));
    
    // 2. RAG Retrieval
    const ragResult = await retrieveRelevantKnowledge(testCase.drugs, apiData);
    
    // 3. Groq Completion with Fallback
    const prompt = compileRagPrompt(testCase.drugs, ragResult.groqContext);
    let completion;
    let modelUsed = 'llama-3.3-70b-versatile';
    
    try {
      completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
        model: modelUsed,
        response_format: { type: 'json_object' }
      });
    } catch (err) {
      if (err.status === 429 || err.message.includes('rate_limit')) {
        console.warn(`[Groq] 70B Limited. Falling back to 8B for test context...`);
        modelUsed = 'llama-3.1-8b-instant';
        completion = await groq.chat.completions.create({
          messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
          model: modelUsed,
          response_format: { type: 'json_object' }
        });
      } else {
        throw err;
      }
    }
    
    const report = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const duration = Date.now() - start;
    
    const passed = report.total_risks_found > 0;
    console.log(`[RESULT] ${passed ? '✅ SUCCESS' : '❌ FAILED'} | Time: ${duration}ms`);
    if (passed) {
      console.log(`[SUMMARY] ${report.overall_risk_summary}`);
      console.log(`[SOURCES] ${report.interactions?.[0]?.source_citation || 'None cited'}`);
    } else {
      console.log(`[ERROR] No interactions detected for ${testCase.name}`);
    }
    
    return { name: testCase.name, passed, duration, report };
  } catch (err) {
    console.error(`[CRITICAL] Test ${testCase.name} crashed:`, err.message);
    return { name: testCase.name, passed: false, error: err.message };
  }
}

async function startSuite() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas. Starting Phase 10 Test Suite...');
  
  const results = [];
  for (const tc of TEST_CASES) {
    const res = await runTest(tc);
    results.push(res);
  }
  
  const totalPassed = results.filter(r => r.passed).length;
  const avgTime = results.reduce((acc, r) => acc + (r.duration || 0), 0) / TEST_CASES.length;
  
  console.log('\n=======================================');
  console.log('            PHASE 10 REPORT            ');
  console.log('=======================================');
  console.log(`Total Passed: ${totalPassed}/${TEST_CASES.length}`);
  console.log(`Average Response Time: ${avgTime.toFixed(0)}ms`);
  console.log('=======================================');
  
  await mongoose.disconnect();
  process.exit(totalPassed === TEST_CASES.length ? 0 : 1);
}

startSuite();
