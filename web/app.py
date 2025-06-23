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

@app.route("/api/<agent>", methods=["POST"])
def api_agent(agent):
    data = request.json or {}
    message = data.get("message", "").strip()
    
    logger.info(f"Incoming request for agent {agent}: {data}")

    # Validate input
    if not message:
        return jsonify({"error": "Message cannot be empty"}), 400
    
    # Apply safety filter to input
    is_safe, safety_message = safety_filter.validate_student_input(message)
    if not is_safe:
        return jsonify({"error": safety_message}), 400

    run_map = {
        "sage": run_sage,
        "quill": run_quill,
        "echo": run_echo,
        "lucaya": run_lucaya,
        "nassau": run_nassau,
        "pineapple": run_pineapple
    }

    if agent not in run_map:
        return jsonify({"error": f"Unknown agent: {agent}"}), 400

    try:
        # Get response from agent
        response = run_map[agent](message, data)
        
        # Apply safety filter to output
        if response:
            filtered_response, _ = safety_filter.filter_content(
                response, 
                safety_level="moderate",
                grade_level="middle"
            )
            return jsonify({"response": filtered_response})
        else:
            return jsonify({"error": "Agent returned empty response"}), 500
            
    except Exception as e:
        logger.error(f"Error in agent {agent}: {str(e)}")
        return jsonify({"error": "An error occurred while processing your request"}), 500

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=3000)