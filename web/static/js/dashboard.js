
// Teacher Dashboard JavaScript
let dashboardData = {
    students: [],
    sessions: [],
    schedule: {},
    lastUpdated: null
};

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DASHBOARD] Initializing teacher dashboard...');
    refreshDashboard();
    
    // Auto-refresh every 30 seconds
    setInterval(refreshDashboard, 30000);
});

async function refreshDashboard() {
    console.log('[DASHBOARD] Refreshing dashboard data...');
    
    try {
        // Show loading state
        document.body.classList.add('loading');
        
        // Fetch data from Coral agent
        await Promise.all([
            loadStudentData(),
            loadScheduleData(),
            loadClassOverview()
        ]);
        
        // Update timestamp
        const now = new Date();
        document.getElementById('last-updated').textContent = 
            `Last updated: ${now.toLocaleTimeString()}`;
        dashboardData.lastUpdated = now;
        
        console.log('[DASHBOARD] Dashboard refreshed successfully');
        
    } catch (error) {
        console.error('[DASHBOARD] Error refreshing dashboard:', error);
        showError('Failed to refresh dashboard data');
    } finally {
        // Remove loading state
        document.body.classList.remove('loading');
    }
}

async function loadStudentData() {
    try {
        const response = await fetch('/api/coral', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'list all students with details',
                subject: 'administration',
                task: 'manage class',
                session_id: 'dashboard-session',
                user_type: 'teacher'
            })
        });

        if (response.ok) {
            const data = await response.json();
            parseStudentData(data.response);
        }
    } catch (error) {
        console.error('[DASHBOARD] Error loading student data:', error);
    }
}

async function loadScheduleData() {
    try {
        const response = await fetch('/api/coral', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'get today schedule',
                subject: 'administration',
                task: 'manage class',
                session_id: 'dashboard-session',
                user_type: 'teacher'
            })
        });

        if (response.ok) {
            const data = await response.json();
            parseScheduleData(data.response);
        }
    } catch (error) {
        console.error('[DASHBOARD] Error loading schedule:', error);
    }
}

async function loadClassOverview() {
    try {
        const response = await fetch('/api/coral', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'generate class report',
                subject: 'administration',
                task: 'generate report',
                session_id: 'dashboard-session',
                user_type: 'teacher'
            })
        });

        if (response.ok) {
            const data = await response.json();
            parseClassOverview(data.response);
        }
    } catch (error) {
        console.error('[DASHBOARD] Error loading class overview:', error);
    }
}

function parseStudentData(responseText) {
    const studentList = document.getElementById('student-list');
    const students = [];
    
    // Parse the response to extract student information
    const lines = responseText.split('\n');
    let studentCount = 0;
    let activeCount = 0;
    
    studentList.innerHTML = '';
    
    // Look for student entries in the response
    lines.forEach(line => {
        if (line.includes('**') && (line.includes('Grade') || line.includes('Student'))) {
            studentCount++;
            const isActive = !line.includes('🔴') && !line.includes('Inactive');
            if (isActive) activeCount++;
            
            const studentDiv = document.createElement('div');
            studentDiv.className = `student-item ${isActive ? '' : 'inactive'}`;
            
            // Extract student name and ID
            const match = line.match(/\*\*(.*?)\*\*/);
            const studentInfo = match ? match[1] : line.trim();
            
            studentDiv.innerHTML = `
                <div>
                    <strong>${studentInfo}</strong>
                    <div style="font-size: 0.8em; color: #6c757d;">
                        ${isActive ? 'Active' : 'Inactive'} • Grade info
                    </div>
                </div>
                <div class="student-status">
                    <div class="status-indicator ${isActive ? '' : 'inactive'}"></div>
                    <span>${isActive ? '🟢' : '🔴'}</span>
                </div>
            `;
            
            studentDiv.onclick = () => searchSpecificStudent(studentInfo);
            studentList.appendChild(studentDiv);
            
            students.push({
                name: studentInfo,
                active: isActive
            });
        }
    });
    
    // Update stats
    document.getElementById('total-students').textContent = studentCount;
    document.getElementById('active-students').textContent = activeCount;
    
    dashboardData.students = students;
    
    if (studentCount === 0) {
        studentList.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">No students found</div>';
    }
}

function parseScheduleData(responseText) {
    const scheduleDisplay = document.getElementById('schedule-display');
    
    // Extract schedule information
    const lines = responseText.split('\n');
    let scheduleHTML = '';
    
    lines.forEach(line => {
        if (line.includes('•') || line.includes('-')) {
            const classInfo = line.replace('•', '').replace('-', '').trim();
            if (classInfo && !classInfo.includes('**')) {
                scheduleHTML += `<div style="padding: 5px 0; border-bottom: 1px solid #eee;">📚 ${classInfo}</div>`;
            }
        }
    });
    
    if (scheduleHTML) {
        scheduleDisplay.innerHTML = scheduleHTML;
    } else {
        scheduleDisplay.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">No classes scheduled for today</div>';
    }
}

