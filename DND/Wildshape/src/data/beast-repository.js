import { BEAST_API_URL, USE_MOCK_DATA } from "../config.js";
import { mockBeasts } from "./mock-beasts.js";
import { toBeast } from "../models/beast.js";

/** Liefert alle Beasts. Passe nur diese Datei an, wenn die konkrete API feststeht. */
export async function getBeasts() {
  if (USE_MOCK_DATA) return mockBeasts.map(toBeast);
  const response = await fetch(BEAST_API_URL);
  if (!response.ok) throw new Error(`Beasts konnten nicht geladen werden (${response.status}).`);
  const payload = await response.json();
  // Ggf. an das tatsächliche Antwortformat anpassen, z. B. payload.results.
  const beasts = Array.isArray(payload) ? payload : payload.results;
  if (!Array.isArray(beasts)) throw new Error("Die API-Antwort enthält keine Beast-Liste.");
  return beasts.map(toBeast);
}
