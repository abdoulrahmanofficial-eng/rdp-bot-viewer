const messagesContainer = document.getElementById('messagesContainer');
const loading = document.getElementById('loading');
const refreshBtn = document.getElementById('refreshBtn');
const autoRefreshCheckbox = document.getElementById('autoRefresh');
const botInfoEl = document.getElementById('botInfo');
const statsEl = document.getElementById('stats');

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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderMessage(msg) {
    const isBot = msg.from === 'bot';
    const msgClass = isBot ? 'message bot-message' : 'message user-message';
    const label = isBot ? 'Bot' : 'You';

    return `
        <div class="${msgClass}" data-id="${msg.id}">
            <div class="message-header">
                <div class="message-user">
                    <span class="message-label ${isBot ? 'label-bot' : 'label-user'}">${label}</span>
                </div>
                <div class="message-time">${formatTime(msg.date)}</div>
            </div>
            <div class="message-text">${escapeHtml(msg.text)}</div>
        </div>
    `;
}

async function fetchMessages() {
    try {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'جاري التحديث...';

        const response = await fetch('/api/messages?limit=100');
        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.error || 'Failed to fetch messages');
        }

        if (data.messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="no-messages">
                    <div class="icon">💬</div>
                    <h3>لا توجد رسائل</h3>
                    <p>ابعت رسالة للبوت وهيظهر هنا</p>
                </div>
            `;
            statsEl.textContent = '';
            botInfoEl.textContent = 'في انتظار الرسائل...';
            return;
        }

        messagesContainer.innerHTML = data.messages.map(renderMessage).join('');

        statsEl.textContent = `إجمالي الرسائل: ${data.total}`;
        botInfoEl.textContent = `آخر تحديث: ${new Date().toLocaleTimeString('ar-EG')}`;

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
