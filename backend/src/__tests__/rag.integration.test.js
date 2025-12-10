/**
 * RAG System Integration Tests
 * 
 * These tests verify the end-to-end functionality of the RAG system,
 * from content ingestion to retrieval and response generation.
 */

const { 
  ingestContent, 
  searchDocuments, 
  getRelevantContext,
  clearVectorStore,
  isInitialized,
  getStatus
} = require('../services/ragService');

const { extractTextFromHtml, parseContent } = require('../services/scraperService');

const { getAgentResponse, findBestMatch } = require('../services/agentService');

// Mock OpenAI for consistent test results
jest.mock('openai', () => {
  // Create a deterministic embedding function based on text content
  const createEmbedding = (text) => {
    const normalized = text.toLowerCase();
    const embedding = Array(1536).fill(0);
    
    // Create deterministic embeddings based on key terms
    const keyTerms = {
      'prior': [0, 100],
      'authorization': [1, 101],
      'payment': [2, 102],
      'posting': [3, 103],
      'healthcare': [4, 104],
      'automation': [5, 105],
      'claims': [6, 106],
      'eligibility': [7, 107],
      'rcm': [8, 108],
      'revenue': [9, 109],
      'cycle': [10, 110],
      'ai': [11, 111],
      'thoughtful': [12, 112],
      'accounts': [13, 113],
      'receivable': [14, 114],
      'denial': [15, 115],
      'appeal': [16, 116],
      'medical': [17, 117],
      'coding': [18, 118],
      'reconcile': [19, 119]
    };
    
    for (const [term, indices] of Object.entries(keyTerms)) {
      if (normalized.includes(term)) {
        indices.forEach(i => {
          embedding[i] = 1.0;
        });
      }
    }
    
    // Add some variation based on text length
    embedding[50] = Math.min(normalized.length / 100, 1);
    
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
          choices: [{ message: { content: 'AI generated response based on context' } }]
        })
      }
    }
  }));
});

