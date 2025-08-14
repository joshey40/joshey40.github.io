import { getOfficialCards } from "../scripts/datafetch.js";

const officialCards = await getOfficialCards();

const deck = [];

for (let i = 1; i <= 12; i++) {
    deck.push(officialCards[Math.floor(Math.random() * officialCards.length)]);
}

updateDeck();

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
    // Add click event listener to each card slot -> remove card from deck
    if (card_slot) {
        card_slot.addEventListener("click", () => {
            const card = deck[i - 1];
            if (card) {
                deck.splice(i - 1, 1); // Remove the card from the deck
                updateDeck(); // Update the displayed deck
            }
        });
    }
}


