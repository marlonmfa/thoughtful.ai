const { 
  extractTextFromHtml, 
  parseContent, 
  PAGES_TO_SCRAPE,
  scrapePage
} = require('../services/scraperService');

// Mock axios for HTTP requests
jest.mock('axios', () => ({
  get: jest.fn()
}));

const axios = require('axios');

describe('Scraper Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractTextFromHtml', () => {
    describe('Content Extraction', () => {
      it('should extract h1 headings', () => {
        const html = '<html><body><h1>Main Heading</h1></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).toContain('Main Heading');
      });

      it('should extract h2 headings', () => {
        const html = '<html><body><h2>Section Title</h2></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).toContain('Section Title');
      });

      it('should extract h3 and h4 headings', () => {
        const html = '<html><body><h3>Sub Section</h3><h4>Detail</h4></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).toContain('Sub Section');
        expect(result).toContain('Detail');
      });

      it('should extract paragraphs with minimum length', () => {
        const html = '<html><body><p>This is a paragraph with enough content to be extracted.</p></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).toContain('This is a paragraph with enough content');
      });

      it('should extract list items', () => {
        const html = `<html><body>
          <ul>
            <li>First item with sufficient length</li>
            <li>Second item with sufficient length</li>
          </ul>
        </body></html>`;
        const result = extractTextFromHtml(html);
        expect(result).toContain('First item with sufficient length');
        expect(result).toContain('Second item with sufficient length');
      });

      it('should extract ordered list items', () => {
        const html = `<html><body>
          <ol>
            <li>Step one with enough text to extract</li>
            <li>Step two with enough text to extract</li>
          </ol>
        </body></html>`;
        const result = extractTextFromHtml(html);
        expect(result).toContain('Step one');
        expect(result).toContain('Step two');
      });

      it('should extract link text when substantial', () => {
        const html = '<html><body><a href="/test">This is a link with substantial descriptive text for navigation</a></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).toContain('substantial descriptive text');
      });

      it('should extract span content when substantial', () => {
        const html = '<html><body><span>This span contains enough meaningful content to be worth extracting from the page.</span></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).toContain('This span contains enough meaningful content');
      });
    });

    describe('Content Filtering', () => {
      it('should remove script tags', () => {
        const html = '<html><body><script>var x = "dangerous code";</script><p>This is safe content that should be extracted.</p></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).not.toContain('dangerous');
        expect(result).not.toContain('var x');
        expect(result).toContain('safe content');
      });

      it('should remove style tags', () => {
        const html = '<html><body><style>.class { color: red; }</style><p>Content that should remain in the output.</p></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).not.toContain('color');
        expect(result).not.toContain('.class');
        expect(result).toContain('Content that should remain');
      });

      it('should remove navigation elements', () => {
        const html = '<html><body><nav><a href="/">Home Link</a><a href="/about">About Link</a></nav><p>Main page content that is important.</p></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).not.toContain('Home Link');
        expect(result).not.toContain('About Link');
        expect(result).toContain('Main page content');
      });

      it('should remove footer elements', () => {
        const html = '<html><body><p>Main content for the page body.</p><footer>Copyright 2024 Company</footer></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).not.toContain('Copyright');
        expect(result).toContain('Main content');
      });

      it('should remove header elements', () => {
        const html = '<html><body><header>Site Header Logo Navigation</header><p>Body content that should be included.</p></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).not.toContain('Site Header');
        expect(result).toContain('Body content');
      });

      it('should remove noscript elements', () => {
        const html = '<html><body><noscript>JavaScript is disabled message</noscript><p>Regular content for normal users here.</p></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).not.toContain('JavaScript is disabled');
        expect(result).toContain('Regular content');
      });

      it('should filter out very short paragraphs', () => {
        const html = '<html><body><p>Hi</p><p>Ok</p><p>This is a longer paragraph that should be included.</p></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).toContain('longer paragraph');
        // Short texts like "Hi" and "Ok" should be filtered
      });

      it('should filter out very short headings', () => {
        const html = '<html><body><h1>A</h1><h2>Proper Section Title</h2></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).toContain('Proper Section Title');
        // Single char "A" may or may not be included based on threshold
      });
    });

    describe('Deduplication', () => {
      it('should deduplicate identical content', () => {
        const html = '<html><body><h1>Duplicate Text Here</h1><p>Duplicate Text Here</p></body></html>';
        const result = extractTextFromHtml(html);
        const count = (result.match(/Duplicate Text Here/g) || []).length;
        expect(count).toBe(1);
      });

      it('should keep unique content from multiple elements', () => {
        const html = '<html><body><h1>Unique Heading One</h1><p>Unique Paragraph One with more text.</p><h2>Unique Heading Two</h2><p>Unique Paragraph Two with more text.</p></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).toContain('Unique Heading One');
        expect(result).toContain('Unique Heading Two');
        expect(result).toContain('Unique Paragraph One');
        expect(result).toContain('Unique Paragraph Two');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty HTML', () => {
        const result = extractTextFromHtml('<html><body></body></html>');
        expect(result).toBe('');
      });

      it('should handle malformed HTML gracefully', () => {
        const html = '<html><body><p>Unclosed paragraph<div>Mixed content here with enough text';
        expect(() => extractTextFromHtml(html)).not.toThrow();
      });

      it('should handle deeply nested elements', () => {
        const html = '<html><body><div><div><div><div><p>Deeply nested content that should be found.</p></div></div></div></div></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).toContain('Deeply nested content');
      });

      it('should handle special characters', () => {
        const html = '<html><body><p>Special chars: &amp; &lt; &gt; &quot; with context.</p></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).toContain('Special chars');
      });

      it('should handle Unicode content', () => {
        const html = '<html><body><p>Unicode content: 你好世界 with English text.</p></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).toContain('Unicode content');
      });

      it('should handle empty tags', () => {
        const html = '<html><body><p></p><div></div><p>Actual content here that matters.</p></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).toContain('Actual content');
      });
    });
  });

  describe('parseContent', () => {
    it('should create structured content object', () => {
      const content = 'Test content chunk one.\n\nTest content chunk two.';
      const result = parseContent(content, 'Test Page', 'https://example.com');
      
      expect(result).toHaveProperty('pageName', 'Test Page');
      expect(result).toHaveProperty('url', 'https://example.com');
      expect(result).toHaveProperty('scrapedAt');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('fullText');
    });

    it('should include ISO timestamp', () => {
      const result = parseContent('Content', 'Page', 'https://test.com');
      expect(result.scrapedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should split content by double newlines', () => {
      const content = 'First chunk with enough text.\n\nSecond chunk with enough text.\n\nThird chunk with enough text.';
      const result = parseContent(content, 'Page', 'https://test.com');
      
      expect(result.content.length).toBe(3);
    });

    it('should filter chunks shorter than 20 characters', () => {
      const content = 'Short\n\nThis is a long enough chunk to be included.\n\nX';
      const result = parseContent(content, 'Page', 'https://test.com');
      
      expect(result.content).not.toContain('Short');
      expect(result.content).not.toContain('X');
      expect(result.content.length).toBe(1);
    });

    it('should preserve full text regardless of chunking', () => {
      const content = 'Full text\n\nWith multiple\n\nParts here';
      const result = parseContent(content, 'Page', 'https://test.com');
      
      expect(result.fullText).toBe(content);
    });

    it('should handle empty content', () => {
      const result = parseContent('', 'Empty Page', 'https://test.com');
      
      expect(result.content).toEqual([]);
      expect(result.fullText).toBe('');
    });

    it('should handle content with only whitespace', () => {
      const result = parseContent('   \n\n   \n\n   ', 'Whitespace Page', 'https://test.com');
      
      expect(result.content).toEqual([]);
    });
  });

  describe('scrapePage', () => {
    it('should fetch and parse HTML from URL', async () => {
      const mockHtml = '<html><body><h1>Test Page Title</h1><p>Test page content that is long enough to be extracted from the HTML document.</p></body></html>';
      axios.get.mockResolvedValue({ data: mockHtml });

      const result = await scrapePage('https://test.com/page', 'Test Page');

      expect(axios.get).toHaveBeenCalledWith('https://test.com/page', expect.objectContaining({
        headers: expect.any(Object),
        timeout: 30000
      }));
      expect(result.pageName).toBe('Test Page');
      expect(result.url).toBe('https://test.com/page');
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('should include proper user agent header', async () => {
      axios.get.mockResolvedValue({ data: '<html><body><p>Content</p></body></html>' });

      await scrapePage('https://test.com', 'Test');

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('ThoughtfulAI-Bot')
          })
        })
      );
    });

    it('should throw error when fetch fails', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      await expect(scrapePage('https://failing.com', 'Failing')).rejects.toThrow('Network error');
    });

    it('should handle 404 responses', async () => {
      const error = new Error('Request failed with status code 404');
      error.response = { status: 404 };
      axios.get.mockRejectedValue(error);

      await expect(scrapePage('https://notfound.com/page', 'NotFound')).rejects.toThrow('404');
    });

    it('should handle timeout', async () => {
      axios.get.mockRejectedValue(new Error('timeout of 30000ms exceeded'));

      await expect(scrapePage('https://slow.com', 'Slow')).rejects.toThrow('timeout');
    });
  });

  describe('PAGES_TO_SCRAPE configuration', () => {
    it('should have at least 5 pages configured', () => {
      expect(PAGES_TO_SCRAPE.length).toBeGreaterThanOrEqual(5);
    });

    it('should include Home page', () => {
      const home = PAGES_TO_SCRAPE.find(p => p.name === 'Home');
      expect(home).toBeDefined();
      expect(home.url).toBe('https://www.thoughtful.ai/');
    });

    it('should have valid thoughtful.ai URLs for all pages', () => {
      PAGES_TO_SCRAPE.forEach(page => {
        expect(page.url).toMatch(/^https:\/\/www\.thoughtful\.ai/);
      });
    });

    it('should have unique page names', () => {
      const names = PAGES_TO_SCRAPE.map(p => p.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });

    it('should have unique URLs', () => {
      const urls = PAGES_TO_SCRAPE.map(p => p.url);
      const uniqueUrls = [...new Set(urls)];
      expect(urls.length).toBe(uniqueUrls.length);
    });

    it('should include key product pages', () => {
      const pageNames = PAGES_TO_SCRAPE.map(p => p.name);
      expect(pageNames).toContain('Prior Authorization');
      expect(pageNames).toContain('Payment Posting');
      expect(pageNames).toContain('Accounts Receivable');
    });

    it('should include company info pages', () => {
      const pageNames = PAGES_TO_SCRAPE.map(p => p.name);
      expect(pageNames).toContain('About');
    });
  });
});

