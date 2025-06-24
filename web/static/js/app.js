// Agent Interface Application
let appInitialized = false;

// State management
let currentChatIndex = -1;
let chatSessions = JSON.parse(localStorage.getItem('agentChatSessions') || '[]');
let currentAgent = 'sage';
let conversationHistory = [];

// Check if this is the agent interface page
function isAgentInterface() {
    return document.title.includes('VerityOS Education Agents') && !document.body.classList.contains('student-interface');
}

document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on agent interface page
    if (!isAgentInterface()) {
        return;
    }

    // Use both memory flag and DOM attribute to prevent conflicts
    if (appInitialized || document.body.hasAttribute('data-agent-app-initialized')) {
        console.log('[DEBUG] App already initialized, skipping...');
        return;
    }

    console.log('[DEBUG] DOM loaded, initializing...');
    appInitialized = true;
    document.body.setAttribute('data-agent-app-initialized', 'true');

    // Initialize chat interface
    new ChatInterface();
});

// Chat Interface Application
class ChatInterface {
    constructor() {
        this.currentAgent = 'sage';
        this.currentSessionId = this.generateSessionId();
        this.conversationHistory = [];

        this.init();
    }

    init() {
        console.log('[DEBUG] DOM loaded, initializing...');

        // Initialize core functionality only
        this.initializeDropdowns();
        this.initializeTemperatureSlider();
        this.initializeEventListeners();
        this.loadSessionHistory();

        console.log('[DEBUG] Initialization complete');
    }

    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    initializeDropdowns() {
        // Initialize subject and task dropdowns based on current agent
        this.updateDropdownsForAgent(this.currentAgent);

        // Add event listeners for dropdowns
        const subjectSelect = document.getElementById('subject-select');
        const taskSelect = document.getElementById('task-select');

        if (subjectSelect) {
            subjectSelect.addEventListener('change', () => {
                console.log('[DEBUG] Subject changed to:', subjectSelect.value);
            });
        }

        if (taskSelect) {
            taskSelect.addEventListener('change', () => {
                console.log('[DEBUG] Task changed to:', taskSelect.value);
            });
        }
    }

