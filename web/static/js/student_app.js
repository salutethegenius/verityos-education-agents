// Student portal JavaScript
let currentAgent = 'sage';
let currentSessionId = generateSessionId();
let conversationHistory = {};
let chatSessions = JSON.parse(localStorage.getItem('studentChatSessions') || '[]');
let currentChatIndex = -1;

// Get student info from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('id') || sessionStorage.getItem('student_id');
const studentName = urlParams.get('name') || sessionStorage.getItem('student_name');

console.log('[STUDENT DEBUG] Initializing with:', { studentId, studentName });

if (!studentId || !studentName) {
    console.log('[STUDENT DEBUG] Missing credentials, redirecting to login');
    window.location.href = '/student-login';
}

// Store credentials in session storage
sessionStorage.setItem('student_id', studentId);
sessionStorage.setItem('student_name', studentName);

// Dynamic help content based on agent and subject
const HELP_CONTENT = {
    sage: {
        math: {
            title: "🧙‍♂️ Sage - Math Tutor",
            samples: [
                "What is 25 + 47?",
                "Help me solve: 2x + 5 = 15",
                "Check my work: 12 × 8 = 96"
            ]
        },
        science: {
            title: "🧙‍♂️ Sage - Science Tutor",
            samples: [
                "What is photosynthesis?",
                "Explain how coral reefs work",
                "Why do hurricanes form in our region?"
            ]
        },
        history: {
            title: "🧙‍♂️ Sage - History Tutor",
            samples: [
                "When did The Bahamas gain independence?",
                "Who were the Lucayans?",
                "Tell me about Junkanoo festival"
            ]
        }
    },
    echo: {
        english: {
            title: "🗣️ Echo - Reading Coach",
            samples: [
                "Help me understand this passage",
                "What does this word mean?",
                "Quiz me on this reading"
            ]
        }
    },
    lucaya: {
        'academic research': {
            title: "🔍 Lucaya - Research Assistant",
            samples: [
                "Help me find sources about Bahamian history",
                "Create an outline for my essay",
                "Evaluate this website"
            ]
        }
    }
};

