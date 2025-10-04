// ########################################################
// Internationalization (i18n) Setup
// ########################################################

// The active locale
let locale = "en";

const translations = {
    // English translations
    "en": {
        "app-title": "Illumination",
        "player-1": "Player 1",
        "player-2": "Player 2",
        "player-3": "Player 3",
        "player-4": "Player 4",
    },
    // German translations
    "de": {
        "app-title": "Illumination",
        "player-1": "Spieler 1",
        "player-2": "Spieler 2",
        "player-3": "Spieler 3",
        "player-4": "Spieler 4",
    },
};
// Translate all elements with a data-i18n-key attribute
function translateElement(element) {
    const key = element.getAttribute("data-i18n-key");
    const translation = translations[locale][key];
    element.innerText = translation;
}

// Function to change the locale and re-translate the page
function setLocale(newLocale) {
    if (translations[newLocale]) {
        locale = newLocale;
        document
        .querySelectorAll("[data-i18n-key]")
        .forEach(translateElement);
    } else {
        console.warn(`Locale ${newLocale} not found.`);
    }
}

// Example: Change locale based on URL parameter (e.g., ?lang=de)
function loadLocaleFromURL() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const lang = urlParams.get('lang');
    if (lang) {
        setLocale(lang);
        document.getElementById("locale-select").value = lang;
    }
}

// ########################################################
// Theme (dark/light) management
// ########################################################

const THEME_KEY = 'lumini-theme'; // 'dark' | 'light' | 'system'

function applyThemeChoice(choice) {
    const darkLink = document.getElementById('dark-theme');
    const lightLink = document.getElementById('light-theme');

    if (!darkLink || !lightLink) return;

    if (choice === 'dark') {
        darkLink.removeAttribute('disabled');
        lightLink.setAttribute('disabled', '');
        // reflect in checkbox
        const cb = document.getElementById('theme-toggle-checkbox');
        if (cb) cb.checked = true;
    } else if (choice === 'light') {
        lightLink.removeAttribute('disabled');
        darkLink.setAttribute('disabled', '');
        const cb = document.getElementById('theme-toggle-checkbox');
        if (cb) cb.checked = false;
    } else {
        // system preference
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            darkLink.removeAttribute('disabled');
            lightLink.setAttribute('disabled', '');
            const cb = document.getElementById('theme-toggle-checkbox');
            if (cb) cb.checked = true;
        } else {
            lightLink.removeAttribute('disabled');
            darkLink.setAttribute('disabled', '');
            const cb = document.getElementById('theme-toggle-checkbox');
            if (cb) cb.checked = false;
        }
    }
}

function setTheme(theme) {
    if (!['dark','light','system'].includes(theme)) theme = 'system';
    localStorage.setItem(THEME_KEY, theme);
    applyThemeChoice(theme);
    const select = document.getElementById('theme-select');
    // update checkbox (if present) handled inside applyThemeChoice
}

function loadThemeFromStorage() {
    const saved = localStorage.getItem(THEME_KEY) || 'system';
    const cb = document.getElementById('theme-toggle-checkbox');
    if (saved === 'system') {
        if (cb) cb.checked = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
        if (cb) cb.checked = (saved === 'dark');
    }
    applyThemeChoice(saved);
}

// Called when user toggles the checkbox
function onThemeToggleChange() {
    const cb = document.getElementById('theme-toggle-checkbox');
    if (!cb) return;
    setTheme(cb.checked ? 'dark' : 'light');
}

// Listen for system preference changes when in 'system' mode
if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener && mq.addEventListener('change', () => {
        const saved = localStorage.getItem(THEME_KEY) || 'system';
        if (saved === 'system') applyThemeChoice('system');
    });
}

// Ensure theme is loaded on script initialization (index.html body onload will also call loadLocaleFromURL)
window.addEventListener('DOMContentLoaded', () => {
    loadThemeFromStorage();
});

// Wire up UI listeners once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    // Locale select
    const localeSelect = document.getElementById('locale-select');
    if (localeSelect) {
        localeSelect.addEventListener('change', (e) => setLocale(e.target.value));
    }

    // Theme checkbox
    const themeCheckbox = document.getElementById('theme-toggle-checkbox');
    if (themeCheckbox) {
        themeCheckbox.addEventListener('change', () => onThemeToggleChange());
    }

    // load locale from URL (previously inline onload)
    loadLocaleFromURL();
});

// Expose functions used by inline handlers to the global scope
window.setTheme = setTheme;
window.onThemeToggleChange = onThemeToggleChange;
window.loadThemeFromStorage = loadThemeFromStorage;
window.applyThemeChoice = applyThemeChoice;
window.setLocale = setLocale;
window.loadLocaleFromURL = loadLocaleFromURL;