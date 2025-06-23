import datetime
import json
import os
from typing import Dict, List, Optional, Any
from core.memory_manager import MemoryManager

class PineappleAgent:
    def __init__(self):
        self.memory_manager = MemoryManager()

        # Sample assignments for demonstration
        self.assignments = {
            "active": [
                {
                    "id": "math_001",
                    "subject": "Mathematics",
                    "title": "Algebra Word Problems",
                    "description": "Complete problems 1-15 on page 67",
                    "due_date": "2025-06-25",
                    "priority": "high",
                    "status": "in_progress",
                    "progress": 60
                },
                {
                    "id": "hist_001", 
                    "subject": "Bahamian History",
                    "title": "Independence Day Essay",
                    "description": "Write a 500-word essay on July 10th, 1973",
                    "due_date": "2025-06-28",
                    "priority": "medium",
                    "status": "not_started",
                    "progress": 0
                },
                {
                    "id": "sci_001",
                    "subject": "Marine Science", 
                    "title": "Coral Reef Research",
                    "description": "Research project on Andros Barrier Reef",
                    "due_date": "2025-07-02",
                    "priority": "low",
                    "status": "not_started",
                    "progress": 0
                }
            ],
            "completed": [
                {
                    "id": "eng_001",
                    "subject": "English",
                    "title": "Poetry Analysis",
                    "description": "Analyze 'Bonefish' by Christian Campbell",
                    "completed_date": "2025-06-20",
                    "grade": "A-"
                }
            ]
        }

        # Study schedule
        self.study_schedule = {
            "Monday": ["Math (3:30-4:30 PM)", "History (7:00-8:00 PM)"],
            "Tuesday": ["Science (4:00-5:00 PM)", "English (7:30-8:30 PM)"],
            "Wednesday": ["Math Review (3:30-4:30 PM)"],
            "Thursday": ["History (4:00-5:00 PM)", "Science (7:00-8:00 PM)"],
            "Friday": ["Catch-up & Review (3:30-5:00 PM)"],
            "Saturday": ["Project Work (10:00 AM-12:00 PM)"],
            "Sunday": ["Week Planning (6:00-7:00 PM)"]
        }

    def get_assignments_overview(self) -> str:
        """Get overview of all assignments"""
        active_count = len(self.assignments["active"])
        completed_count = len(self.assignments["completed"])

        # Calculate urgent assignments (due within 2 days)
        today = datetime.date.today()
        urgent_assignments = []

        for assignment in self.assignments["active"]:
            due_date = datetime.datetime.strptime(assignment["due_date"], "%Y-%m-%d").date()
            days_until_due = (due_date - today).days
            if days_until_due <= 2:
                urgent_assignments.append(assignment)

        response = "🍍 **Homework Overview**\n\n"
        response += f"📊 **Summary:**\n"
        response += f"• Active assignments: {active_count}\n"
        response += f"• Completed this month: {completed_count}\n"
        response += f"• Urgent (due soon): {len(urgent_assignments)}\n\n"

        if urgent_assignments:
            response += "🚨 **Urgent Assignments:**\n"
            for assignment in urgent_assignments:
                due_date = datetime.datetime.strptime(assignment["due_date"], "%Y-%m-%d").date()
                days_until_due = (due_date - today).days

                if days_until_due == 0:
                    urgency = "DUE TODAY!"
                elif days_until_due == 1:
                    urgency = "Due tomorrow"
                else:
                    urgency = f"Due in {days_until_due} days"

                response += f"• **{assignment['title']}** ({assignment['subject']}) - {urgency}\n"
            response += "\n"

        return response

    def get_active_assignments(self) -> str:
        """List all active assignments with details"""
        if not self.assignments["active"]:
            return "🎉 Great job! No active assignments right now!"

        response = "📝 **Active Assignments**\n\n"

        # Sort by due date
        sorted_assignments = sorted(
            self.assignments["active"], 
            key=lambda x: datetime.datetime.strptime(x["due_date"], "%Y-%m-%d")
        )

        for assignment in sorted_assignments:
            due_date = datetime.datetime.strptime(assignment["due_date"], "%Y-%m-%d").date()
            days_until_due = (due_date - (datetime.date.today() if 'today' not in locals() else datetime.date.today())).days

            # Priority emoji
            priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}[assignment["priority"]]

            # Status emoji
            status_emoji = {"not_started": "⭕", "in_progress": "🔄", "completed": "✅"}[assignment["status"]]

            response += f"{priority_emoji} **{assignment['title']}**\n"
            response += f"   Subject: {assignment['subject']}\n"
            response += f"   Due: {assignment['due_date']} ({days_until_due} days)\n"
            response += f"   Status: {status_emoji} {assignment['status'].replace('_', ' ').title()}\n"
            response += f"   Progress: {assignment['progress']}%\n"
            response += f"   Description: {assignment['description']}\n\n"

        return response

    def get_study_schedule(self) -> str:
        """Get today's study schedule"""
        today = datetime.datetime.today().strftime("%A")
        today_schedule = self.study_schedule.get(today, ["Free day - no scheduled study time"])

        response = f"📅 **{today}'s Study Schedule**\n\n"
        for item in today_schedule:
            response += f"• {item}\n"

        response += "\n💡 **Study Tips:**\n"
        response += "• Take 10-minute breaks every hour\n"
        response += "• Keep water and healthy snacks nearby\n"
        response += "• Find a quiet, well-lit space\n"
        response += "• Put your phone on silent\n"

        return response

    def update_assignment_progress(self, assignment_title: str, progress: int) -> str:
        """Update progress on an assignment"""
        for assignment in self.assignments["active"]:
            if assignment_title.lower() in assignment["title"].lower():
                assignment["progress"] = min(100, max(0, progress))
                if assignment["progress"] == 100:
                    assignment["status"] = "completed"
                elif assignment["progress"] > 0:
                    assignment["status"] = "in_progress"

                return f"✅ Updated '{assignment['title']}' progress to {assignment['progress']}%!"

        return f"❌ Could not find assignment containing '{assignment_title}'. Try 'list assignments' to see available tasks."

    def add_assignment(self, subject: str, title: str, description: str, due_date: str, priority: str = "medium") -> str:
        """Add a new assignment"""
        new_assignment = {
            "id": f"{subject.lower()[:3]}_{len(self.assignments['active']) + 1:03d}",
            "subject": subject,
            "title": title,
            "description": description,
            "due_date": due_date,
            "priority": priority.lower(),
            "status": "not_started",
            "progress": 0
        }

        self.assignments["active"].append(new_assignment)
        return f"📝 Added new assignment: '{title}' for {subject}, due {due_date}"

    def get_completed_assignments(self) -> str:
        """Show completed assignments"""
        if not self.assignments["completed"]:
            return "📋 No completed assignments recorded yet. Keep working hard!"

        response = "🎉 **Completed Assignments**\n\n"
        for assignment in self.assignments["completed"]:
            response += f"✅ **{assignment['title']}** ({assignment['subject']})\n"
            response += f"   Completed: {assignment['completed_date']}\n"
            if 'grade' in assignment:
                response += f"   Grade: {assignment['grade']}\n"
            response += "\n"

        return response

    def get_study_tips(self) -> str:
        """Provide study tips and motivation"""
        tips = [
            "🧠 **Active Learning**: Don't just read - summarize, teach someone else, or create flashcards!",
            "⏰ **Time Management**: Use the Pomodoro Technique - 25 minutes focused work, 5-minute break",
            "🌴 **Bahamian Study Spots**: Try studying outdoors when weather permits - fresh air helps concentration!",
            "📚 **Subject Rotation**: Switch between subjects every hour to keep your brain engaged",
            "🎯 **Goal Setting**: Break big assignments into smaller, manageable tasks",
            "💧 **Stay Hydrated**: Drink water regularly - dehydration affects concentration",
            "😴 **Rest Well**: Get 8-9 hours of sleep - your brain consolidates learning during sleep!",
            "🤝 **Study Groups**: Form study groups with classmates for challenging subjects",
        ]

        import random
        selected_tips = random.sample(tips, 3)

        response = "💡 **Study Tips for Success**\n\n"
        for tip in selected_tips:
            response += f"{tip}\n\n"

        response += "Remember: Consistency beats perfection! A little bit every day goes a long way! 🍍"
        return response

    def process_message(self, message: str) -> str:
        """Process incoming message and return appropriate response"""
        message_lower = message.lower()

        # Overview/Dashboard
        if any(word in message_lower for word in ["overview", "dashboard", "summary", "status"]):
            return self.get_assignments_overview()

        # List assignments
        elif any(word in message_lower for word in ["assignments", "homework", "tasks", "list"]):
            if "completed" in message_lower:
                return self.get_completed_assignments()
            else:
                return self.get_active_assignments()

        # Study schedule
        elif any(word in message_lower for word in ["schedule", "today", "study time"]):
            return self.get_study_schedule()

        # Update progress
        elif "progress" in message_lower or "update" in message_lower:
            # Simple progress update - in real app would parse better
            return "To update progress, say: 'Update [assignment name] to [percentage]%'\n\nExample: 'Update algebra to 75%'"

        # Add assignment
        elif "add" in message_lower and ("assignment" in message_lower or "homework" in message_lower):
            return "To add an assignment, say: 'Add [Subject] assignment: [Title] due [Date]'\n\nExample: 'Add Math assignment: Chapter 5 Review due 2025-06-30'"

        # Study tips
        elif any(word in message_lower for word in ["tips", "help", "study", "motivation", "advice"]):
            return self.get_study_tips()

        # Default welcome message
        else:
            return ("🍍 **Hey there! I'm Pineapple, your homework tracker!**\n\n"
                   "I can help you:\n"
                   "• **'Overview'** - See all your assignment status\n"
                   "• **'List assignments'** - View active homework\n"
                   "• **'Today's schedule'** - Check study schedule\n"
                   "• **'Study tips'** - Get motivation and advice\n"
                   "• **'Add assignment'** - Track new homework\n"
                   "• **'Update progress'** - Mark completion\n\n"
                   "What would you like to check? 📝")

def run_agent(message, data=None):
    """Entry point for Pineapple agent"""
    agent = PineappleAgent()
    return agent.process_message(message)