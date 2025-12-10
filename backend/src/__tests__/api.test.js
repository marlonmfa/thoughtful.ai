const request = require('supertest');
const { app } = require('../index');

// Mock the agentService
jest.mock('../services/agentService', () => ({
  getAgentResponse: jest.fn(),
  findBestMatch: jest.fn(),
  calculateSimilarity: jest.fn(),
  getOpenAIResponse: jest.fn()
}));

// Mock the knowledge service
jest.mock('../services/knowledgeService', () => ({
  initializeKnowledgeBase: jest.fn().mockResolvedValue({ success: true }),
  getKnowledgeBaseStatus: jest.fn().mockReturnValue({
    initialized: true,
    documentCount: 100,
    lastUpdated: new Date().toISOString(),
    error: null,
    isInitializing: false
  }),
  isKnowledgeBaseReady: jest.fn().mockReturnValue(true),
  refreshKnowledgeBase: jest.fn().mockResolvedValue({ success: true })
}));

const { getAgentResponse } = require('../services/agentService');

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return health status with timestamp', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('knowledgeBase');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('POST /api/chat', () => {
    it('should return successful response for valid message', async () => {
      const mockResponse = {
        answer: 'EVA automates eligibility verification',
        source: 'predefined',
        confidence: 0.8,
        matchedQuestion: 'What does EVA do?'
      };

      getAgentResponse.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'What is EVA?' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockResponse
      });
      expect(getAgentResponse).toHaveBeenCalledWith('What is EVA?', []);
    });

    it('should pass conversation history to agent service', async () => {
      const mockResponse = {
        answer: 'Test response',
        source: 'openai',
        confidence: null,
        matchedQuestion: null
      };

      getAgentResponse.mockResolvedValue(mockResponse);

      const conversationHistory = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];

      await request(app)
        .post('/api/chat')
        .send({ message: 'Follow up question', conversationHistory })
        .expect(200);

      expect(getAgentResponse).toHaveBeenCalledWith('Follow up question', conversationHistory);
    });

    it('should return 400 for missing message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid input');
      expect(response.body).toHaveProperty('message', 'Please provide a valid message');
    });

    it('should return 400 for empty message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid input');
    });

    it('should return 400 for whitespace-only message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: '   ' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid input');
    });

    it('should return 400 for non-string message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 123 })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid input');
    });

    it('should return 500 when agent service throws error', async () => {
      getAgentResponse.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Test message' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body).toHaveProperty('message', 'Failed to process your request. Please try again.');
    });

    it('should trim message before processing', async () => {
      const mockResponse = {
        answer: 'Response',
        source: 'predefined',
        confidence: 0.9,
        matchedQuestion: 'Test'
      };

      getAgentResponse.mockResolvedValue(mockResponse);

      await request(app)
        .post('/api/chat')
        .send({ message: '  What is EVA?  ' })
        .expect(200);

      expect(getAgentResponse).toHaveBeenCalledWith('What is EVA?', []);
    });

    it('should use empty array when conversationHistory is not provided', async () => {
      const mockResponse = {
        answer: 'Response',
        source: 'openai',
        confidence: null,
        matchedQuestion: null
      };

      getAgentResponse.mockResolvedValue(mockResponse);

      await request(app)
        .post('/api/chat')
        .send({ message: 'Test' })
        .expect(200);

      expect(getAgentResponse).toHaveBeenCalledWith('Test', []);
    });
  });

  describe('GET /api/knowledge/status', () => {
    it('should return knowledge base status', async () => {
      const response = await request(app)
        .get('/api/knowledge/status')
        .expect(200);

      expect(response.body).toHaveProperty('initialized');
      expect(response.body).toHaveProperty('documentCount');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
    });

    it('should return 404 for POST to unknown routes', async () => {
      const response = await request(app)
        .post('/api/unknown')
        .send({ data: 'test' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
    });
  });
});