    updateDropdownsForAgent(agent) {
        const subjectSelect = document.getElementById('subject-select');
        const taskSelect = document.getElementById('task-select');

        if (!subjectSelect || !taskSelect) return;

        // Define options for each agent
        const agentConfigs = {
            sage: {
                subjects: ['math', 'science', 'algebra', 'geometry', 'calculus'],
                tasks: ['homework', 'practice', 'explanation', 'step-by-step']
            },
            quill: {
                subjects: ['english', 'writing', 'literature', 'grammar', 'composition'],
                tasks: ['essay', 'creative writing', 'analysis', 'editing']
            },
            lucaya: {
                subjects: ['research', 'history', 'social studies', 'geography', 'civics'],
                tasks: ['research project', 'analysis', 'presentation', 'report']
            },
            coral: {
                subjects: ['administration', 'management', 'planning', 'assessment'],
                tasks: ['manage class', 'grade work', 'plan lesson', 'track progress']
            },
            echo: {
                subjects: ['reading', 'comprehension', 'vocabulary', 'literature'],
                tasks: ['reading help', 'comprehension', 'vocabulary', 'analysis']
            },
            pineapple: {
                subjects: ['creativity', 'art', 'music', 'design', 'innovation'],
                tasks: ['creative project', 'brainstorm', 'design', 'inspiration']
            }
        };

        const config = agentConfigs[agent] || agentConfigs.sage;

        // Update subject options
        subjectSelect.innerHTML = '';
        config.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject.charAt(0).toUpperCase() + subject.slice(1);
            subjectSelect.appendChild(option);
        });

        // Update task options
        taskSelect.innerHTML = '';
        config.tasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task;
            option.textContent = task.charAt(0).toUpperCase() + task.slice(1);
            taskSelect.appendChild(option);
        });

        console.log(`[DEBUG] Updated dropdowns for ${agent}: subject=${config.subjects[0]}, task=${config.tasks[0]}`);
    }

    initializeTemperatureSlider() {
        const temperatureSlider = document.getElementById('temperature-slider');
        const temperatureValue = document.getElementById('temperature-value');

        if (temperatureSlider && temperatureValue) {
            temperatureSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                temperatureValue.textContent = value;
                console.log('[DEBUG] Temperature updated to:', value);
            });
            console.log('[DEBUG] Temperature slider initialized successfully');
        }
    }

    initializeEventListeners() {
        // Agent selection buttons
        document.querySelectorAll('.agent-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchAgent(e.target.dataset.agent);
            });
        });

        // Send message button and input
        const sendBtn = document.getElementById('send-button');
        const messageInput = document.getElementById('message-input');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // New conversation button
        const newConversationBtn = document.getElementById('new-chat-btn');
        if (newConversationBtn) {
            newConversationBtn.addEventListener('click', () => this.startNewConversation());
        }

        // Agent selection dropdown
        const agentSelect = document.getElementById('agent-select');
        if (agentSelect) {
            agentSelect.addEventListener('change', (e) => {
                this.switchAgent(e.target.value);
            });
        }

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggleIcon = document.getElementById('toggle-icon');

        if (sidebar && toggleIcon) {
            sidebar.classList.toggle('collapsed');
            toggleIcon.textContent = sidebar.classList.contains('collapsed') ? '⟩' : '⟨';

            // Save state
            localStorage.setItem('agentSidebarCollapsed', sidebar.classList.contains('collapsed'));
        }
    }

    switchAgent(agent) {
        this.currentAgent = agent;

        // Update UI to reflect current agent
        document.querySelectorAll('.agent-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.agent === agent);
        });

        // Update dropdowns for new agent
        this.updateDropdownsForAgent(agent);

        // Start new session for new agent
        this.startNewConversation();
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();

        if (!message) return;

        // Add user message to chat
        this.addMessageToChat('user', message);

        // Clear input
        messageInput.value = '';

        // Get form data
        const subject = document.getElementById('subject-select')?.value || 'general';
        const task = document.getElementById('task-select')?.value || 'help';
        const temperature = document.getElementById('temperature-slider')?.value || '5';

        try {
            // Send to API
            const response = await fetch(`/api/${this.currentAgent}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    subject: subject,
                    task: task,
                    temperature: parseFloat(temperature),
                    session_id: this.currentSessionId,
                    user_type: 'student'
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.addMessageToChat('agent', data.response);
            } else {
                this.addMessageToChat('agent', 'Sorry, I encountered an error. Please try again.');
            }
        } catch (error) {
            console.error('[ERROR] Failed to send message:', error);
            this.addMessageToChat('agent', 'Connection error. Please check your internet and try again.');
        }
    }

    addMessageToChat(sender, message) {
        const chatWindow = document.getElementById('chat-window');
        if (!chatWindow) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = this.formatMessage(message);

        messageDiv.appendChild(messageContent);
        chatWindow.appendChild(messageDiv);

        // Scroll to bottom
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // Add to conversation history
        this.conversationHistory.push({ sender, message, timestamp: new Date().toISOString() });

        // Auto-save session
        this.saveChatSession();
    }

    formatMessage(message) {
        // Basic markdown-style formatting
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    startNewConversation() {
        // Save current session first
        this.saveChatSession();

        // Create new session
        this.currentSessionId = this.generateSessionId();
        this.conversationHistory = [];

        // Create new chat session object
        const newChat = {
            id: this.currentSessionId,
            agent: this.currentAgent,
            title: 'New Chat',
            lastMessage: '',
            timestamp: new Date().toISOString(),
            messages: []
        };

        // Add to sessions
        chatSessions.unshift(newChat);
        currentChatIndex = 0;

        // Clear chat window
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) {
            chatWindow.innerHTML = '';
        }

        // Update sidebar
        this.loadChatHistorySidebar();

        // Save session ID
        localStorage.setItem('agentCurrentSessionId', this.currentSessionId);

        console.log('[DEBUG] New session created:', this.currentSessionId);
    }

    saveChatSession() {
        if (currentChatIndex >= 0 && currentChatIndex < chatSessions.length) {
            const chatWindow = document.getElementById('chat-window');
            if (chatWindow) {
                const messages = Array.from(chatWindow.children).map(msg => ({
                    className: msg.className,
                    content: msg.innerHTML
                }));

                chatSessions[currentChatIndex].messages = messages;

                // Update last message and title
                if (messages.length > 0) {
                    const lastMsg = messages[messages.length - 1];
                    chatSessions[currentChatIndex].lastMessage = lastMsg.content.replace(/<[^>]*>/g, '').substring(0, 100);

                    // Set title from first user message
                    const firstUserMsg = messages.find(m => m.className.includes('user'));
                    if (firstUserMsg && chatSessions[currentChatIndex].title === 'New Chat') {
                        chatSessions[currentChatIndex].title = firstUserMsg.content.replace(/<[^>]*>/g, '').substring(0, 50) + '...';
                    }
                }

                // Save to localStorage
                localStorage.setItem('agentChatSessions', JSON.stringify(chatSessions));
                console.log('[DEBUG] Saved chat session:', chatSessions[currentChatIndex].id);
            }
        }
    }

    loadSessionHistory() {
        // Load chat sessions from localStorage and backend
        this.loadChatHistorySidebar();

        // Try to load previous session
        const savedSessionId = localStorage.getItem('agentCurrentSessionId');
        if (savedSessionId) {
            this.currentSessionId = savedSessionId;
            console.log('[DEBUG] Loaded chat session:', savedSessionId);
        }
    }

    loadChatHistorySidebar() {
        const historyList = document.getElementById('chat-history-list');
        if (!historyList) return;

        // Load from localStorage first
        const sessions = JSON.parse(localStorage.getItem('agentChatSessions') || '[]');

        historyList.innerHTML = '';

        sessions.forEach((chat, index) => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-history-item ${index === currentChatIndex ? 'active' : ''}`;

            const agentName = chat.agent.charAt(0).toUpperCase() + chat.agent.slice(1);
            const date = new Date(chat.timestamp).toLocaleDateString();

            chatItem.innerHTML = `
                <div class="chat-title">${chat.title || 'New Chat'}</div>
                <div class="chat-preview">${chat.lastMessage || 'No messages yet'}</div>
                <div class="chat-meta">${agentName} • ${date}</div>
            `;

            chatItem.addEventListener('click', () => this.loadChatSession(index));
            historyList.appendChild(chatItem);
        });

        // Also fetch sessions from backend memory
        this.fetchBackendSessions();
    }

    async fetchBackendSessions() {
        try {
            const response = await fetch('/api/sessions/list', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const backendSessions = await response.json();
                console.log('[DEBUG] Found backend sessions:', backendSessions);
                this.mergeBackendSessions(backendSessions);
            }
        } catch (error) {
            console.log('[DEBUG] Could not fetch backend sessions:', error);
        }
    }

    mergeBackendSessions(backendSessions) {
        const historyList = document.getElementById('chat-history-list');
        if (!historyList || !backendSessions.sessions) return;

        backendSessions.sessions.forEach(session => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-history-item backend-session';

            const agentName = session.agent.charAt(0).toUpperCase() + session.agent.slice(1);
            const date = new Date(session.timestamp).toLocaleDateString();

            chatItem.innerHTML = `
                <div class="chat-title">Session ${session.session_id.slice(-8)}</div>
                <div class="chat-preview">${session.messages} messages</div>
                <div class="chat-meta">${agentName} • ${date}</div>
            `;

            chatItem.addEventListener('click', () => this.loadBackendSession(session.session_id, session.agent));
            historyList.appendChild(chatItem);
        });
    }

    async loadBackendSession(sessionId, agent) {
        try {
            const response = await fetch(`/api/${agent}/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'load_session',
                    session_id: sessionId
                })
            });

            if (response.ok) {
                const sessionData = await response.json();
                this.loadSessionFromData(sessionData, agent);
            }
        } catch (error) {
            console.error('[ERROR] Failed to load backend session:', error);
        }
    }

    loadSessionFromData(sessionData, agent) {
        // Switch agent if different
        if (agent !== this.currentAgent) {
            this.switchAgent(agent);
        }

        // Set session ID
        this.currentSessionId = sessionData.session_id;
        this.conversationHistory = sessionData.conversation_history || [];

        // Clear and populate chat window
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) {
            chatWindow.innerHTML = '';

            this.conversationHistory.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.sender === 'user' ? 'user' : 'agent'}-message`;
                messageDiv.innerHTML = this.formatMessage(msg.message);
                chatWindow.appendChild(messageDiv);
            });

            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        console.log('[DEBUG] Loaded session from backend:', sessionData.session_id);
    }

    loadChatSession(index) {
        const sessions = JSON.parse(localStorage.getItem('agentChatSessions') || '[]');
        if (index < 0 || index >= sessions.length) return;

        const chat = sessions[index];
        currentChatIndex = index;
        this.currentSessionId = chat.id;

        // Switch agent if different
        if (chat.agent !== this.currentAgent) {
            this.switchAgent(chat.agent);
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
            }

            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        // Update sidebar
        this.loadChatHistorySidebar();
        console.log('[DEBUG] Loaded chat session:', chat.id);
    }
}

})(); // Close the IIFE wrapper