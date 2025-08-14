// Constants
const CARDS_API_URL = "https://marvelsnapzone.com/getinfo/?searchtype=cards&searchcardstype=true"
const LOCATIONS_API_URL = "https://marvelsnapzone.com/getinfo/?searchtype=locations&searchcardstype=true"
const PROXY_URL = "https://corsproxy.io/?";

async function getOfficialCards() {
    try {
        const proxyUrl = PROXY_URL + encodeURIComponent(CARDS_API_URL);
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const parsed = JSON.parse(data.contents);
        return parsed.success.cards;
    } catch (error) {
        console.error("Error loading cards from Snap Zone:", error);
        return [];
    }
}

async function getOfficialLocations() {
    try {
        const proxyUrl = PROXY_URL + encodeURIComponent(LOCATIONS_API_URL);
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const parsed = JSON.parse(data.contents);
        return parsed.success.locations;
    } catch (error) {
        console.error("Error loading locations from Snap Zone:", error);
        return [];
    }
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

export { getOfficialCards, getCards, getLocations }