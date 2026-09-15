import { getBeasts } from "./data/beast-repository.js";
import { getWildshapeLimit } from "./domain/wildshape.js";
import { renderBeastList } from "./ui/beast-list.js";
import { renderBeastDetail } from "./ui/beast-detail.js";

const state = { beasts: [], selectedId: null, sortDirection: "asc", tempHp: 0 };
const CHARACTER_PROFILE_STORAGE_KEY = "wildshape-manager-character-profile";
const skills = ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"];
const characterFieldIds = ["character-level", "druid-level", "bonus-ac", "character-hp", "character-max-hp", "ability-str", "ability-dex", "ability-con", "ability-int", "ability-wis", "ability-cha", "saving-bonus-str", "saving-bonus-dex", "saving-bonus-con", "saving-bonus-int", "saving-bonus-wis", "saving-bonus-cha"];
const elements = {
  search: document.querySelector("#search-input"), characterLevel: document.querySelector("#character-level"), druidLevel: document.querySelector("#druid-level"), bonusAc: document.querySelector("#bonus-ac"),
  moonDruid: document.querySelector("#moon-druid"), characterHp: document.querySelector("#character-hp"), characterMaxHp: document.querySelector("#character-max-hp"),
  abilityInt: document.querySelector("#ability-int"), abilityWis: document.querySelector("#ability-wis"), abilityCha: document.querySelector("#ability-cha"),
  crMin: document.querySelector("#cr-min"), crMax: document.querySelector("#cr-max"),
  acMin: document.querySelector("#ac-min"), acMax: document.querySelector("#ac-max"),
  movement: document.querySelector("#movement-filter"), size: document.querySelector("#size-filter"),
  resistance: document.querySelector("#resistance-filter"), sense: document.querySelector("#sense-filter"),
  sort: document.querySelector("#sort-select"), direction: document.querySelector("#sort-direction"),
  count: document.querySelector("#result-count"),
  list: document.querySelector("#beast-list"), detail: document.querySelector("#detail-panel"),
};

for (const control of Object.values(elements)) if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) if (control !== elements.druidLevel) control.addEventListener("input", render);
elements.druidLevel.addEventListener("input", () => {
  if (Number(elements.characterLevel.value) < Number(elements.druidLevel.value)) elements.characterLevel.value = elements.druidLevel.value;
  render();
});
elements.direction.addEventListener("input", () => {
  state.sortDirection = elements.direction.value;
  render();
});

async function init() {
  try {
    state.beasts = await getBeasts();
    fillOptions(elements.size, valuesFor("size"));
    fillChallengeRatingOptions();
    fillMultiSelect(elements.resistance, valuesFor("resistances"));
    fillMultiSelect(elements.sense, valuesFor("senses"));
    fillMultiSelect(elements.movement, [...new Set(state.beasts.flatMap((beast) => Object.keys(beast.speed)))].sort());
    fillSkillBonusOptions();
    setupProficiencyControls();
    for (const bonusInput of document.querySelectorAll('input[id^="saving-bonus-"], input[id^="skill-bonus-"]')) bonusInput.addEventListener("input", render);
    loadCharacterProfile();
    render();
  } catch (error) {
    console.error("Could not load Beasts:", error);
    elements.list.innerHTML = '<p class="empty-detail">The Beast data could not be loaded. Please try again later.</p>';
  }
}

