const messagesContainer = document.getElementById('messagesContainer');
const loading = document.getElementById('loading');
const refreshBtn = document.getElementById('refreshBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const autoRefreshCheckbox = document.getElementById('autoRefresh');
const totalMessagesEl = document.getElementById('totalMessages');

let autoRefreshInterval = null;
let selectedMessages = new Set();

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
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
    return text.replace(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g, '<span class="highlight-ip">$1</span>');
}

function getStatusClass(text) {
    if (text.includes('ONLINE') || text.includes('READY')) {
        return 'online';
    } else if (text.includes('OFFLINE')) {
        return 'offline';
    }
    return '';
}

function getStatusLabel(text) {
    if (text.includes('ONLINE') || text.includes('READY')) {
        return '🟢 ONLINE';
    } else if (text.includes('OFFLINE')) {
        return '🔴 OFFLINE';
    }
    return '📨 MESSAGE';
}

function renderMessage(msg) {
    const statusClass = getStatusClass(msg.text);
    const statusLabel = getStatusLabel(msg.text);
    const isSelected = selectedMessages.has(msg.id);

    return `
        <div class="message ${statusClass}" data-id="${msg.id}">
            <div class="message-header">
                <span class="message-status status-${statusClass}">${statusLabel}</span>
                <span class="message-time">${formatTime(msg.date)}</span>
            </div>
            <div class="message-text">${highlightIPs(escapeHtml(msg.text))}</div>
            <div class="message-actions">
                <button class="message-action-btn select-btn ${isSelected ? 'selected' : ''}" data-id="${msg.id}">
                    ${isSelected ? '✓ Selected' : 'Select'}
                </button>
                <button class="message-action-btn delete delete-btn" data-id="${msg.id}">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `;
}

async function fetchMessages() {
    try {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<span>⏳</span> Loading...';

        const response = await fetch('https://rdp-bot-api.atlantis-app.workers.dev/api/messages?limit=100');
        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.error || 'Failed to fetch messages');
        }

        if (data.messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="no-messages">
                    <div class="no-messages-icon">📭</div>
                    <h3>No Messages Yet</h3>
                    <p>Messages will appear here when the bot sends them.</p>
                </div>
            `;
            totalMessagesEl.textContent = '0';
            return;
        }

        messagesContainer.innerHTML = data.messages.map(renderMessage).join('');
        totalMessagesEl.textContent = data.total;

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error('Error:', error);
        messagesContainer.innerHTML = `
            <div class="error">
                <h3>❌ Error</h3>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<span>🔄</span> Refresh';
    }
}

async function deleteMessage(id) {
    try {
        const response = await fetch('https://rdp-bot-api.atlantis-app.workers.dev/api/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id })
        });

        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.error || 'Failed to delete message');
        }

        selectedMessages.delete(id);
        await fetchMessages();
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message: ' + error.message);
    }
}

async function clearAllMessages() {
    if (!confirm('Are you sure you want to delete all messages? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch('https://rdp-bot-api.atlantis-app.workers.dev/api/clear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.error || 'Failed to clear messages');
        }

        selectedMessages.clear();
        await fetchMessages();
    } catch (error) {
        console.error('Error clearing messages:', error);
        alert('Failed to clear messages: ' + error.message);
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

clearAllBtn.addEventListener('click', clearAllMessages);

autoRefreshCheckbox.addEventListener('change', () => {
    if (autoRefreshCheckbox.checked) {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }
});

messagesContainer.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    const selectBtn = e.target.closest('.select-btn');

    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        if (confirm('Delete this message?')) {
            deleteMessage(id);
        }
    }

    if (selectBtn) {
        const id = parseInt(selectBtn.dataset.id);
        if (selectedMessages.has(id)) {
            selectedMessages.delete(id);
        } else {
            selectedMessages.add(id);
        }
        fetchMessages();
    }
});

fetchMessages();
startAutoRefresh();
