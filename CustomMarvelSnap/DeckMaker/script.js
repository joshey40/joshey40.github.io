import { getOfficialCards } from "../scripts/datafetch.js";

console.log("Card Maker Script Loaded");
const officialCards = await getOfficialCards();
console.log(officialCards);
// get Card by Name