function parseClassOverview(responseText) {
    const overviewDisplay = document.getElementById('class-overview');
    const activityFeed = document.getElementById('activity-feed');
    
    // Parse overview data
    const lines = responseText.split('\n');
    let overviewHTML = '';
    let activityHTML = '';
    let sessionCount = 0;
    
    lines.forEach(line => {
        if (line.includes('Total Students:') || line.includes('Active Students:') || line.includes('Sessions:')) {
            overviewHTML += `<div style="padding: 5px 0;">${line.replace(/\*\*/g, '').trim()}</div>`;
        }
        
        if (line.includes('Attendance:') || line.includes('✅') || line.includes('❌')) {
            activityHTML += `<div class="activity-item">
                <div>${line.replace(/\*\*/g, '').trim()}</div>
                <div class="activity-time">${new Date().toLocaleTimeString()}</div>
            </div>`;
        }
        
        // Count sessions mentioned in the response
        if (line.includes('session') || line.includes('Session')) {
            sessionCount++;
        }
    });
    
    // Update session count
    document.getElementById('total-sessions').textContent = sessionCount;
    document.getElementById('avg-questions').textContent = Math.floor(sessionCount * 2.5); // Estimate
    
    overviewDisplay.innerHTML = overviewHTML || '<div style="text-align: center; padding: 20px; color: #6c757d;">No overview data available</div>';
    
    if (activityHTML) {
        activityFeed.innerHTML = activityHTML;
    } else {
        activityFeed.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">No recent activity</div>';
    }
}

async function searchStudent() {
    const searchTerm = document.getElementById('student-search').value.trim();
    if (!searchTerm) {
        alert('Please enter a student name or ID to search');
        return;
    }
    
    await searchSpecificStudent(searchTerm);
}

async function searchSpecificStudent(searchTerm) {
    const detailsDiv = document.getElementById('student-details');
    detailsDiv.innerHTML = '<div style="text-align: center; padding: 20px;">🔍 Searching...</div>';
    
    try {
        const response = await fetch('/api/coral', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `get student sessions ${searchTerm}`,
                subject: 'administration',
                task: 'student progress',
                session_id: 'dashboard-session',
                user_type: 'teacher'
            })
        });

        if (response.ok) {
            const data = await response.json();
            displayStudentDetails(data.response);
        }
    } catch (error) {
        console.error('[DASHBOARD] Error searching student:', error);
        detailsDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;">Error loading student details</div>';
    }
}

function displayStudentDetails(responseText) {
    const detailsDiv = document.getElementById('student-details');
    
    // Format the response for better display
    let formattedHTML = responseText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    if (!formattedHTML.startsWith('<')) {
        formattedHTML = '<p>' + formattedHTML + '</p>';
    }
    
    detailsDiv.innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
            ${formattedHTML}
        </div>
    `;
}

// Quick Action Functions
async function takeAttendance() {
    const studentName = prompt('Enter student name for attendance:');
    if (!studentName) return;
    
    try {
        const response = await fetch('/api/coral', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `mark attendance ${studentName} present`,
                subject: 'administration',
                task: 'take attendance',
                session_id: 'dashboard-session',
                user_type: 'teacher'
            })
        });

        if (response.ok) {
            const data = await response.json();
            alert(data.response);
            refreshDashboard();
        }
    } catch (error) {
        alert('Error taking attendance');
    }
}

async function createStudent() {
    const studentName = prompt('Enter new student name:');
    if (!studentName) return;
    
    try {
        const response = await fetch('/api/coral', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `create student ${studentName}`,
                subject: 'administration',
                task: 'manage class',
                session_id: 'dashboard-session',
                user_type: 'teacher'
            })
        });

        if (response.ok) {
            const data = await response.json();
            alert(data.response);
            refreshDashboard();
        }
    } catch (error) {
        alert('Error creating student');
    }
}

async function generateReport() {
    try {
        const response = await fetch('/api/coral', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'generate detailed class report',
                subject: 'reporting',
                task: 'generate report',
                session_id: 'dashboard-session',
                user_type: 'teacher'
            })
        });

        if (response.ok) {
            const data = await response.json();
            
            // Open report in new window
            const reportWindow = window.open('', '_blank');
            reportWindow.document.write(`
                <html>
                    <head><title>Class Report</title></head>
                    <body style="font-family: Arial, sans-serif; padding: 20px;">
                        <h1>Class Report - ${new Date().toLocaleDateString()}</h1>
                        <div>${data.response.replace(/\n/g, '<br>')}</div>
                    </body>
                </html>
            `);
        }
    } catch (error) {
        alert('Error generating report');
    }
}

async function viewSchedule() {
    window.open('/', '_blank');
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 1000;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        document.body.removeChild(errorDiv);
    }, 5000);
}

console.log('[DASHBOARD] Dashboard JavaScript loaded');
