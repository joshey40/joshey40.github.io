import {generatecard} from '../scripts/cardDesign.js';

let imagesBase64 = {
    mainImage: null,
    frameImage: null,
    frameBreakImage: null,
    titleImage: null,
    effectImage: null,
};

// AbortController für Abbruch von vorherigen Aufrufen
let abortController = null;

async function updateResult() {
    // Vorherigen Aufruf abbrechen, falls vorhanden
    if (abortController) {
        abortController.abort();
    }

    // Neuen AbortController erstellen
    abortController = new AbortController();
    const signal = abortController.signal;

    try {
        const name = document.getElementById('name').value;
        const colorName = document.getElementById('nameColor').value;
        const nameZoom = 1 + ((document.getElementById('nameZoom').value - 100) / 100);
        const cost = document.getElementById('cost').value;
        const power = document.getElementById('power').value;
        const description = document.getElementById('description').value;
        const zoom = 1 + (document.getElementById('imageZoom').value / 100);
        const transparentBg = document.getElementById('transparentBg').checked;
        const backgroundColor = transparentBg === false ? 'transparent' : document.getElementById('backgroundColor').value;

        // Update the card (hier wird das Signal weitergegeben)
        const canvas = await generatecard(name, colorName, cost, power, description, 1024, imagesBase64, zoom, nameZoom, backgroundColor, signal);

        // Wenn der Aufruf abgebrochen wurde, nichts weiter tun
        if (signal.aborted) return;

        // Update the card image
        const cardImage = document.getElementById('cardImage');
        cardImage.src = canvas.toDataURL();
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('UpdateResult wurde abgebrochen.');
        } else {
            console.error('Fehler beim Aktualisieren der Karte:', error);
        }
    }
}

function mainImageChange(event) {
    const imageFile = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = function (e) {
        const base64 = e.target.result;
        imagesBase64.mainImage = base64;
        updateResult();
    };
}

function frameBreakImageChange(event) {
    const imageFile = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = function (e) {
        const base64 = e.target.result;
        imagesBase64.frameBreakImage = base64;
        updateResult();
    };
}

function titleImageChange(event) {
    const imageFile = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = function (e) {
        const base64 = e.target.result;
        imagesBase64.titleImage = base64;
        updateResult();
    };
}

async function clearMainImage() {
    imagesBase64.mainImage = null;
    updateResult();
}

function clearFrameBreakImage() {
    imagesBase64.frameBreakImage = null;
    updateResult();
}

function clearTitleImage() {
    imagesBase64.titleImage = null;
    updateResult();
}


function selectFrame() {
    const frameSelectPopup = document.getElementById('frameSelectPopup');
    frameSelectPopup.style.visibility = 'visible';
    frameSelectPopup.style.opacity = '1';
}

function closeFrameSelectPopup() {
    const frameSelectPopup = document.getElementById('frameSelectPopup');
    frameSelectPopup.style.opacity = '0';
    frameSelectPopup.style.visibility = 'hidden';
}

function selectEffect() {
    const effectSelectPopup = document.getElementById('effectSelectPopup');
    effectSelectPopup.style.visibility = 'visible';
    effectSelectPopup.style.opacity = '1';
}

function closeEffectSelectPopup() {
    const effectSelectPopup = document.getElementById('effectSelectPopup');
    effectSelectPopup.style.opacity = '0';
    effectSelectPopup.style.visibility = 'hidden';
}

function clearEffect() {
    imagesBase64.effectImage = null;
    updateResult();
}

function clearBackground() {
    const backgroundColor = document.getElementById('backgroundColor');
    backgroundColor.value = '#10072b';
    const transparentBg = document.getElementById('transparentBg');
    transparentBg.checked = false;
}

