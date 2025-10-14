from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import os

app = Flask(__name__)
CORS(app)

# 🧠 Use a lighter model to stay under 512 MB on Render free tier.
# You can switch back to "all-MiniLM-L6-v2" if you upgrade your instance.
MODEL_NAME = os.getenv("MODEL_NAME", "paraphrase-MiniLM-L3-v2")

print(f"🔹 Loading model: {MODEL_NAME}")
model = SentenceTransformer(MODEL_NAME)
print("✅ Model loaded successfully!")

@app.route("/embed", methods=["POST"])
def embed():
    try:
        data = request.get_json(force=True)
        text = data.get("text", "").strip()

        if not text:
            return jsonify({"error": "Empty text"}), 400

        embedding = model.encode([text])[0].tolist()
        return jsonify({"embedding": embedding})

    except Exception as e:
        print(f"❌ Error while encoding: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # 🔧 Render assigns its own port — use it dynamically.
    port = int(os.environ.get("PORT", 5005))
    app.run(host="0.0.0.0", port=port)
