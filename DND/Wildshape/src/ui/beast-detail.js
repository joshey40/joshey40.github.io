import { formatCR } from "../domain/wildshape.js";

export function renderBeastDetail(container, beast) {
  if (!beast) { container.innerHTML = '<p class="empty-detail">Wähle eine Tierform aus der Liste.</p>'; return; }
  const abilityNames = { str: "ST", dex: "GE", con: "KO", int: "IN", wis: "WE", cha: "CH" };
  const abilityHtml = Object.entries(beast.abilities).map(([key, value]) => `<div class="stat"><span>${abilityNames[key]}</span><strong>${value}</strong></div>`).join("");
  const entries = (items) => items.map((item) => `<div class="action"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p></div>`).join("");
  container.innerHTML = `
    <div class="detail-title"><div><h2>${escapeHtml(beast.name)}</h2><p class="header-copy">${escapeHtml(beast.size)} Beast</p></div><span class="tag">HG ${formatCR(beast.challengeRating)}</span></div>
    <div class="stat-grid"><div class="stat"><span>RK</span><strong>${beast.armorClass}</strong></div><div class="stat"><span>TP</span><strong>${beast.hitPoints}</strong></div><div class="stat"><span>Bewegung</span><strong>${Object.entries(beast.speed).map(([k,v]) => `${k} ${v} m`).join(", ")}</strong></div></div>
    <div class="stat-grid">${abilityHtml}</div>
    ${beast.traits.length ? `<h3>Merkmale</h3>${entries(beast.traits)}` : ""}
    <h3>Aktionen</h3>${entries(beast.actions)}`;
}

function escapeHtml(value) { const element = document.createElement("div"); element.textContent = value; return element.innerHTML; }
