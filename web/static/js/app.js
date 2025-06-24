
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

    // Prevent multiple initializations
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
        console.log('[DEBUG] Initializing ChatInterface...');

        // Initialize core functionality
        this.initializeDropdowns();
        this.initializeTemperatureSlider();
        this.initializeEventListeners();
        this.loadSessionHistory();
        this.restoreSidebarState();

        console.log('[DEBUG] ChatInterface initialization complete');
    }

    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    initializeDropdowns() {
        // Set initial agent
        const agentSelect = document.getElementById('agent-select');
        if (agentSelect) {
            agentSelect.value = this.currentAgent;
        }

        // Initialize subject and task dropdowns based on current agent
        this.updateDropdownsForAgent(this.currentAgent);

        console.log('[DEBUG] Dropdowns initialized');
    }

    updateDropdownsForAgent(agent) {
        const subjectSelect = document.getElementById('subject-select');
        const taskSelect = document.getElementById('task-select');

        if (!subjectSelect || !taskSelect) return;

        // Define options for each agent
        const agentConfigs = {
            sage: {
                subjects: [
                    { value: 'math', text: 'Mathematics' },
                    { value: 'science', text: 'Science' },
                    { value: 'algebra', text: 'Algebra' },
                    { value: 'geometry', text: 'Geometry' },
                    { value: 'calculus', text: 'Calculus' }
                ],
                tasks: [
                    { value: 'homework', text: 'Homework Help' },
                    { value: 'practice', text: 'Practice Problems' },
                    { value: 'explanation', text: 'Concept Explanation' },
                    { value: 'step-by-step', text: 'Step-by-Step Solutions' }
                ]
            },
            echo: {
                subjects: [
                    { value: 'reading', text: 'Reading' },
                    { value: 'comprehension', text: 'Reading Comprehension' },
                    { value: 'vocabulary', text: 'Vocabulary' },
                    { value: 'literature', text: 'Literature' }
                ],
                tasks: [
                    { value: 'reading help', text: 'Reading Help' },
                    { value: 'comprehension', text: 'Comprehension Practice' },
                    { value: 'vocabulary', text: 'Vocabulary Building' },
                    { value: 'analysis', text: 'Text Analysis' }
                ]
            },
            lucaya: {
                subjects: [
                    { value: 'research', text: 'Research' },
                    { value: 'history', text: 'History' },
                    { value: 'social studies', text: 'Social Studies' },
                    { value: 'geography', text: 'Geography' },
                    { value: 'civics', text: 'Civics' }
                ],
                tasks: [
                    { value: 'research project', text: 'Research Project' },
                    { value: 'analysis', text: 'Historical Analysis' },
                    { value: 'presentation', text: 'Presentation Help' },
                    { value: 'report', text: 'Report Writing' }
                ]
            },
            coral: {
                subjects: [
                    { value: 'administration', text: 'Administration' },
                    { value: 'management', text: 'Classroom Management' },
                    { value: 'planning', text: 'Lesson Planning' },
                    { value: 'assessment', text: 'Assessment' }
                ],
                tasks: [
                    { value: 'manage class', text: 'Manage Class' },
                    { value: 'grade work', text: 'Grade Work' },
                    { value: 'plan lesson', text: 'Plan Lesson' },
                    { value: 'track progress', text: 'Track Progress' }
                ]
            },
            pineapple: {
                subjects: [
                    { value: 'creativity', text: 'Creativity' },
                    { value: 'art', text: 'Art' },
                    { value: 'music', text: 'Music' },
                    { value: 'design', text: 'Design' },
                    { value: 'innovation', text: 'Innovation' }
                ],
                tasks: [
                    { value: 'creative project', text: 'Creative Project' },
                    { value: 'brainstorm', text: 'Brainstorming' },
                    { value: 'design', text: 'Design Work' },
                    { value: 'inspiration', text: 'Find Inspiration' }
                ]
            }
        };

        const config = agentConfigs[agent] || agentConfigs.sage;

        // Update subject options
        subjectSelect.innerHTML = '';
        config.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.value;
            option.textContent = subject.text;
            subjectSelect.appendChild(option);
        });

        // Update task options
        taskSelect.innerHTML = '';
        config.tasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.value;
            option.textContent = task.text;
            taskSelect.appendChild(option);
        });

        console.log(`[DEBUG] Updated dropdowns for ${agent}: subjects=${config.subjects.length}, tasks=${config.tasks.length}`);
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
        // Prevent duplicate event listeners
        const elements = {
            sendBtn: document.getElementById('send-button'),
            messageInput: document.getElementById('message-input'),
            newConversationBtn: document.getElementById('new-chat-btn'),
            agentSelect: document.getElementById('agent-select'),
            sidebarToggle: document.getElementById('sidebar-toggle'),
            subjectSelect: document.getElementById('subject-select'),
            taskSelect: document.getElementById('task-select')
        };

        // Send message button
        if (elements.sendBtn && !elements.sendBtn.hasAttribute('data-listener-added')) {
            elements.sendBtn.addEventListener('click', () => this.sendMessage());
            elements.sendBtn.setAttribute('data-listener-added', 'true');
        }

        // Message input
        if (elements.messageInput && !elements.messageInput.hasAttribute('data-listener-added')) {
            elements.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            elements.messageInput.setAttribute('data-listener-added', 'true');
        }

        // New conversation button
        if (elements.newConversationBtn && !elements.newConversationBtn.hasAttribute('data-listener-added')) {
            elements.newConversationBtn.addEventListener('click', () => this.startNewConversation());
            elements.newConversationBtn.setAttribute('data-listener-added', 'true');
        }

        // Agent selection dropdown
        if (elements.agentSelect && !elements.agentSelect.hasAttribute('data-listener-added')) {
            elements.agentSelect.addEventListener('change', (e) => {
                this.switchAgent(e.target.value);
            });
            elements.agentSelect.setAttribute('data-listener-added', 'true');
        }

        // Sidebar toggle
        if (elements.sidebarToggle && !elements.sidebarToggle.hasAttribute('data-listener-added')) {
            elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
            elements.sidebarToggle.setAttribute('data-listener-added', 'true');
        }

        // Subject and task selects
        if (elements.subjectSelect && !elements.subjectSelect.hasAttribute('data-listener-added')) {
            elements.subjectSelect.addEventListener('change', () => {
                console.log('[DEBUG] Subject changed to:', elements.subjectSelect.value);
            });
            elements.subjectSelect.setAttribute('data-listener-added', 'true');
        }

        if (elements.taskSelect && !elements.taskSelect.hasAttribute('data-listener-added')) {
            elements.taskSelect.addEventListener('change', () => {
                console.log('[DEBUG] Task changed to:', elements.taskSelect.value);
            });
            elements.taskSelect.setAttribute('data-listener-added', 'true');
        }

        console.log('[DEBUG] Event listeners initialized');
    }

    restoreSidebarState() {
        const sidebar = document.getElementById('sidebar');
        const toggleIcon = document.getElementById('toggle-icon');
        const isCollapsed = localStorage.getItem('agentSidebarCollapsed') === 'true';

        if (sidebar && toggleIcon) {
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
                toggleIcon.textContent = '⟩';
            } else {
                sidebar.classList.remove('collapsed');
                toggleIcon.textContent = '⟨';
            }
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

        // Update agent select if needed
        const agentSelect = document.getElementById('agent-select');
        if (agentSelect && agentSelect.value !== agent) {
            agentSelect.value = agent;
        }

        // Update dropdowns for new agent
        this.updateDropdownsForAgent(agent);

        // Start new session for new agent
        this.startNewConversation();

        console.log('[DEBUG] Switched to agent:', agent);
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        const message = messageInput.value.trim();

        if (!message) {
            console.log('[DEBUG] Empty message, not sending');
            return;
        }

        console.log('[DEBUG] Sending message:', message.substring(0, 50) + '...');

        // Disable send button
        if (sendButton) {
            sendButton.disabled = true;
            sendButton.textContent = 'Sending...';
        }

        // Add user message to chat
        this.addMessageToChat('user', message);

        // Clear input
        messageInput.value = '';

        // Get form data
        const subject = document.getElementById('subject-select')?.value || 'general';
        const task = document.getElementById('task-select')?.value || 'help';
        const temperature = document.getElementById('temperature-slider')?.value || '7';
        const responseLength = document.getElementById('response-length')?.value || 'medium';
        const focusMode = document.getElementById('focus-mode')?.value || 'educational';
        const explanationStyle = document.getElementById('explanation-style')?.value || 'standard';
        const bahamianContext = document.getElementById('bahamian-context')?.checked || true;
        const stepByStep = document.getElementById('step-by-step')?.checked || true;

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
                    temperature: parseFloat(temperature) / 10, // Convert to 0-1 range
                    response_length: responseLength,
                    focus_mode: focusMode,
                    explanation_style: explanationStyle,
                    bahamian_context: bahamianContext,
                    step_by_step: stepByStep,
                    session_id: this.currentSessionId,
                    user_type: 'teacher'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            this.addMessageToChat('agent', data.response);

        } catch (error) {
            console.error('[ERROR] Failed to send message:', error);
            this.addMessageToChat('agent', `Sorry, I encountered an error: ${error.message}. Please try again.`);
        } finally {
            // Re-enable send button
            if (sendButton) {
                sendButton.disabled = false;
                sendButton.textContent = 'Send';
            }
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
        this.conversationHistory.push({ 
            sender, 
            message, 
            timestamp: new Date().toISOString() 
        });

        // Auto-save session
        this.saveChatSession();

        console.log('[DEBUG] Added message to chat:', sender);
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
        if (currentChatIndex >= 0) {
            this.saveChatSession();
        }

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

        // Clear chat window and add welcome message
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) {
            chatWindow.innerHTML = '';
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'message agent-message';
            welcomeDiv.innerHTML = '<strong>Welcome to VerityOS Education Agents!</strong> I\'m here to help you with educational tasks. Select an agent and start chatting!';
            chatWindow.appendChild(welcomeDiv);
        }

        // Update sidebar
        this.loadChatHistorySidebar();

        // Save session ID and sessions
        localStorage.setItem('agentCurrentSessionId', this.currentSessionId);
        localStorage.setItem('agentChatSessions', JSON.stringify(chatSessions));

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
                chatSessions[currentChatIndex].agent = this.currentAgent;
                chatSessions[currentChatIndex].timestamp = new Date().toISOString();

                // Update last message and title
                if (messages.length > 1) { // Skip welcome message
                    const lastMsg = messages[messages.length - 1];
                    const textContent = lastMsg.content.replace(/<[^>]*>/g, '').trim();
                    chatSessions[currentChatIndex].lastMessage = textContent.substring(0, 100);

                    // Set title from first user message
                    const firstUserMsg = messages.find(m => m.className.includes('user'));
                    if (firstUserMsg && chatSessions[currentChatIndex].title === 'New Chat') {
                        const titleText = firstUserMsg.content.replace(/<[^>]*>/g, '').trim();
                        chatSessions[currentChatIndex].title = titleText.substring(0, 50) + (titleText.length > 50 ? '...' : '');
                    }
                }

                // Save to localStorage
                localStorage.setItem('agentChatSessions', JSON.stringify(chatSessions));
                console.log('[DEBUG] Saved chat session:', chatSessions[currentChatIndex].id, 'with', messages.length, 'messages');
            }
        }
    }

    loadSessionHistory() {
        // Load from localStorage
        const savedSessions = JSON.parse(localStorage.getItem('agentChatSessions') || '[]');
        chatSessions = savedSessions;

        // Load chat history in sidebar
        this.loadChatHistorySidebar();

        // Try to load previous session
        const savedSessionId = localStorage.getItem('agentCurrentSessionId');
        if (savedSessionId && chatSessions.length > 0) {
            const sessionIndex = chatSessions.findIndex(s => s.id === savedSessionId);
            if (sessionIndex >= 0) {
                this.loadChatSession(sessionIndex);
                return;
            }
        }

        // If no previous session, start new one
        this.startNewConversation();

        // Also fetch sessions from backend
        this.fetchBackendSessions();
    }

    loadChatHistorySidebar() {
        const historyList = document.getElementById('chat-history-list');
        if (!historyList) return;

        historyList.innerHTML = '';

        chatSessions.forEach((chat, index) => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-history-item ${index === currentChatIndex ? 'active' : ''}`;

            const agentName = this.getAgentDisplayName(chat.agent);
            const date = new Date(chat.timestamp).toLocaleDateString();

            chatItem.innerHTML = `
                <div class="chat-title">${chat.title || 'New Chat'}</div>
                <div class="chat-preview">${chat.lastMessage || 'No messages yet'}</div>
                <div class="chat-meta">${agentName} • ${date}</div>
            `;

            chatItem.addEventListener('click', () => this.loadChatSession(index));
            historyList.appendChild(chatItem);
        });

        console.log('[DEBUG] Loaded chat history sidebar with', chatSessions.length, 'sessions');
    }

    getAgentDisplayName(agent) {
        const agentNames = {
            sage: '🧙‍♂️ Sage',
            echo: '🗣️ Echo',
            lucaya: '🔍 Lucaya',
            coral: '🪸 Coral',
            pineapple: '🍍 Pineapple',
            quill: '✏️ Quill'
        };
        return agentNames[agent] || agent.charAt(0).toUpperCase() + agent.slice(1);
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

            const agentName = this.getAgentDisplayName(session.agent);
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
        if (index < 0 || index >= chatSessions.length) return;

        // Save current session first
        if (currentChatIndex >= 0) {
            this.saveChatSession();
        }

        const chat = chatSessions[index];
        currentChatIndex = index;
        this.currentSessionId = chat.id;

        // Switch agent if different
        if (chat.agent !== this.currentAgent) {
            this.currentAgent = chat.agent;
            this.updateDropdownsForAgent(chat.agent);
            
            // Update agent select
            const agentSelect = document.getElementById('agent-select');
            if (agentSelect) {
                agentSelect.value = chat.agent;
            }
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
                // Show welcome message if no messages
                const welcomeDiv = document.createElement('div');
                welcomeDiv.className = 'message agent-message';
                welcomeDiv.innerHTML = '<strong>Welcome to VerityOS Education Agents!</strong> I\'m here to help you with educational tasks. Select an agent and start chatting!';
                chatWindow.appendChild(welcomeDiv);
            }

            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        // Update sidebar to show active session
        this.loadChatHistorySidebar();

        // Save current session ID
        localStorage.setItem('agentCurrentSessionId', this.currentSessionId);

        console.log('[DEBUG] Loaded chat session:', chat.id, 'with', chat.messages?.length || 0, 'messages');
    }
}