function downloadCard() {
    const cardImage = document.getElementById('cardImage');
    const name = document.getElementById('name').value;
    const link = document.createElement('a');
    link.href = cardImage.src;
    if (!name) {
        link.download = 'custom_card.png';
    } else {
        link.download = `${name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    }
    link.click();
}

// Attach to the global window object
window.updateResult = updateResult;
window.mainImageChange = mainImageChange;
window.frameBreakImageChange = frameBreakImageChange;
window.titleImageChange = titleImageChange;
window.clearMainImage = clearMainImage;
window.clearFrameBreakImage = clearFrameBreakImage;
window.clearTitleImage = clearTitleImage;
window.selectFrame = selectFrame;
window.closeFrameSelectPopup = closeFrameSelectPopup;
window.selectEffect = selectEffect;
window.closeEffectSelectPopup = closeEffectSelectPopup;
window.clearEffect = clearEffect;
window.clearBackground = clearBackground;
window.downloadCard = downloadCard;

export { updateResult, mainImageChange, frameBreakImageChange, titleImageChange, clearMainImage, clearFrameBreakImage, clearTitleImage, selectFrame, closeFrameSelectPopup, selectEffect, closeEffectSelectPopup, clearEffect, clearBackground, downloadCard };



// Add Frames to frameSelectPopup
const frameSelectDiv = document.getElementById('frameSelectDiv');
const frameDir = '../res/img/frames/';
const frameCategories = { 'basic': 'Basic', 'cosmic': 'Cosmic', 'neon': 'Neon', 'metallic': 'Metallic' };
const frames = {
    'basic': ['common', 'uncommon', 'rare', 'epic', 'legendary', 'ultra', 'infinite'],
    'cosmic': ['black', 'blue', 'green', 'red', 'pink', 'yellow', 'orange'],
    'neon': ['blue', 'green', 'red', 'purple', 'yellow', 'white'],
    'metallic': ['copper', 'gold', 'silver']
};

for (const category in frameCategories) {
    const categoryTitleDividerDiv = document.createElement('div');
    categoryTitleDividerDiv.style.flex = '1 1 auto';
    const categoryTitle = document.createElement('h2');
    categoryTitle.textContent = frameCategories[category];
    categoryTitleDividerDiv.appendChild(categoryTitle);
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'frame-category';
    categoryTitleDividerDiv.appendChild(categoryDiv);
    frameSelectDiv.appendChild(categoryTitleDividerDiv);

    const categoryFrames = frames[category];
    for (const frame of categoryFrames) {
        const frameImg = document.createElement('img');
        frameImg.src = `${frameDir}${category}/${frame}.png`;
        frameImg.alt = `${category} ${frame}`;
        frameImg.className = 'frame-image';
        frameImg.addEventListener('click', () => {
            imagesBase64.frameImage = `${frameDir}${category}/${frame}.png`;
            updateResult();
            closeFrameSelectPopup();
        });
        categoryDiv.appendChild(frameImg);
    }
}

// Add Effects to effectSelectPopup
const effectSelectDiv = document.getElementById('effectSelectDiv');
const effectDir = '../res/img/effects/';
const effectCategories = { 'krackle': 'Krackle', 'tone': 'Tone' };
const effects = {
    'krackle': ['black', 'blue', 'gold', 'green', 'purple', 'rainbow', 'red', 'white'],
    'tone': ['black', 'blue', 'gold', 'green', 'purple', 'rainbow', 'red', 'white']
};

for (const category in effectCategories) {
    const categoryTitleDividerDiv = document.createElement('div');
    categoryTitleDividerDiv.style.flex = '1 1 auto';
    const categoryTitle = document.createElement('h2');
    categoryTitle.textContent = effectCategories[category];
    categoryTitleDividerDiv.appendChild(categoryTitle);
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'effect-category';
    categoryTitleDividerDiv.appendChild(categoryDiv);
    effectSelectDiv.appendChild(categoryTitleDividerDiv);

    const categoryEffects = effects[category];
    for (const effect of categoryEffects) {
        const effectImg = document.createElement('img');
        effectImg.src = `${effectDir}${category}/${effect}.png`;
        effectImg.alt = `${category} ${effect}`;
        effectImg.className = 'frame-image';
        effectImg.addEventListener('click', () => {
            imagesBase64.effectImage = `${effectDir}${category}/${effect}.png`;
            updateResult();
            closeEffectSelectPopup();
        });
        categoryDiv.appendChild(effectImg);
    }
}