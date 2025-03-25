import {generatecard} from '../scripts/cardDesign.js';

function updateResult() {
    const name = document.getElementById('name').value;
    const colorName = document.getElementById('colorName').value;
    const cost = document.getElementById('cost').value;
    const power = document.getElementById('power').value;
    const description = document.getElementById('description').value;

    // Update the card
    const canvas = generatecard(name, colorName, cost, power, description);

    // Update the card image
    const cardImage = document.getElementById('cardImage');
    cardImage.src = canvas.toDataURL();

}

document.getElementById('name').addEventListener('input', updateResult);
document.getElementById('colorName').addEventListener('input', updateResult);
document.getElementById('cost').addEventListener('input', updateResult);
document.getElementById('power').addEventListener('input', updateResult);