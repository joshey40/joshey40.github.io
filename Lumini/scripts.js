// ########################################################
// Internationalization (i18n) Setup
// ########################################################

// The active locale
let locale = "en";

const translations = {
  // English translations
  "en": {
    "app-title": "Lumini",
    "player-1": "Player 1",
    "player-2": "Player 2",
    "player-3": "Player 3",
    "player-4": "Player 4",
  },
  // German translations
  "de": {
    "app-title": "Lumini",
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

// Initial translation on page load
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const lang = urlParams.get('lang');
if (lang) {
  setLocale(lang);
}