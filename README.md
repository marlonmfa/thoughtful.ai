# Thoughtful AI - Customer Support Agent

<p align="center">
  <img src="https://img.shields.io/badge/Thoughtful%20AI-Support%20Agent-0d3b44?style=for-the-badge" alt="Thoughtful AI Support Agent">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/OpenAI-API-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI">
</p>

An intelligent, AI-powered customer support agent built with Node.js and React. The agent helps users learn about Thoughtful AI's healthcare automation products including **EVA**, **CAM**, and **PHIL**.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Reference](#-api-reference)
- [Knowledge Base](#-knowledge-base)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [UI/UX Design](#-uiux-design)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

Thoughtful AI Support Agent is a conversational AI system designed to provide instant, accurate customer support for healthcare automation products. It combines a curated knowledge base with OpenAI's powerful language models to deliver contextual, helpful responses.

### Key Capabilities

- **Instant Responses**: Sub-second response times for knowledge base queries
- **Smart Fallback**: Seamlessly escalates to GPT-3.5-turbo for complex queries
- **Context Awareness**: Maintains conversation history for coherent multi-turn dialogues
- **Transparency**: Clear indicators showing response sources (Knowledge Base vs AI Generated)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **Intelligent Matching** | Uses keyword detection and Jaccard similarity for accurate response matching |
| 🧠 **OpenAI Integration** | Falls back to GPT-3.5-turbo for questions outside the knowledge base |
| 💬 **Modern Chat UI** | Beautiful, responsive interface with dark theme and teal/coral accents |
| ⚡ **Real-time Feedback** | Animated typing indicators and smooth transitions |
| 📚 **Source Transparency** | Badges indicate whether responses come from Knowledge Base or AI |
| 🎯 **Quick Questions** | Pre-defined quick action buttons for common queries |
| 📱 **Responsive Design** | Optimized for desktop and mobile devices |
| 🔍 **Conversation Context** | Maintains chat history for contextual multi-turn conversations |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │ Chat Input │  │  Messages  │  │  Quick Questions       │ │
│  └────────────┘  └────────────┘  └────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (Vite Proxy)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Express.js)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    API Layer                          │   │
│  │  POST /api/chat    GET /api/health                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Agent Service                        │   │
│  │  ┌─────────────┐    ┌──────────────────────────────┐ │   │
│  │  │  Find Best  │───▶│  Predefined Responses (KB)   │ │   │
│  │  │    Match    │    └──────────────────────────────┘ │   │
│  │  └──────┬──────┘                                     │   │
│  │         │ No match found                             │   │
│  │         ▼                                             │   │
│  │  ┌─────────────┐    ┌──────────────────────────────┐ │   │
│  │  │   OpenAI    │───▶│  GPT-3.5-turbo API           │ │   │
│  │  │   Fallback  │    └──────────────────────────────┘ │   │
│  │  └─────────────┘                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js 18+** | Runtime environment |
| **Express.js 4.x** | Web framework |
| **OpenAI SDK 4.x** | AI/LLM integration |
| **dotenv** | Environment configuration |
| **CORS** | Cross-origin resource sharing |
| **Jest** | Unit testing framework |
| **Supertest** | API integration testing |
| **Nodemon** | Development hot-reload |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite 5** | Build tool & dev server |
| **CSS Variables** | Design system theming |
| **Vitest** | Testing framework |
| **React Testing Library** | Component testing |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** 8.0.0 or higher (comes with Node.js)
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))

Verify your installation:

```bash
node --version  # Should output v18.x.x or higher
npm --version   # Should output 8.x.x or higher
```

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/thoughtful.ai.git
cd thoughtful.ai
```

### 2. Install Dependencies

```bash
# Install root dependencies (concurrently for running both servers)
npm install

# Install backend and frontend dependencies
npm run install:all
```

This will install dependencies for:
- Root project (concurrently)
- Backend (Express, OpenAI, etc.)
- Frontend (React, Vite, etc.)

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required - Your OpenAI API key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional - Server port (defaults to 3001)
PORT=3001
```

### Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | - | Your OpenAI API key for GPT-3.5-turbo |
| `PORT` | ❌ No | `3001` | Backend server port |

> ⚠️ **Security Note**: Never commit your `.env` file to version control. It's included in `.gitignore` by default.

---

## 🚀 Running the Application

### Development Mode (Recommended)

