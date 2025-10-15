const axios = require("axios");

async function getEmbedding(text) {

  try {
    
    const res = await axios.post(
      "https://priyanshurai439-smartfeed.hf.space/embed",
      { text },
      { headers: { "Content-Type": "application/json" } }
    );

    const embedding = res.data?.embedding;
    if (Array.isArray(embedding)) return embedding;

    console.warn("⚠️ Invalid embedding:", res.data);
    return null;
  } catch (err) {
    console.error("❌ Embedding API Error:", err.message);
    return null;
  }
}

module.exports = getEmbedding;
