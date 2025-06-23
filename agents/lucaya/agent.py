"""
Lucaya - Research Assistant Agent for VerityOS Education System
Helps students find, summarize, and cite information with Bahamian context
"""

from typing import Dict, List, Optional, Any
from datetime import datetime

from core.agent_base import BaseAgent
from core.memory_manager import MemoryManager
from core.rag_system import RAGSystem
from utils.bahamas_context import BahamasContext
from utils.safety_filters import SafetyFilter
from .prompts import LucayaPrompts

class LucayaAgent(BaseAgent):
    """Lucaya - The Research Assistant Agent"""

    def __init__(self, config_path: str = "agents/lucaya/config.yaml"):
        super().__init__(config_path)
        self.memory_manager = MemoryManager()
        self.rag_system = RAGSystem()
        self.bahamas_context = BahamasContext()
        self.safety_filter = SafetyFilter()
        self.prompts = LucayaPrompts()

    def initialize_session(self, session_id: str, user_type: str = "student", **kwargs) -> None:
        super().initialize_session(session_id, user_type)

    def process_research_query(self, query: str, subject: str, **kwargs) -> str:
        try:
            safe, safety_message = self.safety_filter.validate_student_input(query)
            if not safe:
                return f"🤔 {safety_message} Let's keep our research focused."

            self.add_to_context(query, "user")

            summary, sources = self._perform_research(query, subject)

            safe_summary, issues = self.safety_filter.filter_content(summary, self.safety_level)

            contextualized_summary = self.bahamas_context.format_bahamian_response(safe_summary, self.user_type)

            formatted_response = self._format_research_response(contextualized_summary, sources)

            self.add_to_context(formatted_response, "assistant")

            return formatted_response

        except Exception as e:
            return "I'm having a small issue finding information on this topic. Could you please try again? 🤔"

    def _perform_research(self, query: str, subject: str) -> (str, List[str]):
        summary = f"Here's a summary of '{query}' in the context of {subject}."
        sources = ["Source 1", "Source 2", "Source 3"]
        return summary, sources

    def _format_research_response(self, summary: str, sources: List[str]) -> str:
        response = f"🔍 **Research Summary:**\n{summary}\n\n📚 **Sources:**\n"
        for source in sources:
            response += f"• {source}\n"
        response += self.prompts.get_encouragement_phrase()
        return response

    def get_capabilities(self) -> List[str]:
        return [
            "Summarize and provide credible sources",
            "Generate research outlines",
            "Check source credibility",
            "Suggest related topics",
            "Explain difficult concepts clearly"
        ]

    def process_message(self, message: str) -> str:
        """Handles direct student prompts by routing them as research queries."""
        return self.process_research_query(message, subject="General")

def run_agent(message: str, payload: Optional[Dict[str, Any]] = None) -> str:
    agent = LucayaAgent()
    session_id = payload.get("session_id", "default-session") if payload else "default-session"
    user_type = payload.get("user_type", "student") if payload else "student"
    subject = payload.get("subject", "General") if payload else "General"
    agent.initialize_session(session_id=session_id, user_type=user_type)
    return agent.process_research_query(message, subject=subject)