import os
import ollama
import chromadb
from neo4j import GraphDatabase
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# Import our comprehensive knowledge base file
from knowledge_base import DEVELOPER_DOCUMENTS, NEO4J_SEED_CYPHER

app = FastAPI(title="Nexus AI Backend - Full Stack GraphRAG")

# ==========================================
# 1. INITIALIZE OLLAMA
# ==========================================
ollama_host = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
ollama_client = ollama.Client(host=ollama_host)

# ==========================================
# 2. INITIALIZE CHROMADB VECTOR DATABASE
# ==========================================
chroma_client = chromadb.Client()
collection = chroma_client.get_or_create_collection(name="multi_tech_knowledge")

# Seed ChromaDB from imported dataset if empty
if collection.count() == 0:
    collection.add(
        documents=[doc["text"] for doc in DEVELOPER_DOCUMENTS],
        ids=[doc["id"] for doc in DEVELOPER_DOCUMENTS]
    )
    print(f"✅ Initialized ChromaDB Vector DB with {len(DEVELOPER_DOCUMENTS)} comprehensive tech documents!")

# ==========================================
# 3. INITIALIZE NEO4J GRAPH DATABASE
# ==========================================
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password123")

neo4j_driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

# Seed Neo4j Knowledge Graph on startup
try:
    neo4j_driver.execute_query(NEO4J_SEED_CYPHER)
    print("✅ Initialized Neo4j Knowledge Graph with full tech stack entities!")
except Exception as e:
    print(f"⚠️ Neo4j Warning: {e}")

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    model: str = Field(default="qwen2.5:0.5b")

# ==========================================
# HELPER: NEO4J GRAPH RETRIEVAL
# ==========================================
def get_graph_context(query_text: str) -> str:
    """Dynamic Neo4j traversal matching query keywords across tech stacks."""
    try:
        keywords = ["fastapi", "react", "express", "spring", "gin", "dotnet", "laravel", 
                    "python", "javascript", "java", "golang", "c#", "php", "mongodb", "ollama", "cors"]
        
        matched_keyword = next((kw for kw in keywords if kw in query_text.lower()), None)
        
        if not matched_keyword:
            return "No explicit tech relationship nodes matched in graph query."

        query = """
        MATCH (t:Tech)-[r]->(related)
        WHERE toLower(t.name) CONTAINS toLower($keyword) 
           OR toLower(related.name) CONTAINS toLower($keyword)
        RETURN t.name AS source, type(r) AS relationship, related.name AS target
        LIMIT 6
        """

        records, _, _ = neo4j_driver.execute_query(query, parameters_={"keyword": matched_keyword})
        
        if not records:
            return "No matching relationships found."

        return "\n".join([f"({r['source']}) --[{r['relationship']}]--> ({r['target']})" for r in records])

    except Exception as e:
        return f"Graph query skipped: {str(e)}"

# ==========================================
# RAG STREAMING ENDPOINT
# ==========================================
@app.post("/api/chat/stream")
async def chat_stream(payload: ChatRequest):
    def event_generator():
        try:
            # 1. Retrieve Vector Documents from ChromaDB
            search_results = collection.query(query_texts=[payload.prompt], n_results=3)
            retrieved_docs = search_results.get("documents", [[]])[0]
            vector_context = "\n".join([f"- {doc}" for doc in retrieved_docs])

            # 2. Retrieve Graph Relations from Neo4j
            graph_context = get_graph_context(payload.prompt)

            # 3. Construct System Prompt with Context & Guardrails
            system_prompt = (
                "You are Nexus AI, a expert multi-stack software engineering assistant.\n"
                "CRITICAL INSTRUCTIONS:\n"
                "1. Provide accurate code examples using standard, official framework patterns.\n"
                "2. Base your response directly on the retrieved context whenever possible.\n\n"
                f"--- 📄 VECTOR DATABASE CONTEXT (ChromaDB) ---\n{vector_context}\n\n"
                f"--- 🕸️ KNOWLEDGE GRAPH CONTEXT (Neo4j) ---\n{graph_context}\n"
                "-------------------------------------------\n"
            )

            # 4. Stream Tokens from Ollama
            response_stream = ollama_client.chat(
                model=payload.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": payload.prompt}
                ],
                stream=True
            )

            for chunk in response_stream:
                content = chunk.get('message', {}).get('content', '')
                if content:
                    yield content

        except Exception as e:
            yield f"\n[GraphRAG Stream Error: {str(e)}]"

    return StreamingResponse(event_generator(), media_type="text/event-stream")