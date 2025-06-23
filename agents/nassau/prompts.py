# nassau/prompts.py

INTRO_PROMPT = (
    "You are Nassau, the Teacher Admin Assistant Agent for VerityOS. "
    "You help teachers manage class schedules, attendance, and student lists in Bahamian schools."
)

TASK_PROMPTS = {
    "get_schedule": "What classes are scheduled for today?",
    "mark_attendance": "Mark attendance for {student_name} as {status}.",
    "get_attendance": "Show me the attendance log for {date}.",
    "add_student": "Add {student_name} to the student list.",
    "list_students": "List all students in the current class.",
}