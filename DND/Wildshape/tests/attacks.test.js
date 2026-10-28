import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cleanDescription, formatDamage, parseAttack, parseMultiattack, parseSaveAction } from "../src/domain/attacks.js";
import { getAttackFeatures, getSpellAttacks } from "../src/domain/druid-features.js";

const attackTexts = JSON.parse(readFileSync(new URL("./fixtures/attack-texts.json", import.meta.url), "utf8"));
const summary = (beast, action) => {
  const attack = parseAttack(attackTexts.find((entry) => entry.beast === beast && entry.action === action).description);
  return [`+${attack.toHit}`, attack.distance, formatDamage(attack.damage), ...attack.notes].join(" | ");
};

test("every SRD 2024 attack text is parsed", () => {
  const unparsed = attackTexts.filter((entry) => !parseAttack(entry.description));
  assert.deepEqual(unparsed, []);
});

test("every effect gets a short form", () => {
  const raw = attackTexts.flatMap((entry) => parseAttack(entry.description).notes.filter((note) => note.startsWith("If ")).map((note) => `${entry.beast}: ${note}`));
  assert.deepEqual(raw, []);
});

test("plain attacks", () => {
  assert.equal(summary("Wolf", "Bite"), "+4 | 5 ft. | 1d6+2 Piercing | ≤ Medium: Prone");
  assert.equal(summary("Ape", "Rock"), "+5 | 25/50 ft. | 2d6+3 Bludgeoning");
  assert.equal(summary("Eagle", "Talons"), "+4 | 5 ft. | 1d4+2 Slashing");
  assert.equal(summary("Octopus", "Tentacles"), "+4 | 5 ft. | 1 Bludgeoning");
  assert.equal(summary("Giant Toad", "Bite"), "+4 | 5 ft. | 1d6+2 Piercing + 2d4 Poison | ≤ Medium: Grappled (DC 12)");
});

test("charge effects", () => {
  assert.equal(summary("Rhinoceros", "Gore"), "+7 | 5 ft. | 2d8+5 Piercing | Charge 20+ ft., ≤ Large: +2d8 Piercing, Prone");
  assert.equal(summary("Elephant", "Gore"), "+8 | 5 ft. | 2d8+6 Piercing | Charge 20+ ft., ≤ Huge: Prone");
  assert.equal(summary("Allosaurus", "Claws"), "+6 | 5 ft. | 1d8+4 Slashing | Charge 30+ ft., ≤ Large: Prone, the allosaurus can make one Bite attack against it");
  assert.equal(summary("Goat", "Ram"), "+2 | 5 ft. | 1 Bludgeoning | Charge 20+ ft.: 1d4 Bludgeoning instead");
});

test("grapple effects", () => {
  assert.equal(summary("Crocodile", "Bite"), "+4 | 5 ft. | 1d8+2 Piercing | ≤ Medium: Grappled (DC 12) + Restrained");
  assert.equal(summary("Giant Crab", "Claw"), "+3 | 5 ft. | 1d6+1 Bludgeoning | ≤ Medium: Grappled (DC 11) from one of two claws");
  assert.equal(summary("Tyrannosaurus Rex", "Bite"), "+10 | 10 ft. | 4d12+7 Piercing | ≤ Large: Grappled (DC 17) + Restrained, can't be targeted by the tyrannosaurus's Tail");
});

test("alternative damage and to-hit notes", () => {
  assert.equal(summary("Blood Hawk", "Beak"), "+4 | 5 ft. | 1d4+2 Piercing | Target Bloodied: 1d8+2 Piercing instead");
  assert.equal(summary("Swarm of Venomous Snakes", "Bites"), "+6 | 5 ft. | 1d8+4 Piercing + 3d6 Poison | Swarm Bloodied: 1d4+4 Piercing instead");
  assert.equal(summary("Hunter Shark", "Bite"), "+6 | 5 ft. | 3d6+4 Piercing | Advantage if the target doesn't have all its Hit Points");
});

const multiattackTexts = JSON.parse(readFileSync(new URL("./fixtures/multiattack-texts.json", import.meta.url), "utf8"));
const saveActionTexts = JSON.parse(readFileSync(new URL("./fixtures/save-action-texts.json", import.meta.url), "utf8"));
const multiattack = (beast) => parseMultiattack(multiattackTexts.find((entry) => entry.beast === beast).description);
const saveAction = (beast, action) => {
  const save = parseSaveAction(cleanDescription(saveActionTexts.find((entry) => entry.beast === beast && entry.action === action).description));
  return [save.ability, `DC ${save.dc}`, formatDamage(save.damage), ...save.notes].join(" | ");
};

