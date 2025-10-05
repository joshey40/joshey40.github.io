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

// ########################################################
// Summing up points
// ########################################################
function onPointsInputChange() {
    const pointsInputs = document.querySelectorAll('.points-input');
    const numPlayers = 4;
    const categories = ['orange', 'blue', 'green', 'yellow', 'red', 'low_water', 'mid_water', 'high_water'];
    let allPoints = [];
    for (let i = 0; i < numPlayers; i++) {
        allPoints[i] = {};
        categories.forEach(cat => allPoints[i][cat] = 0);
    }
    console.log(allPoints);

    pointsInputs.forEach(input => {
        const id = input.id;
        const playerIndex = id.charAt(id.length - 1) - 1; // Get player index from input ID
        const category = id.slice(2); // Get category from input ID by removing "x_"
        const value = parseInt(input.value);
        console.log(`Player ${playerIndex + 1}, Category: ${category}, Value: ${value}`);
        allPoints[playerIndex][category] = isNaN(value) ? 0 : value;
    });

    // Calculate and update totals and bonuses (the player with the highest points in each water category gets a bonus of +2 and if there's a tie, all tied players get +1)
    let totals = [];
    categories.forEach(cat => {
        let maxPoints = Math.max(...allPoints.map(p => p[cat]));
        let numWithMax = allPoints.filter(p => p[cat] === maxPoints && maxPoints > 0).length;

        allPoints.forEach(p => {
            if (p[cat] === maxPoints) {
                p.bonus = 2;
            } else if (numWithMax > 1 && p[cat] === maxPoints - 1) {
                p.bonus = 1;
            }
        });
    });
    for (let i = 0; i < numPlayers; i++) {
        let total = 0;
        categories.forEach(cat => {
            total += allPoints[i][cat] + (allPoints[i].bonus || 0);
        });
        totals[i] = total;
    }
    // Update the total and bonus display
    for (let i = 0; i < numPlayers; i++) {
        document.getElementById(`${i+1}_total`).innerText = totals[i];
        categories.forEach(cat => {
            const bonus = allPoints[i].bonus || 0;
            document.getElementById(`${i+1}_${cat}_bonus`).innerText = bonus > 0 ? `+${bonus}` : '+0';
        });
    }
}

// ########################################################
// Initialization and Event Listeners
// ########################################################

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

    const pointsInputs = document.querySelectorAll('.points-input');
    pointsInputs.forEach(input => {
        input.addEventListener('input', () => {
            onPointsInputChange();
        });
    });

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