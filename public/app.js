const messagesContainer = document.getElementById('messagesContainer');
const loading = document.getElementById('loading');
const refreshBtn = document.getElementById('refreshBtn');
const autoRefreshCheckbox = document.getElementById('autoRefresh');
const botInfoEl = document.getElementById('botInfo');
const statsEl = document.getElementById('stats');

let lastUpdateId = 0;
let autoRefreshInterval = null;

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getInitials(name) {
    return name.charAt(0).toUpperCase();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderMessage(msg) {
    const fullName = `${msg.user.first_name} ${msg.user.last_name}`.trim();
    const username = msg.user.username ? `@${msg.user.username}` : '';
    const initial = getInitials(fullName || 'U');

    let replyHtml = '';
    if (msg.reply_to) {
        replyHtml = `
            <div class="reply">
                <div class="reply-user">رد على رسالة</div>
                <div class="reply-text">${escapeHtml(msg.reply_to.text.substring(0, 100))}${msg.reply_to.text.length > 100 ? '...' : ''}</div>
            </div>
        `;
    }

    return `
        <div class="message" data-id="${msg.id}">
            <div class="message-header">
                <div class="message-user">
                    <div class="user-avatar">${initial}</div>
                    <div>
                        <div class="user-name">${escapeHtml(fullName)}</div>
                        ${username ? `<div class="user-username">${escapeHtml(username)}</div>` : ''}
                    </div>
                </div>
                <div class="message-time">${formatTime(msg.date)}</div>
            </div>
            ${replyHtml}
            <div class="message-text">${escapeHtml(msg.text)}</div>
        </div>
    `;
}

async function fetchMessages() {
    try {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'جاري التحديث...';

        const response = await fetch(`/api/messages?limit=100`);
        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.error || 'Failed to fetch messages');
        }

        if (data.bot) {
            botInfoEl.textContent = `Bot: ${data.bot.first_name} (${data.bot.username})`;
        }

        if (data.messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="no-messages">
                    <div class="icon">💬</div>
                    <h3>لا توجد رسائل</h3>
                    <p>لم يتم العثور على رسائل في هذا الشات</p>
                </div>
            `;
            statsEl.textContent = '';
            return;
        }

        messagesContainer.innerHTML = data.messages.map(renderMessage).join('');

        if (data.messages.length > 0) {
            lastUpdateId = data.messages[data.messages.length - 1].update_id;
        }

        statsEl.textContent = `إجمالي الرسائل: ${data.total}`;

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error('Error:', error);
        messagesContainer.innerHTML = `
            <div class="error">
                <h3>خطأ في تحميل الرسائل</h3>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'تحديث';
    }
}

function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
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