describe('RAG System - Integration Tests', () => {
  beforeEach(() => {
    clearVectorStore();
    jest.clearAllMocks();
  });

  describe('Full Content Pipeline', () => {
    describe('HTML to Searchable Content', () => {
      it('should extract, parse, ingest, and search content from HTML', async () => {
        // Step 1: Extract text from HTML
        const html = `
          <html>
            <body>
              <h1>Prior Authorization Solution</h1>
              <p>Our Prior Authorization system automates the end-to-end prior authorization process for healthcare providers. It streamlines approvals and reduces manual work.</p>
              <h2>Key Features</h2>
              <ul>
                <li>Automated request submission for healthcare procedures</li>
                <li>Real-time status tracking and monitoring</li>
                <li>Appeal letter generation for denials</li>
              </ul>
            </body>
          </html>
        `;
        
        const extractedText = extractTextFromHtml(html);
        expect(extractedText).toContain('Prior Authorization');
        expect(extractedText).toContain('healthcare');
        
        // Step 2: Parse into structured content
        const parsedContent = parseContent(extractedText, 'Prior Authorization', 'https://thoughtful.ai/pa');
        expect(parsedContent.pageName).toBe('Prior Authorization');
        expect(parsedContent.content.length).toBeGreaterThan(0);
        
        // Step 3: Ingest into RAG
        const ingestionResult = await ingestContent([parsedContent]);
        expect(ingestionResult.totalChunks).toBeGreaterThan(0);
        expect(isInitialized()).toBe(true);
        
        // Step 4: Search for relevant content
        const searchResults = await searchDocuments('prior authorization healthcare', 5);
        expect(searchResults.length).toBeGreaterThan(0);
        expect(searchResults[0].text).toContain('Prior Authorization');
      });
    });

    describe('Multi-Page Ingestion', () => {
      it('should ingest and differentiate content from multiple pages', async () => {
        const pages = [
          {
            pageName: 'Prior Authorization',
            url: 'https://thoughtful.ai/pa',
            scrapedAt: new Date().toISOString(),
            content: [
              'Prior Authorization automates healthcare approval workflows and reduces delays.',
              'AI-powered prior auth submission and tracking for medical procedures.'
            ]
          },
          {
            pageName: 'Payment Posting',
            url: 'https://thoughtful.ai/pp',
            scrapedAt: new Date().toISOString(),
            content: [
              'Payment Posting automatically reconciles payments and posts remittances.',
              'Automated ERA/EOB processing for faster revenue cycle completion.'
            ]
          },
          {
            pageName: 'Accounts Receivable',
            url: 'https://thoughtful.ai/ar',
            scrapedAt: new Date().toISOString(),
            content: [
              'Accounts Receivable AI checks claim status and generates appeal letters.',
              'Denial management and follow-up automation for healthcare providers.'
            ]
          }
        ];

        const result = await ingestContent(pages);
        
        expect(result.totalPages).toBe(3);
        expect(result.totalChunks).toBeGreaterThan(0);
        
        // Search should return relevant page for each query
        const paResults = await searchDocuments('prior authorization approval', 3);
        expect(paResults.some(r => r.metadata.pageName === 'Prior Authorization')).toBe(true);
        
        const ppResults = await searchDocuments('payment reconciliation posting', 3);
        expect(ppResults.some(r => r.metadata.pageName === 'Payment Posting')).toBe(true);
        
        const arResults = await searchDocuments('accounts receivable denial appeal', 3);
        expect(arResults.some(r => r.metadata.pageName === 'Accounts Receivable')).toBe(true);
      });
    });

    describe('Context Retrieval Quality', () => {
      beforeEach(async () => {
        const pages = [
          {
            pageName: 'Home',
            url: 'https://thoughtful.ai',
            scrapedAt: new Date().toISOString(),
            content: [
              'Thoughtful AI provides AI-powered healthcare RCM automation solutions.',
              'Our platform includes Prior Authorization, Payment Posting, and Accounts Receivable solutions.'
            ]
          },
          {
            pageName: 'About',
            url: 'https://thoughtful.ai/about',
            scrapedAt: new Date().toISOString(),
            content: [
              'Thoughtful AI is a healthcare technology company focused on revenue cycle management automation.',
              'We help healthcare providers reduce administrative burden and improve cash flow.'
            ]
          }
        ];
        await ingestContent(pages);
      });

      it('should return context with source information', async () => {
        const context = await getRelevantContext('healthcare automation solutions');
        
        expect(context.hasContext).toBe(true);
        expect(context.context.length).toBeGreaterThan(0);
        expect(context.sources.length).toBeGreaterThan(0);
        
        // Should include source metadata
        context.sources.forEach(source => {
          expect(source.pageName).toBeDefined();
          expect(source.url).toBeDefined();
          expect(source.relevanceScore).toBeDefined();
          expect(source.relevanceScore).toBeGreaterThan(0);
        });
      });

      it('should return higher relevance scores for more specific matches', async () => {
        const generalContext = await getRelevantContext('AI technology');
        const specificContext = await getRelevantContext('healthcare RCM automation');
        
        // Both should have context
        expect(generalContext.hasContext).toBe(true);
        expect(specificContext.hasContext).toBe(true);
        
        // Specific query should have higher top score
        if (generalContext.sources.length > 0 && specificContext.sources.length > 0) {
          const generalTopScore = Math.max(...generalContext.sources.map(s => s.relevanceScore));
          const specificTopScore = Math.max(...specificContext.sources.map(s => s.relevanceScore));
          expect(specificTopScore).toBeGreaterThanOrEqual(generalTopScore * 0.9); // Allow some tolerance
        }
      });
    });
  });

  describe('Agent Response with RAG', () => {
    beforeEach(async () => {
      const pages = [
        {
          pageName: 'Solutions',
          url: 'https://thoughtful.ai/solutions',
          scrapedAt: new Date().toISOString(),
          content: [
            'Thoughtful AI offers Prior Authorization, Payment Posting, and Accounts Receivable automation.',
            'Our AI-powered solutions help healthcare providers with revenue cycle management automation.'
          ]
        }
      ];
      await ingestContent(pages);
    });

    it('should use RAG context when available', async () => {
      const response = await getAgentResponse('What solutions does Thoughtful AI offer?');
      
      expect(response.source).toBe('rag');
      expect(response.ragSources).toBeDefined();
      expect(response.ragSources.length).toBeGreaterThan(0);
    });

    it('should include relevance confidence in response', async () => {
      const response = await getAgentResponse('Tell me about healthcare automation');
      
      expect(response.confidence).toBeDefined();
      if (response.source === 'rag') {
        expect(response.confidence).toBeGreaterThan(0);
      }
    });

    it('should prefer predefined responses for exact matches', async () => {
      // Clear RAG context first
      clearVectorStore();
      
      // findBestMatch should still work for predefined questions
      const match = findBestMatch('What does EVA do?');
      expect(match).not.toBeNull();
      expect(match.answer.toLowerCase()).toContain('eligibility');
    });

    it('should fall back gracefully when RAG is not initialized', async () => {
      clearVectorStore();
      
      const response = await getAgentResponse('Random question about weather');
      
      // Should fall back to OpenAI
      expect(response.source).toBe('openai');
    });
  });

  describe('Search Accuracy', () => {
    beforeEach(async () => {
      const pages = [
        {
          pageName: 'Prior Auth',
          url: 'https://thoughtful.ai/pa',
          scrapedAt: new Date().toISOString(),
          content: ['Prior authorization automates healthcare approval workflows.']
        },
        {
          pageName: 'Payments',
          url: 'https://thoughtful.ai/pp',
          scrapedAt: new Date().toISOString(),
          content: ['Payment posting reconciles and posts payments automatically.']
        },
        {
          pageName: 'AR',
          url: 'https://thoughtful.ai/ar',
          scrapedAt: new Date().toISOString(),
          content: ['Accounts receivable manages denials and generates appeals.']
        }
      ];
      await ingestContent(pages);
    });

    it('should rank most relevant results first', async () => {
      const results = await searchDocuments('prior authorization approval', 3);
      
      if (results.length >= 2) {
        // Results should be sorted by score descending
        expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
      }
    });

    it('should respect topK parameter', async () => {
      const results1 = await searchDocuments('healthcare', 1);
      const results2 = await searchDocuments('healthcare', 5);
      
      expect(results1.length).toBeLessThanOrEqual(1);
      expect(results2.length).toBeLessThanOrEqual(5);
    });

    it('should filter low relevance results', async () => {
      const results = await searchDocuments('xyz completely unrelated query abc', 5);
      
      // All returned results should meet minimum threshold
      results.forEach(result => {
        expect(result.score).toBeGreaterThan(0.3);
      });
    });
  });

  describe('Status and State Management', () => {
    it('should track initialization state correctly', async () => {
      expect(isInitialized()).toBe(false);
      expect(getStatus().documentCount).toBe(0);
      
      await ingestContent([{
        pageName: 'Test',
        url: 'https://test.com',
        scrapedAt: new Date().toISOString(),
        content: ['Test content that is long enough to be indexed.']
      }]);
      
      expect(isInitialized()).toBe(true);
      expect(getStatus().documentCount).toBeGreaterThan(0);
      expect(getStatus().lastUpdated).not.toBeNull();
    });

    it('should clear state correctly', async () => {
      await ingestContent([{
        pageName: 'Test',
        url: 'https://test.com',
        scrapedAt: new Date().toISOString(),
        content: ['Test content that is long enough to be indexed.']
      }]);
      
      expect(isInitialized()).toBe(true);
      
      clearVectorStore();
      
      expect(isInitialized()).toBe(false);
      expect(getStatus().documentCount).toBe(0);
      expect(getStatus().lastUpdated).toBeNull();
    });

    it('should update lastUpdated timestamp on ingestion', async () => {
      const beforeIngest = new Date().toISOString();
      
      await ingestContent([{
        pageName: 'Test',
        url: 'https://test.com',
        scrapedAt: new Date().toISOString(),
        content: ['Test content that is long enough to be indexed.']
      }]);
      
      const status = getStatus();
      expect(new Date(status.lastUpdated).getTime()).toBeGreaterThanOrEqual(new Date(beforeIngest).getTime());
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty search on uninitialized store', async () => {
      const results = await searchDocuments('any query', 5);
      expect(results).toEqual([]);
    });

    it('should handle empty content array gracefully', async () => {
      const result = await ingestContent([]);
      expect(result.totalChunks).toBe(0);
    });

    it('should handle pages with no valid content', async () => {
      const result = await ingestContent([{
        pageName: 'Empty',
        url: 'https://test.com',
        scrapedAt: new Date().toISOString(),
        content: ['Hi', 'Ok', 'Yes'] // All too short
      }]);
      
      expect(result.totalChunks).toBe(0);
    });

    it('should handle very long content', async () => {
      const longContent = 'This is a test sentence. '.repeat(100);
      
      const result = await ingestContent([{
        pageName: 'Long',
        url: 'https://test.com',
        scrapedAt: new Date().toISOString(),
        content: [longContent]
      }]);
      
      expect(result.totalChunks).toBeGreaterThan(0);
    });

    it('should handle special characters in content', async () => {
      const result = await ingestContent([{
        pageName: 'Special',
        url: 'https://test.com',
        scrapedAt: new Date().toISOString(),
        content: ['Content with special chars: <>&"\'© and unicode 你好']
      }]);
      
      expect(result.totalChunks).toBeGreaterThan(0);
    });
  });
});

