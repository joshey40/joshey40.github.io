import { formatCR, getWildshapeArmorClass } from "../domain/wildshape.js";

export function renderBeastDetail(container, beast, character, onHpChange) {
  if (!beast) { container.innerHTML = '<p class="empty-detail">Select a Beast from the list.</p>'; return; }
  const abilityNames = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };
  const abilities = { ...beast.abilities, int: character.abilities.int, wis: character.abilities.wis, cha: character.abilities.cha };
  const abilityHtml = Object.entries(abilities).map(([key, value]) => `<div class="stat"><span>${abilityNames[key]}</span><strong>${value}</strong></div>`).join("");
  const entries = (items) => items.map((item) => `<div class="action"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p></div>`).join("");
  container.innerHTML = `
    <div class="detail-title"><div><h2>${escapeHtml(beast.name)}</h2><p class="header-copy">${escapeHtml(beast.size)} Beast</p></div><span class="tag">CR ${formatCR(beast.challengeRating)}</span></div>
    <div class="stat-grid"><div class="stat"><span>AC</span><strong>${getWildshapeArmorClass(beast, character.isMoonDruid, character.abilities.wis, character.bonusAc)}</strong></div><div class="stat resource-stat"><span>HP <small>/ ${character.maxHp || "-"}</small></span><div class="resource-control"><button class="resource-button" type="button" data-hp-change="-1" aria-label="Decrease hit points">-</button><strong>${character.hp}</strong><button class="resource-button" type="button" data-hp-change="1" aria-label="Increase hit points">+</button></div></div><div class="stat resource-stat"><span>Temp HP</span><div class="resource-control"><button class="resource-button" type="button" data-temp-hp-change="-1" aria-label="Decrease temporary hit points">-</button><strong>${character.tempHp}</strong><button class="resource-button" type="button" data-temp-hp-change="1" aria-label="Increase temporary hit points">+</button></div></div><div class="stat speed-stat"><span>Speed</span><strong>${Object.entries(beast.speed).map(([k,v]) => `${k} ${v} ${beast.speedUnit}`).join(", ")}</strong></div></div>
    <div class="stat-grid">${abilityHtml}</div>
    ${beast.traits.length ? `<h3>Traits</h3>${entries(beast.traits)}` : ""}
    <h3>Actions</h3>${entries(beast.actions)}`;
  container.querySelectorAll("[data-hp-change]").forEach((button) => button.addEventListener("click", () => onHpChange(Number(button.dataset.hpChange), false)));
  container.querySelectorAll("[data-temp-hp-change]").forEach((button) => button.addEventListener("click", () => onHpChange(Number(button.dataset.tempHpChange), true)));
}

function escapeHtml(value) { const element = document.createElement("div"); element.textContent = value; return element.innerHTML; }
