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
  
    const openAIModels = [
        'gpt-4o-mini-2024-07-18', 'gpt-4o-mini', 'gpt-4o', 'gpt-4o-2024-05-13', 'gpt-4-turbo', 'gpt-4-turbo-2024-04-09',
        'gpt-4-turbo-preview', 'gpt-4-0125-preview', 'gpt-4-1106-preview', 'gpt-4-vision-preview',
        'gpt-4-1106-vision-preview', 'gpt-4', 'gpt-4-0613', 'gpt-4-32k', 'gpt-4-32k-0613',
        'gpt-3.5-turbo-0125', 'gpt-3.5-turbo', 'gpt-3.5-turbo-1106', 'gpt-3.5-turbo-instruct',
        'gpt-3.5-turbo-16k', 'gpt-3.5-turbo-0613', 'gpt-3.5-turbo-16k-0613'
    ];
  
    const groqModels = [
        'llama-3.1-405b-reasoning', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant',
        'llama3-groq-70b-8192-tool-use-preview', 'llama3-groq-8b-8192-tool-use-preview',
        'llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it', 'gemma2-9b-it'
    ];
  
    const togetherAIModels = [
        'Nexusflow/NexusRaven-V2-13B', 'bert-base-uncased', 'WizardLM/WizardLM-13B-V1.2',
        'codellama/CodeLlama-34b-Instruct-hf', 'google/gemma-7b', 'upstage/SOLAR-10.7B-Instruct-v1.0',
        'zero-one-ai/Yi-34B', 'togethercomputer/StripedHyena-Hessian-7B', 'teknium/OpenHermes-2-Mistral-7B',
        'mistralai/Mixtral-8x7B-v0.1', 'WhereIsAI/UAE-Large-V1', 'hazyresearch/M2-BERT-2k-Retrieval-Encoder-V1',
        'togethercomputer/Llama-2-7B-32K-Instruct', 'Undi95/ReMM-SLERP-L2-13B', 'meta-llama/Meta-Llama-Guard-3-8B',
        'Undi95/Toppy-M-7B', 'Phind/Phind-CodeLlama-34B-v2', 'stabilityai/stable-diffusion-2-1',
        'openchat/openchat-3.5-1210', 'Austism/chronos-hermes-13b', 'microsoft/phi-2',
        'Qwen/Qwen1.5-0.5B', 'Qwen/Qwen1.5-1.8B', 'Qwen/Qwen1.5-4B', 'Qwen/Qwen1.5-7B',
        'togethercomputer/m2-bert-80M-32k-retrieval', 'snorkelai/Snorkel-Mistral-PairRM-DPO',
        'Qwen/Qwen1.5-7B-Chat', 'Qwen/Qwen1.5-14B', 'Qwen/Qwen1.5-14B-Chat', 'Qwen/Qwen1.5-72B',
        'Qwen/Qwen1.5-1.8B-Chat', 'BAAI/bge-base-en-v1.5', 'Snowflake/snowflake-arctic-instruct',
        'codellama/CodeLlama-13b-Python-hf', 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-SFT',
        'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO', 'togethercomputer/m2-bert-80M-2k-retrieval',
        'deepseek-ai/deepseek-coder-33b-instruct', 'codellama/CodeLlama-34b-Python-hf',
        'NousResearch/Nous-Hermes-Llama2-13b', 'lmsys/vicuna-13b-v1.5', 'Qwen/Qwen1.5-0.5B-Chat',
        'codellama/CodeLlama-70b-Python-hf', 'codellama/CodeLlama-7b-Instruct-hf',
        'NousResearch/Nous-Hermes-2-Yi-34B', 'codellama/CodeLlama-13b-Instruct-hf',
        'BAAI/bge-large-en-v1.5', 'togethercomputer/Llama-2-7B-32K-Instruct',
        'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', 'teknium/OpenHermes-2p5-Mistral-7B',
        'NousResearch/Nous-Capybara-7B-V1p9', 'WizardLM/WizardCoder-Python-34B-V1.0',
        'NousResearch/Nous-Hermes-2-Mistral-7B-DPO', 'togethercomputer/StripedHyena-Nous-7B',
        'togethercomputer/alpaca-7b', 'garage-bAInd/Platypus2-70B-instruct', 'google/gemma-2b',
        'google/gemma-2b-it', 'google/gemma-7b-it', 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        'allenai/OLMo-7B', 'allenai/OLMo-7B-Twin-2T', 'allenai/OLMo-7B-Instruct',
        'Qwen/Qwen1.5-4B-Chat', 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        'stabilityai/stable-diffusion-xl-base-1.0', 'Gryphe/MythoMax-L2-13b',
        'meta-llama/Llama-3-70b-chat-hf', 'meta-llama/LlamaGuard-2-8b',
        'mistralai/Mistral-7B-Instruct-v0.1', 'mistralai/Mistral-7B-Instruct-v0.2',
        'mistralai/Mistral-7B-v0.1', 'Open-Orca/Mistral-7B-OpenOrca', 'Qwen/Qwen1.5-32B',
        'NousResearch/Nous-Hermes-llama-2-7b', 'Qwen/Qwen1.5-32B-Chat', 'mistralai/Mixtral-8x22B',
        'Qwen/Qwen2-72B-Instruct', 'Qwen/Qwen1.5-72B-Chat', 'meta-llama/Meta-Llama-3-70B',
        'meta-llama/Llama-3-8b-hf', 'deepseek-ai/deepseek-llm-67b-chat',
        'sentence-transformers/msmarco-bert-base-dot-v5', 'zero-one-ai/Yi-6B',
        'lmsys/vicuna-7b-v1.5', 'togethercomputer/m2-bert-80M-8k-retrieval',
        'meta-llama/Meta-Llama-3-8B', 'microsoft/WizardLM-2-8x22B',
        'togethercomputer/Llama-3-8b-chat-hf-int8', 'wavymulder/Analog-Diffusion',
        'mistralai/Mistral-7B-Instruct-v0.3', 'Qwen/Qwen1.5-110B-Chat',
        'runwayml/stable-diffusion-v1-5', 'prompthero/openjourney', 'meta-llama/Llama-2-7b-hf',
        'SG161222/Realistic_Vision_V3.0_VAE', 'meta-llama/Llama-2-13b-chat-hf',
        'google/gemma-2-27b-it', 'zero-one-ai/Yi-34B-Chat', 'meta-llama/Meta-Llama-3-70B-Instruct-Turbo',
        'meta-llama/Meta-Llama-3-70B-Instruct-Lite', 'google/gemma-2-9b-it', 'google/gemma-2-9b',
        'meta-llama/Llama-3-8b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        'codellama/CodeLlama-70b-hf', 'togethercomputer/LLaMA-2-7B-32K', 'databricks/dbrx-instruct',
        'meta-llama/Meta-Llama-3.1-8B-Instruct-Reference', 'meta-llama/Meta-Llama-3-8B-Instruct-Turbo',
        'cognitivecomputations/dolphin-2.5-mixtral-8x7b', 'mistralai/Mixtral-8x22B-Instruct-v0.1',
        'togethercomputer/evo-1-131k-base', 'meta-llama/Llama-2-70b-hf', 'codellama/CodeLlama-70b-Instruct-hf',
        'meta-llama/Meta-Llama-3-8B-Instruct-Lite', 'togethercomputer/evo-1-8k-base',
        'meta-llama/Llama-2-7b-chat-hf', 'meta-llama/Llama-2-70b-chat-hf', 'codellama/CodeLlama-7b-Python-hf',
        'Meta-Llama/Llama-Guard-7b', 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
        'togethercomputer/Koala-7B', 'Qwen/Qwen2-1.5B-Instruct', 'Qwen/Qwen2-7B-Instruct',
        'NousResearch/Nous-Hermes-13b', 'togethercomputer/guanaco-65b', 'togethercomputer/llama-2-7b',
        'huggyllama/llama-7b', 'lmsys/vicuna-7b-v1.3', 'Qwen/Qwen2-72B', 'Phind/Phind-CodeLlama-34B-Python-v1',
        'NumbersStation/nsql-llama-2-7B', 'NousResearch/Nous-Hermes-Llama2-70b', 'WizardLM/WizardLM-70B-V1.0',
        'huggyllama/llama-65b', 'lmsys/vicuna-13b-v1.5-16k', 'HuggingFaceH4/zephyr-7b-beta',
        'togethercomputer/llama-2-13b', 'togethercomputer/CodeLlama-7b-Instruct', 'togethercomputer/guanaco-13b',
        'togethercomputer/CodeLlama-34b-Python', 'togethercomputer/CodeLlama-34b-Instruct',
        'togethercomputer/CodeLlama-34b', 'togethercomputer/llama-2-70b', 'codellama/CodeLlama-13b-hf',
        'Qwen/Qwen2-7B', 'Qwen/Qwen2-1.5B', 'togethercomputer/CodeLlama-13b-Instruct',
        'togethercomputer/llama-2-13b-chat', 'lmsys/vicuna-13b-v1.3', 'huggyllama/llama-13b',
        'huggyllama/llama-30b', 'togethercomputer/guanaco-33b', 'togethercomputer/Koala-13B',
        'togethercomputer/llama-2-7b-chat', 'togethercomputer/SOLAR-10.7B-Instruct-v1.0-int4',
        'togethercomputer/guanaco-7b', 'EleutherAI/llemma_7b', 'meta-llama/Meta-Llama-3-8B-Instruct',
        'codellama/CodeLlama-34b-hf', 'meta-llama/Meta-Llama-3-70B-Instruct', 'meta-llama/Llama-3-70b-hf',
        'togethercomputer/CodeLlama-7b-Python', 'NousResearch/Hermes-2-Theta-Llama-3-70B',
        'carson/ml318bit', 'togethercomputer/CodeLlama-13b-Python', 'codellama/CodeLlama-7b-hf',
        'togethercomputer/llama-2-70b-chat', 'carson/ml31405bit', 'carson/ml3170bit',
        'carson/mlg38b', 'carson/ml318br', 'meta-llama/Meta-Llama-3.1-8B-Reference',
        'gradientai/Llama-3-70B-Instruct-Gradient-1048k', 'meta-llama/Meta-Llama-3.1-70B-Instruct-Reference'
    ];
  
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
        
        const isLargeScreen = window.innerWidth > 768; 
        
        filteredHistories.forEach(history => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.setAttribute('data-id', history.id);
            if (history.id === currentHistoryId) {
                historyItem.classList.add('active');
            }

            const historyItemText = document.createElement('span');
            historyItemText.classList.add('history-item-text');
            
            if (isLargeScreen) {
                historyItemText.textContent = history.title.length > 15 
                    ? history.title.substring(0, 15) + '...' 
                    : history.title;
            } else {
                historyItemText.textContent = history.title.length > 1 
                    ? history.title.substring(0, 1) + '...' 
                    : history.title;
            }
            
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
        const currentTitle = historyItemText.textContent;

        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.value = currentTitle;
        inputElement.className = 'history-item-edit-input';

        historyItemText.innerHTML = '';
        historyItemText.appendChild(inputElement);
        inputElement.focus();

        inputElement.addEventListener('blur', finishEditing);
        inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishEditing();
            } else if (e.key === 'Escape') {
                cancelEditing();
            }
        });

        function finishEditing() {
            const newTitle = inputElement.value.trim();
            if (newTitle !== '' && newTitle !== currentTitle) {
                const history = histories.find(h => h.id === historyId);
                if (history) {
                    history.title = newTitle;
                    historyItemText.textContent = newTitle;
                    updateHistoryList();
                    saveHistoriesToLocalStorage();
                }
            } else {
                cancelEditing();
            }
        }

        function cancelEditing() {
            historyItemText.textContent = currentTitle;
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
        } else if (event.target.value === 'together') {
            apiHostInput.value = 'https://api.together.xyz/v1';
            populateModelDropdown(togetherAIModels);
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