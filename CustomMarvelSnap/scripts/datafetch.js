// Constants
const CARDS_API_URL = "https://marvelsnapzone.com/getinfo/?searchtype=cards&searchcardstype=true"
const LOCATIONS_API_URL = "https://marvelsnapzone.com/getinfo/?searchtype=locations&searchcardstype=true"
const PROXY_URL = "https://corsproxy.io/?";

async function getOfficialCards(includeVariants = true) {
    let officialCards = await fetchOfficials("cards", CARDS_API_URL);
    if (!officialCards || officialCards.length === 0) {
        return [];
    }
    // Clean up the data if necessary
    if (!includeVariants) {
        // Remove variants from the official cards if there are any
        for (let i = officialCards.length - 1; i >= 0; i--) {
            if (officialCards[i].variants && officialCards[i].variants.length > 0) {
                delete officialCards[i].variants;
            }
        }
    }
    for (let i = 0; i < officialCards.length; i++) {
        // Flavor text handling
        if (officialCards[i].flavor && officialCards[i].flavor.length > 0) {
            officialCards[i].ability = officialCards[i].flavor;
        }
        officialCards[i].flavor = officialCards[i].flavor.replace("<span>", "").replace("</span>", "");
        delete officialCards[i].flavor;
        // Remove unreleased cards
        if (officialCards[i].status!== "released") {
            officialCards.splice(i, 1);
            i--;
        }
        // Remove unavailable cards
        if (officialCards[i].source === "None" || officialCards[i].source === "Not Available") {
            officialCards.splice(i, 1);
            i--;
        }
        // Clean up the variants if they exist
        if (officialCards[i].variants && officialCards[i].variants.length > 0) {
            for (let j = 0; j < officialCards[i].variants.length; j++) {
                delete officialCards[i].variants[j].art_filename;
                delete officialCards[i].variants[j].rarity;
                delete officialCards[i].variants[j].rarity_slug;
                delete officialCards[i].variants[j].status;
                delete officialCards[i].variants[j].full_description;
                delete officialCards[i].variants[j].inker;
                delete officialCards[i].variants[j].sketcher;
                delete officialCards[i].variants[j].colorist;
                delete officialCards[i].variants[j].possession;
                delete officialCards[i].variants[j].usage_count;
                delete officialCards[i].variants[j].ReleaseDate;
                delete officialCards[i].variants[j].CollectorsQualityDefId;
                delete officialCards[i].variants[j].UseIfOwn;
                delete officialCards[i].variants[j].PossesionShare;
                delete officialCards[i].variants[j].UsageShare;
            }
        }
        // Remove unnecessary properties
        delete officialCards[i].alternate_art;
        delete officialCards[i].source;
        delete officialCards[i].source_slug;
        delete officialCards[i].tags;
        delete officialCards[i].rarity;
        delete officialCards[i].rarity_slug;
        delete officialCards[i].difficulty;
        delete officialCards[i].sketcher;
        delete officialCards[i].inker;
        delete officialCards[i].colorist;
    }
    return officialCards;
}

async function getOfficialLocations() {
    let officialLocations = fetchOfficials("locations", LOCATIONS_API_URL);
    return officialLocations;
}

async function fetchOfficials(type, url) {
    try {
        const proxyUrl = PROXY_URL + encodeURIComponent(url);
        const response = await fetch(proxyUrl);
        const text = await response.text();
        try {
            const parsed = JSON.parse(text);
            return parsed.success?.[type] || [];
        } catch (jsonError) {
            console.error("Response is not a valid json:", text);
            return [];
        }
    } catch (error) {
        console.error("Error loading ", type, " from Snap Zone:", error);
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