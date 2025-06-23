"""
Sage - AI Tutor Agent for VerityOS Education System
Personalized tutoring across all subjects with Bahamian context
"""

import json
import random
from typing import Dict, List, Optional, Any
from datetime import datetime

from core.agent_base import BaseAgent
from core.memory_manager import MemoryManager
from core.rag_system import RAGSystem
from utils.bahamas_context import BahamasContext
from utils.safety_filters import SafetyFilter
from .prompts import SagePrompts

class SageAgent(BaseAgent):
    """Sage - The AI Tutor Agent"""
    
    def __init__(self, config_path: str = "agents/sage/config.yaml"):
        super().__init__(config_path)
        self.memory_manager = MemoryManager()
        self.rag_system = RAGSystem()
        self.bahamas_context = BahamasContext()
        self.safety_filter = SafetyFilter()
        self.prompts = SagePrompts()
        
        # Tutoring state
        self.current_subject = None
        self.current_topic = None
        self.student_level = "middle"
        self.learning_mode = "beginner"
        self.session_progress = {}
        
    def initialize_session(self, session_id: str, user_type: str = "student", **kwargs) -> None:
        """Initialize tutoring session"""
        super().initialize_session(session_id, user_type)
        
        # Load student progress if available
        if self.memory_enabled:
            saved_progress = self.memory_manager.load_memory("sage", session_id, "session")
            if saved_progress:
                self.session_progress = saved_progress.get("progress", {})
                self.student_level = saved_progress.get("level", "middle")
                self.current_subject = saved_progress.get("current_subject")
        
        # Set up based on kwargs
        self.student_level = kwargs.get("grade_level", self.student_level)
        self.current_subject = kwargs.get("subject", self.current_subject)
        
    def process_message(self, message: str, **kwargs) -> str:
        """Process student message and provide tutoring response"""
        print(f"[DEBUG] Received message: {message}")
        try:
            # Validate input safety
            is_safe, safety_message = self.safety_filter.validate_student_input(message)
            if not is_safe:
                return f"🤔 {safety_message} Let's keep our focus on learning! How can I help you with your studies today?"
            
            # Add to context
            self.add_to_context(message, "user")
            
            # Determine intent and respond appropriately
            intent = self._analyze_intent(message)
            print(f"[DEBUG] Intent identified: {intent}")
            response = self._generate_response(message, intent, **kwargs)
            print(f"[DEBUG] Raw response: {response}")
            
            # Apply safety filtering
            safe_response, issues = self.safety_filter.filter_content(
                response, self.safety_level, self.student_level
            )
            
            # Add Bahamian context
            contextualized_response = self.bahamas_context.format_bahamian_response(
                safe_response, self.user_type
            )
            print(f"[DEBUG] Final contextualized response: {contextualized_response}")
            
            # Save progress
            self._update_progress(intent, message)
            print(f"[DEBUG] Progress updated: {self.session_progress}")
            
            # Add to context
            self.add_to_context(contextualized_response, "assistant")
            
            return contextualized_response
            
        except Exception as e:
            return f"I'm having a small technical issue, but I'm here to help! Could you please ask your question again? 🤔"
    
    def _analyze_intent(self, message: str) -> str:
        """Analyze student message to determine tutoring intent"""
        message_lower = message.lower()

        # Question asking patterns
        if any(phrase in message_lower for phrase in ["ask me", "quiz me", "test me", "question"]):
            return "generate_quiz"

        # Explanation requests
        if any(phrase in message_lower for phrase in ["explain", "what is", "how does", "why", "help me understand"]):
            return "explain_concept"

        # Practice requests
        if any(phrase in message_lower for phrase in ["practice", "problems", "exercises", "homework"]):
            return "practice_problems"

        # Study guidance
        if any(phrase in message_lower for phrase in ["study", "prepare", "exam", "test", "tips"]):
            return "study_guidance"

        # Checking work
        if any(phrase in message_lower for phrase in ["check", "correct", "right", "wrong", "answer"]):
            return "check_work"

        # Slower explanation
        if any(phrase in message_lower for phrase in ["slower", "simpler", "don't understand", "confused"]):
            return "simplify_explanation"

        # Greetings
        if any(phrase in message_lower for phrase in ["hello", "hi", "hey", "good morning", "good afternoon"]):
            return "greeting"

        # Identity / capability queries
        if any(phrase in message_lower for phrase in ["who are you", "what is your name", "what can you do"]):
            return "identity"

        # General conversation
        return "general_tutoring"
    
    def _generate_response(self, message: str, intent: str, **kwargs) -> str:
        """Generate appropriate tutoring response based on intent"""

        if intent == "greeting":
            return "Hello there! 👋 I'm Sage, your VerityOS tutor. Ready to dive into learning?"
        elif intent == "identity":
            return "I'm Sage, the AI tutor agent built to help students in The Bahamas succeed in their studies!"
        if intent == "generate_quiz":
            return self._generate_quiz(message, **kwargs)
        elif intent == "explain_concept":
            return self._explain_concept(message, **kwargs)
        elif intent == "practice_problems":
            return self._generate_practice(message, **kwargs)
        elif intent == "study_guidance":
            return self._provide_study_tips(message, **kwargs)
        elif intent == "check_work":
            return self._check_understanding(message, **kwargs)
        elif intent == "simplify_explanation":
            return self._simplify_explanation(message, **kwargs)
        else:
            return self._general_tutoring_response(message, **kwargs)
    
    def _generate_quiz(self, message: str, **kwargs) -> str:
        """Generate a quiz for the student"""
        topic = kwargs.get("topic", self._extract_topic(message))
        subject = kwargs.get("subject", self.current_subject or "general")
        num_questions = kwargs.get("num_questions", 3)
        
        # Get relevant context
        context = self.rag_system.get_context_for_agent("sage", topic)
        subject_example = self.bahamas_context.get_subject_example(subject, self.student_level)
        
        quiz_response = f"""📝 **Quiz Time!** Let's test your knowledge on {topic}!\n\n"""
        
        # Generate questions based on subject and level
        questions = self._create_quiz_questions(topic, subject, num_questions)
        
        for i, question in enumerate(questions, 1):
            quiz_response += f"**Question {i}:** {question}\n\n"
        
        quiz_response += "Take your time and do your best! I'll help you review the answers when you're ready. 🇧🇸"
        
        return quiz_response
    
    def _explain_concept(self, message: str, **kwargs) -> str:
        """Explain a concept clearly with local context"""
        topic = kwargs.get("topic", self._extract_topic(message))
        subject = kwargs.get("subject", self.current_subject or "general")
        
        # Get relevant knowledge
        context = self.rag_system.get_context_for_agent("sage", topic)
        local_example = self.bahamas_context.get_subject_example(subject, self.student_level)
        
        explanation = f"""🎓 Let me explain **{topic}** for you!\n\n"""
        
        # Basic explanation
        explanation += self._get_concept_explanation(topic, subject)
        
        # Add local example
        if local_example:
            explanation += f"\n\n🇧🇸 **Here's a Bahamian example:**\n{local_example}\n"
        
        # Add context note if available
        cultural_note = self.bahamas_context.get_cultural_context_note(topic)
        if cultural_note:
            explanation += f"\n{cultural_note}\n"
        
        # Check understanding
        explanation += f"\n❓ Does this make sense so far? Would you like me to explain any part differently?"
        
        return explanation
    
    def _generate_practice(self, message: str, **kwargs) -> str:
        """Generate practice problems"""
        topic = kwargs.get("topic", self._extract_topic(message))
        subject = kwargs.get("subject", self.current_subject or "math")
        num_problems = kwargs.get("num_problems", 3)
        
        practice_response = f"""✏️ **Practice Time!** Here are some problems on {topic}:\n\n"""
        
        problems = self._create_practice_problems(topic, subject, num_problems)
        
        for i, problem in enumerate(problems, 1):
            practice_response += f"**Problem {i}:** {problem}\n\n"
        
        practice_response += "Work through these at your own pace. I'm here if you need help! 💪"
        
        return practice_response
    
    def _provide_study_tips(self, message: str, **kwargs) -> str:
        """Provide study guidance and tips"""
        topic = kwargs.get("topic", self._extract_topic(message))
        subject = kwargs.get("subject", self.current_subject or "general")
        
        tips_response = f"""📚 **Study Tips for {topic}:**\n\n"""
        
        # General study strategies
        tips = [
            "🔄 **Review regularly** - A little bit each day is better than cramming",
            "📝 **Take notes** - Write down key points in your own words",
            "🗣️ **Explain to others** - Teach a friend or family member",
            "❓ **Ask questions** - Don't be afraid to seek help when confused",
            "🎯 **Practice actively** - Do problems, don't just read"
        ]
        
        # Add subject-specific tips
        subject_tips = self._get_subject_specific_tips(subject)
        tips.extend(subject_tips)
        
        for tip in tips:
            tips_response += f"{tip}\n\n"
        
        # Local resources
        tips_response += "🇧🇸 **Local Resources:**\n"
        resources = self.bahamas_context.get_local_resources()
        tips_response += f"• Visit your local library or {resources['libraries'][0]}\n"
        tips_response += f"• Form study groups with classmates\n"
        tips_response += f"• Ask your teachers for extra help\n\n"
        
        tips_response += "You've got this! Consistent effort leads to success! 🌟"
        
        return tips_response
    
    def _check_understanding(self, message: str, **kwargs) -> str:
        """Check and provide feedback on student work"""
        student_work = kwargs.get("work", message)
        topic = kwargs.get("topic", self.current_topic or "the concept")
        
        # Analyze the student's response (simplified)
        feedback = f"""👀 **Let me check your work on {topic}:**\n\n"""
        
        # Provide encouraging feedback
        feedback += "✅ **What you did well:**\n"
        feedback += "• You showed your thinking process\n"
        feedback += "• You attempted the problem\n"
        feedback += "• You're engaging with the material\n\n"
        
        # Gentle corrections (this would be more sophisticated in practice)
        feedback += "💡 **Areas to improve:**\n"
        feedback += "• Let's double-check this step together\n"
        feedback += "• Consider this alternative approach\n\n"
        
        feedback += "🎯 **Next steps:**\n"
        feedback += "Try practicing similar problems to strengthen your understanding.\n\n"
        
        feedback += random.choice(self.prompts.ENCOURAGEMENT_PHRASES)
        
        return feedback
    
    def _simplify_explanation(self, message: str, **kwargs) -> str:
        """Provide a simpler explanation"""
        topic = kwargs.get("topic", self._extract_topic(message))
        
        simple_response = f"""🤔 No worries! Let me break down {topic} in simpler terms:\n\n"""
        
        # Provide step-by-step breakdown
        simple_response += "📋 **Step by Step:**\n\n"
        simple_response += "1️⃣ First, let's understand the basics...\n"
        simple_response += "2️⃣ Then, we'll see how it works...\n"
        simple_response += "3️⃣ Finally, we'll practice with an example...\n\n"
        
        # Use analogy
        simple_response += "🔍 **Think of it like this:**\n"
        simple_response += "Imagine you're explaining this to a younger sibling or friend.\n\n"
        
        simple_response += "Remember: There's no rush! Learning takes time, and everyone goes at their own pace. 🌱"
        
        return simple_response
    
    def _general_tutoring_response(self, message: str, **kwargs) -> str:
        """General tutoring conversation"""
        greeting = self.bahamas_context.get_cultural_greeting()
        
        response = f"{greeting}! I'm Sage, your AI tutor, and I'm here to help you learn! 🎓\n\n"
        response += "I can help you with:\n"
        response += "• 📝 Explaining concepts in any subject\n"
        response += "• ❓ Creating quizzes to test your knowledge\n"
        response += "• 💪 Generating practice problems\n"
        response += "• 📚 Providing study tips and strategies\n"
        response += "• ✅ Checking your work and giving feedback\n\n"
        
        response += "What subject would you like to work on today? Math, Science, English, Social Studies, or something else?\n\n"
        response += "🇧🇸 I'll make sure to use examples from our beautiful Bahamas to make learning more meaningful!"
        
        return response
    
    # Helper methods
    def _extract_topic(self, message: str) -> str:
        """Extract topic from student message"""
        # Simplified topic extraction
        words = message.lower().split()
        
        # Look for subject keywords
        subjects = {
            "math": ["math", "mathematics", "algebra", "geometry", "arithmetic"],
            "science": ["science", "biology", "chemistry", "physics"],
            "english": ["english", "grammar", "writing", "reading"],
            "history": ["history", "historical", "past"],
            "geography": ["geography", "map", "location", "countries"]
        }
        
        for subject, keywords in subjects.items():
            for keyword in keywords:
                if keyword in words:
                    self.current_subject = subject
                    return keyword
        
        # Default
        return "this topic"
    
    def _create_quiz_questions(self, topic: str, subject: str, num_questions: int) -> List[str]:
        """Create quiz questions for the topic"""
        # Simplified question generation
        questions = []
        
        if subject == "math":
            questions = [
                f"What is 25 + 37? (Show your work)",
                f"If you have 100 BSD and spend 35 BSD at Solomon's, how much do you have left?",
                f"A conch salad costs 8 BSD. How much would 3 conch salads cost?"
            ]
        elif subject == "science":
            questions = [
                f"What type of ecosystem are the coral reefs around the Bahamas?",
                f"During which months is hurricane season in the Caribbean?",
                f"What is the main gas that fish extract from water to breathe?"
            ]
        elif subject == "history":
            questions = [
                f"In what year did the Bahamas gain independence?",
                f"Who were the original inhabitants of the Bahamas?",
                f"What is the significance of July 10th in Bahamian history?"
            ]
        else:
            questions = [
                f"Can you explain the main idea about {topic}?",
                f"Give an example of {topic} in everyday life.",
                f"Why is {topic} important to understand?"
            ]
        
        return questions[:num_questions]
    
    def _create_practice_problems(self, topic: str, subject: str, num_problems: int) -> List[str]:
        """Create practice problems"""
        problems = []
        
        if subject == "math":
            problems = [
                "Calculate: 156 + 287 - 91",
                "A Family Island ferry ticket costs 45 BSD. If 23 people buy tickets, what's the total revenue?",
                "Convert 2.5 hours to minutes."
            ]
        elif subject == "science":
            problems = [
                "List three ways coral reefs benefit marine life in the Bahamas.",
                "Explain what happens to water when it reaches 100°C.",
                "Name the parts of a flowering plant and their functions."
            ]
        else:
            problems = [
                f"Write a short paragraph about {topic}.",
                f"Give three examples of {topic}.",
                f"Explain how {topic} affects daily life in the Bahamas."
            ]
        
        return problems[:num_problems]
    
    def _get_concept_explanation(self, topic: str, subject: str) -> str:
        """Get basic concept explanation"""
        # This would be more sophisticated with actual LLM integration
        explanations = {
            "addition": "Addition is combining numbers to find their total. When we add, we're putting groups together to see how many we have in all.",
            "photosynthesis": "Photosynthesis is how plants make their own food using sunlight, water, and carbon dioxide from the air.",
            "independence": "Independence means a country governs itself without being controlled by another country."
        }
        
        return explanations.get(topic.lower(), f"Let me explain {topic} in simple terms...")
    
    def _get_subject_specific_tips(self, subject: str) -> List[str]:
        """Get study tips specific to subject"""
        tips = {
            "math": [
                "🔢 **Practice daily** - Math builds on previous concepts",
                "✏️ **Show your work** - This helps you catch mistakes"
            ],
            "science": [
                "🔬 **Observe the world** - Science is everywhere in the Bahamas!",
                "📊 **Use diagrams** - Draw pictures to understand concepts"
            ],
            "english": [
                "📖 **Read daily** - Try The Tribune or Nassau Guardian",
                "✍️ **Write regularly** - Keep a journal about your day"
            ]
        }
        
        return tips.get(subject.lower(), ["📚 **Stay curious** - Ask questions about everything!"])
    
    def _update_progress(self, intent: str, message: str) -> None:
        """Update student progress tracking"""
        if not self.memory_enabled:
            return
        
        progress_update = {
            "timestamp": datetime.now().isoformat(),
            "intent": intent,
            "subject": self.current_subject,
            "topic": self.current_topic,
            "interaction_count": self.session_progress.get("interaction_count", 0) + 1
        }
        
        self.session_progress.update(progress_update)
        
        # Save to memory
        session_data = {
            "progress": self.session_progress,
            "level": self.student_level,
            "current_subject": self.current_subject
        }
        
        self.memory_manager.save_memory("sage", self.session_id, session_data, "session")
    
    def get_capabilities(self) -> List[str]:
        """Return Sage's tutoring capabilities"""
        return [
            "Explain concepts across all subjects",
            "Generate quizzes and practice problems", 
            "Provide study tips and strategies",
            "Check student work and give feedback",
            "Adapt explanations to student level",
            "Use Bahamian context and examples",
            "Track learning progress",
            "Encourage and motivate students"
        ]


# Flask integration: callable entrypoint for SageAgent
def run_agent(message: str, payload: dict = None) -> str:
    agent = SageAgent()
    agent.initialize_session(session_id="default-session")
    payload = payload or {}
    payload.pop("message", None)
    return agent.process_message(message, **payload)