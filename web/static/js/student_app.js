
let currentAgent = 'sage';
let currentSessionId = generateSessionId();
let conversationHistory = {};
let chatSessions = JSON.parse(localStorage.getItem('studentChatSessions') || '[]');
let currentChatIndex = -1;

// Get student info from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('id') || sessionStorage.getItem('student_id');
const studentName = urlParams.get('name') || sessionStorage.getItem('student_name');

if (!studentId || !studentName) {
    window.location.href = '/student-login';
}

// Agent help content
const agentHelp = {
    'sage': {
        title: '🧙‍♂️ Sage - Your Tutor',
        samples: [
            '• "What is 25 + 47?"',
            '• "Explain fractions using Bahamian examples"',
            '• "Help me solve: 2x + 5 = 15"',
            '• "Quiz me on multiplication tables"',
            '• "What is photosynthesis?"',
            '• "Why do hurricanes form in our region?"'
        ]
    },
    'echo': {
        title: '🗣️ Echo - Reading Coach',
        samples: [
            '• "Help me understand this text about coral reefs"',
            '• "Create questions about this passage"',
            '• "What does \'archipelago\' mean?"',
            '• "Summarize this paragraph for me"',
            '• "Make this text easier to read"',
            '• "Test my comprehension"'
        ]
    },
    'lucaya': {
        title: '🔍 Lucaya - Research Assistant',
        samples: [
            '• "Research Bahamian independence"',
            '• "Find sources about coral bleaching"',
            '• "Help me outline my essay"',
            '• "What are the main points about Junkanoo?"',
            '• "Create a bibliography"',
            '• "Fact-check this information"'
        ]
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Display student welcome message
    document.getElementById('student-welcome').textContent = `Welcome, ${studentName}!`;
    
    // Set up agent switching
    document.getElementById('agent-select').addEventListener('change', function() {
        switchAgent(this.value);
    });
    
    // Set up send button
    document.getElementById('send-button').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Auto-expand textarea
    document.getElementById('message-input').addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    
    // Set up new chat button
    document.getElementById('new-chat-btn').addEventListener('click', startNewChat);
    
    // Initialize
    updateAgentHelp();
    loadChatHistorySidebar();
    
    // Initialize help content with click handlers
    setTimeout(() => {
        document.querySelectorAll('.sample-text').forEach(sample => {
            sample.addEventListener('click', function() {
                const text = this.textContent.replace('• "', '').replace('"', '');
                document.getElementById('message-input').value = text;
                document.getElementById('message-input').focus();
            });
        });
    }, 100);
    
    if (chatSessions.length === 0) {
        startNewChat();
    } else {
        loadChatSession(0);
    }
});

