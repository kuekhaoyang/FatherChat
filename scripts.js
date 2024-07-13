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
  
    const defaultSettings = {
        'model-provider': 'openai',
        'api-key': '',
        'api-host': 'https://api.openai.com/v1',
        'model': 'gpt-4o',
        'temperature': 0.7,
        'top-p': 1.0,
        'presence-penalty': 0.0,
        'frequency-penalty': 0.0
    };
  
    const openAIModels = [
        'gpt-4o', 'gpt-4o-2024-05-13', 'gpt-4-turbo', 'gpt-4-turbo-2024-04-09',
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
  
    let uploadedFiles = [];

    function startNewChat() {
        chatMessages.innerHTML = '';
        chatInput.value = '';
        fileContainer.innerHTML = '';
        fileContainer.style.display = 'none';
        uploadedFiles = [];
        chatHistory = []; 
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
                    }
                    element.value = settings[key];
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
  
    function restoreDefaults() {
        for (const key in defaultSettings) {
            if (defaultSettings.hasOwnProperty(key)) {
                const element = settingsForm.elements[key];
                if (element) {
                    element.value = defaultSettings[key];
                }
            }
        }
        modelProviderSelect.dispatchEvent(new Event('change'));
    }
  
    function closeSettings() {
        settingsPage.classList.remove('open');
        dimBackground.classList.remove('active');
    }
  
    function displayMessage(content, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        
        if (sender === 'ai') {
            const renderedContent = marked.parse(content);
            messageElement.innerHTML = renderedContent;

            messageElement.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });

            MathJax.typesetPromise([messageElement]).catch((err) => console.error(err.message));
        } else {
            messageElement.innerHTML = content;
        }
        
        chatMessages.appendChild(messageElement);
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
    }, 100);

    let chatHistory = [];

    async function sendMessage() {
        const userMessage = chatInput.value.trim();
        if (userMessage === '' && uploadedFiles.length === 0) return;
    
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
    
        displayMessage(messageContent.innerHTML, 'user');
    
        chatInput.value = '';
        fileContainer.innerHTML = '';
        fileContainer.style.display = 'none';
        uploadedFiles = [];
    
        const settings = JSON.parse(localStorage.getItem('settings')) || defaultSettings;
    
        const aiMessageElement = displayMessage('', 'ai');
    
        try {
            const messages = [
                { role: "system", content: "You are a helpful assistant." },
                ...chatHistory,
                { role: "user", content: [] }
            ];
    
            if (userMessage !== '') {
                messages[messages.length - 1].content.push({ type: "text", text: userMessage });
            }
    
            if (imageDataUrls.length > 0) {
                messages[messages.length - 1].content.push({ type: "text", text: "I'm sending you some images. Please analyze them." });
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
                                aiResponse += content;
                                const renderedContent = marked.parse(aiResponse);
                                aiMessageElement.innerHTML = renderedContent;
    
                                debouncedRender(aiMessageElement);
                            }
                        } catch (error) {
                            console.warn('Failed to parse JSON:', jsonLine, error);
                        }
                    }
                }
            }
    
            chatHistory.push({ role: "assistant", content: aiResponse });

            MathJax.typesetPromise([aiMessageElement]).catch((err) => console.error(err.message));
    
        } catch (error) {
            console.error('Error:', error);
            aiMessageElement.textContent = 'An error occurred while processing your request.';
        }
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