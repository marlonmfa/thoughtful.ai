const axios = require('axios');
const htmlparser2 = require('htmlparser2');

/**
 * Pages to scrape from thoughtful.ai
 */
const PAGES_TO_SCRAPE = [
  { url: 'https://www.thoughtful.ai/', name: 'Home' },
  { url: 'https://www.thoughtful.ai/prior-authorization', name: 'Prior Authorization' },
  { url: 'https://www.thoughtful.ai/accounts-receivable', name: 'Accounts Receivable' },
  { url: 'https://www.thoughtful.ai/payment-posting', name: 'Payment Posting' },
  { url: 'https://www.thoughtful.ai/about', name: 'About' },
  { url: 'https://www.thoughtful.ai/trust-and-security', name: 'Trust and Security' }
];

/**
 * Extract text content from HTML using htmlparser2
 * @param {string} html - Raw HTML content
 * @returns {string} - Cleaned text content
 */
function extractTextFromHtml(html) {
  const textParts = [];
  let currentTag = '';
  let skipContent = false;
  const tagsToSkip = ['script', 'style', 'nav', 'footer', 'header', 'noscript'];
  const contentTags = ['h1', 'h2', 'h3', 'h4', 'p', 'li', 'span', 'div', 'a'];
  let currentText = '';
  
  const parser = new htmlparser2.Parser({
    onopentag(name) {
      currentTag = name.toLowerCase();
      if (tagsToSkip.includes(currentTag)) {
        skipContent = true;
      }
      currentText = '';
    },
    ontext(text) {
      if (!skipContent && contentTags.includes(currentTag)) {
        const trimmed = text.trim();
        if (trimmed) {
          currentText += trimmed + ' ';
        }
      }
    },
    onclosetag(tagname) {
      const tag = tagname.toLowerCase();
      if (tagsToSkip.includes(tag)) {
        skipContent = false;
      }
      
      const trimmedText = currentText.trim();
      // Only add text that meets minimum length requirements
      const minLength = ['h1', 'h2', 'h3', 'h4'].includes(tag) ? 3 : 10;
      if (trimmedText && trimmedText.length >= minLength) {
        textParts.push(trimmedText);
      }
      currentText = '';
      currentTag = '';
    }
  }, { decodeEntities: true });

  parser.write(html);
  parser.end();
  
  // Deduplicate and clean
  const uniqueTexts = [...new Set(textParts)];
  return uniqueTexts.join('\n\n');
}

/**
 * Parse and structure content from scraped page
 * @param {string} content - Raw text content
 * @param {string} pageName - Name of the page
 * @param {string} url - URL of the page
 * @returns {Object} - Structured content
 */
function parseContent(content, pageName, url) {
  // Split content into meaningful chunks
  const chunks = content.split('\n\n').filter(chunk => chunk.trim().length > 20);
  
  return {
    pageName,
    url,
    scrapedAt: new Date().toISOString(),
    content: chunks,
    fullText: content
  };
}

/**
 * Scrape a single page
 * @param {string} url - URL to scrape
 * @param {string} pageName - Name of the page
 * @returns {Promise<Object>} - Scraped content
 */
async function scrapePage(url, pageName) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ThoughtfulAI-Bot/1.0; +https://thoughtful.ai)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 30000
    });
    
    const html = response.data;
    const textContent = extractTextFromHtml(html);
    const structured = parseContent(textContent, pageName, url);
    
    console.log(`✓ Scraped ${pageName}: ${structured.content.length} content chunks`);
    return structured;
  } catch (error) {
    console.error(`✗ Failed to scrape ${pageName}:`, error.message);
    throw error;
  }
}

/**
 * Scrape all configured pages from thoughtful.ai
 * @returns {Promise<Array>} - Array of scraped content
 */
async function scrapeAllPages() {
  console.log('🔍 Starting web scraping from thoughtful.ai...');
  const results = [];
  
  for (const page of PAGES_TO_SCRAPE) {
    try {
      const content = await scrapePage(page.url, page.name);
      results.push(content);
      // Small delay to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Skipping ${page.name} due to error`);
    }
  }
  
  console.log(`✅ Scraping complete. Retrieved ${results.length} pages.`);
  return results;
}

module.exports = {
  scrapeAllPages,
  scrapePage,
  extractTextFromHtml,
  parseContent,
  PAGES_TO_SCRAPE
};
