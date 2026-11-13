import { formatCR, formatSpeed, getWildshapeArmorClass, getWildshapeTempHp } from "../domain/wildshape.js";
import { abilities as abilityKeys, getProficiencyValue, modifier, skillAbilities, skillKey } from "../domain/character.js";
import { getAttackFeatures, getDruidTraits, getSpellAttacks } from "../domain/druid-features.js";
import { formatDamage } from "../domain/attacks.js";
import { escapeHtml, formatMarkdown } from "./format.js";

export function renderBeastDetail(container, beast, character, { onHpChange, onDamage, onSelectForm }) {
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
    <div class="detail-title"><div class="detail-heading">${formatFormTabs(beast, character.knownForms)}<h2>${escapeHtml(beast.name)}</h2><p class="header-copy">${escapeHtml(beast.size)}${beast.challengeRating === null ? "" : " Beast"} · ${escapeHtml(formatSpeed(beast.speed, beast.speedUnit, ", "))}</p></div><div class="detail-title-actions"><span class="tag${character.isAboveLimit ? ' is-above-limit" title="Not available at your Druid level' : ""}">CR ${formatCR(beast.challengeRating)}</span><button class="detail-fullscreen-button" type="button" data-detail-fullscreen aria-label="Open Beast detail in fullscreen" title="Open fullscreen">⛶</button></div></div>
    <div class="detail-columns">
      <div class="detail-column detail-column--stats">
        <div class="stat-grid">
          <div class="stat"><span>AC</span><strong>${getWildshapeArmorClass(beast, character.isMoonDruid, character.abilities.wis, character.bonusAc)}</strong></div>
          <div class="stat resource-stat"><span>HP <small>/ ${character.maxHp || "-"}</small></span><div class="resource-control"><button class="resource-button" type="button" data-hp-change="-1" aria-label="Decrease hit points" title="Decrease HP by 1">-</button><strong>${character.hp}</strong><button class="resource-button" type="button" data-hp-change="1" aria-label="Increase hit points" title="Increase HP by 1">+</button><button class="resource-button" type="button" id="reset-hp" aria-label="Reset hit points" title="Reset HP to Max HP">↺</button></div></div>
          <div class="stat resource-stat"><span>Temp HP</span><div class="resource-control"><button class="resource-button" type="button" data-temp-hp-change="-1" aria-label="Decrease temporary hit points" title="Decrease Temp HP by 1">-</button><strong>${character.tempHp}</strong><button class="resource-button" type="button" data-temp-hp-change="1" aria-label="Increase temporary hit points" title="Increase Temp HP by 1">+</button><button class="resource-button" type="button" id="reset-temp-hp" aria-label="Reset temporary hit points" title="Set Temp HP to ${getWildshapeTempHp(character.druidLevel, character.isMoonDruid)} for a new Wild Shape">↺</button></div></div>
          <form class="stat hp-adjust" data-hp-adjust><input id="hp-amount" type="number" min="1" placeholder="Amount" aria-label="Damage or healing amount" /><button class="hp-adjust__button" type="submit" title="Subtract from Temp HP first, then HP">Damage</button><button class="hp-adjust__button" type="button" data-hp-heal title="Add to HP">Heal</button></form>
        </div>
        <div class="stat-grid ability-grid">${abilityHtml}</div>
        ${formatAttacks([...beast.actions, ...getSpellAttacks(character)], getAttackFeatures(character))}
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
  const applyAmount = (apply) => {
    const amount = Math.floor(Number(container.querySelector("#hp-amount").value));
    if (amount > 0) apply(amount);
    container.querySelector("#hp-amount").focus();
  };
  container.querySelector("[data-hp-adjust]").addEventListener("submit", (event) => {
    event.preventDefault();
    applyAmount(onDamage);
  });
  container.querySelector("[data-hp-heal]").addEventListener("click", () => applyAmount((amount) => onHpChange(amount, false)));
  container.querySelectorAll("[data-form-id]").forEach((button) => button.addEventListener("click", () => {
    onSelectForm(button.dataset.formId);
    container.scrollTop = 0;
  }));
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
  const combatActions = actions.filter((action) => action.attack || action.save);
  if (!combatActions.length) return "";
  const multiattack = actions.find((action) => action.name === "Multiattack");
  const multiattackHtml = multiattack ? formatAttackRow(`<strong>Multiattack</strong><span class="attack__summary"${multiattack.multiattack ? ` title="${escapeHtml(multiattack.description)}"` : ""}>${escapeHtml(multiattack.multiattack?.summary ?? multiattack.description)}</span>`, multiattack.multiattack?.note ? [multiattack.multiattack.note] : []) : "";
  const rows = combatActions.map((action) => {
    const name = `<strong>${escapeHtml(action.name)}${action.type === "ACTION" ? "" : ` <small>${actionTypeLabel(action.type)}</small>`}</strong>`;
    if (action.attack) return formatAttackRow(`${name}<span>${formatModifier(action.attack.toHit)}</span><span>${escapeHtml(action.attack.distance)}</span><span>${formatDamageCell(action.attack.damage)}</span>`, action.attack.notes, action.attack.sources);
    return formatAttackRow(`${name}<span>DC ${action.save.dc}</span><span>${action.save.ability}</span><span>${formatDamageCell(action.save.damage)}</span>`, action.save.notes, action.save.sources);
  }).join("");
  const featureHtml = features.map((feature) => `<div class="attack__feature"><strong>${escapeHtml(feature.name)}:</strong> ${escapeHtml(feature.text)}</div>`).join("");
  return `<hr /><h3>Attacks</h3><div class="attack-list">${multiattackHtml}${rows}${featureHtml}</div>`;
}
function formatAttackRow(mainHtml, notes, sources = {}) {
  return `<div class="attack"><div class="attack__main">${mainHtml}</div>${notes.map((note) => `<div class="attack__note"${sources[note] ? ` title="${escapeHtml(sources[note])}"` : ""}>${escapeHtml(note)}</div>`).join("")}</div>`;
}
function formatFormTabs(beast, knownForms) {
  const others = knownForms.filter((form) => form.id !== beast.id);
  return `<nav class="form-tabs" aria-label="Known forms"><span class="form-tab is-active" aria-current="page">${escapeHtml(beast.name)}</span>${others.map((form) => `<button class="form-tab" type="button" data-form-id="${escapeHtml(form.id)}">${escapeHtml(form.name)}</button>`).join("")}</nav>`;
}
function formatDamageCell(damage) {
  return damage.length ? `${escapeHtml(formatDamage(damage))} <small>(${damage.reduce((sum, part) => sum + part.average, 0)})</small>` : "";
}
function formatModifier(value) { return value >= 0 ? `+${value}` : String(value); }
function proficiencyBonus(proficiencies, key, bonus) { return getProficiencyValue(proficiencies.find((entry) => entry.key === key)?.state, bonus); }
function actionTypeLabel(type) { return ({ ACTION: "Action", BONUS_ACTION: "Bonus Action", REACTION: "Reaction" }[type] ?? escapeHtml(type.toLocaleLowerCase("en").split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "))); }
function formatPassives(passives = {}) {
  const values = [["Perception", passives.perception], ["Investigation", passives.investigation], ["Insight", passives.insight]].filter(([, value]) => Number.isFinite(value));
  return values.length ? values.map(([name, value]) => `${name} ${10 + value}`).join(", ") : "";
}
