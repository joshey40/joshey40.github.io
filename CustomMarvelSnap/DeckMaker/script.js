import { getOfficialCards } from "../scripts/datafetch.js";

const officialCards = await getOfficialCards();


for (let i = 0; i < 12; i++) {
    const card_slot = document.getElementById(`card-slot-${i}`);
    if (card_slot) {
        const card = officialCards[i];
        if (card) {
            card_slot.innerHTML = `<img src="${card.art}" alt="${card.name}">`;
        } else {
            card_slot.innerHTML = `<img src="https://joshey40.github.io/CustomMarvelSnap/res/img/default_cards/empty.png" alt="placeholder">`;
        }
    }
}