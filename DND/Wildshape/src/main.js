import { getBeasts } from "./data/beast-repository.js";
import { getKnownFormsCount, getWildshapeLimit, isWildshapeEligible } from "./domain/wildshape.js";
import { abilities, getProficiencyBonus, skillAbilities, skillKey } from "./domain/character.js";
import { inRange, matchesAll, matchesSearch, meetsMinimums } from "./domain/filters.js";
import { renderBeastList } from "./ui/beast-list.js";
import { renderBeastDetail } from "./ui/beast-detail.js";

const state = { beasts: [], selectedId: null, sortDirection: "asc", tempHp: 0, isLoaded: false };
const CHARACTER_PROFILE_STORAGE_KEY = "wildshape-manager-character-profile";
const BOOKMARKS_STORAGE_KEY = "wildshape-manager-bookmarks";
const skills = Object.keys(skillAbilities);
const characterFieldIds = ["character-level", "druid-level", "bonus-ac", "character-hp", "character-max-hp", ...abilities.map((ability) => `ability-${ability}`), ...abilities.map((ability) => `saving-bonus-${ability}`), "character-notes"];
const elements = {
  search: document.querySelector("#search-input"), searchDetails: document.querySelector("#search-details"), characterLevel: document.querySelector("#character-level"), druidLevel: document.querySelector("#druid-level"), bonusAc: document.querySelector("#bonus-ac"),
  moonDruid: document.querySelector("#moon-druid"), primalStrike: document.querySelector("#primal-strike"), magician: document.querySelector("#magician"),
  characterHp: document.querySelector("#character-hp"), characterMaxHp: document.querySelector("#character-max-hp"),
  crMin: document.querySelector("#cr-min"), crMax: document.querySelector("#cr-max"),
  acMin: document.querySelector("#ac-min"), acMax: document.querySelector("#ac-max"),
  movement: document.querySelector("#movement-filter"), size: document.querySelector("#size-filter"),
  resistance: document.querySelector("#resistance-filter"), sense: document.querySelector("#sense-filter"),
  sort: document.querySelector("#sort-select"), direction: document.querySelector("#sort-direction"),
  count: document.querySelector("#result-count"),
  list: document.querySelector("#beast-list"), detail: document.querySelector("#detail-panel"),
  notes: document.querySelector("#character-notes"),
};

for (const control of Object.values(elements))
  if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)
    if (control !== elements.druidLevel && control !== elements.characterLevel) control.addEventListener("input", render);
for (const input of [elements.druidLevel, elements.characterLevel]) {
  input.addEventListener("input", () => onLevelInput(input));
  input.addEventListener("change", () => {
    input.value = clamp(input.value, 1, 20);
    onLevelInput(input);
  });
}
for (const ability of abilities) {
  const input = document.querySelector(`#ability-${ability}`);
  input.addEventListener("input", () => {
    if (Number(input.value) > 30) input.value = "30";
    render();
  });
  input.addEventListener("change", () => {
    input.value = clamp(input.value, 1, 30);
    render();
  });
}
document.querySelector("#reset-filters").addEventListener("click", resetFilters);
elements.direction.addEventListener("input", () => {
  state.sortDirection = elements.direction.value;
  render();
});

async function init() {
  loadBookmarks();
  fillChallengeRatingOptions();
  fillSkillOptions();
  setupProficiencyControls();
  for (const bonusInput of document.querySelectorAll('input[id^="saving-bonus-"], input[id^="skill-bonus-"]')) bonusInput.addEventListener("input", render);
  loadCharacterProfile();
  render();
  await loadBeasts();
}

async function loadBeasts() {
  elements.list.innerHTML = '<p class="empty-detail">Loading Beasts …</p>';
  try {
    state.beasts = await getBeasts();
  } catch (error) {
    console.error("Could not load Beasts:", error);
    elements.list.innerHTML = '<p class="empty-detail">The Beast data could not be loaded.</p><button class="retry-button" type="button">Try again</button>';
    elements.list.querySelector(".retry-button").addEventListener("click", loadBeasts);
    return;
  }
  fillOptions(elements.size, valuesFor("size"));
  fillMultiSelect(elements.resistance, valuesFor("resistances"));
  fillRangeFilter(elements.sense, keysFor("senseRanges"), "range");
  fillRangeFilter(elements.movement, keysFor("speed"), "speed");
  state.isLoaded = true;
  render();
}

