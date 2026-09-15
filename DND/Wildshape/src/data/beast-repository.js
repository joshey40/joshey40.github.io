import { BEAST_API_URL, USE_MOCK_DATA } from "../config.js";
import { mockBeasts } from "./mock-beasts.js";
import { toBeast } from "../models/beast.js";

/** Returns all Beasts. Adapt only this file if the API changes. */
export async function getBeasts() {
  if (USE_MOCK_DATA) return mockBeasts.map(toBeast);
  const beasts = [];
  let pageUrl = BEAST_API_URL;
  while (pageUrl) {
    const response = await fetch(pageUrl);
    if (!response.ok) throw new Error(`Could not load Beasts (${response.status}).`);
    const page = await response.json();
    if (!Array.isArray(page.results)) throw new Error("The Open5e response does not contain a Beast list.");
    beasts.push(...page.results);
    pageUrl = page.next;
  }
  return beasts.map(toBeast);
}
