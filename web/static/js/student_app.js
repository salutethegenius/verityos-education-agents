
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

// Dynamic help content based on agent, subject, and activity
const dynamicHelp = {
    'sage': {
        'math': {
            'homework': {
                title: '🧙‍♂️ Sage - Math Homework Help',
                samples: [
                    '• "What is 25 + 47?"',
                    '• "Help me solve: 2x + 5 = 15"',
                    '• "If a conch salad costs $8 BSD and I buy 3, how much do I spend?"',
                    '• "What\'s the area of Nassau if it\'s 21 miles long and 7 miles wide?"',
                    '• "Check my work: 12 × 8 = 96"',
                    '• "I need help with fractions"'
                ]
            },
            'study': {
                title: '🧙‍♂️ Sage - Math Study Session',
                samples: [
                    '• "Explain fractions using Bahamian examples"',
                    '• "Give me study tips for my BGCSE math exam"',
                    '• "Practice problems for division please"',
                    '• "I don\'t understand fractions at all"',
                    '• "Create a study plan for geometry"',
                    '• "Help me memorize the multiplication tables"'
                ]
            },
            'quiz': {
                title: '🧙‍♂️ Sage - Math Practice Quiz',
                samples: [
                    '• "Quiz me on multiplication tables"',
                    '• "Test me on fractions"',
                    '• "Give me 5 algebra problems"',
                    '• "Quiz me on area and perimeter"',
                    '• "Practice questions for my math test"',
                    '• "Random math problems please"'
                ]
            }
        },
        'science': {
            'homework': {
                title: '🧙‍♂️ Sage - Science Homework Help',
                samples: [
                    '• "What is photosynthesis?"',
                    '• "Explain how coral reefs work in the Bahamas"',
                    '• "Help me with my biology worksheet"',
                    '• "What animals live in Bahamian mangroves?"',
                    '• "How does climate change affect our islands?"',
                    '• "Explain the water cycle"'
                ]
            },
            'study': {
                title: '🧙‍♂️ Sage - Science Study Session',
                samples: [
                    '• "Why do hurricanes form in our region?"',
                    '• "Study guide for marine biology"',
                    '• "Help me understand ecosystems"',
                    '• "Review photosynthesis with me"',
                    '• "Explain Bahamian wildlife adaptations"',
                    '• "Study tips for my science exam"'
                ]
            },
            'quiz': {
                title: '🧙‍♂️ Sage - Science Practice Quiz',
                samples: [
                    '• "Quiz me on marine biology"',
                    '• "Test my knowledge about coral reefs"',
                    '• "Practice questions on ecosystems"',
                    '• "Quiz me about Bahamian wildlife"',
                    '• "Science vocabulary test please"',
                    '• "Random science questions"'
                ]
            }
        },
        'history': {
            'homework': {
                title: '🧙‍♂️ Sage - History Homework Help',
                samples: [
                    '• "What is the capital of The Bahamas?"',
                    '• "When did we gain independence?"',
                    '• "Who were the Lucayans?"',
                    '• "Help me with my history assignment"',
                    '• "How many islands are in The Bahamas?"',
                    '• "Explain Bahamian government structure"'
                ]
            },
            'study': {
                title: '🧙‍♂️ Sage - History Study Session',
                samples: [
                    '• "Tell me about Junkanoo festival"',
                    '• "Study guide for Bahamian independence"',
                    '• "Review colonial history with me"',
                    '• "Help me understand our government"',
                    '• "Timeline of important Bahamian events"',
                    '• "Study tips for history exam"'
                ]
            },
            'quiz': {
                title: '🧙‍♂️ Sage - History Practice Quiz',
                samples: [
                    '• "Quiz me on Bahamian history"',
                    '• "Test me on independence facts"',
                    '• "Practice questions about Lucayans"',
                    '• "Quiz me on Junkanoo traditions"',
                    '• "History dates and events test"',
                    '• "Random Bahamian history questions"'
                ]
            }
        },
        'english': {
            'homework': {
                title: '🧙‍♂️ Sage - English Homework Help',
                samples: [
                    '• "Help me with my essay about coral reefs"',
                    '• "Check my grammar in this paragraph"',
                    '• "What does this poem mean?"',
                    '• "Help me write a story about Nassau"',
                    '• "Explain this reading assignment"',
                    '• "Help with my book report"'
                ]
            },
            'study': {
                title: '🧙‍♂️ Sage - English Study Session',
                samples: [
                    '• "Study tips for reading comprehension"',
                    '• "Help me improve my writing"',
                    '• "Practice analyzing poems"',
                    '• "Vocabulary building exercises"',
                    '• "Grammar review session"',
                    '• "Essay writing techniques"'
                ]
            },
            'quiz': {
                title: '🧙‍♂️ Sage - English Practice Quiz',
                samples: [
                    '• "Quiz me on vocabulary words"',
                    '• "Test my grammar knowledge"',
                    '• "Practice reading comprehension"',
                    '• "Quiz me on literary terms"',
                    '• "Spelling test please"',
                    '• "Random English questions"'
                ]
            }
        },
        'bahamas studies': {
            'homework': {
                title: '🧙‍♂️ Sage - Bahamas Studies Help',
                samples: [
                    '• "Research project on Out Islands"',
                    '• "Help me understand Bahamian economy"',
                    '• "What makes Bahamian culture unique?"',
                    '• "Assignment about local government"',
                    '• "Tourism impact on our islands"',
                    '• "Bahamian art and music project"'
                ]
            },
            'study': {
                title: '🧙‍♂️ Sage - Bahamas Studies Session',
                samples: [
                    '• "Study guide for Bahamian geography"',
                    '• "Review our cultural traditions"',
                    '• "Learn about local economy"',
                    '• "Understanding our dialect and language"',
                    '• "Environmental challenges we face"',
                    '• "Study tips for Bahamas Studies exam"'
                ]
            },
            'quiz': {
                title: '🧙‍♂️ Sage - Bahamas Studies Quiz',
                samples: [
                    '• "Quiz me on Bahamian geography"',
                    '• "Test my knowledge of local culture"',
                    '• "Practice questions about our economy"',
                    '• "Quiz me on Out Island facts"',
                    '• "Bahamian traditions and customs test"',
                    '• "Random Bahamas Studies questions"'
                ]
            }
        }
    },
    'echo': {
        'english': {
            'homework': {
                title: '🗣️ Echo - Reading Homework Help',
                samples: [
                    '• "Help me understand this text about coral reefs"',
                    '• "What does \'archipelago\' mean?"',
                    '• "Summarize this paragraph for me"',
                    '• "Create questions about this passage"',
                    '• "Help me analyze this poem"',
                    '• "Explain this story\'s theme"'
                ]
            },
            'study': {
                title: '🗣️ Echo - Reading Study Session',
                samples: [
                    '• "Improve my reading comprehension"',
                    '• "Practice reading strategies"',
                    '• "Help me understand difficult texts"',
                    '• "Vocabulary building exercises"',
                    '• "Reading tips for my exam"',
                    '• "Make this text easier to read"'
                ]
            },
            'quiz': {
                title: '🗣️ Echo - Reading Comprehension Quiz',
                samples: [
                    '• "Test my comprehension"',
                    '• "Quiz me on vocabulary"',
                    '• "Reading comprehension practice"',
                    '• "Test my understanding of this text"',
                    '• "Practice answering reading questions"',
                    '• "Comprehension skills test"'
                ]
            }
        },
        'history': {
            'homework': {
                title: '🗣️ Echo - History Reading Help',
                samples: [
                    '• "Help me understand this history text"',
                    '• "Summarize this chapter on independence"',
                    '• "What are the key points about Lucayans?"',
                    '• "Break down this historical document"',
                    '• "Explain this timeline to me"',
                    '• "Help me read this primary source"'
                ]
            },
            'study': {
                title: '🗣️ Echo - History Reading Study',
                samples: [
                    '• "Reading strategies for history texts"',
                    '• "Help me take better notes from reading"',
                    '• "Understand historical vocabulary"',
                    '• "Practice reading historical documents"',
                    '• "Improve comprehension of timelines"',
                    '• "Reading tips for history exam"'
                ]
            },
            'quiz': {
                title: '🗣️ Echo - History Reading Quiz',
                samples: [
                    '• "Test my understanding of this chapter"',
                    '• "Quiz me on historical terms"',
                    '• "Reading comprehension on independence"',
                    '• "Test my knowledge from this text"',
                    '• "Practice questions on this reading"',
                    '• "Historical reading comprehension test"'
                ]
            }
        },
        'science': {
            'homework': {
                title: '🗣️ Echo - Science Reading Help',
                samples: [
                    '• "Help me understand this marine biology text"',
                    '• "Summarize this chapter on ecosystems"',
                    '• "What are the main ideas about coral reefs?"',
                    '• "Break down this science article"',
                    '• "Explain these scientific terms"',
                    '• "Help me read this research study"'
                ]
            },
            'study': {
                title: '🗣️ Echo - Science Reading Study',
                samples: [
                    '• "Reading strategies for science texts"',
                    '• "Help me understand scientific vocabulary"',
                    '• "Practice reading research papers"',
                    '• "Improve comprehension of experiments"',
                    '• "Reading tips for science exam"',
                    '• "Better note-taking from science texts"'
                ]
            },
            'quiz': {
                title: '🗣️ Echo - Science Reading Quiz',
                samples: [
                    '• "Test my understanding of this science chapter"',
                    '• "Quiz me on scientific terms"',
                    '• "Reading comprehension on marine life"',
                    '• "Test my knowledge from this article"',
                    '• "Practice questions on this research"',
                    '• "Scientific reading comprehension test"'
                ]
            }
        }
    },
    'lucaya': {
        'academic research': {
            'find sources': {
                title: '🔍 Lucaya - Finding Research Sources',
                samples: [
                    '• "Find sources about coral bleaching"',
                    '• "Research Bahamian independence"',
                    '• "Sources for my essay on marine conservation"',
                    '• "Academic articles about climate change"',
                    '• "Reliable sources on Junkanoo history"',
                    '• "Find research on Out Island economics"'
                ]
            },
            'create outline': {
                title: '🔍 Lucaya - Creating Research Outlines',
                samples: [
                    '• "Help me outline my essay on coral reefs"',
                    '• "Create structure for independence research"',
                    '• "Outline for marine biology project"',
                    '• "Organize my research on climate change"',
                    '• "Structure my paper on Bahamian culture"',
                    '• "Help organize my findings"'
                ]
            },
            'evaluate sources': {
                title: '🔍 Lucaya - Evaluating Sources',
                samples: [
                    '• "Is this source reliable for my research?"',
                    '• "Help me evaluate these websites"',
                    '• "Check if this article is credible"',
                    '• "Compare these different sources"',
                    '• "Which sources are best for my topic?"',
                    '• "Help me fact-check this information"'
                ]
            },
            'citation help': {
                title: '🔍 Lucaya - Citation and Bibliography',
                samples: [
                    '• "How do I cite this website?"',
                    '• "Create a bibliography for my sources"',
                    '• "Help me format these citations"',
                    '• "MLA format for this article"',
                    '• "Add this source to my references"',
                    '• "Check my citation format"'
                ]
            },
            'topic exploration': {
                title: '🔍 Lucaya - Topic Exploration',
                samples: [
                    '• "Explore the topic of marine conservation"',
                    '• "What are the main aspects of Junkanoo?"',
                    '• "Help me understand climate change impacts"',
                    '• "Explore Bahamian economic development"',
                    '• "Research angles for my project"',
                    '• "Brainstorm research questions"'
                ]
            },
            'literature review': {
                title: '🔍 Lucaya - Literature Review Help',
                samples: [
                    '• "Help me review research on coral reefs"',
                    '• "Summarize key studies on hurricanes"',
                    '• "Literature review on tourism impacts"',
                    '• "Compare different research findings"',
                    '• "Synthesize these academic sources"',
                    '• "What do experts say about this topic?"'
                ]
            }
        },
        'history': {
            'find sources': {
                title: '🔍 Lucaya - History Research Sources',
                samples: [
                    '• "Find primary sources on Bahamian independence"',
                    '• "Research about Lucayan civilization"',
                    '• "Sources for colonial period study"',
                    '• "Historical documents about slavery"',
                    '• "Research on piracy in Bahamas"',
                    '• "Find archives about Out Island history"'
                ]
            },
            'create outline': {
                title: '🔍 Lucaya - History Research Outline',
                samples: [
                    '• "Outline for independence timeline project"',
                    '• "Structure my paper on Lucayan culture"',
                    '• "Organize research on colonial history"',
                    '• "Outline for Junkanoo history essay"',
                    '• "Structure study of piracy era"',
                    '• "Organize findings on slavery period"'
                ]
            }
        },
        'government': {
            'find sources': {
                title: '🔍 Lucaya - Government Research',
                samples: [
                    '• "Research Bahamian parliamentary system"',
                    '• "Find sources on local government structure"',
                    '• "Constitutional research for my project"',
                    '• "Sources about political parties"',
                    '• "Research election processes"',
                    '• "Find information on prime ministers"'
                ]
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('[DEBUG] DOM loaded, initializing student portal...');
    
    // Display student welcome message
    document.getElementById('student-welcome').textContent = `Welcome, ${studentName}!`;
    
    // Set up agent switching
    document.getElementById('agent-select').addEventListener('change', function() {
        console.log('[DEBUG] Agent selector changed to:', this.value);
        switchAgent(this.value);
    });
    
    // Set up help content updates when subject or task changes
    document.getElementById('subject-select').addEventListener('change', function() {
        console.log('[DEBUG] Subject changed to:', this.value);
        updateTaskOptions();
        // Multiple attempts to ensure help content updates
        updateAgentHelp();
        setTimeout(() => updateAgentHelp(), 100);
        setTimeout(() => updateAgentHelp(), 300);
    });
    
    document.getElementById('task-select').addEventListener('change', function() {
        console.log('[DEBUG] Task changed to:', this.value);
        // Multiple attempts to ensure help content updates
        updateAgentHelp();
        setTimeout(() => updateAgentHelp(), 100);
        setTimeout(() => updateAgentHelp(), 300);
    });
    
    // Set up send button with better error handling
    const sendButton = document.getElementById('send-button');
    const messageInput = document.getElementById('message-input');
    
    if (sendButton) {
        sendButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('[DEBUG] Send button clicked');
            sendMessage();
        });
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                console.log('[DEBUG] Enter key pressed');
                sendMessage();
            }
        });
        
        // Auto-expand textarea
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }
    
    // Set up new chat button
    document.getElementById('new-chat-btn').addEventListener('click', startNewChat);
    
    // Initialize everything step by step
    console.log('[DEBUG] Initializing task options...');
    updateTaskOptions();
    
    console.log('[DEBUG] Initializing help content...');
    // Force multiple attempts to update help content
    updateAgentHelp();
    setTimeout(() => {
        updateAgentHelp();
        console.log('[DEBUG] First help content update completed');
    }, 100);
    setTimeout(() => {
        updateAgentHelp();
        console.log('[DEBUG] Second help content update completed');
    }, 300);
    
    loadChatHistorySidebar();
    
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
    console.log('[DEBUG] Switching agent to:', agentName);
    
    // Save current chat session before switching
    if (currentChatIndex >= 0) {
        saveChatSession();
    }
    
    currentAgent = agentName;
    
    // Update task options for the new agent
    updateTaskOptions();
    
    // Multiple attempts to update help content with different delays
    setTimeout(() => {
        updateAgentHelp();
        console.log('[DEBUG] Agent switched and help updated (first attempt)');
    }, 50);
    
    setTimeout(() => {
        updateAgentHelp();
        console.log('[DEBUG] Agent switched and help updated (second attempt)');
    }, 200);
    
    // Start a new chat for the new agent
    startNewChat();
}

