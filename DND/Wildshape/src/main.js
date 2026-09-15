import { getBeasts } from "./data/beast-repository.js";
import { getWildshapeLimit } from "./domain/wildshape.js";
import { renderBeastList } from "./ui/beast-list.js";
import { renderBeastDetail } from "./ui/beast-detail.js";

const state = { beasts: [], selectedId: null, sortDirection: "asc", tempHp: 0 };
const elements = {
  search: document.querySelector("#search-input"), characterLevel: document.querySelector("#character-level"), druidLevel: document.querySelector("#druid-level"), bonusAc: document.querySelector("#bonus-ac"),
  moonDruid: document.querySelector("#moon-druid"), characterHp: document.querySelector("#character-hp"), characterMaxHp: document.querySelector("#character-max-hp"),
  abilityInt: document.querySelector("#ability-int"), abilityWis: document.querySelector("#ability-wis"), abilityCha: document.querySelector("#ability-cha"),
  crMin: document.querySelector("#cr-min"), crMax: document.querySelector("#cr-max"),
  acMin: document.querySelector("#ac-min"), acMax: document.querySelector("#ac-max"),
  movement: document.querySelector("#movement-filter"), size: document.querySelector("#size-filter"),
  resistance: document.querySelector("#resistance-filter"), sense: document.querySelector("#sense-filter"),
  sort: document.querySelector("#sort-select"),
  count: document.querySelector("#result-count"), direction: document.querySelector("#sort-direction"),
  list: document.querySelector("#beast-list"), detail: document.querySelector("#detail-panel"),
};

for (const control of Object.values(elements)) if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) if (control !== elements.druidLevel) control.addEventListener("input", render);
elements.druidLevel.addEventListener("input", () => {
  if (Number(elements.characterLevel.value) < Number(elements.druidLevel.value)) elements.characterLevel.value = elements.druidLevel.value;
  render();
});
for (const skill of document.querySelectorAll('input[name="skill"]')) skill.addEventListener("input", render);
elements.direction.addEventListener("click", () => {
  state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
  elements.direction.textContent = state.sortDirection === "asc" ? "↑" : "↓";
  const label = state.sortDirection === "asc" ? "Sort ascending" : "Sort descending";
  elements.direction.setAttribute("aria-label", label);
  elements.direction.title = label;
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
    render();
  } catch (error) {
    console.error("Could not load Beasts:", error);
    elements.list.innerHTML = '<p class="empty-detail">The Beast data could not be loaded. Please try again later.</p>';
  }
}

function render() {
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
  renderBeastDetail(elements.detail, selectedBeast, {
    hp: Number(elements.characterHp.value) || 0,
    maxHp: Number(elements.characterMaxHp.value) || 0,
    tempHp: state.tempHp,
    isMoonDruid,
    bonusAc: Number(elements.bonusAc.value) || 0,
    abilities: { int: Number(elements.abilityInt.value) || 0, wis: Number(elements.abilityWis.value) || 0, cha: Number(elements.abilityCha.value) || 0 },
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
function matchesAll(values, requested) { return requested.every((value) => values.includes(value)); }
function inRange(value, min, max) { return (min === "" || value >= Number(min)) && (max === "" || value <= Number(max)); }

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
