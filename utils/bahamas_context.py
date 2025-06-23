"""
Bahamas Context Provider for VerityOS Education Agents
Provides local cultural and educational context
"""

from typing import Dict, List, Optional
import json
import random

class BahamasContext:
    """Provides Bahamas-specific context for educational content"""
    
    def __init__(self):
        self.cultural_references = {
            "greetings": ["Good morning", "Good afternoon", "Good evening", "How you doin'?"],
            "expressions": ["Right on", "For true", "Straight up", "You know what I mean?"],
            "local_terms": {
                "conch": "Large sea snail, national symbol",
                "junkanoo": "Traditional Bahamian festival with music and dance",
                "rake_and_scrape": "Traditional Bahamian music style",
                "bush_medicine": "Traditional herbal medicine practices",
                "switcha": "Traditional lemonade drink"
            }
        }
        
        self.educational_examples = {
            "math": {
                "currency": "If a conch salad costs $8 BSD and you have $20 BSD...",
                "measurements": "Nassau is about 21 miles long and 7 miles wide...",
                "statistics": "The Bahamas has over 700 islands, but only 30 are inhabited..."
            },
            "science": {
                "marine_biology": "Coral reefs around Andros Island are home to...",
                "weather": "Hurricane season in the Bahamas runs from June to November...",
                "geography": "The Bahamas sits on the Bahama Banks, shallow water areas..."
            },
            "history": {
                "independence": "The Bahamas gained independence on July 10, 1973...",
                "pirates": "The Bahamas was once a haven for pirates like Blackbeard...",
                "lucayans": "The original inhabitants were the Lucayan Taíno people..."
            },
            "language": {
                "dialect": "Bahamian English includes unique expressions like 'What da wibe is?'",
                "pronunciation": "Many Bahamians pronounce 'th' as 'd' - 'dese' instead of 'these'",
                "vocabulary": "Local words include 'conchy joe' (Bahamian person) and 'potcake' (local dog)"
            }
        }
        
        self.grade_appropriate_content = {
            "elementary": {
                "topics": ["Family Island names", "National symbols", "Basic Junkanoo"],
                "vocabulary": ["conch", "flamingo", "island", "beach", "family"]
            },
            "middle": {
                "topics": ["Independence history", "Government structure", "Tourism industry"],
                "vocabulary": ["archipelago", "colony", "independence", "parliament", "economy"]
            },
            "high": {
                "topics": ["Caribbean integration", "Economic challenges", "Environmental issues"],
                "vocabulary": ["sovereignty", "CARICOM", "sustainable development", "climate change"]
            }
        }
    
    def get_cultural_greeting(self) -> str:
        """Get a culturally appropriate greeting"""
        return random.choice(self.cultural_references["greetings"])
    
    def get_local_expression(self) -> str:
        """Get a local Bahamian expression"""
        return random.choice(self.cultural_references["expressions"])
    
    def get_subject_example(self, subject: str, grade_level: str = "middle") -> str:
        """Get a Bahamas-specific example for a subject"""
        subject_lower = subject.lower()
        
        if subject_lower in self.educational_examples:
            examples = self.educational_examples[subject_lower]
            example_key = random.choice(list(examples.keys()))
            return examples[example_key]
        
        return self._get_generic_example(subject, grade_level)
    
    def _get_generic_example(self, subject: str, grade_level: str) -> str:
        """Get a generic Bahamas example"""
        examples = {
            "elementary": "Let's learn about our beautiful islands in the Bahamas!",
            "middle": "The Bahamas is an archipelago with a rich history and culture.",
            "high": "As a sovereign nation, the Bahamas faces unique challenges and opportunities."
        }
        return examples.get(grade_level, examples["middle"])
    
    def get_vocabulary_for_grade(self, grade_level: str) -> List[str]:
        """Get appropriate vocabulary for grade level"""
        if grade_level in self.grade_appropriate_content:
            return self.grade_appropriate_content[grade_level]["vocabulary"]
        return ["Bahamas", "island", "culture", "history", "education"]
    
    def get_topics_for_grade(self, grade_level: str) -> List[str]:
        """Get appropriate topics for grade level"""
        if grade_level in self.grade_appropriate_content:
            return self.grade_appropriate_content[grade_level]["topics"]
        return ["Bahamas overview", "Local culture", "Basic history"]
    
    def localize_content(self, content: str, add_context: bool = True) -> str:
        """Add Bahamian context to educational content"""
        if not add_context:
            return content
        
        # Add local references where appropriate
        localized = content
        
        # Replace generic examples with local ones
        replacements = {
            "United States": "United States (our neighbor to the north)",
            "dollars": "Bahamian dollars (BSD)",
            "city": "Nassau or Freeport",
            "country": "The Bahamas",
            "students": "Bahamian students"
        }
        
        for generic, local in replacements.items():
            if generic in localized and local not in localized:
                localized = localized.replace(generic, local)
        
        return localized
    
    def get_cultural_context_note(self, topic: str) -> Optional[str]:
        """Get cultural context note for specific topics"""
        context_notes = {
            "slavery": "The Bahamas was a destination for freed slaves and has a rich African heritage.",
            "independence": "The Bahamas peacefully gained independence from Britain in 1973.",
            "tourism": "Tourism is vital to our economy, showcasing our natural beauty worldwide.",
            "environment": "Protecting our coral reefs and marine life is crucial for our future.",
            "music": "Junkanoo and rake-and-scrape music are important parts of our culture.",
            "food": "Conch, grouper, and peas and rice are staples of Bahamian cuisine."
        }
        
        topic_lower = topic.lower()
        for key, note in context_notes.items():
            if key in topic_lower:
                return f"🇧🇸 Cultural Note: {note}"
        
        return None
    
    def format_bahamian_response(self, response: str, user_type: str = "student") -> str:
        """Format response with Bahamian cultural touches"""
        if user_type == "student":
            # Add encouraging Bahamian expressions
            if "good job" in response.lower() or "correct" in response.lower():
                response += " Right on! 🇧🇸"
            elif "try again" in response.lower() or "incorrect" in response.lower():
                response += " No worries, keep trying!"
        
        return response
    
    def get_local_resources(self) -> Dict[str, List[str]]:
        """Get local educational resources and references"""
        return {
            "libraries": [
                "Nassau Public Library",
                "University of the Bahamas Library",
                "Freeport Public Library"
            ],
            "museums": [
                "National Art Gallery of the Bahamas",
                "Pirates of Nassau Museum",
                "Bahamas Historical Society Museum"
            ],
            "educational_institutions": [
                "University of the Bahamas",
                "Bahamas Technical and Vocational Institute",
                "College of the Bahamas"
            ],
            "online_resources": [
                "Bahamas Ministry of Education website",
                "Nassau Guardian Education section",
                "Tribune242 Education news"
            ]
        }