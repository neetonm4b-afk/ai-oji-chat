document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const kbInput = document.getElementById('kb-input');
    const saveKbBtn = document.getElementById('save-kb-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    let chatHistory = [];

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

        // Add to history
        chatHistory.push({ role: 'user', content: text });

        // Show typing indicator
        const typingId = appendTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistory })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server error:', errorData);
                throw new Error(errorData.details || 'Server error');
            }

            const data = await response.json();
            removeTypingIndicator(typingId);

            if (data.content && data.content[0]) {
                const botText = data.content[0].text;
                appendMessage('bot', botText);
                chatHistory.push({ role: 'assistant', content: botText });
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            console.error(error);
            removeTypingIndicator(typingId);
            appendMessage('bot', '申し訳ない。接続に少し問題があるようだ。時間をおいて試してみてくれるかい？');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
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
        msgDiv.innerHTML = `<div class="message-content">${text.replace(/\n/g, '<br>')}</div>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function appendTypingIndicator() {
        const id = 'typing-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message bot typing';
        msgDiv.id = id;
        msgDiv.innerHTML = `<div class="message-content">AIおぢが考えています...</div>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // PWA Install Logic
    let deferredPrompt;
    const installBanner = document.getElementById('install-banner');
    const installBtn = document.getElementById('install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBanner.classList.remove('hidden');
    });

    installBtn.addEventListener('click', () => {
        installBanner.classList.add('hidden');
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
        });
    });
});