test("every multiattack is parsed", () => {
  assert.deepEqual(multiattackTexts.filter((entry) => !parseMultiattack(entry.description)), []);
  assert.deepEqual(multiattack("Ape"), { summary: "2× Fist", note: null });
  assert.deepEqual(multiattack("Giant Scorpion"), { summary: "2× Claw + 1× Sting", note: null });
  assert.deepEqual(multiattack("Giant Constrictor Snake"), { summary: "1× Bite + Constrict", note: null });
  assert.deepEqual(multiattack("Lion"), { summary: "2× Rend", note: "It can replace one attack with a use of Roar." });
  assert.equal(parseMultiattack("The beast does something unusual."), null);
});

test("every save action is parsed", () => {
  assert.deepEqual(saveActionTexts.filter((entry) => !parseSaveAction(cleanDescription(entry.description))), []);
  assert.equal(saveAction("Elephant", "Trample"), "DEX | DC 16 | 2d10+6 Bludgeoning | Target: one creature within 5 feet that has the Prone condition | Success: Half damage");
  assert.equal(saveAction("Constrictor Snake", "Constrict"), "STR | DC 12 | 3d4 Bludgeoning | Target: one Medium or smaller creature the snake can see within 5 feet | Failure: Grappled (DC 12)");
  assert.equal(saveAction("Giant Ape", "Boulder Toss"), "DEX | DC 17 | 7d6 Bludgeoning | Target: each creature in a 5-foot-radius Sphere centered on that point | Failure: ≤ Large: Prone | Success: Half damage only");
  assert.equal(saveAction("Lion", "Roar"), "WIS | DC 11 |  | Target: one creature within 15 feet | Failure: Frightened until the start of the lion's next turn");
  assert.equal(saveAction("Swarm of Ravens", "Cacophony"), "WIS | DC 10 |  | Target: one creature in the swarm's space | Failure: Deafened until the start of the swarm's next turn · While Deafened, the target also has Disadvantage on ability checks and attack rolls");
});

test("non-attack descriptions", () => {
  assert.equal(parseAttack("Melee attack; minor practice damage."), null);
  assert.equal(parseAttack("The ape makes two Fist attacks."), null);
  assert.equal(parseAttack(undefined), null);
});

test("starry wisp for Moon Druids", () => {
  const wisp = (character) => getSpellAttacks({ isMoonDruid: true, abilities: { wis: 16 }, ...character })[0]?.attack;
  assert.equal(wisp({ isMoonDruid: false, druidLevel: 5, characterLevel: 5, proficiencyBonus: 3 }), undefined);
  assert.equal(wisp({ druidLevel: 2, characterLevel: 2, proficiencyBonus: 2 }), undefined);
  assert.deepEqual(wisp({ druidLevel: 3, characterLevel: 3, proficiencyBonus: 2 }), { kind: "Ranged", toHit: 5, distance: "60 ft.", damage: [{ average: 4, dice: "1d8", type: "Radiant" }], notes: [] });
  assert.equal(wisp({ druidLevel: 4, characterLevel: 5, proficiencyBonus: 3 }).damage[0].dice, "2d8");
  assert.equal(wisp({ druidLevel: 11, characterLevel: 11, proficiencyBonus: 4 }).damage[0].dice, "3d8");
  assert.deepEqual(wisp({ druidLevel: 17, characterLevel: 17, proficiencyBonus: 6 }).damage[0], { average: 18, dice: "4d8", type: "Radiant" });
  assert.equal(wisp({ druidLevel: 17, characterLevel: 17, proficiencyBonus: 6 }).toHit, 9);
});

test("druid features for attacks", () => {
  const names = (character) => getAttackFeatures({ isMoonDruid: false, primalStrike: false, ...character }).map((feature) => feature.name);
  assert.deepEqual(names({ druidLevel: 5, isMoonDruid: true }), []);
  assert.deepEqual(names({ druidLevel: 6, isMoonDruid: true }), ["Lunar Radiance"]);
  assert.deepEqual(names({ druidLevel: 14, isMoonDruid: true, primalStrike: true }), ["Improved Lunar Radiance", "Primal Strike"]);
  assert.match(getAttackFeatures({ druidLevel: 15, isMoonDruid: false, primalStrike: true })[0].text, /^\+2d8/);
});
