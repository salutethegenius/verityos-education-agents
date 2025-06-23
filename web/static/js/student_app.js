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
const helpContent = {
    'sage': {
        'math': {
            title: '🧙‍♂️ Sage - Math Help',
            samples: [
                'What is 25 + 47?',
                'Help me solve: 2x + 5 = 15',
                'Check my work: 12 × 8 = 96',
                'I need help with fractions'
            ]
        },
        'science': {
            title: '🧙‍♂️ Sage - Science Help',
            samples: [
                'What is photosynthesis?',
                'Explain coral reefs in the Bahamas',
                'How does climate change affect islands?',
                'What animals live in mangroves?'
            ]
        },
        'history': {
            title: '🧙‍♂️ Sage - History Help',
            samples: [
                'When did Bahamas gain independence?',
                'Who were the Lucayans?',
                'Tell me about Junkanoo festival',
                'What is our capital city?'
            ]
        },
        'english': {
            title: '🧙‍♂️ Sage - English Help',
            samples: [
                'Help me write an essay',
                'Check my grammar',
                'Explain this poem',
                'Help with my book report'
            ]
        },
        'bahamas studies': {
            title: '🧙‍♂️ Sage - Bahamas Studies',
            samples: [
                'Research about Out Islands',
                'Our cultural traditions',
                'Local government structure',
                'Environmental challenges'
            ]
        }
    },
    'echo': {
        'english': {
            title: '🗣️ Echo - Reading Help',
            samples: [
                'Help me understand this text',
                'Improve my reading comprehension',
                'What does this word mean?',
                'Summarize this paragraph'
            ]
        }
    },
    'lucaya': {
        'academic research': {
            title: '🔍 Lucaya - Research Help',
            samples: [
                'Find sources about coral reefs',
                'Help me create an outline',
                'How do I cite this source?',
                'Evaluate this website'
            ]
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('[STUDENT DEBUG] DOM loaded, setting up portal...');

    // Set welcome message
    document.getElementById('student-welcome').textContent = `Welcome, ${studentName}!`;

    // Set up all event listeners
    setupEventListeners();

    // Update help content
    updateHelpContent();

    // Load or create initial chat
    loadChatHistorySidebar();
    if (chatSessions.length === 0) {
        startNewChat();
    } else {
        loadChatSession(0);
    }

    console.log('[STUDENT DEBUG] Portal initialization complete');
});

function setupEventListeners() {
    console.log('[STUDENT DEBUG] Setting up event listeners...');

    // Send button
    const sendButton = document.getElementById('send-button');
    const messageInput = document.getElementById('message-input');

    if (sendButton) {
        sendButton.addEventListener('click', function(e) {
            console.log('[STUDENT DEBUG] Send button clicked');
            e.preventDefault();
            sendMessage();
        });
    }

    if (messageInput) {
        // Enter key to send
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                console.log('[STUDENT DEBUG] Enter key pressed');
                e.preventDefault();
                sendMessage();
            }
        });

        // Auto-resize textarea
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }

    // Agent selector
    const agentSelect = document.getElementById('agent-select');
    if (agentSelect) {
        agentSelect.addEventListener('change', function() {
            console.log('[STUDENT DEBUG] Agent changed to:', this.value);
            switchAgent(this.value);
        });
    }

    // Subject and task selectors
    const subjectSelect = document.getElementById('subject-select');
    const taskSelect = document.getElementById('task-select');

    if (subjectSelect) {
        subjectSelect.addEventListener('change', function() {
            console.log('[STUDENT DEBUG] Subject changed to:', this.value);
            updateTaskOptions();
            updateHelpContent();
        });
    }

    if (taskSelect) {
        taskSelect.addEventListener('change', function() {
            console.log('[STUDENT DEBUG] Task changed to:', this.value);
            updateHelpContent();
        });
    }

    // New chat button
    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', startNewChat);
    }

    console.log('[STUDENT DEBUG] Event listeners setup complete');
}

