import os
import sys

# Fast local loading (prevent HuggingFace online ping delay on startup)
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

print("🚀 Starting Nexora Backend Server...")
print("⏳ Initializing AI ranking engine & loading cached SentenceTransformer embeddings...")

from app import create_app

app = create_app()

if __name__ == "__main__":
    print("✅ Nexora Backend is running on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True, use_reloader=False)