require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const { getAgentResponse } = require('./services/agentService');
const { 
  initializeKnowledgeBase, 
  getKnowledgeBaseStatus, 
  isKnowledgeBaseReady,
  refreshKnowledgeBase 
} = require('./services/knowledgeService');

const app = express();
const PORT = process.env.PORT || 3001;

// Track server readiness
let serverReady = false;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  const kbStatus = getKnowledgeBaseStatus();
  res.json({ 
    status: serverReady ? 'ok' : 'initializing',
    timestamp: new Date().toISOString(),
    knowledgeBase: kbStatus
  });
});

// Knowledge base status endpoint
app.get('/api/knowledge/status', (req, res) => {
  res.json(getKnowledgeBaseStatus());
});

// Manual knowledge base refresh endpoint
app.post('/api/knowledge/refresh', async (req, res) => {
  try {
    const result = await refreshKnowledgeBase();
    res.json(result);
  } catch (error) {
    console.error('Knowledge base refresh failed:', error);
    res.status(500).json({
      error: 'Refresh failed',
      message: error.message
    });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    // Check if knowledge base is ready
    if (!isKnowledgeBaseReady()) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Knowledge base is still initializing. Please try again in a moment.',
        status: getKnowledgeBaseStatus()
      });
    }
    
    const { message, conversationHistory = [] } = req.body;
    
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Please provide a valid message'
      });
    }
    
    const response = await getAgentResponse(message.trim(), conversationHistory);
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error processing chat request:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process your request. Please try again.'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * Initialize the knowledge base before accepting requests
 */
async function initializeServer() {
  console.log('🔧 Initializing Thoughtful AI Support Agent...');
  
  try {
    // Initialize knowledge base with data from thoughtful.ai
    const result = await initializeKnowledgeBase();
    console.log('✅ Knowledge base initialized:', result.message);
    serverReady = true;
    return true;
  } catch (error) {
    console.error('⚠️ Knowledge base initialization failed:', error.message);
    console.log('📝 Server will start but RAG features may be limited');
    // Allow server to start even if initialization fails
    // It can be refreshed manually via the API
    serverReady = true;
    return false;
  }
}

// Start server
if (require.main === module) {
  // Start listening immediately so health checks work
  const server = app.listen(PORT, async () => {
    console.log(`🤖 Thoughtful AI Support Agent starting on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Chat endpoint: http://localhost:${PORT}/api/chat`);
    console.log(`   Knowledge status: http://localhost:${PORT}/api/knowledge/status`);
    console.log('');
    
    // Initialize knowledge base in background
    await initializeServer();
    
    console.log('');
    console.log('🚀 Agent is ready to accept requests!');
  });
}

module.exports = { app, initializeServer };
