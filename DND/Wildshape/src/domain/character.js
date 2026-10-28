export const abilities = ["str", "dex", "con", "int", "wis", "cha"];

export const skillAbilities = {
  "Acrobatics": "dex", "Animal Handling": "wis", "Arcana": "int", "Athletics": "str", "Deception": "cha", "History": "int",
  "Insight": "wis", "Intimidation": "cha", "Investigation": "int", "Medicine": "wis", "Nature": "int", "Perception": "wis",
  "Performance": "cha", "Persuasion": "cha", "Religion": "int", "Sleight of Hand": "dex", "Stealth": "dex", "Survival": "wis",
};

export function skillKey(skill) { return skill.toLocaleLowerCase("en").replaceAll(" ", "_"); }

export function modifier(score) { return Math.floor((score - 10) / 2); }

export function getProficiencyBonus(level) { return level > 0 ? Math.floor((level - 1) / 4) + 2 : 2; }

export function getProficiencyValue(state, proficiencyBonus) {
  if (state === "expertise") return proficiencyBonus * 2;
  if (state === "proficient") return proficiencyBonus;
  if (state === "half") return Math.floor(proficiencyBonus / 2);
  return 0;
}
