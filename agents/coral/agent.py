
# coral/agent.py

import datetime
import json
import os
from typing import Dict, List, Optional, Any
from core.memory_manager import MemoryManager

class CoralAgent:
    def __init__(self):
        self.memory_manager = MemoryManager()
        self.class_schedule = {
            "Monday": ["Math - 9:00 AM", "English - 11:00 AM", "Science - 2:00 PM"],
            "Tuesday": ["Science - 10:00 AM", "History - 1:00 PM", "PE - 3:00 PM"],
            "Wednesday": ["PE - 8:30 AM", "Art - 10:30 AM", "Math - 1:00 PM"],
            "Thursday": ["Math - 9:00 AM", "English - 11:00 AM", "Computer - 2:00 PM"],
            "Friday": ["Science - 10:00 AM", "Computer - 12:00 PM", "Art - 2:30 PM"]
        }
        self.student_accounts = self._load_student_accounts()
        self.attendance_log = {}

    def _load_student_accounts(self):
        """Load existing student accounts from memory"""
        try:
            accounts_data = self.memory_manager.load_memory("coral", "student_accounts", "persistent")
            if accounts_data and 'students' in accounts_data:
                return accounts_data['students']
        except:
            pass
        
        # Default students if no saved data
        return {
            "jasmine_rolle": {
                "name": "Jasmine Rolle",
                "grade": "Grade 8",
                "student_id": "JS001",
                "password": "jrolle",
                "created_date": "2025-01-15",
                "active": True,
                "sessions": []
            },
            "kofi_smith": {
                "name": "Kofi Smith", 
                "grade": "Grade 8",
                "student_id": "KS002",
                "password": "ksmith",
                "created_date": "2025-01-15",
                "active": True,
                "sessions": []
            },
            "tiana_clarke": {
                "name": "Tiana Clarke",
                "grade": "Grade 8", 
                "student_id": "TC003",
                "password": "tclarke",
                "created_date": "2025-01-15",
                "active": True,
                "sessions": []
            },
            "malik_johnson": {
                "name": "Malik Johnson",
                "grade": "Grade 8",
                "student_id": "MJ004",
                "password": "mjohnson", 
                "created_date": "2025-01-15",
                "active": True,
                "sessions": []
            },
            "zaria_knowles": {
                "name": "Zaria Knowles",
                "grade": "Grade 8",
                "student_id": "ZK005",
                "password": "zknowles",
                "created_date": "2025-01-15", 
                "active": True,
                "sessions": []
            }
        }

    def _save_student_accounts(self):
        """Save student accounts to persistent memory"""
        accounts_data = {
            "students": self.student_accounts,
            "last_updated": datetime.datetime.now().isoformat()
        }
        self.memory_manager.save_memory("coral", "student_accounts", accounts_data, "persistent")

    def create_student_account(self, name: str, grade: str = "Grade 8") -> str:
        """Create a new student account"""
        # Generate student ID and password
        name_parts = name.lower().split()
        if len(name_parts) >= 2:
            student_key = f"{name_parts[0]}_{name_parts[1]}"
            student_id = f"{name_parts[0][0].upper()}{name_parts[1][0].upper()}{len(self.student_accounts) + 1:03d}"
            # Generate password: first letter of first name + last name (e.g., Kenneth Moncur = kmoncur)
            password = f"{name_parts[0][0]}{name_parts[1]}"
        else:
            student_key = name.lower().replace(" ", "_")
            student_id = f"{name[0].upper()}X{len(self.student_accounts) + 1:03d}"
            # For single names, use first 6 characters + "123"
            password = f"{name.lower()[:6]}123"

        if student_key in self.student_accounts:
            return f"Student account for {name} already exists."

        # Create new student account
        self.student_accounts[student_key] = {
            "name": name,
            "grade": grade,
            "student_id": student_id,
            "password": password,
            "created_date": datetime.date.today().isoformat(),
            "active": True,
            "sessions": []
        }
        
        self._save_student_accounts()
        return f"✅ **Student Account Created**\n\n**Name:** {name}\n**Student ID:** {student_id}\n**Password:** {password}\n**Grade:** {grade}\n\n📝 *Give these credentials to the student for login access.*"

    def search_students(self, query: str) -> str:
        """Search for students by name or ID"""
        query = query.lower()
        matches = []
        
        for key, student in self.student_accounts.items():
            if (query in student['name'].lower() or 
                query in student['student_id'].lower() or
                query in key):
                status = "🟢 Active" if student['active'] else "🔴 Inactive"
                matches.append(f"• {student['name']} (ID: {student['student_id']}) - {student['grade']} {status}")
        
        if matches:
            return f"🔍 **Search Results for '{query}':**\n" + "\n".join(matches)
        else:
            return f"❌ No students found matching '{query}'"

    def get_student_sessions(self, student_identifier: str) -> str:
        """Get all sessions for a specific student"""
        student = None
        student_key = None
        
        # Find student by name or ID
        for key, std in self.student_accounts.items():
            if (student_identifier.lower() in std['name'].lower() or 
                student_identifier.upper() == std['student_id']):
                student = std
                student_key = key
                break
        
        if not student:
            return f"❌ Student '{student_identifier}' not found"

        # Load session data from memory system
        sessions = []
        memory_files = os.listdir("memory") if os.path.exists("memory") else []
        
        for filename in memory_files:
            if filename.endswith("_session.json"):
                try:
                    with open(f"memory/{filename}", 'r') as f:
                        session_data = json.load(f)
                        # Check if this session belongs to our student
                        if ('student_name' in session_data and 
                            student['name'].lower() in session_data.get('student_name', '').lower()):
                            sessions.append({
                                "session_id": session_data.get('session_id', 'Unknown'),
                                "agent": session_data.get('agent_name', 'Unknown'),
                                "timestamp": session_data.get('timestamp', 'Unknown'),
                                "messages": len(session_data.get('data', {}).get('conversation_history', []))
                            })
                except:
                    continue

        if not sessions:
            return f"📋 **{student['name']} ({student['student_id']})**\n\n❌ No sessions found yet"

        result = f"📋 **{student['name']} ({student['student_id']}) - Session History**\n\n"
        for i, session in enumerate(sessions[-10:], 1):  # Show last 10 sessions
            result += f"{i}. **{session['agent'].title()}** Agent - {session['messages']} messages\n"
            result += f"   Session: {session['session_id'][:8]}... | {session['timestamp'][:10]}\n\n"
        
        return result

    def view_student_progress(self, student_identifier: str) -> str:
        """View detailed progress for a student"""
        student = None
        for key, std in self.student_accounts.items():
            if (student_identifier.lower() in std['name'].lower() or 
                student_identifier.upper() == std['student_id']):
                student = std
                break
        
        if not student:
            return f"❌ Student '{student_identifier}' not found"

        # Generate progress report
        report = f"📊 **Progress Report: {student['name']} ({student['student_id']})**\n\n"
        report += f"**Grade:** {student['grade']}\n"
        report += f"**Account Created:** {student['created_date']}\n"
        report += f"**Status:** {'🟢 Active' if student['active'] else '🔴 Inactive'}\n\n"
        
        # Add session summary
        sessions_info = self.get_student_sessions(student_identifier)
        if "No sessions found" not in sessions_info:
            report += "**Recent Activity:**\n" + sessions_info.split("Session History**\n\n")[1]
        else:
            report += "**Recent Activity:**\n❌ No recent sessions\n"
        
        return report

    def get_today_schedule(self):
        today = datetime.datetime.today().strftime("%A")
        schedule = self.class_schedule.get(today, ["No classes today."])
        return f"📅 **Today's Schedule ({today}):**\n" + "\n".join([f"• {cls}" for cls in schedule])

    def mark_attendance(self, student_name: str, status: str = "present") -> str:
        date = datetime.date.today().isoformat()
        if date not in self.attendance_log:
            self.attendance_log[date] = {}
        self.attendance_log[date][student_name] = status
        return f"✅ {student_name} marked as {status} for {date}"

    def get_attendance_for_day(self, date: str = None) -> str:
        if not date:
            date = datetime.date.today().isoformat()
        
        attendance = self.attendance_log.get(date, {})
        if not attendance:
            return f"📋 No attendance recorded for {date}"
        
        result = f"📋 **Attendance for {date}:**\n"
        for student, status in attendance.items():
            emoji = "✅" if status == "present" else "❌" if status == "absent" else "⚠️"
            result += f"{emoji} {student}: {status}\n"
        return result

    def list_students(self) -> str:
        if not self.student_accounts:
            return "❌ No students registered"
        
        result = "👥 **Student Roster:**\n"
        for i, (key, student) in enumerate(self.student_accounts.items(), 1):
            status = "🟢" if student['active'] else "🔴"
            result += f"{i}. {status} {student['name']} (ID: {student['student_id']}) - {student['grade']}\n"
        return result

    def get_student_credentials(self, student_identifier: str) -> str:
        """Get login credentials for a specific student"""
        student = None
        for key, std in self.student_accounts.items():
            if (student_identifier.lower() in std['name'].lower() or 
                student_identifier.upper() == std['student_id']):
                student = std
                break
        
        if not student:
            return f"❌ Student '{student_identifier}' not found"

        return f"🔑 **Login Credentials for {student['name']}:**\n\n**Student ID:** {student['student_id']}\n**Password:** {student['password']}\n\n📋 Share these credentials with the student for portal access."

    def generate_class_report(self) -> str:
        """Generate a comprehensive class report"""
        total_students = len(self.student_accounts)
        active_students = sum(1 for s in self.student_accounts.values() if s['active'])
        
        report = f"📊 **Class Overview Report**\n\n"
        report += f"**Total Students:** {total_students}\n"
        report += f"**Active Students:** {active_students}\n"
        report += f"**Inactive Students:** {total_students - active_students}\n\n"
        
        # Today's schedule
        report += self.get_today_schedule() + "\n\n"
        
        # Recent attendance
        today = datetime.date.today().isoformat()
        if today in self.attendance_log:
            report += f"**Today's Attendance:**\n"
            for student, status in self.attendance_log[today].items():
                emoji = "✅" if status == "present" else "❌"
                report += f"{emoji} {student}\n"
        else:
            report += "**Today's Attendance:** Not yet recorded\n"
        
        return report

    def process_message(self, message: str) -> str:
        print(f"[DEBUG] Coral received message: {message}")
        message = message.lower()
        
        # Student account management
        if "create student" in message or "add student" in message:
            # Extract name from message
            words = message.replace("create student", "").replace("add student", "").strip()
            if words:
                name = words.title()
                response = self.create_student_account(name)
            else:
                response = "Please specify a student name. Example: 'Create student John Smith'"
            
        elif "search" in message:
            query = message.replace("search", "").replace("student", "").strip()
            if query:
                response = self.search_students(query)
            else:
                response = "Please specify search terms. Example: 'Search Smith' or 'Search JS001'"
                
        elif "sessions for" in message or "view sessions" in message:
            student_name = message.replace("sessions for", "").replace("view sessions", "").strip()
            if student_name:
                response = self.get_student_sessions(student_name)
            else:
                response = "Please specify a student. Example: 'Sessions for Jasmine Rolle'"
                
        elif "progress for" in message or "view progress" in message:
            student_name = message.replace("progress for", "").replace("view progress", "").strip()
            if student_name:
                response = self.view_student_progress(student_name)
            else:
                response = "Please specify a student. Example: 'Progress for JS001'"
                
        elif "schedule" in message:
            response = self.get_today_schedule()
            
        elif "students" in message or "roster" in message:
            response = self.list_students()
            
        elif "attendance" in message:
            response = self.get_attendance_for_day()
            
        elif "class report" in message or "overview" in message:
            response = self.generate_class_report()
            
        elif "credentials for" in message or "password for" in message:
            student_name = message.replace("credentials for", "").replace("password for", "").strip()
            if student_name:
                response = self.get_student_credentials(student_name)
            else:
                response = "Please specify a student. Example: 'Credentials for Jasmine Rolle'"
            
        else:
            response = (
                "🏫 **Coral Teacher Admin Assistant**\n\n"
                "I can help you with:\n"
                "• **Student Management:** 'Create student [name]', 'Search [name/ID]'\n"
                "• **Credentials:** 'Credentials for [student]', 'Password for [name/ID]'\n"
                "• **Session Tracking:** 'Sessions for [student]', 'Progress for [student]'\n"
                "• **Class Operations:** 'Show students', 'Today's schedule', 'Class report'\n"
                "• **Attendance:** 'Mark attendance', 'Show attendance'\n\n"
                "Try asking: 'Show students' or 'Create student Alex Thompson'"
            )
        
        print(f"[DEBUG] Coral response: {response}")
        return response


def run_agent(message: str, payload: dict = None) -> str:
    """
    Entry point function for the Coral Agent that processes incoming messages.
    
    Args:
        message (str): The user message to process
        payload (dict): Additional context and session information
        
    Returns:
        str: The response from the agent
    """
    agent = CoralAgent()
    return agent.process_message(message)