Start both backend and frontend with hot-reload:

```bash
npm run dev
```

This runs:
- **Backend**: `http://localhost:3001` (with nodemon)
- **Frontend**: `http://localhost:3000` (with Vite HMR)

### Production Mode

Build and serve the optimized version:

```bash
# Build the frontend
npm run build

# Start production servers
npm start
```

### Individual Services

```bash
# Backend only
npm run dev:backend    # Development
npm run start:backend  # Production

# Frontend only
npm run dev:frontend   # Development
npm run start:frontend # Production (preview)
```

---

## 📡 API Reference

### Health Check

Check if the server is running.

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

### Chat Endpoint

Send a message and receive a response.

```http
POST /api/chat
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "What does EVA do?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help you?"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ Yes | The user's question or message |
| `conversationHistory` | array | ❌ No | Previous messages for context |

**Success Response (200):**
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

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `answer` | string | The response text |
| `source` | string | Either `"predefined"` or `"openai"` |
| `confidence` | number \| null | Match confidence (0-1) for predefined responses |
| `matchedQuestion` | string \| null | The matched knowledge base question |

**Error Response (400):**
```json
{
  "error": "Invalid input",
  "message": "Please provide a valid message"
}
```

**Error Response (500):**
```json
{
  "error": "Internal server error",
  "message": "Failed to process your request. Please try again."
}
```

---

## 📚 Knowledge Base

The agent includes a curated knowledge base about Thoughtful AI's healthcare automation agents:

### Available Agents

| Agent | Full Name | Description |
|-------|-----------|-------------|
| **EVA** | Eligibility Verification Agent | Automates patient eligibility and benefits verification in real-time |
| **CAM** | Claims Processing Agent | Streamlines claims submission and management |
| **PHIL** | Payment Posting Agent | Automates payment posting to patient accounts |

### Predefined Q&A Topics

1. **EVA (Eligibility Verification)**
   - What EVA does
   - How eligibility verification works
   - Benefits of automated verification

2. **CAM (Claims Processing)**
   - Claims submission automation
   - Claims management features
   - Processing efficiency

3. **PHIL (Payment Posting)**
   - Payment automation process
   - Account reconciliation
   - Administrative burden reduction

4. **General**
   - Overview of Thoughtful AI agents
   - Benefits of using automation agents

### Extending the Knowledge Base

To add new Q&A pairs, edit `backend/src/data/predefinedResponses.js`:

```javascript
const predefinedResponses = {
  questions: [
    {
      question: "Your new question here?",
      answer: "The detailed answer to the question."
    },
    // ... existing questions
  ]
};
```

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Backend Tests Only

```bash
npm run test:backend
```

**Includes:**
- Unit tests for similarity calculation
- Unit tests for response matching
- Integration tests for API endpoints
- Test coverage reports

### Frontend Tests Only

```bash
npm run test:frontend
```

**Includes:**
- Component rendering tests
- User interaction tests
- Error handling tests
- Message display tests

### Test Coverage

Backend test coverage is generated in `backend/coverage/`:
- `lcov-report/index.html` - HTML coverage report
- `lcov.info` - LCOV format for CI integration
- `coverage-final.json` - JSON coverage data

---

## 📁 Project Structure

```
thoughtful.ai/
├── backend/
│   ├── src/
│   │   ├── __tests__/
│   │   │   ├── agentService.test.js      # Agent service unit tests
│   │   │   ├── agentServiceIntegration.test.js  # Integration tests
│   │   │   ├── api.test.js               # API endpoint tests
│   │   │   └── predefinedResponses.test.js  # Knowledge base tests
│   │   ├── data/
│   │   │   └── predefinedResponses.js    # Knowledge base Q&A
│   │   ├── services/
│   │   │   ├── agentService.js           # Core agent logic
│   │   │   ├── ragService.js             # RAG service (future)
│   │   │   └── scraperService.js         # Web scraper (future)
│   │   └── index.js                      # Express server entry
│   ├── coverage/                         # Test coverage reports
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/                   # React component tests
│   │   │   ├── ErrorHandling.test.jsx
│   │   │   ├── InputArea.test.jsx
│   │   │   ├── MessageList.test.jsx
│   │   │   ├── MessageSource.test.jsx
│   │   │   └── QuickQuestions.test.jsx
│   │   ├── test/
│   │   │   └── setup.js                  # Test configuration
│   │   ├── App.jsx                       # Main chat application
│   │   ├── App.css                       # Component styles
│   │   ├── App.test.jsx                  # App component tests
│   │   ├── index.css                     # Global styles & variables
│   │   └── main.jsx                      # React entry point
│   ├── index.html                        # HTML template
│   ├── vite.config.js                    # Vite configuration
│   └── package.json
│
├── .env                                  # Environment variables (create this)
├── package.json                          # Root package.json
├── README.md                             # This file
└── HOWTOUSE.md                           # User guide
```

---

## 🔄 How It Works

### Response Flow

```
User Question
      │
      ▼