function generateSessionId() {
    return `student-${studentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function updateHelpContent() {
    const agentSelect = document.getElementById('agent-select');
    const subjectSelect = document.getElementById('subject-select');
    const helpContent = document.getElementById('help-content');

    if (!agentSelect || !subjectSelect || !helpContent) return;

    const agent = agentSelect.value;
    const subject = subjectSelect.value;

    const content = HELP_CONTENT[agent]?.[subject] || HELP_CONTENT[agent]?.math || {
        title: "💡 Learning Assistant",
        samples: ["Ask me anything about your studies!"]
    };

    helpContent.innerHTML = `
        <h4>${content.title}</h4>
        <div class="help-samples">
            ${content.samples.map(sample => 
                `<div class="sample-text" onclick="fillSampleText('${sample}')">${sample}</div>`
            ).join('')}
        </div>
    `;
}

function fillSampleText(text) {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.value = text;
        messageInput.focus();
    }
}

function updateTaskOptions() {
    const agentSelect = document.getElementById('agent-select');
    const taskSelect = document.getElementById('task-select');

    if (!agentSelect || !taskSelect) return;

    const agent = agentSelect.value;

    const agentTasks = {
        'sage': [
            { value: 'homework', text: 'Homework Help' },
            { value: 'study', text: 'Study Session' },
            { value: 'quiz', text: 'Practice Quiz' },
            { value: 'review', text: 'Review' }
        ],
        'echo': [
            { value: 'study', text: 'Reading Practice' },
            { value: 'homework', text: 'Reading Homework' },
            { value: 'quiz', text: 'Comprehension Quiz' }
        ],
        'lucaya': [
            { value: 'find sources', text: 'Find Sources' },
            { value: 'create outline', text: 'Create Outline' },
            { value: 'topic exploration', text: 'Topic Exploration' }
        ]
    };

    const tasks = agentTasks[agent] || agentTasks['sage'];
    taskSelect.innerHTML = '';

    tasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.value;
        option.textContent = task.text;
        taskSelect.appendChild(option);
    });
}

function setupEventListeners() {
    // Send button
    const sendButton = document.getElementById('send-button');
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    // Message input
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });

        // Auto-expand textarea
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }

    // Agent selection
    const agentSelect = document.getElementById('agent-select');
    if (agentSelect) {
        agentSelect.addEventListener('change', function() {
            const newAgent = this.value;
            if (newAgent !== currentAgent) {
                currentAgent = newAgent;
                updateTaskOptions();
                updateHelpContent();
                startNewChat();
            }
        });
    }

    // Subject selection
    const subjectSelect = document.getElementById('subject-select');
    if (subjectSelect) {
        subjectSelect.addEventListener('change', updateHelpContent);
    }

    // New chat button
    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', startNewChat);
    }

        // Add sidebar toggle functionality
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.getElementById('toggle-icon');

    if (sidebarToggle && sidebar && toggleIcon) {
        // Remove any existing listeners to prevent duplicates
        sidebarToggle.removeEventListener('click', toggleSidebar);
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Load chat history and initial session
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const agentSelect = document.getElementById('agent-select');
    const subjectSelect = document.getElementById('subject-select');
    const taskSelect = document.getElementById('task-select');

    if (!messageInput || !sendButton || !agentSelect || !subjectSelect || !taskSelect) {
        console.error('[STUDENT ERROR] Missing required elements');
        return;
    }

    const message = messageInput.value.trim();
    const agent = agentSelect.value;
    const subject = subjectSelect.value;
    const task = taskSelect.value;

    console.log('[STUDENT DEBUG] sendMessage called:', { agent, message, subject, task });

    // Validate message
    if (!message || message.length === 0) {
        console.log('[STUDENT DEBUG] Empty message, not sending');
        messageInput.focus();
        return;
    }

    // Prevent double-clicking
    if (sendButton.disabled) {
        console.log('[STUDENT DEBUG] Send button disabled, preventing duplicate');
        return;
    }

    // Disable button
    sendButton.disabled = true;
    sendButton.textContent = 'Sending...';
    sendButton.style.opacity = '0.6';

    // Add user message to chat
    addMessage(message, 'user');
    messageInput.value = '';
    messageInput.style.height = 'auto';

    try {
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
                student_id: studentId,
                student_name: studentName
            })
        });

        console.log('[STUDENT DEBUG] API response:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[STUDENT DEBUG] API data:', data);

        if (data.response) {
            addMessage(data.response, 'bot');
        } else if (data.error) {
            addMessage(`Error: ${data.error}`, 'error');
        } else {
            addMessage('Sorry, I had trouble understanding that. Please try again.', 'error');
        }

    } catch (error) {
        console.error('[STUDENT ERROR] Send failed:', error);
        addMessage('Sorry, I encountered an error. Please try again.', 'error');
    } finally {
        // Re-enable button
        sendButton.disabled = false;
        sendButton.textContent = 'Send';
        sendButton.style.opacity = '1';

        // Save session
        saveChatSession();

        console.log('[STUDENT DEBUG] Message send complete');
    }
}

function addMessage(message, type) {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    const messageDiv = document.createElement('div');

    let formattedMessage = formatMessageContent(message);

    if (type === 'user') {
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `<strong>You:</strong> ${formattedMessage}`;
    } else if (type === 'bot') {
        messageDiv.className = 'message agent-message';
        const agentName = currentAgent.charAt(0).toUpperCase() + currentAgent.slice(1);
        messageDiv.innerHTML = `<strong>${agentName}:</strong> ${formattedMessage}`;
    } else if (type === 'error') {
        messageDiv.className = 'message error-message';
        messageDiv.innerHTML = `<strong>Error:</strong> ${formattedMessage}`;
    }

    chatWindow.appendChild(messageDiv);

    // Smooth scroll to bottom
    setTimeout(() => {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 100);

    console.log(`[STUDENT DEBUG] Added ${type} message`);
}

function formatMessageContent(message) {
    if (!message) return '';

    return message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^[•\-]\s+(.+)$/gm, '<li>$1</li>')
        .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>(?:\s*<li>.*<\/li>)*)/gs, '<ul>$1</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
}

function startNewChat() {
    // Save current chat
    if (currentChatIndex >= 0) {
        saveChatSession();
    }

    // Create new chat
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
    if (chatWindow) {
        chatWindow.innerHTML = '';

        // Add welcome message
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'message agent-message';
        const agentName = currentAgent.charAt(0).toUpperCase() + currentAgent.slice(1);
        welcomeMessage.innerHTML = `<strong>${agentName}:</strong> Hello ${studentName}! I'm ready to help you with your studies. What would you like to work on today?`;
        chatWindow.appendChild(welcomeMessage);
    }

    // Update sidebar
    loadChatHistorySidebar();

    console.log('[STUDENT DEBUG] Started new chat:', newChat.id);
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

    // Update UI
    const agentSelect = document.getElementById('agent-select');
    if (agentSelect) {
        agentSelect.value = currentAgent;
        updateTaskOptions();
        updateHelpContent();
    }

    // Load messages
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
        chatWindow.innerHTML = '';

        if (chat.messages && chat.messages.length > 0) {
            chat.messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = msg.className;
                messageDiv.innerHTML = msg.content;
                chatWindow.appendChild(messageDiv);
            });
        } else {
            // Show welcome message
            const welcomeMessage = document.createElement('div');
            welcomeMessage.className = 'message agent-message';
            const agentName = currentAgent.charAt(0).toUpperCase() + currentAgent.slice(1);
            welcomeMessage.innerHTML = `<strong>${agentName}:</strong> Hello ${studentName}! I'm ready to help you with your studies. What would you like to work on today?`;
            chatWindow.appendChild(welcomeMessage);
        }

        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Update sidebar
    loadChatHistorySidebar();

    console.log('[STUDENT DEBUG] Loaded chat session:', chat.id);
}

function saveChatSession() {
    if (currentChatIndex < 0 || currentChatIndex >= chatSessions.length) return;

    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

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
    localStorage.setItem('studentChatSessions', JSON.stringify(chatSessions));

    console.log('[STUDENT DEBUG] Saved chat session:', chat.id);
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

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.getElementById('toggle-icon');
    
    if (sidebar && toggleIcon) {
        sidebar.classList.toggle('collapsed');
        toggleIcon.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
        
        // Save toggle state
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    }
}

function logout() {
    sessionStorage.clear();
    localStorage.removeItem('studentChatSessions');
    localStorage.removeItem('sidebarCollapsed');
    window.location.href = '/student-login';
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('[STUDENT DEBUG] DOM loaded, setting up portal...');

    // Set welcome message
    const welcomeElement = document.getElementById('student-welcome');
    if (welcomeElement) {
        welcomeElement.textContent = `Welcome, ${studentName}!`;
    }

    // Set up all event listeners
    setupEventListeners();

    // Update help content
    updateTaskOptions();
    updateHelpContent();

    // Restore sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.getElementById('toggle-icon');
    
    if (sidebarCollapsed && sidebar && toggleIcon) {
        sidebar.classList.add('collapsed');
        toggleIcon.textContent = '▶';
    }

    // Load or create initial chat
    loadChatHistorySidebar();
    if (chatSessions.length === 0) {
        startNewChat();
    } else {
        loadChatSession(0);
    }

    console.log('[STUDENT DEBUG] Student portal setup complete');
});