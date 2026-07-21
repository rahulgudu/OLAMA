import traceback
import ollama
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
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

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_llm(payload: ChatRequest):
    try:
        messages = [
            {"role": "system", "content": "You are a helpful AI assistant for developers."},
            {"role": "user", "content": payload.prompt}
        ]

        response = ollama_client.chat(
            model=payload.model,
            messages=messages
        )

        return ChatResponse(
            model=payload.model,
            response=response['message']['content']
        )

    except Exception as e:
        # Print full traceback in terminal for easy debugging
        print("\n❌ OLLAMA ERROR DETAILED TRACEBACK:")
        traceback.print_exc()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ollama Error: {str(e)}"
        )