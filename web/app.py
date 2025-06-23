from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from agents.sage.agent import run_agent as run_sage
from agents.quill.agent import run_agent as run_quill
from agents.echo.agent import run_agent as run_echo
from agents.lucaya.agent import run_agent as run_lucaya
from agents.nassau.agent import run_agent as run_nassau
from agents.pineapple.agent import run_agent as run_pineapple

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return render_template("agent_interface.html", agent="sage")

@app.route("/api/<agent>", methods=["POST"])
def api_agent(agent):
    data = request.json or {}
    print(f"[DEBUG] Incoming data for agent {agent}: {data}")

    run_map = {
        "sage": run_sage,
        "quill": run_quill,
        "echo": run_echo,
        "lucaya": run_lucaya,
        "nassau": run_nassau,
        "pineapple": run_pineapple
    }

    if agent in run_map:
        try:
            response = run_map[agent](data.get("message", ""), data)
            return jsonify({"response": response})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return jsonify({"response": f"Unknown agent: {agent}"}), 400

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=3000)