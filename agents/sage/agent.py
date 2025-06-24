"""
Sage - AI Tutor Agent for VerityOS Education System
Personalized tutoring across all subjects with Bahamian context
"""

import json
import random
from typing import Dict, List, Optional, Any
from datetime import datetime
import os
from openai import OpenAI

from core.agent_base import BaseAgent
from core.memory_manager import MemoryManager
from core.rag_system import RAGSystem
from utils.bahamas_context import BahamasContext
from utils.safety_filters import SafetyFilter
from .prompts import SagePrompts

# Adding OpenAI key for a more natural flow while maintaining the Bahamas context.
class SageAgent(BaseAgent):
    """Sage - The AI Tutor Agent"""

    def __init__(self, config_path: str = "agents/sage/config.yaml"):
        super().__init__(config_path)
        self.memory_manager = MemoryManager()
        self.rag_system = RAGSystem()
        self.bahamas_context = BahamasContext()
        self.safety_filter = SafetyFilter()
        self.prompts = SagePrompts()

        # Initialize OpenAI client
        self.openai_client = None
        if os.getenv('OPENAI_API_KEY'):
            self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

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
            # Check if this is a student user and apply limitations
            user_type = kwargs.get('user_type', 'teacher')
            if user_type == 'student':
                # Student-specific limitations
                if len(message) > 300:
                    return "📝 Please keep your questions shorter so I can help you better! Try asking one specific question at a time."
                
                # Block inappropriate content for students
                inappropriate_keywords = ['inappropriate', 'bad words', 'swear', 'curse']
                if any(word in message.lower() for word in inappropriate_keywords):
                    return "🤔 Let's keep our conversation focused on learning! What subject would you like help with today?"
                
                # Limit complex calculations that might be overwhelming
                if 'quantum' in message.lower() or ('×' in message and '999999' in message):
                    return "🧮 That's quite advanced! Let's focus on grade-level math problems that will help you learn step by step. What's a math topic you're working on in class?"

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
        """Generate contextual response based on intent"""

        # Use OpenAI for natural responses if available
        if self.openai_client:
            return self._generate_openai_response(message, intent, **kwargs)

        # Fallback to rule-based responses
        return self._generate_fallback_response(message, intent, **kwargs)

    def _generate_openai_response(self, message: str, intent: str, **kwargs) -> str:
        """Generate natural response using OpenAI with strong Bahamas context"""

        subject = kwargs.get("subject", self.current_subject or "general")
        # Get conversation context
        context_summary = self.get_context_summary()

        # Get Bahamian cultural context
        cultural_greeting = self.bahamas_context.get_cultural_greeting()
        local_expression = self.bahamas_context.get_local_expression()

        # Build system prompt with strong Bahamas emphasis
        system_prompt = f"""You are Sage, an AI tutor for students in The Bahamas. You MUST:

1. ALWAYS maintain Bahamian context and perspective
2. Use examples from Bahamian life, culture, geography, and history
3. Reference Nassau, Freeport, Family Islands, Junkanoo, conch, hurricanes, tourism, etc.
4. Align with Bahamas Ministry of Education curriculum (BJC, BGCSE)
5. Be encouraging, friendly, and age-appropriate
6. Keep responses under 300 words
7. Use emojis sparingly but effectively

Subject focus: {subject or 'General'}
Student intent: {intent}

Previous conversation: {context_summary}

Bahamas context: The Bahamas has 700+ islands, Nassau is the capital, currency is BSD (Bahamian dollars), tropical climate, tourism-based economy, rich cultural heritage. Use local expressions like "{local_expression}" and greetings like "{cultural_greeting}" when appropriate."""

        user_prompt = f"Student message: {message}"

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=400,
                temperature=0.7
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            print(f"[ERROR] OpenAI API call failed: {e}")
            return self._generate_fallback_response(message, intent, **kwargs)

    def _generate_fallback_response(self, message: str, intent: str, **kwargs) -> str:
        """Fallback rule-based response generation"""

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
        """General tutoring conversation with context awareness"""

        # Check if this is a follow-up question
        if self.current_subject and self.current_topic:
            return f"I see you're asking about {message}. This connects to our {self.current_subject} discussion on {self.current_topic}. Let me help clarify this for you!\n\n" + self._explain_concept(message, **kwargs)

        # Check for common student expressions
        message_lower = message.lower()
        if any(phrase in message_lower for phrase in ["i don't understand", "confused", "help", "stuck"]):
            return "No worries at all! That's exactly what I'm here for. 😊 Let me help break this down step by step.\n\nWhat specific topic or concept would you like me to explain? I can make it as simple or detailed as you need."

        # Check for homework-related queries
        if any(phrase in message_lower for phrase in ["homework", "assignment", "project", "study for"]):
            return "Great! I love helping with schoolwork. 📚\n\nWhat subject is your homework in? I can:\n• Explain concepts you're struggling with\n• Help you practice problems\n• Give you study tips\n• Quiz you to check your understanding\n\nJust tell me what you're working on!"

        # Default greeting response
        greeting = self.bahamas_context.get_cultural_greeting()

        response = f"{greeting}! I'm Sage, your VerityOS tutor for students in The Bahamas! 🇧🇸\n\n"

        # Personalized based on time or interaction count
        interaction_count = self.session_progress.get("interaction_count", 0)
        if interaction_count > 5:
            response += "Welcome back! I see we've been learning together. "

        response += "I'm here to help you succeed in:\n"
        response += "• 🧮 **Mathematics** - From basic arithmetic to algebra\n"
        response += "• 🔬 **Science** - Biology, chemistry, physics, and environmental science\n"
        response += "• 📚 **History & Social Studies** - Bahamian and world history\n"
        response += "• 🌍 **Geography** - Our islands and the world around us\n"
        response += "• 📝 **English** - Reading, writing, and grammar\n\n"

        response += "💡 **What I can do:**\n"
        response += "• Explain concepts using Bahamian examples\n"
        response += "• Create practice problems and quizzes\n"
        response += "• Help with homework and assignments\n"
        response += "• Give study tips for BJC and BGCSE prep\n\n"

        response += "What would you like to learn about today? You can ask me anything like:\n"
        response += "• 'Explain fractions using Bahamian examples'\n"
        response += "• 'Quiz me on Bahamas history'\n"
        response += "• 'Help me with my math homework'\n"
        response += "• 'What is photosynthesis?'\n\n"

        response += "🌴 Let's make learning fun and meaningful!"

        return response

    # Helper methods
    def _extract_topic(self, message: str) -> str:
        """Extract topic from student message with better recognition"""
        message_lower = message.lower()
        words = message_lower.split()

        # Enhanced topic extraction with more specific patterns
        math_topics = {
            "addition": ["add", "addition", "plus", "sum"],
            "subtraction": ["subtract", "subtraction", "minus", "difference"],
            "multiplication": ["multiply", "multiplication", "times", "product"],
            "division": ["divide", "division", "quotient"],
            "fractions": ["fraction", "numerator", "denominator", "half", "quarter"],
            "percentages": ["percent", "percentage", "%"],
            "algebra": ["algebra", "equation", "variable", "solve for"],
            "geometry": ["geometry", "angle", "triangle", "circle", "area", "perimeter"]
        }

        science_topics = {
            "biology": ["biology", "life", "organism", "cell", "animal", "plant"],
            "chemistry": ["chemistry", "element", "compound", "reaction", "atom"],
            "physics": ["physics", "force", "energy", "motion", "gravity"],
            "ecology": ["ecosystem", "environment", "habitat", "coral", "reef"]
        }

        history_topics = {
            "independence": ["independence", "freedom", "colony", "1973"],
            "slavery": ["slavery", "emancipation", "plantation"],
            "pirates": ["pirate", "blackbeard", "buccaneer"],
            "lucayans": ["lucayan", "taino", "indigenous", "native"]
        }

        # Check for specific topics first
        all_topics = {**math_topics, **science_topics, **history_topics}

        for topic, keywords in all_topics.items():
            if any(keyword in message_lower for keyword in keywords):
                # Set subject based on topic
                if topic in math_topics:
                    self.current_subject = "math"
                elif topic in science_topics:
                    self.current_subject = "science"
                elif topic in history_topics:
                    self.current_subject = "history"

                self.current_topic = topic
                return topic

        # Look for question patterns
        if "capital" in message_lower and ("bahamas" in message_lower or "country" in message_lower):
            self.current_subject = "geography"
            self.current_topic = "bahamas_capital"
            return "bahamas_capital"

        if any(word in words for word in ["who", "what", "when", "where", "why", "how"]):
            # Extract the main subject of the question
            question_words = message_lower.replace("what is", "").replace("who is", "").replace("when did", "").strip()
            if question_words:
                self.current_topic = question_words.split()[0] if question_words.split() else "general"
                return self.current_topic

        # Default extraction
        return "this topic"

    def _create_quiz_questions(self, topic: str, subject: str, num_questions: int) -> List[str]:
        """Create topic-specific quiz questions with Bahamian context"""
        questions = []

        # Topic-specific question banks
        topic_questions = {
            "addition": [
                "If Cable Beach has 47 palm trees and Paradise Island has 29 palm trees, how many palm trees are there in total?",
                "A junkanoo group has 25 dancers and 18 musicians. How many performers are in the group altogether?",
                "You collect 36 conch shells on Monday and 42 on Tuesday. What's your total collection?"
            ],

            "subtraction": [
                "You have 85 BSD and buy school supplies for 47 BSD. How much money do you have left?",
                "A fishing boat caught 120 snappers but 35 were too small and released. How many snappers did they keep?",
                "Nassau has 274,400 people and Freeport has 46,994. How many more people live in Nassau?"
            ],

            "multiplication": [
                "If each Family Island ferry holds 150 passengers and 4 ferries leave today, how many passengers can travel?",
                "A Bahamian bakery makes 48 Johnny cakes per batch. How many cakes do they make in 6 batches?",
                "Junkanoo costumes need 12 feathers each. How many feathers are needed for 15 costumes?"
            ],

            "independence": [
                "On what date did The Bahamas gain independence from Britain?",
                "Who was the first Prime Minister of independent Bahamas?",
                "What is celebrated on July 10th each year in The Bahamas?",
                "How many years has The Bahamas been independent as of 2024?"
            ],

            "bahamas_capital": [
                "What is the capital city of The Bahamas?",
                "On which island is Nassau located?",
                "Nassau is the capital, but what is the second-largest city in The Bahamas?",
                "What body of water separates Nassau from Paradise Island?"
            ],

            "coral_reef": [
                "What type of marine ecosystem surrounds many Bahamian islands?",
                "Name two types of fish commonly found in Bahamian coral reefs.",
                "Why are coral reefs important for protecting our islands?",
                "What threatens coral reefs in The Bahamas?"
            ],

            "ecosystem": [
                "What is an ecosystem? Give a Bahamian example.",
                "How do mangroves help protect the Bahamian coastline?",
                "Name three animals that live in the pine forests of Abaco.",
                "What role do coral reefs play in the marine ecosystem?"
            ]
        }

        # Get topic-specific questions
        if topic in topic_questions:
            available_questions = topic_questions[topic]
            questions = available_questions[:num_questions]
        else:
            # Generate subject-based questions if no specific topic questions
            if subject == "math":
                questions = [
                    f"Solve this problem about {topic}: If you have 24 items and need to share them equally among 6 people, how many does each person get?",
                    f"A store in Nassau sells items related to {topic}. If each costs 15 BSD and you buy 4, what's the total cost?",
                    f"Create a word problem about {topic} using a Bahamian setting."
                ]
            elif subject == "science":
                questions = [
                    f"Explain how {topic} affects life in The Bahamas.",
                    f"Give an example of {topic} that you can observe in our islands.",
                    f"Why is understanding {topic} important for Bahamian students?"
                ]
            elif subject == "history":
                questions = [
                    f"How does {topic} relate to Bahamian history?",
                    f"What impact did {topic} have on the development of The Bahamas?",
                f"Name a historical figure from The Bahamas related to {topic}."
            ]
        else:
            # Default questions for other subjects
            questions = [
                f"Tell me about {topic}",
                f"How does {topic} relate to life in The Bahamas?",
                f"Give me an example of {topic}"
            ]

        return questions[:num_questions]
                    f"Can you connect {topic} to modern-day Bahamas?"
                ]
            else:
                questions = [
                    f"Explain the main concept of {topic}.",
                    f"Give a real-world example of {topic} from Bahamian life.",
                    f"Why is {topic} important to understand?"
                ]

        # Ensure we have enough questions
        while len(questions) < num_questions:
            questions.append(f"What is one important thing to remember about {topic}?")

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
        """Get comprehensive concept explanation with Bahamian context"""

        explanations = {
            # Math concepts
            "addition": "Addition is combining numbers to find their total. For example, if you have 5 conch shells and find 3 more on Cable Beach, you add them together: 5 + 3 = 8 shells total.",

            "subtraction": "Subtraction is taking away from a number to find the difference. If you had 12 BSD and spent 7 BSD on lunch at Arawak Cay, you subtract: 12 - 7 = 5 BSD left.",

            "multiplication": "Multiplication is repeated addition - adding the same number multiple times. If 4 students each bring 6 conch fritters to share, that's 4 × 6 = 24 fritters total.",

            "fractions": "A fraction represents part of a whole. If you cut a Bahamian Johnny cake into 8 pieces and eat 3, you ate 3/8 of the cake.",

            "percentages": "A percentage shows parts out of 100. If 75% of students at your school are from New Providence, that means 75 out of every 100 students are from there.",

            # Science concepts
            "photosynthesis": "Photosynthesis is how plants make food using sunlight, water, and carbon dioxide. The beautiful sea grape trees along our beaches use this process to grow and provide shade.",

            "ecosystem": "An ecosystem is all the living and non-living things in an area that work together. The Andros Barrier Reef is a perfect example - coral, fish, water, and sunlight all depend on each other.",

            "coral_reef": "Coral reefs are underwater structures made by tiny animals called coral polyps. The Bahamas has the third-largest barrier reef in the world, protecting our islands from storms and providing homes for fish.",

            # History concepts
            "independence": "Independence means a country governs itself without being controlled by another country. The Bahamas gained independence from Britain on July 10, 1973, becoming a free nation.",

            "bahamas_capital": "Nassau is the capital and largest city of The Bahamas, located on New Providence island. It's been our center of government, business, and culture since colonial times.",

            "lucayans": "The Lucayans were the indigenous Taíno people who first lived in The Bahamas. They were peaceful people who fished, farmed, and lived in harmony with the islands before Columbus arrived in 1492.",

            "slavery": "Slavery was a dark period when people were forced to work without pay. Many enslaved Africans were brought to The Bahamas to work on plantations. Emancipation Day (August 1st) celebrates the end of slavery in 1834.",

            # Geography concepts
            "archipelago": "An archipelago is a group of islands. The Bahamas is an archipelago of over 700 islands and cays, though only about 30 are inhabited.",

            "climate": "Climate is the typical weather patterns of a place over many years. The Bahamas has a tropical climate with warm temperatures year-round, wet summers, and dry winters."
        }

        topic_key = topic.lower().replace(" ", "_")
        explanation = explanations.get(topic_key)

        if explanation:
            return explanation

        # Generate contextual explanation for unknown topics
        if subject == "math":
            return f"Let me explain {topic} step by step using examples from our daily life in The Bahamas. Math helps us solve real problems like calculating distances between islands, managing money, or measuring ingredients for traditional recipes."
        elif subject == "science":
            return f"Science helps us understand {topic} and how it works in our world. In The Bahamas, we can see science everywhere - from our coral reefs to our weather patterns to the way our islands were formed."
        elif subject == "history":
            return f"Understanding {topic} helps us learn about our past and how it shaped The Bahamas today. Our history includes the indigenous Lucayans, European colonization, slavery, and our journey to independence."
        else:
            return f"Let me break down {topic} in simple terms that connect to your experience as a student in The Bahamas. Understanding this concept will help you in your studies and daily life."

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
def run_agent(message: str, payload: Optional[Dict[str, Any]] = None) -> str:
    """Main entry point for Sage agent with session management"""
    agent = SageAgent()

    # Initialize session if provided
    if payload:
        session_id = payload.get("session_id", "default-session")
        user_type = payload.get("user_type", "student")
        subject = payload.get("subject", "General")
        task = payload.get("task", "homework")

        # Initialize session
        agent.initialize_session(session_id, user_type)

        # Add user message to context
        agent.add_to_context(message, "user")

        # Process message
        response = agent.process_message(message, subject=subject, task=task)

        # Add agent response to context
        agent.add_to_context(response, "assistant")

        # Save conversation to memory
        if agent.memory_enabled:
            conversation_history = agent.context
            session_data = {
                "progress": agent.session_progress,
                "level": agent.student_level,
                "current_subject": agent.current_subject,
                "conversation_history": conversation_history
            }
            agent.memory_manager.save_memory("sage", session_id, session_data, "session")

        return response
    else:
        return agent.process_direct_message(message)