import {generatecard} from '../scripts/cardDesign.js';

let imagesBase64 = {
    mainImage: null,
    frameImage: null,
    frameBreakImage: null,
    titleImage: null,
    effectImage: null,
};

var offsetX = 0;
var offsetY = 0;

// Globaler State für Card Settings
let cardSettings = {
    name: '',
    colorName: '',
    nameZoom: 1,
    cost: '',
    power: '',
    description: '',
    zoom: 1,
    transparentBg: false,
    backgroundColor: 'transparent',
    offset: [0, 0],
    imagesBase64: imagesBase64,
};

// Für Change Detection
let lastRenderedSettings = null;
let isRendering = false;
let pendingRender = false;

function updateResult() {
    // Nur Settings updaten
    cardSettings.name = document.getElementById('name').value;
    cardSettings.colorName = document.getElementById('nameColor').value;
    cardSettings.nameZoom = 1 + ((document.getElementById('nameZoom').value - 100) / 100);
    cardSettings.cost = document.getElementById('cost').value;
    cardSettings.power = document.getElementById('power').value;
    cardSettings.description = document.getElementById('description').value;
    cardSettings.zoom = 1 + (document.getElementById('imageZoom').value / 100);
    cardSettings.transparentBg = document.getElementById('transparentBg').checked;
    cardSettings.backgroundColor = cardSettings.transparentBg === false ? 'transparent' : document.getElementById('backgroundColor').value;
    cardSettings.offset = [offsetX, offsetY];
    cardSettings.imagesBase64 = imagesBase64;

    requestRender();
}

function requestRender() {
    if (isRendering) {
        pendingRender = true;
        return;
    }
    renderCard();
}

async function renderCard() {
    isRendering = true;
    const currentSettings = JSON.stringify(cardSettings);
    if (currentSettings !== lastRenderedSettings) {
        lastRenderedSettings = currentSettings;
        try {
            const canvas = await generatecard(
                cardSettings.name,
                cardSettings.colorName,
                cardSettings.cost,
                cardSettings.power,
                cardSettings.description,
                1024,
                cardSettings.imagesBase64,
                cardSettings.zoom,
                cardSettings.nameZoom,
                cardSettings.backgroundColor,
                cardSettings.offset
            );
            const cardImage = document.getElementById('cardImage');
            await new Promise(resolve => {
                canvas.toBlob(blob => {
                    cardImage.src = URL.createObjectURL(blob);
                    resolve();
                }, 'image/png');
            });
        } catch (error) {
            console.error('Fehler beim Rendern der Karte:', error);
        }
    }
    isRendering = false;
    if (pendingRender) {
        pendingRender = false;
        renderCard();
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
    updateResult();
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

let mouseOverCreditsButton = false;
let mouseOverCreditsPopup = false;

function showCreditsPopup(source) {
    if (source === 1) {
        mouseOverCreditsButton = true;
    } else {
        mouseOverCreditsPopup = true;
    }
    const creditsPopup = document.getElementById('creditsPopup');
    creditsPopup.style.display = 'block';
}

function hideCreditsPopup(source) {
    if (source === 1) {
        mouseOverCreditsButton = false;
    } else {
        mouseOverCreditsPopup = false;
    }
    if (mouseOverCreditsButton || mouseOverCreditsPopup) {
        return;
    }
    const creditsPopup = document.getElementById('creditsPopup');
    creditsPopup.style.display = 'none';
}

// Add event listeners to the image for offsets
const cardImage = document.getElementById('cardImage');
cardImage.ondragstart = function() { return false; };
var isDragging = false;
var downPosition = { x: 0, y: 0 };

// Mouse events
cardImage.addEventListener('mousedown', (e) => {
    isDragging = true;
    downPosition.x = e.clientX - offsetX;
    downPosition.y = e.clientY - offsetY;
});
cardImage.addEventListener('mousemove', (e) => {
    if (isDragging) {
        offsetX = e.clientX - downPosition.x;
        offsetY = e.clientY - downPosition.y;
        updateResult();
    }
});
cardImage.addEventListener('mouseup', () => {
    isDragging = false;
});
cardImage.addEventListener('mouseleave', () => {
    isDragging = false;
});

// Touch events for mobile
cardImage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        isDragging = true;
        const touch = e.touches[0];
        downPosition.x = touch.clientX - offsetX;
        downPosition.y = touch.clientY - offsetY;
    }
});
cardImage.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        offsetX = touch.clientX - downPosition.x;
        offsetY = touch.clientY - downPosition.y;
        updateResult();
        e.preventDefault(); // Prevent scrolling while dragging
    }
}, { passive: false });
cardImage.addEventListener('touchend', () => {
    isDragging = false;
});
cardImage.addEventListener('touchcancel', () => {
    isDragging = false;
});

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
window.showCreditsPopup = showCreditsPopup;
window.hideCreditsPopup = hideCreditsPopup;

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