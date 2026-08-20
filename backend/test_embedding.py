import os
os.environ["TESTING"] = "true"

import unittest
from app.ai.embedding_service import generate_embedding

class TestEmbedding(unittest.TestCase):
    def test_embedding_generation(self):
        text = "Apple launches GPT-powered AI model"
        embedding = generate_embedding(text)
        self.assertEqual(len(embedding), 384)
        print("Embedding Length:", len(embedding))
        print("First 10 Values:", embedding[:10])

if __name__ == "__main__":
    unittest.main()