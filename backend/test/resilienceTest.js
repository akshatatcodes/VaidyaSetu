/**
 * Phase 10 - Step 61: Resilience Verification
 * Verifies that the RAG pipeline correctly falls back to Vector Store knowledge
 * when external medical APIs (RxNav/OpenFDA) are unavailable.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { retrieveRelevantKnowledge } = require('../src/utils/ragRetriever');
const { fetchDrugData } = require('../src/routes/realtimeInteractionRoutes');

async function runResilienceTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('--- Phase 10: RAG Resilience Test ---');

  // 1. Force API Failures via Environment
  process.env.SIMULATE_RXNAV_FAILURE = 'true';
  process.env.SIMULATE_FDA_FAILURE = 'true';

  const testMedicines = ["Warfarin", "St. John's Wort"];
  console.log(`[TEST] Medicines: ${testMedicines.join(', ')}`);
  console.log(`[TEST] Simulating CRITICAL API OUTAGE (RxNav + OpenFDA)...`);

  try {
    const start = Date.now();
    
    // Attempt fetch (should fail and provide empty results/errors)
    const apiData = await Promise.all(testMedicines.map(async (m) => {
      try {
        return await fetchDrugData(m);
      } catch (e) {
        console.log(`[MOCK] Correctly caught expected failure for ${m}: ${e.message}`);
        return { queryDrug: m, rxnavInteractions: [], fdaLabel: null, error: true };
      }
    }));

    // Run RAG Retrieval
    const ragResult = await retrieveRelevantKnowledge(testMedicines, apiData);
    const duration = Date.now() - start;

    console.log(`\n--- RESILIENCE REPORT ---`);
    console.log(`Pipeline Status: ${ragResult ? 'STABLE (FALLBACK ACTIVE)' : 'CRASHED'}`);
    console.log(`Time to Fallback: ${duration}ms`);
    console.log(`Vector Knowledge Chunks: ${ragResult.chunksRetrieved}`);
    console.log(`Direct API Interactions: ${ragResult.combined.realtimeAPIData.filter(d => !d.error).length} (Expected 0)`);
    
    const hasVectorData = ragResult.groqContext.includes('--- FROM KNOWLEDGE BASE ---');
    console.log(`Knowledge Base Integrity: ${hasVectorData ? '✅ VERIFIED' : '❌ FAILED'}`);

    if (hasVectorData && ragResult) {
      console.log('\n[RESULT] Phase 10 Resilience Test: ✅ PASSED');
      console.log('Summary: System maintained safety analysis using local vector store despite 100% API blackout.');
    }

  } catch (err) {
    console.error('[FAILED] Resilience test crashed:', err.message);
  }

  await mongoose.connection.close();
}

runResilienceTest();
