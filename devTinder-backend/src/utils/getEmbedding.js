const axios = require("axios");

async function getEmbedding(text) {
  try {
    // 🔹 Hugging Face Spaces (Gradio) endpoint
    const res = await axios.post(
      "https://priyanshurai439-smartfeed.hf.space/run/predict",
      { data: [text] }, // 👈 required shape
      { headers: { "Content-Type": "application/json" } }
    );

    // 🧠 Inspect full response
    console.log("🧠 HF Embedding API response:", res.data);

    // 🔹 Gradio returns the embedding inside data[0].embedding
    const embedding =
      res.data?.data?.[0]?.embedding ||
      res.data?.data?.[0] || // sometimes plain array
      null;

    if (Array.isArray(embedding)) {
      console.log("✅ Embedding generated for:", text);
      return embedding;
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
