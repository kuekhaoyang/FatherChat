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

    let uploadedFiles = [];
    let isGenerating = false;
    let chatHistory = [];
    
    const defaultSettings = {
        'model-provider': 'openai',
        'api-key': '',
        'api-host': 'https://api.openai.com/v1',
        'model': 'gpt-4o',
        'temperature': 0.7,
        'top-p': 1.0,
        'presence-penalty': 0.0,
        'frequency-penalty': 0.0,
        'system-prompt': 'You are a helpful assistant.'
    };
  
    const openAIModels = [
        'gpt-4o-mini', 'gpt-4o', 'gpt-4o-2024-05-13', 'gpt-4-turbo', 'gpt-4-turbo-2024-04-09',
        'gpt-4-turbo-preview', 'gpt-4-0125-preview', 'gpt-4-1106-preview',
        'gpt-4-vision-preview', 'gpt-4-1106-vision-preview', 'gpt-4',
        'gpt-4-0613', 'gpt-4-32k', 'gpt-4-32k-0613', 'gpt-3.5-turbo-0125',
        'gpt-3.5-turbo', 'gpt-3.5-turbo-1106', 'gpt-3.5-turbo-instruct',
        'gpt-3.5-turbo-16k', 'gpt-3.5-turbo-0613', 'gpt-3.5-turbo-16k-0613'
    ];
  
    const groqModels = [
        'llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768',
        'gemma-7b-it', 'gemma2-9b-it'
    ];
  

    function startNewChat() {
        chatMessages.innerHTML = '';
        chatInput.value = '';
        fileContainer.innerHTML = '';
        fileContainer.style.display = 'none';
        uploadedFiles = [];
        chatHistory = []; 
        scrollDownBtn.style.display = 'none'; 
        toggleScrollDownButton(); 
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
                { role: "system", content: settings['system-prompt'] },
                ...chatHistory,
                { role: "user", content: [] }
            ];
    
            if (userMessage !== '') {
                messages[messages.length - 1].content.push({ type: "text", text: userMessage });
            }
    
            if (imageDataUrls.length > 0) {
                messages[messages.length - 1].content.push({ type: "text", text: userMessage });
                imageDataUrls.forEach(dataUrl => {
                    messages[messages.length - 1].content.push({
                        type: "image_url",
                        image_url: { url: dataUrl }
                    });
                });
            }
    
            chatHistory.push({ role: "user", content: messages[messages.length - 1].content });
    
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
});