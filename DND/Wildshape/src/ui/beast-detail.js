import { formatCR, getWildshapeArmorClass } from "../domain/wildshape.js";

export function renderBeastDetail(container, beast, character, onHpChange) {
  if (!beast) {
    container.classList.remove("is-fullscreen");
    document.body.classList.remove("detail-is-fullscreen");
    container.innerHTML = '<p class="empty-detail">Select a Beast from the list.</p>';
    return;
  }
  const abilityNames = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };
  const abilities = { ...beast.abilities, int: character.abilities.int, wis: character.abilities.wis, cha: character.abilities.cha };
  const abilityHtml = Object.entries(abilities).map(([key, value]) => `<div class="stat"><span>${abilityNames[key]}</span><strong>${value} / ${formatModifier(modifier(value))}</strong></div>`).join("");
  const savingThrowHtml = Object.keys(abilityNames).map((ability) => {
    const characterValue = modifier(abilities[ability]) + proficiencyBonus(character.savingThrowProficiencies, ability, character.proficiencyBonus) + character.savingThrowBonuses[ability];
    let finalValue = Math.max(characterValue, Number(beast.savingThrows[ability]) || characterValue);
    if (character.isMoonDruid && character.druidLevel >= 6 && ability === "con") {
      finalValue += modifier(abilities["wis"]);
    }
    return `<div class="bonus-value"><span>${abilityNames[ability]}:</span><strong>${formatModifier(finalValue)}</strong></div>`;
  }).join("");
  const skillAbilities = { acrobatics: "dex", "animal_handling": "wis", arcana: "int", athletics: "str", deception: "cha", history: "int", insight: "wis", intimidation: "cha", investigation: "int", medicine: "wis", nature: "int", perception: "wis", performance: "cha", persuasion: "cha", religion: "int", "sleight_of_hand": "dex", stealth: "dex", survival: "wis" };
  const skillCheckValues = {};
  const abilityCheckHtml = Object.entries(skillAbilities).map(([skill, ability]) => {
    const characterValue = modifier(abilities[ability]) + proficiencyBonus(character.skillProficiencies, skill, character.proficiencyBonus) + character.skillBonuses[skill];
    let finalValue = Math.max(characterValue, Number(beast.skillBonuses[skill]) || characterValue);
    if (character.magician && (skill === "arcana" || skill === "nature")) {
      finalValue += modifier(abilities["wis"]);
    }
    skillCheckValues[skill] = finalValue;
    return `<div class="bonus-value"><span>${skillLabel(skill)}:</span><strong>${formatModifier(finalValue)}</strong></div>`;
  }).join("");
  const entries = (items) => items.map((item) => `<div class="action"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p></div>`).join("");
  const properties = [
    ["Passives", formatPassives(skillCheckValues)],
    ["Senses", beast.senses],
    ["Resistances", beast.resistances],
    ["Immunities", beast.immunities],
    ["Vulnerabilities", beast.vulnerabilities]
  ].filter(([, values]) => values?.length).map(([label, values]) => `<p class="beast-property"><strong>${label}:</strong> ${escapeHtml(Array.isArray(values) ? values.join("; ") : values)}</p>`).join("");
  const characterTraits = [];
  if (character.isMoonDruid && character.druidLevel >= 2) {
    if (character.druidLevel < 5) characterTraits.push({ name: "Circle of the Moon Spells", description: "You can cast the following spells in Wild Shape: Cure Wounds, Flame Blade, Moonbeam and Starry Wisp." });
    else if (character.druidLevel < 7) characterTraits.push({ name: "Circle of the Moon Spells", description: "You can cast the following spells in Wild Shape: Cure Wounds, lame Blade, Moonbeam, Starry Wisp and Conjure Animals." });
    else if (character.druidLevel < 9) characterTraits.push({ name: "Circle of the Moon Spells", description: "You can cast the following spells in Wild Shape: Cure Wounds, Flame Blade, Moonbeam, Starry Wisp, Conjure Animals and Fount of Moonlight." });
    else characterTraits.push({ name: "Circle of the Moon Spells", description: "You can cast the following spells in Wild Shape: Cure Wounds, Flame Blade, Moonbeam, Starry Wisp, Conjure Animals, Fount of Moonlight and Mass Cure Wounds." });
  }
  if (character.isMoonDruid && character.druidLevel >= 6) {
    if (character.druidLevel < 14) characterTraits.push({ name: "Lunar Radiance", description: "Your attacks can deal its normal damage type or Radiant damage. You make this choice each time you hit with those attacks." });
    else characterTraits.push({ name: "Improved Lunar Radiance", description: "Your attacks can deal its normal damage type or Radiant damage. You make this choice each time you hit with those attacks. Once per turn, you can deal an extra 2d10 Radiant damage." });
  }
  if (character.isMoonDruid && character.druidLevel >= 10) {
    if (character.druidLevel < 14) characterTraits.push({ name: "Moonlight Step", description: "You can use a bonus action to teleport up to 30 feet to an unoccupied space you can see, and you have Advantage on the next attack roll you make before the end of this turn.\nYou can use this feature a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a Long Rest. You can also regain uses by expending a level 2+ spell slot for each use you want to restore (no action required)." });
    else  characterTraits.push({ name: "Shared Moonlight Step", description: "You can use a bonus action to teleport up to 30 feet to an unoccupied space you can see, and you have Advantage on the next attack roll you make before the end of this turn.\n You can teleport one willing creature with you. That creature must be within 10 feet of you, and you teleport it to an unoccupied space you can see within 10 feet of your destination space.\nYou can use this feature a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a Long Rest. You can also regain uses by expending a level 2+ spell slot for each use you want to restore (no action required)." });
  } 
  if (character.primalStrike && character.druidLevel >= 7) {
    const dice = character.druidLevel >= 15 ? "2d8" : "1d8";
    characterTraits.push({ name: "Primal Strike", description: `Once on each of your turns when you hit a creature, you can cause the target to take an extra ${dice} Cold, Fire, Lightning, or Thunder damage (choose when you hit).` });
  }
  if (character.druidLevel >= 18) characterTraits.push({ name: "Beast Spells", description: "You can cast spells, except for any spell that has a Material component with a cost specified or that consumes its Material component." });
  
  const traits = [...characterTraits, ...(beast.traits ?? [])];
  const wasFullscreen = container.classList.contains("is-fullscreen");
  container.innerHTML = `
    <div class="detail-title"><div><h2>${escapeHtml(beast.name)}</h2><p class="header-copy">${escapeHtml(beast.size)} Beast</p></div><div class="detail-title-actions"><span class="tag">CR ${formatCR(beast.challengeRating)}</span><button class="detail-fullscreen-button" type="button" data-detail-fullscreen aria-label="Open Beast detail in fullscreen" title="Open fullscreen">⛶</button></div></div>
    <div class="detail-columns">
      <div class="detail-column detail-column--stats">
        <div class="stat-grid">
          <div class="stat"><span>AC</span><strong>${getWildshapeArmorClass(beast, character.isMoonDruid, character.abilities.wis, character.bonusAc)}</strong></div>
          <div class="stat resource-stat"><span>HP <small>/ ${character.maxHp || "-"}</small></span><div class="resource-control"><button class="resource-button" type="button" data-hp-change="-1" aria-label="Decrease hit points">-</button><strong>${character.hp}</strong><button class="resource-button" type="button" data-hp-change="1" aria-label="Increase hit points">+</button></div></div>
          <div class="stat resource-stat"><span>Temp HP</span><div class="resource-control"><button class="resource-button" type="button" data-temp-hp-change="-1" aria-label="Decrease temporary hit points">-</button><strong>${character.tempHp}</strong><button class="resource-button" type="button" data-temp-hp-change="1" aria-label="Increase temporary hit points">+</button><button class="resource-button" type="button" id="reset-temp-hp" aria-label="Reset temporary hit points">↺</button></div></div>
          <div class="stat speed-stat"><span>Speed</span><strong>${Object.entries(beast.speed).map(([k,v]) => `${k} ${v} ${beast.speedUnit}`).join(", ")}</strong></div>
        </div>
        <div class="stat-grid">${abilityHtml}</div>
        <hr /><h3>Saving Throws</h3><div class="bonus-grid saving-grid">${savingThrowHtml}</div>
        <hr /><h3>Skills</h3><div class="bonus-grid check-grid">${abilityCheckHtml}</div>
      </div>
      <div class="detail-column detail-column--traits">
        <h3>Properties</h3>
        ${properties}
        ${traits.length ? `<hr /><h3>Traits</h3>${entries(traits)}` : ""}
        <hr /><h3 class="actions-heading">Actions</h3>${entries(beast.actions)}
        ${character.notes ? `<hr /><h3 class="notes-heading">Notes</h3><div class="notes">${formatNotes(character.notes)}</div>` : ""}
      </div>
    </div>`;
  container.querySelectorAll("[data-hp-change]").forEach((button) => button.addEventListener("click", () => onHpChange(Number(button.dataset.hpChange), false)));
  container.querySelectorAll("[data-temp-hp-change]").forEach((button) => button.addEventListener("click", () => onHpChange(Number(button.dataset.tempHpChange), true)));
  container.querySelector("#reset-temp-hp").addEventListener("click", () => {onHpChange((character.isMoonDruid ? character.druidLevel * 3 : character.druidLevel) - character.tempHp, true)});
  const fullscreenButton = container.querySelector("[data-detail-fullscreen]");
  fullscreenButton.addEventListener("click", () => toggleFullscreen(container));
  updateFullscreenButton(fullscreenButton, wasFullscreen);
}

function toggleFullscreen(container) {
  const isFullscreen = container.classList.toggle("is-fullscreen");
  document.body.classList.toggle("detail-is-fullscreen", isFullscreen);
  updateFullscreenButton(container.querySelector("[data-detail-fullscreen]"), isFullscreen);
}

function updateFullscreenButton(button, isFullscreen) {
  button.textContent = isFullscreen ? "×" : "⛶";
  button.setAttribute("aria-label", isFullscreen ? "Close fullscreen Beast detail" : "Open Beast detail in fullscreen");
  button.title = isFullscreen ? "Close fullscreen" : "Open fullscreen";
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const container = document.querySelector("#detail-panel.is-fullscreen");
  if (container) toggleFullscreen(container);
});

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
function formatPassives(passives = {}) {
  const values = [["Perception", passives.perception], ["Investigation", passives.investigation], ["Insight", passives.insight]].filter(([, value]) => Number.isFinite(value));
  return values.length ? values.map(([name, value]) => `${name} ${10 + value}`).join(", ") : "";
}
function escapeHtml(value) { const element = document.createElement("div"); element.textContent = value; return element.innerHTML; }
function formatNotes(value) {
  const escaped = escapeHtml(value ?? "");
  return escaped
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}