"""
Base Agent Class for VerityOS Education Agents
"""

import yaml
import json
import os
from typing import Dict, List, Optional, Any
from abc import ABC, abstractmethod
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """Base class for all VerityOS education agents"""
    
    def __init__(self, config_path: str):
        self.config = self._load_config(config_path)
        self.name = self.config.get("name", "Unknown Agent")
        self.role = self.config.get("role", "Assistant")
        self.memory_enabled = self.config.get("memory", {}).get("enabled", False)
        self.memory_type = self.config.get("memory", {}).get("type", "session")
        self.safety_level = self.config.get("safety", {}).get("level", "moderate")
        self.session_id = None
        self.context = []
        
    def _load_config(self, config_path: str) -> Dict:
        """Load agent configuration from YAML file"""
        try:
            if not os.path.exists(config_path):
                logger.warning(f"Config file not found: {config_path}")
                return self._get_default_config()
            
            with open(config_path, 'r') as file:
                config = yaml.safe_load(file)
                if not config:
                    logger.warning(f"Empty config file: {config_path}")
                    return self._get_default_config()
                return config
        except Exception as e:
            logger.error(f"Failed to load config from {config_path}: {e}")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict:
        """Return default configuration"""
        return {
            "name": "Unknown Agent",
            "role": "Assistant",
            "memory": {"enabled": False, "type": "session"},
            "safety": {"level": "moderate"}
        }
    
    def initialize_session(self, session_id: str, user_type: str = "student") -> None:
        """Initialize a new session for the agent"""
        self.session_id = session_id
        self.user_type = user_type
        self.context = []
        logger.info(f"{self.name} initialized for {user_type} session: {session_id}")
    
    def add_to_context(self, message: str, role: str = "user") -> None:
        """Add message to current context"""
        self.context.append({
            "role": role,
            "content": message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep context within reasonable limits
        if len(self.context) > 20:
            self.context = self.context[-20:]
    
    def get_context_summary(self) -> str:
        """Get a summary of current conversation context"""
        if not self.context:
            return "No previous conversation context."
        
        recent_messages = self.context[-5:]
        summary = "Recent conversation:\n"
        for msg in recent_messages:
            summary += f"{msg['role']}: {msg['content'][:100]}...\n"
        return summary
    
    @abstractmethod
    def process_message(self, message: str, **kwargs) -> str:
        """Process incoming message and return response"""
        pass
    
    @abstractmethod
    def get_capabilities(self) -> List[str]:
        """Return list of agent capabilities"""
        pass
    
    def apply_safety_filter(self, content: str) -> str:
        """Apply safety filtering based on agent configuration"""
        # Basic safety filtering - can be enhanced
        if self.safety_level == "strict":
            # More restrictive filtering for younger students
            sensitive_topics = ["violence", "inappropriate", "harmful"]
            for topic in sensitive_topics:
                if topic.lower() in content.lower():
                    return "I'm sorry, but I can't discuss that topic. Let's focus on your studies instead."
        
        return content
    
    def get_bahamas_context(self) -> Dict:
        """Get Bahamas-specific context for responses"""
        return {
            "location": "The Bahamas",
            "currency": "Bahamian Dollar (BSD)",
            "education_system": "British-based system",
            "cultural_context": "Caribbean, multicultural",
            "local_references": True
        }