function render() {
  const level = Number(elements.druidLevel.value), isMoonDruid = elements.moonDruid.checked, query = elements.search.value.trim().toLocaleLowerCase();
  elements.moonDruid.disabled = level < 3;
  elements.primalStrike.disabled = level < 7;
  if (level < 3) elements.moonDruid.checked = false;
  if (level < 7) elements.primalStrike.checked = false;
  saveCharacterProfile();
  if (!state.isLoaded) return;
  const characterLimit = getWildshapeLimit(level, isMoonDruid);
  const useCharacterLimit = elements.crMax.value === "character";
  const resistances = selectedValues(elements.resistance), senseMinimums = rangeMinimums(elements.sense), movementMinimums = rangeMinimums(elements.movement);
  const filters = [
    (beast) => matchesSearch(beast, query, elements.searchDetails.checked),
    (beast) => inRange(beast.challengeRating, elements.crMin.value, useCharacterLimit ? "" : elements.crMax.value),
    (beast) => inRange(beast.armorClass, elements.acMin.value, elements.acMax.value),
    (beast) => elements.size.value === "all" || beast.size === elements.size.value,
    (beast) => matchesAll(beast.resistances, resistances),
    (beast) => meetsMinimums(beast.senseRanges, senseMinimums),
    (beast) => meetsMinimums(beast.speed, movementMinimums),
  ];
  const visible = state.beasts.filter((beast) => (!useCharacterLimit || isWildshapeEligible(beast, level, isMoonDruid)) && (state.bookmarks.has(beast.id) || filters.every((matches) => matches(beast))));
  for (const container of [elements.resistance, elements.sense, elements.movement]) updateMultiSelectCount(container);
  visible.sort(comparator(elements.sort.value, state.sortDirection));
  const knownFormsCount = getKnownFormsCount(level);
  const knownForms = document.createElement("span");
  knownForms.className = "known-forms";
  knownForms.classList.toggle("is-over-limit", state.bookmarks.size > knownFormsCount);
  knownForms.textContent = `${state.bookmarks.size}/${knownFormsCount} known form${knownFormsCount === 1 ? "" : "s"}`;
  elements.count.replaceChildren(`${visible.length} result${visible.length === 1 ? "" : "s"} | `, knownForms);
  const isAboveLimit = (beast) => !isWildshapeEligible(beast, level, isMoonDruid);
  const emptyMessage = useCharacterLimit && !characterLimit ? "Wild Shape is available from Druid Level 2." : "No forms match these filters.";
  renderBeastList(elements.list, visible, state.selectedId, state.bookmarks, emptyMessage, isAboveLimit, (id) => {
    state.selectedId = id;
    render();
  }, (id) => toggleBookmark(id));
  const selectedBeast = state.beasts.find((beast) => beast.id === state.selectedId);
  renderBeastDetail(elements.detail, selectedBeast, {
    isAboveLimit: Boolean(selectedBeast) && isAboveLimit(selectedBeast),
    hp: Number(elements.characterHp.value) || 0,
    maxHp: Number(elements.characterMaxHp.value) || 0,
    tempHp: state.tempHp,
    isMoonDruid,
    bonusAc: Number(elements.bonusAc.value) || 0,
    primalStrike: elements.primalStrike.checked,
    magician: elements.magician.checked,
    druidLevel: level,
    abilities: Object.fromEntries(abilities.map((ability) => [ability, Number(document.querySelector(`#ability-${ability}`).value) || 0])),
    proficiencyBonus: getProficiencyBonus(Number(elements.characterLevel.value)),
    savingThrowProficiencies: proficiencyStates("saving-throw"),
    savingThrowBonuses: Object.fromEntries(abilities.map((ability) => [ability, Number(document.querySelector(`#saving-bonus-${ability}`).value) || 0])),
    skillProficiencies: proficiencyStates("skill"),
    skillBonuses: Object.fromEntries(skills.map((skill) => [skillKey(skill), Number(document.querySelector(`#skill-bonus-${skillKey(skill)}`).value) || 0])),
    notes: elements.notes.value,
  }, (change, isTempHp) => {
    if (isTempHp) state.tempHp = Math.max(0, state.tempHp + change);
    else elements.characterHp.value = Math.max(0, (Number(elements.characterHp.value) || 0) + change);
    render();
  });
}

