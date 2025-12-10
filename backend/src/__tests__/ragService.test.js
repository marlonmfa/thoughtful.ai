const { 
  cosineSimilarity, 
  chunkText, 
  buildContext,
  clearVectorStore,
  isInitialized,
  getStatus
} = require('../services/ragService');

describe('RAGService', () => {
  beforeEach(() => {
    clearVectorStore();
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vec = [1, 0, 0, 1];
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
      const vec1 = [1, 0, 0, 0];
      const vec2 = [-1, 0, 0, 0];
      const similarity = cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(-1, 5);
    });

    it('should handle partial similarity', () => {
      const vec1 = [1, 1, 0, 0];
      const vec2 = [1, 0, 1, 0];
      const similarity = cosineSimilarity(vec1, vec2);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should throw for vectors of different lengths', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0];
      expect(() => cosineSimilarity(vec1, vec2)).toThrow('Vectors must have the same length');
    });

    it('should handle zero vectors', () => {
      const vec1 = [0, 0, 0];
      const vec2 = [1, 1, 1];
      const similarity = cosineSimilarity(vec1, vec2);
      expect(similarity).toBe(0);
    });
  });

  describe('chunkText', () => {
    it('should split text into chunks', () => {
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
      const chunks = chunkText(text, 50, 10);
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should respect maxChunkSize approximately', () => {
      const text = 'Short sentence one. Short sentence two. Short sentence three. Short sentence four.';
      const maxSize = 60;
      const chunks = chunkText(text, maxSize, 5);
      
      // Chunks should be created respecting sentence boundaries
      expect(chunks.length).toBeGreaterThan(0);
      // Average chunk size should be reasonable relative to maxSize
      const avgSize = chunks.reduce((a, b) => a + b.length, 0) / chunks.length;
      expect(avgSize).toBeLessThan(maxSize * 2);
    });

    it('should handle empty text', () => {
      const chunks = chunkText('', 100, 10);
      expect(chunks).toEqual([]);
    });

    it('should handle single sentence', () => {
      const text = 'This is a single sentence.';
      const chunks = chunkText(text, 100, 10);
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe(text);
    });

    it('should preserve content without loss', () => {
      const text = 'First important fact. Second crucial detail. Third key information.';
      const chunks = chunkText(text, 50, 10);
      const combined = chunks.join(' ');
      
      // All original content should be present
      expect(combined).toContain('First important fact');
      expect(combined).toContain('Second crucial detail');
      expect(combined).toContain('Third key information');
    });
  });

  describe('buildContext', () => {
    it('should format search results into context string', () => {
      const searchResults = [
        {
          text: 'Prior Authorization automates healthcare processes.',
          metadata: { pageName: 'Prior Authorization', url: 'https://test.com' }
        },
        {
          text: 'Payment Posting handles financial reconciliation.',
          metadata: { pageName: 'Payment Posting', url: 'https://test.com/payment' }
        }
      ];
      
      const context = buildContext(searchResults);
      
      expect(context).toContain('[Source: Prior Authorization]');
      expect(context).toContain('Prior Authorization automates healthcare processes');
      expect(context).toContain('[Source: Payment Posting]');
      expect(context).toContain('Payment Posting handles financial reconciliation');
    });

    it('should return empty string for empty results', () => {
      const context = buildContext([]);
      expect(context).toBe('');
    });

    it('should separate results with dividers', () => {
      const searchResults = [
        { text: 'First result', metadata: { pageName: 'Page 1' } },
        { text: 'Second result', metadata: { pageName: 'Page 2' } }
      ];
      
      const context = buildContext(searchResults);
      expect(context).toContain('---');
    });
  });

  describe('isInitialized', () => {
    it('should return false when vector store is empty', () => {
      expect(isInitialized()).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return correct status for empty store', () => {
      const status = getStatus();
      
      expect(status.initialized).toBe(false);
      expect(status.documentCount).toBe(0);
      expect(status.lastUpdated).toBeNull();
    });
  });

  describe('clearVectorStore', () => {
    it('should reset the vector store', () => {
      // Clear and verify
      clearVectorStore();
      
      const status = getStatus();
      expect(status.initialized).toBe(false);
      expect(status.documentCount).toBe(0);
    });
  });
});

