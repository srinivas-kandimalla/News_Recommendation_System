from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")


def generate_embedding(text):

    print("=" * 50)
    print("generate_embedding() called")
    print("Input Text:", text)

    embedding = model.encode(text)

    print("Embedding Length:", len(embedding))
    print("=" * 50)

    return embedding.tolist()