# RAM-AI Portfolio Chatbot & Project Grid

A full-stack RAG (Retrieval-Augmented Generation) AI Assistant and interactive portfolio grid built with zero npm dependencies and Groq Llama-3.3-70b.

---

## 🔑 API Key Setup (Important!)

The RAG chatbot requires a Groq API key. A `.env` file is used to store your secret key securely.

1. Ensure a file named **`.env`** exists in the project root directory (you can copy `.env.example` to `.env`).
2. Add your Groq API key inside **`.env`**:
   ```env
   GROQ_API_KEY=your_actual_groq_api_key_here
   ```
   *(Get a free API key at [console.groq.com/keys](https://console.groq.com/keys))*

---

## 🚀 How to Start the Application (Windows)

### Option 1: Double-Click Launcher (Easiest!)

Simply double-click the **`start_server.bat`** file inside this folder (`c:\website\project ram`).

- This will automatically check for Node.js, launch the backend server on port 3000, and open your default web browser to `http://localhost:3000`.

### Option 2: Terminal / Command Prompt

If you prefer running via command line:

1. Open terminal or command prompt inside `c:\website\project ram`.
2. Run the command:

   ```bash
   node server.js
   ```

3. Open your browser and go to: **[http://localhost:3000](http://localhost:3000)**

---

## ⚠️ Why Did It Say "Not Running" Or Give CORS/Network Errors?

If you double-clicked `index.html` directly in your File Explorer, your web browser opened it using the **`file:///`** protocol (e.g. `file:///C:/website/project%20ram/index.html`).
When opened this way:

1. **No backend server is running**, so the AI chatbot cannot talk to Groq's API.
2. **Browser security (CORS)** blocks JavaScript from reading `brain.json` and `about.json`.

👉 **Solution**: Always start the server using `start_server.bat` or `node server.js` and view the site through **[http://localhost:3000](http://localhost:3000)**.

---

## 🧠 Architecture & Features

- **`server.js`**: Pure Node.js built-in HTTP server (`http`, `https`, `fs`, `path`). No `npm install` needed! Dynamically reads `brain.json` and `about.json` on every request.
- **`index.html` & `style.css`**: Ultra-premium dark obsidian glassmorphism UI with responsive design.
- **`script.js`**: Client-side RAG chat interaction, Web Audio API sound effects, and interactive portfolio grid with live stack filtering.
