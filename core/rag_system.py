"""
RAG (Retrieval-Augmented Generation) System for VerityOS
Provides context-aware responses using local knowledge base
"""

import json
import os
from typing import Any, Dict, List, Optional, Tuple
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class RAGSystem:
    """Simple RAG system using local knowledge base"""
    
    def __init__(self, knowledge_base_path: str = "data/bahamas_context.json"):
        self.knowledge_base_path = knowledge_base_path
        self.knowledge_base = self._load_knowledge_base()
        self.context_cache = {}
        
    def _load_knowledge_base(self) -> Dict:
        """Load local knowledge base"""
        try:
            if os.path.exists(self.knowledge_base_path):
                with open(self.knowledge_base_path, 'r') as f:
                    return json.load(f)
            else:
                logger.warning(f"Knowledge base not found at {self.knowledge_base_path}")
                return self._create_default_knowledge_base()
        except Exception as e:
            logger.error(f"Failed to load knowledge base: {e}")
            return self._create_default_knowledge_base()
    
    def _create_default_knowledge_base(self) -> Dict:
        """Create default Bahamas knowledge base"""
        return {
            "geography": {
                "location": "Caribbean archipelago",
                "capital": "Nassau",
                "islands": ["New Providence", "Grand Bahama", "Abaco", "Eleuthera", "Andros"],
                "total_islands": "700+ islands and cays"
            },
            "history": {
                "independence": "July 10, 1973",
                "colonial_history": "British colony until independence",
                "indigenous_people": "Lucayan Taíno people",
                "important_dates": {
                    "1492": "Christopher Columbus first landing",
                    "1973": "Independence from Britain"
                }
            },
            "education": {
                "system": "British-based education system",
                "grades": "Primary (K-6), Junior High (7-9), Senior High (10-12)",
                "subjects": ["Mathematics", "English Language", "Science", "Social Studies", "Spanish"],
                "exams": ["BJC (Bahamas Junior Certificate)", "BGCSE (Bahamas General Certificate)"]
            },
            "culture": {
                "language": "English (official), Bahamian dialect",
                "religion": "Predominantly Christian",
                "festivals": ["Junkanoo", "Independence Day", "Emancipation Day"],
                "music": ["Rake and scrape", "Calypso", "Reggae"]
            },
            "economy": {
                "currency": "Bahamian Dollar (BSD)",
                "main_industries": ["Tourism", "Banking", "Fishing", "Agriculture"],
                "major_exports": ["Pharmaceuticals", "Rum", "Salt", "Aragonite"]
            }
        }
    
    def search_knowledge(self, query: str, category: str = None) -> List[Dict]:
        """Search knowledge base for relevant information"""
        try:
            query_lower = query.lower()
            results = []
            
            search_categories = [category] if category else self.knowledge_base.keys()
            
            for cat in search_categories:
                if cat in self.knowledge_base:
                    category_data = self.knowledge_base[cat]
                    
                    for key, value in category_data.items():
                        if self._is_relevant(query_lower, key, value):
                            results.append({
                                "category": cat,
                                "key": key,
                                "content": value,
                                "relevance_score": self._calculate_relevance(query_lower, key, value)
                            })
            
            # Sort by relevance score
            results.sort(key=lambda x: x["relevance_score"], reverse=True)
            return results[:5]  # Return top 5 results
            
        except Exception as e:
            logger.error(f"Failed to search knowledge base: {e}")
            return []
    
    def _is_relevant(self, query: str, key: str, value) -> bool:
        """Check if content is relevant to query"""
        search_text = f"{key} {str(value)}".lower()
        query_words = query.split()
        
        # Check if any query words appear in the content
        for word in query_words:
            if len(word) > 2 and word in search_text:
                return True
        return False
    
    def _calculate_relevance(self, query: str, key: str, value) -> float:
        """Calculate relevance score for content"""
        search_text = f"{key} {str(value)}".lower()
        query_words = query.split()
        
        score = 0
        for word in query_words:
            if len(word) > 2:
                count = search_text.count(word)
                score += count * (len(word) / 10)  # Longer words get higher score
        
        return score
    
    def get_context_for_agent(self, agent_name: str, query: str) -> str:
        """Get relevant context for specific agent"""
        try:
            # Agent-specific context mapping
            agent_contexts = {
                "sage": ["education", "history", "geography"],
                "quill": ["education"],
                "lucaya": ["history", "geography", "culture", "economy"],
                "echo": ["culture", "education"],
                "pineapple": ["education"]
            }
            
            relevant_categories = agent_contexts.get(agent_name.lower(), list(self.knowledge_base.keys()))
            context_parts = []
            
            for category in relevant_categories:
                results = self.search_knowledge(query, category)
                for result in results[:2]:  # Top 2 per category
                    context_parts.append(f"{result['category']}: {result['content']}")
            
            if context_parts:
                return "Relevant Bahamas context:\n" + "\n".join(context_parts)
            else:
                return "No specific local context found for this query."
                
        except Exception as e:
            logger.error(f"Failed to get context for agent: {e}")
            return ""
    
    def add_to_knowledge_base(self, category: str, key: str, value: Any) -> bool:
        """Add new information to knowledge base"""
        try:
            if category not in self.knowledge_base:
                self.knowledge_base[category] = {}
            
            self.knowledge_base[category][key] = value
            
            # Save updated knowledge base
            with open(self.knowledge_base_path, 'w') as f:
                json.dump(self.knowledge_base, f, indent=2)
            
            logger.info(f"Added to knowledge base: {category}/{key}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add to knowledge base: {e}")
            return False
    
    def get_educational_context(self, subject: str) -> str:
        """Get educational context for specific subject"""
        subject_contexts = {
            "math": "Bahamas uses the metric system alongside imperial measurements.",
            "science": "The Bahamas has unique marine ecosystems and coral reefs.",
            "history": "Focus on Bahamas history, independence, and cultural heritage.",
            "geography": "Archipelago nation with 700+ islands in the Caribbean.",
            "english": "Standard English with local Bahamian dialect influences.",
            "social_studies": "Caribbean culture, government structure, and society."
        }
        
        return subject_contexts.get(subject.lower(), "General Bahamian educational context.")