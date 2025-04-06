import {generatecard} from '../scripts/cardDesign.js';

let imagesBase64 = {
    mainImage: null,
    frameImage: null,
    frameBreakImage: null,
    titleImage: null
};

async function updateResult() {
    const name = document.getElementById('name').value;
    const colorName = document.getElementById('nameColor').value;
    const cost = document.getElementById('cost').value;
    const power = document.getElementById('power').value;
    const description = document.getElementById('description').value;

    // Update the card
    const canvas = await generatecard(name, colorName, cost, power, description, 1024, imagesBase64);

    // Update the card image
    const cardImage = document.getElementById('cardImage');
    cardImage.src = canvas.toDataURL();
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
    frameSelectPopup.style.visibility = 'hidden';
    frameSelectPopup.style.opacity = '0';
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

export { updateResult, mainImageChange, frameBreakImageChange, titleImageChange, clearMainImage, clearFrameBreakImage, clearTitleImage, selectFrame, closeFrameSelectPopup };



// Add Frames to frameSelectPopup
const frameSelectDiv = document.getElementById('frameSelectDiv');
const frameDir = '../res/img/frames/';
const categories = { 'basic': 'Basic', 'cosmic': 'Cosmic', 'neon': 'Neon' };
const frames = {
    'basic': ['common', 'uncommon', 'rare', 'epic', 'legendary', 'ultra', 'infinite'],
    'cosmic': ['blue', 'green', 'red', 'purple', 'yellow', 'orange'],
    'neon': ['blue', 'green', 'red', 'purple', 'yellow', 'white']
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


