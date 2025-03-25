import {generatecard} from '../scripts/cardDesign.js';

function updateResult() {
    const name = document.getElementById('name').value;
    const colorName = document.getElementById('nameColor').value; // Fixed ID reference
    const cost = document.getElementById('cost').value;
    const power = document.getElementById('power').value;
    const description = document.getElementById('description').value;

    // Update the card
    const canvas = generatecard(name, colorName, cost, power, description);

    // Update the card image
    const cardImage = document.getElementById('cardImage');
    cardImage.src = canvas.toDataURL();
}

export { updateResult }; // Ensure the function is globally accessible
