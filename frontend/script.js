// --- Application Global Architecture Configuration ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Core App State Management
    let state = {
        user: JSON.parse(localStorage.getItem('tbp_profile')) || { username: 'Professional User', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
        chats: JSON.parse(localStorage.getItem('tbp_chats')) || [],
        currentChatId: null,
        activeTheme: localStorage.getItem('tbp_theme') || 'dark-theme',
        activeWallpaper: localStorage.getItem('tbp_wallpaper') || 'none',
        stagedFiles: [],
        isGenerating: false,
        abortController: null
    };

    // Advanced Global Application API & Network Wrapper
    const Network = {
        apiEndpoint: () => document.getElementById('apiEndpointInput').value || 'https://api.openai.com/v1/chat/completions',
        apiKey: () => document.getElementById('apiKeyInput').value || '',
        
        async fetchResponse(messages, signal, retryCount = 1) {
            const body = {
                model: "gpt-4o-mini",
                messages: messages
            };

            try {
                const response = await fetch(this.apiEndpoint(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey()}`
                    },
                    body: JSON.stringify(body),
                    signal: signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP System Error Code: ${response.status}`);
                }
                const data = await response.ok ? await response.json() : null;
                return data?.choices?.[0]?.message?.content || "No text data stream produced by endpoint.";
            } catch (err) {
                if (retryCount > 0 && err.name !== 'AbortError') {
                    return await this.fetchResponse(messages, signal, retryCount - 1);
                }
                throw err;
            }
        }
    };

    // Markdown Parser Module 
    const Markdown = {
        parse(text) {
            if (!text) return '';
            let html = text
                .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

            // Tables System Mapping
            const lines = html.split('\n');
            let insideTable = false;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith('|')) {
                    if (!insideTable) {
                        insideTable = true;
                        lines[i] = '<table><thead>' + this.parseTableRow(lines[i]) + '</thead><tbody>';
                    } else if (lines[i].includes('---')) {
                        lines.splice(i, 1);
                        i--;
                    } else {
                        lines[i] = this.parseTableRow(lines[i]);
                    }
                } else if (insideTable) {
                    insideTable = false;
                    lines[i] = '</tbody></table>' + lines[i];
                }
            }
            html = lines.join('\n');

            // Multi-line code block parser configuration
            html = html.replace(/```(\w*)\n([\s\S]*?)```/gm, (match, lang, code) => {
                return `<div class="code-block-container">
                    <div class="code-header">
                        <span>${lang || 'code'}</span>
                        <button onclick="navigator.clipboard.writeText(\`${code.trim().replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`); alert('Copied code block!');"><i class="fa-solid fa-copy"></i> Copy</button>
                    </div>
                    <pre><code>${code.trim()}</code></pre>
                </div>`;
            });

            return html;
        },
        parseTableRow(rowText) {
            const cells = rowText.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
            return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
        }
    };

    // Cache Mapping Elements & Nodes
    const nodes = {
        authScreen: document.getElementById('authScreen'),
        workspace: document.getElementById('workspace'),
        loginForm: document.getElementById('loginForm'),
        chatMessages: document.getElementById('chatMessages'),
        chatInput: document.getElementById('chatInput'),
        sendMessageBtn: document.getElementById('sendMessageBtn'),
        stopGenerationBtn: document.getElementById('stopGenerationBtn'),
        chatHistoryList: document.getElementById('chatHistoryList'),
        newChatBtn: document.getElementById('newChatBtn'),
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        wallpaperToggleBtn: document.getElementById('wallpaperToggleBtn'),
        settingsToggleBtn: document.getElementById('settingsToggleBtn'),
        profileTrigger: document.getElementById('profileTrigger'),
        exportChatBtn: document.getElementById('exportChatBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        searchChatInput: document.getElementById('searchChatInput'),
        fileUploadInput: document.getElementById('fileUploadInput'),
        filePreviewBar: document.getElementById('filePreviewBar'),
        dropZone: document.getElementById('dropZone'),
        cameraBtn: document.getElementById('cameraBtn'),
        cameraModal: document.getElementById('cameraModal'),
        cameraVideo: document.getElementById('cameraVideo'),
        capturePhotoBtn: document.getElementById('capturePhotoBtn'),
        stopCameraBtn: document.getElementById('stopCameraBtn'),
        profileModal: document.getElementById('profileModal'),
        settingsModal: document.getElementById('settingsModal'),
        wallpaperModal: document.getElementById('wallpaperModal'),
        saveProfileBtn: document.getElementById('saveProfileBtn'),
        profileUsernameInput: document.getElementById('profileUsernameInput'),
        avatarUploadInput: document.getElementById('avatarUploadInput'),
        modalAvatarPreview: document.getElementById('modalAvatarPreview'),
        sidebarAvatar: document.getElementById('sidebarAvatar'),
        sidebarUsername: document.getElementById('sidebarUsername'),
        ttsToggleInput: document.getElementById('ttsToggleInput'),
        voiceInputBtn: document.getElementById('voiceInputBtn'),
        currentChatTitle: document.getElementById('currentChatTitle'),
        toggleSidebarBtn: document.getElementById('toggleSidebarBtn'),
        closeSidebarBtn: document.getElementById('closeSidebarBtn'),
        sidebar: document.getElementById('sidebar')
    };

    // System Orchestration & Startup Engine
    function init() {
        setupThemesAndWallpapers();
        syncProfileDOM();
        renderHistoryList();
        registerEventBindings();
    }

    function setupThemesAndWallpapers() {
        document.body.className = state.activeTheme;
        if (state.activeWallpaper !== 'none') {
            document.body.style.backgroundImage = `url('${state.activeWallpaper}')`;
        }
    }

    function syncProfileDOM() {
        nodes.sidebarUsername.textContent = state.user.username;
        nodes.sidebarAvatar.src = state.user.avatar;
        nodes.modalAvatarPreview.src = state.user.avatar;
        nodes.profileUsernameInput.value = state.user.username;
    }

    // Dynamic History UI Management
    function renderHistoryList() {
        nodes.chatHistoryList.innerHTML = '';
        const searchVal = nodes.searchChatInput.value.toLowerCase();
        
        state.chats.filter(c => c.title.toLowerCase().includes(searchVal)).forEach(chat => {
            const item = document.createElement('div');
            item.className = `history-item ${chat.id === state.currentChatId ? 'active' : ''}`;
            item.dataset.id = chat.id;
            
            item.innerHTML = `
                <div class="history-left">
                    <i class="fa-solid fa-message"></i>
                    <span>${chat.title}</span>
                </div>
                <div class="history-actions">
                    <button class="delete-history-btn" data-id="${chat.id}"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            
            item.addEventListener('click', (e) => {
                if (e.target.closest('.delete-history-btn')) return;
                switchChat(chat.id);
            });

            item.querySelector('.delete-history-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChat(chat.id);
            });

            nodes.chatHistoryList.appendChild(item);
        });
    }

    // Message Lifecycle and Core Pipeline 
    async function handleSendMessage() {
        const text = nodes.chatInput.value.trim();
        if (!text && state.stagedFiles.length === 0) return;
        if (state.isGenerating) return;

        if (!state.currentChatId) {
            createNewChat(text || "Analyzed Stream Files");
        }

        const activeChat = state.chats.find(c => c.id === state.currentChatId);
        
        // Build User Message Payload Object
        const userMsg = {
            id: 'msg-' + Date.now(),
            role: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: text,
            files: [...state.stagedFiles]
        };

        activeChat.messages.push(userMsg);
        nodes.chatInput.value = '';
        state.stagedFiles = [];
        updateFilePreviewUI();
        autoResizeTextArea();
        renderActiveChatMessages();
        saveStateToStorage();

        // Initialize AI Stream Pipeline Response Generation
        await triggerAIResponse(activeChat);
    }

    async function triggerAIResponse(activeChat) {
        state.isGenerating = true;
        toggleInputStateLoading(true);
        state.abortController = new AbortController();

        // Inject dynamic typing indicator node
        const aiMsgId = 'msg-' + Date.now();
        const typingIndicator = appendTypingIndicatorNode(aiMsgId);

        // Map complete context thread history
        const contextThread = activeChat.messages.map(m => ({
            role: m.role,
            content: m.text + (m.files && m.files.length > 0 ? ` [Attached Assets: ${m.files.map(f => f.name).join(', ')}]` : '')
        }));

        try {
            const aiTextResponse = await Network.fetchResponse(contextThread, state.abortController.signal);
            typingIndicator.remove();

            const aiMsg = {
                id: aiMsgId,
                role: 'assistant',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                text: aiTextResponse
            };

            activeChat.messages.push(aiMsg);
            saveStateToStorage();
            renderActiveChatMessages();

            if (nodes.ttsToggleInput.checked) {
                speakText(aiTextResponse);
            }
        } catch (err) {
            typingIndicator.remove();
            if (err.name !== 'AbortError') {
                alert(`Error streaming reply: ${err.message}`);
            }
        } finally {
            state.isGenerating = false;
            toggleInputStateLoading(false);
        }
    }

    function appendTypingIndicatorNode(id) {
        const row = document.createElement('div');
        row.className = 'message-row assistant';
        row.id = id;
        row.innerHTML = `
            <img class="message-avatar" src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80" alt="AI">
            <div class="message-content-wrap">
                <div class="message-meta">TBP AI • System Processing</div>
                <div class="message-bubble">
                    <div class="typing-bubble">
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                    </div>
                </div>
            </div>
        `;
        nodes.chatMessages.appendChild(row);
        scrollToBottom();
        return row;
    }

    function renderActiveChatMessages() {
        const activeChat = state.chats.find(c => c.id === state.currentChatId);
        if (!activeChat) {
            nodes.chatMessages.innerHTML = '';
            document.getElementById('welcomeContainer').style.display = 'block';
            nodes.currentChatTitle.textContent = "New Chat";
            return;
        }

        document.getElementById('welcomeContainer').style.display = 'none';
        nodes.currentChatTitle.textContent = activeChat.title;
        nodes.chatMessages.innerHTML = '';

        activeChat.messages.forEach(msg => {
            const row = document.createElement('div');
            row.className = `message-row ${msg.role}`;
            
            let filesHTML = '';
            if (msg.files && msg.files.length > 0) {
                filesHTML = `<div class="msg-attached-files" style="display:flex; gap:8px; margin-bottom:8px;">${
                    msg.files.map(f => f.type.startsWith('image/') ? `<img src="${f.data}" style="max-width:120px; border-radius:6px;">` : `<div style="background:rgba(0,0,0,0.2); padding:6px; border-radius:6px; font-size:0.8rem;"><i class="fa-solid fa-file-pdf"></i> ${f.name}</div>`).join('')
                }</div>`;
            }

            row.innerHTML = `
                <img class="message-avatar" src="${msg.role === 'user' ? state.user.avatar : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80'}" alt="Avatar">
                <div class="message-content-wrap">
                    <div class="message-meta">${msg.role === 'user' ? state.user.username : 'TBP AI'} • ${msg.timestamp}</div>
                    <div class="message-bubble">${filesHTML}${msg.role === 'assistant' ? Markdown.parse(msg.text) : msg.text}</div>
                    <div class="message-actions">
                        <button class="action-btn copy-msg" data-text="${msg.text.replace(/"/g, '&quot;')}"><i class="fa-solid fa-copy"></i> Copy</button>
                        ${msg.role === 'user' ? `<button class="action-btn edit-msg" data-id="${msg.id}"><i class="fa-solid fa-pen"></i> Edit</button>` : ''}
                        <button class="action-btn delete-msg" data-id="${msg.id}"><i class="fa-solid fa-trash-can"></i> Delete</button>
                        ${msg.role === 'assistant' ? `<button class="action-btn regen-msg"><i class="fa-solid fa-rotate-right"></i> Regenerate</button>` : ''}
                    </div>
                </div>
            `;

            // Setup Event Operations on Dynamic Message Elements
            row.querySelector('.copy-msg').addEventListener('click', (e) => {
                navigator.clipboard.writeText(msg.text);
                alert('Copied message content to clipboard!');
            });

            row.querySelector('.delete-msg').addEventListener('click', () => {
                activeChat.messages = activeChat.messages.filter(m => m.id !== msg.id);
                saveStateToStorage();
                renderActiveChatMessages();
            });

            if (msg.role === 'user') {
                row.querySelector('.edit-msg').addEventListener('click', () => {
                    const nextText = prompt("Modify Message Context:", msg.text);
                    if (nextText) {
                        msg.text = nextText;
                        saveStateToStorage();
                        renderActiveChatMessages();
                    }
                });
            } else {
                row.querySelector('.regen-msg').addEventListener('click', () => {
                    if (!state.isGenerating) triggerAIResponse(activeChat);
                });
            }

            nodes.chatMessages.appendChild(row);
        });

        scrollToBottom();
    }

    // File Management Engine Processing Pipeline
    function handleFileSelection(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                state.stagedFiles.push({
                    name: file.name,
                    type: file.type,
                    data: event.target.result
                });
                updateFilePreviewUI();
            };
            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file); // Handle basic PDF text streams
            }
        });
    }

    function updateFilePreviewUI() {
        if (state.stagedFiles.length === 0) {
            nodes.filePreviewBar.style.display = 'none';
            nodes.filePreviewBar.innerHTML = '';
            return;
        }

        nodes.filePreviewBar.style.display = 'flex';
        nodes.filePreviewBar.innerHTML = '';

        state.stagedFiles.forEach((file, index) => {
            const pill = document.createElement('div');
            pill.className = 'preview-pill';
            if (file.type.startsWith('image/')) {
                pill.innerHTML = `<img src="${file.data}"><button class="remove-pill" data-idx="${index}">&times;</button>`;
            } else {
                pill.innerHTML = `<div class="pdf-icon"><i class="fa-solid fa-file-pdf"></i></div><button class="remove-pill" data-idx="${index}">&times;</button>`;
            }

            pill.querySelector('.remove-pill').addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                state.stagedFiles.splice(idx, 1);
                updateFilePreviewUI();
            });

            nodes.filePreviewBar.appendChild(pill);
        });
    }

    // Native Hardware Stream System Integrations (Camera/Voice)
    let localStream = null;
    async function startCamera() {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true });
            nodes.cameraVideo.srcObject = localStream;
            nodes.cameraModal.style.display = 'flex';
        } catch (err) {
            alert('Unable to capture camera stream: ' + err.message);
        }
    }

    function stopCamera() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        nodes.cameraModal.style.display = 'none';
    }

    function captureSnapshot() {
        const canvas = document.createElement('canvas');
        canvas.width = nodes.cameraVideo.videoWidth;
        canvas.height = nodes.cameraVideo.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(nodes.cameraVideo, 0, 0, canvas.width, canvas.height);
        
        state.stagedFiles.push({
            name: `Snapshot-${Date.now()}.png`,
            type: 'image/png',
            data: canvas.toDataURL('image/png')
        });
        
        updateFilePreviewUI();
        stopCamera();
    }
    function startVoiceDictation() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Web Speech API Recognition engine not natively supported.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        nodes.voiceInputBtn.style.color = 'var(--danger)';

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            nodes.chatInput.value += (nodes.chatInput.value ? ' ' : '') + transcript;
            autoResizeTextArea();
        };

        recognition.onend = () => {
            nodes.voiceInputBtn.style.color = 'var(--text-main)';
        };

        recognition.start();
    }

    function speakText(text) {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const strippedText = text.replace(/<[^>]*>/g, '');
        const utterance = new SpeechSynthesisUtterance(strippedText);
        window.speechSynthesis.speak(utterance);
    }

    // State Lifecycle State Operations
    function createNewChat(initialTitle = "New Chat") {
        const id = 'chat-' + Date.now();
        const newChatObj = { id: id, title: initialTitle, messages: [] };
        state.chats.unshift(newChatObj);
        state.currentChatId = id;
        saveStateToStorage();
        renderHistoryList();
        renderActiveChatMessages();
    }

    function switchChat(id) {
        state.currentChatId = id;
        renderHistoryList();
        renderActiveChatMessages();
        if (window.innerWidth <= 768) nodes.sidebar.classList.remove('open');
    }

    function deleteChat(id) {
        state.chats = state.chats.filter(c => c.id !== id);
        if (state.currentChatId === id) state.currentChatId = state.chats[0]?.id || null;
        saveStateToStorage();
        renderHistoryList();
        renderActiveChatMessages();
    }

    function exportChatText() {
        const activeChat = state.chats.find(c => c.id === state.currentChatId);
        if (!activeChat) return;

        let output = `--- TBP AI v3.1 Session Log --- \nTitle: ${activeChat.title}\n\n`;
        activeChat.messages.forEach(m => {
            output += `[${m.timestamp}] ${m.role.toUpperCase()}: ${m.text}\n`;
        });

        const blob = new Blob([output], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `TBP-Chat-Log-${state.currentChatId}.txt`;
        a.click();
    }

    // UI Utilities & Ergonomic State Actions
    function toggleInputStateLoading(loading) {
        if (loading) {
            nodes.sendMessageBtn.style.display = 'none';
            nodes.stopGenerationBtn.style.display = 'flex';
        } else {
            nodes.sendMessageBtn.style.display = 'flex';
            nodes.stopGenerationBtn.style.none = 'none';
        }
    }

    function autoResizeTextArea() {
        nodes.chatInput.style.height = 'auto';
        nodes.chatInput.style.height = nodes.chatInput.scrollHeight + 'px';
    }

    // Dynamic Search System Function
    function searchChatHistory() {
        renderHistoryList();
    }

    function scrollToBottom() {
        nodes.chatMessages.scrollTop = nodes.chatMessages.scrollHeight;
    }

    function saveStateToStorage() {
        localStorage.setItem('tbp_chats', JSON.stringify(state.chats));
        localStorage.setItem('tbp_profile', JSON.stringify(state.user));
    }

    // Declarative UI Listener Event Core Mapping
    function registerEventBindings() {
        // Form Systems Execution Interface
        nodes.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            nodes.authScreen.style.display = 'none';
            nodes.workspace.style.display = 'flex';
        });

        // Chat Operational Events
        nodes.sendMessageBtn.addEventListener('click', handleSendMessage);
        nodes.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        nodes.chatInput.addEventListener('input', autoResizeTextArea);
        nodes.newChatBtn.addEventListener('click', () => createNewChat());
        
        nodes.stopGenerationBtn.addEventListener('click', () => {
            if (state.abortController) state.abortController.abort();
        });

        // Structural Modals Listeners Triggering Mapping
        nodes.themeToggleBtn.addEventListener('click', () => {
            state.activeTheme = state.activeTheme === 'dark-theme' ? 'light-theme' : 'dark-theme';
            localStorage.setItem('tbp_theme', state.activeTheme);
            setupThemesAndWallpapers();
        });

        nodes.wallpaperToggleBtn.addEventListener('click', () => nodes.wallpaperModal.style.display = 'flex');
        nodes.settingsToggleBtn.addEventListener('click', () => nodes.settingsModal.style.display = 'flex');
        nodes.profileTrigger.addEventListener('click', () => nodes.profileModal.style.display = 'flex');
        nodes.exportChatBtn.addEventListener('click', exportChatText);
        
        nodes.logoutBtn.addEventListener('click', () => {
            nodes.workspace.style.display = 'none';
            nodes.authScreen.style.display = 'flex';
        });

        nodes.searchChatInput.addEventListener('input', searchChatHistory);

        // Hardware Bindings
        nodes.fileUploadInput.addEventListener('change', handleFileSelection);
        nodes.cameraBtn.addEventListener('click', startCamera);
        nodes.stopCameraBtn.addEventListener('click', stopCamera);
        nodes.capturePhotoBtn.addEventListener('click', captureSnapshot);
        nodes.voiceInputBtn.addEventListener('click', startVoiceDictation);

        // Modal Close Setup Direct Operations
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal-overlay').style.display = 'none';
            });
        });

        // Profile Update Handler Actions
        nodes.saveProfileBtn.addEventListener('click', () => {
            state.user.username = nodes.profileUsernameInput.value;
            saveStateToStorage();
            syncProfileDOM();
            nodes.profileModal.style.display = 'none';
            renderActiveChatMessages();
        });

        nodes.avatarUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    state.user.avatar = ev.target.result;
                    nodes.modalAvatarPreview.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Canvas Wallpapers Options System Setup Target Logic
        document.querySelectorAll('.wallpaper-item').forEach(item => {
            item.addEventListener('click', () => {
                const wp = item.dataset.wp;
                if (wp === 'none') {
                    state.activeWallpaper = 'none';
                } else if (wp === 'cyber') {
                    state.activeWallpaper = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)';
                } else if (wp === 'nebula') {
                    state.activeWallpaper = 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)';
                }
                localStorage.setItem('tbp_wallpaper', state.activeWallpaper);
                setupThemesAndWallpapers();
                nodes.wallpaperModal.style.display = 'none';
            });
        });

        // Native Drag-and-Drop Implementation Target Mechanics
        nodes.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            nodes.dropZone.classList.add('dragactive');
        });
        nodes.dropZone.addEventListener('dragleave', () => {
            nodes.dropZone.classList.remove('dragactive');
        });
        nodes.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            nodes.dropZone.classList.remove('dragactive');
            const dataTransfer = { files: e.dataTransfer.files };
            handleFileSelection(dataTransfer);
        });

        // Structural Mobile Responsiveness Sidebar Handlers
        nodes.toggleSidebarBtn.addEventListener('click', () => nodes.sidebar.classList.add('open'));
        nodes.closeSidebarBtn.addEventListener('click', () => nodes.sidebar.classList.remove('open'));
    }

    // Fire application runtime context pipeline
    init();
});
