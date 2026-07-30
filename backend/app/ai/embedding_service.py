from sentence_transformers import SentenceTransformer

# Load the model only once when the application starts
model = SentenceTransformer("all-MiniLM-L6-v2")


def generate_embedding(text):
    """
    Generate a semantic embedding for the given text.
    """
    embedding = model.encode(text)

    # Convert NumPy array to Python list so it can be stored in MongoDB
    return embedding.tolist()