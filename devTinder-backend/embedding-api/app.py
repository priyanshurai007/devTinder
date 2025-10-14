import gradio as gr
from sentence_transformers import SentenceTransformer

MODEL_NAME = "paraphrase-MiniLM-L3-v2"
print(f"🔹 Loading model: {MODEL_NAME}")
model = SentenceTransformer(MODEL_NAME)
print("✅ Model loaded successfully!")

def embed_text(text):
    if not text.strip():
        return "Error: Empty text"
    embedding = model.encode([text])[0].tolist()
    return {"embedding": embedding}

demo = gr.Interface(
    fn=embed_text,
    inputs=gr.Textbox(label="Enter text"),
    outputs="json",
    title="Smart Feed Embedding API",
    description="Returns sentence embeddings for any input text."
)

demo.launch()
