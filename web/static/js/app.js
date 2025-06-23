// Session management
let currentSessionId = null;
let currentAgent = null;
let conversationHistory = {};
let chatSessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
let currentChatIndex = -1;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DEBUG] DOM loaded, initializing...');

    try {
        updateDropdowns();

        // Add event listeners with error handling
        const sendButton = document.getElementById('send-button');
        const messageInput = document.getElementById('message-input');
        const agentSelect = document.getElementById('agent-select');
        const newChatBtn = document.getElementById('new-chat-btn');

        if (sendButton) {
            sendButton.addEventListener('click', sendMessage);
        }

        if (messageInput) {
            // Auto-expand textarea as user types
            messageInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            });

            messageInput.addEventListener('keydown', function(event) {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                } else if (event.key === 'Enter' && event.shiftKey) {
                    // Allow shift+enter for new lines
                    return;
                }
            });
        }

        if (agentSelect) {
            agentSelect.addEventListener('change', function() {
                console.log('[DEBUG] Agent changed to:', this.value);
                try {
                    const newAgent = this.value;
                    if (newAgent !== currentAgent) {
                        // Start fresh conversation when switching agents
                        currentAgent = newAgent;
                        updateDropdowns();
                        startNewChat(); // This will create a new chat with the new agent
                    }
                } catch (error) {
                    console.error('[ERROR] Failed to update agent:', error);
                }
            });
        }

        if (newChatBtn) {
            newChatBtn.addEventListener('click', startNewChat);
        }

        // Add temperature slider functionality
        const temperatureSlider = document.getElementById('temperature-slider');
        const temperatureValue = document.getElementById('temperature-value');

        if (temperatureSlider && temperatureValue) {
            temperatureSlider.addEventListener('input', function() {
                temperatureValue.textContent = this.value;
            });
        }

        // Initialize session management
        if (!currentSessionId) {
            currentSessionId = generateSessionId();
        }
        currentAgent = 'sage';

        // Load chat history sidebar
        loadChatHistorySidebar();

        // Load initial session or create new one
        if (chatSessions.length === 0) {
            startNewChat();
        } else {
            loadChatSession(0);
        }

    } catch (error) {
        console.error('[ERROR] Failed to initialize:', error);
    }
});

function generateSessionId() {
  return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function startNewChat() {
  // Save current chat if it exists
  if (currentChatIndex >= 0) {
    saveChatSession();
  }

  // Get current agent from dropdown if available
  const agentSelect = document.getElementById('agent-select');
  const selectedAgent = agentSelect ? agentSelect.value : 'sage';
  currentAgent = selectedAgent;

  // Create new chat session
  const newChat = {
    id: generateSessionId(),
    agent: currentAgent,
    title: 'New Chat',
    lastMessage: '',
    timestamp: new Date().toISOString(),
    messages: []
  };

  chatSessions.unshift(newChat);
  currentChatIndex = 0;
  currentSessionId = newChat.id;

  // Clear chat window
  const chatWindow = document.getElementById('chat-window');
  chatWindow.innerHTML = '';

  // Show welcome message
  const welcomeMessage = document.createElement('div');
  welcomeMessage.className = 'message agent-message';
  welcomeMessage.innerHTML = `<strong>${currentAgent.charAt(0).toUpperCase() + currentAgent.slice(1)}:</strong> Welcome! I'm ready to help you with your studies. How can I assist you today?`;
  chatWindow.appendChild(welcomeMessage);

  // Update sidebar
  loadChatHistorySidebar();

  console.log('[DEBUG] Started new chat:', newChat.id);
}

function loadChatSession(index) {
  if (index < 0 || index >= chatSessions.length) return;

  // Save current chat first
  if (currentChatIndex >= 0) {
    saveChatSession();
  }

  const chat = chatSessions[index];
  currentChatIndex = index;
  currentSessionId = chat.id;
  currentAgent = chat.agent;

  // Update agent selector
  const agentSelect = document.getElementById('agent-select');
  if (agentSelect) {
    agentSelect.value = currentAgent;
    updateDropdowns();
  }

  // Load chat messages
  const chatWindow = document.getElementById('chat-window');
  chatWindow.innerHTML = '';

  if (chat.messages && chat.messages.length > 0) {
    chat.messages.forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = msg.className;
      messageDiv.innerHTML = msg.content;
      chatWindow.appendChild(messageDiv);
    });
  } else {
    // Show welcome message for empty chats
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'message agent-message';
    welcomeMessage.innerHTML = `<strong>${currentAgent.charAt(0).toUpperCase() + currentAgent.slice(1)}:</strong> Welcome! I'm ready to help you with your studies. How can I assist you today?`;
    chatWindow.appendChild(welcomeMessage);
  }

  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Update sidebar highlighting
  loadChatHistorySidebar();

  console.log('[DEBUG] Loaded chat session:', chat.id);
}

