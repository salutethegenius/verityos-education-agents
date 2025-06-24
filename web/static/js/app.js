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
    return document.body?.classList?.contains("agent-interface") ||
           window.location.pathname.includes("/agents") ||
           document.querySelector("#controls-sidebar") ||
           window.location.pathname === "/";
  }

  // 🧹 Session Cleanup
  function cleanupOldSessions() {
    if (window.__VerityOS_Global__.sessionId) return;

    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

      for (const key of keys) {
        if (key.startsWith("verityos_session_") || key.startsWith("agentChatSessions")) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            const sessionTime = data.created || data.timestamp || 0;
            if ((now - new Date(sessionTime).getTime()) > MAX_AGE) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key); // Remove corrupted entries
          }
        }
      }
    } catch (e) {
      console.warn("[SessionCleanup] Failed:", e);
    }
  }

  // 🎛️ UI Initialization Functions
  function updateDropdowns(agent) {
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
    if (window.__VerityOS_Global__.initialized) {
      console.debug("[DEBUG] Agent Interface already initialized. Skipping...");
      return;
    }

    console.debug("[DEBUG] DOM loaded, initializing...");

    window.__VerityOS_Global__.initialized = true;

    // 🧠 Setup session
    const sessionId = `verityos_session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.__VerityOS_Global__.sessionId = sessionId;
    localStorage.setItem(sessionId, JSON.stringify({ created: Date.now() }));

    // 🎛️ Initialize UI elements
    try {
      updateDropdowns("sage");
      initializeTemperatureSlider();
      console.debug("[DEBUG] Temperature slider initialized successfully");
    } catch (e) {
      console.warn("[DEBUG] Failed during UI initialization", e);
    }

    console.debug("[DEBUG] Initialization complete");
  }

  // 🔐 Safe Global Property Exposure
  try {
    if (!Object.getOwnPropertyDescriptor(window, 'VerityOSAgentState')) {
      Object.defineProperty(window, 'VerityOSAgentState', {
        value: window.__VerityOS_Global__,
        configurable: false,
        writable: false,
      });
    }
  } catch (e) {
    console.warn("[DEBUG] Failed to define global VerityOSAgentState", e);
  }

  // 🚀 One-Time DOM Ready Guard
  document.addEventListener("DOMContentLoaded", () => {
    if (isAgentInterface()) {
      cleanupOldSessions();
      initializeAgentInterface();
    } else {
      console.debug("[DEBUG] Not an agent interface. Skipping initialization.");
    }
  });
})();

console.log('[DEBUG] VerityOS Agent Interface script loaded');