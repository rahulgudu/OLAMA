# Nexus AI

A local-first GraphRAG developer assistant. Three retrieval sources (vector, graph, live web) are fused into a prompt and streamed from a local Ollama model to a React chat UI.

Current branch: `nexus_ai` (also see `neon4j`, `vectordb` on origin — earlier stages of the same build-out).

## Architecture (three services, run independently)

1. **`ai-backend/`** — Python/FastAPI. The GraphRAG brain.
   - `main.py` — FastAPI app; wires up ChromaDB, Neo4j, Ollama, and the chat/streaming endpoint. Pipeline per request: vector retrieval (ChromaDB) → graph traversal (`get_graph_context`, Neo4j) → optional live web search → context fusion → SSE token streaming via `ollama.AsyncClient`.
   - `knowledge_base.py` — seed documents for ChromaDB + `NEO4J_SEED_CYPHER` seed graph.
   - `web_crawler.py` — `search_and_crawl_web`: DuckDuckGo search (`duckduckgo_search`) + `httpx`/`BeautifulSoup4` page scraping, truncated per page for context budget.
   - `neo4j_demo.py` — standalone Neo4j/Cypher scratch script.
   - Config via env vars: `OLLAMA_HOST`, `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`.
   - Models available: `phi4-mini` (default/recommended), `qwen2.5:0.5b` (fast/light).
   - Has its own `venv/`.

2. **`backend/`** — Node.js/Express/TypeScript. **New** — not yet wired to the frontend or to `ai-backend`. Intended as the persistence/auth layer (Mongoose models exist for `User`, `Chat`, `Message`, incl. `passwordHash` and `JWT_SECRET`/`JWT_EXPIRES_IN` in `.env`, but no auth routes or chat/message routes are implemented yet — `server.ts` currently only connects Mongo and exposes a health-check root route).
   - `src/server.ts` — Express app entry, port from `PORT` env (default 4000).
   - `src/config/db.ts` — `connectDB()`, Mongoose → MongoDB, db name `"Nexus AI"`.
   - `src/models/{User,Chat,Message}.ts` — Chat references `userId`; Message references `chatId`; roles are `'user' | 'assistant'`.
   - Run with `npm run dev` (tsx watch).
   - Note: an older Python `backend/main.py` (61 lines) was replaced/moved — that logic now lives in `ai-backend/`.

3. **`client/`** — React 19 + Vite. Dark-terminal chat UI.
   - Talks directly to `ai-backend` today: `API_BASE_URL = "http://localhost:8000"` in `src/config/constants.js` (not yet pointed at the Node `backend/`).
   - Components: `Header`, `Sidebar`, `WelcomeScreen`, `ChatFeed`, `ChatMessage`, `ChatInput`, `ChatComposer`.
   - Uses `react-markdown` + `react-syntax-highlighter` for rendering assistant responses, `framer-motion` for UI motion.

## Where things stand (as of 2026-07-26)

- GraphRAG pipeline (ChromaDB + Neo4j + web search + Ollama streaming) is working end-to-end through `ai-backend` + `client`.
- The Node/Mongo `backend/` was just scaffolded (models + DB connection + bare Express app) to add persistent chat history and auth — this is in-progress groundwork, no routes/controllers yet, and the client doesn't call it.
- Working tree is clean; latest commit is "added the models" (`2e828c8`) on `nexus_ai`, in sync with `origin/nexus_ai`.

## Likely next steps (infer from the gap, confirm with user before assuming)

- Build Express routes/controllers for auth (issue/verify JWT against `User`) and for chat/message CRUD backed by the new Mongoose models.
- Decide how `backend/` (Mongo/auth/history) and `ai-backend` (GraphRAG/Ollama) relate — e.g. client calls Node `backend/` for auth+history and `ai-backend` for inference, or Node proxies to `ai-backend`.
- Update `client/src/config/constants.js` once the Node backend has a real base URL/port to call.
