/** @typedef {Object} Beast
 * @property {string} id @property {string} name @property {string} size
 * @property {number} challengeRating @property {{walk?: number, swim?: number, fly?: number}} speed
 * @property {string} speedUnit
 * @property {number} armorClass @property {number} hitPoints
 * @property {{str:number, dex:number, con:number, int:number, wis:number, cha:number}} abilities
 * @property {string[]} resistances @property {string[]} immunities @property {string[]} senses
 * @property {{name:string, description:string}[]} actions
 * @property {{name:string, description:string}[]} [traits]
 */

/** Normalisiert eine Open5e-v2-Antwort auf das app-eigene Beast-Modell. */
export function toBeast(apiBeast) {
  // Mock data already uses the app's own model.
  if (apiBeast.challengeRating !== undefined) return { ...apiBeast, speedUnit: apiBeast.speedUnit ?? "m" };
  const speed = Object.fromEntries(Object.entries(apiBeast.speed ?? {})
    .filter(([type, value]) => type !== "unit" && typeof value === "number" && value > 0));
  const defenses = apiBeast.resistances_and_immunities ?? {};
  const senses = [
    ["Darkvision", apiBeast.darkvision_range], ["Blindsight", apiBeast.blindsight_range],
    ["Tremorsense", apiBeast.tremorsense_range], ["Truesight", apiBeast.truesight_range],
  ].filter(([, range]) => Number(range) > 0).map(([name]) => name);
  return {
    id: apiBeast.key, name: apiBeast.name, size: apiBeast.size?.name ?? "Unknown",
    challengeRating: Number(apiBeast.challenge_rating), speed, speedUnit: apiBeast.speed?.unit ?? "feet",
    armorClass: Number(apiBeast.armor_class), hitPoints: Number(apiBeast.hit_points),
    abilities: {
      str: apiBeast.ability_scores.strength, dex: apiBeast.ability_scores.dexterity,
      con: apiBeast.ability_scores.constitution, int: apiBeast.ability_scores.intelligence,
      wis: apiBeast.ability_scores.wisdom, cha: apiBeast.ability_scores.charisma,
    },
    actions: (apiBeast.actions ?? []).sort((a, b) => a.order_in_statblock - b.order_in_statblock)
      .map((action) => ({ name: action.name, description: action.desc ?? "" })),
    traits: (apiBeast.traits ?? []).map((trait) => ({ name: trait.name, description: trait.desc ?? "" })),
    resistances: namesFrom(defenses.damage_resistances),
    immunities: [...namesFrom(defenses.damage_immunities), ...namesFrom(defenses.condition_immunities)],
    senses,
  };
}

function namesFrom(values = []) { return values.map((value) => typeof value === "string" ? value : value.name); }