function generateSessionId() {
    return `student-${studentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function switchAgent(agentName) {
    console.log('[STUDENT DEBUG] Switching to agent:', agentName);

    // Save current chat
    if (currentChatIndex >= 0) {
        saveChatSession();
    }

    currentAgent = agentName;
    updateTaskOptions();
    updateHelpContent();
    startNewChat();
}

function updateTaskOptions() {
    console.log('[STUDENT DEBUG] Updating task options for agent:', currentAgent);

    const taskSelect = document.getElementById('task-select');
    const subjectSelect = document.getElementById('subject-select');

    if (!taskSelect || !subjectSelect) return;

    // Clear current options
    taskSelect.innerHTML = '';

    if (currentAgent === 'lucaya') {
        // Research tasks
        const researchTasks = [
            { value: 'find sources', text: 'Find Sources' },
            { value: 'create outline', text: 'Create Outline' },
            { value: 'evaluate sources', text: 'Evaluate Sources' },
            { value: 'citation help', text: 'Citation Help' }
        ];

        researchTasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.value;
            option.textContent = task.text;
            taskSelect.appendChild(option);
        });

        // Update subjects for research
        subjectSelect.innerHTML = '';
        const option = document.createElement('option');
        option.value = 'academic research';
        option.textContent = 'Academic Research';
        subjectSelect.appendChild(option);

    } else {
        // Regular learning tasks
        const regularTasks = [
            { value: 'homework', text: 'Homework Help' },
            { value: 'study', text: 'Study Session' },
            { value: 'quiz', text: 'Practice Quiz' },
            { value: 'review', text: 'Review' }
        ];

        regularTasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.value;
            option.textContent = task.text;
            taskSelect.appendChild(option);
        });

        // Standard subjects
        if (currentAgent !== 'lucaya') {
            subjectSelect.innerHTML = '';
            const subjects = [
                { value: 'math', text: 'Mathematics' },
                { value: 'science', text: 'Science' },
                { value: 'english', text: 'English' },
                { value: 'history', text: 'History' },
                { value: 'bahamas studies', text: 'Bahamas Studies' }
            ];

            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.value;
                option.textContent = subject.text;
                subjectSelect.appendChild(option);
            });
        }
    }
}

function updateHelpContent() {
    console.log('[STUDENT DEBUG] Updating help content');

    const helpContentDiv = document.getElementById('help-content');
    const subjectSelect = document.getElementById('subject-select');

    if (!helpContentDiv || !subjectSelect) return;

    const subject = subjectSelect.value || 'math';
    let content = helpContent[currentAgent]?.[subject];

    if (!content) {
        content = helpContent[currentAgent]?.['math'] || {
            title: `${currentAgent} - Help`,
            samples: ['Ask me anything!', 'How can I help you?', 'What would you like to learn?']
        };
    }

    helpContentDiv.innerHTML = `
        <h4>${content.title}</h4>
        <div class="help-samples">
            ${content.samples.map(sample => 
                `<div class="sample-text" onclick="insertSample('${sample.replace(/'/g, "\\'")}')">${sample}</div>`
            ).join('')}
        </div>
    `;
}

function insertSample(text) {
    console.log('[STUDENT DEBUG] Inserting sample text:', text);
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.value = text;
        messageInput.focus();
        // Auto-resize
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    }
}

function startNewChat() {
    console.log('[STUDENT DEBUG] Starting new chat');

    // Save current chat
    if (currentChatIndex >= 0) {
        saveChatSession();
    }

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
    const greetings = {
        'sage': `Hello ${studentName}! I'm Sage, your tutor. What would you like to learn today?`,
        'echo': `Hi ${studentName}! I'm Echo, your reading coach. Ready to improve your comprehension?`,
        'lucaya': `Welcome ${studentName}! I'm Lucaya, your research assistant. What topic shall we explore?`
    };

    addMessage(greetings[currentAgent], 'bot');
    loadChatHistorySidebar();
}

