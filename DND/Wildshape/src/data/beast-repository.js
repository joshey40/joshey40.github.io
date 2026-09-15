import { BEAST_API_URL, USE_MOCK_DATA } from "../config.js";
import { mockBeasts } from "./mock-beasts.js";
import { toBeast } from "../models/beast.js";

/** Liefert alle Beasts. Passe nur diese Datei an, wenn die konkrete API feststeht. */
export async function getBeasts() {
  if (USE_MOCK_DATA) return mockBeasts.map(toBeast);
  const beasts = [];
  let pageUrl = BEAST_API_URL;
  while (pageUrl) {
    const response = await fetch(pageUrl);
    if (!response.ok) throw new Error(`Beasts konnten nicht geladen werden (${response.status}).`);
    const page = await response.json();
    if (!Array.isArray(page.results)) throw new Error("Die Open5e-Antwort enthält keine Beast-Liste.");
    beasts.push(...page.results);
    pageUrl = page.next;
  }
  return beasts.map(toBeast);
}
