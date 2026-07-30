from app.ai.embedding_service import generate_embedding

text = "Apple launches GPT-powered AI model"

embedding = generate_embedding(text)

print("Embedding Length:", len(embedding))
print("First 10 Values:", embedding[:10])