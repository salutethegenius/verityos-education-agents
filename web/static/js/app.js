// Session management
let appInitialized = false;
let currentSessionId = null;
let currentAgent = 'sage';
let conversationHistory = {};
let chatSessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
let currentChatIndex = -1;

// Generate unique session ID
function generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize session - prevent duplicate sessions
function initializeSession() {
    // Only create session if none exists
    if (!currentSessionId && chatSessions.length === 0) {
        currentSessionId = generateSessionId();
        console.log('[DEBUG] Initial session created:', currentSessionId);
    } else if (chatSessions.length > 0) {
        currentSessionId = chatSessions[0].id;
        console.log('[DEBUG] Using existing session:', currentSessionId);
    }
}

// Initialize when page loads - single initialization only
document.addEventListener('DOMContentLoaded', function() {
    // Strong protection against multiple calls
    if (appInitialized || document.body.hasAttribute('data-app-initialized') || window.appAlreadyLoaded) {
        console.log('[DEBUG] App already initialized, skipping...');
        return;
    }

    console.log('[DEBUG] DOM loaded, initializing...');
    appInitialized = true;
    window.appAlreadyLoaded = true;
    document.body.setAttribute('data-app-initialized', 'true');

    try {
        initializeSession();
        updateDropdowns();
        initializeEventListeners();
        initializeTemperatureSlider();
        loadChatHistorySidebar();
        
        // Only load chat session if we have sessions, otherwise start new
        if (chatSessions.length > 0) {
            loadChatSession(0);
        } else {
            startNewChat();
        }
    } catch (error) {
        console.error('[ERROR] Failed to initialize app:', error);
    }
});

// Stop any remaining Radix UI initialization
if (window.RadixUI) {
    delete window.RadixUI;
}
if (window.Radix) {
    delete window.Radix;
}

function initializeEventListeners() {
    // Check if already initialized to prevent duplicate listeners
    if (document.body.hasAttribute('data-events-initialized')) {
        console.log('[DEBUG] Event listeners already initialized, skipping...');
        return;
    }

    const sendButton = document.getElementById('send-button');
    const messageInput = document.getElementById('message-input');
    const agentSelect = document.getElementById('agent-select');
    const newChatBtn = document.getElementById('new-chat-btn');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    // Use { once: false } to prevent duplicate listeners but allow proper cleanup
    if (sendButton && !sendButton.hasAttribute('data-listener-added')) {
        sendButton.addEventListener('click', sendMessage);
        sendButton.setAttribute('data-listener-added', 'true');
    }

    if (messageInput && !messageInput.hasAttribute('data-listeners-added')) {
        messageInput.addEventListener('input', handleTextareaResize);
        messageInput.addEventListener('keydown', handleKeydown);
        messageInput.setAttribute('data-listeners-added', 'true');
    }

    if (agentSelect && !agentSelect.hasAttribute('data-listener-added')) {
        agentSelect.addEventListener('change', handleAgentChange);
        agentSelect.setAttribute('data-listener-added', 'true');
    }

    if (newChatBtn && !newChatBtn.hasAttribute('data-listener-added')) {
        newChatBtn.addEventListener('click', startNewChat);
        newChatBtn.setAttribute('data-listener-added', 'true');
    }

    if (sidebarToggle && !sidebarToggle.hasAttribute('data-listener-added')) {
        sidebarToggle.addEventListener('click', toggleSidebar);
        sidebarToggle.setAttribute('data-listener-added', 'true');

        // Restore saved state
        const sidebar = document.getElementById('sidebar');
        const toggleIcon = document.getElementById('toggle-icon');

        const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (sidebarCollapsed && sidebar && toggleIcon) {
            sidebar.classList.add('collapsed');
            toggleIcon.textContent = '▶';
        }
    }

    // Mark as initialized
    document.body.setAttribute('data-events-initialized', 'true');
    console.log('[DEBUG] Event listeners initialized');
}

function handleTextareaResize() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
}

function handleKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function handleAgentChange() {
    currentAgent = this.value;
    updateDropdowns();
    startNewChat();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.getElementById('toggle-icon');
    
    if (sidebar && toggleIcon) {
        sidebar.classList.toggle('collapsed');
        toggleIcon.textContent = sidebar.classList.contains('collapsed') ? '⟩' : '⟨';
        
        // Save toggle state
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    }
}

function updateDropdowns() {
    const agentSelect = document.getElementById('agent-select');
    const subjectSelect = document.getElementById('subject-select');
    const taskSelect = document.getElementById('task-select');

    if (!agentSelect || !subjectSelect || !taskSelect) return;

    const agent = agentSelect.value || 'sage';

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

    const config = agentConfigs[agent];
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

        console.log(`[DEBUG] Updated dropdowns for ${agent}: subject=${subjectSelect.value}, task=${taskSelect.value}`);
    }
}

