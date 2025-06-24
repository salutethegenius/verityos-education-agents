
import os
import json
import numpy as np
import faiss
import openai
from typing import List, Dict, Tuple
from dotenv import load_dotenv

load_dotenv()

EMBED_MODEL = "text-embedding-3-small"
MEMORY_DIR = "memory"
INDEX_FILE = os.path.join(MEMORY_DIR, "curriculum_index.faiss")
META_FILE = os.path.join(MEMORY_DIR, "curriculum_metadata.jsonl")

openai.api_key = os.getenv("OPENAI_API_KEY")


class RAGRetriever:
    def __init__(self):
        self.index = None
        self.metadata = []
        self.load_index()

    def load_index(self):
        """Load the FAISS index and metadata if they exist"""
        try:
            if os.path.exists(INDEX_FILE) and os.path.exists(META_FILE):
                self.index = faiss.read_index(INDEX_FILE)
                
                with open(META_FILE, "r", encoding="utf-8") as f:
                    self.metadata = [json.loads(line) for line in f]
                
                print(f"Loaded RAG index with {len(self.metadata)} items")
            else:
                print("No RAG index found. Run rag_embeder.py to build index.")
        except Exception as e:
            print(f"Error loading RAG index: {e}")

    def embed_query(self, query: str) -> List[float]:
        """Embed a query using OpenAI's embedding model"""
        try:
            response = openai.embeddings.create(model=EMBED_MODEL, input=[query])
            return response.data[0].embedding
        except Exception as e:
            print(f"Error embedding query: {e}")
            return []

    def search(self, query: str, top_k: int = 5, filters: Dict = None) -> List[Dict]:
        """Search for relevant documents"""
        if not self.index or not self.metadata:
            return []

        try:
            # Embed the query
            query_embedding = self.embed_query(query)
            if not query_embedding:
                return []

            # Search the index
            query_vector = np.array([query_embedding]).astype('float32')
            distances, indices = self.index.search(query_vector, min(top_k * 2, len(self.metadata)))

            # Filter results
            results = []
            for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
                if idx >= len(self.metadata):
                    continue
                    
                metadata = self.metadata[idx].copy()
                metadata['similarity_score'] = 1 - (distance / 2)  # Convert L2 distance to similarity
                
                # Apply filters if provided
                if filters:
                    if not self._matches_filters(metadata, filters):
                        continue
                
                results.append(metadata)
                
                if len(results) >= top_k:
                    break

            return results

        except Exception as e:
            print(f"Error searching RAG index: {e}")
            return []

    def _matches_filters(self, metadata: Dict, filters: Dict) -> bool:
        """Check if metadata matches the provided filters"""
        for key, value in filters.items():
            if key in metadata:
                if isinstance(value, list):
                    if metadata[key] not in value:
                        return False
                else:
                    if metadata[key] != value:
                        return False
        return True

    def get_context_for_query(self, query: str, subject: str = None, grade: str = None, max_tokens: int = 2000) -> str:
        """Get relevant context for a query, formatted for LLM consumption"""
        filters = {}
        if subject:
            filters['subject'] = subject
        if grade:
            filters['grade'] = grade

        results = self.search(query, top_k=10, filters=filters)
        
        if not results:
            return ""

        context_parts = []
        total_tokens = 0
        
        for result in results:
            content = result.get('content', '')
            source = result.get('source', 'Unknown')
            score = result.get('similarity_score', 0)
            
            # Rough token estimation (4 chars per token)
            estimated_tokens = len(content) // 4
            
            if total_tokens + estimated_tokens > max_tokens:
                break
                
            context_parts.append({
                'content': content,
                'source': source,
                'score': score
            })
            
            total_tokens += estimated_tokens

        # Format context for LLM
        if not context_parts:
            return ""
            
        formatted_context = "Based on the Bahamas curriculum:\n\n"
        for i, part in enumerate(context_parts, 1):
            formatted_context += f"Context {i} (from {part['source']}):\n{part['content']}\n\n"
            
        return formatted_context
