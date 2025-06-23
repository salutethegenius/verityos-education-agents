from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from agents.sage.agent import run_agent as run_sage
from agents.quill.agent import run_agent as run_quill
from agents.echo.agent import run_agent as run_echo
from agents.lucaya.agent import run_agent as run_lucaya
from agents.nassau.agent import run_agent as run_nassau
from agents.pineapple.agent import run_agent as run_pineapple
from utils.safety_filters import SafetyFilter
import logging

app = Flask(__name__)
CORS(app)

# Initialize safety filter
safety_filter = SafetyFilter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route("/")
def index():
    return render_template("agent_interface.html", agent="sage")

@app.route('/api/<agent_name>', methods=['POST'])
def agent_endpoint(agent_name):
    try:
        # Get JSON data with better error handling
        try:
            data = request.get_json(force=True)
        except Exception as json_error:
            app.logger.error(f"JSON parsing error: {json_error}")
            return jsonify({"error": "Invalid JSON format"}), 400

        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        # Validate and sanitize input
        message = data.get('message', '')
        subject = data.get('subject', 'general')
        task = data.get('task', 'homework')
        session_id = data.get('session_id', 'default-session')
        user_type = data.get('user_type', 'student')

        # Handle empty or whitespace-only messages
        if not message or not message.strip():
            message = ""
        else:
            # Clean up the message - handle encoding issues
            message = str(message).strip()
            # Remove any problematic characters that might cause issues
            message = message.replace('\x00', '').replace('\ufffd', '')

        # Validate agent name
        valid_agents = ['sage', 'quill', 'lucaya', 'nassau', 'echo', 'pineapple']
        if agent_name not in valid_agents:
            return jsonify({"error": f"Unknown agent: {agent_name}"}), 404

        # Log the incoming request with session info
        app.logger.info(f"Incoming request for agent {agent_name}: {{'message': '{message}', 'subject': '{subject}', 'task': '{task}', 'session_id': '{session_id}'}}")

        # Prepare payload with session information
        payload = {
            "subject": subject, 
            "task": task, 
            "session_id": session_id, 
            "user_type": user_type
        }

        # Route to appropriate agent with session data
        if agent_name == 'sage':
            from agents.sage.agent import run_agent
            response = run_agent(message, payload)
        elif agent_name == 'quill':
            from agents.quill.agent import run_agent
            response = run_agent(message, payload)
        elif agent_name == 'lucaya':
            from agents.lucaya.agent import run_agent
            response = run_agent(message, payload)
        elif agent_name == 'nassau':
            from agents.nassau.agent import run_agent
            response = run_agent(message, payload)
        elif agent_name == 'echo':
            from agents.echo.agent import run_agent
            response = run_agent(message, payload)
        elif agent_name == 'pineapple':
            from agents.pineapple.agent import run_agent
            response = run_agent(message, payload)

        # Ensure response is valid
        if response is None:
            response = "I'm having trouble processing that request. Please try again."

        return jsonify({"response": response})

    except Exception as e:
        app.logger.error(f"Error processing request for {agent_name}: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/<agent_name>/session', methods=['POST'])
def session_endpoint(agent_name):
    """Handle session-related operations like loading conversation history"""
    try:
        data = request.get_json(force=True)
        action = data.get('action')
        session_id = data.get('session_id', 'default-session')

        valid_agents = ['sage', 'quill', 'lucaya', 'nassau', 'echo', 'pineapple']
        if agent_name not in valid_agents:
            return jsonify({"error": f"Unknown agent: {agent_name}"}), 404

        if action == 'load_session':
            # Load conversation history from memory
            from core.memory_manager import MemoryManager
            memory_manager = MemoryManager()
            
            session_data = memory_manager.load_memory(agent_name, session_id, "session")
            
            if session_data and 'conversation_history' in session_data:
                return jsonify({
                    "conversation_history": session_data['conversation_history'],
                    "session_id": session_id,
                    "agent": agent_name
                })
            else:
                return jsonify({
                    "conversation_history": [],
                    "session_id": session_id,
                    "agent": agent_name,
                    "message": "No previous session found"
                })

        return jsonify({"error": "Unknown action"}), 400

    except Exception as e:
        app.logger.error(f"Error in session endpoint for {agent_name}: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=3000)