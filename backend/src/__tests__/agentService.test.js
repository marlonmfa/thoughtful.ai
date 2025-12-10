const { findBestMatch, calculateSimilarity } = require('../services/agentService');

describe('AgentService', () => {
  describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
      const similarity = calculateSimilarity('hello world', 'hello world');
      expect(similarity).toBeGreaterThan(0.9);
    });

    it('should return 0 for completely different strings', () => {
      const similarity = calculateSimilarity('hello world', 'xyz abc');
      expect(similarity).toBe(0);
    });

    it('should return partial similarity for overlapping words', () => {
      const similarity = calculateSimilarity('hello world today', 'hello world tomorrow');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should handle empty strings', () => {
      expect(calculateSimilarity('', '')).toBe(0);
      expect(calculateSimilarity('hello', '')).toBe(0);
    });
  });

  describe('findBestMatch', () => {
    it('should match EVA related questions', () => {
      const result = findBestMatch('What is EVA?');
      expect(result).not.toBeNull();
      expect(result.answer).toContain('EVA');
      expect(result.answer).toContain('eligibility');
    });

    it('should match claims processing questions', () => {
      const result = findBestMatch('Tell me about CAM');
      expect(result).not.toBeNull();
      expect(result.answer).toContain('claims');
    });

    it('should match payment posting questions', () => {
      const result = findBestMatch('How does PHIL work?');
      expect(result).not.toBeNull();
      expect(result.answer).toContain('payment');
    });

    it('should match Thoughtful AI agents overview', () => {
      const result = findBestMatch('Tell me about Thoughtful AI agents');
      expect(result).not.toBeNull();
      expect(result.answer).toContain('Thoughtful AI');
    });

    it('should match benefits questions', () => {
      const result = findBestMatch('What are the benefits of using these agents?');
      expect(result).not.toBeNull();
      expect(result.answer).toContain('reduce');
    });

    it('should return null for unrelated questions', () => {
      const result = findBestMatch('What is the weather today?');
      expect(result).toBeNull();
    });

    it('should be case insensitive', () => {
      const result1 = findBestMatch('WHAT IS EVA?');
      const result2 = findBestMatch('what is eva?');
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result1.answer).toBe(result2.answer);
    });
  });
});

