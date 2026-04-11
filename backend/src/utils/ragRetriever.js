const mongoose = require('mongoose');
const { getInteractionsBetween } = require('./rxnav');
const { fetchDrugData, rateLimiter } = require('../routes/realtimeInteractionRoutes'); // Import for orchestration


let embeddingPipelineInstance = null;
const embeddingCache = new Map(); // Sub-3s goal

async function getEmbeddingPipeline() {
  if (embeddingPipelineInstance) return embeddingPipelineInstance;
  const { pipeline } = await import('@xenova/transformers');
  embeddingPipelineInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  return embeddingPipelineInstance;
}

async function generateQueryEmbedding(text) {
  if (embeddingCache.has(text)) return embeddingCache.get(text);
  const pipe = await getEmbeddingPipeline();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  const vector = Array.from(output.data);
  embeddingCache.set(text, vector);
  return vector;
}

async function performVectorSearch(queryVector, filters = {}) {
  const db = mongoose.connection.db;
  const collection = db.collection('knowledge_chunks');
  const pipeline = [
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector,
        numCandidates: 60, // Optimized for latency
        limit: 8, // Leaner context
        ...(filters.content_type && { filter: { content_type: filters.content_type } })
      }
    },
    { $project: { _id: 0, text: 1, source_database: 1, document_title: 1, content_type: 1, score: { $meta: 'vectorSearchScore' } } }
  ];
  return await collection.aggregate(pipeline).toArray();
}

function filterAndRankChunks(chunks, medicineNames = []) {
  const SCORE_THRESHOLD = 0.6;
  const normalizedNames = medicineNames.map(n => n.toLowerCase().trim());
  let filtered = chunks.filter(c => c.score >= SCORE_THRESHOLD);
  filtered = filtered.map(chunk => {
    const textLower = chunk.text.toLowerCase();
    const mentionBoost = normalizedNames.some(name => textLower.includes(name)) ? 0.1 : 0;
    return { ...chunk, boostedScore: chunk.score + mentionBoost };
  });
  filtered.sort((a, b) => b.boostedScore - a.boostedScore);
  return { ranked: filtered };
}

function extractInteractionMentions(chunks, medicineNames = []) {
  const keywords = [
    'interact', 'interaction', 'mechanism', 'contraindicate',
    'warning', 'severe', 'caution', 'adverse', 'avoid', 'inhibit',
    'increase', 'decrease', 'risk', 'cyp', 'enzyme', 'metabolism',
    'bleeding', 'hypotension', 'toxicity'
  ];
  const normalizedNames = medicineNames.map(n => n.toLowerCase().trim());
  const mentions = [];
  for (const chunk of chunks) {
    const sentences = chunk.text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    for (const sentence of sentences) {
      const sentLower = sentence.toLowerCase();
      if (keywords.some(kw => sentLower.includes(kw)) || normalizedNames.some(name => sentLower.includes(name))) {
        mentions.push({ sentence: sentence.trim(), source: chunk.source_database, score: chunk.score });
      }
    }
  }
  const seen = new Set();
  return mentions.filter(m => {
    if (seen.has(m.sentence)) return false;
    seen.add(m.sentence);
    return true;
  }).slice(0, 15);
}

function combineKnowledgeSources(vectorChunks, apiData = []) {
  return {
    vectorStoreKnowledge: vectorChunks.map(c => ({ text: c.text, source: c.source_database, document: c.document_title, relevanceScore: c.score })),
    realtimeAPIData: apiData.map(drug => ({
      drug: drug.normalizedName || drug.queryDrug,
      rxcui: drug.rxcui,
      rxnavInteractions: drug.rxnavInteractions || [],
      fdaWarnings: drug.fdaLabel?.warningsText || null,
      source: 'RxNav + OpenFDA'
    }))
  };
}

