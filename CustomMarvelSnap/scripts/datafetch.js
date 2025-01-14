// Constants
const CARDS_API_URL = "https://marvelsnapzone.com/getinfo/?searchtype=cards&searchcardstype=true"
const LOCATIONS_API_URL = "https://marvelsnapzone.com/getinfo/?searchtype=locations&searchcardstype=true"

async function getOfficialCards() {
    console.log("hiiii");
    return fetch(CARDS_API_URL, { mode: 'no-cors' })
        .then(response => response.json())
        .then(data => {
            var cards = data.sucess.cards;
            return cards;
        })
}

async function getOfficialLocations() {
    return fetch(LOCATIONS_API_URL, { mode: 'no-cors' })
        .then(response => response.json())
        .then(data => {
            var locations = data.sucess.locations;
            return locations;
        })
}

async function getCustomCards() {
    // TODO: Implement this function
    return [];
}

async function getCustomLocations() {
    // TODO: Implement this function
    return [];
}

async function getCards() {
    var officialCards = await getOfficialCards();
    var customCards = await getCustomCards();
    // TODO: Clean up the data and return the final list
    console.log(officialCards);
    console.log(customCards);
    return [];
}

async function getLocations() {
    var officialLocations = await getOfficialLocations();
    var customLocations = await getCustomLocations();
    // TODO: Clean up the data and return the final list
    console.log(officialLocations);
    console.log(customLocations);
    return [];
}

export { getCards, getLocations }