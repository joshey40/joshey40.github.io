import { BEAST_API_URL, USE_MOCK_DATA } from "../config.js";
import { mockBeasts } from "./mock-beasts.js";
import { toBeast } from "../models/beast.js";

const CACHE_STORAGE_KEY = "wildshape-manager-beast-cache";
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Returns all Beasts. Adapt only this file if the API changes. */
export async function getBeasts() {
  if (USE_MOCK_DATA) return mockBeasts.map(toBeast);
  // The raw API response is cached, so changes to toBeast also apply to cached data.
  const cache = readCache();
  if (cache && Date.now() - cache.savedAt < CACHE_MAX_AGE_MS) return cache.results.map(toBeast);
  try {
    const results = await fetchAllPages();
    writeCache(results);
    return results.map(toBeast);
  } catch (error) {
    if (!cache) throw error;
    console.warn("Could not refresh Beasts, using cached data:", error);
    return cache.results.map(toBeast);
  }
}

async function fetchAllPages() {
  const results = [];
  let pageUrl = BEAST_API_URL;
  while (pageUrl) {
    const response = await fetch(pageUrl);
    if (!response.ok) throw new Error(`Could not load Beasts (${response.status}).`);
    const page = await response.json();
    if (!Array.isArray(page.results)) throw new Error("The Open5e response does not contain a Beast list.");
    results.push(...page.results);
    pageUrl = page.next;
  }
  return results;
}

function readCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_STORAGE_KEY) ?? "null");
    return cache?.url === BEAST_API_URL && Array.isArray(cache.results) ? cache : null;
  } catch (error) { return null; }
}
function writeCache(results) {
  try { localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify({ url: BEAST_API_URL, savedAt: Date.now(), results })); } catch (error) { console.warn("Could not cache Beasts:", error); }
}
