
import os
import json
import chromadb
from openai import OpenAI
from typing import List, Dict, Tuple
from dotenv import load_dotenv

load_dotenv()

EMBED_MODEL = "text-embedding-3-small"
MEMORY_DIR = "memory"
COLLECTION_NAME = "curriculum"

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class RAGRetriever:
    def __init__(self):
        self.collection = None
        self.load_index()

    def load_index(self):
        """Load the ChromaDB collection if it exists"""
        try:
            from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
            
            embedding_function = OpenAIEmbeddingFunction(
                api_key=os.getenv("OPENAI_API_KEY"),
                model_name=EMBED_MODEL
            )
            
            chroma_client = chromadb.PersistentClient(path=MEMORY_DIR)
            self.collection = chroma_client.get_collection(
                name=COLLECTION_NAME,
                embedding_function=embedding_function
            )
            count = self.collection.count()
            print(f"Loaded RAG index with {count} items")
        except Exception as e:
            print(f"No RAG index found. Run rag_embeder.py to build index. Error: {e}")

    def embed_query(self, query: str) -> List[float]:
        """Embed a query using OpenAI's embedding model"""
        try:
            response = client.embeddings.create(model=EMBED_MODEL, input=[query])
            return response.data[0].embedding
        except Exception as e:
            print(f"Error embedding query: {e}")
            return []

    def search(self, query: str, top_k: int = 5, filters: Dict = None) -> List[Dict]:
        """Search for relevant documents"""
        if not self.collection:
            return []

        try:
            # Embed the query
            query_embedding = self.embed_query(query)
            if not query_embedding:
                return []

            # Build where clause for filtering
            where_clause = None
            if filters:
                where_clause = {}
                for key, value in filters.items():
                    if isinstance(value, list):
                        where_clause[key] = {"$in": [str(v) for v in value]}
                    else:
                        where_clause[key] = str(value)

            # Search the collection
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where_clause
            )

            # Format results
            formatted_results = []
            if results["documents"] and results["documents"][0]:
                for i, (doc, metadata, distance) in enumerate(zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0]
                )):
                    result = metadata.copy()
                    result["content"] = doc
                    result["similarity_score"] = 1 - distance  # Convert distance to similarity
                    formatted_results.append(result)

            return formatted_results

        except Exception as e:
            print(f"Error searching RAG index: {e}")
            return []

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
