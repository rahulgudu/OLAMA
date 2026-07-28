import os
import re
import ollama
import chromadb
import httpx
from typing import Optional
from neo4j import GraphDatabase
from fastapi import FastAPI, Header
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
    expose_headers=["X-Chat-Id"],
)


# ==========================================
# CHAT MEMORY SERVICE (Node/Express/Mongo `backend/`)
# ==========================================
CHAT_SERVICE_URL = os.getenv("CHAT_SERVICE_URL", "http://localhost:4000")
HISTORY_WINDOW = 16  # last N messages (~8 turns) sent to Ollama — small models, small context windows

async def chat_service_request(method: str, path: str, token: str, json_body: dict | None = None):
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.request(
            method,
            f"{CHAT_SERVICE_URL}{path}",
            headers={"Authorization": token},
            json=json_body
        )
        resp.raise_for_status()
        return resp.json()




class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    model: str = Field(default="phi4-mini")
    enable_web_search: bool = Field(default=True)
    chat_id: Optional[str] = Field(default=None)

# Helper: detect "reformat/summarize what you just said" style follow-ups, where
# re-running vector/graph/web retrieval only injects irrelevant noise that pushes
# a small local model toward hallucinating unrelated content instead of just
# working from the existing conversation.
FOLLOWUP_META_PHRASES = [
    "the above", "above information", "above response", "above answer", "elabrate above",
    "previous message", "previous response", "previous answer", "what you just said",
    "what i just said", "table format", "in a table", "as a table",
    "bullet points", "bullet point", "in a list", "list format",
    "reformat", "rewrite that", "rephrase", "summarize that", "summarise that",
    "shorter", "more concise", "in short", "convert that", "convert it",
    "elaborate", "elabrate", "expand on", "expand that", "explain more", "go deeper", "tell me more"
]


# Catches "in 350 words", "in a single paragraph", "in one sentence", etc. — a pure
# length/format constraint on the PREVIOUS answer. A hardcoded phrase list can never
# cover every word count, so this is a pattern instead of an ever-growing string list.
LENGTH_CONSTRAINT_PATTERN = re.compile(
    r'\d+\s*words|single (paragraph|sentence|line)|one (paragraph|sentence|line)|'
    r'few (words|sentences|lines)|in brief|briefly',
    re.IGNORECASE
)

def is_followup_meta_request(prompt: str) -> bool:
    lowered = prompt.lower()
    if any(phrase in lowered for phrase in FOLLOWUP_META_PHRASES):
        return True
    return bool(LENGTH_CONSTRAINT_PATTERN.search(prompt))

# Plain greetings/small talk ("Hii", "thanks", "ok") need zero retrieval — matched as
# the WHOLE trimmed message so "hi, what is FastAPI" still gets full treatment. Without
# this, a bare "Hii" gets searched literally on the web (matching the HII stock ticker
# in one real case) and full RAG runs on a message that isn't a question at all.
SMALL_TALK_PATTERN = re.compile(
    r'^(hi+|hey+|hello+|yo+|sup|thanks?( you)?|thank you|ok(ay)?|bye|goodbye|'
    r'good (morning|night|evening|afternoon))[!.?\s]*$',
    re.IGNORECASE
)

def is_small_talk(prompt: str) -> bool:
    return bool(SMALL_TALK_PATTERN.match(prompt.strip()))

# The FastAPI-CORS rule below is only useful when CORS is actually the topic — as a
# permanent always-on rule it gave the model something to latch onto and hallucinate
# about even on totally unrelated messages once the real retrieved context was weak.
def wants_cors_help(prompt: str) -> bool:
    return "cors" in prompt.lower()

# ==========================================
# INTENT CLASSIFIER (fallback for what the regexes above miss)
# ==========================================
# The phrase/regex checks above are a fast, zero-latency first pass for known cases.
# But "hii nexus", "yo whats up", "can u make it snappier" etc. will always keep
# slipping through a hardcoded list — that's the same whack-a-mole problem, just with
# more patterns. Instead of adding yet another phrase, ambiguous messages get one quick
# classification call to the small local model (qwen2.5:0.5b, not whatever the user
# picked for the main answer) — semantic understanding generalizes to new phrasing in a
# way string matching never can, and a 0.5B model classifying one word is fast enough
# to not meaningfully slow down the response.
INTENT_CLASSIFIER_MODEL = "qwen2.5:0.5b"

INTENT_CLASSIFIER_PROMPT = (
    "Classify the LATEST user message into exactly one category. Reply with ONLY the "
    "category word — nothing else, no punctuation.\n\n"
    "GREETING - casual greeting, small talk, thanks, goodbye; not a real question\n"
    "FOLLOWUP - asking to reformat, shorten, elaborate, clarify, or restyle the "
    "assistant's OWN PREVIOUS reply in this conversation; not a new topic\n"
    "NEW_QUESTION - anything else: a genuine question or request needing real information\n\n"
    f'Message: "{{prompt}}"\n\n'
    "Category:"
)

