/**
 * RAM-AI // Frontend Script & Interactive AI Hub
 * Features: RAG Chat Integration, Web Audio UI Clicks, Dynamic Portfolio Grid, Live Filtering
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const resetBtn = document.getElementById("reset-btn");
  const soundToggleBtn = document.getElementById("sound-toggle-btn");
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const suggestionChips = document.querySelectorAll(".chip");
  const projectsGrid = document.getElementById("projects-grid");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const toastContainer = document.getElementById("toast-container");

  // State
  let sessionId = "session_" + Math.random().toString(36).substring(2, 9);
  let isGenerating = false;
  let soundEnabled = true;
  let allProjects = [];

  // ── Web Audio API for UI Sound Effects ────────────────────────────────────
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playSound(type = "click") {
    if (!soundEnabled) return;
    try {
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "send") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "receive") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  soundToggleBtn?.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundToggleBtn.innerHTML = soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
    showToast(soundEnabled ? "UI Audio Effects Enabled" : "UI Audio Effects Muted");
    playSound("click");
  });

  // ── Tab Navigation ────────────────────────────────────────────────────────
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      playSound("click");
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      document.getElementById(targetId)?.classList.add("active");

      if (targetId === "grid-tab" && allProjects.length === 0) {
        loadProjects();
      }
    });
  });

  // ── Simple Markdown Parser ────────────────────────────────────────────────
  function parseMarkdown(text) {
    if (!text) return "";
    let formatted = text
      // Escape HTML tags to prevent XSS
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      // Links [text](url) - parsed first, allowing optional spaces between ] and (
      .replace(/\[([^\]]+)\]\s*\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>')
      // Convert markdown headings (### text, ## text, # text) to styled bold text
      .replace(/^\s*#{1,6}\s*(.*?)\s*$/gm, '<strong style="color: var(--accent-cyan); font-size: 1.08em; display: inline-block; margin-top: 0.6em; margin-bottom: 0.2em;">$1</strong>')
      // Bold **text**
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Inline code `code`
      .replace(/`([^`]+)`/g, "<code>$1</code>");

    // Process lines into paragraphs and unordered bullet lists cleanly
    const lines = formatted.split("\n");
    let inList = false;
    let result = [];
    let currentPara = [];

    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        if (currentPara.length > 0) {
          result.push(`<p>${currentPara.join("<br>")}</p>`);
          currentPara = [];
        }
        if (!inList) {
          result.push("<ul>");
          inList = true;
        }
        result.push(`<li>${trimmed.substring(2).trim()}</li>`);
      } else {
        if (inList && trimmed === "") {
          result.push("</ul>");
          inList = false;
        }
        if (trimmed === "") {
          if (currentPara.length > 0) {
            result.push(`<p>${currentPara.join("<br>")}</p>`);
            currentPara = [];
          }
        } else {
          currentPara.push(trimmed);
        }
      }
    }
    if (inList) result.push("</ul>");
    if (currentPara.length > 0) result.push(`<p>${currentPara.join("<br>")}</p>`);

    return result.join("");
  }

  // ── Chat UI Handling ──────────────────────────────────────────────────────
  function appendMessage(role, content) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = role === "assistant" ? "🤖" : "👤";

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    if (role === "assistant") {
      contentDiv.innerHTML = parseMarkdown(content);
    } else {
      contentDiv.textContent = content;
    }

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(contentDiv);
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTypingIndicator() {
    const indicator = document.createElement("div");
    indicator.className = "message assistant";
    indicator.id = "typing-indicator-box";
    indicator.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeTypingIndicator() {
    const ind = document.getElementById("typing-indicator-box");
    if (ind) ind.remove();
  }

  async function sendMessage(text) {
    const messageText = text || chatInput.value.trim();
    if (!messageText || isGenerating) return;

    playSound("send");
    appendMessage("user", messageText);
    if (!text) chatInput.value = "";

    isGenerating = true;
    sendBtn.disabled = true;
    showTypingIndicator();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, sessionId: sessionId })
      });

      removeTypingIndicator();
      const data = await response.json();

      if (response.ok && data.reply) {
        playSound("receive");
        appendMessage("assistant", data.reply);
      } else {
        appendMessage("assistant", `⚠️ **Error:** ${data.error || "Failed to reach AI server."}`);
      }
    } catch (err) {
      removeTypingIndicator();
      appendMessage("assistant", `⚠️ **Network Error:** Could not connect to local server. Make sure \`node server.js\` is running!`);
    } finally {
      isGenerating = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  sendBtn?.addEventListener("click", () => sendMessage());
  chatInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  suggestionChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt") || chip.textContent;
      sendMessage(prompt);
    });
  });

  resetBtn?.addEventListener("click", async () => {
    playSound("click");
    if (confirm("Reset conversation history?")) {
      try {
        await fetch("/api/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        });
      } catch (e) {
        console.warn(e);
      }
      chatMessages.innerHTML = "";
      appendMessage("assistant", "Hello! I am **RAM-AI**, Ramu Narlapati's AI Portfolio Assistant. My conversation memory has been cleared. How can I assist you today? ⚡");
      showToast("Chat session cleared!");
    }
  });

  // ── Portfolio Grid & Filtering ────────────────────────────────────────────
  async function loadProjects() {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      allProjects = Array.isArray(data.projects) ? data.projects : (data.projects?.projects || []);
      const allBtn = document.querySelector('[data-filter="all"]');
      if (allBtn) allBtn.textContent = `All Projects (${allProjects.length})`;
      renderProjects("all");
    } catch (e) {
      projectsGrid.innerHTML = `<p style="color: var(--text-muted);">Failed to load projects from brain.json.</p>`;
    }
  }

  function renderProjects(filterTag) {
    if (!projectsGrid) return;
    projectsGrid.innerHTML = "";

    const filtered = allProjects.filter(p => {
      if (filterTag === "all") return true;
      const techList = p.technologies || p.stack || [];
      const stacks = (Array.isArray(techList) ? techList : [String(techList)]).map(s => s.toLowerCase());
      
      if (filterTag === "react") return stacks.some(s => s.includes("react") || s.includes("next") || s.includes("expo") || s.includes("vite"));
      if (filterTag === "iot") return stacks.some(s => s.includes("iot") || s.includes("esp32") || s.includes("esp8266") || s.includes("thingspeak") || s.includes("mq-2") || s.includes("dht11") || s.includes("relay") || s.includes("ldr") || s.includes("motor"));
      if (filterTag === "firebase") return stacks.some(s => s.includes("firebase"));
      if (filterTag === "web") return stacks.some(s => s.includes("html") || s.includes("css") || s.includes("javascript") || s.includes("next") || s.includes("vite") || s.includes("tailwind") || s.includes("express") || s.includes("node"));
      return true;
    });

    if (filtered.length === 0) {
      projectsGrid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">No projects found for filter "${filterTag}".</p>`;
      return;
    }

    filtered.forEach((p, idx) => {
      const card = document.createElement("div");
      card.className = "project-card";

      const techList = p.technologies || p.stack || [];
      const stackHTML = (Array.isArray(techList) ? techList : [techList])
        .map(s => `<span class="skill-tag">${s}</span>`).join("");

      card.innerHTML = `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span class="project-id">#${p.id || String(idx + 1).padStart(2, "0")}</span>
            ${p.achievement ? `<span style="background: rgba(255, 215, 0, 0.15); border: 1px solid rgba(255, 215, 0, 0.4); color: #ffd700; font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 999px; font-weight: 600;">🏆 ${p.achievement}</span>` : ""}
          </div>
          <div class="project-info">
            <h3>${p.name}</h3>
            <p>${p.description}</p>
          </div>
          <div class="project-stack" style="margin-top: 1rem;">
            ${stackHTML}
          </div>
        </div>
        <div class="project-actions">
          <button class="ask-ai-btn" data-project="${p.name}">
            🤖 Ask AI About This
          </button>
          ${p.link ? `<a href="${p.link}" target="_blank" rel="noopener noreferrer" class="live-link">Live Link ↗</a>` : ""}
        </div>
      `;

      projectsGrid.appendChild(card);
    });

    // Attach Ask AI click listeners
    document.querySelectorAll(".ask-ai-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        playSound("click");
        const projectName = e.currentTarget.getAttribute("data-project");
        // Switch to Chat Tab
        document.querySelector('[data-tab="chat-tab"]')?.click();
        showToast(`Switched to Chat! Asking about ${projectName}...`);
        setTimeout(() => {
          sendMessage(`Tell me more about the project **${projectName}**. What is its architecture, technology stack, and purpose?`);
        }, 300);
      });
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      playSound("click");
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-filter");
      renderProjects(filter);
    });
  });

  // ── Toast Helper ──────────────────────────────────────────────────────────
  function showToast(message) {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Initial greeting
  setTimeout(() => {
    appendMessage("assistant", "Hello! I am **RAM-AI**, Ramu Narlapati's AI Portfolio Assistant powered by Groq Llama-3.3-70b and RAG knowledge base. Ask me anything about Ramu's Electrical Engineering studies, full-stack projects, or skills! 🚀");
  }, 400);
});
