
document.addEventListener('DOMContentLoaded', function() {
  const chatWindow = document.getElementById('chat-window');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const agentSelect = document.getElementById('agent-select');

  // Event listeners
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Update dropdowns when agent changes
  agentSelect.addEventListener('change', updateDropdowns);

  // Initialize dropdowns for default agent
  updateDropdowns();
});

// Update dropdowns based on selected agent
function updateDropdowns() {
  const agentSelect = document.getElementById('agent-select');
  const subjectSelect = document.getElementById('subject-select');
  const taskSelect = document.getElementById('task-select');

  const selectedAgent = agentSelect.value;

  // Define agent-specific options
  const agentConfigs = {
    'lucaya': {
      defaultSubject: 'academic research',
      defaultTask: 'find sources',
      preferredSubjects: ['bahamian history', 'government', 'environment', 'literature', 'academic research'],
      preferredTasks: ['find sources', 'create outline', 'evaluate sources', 'citation help', 'topic exploration', 'literature review']
    },
    'sage': {
      defaultSubject: 'math',
      defaultTask: 'homework',
      preferredSubjects: ['math', 'science', 'english', 'history', 'bahamas studies'],
      preferredTasks: ['homework', 'quiz', 'study']
    },
    'quill': {
      defaultSubject: 'english',
      defaultTask: 'homework',
      preferredSubjects: ['english', 'math', 'science', 'history'],
      preferredTasks: ['homework', 'quiz']
    },
    'echo': {
      defaultSubject: 'english',
      defaultTask: 'study',
      preferredSubjects: ['english', 'literature', 'history'],
      preferredTasks: ['study', 'homework']
    },
    'nassau': {
      defaultSubject: 'bahamas studies',
      defaultTask: 'homework',
      preferredSubjects: ['bahamas studies', 'government', 'history'],
      preferredTasks: ['homework', 'study']
    },
    'pineapple': {
      defaultSubject: 'math',
      defaultTask: 'homework',
      preferredSubjects: ['math', 'science', 'english'],
      preferredTasks: ['homework']
    }
  };

  const config = agentConfigs[selectedAgent];
  if (config) {
    // Update subject if current selection isn't preferred for this agent
    if (!config.preferredSubjects.includes(subjectSelect.value)) {
      subjectSelect.value = config.defaultSubject;
    }

    // Update task if current selection isn't preferred for this agent
    if (!config.preferredTasks.includes(taskSelect.value)) {
      taskSelect.value = config.defaultTask;
    }

    console.log(`[DEBUG] Updated dropdowns for ${selectedAgent}: subject=${subjectSelect.value}, task=${taskSelect.value}`);
  }
}

async function sendMessage() {
  const agent = document.getElementById("agent-select").value;
  const subject = document.getElementById("subject-select").value.trim();
  const task = document.getElementById("task-select").value.trim();
  const input = document.getElementById("message-input").value.trim();
  const chatWindow = document.getElementById("chat-window");

  console.log("[DEBUG] sendMessage fired with:", {
    agent: agent,
    input: input,
    subject: subject,
    task: task
  });

  if (!input) {
    console.log("[DEBUG] Empty input, not sending");
    return;
  }

  // Add user message to chat
  const userMessage = document.createElement("div");
  userMessage.className = "message user-message";
  userMessage.innerHTML = `<strong>You:</strong> ${input}`;
  chatWindow.appendChild(userMessage);

  // Clear input
  document.getElementById("message-input").value = "";

  // Add loading indicator
  const loadingMessage = document.createElement("div");
  loadingMessage.className = "message agent-message loading";
  loadingMessage.innerHTML = `<strong>${agent.charAt(0).toUpperCase() + agent.slice(1)}:</strong> <em>Thinking...</em>`;
  chatWindow.appendChild(loadingMessage);

  // Scroll to bottom
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const response = await fetch(`/api/${agent}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: input,
        subject: subject,
        task: task
      }),
    });

    const data = await response.json();

    // Remove loading indicator
    chatWindow.removeChild(loadingMessage);

    // Add agent response
    const agentMessage = document.createElement("div");
    agentMessage.className = "message agent-message";
    
    if (data.error) {
      agentMessage.innerHTML = `<strong>${agent.charAt(0).toUpperCase() + agent.slice(1)}:</strong> <span class="error">Sorry, I encountered an error: ${data.error}</span>`;
    } else {
      // Convert markdown-style formatting to HTML
      let formattedResponse = data.response
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
      
      agentMessage.innerHTML = `<strong>${agent.charAt(0).toUpperCase() + agent.slice(1)}:</strong> ${formattedResponse}`;
    }
    
    chatWindow.appendChild(agentMessage);

  } catch (error) {
    console.error("[UI ERROR]", error);
    
    // Remove loading indicator
    if (chatWindow.contains(loadingMessage)) {
      chatWindow.removeChild(loadingMessage);
    }

    // Add error message
    const errorMessage = document.createElement("div");
    errorMessage.className = "message agent-message error";
    errorMessage.innerHTML = `<strong>${agent.charAt(0).toUpperCase() + agent.slice(1)}:</strong> <span class="error">Sorry, I'm having trouble connecting right now. Please try again.</span>`;
    chatWindow.appendChild(errorMessage);
  }

  // Scroll to bottom
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
