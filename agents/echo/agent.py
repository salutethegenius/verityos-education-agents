"""
Echo - Comprehension Coach Agent for VerityOS
Helps with reading, retention, and understanding
"""

import re
import random
from typing import Dict, List, Optional, Tuple, Any
from core.agent_base import BaseAgent
from core.memory_manager import MemoryManager
from utils.bahamas_context import BahamasContext
from utils.safety_filters import SafetyFilter

class EchoAgent(BaseAgent):
    """Comprehension Coach Agent - Reading and understanding support"""

    def __init__(self, config_path: str = "agents/echo/config.yaml"):
        super().__init__(config_path)
        self.memory_manager = MemoryManager()
        self.bahamas_context = BahamasContext()
        self.safety_filter = SafetyFilter()

        # Reading session state
        self.current_text = None
        self.current_level = "middle"
        self.vocabulary_list = []
        self.comprehension_questions = []
        self.reading_progress = {"paragraphs_read": 0, "questions_answered": 0}

        # Common word lists for vocabulary analysis
        self.common_words = self._load_common_words()

    def _load_common_words(self) -> Dict[str, List[str]]:
        """Load common words for different levels"""
        return {
            "elementary": [
                "the", "and", "a", "to", "said", "you", "he", "it", "his", "her",
                "in", "was", "one", "that", "had", "by", "word", "but", "not", "what",
                "all", "were", "they", "we", "when", "your", "can", "an", "each", "which"
            ],
            "middle": [
                "about", "would", "there", "each", "which", "she", "do", "how", "their",
                "if", "will", "up", "other", "about", "out", "many", "then", "them", "these",
                "so", "some", "her", "would", "make", "like", "into", "him", "has", "two"
            ],
            "high": [
                "through", "because", "before", "between", "important", "example", "different",
                "following", "without", "another", "together", "information", "development",
                "especially", "including", "beginning", "consider", "remember", "available"
            ]
        }

    def process_message(self, message: str, **kwargs) -> str:
        """Process reading comprehension queries"""
        print(f"[DEBUG] Echo received message: {message}")

        try:
            # Check if this is a student user and apply limitations
            user_type = kwargs.get('user_type', 'teacher')
            if user_type == 'student':
                # Student-specific reading limitations
                if len(message) > 500:
                    return "📚 That's quite long! Let's work with shorter passages so we can focus on understanding. Share a paragraph or two and I'll help you comprehend it better."

                # Ensure age-appropriate content
                if 'adult' in message.lower() or 'mature' in message.lower():
                    return "📚 Let's focus on grade-appropriate reading materials! What story or text are you working on in class?"

            # Validate input safety
            is_safe, safety_message = self.safety_filter.validate_student_input(message)
            if not is_safe:
                return f"📚 {safety_message} Let's focus on reading and comprehension! What would you like to read about?"

            # Add to context
            self.add_to_context(message, "user")

            # Determine intent
            intent = self._determine_intent(message, kwargs.get("text", None))

            # Process based on intent
            if intent == "analyze_text":
                response = self._analyze_text(kwargs.get("text", message), kwargs.get("reading_level", "middle"))
            elif intent == "vocabulary_breakdown":
                response = self._provide_vocabulary_breakdown(self.current_text or message, kwargs.get("reading_level", "middle"))
            elif intent == "create_questions":
                response = self._create_comprehension_questions(self.current_text or message, kwargs.get("reading_level", "middle"))
            elif intent == "rewrite_help":
                response = self._help_rewrite(self.current_text or message, kwargs.get("reading_level", "middle"))
            elif intent == "summary_request":
                response = self._create_summary(self.current_text or message, kwargs.get("reading_level", "middle"))
            else:
                response = self._general_comprehension_help(message, kwargs.get("reading_level", "middle"))

            # Add Bahamian context
            response = self.bahamas_context.format_bahamian_response(response, "student")

            # Add to context
            self.add_to_context(response, "assistant")

            return response

        except Exception as e:
            return f"I'm having trouble understanding that. Could you try asking in a different way? 🤔"

    def _determine_intent(self, message: str, text: Optional[str] = None) -> str:
        """Determine what the user wants to do"""
        message_lower = message.lower()

        if any(word in message_lower for word in ["vocabulary", "words", "meaning", "define"]):
            return "vocabulary_breakdown"
        elif any(word in message_lower for word in ["questions", "quiz", "test", "ask me"]):
            return "create_questions"
        elif any(word in message_lower for word in ["rewrite", "own words", "paraphrase", "rephrase"]):
            return "rewrite_help"
        elif any(word in message_lower for word in ["summary", "summarize", "main idea", "key points"]):
            return "summary_request"
        elif text or len(message) > 100:
            return "analyze_text"
        else:
            return "general_help"

    def _analyze_text(self, text: str, reading_level: str) -> str:
        """Analyze text for comprehension coaching"""
        self.current_text = text
        self.current_level = reading_level

        # Basic text analysis
        word_count = len(text.split())
        sentence_count = len([s for s in re.split(r'[.!?]+', text) if s.strip()])
        paragraph_count = len([p for p in text.split('\n\n') if p.strip()])

        # Difficulty assessment
        difficulty = self._assess_difficulty(text, reading_level)

        # Find challenging vocabulary
        challenging_words = self._find_challenging_words(text, reading_level)

        response = f"📖 **Text Analysis Complete!**\n\n"
        response += f"**Text Stats:**\n"
        response += f"• Words: {word_count}\n"
        response += f"• Sentences: {sentence_count}\n"
        response += f"• Paragraphs: {paragraph_count}\n"
        response += f"• Difficulty Level: {difficulty}\n\n"

        if challenging_words:
            response += f"**Challenging Words Found:**\n"
            for word in challenging_words[:5]:  # Show top 5
                response += f"• {word}\n"
            response += "\n"

        response += "**What would you like to do next?**\n"
        response += "• Ask me for vocabulary help\n"
        response += "• Create comprehension questions\n"
        response += "• Help rewrite in your own words\n"
        response += "• Make a summary"

        return response

    def _assess_difficulty(self, text: str, reading_level: str) -> str:
        """Assess text difficulty"""
        words = text.lower().split()
        common_word_list = self.common_words.get(reading_level, self.common_words["middle"])

        # Calculate percentage of common words
        common_count = sum(1 for word in words if any(common in word for common in common_word_list))
        common_percentage = (common_count / len(words)) * 100 if words else 0

        if common_percentage > 80:
            return "Easy"
        elif common_percentage > 60:
            return "Moderate"
        else:
            return "Challenging"

    def _find_challenging_words(self, text: str, reading_level: str) -> List[str]:
        """Find words that might be challenging for the reading level"""
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        common_word_list = self.common_words.get(reading_level, self.common_words["middle"])

        challenging = []
        for word in set(words):
            if len(word) > 3 and not any(common in word for common in common_word_list):
                challenging.append(word)

        return sorted(challenging, key=len, reverse=True)

    def _provide_vocabulary_breakdown(self, text: str, reading_level: str) -> str:
        """Provide vocabulary breakdown and definitions"""
        challenging_words = self._find_challenging_words(text, reading_level)

        if not challenging_words:
            return "Great! All the words in this text should be familiar to you. You're reading at a good level! 🌟"

        response = "📚 **Vocabulary Breakdown**\n\n"

        # Provide simple definitions for challenging words
        for word in challenging_words[:8]:  # Limit to 8 words
            definition = self._get_simple_definition(word, reading_level)
            response += f"**{word.title()}**: {definition}\n\n"

        if len(challenging_words) > 8:
            response += f"*...and {len(challenging_words) - 8} more words. Ask me about any specific word!*\n\n"

        response += "💡 **Study Tip**: Try using these words in your own sentences!"

        return response

    def _get_simple_definition(self, word: str, reading_level: str) -> str:
        """Get simple, age-appropriate definition"""
        # This is a simplified version - in practice, you'd use a dictionary API
        simple_definitions = {
            "elementary": {
                "important": "something that matters a lot",
                "different": "not the same as something else",
                "beautiful": "very pretty or nice to look at",
                "difficult": "hard to do or understand",
                "remember": "to think about something from before"
            },
            "middle": {
                "analyze": "to look at something carefully to understand it",
                "examine": "to look at something closely",
                "environment": "the world around us, including air, water, and land",
                "government": "the people who make rules for a country",
                "technology": "tools and machines that help us do things"
            },
            "high": {
                "sophisticated": "complex and advanced",
                "comprehensive": "including everything important",
                "beneficial": "helpful or good for you",
                "inevitable": "certain to happen",
                "substantial": "large or important in amount"
            }
        }

        level_definitions = simple_definitions.get(reading_level, simple_definitions["middle"])
        return level_definitions.get(word, f"a word meaning something related to {word}")

    def _create_comprehension_questions(self, text: str, reading_level: str) -> str:
        """Create comprehension questions based on the text"""
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]

        if len(sentences) < 2:
            return "I need a longer text to create good comprehension questions. Please share at least 2-3 sentences!"

        questions = []

        # Main idea question
        questions.append("What is the main idea of this text?")

        # Detail questions
        if len(sentences) >= 3:
            questions.append("What are two important details mentioned in the text?")

        # Vocabulary question
        challenging_words = self._find_challenging_words(text, reading_level)
        if challenging_words:
            word = challenging_words[0]
            questions.append(f"What do you think the word '{word}' means in this context?")

        # Inference question
        questions.append("Based on what you read, what can you conclude or figure out?")

        # Personal connection
        questions.append("How does this text connect to something you already know?")

        response = "❓ **Comprehension Questions**\n\n"
        for i, question in enumerate(questions, 1):
            response += f"{i}. {question}\n\n"

        response += "Take your time answering these questions. There's no rush! 📝"

        return response

    def _help_rewrite(self, text: str, reading_level: str) -> str:
        """Help student rewrite text in their own words"""
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]

        if not sentences:
            return "I need some text to help you rewrite. Please share what you'd like to put in your own words!"

        response = "✍️ **Rewriting Help**\n\n"
        response += "Here's how to put this in your own words:\n\n"

        response += "**Step 1**: What are the main points?\n"
        response += "• Think about the most important ideas\n"
        response += "• Don't worry about small details at first\n\n"

        response += "**Step 2**: Use your own words\n"
        response += "• Replace difficult words with easier ones you know\n"
        response += "• Change the sentence structure\n"
        response += "• Keep the same meaning\n\n"

        response += "**Step 3**: Check your work\n"
        response += "• Does it say the same thing as the original?\n"
        response += "• Does it sound like you wrote it?\n\n"

        # Provide a simple example
        if sentences:
            original = sentences[0]
            response += f"**Example:**\n"
            response += f"Original: {original}\n"
            response += f"Your version: [Try rewriting this sentence!]\n\n"

        response += "💡 **Tip**: Start with one sentence at a time!"

        return response

    def _create_summary(self, text: str, reading_level: str) -> str:
        """Help create a summary of the text"""
        word_count = len(text.split())

        if word_count < 50:
            return "This text is already quite short! Try summarizing longer passages for better practice."

        response = "📋 **Summary Helper**\n\n"
        response += "Let's create a summary together!\n\n"

        response += "**Summary Steps:**\n"
        response += "1. **Main Idea**: What is this text mostly about?\n"
        response += "2. **Key Points**: What are 2-3 most important details?\n"
        response += "3. **Conclusion**: How does it end or what's the result?\n\n"

        response += "**Summary Guidelines:**\n"
        response += f"• Original text: ~{word_count} words\n"
        response += f"• Your summary: aim for {max(20, word_count // 4)} words or less\n"
        response += "• Use your own words\n"
        response += "• Include only the most important information\n\n"

        response += "Try writing your summary, and I can help you improve it! ✨"

        return response

    def _general_comprehension_help(self, message: str, reading_level: str) -> str:
        """Provide general comprehension assistance"""
        response = f"{self.bahamas_context.get_cultural_greeting()}! I'm Echo, your comprehension coach. 📖\n\n"

        response += "I can help you with:\n\n"
        response += "📚 **Reading Analysis**: Share a paragraph and I'll break it down\n"
        response += "📝 **Vocabulary Help**: I'll explain difficult words\n"
        response += "❓ **Comprehension Questions**: I'll create questions to test understanding\n"
        response += "✍️ **Rewriting Practice**: Help put text in your own words\n"
        response += "📋 **Summary Creation**: Learn to summarize effectively\n\n"

        response += "Just share some text you're reading, or ask me for help with any of these skills!\n\n"
        response += "🇧🇸 I understand Bahamian context and can help with local reading materials too!"

        return response

    def get_capabilities(self) -> List[str]:
        """Return list of Echo's capabilities"""
        return [
            "Text analysis and difficulty assessment",
            "Vocabulary breakdown and definitions",
            "Comprehension question creation",
            "Rewriting assistance",
            "Summary creation help",
            "Reading level assessment",
            "Progress tracking"
        ]
def run_agent(message: str, payload: dict = None) -> str:
    print(f"[DEBUG] Incoming message to Echo: {message}")
    print(f"[DEBUG] Payload: {payload}")
    agent = EchoAgent()
    response = agent.process_message(message, **(payload or {}))
    print(f"[DEBUG] Echo raw response: {response}")
    return response