function initializeTemperatureSlider() {
    try {
        const temperatureSlider = document.getElementById('temperature-slider');
        const temperatureValue = document.getElementById('temperature-value');

        if (temperatureSlider && temperatureValue) {
            temperatureSlider.removeEventListener('input', handleTemperatureChange);
            temperatureSlider.removeEventListener('change', handleTemperatureChange);
            temperatureSlider.addEventListener('input', handleTemperatureChange);
            temperatureSlider.addEventListener('change', handleTemperatureChange);
            temperatureValue.textContent = temperatureSlider.value;
            console.log('[DEBUG] Temperature slider initialized successfully');
        }
    } catch (error) {
        console.error('[ERROR] Failed to initialize temperature slider:', error);
    }
}

function handleTemperatureChange() {
    const temperatureValue = document.getElementById('temperature-value');
    if (temperatureValue) {
        temperatureValue.textContent = this.value;
        console.log('[DEBUG] Temperature updated to:', this.value);
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const agentSelect = document.getElementById('agent-select');
    const subjectSelect = document.getElementById('subject-select');
    const taskSelect = document.getElementById('task-select');

    if (!messageInput || !sendButton || !agentSelect || !subjectSelect || !taskSelect) {
        console.error('[ERROR] Missing required elements');
        return;
    }

    const rawMessage = messageInput.value;
    const message = rawMessage.trim();
    const agent = agentSelect.value;
    const subject = subjectSelect.value;
    const task = taskSelect.value;

    if (!message || message.trim().length === 0 || message.replace(/\s+/g, '').length === 0) {
        console.log('[DEBUG] Empty message, not sending');
        return;
    }
    
    if (message.replace(/[^a-zA-Z0-9\s]/g, '').trim().length === 0) {
      console.log('[DEBUG] Message contains no meaningful content');
      addMessageToChat('system', 'Please enter a meaningful question or message.', 'system');
      messageInput.focus();
      return;
    }

    console.log(`[DEBUG] sendMessage called with: agent=${agent}, subject=${subject}, task=${task}`);

    // Disable send button during request
    sendButton.disabled = true;
    sendButton.style.opacity = '0.6';
    sendButton.style.cursor = 'not-allowed';
    sendButton.textContent = 'Sending...';

    try {
        // Add user message to chat
        addMessageToChat('user', message);
        messageInput.value = '';
        messageInput.style.height = 'auto';

        // Collect AI settings
        const temperature = document.getElementById('temperature-slider')?.value || 7;
        const responseLength = document.getElementById('response-length')?.value || 'medium';
        const focusMode = document.getElementById('focus-mode')?.value || 'educational';
        const explanationStyle = document.getElementById('explanation-style')?.value || 'standard';
        const bahamianContext = document.getElementById('bahamian-context')?.checked || true;
        const stepByStep = document.getElementById('step-by-step')?.checked || true;

        // Send request to backend
        const response = await fetch(`/api/${agent}`, {
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
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Add agent response to chat
        addMessageToChat('agent', data.response, agent);

    } catch (error) {
        console.error('[ERROR] Failed to send message:', error);
        addMessageToChat('system', `Error: ${error.message}`, 'system');
    } finally {
        sendButton.disabled = false;
        sendButton.style.opacity = '1';
        sendButton.style.cursor = 'pointer';
        sendButton.textContent = 'Send';
    }
}

function addMessageToChat(role, content, agent = null) {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;

    // Format message content - convert markdown-style formatting to HTML
    let formattedMessage = formatMessageContent(content);

    if (role === 'user') {
        messageDiv.innerHTML = `<strong>You:</strong> ${formattedMessage}`;
    } else if (role === 'agent') {
        const agentName = agent ? agent.charAt(0).toUpperCase() + agent.slice(1) : 'Agent';
        messageDiv.innerHTML = `<strong>${agentName}:</strong> ${formattedMessage}`;
    } else if (role === 'system') {
        messageDiv.className = 'message error-message';
        messageDiv.innerHTML = `<strong>Error:</strong> ${formattedMessage}`;
    }

    chatWindow.appendChild(messageDiv);

    // Save current chat session
    saveChatSession();

    // Update sidebar
    loadChatHistorySidebar();

    // Smooth auto-scroll to bottom with delay
    setTimeout(() => {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 100);

    console.log(`[DEBUG] Added ${role} message: ${content.substring(0, 50)}...`);
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
      <div class="chat-content">
        <div class="chat-title">${chat.title || 'New Chat'}</div>
        <div class="chat-preview">${chat.lastMessage || 'No messages yet'}</div>
        <div class="chat-meta">${agentName} • ${date}</div>
      </div>
    `;

    chatItem.addEventListener('click', () => loadChatSession(index));
    historyList.appendChild(chatItem);
  });
}

// Alias for backward compatibility
function loadAgentSession(agent) {
    console.log(`[DEBUG] loadAgentSession called for ${agent}`);
    loadSessionHistory(agent);
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