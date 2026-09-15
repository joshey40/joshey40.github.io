import { formatCR, getWildshapeArmorClass } from "../domain/wildshape.js";

export function renderBeastDetail(container, beast, character, onHpChange) {
  if (!beast) { container.innerHTML = '<p class="empty-detail">Select a Beast from the list.</p>'; return; }
  const abilityNames = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };
  const abilities = { ...beast.abilities, int: character.abilities.int, wis: character.abilities.wis, cha: character.abilities.cha };
  const abilityHtml = Object.entries(abilities).map(([key, value]) => `<div class="stat"><span>${abilityNames[key]}</span><strong>${value} / ${formatModifier(modifier(value))}</strong></div>`).join("");
  const savingThrowHtml = Object.keys(abilityNames).map((ability) => {
    const characterValue = modifier(abilities[ability]) + proficiencyBonus(character.savingThrowProficiencies, ability, character.proficiencyBonus) + character.savingThrowBonuses[ability];
    const finalValue = Math.max(characterValue, Number(beast.savingThrows[ability]) || 0);
    return `<div class="bonus-value"><span>${abilityNames[ability]}:</span><strong>${formatModifier(finalValue)}</strong></div>`;
  }).join("");
  const skillAbilities = { acrobatics: "dex", "animal_handling": "wis", arcana: "int", athletics: "str", deception: "cha", history: "int", insight: "wis", intimidation: "cha", investigation: "int", medicine: "wis", nature: "int", perception: "wis", performance: "cha", persuasion: "cha", religion: "int", "sleight_of_hand": "dex", stealth: "dex", survival: "wis" };
  const abilityCheckHtml = Object.entries(skillAbilities).map(([skill, ability]) => {
    const characterValue = modifier(abilities[ability]) + proficiencyBonus(character.skillProficiencies, skill, character.proficiencyBonus) + character.skillBonuses[skill];
    const finalValue = Math.max(characterValue, Number(beast.skillBonuses[skill]) || 0);
    return `<div class="bonus-value"><span>${skillLabel(skill)}:</span><strong>${formatModifier(finalValue)}</strong></div>`;
  }).join("");
  const entries = (items) => items.map((item) => `<div class="action"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p></div>`).join("");
  const properties = [
    ["Senses", beast.senses], ["Resistances", beast.resistances], ["Immunities", beast.immunities],
    ["Vulnerabilities", beast.vulnerabilities], ["Languages", beast.languages],
  ].filter(([, values]) => values?.length).map(([label, values]) => `<p class="beast-property"><strong>${label}:</strong> ${escapeHtml(values.join("; "))}</p>`).join("");
  container.innerHTML = `
    <div class="detail-title"><div><h2>${escapeHtml(beast.name)}</h2><p class="header-copy">${escapeHtml(beast.size)} Beast</p></div><span class="tag">CR ${formatCR(beast.challengeRating)}</span></div>
    <div class="stat-grid"><div class="stat"><span>AC</span><strong>${getWildshapeArmorClass(beast, character.isMoonDruid, character.abilities.wis, character.bonusAc)}</strong></div><div class="stat resource-stat"><span>HP <small>/ ${character.maxHp || "-"}</small></span><div class="resource-control"><button class="resource-button" type="button" data-hp-change="-1" aria-label="Decrease hit points">-</button><strong>${character.hp}</strong><button class="resource-button" type="button" data-hp-change="1" aria-label="Increase hit points">+</button></div></div><div class="stat resource-stat"><span>Temp HP</span><div class="resource-control"><button class="resource-button" type="button" data-temp-hp-change="-1" aria-label="Decrease temporary hit points">-</button><strong>${character.tempHp}</strong><button class="resource-button" type="button" data-temp-hp-change="1" aria-label="Increase temporary hit points">+</button></div></div><div class="stat speed-stat"><span>Speed</span><strong>${Object.entries(beast.speed).map(([k,v]) => `${k} ${v} ${beast.speedUnit}`).join(", ")}</strong></div></div>
    <div class="stat-grid">${abilityHtml}</div>
    <h3>Saving Throws</h3><div class="bonus-grid saving-grid">${savingThrowHtml}</div>
    <h3>Ability Checks</h3><div class="bonus-grid check-grid">${abilityCheckHtml}</div>
    ${beast.traits.length ? `<h3>Traits</h3>${entries(beast.traits)}` : ""}
    ${properties}
    <h3>Actions</h3>${entries(beast.actions)}`;
  container.querySelectorAll("[data-hp-change]").forEach((button) => button.addEventListener("click", () => onHpChange(Number(button.dataset.hpChange), false)));
  container.querySelectorAll("[data-temp-hp-change]").forEach((button) => button.addEventListener("click", () => onHpChange(Number(button.dataset.tempHpChange), true)));
}

function modifier(score) { return Math.floor((score - 10) / 2); }
function formatModifier(value) { return value >= 0 ? `+${value}` : String(value); }
function proficiencyBonus(proficiencies, key, bonus) {
  const state = proficiencies.find((entry) => entry.key === key)?.state;
  if (state === "expertise") return bonus * 2;
  if (state === "proficient") return bonus;
  if (state === "half") return Math.floor(bonus / 2);
  return 0;
}
function skillKey(skill) { return skill.toLocaleLowerCase("en").replaceAll(" ", "_"); }
function skillLabel(skill) { return skill.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "); }
function escapeHtml(value) { const element = document.createElement("div"); element.textContent = value; return element.innerHTML; }
