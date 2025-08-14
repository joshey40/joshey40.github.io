import { getOfficialCards } from "../scripts/datafetch.js";

const officialCards = await getOfficialCards();

const deck = [];

function updateDeck() {
    // Sort the deck by cost and if equal, by power and then by name
    deck.sort((a, b) => {
        let costA = 0;
        let costB = 0;
        let powerA = 0;
        let powerB = 0;
        let nameA = "";
        let nameB = "";
        if (a.cid) {
            costA = a.cost || 0;
            powerA = a.power || 0;
            nameA = a.name || "";
        } else {
            costA = a.stats?.cost || 0;
            powerA = a.stats?.power || 0;
            nameA = a.name || "";
        }
        if (b.cid) {
            costB = b.cost || 0;
            powerB = b.power || 0;
            nameB = b.name || "";
        } else {
            costB = b.stats?.cost || 0;
            powerB = b.stats?.power || 0;
            nameB = b.name || "";
        }
        if (costA !== costB) {
            return costA - costB; // Sort by cost (lower cost first)
        }
        if (powerA !== powerB) {
            return powerA - powerB; // Sort by power (lower power first)
        }
        return nameA.localeCompare(nameB); // Sort by name (alphabetical order)
    });
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

// Add buttons to add cards to the deck
const addCardButtonsDiv = document.getElementById("add-cards-div");
for (let i = 0; i < officialCards.length; i++) {
    const button = document.createElement("button");
    button.className = "default-button";
    button.innerText = officialCards[i].name;
    button.style.width = "200px";
    button.style.margin = "5px";
    button.onclick = () => {
        if (deck.length >= 12) {
            return;
        }
        if (deck.some(card => card.cid === officialCards[i].cid)) {
            // Remove the card if it already exists in the deck
            const index = deck.findIndex(card => card.cid === officialCards[i].cid);
            if (index !== -1) {
                deck.splice(index, 1);
            }
            updateDeck();
            return;
        }
        deck.push(officialCards[i]);
        updateDeck();
    };
    addCardButtonsDiv.appendChild(button);
}

updateDeck();

function clearDeck() {
    deck.length = 0; // Clear the deck
    updateDeck(); // Update the displayed deck
}

function importCard(event) {
    const file = event.target.files[0];
    if (!file) {
        return; // No file selected
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            let cardData = JSON.parse(e.target.result);
            if (cardData && cardData.card) {
                const cardSettings = {
                    name: "",
                    colorName: "#ffffff",
                    nameOutlineColor: "#000000",
                    fontSelect: "BadaBoom",
                    nameZoom: 1,
                    cost: "0",
                    power: "0",
                    showCostPower: true,
                    description: "",
                    zoom: 1,
                    transparentBg: false,
                    backgroundColor: "#10072b",
                    offset: [0, 0],
                    imagesBase64: {
                        mainImage: "",
                        frameImage: "",
                        frameBreakImage: "",
                        titleImage: "",
                        effectImage: "",
                    },
                    finish: "",
                };
                // Merge the imported card data with the default settings
                
                deck.push(cardSettings); // Add the card to the deck
                updateDeck(); // Update the displayed deck
            } else {
                console.error("Invalid card data or card already exists in the deck.");
            }
        } catch (error) {
            console.error("Error parsing card data:", error);
        }
    }
}

window.clearDeck = clearDeck; // Expose the clearDeck function globally
window.importCard = importCard;

export { clearDeck, importCard }; // Export functions and variables for use in other modules