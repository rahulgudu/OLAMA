"""
Comprehensive Developer Knowledge Base for Nexus AI (GraphRAG)
Covers: MERN, Spring Boot, FastAPI, Golang, .NET, PHP, JavaScript, Python, Java, Databases, and DevOps.
"""

# =====================================================================
# 1. VECTOR DATABASE DOCUMENTS (For ChromaDB Semantic Search)
# =====================================================================
DEVELOPER_DOCUMENTS = [
    # --- FASTAPI & PYTHON ---
    {
        "id": "fastapi_pydantic",
        "text": "FastAPI relies on Pydantic models for request body validation and serialization. Pydantic automatically parses JSON, converts types, and raises 422 Unprocessable Entity HTTP errors when validation fails."
    },
    {
        "id": "fastapi_cors",
        "text": "In FastAPI, enable Cross-Origin Resource Sharing (CORS) using fastapi.middleware.cors.CORSMiddleware with app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])."
    },
    {
        "id": "fastapi_sse",
        "text": "FastAPI streams responses to clients using Server-Sent Events (SSE) via starlette.responses.StreamingResponse with media_type='text/event-stream'."
    },
    {
        "id": "python_asyncio",
        "text": "Python asyncio provides non-blocking concurrency using an event loop. Route handlers declared with async def yield execution on await commands."
    },

    # --- MERN (MONGODB, EXPRESS, REACT, NODE) & JAVASCRIPT ---
    {
        "id": "react_hooks",
        "text": "React uses functional components with hooks like useState for state management and useEffect for side effects such as data fetching or subscriptions."
    },
    {
        "id": "express_middleware",
        "text": "Express.js backends execute middleware functions sequentially in the request-response lifecycle using app.use((req, res, next) => next())."
    },
    {
        "id": "mongodb_mongoose",
        "text": "MongoDB is a NoSQL document database. Node.js applications use Mongoose ORM/ODM to define schemas and perform CRUD operations."
    },
    {
        "id": "js_async_await",
        "text": "JavaScript handles asynchronous operations using Promises and async/await syntax, preventing callback hell in Node.js and browser environments."
    },

    # --- JAVA & SPRING BOOT ---
    {
        "id": "spring_boot_annotations",
        "text": "Spring Boot simplifies Java enterprise application development using annotations like @RestController, @Autowired, @Service, and @Repository for dependency injection."
    },
    {
        "id": "java_jvm",
        "text": "Java code compiles into bytecode (.class files) which runs on the Java Virtual Machine (JVM), enabling cross-platform portability."
    },

    # --- GOLANG ---
    {
        "id": "golang_goroutines",
        "text": "Golang achieves high concurrency using lightweight goroutines spawned with the 'go' keyword, communicating via typed Channels."
    },
    {
        "id": "golang_gin",
        "text": "Gin is a popular high-performance HTTP web framework written in Go, featuring fast routing, middleware support, and JSON validation."
    },

    # --- .NET & C# ---
    {
        "id": "dotnet_core",
        "text": ".NET Web APIs use C# with dependency injection, Entity Framework Core for ORM database mapping, and ASP.NET Core middleware pipelines."
    },

    # --- PHP ---
    {
        "id": "php_laravel",
        "text": "Laravel is a PHP web framework utilizing the MVC architectural pattern, Eloquent ORM, Blade templating, and Artisan CLI."
    },

    # --- DEVOPS & AI INFRASTRUCTURE ---
    {
        "id": "ollama_llm",
        "text": "Ollama runs open-source LLMs locally (e.g., Qwen2.5, Phi-4, Llama 3) and exposes an OpenAI-compatible REST API at port 11434."
    },
    {
        "id": "chromadb_vector",
        "text": "ChromaDB stores high-dimensional vector embeddings and metadata, executing cosine similarity search for Retrieval-Augmented Generation (RAG)."
    },
    {
        "id": "neo4j_graph",
        "text": "Neo4j stores data as Nodes and Relationships, queried using Cypher language to traverse multi-hop enterprise dependencies."
    }
]


# =====================================================================
# 2. KNOWLEDGE GRAPH SEED QUERY (For Neo4j Traversal)
# =====================================================================
NEO4J_SEED_CYPHER = """
// Framework Nodes
MERGE (fastapi:Tech {id: "fastapi", name: "FastAPI", category: "Backend Framework"})
MERGE (react:Tech {id: "react", name: "React", category: "Frontend UI Library"})
MERGE (express:Tech {id: "express", name: "Express.js", category: "Backend Framework"})
MERGE (spring:Tech {id: "spring", name: "Spring Boot", category: "Enterprise Framework"})
MERGE (gin:Tech {id: "gin", name: "Gin", category: "Go Framework"})
MERGE (dotnet:Tech {id: "dotnet", name: "ASP.NET Core", category: "Enterprise Framework"})
MERGE (laravel:Tech {id: "laravel", name: "Laravel", category: "PHP Framework"})

// Language Nodes
MERGE (py:Tech {id: "python", name: "Python", category: "Language"})
MERGE (js:Tech {id: "javascript", name: "JavaScript", category: "Language"})
MERGE (java:Tech {id: "java", name: "Java", category: "Language"})
MERGE (go:Tech {id: "golang", name: "Go (Golang)", category: "Language"})
MERGE (cs:Tech {id: "csharp", name: "C#", category: "Language"})
MERGE (php:Tech {id: "php", name: "PHP", category: "Language"})

// Tools / Libraries / Databases
MERGE (pydantic:Tech {id: "pydantic", name: "Pydantic", category: "Validation"})
MERGE (cors:Tech {id: "cors", name: "CORSMiddleware", category: "Security"})
MERGE (sse:Tech {id: "sse", name: "Server-Sent Events (SSE)", category: "Streaming"})
MERGE (mongoose:Tech {id: "mongoose", name: "Mongoose", category: "ORM/ODM"})
MERGE (mongo:Tech {id: "mongodb", name: "MongoDB", category: "Database"})
MERGE (chroma:Tech {id: "chromadb", name: "ChromaDB", category: "Vector Database"})
MERGE (neo4j:Tech {id: "neo4j", name: "Neo4j", category: "Graph Database"})
MERGE (ollama:Tech {id: "ollama", name: "Ollama", category: "AI Engine"})

// Language-Framework Relationships
MERGE (fastapi)-[:WRITTEN_IN]->(py)
MERGE (express)-[:WRITTEN_IN]->(js)
MERGE (react)-[:WRITTEN_IN]->(js)
MERGE (spring)-[:WRITTEN_IN]->(java)
MERGE (gin)-[:WRITTEN_IN]->(go)
MERGE (dotnet)-[:WRITTEN_IN]->(cs)
MERGE (laravel)-[:WRITTEN_IN]->(php)

// Feature & Dependency Relationships
MERGE (fastapi)-[:USES_FOR_VALIDATION]->(pydantic)
MERGE (fastapi)-[:CONFIGURED_WITH]->(cors)
MERGE (fastapi)-[:STREAMS_VIA]->(sse)
MERGE (express)-[:USES_DATABASE_VIA]->(mongoose)
MERGE (mongoose)-[:CONNECTS_TO]->(mongo)

// Application Connections
MERGE (app:Project {id: "nexus_ai", name: "Nexus AI"})
MERGE (app)-[:BUILT_WITH]->(fastapi)
MERGE (app)-[:BUILT_WITH]->(react)
MERGE (app)-[:INTEGRATES]->(ollama)
MERGE (app)-[:RETRIEVES_FROM]->(chroma)
MERGE (app)-[:RETRIEVES_FROM]->(neo4j)
"""