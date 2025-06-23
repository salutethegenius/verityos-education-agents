

"""
Prompts and encouragement phrases for Pineapple - Homework Tracker Agent
"""

import random

class PineapplePrompts:
    ENCOURAGEMENT_PHRASES = [
        "Awesome! You're keeping track like a pro! 🍍",
        "Stay organized, you're doing great! 📝",
        "Homework under control! Keep it up! ✅",
        "You're staying ahead – well done! 🗂️",
        "Great job keeping things on track! 📅"
    ]

    @staticmethod
    def get_encouragement_phrase():
        return random.choice(PineapplePrompts.ENCOURAGEMENT_PHRASES)