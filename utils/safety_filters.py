"""
Safety Filters for VerityOS Education Agents
Ensures age-appropriate and safe content delivery
"""

import re
from typing import List, Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class SafetyFilter:
    """Comprehensive safety filtering for student inputs and agent outputs"""
    
    def __init__(self):
        self.inappropriate_words = [
            "violence", "hate", "inappropriate", "harmful", "dangerous"
        ]
        
        self.spam_patterns = [
            r"(.)\1{10,}",  # 10+ repeated characters (like aaaaaaaaaa)
            r"^[!@#$%^&*()]{5,}$",  # Only special characters
        ]
    
    def validate_student_input(self, message: str) -> Tuple[bool, str]:
        """Validate student input for safety and appropriateness"""
        if not message or not message.strip():
            return True, ""
        
        message_clean = message.strip()
        
        # Check for actual spam patterns, but exclude legitimate math
        if self._is_spam_input(message_clean):
            return False, "Please avoid repetitive characters."
        
        # Check for inappropriate content
        if self._contains_inappropriate_content(message_clean):
            return False, "Let's keep our conversation educational and appropriate."
        
        return True, ""
    
    def _is_spam_input(self, message: str) -> bool:
        """Check if input is spam, excluding legitimate mathematical expressions"""
        # Don't flag mathematical expressions
        if re.search(r'\d+\s*[×*+\-/÷]\s*\d+', message):
            return False
        
        # Don't flag if it contains math-related words
        math_words = ['multiply', 'times', 'plus', 'minus', 'divide', 'equals', 'calculate']
        if any(word in message.lower() for word in math_words):
            return False
        
        # Check for actual spam patterns
        for pattern in self.spam_patterns:
            if re.search(pattern, message):
                return True
        
        # Check for keyboard mashing (random letters)
        if len(message) > 8 and re.match(r'^[a-zA-Z]+$', message):
            # Count unique characters
            unique_chars = len(set(message.lower()))
            if unique_chars < len(message) * 0.3:  # Less than 30% unique characters
                return True
        
        return False
    
    def _contains_inappropriate_content(self, message: str) -> bool:
        """Check for inappropriate content"""
        message_lower = message.lower()
        return any(word in message_lower for word in self.inappropriate_words)
    
    def filter_content(self, content: str, safety_level: str = "moderate", grade_level: str = "middle") -> Tuple[str, List[str]]:
        """Filter agent output content for safety"""
        if not content:
            return content, []
        
        issues = []
        filtered_content = content
        
        # Apply content filtering based on safety level
        if safety_level == "strict":
            # More restrictive filtering for younger students
            sensitive_topics = ["violence", "inappropriate", "harmful"]
            for topic in sensitive_topics:
                if topic.lower() in filtered_content.lower():
                    filtered_content = "I'm sorry, but I can't discuss that topic. Let's focus on your studies instead."
                    issues.append(f"Filtered sensitive topic: {topic}")
        
        return filtered_content, issues

