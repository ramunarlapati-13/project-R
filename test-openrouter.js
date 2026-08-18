/**
 * OpenRouter Multi-Model & Real-Time Fastest Router Test Script
 * 
 * Verifies:
 * 1. OpenRouter endpoint connectivity (https://openrouter.ai/api/v1/chat/completions)
 * 2. Dynamic fastest model auto-routing (openrouter/auto with provider: { sort: "latency" })
 * 3. Multi-model routing across top fast providers (Gemini Flash, Llama Nitro, GPT-4o-mini)
 * 4. Error handling and header propagation (HTTP-Referer, X-Title)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Load .env locally
function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

const API_KEY = process.env.OPENROUTER_API_KEY || process.argv[2];
const SITE_URL = process.env.OPENROUTER_SITE_URL || "https://www.imramu.me";
const SITE_NAME = process.env.OPENROUTER_SITE_NAME || "RAM-AI Portfolio Hub";

if (!API_KEY || API_KEY === "your_openrouter_api_key_here") {
  console.error("\n❌ Error: OPENROUTER_API_KEY is not set.");
  console.error("Please add your real key to .env or pass it as an argument:");
  console.error("  node test-openrouter.js sk-or-v1-xxxxxxxx\n");
  process.exit(1);
}

function testModel(modelName, prompt = "Say 'Hello from fastest model!' in 5 words or less.") {
  return new Promise((resolve) => {
    console.log(`\n⏳ Testing router/model: \x1b[36m${modelName}\x1b[0m...`);
    const startTime = Date.now();

    const payload = {
      model: modelName,
      messages: [
        { role: "system", content: "You are a concise testing assistant." },
        { role: "user", content: prompt }
      ],
      max_tokens: 50,
      temperature: 0.3,
      provider: {
        sort: "latency" // Prioritizes lowest latency provider at this moment
      }
    };

    if (modelName === "openrouter/auto") {
      payload.models = [
        "openrouter/auto",
        "google/gemini-2.5-flash",
        "meta-llama/llama-3.3-70b-instruct:nitro",
        "openai/gpt-4o-mini"
      ];
      payload.route = "fallback";
    }

    const requestData = JSON.stringify(payload);

    const options = {
      hostname: "openrouter.ai",
      path: "/api/v1/chat/completions",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestData)
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(body);
            const reply = parsed.choices?.[0]?.message?.content?.trim() || "(Empty response)";
            const resolvedModel = parsed.model || modelName;
            console.log(`  ✅ Status: \x1b[32m${res.statusCode} OK\x1b[0m (${elapsed}s)`);
            console.log(`  ⚡ Dynamically Resolved Model: \x1b[33m${resolvedModel}\x1b[0m`);
            console.log(`  💬 Response: "${reply}"`);
            resolve({ success: true, requested: modelName, resolvedModel, reply, elapsed });
          } catch (err) {
            console.log(`  ❌ JSON Parse Error: ${err.message}`);
            resolve({ success: false, requested: modelName, error: err.message, elapsed });
          }
        } else {
          try {
            const errorParsed = JSON.parse(body);
            const errMsg = errorParsed.error?.message || errorParsed.message || body;
            console.log(`  ❌ Status \x1b[31m${res.statusCode}\x1b[0m: ${errMsg}`);
            resolve({ success: false, requested: modelName, status: res.statusCode, error: errMsg, elapsed });
          } catch (e) {
            console.log(`  ❌ Status \x1b[31m${res.statusCode}\x1b[0m: ${body}`);
            resolve({ success: false, requested: modelName, status: res.statusCode, error: body, elapsed });
          }
        }
      });
    });

    req.on("error", (err) => {
      console.log(`  ❌ Network Error: ${err.message}`);
      resolve({ success: false, requested: modelName, error: err.message });
    });

    req.setTimeout(25000, () => {
      req.destroy();
      console.log(`  ❌ Request Timed Out (25s)`);
      resolve({ success: false, requested: modelName, error: "Timed out" });
    });

    req.write(requestData);
    req.end();
  });
}

async function runAllTests() {
  console.log("==========================================================");
  console.log("🚀 OpenRouter Real-Time Fastest Model Router Test");
  console.log(`🔑 Key: ${API_KEY.slice(0, 10)}... (Length: ${API_KEY.length})`);
  console.log(`⚡ Mode: Dynamic Lowest Latency Routing (provider.sort: "latency")`);
  console.log("==========================================================");

  const testConfigs = [
    "openrouter/auto",
    "google/gemini-2.5-flash",
    "meta-llama/llama-3.3-70b-instruct:nitro"
  ];

  const results = [];
  for (const model of testConfigs) {
    const result = await testModel(model);
    results.push(result);
  }

  console.log("\n==========================================================");
  console.log("📊 Summary of Results:");
  console.log("==========================================================");
  let allPassed = true;
  for (const r of results) {
    if (r.success) {
      console.log(`  • \x1b[32m[PASS]\x1b[0m ${r.requested} -> \x1b[33m${r.resolvedModel}\x1b[0m (${r.elapsed}s)`);
    } else {
      console.log(`  • \x1b[31m[FAIL]\x1b[0m ${r.requested} - ${r.error}`);
      allPassed = false;
    }
  }
  console.log("==========================================================");

  if (allPassed) {
    console.log("🎉 All latency-optimized requests routed successfully via OpenRouter!\n");
    process.exit(0);
  } else {
    console.log("⚠️ Some tests failed. Check API key credits or network connectivity.\n");
    process.exit(1);
  }
}

runAllTests();
