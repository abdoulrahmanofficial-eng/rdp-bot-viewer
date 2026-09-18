const messagesContainer = document.getElementById('messagesContainer');
const loading = document.getElementById('loading');
const refreshBtn = document.getElementById('refreshBtn');
const autoRefreshCheckbox = document.getElementById('autoRefresh');
const currentTimeEl = document.getElementById('currentTime');
const totalPacketsEl = document.getElementById('totalPackets');
const latencyEl = document.getElementById('latency');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const statusText = document.getElementById('statusText');

let autoRefreshInterval = null;
let progressInterval = null;

// Matrix Rain Effect
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+{}|:<>?アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const charArray = chars.split('');
const fontSize = 14;
const columns = canvas.width / fontSize;
const drops = [];

for (let x = 0; x < columns; x++) {
    drops[x] = 1;
}

function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#00ff41';
    ctx.font = fontSize + 'px monospace';
    
    for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(drawMatrix, 50);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Update Clock
function updateClock() {
    const now = new Date();
    const options = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
    };
    currentTimeEl.textContent = now.toLocaleTimeString('en-US', options);
}

setInterval(updateClock, 1000);
updateClock();

// Random Status Updates
const statuses = [
    'INTERCEPTING PACKETS...',
    'DECRYPTING DATA STREAM...',
    'SCANNING NETWORK...',
    'BYPASSING FIREWALL...',
    'EXTRACTING INTELLIGENCE...',
    'MONITORING TRAFFIC...',
    'ANALYZING PAYLOADS...',
    'TRACING ORIGIN...'
];

function randomStatus() {
    const random = Math.floor(Math.random() * statuses.length);
    statusText.textContent = statuses[random];
}

setInterval(randomStatus, 3000);

// Progress Bar Animation
function startProgress() {
    let progress = 0;
    progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 0;
        }
        progressBar.style.width = progress + '%';
        progressText.textContent = 'SCANNING... ' + Math.floor(progress) + '%';
    }, 500);
}

startProgress();

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function highlightIPs(text) {
    return text.replace(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g, '<span class="highlight">$1</span>');
}

function renderMessage(msg) {
    const isOnline = msg.text.includes('ONLINE') || msg.text.includes('READY');
    const msgClass = isOnline ? 'message online' : 'message offline';
    const statusClass = isOnline ? 'status-online' : 'status-offline';
    const statusLabel = isOnline ? '[ ONLINE ]' : '[ OFFLINE ]';

    return `
        <div class="${msgClass}">
            <div class="message-header">
                <span class="message-status ${statusClass}">${statusLabel}</span>
                <span class="message-time">${formatTime(msg.date)}</span>
            </div>
            <div class="message-text">${highlightIPs(escapeHtml(msg.text))}</div>
        </div>
    `;
}

async function fetchMessages() {
    try {
        refreshBtn.disabled = true;
        refreshBtn.querySelector('.btn-text').textContent = '⟳ SCANNING...';
        
        const startTime = performance.now();

        const response = await fetch('/api/messages?limit=100');
        const data = await response.json();
        
        const endTime = performance.now();
        const latency = Math.floor(endTime - startTime);
        latencyEl.textContent = latency + 'ms';

        if (!data.ok) {
            throw new Error(data.error || 'ACCESS DENIED');
        }

        if (data.messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="no-messages">
                    <div class="icon">🔓</div>
                    <h3>[ NO INTERCEPTED DATA ]</h3>
                    <p>Waiting for incoming transmissions...</p>
                </div>
            `;
            totalPacketsEl.textContent = '0';
            return;
        }

        messagesContainer.innerHTML = data.messages.map(renderMessage).join('');
        totalPacketsEl.textContent = data.total;

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error('ERROR:', error);
        messagesContainer.innerHTML = `
            <div class="error">
                <h3>[ SYSTEM ERROR ]</h3>
                <p>${escapeHtml(error.message)}</p>
                <p>Retrying connection...</p>
            </div>
        `;
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.querySelector('.btn-text').textContent = '↻ REFRESH DATA';
    }
}

function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(fetchMessages, 5000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

refreshBtn.addEventListener('click', fetchMessages);

autoRefreshCheckbox.addEventListener('change', () => {
    if (autoRefreshCheckbox.checked) {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }
});

fetchMessages();
startAutoRefresh();

// Add random glitch effect
function randomGlitch() {
    document.body.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
    setTimeout(() => {
        document.body.style.filter = 'none';
    }, 100);
}

setInterval(() => {
    if (Math.random() > 0.95) {
        randomGlitch();
    }
}, 2000);