async def classify_intent(prompt: str) -> str:
    try:
        response = await ollama_client.chat(
            model=INTENT_CLASSIFIER_MODEL,
            messages=[{"role": "user", "content": INTENT_CLASSIFIER_PROMPT.format(prompt=prompt)}],
            stream=False,
            options={"temperature": 0, "num_predict": 6}
        )
        label = response.get("message", {}).get("content", "").strip().upper()
        for category in ("GREETING", "FOLLOWUP", "NEW_QUESTION"):
            if category in label:
                return category
    except Exception as e:
        print(f"⚠️ Intent classifier unavailable, defaulting to full retrieval: {e}")
    return "NEW_QUESTION"

# Auto-title a brand-new chat from its first exchange, same idea as ChatGPT/Claude/Gemini —
# uses the same small/fast model as the intent classifier, not whatever the user picked
# for the actual answer, since this is just a short summarization task.
async def generate_chat_title(prompt: str, response_text: str) -> Optional[str]:
    try:
        response = await ollama_client.chat(
            model=INTENT_CLASSIFIER_MODEL,
            messages=[{
                "role": "user",
                "content": (
                    "Write a short chat title (3-6 words, no quotes, no trailing punctuation) "
                    "summarizing what this conversation is about. Reply with ONLY the title.\n\n"
                    f"User: {prompt[:300]}\n"
                    f"Assistant: {response_text[:300]}\n\n"
                    "Title:"
                )
            }],
            stream=False,
            options={"temperature": 0.3, "num_predict": 16}
        )
        title = response.get("message", {}).get("content", "").strip().strip('"').strip("'")
        return title[:80] if title else None
    except Exception as e:
        print(f"⚠️ Title generation failed: {e}")
        return None

# phi4-mini/qwen2.5 frequently emit invalid GFM table markdown (missing the
# "|---|---|" separator row, inconsistent column counts) unless shown the exact
# shape to copy — a plain instruction like "use a table" isn't enough.
TABLE_REQUEST_PHRASES = ["table format", "in a table", "as a table", "tabular", "table view", "markdown table"]

def wants_table_format(prompt: str) -> bool:
    lowered = prompt.lower()
    return any(phrase in lowered for phrase in TABLE_REQUEST_PHRASES)

