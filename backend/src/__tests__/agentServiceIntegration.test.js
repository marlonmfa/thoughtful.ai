const { 
  getAgentResponse, 
  findBestMatch, 
  calculateSimilarity, 
  getOpenAIResponse 
} = require('../services/agentService');

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mocked OpenAI response' } }]
        })
      }
    }
  }));
});

// Mock RAG service
jest.mock('../services/ragService', () => ({
  getRelevantContext: jest.fn().mockResolvedValue({
    context: '',
    sources: [],
    hasContext: false
  }),
  isInitialized: jest.fn().mockReturnValue(false)
}));

describe('Agent Service Integration', () => {
  describe('getAgentResponse', () => {
    it('should return predefined response for known questions with high confidence', async () => {
      const response = await getAgentResponse('What does the eligibility verification agent EVA do?');
      
      expect(response).toHaveProperty('answer');
      expect(response).toHaveProperty('source', 'predefined');
      expect(response).toHaveProperty('confidence');
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.answer.toLowerCase()).toContain('eligibility');
    });

    it('should return predefined response for CAM questions with sufficient context', async () => {
      const response = await getAgentResponse('What does the claims processing agent CAM do?');
      
      expect(response.source).toBe('predefined');
      expect(response.answer.toLowerCase()).toContain('claims');
    });

    it('should return predefined response for PHIL questions with sufficient context', async () => {
      const response = await getAgentResponse('How does the payment posting agent PHIL work?');
      
      expect(response.source).toBe('predefined');
      expect(response.answer.toLowerCase()).toContain('payment');
    });

    it('should return predefined response for benefits questions with context', async () => {
      const response = await getAgentResponse('What are the benefits of using Thoughtful AI agents?');
      
      expect(response.source).toBe('predefined');
      expect(response.answer.toLowerCase()).toMatch(/reduce|improve|cost/);
    });

    it('should return predefined response for Thoughtful AI agents question', async () => {
      const response = await getAgentResponse('Tell me about Thoughtful AI agents');
      
      expect(response.source).toBe('predefined');
      expect(response.answer.toLowerCase()).toContain('thoughtful ai');
    });

    it('should fallback to OpenAI for unrelated questions', async () => {
      const response = await getAgentResponse('What is the weather today?');
      
      expect(response).toHaveProperty('source', 'openai');
      expect(response).toHaveProperty('answer', 'Mocked OpenAI response');
      expect(response.confidence).toBeNull();
      expect(response.matchedQuestion).toBeNull();
    });

    it('should handle conversation history parameter', async () => {
      const conversationHistory = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ];
      
      const response = await getAgentResponse('What is the weather?', conversationHistory);
      
      expect(response).toHaveProperty('source', 'openai');
    });
  });

  describe('findBestMatch edge cases', () => {
    it('should handle questions with special characters', () => {
      const result = findBestMatch('What is EVA???');
      expect(result).not.toBeNull();
      expect(result.answer.toLowerCase()).toContain('eligibility');
    });

    it('should handle mixed case queries', () => {
      const result = findBestMatch('WHAT IS eva');
      expect(result).not.toBeNull();
    });

    it('should handle queries with extra whitespace', () => {
      const result = findBestMatch('  what   is   EVA  ');
      expect(result).not.toBeNull();
    });

    it('should match partial keyword queries', () => {
      const result = findBestMatch('eligibility verification');
      expect(result).not.toBeNull();
      expect(result.answer.toLowerCase()).toContain('eligibility');
    });

    it('should return null for gibberish', () => {
      const result = findBestMatch('asdfghjkl qwerty');
      expect(result).toBeNull();
    });

    it('should return null for very short unrelated queries', () => {
      const result = findBestMatch('hi');
      expect(result).toBeNull();
    });
  });

  describe('calculateSimilarity edge cases', () => {
    it('should handle punctuation correctly', () => {
      const sim = calculateSimilarity('Hello, world!', 'Hello world');
      expect(sim).toBeGreaterThan(0.5);
    });

    it('should be case insensitive', () => {
      const sim1 = calculateSimilarity('HELLO WORLD', 'hello world');
      const sim2 = calculateSimilarity('hello world', 'hello world');
      expect(sim1).toBe(sim2);
    });

    it('should filter out short words', () => {
      // Words <= 2 characters should be filtered
      const sim = calculateSimilarity('a b c d', 'e f g h');
      expect(sim).toBe(0);
    });

    it('should handle numeric content', () => {
      const sim = calculateSimilarity('test 123', 'test 456');
      expect(sim).toBeGreaterThan(0);
    });

    it('should return 0 for completely different long strings', () => {
      const sim = calculateSimilarity(
        'apple banana cherry', 
        'dog elephant frog'
      );
      expect(sim).toBe(0);
    });
  });
});
