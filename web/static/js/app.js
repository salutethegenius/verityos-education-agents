
// VerityOS Education Platform - Agent Interface
// Production-hardened with lifecycle management and error handling

// Global initialization guard
if (!window.__VERITYOS_APP_INITIALIZED__) {
    window.__VERITYOS_APP_INITIALIZED__ = true;

    // Event manager for safe cleanup
    class EventManager {
        constructor() {
            this.listeners = [];
        }

        addListener(element, type, handler, options = {}) {
            if (!element) return;
            
            element.addEventListener(type, handler, options);
            this.listeners.push(() => {
                try {
                    element.removeEventListener(type, handler, options);
                } catch (e) {
                    console.warn('[EVENT] Failed to remove listener:', e);
                }
            });
        }

        cleanup() {
            this.listeners.forEach(remove => {
                try {
                    remove();
                } catch (e) {
                    console.warn('[EVENT] Cleanup error:', e);
                }
            });
            this.listeners.length = 0;
        }
    }

    // Session manager for proper lifecycle
    class SessionManager {
        constructor() {
            this.sessions = this.loadSessions();
            this.currentIndex = -1;
            this.currentSessionId = this.generateSessionId();
        }

        loadSessions() {
            try {
                const saved = localStorage.getItem('agentChatSessions');
                return saved ? JSON.parse(saved) : [];
            } catch (e) {
                console.warn('[SESSION] Failed to load sessions:', e);
                return [];
            }
        }

        saveSessions() {
            try {
                localStorage.setItem('agentChatSessions', JSON.stringify(this.sessions));
            } catch (e) {
                console.warn('[SESSION] Failed to save sessions:', e);
            }
        }

        generateSessionId() {
            return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        createNewSession(agent) {
            const newSession = {
                id: this.generateSessionId(),
                agent: agent,
                title: 'New Chat',
                lastMessage: '',
                timestamp: new Date().toISOString(),
                messages: []
            };

            this.sessions.unshift(newSession);
            this.currentIndex = 0;
            this.currentSessionId = newSession.id;
            
            // Limit session history to prevent bloat
            if (this.sessions.length > 50) {
                this.sessions = this.sessions.slice(0, 50);
            }

            this.saveSessions();
            return newSession;
        }

        getCurrentSession() {
            return this.currentIndex >= 0 ? this.sessions[this.currentIndex] : null;
        }

        saveCurrentSession(messages, agent) {
            const session = this.getCurrentSession();
            if (!session) return;

            session.messages = messages;
            session.agent = agent;
            session.timestamp = new Date().toISOString();

            // Update title and last message
            if (messages.length > 1) {
                const lastMsg = messages[messages.length - 1];
                if (lastMsg && lastMsg.content) {
                    const textContent = lastMsg.content.replace(/<[^>]*>/g, '').trim();
                    session.lastMessage = textContent.substring(0, 100);

                    // Set title from first user message
                    const firstUserMsg = messages.find(m => m.className && m.className.includes('user'));
                    if (firstUserMsg && session.title === 'New Chat') {
                        const titleText = firstUserMsg.content.replace(/<[^>]*>/g, '').trim();
                        const words = titleText.split(' ');
                        session.title = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
                    }
                }
            }

            this.saveSessions();
        }

        loadSession(index) {
            if (index < 0 || index >= this.sessions.length) return null;
            
            this.currentIndex = index;
            this.currentSessionId = this.sessions[index].id;
            localStorage.setItem('agentCurrentSessionId', this.currentSessionId);
            
            return this.sessions[index];
        }
    }

    // Main chat interface class
    class ChatInterface {
        constructor() {
            this.currentAgent = 'sage';
            this.eventManager = new EventManager();
            this.sessionManager = new SessionManager();
            this.isInitialized = false;
            this.conversationHistory = [];

            // Bind methods to preserve context
            this.sendMessage = this.sendMessage.bind(this);
            this.startNewConversation = this.startNewConversation.bind(this);
            this.toggleSidebar = this.toggleSidebar.bind(this);
        }

        init() {
            if (this.isInitialized) {
                console.warn('[CHAT] Already initialized, skipping');
                return;
            }

            try {
                console.log('[CHAT] Initializing ChatInterface...');

                // Check if we're on the right interface
                if (!this.isAgentInterface()) {
                    console.log('[CHAT] Not agent interface, skipping initialization');
                    return;
                }

                this.initializeDropdowns();
                this.initializeTemperatureSlider();
                this.initializeEventListeners();
                this.loadSessionHistory();
                this.restoreSidebarState();

                this.isInitialized = true;
                console.log('[CHAT] ChatInterface initialization complete');

            } catch (error) {
                console.error('[CHAT] Initialization failed:', error);
            }
        }

        isAgentInterface() {
            // Multiple checks for robust detection
            return document.body.classList.contains('agent-interface') ||
                   document.getElementById('agent-controls') !== null ||
                   window.location.pathname === '/' ||
                   window.location.pathname.includes('agent');
        }

        initializeDropdowns() {
            const agentSelect = document.getElementById('agent-select');
            if (!agentSelect) {
                console.warn('[CHAT] Agent select not found');
                return;
            }

            agentSelect.value = this.currentAgent;
            this.updateDropdownsForAgent(this.currentAgent);
            console.log('[CHAT] Dropdowns initialized');
        }

        updateDropdownsForAgent(agent) {
            const subjectSelect = document.getElementById('subject-select');
            const taskSelect = document.getElementById('task-select');

            if (!subjectSelect || !taskSelect) return;

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
                },
                quill: {
                    subjects: [
                        { value: 'writing', text: 'Writing' },
                        { value: 'grammar', text: 'Grammar' },
                        { value: 'essay', text: 'Essay Writing' },
                        { value: 'assessment', text: 'Assessment' },
                        { value: 'feedback', text: 'Feedback' }
                    ],
                    tasks: [
                        { value: 'grade essay', text: 'Grade Essay' },
                        { value: 'writing help', text: 'Writing Help' },
                        { value: 'grammar check', text: 'Grammar Check' },
                        { value: 'feedback', text: 'Provide Feedback' }
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

            console.log(`[CHAT] Updated dropdowns for ${agent}`);
        }

        initializeTemperatureSlider() {
            const temperatureSlider = document.getElementById('temperature-slider');
            const temperatureValue = document.getElementById('temperature-value');

            if (!temperatureSlider || !temperatureValue) return;

            const updateTemperature = () => {
                try {
                    const value = Math.max(0, Math.min(10, parseInt(temperatureSlider.value, 10) || 7));
                    temperatureSlider.value = value;
                    temperatureValue.textContent = value;
                } catch (e) {
                    console.warn('[TEMP] Slider update error:', e);
                }
            };

            this.eventManager.addListener(temperatureSlider, 'input', updateTemperature);
            updateTemperature(); // Set initial value

            console.log('[CHAT] Temperature slider initialized');
        }

        initializeEventListeners() {
            // Get elements
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
            if (elements.sendBtn) {
                this.eventManager.addListener(elements.sendBtn, 'click', this.sendMessage);
            }

            // Message input - Enter key
            if (elements.messageInput) {
                this.eventManager.addListener(elements.messageInput, 'keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });
            }

            // New conversation button
            if (elements.newConversationBtn) {
                this.eventManager.addListener(elements.newConversationBtn, 'click', this.startNewConversation);
            }

            // Agent selection
            if (elements.agentSelect) {
                this.eventManager.addListener(elements.agentSelect, 'change', (e) => {
                    this.switchAgent(e.target.value);
                });
            }

            // Sidebar toggle
            if (elements.sidebarToggle) {
                this.eventManager.addListener(elements.sidebarToggle, 'click', this.toggleSidebar);
            }

            // Subject and task selects
            if (elements.subjectSelect) {
                this.eventManager.addListener(elements.subjectSelect, 'change', () => {
                    console.log('[CHAT] Subject changed to:', elements.subjectSelect.value);
                });
            }

            if (elements.taskSelect) {
                this.eventManager.addListener(elements.taskSelect, 'change', () => {
                    console.log('[CHAT] Task changed to:', elements.taskSelect.value);
                });
            }

            console.log('[CHAT] Event listeners initialized');
        }

        restoreSidebarState() {
            const sidebar = document.getElementById('sidebar');
            const toggleIcon = document.getElementById('toggle-icon');
            
            if (!sidebar || !toggleIcon) return;

            try {
                const isCollapsed = localStorage.getItem('agentSidebarCollapsed') === 'true';
                if (isCollapsed) {
                    sidebar.classList.add('collapsed');
                    toggleIcon.textContent = '⟩';
                } else {
                    sidebar.classList.remove('collapsed');
                    toggleIcon.textContent = '⟨';
                }
            } catch (e) {
                console.warn('[SIDEBAR] Failed to restore state:', e);
            }
        }

        toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const toggleIcon = document.getElementById('toggle-icon');

            if (!sidebar || !toggleIcon) return;

            try {
                sidebar.classList.toggle('collapsed');
                toggleIcon.textContent = sidebar.classList.contains('collapsed') ? '⟩' : '⟨';
                localStorage.setItem('agentSidebarCollapsed', sidebar.classList.contains('collapsed'));
            } catch (e) {
                console.warn('[SIDEBAR] Toggle failed:', e);
            }
        }

        switchAgent(agent) {
            this.currentAgent = agent;
            this.updateDropdownsForAgent(agent);
            this.startNewConversation();
            console.log('[CHAT] Switched to agent:', agent);
        }

        async sendMessage() {
            const messageInput = document.getElementById('message-input');
            const sendButton = document.getElementById('send-button');
            
            if (!messageInput || !sendButton) return;

            const message = messageInput.value.trim();
            if (!message) return;

            console.log('[CHAT] Sending message:', message.substring(0, 50) + '...');

            // Update UI
            sendButton.disabled = true;
            sendButton.textContent = 'Sending...';

            try {
                // Add user message to chat
                this.addMessageToChat('user', message);
                messageInput.value = '';

                // Get form data with safe defaults
                const formData = {
                    subject: this.getSelectValue('subject-select', 'general'),
                    task: this.getSelectValue('task-select', 'help'),
                    temperature: this.getTemperatureValue(),
                    response_length: this.getSelectValue('response-length', 'medium'),
                    focus_mode: this.getSelectValue('focus-mode', 'educational'),
                    explanation_style: this.getSelectValue('explanation-style', 'standard'),
                    bahamian_context: this.getCheckboxValue('bahamian-context', true),
                    step_by_step: this.getCheckboxValue('step-by-step', true),
                    session_id: this.sessionManager.currentSessionId,
                    user_type: 'teacher'
                };

                // Send to API
                const response = await fetch(`/api/${this.currentAgent}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, ...formData })
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
                console.error('[CHAT] Send message failed:', error);
                this.addMessageToChat('agent', `Sorry, I encountered an error: ${error.message}. Please try again.`);
            } finally {
                // Restore UI
                sendButton.disabled = false;
                sendButton.textContent = 'Send';
            }
        }

        getSelectValue(id, defaultValue) {
            const element = document.getElementById(id);
            return element ? element.value : defaultValue;
        }

        getCheckboxValue(id, defaultValue) {
            const element = document.getElementById(id);
            return element ? element.checked : defaultValue;
        }

        getTemperatureValue() {
            try {
                const slider = document.getElementById('temperature-slider');
                if (!slider) return 0.7;
                
                const value = Math.max(0, Math.min(10, parseInt(slider.value, 10) || 7));
                return Math.min(1.0, Math.max(0.0, value / 10));
            } catch (e) {
                console.warn('[TEMP] Failed to get temperature:', e);
                return 0.7;
            }
        }

        addMessageToChat(sender, message) {
            const chatWindow = document.getElementById('chat-window');
            if (!chatWindow) return;

            try {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${sender}-message`;

                const messageContent = document.createElement('div');
                messageContent.className = 'message-content';
                messageContent.innerHTML = this.formatMessage(message);

                messageDiv.appendChild(messageContent);
                chatWindow.appendChild(messageDiv);
                chatWindow.scrollTop = chatWindow.scrollHeight;

                // Add to conversation history
                this.conversationHistory.push({ 
                    sender, 
                    message, 
                    timestamp: new Date().toISOString() 
                });

                // Auto-save session
                this.saveCurrentSession();

            } catch (e) {
                console.error('[CHAT] Failed to add message:', e);
            }
        }

        formatMessage(message) {
            if (typeof message !== 'string') return '';
            
            return message
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
        }

        startNewConversation() {
            try {
                // Save current session
                this.saveCurrentSession();

                // Create new session
                this.sessionManager.createNewSession(this.currentAgent);
                this.conversationHistory = [];

                // Clear chat window
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

                console.log('[CHAT] New conversation started:', this.sessionManager.currentSessionId);

            } catch (e) {
                console.error('[CHAT] Failed to start new conversation:', e);
            }
        }

        saveCurrentSession() {
            try {
                const chatWindow = document.getElementById('chat-window');
                if (!chatWindow) return;

                const messages = Array.from(chatWindow.children).map(msg => ({
                    className: msg.className,
                    content: msg.innerHTML
                }));

                this.sessionManager.saveCurrentSession(messages, this.currentAgent);

            } catch (e) {
                console.error('[CHAT] Failed to save session:', e);
            }
        }

        loadSessionHistory() {
            try {
                this.loadChatHistorySidebar();

                // Try to load previous session
                const savedSessionId = localStorage.getItem('agentCurrentSessionId');
                if (savedSessionId && this.sessionManager.sessions.length > 0) {
                    const sessionIndex = this.sessionManager.sessions.findIndex(s => s.id === savedSessionId);
                    if (sessionIndex >= 0) {
                        this.loadChatSession(sessionIndex);
                        return;
                    }
                }

                // Start new conversation if no previous session
                this.startNewConversation();

                // Fetch backend sessions
                this.fetchBackendSessions();

            } catch (e) {
                console.error('[CHAT] Failed to load session history:', e);
                this.startNewConversation();
            }
        }

        loadChatHistorySidebar() {
            const historyList = document.getElementById('chat-history-list');
            if (!historyList) return;

            try {
                historyList.innerHTML = '';

                this.sessionManager.sessions.forEach((chat, index) => {
                    const chatItem = document.createElement('div');
                    chatItem.className = `chat-history-item ${index === this.sessionManager.currentIndex ? 'active' : ''}`;
                    
                    const agentName = this.getAgentDisplayName(chat.agent);
                    const date = new Date(chat.timestamp).toLocaleDateString();

                    chatItem.innerHTML = `
                        <div class="chat-title">${chat.title || 'New Chat'}</div>
                        <div class="chat-preview">${chat.lastMessage || 'No messages yet'}</div>
                        <div class="chat-meta">${agentName} • ${date}</div>
                    `;

                    this.eventManager.addListener(chatItem, 'click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.loadChatSession(index);
                    });
                    
                    historyList.appendChild(chatItem);
                });

                console.log('[CHAT] Loaded chat history sidebar:', this.sessionManager.sessions.length, 'sessions');

            } catch (e) {
                console.error('[CHAT] Failed to load sidebar:', e);
            }
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
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const backendSessions = await response.json();
                    console.log('[CHAT] Found backend sessions:', backendSessions);
                    this.mergeBackendSessions(backendSessions);
                }
            } catch (error) {
                console.log('[CHAT] Could not fetch backend sessions:', error);
            }
        }

        mergeBackendSessions(backendSessions) {
            const historyList = document.getElementById('chat-history-list');
            if (!historyList || !backendSessions.sessions) return;

            try {
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

                    this.eventManager.addListener(chatItem, 'click', () => {
                        this.loadBackendSession(session.session_id, session.agent);
                    });
                    
                    historyList.appendChild(chatItem);
                });
            } catch (e) {
                console.error('[CHAT] Failed to merge backend sessions:', e);
            }
        }

        async loadBackendSession(sessionId, agent) {
            try {
                const response = await fetch(`/api/${agent}/session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'load_session',
                        session_id: sessionId
                    })
                });

                if (response.ok) {
                    const sessionData = await response.json();
                    if (sessionData && sessionData.session_id) {
                        this.loadSessionFromData(sessionData, agent);
                    }
                }
            } catch (error) {
                console.error('[CHAT] Failed to load backend session:', error);
            }
        }

        loadSessionFromData(sessionData, agent) {
            try {
                // Switch agent if different
                if (agent !== this.currentAgent) {
                    this.switchAgent(agent);
                }

                // Set session data
                this.sessionManager.currentSessionId = sessionData.session_id;
                this.conversationHistory = sessionData.conversation_history || [];

                // Load messages in chat window
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

                console.log('[CHAT] Loaded session from backend:', sessionData.session_id);

            } catch (e) {
                console.error('[CHAT] Failed to load session data:', e);
            }
        }

        loadChatSession(index) {
            try {
                const session = this.sessionManager.loadSession(index);
                if (!session) {
                    console.error('[CHAT] Session not found at index:', index);
                    return;
                }

                console.log('[CHAT] Loading session:', session.id);

                // Switch agent if different
                if (session.agent !== this.currentAgent) {
                    this.currentAgent = session.agent;
                    this.updateDropdownsForAgent(session.agent);
                    
                    const agentSelect = document.getElementById('agent-select');
                    if (agentSelect) {
                        agentSelect.value = session.agent;
                    }
                }

                // Load messages
                const chatWindow = document.getElementById('chat-window');
                if (chatWindow) {
                    chatWindow.innerHTML = '';

                    if (session.messages && session.messages.length > 0) {
                        session.messages.forEach(msg => {
                            const messageDiv = document.createElement('div');
                            messageDiv.className = msg.className || 'message';
                            messageDiv.innerHTML = msg.content || '';
                            chatWindow.appendChild(messageDiv);
                        });
                    } else {
                        // Show welcome message
                        const welcomeDiv = document.createElement('div');
                        welcomeDiv.className = 'message agent-message';
                        welcomeDiv.innerHTML = '<strong>Welcome to VerityOS Education Agents!</strong> I\'m here to help you with educational tasks. Select an agent and start chatting!';
                        chatWindow.appendChild(welcomeDiv);
                    }

                    chatWindow.scrollTop = chatWindow.scrollHeight;
                }

                // Update sidebar active state
                const allItems = document.querySelectorAll('.chat-history-item');
                allItems.forEach((item, i) => {
                    if (i === index) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });

                console.log('[CHAT] Successfully loaded session:', session.id);

            } catch (e) {
                console.error('[CHAT] Failed to load chat session:', e);
            }
        }

        cleanup() {
            try {
                this.saveCurrentSession();
                this.eventManager.cleanup();
                this.isInitialized = false;
                console.log('[CHAT] Cleanup complete');
            } catch (e) {
                console.error('[CHAT] Cleanup failed:', e);
            }
        }
    }

    // Initialize when DOM is ready
    let chatInterface = null;

    document.addEventListener('DOMContentLoaded', () => {
        try {
            console.log('[DEBUG] DOM loaded, initializing...');
            
            chatInterface = new ChatInterface();
            chatInterface.init();
            
            // Expose for debugging
            if (!window.VerityOSAgentState) {
                Object.defineProperty(window, 'VerityOSAgentState', {
                    value: { chatInterface },
                    configurable: true,
                    writable: false
                });
            }

            console.log('[DEBUG] Initialization complete');

        } catch (error) {
            console.error('[DEBUG] Initialization failed:', error);
        }
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (chatInterface) {
            chatInterface.cleanup();
        }
    });

    // Handle visibility change for proper cleanup
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && chatInterface) {
            chatInterface.saveCurrentSession();
        }
    });
}

console.log('[DEBUG] VerityOS Agent Interface script loaded');
