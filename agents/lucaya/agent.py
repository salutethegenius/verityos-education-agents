
"""
Lucaya - Research Assistant Agent for VerityOS Education System
Helps students find, summarize, and cite information with Bahamian context
"""

import os
import re
import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from openai import OpenAI

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

        # Initialize OpenAI client
        self.openai_client = None
        if os.getenv('OPENAI_API_KEY'):
            self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

        # Research state
        self.current_research_topic = None
        self.research_history = []
        self.source_credibility_checks = {}
        self.student_level = "middle"

    def initialize_session(self, session_id: str, user_type: str = "student", **kwargs) -> None:
        """Initialize research session"""
        super().initialize_session(session_id, user_type)
        
        # Load research history if available
        if self.memory_enabled:
            saved_data = self.memory_manager.load_memory("lucaya", session_id, "session")
            if saved_data and isinstance(saved_data, dict):
                self.research_history = saved_data.get("research_history", [])
                self.student_level = saved_data.get("level", "middle")

    def process_research_query(self, query: str, subject: str = "General", **kwargs) -> str:
        """Process a research query with comprehensive analysis"""
        try:
            # Safety validation
            safe, safety_message = self.safety_filter.validate_student_input(query)
            if not safe:
                return f"🤔 {safety_message} Let's keep our research focused on educational topics."

            self.add_to_context(query, "user")

            # Identify research intent
            research_intent = self._identify_research_intent(query)
            print(f"[DEBUG] Research intent: {research_intent}")

            # Route to appropriate research method
            if research_intent == "fact_finding":
                response = self._handle_fact_finding(query, subject)
            elif research_intent == "source_evaluation":
                response = self._handle_source_evaluation(query)
            elif research_intent == "research_outline":
                response = self._handle_research_outline(query, subject)
            elif research_intent == "citation_help":
                response = self._handle_citation_help(query)
            elif research_intent == "topic_exploration":
                response = self._handle_topic_exploration(query, subject)
            else:
                response = self._handle_general_research(query, subject)

            # Add Bahamian context and ensure educational focus
            contextualized_response = self.bahamas_context.format_bahamian_response(response, self.user_type)

            # Save to memory and update research history
            self._update_research_history(query, research_intent, subject)
            self.add_to_context(contextualized_response, "assistant")

            return contextualized_response

        except Exception as e:
            print(f"[ERROR] Research processing failed: {e}")
            return "I'm having a small issue with that research request. Could you please try again or rephrase your question? 🔍"

    def _identify_research_intent(self, query: str) -> str:
        """Identify the type of research request"""
        query_lower = query.lower()
        
        if any(phrase in query_lower for phrase in ["outline", "structure", "organize", "plan research"]):
            return "research_outline"
        elif any(phrase in query_lower for phrase in ["cite", "citation", "reference", "bibliography"]):
            return "citation_help"
        elif any(phrase in query_lower for phrase in ["reliable", "credible", "trustworthy", "source quality"]):
            return "source_evaluation"
        elif any(phrase in query_lower for phrase in ["explore", "learn about", "tell me about", "research"]):
            return "topic_exploration"
        elif any(phrase in query_lower for phrase in ["what", "when", "where", "who", "how", "why"]):
            return "fact_finding"
        else:
            return "general_research"

    def _handle_fact_finding(self, query: str, subject: str) -> str:
        """Handle factual research queries"""
        if not self.openai_client:
            return self._handle_basic_research(query, subject)

        try:
            system_prompt = f"""You are Lucaya, a research assistant for Bahamian students. Provide accurate, well-researched answers with:

1. Clear, factual information
2. Bahamian context when relevant
3. Age-appropriate explanations for {self.student_level} school students
4. Credible sources mentioned
5. Encouraging research tone

Focus on: {subject}
Student level: {self.student_level}"""

            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Research question: {query}"}
                ],
                max_tokens=500,
                temperature=0.7
            )

            raw_response = response.choices[0].message.content
            print(f"[DEBUG] Raw fact-finding response: {raw_response}")

            # Format with research structure
            formatted_response = f"🔍 **Research Findings:**\n\n{raw_response}\n\n📚 {self.prompts.get_research_tip()}"
            
            return formatted_response

        except Exception as e:
            print(f"[ERROR] OpenAI fact-finding failed: {e}")
            return self._handle_basic_research(query, subject)

    def _handle_research_outline(self, query: str, subject: str) -> str:
        """Generate research outlines and study plans"""
        if not self.openai_client:
            return self._generate_basic_outline(query, subject)

        try:
            system_prompt = f"""You are Lucaya, helping Bahamian students create research outlines. Create a structured research plan with:

1. Main research question
2. 3-5 key subtopics to explore
3. Suggested sources (academic, local Bahamian sources when relevant)
4. Research methods appropriate for {self.student_level} students
5. Timeline suggestions

Subject: {subject}
Student level: {self.student_level}
Make it practical for Bahamian educational context."""

            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Help me create a research outline for: {query}"}
                ],
                max_tokens=600,
                temperature=0.6
            )

            raw_response = response.choices[0].message.content
            print(f"[DEBUG] Research outline response: {raw_response}")

            formatted_response = f"📋 **Research Outline:**\n\n{raw_response}\n\n🎯 {self.prompts.get_research_tip()}"
            
            return formatted_response

        except Exception as e:
            print(f"[ERROR] OpenAI outline generation failed: {e}")
            return self._generate_basic_outline(query, subject)

    def _handle_source_evaluation(self, query: str) -> str:
        """Help students evaluate source credibility"""
        tips = [
            "🔍 **Evaluating Sources:**",
            "• **Check the author** - Look for credentials and expertise",
            "• **Verify the date** - Make sure information is current",
            "• **Cross-reference** - Compare with other reliable sources",
            "• **Look for bias** - Consider the source's perspective",
            "• **Check citations** - Good sources cite their information",
            "",
            "**Reliable Sources for Bahamian Students:**",
            "• Bahamas National Archives",
            "• University of the Bahamas library",
            "• Government of the Bahamas websites (.gov.bs)",
            "• Academic journals and encyclopedias",
            "• Established news organizations",
            "",
            f"🌟 {self.prompts.get_research_tip()}"
        ]
        
        return "\n".join(tips)

    def _handle_citation_help(self, query: str) -> str:
        """Help with citations and referencing"""
        citation_guide = [
            "📝 **Citation Help for Bahamian Students:**",
            "",
            "**Book Citation:**",
            "Author, A. A. (Year). *Title of book*. Publisher.",
            "",
            "**Website Citation:**",
            "Author, A. A. (Year, Month Day). Title of webpage. *Website Name*. URL",
            "",
            "**Bahamian Government Source:**",
            "Government of The Bahamas. (Year). *Document Title*. Ministry Name.",
            "",
            "**Local Newspaper:**",
            "Author, A. A. (Year, Month Day). Article title. *The Tribune* or *The Nassau Guardian*.",
            "",
            "**Tips:**",
            "• Always cite your sources to avoid plagiarism",
            "• Keep track of sources as you research",
            "• Ask your teacher about preferred citation style",
            "",
            f"📚 {self.prompts.get_research_tip()}"
        ]
        
        return "\n".join(citation_guide)

    def _handle_topic_exploration(self, query: str, subject: str) -> str:
        """Explore topics with Bahamian context"""
        if not self.openai_client:
            return self._handle_basic_research(query, subject)

        try:
            system_prompt = f"""You are Lucaya, helping Bahamian students explore academic topics. Provide:

1. Overview of the topic
2. Key concepts to understand
3. Connections to Bahamian life/culture when relevant
4. Suggested areas for deeper research
5. Questions to consider

Subject: {subject}
Student level: {self.student_level}
Always maintain educational focus and Bahamian perspective."""

            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Help me explore this topic: {query}"}
                ],
                max_tokens=500,
                temperature=0.7
            )

            raw_response = response.choices[0].message.content
            print(f"[DEBUG] Topic exploration response: {raw_response}")

            formatted_response = f"🌟 **Topic Exploration:**\n\n{raw_response}\n\n🔍 {self.prompts.get_research_tip()}"
            
            return formatted_response

        except Exception as e:
            print(f"[ERROR] OpenAI topic exploration failed: {e}")
            return self._handle_basic_research(query, subject)

    def _handle_general_research(self, query: str, subject: str) -> str:
        """Handle general research requests"""
        return self._handle_fact_finding(query, subject)

    def _handle_basic_research(self, query: str, subject: str) -> str:
        """Fallback research method without OpenAI"""
        bahamian_examples = {
            "history": "Consider exploring Bahamian Archives, local museums, or interviewing community elders.",
            "science": "Look into marine biology research from the Bahamas, hurricane studies, or coral reef conservation.",
            "geography": "Study the unique geography of our 700+ islands and their formation.",
            "culture": "Research Junkanoo, local traditions, or Bahamian art and music."
        }
        
        context_tip = bahamian_examples.get(subject.lower(), "")
        
        response = [
            f"🔍 **Research Topic:** {query}",
            f"**Subject:** {subject}",
            "",
            "**Research Suggestions:**",
            "• Start with reliable sources like encyclopedias or academic websites",
            "• Look for multiple perspectives on your topic",
            "• Take notes and organize your findings",
            "• Check publication dates for current information",
            ""
        ]
        
        if context_tip:
            response.extend([f"**Bahamian Context:** {context_tip}", ""])
        
        response.append(f"📚 {self.prompts.get_research_tip()}")
        
        return "\n".join(response)

    def _generate_basic_outline(self, query: str, subject: str) -> str:
        """Generate basic research outline without OpenAI"""
        outline = [
            f"📋 **Research Outline: {query}**",
            f"**Subject:** {subject}",
            "",
            "**I. Introduction**",
            "   • Define key terms",
            "   • State research question",
            "",
            "**II. Background Information**",
            "   • Historical context",
            "   • Current understanding",
            "",
            "**III. Main Points** (3-5 key areas to explore)",
            "   • Point 1: [Your first main area]",
            "   • Point 2: [Your second main area]",
            "   • Point 3: [Your third main area]",
            "",
            "**IV. Bahamian Context** (if relevant)",
            "   • Local examples or applications",
            "   • Impact on Bahamian society",
            "",
            "**V. Conclusion**",
            "   • Summary of findings",
            "   • Further questions to explore",
            "",
            f"🎯 {self.prompts.get_research_tip()}"
        ]
        
        return "\n".join(outline)

    def _update_research_history(self, query: str, intent: str, subject: str) -> None:
        """Update student's research history"""
        research_entry = {
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "intent": intent,
            "subject": subject
        }
        
        self.research_history.append(research_entry)
        
        # Keep only last 10 research entries
        if len(self.research_history) > 10:
            self.research_history = self.research_history[-10:]
        
        # Save to memory
        if self.memory_enabled:
            memory_data = {
                "research_history": self.research_history,
                "level": self.student_level,
                "last_updated": datetime.now().isoformat()
            }
            self.memory_manager.save_memory("lucaya", self.session_id, "session", memory_data)

    def get_capabilities(self) -> List[str]:
        return [
            "Find and summarize credible sources",
            "Generate research outlines and study plans",
            "Evaluate source credibility and reliability",
            "Provide citation guidance",
            "Explore topics with Bahamian context",
            "Organize research findings"
        ]

    def process_message(self, message: str) -> str:
        """Process direct student messages"""
        return self.process_research_query(message, subject="General")

def run_agent(message: str, payload: Optional[Dict[str, Any]] = None) -> str:
    """Main entry point for Lucaya agent"""
    agent = LucayaAgent()
    session_id = payload.get("session_id", "default-session") if payload else "default-session"
    user_type = payload.get("user_type", "student") if payload else "student"
    subject = payload.get("subject", "General") if payload else "General"
    
    agent.initialize_session(session_id=session_id, user_type=user_type)
    return agent.process_research_query(message, subject=subject)
