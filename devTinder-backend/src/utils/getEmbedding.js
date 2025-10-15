const axios = require("axios");

async function getEmbedding(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    console.warn("⚠️ Empty or invalid text for embedding.");
    return null;
  }

  // Base URL (production Space)
  const EMBEDDING_URL =
    process.env.EMBEDDING_API_URL ||
    "https://priyanshurai439-smartfeed.hf.space/embed";

  // Simple retry logic (try twice before failing)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await axios.post(
        EMBEDDING_URL,
        { text },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000, // 15 s timeout for inference
        }
      );

      const embedding = res.data?.embedding;
      if (Array.isArray(embedding)) {
        if (attempt > 1) console.log(`✅ Retry succeeded on attempt ${attempt}`);
        return embedding;
      }

      console.warn("⚠️ Invalid embedding format:", res.data);
      return null;
    } catch (err) {
      // Detailed error reporting
      if (err.response) {
        console.error(
          `❌ [Attempt ${attempt}] Embedding API responded ${err.response.status}:`,
          err.response.data
        );
      } else if (err.request) {
        console.error(
          `❌ [Attempt ${attempt}] No response from Embedding API:`,
          err.message
        );
      } else {
        console.error(`❌ [Attempt ${attempt}] Embedding API Error:`, err.message);
      }

      // Wait 1.5s before retrying
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1500));
        console.log("🔁 Retrying embedding request...");
      } else {
        console.error("🚨 All embedding attempts failed.");
      }
    }
  }

  return null; // Fallback if both attempts fail
}

module.exports = getEmbedding;