TABLE_FORMAT_INSTRUCTIONS = (
    "\nThe user wants the answer as a Markdown table. Copy this STRUCTURE exactly (pipes, "
    "header row, separator row, same number of cells per row) — but every word below is a "
    "placeholder you MUST replace, including the header names themselves:\n\n"
    "| <descriptive header 1> | <descriptive header 2> |\n"
    "|-------------------------|-------------------------|\n"
    "| <real value>            | <real value>            |\n"
    "| <real value>            | <real value>            |\n\n"
    "Rules: replace EVERY placeholder — including the two header cells — with real words that "
    "answer the question; never output the literal text \"Column A\" or \"Column B\"; put all "
    "requested information into ONE single table, not several small ones; do not write "
    "explanatory text inside the table cells.\n"
)

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
async def chat_stream(payload: ChatRequest, authorization: Optional[str] = Header(default=None)):
    chat_id = payload.chat_id
    is_new_chat = not chat_id
    history: list[dict] = []

    if authorization:
        try:
            if not chat_id:
                created = await chat_service_request(
                    "POST", "/api/chats", authorization,
                    {"model": payload.model, "webSearchEnabled": payload.enable_web_search}
                )
                chat_id = created["_id"]
            else:
                raw_history = await chat_service_request(
                    "GET", f"/api/chats/{chat_id}/messages", authorization
                )
                history = raw_history[-HISTORY_WINDOW:]
        except Exception as e:
            print(f"⚠️ Chat memory service unavailable, continuing without persistence: {e}")

    async def event_generator():
        full_response = ""
        try:
            # A follow-up like "give me the above in a table" needs zero new context —
            # skip vector/graph/web retrieval entirely and just work from the history.
            # A plain greeting needs zero retrieval too, regardless of history.
            small_talk = is_small_talk(payload.prompt)
            fast_followup = bool(history) and is_followup_meta_request(payload.prompt)

            if small_talk or fast_followup:
                skip_retrieval = True
            else:
                # Neither fast check matched — ask the small classifier model rather
                # than adding yet another regex for phrasing we haven't seen before.
                intent = await classify_intent(payload.prompt)
                if intent == "GREETING":
                    small_talk = True
                    skip_retrieval = True
                elif intent == "FOLLOWUP" and bool(history):
                    skip_retrieval = True
                else:
                    skip_retrieval = False

            if skip_retrieval:
                if small_talk:
                    print(f"👋 Small talk detected — skipping RAG retrieval for: '{payload.prompt}'")
                else:
                    print(f"↩️ Follow-up/reformat request detected — skipping RAG retrieval for: '{payload.prompt}'")
                vector_context = graph_context = web_context = "(skipped — follow-up about the existing conversation, not a new topic)"
            else:
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
            if small_talk:
                system_prompt = (
                    "You are Nexus AI, a friendly expert software engineering assistant.\n\n"
                    "The user just sent a casual greeting or small talk — not a technical question. "
                    "Respond naturally and briefly. Do NOT bring up unrelated technologies, code "
                    "examples, or any retrieval context; none of it is relevant to this message.\n"
                )
            elif skip_retrieval:
                system_prompt = (
                    "You are Nexus AI, an expert software engineering assistant.\n\n"
                    "The user is asking you to reformat, summarize, or otherwise transform your "
                    "OWN PREVIOUS reply in this conversation — this is not a new factual question.\n\n"
                    "STRICT RESPONSE RULES:\n"
                    "1. Work ONLY from the conversation history above. Do NOT introduce any "
                    "technology, framework, or fact that wasn't already part of this conversation.\n"
                    "2. Provide production-ready, clean code blocks inside markdown when relevant.\n"
                )
            else:
                cors_rule = (
                    "2. When writing FastAPI CORS code, ALWAYS use standard `app.add_middleware(CORSMiddleware, ...)` syntax. "
                    "Never generate custom `@app.middleware('http')` handlers or mention Flask.\n"
                    if wants_cors_help(payload.prompt) else ""
                )
                system_prompt = (
                    "You are Nexus AI, an expert software engineering assistant.\n\n"
                    "STRICT RESPONSE RULES:\n"
                    "1. ALWAYS prioritize LIVE CRAWLED WEB CONTENT over internal training cutoff limits.\n"
                    f"{cors_rule}"
                    "3. Describe ONLY the technologies mentioned in the context below. Do NOT invent unrelated components like Cassandra, NIM, or JDO.\n"
                    "4. Provide production-ready, clean code blocks inside markdown.\n"
                    "5. The context blocks below were fetched automatically and may not actually be "
                    "relevant to this message — for example, if the user is asking you to elaborate, "
                    "clarify, or reformat something from earlier in THIS conversation rather than asking "
                    "a new factual question, or if this is just casual conversation. If that's the case, "
                    "IGNORE the context blocks below entirely and answer naturally instead.\n"
                    "6. If the LIVE CRAWLED WEB CONTENT below already contains the specific fact being "
                    "asked about (a current weather reading, price, score, date, version number, etc.), "
                    "STATE THAT FACT DIRECTLY. Do NOT say you cannot access real-time information or "
                    "recommend the user check another website — that content was already fetched live, "
                    "specifically to answer this question, so use it instead of refusing.\n\n"
                    f"--- 📄 VECTOR DATABASE CONTEXT (ChromaDB) ---\n{vector_context}\n\n"
                    f"--- 🕸️ KNOWLEDGE GRAPH CONTEXT (Neo4j) ---\n{graph_context}\n\n"
                    f"--- 🌐 LIVE CRAWLED WEB CONTENT ---\n{web_context}\n"
                    "-------------------------------------------\n"
                )

            if wants_table_format(payload.prompt):
                system_prompt += TABLE_FORMAT_INSTRUCTIONS

            # Step 5: Stream Tokens from Ollama — now with windowed conversation history
            ollama_messages = [{"role": "system", "content": system_prompt}]
            ollama_messages += [{"role": m["role"], "content": m["content"]} for m in history]
            ollama_messages.append({"role": "user", "content": payload.prompt})

            response_stream = await ollama_client.chat(
                model=payload.model,
                messages=ollama_messages,
                stream=True,
                options={
                    # NOTE: repeat_penalty 1.3 + temperature 0.3 was tried and made things
                    # WORSE — that combination distorts token probabilities away from
                    # anything recently said, and low temperature then commits hard to
                    # whatever's left, producing meaningless keyword-salad output. Back to
                    # Ollama's own defaults (repeat_penalty 1.1, repeat_last_n 64,
                    # temperature 0.8) plus only a generation-length cap as a backstop.
                    "repeat_last_n": 64,
                    "repeat_penalty": 1.1,
                    "num_predict": 1024
                }
            )

            async for chunk in response_stream:
                content = chunk.get('message', {}).get('content', '')
                if content:
                    full_response += content
                    yield content

        except Exception as e:
            yield f"\n[Stream Error: {str(e)}]"
        finally:
            if authorization and chat_id:
                try:
                    await chat_service_request(
                        "POST", f"/api/chats/{chat_id}/messages", authorization,
                        {"role": "user", "content": payload.prompt}
                    )
                    if full_response:
                        await chat_service_request(
                            "POST", f"/api/chats/{chat_id}/messages", authorization,
                            {"role": "assistant", "content": full_response}
                        )

                        if is_new_chat:
                            title = await generate_chat_title(payload.prompt, full_response)
                            if title:
                                await chat_service_request(
                                    "PATCH", f"/api/chats/{chat_id}", authorization, {"title": title}
                                )
                except Exception as e:
                    print(f"⚠️ Failed to persist chat history: {e}")

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
    }
    if chat_id:
        headers["X-Chat-Id"] = chat_id

    return StreamingResponse(event_generator(), media_type="text/event-stream", headers=headers)