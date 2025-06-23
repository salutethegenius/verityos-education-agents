
"""
Prompts and research guidance for Lucaya - Research Assistant Agent
"""

import random

class LucayaPrompts:
    ENCOURAGEMENT_PHRASES = [
        "Great research skills! Keep exploring! 🔎",
        "Your curiosity leads to knowledge! 📚", 
        "Fantastic effort in seeking information! 🌟",
        "You're becoming a research pro! 🚀",
        "Keep up the excellent investigation! 🔍",
        "Knowledge is power - keep learning! 💪",
        "Every question leads to discovery! ✨",
        "Research makes you a better student! 📖"
    ]

    RESEARCH_TIPS = [
        "Remember to check multiple sources for accuracy! 📊",
        "Always note where you found your information! 📝",
        "Look for recent sources to get current information! 📅",
        "Consider both local and international perspectives! 🌍",
        "Ask yourself: Who wrote this and why? 🤔",
        "Cross-reference facts with other reliable sources! ✅",
        "Keep organized notes as you research! 📋",
        "Don't forget to cite your sources properly! 📚"
    ]

    BAHAMIAN_RESEARCH_SOURCES = [
        "📍 Try the Bahamas National Archives for historical research!",
        "📍 Check University of the Bahamas library resources!",
        "📍 Government of the Bahamas websites (.gov.bs) are reliable!",
        "📍 Local newspapers like The Tribune have valuable archives!",
        "📍 Contact local museums for specialized information!",
        "📍 Interview community elders for oral history projects!"
    ]

    @staticmethod
    def get_encouragement_phrase():
        return random.choice(LucayaPrompts.ENCOURAGEMENT_PHRASES)

    @staticmethod
    def get_research_tip():
        return random.choice(LucayaPrompts.RESEARCH_TIPS)

    @staticmethod
    def get_bahamian_source_tip():
        return random.choice(LucayaPrompts.BAHAMIAN_RESEARCH_SOURCES)

    @staticmethod
    def get_research_welcome():
        return "🔍 Hello! I'm Lucaya, your research assistant! I can help you find information, create outlines, evaluate sources, and cite your work properly. What would you like to research today?"

    @staticmethod
    def get_citation_reminder():
        return "💡 Remember: Good researchers always cite their sources! It shows respect for others' work and helps readers find more information."

    @staticmethod
    def get_critical_thinking_prompt():
        prompts = [
            "🤔 What questions does this information raise?",
            "🤔 How does this connect to what you already know?", 
            "🤔 What evidence supports this claim?",
            "🤔 Are there other perspectives to consider?",
            "🤔 How might this apply to life in the Bahamas?"
        ]
        return random.choice(prompts)
