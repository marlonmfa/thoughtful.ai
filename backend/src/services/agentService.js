const OpenAI = require('openai');
const predefinedResponses = require('../data/predefinedResponses');
const { getRelevantContext, isInitialized } = require('./ragService');

/**
 * Calculate similarity score between two strings using word overlap
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
  const normalize = (str) => str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(word => word.length > 2);
  
  const words1 = new Set(normalize(str1));
  const words2 = new Set(normalize(str2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let intersection = 0;
  for (const word of words1) {
    if (words2.has(word)) intersection++;
  }
  
  // Jaccard similarity
  const union = words1.size + words2.size - intersection;
  return intersection / union;
}

/**
 * Find the best matching predefined response
 * @param {string} userQuery - User's question
 * @returns {Object|null} - Best match with answer and confidence, or null if no good match
 */
function findBestMatch(userQuery) {
  const SIMILARITY_THRESHOLD = 0.3;
  
  let bestMatch = null;
  let highestScore = 0;
  
  // Also check for keyword matches
  const keywords = {
    'eva': 0,
    'eligibility': 0,
    'verification': 0,
    'cam': 1,
    'claims': 1,
    'processing': 1,
    'phil': 2,
    'payment': 2,
    'posting': 2,
    'agents': 3,
    'thoughtful': 3,
    'benefits': 4,
    'advantages': 4
  };
  
  const lowerQuery = userQuery.toLowerCase();
  
  // Check for direct keyword matches first
  for (const [keyword, questionIndex] of Object.entries(keywords)) {
    if (lowerQuery.includes(keyword)) {
      const question = predefinedResponses.questions[questionIndex];
      const similarity = calculateSimilarity(userQuery, question.question);
      if (similarity > highestScore) {
        highestScore = Math.max(similarity, 0.5); // Boost score for keyword match
        bestMatch = {
          answer: question.answer,
          matchedQuestion: question.question,
          confidence: highestScore
        };
      }
    }
  }
  
  // Also check full similarity
  for (const qa of predefinedResponses.questions) {
    const similarity = calculateSimilarity(userQuery, qa.question);
    if (similarity > highestScore) {
      highestScore = similarity;
      bestMatch = {
        answer: qa.answer,
        matchedQuestion: qa.question,
        confidence: similarity
      };
    }
  }
  
  if (highestScore >= SIMILARITY_THRESHOLD) {
    return bestMatch;
  }
  
  return null;
}

/**
 * Get response from OpenAI with RAG context
 * @param {string} userQuery - User's question
 * @param {Array} conversationHistory - Previous messages for context
 * @param {Object} ragContext - Context from RAG system
 * @returns {Promise<Object>} - AI generated response with sources
 */
async function getOpenAIResponseWithRAG(userQuery, conversationHistory = [], ragContext = null) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  let systemPrompt = `You are a helpful customer support agent for Thoughtful AI, a company that provides AI-powered automation agents for healthcare revenue cycle management (RCM).

Thoughtful AI is now proudly part of Smarter Technologies.

Our main solutions include:
- Prior Authorization: AI-powered automation of the end-to-end prior authorization process
- Medical Coding: Fine-tuned generative AI for fast and accurate medical coding
- Accounts Receivable: AI that checks status claims, auto-corrects denials, and generates appeal letters
- Payment Posting: Automated reconciliation of payments and posting of remittances

Key benefits:
- 95%+ Accuracy Improvement
- Seamless Full RCM Coverage
- Unlimited Scalability Without Additional Cost
- Continuous Adaption to Regulatory Change
- Predictable and Fast Cash Flow

Be friendly, professional, and helpful. Provide accurate information based on the context provided. If the context doesn't contain relevant information, be honest about it while still trying to help.`;

  // Add RAG context if available
  if (ragContext && ragContext.hasContext) {
    systemPrompt += `\n\n--- RELEVANT INFORMATION FROM THOUGHTFUL.AI ---\n${ragContext.context}\n--- END OF RELEVANT INFORMATION ---\n\nUse the above information to provide accurate and detailed responses. Cite specific details when relevant.`;
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: userQuery }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    max_tokens: 700,
    temperature: 0.7
  });

  return {
    answer: completion.choices[0].message.content,
    sources: ragContext?.sources || []
  };
}

/**
 * Get response from OpenAI as fallback (without RAG)
 * @param {string} userQuery - User's question
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<string>} - AI generated response
 */
async function getOpenAIResponse(userQuery, conversationHistory = []) {
  const result = await getOpenAIResponseWithRAG(userQuery, conversationHistory, null);
  return result.answer;
}

/**
 * Main function to get agent response
 * @param {string} userQuery - User's question
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<Object>} - Response object with answer and source
 */
async function getAgentResponse(userQuery, conversationHistory = []) {
  // First try to find a predefined response (for common questions)
  const predefinedMatch = findBestMatch(userQuery);
  
  if (predefinedMatch && predefinedMatch.confidence > 0.6) {
    return {
      answer: predefinedMatch.answer,
      source: 'predefined',
      confidence: predefinedMatch.confidence,
      matchedQuestion: predefinedMatch.matchedQuestion
    };
  }
  
  // Use RAG-enhanced response if the system is initialized
  if (isInitialized()) {
    try {
      const ragContext = await getRelevantContext(userQuery);
      const ragResponse = await getOpenAIResponseWithRAG(userQuery, conversationHistory, ragContext);
      
      return {
        answer: ragResponse.answer,
        source: ragContext.hasContext ? 'rag' : 'openai',
        confidence: ragContext.hasContext ? Math.max(...ragContext.sources.map(s => s.relevanceScore), 0) : null,
        matchedQuestion: null,
        ragSources: ragResponse.sources
      };
    } catch (error) {
      console.error('RAG-enhanced response failed, falling back to OpenAI:', error.message);
    }
  }
  
  // Fallback to basic OpenAI response
  const aiResponse = await getOpenAIResponse(userQuery, conversationHistory);
  
  return {
    answer: aiResponse,
    source: 'openai',
    confidence: null,
    matchedQuestion: null
  };
}

module.exports = {
  getAgentResponse,
  findBestMatch,
  calculateSimilarity,
  getOpenAIResponse,
  getOpenAIResponseWithRAG
};
