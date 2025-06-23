
"""
Prompts, encouragement phrases, and study tips for Pineapple - Homework Tracker Agent
Focused on Bahamian student motivation and academic success
"""

import random
import datetime

class PineapplePrompts:
    ENCOURAGEMENT_PHRASES = [
        "Awesome progress! You're staying organized like a true Bahamian scholar! 🍍",
        "Keep up the great work! Your future is as bright as our Bahamian sunshine! ☀️",
        "Excellent job tracking your assignments! Success is just around the corner! 📚",
        "You're doing amazing! Every completed task brings you closer to your goals! ✨",
        "Outstanding organization! You're building habits that will serve you well! 🎯",
        "Great work! Your dedication to your studies is truly inspiring! 🌟",
        "Fantastic progress! You're proving that hard work pays off! 💪",
        "Well done! Your commitment to excellence is showing! 🏆"
    ]

    DEADLINE_REMINDERS = [
        "🚨 Reminder: {assignment} is due {timeframe}! You've got this!",
        "⏰ Don't forget: {assignment} deadline is approaching ({timeframe}). Stay focused!",
        "📅 Heads up: {assignment} is due {timeframe}. Time to wrap it up!",
        "🔔 Assignment alert: {assignment} due {timeframe}. Final push time!",
        "⚡ Quick reminder: {assignment} deadline is {timeframe}. You're almost there!"
    ]

    COMPLETION_CELEBRATIONS = [
        "🎉 Assignment completed! You're on fire! Keep that momentum going!",
        "🌟 Another one done! Your dedication is paying off beautifully!",
        "✅ Task finished! You're building excellent study habits!",
        "🏆 Completed! Your teachers would be proud of your commitment!",
        "🎊 Well done! You're proving that consistency leads to success!",
        "💫 Assignment complete! Your future self will thank you!",
        "🙌 Fantastic work! You're showing true academic excellence!"
    ]

    STUDY_TIPS = [
        "🧠 **Active Reading**: Don't just read your notes - summarize them in your own words!",
        "⏱️ **Time Blocking**: Dedicate specific time slots to each subject for better focus.",
        "🌴 **Environment**: Find your perfect study spot - some prefer quiet, others need gentle background noise.",
        "📝 **Practice Tests**: Create your own quiz questions - teaching yourself is powerful learning!",
        "🤝 **Study Groups**: Connect with classmates - explaining concepts to others strengthens your understanding.",
        "💧 **Hydration Break**: Your brain needs water to function optimally - stay hydrated!",
        "😴 **Sleep Schedule**: Consistent sleep helps with memory consolidation and focus.",
        "🎯 **Goal Setting**: Break large projects into smaller, manageable milestones.",
        "📱 **Digital Detox**: Consider phone-free study sessions for deeper concentration.",
        "🏃‍♀️ **Movement Breaks**: Take short walks between study sessions - physical activity boosts mental clarity!"
    ]

    BAHAMIAN_MOTIVATIONAL_QUOTES = [
        "Like the resilient coral reefs of Andros, your knowledge grows stronger with each lesson learned! 🪸",
        "Just as our islands weathered countless storms, you can overcome any academic challenge! 🌊",
        "Channel the determination of our independence heroes - education is your path to freedom! 🇧🇸",
        "Like the steady trade winds, let consistency in your studies guide you to success! 💨",
        "Your potential shines brighter than the waters of Cable Beach - believe in yourself! ✨",
        "Like our proud flamingos standing tall, hold your head high as you tackle each assignment! 🦩",
        "With the spirit of Junkanoo, bring energy and passion to your learning journey! 🥁"
    ]

    SUBJECT_SPECIFIC_TIPS = {
        "mathematics": [
            "Practice problems daily - math skills build like muscle memory! 🧮",
            "Use Bahamian examples: Calculate distances between islands, currency conversions, or conch fritter costs! 🏝️",
            "Draw diagrams and visual aids - seeing the problem helps solve it! 📊"
        ],
        "english": [
            "Read diverse authors, including Caribbean writers like Derek Walcott! 📖",
            "Practice writing about Bahamian experiences - your unique perspective matters! ✍️",
            "Join discussions about literature - talking through ideas deepens understanding! 💬"
        ],
        "science": [
            "Connect lessons to our marine environment - we live in a natural laboratory! 🐠",
            "Conduct simple experiments at home with everyday materials! 🔬",
            "Observe nature around you - science is everywhere in The Bahamas! 🌿"
        ],
        "history": [
            "Interview family members about their experiences - living history is powerful! 👴👵",
            "Visit historical sites in Nassau or Freeport to see history come alive! 🏛️",
            "Create timelines connecting Bahamian events to world history! 📅"
        ]
    }

    @staticmethod
    def get_encouragement_phrase():
        """Get a random encouragement phrase"""
        return random.choice(PineapplePrompts.ENCOURAGEMENT_PHRASES)
    
    @staticmethod
    def get_deadline_reminder(assignment_name: str, timeframe: str):
        """Get a formatted deadline reminder"""
        template = random.choice(PineapplePrompts.DEADLINE_REMINDERS)
        return template.format(assignment=assignment_name, timeframe=timeframe)
    
    @staticmethod
    def get_completion_celebration():
        """Get a celebration message for completed assignments"""
        return random.choice(PineapplePrompts.COMPLETION_CELEBRATIONS)
    
    @staticmethod
    def get_study_tip():
        """Get a random study tip"""
        return random.choice(PineapplePrompts.STUDY_TIPS)
    
    @staticmethod
    def get_bahamian_motivation():
        """Get a Bahamian-themed motivational quote"""
        return random.choice(PineapplePrompts.BAHAMIAN_MOTIVATIONAL_QUOTES)
    
    @staticmethod
    def get_subject_tip(subject: str):
        """Get a subject-specific study tip"""
        subject_lower = subject.lower()
        for key in PineapplePrompts.SUBJECT_SPECIFIC_TIPS:
            if key in subject_lower:
                return random.choice(PineapplePrompts.SUBJECT_SPECIFIC_TIPS[key])
        
        # Default tip if subject not found
        return PineapplePrompts.get_study_tip()
    
    @staticmethod
    def get_daily_motivation():
        """Get motivation based on day of week"""
        today = datetime.datetime.now().strftime("%A")
        
        daily_messages = {
            "Monday": "🌅 Fresh week, fresh opportunities! Let's make this Monday productive!",
            "Tuesday": "💪 Tuesday energy! You're building momentum - keep it going!",
            "Wednesday": "🐪 Hump day hustle! You're halfway through - finish strong!",
            "Thursday": "⚡ Thursday thunder! Push through - the weekend is almost here!",
            "Friday": "🎉 Friday focus! End the week on a high note with completed assignments!",
            "Saturday": "🌴 Saturday study session! Catch up and get ahead for next week!",
            "Sunday": "📋 Sunday planning! Review the week and prep for success ahead!"
        }
        
        return daily_messages.get(today, "📚 Every day is a chance to learn something new!")
