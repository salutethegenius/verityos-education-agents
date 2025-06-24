// Complete console override to block Radix UI
(function() {
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
    };

    ['log', 'warn', 'error', 'info'].forEach(method => {
        console[method] = function(...args) {
            const message = args.join(' ');
            if (message.includes('[RADIX]') || 
                message.includes('Radix UI') || 
                message.includes('radix')) {
                return; // Block all Radix messages
            }
            originalConsole[method].apply(console, args);
        };
    });

    // Block Radix UI globals safely
    try {
        if (!window.RadixUI) {
            Object.defineProperty(window, 'RadixUI', {
                get: () => undefined,
                set: () => {},
                configurable: true,
                enumerable: false
            });
        }
    } catch (e) {
        // Ignore if property already exists and is non-configurable
    }

    try {
        if (!window.Radix) {
            Object.defineProperty(window, 'Radix', {
                get: () => undefined,
                set: () => {},
                configurable: true,
                enumerable: false
            });
        }
    } catch (e) {
        // Ignore if property already exists and is non-configurable
    }
})();

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
        const sendBtn = document.getElementById('send-btn');
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
        const newConversationBtn = document.getElementById('new-conversation');
        if (newConversationBtn) {
            newConversationBtn.addEventListener('click', () => this.startNewConversation());
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
        this.currentSessionId = this.generateSessionId();
        this.conversationHistory = [];

        // Clear chat window
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) {
            chatWindow.innerHTML = '';
        }

        console.log('[DEBUG] New session created:', this.currentSessionId);
    }

    loadSessionHistory() {
        // Try to load previous session
        const savedSessionId = localStorage.getItem('current_session_id');
        if (savedSessionId) {
            this.currentSessionId = savedSessionId;
            console.log('[DEBUG] Loaded chat session:', savedSessionId);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatInterface();
});