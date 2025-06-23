"""
Prompts and encouragement phrases for Lucaya - Research Assistant Agent
"""

import random

class LucayaPrompts:
    ENCOURAGEMENT_PHRASES = [
        "Great research skills! Keep exploring! 🔎",
        "Your curiosity leads to knowledge! 📚",
        "Fantastic effort in seeking information! 🌟",
        "You're becoming a research pro! 🚀",
        "Keep up the excellent investigation! 🔍"
    ]

    @staticmethod
    def get_encouragement_phrase():
        return random.choice(LucayaPrompts.ENCOURAGEMENT_PHRASES)
