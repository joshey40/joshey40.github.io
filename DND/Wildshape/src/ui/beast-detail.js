import { formatCR, formatSpeed, getWildshapeArmorClass, getWildshapeTempHp } from "../domain/wildshape.js";
import { abilities as abilityKeys, getProficiencyValue, modifier, skillAbilities, skillKey } from "../domain/character.js";
import { getAttackFeatures, getDruidTraits } from "../domain/druid-features.js";
import { formatDamage } from "../domain/attacks.js";
import { escapeHtml, formatMarkdown } from "./format.js";

export function renderBeastDetail(container, beast, character, onHpChange) {
  if (!beast) {
    container.classList.remove("is-fullscreen");
    document.body.classList.remove("detail-is-fullscreen");
    container.innerHTML = '<p class="empty-detail">Select a Beast from the list.</p>';
    return;
  }
  const abilities = { ...beast.abilities, int: character.abilities.int, wis: character.abilities.wis, cha: character.abilities.cha };
  const abilityHtml = Object.entries(abilities).map(([key, value]) => `<div class="stat"><span>${key.toUpperCase()}</span><strong>${value} / ${formatModifier(modifier(value))}</strong></div>`).join("");
  const savingThrowHtml = abilityKeys.map((ability) => {
    const characterValue = modifier(abilities[ability]) + proficiencyBonus(character.savingThrowProficiencies, ability, character.proficiencyBonus) + character.savingThrowBonuses[ability];
    let finalValue = Math.max(characterValue, Number(beast.savingThrows[ability]) || characterValue);
    if (character.isMoonDruid && character.druidLevel >= 6 && ability === "con") {
      finalValue += modifier(abilities["wis"]);
    }
    return `<div class="bonus-value"><span>${ability.toUpperCase()}:</span><strong>${formatModifier(finalValue)}</strong></div>`;
  }).join("");
  const skillCheckValues = {};
  const abilityCheckHtml = Object.entries(skillAbilities).map(([name, ability]) => {
    const skill = skillKey(name);
    const characterValue = modifier(abilities[ability]) + proficiencyBonus(character.skillProficiencies, skill, character.proficiencyBonus) + character.skillBonuses[skill];
    let finalValue = Math.max(characterValue, Number(beast.skillBonuses[skill]) || characterValue);
    if (character.magician && (skill === "arcana" || skill === "nature")) {
      finalValue += Math.max(1, modifier(abilities["wis"]));
    }
    skillCheckValues[skill] = finalValue;
    return `<div class="bonus-value"><span>${name}:</span><strong>${formatModifier(finalValue)}</strong></div>`;
  }).join("");
  const properties = [
    {name: "Passives", description: formatPassives(skillCheckValues)},
    {name: "Senses", description: beast.senses},
    {name: "Resistances", description: beast.resistances},
    {name: "Immunities", description: beast.immunities},
    {name: "Vulnerabilities", description: beast.vulnerabilities}
  ];
  const traits = [...getDruidTraits(character), ...(beast.traits ?? [])];
  const wasFullscreen = container.classList.contains("is-fullscreen");
  container.innerHTML = `
    <div class="detail-title"><div><h2>${escapeHtml(beast.name)}</h2><p class="header-copy">${escapeHtml(beast.size)} Beast</p></div><div class="detail-title-actions"><span class="tag${character.isAboveLimit ? ' is-above-limit" title="Not available at your Druid level' : ""}">CR ${formatCR(beast.challengeRating)}</span><button class="detail-fullscreen-button" type="button" data-detail-fullscreen aria-label="Open Beast detail in fullscreen" title="Open fullscreen">⛶</button></div></div>
    <div class="detail-columns">
      <div class="detail-column detail-column--stats">
        <div class="stat-grid">
          <div class="stat"><span>AC</span><strong>${getWildshapeArmorClass(beast, character.isMoonDruid, character.abilities.wis, character.bonusAc)}</strong></div>
          <div class="stat resource-stat"><span>HP <small>/ ${character.maxHp || "-"}</small></span><div class="resource-control"><button class="resource-button" type="button" data-hp-change="-1" aria-label="Decrease hit points">-</button><strong>${character.hp}</strong><button class="resource-button" type="button" data-hp-change="1" aria-label="Increase hit points">+</button><button class="resource-button" type="button" id="reset-hp" aria-label="Reset hit points">↺</button></div></div>
          <div class="stat resource-stat"><span>Temp HP</span><div class="resource-control"><button class="resource-button" type="button" data-temp-hp-change="-1" aria-label="Decrease temporary hit points">-</button><strong>${character.tempHp}</strong><button class="resource-button" type="button" data-temp-hp-change="1" aria-label="Increase temporary hit points">+</button><button class="resource-button" type="button" id="reset-temp-hp" aria-label="Reset temporary hit points">↺</button></div></div>
          <div class="stat speed-stat"><span>Speed</span><strong>${formatSpeed(beast.speed, beast.speedUnit, ", ")}</strong></div>
        </div>
        <div class="stat-grid">${abilityHtml}</div>
        ${formatAttacks(beast.actions.filter((action) => action.attack), getAttackFeatures(character))}
        <hr /><h3>Saving Throws</h3><div class="bonus-grid saving-grid">${savingThrowHtml}</div>
        <hr /><h3>Skills</h3><div class="bonus-grid check-grid">${abilityCheckHtml}</div>
      </div>
      <div class="detail-column detail-column--traits">
        <h3>Properties</h3>
        ${properties.filter((prop) => prop.description && prop.description.length > 0).map((prop) => `<p class="beast-property"><strong>${prop.name}:</strong> ${escapeHtml(Array.isArray(prop.description) ? prop.description.join("; ") : prop.description)}</p>`).join("")}
        ${traits.length ? `<hr /><h3>Traits</h3>` : ""}
        ${traits.map((trait) => `<p class="beast-property"><strong>${escapeHtml(trait.name)}:</strong> ${formatMarkdown(Array.isArray(trait.description) ? trait.description.join("; ") : trait.description)}</p>`).join("")}
        ${beast.actions.length ? `<hr /><h3>Actions</h3>` : ""}
        ${beast.actions.map((action) => `<p class="beast-property"><span class="action-type" data-action-type="${escapeHtml(action.type)}">${actionTypeLabel(action.type)}</span> <strong>${escapeHtml(action.name)}:</strong> ${formatMarkdown(action.description)}</p>`).join("")}
        ${character.notes ? `<hr /><h3 class="notes-heading">Notes</h3><div class="notes">${formatMarkdown(character.notes, true)}</div>` : ""}
      </div>
    </div>`;
  container.querySelectorAll("[data-hp-change]").forEach((button) => button.addEventListener("click", () => onHpChange(Number(button.dataset.hpChange), false)));
  container.querySelectorAll("[data-temp-hp-change]").forEach((button) => button.addEventListener("click", () => onHpChange(Number(button.dataset.tempHpChange), true)));
  container.querySelector("#reset-temp-hp").addEventListener("click", () => {onHpChange(getWildshapeTempHp(character.druidLevel, character.isMoonDruid) - character.tempHp, true)});
  container.querySelector("#reset-hp").addEventListener("click", () => {onHpChange(character.maxHp - character.hp, false)});
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

function formatAttacks(actions, features) {
  if (!actions.length) return "";
  const rows = actions.map(({ name, attack }) => `<div class="attack">
    <div class="attack__main"><strong>${escapeHtml(name)}</strong><span>+${attack.toHit}</span><span>${escapeHtml(attack.distance)}</span><span>${escapeHtml(formatDamage(attack.damage))} <small>(${attack.damage.reduce((sum, part) => sum + part.average, 0)})</small></span></div>
    ${attack.notes.map((note) => `<div class="attack__note">${escapeHtml(note)}</div>`).join("")}
  </div>`).join("");
  const featureHtml = features.map((feature) => `<div class="attack__feature"><strong>${escapeHtml(feature.name)}:</strong> ${escapeHtml(feature.text)}</div>`).join("");
  return `<hr /><h3>Attacks</h3><div class="attack-list">${rows}${featureHtml}</div>`;
}
function formatModifier(value) { return value >= 0 ? `+${value}` : String(value); }
function proficiencyBonus(proficiencies, key, bonus) { return getProficiencyValue(proficiencies.find((entry) => entry.key === key)?.state, bonus); }
function actionTypeLabel(type) { return ({ ACTION: "Action", BONUS_ACTION: "Bonus Action", REACTION: "Reaction" }[type] ?? escapeHtml(type.toLocaleLowerCase("en").split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "))); }
function formatPassives(passives = {}) {
  const values = [["Perception", passives.perception], ["Investigation", passives.investigation], ["Insight", passives.insight]].filter(([, value]) => Number.isFinite(value));
  return values.length ? values.map(([name, value]) => `${name} ${10 + value}`).join(", ") : "";
}
