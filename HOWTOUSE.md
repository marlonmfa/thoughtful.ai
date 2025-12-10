# How to Use - Thoughtful AI Support Agent

This guide provides step-by-step instructions for setting up, running, and using the Thoughtful AI Support Agent.

---

## 📋 Table of Contents

1. [Quick Start (5 minutes)](#-quick-start-5-minutes)
2. [Detailed Setup Guide](#-detailed-setup-guide)
3. [Using the Chat Interface](#-using-the-chat-interface)
4. [API Usage Examples](#-api-usage-examples)
5. [Customization Guide](#-customization-guide)
6. [Troubleshooting](#-troubleshooting)
7. [FAQ](#-faq)

---

## 🚀 Quick Start (5 minutes)

### Step 1: Clone and Install

```bash
git clone https://github.com/your-username/thoughtful.ai.git
cd thoughtful.ai
npm install
npm run install:all
```

### Step 2: Configure Environment

Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=sk-your-api-key-here
PORT=3001
```

### Step 3: Start the Application

```bash
npm run dev
```

### Step 4: Open in Browser

Navigate to: **http://localhost:3000**

That's it! You should see the chat interface ready to use.

---

## 📖 Detailed Setup Guide

### Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 18+ installed
- [ ] npm 8+ installed
- [ ] OpenAI API key
- [ ] Terminal/Command line access
- [ ] Text editor (VS Code recommended)

### Step-by-Step Installation

#### 1. Verify Node.js Installation

```bash
# Check Node.js version
node --version
# Expected output: v18.x.x or higher

# Check npm version
npm --version
# Expected output: 8.x.x or higher
```

**Don't have Node.js?** Download from [nodejs.org](https://nodejs.org/)

#### 2. Get Your OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (it starts with `sk-`)

> ⚠️ **Important**: You'll only see this key once. Save it securely!

#### 3. Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/your-username/thoughtful.ai.git

# Using SSH
git clone git@github.com:your-username/thoughtful.ai.git

# Navigate to project
cd thoughtful.ai
```

#### 4. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all project dependencies (backend + frontend)
npm run install:all
```

**What gets installed:**
- Root: `concurrently` (runs both servers)
- Backend: Express, OpenAI SDK, Jest, etc.
- Frontend: React, Vite, Vitest, etc.

#### 5. Create Environment File

Create `.env` in the project root:

```bash
# Using command line
touch .env

# Or create manually in your editor
```

Add the following content:

```env
# Required: Your OpenAI API key
OPENAI_API_KEY=sk-your-actual-api-key-here

# Optional: Server port (default: 3001)
PORT=3001
```

#### 6. Start the Application

**Development Mode** (recommended for first-time setup):

```bash
npm run dev
```

You should see:
```
🤖 Thoughtful AI Support Agent running on port 3001
   Health check: http://localhost:3001/api/health
   Chat endpoint: http://localhost:3001/api/chat

  VITE v5.0.8  ready in 234 ms

  ➜  Local:   http://localhost:3000/
```

#### 7. Verify Everything Works

1. **Open browser**: Go to `http://localhost:3000`
2. **Check the interface**: You should see the chat UI
3. **Send a test message**: Type "What is EVA?" and press Enter
4. **Verify response**: You should receive an answer about EVA

---

## 💬 Using the Chat Interface

### Interface Overview

```
┌────────────────────────────────────────┐
│  [Logo] Thoughtful AI    Support Agent │  <- Header
├────────────────────────────────────────┤
│                                        │
│  🤖 Hello! I'm the Thoughtful AI...   │  <- Welcome message
│                                        │
│  👤 What does EVA do?                  │  <- Your message
│                                        │
│  🤖 EVA automates the process...      │  <- Bot response
│     📚 Knowledge Base                  │  <- Source badge
│                                        │
├────────────────────────────────────────┤
│  Try asking:                           │
│  [What does EVA do?] [Tell me about..] │  <- Quick questions
├────────────────────────────────────────┤
│  ┌────────────────────────────┐ [Send] │  <- Input area
│  │ Ask me about Thoughtful... │        │
│  └────────────────────────────┘        │
└────────────────────────────────────────┘
```

### Basic Usage

#### Sending Messages

1. **Type your question** in the input field at the bottom
2. **Press Enter** or click the **Send** button
3. **Wait** for the response (typing indicator shows while processing)
4. **Read the response** along with its source badge

#### Using Quick Questions

When you first load the chat (or have few messages), you'll see quick question buttons:

- **"What does EVA do?"** - Learn about eligibility verification
- **"Tell me about CAM"** - Learn about claims processing
- **"How does PHIL work?"** - Learn about payment posting
- **"What are the benefits?"** - Overview of automation benefits

Click any button to instantly send that question.

### Understanding Response Sources

Each response includes a badge indicating its source:

| Badge | Meaning |
|-------|---------|
| 📚 **Knowledge Base** | Answer came from predefined Q&A database |
| 🤖 **AI Generated** | Answer generated by OpenAI GPT-3.5-turbo |

**Knowledge Base** responses are:
- Faster (no API call needed)
- Curated and accurate
- Specific to Thoughtful AI products

**AI Generated** responses are:
- More flexible
- Can handle complex questions
- May be less specific about Thoughtful AI

### Sample Conversations

#### Example 1: Simple Product Question

```
You: What is EVA?

Bot: EVA automates the process of verifying a patient's eligibility 
     and benefits information in real-time, eliminating manual data 
     entry errors and reducing claim rejections.
     📚 Knowledge Base
```

#### Example 2: Follow-up Questions

```
You: Tell me about Thoughtful AI agents

Bot: Thoughtful AI provides a suite of AI-powered automation agents 
     designed to streamline healthcare processes. These include 
     Eligibility Verification (EVA), Claims Processing (CAM), and 
     Payment Posting (PHIL), among others.
     📚 Knowledge Base

You: Which one helps with payments?

Bot: PHIL (Payment Posting Agent) automates the posting of payments 
     to patient accounts, ensuring fast, accurate reconciliation of 
     payments and reducing administrative burden.
     📚 Knowledge Base
```

#### Example 3: General Question (AI Fallback)

```
You: What are the typical implementation timelines for healthcare AI?

Bot: Implementation timelines for healthcare AI solutions typically 
     vary based on several factors... [detailed AI-generated response]
     🤖 AI Generated
```

---

## 🔌 API Usage Examples

### Using cURL

#### Health Check

```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

#### Send a Message

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What does EVA do?"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "answer": "EVA automates the process of verifying a patient's eligibility...",
    "source": "predefined",
    "confidence": 0.75,
    "matchedQuestion": "What does the eligibility verification agent (EVA) do?"
  }
}
```

#### Send with Conversation History

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Which one handles payments?",
    "conversationHistory": [
      {"role": "user", "content": "Tell me about Thoughtful AI agents"},
      {"role": "assistant", "content": "Thoughtful AI provides EVA, CAM, and PHIL agents..."}
    ]
  }'
```

### Using JavaScript/Fetch

```javascript
// Simple message
async function sendMessage(message) {
  const response = await fetch('http://localhost:3001/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });
  
  const data = await response.json();
  return data;
}

// Usage
const result = await sendMessage('What is CAM?');
console.log(result.data.answer);
```

### Using Python/Requests

```python
import requests

def send_message(message, conversation_history=None):
    url = 'http://localhost:3001/api/chat'
    payload = {
        'message': message,
        'conversationHistory': conversation_history or []
    }
    
    response = requests.post(url, json=payload)
    return response.json()

# Usage
result = send_message('What does PHIL do?')
print(result['data']['answer'])
```

---

## 🎨 Customization Guide

### Adding New Questions to Knowledge Base

Edit `backend/src/data/predefinedResponses.js`:

```javascript
const predefinedResponses = {
  questions: [
    // Add your new question here
    {
      question: "How do I get started with Thoughtful AI?",
      answer: "Getting started is easy! Contact our sales team for a demo, and we'll guide you through implementation based on your specific needs."
    },
    // ... existing questions
  ]
};
```

### Adding New Keywords

Edit `backend/src/services/agentService.js`:

```javascript
const keywords = {
  // Existing keywords
  'eva': 0,
  'eligibility': 0,
  // Add new keywords pointing to question index
  'implementation': 5,  // Points to question index 5
  'onboarding': 5,
  'setup': 5,
};
```

### Customizing the UI Theme

Edit `frontend/src/index.css`:

```css
:root {
  /* Change primary color (currently teal) */
  --primary-500: #your-color;
  
  /* Change accent color (currently coral) */
  --accent-500: #your-color;
  
  /* Change background (currently dark) */
  --neutral-950: #your-color;
}
```

### Changing the AI Model

Edit `backend/src/services/agentService.js`:

```javascript
const completion = await openai.chat.completions.create({
  model: 'gpt-4',  // Change from gpt-3.5-turbo to gpt-4
  messages,
  max_tokens: 500,
  temperature: 0.7
});
```

### Adjusting Similarity Threshold

Edit `backend/src/services/agentService.js`:

```javascript
function findBestMatch(userQuery) {
  const SIMILARITY_THRESHOLD = 0.3;  // Increase for stricter matching
  // ...
}
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### "OPENAI_API_KEY is not set" Error

**Symptom**: Server starts but API calls fail

**Solution**:
1. Verify `.env` file exists in project root
2. Check the key format: `OPENAI_API_KEY=sk-...`
3. No quotes around the key value
4. Restart the server after changes

#### Port Already in Use

**Symptom**: "Error: listen EADDRINUSE :::3001"

**Solution**:
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3002
```

#### CORS Errors in Browser

**Symptom**: "Access-Control-Allow-Origin" errors

**Solution**:
1. Make sure both servers are running
2. Use the Vite dev server URL (localhost:3000), not backend directly
3. Clear browser cache and refresh

#### Frontend Not Loading

**Symptom**: Blank page or "Cannot GET /"

**Solution**:
1. Check terminal for Vite errors
2. Verify frontend is running: `npm run dev:frontend`
3. Check console for JavaScript errors
4. Try clearing browser cache

#### API Returns 500 Error

**Symptom**: Server error on chat requests

**Solution**:
1. Check server console for detailed error
2. Verify OpenAI API key is valid
3. Check OpenAI account has credits
4. Test with: `curl http://localhost:3001/api/health`

#### Tests Failing

**Symptom**: `npm test` shows failures

**Solution**:
```bash
# Run backend tests with verbose output
cd backend && npm test -- --verbose

# Run frontend tests with verbose output
cd frontend && npm test -- --verbose
```

### Debug Mode

Enable detailed logging:

```bash
# Run with debug output
DEBUG=* npm run dev
```

### Checking Server Health

```bash
# Verify backend is running
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

---

## ❓ FAQ

### General Questions

**Q: Do I need an OpenAI account?**
A: Yes, you need an OpenAI API key for the AI fallback feature. However, knowledge base queries work without it.

**Q: How much does the OpenAI API cost?**
A: GPT-3.5-turbo costs approximately $0.002 per 1K tokens. Most queries cost less than $0.01.

**Q: Can I use this without the AI fallback?**
A: Yes, but users will receive "no answer found" for questions outside the knowledge base.

**Q: Is my data sent to OpenAI?**
A: Only when the knowledge base can't answer. Messages matching predefined Q&A never reach OpenAI.

### Technical Questions

**Q: Can I deploy this to production?**
A: Yes! Build with `npm run build` and deploy the backend to any Node.js host.

**Q: How do I add more products/agents?**
A: Edit `predefinedResponses.js` and add new keyword mappings in `agentService.js`.

**Q: Can I use a different AI provider?**
A: Yes, modify `agentService.js` to use any compatible API (Claude, Gemini, etc.).

**Q: Why two servers (backend/frontend)?**
A: This allows independent scaling and cleaner separation of concerns.

### Performance Questions

**Q: How fast are responses?**
A: Knowledge base: ~50ms. OpenAI fallback: ~500-2000ms depending on response length.

**Q: Can I cache OpenAI responses?**
A: Yes, implement caching in `agentService.js` for frequently asked questions.

**Q: What's the similarity threshold?**
A: 30% (0.3) by default. Keyword matches get boosted to 50% minimum.

---

## 📞 Support

If you encounter issues not covered here:

1. **Check existing issues** on GitHub
2. **Search the README** for related topics
3. **Open a new issue** with:
   - Your operating system
   - Node.js version
   - Error messages (full stack trace)
   - Steps to reproduce

---

## 🎓 Next Steps

After mastering the basics:

1. **Expand the knowledge base** with your organization's Q&A
2. **Customize the UI** to match your brand
3. **Deploy to production** using services like Vercel, Railway, or AWS
4. **Add analytics** to track popular questions
5. **Implement authentication** for private deployments

---

<p align="center">
  Happy chatting! 🤖💬
</p>

