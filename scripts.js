document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const toggleButton = document.getElementById('toggle-sidebar');
  const newChatButton = document.getElementById('new-chat');
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
    if (sender === 'user') {
      messageElement.innerHTML = content;
    } else {
      messageElement.textContent = content;
    }
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageElement;
  }

  async function sendMessage() {
    const userMessage = chatInput.value.trim();
    if (userMessage === '') return;

    const isShiftPressed = event.shiftKey;

    const formattedUserMessage = isShiftPressed ? userMessage + '\n' : userMessage.replace(/\n/g, '<br>');

    displayMessage(formattedUserMessage, 'user');

    if (!isShiftPressed) {
      chatInput.value = '';
    }

    const settings = JSON.parse(localStorage.getItem('settings')) || defaultSettings;

    const aiMessageElement = displayMessage('', 'ai');

    try {
      const response = await fetch(settings['api-host'] + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings['api-key']}`
        },
        body: JSON.stringify({
          model: settings['model'],
          messages: [{ role: 'user', content: userMessage }],
          stream: true,
          temperature: parseFloat(settings['temperature']),
          top_p: parseFloat(settings['top-p']),
          presence_penalty: parseFloat(settings['presence-penalty']),
          frequency_penalty: parseFloat(settings['frequency-penalty'])
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmedLine = line.replace(/^data: /, '').trim();
          if (trimmedLine === '' || trimmedLine === '[DONE]') continue;

          try {
            const parsedLine = JSON.parse(trimmedLine);
            const content = parsedLine.choices[0].delta.content;
            if (content) {
              const formattedAiResponse = content.replace(/\n/g, '<br>');
              aiResponse += formattedAiResponse;
              aiMessageElement.innerHTML = aiResponse;
            }
          } catch (error) {
            console.warn('Error parsing JSON:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      aiMessageElement.textContent = 'An error occurred while processing your request.';
    }
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

  populateModelDropdown(openAIModels);
});