class SafetyFilter:
    """Comprehensive safety filtering for educational content"""
    
    def __init__(self):
        self.inappropriate_content = {
            "violence": [
                "kill", "murder", "attack", "fight", "violent", "weapon", "gun", "knife",
                "blood", "death", "hurt", "harm", "dangerous", "threat"
            ],
            "adult_content": [
                "sex", "sexual", "adult", "mature", "inappropriate", "explicit",
                "nude", "naked", "drug", "alcohol", "gambling"
            ],
            "negative_language": [
                "stupid", "dumb", "idiot", "hate", "ugly", "worthless", "failure",
                "loser", "shut up", "damn", "hell"
            ],
            "harmful_activities": [
                "suicide", "self-harm", "cutting", "depression", "anxiety",
                "bullying", "harassment", "abuse"
            ]
        }
        
        self.positive_alternatives = {
            "stupid": "challenging",
            "dumb": "difficult to understand",
            "idiot": "person who needs help",
            "hate": "dislike",
            "ugly": "not attractive",
            "failure": "learning opportunity",
            "loser": "person who is struggling"
        }
        
        self.grade_restrictions = {
            "elementary": {
                "max_complexity": "simple",
                "forbidden_topics": ["advanced_politics", "complex_social_issues", "adult_themes"],
                "required_supervision": False
            },
            "middle": {
                "max_complexity": "moderate",
                "forbidden_topics": ["adult_themes", "explicit_content"],
                "required_supervision": False
            },
            "high": {
                "max_complexity": "advanced",
                "forbidden_topics": ["explicit_content"],
                "required_supervision": False
            }
        }
    
    def filter_content(self, content: str, safety_level: str = "moderate", 
                      grade_level: str = "middle") -> Tuple[str, List[str]]:
        """
        Filter content based on safety level and grade
        Returns: (filtered_content, list_of_issues_found)
        """
        issues_found = []
        filtered_content = content
        
        # Check for inappropriate content
        for category, words in self.inappropriate_content.items():
            for word in words:
                if word.lower() in content.lower():
                    issues_found.append(f"{category}: {word}")
                    
                    if safety_level == "strict":
                        # Replace with safer alternatives or remove
                        if word in self.positive_alternatives:
                            filtered_content = re.sub(
                                rf'\b{re.escape(word)}\b', 
                                self.positive_alternatives[word], 
                                filtered_content, 
                                flags=re.IGNORECASE
                            )
                        else:
                            filtered_content = re.sub(
                                rf'\b{re.escape(word)}\b', 
                                "[content filtered]", 
                                filtered_content, 
                                flags=re.IGNORECASE
                            )
        
        # Apply grade-level restrictions
        if grade_level in self.grade_restrictions:
            restrictions = self.grade_restrictions[grade_level]
            
            # Check for forbidden topics
            for topic in restrictions["forbidden_topics"]:
                if self._contains_topic(content, topic):
                    issues_found.append(f"grade_inappropriate: {topic}")
                    if safety_level == "strict":
                        filtered_content = self._replace_inappropriate_topic(
                            filtered_content, topic, grade_level
                        )
        
        # Educational content enhancement
        if safety_level in ["moderate", "strict"]:
            filtered_content = self._enhance_educational_tone(filtered_content)
        
        return filtered_content, issues_found
    
    def _contains_topic(self, content: str, topic: str) -> bool:
        """Check if content contains inappropriate topic for grade level"""
        topic_keywords = {
            "advanced_politics": ["politics", "government", "election", "voting", "political"],
            "complex_social_issues": ["racism", "discrimination", "social justice", "inequality"],
            "adult_themes": ["adult", "mature", "relationship", "dating", "romance"],
            "explicit_content": ["explicit", "graphic", "detailed", "mature"]
        }
        
        if topic in topic_keywords:
            for keyword in topic_keywords[topic]:
                if keyword.lower() in content.lower():
                    return True
        
        return False
    
    def _replace_inappropriate_topic(self, content: str, topic: str, grade_level: str) -> str:
        """Replace inappropriate topic with grade-appropriate alternative"""
        replacements = {
            "elementary": {
                "advanced_politics": "community helpers and leaders",
                "complex_social_issues": "being kind to everyone",
                "adult_themes": "friendship and family"
            },
            "middle": {
                "advanced_politics": "basic government and citizenship",
                "complex_social_issues": "fairness and respect for others",
                "adult_themes": "healthy relationships and communication"
            },
            "high": {
                "complex_social_issues": "understanding different perspectives",
                "adult_themes": "mature decision-making"
            }
        }
        
        if grade_level in replacements and topic in replacements[grade_level]:
            # This is a simplified replacement - in practice, you'd want more sophisticated logic
            return content + f"\n\n[Note: Let's focus on {replacements[grade_level][topic]} instead.]"
        
        return content
    
    def _enhance_educational_tone(self, content: str) -> str:
        """Enhance content with positive, educational tone"""
        # Add encouraging language
        if "wrong" in content.lower():
            content = content.replace("wrong", "not quite right")
        
        if "can't" in content.lower():
            content = content.replace("can't", "haven't learned yet")
        
        # Add positive reinforcement
        educational_phrases = [
            "Let's explore this together!",
            "Great question!",
            "You're doing well!",
            "Keep learning!"
        ]
        
        # Randomly add encouraging phrases (simplified logic)
        if len(content) > 100 and "!" not in content:
            content += " Keep up the good work!"
        
        return content
    
    def is_content_safe(self, content: str, safety_level: str = "moderate", 
                       grade_level: str = "middle") -> bool:
        """Quick check if content is safe without filtering"""
        _, issues = self.filter_content(content, safety_level, grade_level)
        return len(issues) == 0
    
    def get_safety_report(self, content: str, safety_level: str = "moderate", 
                         grade_level: str = "middle") -> Dict:
        """Get detailed safety report for content"""
        filtered_content, issues = self.filter_content(content, safety_level, grade_level)
        
        return {
            "original_content": content,
            "filtered_content": filtered_content,
            "is_safe": len(issues) == 0,
            "issues_found": issues,
            "safety_level": safety_level,
            "grade_level": grade_level,
            "content_length": len(content),
            "filtered_length": len(filtered_content),
            "modification_count": len(issues)
        }
    
    def validate_student_input(self, input_text: str) -> Tuple[bool, str]:
        """Validate student input for safety"""
        # Check for inappropriate student input
        inappropriate_patterns = [
            r'\b(hate|stupid|dumb|idiot|shut up)\b',
            r'\b(kill|die|death|hurt)\b',
            r'\b(sex|drug|alcohol)\b'
        ]
        
        for pattern in inappropriate_patterns:
            if re.search(pattern, input_text, re.IGNORECASE):
                return False, "Please use appropriate language for learning."
        
        # Check for excessive caps (shouting)
        if len(input_text) > 10 and input_text.isupper():
            return False, "Please use normal capitalization."
        
        # Check for repetitive characters (spam)
        if re.search(r'(.)\1{4,}', input_text):
            return False, "Please avoid repetitive characters."
        
        return True, "Input is appropriate."
    
    def get_age_appropriate_explanation(self, topic: str, grade_level: str) -> str:
        """Get age-appropriate explanation for sensitive topics"""
        explanations = {
            "elementary": {
                "conflict": "Sometimes people disagree, but we can solve problems by talking.",
                "history_violence": "Long ago, some people made bad choices, but we learn from history.",
                "difficult_topics": "Some topics are complex. Let's focus on what you can understand now."
            },
            "middle": {
                "conflict": "Conflicts happen, but there are peaceful ways to solve disagreements.",
                "history_violence": "History includes difficult events that teach us important lessons.",
                "difficult_topics": "Some topics require mature thinking. We'll explore them appropriately."
            },
            "high": {
                "conflict": "Understanding different perspectives helps us address conflicts constructively.",
                "history_violence": "Historical events, even difficult ones, help us understand human nature.",
                "difficult_topics": "Complex topics require critical thinking and multiple perspectives."
            }
        }
        
        if grade_level in explanations:
            for key, explanation in explanations[grade_level].items():
                if key in topic.lower():
                    return explanation
        
        return "Let's explore this topic in a way that's right for your learning level."