function prepareGroqContext(combinedKnowledge, interactionMentions = [], medicines = []) {
  const MAX_CONTEXT_CHARS = 8000;
  let context = `=== MEDICAL KNOWLEDGE BASE ===\nAnalyzed: ${medicines.join(', ')}\n\n`;

  if (combinedKnowledge.directClinicalMatches?.length > 0) {
    context += `--- DIRECT CLINICAL CONFLICTS (RxNav) ---\n`;
    combinedKnowledge.directClinicalMatches.forEach(i => {
      context += `[Conflict]: ${i.drugA} + ${i.drugB} | ${i.severity}\n${i.description}\n\n`;
    });
  }

  if (combinedKnowledge.vectorStoreKnowledge.length > 0) {
    context += `--- FROM KNOWLEDGE BASE ---\n`;
    combinedKnowledge.vectorStoreKnowledge.slice(0, 5).forEach(c => {
      context += `[${c.source}]: ${c.text.slice(0, 600)}\n\n`;
    });
  }

  if (interactionMentions.length > 0) {
    context += `--- INTERACTION MENTIONS ---\n`;
    interactionMentions.slice(0, 8).forEach(m => context += `[${m.source}]: ${m.sentence}\n`);
    context += '\n';
  }

  return context.slice(0, MAX_CONTEXT_CHARS);
}

async function retrieveRelevantKnowledge(medicines = []) {
  if (!medicines || medicines.length === 0) return null;
  const startTime = Date.now();
  const queryPhrase = `interaction between ${medicines.join(' and ')} mechanism adverse effects`;
  
  // -- START CONCURRENT PIPELINE --
  // 1. Embedding generation (CPU Bound)
  // 2. Clinical Data Retrieval (IO Bound - RxNav/OpenFDA)
  const embeddingPromise = generateQueryEmbedding(queryPhrase);
  
  const clinicalDataStartTime = Date.now();
  const apiDataPromise = Promise.allSettled(
    medicines.map(drug => {
      rateLimiter.check();
      return fetchDrugData(drug);
    })
  ).then(results => results.filter(o => o.status === 'fulfilled').map(o => o.value));

  // 3. Wait for embedding to trigger Vector Search
  const queryVector = await embeddingPromise;
  const vectorSearchStartTime = Date.now();
  const rawChunksPromise = performVectorSearch(queryVector);
  
  // 4. Parallel RxNav direct interaction check (using RxCUIs once available)
  const directInteractionsPromise = apiDataPromise.then(apiData => {
    const rxcuis = apiData.map(d => d.rxcui).filter(id => id);
    if (rxcuis.length < 2) return [];
    return getInteractionsBetween(rxcuis).catch(err => {
      console.warn(`[RxNav] Parallel Interaction lookup failed: ${err.message}`);
      return [];
    });
  });

  // Wait for the remaining IO tasks
  const [rawChunks, apiData, directInteractions] = await Promise.all([
    rawChunksPromise,
    apiDataPromise,
    directInteractionsPromise
  ]);

  const vectorSearchDuration = Date.now() - vectorSearchStartTime;
  const clinicalDataDuration = Date.now() - clinicalDataStartTime;
  
  // -- PROCESSING --
  const { ranked } = filterAndRankChunks(rawChunks, medicines);
  const mentions = extractInteractionMentions(ranked, medicines);
  const combined = combineKnowledgeSources(ranked, apiData);
  combined.directClinicalMatches = directInteractions;

  const groqContext = prepareGroqContext(combined, mentions, medicines);
  const totalDuration = Date.now() - startTime;
  
  console.log(`[RAG] Latency Diagnostics: Vector(${vectorSearchDuration}ms) | Clinical(${clinicalDataDuration}ms) | Total(${totalDuration}ms)`);

  return { 
    queryPhrase, 
    chunksRetrieved: rawChunks.length, 
    chunksAfterFilter: ranked.length, 
    interactionMentions: mentions, 
    combined, 
    groqContext,
    totalDuration
  };
}

module.exports = { retrieveRelevantKnowledge };
