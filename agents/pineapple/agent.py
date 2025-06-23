# pineapple/agent.py

import datetime

class PineappleAgent:
    def __init__(self):
        self.class_schedule = {
            "Monday": ["Math - 9:00 AM", "English - 11:00 AM"],
            "Tuesday": ["Science - 10:00 AM", "History - 1:00 PM"],
            "Wednesday": ["PE - 8:30 AM", "Art - 10:30 AM"],
            "Thursday": ["Math - 9:00 AM", "English - 11:00 AM"],
            "Friday": ["Science - 10:00 AM", "Computer - 12:00 PM"]
        }
        self.student_list = ["Jasmine Rolle", "Kofi Smith", "Tiana Clarke", "Malik Johnson", "Zaria Knowles"]
        self.attendance_log = {}

    def get_today_schedule(self):
        today = datetime.datetime.today().strftime("%A")
        schedule = self.class_schedule.get(today, ["No classes today."])
        return "\n".join(schedule)

    def mark_attendance(self, student_name, status="present"):
        date = datetime.date.today().isoformat()
        if date not in self.attendance_log:
            self.attendance_log[date] = {}
        self.attendance_log[date][student_name] = status
        return f"{student_name} marked as {status} for {date}."

    def get_attendance_for_day(self, date=None):
        if not date:
            date = datetime.date.today().isoformat()
        return self.attendance_log.get(date, "No attendance recorded for this date.")

    def list_students(self):
        return "\n".join(self.student_list)

    def add_student(self, name):
        if name not in self.student_list:
            self.student_list.append(name)
            return f"{name} has been added to the class list."
        return f"{name} is already in the class list."

    def process_message(self, message):
        message = message.lower()
        if "schedule" in message:
            return self.get_today_schedule()
        elif "students" in message:
            return self.list_students()
        elif "add student" in message:
            name = message.replace("add student", "").strip().title()
            return self.add_student(name)
        elif "attendance" in message:
            return self.get_attendance_for_day()
        else:
            return "I'm here to assist with class schedules, students, and attendance. Try asking for today's schedule or listing students."

def run_agent(message, payload=None):
    agent = PineappleAgent()
    return agent.process_message(message)
