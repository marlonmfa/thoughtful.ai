const { extractTextFromHtml, parseContent, PAGES_TO_SCRAPE } = require('../services/scraperService');

describe('ScraperService', () => {
  describe('extractTextFromHtml', () => {
    it('should extract text from headings', () => {
      const html = '<html><body><h1>Welcome to Thoughtful AI</h1><h2>Our Products</h2></body></html>';
      const result = extractTextFromHtml(html);
      expect(result).toContain('Welcome to Thoughtful AI');
      expect(result).toContain('Our Products');
    });

    it('should extract text from paragraphs', () => {
      const html = '<html><body><p>Thoughtful AI provides automation solutions for healthcare.</p></body></html>';
      const result = extractTextFromHtml(html);
      expect(result).toContain('Thoughtful AI provides automation solutions for healthcare');
    });

    it('should extract text from list items', () => {
      const html = '<html><body><ul><li>Prior Authorization automation</li><li>Payment Posting solutions</li></ul></body></html>';
      const result = extractTextFromHtml(html);
      expect(result).toContain('Prior Authorization automation');
      expect(result).toContain('Payment Posting solutions');
    });

    it('should remove script and style tags', () => {
      const html = '<html><body><script>alert("test")</script><style>.test{}</style><p>Real content here with enough words to be captured.</p></body></html>';
      const result = extractTextFromHtml(html);
      expect(result).not.toContain('alert');
      expect(result).not.toContain('.test');
      expect(result).toContain('Real content here');
    });

    it('should remove navigation elements', () => {
      const html = '<html><body><nav><a href="/">Home</a></nav><p>Main content that is long enough to be captured.</p></body></html>';
      const result = extractTextFromHtml(html);
      expect(result).toContain('Main content');
      // Nav should be excluded
      expect(result).not.toContain('Home');
    });

    it('should handle empty HTML', () => {
      const result = extractTextFromHtml('<html><body></body></html>');
      expect(result).toBe('');
    });

    it('should deduplicate content', () => {
      const html = '<html><body><h1>Duplicate Content Here</h1><p>Duplicate Content Here</p></body></html>';
      const result = extractTextFromHtml(html);
      const count = (result.match(/Duplicate Content Here/g) || []).length;
      expect(count).toBe(1);
    });
  });

  describe('parseContent', () => {
    it('should structure content with metadata', () => {
      const content = 'This is a test content chunk.\n\nAnother chunk of content here.';
      const result = parseContent(content, 'Test Page', 'https://test.com');
      
      expect(result.pageName).toBe('Test Page');
      expect(result.url).toBe('https://test.com');
      expect(result.scrapedAt).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.fullText).toBe(content);
    });

    it('should split content into chunks', () => {
      const content = 'First chunk of content that is fairly long.\n\nSecond chunk of content that is also fairly long.';
      const result = parseContent(content, 'Test', 'https://test.com');
      
      expect(result.content.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter out very short chunks', () => {
      const content = 'A\n\nB\n\nThis is a longer piece of content that should be included';
      const result = parseContent(content, 'Test', 'https://test.com');
      
      // Short chunks like "A" and "B" should be filtered out
      const shortChunks = result.content.filter(c => c.length < 10);
      expect(shortChunks.length).toBe(0);
    });
  });

  describe('PAGES_TO_SCRAPE', () => {
    it('should contain all required pages', () => {
      const pageNames = PAGES_TO_SCRAPE.map(p => p.name);
      
      expect(pageNames).toContain('Home');
      expect(pageNames).toContain('Prior Authorization');
      expect(pageNames).toContain('Accounts Receivable');
      expect(pageNames).toContain('Payment Posting');
      expect(pageNames).toContain('About');
      expect(pageNames).toContain('Trust and Security');
    });

    it('should have valid URLs', () => {
      for (const page of PAGES_TO_SCRAPE) {
        expect(page.url).toMatch(/^https:\/\/www\.thoughtful\.ai/);
        expect(page.name).toBeDefined();
        expect(page.name.length).toBeGreaterThan(0);
      }
    });
  });
});
