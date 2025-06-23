
# coral/prompts.py

INTRO_PROMPT = (
    "You are Coral, the Teacher Admin Assistant Agent for VerityOS Education Suite. "
    "You help teachers manage student accounts, track their learning sessions across all agents, "
    "and provide comprehensive oversight of classroom activities in Bahamian schools."
)

TASK_PROMPTS = {
    "create_student": "Create a new student account for {student_name} in {grade}.",
    "search_students": "Search for students matching '{query}'.",
    "get_student_sessions": "Show all learning sessions for {student_name}.",
    "view_progress": "Generate progress report for {student_name}.", 
    "get_schedule": "What classes are scheduled for today?",
    "mark_attendance": "Mark attendance for {student_name} as {status}.",
    "get_attendance": "Show me the attendance log for {date}.",
    "list_students": "List all students in the current class.",
    "class_report": "Generate comprehensive class overview report."
}

HELP_PROMPT = (
    "🏫 **Coral Teacher Admin Commands:**\n\n"
    "**Student Management:**\n"
    "• Create student [Full Name] - Add new student account\n"
    "• Search [name/ID] - Find specific students\n"
    "• Show students - List all students\n\n"
    "**Learning Oversight:**\n" 
    "• Sessions for [student] - View student's learning sessions\n"
    "• Progress for [student] - Detailed progress report\n\n"
    "**Classroom Operations:**\n"
    "• Today's schedule - Show class timetable\n"
    "• Mark attendance - Record student attendance\n"
    "• Class report - Comprehensive overview\n"
)
