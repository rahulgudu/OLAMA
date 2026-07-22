import os
import ollama
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

app = FastAPI(title="Developer AI Notes Backend")

# Explicitly connect to Ollama running on loopback 127.0.0.1
ollama_client = ollama.Client(host="http://127.0.0.1:11434")

# Enable CORS for React/Codespaces
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

class ChatResponse(BaseModel):
    model: str
    response: str


# Streaming endpoint for chat with LLM
@app.post("/api/chat/stream", response_model=ChatResponse)
async def chat_with_llm(payload: ChatRequest):
    # Streams the response word-by-word from Ollama to the client.

    def event_generator():
        try:
            # Pass stream=true to recieve a generator from Ollama to the client
            response_stream = ollama_client.chat(
                model = payload.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful AI assistant for developers."
                    },
                    {
                        "role": "user",
                        "content": payload.prompt
                    }
                ],
                stream=True
            ) 
            for chunk in response_stream:
                content = chunk.get("message", {}).get("content", "")
                if content:
                    yield content
        except Exception as e:
            yield f"\n[Stream Error: {str(e)}]"
    return StreamingResponse(event_generator(), media_type="text/plain")

    