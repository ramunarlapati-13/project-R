# project-R

RAG-powered portfolio chatbot and project grid built with vanilla Node.js (zero external npm dependencies) and OpenRouter Real-Time Fastest Model LLM integration.

## Overview

project-R combines:

- A frontend portfolio/chat UI (`index.html`, `style.css`, `script.js`)
- A lightweight Node.js backend (`server.js`)
- A retrieval layer from local JSON knowledge files (`about.json`, `brain.json`)
- OpenRouter API integration with dynamic real-time latency routing (`openrouter/auto` + `provider: { sort: "latency" }`), automatically choosing the fastest model and provider available at that exact moment.

The backend serves static files, exposes REST endpoints, and handles chat requests with short-term in-memory session history.

## Tech Stack

- Node.js core modules only (`http`, `https`, `fs`, `path`, `url`)
- OpenRouter Real-Time Auto-Fastest Model Router (`openrouter/auto` with `provider.sort: "latency"`)
- Plain HTML/CSS/JavaScript frontend with dark glassmorphic UI

## 📂 Project Structure

Below is the directory structure for the `Project R` full-stack application:

```text
project R/
├── scratch/               # Scratch files and temporary workspace scripts
├── .env                  # Local environment configuration (API keys)
├── .env.example          # Sample environment variables template
├── .gitignore            # Git ignore configurations
├── .hintrc               # Project hinting and code quality settings
├── about.json            # Static developer bio, education, and credentials context
├── brain.json            # Project list, tech stack, and chatbot configuration context
├── index.html            # Main portfolio landing page with interactive chat interface
├── package.json          # Node.js project configuration (scripts)
├── ramunarlapati cv.pdf  # Professional resume document
├── README.md             # Codebase documentation and API reference
├── render.yaml           # Deployment configuration blueprint for Render hosting
├── script.js             # Client-side user interface interactions & chatbot logic
├── server.js             # Native Node.js backend HTTP server & RAG controller
├── start_server.bat      # Windows batch execution script to run local server
├── style.css             # Main stylesheet implementing dark glassmorphism styling
└── test-openrouter.js    # Real-time fastest router test script
```

## Environment Setup

Create a `.env` file in the repository root:

```env
# OpenRouter API Key
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Fastest Model Auto-Router (dynamically selects the fastest model at runtime)
OPENROUTER_MODEL=openrouter/auto

# Optional Leaderboard/App Metadata Headers
OPENROUTER_SITE_URL=https://www.imramu.me
OPENROUTER_SITE_NAME=RAM-AI Portfolio Hub

PORT=3000
```

## Run Locally

### Option 1 (Windows)

Double-click `start_server.bat`

### Option 2 (CLI)

```bash
node server.js
```

Then open: `http://localhost:3000`

## Real-Time Fastest Router Testing

To test OpenRouter's real-time latency router and inspect which model is dynamically selected:

```bash
npm run test:openrouter
# Or pass key directly:
node test-openrouter.js sk-or-v1-your-key-here
```

## How Real-Time Fastest Routing Works

1. Every request sent by `server.js` contains `provider: { sort: "latency" }`.
2. The default model is set to `openrouter/auto` backed by high-speed fallback candidate models (`google/gemini-2.5-flash`, `meta-llama/llama-3.3-70b-instruct:nitro`, `openai/gpt-4o-mini`, `deepseek/deepseek-chat`).
3. OpenRouter's smart router benchmarks provider time-to-first-token in real-time and routes the request to whichever endpoint has the lowest latency at that exact millisecond.
4. The server logs and returns the resolved model name so you can see which model responded.

## API Endpoints (Open Access / No Authentication Required)

All backend endpoints are **100% public with universal CORS (`Access-Control-Allow-Origin: *`) enabled**. Any external website, portfolio, mobile app, or browser script can call these endpoints directly with zero authentication, cookies, or authorization tokens:

- `GET /api/health` — service status, latency router configuration & knowledge base count
- `POST /api/chat` — send chat message with optional `sessionId` and optional dynamic `model` override
- `GET /api/projects` — returns project data from `brain.json`
- `GET /api/about` — returns profile data from `about.json`
- `POST /api/reset` — clears history for a session

### Calling from Any External Website

You can call the API from any frontend (React, Next.js, Webflow, WordPress, vanilla HTML) without authentication:

```javascript
// Example: Call the chatbot from any external domain
const response = await fetch("https://your-backend-url.onrender.com/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "What are Ramu's top projects?",
    sessionId: "visitor_123" // optional
  })
});

const data = await response.json();
console.log("AI Reply:", data.reply);
console.log("Model Used:", data.model);
```

## License

No license file is currently defined in this repository.

DESIGNED WITH LOVE ♥️ by Ramunarlapati
