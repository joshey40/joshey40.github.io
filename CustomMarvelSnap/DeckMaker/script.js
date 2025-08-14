import { getOfficialCards } from "../scripts/datafetch.js";

const officialCards = await getOfficialCards();

const deck = [];

for (let i = 1; i <= 12; i++) {
    deck.push(officialCards[Math.floor(Math.random() * officialCards.length)]);
}

updateDeck();

function updateDeck() {
    // Sort the deck by cost
    deck.sort((a, b) => a.cost - b.cost);
    // Update the displayed deck
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
    // Add long press to each card slot -> remove card from deck
    if (card_slot) {
        let timer;
        card_slot.addEventListener("touchstart", () => {
            // Timer
            timer = setTimeout(() => {
                const card = deck[i - 1];
                if (card) {
                    deck.splice(i - 1, 1); // Remove the card from the deck
                    updateDeck(); // Update the displayed deck
                }
            }, 1000); // 1 second long press
        });
        card_slot.addEventListener("touchend", () => {
            clearTimeout(timer); // Clear the timer if the touch is released before 1 second
        });
        card_slot.addEventListener("mousedown", () => {
            // Timer
            timer = setTimeout(() => {
                const card = deck[i - 1];
                if (card) {
                    deck.splice(i - 1, 1); // Remove the card from the deck
                    updateDeck(); // Update the displayed deck
                }
            }, 1000); // 1 second long press
        });
        card_slot.addEventListener("mouseup", () => {
            clearTimeout(timer); // Clear the timer if the mouse is released before 1 second
        });
    }
}