function saveChatSession() {
  if (currentChatIndex < 0 || currentChatIndex >= chatSessions.length) return;

  const chatWindow = document.getElementById('chat-window');
  const messages = Array.from(chatWindow.children);

  const chat = chatSessions[currentChatIndex];
  chat.messages = messages.map(msg => ({
    content: msg.innerHTML,
    className: msg.className
  }));

  // Update title and last message
  if (messages.length > 1) {
    const lastUserMessage = messages.reverse().find(msg => 
      msg.className.includes('user-message')
    );
    if (lastUserMessage) {
      const messageText = lastUserMessage.textContent.replace('You:', '').trim();
      chat.title = messageText.length > 30 ? 
        messageText.substring(0, 30) + '...' : messageText;
      chat.lastMessage = messageText;
    }
  }

  chat.timestamp = new Date().toISOString();

  // Save to localStorage
  localStorage.setItem('chatSessions', JSON.stringify(chatSessions));

  console.log('[DEBUG] Saved chat session:', chat.id);
}

function loadChatHistorySidebar() {
  const historyList = document.getElementById('chat-history-list');
  if (!historyList) return;

  historyList.innerHTML = '';

  chatSessions.forEach((chat, index) => {
    const chatItem = document.createElement('div');
    chatItem.className = `chat-history-item ${index === currentChatIndex ? 'active' : ''}`;

    const agentName = chat.agent.charAt(0).toUpperCase() + chat.agent.slice(1);
    const date = new Date(chat.timestamp).toLocaleDateString();

    chatItem.innerHTML = `
      <div class="chat-title">${chat.title || 'New Chat'}</div>
      <div class="chat-preview">${chat.lastMessage || 'No messages yet'}</div>
      <div class="chat-meta">${agentName} • ${date}</div>
    `;

    chatItem.addEventListener('click', () => loadChatSession(index));
    historyList.appendChild(chatItem);
  });
}

function switchAgent() {
  const agentSelect = document.getElementById('agent-select');
  const newAgent = agentSelect.value;

  // Check if agent is disabled (like Quill)
  const selectedOption = agentSelect.options[agentSelect.selectedIndex];
  if (selectedOption.disabled) {
    console.log('[DEBUG] Cannot switch to disabled agent:', newAgent);
    // Revert to previous agent
    agentSelect.value = currentAgent;
    return;
  }

  if (newAgent !== currentAgent) {
    // Save current conversation for old agent
    if (currentAgent) {
      saveConversationState(currentAgent);
    }

    // Switch to new agent
    const previousAgent = currentAgent;
    currentAgent = newAgent;

    // Load conversation history for new agent
    loadSessionHistory(newAgent);

    console.log(`[SESSION] Switched from ${previousAgent} to agent: ${newAgent}, session: ${currentSessionId}`);
  }
}

