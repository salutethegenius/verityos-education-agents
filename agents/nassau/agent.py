# nassau/agent.py

import datetime

class NassauAgent:
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
        return self.class_schedule.get(today, ["No classes today."])

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
        return self.student_list

    def add_student(self, name):
        if name not in self.student_list:
            self.student_list.append(name)
            return f"{name} has been added to the class list."
        return f"{name} is already in the class list."

    def process_message(self, message):
        print(f"[DEBUG] Nassau received message: {message}")
        message = message.lower()
        if "schedule" in message:
            response = "\n".join(self.get_today_schedule())
            print(f"[DEBUG] Nassau response: {response}")
            return response
        elif "students" in message:
            response = "\n".join(self.list_students())
            print(f"[DEBUG] Nassau response: {response}")
            return response
        elif "add student" in message:
            name = message.replace("add student", "").strip().title()
            response = self.add_student(name)
            print(f"[DEBUG] Nassau response: {response}")
            return response
        elif "attendance" in message:
            record = self.get_attendance_for_day()
            if isinstance(record, list):
                response = "\n".join(record)
                print(f"[DEBUG] Nassau response: {response}")
                return response
            elif isinstance(record, dict):
                response = "\n".join([f"{k}: {v}" for k, v in record.items()])
                print(f"[DEBUG] Nassau response: {response}")
                return response
            response = str(record)
            print(f"[DEBUG] Nassau response: {response}")
            return response
        else:
            response = "I'm here to assist with class schedules, students, and attendance. Try asking for today's schedule or listing students."
            print(f"[DEBUG] Nassau response: {response}")
            return response


def run_agent(message):
    """
    Entry point function for the Nassau Agent that processes incoming messages.
    
    Args:
        message (str): The user message to process
        
    Returns:
        str: The response from the agent
    """
    agent = NassauAgent()
    return agent.process_message(message)
