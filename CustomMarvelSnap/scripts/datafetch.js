
// Constants
const CARDS_API_URL = "https://marvelsnapzone.com/getinfo/?searchtype=cards&searchcardstype=true"
const LOCATIONS_API_URL = "https://marvelsnapzone.com/getinfo/?searchtype=locations&searchcardstype=true"

async function getOfficialCards() {
    return fetch(CARDS_API_URL)
        .then(response => response.json())
        .then(data => {
            var cards = data.sucess.cards;
            return cards;
        })
}

async function getOfficialLocations() {
    return fetch(LOCATIONS_API_URL)
        .then(response => response.json())
        .then(data => {
            var locations = data.sucess.locations;
            return locations;
        })
}

async function getCustomeCards() {
    // TODO: Implement this function
    return [];
}

async function getCustomLocations() {
    // TODO: Implement this function
    return [];
}

async function getCards() {
    var officialCards = await getOfficialCards();
    var customCards = await getCustomeCards();
    // TODO: Clean up the data and return the final list
    console.log(officialCards);
    console.log(customCards);
}

async function getLocations() {
    var officialLocations = await getOfficialLocations();
    var customLocations = await getCustomLocations();
    // TODO: Clean up the data and return the final list
    console.log(officialLocations);
    console.log(customLocations);
}

export { getCards, getLocations }