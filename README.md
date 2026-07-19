# project-R

RAG-powered portfolio chatbot and project grid built with vanilla Node.js (no external npm dependencies) and Groq LLM integration.

## Overview

project-R combines:

- A frontend portfolio/chat UI (`index.html`, `style.css`, `script.js`)
- A lightweight Node.js backend (`server.js`)
- A retrieval layer from local JSON knowledge files (`about.json`, `brain.json`)

The backend serves static files, exposes REST endpoints, and handles chat requests with short-term in-memory session history.

## Tech Stack

- Node.js core modules only (`http`, `https`, `fs`, `path`, `url`)
- Groq Chat Completions API (`llama-3.3-70b-versatile` by default)
- Plain HTML/CSS/JavaScript frontend

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
└── style.css             # Main stylesheet implementing dark glassmorphism styling
```

## Environment Setup

Create a `.env` file in the repository root:

```env
GROQ_API_KEY=your_groq_api_key
PORT=3000
GROQ_MODEL=llama-3.3-70b-versatile
```

## Run Locally

### Option 1 (Windows)

Double-click `start_server.bat`

### Option 2 (CLI)

```bash
node server.js
```

Then open: `http://localhost:3000`

## API Endpoints

- `GET /api/health` — service/model/knowledge-base status
- `POST /api/chat` — send chat message with optional `sessionId`
- `GET /api/projects` — returns project data from `brain.json`
- `GET /api/about` — returns profile data from `about.json`
- `POST /api/reset` — clears history for a session

## Notes

- Do not open `index.html` directly with `file://`; use the running server.
- JSON knowledge files are read dynamically, so content updates are reflected without code changes.
- Session memory is in-memory and retains recent turns only.

## License

No license file is currently defined in this repository.

DESIGNED WITH LOVE ♥️ by Ramunarlapati
