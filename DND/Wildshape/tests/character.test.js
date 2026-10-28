import { test } from "node:test";
import assert from "node:assert/strict";
import { getProficiencyBonus, getProficiencyValue, modifier, skillAbilities, skillKey } from "../src/domain/character.js";
import { getDruidTraits } from "../src/domain/druid-features.js";

test("ability modifier", () => {
  assert.deepEqual([1, 8, 9, 10, 11, 16, 30].map(modifier), [-5, -1, -1, 0, 0, 3, 10]);
});

test("proficiency bonus and states", () => {
  assert.deepEqual([1, 4, 5, 9, 13, 17, 20].map(getProficiencyBonus), [2, 2, 3, 4, 5, 6, 6]);
  assert.deepEqual(["none", "half", "proficient", "expertise"].map((state) => getProficiencyValue(state, 3)), [0, 1, 3, 6]);
});

test("skills", () => {
  assert.equal(Object.keys(skillAbilities).length, 18);
  assert.equal(skillKey("Sleight of Hand"), "sleight_of_hand");
});

const traitNames = (character) => getDruidTraits({ isMoonDruid: false, primalStrike: false, ...character }).map((trait) => trait.name);
const description = (character, name) => getDruidTraits({ isMoonDruid: true, primalStrike: false, ...character }).find((trait) => trait.name === name).description;

test("druid traits by level", () => {
  assert.deepEqual(traitNames({ druidLevel: 2, isMoonDruid: true }), []);
  assert.deepEqual(traitNames({ druidLevel: 6, isMoonDruid: true }), ["Circle of the Moon Spells", "Lunar Radiance"]);
  assert.deepEqual(traitNames({ druidLevel: 10, isMoonDruid: true }), ["Circle of the Moon Spells", "Lunar Radiance", "Moonlight Step"]);
  assert.deepEqual(traitNames({ druidLevel: 14, isMoonDruid: true }), ["Circle of the Moon Spells", "Improved Lunar Radiance", "Shared Moonlight Step"]);
  assert.deepEqual(traitNames({ druidLevel: 18, primalStrike: true }), ["Primal Strike", "Beast Spells"]);
  assert.deepEqual(traitNames({ druidLevel: 6, primalStrike: true }), []);
});

test("circle spells grow with level", () => {
  assert.match(description({ druidLevel: 3 }, "Circle of the Moon Spells"), /: Cure Wounds, Moonbeam and Starry Wisp\.$/);
  assert.match(description({ druidLevel: 5 }, "Circle of the Moon Spells"), /Starry Wisp and Conjure Animals\.$/);
  assert.match(description({ druidLevel: 9 }, "Circle of the Moon Spells"), /Fount of Moonlight and Mass Cure Wounds\.$/);
});

test("primal strike dice", () => {
  assert.match(description({ druidLevel: 7, primalStrike: true }, "Primal Strike"), /extra 1d8/);
  assert.match(description({ druidLevel: 15, primalStrike: true }, "Primal Strike"), /extra 2d8/);
});
