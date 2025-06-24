
(function () {
  // 🛡️ Singleton Global State
  if (!window.__VerityOS_Global__) {
    window.__VerityOS_Global__ = {
      initialized: false,
      sessionId: null,
      chatInterface: null,
    };
  }

  // 🧠 Reliable Interface Check
  function isAgentInterface() {
    const hasAgentClass = document.body?.classList?.contains("agent-interface");
    const hasControlsSidebar = document.querySelector("#controls-sidebar") !== null;
    const isRootPath = window.location.pathname === "/";
    
    // Only consider it an agent interface if we have specific agent elements
    return hasAgentClass || (hasControlsSidebar && isRootPath);
  }

  // 🧹 Session Cleanup
  function cleanupOldSessions() {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
      let cleanedCount = 0;

      for (const key of keys) {
        if (key.startsWith("verityos_session_") || 
            key.startsWith("agentChatSessions") ||
            key.startsWith("sage_session") ||
            key.startsWith("studentChatSessions")) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            const sessionTime = data.created || data.timestamp || 0;
            if ((now - new Date(sessionTime).getTime()) > MAX_AGE) {
              localStorage.removeItem(key);
              cleanedCount++;
            }
          } catch (e) {
            localStorage.removeItem(key); // Remove corrupted entries
            cleanedCount++;
          }
        }
      }
      
      if (cleanedCount > 0) {
        console.debug(`[SessionCleanup] Cleaned ${cleanedCount} old sessions`);
      }
    } catch (e) {
      console.warn("[SessionCleanup] Failed:", e);
    }
  }

  // 💬 ChatInterface Class
  class ChatInterface {
    constructor() {
      this.sessions = [];
      this.currentSessionIndex = -1;
      this.currentAgent = 'sage';
      this.isInitialized = false;
    }

    async init() {
      if (this.isInitialized) {
        console.debug('[ChatInterface] Already initialized');
        return;
      }

      try {
        await this.loadBackendSessions();
        this.loadLocalSessions();
        this.initializeDropdowns();
        this.initializeTemperatureSlider();
        this.initializeEventListeners();
        this.loadChatHistorySidebar();
        
        // Load first session or create new one
        if (this.sessions.length === 0) {
          this.startNewChat();
        } else {
          this.loadChatSession(0);
        }

        this.isInitialized = true;
        console.debug('[DEBUG] ChatInterface initialization complete');
      } catch (error) {
        console.error('[ChatInterface] Initialization failed:', error);
      }
    }

    async loadBackendSessions() {
      try {
        const response = await fetch('/api/sessions/list');
        const data = await response.json();
        console.debug('[DEBUG] Found backend sessions:', data);
        return data.sessions || [];
      } catch (error) {
        console.warn('[ChatInterface] Failed to load backend sessions:', error);
        return [];
      }
    }

    loadLocalSessions() {
      try {
        const stored = localStorage.getItem('agentChatSessions');
        if (stored) {
          this.sessions = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('[ChatInterface] Failed to load local sessions:', error);
        this.sessions = [];
      }
    }

    saveSessions() {
      try {
        cleanupOldSessions();
        localStorage.setItem('agentChatSessions', JSON.stringify(this.sessions));
      } catch (error) {
        console.warn('[ChatInterface] Failed to save sessions:', error);
      }
    }

    generateSessionId() {
      return `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }

    startNewChat() {
      const sessionId = this.generateSessionId();
      const newSession = {
        id: sessionId,
        agent: this.currentAgent,
        title: 'New Chat',
        timestamp: new Date().toISOString(),
        messages: [],
        lastMessage: ''
      };

      this.sessions.unshift(newSession);
      this.currentSessionIndex = 0;
      this.saveSessions();
      this.loadChatHistorySidebar();
      this.clearChatWindow();
      
      console.debug('[DEBUG] New session created:', sessionId);
    }

    loadChatSession(index) {
      if (index < 0 || index >= this.sessions.length) return;

      // Save current session first
      if (this.currentSessionIndex >= 0) {
        this.saveChatSession();
      }

      const session = this.sessions[index];
      this.currentSessionIndex = index;
      this.currentAgent = session.agent;

      // Update UI
      const agentSelect = document.getElementById('agent-select');
      if (agentSelect) {
        agentSelect.value = this.currentAgent;
        this.updateDropdowns(this.currentAgent);
      }

      // Load messages
      this.displayChatHistory(session.messages);
      this.loadChatHistorySidebar();

      console.debug('[DEBUG] Loaded chat session:', session.id, 'with', session.messages.length, 'messages');
    }

    saveChatSession() {
      if (this.currentSessionIndex < 0) return;

      const session = this.sessions[this.currentSessionIndex];
      if (!session) return;

      // Capture messages from chat window
      const chatWindow = document.getElementById('chat-window');
      if (chatWindow) {
        const messages = Array.from(chatWindow.children).map(msg => ({
          className: msg.className,
          content: msg.innerHTML
        }));
        
        session.messages = messages;
        if (messages.length > 0) {
          const lastMsg = messages[messages.length - 1];
          session.lastMessage = lastMsg.content.replace(/<[^>]*>/g, '').substring(0, 50);
        }
      }

      this.saveSessions();
      console.debug('[DEBUG] Saved chat session:', session.id, 'with', session.messages.length, 'messages');
    }

    displayChatHistory(messages) {
      const chatWindow = document.getElementById('chat-window');
      if (!chatWindow) return;

      chatWindow.innerHTML = '';
      
      if (messages && messages.length > 0) {
        messages.forEach(msg => {
          const messageDiv = document.createElement('div');
          messageDiv.className = msg.className;
          messageDiv.innerHTML = msg.content;
          chatWindow.appendChild(messageDiv);
        });
      }

      chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    clearChatWindow() {
      const chatWindow = document.getElementById('chat-window');
      if (chatWindow) {
        chatWindow.innerHTML = '';
      }
    }

    loadChatHistorySidebar() {
      const historyList = document.getElementById('chat-history-list');
      if (!historyList) return;

      historyList.innerHTML = '';

      this.sessions.forEach((session, index) => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-history-item ${index === this.currentSessionIndex ? 'active' : ''}`;

        const agentName = session.agent.charAt(0).toUpperCase() + session.agent.slice(1);
        const date = new Date(session.timestamp).toLocaleDateString();

        chatItem.innerHTML = `
          <div class="chat-content">
            <div class="chat-title">${session.title || 'New Chat'}</div>
            <div class="chat-preview">${session.lastMessage || 'No messages yet'}</div>
            <div class="chat-meta">${agentName} • ${date}</div>
          </div>
        `;

        chatItem.addEventListener('click', () => this.loadChatSession(index));
        historyList.appendChild(chatItem);
      });

      console.debug('[DEBUG] Loaded chat history sidebar with', this.sessions.length, 'sessions');
    }

    initializeDropdowns() {
      updateDropdowns(this.currentAgent);
      console.debug('[DEBUG] Dropdowns initialized');
    }

    initializeTemperatureSlider() {
      initializeTemperatureSlider();
      console.debug('[DEBUG] Temperature slider initialized successfully');
    }

    initializeEventListeners() {
      // New chat button
      const newChatBtn = document.getElementById('new-chat-btn');
      if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
          this.startNewChat();
        });
      }

      // Agent select change
      const agentSelect = document.getElementById('agent-select');
      if (agentSelect) {
        agentSelect.addEventListener('change', (e) => {
          this.currentAgent = e.target.value;
          this.updateDropdowns(this.currentAgent);
        });
      }

      console.debug('[DEBUG] Event listeners initialized');
    }

    updateDropdowns(agent) {
      updateDropdowns(agent);
      const config = getAgentConfig(agent);
      console.debug(`[DEBUG] Updated dropdowns for ${agent}: subjects=${config.subjects.length}, tasks=${config.tasks.length}`);
    }
  }

  // 🎛️ UI Initialization Functions
  function getAgentConfig(agent) {
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

    return agentConfigs[agent] || agentConfigs.sage;
  }

  function updateDropdowns(agent) {
    const subjectSelect = document.getElementById('subject-select');
    const taskSelect = document.getElementById('task-select');

    if (!subjectSelect || !taskSelect) return;

    const config = getAgentConfig(agent);

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

    console.debug(`[DEBUG] Updated dropdowns for ${agent}: subject=${config.subjects[0].value}, task=${config.tasks[0].value}`);
  }

  function initializeTemperatureSlider() {
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

    temperatureSlider.addEventListener('input', updateTemperature);
    updateTemperature(); // Set initial value
  }

  // 📦 Main Init Function
  function initializeAgentInterface() {
    if (window.__VerityOS_Global__.initialized || document.body.hasAttribute('data-agent-initialized')) {
      console.debug("[DEBUG] Agent Interface already initialized. Skipping...");
      return;
    }

    console.debug("[DEBUG] DOM loaded, initializing...");

    window.__VerityOS_Global__.initialized = true;
    document.body.setAttribute('data-agent-initialized', 'true');

    // 🧠 Setup session
    const sessionId = `verityos_session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.__VerityOS_Global__.sessionId = sessionId;
    localStorage.setItem(sessionId, JSON.stringify({ created: Date.now() }));

    // 💬 Initialize ChatInterface
    try {
      const chatInterface = new ChatInterface();
      window.__VerityOS_Global__.chatInterface = chatInterface;
      chatInterface.init();
    } catch (e) {
      console.warn("[DEBUG] Failed during ChatInterface initialization", e);
    }

    console.debug("[DEBUG] Initialization complete");
  }

  // 🔐 Safe Global Property Exposure
  try {
    if (!window.hasOwnProperty('VerityOSAgentState')) {
      window.VerityOSAgentState = window.__VerityOS_Global__;
    }
  } catch (e) {
    console.warn("[DEBUG] Failed to define global VerityOSAgentState", e);
  }

  // 🚀 One-Time DOM Ready Guard
  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", handleDOMReady);
  } else {
    handleDOMReady();
  }
  
  function handleDOMReady() {
    // Prevent student app conflicts
    if (document.body.classList.contains('student-interface')) {
      console.debug("[DEBUG] Student interface detected, skipping agent initialization");
      return;
    }

    if (isAgentInterface() && !window.__VerityOS_Global__.initialized) {
      cleanupOldSessions();
      initializeAgentInterface();
    } else {
      console.debug("[DEBUG] Not an agent interface or already initialized. Skipping.");
    }
  }
})();

console.log('[DEBUG] VerityOS Agent Interface script loaded');