function render() {
  saveCharacterProfile();
  const level = Number(elements.druidLevel.value), isMoonDruid = elements.moonDruid.checked, query = elements.search.value.trim().toLocaleLowerCase();
  const characterLimit = getWildshapeLimit(level, isMoonDruid);
  const crMax = elements.crMax.value === "character" ? characterLimit?.maxCR : elements.crMax.value;
  let visible = state.beasts.filter((beast) => !query || beast.name.toLocaleLowerCase().includes(query));
  visible = visible.filter((beast) => inRange(beast.challengeRating, elements.crMin.value, crMax));
  visible = visible.filter((beast) => inRange(beast.armorClass, elements.acMin.value, elements.acMax.value));
  if (elements.size.value !== "all") visible = visible.filter((beast) => beast.size === elements.size.value);
  visible = visible.filter((beast) => matchesAll(beast.resistances, selectedValues(elements.resistance)));
  visible = visible.filter((beast) => matchesAll(beast.senses, selectedValues(elements.sense)));
  visible = visible.filter((beast) => matchesAll(Object.keys(beast.speed), selectedValues(elements.movement)));
  visible.sort(comparator(elements.sort.value, state.sortDirection));
  if (state.selectedId && !visible.some((beast) => beast.id === state.selectedId)) state.selectedId = null;
  elements.count.textContent = `${visible.length} result${visible.length === 1 ? "" : "s"}`;
  renderBeastList(elements.list, visible, state.selectedId, (id) => {
    state.selectedId = id;
    state.tempHp = level * (isMoonDruid ? 3 : 1);
    render();
  });
  const selectedBeast = state.beasts.find((beast) => beast.id === state.selectedId);
  const abilities = {
    str: Number(document.querySelector("#ability-str").value) || 0,
    dex: Number(document.querySelector("#ability-dex").value) || 0,
    con: Number(document.querySelector("#ability-con").value) || 0,
    int: Number(elements.abilityInt.value) || 0,
    wis: Number(elements.abilityWis.value) || 0,
    cha: Number(elements.abilityCha.value) || 0,
  };
  renderBeastDetail(elements.detail, selectedBeast, {
    hp: Number(elements.characterHp.value) || 0,
    maxHp: Number(elements.characterMaxHp.value) || 0,
    tempHp: state.tempHp,
    isMoonDruid,
    bonusAc: Number(elements.bonusAc.value) || 0,
    abilities,
    proficiencyBonus: getProficiencyBonus(Number(elements.characterLevel.value)),
    savingThrowProficiencies: proficiencyStates("saving-throw"),
    savingThrowBonuses: Object.fromEntries(["str", "dex", "con", "int", "wis", "cha"].map((ability) => [ability, Number(document.querySelector(`#saving-bonus-${ability}`).value) || 0])),
    skillProficiencies: proficiencyStates("skill"),
    skillBonuses: Object.fromEntries(skills.map((skill) => [skillKey(skill), Number(document.querySelector(`#skill-bonus-${skillKey(skill)}`).value) || 0])),
  }, (change, isTempHp) => {
    if (isTempHp) state.tempHp = Math.max(0, state.tempHp + change);
    else elements.characterHp.value = Math.max(0, (Number(elements.characterHp.value) || 0) + change);
    render();
  });
}

