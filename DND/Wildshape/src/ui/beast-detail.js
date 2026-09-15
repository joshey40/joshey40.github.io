import { formatCR } from "../domain/wildshape.js";

export function renderBeastDetail(container, beast) {
  if (!beast) { container.innerHTML = '<p class="empty-detail">Select a Beast from the list.</p>'; return; }
  const abilityNames = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };
  const abilityHtml = Object.entries(beast.abilities).map(([key, value]) => `<div class="stat"><span>${abilityNames[key]}</span><strong>${value}</strong></div>`).join("");
  const entries = (items) => items.map((item) => `<div class="action"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p></div>`).join("");
  container.innerHTML = `
    <div class="detail-title"><div><h2>${escapeHtml(beast.name)}</h2><p class="header-copy">${escapeHtml(beast.size)} Beast</p></div><span class="tag">CR ${formatCR(beast.challengeRating)}</span></div>
    <div class="stat-grid"><div class="stat"><span>AC</span><strong>${beast.armorClass}</strong></div><div class="stat"><span>HP</span><strong>${beast.hitPoints}</strong></div><div class="stat"><span>Speed</span><strong>${Object.entries(beast.speed).map(([k,v]) => `${k} ${v} ${beast.speedUnit}`).join(", ")}</strong></div></div>
    <div class="stat-grid">${abilityHtml}</div>
    ${beast.traits.length ? `<h3>Traits</h3>${entries(beast.traits)}` : ""}
    <h3>Actions</h3>${entries(beast.actions)}`;
}

function escapeHtml(value) { const element = document.createElement("div"); element.textContent = value; return element.innerHTML; }
