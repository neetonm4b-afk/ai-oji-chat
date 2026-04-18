document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const kbInput = document.getElementById('kb-input');
    const saveKbBtn = document.getElementById('save-kb-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tabId}-screen`).classList.add('active');
            
            if (tabId === 'kb') {
                loadKb();
            }
        });
    });

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
    });

    // Send Message
    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Add user message to UI
        appendMessage('user', text);
        userInput.value = '';
        userInput.style.height = 'auto';
        sendBtn.disabled = true;

        // Show typing indicator
        const typingId = appendTypingIndicator();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }) // Updated to match new server.js format
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server error');
            }

            const data = await response.json();
            removeTypingIndicator(typingId);

            if (data.reply) {
                appendMessage('bot', data.reply);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error(error);
            removeTypingIndicator(typingId);
            appendMessage('bot', '済まない... 話の途中で少しつまずいてしまったようだ。もう一度送ってみてくれるかい？');
        } finally {
            sendBtn.disabled = false;
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Knowledge Base Logic
    async function loadKb() {
        try {
            const response = await fetch('/api/kb');
            const data = await response.json();
            kbInput.value = data.content || '';
        } catch (error) {
            console.error('Failed to load KB', error);
        }
    }

    saveKbBtn.addEventListener('click', async () => {
        const content = kbInput.value;
        saveKbBtn.disabled = true;
        saveKbBtn.textContent = '保存中...';

        try {
            await fetch('/api/kb', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            alert('ナレッジベースを更新したよ。これからの回答に活かしていくね。');
        } catch (error) {
            alert('保存に失敗してしまった。済まないがもう一度試してくれるかい？');
        } finally {
            saveKbBtn.disabled = false;
            saveKbBtn.textContent = 'ナレッジを保存する';
        }
    });

    // UI Helpers
    function appendMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;
        
        // Handle line breaks and basic escaping
        const content = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');

        msgDiv.innerHTML = `<div class="message-content">${content}</div>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function appendTypingIndicator() {
        const id = 'typing-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message bot typing';
        msgDiv.id = id;
        msgDiv.innerHTML = `
            <div class="message-content">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
});
