const axios = require("axios");

async function getEmbedding(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    console.warn("⚠️ Empty or invalid text for embedding.");
    return null;
  }

  try {
    // ⚡ Trailing slash matters for Hugging Face Spaces FastAPI
    const EMBEDDING_URL =
      process.env.EMBEDDING_API_URL ||
      "https://priyanshurai439-smartfeed.hf.space/embed/";

    const res = await axios.post(
      EMBEDDING_URL,
      { text },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000, // 15 s timeout for model inference
      }
    );

    const embedding = res.data?.embedding;
    if (Array.isArray(embedding)) return embedding;

    console.warn("⚠️ Invalid embedding format:", res.data);
    return null;
  } catch (err) {
    // More descriptive logging
    if (err.response) {
      console.error(
        `❌ Embedding API responded ${err.response.status}:`,
        err.response.data
      );
    } else if (err.request) {
      console.error("❌ No response from Embedding API:", err.message);
    } else {
      console.error("❌ Embedding API Error:", err.message);
    }
    return null;
  }
}

module.exports = getEmbedding;
