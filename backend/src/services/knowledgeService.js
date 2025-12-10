const { scrapeAllPages } = require('./scraperService');
const { ingestContent, isInitialized, getStatus, clearVectorStore } = require('./ragService');

/**
 * Knowledge Service
 * Orchestrates the scraping and RAG ingestion process
 */

let initializationPromise = null;
let initializationError = null;

/**
 * Initialize the knowledge base by scraping thoughtful.ai and ingesting into RAG
 * @param {boolean} force - Force re-initialization even if already initialized
 * @returns {Promise<Object>} - Initialization result
 */
async function initializeKnowledgeBase(force = false) {
  // If already initialized and not forcing, return current status
  if (isInitialized() && !force) {
    console.log('📘 Knowledge base already initialized');
    return {
      success: true,
      message: 'Knowledge base already initialized',
      status: getStatus()
    };
  }
  
  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    console.log('⏳ Initialization already in progress, waiting...');
    return initializationPromise;
  }
  
  // Start initialization
  initializationPromise = performInitialization(force);
  
  try {
    const result = await initializationPromise;
    initializationError = null;
    return result;
  } catch (error) {
    initializationError = error;
    throw error;
  } finally {
    initializationPromise = null;
  }
}

/**
 * Perform the actual initialization
 * @param {boolean} force - Force clear existing data
 * @returns {Promise<Object>}
 */
async function performInitialization(force) {
  const startTime = Date.now();
  console.log('🚀 Starting knowledge base initialization...');
  
  try {
    // Clear existing data if forcing
    if (force) {
      clearVectorStore();
    }
    
    // Step 1: Scrape content from thoughtful.ai
    const scrapedContent = await scrapeAllPages();
    
    if (scrapedContent.length === 0) {
      throw new Error('No content was scraped from thoughtful.ai');
    }
    
    // Step 2: Ingest content into RAG system
    const ingestionResult = await ingestContent(scrapedContent);
    
    const duration = Date.now() - startTime;
    
    console.log(`🎉 Knowledge base initialization complete in ${duration}ms`);
    
    return {
      success: true,
      message: 'Knowledge base initialized successfully',
      duration,
      scraping: {
        pagesScraped: scrapedContent.length,
        pages: scrapedContent.map(p => p.pageName)
      },
      ingestion: ingestionResult
    };
  } catch (error) {
    console.error('❌ Knowledge base initialization failed:', error.message);
    throw error;
  }
}

/**
 * Get the current status of the knowledge base
 * @returns {Object}
 */
function getKnowledgeBaseStatus() {
  const ragStatus = getStatus();
  
  return {
    initialized: ragStatus.initialized,
    documentCount: ragStatus.documentCount,
    lastUpdated: ragStatus.lastUpdated,
    error: initializationError ? initializationError.message : null,
    isInitializing: initializationPromise !== null
  };
}

/**
 * Check if knowledge base is ready for queries
 * @returns {boolean}
 */
function isKnowledgeBaseReady() {
  return isInitialized();
}

/**
 * Refresh the knowledge base (scrape and re-ingest)
 * @returns {Promise<Object>}
 */
async function refreshKnowledgeBase() {
  return initializeKnowledgeBase(true);
}

module.exports = {
  initializeKnowledgeBase,
  getKnowledgeBaseStatus,
  isKnowledgeBaseReady,
  refreshKnowledgeBase
};

