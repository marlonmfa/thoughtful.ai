const { getKnowledgeBaseStatus, isKnowledgeBaseReady } = require('../services/knowledgeService');
const { clearVectorStore } = require('../services/ragService');

describe('KnowledgeService', () => {
  beforeEach(() => {
    clearVectorStore();
  });

  describe('getKnowledgeBaseStatus', () => {
    it('should return status object with required fields', () => {
      const status = getKnowledgeBaseStatus();
      
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('documentCount');
      expect(status).toHaveProperty('lastUpdated');
      expect(status).toHaveProperty('error');
      expect(status).toHaveProperty('isInitializing');
    });

    it('should show uninitialized state initially', () => {
      const status = getKnowledgeBaseStatus();
      
      expect(status.initialized).toBe(false);
      expect(status.documentCount).toBe(0);
      expect(status.lastUpdated).toBeNull();
    });
  });

  describe('isKnowledgeBaseReady', () => {
    it('should return false when not initialized', () => {
      expect(isKnowledgeBaseReady()).toBe(false);
    });
  });
});

