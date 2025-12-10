const OpenAI = require('openai');

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Handles embedding generation, storage, and semantic search for Thoughtful AI knowledge base
 */

// In-memory vector store (in production, use a proper vector database)
let vectorStore = {
  documents: [],
  embeddings: [],
  initialized: false,
  lastUpdated: null
};

let openaiClient = null;

/**
 * Initialize OpenAI client
 */
function initializeOpenAI() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
}

/**
 * Generate embedding for a text chunk
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} - Embedding vector
 */
async function generateEmbedding(text) {
  const openai = initializeOpenAI();
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // Limit to model's context window
    encoding_format: 'float'
  });
  
  return response.data[0].embedding;
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} - Similarity score between 0 and 1
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Chunk text into smaller, meaningful pieces
 * @param {string} text - Text to chunk
 * @param {number} maxChunkSize - Maximum size of each chunk
 * @param {number} overlap - Overlap between chunks
 * @returns {Array<string>} - Array of text chunks
 */
function chunkText(text, maxChunkSize = 500, overlap = 50) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep last part for overlap
      const words = currentChunk.split(' ');
      currentChunk = words.slice(-Math.floor(overlap / 10)).join(' ') + ' ' + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Ingest scraped content into the RAG system
 * @param {Array<Object>} scrapedPages - Array of scraped page content
 * @returns {Promise<Object>} - Ingestion statistics
 */
async function ingestContent(scrapedPages) {
  console.log('📚 Starting RAG ingestion...');
  
  const documents = [];
  const embeddings = [];
  let totalChunks = 0;
  
  for (const page of scrapedPages) {
    // Process each content chunk from the page
    for (const contentItem of page.content) {
      // Further chunk large content items
      const textChunks = chunkText(contentItem);
      
      for (const chunk of textChunks) {
        if (chunk.length < 20) continue; // Skip very short chunks
        
        try {
          const embedding = await generateEmbedding(chunk);
          
          documents.push({
            id: `${page.pageName}-${totalChunks}`,
            text: chunk,
            metadata: {
              pageName: page.pageName,
              url: page.url,
              scrapedAt: page.scrapedAt
            }
          });
          
          embeddings.push(embedding);
          totalChunks++;
          
          // Rate limiting - small delay between API calls
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to embed chunk from ${page.pageName}:`, error.message);
        }
      }
    }
    
    console.log(`  ✓ Processed ${page.pageName}`);
  }
  
  // Update the vector store
  vectorStore = {
    documents,
    embeddings,
    initialized: true,
    lastUpdated: new Date().toISOString()
  };
  
  console.log(`✅ RAG ingestion complete. ${totalChunks} chunks indexed.`);
  
  return {
    totalPages: scrapedPages.length,
    totalChunks,
    lastUpdated: vectorStore.lastUpdated
  };
}

/**
 * Search for relevant documents given a query
 * @param {string} query - User's query
 * @param {number} topK - Number of results to return
 * @returns {Promise<Array<Object>>} - Array of relevant documents with scores
 */
async function searchDocuments(query, topK = 5) {
  if (!vectorStore.initialized || vectorStore.documents.length === 0) {
    console.warn('Vector store not initialized or empty');
    return [];
  }
  
  try {
    const queryEmbedding = await generateEmbedding(query);
    
    // Calculate similarity scores
    const scored = vectorStore.documents.map((doc, index) => ({
      ...doc,
      score: cosineSimilarity(queryEmbedding, vectorStore.embeddings[index])
    }));
    
    // Sort by score descending and take top K
    const results = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(doc => doc.score > 0.3); // Minimum relevance threshold
    
    return results;
  } catch (error) {
    console.error('Search failed:', error.message);
    throw error;
  }
}

/**
 * Generate context string from search results
 * @param {Array<Object>} searchResults - Array of relevant documents
 * @returns {string} - Formatted context string
 */
function buildContext(searchResults) {
  if (searchResults.length === 0) {
    return '';
  }
  
  const contextParts = searchResults.map((doc, index) => {
    return `[Source: ${doc.metadata.pageName}]\n${doc.text}`;
  });
  
  return contextParts.join('\n\n---\n\n');
}

/**
 * Get RAG-enhanced response for a query
 * @param {string} query - User's question
 * @returns {Promise<Object>} - Object containing context and relevant sources
 */
async function getRelevantContext(query) {
  const searchResults = await searchDocuments(query, 5);
  const context = buildContext(searchResults);
  
  return {
    context,
    sources: searchResults.map(r => ({
      pageName: r.metadata.pageName,
      url: r.metadata.url,
      relevanceScore: r.score
    })),
    hasContext: searchResults.length > 0
  };
}

/**
 * Check if RAG system is initialized
 * @returns {boolean}
 */
function isInitialized() {
  return vectorStore.initialized;
}

/**
 * Get RAG system status
 * @returns {Object}
 */
function getStatus() {
  return {
    initialized: vectorStore.initialized,
    documentCount: vectorStore.documents.length,
    lastUpdated: vectorStore.lastUpdated
  };
}

/**
 * Clear the vector store
 */
function clearVectorStore() {
  vectorStore = {
    documents: [],
    embeddings: [],
    initialized: false,
    lastUpdated: null
  };
  console.log('🗑️ Vector store cleared');
}

module.exports = {
  ingestContent,
  searchDocuments,
  getRelevantContext,
  buildContext,
  isInitialized,
  getStatus,
  clearVectorStore,
  generateEmbedding,
  cosineSimilarity,
  chunkText
};

