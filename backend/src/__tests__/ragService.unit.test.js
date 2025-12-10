const { 
  cosineSimilarity, 
  chunkText, 
  buildContext,
  clearVectorStore,
  isInitialized,
  getStatus,
  generateEmbedding,
  ingestContent,
  searchDocuments,
  getRelevantContext
} = require('../services/ragService');

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockImplementation(({ input }) => ({
        data: [{ 
          embedding: Array(1536).fill(0).map((_, i) => Math.sin(i * input.length / 100)) 
        }]
      }))
    }
  }));
});

describe('RAG Service - Unit Tests', () => {
  beforeEach(() => {
    clearVectorStore();
    jest.clearAllMocks();
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vec = [1, 2, 3, 4, 5];
      const similarity = cosineSimilarity(vec, vec);
      expect(similarity).toBeCloseTo(1, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vec1 = [1, 0, 0, 0];
      const vec2 = [0, 1, 0, 0];
      const similarity = cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(0, 5);
    });

    it('should return -1 for opposite vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [-1, -2, -3];
      const similarity = cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(-1, 5);
    });

    it('should handle partial similarity correctly', () => {
      const vec1 = [1, 1, 0, 0];
      const vec2 = [1, 0, 1, 0];
      const similarity = cosineSimilarity(vec1, vec2);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
      // Expected: 0.5 (since dot product = 1, norms = sqrt(2) each)
      expect(similarity).toBeCloseTo(0.5, 5);
    });

    it('should throw error for vectors of different lengths', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2];
      expect(() => cosineSimilarity(vec1, vec2)).toThrow('Vectors must have the same length');
    });

    it('should return 0 for zero vector', () => {
      const zeroVec = [0, 0, 0];
      const normalVec = [1, 2, 3];
      expect(cosineSimilarity(zeroVec, normalVec)).toBe(0);
      expect(cosineSimilarity(normalVec, zeroVec)).toBe(0);
    });

    it('should handle large vectors efficiently', () => {
      const largeVec1 = Array(1536).fill(0).map((_, i) => Math.sin(i));
      const largeVec2 = Array(1536).fill(0).map((_, i) => Math.cos(i));
      
      const startTime = Date.now();
      const similarity = cosineSimilarity(largeVec1, largeVec2);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(100); // Should be very fast
      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThanOrEqual(-1);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should be commutative', () => {
      const vec1 = [1, 2, 3, 4];
      const vec2 = [5, 6, 7, 8];
      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(cosineSimilarity(vec2, vec1), 10);
    });
  });

  describe('chunkText', () => {
    it('should split text by sentences', () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const chunks = chunkText(text, 30, 5);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should handle empty text', () => {
      const chunks = chunkText('', 100, 10);
      expect(chunks).toEqual([]);
    });

    it('should handle text with no sentence boundaries', () => {
      const text = 'This is a single long piece of text without any sentence boundaries';
      const chunks = chunkText(text, 100, 10);
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe(text);
    });

    it('should handle multiple sentence endings', () => {
      const text = 'Question? Exclamation! Statement.';
      const chunks = chunkText(text, 20, 5);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should preserve all content', () => {
      const text = 'Important fact one. Important fact two. Important fact three.';
      const chunks = chunkText(text, 40, 5);
      const combined = chunks.join(' ');
      
      expect(combined).toContain('Important fact one');
      expect(combined).toContain('Important fact two');
      expect(combined).toContain('Important fact three');
    });

    it('should handle single sentence', () => {
      const text = 'This is a single sentence.';
      const chunks = chunkText(text, 100, 10);
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe(text);
    });

    it('should handle text with whitespace only', () => {
      const chunks = chunkText('   ', 100, 10);
      expect(chunks).toEqual([]);
    });

    it('should handle very long sentences gracefully', () => {
      const longSentence = 'This is a very ' + 'long '.repeat(100) + 'sentence.';
      const chunks = chunkText(longSentence, 50, 10);
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('buildContext', () => {
    it('should format search results with source attribution', () => {
      const searchResults = [
        {
          text: 'Prior Authorization automates the approval process.',
          metadata: { pageName: 'Prior Authorization', url: 'https://thoughtful.ai/pa' }
        }
      ];
      
      const context = buildContext(searchResults);
      
      expect(context).toContain('[Source: Prior Authorization]');
      expect(context).toContain('Prior Authorization automates the approval process');
    });

    it('should return empty string for no results', () => {
      const context = buildContext([]);
      expect(context).toBe('');
    });

    it('should include all search results', () => {
      const searchResults = [
        { text: 'Result one', metadata: { pageName: 'Page 1' } },
        { text: 'Result two', metadata: { pageName: 'Page 2' } },
        { text: 'Result three', metadata: { pageName: 'Page 3' } }
      ];
      
      const context = buildContext(searchResults);
      
      expect(context).toContain('[Source: Page 1]');
      expect(context).toContain('[Source: Page 2]');
      expect(context).toContain('[Source: Page 3]');
      expect(context).toContain('Result one');
      expect(context).toContain('Result two');
      expect(context).toContain('Result three');
    });

    it('should separate results with dividers', () => {
      const searchResults = [
        { text: 'First', metadata: { pageName: 'A' } },
        { text: 'Second', metadata: { pageName: 'B' } }
      ];
      
      const context = buildContext(searchResults);
      expect(context).toContain('---');
    });
  });

  describe('Vector Store State', () => {
    it('should start uninitialized', () => {
      expect(isInitialized()).toBe(false);
    });

    it('should report correct status when empty', () => {
      const status = getStatus();
      
      expect(status.initialized).toBe(false);
      expect(status.documentCount).toBe(0);
      expect(status.lastUpdated).toBeNull();
    });

    it('should clear vector store correctly', () => {
      clearVectorStore();
      
      expect(isInitialized()).toBe(false);
      expect(getStatus().documentCount).toBe(0);
    });
  });

  describe('ingestContent', () => {
    it('should ingest scraped content and update status', async () => {
      const mockScrapedPages = [
        {
          pageName: 'Test Page',
          url: 'https://test.com',
          scrapedAt: new Date().toISOString(),
          content: ['This is test content that is long enough to be processed.']
        }
      ];

      const result = await ingestContent(mockScrapedPages);

      expect(result.totalPages).toBe(1);
      expect(result.totalChunks).toBeGreaterThan(0);
      expect(result.lastUpdated).toBeDefined();
      expect(isInitialized()).toBe(true);
    });

    it('should handle multiple pages', async () => {
      const mockScrapedPages = [
        {
          pageName: 'Page 1',
          url: 'https://test.com/1',
          scrapedAt: new Date().toISOString(),
          content: ['Content from page one with enough text.']
        },
        {
          pageName: 'Page 2',
          url: 'https://test.com/2',
          scrapedAt: new Date().toISOString(),
          content: ['Content from page two with enough text.']
        }
      ];

      const result = await ingestContent(mockScrapedPages);

      expect(result.totalPages).toBe(2);
      expect(result.totalChunks).toBeGreaterThanOrEqual(2);
    });

    it('should skip very short content', async () => {
      const mockScrapedPages = [
        {
          pageName: 'Short Page',
          url: 'https://test.com',
          scrapedAt: new Date().toISOString(),
          content: ['Hi', 'Ok', 'Yes'] // All too short
        }
      ];

      const result = await ingestContent(mockScrapedPages);

      expect(result.totalChunks).toBe(0);
    });

    it('should handle empty content array', async () => {
      const mockScrapedPages = [
        {
          pageName: 'Empty Page',
          url: 'https://test.com',
          scrapedAt: new Date().toISOString(),
          content: []
        }
      ];

      const result = await ingestContent(mockScrapedPages);

      expect(result.totalChunks).toBe(0);
    });
  });

  describe('searchDocuments', () => {
    beforeEach(async () => {
      // Ingest some test content first
      const mockScrapedPages = [
        {
          pageName: 'Prior Authorization',
          url: 'https://thoughtful.ai/pa',
          scrapedAt: new Date().toISOString(),
          content: ['Prior authorization automates the approval process for healthcare procedures.']
        },
        {
          pageName: 'Payment Posting',
          url: 'https://thoughtful.ai/pp',
          scrapedAt: new Date().toISOString(),
          content: ['Payment posting reconciles payments and posts remittances automatically.']
        }
      ];
      await ingestContent(mockScrapedPages);
    });

    it('should return results when vector store is initialized', async () => {
      const results = await searchDocuments('prior authorization', 3);
      
      expect(Array.isArray(results)).toBe(true);
    });

    it('should return results with scores', async () => {
      const results = await searchDocuments('payment posting', 3);
      
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('score');
        expect(results[0]).toHaveProperty('text');
        expect(results[0]).toHaveProperty('metadata');
      }
    });

    it('should respect topK parameter', async () => {
      const results = await searchDocuments('healthcare', 1);
      
      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('should filter results below threshold', async () => {
      const results = await searchDocuments('completely unrelated xyz abc query', 5);
      
      // All results should have score > 0.3 (threshold)
      results.forEach(result => {
        expect(result.score).toBeGreaterThan(0.3);
      });
    });
  });

  describe('getRelevantContext', () => {
    beforeEach(async () => {
      const mockScrapedPages = [
        {
          pageName: 'Solutions',
          url: 'https://thoughtful.ai/solutions',
          scrapedAt: new Date().toISOString(),
          content: ['Thoughtful AI provides healthcare automation solutions including prior auth and payment posting.']
        }
      ];
      await ingestContent(mockScrapedPages);
    });

    it('should return context object with required fields', async () => {
      const result = await getRelevantContext('healthcare solutions');
      
      expect(result).toHaveProperty('context');
      expect(result).toHaveProperty('sources');
      expect(result).toHaveProperty('hasContext');
    });

    it('should indicate when context is available', async () => {
      const result = await getRelevantContext('healthcare automation');
      
      expect(typeof result.hasContext).toBe('boolean');
    });

    it('should include source information', async () => {
      const result = await getRelevantContext('prior auth');
      
      expect(Array.isArray(result.sources)).toBe(true);
      if (result.sources.length > 0) {
        expect(result.sources[0]).toHaveProperty('pageName');
        expect(result.sources[0]).toHaveProperty('url');
        expect(result.sources[0]).toHaveProperty('relevanceScore');
      }
    });
  });
});

