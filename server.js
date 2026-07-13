const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const url = require("url");

// Lightweight .env file loader (zero npm dependencies required)
function loadEnv() {
  try {
    const envPath = path.join(__dirname, ".env");
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const separatorIdx = trimmed.indexOf("=");
        if (separatorIdx > 0) {
          const key = trimmed.slice(0, separatorIdx).trim();
          let val = trimmed.slice(separatorIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch (err) {
    console.error("Warning: Error loading .env file:", err.message);
  }
}
loadEnv();

const PORT = process.env.PORT || 3000;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

function getGroqApiKey() {
  return process.env.GROQ_API_KEY || "";
}

// In-memory conversation history store (keyed by sessionId)
const sessions = new Map();

/**
 * Reads knowledge base files (brain.json and about.json) dynamically from disk.
 * This ensures any updates to the JSON files are immediately available to the AI!
 */
function loadKnowledgeBase() {
  try {
    const aboutPath = path.join(__dirname, "about.json");
    const brainPath = path.join(__dirname, "brain.json");

    let aboutData = {};
    let projectsData = [];

    if (fs.existsSync(aboutPath)) {
      aboutData = JSON.parse(fs.readFileSync(aboutPath, "utf8"));
    }
    if (fs.existsSync(brainPath)) {
      projectsData = JSON.parse(fs.readFileSync(brainPath, "utf8"));
    }

    return { aboutData, projectsData };
  } catch (error) {
    console.error("Error loading knowledge base:", error.message);
    return { aboutData: {}, projectsData: [] };
  }
}

/**
 * Builds the comprehensive RAG System Prompt using Ramu's profile and projects.
 */
function buildSystemPrompt() {
  const { aboutData, projectsData } = loadKnowledgeBase();
  const projectsList = Array.isArray(projectsData) ? projectsData : (projectsData?.projects || []);
  const identity = projectsData?.chatbot_identity || {};
  const profile = aboutData?.profile || {};
  const edu = profile?.education || aboutData?.personal_summary?.education || {};
  const skills = aboutData?.skills || {};
  const bg = aboutData?.technical_background || {};
  const links = projectsData?.links || {};
  const eduHistory = aboutData?.education_history || [];
  const experience = aboutData?.experience || [];

  return `You are ${identity?.name || "RAM-AI"}, ${identity?.role || "the personal AI assistant representing Ramu Narlapati."}
Your purpose: ${identity?.purpose || "Answer questions about Ramu's projects, engineering expertise, technical blogs, research, portfolio, skills, and career while maintaining his communication style and values."}

### ABOUT RAMU NARLAPATI:
- Title: ${profile?.title || "Electrical & Electronics Engineering Student & AI-Powered Full-Stack Builder"}
- Short Bio: ${profile?.short_bio || aboutData?.about_me?.summary || ""}
- Location: ${profile?.location || "Andhra Pradesh, India"}
- Contact Phone: ${profile?.phone || ""}
- Contact Email: ${links?.email || "ramunarlapati@gmail.com"}
- Education Details:
${eduHistory.map(e => `  * ${e.degree} in ${e.branch || "General"} at ${e.college || e.school} (${e.timeline}) - Status: ${e.status}. Grade: ${e.cgpa || e.percentage || e.score || "N/A"}`).join("\n")}
- Experience & Traineeships:
${experience.map(exp => `  * ${exp.role} (${exp.focus}) at ${exp.organization || "N/A"}, Location: ${exp.location} (${exp.timeline}) - ${exp.academic_context}. Details: ${exp.description.join("; ")}`).join("\n")}
- Achievements & Awards: ${(aboutData?.achievements || []).join("; ")}
- Certifications & Courses:
${(aboutData?.certifications || []).map(c => `  * **${c.name}** by ${c.provider} (Platform: ${c.platform}, Issued: ${c.issued})`).join("\n")}
- Vision: ${aboutData?.vision?.statement || ""}
- Mission: ${aboutData?.mission?.statement || ""}

### TECHNICAL SKILLS & BACKGROUND:
- Engineering & Embedded: ${(skills?.engineering || bg?.engineering || []).join(", ")} | ${(bg?.embedded || []).join(", ")}
- IoT & Cloud: ${(bg?.iot || []).join(", ")}
- Programming & Software: ${(skills?.software || bg?.programming || []).join(", ")}
- AI & Automation: ${(skills?.artificial_intelligence || bg?.ai || []).join(", ")}
- Professional Traits: ${(skills?.professional || aboutData?.about_me?.personality?.traits || []).join(", ")}

### DETAILED PROJECT PORTFOLIO:
${projectsList.map((p, idx) => `
- **${p.name}**
  - Description: ${p.description}
  - Technologies: ${Array.isArray(p.technologies) ? p.technologies.join(", ") : (Array.isArray(p.stack) ? p.stack.join(", ") : p.technologies || p.stack || "N/A")}
  ${p.achievement ? `- Achievement: ${p.achievement}` : ""}
  ${p.link ? `- Link: ${p.link}` : ""}
`).join("\n")}

### ROADMAP & FUTURE GOALS:
- Short Term Roadmap: ${(projectsData?.roadmap?.short_term || []).join("; ")}
- Mid Term Roadmap: ${(projectsData?.roadmap?.mid_term || []).join("; ")}
- Long Term Vision (10 Years): ${(projectsData?.future_goals?.["10_years"] || []).join("; ")}

### AI PHILOSOPHY & VALUES:
- Philosophy: ${projectsData?.ai_philosophy?.statement || ""}
- Principles: ${(projectsData?.ai_philosophy?.principles || []).join(", ")}
- Team Style: ${projectsData?.team?.type || "Solo Builder"} - ${projectsData?.team?.description || ""}

### OFFICIAL LINKS:
- Resume/CV PDF: ${links?.resume || "https://www.imramu.me/ramunarlapati%20cv.pdf"}
- Portfolio: ${links?.portfolio || "https://www.imramu.me/"}
- GitHub: ${links?.github || "https://github.com/ramunarlapati-13"}
- LinkedIn: ${links?.linkedin || "https://linkedin.com/in/ramunarlapati"}
- Blog: ${links?.blog || "https://ramublogs.vercel.app/"}
- Email: ${links?.email || "ramunarlapati@gmail.com"}

### YOUR BEHAVIOR & GUIDELINES:
1. **Be Engaging & Professional:** Maintain an enthusiastic, tech-forward, and polished tone matching Ramu's communication style (${(projectsData?.communication_style?.tone || []).join(", ")}).
2. **Use Markdown Formatting:** Format all your responses cleanly with Markdown (bolding key terms, using bullet points, and formatting URLs as markdown links '[Link Text](url)'). IMPORTANT: Do NOT use '#' or '###' symbols for headings; use **bold text** for section titles instead.
3. **Highlight Interdisciplinary Expertise:** Emphasize Ramu's unique blend of Electrical/Power Engineering (Embedded Systems, ESP32, IoT, Solar) AND modern Full-Stack Software Development (React, Next.js, Firebase, AI).
4. **Answer Accurately:** Rely strictly on the provided knowledge base above. Do not claim degrees not completed or employment not documented.
5. **Suggest Follow-ups:** At the end of helpful responses, occasionally suggest 1 or 2 natural follow-up questions the visitor might want to ask next.
6. **Resume / CV Requests:** If a visitor asks for Ramu's resume or CV, always provide the direct download link: [Resume](${links?.resume || "https://www.imramu.me/ramunarlapati%20cv.pdf"}) and present a brief professional overview summarizing his education, traineeships, and core credentials.
7. **Certifications & Courses:** When asked about Ramu's certifications or courses, start with a bold title "**Certifications and Courses**" (without hash symbols) on its own line. Then add the paragraph: "Ramu has acquired a range of certifications and completed various courses to enhance his skills in Electrical & Electronics Engineering, Embedded Systems, IoT, Artificial Intelligence, and modern Web Development. Some of his notable certifications and courses include:"
Then list the certifications in point order exactly like this, wrapping each certification name in double asterisks so it renders in cyan/bold:
* **[Name of Certification/Course]** by [Provider] (Platform: [Platform], Issued: [Issued])
Use the exact certifications list from the data. End the response with: "These certifications and courses demonstrate his expertise in areas such as PLC, HMI, battery design, AI, and IoT. Next, you might want to ask about his Technical Skills or Project Portfolio."`;
}

/**
 * Helper function to send HTTP POST request to Groq API using built-in https module.
 */
function callGroqApi(messages) {
  return new Promise((resolve, reject) => {
    const apiKey = getGroqApiKey();
    if (!apiKey) {
      return reject(new Error("GROQ_API_KEY environment variable is not set. Please add GROQ_API_KEY=your_key_here to a .env file in the project directory."));
    }

    const requestData = JSON.stringify({
      model: GROQ_MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.95
    });

    const options = {
      hostname: "api.groq.com",
      path: "/openai/v1/chat/completions",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestData)
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(body);
            const reply = parsed.choices?.[0]?.message?.content || "No response generated.";
            resolve(reply);
          } catch (err) {
            reject(new Error("Failed to parse Groq API response: " + err.message));
          }
        } else {
          reject(new Error(`Groq API returned status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on("error", (err) => {
      reject(new Error("Network error connecting to Groq API: " + err.message));
    });

    req.write(requestData);
    req.end();
  });
}

/**
 * Helper to send JSON responses
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(data));
}

/**
 * Main HTTP Server handler
 */
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS Preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    return res.end();
  }

  // ── API Routes ──────────────────────────────────────────────────────────────

  // 1. Health & Status Check
  if (req.method === "GET" && pathname === "/api/health") {
    const kb = loadKnowledgeBase();
    const projList = Array.isArray(kb.projectsData) ? kb.projectsData : (kb.projectsData?.projects || []);
    return sendJson(res, 200, {
      status: "online",
      model: GROQ_MODEL,
      knowledgeBase: {
        projectsCount: projList.length,
        hasAbout: !!(kb.aboutData?.profile || kb.aboutData?.personal_summary)
      },
      timestamp: new Date().toISOString()
    });
  }

  // 2. Get all projects from brain.json
  if (req.method === "GET" && pathname === "/api/projects") {
    const { projectsData } = loadKnowledgeBase();
    const projList = Array.isArray(projectsData) ? projectsData : (projectsData?.projects || []);
    return sendJson(res, 200, { projects: projList, metadata: projectsData });
  }

  // 3. Get about profile from about.json
  if (req.method === "GET" && pathname === "/api/about") {
    const { aboutData } = loadKnowledgeBase();
    return sendJson(res, 200, { about: aboutData });
  }

  // 4. Reset Conversation Session
  if (req.method === "POST" && pathname === "/api/reset") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const { sessionId = "default" } = JSON.parse(body || "{}");
        sessions.delete(sessionId);
        return sendJson(res, 200, { status: "success", message: `Session ${sessionId} reset.` });
      } catch (e) {
        return sendJson(res, 400, { error: "Invalid JSON body" });
      }
    });
    return;
  }

  // 5. Chat Endpoint (RAG Core)
  if (req.method === "POST" && pathname === "/api/chat") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const { message, sessionId = "default" } = JSON.parse(body || "{}");

        if (!message || typeof message !== "string" || !message.trim()) {
          return sendJson(res, 400, { error: "Message is required and cannot be empty." });
        }

        // Retrieve or initialize conversation session history
        if (!sessions.has(sessionId)) {
          sessions.set(sessionId, []);
        }
        const history = sessions.get(sessionId);

        // Limit conversation history to last 10 messages to save tokens and maintain focus
        const recentHistory = history.slice(-10);

        // Prepare full messages array with dynamic RAG System Prompt
        const messages = [
          { role: "system", content: buildSystemPrompt() },
          ...recentHistory,
          { role: "user", content: message.trim() }
        ];

        console.log(`[Chat Request] Session: ${sessionId} | User: "${message.trim()}"`);

        // Call Groq API
        const reply = await callGroqApi(messages);

        // Update session history
        history.push({ role: "user", content: message.trim() });
        history.push({ role: "assistant", content: reply });

        console.log(`[Chat Reply] Session: ${sessionId} | Reply Length: ${reply.length} chars`);

        return sendJson(res, 200, {
          reply: reply,
          sessionId: sessionId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("[Groq API Error]", error.message);
        return sendJson(res, 500, {
          error: "Failed to generate AI response: " + error.message,
          details: error.message
        });
      }
    });
    return;
  }

  // ── Static File Serving ─────────────────────────────────────────────────────
  let filePath = path.join(__dirname, pathname === "/" ? "index.html" : pathname);

  // Security check to prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("404 Not Found: File does not exist.");
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".pdf": "application/pdf"
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        return res.end("500 Internal Server Error: " + err.code);
      }
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  const apiKey = getGroqApiKey();
  console.log("==========================================================");
  console.log(`🚀 RAM-AI Portfolio Backend & UI Server running!`);
  console.log(`🌐 Local URL:  http://localhost:${PORT}`);
  console.log(`🧠 Knowledge Base: Loaded from brain.json & about.json`);
  console.log(`⚡ Groq Model:   ${GROQ_MODEL}`);
  console.log(`🔑 Groq API Key: ${apiKey ? "Loaded (" + apiKey.slice(0, 8) + "...)" : "⚠️ NOT SET (Please add GROQ_API_KEY to .env file)"}`);
  console.log("==========================================================");
});
