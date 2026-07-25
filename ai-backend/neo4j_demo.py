import os
from neo4j import GraphDatabase

# Connection details (Defaults to local Docker or set env vars for AuraDB)
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password123")

def run_developer_graph_demo():
    print("🔌 Connecting to Neo4j Developer Graph...")
    
    with GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)) as driver:
        driver.verify_connectivity()
        print("✅ Connected successfully!\n")

        # -------------------------------------------------------------
        # STEP A: Create Developer Concepts & Relationships
        # -------------------------------------------------------------
        create_query = """
        // Create Framework / Tool Nodes
        MERGE (fastapi:Tech {id: "fastapi", name: "FastAPI", category: "Backend"})
        MERGE (pydantic:Tech {id: "pydantic", name: "Pydantic", category: "Data Validation"})
        MERGE (cors:Tech {id: "cors", name: "CORSMiddleware", category: "Security"})
        MERGE (react:Tech {id: "react", name: "React", category: "Frontend"})
        MERGE (ollama:Tech {id: "ollama", name: "Ollama", category: "AI Engine"})
        MERGE (sse:Tech {id: "sse", name: "Server-Sent Events (SSE)", category: "Streaming"})

        // Create Project Node
        MERGE (app:Project {id: "nexus_ai", name: "Nexus AI"})

        // Define Connections
        MERGE (app)-[:BUILT_WITH]->(fastapi)
        MERGE (app)-[:BUILT_WITH]->(react)
        MERGE (app)-[:INTEGRATES]->(ollama)
        MERGE (fastapi)-[:USES_FOR_VALIDATION]->(pydantic)
        MERGE (fastapi)-[:CONFIGURED_WITH]->(cors)
        MERGE (fastapi)-[:STREAMS_VIA]->(sse)
        """
        
        driver.execute_query(create_query)
        print("📌 Populated Developer Knowledge Graph Nodes & Connections!")

        # -------------------------------------------------------------
        # STEP B: Traverse Knowledge Graph for Context
        # Query: "What technologies does FastAPI depend on or use?"
        # -------------------------------------------------------------
        read_query = """
        MATCH (t:Tech {name: $tech_name})-[r]->(related:Tech)
        RETURN t.name AS core_tech, type(r) AS relationship, related.name AS connected_tech, related.category AS category
        """

        records, _, _ = driver.execute_query(
            read_query, 
            parameters_={"tech_name": "FastAPI"}
        )

        print(f"\n🔍 Traversal Query Results for 'FastAPI':")
        for record in records:
            print(f"   • {record['core_tech']} --[{record['relationship']}]--> {record['connected_tech']} ({record['category']})")

if __name__ == "__main__":
    try:
        run_developer_graph_demo()
    except Exception as e:
        print(f"❌ Neo4j Error: {e}")
        print("💡 Ensure Neo4j is running via Docker or your Aura Cloud URI is configured.")