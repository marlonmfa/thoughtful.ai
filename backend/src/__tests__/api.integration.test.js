/**
 * API Integration Tests
 * 
 * These tests verify the HTTP API endpoints work correctly with the
 * underlying services, including knowledge base and chat functionality.
 */

const request = require('supertest');
const { app } = require('../index');

// Mock OpenAI
jest.mock('openai', () => {
  const createEmbedding = (text) => {
    const normalized = text.toLowerCase();
    const embedding = Array(1536).fill(0);
    
    const keyTerms = {
      'prior': [0, 100],
      'authorization': [1, 101],
      'payment': [2, 102],
      'posting': [3, 103],
      'healthcare': [4, 104],
      'automation': [5, 105],
      'thoughtful': [6, 106],
      'ai': [7, 107],
      'solutions': [8, 108],
      'rcm': [9, 109]
    };
    
    for (const [term, indices] of Object.entries(keyTerms)) {
      if (normalized.includes(term)) {
        indices.forEach(i => {
          embedding[i] = 1.0;
        });
      }
    }
    
    return embedding;
  };

  return jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockImplementation(({ input }) => ({
        data: [{ embedding: createEmbedding(input) }]
      }))
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Thoughtful AI offers healthcare automation solutions including Prior Authorization, Payment Posting, and Accounts Receivable.' } }]
        })
      }
    }
  }));
});

// Mock scraper to avoid network calls
jest.mock('../services/scraperService', () => ({
  scrapeAllPages: jest.fn().mockResolvedValue([
    {
      pageName: 'Home',
      url: 'https://thoughtful.ai',
      scrapedAt: new Date().toISOString(),
      content: [
        'Thoughtful AI provides AI-powered healthcare RCM automation solutions.',
        'Our platform includes Prior Authorization, Payment Posting, and Accounts Receivable.'
      ]
    },
    {
      pageName: 'Prior Authorization',
      url: 'https://thoughtful.ai/pa',
      scrapedAt: new Date().toISOString(),
      content: [
        'Prior Authorization automates healthcare approval workflows.',
        'Reduce manual work and accelerate approvals with AI.'
      ]
    }
  ]),
  scrapePage: jest.fn(),
  extractTextFromHtml: jest.fn(),
  parseContent: jest.fn(),
  PAGES_TO_SCRAPE: [
    { url: 'https://www.thoughtful.ai/', name: 'Home' },
    { url: 'https://www.thoughtful.ai/prior-authorization', name: 'Prior Authorization' }
  ]
}));

