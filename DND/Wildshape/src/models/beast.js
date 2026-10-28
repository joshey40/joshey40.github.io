/** @typedef {Object} Beast
 * @property {string} id @property {string} name @property {string} size
 * @property {number} challengeRating @property {{walk?: number, swim?: number, fly?: number}} speed
 * @property {string} speedUnit
 * @property {number} armorClass @property {number} hitPoints
 * @property {{perception?: number, investigation?: number, insight?: number}} passiveSkills
 * @property {{str:number, dex:number, con:number, int:number, wis:number, cha:number}} abilities
 * @property {Partial<Record<string, number>>} savingThrows @property {Partial<Record<string, number>>} skillBonuses
 * @property {string[]} resistances @property {string[]} immunities @property {string[]} vulnerabilities @property {string[]} senses @property {string[]} languages
 * @property {Partial<Record<string, number>>} senseRanges
 * @property {{name:string, description:string, type:string}[]}
 * @property {{name:string, description:string}[]} [traits]
 */

/** Normalizes an Open5e v2 response to the app's own Beast model. */
export function toBeast(apiBeast) {
  // Mock data already uses the app's own model.
  if (apiBeast.challengeRating !== undefined) return {
    ...apiBeast,
    speedUnit: apiBeast.speedUnit ?? "feet",
    resistances: apiBeast.resistances ?? [],
    immunities: apiBeast.immunities ?? [],
    vulnerabilities: apiBeast.vulnerabilities ?? [],
    senses: apiBeast.senses ?? [],
    senseRanges: parseSenseRanges(apiBeast.senses ?? []),
    actions: sortActions((apiBeast.actions ?? []).map((action) => ({ ...action, type: action.type ?? "ACTION" }))),
    languages: apiBeast.languages ?? [],
    traits: apiBeast.traits ?? [],
    savingThrows: normalizeSavingThrows(apiBeast.savingThrows),
    skillBonuses: apiBeast.skillBonuses ?? {},
    passiveSkills: apiBeast.passiveSkills ?? {},
  };
  const speed = Object.fromEntries(Object.entries(apiBeast.speed ?? {})
    .filter(([type, value]) => type !== "unit" && typeof value === "number" && value > 0));
  const defenses = apiBeast.resistances_and_immunities ?? {};
  const senseRanges = Object.fromEntries([
    ["Blindsight", apiBeast.blindsight_range], ["Darkvision", apiBeast.darkvision_range],
    ["Tremorsense", apiBeast.tremorsense_range], ["Truesight", apiBeast.truesight_range],
  ].filter(([, range]) => Number(range) > 0).map(([name, range]) => [name, Number(range)]));
  const senses = Object.entries(senseRanges).map(([name, range]) => `${name} ${range}ft.`);
  return {
    id: apiBeast.key, name: apiBeast.name, size: apiBeast.size?.name ?? "Unknown",
    challengeRating: Number(apiBeast.challenge_rating), speed, speedUnit: apiBeast.speed?.unit ?? "feet",
    armorClass: Number(apiBeast.armor_class), hitPoints: Number(apiBeast.hit_points),
    abilities: {
      str: apiBeast.ability_scores.strength, dex: apiBeast.ability_scores.dexterity,
      con: apiBeast.ability_scores.constitution, int: apiBeast.ability_scores.intelligence,
      wis: apiBeast.ability_scores.wisdom, cha: apiBeast.ability_scores.charisma,
    },
    actions: sortActions([...(apiBeast.actions ?? [])].sort((a, b) => a.order_in_statblock - b.order_in_statblock)
      .map((action) => ({ name: action.name, description: action.desc ?? "", type: action.action_type ?? "ACTION" }))),
    traits: (apiBeast.traits ?? []).map((trait) => ({ name: trait.name, description: trait.desc ?? "" })),
    resistances: namesFrom(defenses.damage_resistances),
    immunities: [...namesFrom(defenses.damage_immunities), ...namesFrom(defenses.condition_immunities)],
    vulnerabilities: namesFrom(defenses.damage_vulnerabilities),
    senses, senseRanges,
    languages: apiBeast.languages?.as_string ? [apiBeast.languages.as_string] : [],
    savingThrows: normalizeSavingThrows(apiBeast.saving_throws),
    skillBonuses: apiBeast.skill_bonuses ?? {},
  };
}

const actionTypeOrder = ["ACTION", "BONUS_ACTION", "REACTION"];
function sortActions(actions) {
  const rank = (type) => actionTypeOrder.includes(type) ? actionTypeOrder.indexOf(type) : actionTypeOrder.length;
  return actions.map((action, index) => ({ action, index })).sort((a, b) => rank(a.action.type) - rank(b.action.type) || a.index - b.index).map(({ action }) => action);
}
function parseSenseRanges(senses) {
  return Object.fromEntries(senses.map((sense) => sense.match(/^(\w+) (\d+)\s*ft\.?$/)).filter(Boolean).map(([, name, range]) => [name, Number(range)]));
}
function namesFrom(values = []) { return values.map((value) => typeof value === "string" ? value : value.name); }
function normalizeSavingThrows(values = {}) {
  const names = { strength: "str", dexterity: "dex", constitution: "con", intelligence: "int", wisdom: "wis", charisma: "cha" };
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [names[key] ?? key, Number(value)]));
}