┌─────────────────────────────┐
│  1. Keyword Detection       │  Check for: EVA, CAM, PHIL,
│                             │  eligibility, claims, payment, etc.
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  2. Similarity Matching     │  Jaccard similarity algorithm
│     (if keyword found)      │  compares word overlap
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  3. Confidence Check        │  Threshold: 30%
│     Score >= 0.3?           │  Keyword boost: 50% minimum
└─────────────┬───────────────┘
              │
    ┌─────────┴─────────┐
    │ Yes               │ No
    ▼                   ▼
┌─────────────┐   ┌─────────────┐
│ Return KB   │   │ OpenAI API  │
│ Response    │   │ Fallback    │
└─────────────┘   └─────────────┘
```

### Similarity Algorithm

The agent uses **Jaccard Similarity** for matching:

```javascript
Jaccard(A, B) = |A ∩ B| / |A ∪ B|
```

Where:
- `A` = Set of words in user query
- `B` = Set of words in knowledge base question
- Words < 3 characters are filtered out
- Punctuation is removed
- Case-insensitive comparison

### Keyword Boosting

When specific keywords are detected, the confidence score is boosted to at least 0.5:

| Keywords | Associated Topic |
|----------|-----------------|
| `eva`, `eligibility`, `verification` | EVA Agent |
| `cam`, `claims`, `processing` | CAM Agent |
| `phil`, `payment`, `posting` | PHIL Agent |
| `agents`, `thoughtful` | Overview |
| `benefits`, `advantages` | Benefits |

---

## 🎨 UI/UX Design

### Color Palette

The interface uses a sophisticated dark theme with teal and coral accents:

| Color | Variable | Hex | Usage |
|-------|----------|-----|-------|
| Deep Teal | `--primary-900` | `#0d3b44` | Backgrounds |
| Teal | `--primary-500` | `#2a8da9` | Primary actions |
| Light Teal | `--primary-300` | `#6dbdd2` | Highlights |
| Coral | `--accent-500` | `#ff6b6b` | Accents |
| Dark Gray | `--neutral-950` | `#0a0f12` | Main background |

### Typography

- **Primary Font**: DM Sans (system fallback)
- **Monospace**: JetBrains Mono (for code, if needed)

### Animations

- **fadeIn**: Messages appear with smooth opacity and slide-up effect
- **typing**: Animated dots for loading indicator
- **slideUp**: Quick questions panel entrance

### Responsive Breakpoints

- **Desktop**: Full layout with side avatars
- **Tablet/Mobile** (≤768px): Compact layout, smaller buttons

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/thoughtful.ai.git
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. Install dependencies:
   ```bash
   npm install && npm run install:all
   ```
5. Make your changes
6. Run tests:
   ```bash
   npm test
   ```
7. Commit your changes:
   ```bash
   git commit -m 'Add amazing feature'
   ```
8. Push to your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
9. Open a Pull Request

### Code Style

- Use ES6+ JavaScript features
- Follow existing code formatting
- Add tests for new features
- Update documentation as needed

### Areas for Contribution

- 📝 Expanding the knowledge base
- 🧪 Improving test coverage
- 🎨 UI/UX enhancements
- 🔧 Performance optimizations
- 📖 Documentation improvements

---

## 📄 License

MIT License - feel free to use this project for learning or as a starting point for your own support agent.

---

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for the GPT API
- [React](https://react.dev/) for the UI framework
- [Vite](https://vitejs.dev/) for the blazing fast build tool
- [Express](https://expressjs.com/) for the backend framework

---

<p align="center">
  Built with ❤️ for Thoughtful AI
</p>

<p align="center">
  <a href="https://thoughtful.ai">thoughtful.ai</a>
</p>
