"""
Prompts and feedback phrases for Quill - Autograder Agent
"""

import random

class QuillPrompts:
    ENCOURAGEMENT_PHRASES = [
        "Great effort! Keep it up! 🌟",
        "You're on the right track! 🚀",
        "Awesome job, you're improving each time! 🎯",
        "Your hard work is paying off! 💪",
        "Fantastic progress! Keep going! 🌟"
    ]

    GRADE_TIER_COMMENTS = {
        "A": "Excellent work — you've met and exceeded expectations! 🎉",
        "B": "Good job — a few minor improvements needed! 👍",
        "C": "Fair effort — there's room to grow. Keep practicing! 📘",
        "D": "Needs work — focus on the areas marked in your feedback. 🛠️",
        "F": "Don't be discouraged — review the material and try again. 🙏"
    }

    @staticmethod
    def get_encouragement_phrase():
        return random.choice(QuillPrompts.ENCOURAGEMENT_PHRASES)

    @staticmethod
    def get_grade_comment(tier):
        return QuillPrompts.GRADE_TIER_COMMENTS.get(tier, "Keep working hard! 📚").GRADE_TIER_COMMENTS.get(tier.upper(), "")
