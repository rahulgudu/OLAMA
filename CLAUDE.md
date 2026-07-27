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

2. **`backend/`** — Node.js/Express/TypeScript + Mongoose (MongoDB Atlas). Persistence + auth layer. Fully implemented and manually verified via Postman/curl (register → login → create chat → add/get messages → rename → delete, plus 401 when unauthenticated); **still not called by `ai-backend` or `client/`** — both still operate exactly as if this service didn't exist.
   - `src/server.ts` — Express app entry, port from `PORT` env (default 4000). CORS + JSON body parsing, mounts `/api/auth` and `/api` (chats), `GET /` health check, then `connectDB()` before `listen()`.
   - `src/config/db.ts` — `connectDB()`, Mongoose → MongoDB Atlas (`MONGO_URI` in `.env` has no db name in the path), db name passed explicitly as `dbName: "Nexus-AI"`. (Mongo namespaces can't contain spaces — this was originally `"Nexus AI"` and broke every query with `InvalidNamespace`; fixed to the hyphenated form.)
   - `src/models/{User,Chat,Message}.ts` — `User` has `email`/`passwordHash`. `Chat` has `userId` (owner), `title`, `aimodel`, `webSearchEnabled`. `Message` has `chatId`, `role` (`'user' | 'assistant'`), `content`.
   - `src/utils/jwt.ts` — `signToken`/`verifyToken`, `JWT_SECRET`/`JWT_EXPIRES_IN` from `.env`.
   - `src/middleware/auth.middleware.ts` — `requireAuth` reads `Authorization: Bearer <token>`, verifies via `verifyToken`, sets `req.userId`. `src/types/express.d.ts` augments Express's `Request` with `userId?: string`.
   - `src/routes/auth.routes.ts` + `src/controllers/auth.controller.ts` — `POST /api/auth/register`, `POST /api/auth/login` (bcryptjs hash/compare), `GET /api/auth/me` (protected).
   - `src/routes/chat.routes.ts` + `src/controllers/chat.controller.ts` — all protected by `requireAuth`: `POST/GET /api/chats`, `GET/POST /api/chats/:chatId/messages`, `PATCH/DELETE /api/chats/:chatId`. Ownership enforced by scoping every query to `{ _id, userId: req.userId }`.
   - **Known bug, not yet fixed:** `createChat` destructures `model` from the request body and passes `{ model, ... }` to `Chat.create(...)`, but the schema field is `aimodel` — so the chosen model name is silently dropped and every chat falls back to the schema default (`phi4-mini`). Fix is either rename the schema field back to `model` (careful: colliding with Mongoose's built-in `Document.prototype.model` — must stay `aimodel`/`aiModel`, not `model`) or change the controller to map `model` → `aimodel` on write and back on read.
   - Run with `npm run dev` (tsx watch). Auth secrets and Atlas URI live in `backend/.env` (gitignored).
   - Note: an older Python `backend/main.py` (61 lines) was replaced/moved — that logic now lives in `ai-backend/`.

3. **`client/`** — React 19 + Vite. Dark-terminal chat UI.
   - Talks directly to `ai-backend` today: `API_BASE_URL = "http://localhost:8000"` in `src/config/constants.js` (not yet pointed at the Node `backend/`).
   - Components: `Header`, `Sidebar`, `WelcomeScreen`, `ChatFeed`, `ChatMessage`, `ChatInput`, `ChatComposer`.
   - Uses `react-markdown` + `react-syntax-highlighter` for rendering assistant responses, `framer-motion` for UI motion.

## Where things stand (as of 2026-07-27)

- GraphRAG pipeline (ChromaDB + Neo4j + web search + Ollama streaming) is working end-to-end through `ai-backend` + `client`, including a working typing-cursor/thinking-indicator UI and an animated welcome screen in `client/`.
- `backend/` (Node/Express/Mongoose/Atlas) has a fully working, individually-tested auth + chat/message CRUD API — but it is **completely disconnected** from the rest of the app. `client/` still talks only to `ai-backend` at `http://localhost:8000`; `ai-backend` has no concept of users, chats, or `backend/`'s existence; there is no login screen anywhere. Building `backend/` was step 1 of a larger plan — the remaining steps are below, and this is the part a fresh session should pick up.
- Goal established with the user: (1) real multi-turn memory — today `ai-backend` sends Ollama only the single latest prompt, no prior turns, so even a live in-progress conversation has no memory; (2) persisted chat history via `backend/`, replacing the sidebar's hardcoded "Recent Chats" entry with real data.

## Next steps — resume here in order

1. **Fix the known `model`/`aimodel` bug** in `backend/src/controllers/chat.controller.ts::createChat` (see note above) — small, do it first so it's not forgotten once other pieces build on top of it.

2. **Add a login/register screen to `client/`.** New route/view shown when there's no stored JWT; calls `backend`'s `POST /api/auth/register` and `POST /api/auth/login`; stores the returned token (e.g. `localStorage`); `client/src/config/constants.js` needs a second base URL constant for `backend/` (currently only `API_BASE_URL` for `ai-backend` exists, e.g. `http://localhost:8000`) — add something like `CHAT_SERVICE_URL = "http://localhost:4000"`.

3. **Decide and implement how the JWT reaches `ai-backend`.** This is the crux of the whole integration and hasn't been decided yet: `backend/`'s chat routes are behind `requireAuth`, so once `ai-backend` needs to read/write chat history there, it needs a valid token too. Recommended approach (simplest, no service-to-service secret needed): the browser attaches its JWT as `Authorization: Bearer <token>` on every call to `ai-backend`'s `/api/chat/stream`; `ai-backend` just forwards that same header when it calls `backend/`'s endpoints server-to-server. `ai-backend` does not need its own login — it's just relaying a token it was already handed.

4. **Wire `ai-backend` for real multi-turn memory (the actual "context" fix).** In `ai-backend/main.py`'s `/api/chat/stream`, before calling Ollama:
   - Accept a `chat_id` field on `ChatRequest` (nullable — null means "new chat").
   - If `chat_id` is set, `GET backend:4000/api/chats/{chat_id}/messages` (forwarding the client's JWT per step 3) and window it (e.g. last 8–10 turns — phi4-mini/qwen2.5 have small context windows) into the Ollama `messages` array as `[system+RAG context] + [windowed history] + [new user prompt]`, replacing today's single-prompt-only payload.
   - If `chat_id` is null, first `POST backend:4000/api/chats` to create one, and return its id to the client (e.g. as a custom SSE event or response header) so the frontend can adopt it.
   - After the stream finishes, `POST` both the user's message and the completed assistant reply to `backend:4000/api/chats/{chat_id}/messages` so the record is complete for next time.

5. **Wire `client/`'s sidebar and app state to `backend/`.**
   - Sidebar's hardcoded "Recent Chats" entry → real list from `GET /api/chats`.
   - Clicking a chat → `GET /api/chats/:id/messages`, hydrate `messages` state, set `currentChatId` in `App.jsx`.
   - "New Chat" → clear state, unset `currentChatId` (the actual Mongo doc gets created lazily on first message per step 4).
   - Every send includes `currentChatId` (or `null`) in the request to `ai-backend`; adopt the id it returns for brand-new chats.

6. **Polish (do last):** auto-title chats from the first message, delete/rename affordances in the sidebar, graceful degradation in `ai-backend` if `backend/` is unreachable (chat should still work, just without persistence/memory, rather than hard-failing).
