import chromadb

chroma_client = chromadb.Client()

collection = chroma_client.get_or_create_collection(name="developer_notes")

documents = [
    "FastAPI uses Pydantic models for request body validation and serialization.",
    "To enable CORS in FastAPI, import CORSMiddleware and add it using app.add_middleware().",
    "Ollama runs open-source LLMs locally and exposes a REST API at port 11434.",
    "Vite + React provides a lightweight development environment for single-page apps."
]

metadata = [
    {
        "category": "backend", 
        "topic": "validation",
    },
    {
        "category": "backend",
        "topic": "security"
    },
    {
        "category": "ai",
        "topic": "llm"
    },
    {
        "category": "frontend",
        "topic": "react"
    }
]

ids = ["note_1", "note_2", "note_3", "note_4"]

collection.add(
    documents=documents,
    metadatas=metadata,
    ids = ids
)

print("Successfully indexed 4 documents into ChromaDB!\n")


user_query = "How do I secure my FastAPI application against cross-origin requests?"

results = collection.query(
    query_texts = [user_query],
    n_results = 1
)

retrieved_text = results["documents"][0][0]
doc_id = results["ids"][0][0]

print(f"Query: {user_query}")
print(f"Retrieved Matched ({doc_id}):\n --> {retrieved_text}")