function updateTaskOptions() {
    const taskSelect = document.getElementById('task-select');
    const subjectSelect = document.getElementById('subject-select');
    
    // Clear current options
    taskSelect.innerHTML = '';
    
    if (currentAgent === 'lucaya') {
        // Research-specific tasks
        const researchTasks = [
            { value: 'find sources', text: 'Find Sources' },
            { value: 'create outline', text: 'Create Outline' },
            { value: 'evaluate sources', text: 'Evaluate Sources' },
            { value: 'citation help', text: 'Citation Help' },
            { value: 'topic exploration', text: 'Topic Exploration' },
            { value: 'literature review', text: 'Literature Review' }
        ];
        
        researchTasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.value;
            option.textContent = task.text;
            taskSelect.appendChild(option);
        });
        
        // Update subject options for research
        subjectSelect.innerHTML = '';
        const researchSubjects = [
            { value: 'academic research', text: 'Academic Research' },
            { value: 'history', text: 'History' },
            { value: 'government', text: 'Government' },
            { value: 'science', text: 'Science' }
        ];
        
        researchSubjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.value;
            option.textContent = subject.text;
            subjectSelect.appendChild(option);
        });
        
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
        
        // Reset to standard subjects
        subjectSelect.innerHTML = '';
        const standardSubjects = [
            { value: 'math', text: 'Mathematics' },
            { value: 'science', text: 'Science' },
            { value: 'english', text: 'English' },
            { value: 'history', text: 'History' },
            { value: 'bahamas studies', text: 'Bahamas Studies' }
        ];
        
        standardSubjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.value;
            option.textContent = subject.text;
            subjectSelect.appendChild(option);
        });
    }
    
    // Force help content update after task options are updated
    setTimeout(() => {
        updateAgentHelp();
        console.log('[DEBUG] Help content updated after task options change');
    }, 100);
}

