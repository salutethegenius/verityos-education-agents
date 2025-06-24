from dotenv import load_dotenv

load_dotenv()

from flask import Flask, render_template, request, jsonify
from agents.sage.agent import run_agent as run_sage
from agents.quill.agent import run_agent as run_quill
from agents.echo.agent import run_agent as run_echo
from agents.lucaya.agent import run_agent as run_lucaya
from agents.coral.agent import run_agent as run_coral
from agents.pineapple.agent import run_agent as run_pineapple
from utils.safety_filters import SafetyFilter
import logging

app = Flask(__name__)

# Initialize safety filter
safety_filter = SafetyFilter()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log', mode='a')
    ])
logger = logging.getLogger(__name__)


@app.route("/")
def index():
    try:
        return render_template("agent_interface.html", agent="sage")
    except Exception as e:
        print(f"Error rendering index: {e}")
        return f"Error loading page: {str(e)}", 500


@app.route("/student-login")
def student_login():
    try:
        return render_template("student_login.html")
    except Exception as e:
        app.logger.error(f"Error rendering student login: {e}")
        return "Student login temporarily unavailable", 500


@app.route("/student")
def student_interface():
    return render_template("student_interface.html")


@app.route("/student-goodbye")
def student_goodbye():
    return render_template("student_goodbye.html")


@app.route("/dashboard")
def teacher_dashboard():
    return render_template("teacher_dashboard.html")


