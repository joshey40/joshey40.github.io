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
    const cardImageDiv = document.getElementById('resultDiv');
    cardImageDiv.innerHTML = '';
    cardImageDiv.appendChild(canvas);
}

// Attach to the global window object
window.updateResult = updateResult;

export { updateResult };
