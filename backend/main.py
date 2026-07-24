import os
import ollama
import chromadb
from neo4j import GraphDatabase
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# Import Knowledge Base & Web Crawler Modules
from knowledge_base import DEVELOPER_DOCUMENTS, NEO4J_SEED_CYPHER
from web_crawler import search_and_crawl_web

app = FastAPI(title="Nexus AI Backend - Web Crawling GraphRAG")

# ==========================================
# 1. INITIALIZE SERVICES
# ==========================================

# Ollama Client (async, so token generation yields to the event loop instead of
# blocking it — required for real token-by-token SSE streaming under FastAPI)
ollama_host = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
ollama_client = ollama.AsyncClient(host=ollama_host)

# ChromaDB Vector DB
chroma_client = chromadb.Client()
collection = chroma_client.get_or_create_collection(name="multi_tech_knowledge")

if collection.count() == 0:
    collection.add(
        documents=[doc["text"] for doc in DEVELOPER_DOCUMENTS],
        ids=[doc["id"] for doc in DEVELOPER_DOCUMENTS]
    )
    print(f"✅ Initialized ChromaDB Vector DB with {len(DEVELOPER_DOCUMENTS)} documents!")

# Neo4j Graph DB
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password123")

neo4j_driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

try:
    neo4j_driver.execute_query(NEO4J_SEED_CYPHER)
    print("✅ Initialized Neo4j Knowledge Graph!")
except Exception as e:
    print(f"⚠️ Neo4j Startup Warning: {e}")

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
    model: str = Field(default="phi4-mini")
    enable_web_search: bool = Field(default=True)

# Helper: Neo4j Traversal
def get_graph_context(query_text: str) -> str:
    try:
        keywords = ["fastapi", "react", "express", "spring", "gin", "dotnet", "laravel", 
                    "python", "javascript", "java", "golang", "c#", "php", "mongodb", "ollama", "cors", "nexus ai"]
        matched_keyword = next((kw for kw in keywords if kw in query_text.lower()), None)
        
        if not matched_keyword:
            return "No explicit tech graph relationships matched."

        query = """
        MATCH (t)-[r]->(related)
        WHERE toLower(t.name) CONTAINS toLower($keyword) 
           OR toLower(related.name) CONTAINS toLower($keyword)
        RETURN t.name AS source, type(r) AS relationship, related.name AS target
        LIMIT 5
        """
        records, _, _ = neo4j_driver.execute_query(query, parameters_={"keyword": matched_keyword})
        if not records:
            return "No matching graph relationships."

        return "\n".join([f"({r['source']}) --[{r['relationship']}]--> ({r['target']})" for r in records])
    except Exception as e:
        return f"Graph query skipped: {str(e)}"

# ==========================================
# 2. TOKEN-BY-TOKEN STREAMING ENDPOINT
# ==========================================
@app.post("/api/chat/stream")
async def chat_stream(payload: ChatRequest):
    async def event_generator():
        try:
            # Step 1: Retrieve Vector Memory (ChromaDB)
            search_results = collection.query(query_texts=[payload.prompt], n_results=2)
            retrieved_docs = search_results.get("documents", [[]])[0]
            vector_context = "\n".join([f"- {doc}" for doc in retrieved_docs])

            # Step 2: Retrieve Graph Memory (Neo4j)
            graph_context = get_graph_context(payload.prompt)

            # Step 3: Retrieve Live Web Results & Page Crawls
            web_context = ""
            if payload.enable_web_search:
                print(f"🌐 Crawling web for query: '{payload.prompt}'...")
                web_context = await search_and_crawl_web(payload.prompt, max_results=2)

            # Step 4: Strict Guardrail Prompting
            system_prompt = (
                "You are Nexus AI, an expert software engineering assistant.\n\n"
                "STRICT RESPONSE RULES:\n"
                "1. ALWAYS prioritize LIVE CRAWLED WEB CONTENT over internal training cutoff limits.\n"
                "2. When writing FastAPI CORS code, ALWAYS use standard `app.add_middleware(CORSMiddleware, ...)` syntax. Never generate custom `@app.middleware('http')` handlers or mention Flask.\n"
                "3. Describe ONLY the technologies mentioned in the context below. Do NOT invent unrelated components like Cassandra, NIM, or JDO.\n"
                "4. Provide production-ready, clean code blocks inside markdown.\n\n"
                f"--- 📄 VECTOR DATABASE CONTEXT (ChromaDB) ---\n{vector_context}\n\n"
                f"--- 🕸️ KNOWLEDGE GRAPH CONTEXT (Neo4j) ---\n{graph_context}\n\n"
                f"--- 🌐 LIVE CRAWLED WEB CONTENT ---\n{web_context}\n"
                "-------------------------------------------\n"
            )

            # Step 5: Stream Tokens from Ollama
            response_stream = await ollama_client.chat(
                model=payload.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": payload.prompt}
                ],
                stream=True
            )

            async for chunk in response_stream:
                content = chunk.get('message', {}).get('content', '')
                if content:
                    yield content

        except Exception as e:
            yield f"\n[Stream Error: {str(e)}]"

    # Anti-Buffering Headers to ensure token-by-token streaming
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )