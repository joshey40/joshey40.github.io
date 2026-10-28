import { modifier } from "./character.js";

const moonlightStep ="You can use a bonus action to teleport up to 30 feet to an unoccupied space you can see, and you have Advantage on the next attack roll you make before the end of this turn.";
const moonlightStepUses = (character) => {
  const uses = getMoonlightStepUses(character);
  return `You can use this feature ${uses} time${uses === 1 ? "" : "s"} (your Wisdom modifier, minimum of once), and you regain all expended uses when you finish a Long Rest. You can also regain uses by expending a level 2+ spell slot for each use you want to restore (no action required).`;
};
const lunarRadiance = "Your attacks can deal its normal damage type or Radiant damage. You make this choice each time you hit with those attacks.";
const circleSpells = [[3, "Cure Wounds"], [3, "Moonbeam"], [3, "Starry Wisp"], [5, "Conjure Animals"], [7, "Fount of Moonlight"], [9, "Mass Cure Wounds"]];

const features = [
  { name: "Circle of the Moon Spells", moon: true, from: 3, description: (character) => `You can cast the following spells in Wild Shape: ${formatList(circleSpells.filter(([level]) => character.druidLevel >= level).map(([, spell]) => spell))}.` },
  { name: "Lunar Radiance", moon: true, from: 6, to: 13, description: lunarRadiance },
  { name: "Improved Lunar Radiance", moon: true, from: 14, description: `${lunarRadiance} Once per turn, you can deal an extra 2d10 Radiant damage.` },
  { name: "Moonlight Step", moon: true, from: 10, to: 13, description: (character) => `${moonlightStep}\n${moonlightStepUses(character)}` },
  { name: "Shared Moonlight Step", moon: true, from: 14, description: (character) => `${moonlightStep}\nYou can teleport one willing creature with you. That creature must be within 10 feet of you, and you teleport it to an unoccupied space you can see within 10 feet of your destination space.\n${moonlightStepUses(character)}` },
  { name: "Primal Strike", from: 7, when: (character) => character.primalStrike, description: (character) => `Once on each of your turns when you hit a creature, you can cause the target to take an extra ${character.druidLevel >= 15 ? "2d8" : "1d8"} Cold, Fire, Lightning, or Thunder damage (choose when you hit).` },
  { name: "Potent Spellcasting", from: 7, when: (character) => character.potentSpellcasting, description: (character) => `Add your Wisdom modifier to the damage you deal with any Druid cantrip.${character.druidLevel >= 15 ? " The range of your Druid cantrips with a range of 10 feet or greater increases by 300 feet." : ""}` },
  { name: "Beast Spells", from: 18, description: "You can cast spells, except for any spell that has a Material component with a cost specified or that consumes its Material component." },
];

export function getMoonlightStepUses(character) { return Math.max(1, modifier(character.abilities?.wis ?? 10)); }

export function getDruidTraits(character) {
  return features
    .filter((feature) => character.druidLevel >= feature.from && character.druidLevel <= (feature.to ?? Infinity))
    .filter((feature) => (!feature.moon || character.isMoonDruid) && (!feature.when || feature.when(character)))
    .map((feature) => ({ name: feature.name, description: typeof feature.description === "function" ? feature.description(character) : feature.description }));
}

export function getSpellAttacks(character) {
  if (!character.isMoonDruid || character.druidLevel < 3) return [];
  const level = character.characterLevel ?? character.druidLevel;
  const dice = level >= 17 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1;
  const bonus = character.potentSpellcasting && character.druidLevel >= 7 ? modifier(character.abilities?.wis ?? 10) : 0;
  const range = character.potentSpellcasting && character.druidLevel >= 15 ? 360 : 60;
  return [{
    name: "Starry Wisp",
    type: "CANTRIP",
    attack: {
      kind: "Ranged",
      toHit: character.proficiencyBonus + modifier(character.abilities?.wis ?? 10),
      distance: `${range} ft.`,
      damage: [{ average: Math.max(0, Math.floor(dice * 4.5) + bonus), dice: `${dice}d8${bonus > 0 ? `+${bonus}` : bonus < 0 ? bonus : ""}`, type: "Radiant" }],
      notes: [],
    },
  }];
}

export function getAttackFeatures(character) {
  const features = [];
  if (character.isMoonDruid && character.druidLevel >= 14) features.push({ name: "Improved Lunar Radiance", text: "Damage can be Radiant · +2d10 Radiant once per turn" });
  else if (character.isMoonDruid && character.druidLevel >= 6) features.push({ name: "Lunar Radiance", text: "Damage can be Radiant" });
  if (character.primalStrike && character.druidLevel >= 7) features.push({ name: "Primal Strike", text: `+${character.druidLevel >= 15 ? "2d8" : "1d8"} Cold, Fire, Lightning or Thunder once per turn` });
  return features;
}

function formatList(values) { return values.length > 1 ? `${values.slice(0, -1).join(", ")} and ${values.at(-1)}` : values.join(""); }
