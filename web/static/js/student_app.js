
let currentAgent = 'sage';
let currentSessionId = generateSessionId();

// Get student info from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('id') || sessionStorage.getItem('student_id');
const studentName = urlParams.get('name') || sessionStorage.getItem('student_name');

if (!studentId || !studentName) {
    window.location.href = '/student-login';
}

document.addEventListener('DOMContentLoaded', function() {
    // Display student welcome message
    document.getElementById('student-welcome').textContent = `Welcome, ${studentName}!`;
    
    // Set up agent switching
    document.querySelectorAll('.agent-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchAgent(this.dataset.agent);
        });
    });
    
    // Set up send button
    document.getElementById('send-button').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Initial greeting
    addMessage(`Hello ${studentName}! I'm Sage, your learning assistant. How can I help you today?`, 'bot');
});

function generateSessionId() {
    return `student-${studentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function switchAgent(agentName) {
    currentAgent = agentName;
    currentSessionId = generateSessionId();
    
    // Update UI
    document.querySelectorAll('.agent-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-agent="${agentName}"]`).classList.add('active');
    
    // Clear chat and show greeting
    document.getElementById('chat-messages').innerHTML = '';
    
    const greetings = {
        'sage': `Hello ${studentName}! I'm Sage, your tutor. What would you like to learn today?`,
        'echo': `Hi ${studentName}! I'm Echo, your reading coach. Ready to improve your comprehension?`,
        'lucaya': `Welcome ${studentName}! I'm Lucaya, your research assistant. What topic shall we explore?`
    };
    
    addMessage(greetings[agentName], 'bot');
}

function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    const subject = document.getElementById('subject-select').value;
    const task = document.getElementById('task-select').value;
    
    // Add user message to chat
    addMessage(message, 'user');
    messageInput.value = '';
    
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
    });
}

function addMessage(text, type) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    // Format message text (convert ** to bold, handle line breaks)
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                             .replace(/\n/g, '<br>');
    
    messageDiv.innerHTML = formattedText;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function logout() {
    sessionStorage.clear();
    window.location.href = '/student-login';
}