function updateAgentHelp() {
    console.log('[DEBUG] updateAgentHelp called');
    
    const helpContent = document.getElementById('help-content');
    const subjectSelect = document.getElementById('subject-select');
    const taskSelect = document.getElementById('task-select');
    
    if (!helpContent) {
        console.error('[ERROR] help-content element not found');
        return;
    }
    
    if (!subjectSelect || !taskSelect) {
        console.error('[ERROR] Subject or task select elements not found');
        return;
    }
    
    const subject = subjectSelect.value;
    const task = taskSelect.value;
    
    console.log('[DEBUG] updateAgentHelp called with:', { currentAgent, subject, task });
    
    // Get specific help content based on agent, subject, and task
    let help = null;
    
    if (dynamicHelp[currentAgent] && 
        dynamicHelp[currentAgent][subject] && 
        dynamicHelp[currentAgent][subject][task]) {
        help = dynamicHelp[currentAgent][subject][task];
        console.log('[DEBUG] Found specific help content');
    } else if (dynamicHelp[currentAgent] && dynamicHelp[currentAgent][subject]) {
        // Fallback to first available task for this subject
        const availableTasks = Object.keys(dynamicHelp[currentAgent][subject]);
        if (availableTasks.length > 0) {
            help = dynamicHelp[currentAgent][subject][availableTasks[0]];
            console.log('[DEBUG] Using fallback help content for task:', availableTasks[0]);
        }
    }
    
    // If still no help found, use generic fallback
    if (!help) {
        help = {
            title: `${getAgentEmoji(currentAgent)} ${currentAgent.charAt(0).toUpperCase() + currentAgent.slice(1)} - ${subject.charAt(0).toUpperCase() + subject.slice(1)} ${task.charAt(0).toUpperCase() + task.slice(1)}`,
            samples: [
                '• "Ask me anything about this subject"',
                '• "Help me understand this topic"',
                '• "I need assistance with my work"',
                '• "Can you explain this concept?"',
                '• "Practice questions please"'
            ]
        };
        console.log('[DEBUG] Using generic fallback help content');
    }
    
    // Clear and update the help content
    helpContent.innerHTML = '';
    
    const titleElement = document.createElement('h4');
    titleElement.textContent = help.title;
    helpContent.appendChild(titleElement);
    
    const samplesContainer = document.createElement('div');
    samplesContainer.className = 'help-samples';
    
    help.samples.forEach(sample => {
        const sampleElement = document.createElement('div');
        sampleElement.className = 'sample-text';
        sampleElement.style.cursor = 'pointer';
        sampleElement.style.padding = '5px';
        sampleElement.style.margin = '2px 0';
        sampleElement.style.borderRadius = '3px';
        sampleElement.style.backgroundColor = '#f8f9fa';
        sampleElement.style.border = '1px solid #e9ecef';
        sampleElement.textContent = sample;
        
        // Add hover effect
        sampleElement.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#e9ecef';
        });
        
        sampleElement.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
        
        // Add click handler with better text cleaning
        sampleElement.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            let text = this.textContent;
            // Remove bullet point and quotes
            text = text.replace(/^• "?/, '').replace(/"?$/, '');
            // Remove any remaining quotes at start/end
            text = text.replace(/^"/, '').replace(/"$/, '');
            
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                messageInput.value = text;
                messageInput.focus();
                // Auto-resize textarea
                messageInput.style.height = 'auto';
                messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
                console.log('[DEBUG] Sample text clicked, input set to:', text);
            }
        });
        
        samplesContainer.appendChild(sampleElement);
    });
    
    helpContent.appendChild(samplesContainer);
    
    console.log('[DEBUG] Help content updated successfully with', help.samples.length, 'samples');
    console.log('[DEBUG] Help content title:', help.title);
    
    // Verify the content was actually added to DOM
    const verifyContent = document.getElementById('help-content');
    if (verifyContent && verifyContent.children.length > 0) {
        console.log('[DEBUG] Help content DOM verification: SUCCESS');
    } else {
        console.error('[ERROR] Help content DOM verification: FAILED');
    }
}