// Import after mocking
const { clearVectorStore, isInitialized } = require('../services/ragService');
const { initializeKnowledgeBase, getKnowledgeBaseStatus } = require('../services/knowledgeService');

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Initialize knowledge base for tests
    clearVectorStore();
    try {
      await initializeKnowledgeBase(true);
    } catch (e) {
      console.error('Setup failed:', e);
    }
  });

  afterAll(() => {
    clearVectorStore();
  });

  describe('Health Endpoint', () => {
    describe('GET /api/health', () => {
      it('should return 200 OK', async () => {
        const response = await request(app)
          .get('/api/health')
          .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('timestamp');
      });

      it('should include knowledge base status', async () => {
        const response = await request(app)
          .get('/api/health')
          .expect(200);

        expect(response.body).toHaveProperty('knowledgeBase');
        expect(response.body.knowledgeBase).toHaveProperty('initialized');
        expect(response.body.knowledgeBase).toHaveProperty('documentCount');
      });

      it('should return valid ISO timestamp', async () => {
        const response = await request(app)
          .get('/api/health')
          .expect(200);

        const timestamp = new Date(response.body.timestamp);
        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.getTime()).not.toBeNaN();
      });
    });
  });

  describe('Knowledge Base Endpoints', () => {
    describe('GET /api/knowledge/status', () => {
      it('should return 200 with status object', async () => {
        const response = await request(app)
          .get('/api/knowledge/status')
          .expect(200);

        expect(response.body).toHaveProperty('initialized');
        expect(response.body).toHaveProperty('documentCount');
        expect(response.body).toHaveProperty('lastUpdated');
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('isInitializing');
      });

      it('should show initialized status after initialization', async () => {
        const response = await request(app)
          .get('/api/knowledge/status')
          .expect(200);

        expect(response.body.initialized).toBe(true);
        expect(response.body.documentCount).toBeGreaterThan(0);
      });
    });

    describe('POST /api/knowledge/refresh', () => {
      it('should return 200 on successful refresh', async () => {
        const response = await request(app)
          .post('/api/knowledge/refresh')
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should include scraping and ingestion stats', async () => {
        const response = await request(app)
          .post('/api/knowledge/refresh')
          .expect(200);

        expect(response.body).toHaveProperty('scraping');
        expect(response.body.scraping).toHaveProperty('pagesScraped');
        expect(response.body).toHaveProperty('ingestion');
        expect(response.body.ingestion).toHaveProperty('totalChunks');
      });
    });
  });

  describe('Chat Endpoint', () => {
    describe('POST /api/chat - Success Cases', () => {
      it('should return 200 for valid message', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ message: 'What is Prior Authorization?' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('answer');
        expect(response.body.data).toHaveProperty('source');
      });

      it('should return answer for healthcare questions', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ message: 'What solutions does Thoughtful AI offer?' })
          .expect(200);

        expect(response.body.data.answer).toBeTruthy();
        expect(response.body.data.answer.length).toBeGreaterThan(0);
      });

      it('should include source information in response', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ message: 'Tell me about healthcare automation' })
          .expect(200);

        expect(response.body.data.source).toBeDefined();
        expect(['predefined', 'rag', 'openai']).toContain(response.body.data.source);
      });

      it('should accept conversation history', async () => {
        const conversationHistory = [
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Hello! How can I help?' }
        ];

        const response = await request(app)
          .post('/api/chat')
          .send({ 
            message: 'What is Prior Authorization?',
            conversationHistory 
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should trim message whitespace', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ message: '  What is EVA?  ' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should return RAG sources when available', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ message: 'What RCM solutions do you have?' })
          .expect(200);

        if (response.body.data.source === 'rag') {
          expect(response.body.data.ragSources).toBeDefined();
          expect(Array.isArray(response.body.data.ragSources)).toBe(true);
        }
      });
    });

    describe('POST /api/chat - Predefined Responses', () => {
      it('should return predefined response for EVA question', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ message: 'What does the eligibility verification agent EVA do?' })
          .expect(200);

        expect(response.body.data.source).toBe('predefined');
        expect(response.body.data.answer.toLowerCase()).toContain('eligibility');
      });

      it('should return predefined response for Thoughtful AI agents', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ message: 'Tell me about Thoughtful AI agents' })
          .expect(200);

        expect(response.body.data.source).toBe('predefined');
        expect(response.body.data.answer.toLowerCase()).toContain('thoughtful ai');
      });
    });

    describe('POST /api/chat - Error Cases', () => {
      it('should return 400 for missing message', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({})
          .expect(400);

        expect(response.body.error).toBe('Invalid input');
      });

      it('should return 400 for empty message', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ message: '' })
          .expect(400);

        expect(response.body.error).toBe('Invalid input');
      });

      it('should return 400 for whitespace-only message', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ message: '   ' })
          .expect(400);

        expect(response.body.error).toBe('Invalid input');
      });

      it('should return 400 for non-string message', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ message: 123 })
          .expect(400);

        expect(response.body.error).toBe('Invalid input');
      });

      it('should return 400 for null message', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ message: null })
          .expect(400);

        expect(response.body.error).toBe('Invalid input');
      });

      it('should return 400 for array message', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ message: ['hello', 'world'] })
          .expect(400);

        expect(response.body.error).toBe('Invalid input');
      });
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown GET routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    it('should return 404 for unknown POST routes', async () => {
      const response = await request(app)
        .post('/api/nonexistent')
        .send({ data: 'test' })
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    it('should return 404 for root path', async () => {
      const response = await request(app)
        .get('/')
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });
  });

  describe('Request Content Types', () => {
    it('should accept application/json', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ message: 'Test' }))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Response Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // CORS middleware should be active
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('End-to-End Scenarios', () => {
    it('should handle a typical user flow', async () => {
      // Step 1: Check health
      const healthResponse = await request(app)
        .get('/api/health')
        .expect(200);
      expect(healthResponse.body.status).toBeDefined();

      // Step 2: Check knowledge status
      const statusResponse = await request(app)
        .get('/api/knowledge/status')
        .expect(200);
      expect(statusResponse.body.initialized).toBe(true);

      // Step 3: Ask a question
      const chatResponse = await request(app)
        .post('/api/chat')
        .send({ message: 'What is Thoughtful AI?' })
        .expect(200);
      expect(chatResponse.body.success).toBe(true);
      expect(chatResponse.body.data.answer).toBeTruthy();
    });

    it('should handle follow-up questions with history', async () => {
      // First question
      const firstResponse = await request(app)
        .post('/api/chat')
        .send({ message: 'What solutions do you offer?' })
        .expect(200);

      const conversationHistory = [
        { role: 'user', content: 'What solutions do you offer?' },
        { role: 'assistant', content: firstResponse.body.data.answer }
      ];

      // Follow-up question
      const followUpResponse = await request(app)
        .post('/api/chat')
        .send({ 
          message: 'Tell me more about Prior Authorization',
          conversationHistory
        })
        .expect(200);

      expect(followUpResponse.body.success).toBe(true);
      expect(followUpResponse.body.data.answer).toBeTruthy();
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = [
        request(app).post('/api/chat').send({ message: 'Question 1' }),
        request(app).post('/api/chat').send({ message: 'Question 2' }),
        request(app).post('/api/chat').send({ message: 'Question 3' })
      ];

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});

