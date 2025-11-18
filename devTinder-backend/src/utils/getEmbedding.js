const axios = require("axios");

async function getEmbedding(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return null;
  }

  // Use env var if set, otherwise default to deployed HuggingFace Space
  // For local: set EMBEDDING_API_URL in .env to http://localhost:5000/embed (or your local API)
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
        return embedding;
      }

      return null;
    } catch (err) {
      // Detailed error reporting
      // Wait 1.5s before retrying
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }

  return null; // Fallback if both attempts fail
}

module.exports = getEmbedding;
