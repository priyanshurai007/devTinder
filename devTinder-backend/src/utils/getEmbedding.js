const axios = require("axios");

async function getEmbedding(text) {
  try {
    const res = await axios.post("http://127.0.0.1:5005/embed", { text });

    // Debug log full response
    console.log("🧠 Embedding API response:", res.data);

    if (res.data && Array.isArray(res.data.embedding)) {
      console.log("✅ Embedding generated for:", text);
      return res.data.embedding;
    } else {
      console.warn("⚠️ Invalid embedding format:", res.data);
      
      return null;
    }
  } catch (err) {
    console.error("❌ Embedding API Error:", err.message);
    return null;
  }
}

module.exports = getEmbedding;
