import {generatecard} from '../scripts/cardDesign.js';

let imagesBase64 = {
    mainImage: null,
    frameImage: null,
    frameBreakImage: null,
    titleImage: null
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
        const cost = document.getElementById('cost').value;
        const power = document.getElementById('power').value;
        const description = document.getElementById('description').value;
        const zoom = 1 + (document.getElementById('imageZoom').value / 100);

        // Update the card (hier wird das Signal weitergegeben)
        const canvas = await generatecard(name, colorName, cost, power, description, 1024, imagesBase64, zoom);

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

function downloadCard() {
    const canvas = document.getElementById('cardImage');
    const link = document.createElement('a');
    const name = document.getElementById('name').value;
    if (!name) {
        link.download = 'custom_card.png';
    } else {
        link.download = `${name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    }
    link.href = canvas.toDataURL();
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
window.downloadCard = downloadCard;

export { updateResult, mainImageChange, frameBreakImageChange, titleImageChange, clearMainImage, clearFrameBreakImage, clearTitleImage, selectFrame, closeFrameSelectPopup, downloadCard };



// Add Frames to frameSelectPopup
const frameSelectDiv = document.getElementById('frameSelectDiv');
const frameDir = '../res/img/frames/';
const categories = { 'basic': 'Basic', 'cosmic': 'Cosmic', 'neon': 'Neon' };
const frames = {
    'basic': ['common', 'uncommon', 'rare', 'epic', 'legendary', 'ultra', 'infinite'],
    'cosmic': ['blue', 'green', 'red', 'pink', 'yellow', 'orange'],
    'neon': ['blue', 'green', 'red', 'pink', 'yellow', 'white']
};

for (const category in categories) {
    const categoryTitleDividerDiv = document.createElement('div');
    categoryTitleDividerDiv.style.flex = '1 1 auto';
    const categoryTitle = document.createElement('h2');
    categoryTitle.textContent = categories[category];
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