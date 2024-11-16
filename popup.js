document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const languageSelect = document.getElementById('language');
    const saveButton = document.getElementById('save');
    const statusMessage = document.getElementById('statusMessage');

    // Load saved settings
    chrome.storage.local.get(['apiKey', 'language'], function(result) {
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }
        if (result.language) {
            languageSelect.value = result.language;
        }
    });

    // Save settings
    saveButton.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        const language = languageSelect.value;

        // Simple validation
        if (!apiKey.startsWith('sk-')) {
            showMessage('Please enter a valid OpenAI API key.', 'error');
            return;
        }

        chrome.storage.local.set({ apiKey: apiKey, language: language }, function() {
            showMessage('Settings saved successfully!', 'success');
        });
    });

    function showMessage(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `message ${type}`;
        statusMessage.style.display = 'block';
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
});