@app.route('/api/<agent_name>', methods=['POST'])
def agent_endpoint(agent_name):
    try:
        # Get JSON data with better error handling
        try:
            data = request.get_json(force=True)
            if data is None:
                return jsonify({"error": "No JSON data provided"}), 400
        except Exception as json_error:
            app.logger.error(f"JSON parsing error: {json_error}")
            return jsonify({"error": "Invalid JSON format"}), 400

        

        # Validate and sanitize input
        message = data.get('message', '')
        subject = data.get('subject', 'general')
        task = data.get('task', 'homework')
        session_id = data.get('session_id', 'default-session')
        user_type = data.get('user_type', 'student')

        # Handle empty or whitespace-only messages
        if not message or not message.strip():
            return jsonify(
                {"response": "Please enter a message to get help! 📝"}), 200

        # Clean up the message - handle encoding issues
        message = str(message).strip()
        # Remove any problematic characters that might cause issues
        message = message.replace('\x00', '').replace('\ufffd', '')

        # Additional validation for meaningful content
        if len(message.replace(' ', '').replace('\t', '').replace('\n',
                                                                  '')) < 2:
            return jsonify({
                "response":
                "Please enter a meaningful message to get help! 📝"
            }), 200

        # Validate agent name
        valid_agents = [
            'sage', 'quill', 'lucaya', 'coral', 'echo', 'pineapple'
        ]
        if agent_name not in valid_agents:
            return jsonify({"error": f"Unknown agent: {agent_name}"}), 404

        # Log the incoming request with session info
        app.logger.info(
            f"Incoming request for agent {agent_name}: {{'message': '{message[:50]}...', 'subject': '{subject}', 'task': '{task}', 'session_id': '{session_id}'}}"
        )

        # Prepare payload with session information
        payload = {
            "subject": subject,
            "task": task,
            "session_id": session_id,
            "user_type": user_type
        }

        # Route to appropriate agent with session data
        try:
            if agent_name == 'sage':
                response = run_sage(message, payload)
            elif agent_name == 'quill':
                response = run_quill(message, payload)
            elif agent_name == 'lucaya':
                response = run_lucaya(message, payload)
            elif agent_name == 'coral':
                response = run_coral(message, payload)
            elif agent_name == 'echo':
                response = run_echo(message, payload)
            elif agent_name == 'pineapple':
                response = run_pineapple(message, payload)
        except Exception as agent_error:
            app.logger.error(f"Agent {agent_name} error: {str(agent_error)}")
            response = "I'm having trouble processing that request. Please try again or contact support if the issue persists."

        # Ensure response is valid
        if response is None:
            response = "I'm having trouble processing that request. Please try again."

        return jsonify({"response": response})

    except Exception as e:
        app.logger.error(
            f"Error processing request for {agent_name}: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/api/validate-student', methods=['POST'])
def validate_student():
    """Validate student login credentials"""
    try:
        data = request.get_json()
        student_id = data.get('student_id', '').strip()
        password = data.get('password', '').strip()

        if not student_id or not password:
            return jsonify({
                "success": False,
                "message": "Missing credentials"
            }), 400

        # Import and use Coral agent to validate credentials
        from agents.coral.agent import CoralAgent
        coral = CoralAgent()

        # Check if student exists and password matches
        for key, student in coral.student_accounts.items():
            if (student['student_id'].upper() == student_id.upper()
                    and student['password'] == password and student['active']):
                return jsonify({
                    "success": True,
                    "student_name": student['name'],
                    "grade": student['grade']
                })

        return jsonify({
            "success": False,
            "message": "Invalid credentials"
        }), 401

    except Exception as e:
        app.logger.error(f"Student validation error: {str(e)}")
        return jsonify({"success": False, "message": "Server error"}), 500


@app.route('/api/<agent_name>/session', methods=['POST'])
def session_endpoint(agent_name):
    """Handle session-related operations like loading conversation history"""
    try:
        data = request.get_json(force=True)
        action = data.get('action')
        session_id = data.get('session_id', 'default-session')

        valid_agents = [
            'sage', 'quill', 'lucaya', 'coral', 'echo', 'pineapple'
        ]
        if agent_name not in valid_agents:
            return jsonify({"error": f"Unknown agent: {agent_name}"}), 404

        if action == 'load_session':
            # Load conversation history from memory
            try:
                from core.memory_manager import MemoryManager
                memory_manager = MemoryManager()

                session_data = memory_manager.load_memory(
                    agent_name, session_id, "session")

                if session_data and 'conversation_history' in session_data:
                    return jsonify({
                        "conversation_history":
                        session_data['conversation_history'],
                        "session_id":
                        session_id,
                        "agent":
                        agent_name
                    })
                else:
                    return jsonify({
                        "conversation_history": [],
                        "session_id": session_id,
                        "agent": agent_name,
                        "message": "No previous session found"
                    })
            except Exception as memory_error:
                app.logger.error(f"Memory loading error: {str(memory_error)}")
                return jsonify({
                    "conversation_history": [],
                    "session_id": session_id,
                    "agent": agent_name,
                    "error": "Failed to load session history"
                })

        return jsonify({"error": "Unknown action"}), 400

    except Exception as e:
        app.logger.error(
            f"Error in session endpoint for {agent_name}: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/api/sessions/list', methods=['GET'])
def list_sessions():
    """List all available chat sessions from memory"""
    try:
        import os
        from core.memory_manager import MemoryManager
        
        memory_manager = MemoryManager()
        sessions = []
        
        # Scan memory directory for session files
        if os.path.exists(memory_manager.base_path):
            for filename in os.listdir(memory_manager.base_path):
                if filename.endswith('_session.json'):
                    try:
                        filepath = os.path.join(memory_manager.base_path, filename)
                        with open(filepath, 'r') as f:
                            session_data = json.load(f)
                            
                        # Extract session info
                        agent_name = session_data.get('agent_name', 'unknown')
                        session_id = session_data.get('session_id', 'unknown')
                        timestamp = session_data.get('timestamp', '')
                        
                        # Count messages
                        conversation_history = session_data.get('data', {}).get('conversation_history', [])
                        message_count = len(conversation_history)
                        
                        sessions.append({
                            'agent': agent_name,
                            'session_id': session_id,
                            'timestamp': timestamp,
                            'messages': message_count
                        })
                    except Exception as e:
                        app.logger.warning(f"Failed to read session file {filename}: {e}")
                        continue
        
        # Sort by timestamp (newest first)
        sessions.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'sessions': sessions,
            'count': len(sessions)
        })
        
    except Exception as e:
        app.logger.error(f"Error listing sessions: {str(e)}")
        return jsonify({"error": "Failed to list sessions"}), 500


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=3000)
