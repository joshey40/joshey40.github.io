import { test } from "node:test";
import assert from "node:assert/strict";
import { toBeast } from "../src/models/beast.js";
import { mockBeasts } from "../src/data/mock-beasts.js";
import { inRange, matchesAll, meetsMinimums } from "../src/domain/filters.js";

const apiBeast = {
  key: "srd-2024_wolf", name: "Wolf", size: { name: "Medium" }, challenge_rating: "0.25", armor_class: 12, hit_points: 11,
  speed: { walk: 40, swim: 0, unit: "feet" },
  ability_scores: { strength: 14, dexterity: 15, constitution: 12, intelligence: 3, wisdom: 12, charisma: 6 },
  darkvision_range: 60, blindsight_range: null,
  saving_throws: { dexterity: 4 }, skill_bonuses: { perception: 5 },
  resistances_and_immunities: { damage_resistances: [{ name: "Cold" }], damage_immunities: [], condition_immunities: [{ name: "Charmed" }], damage_vulnerabilities: [] },
  actions: [
    { name: "Howl", desc: "Reaction text", action_type: "REACTION", order_in_statblock: 0 },
    { name: "Bite", desc: "Bite text", action_type: "ACTION", order_in_statblock: 1 },
  ],
  traits: [{ name: "Pack Tactics", desc: "Advantage." }],
};

test("toBeast maps the Open5e response", () => {
  const beast = toBeast(apiBeast);
  assert.equal(beast.id, "srd-2024_wolf");
  assert.equal(beast.challengeRating, 0.25);
  assert.deepEqual(beast.speed, { walk: 40 });
  assert.equal(beast.speedUnit, "feet");
  assert.deepEqual(beast.senses, ["Darkvision 60 ft."]);
  assert.deepEqual(beast.senseRanges, { Darkvision: 60 });
  assert.deepEqual(beast.savingThrows, { dex: 4 });
  assert.deepEqual(beast.resistances, ["Cold"]);
  assert.deepEqual(beast.immunities, ["Charmed"]);
  assert.deepEqual(beast.actions.map((action) => [action.name, action.type]), [["Bite", "ACTION"], ["Howl", "REACTION"]]);
});

test("toBeast does not change the cached API data", () => {
  const actions = apiBeast.actions.map((action) => action.name);
  toBeast(apiBeast);
  assert.deepEqual(apiBeast.actions.map((action) => action.name), actions);
});

test("toBeast accepts the mock data", () => {
  for (const beast of mockBeasts.map(toBeast)) {
    assert.equal(beast.speedUnit, "feet");
    assert.ok(beast.actions.every((action) => action.type === "ACTION"));
    assert.equal(Object.keys(beast.senseRanges).length, beast.senses.length);
  }
});

test("filters", () => {
  assert.equal(inRange(12, "", ""), true);
  assert.equal(inRange(12, "13", ""), false);
  assert.equal(inRange(12, "", "12"), true);
  assert.equal(matchesAll(["Cold", "Fire"], ["Cold"]), true);
  assert.equal(matchesAll(["Cold"], ["Cold", "Fire"]), false);
  assert.equal(meetsMinimums({ walk: 40, swim: 30 }, [["swim", 0]]), true);
  assert.equal(meetsMinimums({ walk: 40, swim: 30 }, [["swim", 40]]), false);
  assert.equal(meetsMinimums({ walk: 40 }, [["fly", 0]]), false);
});
