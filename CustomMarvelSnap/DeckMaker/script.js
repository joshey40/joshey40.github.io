import { getOfficialCards } from "../scripts/datafetch.js";
import { generatecard } from "../scripts/cardDesign.js";

const officialCards = await getOfficialCards();

const deck = [];

async function updateDeck() {
    // Sort the deck by cost and if equal, by power and then by name
    deck.sort((a, b) => {
        if (a.cost !== b.cost) {
            return a.cost - b.cost; // Sort by cost first
        }
        if (a.power === undefined) {
            return -1;
        } else if (b.power === undefined) {
            return 1;
        }
        if (a.power !== b.power) {
            return a.power - b.power; // Sort by power next (ascending)
        }
        return a.name.localeCompare(b.name); // Finally, sort by name alphabetically
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
                    // Handle custom card
                    const cardCanvas = await generatecard(
                        card.name,
                        card.colorName,
                        card.nameOutlineColor,
                        card.fontSelect,
                        card.cost,
                        card.power,
                        card.showCostPower,
                        "",
                        1024,
                        card.imagesBase64,
                        card.zoom,
                        card.nameZoom,
                        "transparent",
                        card.offset,
                        card.finish
                    );
                    // Cut the canvas to a 1024x1024 and convert to image
                    const cutCanvas = document.createElement("canvas");
                    cutCanvas.width = 1024;
                    cutCanvas.height = 1024;
                    const cutCtx = cutCanvas.getContext("2d");
                    cutCtx.drawImage(cardCanvas, 0, 0, 1024, 1024, 0, 0, 1024, 1024);
                    card_slot.innerHTML = `<img src="${cutCanvas.toDataURL()}" alt="${card.name}">`;
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
        card_slot.addEventListener("touchmove", (event) => {
            clearTimeout(timer); // Clear the timer if the touch is moved
        });
        card_slot.addEventListener("contextmenu", (event) => {
            event.preventDefault(); // Prevent the default context menu
            clearTimeout(timer); // Clear the timer if the context menu is opened
            handleCardLongClick(i);
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
const buttonsAddCard = [];
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
        officialCards[i].currentSelectedVariant = -1; // Reset variant selection
        deck.push(officialCards[i]);
        updateDeck();
    };
    buttonsAddCard.push(button);
    addCardButtonsDiv.appendChild(button);
}

const filterCards = {
    text: "",
    cost: "",
    power: "",
    sortBy: "name"
};

updateDeck();
updateAddCardButtons();

function updateFilter() {
    filterCards.text = document.getElementById("card-text-input").value.toLowerCase();
    filterCards.cost = document.getElementById("card-cost-filter").value;
    filterCards.power = document.getElementById("card-power-filter").value;
    filterCards.sortBy = document.getElementById("sort-by").value;

    updateAddCardButtons();
}

function updateAddCardButtons() {
    const filteredCards = officialCards.filter(card => {
        const matchesText = card.name.toLowerCase().includes(filterCards.text) || card.ability.toLowerCase().includes(filterCards.text);
        const matchesCost = filterCards.cost === "" || card.cost === parseInt(filterCards.cost);
        const matchesPower = filterCards.power === "" || card.power === parseInt(filterCards.power);

        return matchesText && matchesCost && matchesPower;
    });

    // Sort the filtered cards
    filteredCards.sort((a, b) => {
        if (filterCards.sortBy === "name") {
            return a.name.localeCompare(b.name);
        } else if (filterCards.sortBy === "cost") {
            return a.cost - b.cost;
        } else if (filterCards.sortBy === "power") {
            return a.power - b.power;
        }
    });

    // Update the displayed add card buttons
    const addCardButtonsDiv = document.getElementById("add-cards-div");
    addCardButtonsDiv.innerHTML = ""; // Clear existing buttons
    for (let i = 0; i < filteredCards.length; i++) {
        const button = buttonsAddCard.find(btn => btn.innerText === filteredCards[i].name);
        if (button) {
            addCardButtonsDiv.appendChild(button);
        }
    }
}

function clearDeck() {
    deck.length = 0; // Clear the deck
    updateDeck(); // Update the displayed deck
}

async function importCard(event) {
    const file = event.target.files[0];
    document.getElementById("import-button").value = ""; // Reset the file input
    if (!file) {
        return; // No file selected
    }
    let cardSettings = {
        name: "",                       // Card name
        colorName: "#ffffff",         // Name color
        nameOutlineColor: "#000000",  // Name outline color
        fontSelect: "BadaBoom",         // Font for the name
        nameZoom: 1,                    // Zoom factor for the name
        cost: "0",                      // Card cost
        power: "",                      // Card power
        showCostPower: true,            // Show cost and power
        description: "",                // Description text
        zoom: 1,                        // Zoom factor for the main image
        transparentBg: false,           // Transparent background
        backgroundColor: "#10072b",   // Background color
        offset: [0, 0],                 // Offset for the image
        imagesBase64: {
            mainImage: null,            // Main image of the card
            frameImage: null,           // Frame image
            foregroundImage: null,      // Foreground image
            frameBreakImage: null,      // Frame break image
            titleImage: null,           // Title image
            effectImage: null,          // Effect image
        },
        finish: "",                     // Finish effect
    };
    const CARD_FILE_EXT = ".cmscard";
    try {
        // Basic extension guard (users could still rename; deeper structural checks below)
        if (!file.name.toLowerCase().endsWith(CARD_FILE_EXT)) {
          throw new Error("Unsupported file type. Please select a " + CARD_FILE_EXT + " file.");
        }

        // Load the ZIP bundle
        const zip = await JSZip.loadAsync(file);
        const jsonEntry = zip.file("card.json");
        if (!jsonEntry) throw new Error("card.json missing");

        // Parse JSON metadata
        const jsonText = await jsonEntry.async("string");
        let data;
        try { data = JSON.parse(jsonText); } catch { throw new Error("card.json invalid JSON"); }
        if (typeof data.version !== "number") throw new Error("Invalid version");
        if (data.version > 1) console.warn("Newer file version", data.version); // Compatibility forward-warning

        // Destructure with safe fallbacks
        const card = data.card || {};
        const nameObj = card.name || {};
        const stats = card.stats || {};
        const desc = card.description || {};
        const images = card.images || {};
        const mainImg = images.main || {};
        const foregroundImg = images.foreground || {};
        const frameBreakImg = images.frameBreak || {};
        const background = card.background || {};

        // Finish can be string or object {id}
        let finishId = "";
        if (card.finish) {
        if (typeof card.finish === "string") finishId = card.finish; else if (card.finish.id) finishId = card.finish.id;
        }

        // Repopulate card settings with card data
        cardSettings.name = nameObj.text || "";
        cardSettings.colorName = nameObj.color || "#ffffff";
        cardSettings.nameOutlineColor = nameObj.outlineColor || "#000000";
        cardSettings.fontSelect = nameObj.font || "BadaBoom";
        cardSettings.nameZoom = nameObj.zoom / 100 || 1;
        cardSettings.cost = stats.cost || "1";
        cardSettings.power = stats.power || "";
        cardSettings.showCostPower = stats.showCostPower !== false;
        cardSettings.description = desc.text || "";
        cardSettings.zoom = (1 + (mainImg.zoom / 100)) || 1;
        cardSettings.transparentBg = background.transparent || false;
        cardSettings.backgroundColor = background.color || "#10072b";

        // Restore positional + selection state
        const offsetX = typeof mainImg.offsetX === "number" ? mainImg.offsetX : 0;
        const offsetY = typeof mainImg.offsetY === "number" ? mainImg.offsetY : 0;
        const nameOffsetY = typeof nameObj.offsetY === "number" ? nameObj.offsetY : 0;
        cardSettings.offset = [offsetX, offsetY, nameOffsetY];
        cardSettings.imagesBase64.frameImage = (card.frame && card.frame.id) || null;
        cardSettings.imagesBase64.effectImage = (card.effect && card.effect.id) || null;
        cardSettings.finish = finishId || null;

        // Convert images (title, main, framebreak) to Base64
        const toBase64 = (path) => new Promise((resolve) => {
            if (!path) return resolve(null);               // Nothing referenced
            let entry = zip.file(path);
            if (!entry) {                    // Fallback: strip directories and try last segment
                const simple = path.split('/').pop();
                entry = zip.file(simple);
            }
            if (!entry) return resolve(null);              // Missing file (graceful skip)
            entry.async("blob").then((file) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        });
        cardSettings.imagesBase64.titleImage = await toBase64(nameObj.imageFile);
        cardSettings.imagesBase64.mainImage = await toBase64(mainImg.file);
        cardSettings.imagesBase64.foregroundImage = await toBase64(foregroundImg.file);
        cardSettings.imagesBase64.frameBreakImage = await toBase64(frameBreakImg.file);

        // Add the card to the deck and update the deck
        deck.push(cardSettings);
        updateDeck();
    } catch (err) {
        alert("Import failed: " + err.message);
        console.error(err);
    }
}

async function downloadDeckImg() {
    const deckCanvas = document.createElement("canvas");
    const height = document.getElementById("deck-img-grid").value || 2;
    deckCanvas.height = height * 1024;
    deckCanvas.width = (12 / height) * 1024;

    const ctx = deckCanvas.getContext("2d");
    ctx.fillStyle = document.getElementById("backgroundColor").value || "#10072b";
    if (document.getElementById("transparentBg").checked) {
        ctx.fillRect(0, 0, deckCanvas.width, deckCanvas.height);
    }

    // Draw each card on the canvas
    for (let i = 0; i < 12; i++) {
        const cardSlot = document.getElementById(`card-slot-${i + 1}`);
        const imgSrc = cardSlot.querySelector("img").src;
        const img = new Image();
        // Set crossOrigin for CORS-safe images
        if (!imgSrc.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }
        img.src = imgSrc;
        await new Promise((resolve) => {
            img.onload = () => {
                const x = Math.floor(i % (12 / height)) * 1024;
                const y = Math.floor(i / (12 / height)) * 1024;
                ctx.drawImage(img, x, y, 1024, 1024);
                resolve();
            };
            img.onerror = () => {
                // If image fails to load (CORS), skip drawing
                resolve();
            };
        });
    }

    deckCanvas.toBlob((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "deck_image.png";
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }, "image/png");
}

// Shows the tutorial popup
function showTutorialPopup() {
  const tutorialPopup = document.getElementById("tutorialPopup");
  tutorialPopup.style.visibility = "visible";
  tutorialPopup.style.opacity = "1";
}


// Closes the tutorial popup
function closeTutorialPopup() {
  const tutorialPopup = document.getElementById("tutorialPopup");
  tutorialPopup.style.opacity = "0";
  tutorialPopup.style.visibility = "hidden";
}

window.clearDeck = clearDeck; // Expose the clearDeck function globally
window.importCard = importCard; // Expose the importCard function globally
window.downloadDeckImg = downloadDeckImg; // Expose the downloadDeckImg function globally
window.updateFilter = updateFilter; // Expose the updateFilter function globally
window.showTutorialPopup = showTutorialPopup; // Expose the showTutorialPopup function globally
window.closeTutorialPopup = closeTutorialPopup; // Expose the closeTutorialPopup function globally

export { clearDeck, importCard, downloadDeckImg, updateFilter, showTutorialPopup, closeTutorialPopup }; // Export functions and variables for use in other modules