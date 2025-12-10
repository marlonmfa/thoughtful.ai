const predefinedResponses = require('../data/predefinedResponses');

describe('Predefined Responses Data', () => {
  it('should export an object with questions array', () => {
    expect(predefinedResponses).toHaveProperty('questions');
    expect(Array.isArray(predefinedResponses.questions)).toBe(true);
  });

  it('should have at least 5 predefined questions', () => {
    expect(predefinedResponses.questions.length).toBeGreaterThanOrEqual(5);
  });

  it('should have question and answer for each entry', () => {
    predefinedResponses.questions.forEach((qa, index) => {
      expect(qa).toHaveProperty('question', expect.any(String));
      expect(qa).toHaveProperty('answer', expect.any(String));
      expect(qa.question.length).toBeGreaterThan(0);
      expect(qa.answer.length).toBeGreaterThan(0);
    });
  });

  it('should include EVA (eligibility verification) question', () => {
    const evaQuestion = predefinedResponses.questions.find(
      qa => qa.question.toLowerCase().includes('eva') || 
            qa.question.toLowerCase().includes('eligibility')
    );
    expect(evaQuestion).toBeDefined();
    expect(evaQuestion.answer.toLowerCase()).toContain('eligibility');
  });

  it('should include CAM (claims processing) question', () => {
    const camQuestion = predefinedResponses.questions.find(
      qa => qa.question.toLowerCase().includes('cam') || 
            qa.question.toLowerCase().includes('claims')
    );
    expect(camQuestion).toBeDefined();
    expect(camQuestion.answer.toLowerCase()).toContain('claims');
  });

  it('should include PHIL (payment posting) question', () => {
    const philQuestion = predefinedResponses.questions.find(
      qa => qa.question.toLowerCase().includes('phil') || 
            qa.question.toLowerCase().includes('payment')
    );
    expect(philQuestion).toBeDefined();
    expect(philQuestion.answer.toLowerCase()).toContain('payment');
  });

  it('should include general Thoughtful AI agents question', () => {
    const generalQuestion = predefinedResponses.questions.find(
      qa => qa.question.toLowerCase().includes('thoughtful ai')
    );
    expect(generalQuestion).toBeDefined();
    expect(generalQuestion.answer.toLowerCase()).toContain('thoughtful ai');
  });

  it('should include benefits question', () => {
    const benefitsQuestion = predefinedResponses.questions.find(
      qa => qa.question.toLowerCase().includes('benefit')
    );
    expect(benefitsQuestion).toBeDefined();
    expect(benefitsQuestion.answer.toLowerCase()).toMatch(/reduce|improve|efficiency/);
  });
});