function saveConversationState(agent) {
  const chatWindow = document.getElementById('chat-window');
  const messages = Array.from(chatWindow.children);

  conversationHistory[agent] = messages.map(msg => ({
    content: msg.innerHTML,
    className: msg.className
  }));

  console.log(`[SESSION] Saved conversation state for ${agent}: ${conversationHistory[agent].length} messages`);
}

async function loadSessionHistory(agent) {
  const chatWindow = document.getElementById('chat-window');

  // Clear current chat
  chatWindow.innerHTML = '';

  // Check if we have local conversation history first
  if (conversationHistory[agent] && conversationHistory[agent].length > 0) {
    // Restore from local storage
    conversationHistory[agent].forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = msg.className;
      messageDiv.innerHTML = msg.content;
      chatWindow.appendChild(messageDiv);
    });

    console.log(`[SESSION] Loaded ${conversationHistory[agent].length} messages from local history for ${agent}`);

    // Scroll to bottom and return early to avoid server call
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return;
  } else {
    // Only load from server if no local history exists
    try {
      const response = await fetch(`/api/${agent}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'load_session',
          session_id: currentSessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.conversation_history && data.conversation_history.length > 0) {
          // Convert server history to local format and store it
          const localHistory = [];

          data.conversation_history.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.role === 'user' ? 'user-message' : 'agent-message'}`;

            if (msg.role === 'user') {
              messageDiv.innerHTML = `<strong>You:</strong> ${msg.content}`;
            } else {
              messageDiv.innerHTML = `<strong>${agent.charAt(0).toUpperCase() + agent.slice(1)}:</strong> ${msg.content}`;
            }

            chatWindow.appendChild(messageDiv);

            // Store in local history for future switches
            localHistory.push({
              content: messageDiv.innerHTML,
              className: messageDiv.className
            });
          });

          // Save to local conversation history
          conversationHistory[agent] = localHistory;

          console.log(`[SESSION] Loaded ${data.conversation_history.length} messages from server memory for ${agent}`);
        }
      }
    } catch (error) {
      console.log(`[SESSION] No previous session found for ${agent}, starting fresh`);
    }

    // Show welcome message if no history
    if (chatWindow.children.length === 0) {
      const welcomeMessage = document.createElement('div');
      welcomeMessage.className = 'message agent-message';
      welcomeMessage.innerHTML = `<strong>${agent.charAt(0).toUpperCase() + agent.slice(1)}:</strong> Welcome! I'm ready to help you with your studies. How can I assist you today?`;
      chatWindow.appendChild(welcomeMessage);

      // Store welcome message in local history
      conversationHistory[agent] = [{
        content: welcomeMessage.innerHTML,
        className: welcomeMessage.className
      }];
    }
  }

  // Scroll to bottom
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

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
    'coral': {
      defaultSubject: 'administration',
      defaultTask: 'manage class',
      subjects: [
        { value: 'administration', text: 'Class Administration' },
        { value: 'attendance', text: 'Attendance Management' },
        { value: 'scheduling', text: 'Schedule Planning' },
        { value: 'student records', text: 'Student Records' },
        { value: 'reporting', text: 'Academic Reporting' }
      ],
      tasks: [
        { value: 'manage class', text: 'Manage Class' },
        { value: 'take attendance', text: 'Take Attendance' },
        { value: 'create schedule', text: 'Create Schedule' },
        { value: 'student progress', text: 'Track Student Progress' },
        { value: 'generate report', text: 'Generate Reports' }
      ]
    },
    'pineapple': {
      defaultSubject: 'all subjects',
      defaultTask: 'track assignments',
      subjects: [
        { value: 'all subjects', text: 'All Subjects' },
        { value: 'mathematics', text: 'Mathematics' },
        { value: 'english', text: 'English Language' },
        { value: 'science', text: 'Science' },
        { value: 'history', text: 'Bahamian History' },
        { value: 'geography', text: 'Geography' }
      ],
      tasks: [
        { value: 'track assignments', text: 'Track Assignments' },
        { value: 'view schedule', text: 'View Study Schedule' },
        { value: 'update progress', text: 'Update Progress' },
        { value: 'add homework', text: 'Add New Homework' },
        { value: 'get tips', text: 'Get Study Tips' },
        { value: 'view completed', text: 'View Completed Work' }
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

function addMessage(message, type) {
    const chatWindow = document.getElementById('chat-window');
    const messageDiv = document.createElement('div');

    // Format message content - convert markdown-style formatting to HTML
    let formattedMessage = formatMessageContent(message);

    if (type === 'user') {
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `<strong>You:</strong> ${formattedMessage}`;
    } else if (type === 'bot' || type === 'agent') {
        messageDiv.className = 'message agent-message';
        const agentName = currentAgent ? currentAgent.charAt(0).toUpperCase() + currentAgent.slice(1) : 'Agent';
        messageDiv.innerHTML = `<strong>${agentName}:</strong> ${formattedMessage}`;
    } else if (type === 'error') {
        messageDiv.className = 'message error-message';
        messageDiv.innerHTML = `<strong>Error:</strong> ${formattedMessage}`;
    }

    chatWindow.appendChild(messageDiv);

    // Update local conversation history
    if (currentAgent) {
        if (!conversationHistory[currentAgent]) {
            conversationHistory[currentAgent] = [];
        }
        conversationHistory[currentAgent].push({
            content: messageDiv.innerHTML,
            className: messageDiv.className
        });
    }

    // Save current chat session
    saveChatSession();

    // Update sidebar
    loadChatHistorySidebar();

    // Smooth auto-scroll to bottom with delay
    setTimeout(() => {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 100);

    console.log(`[DEBUG] Added ${type} message: ${message.substring(0, 50)}...`);
}

function formatMessageContent(message) {
    if (!message) return '';

    // Convert markdown-style formatting to HTML
    let formatted = message
        // Convert **bold** to <strong>bold</strong>
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert bullet points (• or -) to proper list items
        .replace(/^[•\-]\s+(.+)$/gm, '<li>$1</li>')
        // Convert numbered lists
        .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
        // Convert headers (###, ##, #)
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^# (.+)$/gm, '<h2>$1</h2>')
        // Convert line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Wrap consecutive list items in ul tags
    formatted = formatted.replace(/(<li>.*<\/li>(?:\s*<li>.*<\/li>)*)/gs, '<ul>$1</ul>');

    // Wrap content in paragraphs if it doesn't start with a tag
    if (!formatted.startsWith('<')) {
        formatted = '<p>' + formatted + '</p>';
    }

    return formatted;
}

// Alias for backward compatibility
function loadAgentSession(agent) {
    console.log(`[DEBUG] loadAgentSession called for ${agent}`);
    loadSessionHistory(agent);
}

async function sendMessage() {
    try {
        const messageInput = document.getElementById('message-input');
        const agentSelect = document.getElementById('agent-select');
        const subjectSelect = document.getElementById('subject-select');
        const taskSelect = document.getElementById('task-select');
        const chatWindow = document.getElementById('chat-window');

        if (!messageInput || !agentSelect || !subjectSelect || !taskSelect) {
            console.error('[ERROR] Missing required elements');
            return;
        }

        const rawMessage = messageInput.value;
        const message = rawMessage.trim();
        const agent = agentSelect.value;
        const subject = subjectSelect.value;
        const task = taskSelect.value;

        console.log('[DEBUG] ===== ADMIN SEND MESSAGE CALLED =====');
        console.log('[DEBUG] sendMessage fired with:', {
            agent: agent,
            input: message,
            rawInput: `"${rawMessage}"`,
            subject: subject,
            task: task,
            messageLength: message.length,
            rawLength: rawMessage.length
        });

        // Don't send empty messages or messages with only whitespace
        if (!message || message.trim().length === 0 || message.replace(/\s+/g, '').length === 0) {
            console.log('[DEBUG] Empty or whitespace-only message, not sending');
            console.log('[DEBUG] Message validation failed:', {
                truthyCheck: !!message,
                trimLengthCheck: message.trim().length > 0,
                whitespaceCheck: message.replace(/\s+/g, '').length > 0
            });
            messageInput.focus(); // Refocus the input
            return;
        }
        
        // Validate message contains actual content
        if (message.replace(/[^a-zA-Z0-9\s]/g, '').trim().length === 0) {
            console.log('[DEBUG] Message contains no meaningful content');
            addMessage('Please enter a meaningful question or message.', 'error');
            messageInput.focus();
            return;
        }

        // Prevent double-clicking send button
        const sendButton = document.getElementById('send-button');
        if (sendButton && sendButton.disabled) {
            console.log('[DEBUG] Send button already disabled, preventing duplicate send');
            return;
        }
        if (sendButton) {
            sendButton.disabled = true;
            sendButton.style.opacity = '0.6';
            sendButton.style.cursor = 'not-allowed';
        }

        // Update current agent and generate new session if needed
        if (agent !== currentAgent) {
            currentAgent = agent;
            if (!currentSessionId) {
                currentSessionId = generateSessionId();
            }
            console.log(`[DEBUG] Agent switched to ${agent}, session: ${currentSessionId}`);
        }

        // Add user message to chat
        addMessage(message, 'user');
        messageInput.value = '';
        messageInput.style.height = 'auto'; // Reset height after sending

        // Collect AI settings
        const temperature = document.getElementById('temperature-slider')?.value || 7;
        const responseLength = document.getElementById('response-length')?.value || 'medium';
        const focusMode = document.getElementById('focus-mode')?.value || 'educational';
        const explanationStyle = document.getElementById('explanation-style')?.value || 'standard';
        const bahamianContext = document.getElementById('bahamian-context')?.checked || true;
        const stepByStep = document.getElementById('step-by-step')?.checked || true;

        // Send to backend
        fetch(`/api/${agent}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                subject: subject,
                task: task,
                session_id: currentSessionId,
                user_type: 'student',
                ai_settings: {
                    temperature: parseFloat(temperature) / 10, // Convert to 0-1 range
                    response_length: responseLength,
                    focus_mode: focusMode,
                    explanation_style: explanationStyle,
                    bahamian_context: bahamianContext,
                    step_by_step: stepByStep
                }
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                addMessage(`Error: ${data.error}`, 'error');
            } else {
                addMessage(data.response, 'bot');
            }
        })
        .catch(error => {
            console.error('[ERROR] Fetch failed:', error);
            addMessage('Sorry, I encountered an error. Please try again.', 'error');
        })
        .finally(() => {
            // Re-enable send button with proper styling
            const sendButton = document.getElementById('send-button');
            if (sendButton) {
                sendButton.disabled = false;
                sendButton.style.opacity = '1';
                sendButton.style.cursor = 'pointer';
            }
        });

    } catch (error) {
        console.error('[UI ERROR]', error);
        addMessage('Sorry, something went wrong. Please refresh the page.', 'error');
    }
}

function addChatToHistory(agent, sessionId, firstMessage) {
        try {
            let history = JSON.parse(localStorage.getItem('chatHistory') || '[]');

            // Check if this session already exists
            const existingIndex = history.findIndex(chat => 
                chat.agent === agent && chat.sessionId === sessionId
            );

            if (existingIndex === -1) {
                const newChat = {
                    agent: agent,
                    sessionId: sessionId,
                    title: firstMessage.length > 25 ? firstMessage.substring(0, 25) + '...' : firstMessage,
                    timestamp: new Date().toLocaleString(),
                    messageCount: 1
                };
                history.unshift(newChat);

                // Keep only last 15 chats
                history = history.slice(0, 15);
                localStorage.setItem('chatHistory', JSON.stringify(history));
                updateChatHistorySidebar();
            }
        } catch (e) {
            console.error('Error saving chat history:', e);
        }
    }