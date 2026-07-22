import os
import ollama
import chromadb
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

app = FastAPI(title="Nexus AI Backend - RAG Enabled")

# 1. Initialize Ollama Client
ollama_host = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
ollama_client = ollama.Client(host=ollama_host)

# 2. Initialize ChromaDB Vector Database
chroma_client = chromadb.Client()
collection = chroma_client.get_or_create_collection(name="developer_notes")

# Populate DB with starter notes and clean reference snippets
if collection.count() == 0:
    collection.add(
        documents=[
            "FastAPI uses Pydantic models for request body validation and serialization.",
            "In FastAPI, enable CORS directly using CORSMiddleware from fastapi.middleware.cors. Example: app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*']). Never write custom middleware functions for CORS.",
            "Ollama runs open-source LLMs locally and exposes a REST API at port 11434.",
            "Vite + React provides a lightweight development environment for single-page apps.",
            "Nexus AI uses Server-Sent Events (SSE) to stream tokens live to the frontend."
        ],
        ids=["note_1", "note_2", "note_3", "note_4", "note_5"]
    )
    print("✅ Initialized ChromaDB with default developer notes and reference code!")

# 3. Configure CORS
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
# RAG STREAMING ENDPOINT
# ==========================================
@app.post("/api/chat/stream")
async def chat_stream(payload: ChatRequest):
    """
    1. Queries ChromaDB for relevant context.
    2. Injects context into Ollama prompt with strict guardrails.
    3. Streams response to React UI.
    """
    def event_generator():
        try:
            # Step A: Query ChromaDB Vector DB
            search_results = collection.query(
                query_texts=[payload.prompt],
                n_results=2  # Retrieve top 2 matching context snippets
            )
            
            retrieved_docs = search_results.get("documents", [[]])[0]
            context_str = "\n".join([f"- {doc}" for doc in retrieved_docs])

            # Step B: Construct Context-Injected System Prompt with Strict Guardrails
            system_prompt = (
                "You are Nexus AI, a helpful and accurate software development assistant.\n"
                "CRITICAL RULES FOR CODE GENERATION:\n"
                "1. Write ONLY valid, standard, working Python and FastAPI code.\n"
                "2. NEVER invent fake classes or modules (e.g., DO NOT use CORSRequestInterceptor, CORSCustomMiddleware, or FastAPIRequest).\n"
                "3. Use standard FastAPI built-in utilities ONLY: from fastapi.middleware.cors import CORSMiddleware.\n"
                "4. For enabling CORS in FastAPI, the ONLY code needed is app.add_middleware(CORSMiddleware, ...).\n"
                "5. Use the retrieved context below as your primary reference source.\n\n"
                f"--- RETRIEVED DATABASE CONTEXT ---\n{context_str}\n-----------------------------------\n"
            )

            # Step C: Stream from Ollama
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
            yield f"\n[RAG Stream Error: {str(e)}]"

    return StreamingResponse(event_generator(), media_type="text/event-stream")