import { createDamage } from "../domain/attacks.js";
import { getSpellAttackBonus, getSpellSaveDc, modifier } from "../domain/character.js";

const scaledDice = (level, thresholds) => thresholds.filter((minLevel) => level >= minLevel).length + 1;
const signed = (value) => value >= 0 ? `+${value}` : String(value);
const action = (name, type, description, details = {}) => ({ name, type, description, attack: null, save: null, multiattack: null, ...details });

const forms = [
  {
    id: "wow-cat-form", name: "Cat Form", size: "Medium", baseArmorClass: 13, walk: 40,
    skillBonuses: ({ wisdomModifier, proficiencyBonus }) => ({ stealth: wisdomModifier + proficiencyBonus }),
    actions: ({ level, wisdomModifier, toHit, saveDc }) => {
      const damage = createDamage(scaledDice(level, [5, 11, 17]), 10, wisdomModifier, "Slashing");
      const advantageDice = `${scaledDice(level, [6, 9, 12, 15, 18])}d6`;
      return [
        action("Multiattack", "ACTION", "One Pounce attack and one use of Prowl.", { multiattack: { summary: "1× Pounce + Prowl", note: null } }),
        action("Pounce", "ACTION", `Melee attack with your spell attack bonus (${signed(toHit)}), reach 5 ft. Deals ${damage.dice} Slashing damage. With Advantage, it deals ${advantageDice} more Slashing damage and knocks a Large or smaller target Prone.`, {
          attack: { kind: "Melee", toHit, distance: "5 ft.", damage: [damage], notes: [`With Advantage: +${advantageDice} Slashing · ≤ Large: Prone`] },
        }),
        action("Primal Wrath", "ACTION", `Spend a level 1+ spell slot: each chosen creature within 5 ft. makes a DC ${saveDc} Dexterity save or takes 2d6 Slashing damage per slot level ${signed(wisdomModifier)}.`, {
          save: { ability: "DEX", dc: saveDc, damage: [], notes: ["Cost: level 1+ spell slot", "Target: chosen creatures within 5 ft.", `Failure: 2d6 Slashing per slot level ${signed(wisdomModifier)}`] },
        }),
        action("Prowl", "ACTION", "Move half your Speed safely from Opportunity Attacks, then optionally Hide."),
      ];
    },
  },
  {
    id: "wow-bear-form", name: "Bear Form", size: "Large", baseArmorClass: 15, walk: 30,
    skillBonuses: () => ({}),
    actions: ({ level, wisdomModifier, toHit }) => {
      const damage = createDamage(scaledDice(level, [5, 11, 17]), 8, wisdomModifier, "Slashing");
      return [
        action("Multiattack", "ACTION", "Two Mangle attacks.", { multiattack: { summary: "2× Mangle", note: null } }),
        action("Mangle", "ACTION", `Melee attack with your spell attack bonus (${signed(toHit)}), reach 5 ft. Deals ${damage.dice} Slashing damage.`, {
          attack: { kind: "Melee", toHit, distance: "5 ft.", damage: [damage], notes: [] },
        }),
        action("Frenzied Regeneration", "BONUS_ACTION", "Spend a level 1+ spell slot to gain 5 Temp HP per slot level."),
        action("Growl", "REACTION", "When a creature you can see attacks someone else within 5 ft. of you, attacks against that target have Disadvantage until your next turn starts, as long as you stay within 5 ft. of it."),
      ];
    },
  },
];

export function getCustomForms(character) {
  const { abilities, druidLevel: level, proficiencyBonus } = character;
  const stats = { level, proficiencyBonus, wisdomModifier: modifier(abilities.wis), toHit: getSpellAttackBonus(proficiencyBonus, abilities.wis), saveDc: getSpellSaveDc(proficiencyBonus, abilities.wis) };
  return forms.map((form) => ({
    id: form.id, name: form.name, size: form.size, challengeRating: null,
    speed: { walk: form.walk }, speedUnit: "feet",
    armorClass: form.baseArmorClass + stats.wisdomModifier, hitPoints: null,
    abilities: { ...abilities, str: abilities.wis, dex: abilities.wis },
    savingThrows: {}, skillBonuses: form.skillBonuses(stats), passiveSkills: {},
    resistances: [], immunities: [], vulnerabilities: [], languages: [], traits: [],
    senses: ["Darkvision 60 ft."], senseRanges: { Darkvision: 60 },
    actions: form.actions(stats),
  }));
}