function generateSessionId() {
    return `student-${studentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function switchAgent(agentName) {
    console.log(`[DEBUG] Agent changed to: ${agentName}`);
    
    // Save current conversation if switching agents
    if (currentAgent && currentAgent !== agentName) {
        saveConversationState(currentAgent);
    }
    
    currentAgent = agentName;
    currentSessionId = generateSessionId();
    
    // Update help content
    updateAgentHelp();
    
    // Load agent session
    loadAgentSession(agentName);
}

function updateAgentHelp() {
    const helpContent = document.getElementById('help-content');
    const help = agentHelp[currentAgent];
    
    helpContent.innerHTML = `
        <h4>${help.title}</h4>
        <div class="help-samples">
            ${help.samples.map(sample => `<div class="sample-text">${sample}</div>`).join('')}
        </div>
    `;
    
    // Add click handlers for sample texts
    setTimeout(() => {
        document.querySelectorAll('.sample-text').forEach(sample => {
            sample.addEventListener('click', function() {
                const text = this.textContent.replace('• "', '').replace('"', '');
                document.getElementById('message-input').value = text;
                document.getElementById('message-input').focus();
            });
        });
    }, 50);
}

function startNewChat() {
    // Save current chat if it exists
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

    // Update sidebar
    loadChatHistorySidebar();
    
    console.log('[DEBUG] Started new chat:', newChat.id);
}

function loadChatHistorySidebar() {
    const historyList = document.getElementById('chat-history-list');
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

function loadChatSession(index) {
    // Save current session first
    if (currentChatIndex >= 0) {
        saveChatSession();
    }
    
    currentChatIndex = index;
    const session = chatSessions[index];
    currentSessionId = session.id;
    currentAgent = session.agent;
    
    // Update agent selector
    document.getElementById('agent-select').value = currentAgent;
    updateAgentHelp();
    
    // Load messages
    const chatWindow = document.getElementById('chat-window');
    chatWindow.innerHTML = '';
    
    session.messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = msg.className;
        messageDiv.innerHTML = msg.content;
        chatWindow.appendChild(messageDiv);
    });
    
    // Update sidebar active state
    loadChatHistorySidebar();
    
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function saveChatSession() {
    if (currentChatIndex >= 0) {
        const chatWindow = document.getElementById('chat-window');
        const messages = Array.from(chatWindow.children);
        
        chatSessions[currentChatIndex].messages = messages.map(msg => ({
            content: msg.innerHTML,
            className: msg.className
        }));
        
        // Update title and last message
        if (messages.length > 0) {
            const lastUserMessage = messages.reverse().find(msg => msg.className.includes('user'));
            if (lastUserMessage) {
                const text = lastUserMessage.textContent || lastUserMessage.innerText;
                chatSessions[currentChatIndex].title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
                chatSessions[currentChatIndex].lastMessage = text.substring(0, 50) + (text.length > 50 ? '...' : '');
            }
        }
        
        chatSessions[currentChatIndex].timestamp = new Date().toISOString();
        localStorage.setItem('studentChatSessions', JSON.stringify(chatSessions));
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

async function loadAgentSession(agent) {
    const chatWindow = document.getElementById('chat-window');

    // Check if we have local conversation history first
    if (conversationHistory[agent] && conversationHistory[agent].length > 0) {
        // Clear and restore from local storage
        chatWindow.innerHTML = '';
        conversationHistory[agent].forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = msg.className;
            messageDiv.innerHTML = msg.content;
            chatWindow.appendChild(messageDiv);
        });

        console.log(`[SESSION] Loaded ${conversationHistory[agent].length} messages from local history for ${agent}`);
    }

    // Scroll to bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message || message.length === 0) {
        messageInput.focus();
        return;
    }
    
    // Student-specific limitations
    if (message.length > 300) {
        addMessage('📝 Please keep your questions shorter (under 300 characters) so I can help you better!', 'error');
        return;
    }
    
    // Prevent button spamming
    const sendButton = document.getElementById('send-button');
    if (sendButton.disabled) return;
    sendButton.disabled = true;
    
    const subject = document.getElementById('subject-select').value;
    const task = document.getElementById('task-select').value;
    
    // Add user message to chat
    addMessage(message, 'user');
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Send to agent with student context
    const payload = {
        message: message,
        subject: subject,
        task: task,
        session_id: currentSessionId,
        student_id: studentId,
        student_name: studentName,
        user_type: 'student'
    };
    
    fetch(`/api/${currentAgent}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.response) {
            addMessage(data.response, 'bot');
        } else {
            addMessage('Sorry, I had trouble understanding that. Please try again.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        addMessage('Sorry, I encountered an error. Please try again.', 'error');
    })
    .finally(() => {
        // Re-enable send button
        sendButton.disabled = false;
        
        // Save session after each message
        saveChatSession();
    });
}

function addMessage(text, type) {
    const chatWindow = document.getElementById('chat-window');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    // Format message text (convert ** to bold, handle line breaks)
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                             .replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = formattedText;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function logout() {
    // Save current session before logout
    saveChatSession();
    sessionStorage.clear();
    localStorage.removeItem('studentChatSessions');
    window.location.href = '/student-login';
}
