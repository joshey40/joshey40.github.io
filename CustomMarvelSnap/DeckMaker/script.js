import { getOfficialCards } from "../scripts/datafetch.js";

const officialCards = await getOfficialCards();

const deck = [];

for (let i = 1; i <= 12; i++) {
    deck.push(officialCards[Math.floor(Math.random() * officialCards.length)]);
}

function updateDeck() {
    // Sort the deck by cost
    deck.sort((a, b) => a.cost - b.cost);
    // Update the displayed deck
    for (let i = 1; i <= 12; i++) {
        const card_slot = document.getElementById(`card-slot-${i}`);
        if (card_slot) {
            const card = deck[i - 1];
            if (card) {
                if (card.cid) {
                    // Handle variants if they exist
                    if (card.variants && card.variants.length > 0) {
                        if (card.currentSelectedVariant === undefined) {
                            card.currentSelectedVariant = -1; // Initialize the index if not set
                        }
                        if (card.currentSelectedVariant >= 0 && card.currentSelectedVariant < card.variants.length) {
                            card_slot.innerHTML = `<img src="${card.variants[card.currentSelectedVariant].art}" alt="${card.name}">`;
                        } else {
                            card_slot.innerHTML = `<img src="${card.art}" alt="${card.name}">`; // Default to the main art if no variant is selected
                        }
                    } else {
                        card_slot.innerHTML = `<img src="${card.art}" alt="${card.name}">`; // Use the main art if no variants exist
                    }
                } else {
                    // TODO: Handle custom card
                    card_slot.innerHTML = `<img src="https://joshey40.github.io/CustomMarvelSnap/res/img/default_cards/empty.png" alt="placeholder">`;
                }
            } else {
                card_slot.innerHTML = `<img src="https://joshey40.github.io/CustomMarvelSnap/res/img/default_cards/empty.png" alt="placeholder">`;
            }
        }
    }
}

// Add event listeners for long press and short click on each card slot
// This allows cycling through variants on short click and removing the card on long press
for (let i = 1; i <= 12; i++) {
    const card_slot = document.getElementById(`card-slot-${i}`);
    function handleCardShortClick(i) {
        if (!deck[i - 1]) {
            return; // If no card is selected, do nothing
        }
        if (deck[i - 1].currentSelectedVariant === undefined) {
            deck[i - 1].currentSelectedVariant = -1; // Initialize the index if not set
        }
        // Cycle through variants
        if (deck[i - 1] && deck[i - 1].variants && deck[i - 1].variants.length > 0) {
            deck[i - 1].currentSelectedVariant = (deck[i - 1].currentSelectedVariant + 1);
            if (deck[i - 1].currentSelectedVariant >= deck[i - 1].variants.length) {
                deck[i - 1].currentSelectedVariant = -1; // Reset to the first variant if exceeded
            }
        }
        updateDeck(); // Update the displayed deck
    }
    function handleCardLongClick(i) {
        // Remove card from deck
        const card = deck[i - 1];
        if (card) {
            deck.splice(i - 1, 1); // Remove the card from the deck
            updateDeck(); // Update the displayed deck
        }
    }
    // Add long press to each card slot -> remove card from deck
    if (card_slot) {
        let timer;
        let isLongPress = false;
        card_slot.addEventListener("touchstart", () => {
            // Timer
            timer = setTimeout(() => {
                handleCardLongClick(i);
                isLongPress = true;
            }, 1000); // 1 second long press
        });
        card_slot.addEventListener("touchend", () => {
            clearTimeout(timer); // Clear the timer if the touch is released before 1 second
            if (isLongPress) {
                isLongPress = false; // Reset the long press state
            } else {
                handleCardShortClick(i);
            }
        });
        card_slot.addEventListener("touchcancel", () => {
            clearTimeout(timer); // Clear the timer if the touch is canceled
        });
        card_slot.addEventListener("mousedown", () => {
            // Timer
            timer = setTimeout(() => {
                handleCardLongClick(i);
                isLongPress = true;
            }, 1000); // 1 second long press
        });
        card_slot.addEventListener("mouseup", () => {
            clearTimeout(timer); // Clear the timer if the mouse is released before 1 second
            if (isLongPress) {
                isLongPress = false; // Reset the long press state
            } else {
                handleCardShortClick(i);
            }
        });
        card_slot.addEventListener("mouseleave", () => {
            clearTimeout(timer); // Clear the timer if the mouse leaves the card slot
        });
    }
}

//
const addCardButtonsDiv = document.getElementById("add-cards-div");
for (card of officialCards) {
    const button = document.createElement("button");
    button.className = "default-button";
    button.innerText = card.name;
    button.onclick = () => {
        if (deck.length >= 12) {
            return;
        }
        deck.push(card);
        updateDeck();
    };
    addCardButtonsDiv.appendChild(button);
}

updateDeck();