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

async function performVectorSearch(queryVector, medicines = []) {
  const db = mongoose.connection.db;
  const collection = db.collection('knowledge_chunks');
  
  // Post-filtering logic for accuracy
  const filterQuery = medicines.length > 0 ? {
    $or: medicines.map(med => ({
      text: { $regex: med, $options: 'i' }
    }))
  } : {};

  // Standard Pipeline (Safe)
  const pipeline = [
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector,
        numCandidates: 100,
        limit: 40 
      }
    },
    { $match: filterQuery }, // Filter by medicine name in regular $match stage
    { $limit: 10 },
    { $project: { _id: 0, text: 1, source_database: 1, document_title: 1, score: { $meta: 'vectorSearchScore' } } }
  ];

  try {
    return await collection.aggregate(pipeline).toArray();
  } catch (err) {
    console.warn(`[RAG-Fallback] Primary aggregation failed: ${err.message}. Attempting recovery...`);
    
    // Fallback: Simple Vector Search (No match filtering)
    const fallbackPipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector,
          numCandidates: 50,
          limit: 10
        }
      },
      { $project: { _id: 0, text: 1, source_database: 1, document_title: 1, score: { $meta: 'vectorSearchScore' } } }
    ];
    return await collection.aggregate(fallbackPipeline).toArray();
  }
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

/**
 * Phase 3 Step 12: Multi-Drug Interaction Logic (Pairwise)
 */
async function retrieveRelevantKnowledge(medicines = []) {
  console.log(`[RAG-Debug] retrieveRelevantKnowledge started for: ${medicines.join(', ')}`);
  if (!medicines || medicines.length === 0) return null;
  const startTime = Date.now();
  
  // Generate pairs for targeted search
  const pairs = [];
  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      pairs.push([medicines[i], medicines[j]]);
    }
  }

  // If only 1 drug, just search for that drug's profile
  const searchTargets = pairs.length > 0 ? pairs : [[medicines[0]]];

  const resultsPool = await Promise.all(searchTargets.map(async (target) => {
    const queryPhrase = `interaction mechanism adverse effect of ${target.join(' and ')}`;
    const queryVector = await generateQueryEmbedding(queryPhrase);
    const chunks = await performVectorSearch(queryVector, target);
    return { target: target.join(' + '), chunks };
  }));

  // Aggregate and deduplicate chunks
  const allChunks = [];
  const seenTexts = new Set();
  
  resultsPool.forEach(res => {
    res.chunks.forEach(chunk => {
      if (!seenTexts.has(chunk.text)) {
        allChunks.push(chunk);
        seenTexts.add(chunk.text);
      }
    });
  });

  // Clinical Data (RxNav/OpenFDA) is still per-drug
  const apiData = await Promise.all(
    medicines.map(drug => fetchDrugData(drug).catch(() => null))
  ).then(res => res.filter(r => r));

  const rxcuis = apiData.map(d => d.rxcui).filter(id => id);
  const directInteractions = rxcuis.length >= 2 ? await getInteractionsBetween(rxcuis).catch(() => []) : [];

  const { ranked } = filterAndRankChunks(allChunks, medicines);
  const mentions = extractInteractionMentions(ranked, medicines);
  const combined = combineKnowledgeSources(ranked, apiData);
  combined.directClinicalMatches = directInteractions;

  const groqContext = prepareGroqContext(combined, mentions, medicines);
  
  return { 
    medicines,
    chunksRetrieved: allChunks.length, 
    interactionMentions: mentions, 
    combined, 
    groqContext,
    totalDuration: Date.now() - startTime
  };
}

module.exports = { retrieveRelevantKnowledge };
