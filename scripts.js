document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.getElementById('toggle-sidebar');
    const newChatButton = document.getElementById('new-chat');
    const fatherChatButton = document.querySelector('.button');
    const settingsButton = document.getElementById('settings-btn');
    const settingsPage = document.getElementById('settings-page');
    const settingsForm = document.getElementById('settings-form');
    const saveButton = document.getElementById('save-settings');
    const cancelButton = document.getElementById('cancel-settings');
    const defaultButton = document.getElementById('default-settings');
    const dimBackground = document.getElementById('dim-background');
    const modelProviderSelect = document.getElementById('model-provider');
    const modelSelect = document.getElementById('model');
    const chatInput = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.send-btn');
    const chatMessages = document.getElementById('chat-messages');
    const fileUpload = document.getElementById('file-upload');
    const fileContainer = document.getElementById('file-container');
    const scrollDownBtn = document.getElementById('scroll-down-btn');
    const chatArea = document.querySelector('.chat-area');
    const historySearch = document.getElementById('history-search');

    let uploadedFiles = [];
    let isGenerating = false;
    let chatHistory = [];
    let histories = [];
    let currentHistoryId = null;
    let conversationContext = {};
    
    const defaultSettings = {
        'model-provider': 'openai',
        'api-key': '',
        'api-host': 'https://api.openai.com/v1',
        'model': 'gpt-4o-mini-2024-07-18',
        'temperature': 0.7,
        'top-p': 1.0,
        'presence-penalty': 0.0,
        'frequency-penalty': 0.0,
        'system-prompt': 'You are a helpful assistant.'
    };
  
    const openAIModels = [];
    fetch('models/openai.json')
        .then(response => response.json())
        .then(data => openAIModels.push(...data))
        .catch(error => console.error('Error loading OpenAI models:', error));
  
    const groqModels = [];
    fetch('models/groq.json')
        .then(response => response.json())
        .then(data => groqModels.push(...data))
        .catch(error => console.error('Error loading Groq models:', error));
  
    const togetherAIModels = [];
    fetch('models/togetherai.json')
        .then(response => response.json())
        .then(data => togetherAIModels.push(...data))
        .catch(error => console.error('Error loading TogetherAI models:', error));
  
    const googleModels = [];
    fetch('models/google.json')
        .then(response => response.json())
        .then(data => googleModels.push(...data))
        .catch(error => console.error('Error loading Google models:', error));

    function createNewHistory(firstMessage) {
        const newHistory = {
            id: Date.now(),
            title: firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : ''),
            messages: []
        };
        histories.unshift(newHistory);
        currentHistoryId = newHistory.id;
        conversationContext[currentHistoryId] = ''; 
        updateHistoryList();
        saveHistoriesToLocalStorage();
        return newHistory;
    }

    function updateHistoryList(filteredHistories = histories) {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';

        function setSidebarState() {
            const userToggled = sidebar.hasAttribute('data-user-toggled');
            if (!userToggled) {
                if (window.innerWidth < 768) {
                    sidebar.classList.add('closed');
                    toggleButton?.setAttribute('data-tooltip', 'Open Sidebar');
                } else {
                    sidebar.classList.remove('closed');
                    toggleButton?.setAttribute('data-tooltip', 'Close Sidebar');
                }
            }
        }

        setSidebarState();

        window.addEventListener('resize', debounce(setSidebarState, 250));
        
        filteredHistories.forEach(history => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.setAttribute('data-id', history.id);
            historyItem.setAttribute('data-full-title', history.title);
            if (history.id === currentHistoryId) {
                historyItem.classList.add('active');
            }

            const historyItemText = document.createElement('span');
            historyItemText.classList.add('history-item-text');
            
            updateHistoryItemText(historyItemText, history.title);
            
            historyItem.appendChild(historyItemText);

            const buttonsContainer = document.createElement('div');
            buttonsContainer.classList.add('history-item-buttons');

            const editButton = createHistoryButton('edit.svg', 'Edit', () => editHistory(history.id));
            const deleteButton = createHistoryButton('delete.svg', 'Delete', () => deleteHistory(history.id));

            buttonsContainer.appendChild(editButton);
            buttonsContainer.appendChild(deleteButton);
            historyItem.appendChild(buttonsContainer);

            historyItem.addEventListener('click', (e) => {
                if (!e.target.closest('.history-item-button')) {
                    loadHistory(history.id);
                }
            });

            historyItem.addEventListener('mouseenter', showTooltip);
            historyItem.addEventListener('mouseleave', hideTooltip);

            historyList.appendChild(historyItem);
        });
    }

    window.addEventListener('resize', debounce(() => {
        updateHistoryList();
    }, 250));

    function createHistoryButton(iconSrc, altText, onClick) {
        const button = document.createElement('button');
        button.classList.add('history-item-button');
        const img = document.createElement('img');
        img.src = `assets/${iconSrc}`;
        img.alt = altText;
        button.appendChild(img);
        button.addEventListener('click', onClick);
        return button;
    }

    function editHistory(historyId) {
        const historyItem = document.querySelector(`.history-item[data-id="${historyId}"]`);
        if (!historyItem) return;

        const historyItemText = historyItem.querySelector('.history-item-text');
        const currentTitle = historyItem.getAttribute('data-full-title') || historyItemText.textContent;

        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.value = currentTitle;
        inputElement.className = 'history-item-edit-input';

        historyItemText.innerHTML = '';
        historyItemText.appendChild(inputElement);
        inputElement.focus();

        function finishEditing() {
            const newTitle = inputElement.value.trim();
            if (newTitle !== '' && newTitle !== currentTitle) {
                const history = histories.find(h => h.id === historyId);
                if (history) {
                    history.title = newTitle;
                    historyItem.setAttribute('data-full-title', newTitle);
                    updateHistoryItemText(historyItemText, newTitle);
                    updateHistoryList();
                    saveHistoriesToLocalStorage();
                }
            } else {
                cancelEditing();
            }
        }

        function cancelEditing() {
            updateHistoryItemText(historyItemText, currentTitle);
        }

        inputElement.addEventListener('blur', finishEditing);
        inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishEditing();
            } else if (e.key === 'Escape') {
                cancelEditing();
            }
        });
    }

    function updateHistoryItemText(element, text) {
        if (!element) return;
        
        element.textContent = text.length > 15 ? text.substring(0, 15) + '...' : text;
        
        const parentElement = element.closest('.history-item');
        if (parentElement) {
            parentElement.setAttribute('data-full-title', text);
        }
    }

    function showTooltip(event) {
        const historyItem = event.currentTarget;
        const fullTitle = historyItem.getAttribute('data-full-title');
        
        if (fullTitle.length > 15) {
            const tooltip = document.createElement('div');
            tooltip.className = 'history-tooltip';
            tooltip.textContent = fullTitle;
            
            historyItem.appendChild(tooltip);
            
            const tooltipRect = tooltip.getBoundingClientRect();
            const sidebarRect = document.querySelector('.sidebar').getBoundingClientRect();
            
            if (tooltipRect.bottom > window.innerHeight) {
                tooltip.style.bottom = 'auto';
                tooltip.style.top = '-30px';
            }
            
            if (tooltipRect.left < sidebarRect.left) {
                tooltip.style.left = '0';
                tooltip.style.transform = 'none';
            } else if (tooltipRect.right > sidebarRect.right) {
                tooltip.style.left = 'auto';
                tooltip.style.right = '0';
                tooltip.style.transform = 'none';
            }
        }
    }

    function hideTooltip(event) {
        const tooltip = event.currentTarget.querySelector('.history-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    function deleteHistory(historyId) {
        histories = histories.filter(h => h.id !== historyId);
        if (currentHistoryId === historyId) {
            currentHistoryId = null;
            chatMessages.innerHTML = '';
        }
        updateHistoryList();
        saveHistoriesToLocalStorage();
    }

    function loadHistory(historyId) {
        currentHistoryId = historyId;
        const history = histories.find(h => h.id === historyId);
        if (history) {
            chatMessages.innerHTML = '';
            history.messages.forEach(message => {
                if (message.sender === 'user') {
                    displayMessage(message.content, 'user', message.originalContent);
                } else if (message.sender === 'ai') {
                    const aiMessageElement = displayMessage('', 'ai');
                    const aiContent = aiMessageElement.querySelector('.ai-content');
                    aiContent.innerHTML = message.content;
                    aiMessageElement.setAttribute('data-original-content', message.originalContent);
                    
                    aiMessageElement.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightElement(block);
                        const pre = block.parentNode;
                        if (!pre.querySelector('.copy-button')) {
                            block.setAttribute('data-original-text', block.textContent);
                            const copyButton = createCopyButton(block);
                            pre.appendChild(copyButton);
                        }
                    });

                    if (!aiMessageElement.querySelector('.message-copy-button')) {
                        const copyButton = createMessageCopyButton(aiMessageElement, message.originalContent);
                        aiMessageElement.appendChild(copyButton);
                    }
                }
            });
            updateHistoryList();
            
            chatArea.scrollTop = chatArea.scrollHeight;
            
            MathJax.typesetPromise([chatMessages]).catch((err) => console.error(err.message));

            if (!conversationContext[currentHistoryId]) {
                conversationContext[currentHistoryId] = '';
                history.messages.forEach(message => {
                    conversationContext[currentHistoryId] += ' ' + message.content;
                });
                if (conversationContext[currentHistoryId].length > 2000) {
                    conversationContext[currentHistoryId] = conversationContext[currentHistoryId].slice(-2000);
                }
            }
        }
    }

    function saveHistoriesToLocalStorage() {
        localStorage.setItem('chatHistories', JSON.stringify(histories));
        localStorage.setItem('conversationContext', JSON.stringify(conversationContext));
    }

    function loadHistoriesFromLocalStorage() {
        const savedHistories = localStorage.getItem('chatHistories');
        const savedContext = localStorage.getItem('conversationContext');
        if (savedHistories) {
            histories = JSON.parse(savedHistories);
            updateHistoryList();
        }
        if (savedContext) {
            conversationContext = JSON.parse(savedContext);
        }
    }

    function searchHistory(query) {
        const filteredHistories = histories.filter(history => 
            history.title.toLowerCase().includes(query.toLowerCase())
        );
        updateHistoryList(filteredHistories);
    }

    function startNewChat() {
        chatMessages.innerHTML = '';
        chatInput.value = '';
        fileContainer.innerHTML = '';
        fileContainer.style.display = 'none';
        uploadedFiles = [];
        currentHistoryId = null;
        chatHistory = []; 
        scrollDownBtn.style.display = 'none';
        toggleScrollDownButton();
        isGenerating = false;
        enableSendInterface();
    }

    function returnToHomePage() {
        startNewChat();
    }

    newChatButton.addEventListener('click', startNewChat);

    fatherChatButton.addEventListener('click', returnToHomePage);
  
    function populateModelDropdown(models) {
        modelSelect.innerHTML = '';
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        });
    }
  
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('settings')) || defaultSettings;
        for (const key in settings) {
            if (settings.hasOwnProperty(key)) {
                const element = settingsForm.elements[key];
                if (element) {
                    if (key === 'model-provider') {
                        element.value = settings[key];
                        element.dispatchEvent(new Event('change'));
                    } else if (key === 'system-prompt') {
                        element.value = settings[key];
                    } else {
                        element.value = settings[key];
                    }
                }
            }
        }
    }
  
    function saveSettings() {
        const settings = {};
        for (const element of settingsForm.elements) {
            if (element.name) {
                settings[element.name] = element.value;
            }
        }
        localStorage.setItem('settings', JSON.stringify(settings));
    }

    let initialHeight;

    function setInitialHeight() {
        chatInput.style.height = 'auto'; 
        initialHeight = chatInput.scrollHeight;
        chatInput.style.height = initialHeight + 'px';
    }

    function adjustInputHeight() {
        chatInput.style.height = 'auto'; 
        const scrollHeight = chatInput.scrollHeight;
        
        if (scrollHeight > initialHeight) {
            const newHeight = Math.min(scrollHeight, window.innerHeight * 0.2);
            chatInput.style.height = newHeight + 'px';
        } else {
            chatInput.style.height = initialHeight + 'px';
        }
    }

    setInitialHeight(); 

    chatInput.addEventListener('input', adjustInputHeight);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            setInitialHeight();
            adjustInputHeight();
        }, 250); 
    });

  
    function restoreDefaults() {
        for (const key in defaultSettings) {
            if (defaultSettings.hasOwnProperty(key)) {
                const element = settingsForm.elements[key];
                if (element) {
                    if (key === 'model-provider') {
                        element.value = defaultSettings[key];
                        element.dispatchEvent(new Event('change'));
                    } else if (key === 'system-prompt') {
                        element.value = defaultSettings[key];
                    } else {
                        element.value = defaultSettings[key];
                    }
                }
            }
        }
    }
  
    function closeSettings() {
        settingsPage.classList.remove('open');
        dimBackground.classList.remove('active');
    }

    function createCopyButton(codeBlock) {
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy';
        copyButton.className = 'copy-button';
        copyButton.addEventListener('click', async () => {
            try {
                const originalText = codeBlock.getAttribute('data-original-text') || codeBlock.textContent;
                await navigator.clipboard.writeText(originalText);
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
        });
        return copyButton;
    }

    function createMessageCopyButton(messageElement, originalContent) {
        const copyButton = document.createElement('button');
        copyButton.className = 'message-copy-button';
        const copyIcon = document.createElement('img');
        copyIcon.src = 'assets/copy.svg';
        copyIcon.alt = 'Copy Icon';
        copyButton.appendChild(copyIcon);
    
        copyButton.addEventListener('click', async () => {
            try {
                let contentToCopy;
                if (messageElement.classList.contains('user-message')) {
                    contentToCopy = originalContent;
                } else if (messageElement.classList.contains('ai-message')) {
                    contentToCopy = messageElement.getAttribute('data-original-content') || messageElement.querySelector('.ai-content').textContent;
                }
                
                await navigator.clipboard.writeText(contentToCopy);
                copyIcon.src = 'assets/copied.svg';
                setTimeout(() => {
                    copyIcon.src = 'assets/copy.svg';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
        });
        return copyButton;
    }

    function toggleScrollDownButton() {
        const { scrollTop, scrollHeight, clientHeight } = chatArea;
        const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10;
        const hasOverflow = scrollHeight > clientHeight;

        scrollDownBtn.style.display = (!isScrolledToBottom && hasOverflow) ? 'flex' : 'none';
    }

    function scrollToBottom() {
        const lastMessage = chatMessages.lastElementChild;
        if (lastMessage) {
            lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else {
            chatArea.scrollTo({
                top: chatArea.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    chatArea.addEventListener('scroll', toggleScrollDownButton);
    scrollDownBtn.addEventListener('click', scrollToBottom);

    function displayMessage(content, sender, originalContent) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        
        if (sender === 'ai') {
            messageElement.innerHTML = '<div class="ai-content"></div>';
            const aiContent = messageElement.querySelector('.ai-content');
            
            const waitingAnimation = document.createElement('span');
            waitingAnimation.classList.add('breathing-circle');
            aiContent.appendChild(waitingAnimation);

            messageElement.setAttribute('data-original-content', originalContent);
        } else {
            messageElement.innerHTML = content;
            
            messageElement.querySelectorAll('img').forEach(img => {
                img.addEventListener('click', () => showFullsizeImage(img.src));
            });
        }
        
        const copyButton = createMessageCopyButton(messageElement, originalContent || content);
        messageElement.appendChild(copyButton);
        
        chatMessages.appendChild(messageElement);
        toggleScrollDownButton();
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageElement;
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    const debouncedRender = debounce((element) => {
        requestAnimationFrame(() => {
            element.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        });
    }, 500);

    function preprocessLatex(content) {
        content = content.replace(/\\\[([\s\S]*?)\\\]/g, (match, p1) => {
            p1 = p1.trim();
            return `$$ ${p1} $$`;
        });

        content = content.replace(/\\\((.*?)\\\)/g, (match, p1) => {
            p1 = p1.trim();
            return `$${p1}$`;
        });
    
        return content;
    }

    function disableSendInterface() {
        sendButton.disabled = true;
        sendButton.classList.add('disabled');
        isGenerating = true;
    }

    function enableSendInterface() {
        sendButton.disabled = false;
        sendButton.classList.remove('disabled');
        isGenerating = false;
    }

    async function sendMessage() {
        if (isGenerating) return;
        
        const userMessage = chatInput.value.trim();
        if (userMessage === '' && uploadedFiles.length === 0) return;

        if (!currentHistoryId) {
            createNewHistory(userMessage);
        }

        disableSendInterface();
        isGenerating = true;
    
        const messageContent = document.createElement('div');
        if (userMessage !== '') {
            const textContent = document.createElement('p');
            textContent.innerHTML = userMessage.replace(/\n/g, '<br>');
            messageContent.appendChild(textContent);
        }
    
        const imagePromises = uploadedFiles.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        });
    
        const imageDataUrls = await Promise.all(imagePromises);
    
        imageDataUrls.forEach(dataUrl => {
            const img = document.createElement('img');
            img.src = dataUrl;
            img.addEventListener('click', () => showFullsizeImage(dataUrl));
            messageContent.appendChild(img);
        });
    
        const userMessageElement = displayMessage(messageContent.innerHTML, 'user', userMessage);
        scrollToBottom();

        chatInput.value = '';
        fileContainer.innerHTML = '';
        fileContainer.style.display = 'none';
        uploadedFiles = [];
    
        const settings = JSON.parse(localStorage.getItem('settings')) || defaultSettings;
    
        const aiMessageElement = displayMessage('', 'ai');
        const aiContent = aiMessageElement.querySelector('.ai-content');
        const waitingAnimation = aiContent.querySelector('.breathing-circle');
    
    
        try {
            const messages = [
                { role: "system", content: settings['system-prompt'] }
            ];

            if (conversationContext[currentHistoryId]) {
                messages.push({ role: "system", content: `Previous context: ${conversationContext[currentHistoryId]}` });
            }

            messages.push(...chatHistory);

            const userContent = [];
            if (userMessage !== '') {
                userContent.push({ type: "text", text: userMessage });
            }
            imageDataUrls.forEach(dataUrl => {
                userContent.push({
                    type: "image_url",
                    image_url: { url: dataUrl }
                });
            });
            messages.push({ role: "user", content: userContent });

            chatHistory.push({ role: "user", content: userContent });
    
            if (settings['model-provider'] === 'google') {
                const apiUrl = `${settings['api-host']}/${settings['model']}:generateContent?key=${settings['api-key']}`;
                const requestBody = {
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: userMessage }]
                        }
                    ],
                    generation_config: {
                        temperature: parseFloat(settings['temperature']),
                        top_p: parseFloat(settings['top-p']),
                    },
                    safety_settings: [
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
                    ]
                };

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                aiResponse = data.candidates[0].content.parts[0].text;

                aiContent.innerHTML = marked.parse(preprocessLatex(aiResponse));
                aiContent.appendChild(waitingAnimation);
                toggleScrollDownButton();

                debouncedRender(aiMessageElement);

                aiMessageElement.querySelectorAll('pre code').forEach((block) => {
                    const pre = block.parentNode;
                    if (!pre.querySelector('.copy-button')) {
                        block.setAttribute('data-original-text', block.textContent);
                        const copyButton = createCopyButton(block);
                        pre.appendChild(copyButton);
                    }
                });

                aiMessageElement.setAttribute('data-original-content', aiResponse);

                if (!aiMessageElement.querySelector('.message-copy-button')) {
                    const copyButton = createMessageCopyButton(aiMessageElement, aiResponse);
                    aiMessageElement.appendChild(copyButton);
                }
                chatArea.scrollTop = chatArea.scrollHeight;

            } else {
                const response = await fetch(settings['api-host'] + '/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${settings['api-key']}`
                    },
                    body: JSON.stringify({
                        model: settings['model'],
                        messages: messages,
                        max_tokens: 1000,
                        temperature: parseFloat(settings['temperature']),
                        top_p: parseFloat(settings['top-p']),
                        presence_penalty: parseFloat(settings['presence-penalty']),
                        frequency_penalty: parseFloat(settings['frequency-penalty']),
                        stream: true
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let aiResponse = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop();

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const jsonLine = line.slice(6).trim();
                            if (jsonLine === '[DONE]') {
                                break;
                            }
                            try {
                                const jsonData = JSON.parse(jsonLine);
                                const content = jsonData.choices[0].delta.content;
                                if (content) {
                                    if (aiResponse === '') {
                                        aiContent.innerHTML = '';
                                    }
                                    aiResponse += content;
                                    const preprocessedContent = preprocessLatex(aiResponse);
                                    const renderedContent = marked.parse(preprocessedContent);
                                    aiContent.innerHTML = renderedContent;
                                    aiContent.appendChild(waitingAnimation);
                                    toggleScrollDownButton();

                                    debouncedRender(aiMessageElement);

                                    aiMessageElement.querySelectorAll('pre code').forEach((block) => {
                                        const pre = block.parentNode;
                                        if (!pre.querySelector('.copy-button')) {
                                            block.setAttribute('data-original-text', block.textContent);
                                            const copyButton = createCopyButton(block);
                                            pre.appendChild(copyButton);
                                        }
                                    });

                                    aiMessageElement.setAttribute('data-original-content', aiResponse);

                                    if (!aiMessageElement.querySelector('.message-copy-button')) {
                                        const copyButton = createMessageCopyButton(aiMessageElement, aiResponse);
                                        aiMessageElement.appendChild(copyButton);
                                    }
                                    chatArea.scrollTop = chatArea.scrollHeight;
                                }
                            } catch (error) {
                                console.warn('Failed to parse JSON:', jsonLine, error);
                            }
                        }
                    }
                }

                waitingAnimation.remove();

                chatHistory.push({ role: "assistant", content: aiResponse });

                MathJax.typesetPromise([aiMessageElement]).catch((err) => console.error(err.message));

                const currentHistory = histories.find(h => h.id === currentHistoryId);
                currentHistory.messages.push({ sender: 'user', content: messageContent.innerHTML, originalContent: userMessage });
                currentHistory.messages.push({ sender: 'ai', content: aiContent.innerHTML, originalContent: aiResponse });
                
                if (currentHistory.messages.length === 2) {
                    currentHistory.title = userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : '');
                }

                updateHistoryList();
                saveHistoriesToLocalStorage();

                conversationContext[currentHistoryId] += ' ' + userMessage + ' ' + aiResponse;

                if (conversationContext[currentHistoryId].length > 2000) {
                    conversationContext[currentHistoryId] = conversationContext[currentHistoryId].slice(-2000);
                }
            }

        } catch (error) {
            console.error('Error:', error);
            aiContent.textContent = 'An error occurred while processing your request.';
            waitingAnimation.remove();
        } finally {
            enableSendInterface();
        }
    }

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isGenerating) {
                sendMessage();
            }
        }
    });

    function handlePaste(event) {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                event.preventDefault();
                const blob = item.getAsFile();
                handlePastedFile(blob);
            }
        }
    }

    function handlePastedFile(file) {
        fileContainer.style.display = 'flex';

        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = () => URL.revokeObjectURL(img.src);

        const removeFileButton = document.createElement('button');
        removeFileButton.classList.add('remove-file');
        removeFileButton.textContent = 'X';
        removeFileButton.addEventListener('click', () => {
            fileItem.remove();
            uploadedFiles = uploadedFiles.filter(f => f !== file);
            if (fileContainer.children.length === 0) {
                fileContainer.style.display = 'none';
            }
        });

        fileItem.appendChild(img);
        fileItem.appendChild(removeFileButton);

        fileContainer.appendChild(fileItem);
        uploadedFiles.push(file);
    }

    function handleFileUpload(event) {
        const files = event.target.files;
        if (files.length > 0) {
            fileContainer.style.display = 'flex';
        }

        Array.from(files).forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.classList.add('file-item');

            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.onload = () => URL.revokeObjectURL(img.src);

            const removeFileButton = document.createElement('button');
            removeFileButton.classList.add('remove-file');
            removeFileButton.textContent = 'X';
            removeFileButton.addEventListener('click', () => {
                fileItem.remove();
                uploadedFiles = uploadedFiles.filter(f => f !== file);
                if (fileContainer.children.length === 0) {
                    fileContainer.style.display = 'none';
                }
            });

            fileItem.appendChild(img);
            fileItem.appendChild(removeFileButton);

            fileContainer.appendChild(fileItem);
            uploadedFiles.push(file);
        });

        fileUpload.value = '';
    }

    function showFullsizeImage(src) {
        const fullsizeContainer = document.createElement('div');
        fullsizeContainer.classList.add('fullsize-image');
        const img = document.createElement('img');
        img.src = src;
        fullsizeContainer.appendChild(img);
        document.body.appendChild(fullsizeContainer);

        fullsizeContainer.addEventListener('click', () => {
            fullsizeContainer.remove();
        });
    }

    toggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('closed');
        sidebar.setAttribute('data-user-toggled', 'true');
        toggleButton.setAttribute('data-tooltip', sidebar.classList.contains('closed') ? 'Open Sidebar' : 'Close Sidebar');
    });

    newChatButton.addEventListener('mouseenter', () => {
        newChatButton.setAttribute('data-tooltip', 'New Chat');
    });

    settingsButton.addEventListener('click', () => {
        settingsPage.classList.add('open');
        dimBackground.classList.add('active');
        loadSettings();
    });

    saveButton.addEventListener('click', () => {
        saveSettings();
        closeSettings();
    });

    cancelButton.addEventListener('click', () => {
        closeSettings();
    });

    defaultButton.addEventListener('click', () => {
        restoreDefaults();
    });

    modelProviderSelect.addEventListener('change', (event) => {
        const apiHostInput = settingsForm.elements['api-host'];
        if (event.target.value === 'openai') {
            apiHostInput.value = 'https://api.openai.com/v1';
            populateModelDropdown(openAIModels);
        } else if (event.target.value === 'groq') {
            apiHostInput.value = 'https://api.groq.com/openai/v1';
            populateModelDropdown(groqModels);
        } else if (event.target.value === 'together') {
            apiHostInput.value = 'https://api.together.xyz/v1';
            populateModelDropdown(togetherAIModels);
        } else if (event.target.value === 'google') {
            apiHostInput.value = 'https://generativelanguage.googleapis.com/v1/models';
            populateModelDropdown(googleModels);
        }
    });

    dimBackground.addEventListener('click', () => {
        closeSettings();
    });

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('paste', handlePaste);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    const attachmentButton = document.querySelector('.attachment-btn');
    attachmentButton.addEventListener('click', () => fileUpload.click());
    fileUpload.addEventListener('change', handleFileUpload);

    populateModelDropdown(openAIModels);

    historySearch.addEventListener('input', (e) => searchHistory(e.target.value));

    loadHistoriesFromLocalStorage();
});