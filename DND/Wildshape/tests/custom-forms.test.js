import { test } from "node:test";
import assert from "node:assert/strict";
import { getCustomForms } from "../src/data/custom-forms.js";
import { formatCR, isWildshapeEligible } from "../src/domain/wildshape.js";
import { matchesSearch } from "../src/domain/filters.js";

const abilities = { str: 10, dex: 12, con: 14, int: 8, wis: 16, cha: 9 };
const forms = (druidLevel, proficiencyBonus = 3, wis = 16) => getCustomForms({ druidLevel, proficiencyBonus, abilities: { ...abilities, wis } });
const cat = (...args) => forms(...args).find((form) => form.name === "Cat Form");
const bear = (...args) => forms(...args).find((form) => form.name === "Bear Form");
const find = (form, name) => form.actions.find((action) => action.name === name);

test("forms use the character's stats", () => {
  assert.deepEqual(cat(7).abilities, { str: 16, dex: 16, con: 14, int: 8, wis: 16, cha: 9 });
  assert.equal(cat(7).armorClass, 16);
  assert.equal(bear(7).armorClass, 18);
  assert.equal(cat(7, 3, 8).armorClass, 12);
  assert.deepEqual([cat(7).size, cat(7).speed.walk, bear(7).size, bear(7).speed.walk], ["Medium", 40, "Large", 30]);
  assert.deepEqual(cat(7).senseRanges, { Darkvision: 60 });
});

test("cat form has Stealth proficiency", () => {
  assert.deepEqual(cat(7).skillBonuses, { stealth: 6 });
  assert.deepEqual(bear(7).skillBonuses, {});
});

test("attacks use spell attack bonus and scale with druid level", () => {
  assert.equal(find(cat(7), "Pounce").attack.toHit, 6);
  assert.deepEqual([3, 5, 11, 17].map((level) => find(cat(level), "Pounce").attack.damage[0].dice), ["1d10+3", "2d10+3", "3d10+3", "4d10+3"]);
  assert.deepEqual([3, 5, 11, 17].map((level) => find(bear(level), "Mangle").attack.damage[0].dice), ["1d8+3", "2d8+3", "3d8+3", "4d8+3"]);
  assert.equal(find(bear(7), "Mangle").attack.damage[0].average, 12);
  assert.equal(find(bear(7, 3, 8), "Mangle").attack.damage[0].dice, "2d8-1");
});

test("pounce bonus on Advantage scales separately", () => {
  const advantage = (level) => find(cat(level), "Pounce").attack.notes[0];
  assert.equal(advantage(5), "With Advantage: +1d6 Slashing · ≤ Large: Prone");
  assert.deepEqual([6, 9, 12, 15, 18].map((level) => advantage(level).match(/\+(\d)d6/)[1]), ["2", "3", "4", "5", "6"]);
});

test("primal wrath uses the spell save DC", () => {
  const { save } = find(cat(7), "Primal Wrath");
  assert.deepEqual([save.ability, save.dc], ["DEX", 14]);
  assert.ok(save.notes.includes("Failure: 2d6 Slashing per slot level +3"));
});

test("action layout", () => {
  assert.equal(find(cat(7), "Multiattack").multiattack.summary, "1× Pounce + Prowl");
  assert.equal(find(bear(7), "Multiattack").multiattack.summary, "2× Mangle");
  assert.equal(find(bear(7), "Frenzied Regeneration").type, "BONUS_ACTION");
  assert.equal(find(bear(7), "Growl").type, "REACTION");
});

test("forms require Circle Forms and have no CR", () => {
  assert.equal(isWildshapeEligible(cat(3), 3, true), true);
  assert.equal(isWildshapeEligible(cat(3), 2, true), false);
  assert.equal(isWildshapeEligible(cat(8), 8, false), false);
  assert.equal(formatCR(cat(3).challengeRating), "–");
});

test("forms are searchable", () => {
  assert.equal(matchesSearch(bear(7), "growl", true), true);
  assert.equal(matchesSearch(bear(7), "growl", false), false);
});