function loadChatSession(index) {
    if (index < 0 || index >= chatSessions.length) return;

    // Save current chat
    if (currentChatIndex >= 0) {
        saveChatSession();
    }

    const session = chatSessions[index];
    currentChatIndex = index;
    currentSessionId = session.id;
    currentAgent = session.agent;

    // Update UI
    document.getElementById('agent-select').value = currentAgent;
    updateTaskOptions();
    updateHelpContent();

    // Load messages
    const chatWindow = document.getElementById('chat-window');
    chatWindow.innerHTML = '';

    session.messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = msg.className;
        messageDiv.innerHTML = msg.content;
        chatWindow.appendChild(messageDiv);
    });

    loadChatHistorySidebar();
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function saveChatSession() {
    if (currentChatIndex >= 0 && currentChatIndex < chatSessions.length) {
        const chatWindow = document.getElementById('chat-window');
        const messages = Array.from(chatWindow.children);

        chatSessions[currentChatIndex].messages = messages.map(msg => ({
            content: msg.innerHTML,
            className: msg.className
        }));

        // Update title from last user message
        const lastUserMessage = messages.reverse().find(msg => msg.className.includes('user'));
        if (lastUserMessage) {
            const text = lastUserMessage.textContent || lastUserMessage.innerText;
            const cleanText = text.replace('You:', '').trim();
            chatSessions[currentChatIndex].title = cleanText.substring(0, 30) + (cleanText.length > 30 ? '...' : '');
            chatSessions[currentChatIndex].lastMessage = cleanText.substring(0, 50) + (cleanText.length > 50 ? '...' : '');
        }

        chatSessions[currentChatIndex].timestamp = new Date().toISOString();
        localStorage.setItem('studentChatSessions', JSON.stringify(chatSessions));
    }
}

function loadChatHistorySidebar() {
    const historyList = document.getElementById('chat-history-list');
    if (!historyList) return;

    historyList.innerHTML = '';

    chatSessions.forEach((session, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = `chat-history-item ${index === currentChatIndex ? 'active' : ''}`;
        historyItem.onclick = () => loadChatSession(index);

        historyItem.innerHTML = `
            <div class="chat-title">${session.title}</div>
            <div class="chat-preview">${session.lastMessage || 'New conversation'}</div>
            <div class="chat-meta">${session.agent} • ${new Date(session.timestamp).toLocaleDateString()}</div>
        `;

        historyList.appendChild(historyItem);
    });
}

async function sendMessage() {
    console.log('[STUDENT DEBUG] ===== SEND MESSAGE CALLED =====');

    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const subjectSelect = document.getElementById('subject-select');
    const taskSelect = document.getElementById('task-select');

    if (!messageInput || !sendButton || !subjectSelect || !taskSelect) {
        console.error('[STUDENT ERROR] Missing required elements');
        return;
    }

    const message = messageInput.value.trim();
    console.log('[STUDENT DEBUG] Message to send:', `"${message}"`);

    // Validate message
    if (!message || message.length === 0) {
        console.log('[STUDENT DEBUG] Empty message, not sending');
        messageInput.focus();
        return;
    }

    if (message.length > 300) {
        console.log('[STUDENT DEBUG] Message too long');
        addMessage('📝 Please keep your questions shorter (under 300 characters)!', 'error');
        return;
    }

    // Prevent double-sending
    if (sendButton.disabled) {
        console.log('[STUDENT DEBUG] Button already disabled');
        return;
    }

    // Disable button
    sendButton.disabled = true;
    sendButton.textContent = 'Sending...';
    sendButton.style.opacity = '0.6';

    try {
        // Add user message
        addMessage(message, 'user');
        messageInput.value = '';
        messageInput.style.height = 'auto';

        const payload = {
            message: message,
            subject: subjectSelect.value,
            task: taskSelect.value,
            session_id: currentSessionId,
            student_id: studentId,
            student_name: studentName,
            user_type: 'student'
        };

        console.log('[STUDENT DEBUG] Sending payload:', payload);

        const response = await fetch(`/api/${currentAgent}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
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

        console.log('[STUDENT DEBUG] ===== SEND MESSAGE COMPLETE =====');
    }
}

function addMessage(text, type) {
    console.log('[STUDENT DEBUG] Adding message:', type, text.substring(0, 50) + '...');

    const chatWindow = document.getElementById('chat-window');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    // Format message text
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                             .replace(/\n/g, '<br>');

    if (type === 'user') {
        messageDiv.innerHTML = `<strong>You:</strong> ${formattedText}`;
    } else if (type === 'bot') {
        const agentName = currentAgent.charAt(0).toUpperCase() + currentAgent.slice(1);
        messageDiv.innerHTML = `<strong>${agentName}:</strong> ${formattedText}`;
    } else if (type === 'error') {
        messageDiv.innerHTML = `<strong>Error:</strong> ${formattedText}`;
    }

    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function logout() {
    console.log('[STUDENT DEBUG] Logging out');
    saveChatSession();
    sessionStorage.clear();
    localStorage.removeItem('studentChatSessions');
    window.location.href = '/student-login';
}