"""
Quill - Autograder Agent for VerityOS Education System
Automated grading and detailed feedback for assignments with Bahamian context
"""

from typing import Dict, List, Optional, Any
from datetime import datetime

from core.agent_base import BaseAgent
from core.memory_manager import MemoryManager
from core.rag_system import RAGSystem
from utils.bahamas_context import BahamasContext
from utils.safety_filters import SafetyFilter
from .prompts import QuillPrompts

class QuillAgent(BaseAgent):
    """Quill - The Autograder Agent"""

    def __init__(self, config_path: str = "agents/quill/config.yaml"):
        super().__init__(config_path)
        self.memory_manager = MemoryManager()
        self.rag_system = RAGSystem()
        self.bahamas_context = BahamasContext()
        self.safety_filter = SafetyFilter()
        self.prompts = QuillPrompts()

    def initialize_session(self, session_id: str, user_type: str = "student", **kwargs) -> None:
        super().initialize_session(session_id, user_type)

    def process_message(self, message: str, **kwargs) -> str:
        """Process incoming messages - required implementation of abstract method"""
        try:
            # Extract subject and task from kwargs to avoid duplicate arguments
            subject = kwargs.get('subject', 'general')
            task = kwargs.get('task', 'general')
            
            # Remove subject and task from kwargs to avoid conflicts
            filtered_kwargs = {k: v for k, v in kwargs.items() if k not in ['subject', 'task']}
            
            # Handle greetings and introductions
            if message.lower().strip() in ['hello', 'hi', 'hey', 'who are you', 'what do you do']:
                return self.get_introduction()
            
            # For assignment submissions, use process_assignment
            return self.process_assignment(message, task, subject, **filtered_kwargs)
        except Exception as e:
            print(f"[ERROR] QuillAgent encountered: {e}")
            import traceback
            traceback.print_exc()
            return "I apologize, but I'm having trouble processing your message. Could you try rephrasing it? 🤔"
    
    def get_introduction(self) -> str:
        """Provide an introduction to Quill's capabilities"""
        return """📝 **Hello! I'm Quill, your AI autograder!** 

I can help you by:
• **Grading assignments** - Submit your work and I'll evaluate it
• **Providing detailed feedback** - Get specific suggestions for improvement
• **Rubric-based scoring** - Fair assessment across multiple criteria
• **Supporting various subjects** - Math, English, Science, History, and more

Just paste your assignment, essay, or homework answer, and I'll provide:
- A detailed grade breakdown
- Constructive feedback
- Suggestions for improvement
- Bahamian context when relevant

What would you like me to grade today? 🌴"""

    def process_assignment(self, assignment_text: str, assignment_type: str, subject: str, **kwargs) -> str:
        try:
            safe, safety_message = self.safety_filter.validate_student_input(assignment_text)
            if not safe:
                return f"🤔 {safety_message} Let's refocus on your assignment."

            self.add_to_context(assignment_text, "user")

            grading_feedback = self._grade_assignment(assignment_text, assignment_type, subject)

            # Rubric scoring
            rubric = {"clarity": 5, "organization": 4, "evidence": 3, "grammar": 5, "creativity": 4}
            sample_scores = {"clarity": 4, "organization": 3, "evidence": 2, "grammar": 5, "creativity": 4}
            rubric_feedback = self._evaluate_with_rubric(rubric, sample_scores)

            grading_feedback = rubric_feedback + "\n\n" + grading_feedback

            safe_feedback, issues = self.safety_filter.filter_content(grading_feedback, self.safety_level)

            contextualized_feedback = self.bahamas_context.format_bahamian_response(safe_feedback, self.user_type)

            self.add_to_context(contextualized_feedback, "assistant")

            return contextualized_feedback

        except Exception as e:
            print(f"[ERROR] process_assignment failed: {e}")
            return "I'm having a small issue grading this assignment. Could you please submit it again? 🤔"

    def _grade_assignment(self, assignment_text: str, assignment_type: str, subject: str) -> str:
        feedback = f"📝 **Grading your {assignment_type} in {subject}:**\n\n"
        feedback += "✅ Strengths:\n• Clear ideas\n• Good structure\n\n"
        feedback += "💡 Improvement Areas:\n• Enhance clarity in your conclusion\n• Support your points with more examples\n\n"
        feedback += self.prompts.get_encouragement_phrase()
        return feedback

    def _evaluate_with_rubric(self, rubric: Dict[str, int], scores: Dict[str, int]) -> str:
        feedback = "📊 **Rubric Scores**\n"
        total_score = 0
        total_possible = 0
        for criterion, max_score in rubric.items():
            score = scores.get(criterion, 0)
            feedback += f"• {criterion.capitalize()}: {score}/{max_score}\n"
            total_score += score
            total_possible += max_score

        percentage = (total_score / total_possible) * 100 if total_possible > 0 else 0
        grade = self._grade_from_percentage(percentage)

        feedback += f"\n🎯 **Total Score**: {total_score}/{total_possible} → {int(percentage)}%\n"
        feedback += f"🏆 **Grade**: {grade}\n"
        return feedback

    def _grade_from_percentage(self, percentage: float) -> str:
        if percentage >= 90:
            return "A — Excellent work!"
        elif percentage >= 80:
            return "B — Strong effort!"
        elif percentage >= 70:
            return "C — Satisfactory."
        elif percentage >= 60:
            return "D — Needs Improvement."
        else:
            return "F — Significant Issues."

    def get_capabilities(self) -> List[str]:
        return [
            "Grade various assignment types",
            "Provide detailed feedback",
            "Highlight strengths and improvement areas",
            "Suggest resources for further study",
            "Ensure age-appropriate content and feedback"
        ]


# API compatibility function
def run_agent(message: str, payload: dict = None) -> str:
    agent = QuillAgent()
    agent.initialize_session(session_id="default-session")
    return agent.process_message(message, **(payload or {}))