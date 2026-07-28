import httpx
from bs4 import BeautifulSoup
from ddgs import DDGS
import asyncio
import re

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

async def fetch_page_content(url: str, client: httpx.AsyncClient) -> str:
    """
    Crawls a single URL and extracts clean readable text content.
    """
    try:
        response = await client.get(url, headers=HEADERS, timeout=5.0, follow_redirects=True)
        if response.status_code != 200:
            return ""

        # Parse HTML using BeautifulSoup
        soup = BeautifulSoup(response.text, "html.parser")

        # Remove clutter (scripts, styles, navbars, footers, ads)
        for element in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
            element.decompose()

        # Extract main text content
        text = soup.get_text(separator=" ")
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        clean_text = " ".join(chunk for chunk in chunks if chunk)

        # Truncate text to fit context window (max ~1000 characters per page)
        return clean_text[:1000]

    except Exception as e:
        print(f"⚠️ Failed to crawl {url}: {e}")
        return ""

async def search_and_crawl_web(query: str, max_results: int = 3) -> str:
    """
    1. Searches DuckDuckGo for top URLs matching the query.
    2. Crawls each URL concurrently to retrieve full web content.
    3. Returns clean formatted web context string with citations.
    """
    print(f"🌐 Initiating Web Search & Crawl for query: '{query}'...")
    
    search_results = []
    try:
        # Step 1: Perform DuckDuckGo Search
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            for r in results:
                search_results.append({
                    "title": r.get("title", "Untitled"),
                    "url": r.get("href", ""),
                    "snippet": r.get("body", "")
                })
    except Exception as e:
        print(f"⚠️ Search error: {e}")
        return "Web search currently unavailable."

    if not search_results:
        return "No relevant web search results found."

    # Step 2: Crawl content from target URLs concurrently using HTTPX
    async with httpx.AsyncClient(verify=False) as client:
        tasks = [fetch_page_content(item["url"], client) for item in search_results]
        crawled_pages = await asyncio.gather(*tasks)

    # Step 3: Format crawled web context for LLM prompt
    formatted_context = []
    for idx, (result, content) in enumerate(zip(search_results, crawled_pages), start=1):
        page_text = content if content else result["snippet"]
        formatted_context.append(
            f"[{idx}] Source: {result['title']}\n"
            f"URL: {result['url']}\n"
            f"Content: {page_text}\n"
        )

    return "\n".join(formatted_context)