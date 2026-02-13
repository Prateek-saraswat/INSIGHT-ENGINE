import httpx
from bs4 import BeautifulSoup
from typing import List, Dict
from ..models.schemas import Citation
from datetime import datetime
import asyncio
import re
from urllib.parse import urlparse, unquote


def extract_duckduckgo_url(ddg_url: str) -> str:
    """Extract the actual URL from DuckDuckGo redirect URL format"""
    # DuckDuckGo format: //duckduckgo.com/l/?uddg=ACTUAL_URL
    if ddg_url.startswith('//'):
        ddg_url = 'https:' + ddg_url
    
    # Extract the redirect URL
    if 'uddg=' in ddg_url:
        match = re.search(r'uddg=([^&]+)', ddg_url)
        if match:
            url = unquote(match.group(1))
            # Ensure protocol
            if not url.startswith('http://') and not url.startswith('https://'):
                url = 'https://' + url
            return url
    
    # Ensure protocol for any other URL
    if not ddg_url.startswith('http://') and not ddg_url.startswith('https://'):
        ddg_url = 'https://' + ddg_url
    
    return ddg_url


class WebResearchService:
    """Service for performing web research and extracting information"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    async def search_duckduckgo(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
        """
        Search using DuckDuckGo HTML (simplified version)
        In production, consider using official search APIs
        """
        results = []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"https://html.duckduckgo.com/html/?q={query}",
                    headers=self.headers,
                    follow_redirects=True
                )
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    result_divs = soup.find_all('div', class_='result__body', limit=max_results)
                    
                    for div in result_divs:
                        title_elem = div.find('a', class_='result__a')
                        snippet_elem = div.find('a', class_='result__snippet')
                        
                        if title_elem and snippet_elem:
                            raw_url = title_elem.get('href', '')
                            actual_url = extract_duckduckgo_url(raw_url)
                            
                            results.append({
                                'title': title_elem.get_text(strip=True),
                                'url': actual_url,
                                'snippet': snippet_elem.get_text(strip=True)
                            })
        except Exception as e:
            print(f"Search error: {e}")
        
        return results
    
    async def extract_content(self, url: str) -> str:
        """Extract main content from a webpage"""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, headers=self.headers, follow_redirects=True)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Remove script and style elements
                    for script in soup(["script", "style", "nav", "footer", "header"]):
                        script.decompose()
                    
                    # Get text
                    text = soup.get_text()
                    
                    # Clean up whitespace
                    lines = (line.strip() for line in text.splitlines())
                    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                    text = ' '.join(chunk for chunk in chunks if chunk)
                    
                    return text[:3000]  # Limit content length
        except Exception as e:
            print(f"Content extraction error for {url}: {e}")
        
        return ""
    
    async def research_topic(self, query: str, num_sources: int = 3) -> List[Citation]:
        """Research a topic and return citations with content"""
        search_results = await self.search_duckduckgo(query, max_results=num_sources)
        citations = []
        
        for result in search_results:
            content = await self.extract_content(result['url'])
            
            citation = Citation(
                title=result['title'],
                url=result['url'],
                excerpt=result['snippet'] + (f" ...{content[:500]}" if content else ""),
                accessed_at=datetime.utcnow()
            )
            citations.append(citation)
            
            # Rate limiting
            await asyncio.sleep(1)
        
        return citations