function keysFor(property) { return [...new Set(state.beasts.flatMap((beast) => Object.keys(beast[property])))].sort(); }
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
function fillRangeFilter(container, types, measure) {
  const options = document.createElement("div");
  options.className = "multi-select__options";
  for (const type of types) {
    const row = document.createElement("div");
    row.className = "range-option";
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = type;
    checkbox.addEventListener("input", render);
    label.append(checkbox, document.createTextNode(` ${type}`));
    const minimum = document.createElement("input");
    minimum.type = "number";
    minimum.min = "0";
    minimum.step = "5";
    minimum.placeholder = "min ft.";
    minimum.setAttribute("aria-label", `Minimum ${type} ${measure} in feet`);
    minimum.addEventListener("input", () => {
      if (minimum.value !== "") checkbox.checked = true;
      render();
    });
    row.append(label, minimum);
    options.append(row);
  }
  container.append(options);
}
function rangeMinimums(container) {
  return [...container.querySelectorAll(".range-option")].map((row) => row.querySelectorAll("input"))
    .filter(([checkbox]) => checkbox.checked).map(([checkbox, minimum]) => [checkbox.value, Number(minimum.value) || 0]);
}
function fillChallengeRatingOptions() {
  const ratings = [["0", "0"], ["1/8", "0.125"], ["1/4", "0.25"], ["1/2", "0.5"], ...Array.from({ length: 30 }, (_, index) => [String(index + 1), String(index + 1)])];
  for (const [label, value] of ratings) elements.crMin.add(new Option(label, value));
  for (const [label, value] of [["Char", "character"], ...ratings]) elements.crMax.add(new Option(label, value));
  elements.crMax.value = "character";
}
function resetFilters() {
  elements.search.value = "";
  elements.searchDetails.checked = false;
  elements.size.value = "all";
  elements.acMin.value = "";
  elements.acMax.value = "";
  elements.crMin.value = "0";
  elements.crMax.value = "character";
  for (const input of document.querySelectorAll(".multi-select input")) {
    if (input.type === "checkbox") input.checked = false;
    else input.value = "";
  }
  render();
}
function onLevelInput(input) {
  if (Number(input.value) > 20) input.value = "20";
  if (input.value !== "" && Number(elements.characterLevel.value) < Number(elements.druidLevel.value)) {
    (input === elements.druidLevel ? elements.characterLevel : elements.druidLevel).value = input.value;
  }
  render();
}
function clamp(value, min, max) { return String(Math.min(max, Math.max(min, Math.round(Number(value)) || min))); }
function updateMultiSelectCount(container) {
  const summary = container.querySelector("summary");
  summary.dataset.label ??= summary.textContent;
  const count = container.querySelectorAll('input[type="checkbox"]:checked').length;
  summary.textContent = count ? `${summary.dataset.label} (${count})` : summary.dataset.label;
}
function selectedValues(container) { return [...container.querySelectorAll('input:checked')].map((input) => input.value); }
function proficiencyStates(name) { return [...document.querySelectorAll(`button[data-proficiency-name="${name}"]`)].map((button) => ({ key: button.dataset.proficiencyKey, state: button.dataset.proficiency })); }
function fillSkillOptions() {
  for (const skill of skills) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "skill";
    input.value = skill;
    const name = document.createElement("span");
    name.className = "skill-proficiency-name";
    name.append(input, document.createTextNode(` ${skill}`));
    const bonusInput = document.createElement("input");
    bonusInput.id = `skill-bonus-${skillKey(skill)}`;
    bonusInput.type = "number";
    bonusInput.value = "0";
    bonusInput.setAttribute("aria-label", `Additional ${skill} bonus`);
    label.append(name, bonusInput);
    document.querySelector(".skill-options").append(label);
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
    button.dataset.proficiencyLabel = input.name === "skill" ? input.value : input.value.toUpperCase();
    updateProficiencyButton(button);
    button.addEventListener("click", () => cycleProficiency(button));
    input.replaceWith(button);
  }
}
function saveCharacterProfile() {
  const values = Object.fromEntries([...characterFieldIds, ...skills.map((skill) => `skill-bonus-${skillKey(skill)}`)].map((id) => [id, document.querySelector(`#${id}`)?.value ?? ""]));
  const profile = {
    values,
    moonDruid: elements.moonDruid.checked,
    primalStrike: elements.primalStrike.checked,
    magician: elements.magician.checked,
    tempHp: state.tempHp,
    selectedId: state.selectedId,
    savingThrowStates: proficiencyStates("saving-throw"),
    skillStates: proficiencyStates("skill"),
  };
  try { localStorage.setItem(CHARACTER_PROFILE_STORAGE_KEY, JSON.stringify(profile)); } catch (error) { console.warn("Could not save Character Profile:", error); }
}
function loadBookmarks() {
  try {
    const values = JSON.parse(localStorage.getItem(BOOKMARKS_STORAGE_KEY) ?? "[]");
    state.bookmarks = new Set(Array.isArray(values) ? values : []);
  } catch (error) { state.bookmarks = new Set(); }
}
function toggleBookmark(id) {
  if (state.bookmarks.has(id)) state.bookmarks.delete(id);
  else state.bookmarks.add(id);
  try { localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify([...state.bookmarks])); } catch (error) { console.warn("Could not save bookmarks:", error); }
  render();
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
  elements.primalStrike.checked = Boolean(profile.primalStrike);
  elements.magician.checked = Boolean(profile.magician);
  state.tempHp = Number(profile.tempHp) || 0;
  state.selectedId = profile.selectedId ?? null;
  for (const entry of profile.savingThrowStates ?? []) {
    const button = document.querySelector(`button[data-proficiency-name="saving-throw"][data-proficiency-key="${entry.key}"]`);
    if (button) button.dataset.proficiency = entry.state;
  }
  for (const entry of profile.skillStates ?? []) {
    const button = document.querySelector(`button[data-proficiency-name="skill"][data-proficiency-key="${entry.key}"]`);
    if (button) button.dataset.proficiency = entry.state;
  }
  document.querySelectorAll(".proficiency-toggle").forEach(updateProficiencyButton);
  elements.druidLevel.value = clamp(elements.druidLevel.value, 1, 20);
  elements.characterLevel.value = clamp(Math.max(Number(elements.characterLevel.value), Number(elements.druidLevel.value)), 1, 20);
  for (const ability of abilities) {
    const input = document.querySelector(`#ability-${ability}`);
    input.value = clamp(input.value, 1, 30);
  }
}
function cycleProficiency(button) {
  const states = ["none", "half", "proficient", "expertise"];
  const nextState = states[(states.indexOf(button.dataset.proficiency) + 1) % states.length];
  button.dataset.proficiency = nextState;
  updateProficiencyButton(button);
  render();
}
function updateProficiencyButton(button) {
  const labels = { none: "No Proficiency", half: "Half-Proficiency", proficient: "Proficiency", expertise: "Expertise" };
  button.title = labels[button.dataset.proficiency];
  button.setAttribute("aria-label", `${button.dataset.proficiencyLabel}: ${button.title}`);
}

function comparator(sort, direction) {
  const multiplier = direction === "asc" ? 1 : -1;
  const sizeOrder = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];
  return (a, b) => {
    let result;
    if (state.bookmarks.has(a.id) !== state.bookmarks.has(b.id)) result = (state.bookmarks.has(a.id) ? -1 : 1) * multiplier;
    else if (sort === "cr") result = a.challengeRating - b.challengeRating;
    else if (sort === "ac") result = a.armorClass - b.armorClass;
    else if (sort === "size") result = sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
    else result = a.name.localeCompare(b.name, "en");
    return result * multiplier || a.name.localeCompare(b.name, "en") * multiplier;
  };
}
init();
