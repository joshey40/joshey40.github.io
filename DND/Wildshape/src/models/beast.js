/** @typedef {Object} Beast
 * @property {string} id @property {string} name @property {string} size
 * @property {number} challengeRating @property {{walk?: number, swim?: number, fly?: number}} speed
 * @property {number} armorClass @property {number} hitPoints
 * @property {{str:number, dex:number, con:number, int:number, wis:number, cha:number}} abilities
 * @property {string[]} resistances @property {string[]} immunities @property {string[]} senses
 * @property {{name:string, description:string}[]} actions
 * @property {{name:string, description:string}[]} [traits]
 */

/** Normalisiert eine API-Antwort auf das app-eigene Beast-Modell. API-spezifische Feldnamen gehören nur hierher. */
export function toBeast(apiBeast) {
  return {
    id: String(apiBeast.id), name: apiBeast.name, size: apiBeast.size,
    challengeRating: Number(apiBeast.challengeRating), speed: apiBeast.speed ?? {},
    armorClass: Number(apiBeast.armorClass), hitPoints: Number(apiBeast.hitPoints),
    abilities: apiBeast.abilities, actions: apiBeast.actions ?? [], traits: apiBeast.traits ?? [],
    resistances: apiBeast.resistances ?? [], immunities: apiBeast.immunities ?? [], senses: apiBeast.senses ?? [],
  };
}
