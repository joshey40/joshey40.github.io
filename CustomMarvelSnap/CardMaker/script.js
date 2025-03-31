import {generatecard} from '../scripts/cardDesign.js';

async function updateResult() {
    const name = document.getElementById('name').value;
    const colorName = document.getElementById('nameColor').value;
    const cost = document.getElementById('cost').value;
    const power = document.getElementById('power').value;
    const description = document.getElementById('description').value;

    // Update the card
    const canvas = await generatecard(name, colorName, cost, power, description);

    // Update the card image
    const cardImage = document.getElementById('cardImage');
    cardImage.src = canvas.toDataURL();
}

function mainImageChange(event) {
    console.log('mainImageChange');
}

function frameBreakImageChange(event) {
    console.log('frameBreakImageChange');
}

function titleImageChange(event) {
    console.log('titleImageChange');
}

function clearMainImage() {
    console.log('clearMainImage');
}

function clearFrameBreakImage() {
    console.log('clearFrameBreakImage');
}

function clearTitleImage() {
    console.log('clearTitleImage');
}


function selectFrame() {
    console.log('selectFrame');
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

export { updateResult, mainImageChange, frameBreakImageChange, titleImageChange, clearMainImage, clearFrameBreakImage, clearTitleImage, selectFrame };

