import { getOfficialCards } from "../scripts/datafetch.js";

const officialCards = await getOfficialCards();

const deck = [];

for (let i = 1; i <= 12; i++) {
    deck.push(officialCards.find(card => card.cid === i) || null);
}

function updateDeck() {
    for (let i = 1; i <= 12; i++) {
        const card_slot = document.getElementById(`card-slot-${i}`);
        if (card_slot) {
            const card = deck[i - 1];
            if (card) {
                card_slot.innerHTML = `<img src="${card.art}" alt="${card.name}">`;
            } else {
                card_slot.innerHTML = `<img src="https://joshey40.github.io/CustomMarvelSnap/res/img/default_cards/empty.png" alt="placeholder">`;
            }
        }
    }
}

for (let i = 1; i <= 12; i++) {
    const card_slot = document.getElementById(`card-slot-${i}`);
    // Add long press event listener to each card slot
    if (card_slot) {
        card_slot.addEventListener("contextmenu", (event) => {
            event.preventDefault(); // Prevent the default context menu
            const card = deck[i - 1];
            if (card) {
                // Remove the card from the deck
                deck.splice(i - 1,1);
                updateDeck();
            } else {
                alert("No card in this slot.");
            }
        });
    }
}


