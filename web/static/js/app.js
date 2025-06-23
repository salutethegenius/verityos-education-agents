// Update dropdowns based on selected agent
function updateDropdowns() {
  const agentSelect = document.getElementById('agent-select');
  const subjectSelect = document.getElementById('subject-select');
  const taskSelect = document.getElementById('task-select');

  const selectedAgent = agentSelect.value;

  if (selectedAgent === 'lucaya') {
    // Show research-focused options for Lucaya
    const researchSubjects = [
      'bahamian history', 'government', 'environment', 'literature', 'academic research'
    ];
    const researchTasks = [
      'find sources', 'create outline', 'evaluate sources', 'citation help', 'topic exploration', 'literature review'
    ];

    // Set default research subject if currently on generic subject
    if (!researchSubjects.includes(subjectSelect.value)) {
      subjectSelect.value = 'academic research';
    }

    // Set default research task if currently on generic task
    if (!researchTasks.includes(taskSelect.value)) {
      taskSelect.value = 'find sources';
    }
  }
}

// Add event listener for agent selection change
document.addEventListener('DOMContentLoaded', function() {
  const agentSelect = document.getElementById('agent-select');
  if (agentSelect) {
    agentSelect.addEventListener('change', updateDropdowns);
  }
});

function sendMessage() {
  const agent = document.getElementById("agent-select").value;
  const subject = document.getElementById("subject-select").value.trim();
  const task = document.getElementById("task-select").value.trim();
  const input = document.getElementById("user-input").value.trim();
  const responseBox = document.getElementById("chat-box");

  console.log("[DEBUG] sendMessage fired with:", { agent, input, subject, task });

  if (!responseBox) {
    console.error("[ERROR] responseBox element not found in DOM.");
    return;
  }

  if (!input) {
    responseBox.innerHTML += `<div class="error">⚠️ Please enter a question.</div>`;
    return;
  }

  // Clear previous error messages
  document.getElementById("user-input").value = "";

  responseBox.innerHTML += `<div class="system">⏳ Thinking...</div>`;

  try {
    const res = await fetch(`/api/${agent}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, subject, task })
    });

    if (!res.ok) {
      throw new Error(`Server responded with status ${res.status}`);
    }

    const data = await res.json();

    responseBox.innerHTML += `<div class="user">You: ${input}</div>`;

    if (data.error) {
      responseBox.innerHTML += `<div class="error">❌ ${data.error}</div>`;
    } else {
      responseBox.innerHTML += `<div class="agent">Agent: ${(data.response || "⚠️ No response").replace(/\n/g, "<br>")}</div>`;
    }
    responseBox.scrollTop = responseBox.scrollHeight;
  } catch (err) {
    console.error("[UI ERROR]", err);
    responseBox.innerHTML += `<div class="error">❌ Error: ${err.message}</div>`;
  }
}

// Add event listener for Enter key in the input field
document.addEventListener("DOMContentLoaded", function() {
  const inputField = document.getElementById("user-input");
  if (inputField) {
    inputField.addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
      }
    });
  } else {
    console.error("[ERROR] user-input element not found when setting up event listener");
  }
});