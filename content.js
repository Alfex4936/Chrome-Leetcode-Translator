(async function() {
    // Function to get the user's API key and language
    function getSettings() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['apiKey', 'language'], function(result) {
                resolve({
                    apiKey: result.apiKey,
                    language: result.language || 'ko' // default to Korean if not set
                });
            });
        });
    }

    // Function to add the Translate button
    function addTranslateButton(languageName) {
        // Verify if the button already exists to prevent duplicates
        if (document.getElementById('translate-button')) {
            return document.getElementById('translate-button');
        }

        const titleElement = document.querySelector('.text-title-large');

        if (!titleElement) {
            console.error('Could not find the problem title.');
            return;
        }

        // Create the parent div with display: flex
        const parentDiv = document.createElement('div');
        parentDiv.style.display = 'flex';

        // Create the Translate button
        const translateButton = document.createElement('button');
        translateButton.id = 'translate-button'; // Assign an ID for easy ref
        // translateButton.textContent = `Translate to ${languageName}`;
        translateButton.textContent = languageName;
        Object.assign(translateButton.style, {
            padding: '5px 10px',
            color: 'rgb(12, 179, 69)',
            background: 'transparent',
            borderRadius: '12px',
            border: '1px solid rgb(12, 179, 69)',
            fontSize: '14px',
            cursor: 'pointer',
            textAlign: 'center',
            marginLeft: '1rem',
        });

        // Append the button to the parent div
        parentDiv.appendChild(translateButton);

        // Append the parent div to titleElement's parent
        titleElement.parentNode.appendChild(parentDiv);

        return translateButton;
    }

    // Function to perform the translation
    async function performTranslation(apiKey, language) {
        // Extract the problem description
        const descriptionElement = document.querySelector('div[data-track-load="description_content"]');

        if (!descriptionElement) {
            console.error('Could not find the problem description.');
            alert('Problem description not found.');
            return;
        }

        const descriptionHTML = descriptionElement.innerHTML;

        // GPT prompt
        const prompt = `Translate the following LeetCode problem description into ${getLanguageName(language)}. Keep all code snippets, mathematical formulas, and other formatting intact. Do not translate code snippets, variable names, or mathematical expressions. Only translate the human-readable text.

${descriptionHTML}`;

        // OpenAI API
        const translatedText = await translateText(apiKey, prompt, language);

        if (translatedText) {
            // Insert the translated text into the page
            const translatedElement = document.createElement('div');
            translatedElement.innerHTML = translatedText;
            translatedElement.style.border = '2px solid #ddd';
            translatedElement.style.padding = '10px';
            translatedElement.style.marginBottom = '20px';

            // Insert before the original description
            descriptionElement.parentNode.insertBefore(translatedElement, descriptionElement);

            // Insert a language label
            const template = getTranslatedSentenceTemplate(language);
            const labelElement = document.createElement('h2');
            labelElement.textContent = template.replace('{language}', getLanguageNativeName(language));
            descriptionElement.parentNode.insertBefore(labelElement, translatedElement);
        }
    }

    // Function to get the language name in English
    function getLanguageName(code) {
        const languages = {
            'ko': 'Korean',
            'fr': 'French',
            'es': 'Spanish',
            'ru': 'Russian',
            'zh': 'Chinese',
            'ja': 'Japanese'
        };
        return languages[code] || 'Korean';
    }

    // Function to get the language name in native language
    function getLanguageNativeName(code) {
        const languages = {
            'ko': '한국어',
            'fr': 'Français',
            'es': 'Español',
            'ru': 'Русский',
            'zh': '中文',
            'ja': '日本語'
        };
        return languages[code] || '한국어';
    }

    function getTranslatedSentenceTemplate(code) {
        const templates = {
            'ko': '🇰🇷 번역된 문제 설명 ({language})',
            'fr': '🇫🇷 Description du problème traduite ({language})',
            'es': '🇪🇸 Descripción del problema traducida ({language})',
            'ru': '🇷🇺 Переведенное описание задачи ({language})',
            'zh': '🇨🇳 翻译的问题描述（{language}）',
            'ja': '🇯🇵 翻訳された問題の説明（{language}）',
            'en': '🇺🇸 Translated Problem Description ({language})' // Fallback to English
        };
        return templates[code] || templates['en'];
    }

    function getTranslatingText(code) {
        const translations = {
            'ko': '번역 중...',
            'fr': 'Traduction en cours...',
            'es': 'Traduciendo...',
            'ru': 'Перевод...',
            'zh': '翻译中...',
            'ja': '翻訳中...',
            'en': 'Translating...' // Fallback to English
        };
        return translations[code] || translations['en'];
    }

    // Function to call the OpenAI API
    async function translateText(apiKey, prompt, language) {
        const url = 'https://api.openai.com/v1/chat/completions';

        const data = {
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful assistant that translates English HTML content into ${getLanguageName(language)} while keeping the HTML structure, code snippets, images, mathematical formulas, and other formatting intact. Do not translate code snippets, variables, or mathematical expressions. Only translate the human-readable text.`
                },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                const translatedText = result.choices[0].message.content;
                return translatedText;
            } else {
                console.error('OpenAI API error:', result);
                alert('Error from OpenAI API: ' + result.error.message);
                return null;
            }
        } catch (error) {
            console.error('Error calling OpenAI API:', error);
            alert('Error calling OpenAI API: ' + error.message);
            return null;
        }
    }

    // Main execution with MutationObserver
    async function initializeExtension() {
        const { apiKey, language } = await getSettings();

        if (!apiKey) {
            console.error('OpenAI API key is not set. Please set it in the extension options.');
            alert('OpenAI API key is not set. Please set it in the extension options.');
            return;
        }

        const languageName = getLanguageNativeName(language);

        // Use MutationObserver to detect when the necessary elements are available
        const observer = new MutationObserver((mutations, obs) => {
            const titleElement = document.querySelector('.text-title-large');
            const descriptionElement = document.querySelector('div[data-track-load="description_content"]');

            if (titleElement && descriptionElement) {
                // Elements are available, add the Translate button
                const translateButton = addTranslateButton(languageName);

                if (translateButton) {
                    translateButton.addEventListener('click', async function() {
                        translateButton.disabled = true;
                        translateButton.textContent = getTranslatingText(language); // Use translated text
                        await performTranslation(apiKey, language);
                        // translateButton.textContent = `Translate to ${languageName}`;
                        translateButton.textContent = languageName;
                        translateButton.disabled = false;
                    });
                }

                // Once the button is added, disconnect the observer
                obs.disconnect();
                return;
            }
        });

        // Start observing the body for changes
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Execute the initialization
    initializeExtension();

})();
