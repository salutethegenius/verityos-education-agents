"""
VerityOS Education Agents - Core Module
Sovereign AI Education Console for The Bahamas
"""

__version__ = "1.0.0"
__author__ = "VerityOS Team"

from .agent_base import BaseAgent
from .memory_manager import MemoryManager
from .rag_system import RAGSystem

__all__ = ["BaseAgent", "MemoryManager", "RAGSystem"]