function valuesFor(property) { return [...new Set(state.beasts.flatMap((beast) => Array.isArray(beast[property]) ? beast[property] : [beast[property]]))].filter(Boolean).sort(); }
function fillOptions(select, values) { for (const value of values) select.add(new Option(value, value)); }
function fillMultiSelect(container, values) {
  const options = document.createElement("div");
  options.className = "multi-select__options";
  for (const value of values) {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = value;
    checkbox.addEventListener("input", render);
    label.append(checkbox, document.createTextNode(` ${value}`));
    options.append(label);
  }
  container.append(options);
}
function fillChallengeRatingOptions() {
  const ratings = [["Any", ""], ["0", "0"], ["1/8", "0.125"], ["1/4", "0.25"], ["1/2", "0.5"], ...Array.from({ length: 30 }, (_, index) => [String(index + 1), String(index + 1)])];
  for (const [label, value] of ratings) elements.crMin.add(new Option(label, value));
  for (const [label, value] of [["Any", ""], ["Char", "character"], ...ratings.slice(1)]) elements.crMax.add(new Option(label, value));
  elements.crMax.value = "";
}
function selectedValues(container) { return [...container.querySelectorAll('input:checked')].map((input) => input.value); }
function proficiencyStates(name) { return [...document.querySelectorAll(`button[data-proficiency-name="${name}"]`)].map((button) => ({ key: button.dataset.proficiencyKey, state: button.dataset.proficiency })); }
function matchesAll(values, requested) { return requested.every((value) => values.includes(value)); }
function inRange(value, min, max) { return (min === "" || value >= Number(min)) && (max === "" || value <= Number(max)); }
function getProficiencyBonus(level) { return level > 0 ? Math.floor((level - 1) / 4) + 2 : 2; }
function skillKey(skill) { return skill.toLocaleLowerCase("en").replaceAll(" ", "_"); }
function fillSkillBonusOptions() {
  for (const label of document.querySelectorAll(".skill-options label")) {
    const input = label.querySelector('input[name="skill"]');
    const skill = input.value;
    const name = document.createElement("span");
    name.className = "skill-proficiency-name";
    name.append(input, document.createTextNode(` ${skill}`));
    const bonusInput = document.createElement("input");
    bonusInput.id = `skill-bonus-${skillKey(skill)}`;
    bonusInput.type = "number";
    bonusInput.value = "0";
    bonusInput.setAttribute("aria-label", `Additional ${skill} bonus`);
    label.replaceChildren(name, bonusInput);
  }
}
function setupProficiencyControls() {
  for (const input of document.querySelectorAll('input[name="skill"], input[name="saving-throw"]')) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "proficiency-toggle";
    button.dataset.proficiencyName = input.name;
    button.dataset.proficiencyKey = input.name === "skill" ? skillKey(input.value) : input.value;
    button.dataset.proficiency = "none";
    button.setAttribute("aria-label", `${input.value} proficiency: none`);
    button.addEventListener("click", () => cycleProficiency(button));
    input.replaceWith(button);
  }
}
function saveCharacterProfile() {
  const values = Object.fromEntries([...characterFieldIds, ...skills.map((skill) => `skill-bonus-${skillKey(skill)}`)].map((id) => [id, document.querySelector(`#${id}`)?.value ?? ""]));
  const profile = {
    values,
    moonDruid: elements.moonDruid.checked,
    savingThrowStates: proficiencyStates("saving-throw"),
    skillStates: proficiencyStates("skill"),
  };
  try { localStorage.setItem(CHARACTER_PROFILE_STORAGE_KEY, JSON.stringify(profile)); } catch (error) { console.warn("Could not save Character Profile:", error); }
}
function loadCharacterProfile() {
  let profile;
  try { profile = JSON.parse(localStorage.getItem(CHARACTER_PROFILE_STORAGE_KEY) ?? "null"); } catch (error) { return; }
  if (!profile) return;
  for (const [id, value] of Object.entries(profile.values ?? {})) {
    const input = document.querySelector(`#${id}`);
    if (input) input.value = value;
  }
  elements.moonDruid.checked = Boolean(profile.moonDruid);
  for (const entry of profile.savingThrowStates ?? []) {
    const button = document.querySelector(`button[data-proficiency-name="saving-throw"][data-proficiency-key="${entry.key}"]`);
    if (button) button.dataset.proficiency = entry.state;
  }
  for (const entry of profile.skillStates ?? []) {
    const button = document.querySelector(`button[data-proficiency-name="skill"][data-proficiency-key="${entry.key}"]`);
    if (button) button.dataset.proficiency = entry.state;
  }
  if (Number(elements.characterLevel.value) < Number(elements.druidLevel.value)) elements.characterLevel.value = elements.druidLevel.value;
}
function cycleProficiency(button) {
  const states = ["none", "half", "proficient", "expertise"];
  const nextState = states[(states.indexOf(button.dataset.proficiency) + 1) % states.length];
  button.dataset.proficiency = nextState;
  button.setAttribute("aria-label", `${button.dataset.proficiencyKey} proficiency: ${nextState}`);
  render();
}

function comparator(sort, direction) {
  const multiplier = direction === "asc" ? 1 : -1;
  const sizeOrder = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];
  return (a, b) => {
    let result;
    if (sort === "cr") result = a.challengeRating - b.challengeRating;
    else if (sort === "ac") result = a.armorClass - b.armorClass;
    else if (sort === "size") result = sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
    else result = a.name.localeCompare(b.name, "de");
    return result * multiplier || a.name.localeCompare(b.name, "de") * multiplier;
  };
}
init();
