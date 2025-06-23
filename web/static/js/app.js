
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
      subjects: [
        { value: 'bahamian history', text: 'Bahamian History & Culture' },
        { value: 'government', text: 'Government & Civics' },
        { value: 'environment', text: 'Environment & Marine Science' },
        { value: 'literature', text: 'Literature & Language Arts' },
        { value: 'academic research', text: 'General Academic Research' }
      ],
      tasks: [
        { value: 'find sources', text: 'Find Sources' },
        { value: 'create outline', text: 'Create Outline' },
        { value: 'evaluate sources', text: 'Evaluate Sources' },
        { value: 'citation help', text: 'Citation Help' },
        { value: 'topic exploration', text: 'Topic Exploration' },
        { value: 'literature review', text: 'Literature Review' }
      ]
    },
    'sage': {
      defaultSubject: 'math',
      defaultTask: 'homework',
      subjects: [
        { value: 'math', text: 'Math' },
        { value: 'science', text: 'Science' },
        { value: 'english', text: 'English' },
        { value: 'history', text: 'History' },
        { value: 'bahamas studies', text: 'Bahamas Studies' }
      ],
      tasks: [
        { value: 'homework', text: 'Homework' },
        { value: 'quiz', text: 'Quiz' },
        { value: 'study', text: 'Study' }
      ]
    },
    'quill': {
      defaultSubject: 'english',
      defaultTask: 'homework',
      subjects: [
        { value: 'english', text: 'English' },
        { value: 'math', text: 'Math' },
        { value: 'science', text: 'Science' },
        { value: 'history', text: 'History' }
      ],
      tasks: [
        { value: 'homework', text: 'Homework' },
        { value: 'quiz', text: 'Quiz' }
      ]
    },
    'echo': {
      defaultSubject: 'english',
      defaultTask: 'study',
      subjects: [
        { value: 'english', text: 'English' },
        { value: 'literature', text: 'Literature' },
        { value: 'history', text: 'History' }
      ],
      tasks: [
        { value: 'study', text: 'Study' },
        { value: 'homework', text: 'Homework' }
      ]
    },
    'nassau': {
      defaultSubject: 'bahamas studies',
      defaultTask: 'homework',
      subjects: [
        { value: 'bahamas studies', text: 'Bahamas Studies' },
        { value: 'government', text: 'Government' },
        { value: 'history', text: 'History' }
      ],
      tasks: [
        { value: 'homework', text: 'Homework' },
        { value: 'study', text: 'Study' }
      ]
    },
    'pineapple': {
      defaultSubject: 'math',
      defaultTask: 'homework',
      subjects: [
        { value: 'math', text: 'Math' },
        { value: 'science', text: 'Science' },
        { value: 'english', text: 'English' }
      ],
      tasks: [
        { value: 'homework', text: 'Homework' }
      ]
    }
  };

  const config = agentConfigs[selectedAgent];
  if (config) {
    // Clear existing options
    subjectSelect.innerHTML = '';
    taskSelect.innerHTML = '';

    // Populate subject options
    config.subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject.value;
      option.textContent = subject.text;
      subjectSelect.appendChild(option);
    });

    // Populate task options
    config.tasks.forEach(task => {
      const option = document.createElement('option');
      option.value = task.value;
      option.textContent = task.text;
      taskSelect.appendChild(option);
    });

    // Set default values
    subjectSelect.value = config.defaultSubject;
    taskSelect.value = config.defaultTask;

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