function getAgentEmoji(agent) {
    const emojis = {
        'sage': '🧙‍♂️',
        'echo': '🗣️',
        'lucaya': '🔍'
    };
    return emojis[agent] || '🤖';
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
    
    // New chat started successfully
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

    // Conversation state saved
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

        // Messages loaded from local history
    }

    // Scroll to bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    
    if (!messageInput) {
        console.error('[ERROR] Message input not found');
        return;
    }
    
    const message = messageInput.value.trim();
    
    console.log('[DEBUG] sendMessage called with message:', message);
    
    // Enhanced validation for empty messages
    if (!message || message.length === 0 || message === '' || message.replace(/\s+/g, '').length === 0) {
        console.log('[DEBUG] Empty or whitespace-only message detected');
        // Prevent sending empty messages
        messageInput.focus();
        return;
    }
    
    // Validate message contains actual content (not just special characters)
    if (message.replace(/[^a-zA-Z0-9\s]/g, '').trim().length === 0) {
        console.log('[DEBUG] Message contains no meaningful content');
        addMessage('Please enter a meaningful question or message.', 'error');
        messageInput.focus();
        return;
    }
    
    // Student-specific limitations
    if (message.length > 300) {
        addMessage('📝 Please keep your questions shorter (under 300 characters) so I can help you better!', 'error');
        return;
    }
    
    // Prevent button spamming and validate button state
    if (sendButton) {
        if (sendButton.disabled) {
            console.log('[DEBUG] Send button already disabled, preventing duplicate send');
            return;
        }
        sendButton.disabled = true;
        sendButton.textContent = 'Sending...';
        sendButton.style.opacity = '0.6';
        sendButton.style.cursor = 'not-allowed';
    }
    
    const subjectSelect = document.getElementById('subject-select');
    const taskSelect = document.getElementById('task-select');
    
    if (!subjectSelect || !taskSelect) {
        console.error('[ERROR] Subject or task select not found');
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.textContent = 'Send';
        }
        return;
    }
    
    const subject = subjectSelect.value;
    const task = taskSelect.value;
    
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
    
    console.log('[DEBUG] Sending payload:', payload);
    
    fetch(`/api/${currentAgent}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('[DEBUG] Received response:', data);
        if (data.response) {
            addMessage(data.response, 'bot');
        } else {
            addMessage('Sorry, I had trouble understanding that. Please try again.', 'error');
        }
    })
    .catch(error => {
        console.error('[ERROR] Fetch error:', error);
        addMessage('Sorry, I encountered an error. Please try again.', 'error');
    })
    .finally(() => {
        // Re-enable send button with proper state reset
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.textContent = 'Send';
            sendButton.style.opacity = '1';
            sendButton.style.cursor = 'pointer';
        }
        
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
