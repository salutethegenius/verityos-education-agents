let studentAppInitialized = false;
let currentSessionId = null;
let currentAgent = 'sage';

function generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function initializeStudentSession() {
    if (!currentSessionId) {
        currentSessionId = generateSessionId();
        console.log('[STUDENT DEBUG] New session created:', currentSessionId);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Use both memory flag and DOM attribute to prevent conflicts
    if (studentAppInitialized || document.body.hasAttribute('data-student-app-initialized')) {
        console.log('[STUDENT DEBUG] App already initialized, skipping...');
        return;
    }

    console.log('[STUDENT DEBUG] DOM loaded, initializing student app...');
    studentAppInitialized = true;
    document.body.setAttribute('data-student-app-initialized', 'true');

    try {
        initializeStudentSession();
        initializeStudentEventListeners();
        updateHelpContent();
        loadStudentInfo();
        
        // Load chat history and initial session
        loadChatHistorySidebar();
        if (chatSessions.length === 0) {
            startNewStudentChat();
        } else {
            loadChatSession(0);
        }
    } catch (error) {
        console.error('[STUDENT ERROR] Failed to initialize student app:', error);
    }
});

function initializeStudentEventListeners() {
    // Check if already initialized to prevent duplicate listeners
    if (document.body.hasAttribute('data-student-events-initialized')) {
        console.log('[STUDENT DEBUG] Event listeners already initialized, skipping...');
        return;
    }

    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const agentSelect = document.getElementById('agent-select');
    const subjectSelect = document.getElementById('subject-select');
    const taskSelect = document.getElementById('task-select');
    const newChatBtn = document.getElementById('new-chat-btn');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    if (messageInput && !messageInput.hasAttribute('data-student-listeners-added')) {
        messageInput.addEventListener('input', handleStudentTextareaResize);
        messageInput.addEventListener('keydown', handleStudentKeydown);
        messageInput.setAttribute('data-student-listeners-added', 'true');
    }

    if (sendButton && !sendButton.hasAttribute('data-student-listener-added')) {
        sendButton.addEventListener('click', sendStudentMessage);
        sendButton.setAttribute('data-student-listener-added', 'true');
    }

    if (agentSelect && !agentSelect.hasAttribute('data-student-listener-added')) {
        agentSelect.addEventListener('change', handleStudentAgentChange);
        agentSelect.setAttribute('data-student-listener-added', 'true');
    }

    if (subjectSelect && !subjectSelect.hasAttribute('data-student-listener-added')) {
        subjectSelect.addEventListener('change', updateHelpContent);
        subjectSelect.setAttribute('data-student-listener-added', 'true');
    }

    if (taskSelect && !taskSelect.hasAttribute('data-student-listener-added')) {
        taskSelect.addEventListener('change', updateHelpContent);
        taskSelect.setAttribute('data-student-listener-added', 'true');
    }

    if (newChatBtn && !newChatBtn.hasAttribute('data-student-listener-added')) {
        newChatBtn.addEventListener('click', startNewStudentChat);
        newChatBtn.setAttribute('data-student-listener-added', 'true');
    }

    if (sidebarToggle && !sidebarToggle.hasAttribute('data-student-listener-added')) {
        sidebarToggle.addEventListener('click', toggleSidebar);
        sidebarToggle.setAttribute('data-student-listener-added', 'true');
    }

    // Mark as initialized
    document.body.setAttribute('data-student-events-initialized', 'true');
    console.log('[STUDENT DEBUG] Event listeners initialized');
}

function handleStudentTextareaResize() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
}

function handleStudentKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendStudentMessage();
    }
}

function handleStudentAgentChange() {
    currentAgent = this.value;
    updateHelpContent();
    startNewStudentChat();
}

async function sendStudentMessage() {
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

    console.log('[STUDENT DEBUG] sendMessage called with:', { agent, subject, task, message: message.substring(0, 50) + '...' });

    if (!message) {
        console.log('[STUDENT DEBUG] Empty message, not sending');
        return;
    }

    sendButton.disabled = true;
    sendButton.textContent = 'Sending...';

    try {
        addStudentMessageToChat('user', message);
        messageInput.value = '';
        messageInput.style.height = 'auto';

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

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        addStudentMessageToChat('agent', data.response, agent);

    } catch (error) {
        console.error('[STUDENT ERROR] Failed to send message:', error);
        addStudentMessageToChat('system', `Error: ${error.message}`, 'system');
    } finally {
        sendButton.disabled = false;
        sendButton.textContent = 'Send';
    }
}

function addStudentMessageToChat(role, content, agent = null) {
    const chatContainer = document.getElementById('chat-window');
    if (!chatContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;

    const timestamp = new Date().toLocaleTimeString();
    const agentName = agent ? agent.charAt(0).toUpperCase() + agent.slice(1) : '';

    if (role === 'user') {
        messageDiv.innerHTML = `
            <div class="message-header">
                <strong>You</strong>
                <span class="timestamp">${timestamp}</span>
            </div>
            <div class="message-content">${escapeStudentHtml(content)}</div>
        `;
    } else if (role === 'agent') {
        messageDiv.innerHTML = `
            <div class="message-header">
                <strong>${agentName}</strong>
                <span class="timestamp">${timestamp}</span>
            </div>
            <div class="message-content">${formatStudentAgentResponse(content)}</div>
        `;
    } else {
        messageDiv.innerHTML = `<div class="message-content">${escapeStudentHtml(content)}</div>`;
    }

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function formatStudentAgentResponse(content) {
    return escapeStudentHtml(content)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function escapeStudentHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

function startNewStudentChat() {
    // Save current chat
    if (currentChatIndex >= 0) {
        saveChatSession();
    }

    currentSessionId = generateSessionId();
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
    console.log('[STUDENT DEBUG] Started new chat with session:', currentSessionId);

        // Update sidebar
    loadChatHistorySidebar();
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

function loadStudentInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const studentName = urlParams.get('name') || sessionStorage.getItem('student_name') || 'Student';
    const studentId = urlParams.get('id') || sessionStorage.getItem('student_id') || '';

    const welcomeElement = document.getElementById('student-welcome');
    if (welcomeElement) {
        welcomeElement.textContent = `Welcome, ${studentName}!`;
    }

    console.log('[STUDENT DEBUG] Loaded student info:', { studentName, studentId });
}

// Student portal JavaScript
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

function logout() {
    sessionStorage.clear();
    localStorage.removeItem('studentChatSessions');
    localStorage.removeItem('sidebarCollapsed');
    window.location.href = '/student-login';
}

function sendSampleMessage(element) {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.value = element.textContent;
        messageInput.focus();
    }
}