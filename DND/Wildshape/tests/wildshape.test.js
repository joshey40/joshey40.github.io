import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCR, formatSpeed, getKnownFormsCount, getWildshapeArmorClass, getWildshapeLimit, getWildshapeTempHp, isWildshapeEligible } from "../src/domain/wildshape.js";

const beast = (challengeRating, speed = { walk: 30 }, armorClass = 12) => ({ challengeRating, speed, armorClass });

test("Wild Shape limits by druid level", () => {
  assert.equal(getWildshapeLimit(1), null);
  assert.deepEqual(getWildshapeLimit(2), { minLevel: 2, maxCR: 0.25, canFly: false });
  assert.deepEqual(getWildshapeLimit(4), { minLevel: 4, maxCR: 0.5, canFly: false });
  assert.deepEqual(getWildshapeLimit(8), { minLevel: 8, maxCR: 1, canFly: true });
});

test("Moon Druid CR is a third of the druid level", () => {
  assert.equal(getWildshapeLimit(3, true).maxCR, 1);
  assert.equal(getWildshapeLimit(6, true).maxCR, 2);
  assert.equal(getWildshapeLimit(20, true).maxCR, 6);
  assert.equal(getWildshapeLimit(6, true).canFly, false);
});

test("eligibility respects CR and flying", () => {
  assert.equal(isWildshapeEligible(beast(0.25), 1), false);
  assert.equal(isWildshapeEligible(beast(0.25), 2), true);
  assert.equal(isWildshapeEligible(beast(0.5), 2), false);
  assert.equal(isWildshapeEligible(beast(0.25, { walk: 10, fly: 60 }), 4), false);
  assert.equal(isWildshapeEligible(beast(0.25, { walk: 10, fly: 60 }), 8), true);
});

test("known forms", () => {
  assert.deepEqual([1, 2, 3, 4, 7, 8, 20].map(getKnownFormsCount), [0, 4, 4, 6, 6, 8, 8]);
});

test("temporary hit points", () => {
  assert.equal(getWildshapeTempHp(5), 5);
  assert.equal(getWildshapeTempHp(5, true), 15);
});

test("armor class", () => {
  assert.equal(getWildshapeArmorClass(beast(1, {}, 12), false, 16), 12);
  assert.equal(getWildshapeArmorClass(beast(1, {}, 12), true, 16), 16);
  assert.equal(getWildshapeArmorClass(beast(1, {}, 17), true, 16, 1), 18);
});

test("formatting", () => {
  assert.deepEqual([0, 0.125, 0.25, 0.5, 2].map(formatCR), ["0", "1/8", "1/4", "1/2", "2"]);
  assert.equal(formatSpeed({ walk: 40, swim: 60 }, "feet"), "walk 40 ft. · swim 60 ft.");
  assert.equal(formatSpeed({ walk: 40 }, "feet", ", "), "walk 40 ft.");
});
