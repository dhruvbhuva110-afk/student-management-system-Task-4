/**
 * Language & Translation Management
 */

document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
});

function initLanguage() {
    const savedLang = localStorage.getItem('appLanguage') || 'en';
    applyLanguage(savedLang);

    // Update settings dropdown if it exists
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) {
        langSelect.value = savedLang;

        // Listen for save button action in settings
        const saveBtn = document.getElementById('saveSettingsBtn'); // We need to add this ID to settings.html
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const newLang = langSelect.value;
                setLanguage(newLang);
                showToast('Settings saved & Language updated!', 'success');
            });
        }
    }
}

function setLanguage(langCode) {
    localStorage.setItem('appLanguage', langCode);
    applyLanguage(langCode);
}

function applyLanguage(langCode) {
    const texts = translations[langCode] || translations['en'];

    // Find all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (texts[key]) {
            // Handle input placeholders specifically
            if (element.tagName === 'INPUT' && element.getAttribute('placeholder')) {
                element.placeholder = texts[key];
            } else {
                element.textContent = texts[key];
            }
        }
    });

    // Update HTML lang attribute
    document.documentElement.lang = langCode;
}
