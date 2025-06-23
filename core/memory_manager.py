"""
Memory Manager for VerityOS Education Agents
Handles persistent memory across sessions
"""

import json
import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class MemoryManager:
    """Manages persistent memory for education agents"""

    def __init__(self, base_path: str = "memory"):
        self.base_path = base_path
        self.ensure_memory_directory()

    def ensure_memory_directory(self):
        """Create memory directory if it doesn't exist"""
        if not os.path.exists(self.base_path):
            os.makedirs(self.base_path)
            logger.info(f"Created memory directory: {self.base_path}")

    def get_memory_path(self, agent_name: str, session_id: str, memory_type: str = "session") -> str:
        """Generate memory file path"""
        if memory_type == "persistent":
            return os.path.join(self.base_path, f"{agent_name}_{session_id}_persistent.json")
        else:
            return os.path.join(self.base_path, f"{agent_name}_{session_id}_session.json")

    def save_memory(self, agent_name: str, session_id: str, data: Dict, memory_type: str = "session") -> bool:
        """Save memory data to file"""
        try:
            # Ensure memory directory exists
            os.makedirs(self.base_path, exist_ok=True)

            # Sanitize filename
            safe_agent = "".join(c for c in agent_name if c.isalnum() or c in ('-', '_'))
            safe_session = "".join(c for c in session_id if c.isalnum() or c in ('-', '_'))
            safe_type = "".join(c for c in memory_type if c.isalnum() or c in ('-', '_'))

            memory_path = os.path.join(self.base_path, f"{safe_agent}_{safe_session}_{safe_type}.json")

            # Validate data
            if not isinstance(data, dict):
                data = {"data": data}

            memory_data = {
                "agent_name": agent_name,
                "session_id": session_id,
                "memory_type": memory_type,
                "timestamp": datetime.now().isoformat(),
                "data": data
            }

            with open(memory_path, 'w') as f:
                json.dump(memory_data, f, indent=2, default=str)

            logger.info(f"Memory saved for {agent_name} session {session_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to save memory: {e}")
            return False

    def load_memory(self, agent_name: str, session_id: str, memory_type: str = "session") -> Optional[Dict]:
        """Load memory data from file"""
        try:
            memory_path = self.get_memory_path(agent_name, session_id, memory_type)

            if not os.path.exists(memory_path):
                return None

            with open(memory_path, 'r') as f:
                memory_data = json.load(f)

            logger.info(f"Memory loaded for {agent_name} session {session_id}")
            return memory_data.get("data", {})

        except Exception as e:
            logger.error(f"Failed to load memory: {e}")
            return None

    def append_to_memory(self, agent_name: str, session_id: str, key: str, value: Any, memory_type: str = "session") -> bool:
        """Append data to existing memory"""
        try:
            existing_memory = self.load_memory(agent_name, session_id, memory_type) or {}

            if key not in existing_memory:
                existing_memory[key] = []

            if isinstance(existing_memory[key], list):
                existing_memory[key].append(value)
            else:
                existing_memory[key] = [existing_memory[key], value]

            return self.save_memory(agent_name, session_id, existing_memory, memory_type)

        except Exception as e:
            logger.error(f"Failed to append to memory: {e}")
            return False

    def get_student_progress(self, student_id: str, subject: str = None) -> Dict:
        """Get student progress across sessions"""
        try:
            progress_data = {
                "student_id": student_id,
                "subjects": {},
                "overall_stats": {
                    "total_sessions": 0,
                    "total_questions_answered": 0,
                    "average_score": 0
                }
            }

            # Search through memory files for this student
            for filename in os.listdir(self.base_path):
                if student_id in filename and filename.endswith('.json'):
                    with open(os.path.join(self.base_path, filename), 'r') as f:
                        memory = json.load(f)

                        # Extract progress data
                        if 'data' in memory and 'progress' in memory['data']:
                            session_progress = memory['data']['progress']

                            for subj, data in session_progress.items():
                                if subj not in progress_data['subjects']:
                                    progress_data['subjects'][subj] = {
                                        'sessions': 0,
                                        'questions_answered': 0,
                                        'correct_answers': 0,
                                        'topics_covered': []
                                    }

                                progress_data['subjects'][subj]['sessions'] += 1
                                progress_data['subjects'][subj]['questions_answered'] += data.get('questions', 0)
                                progress_data['subjects'][subj]['correct_answers'] += data.get('correct', 0)

                                if 'topics' in data:
                                    progress_data['subjects'][subj]['topics_covered'].extend(data['topics'])

            return progress_data

        except Exception as e:
            logger.error(f"Failed to get student progress: {e}")
            return {}

    def cleanup_old_sessions(self, days_old: int = 30) -> int:
        """Clean up memory files older than specified days"""
        try:
            deleted_count = 0
            cutoff_time = datetime.now().timestamp() - (days_old * 24 * 60 * 60)

            for filename in os.listdir(self.base_path):
                if filename.endswith('.json'):
                    file_path = os.path.join(self.base_path, filename)

                    if os.path.getmtime(file_path) < cutoff_time:
                        os.remove(file_path)
                        deleted_count += 1

            logger.info(f"Cleaned up {deleted_count} old memory files")
            return deleted_count

        except Exception as e:
            logger.error(f"Failed to cleanup old sessions: {e}")
            return 0