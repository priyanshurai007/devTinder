from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer

app = Flask(__name__)
CORS(app)

model = SentenceTransformer("all-MiniLM-L6-v2")

@app.route("/embed", methods=["POST"])
def embed():
    data = request.get_json()
    text = data.get("text", "")

    if not text.strip():
        return jsonify({"error": "Empty text"}), 400

    embedding = model.encode([text])[0].tolist()
    return jsonify({"embedding": embedding})

if __name__ == "__main__":
    app.run(port=5005)
