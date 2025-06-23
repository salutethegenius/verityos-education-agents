async function sendMessage() {
  const input = document.getElementById("user-input").value.trim();
  const agent = document.getElementById("agent-select").value;
  const subject = document.getElementById("subject-select").value.trim();
  const task = document.getElementById("task-select").value.trim();
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
