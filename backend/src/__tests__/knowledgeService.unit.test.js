const { 
  getKnowledgeBaseStatus, 
  isKnowledgeBaseReady,
  initializeKnowledgeBase,
  refreshKnowledgeBase
} = require('../services/knowledgeService');
const { clearVectorStore } = require('../services/ragService');

// Mock the scraper service
jest.mock('../services/scraperService', () => ({
  scrapeAllPages: jest.fn()
}));

// Mock the rag service partially
jest.mock('../services/ragService', () => {
  const originalModule = jest.requireActual('../services/ragService');
  return {
    ...originalModule,
    ingestContent: jest.fn().mockResolvedValue({
      totalPages: 5,
      totalChunks: 100,
      lastUpdated: new Date().toISOString()
    }),
    generateEmbedding: jest.fn().mockResolvedValue(Array(1536).fill(0.1))
  };
});

const { scrapeAllPages } = require('../services/scraperService');
const { ingestContent } = require('../services/ragService');

describe('Knowledge Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearVectorStore();
  });

  describe('getKnowledgeBaseStatus', () => {
    it('should return status object with all required fields', () => {
      const status = getKnowledgeBaseStatus();
      
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('documentCount');
      expect(status).toHaveProperty('lastUpdated');
      expect(status).toHaveProperty('error');
      expect(status).toHaveProperty('isInitializing');
    });

    it('should show uninitialized state by default', () => {
      const status = getKnowledgeBaseStatus();
      
      expect(status.initialized).toBe(false);
      expect(status.documentCount).toBe(0);
    });

    it('should show no error by default', () => {
      const status = getKnowledgeBaseStatus();
      expect(status.error).toBeNull();
    });

    it('should show not initializing by default', () => {
      const status = getKnowledgeBaseStatus();
      expect(status.isInitializing).toBe(false);
    });
  });

  describe('isKnowledgeBaseReady', () => {
    it('should return false when not initialized', () => {
      expect(isKnowledgeBaseReady()).toBe(false);
    });
  });

  describe('initializeKnowledgeBase', () => {
    it('should call scrapeAllPages', async () => {
      scrapeAllPages.mockResolvedValue([
        {
          pageName: 'Home',
          url: 'https://thoughtful.ai',
          scrapedAt: new Date().toISOString(),
          content: ['Test content']
        }
      ]);

      await initializeKnowledgeBase(true);

      expect(scrapeAllPages).toHaveBeenCalled();
    });

    it('should call ingestContent with scraped data', async () => {
      const mockScrapedData = [
        {
          pageName: 'Home',
          url: 'https://thoughtful.ai',
          scrapedAt: new Date().toISOString(),
          content: ['Test content']
        }
      ];
      scrapeAllPages.mockResolvedValue(mockScrapedData);

      await initializeKnowledgeBase(true);

      expect(ingestContent).toHaveBeenCalledWith(mockScrapedData);
    });

    it('should return success result', async () => {
      scrapeAllPages.mockResolvedValue([
        {
          pageName: 'Test',
          url: 'https://test.com',
          scrapedAt: new Date().toISOString(),
          content: ['Content']
        }
      ]);

      const result = await initializeKnowledgeBase(true);

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully');
    });

    it('should include scraping statistics in result', async () => {
      scrapeAllPages.mockResolvedValue([
        { pageName: 'Page1', url: 'url1', scrapedAt: new Date().toISOString(), content: ['c1'] },
        { pageName: 'Page2', url: 'url2', scrapedAt: new Date().toISOString(), content: ['c2'] }
      ]);

      const result = await initializeKnowledgeBase(true);

      expect(result.scraping).toBeDefined();
      expect(result.scraping.pagesScraped).toBe(2);
      expect(result.scraping.pages).toContain('Page1');
      expect(result.scraping.pages).toContain('Page2');
    });

    it('should include ingestion statistics in result', async () => {
      scrapeAllPages.mockResolvedValue([
        { pageName: 'Test', url: 'url', scrapedAt: new Date().toISOString(), content: ['c'] }
      ]);

      const result = await initializeKnowledgeBase(true);

      expect(result.ingestion).toBeDefined();
      expect(result.ingestion.totalChunks).toBeDefined();
    });

    it('should include duration in result', async () => {
      scrapeAllPages.mockResolvedValue([
        { pageName: 'Test', url: 'url', scrapedAt: new Date().toISOString(), content: ['c'] }
      ]);

      const result = await initializeKnowledgeBase(true);

      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe('number');
    });

    it('should throw error when scraping returns empty', async () => {
      scrapeAllPages.mockResolvedValue([]);

      await expect(initializeKnowledgeBase(true)).rejects.toThrow('No content was scraped');
    });

    it('should throw error when scraping fails', async () => {
      scrapeAllPages.mockRejectedValue(new Error('Scraping failed'));

      await expect(initializeKnowledgeBase(true)).rejects.toThrow('Scraping failed');
    });
  });

  describe('refreshKnowledgeBase', () => {
    it('should force re-initialization', async () => {
      scrapeAllPages.mockResolvedValue([
        { pageName: 'Test', url: 'url', scrapedAt: new Date().toISOString(), content: ['c'] }
      ]);

      const result = await refreshKnowledgeBase();

      expect(result.success).toBe(true);
      expect(scrapeAllPages).toHaveBeenCalled();
    });
  });
});

