// Rules helper: verify it against the rules source used at your table before play.
const limitsByLevel = [
  { minLevel: 8, maxCR: 1, canFly: true },
  { minLevel: 4, maxCR: 0.5, canFly: false },
  { minLevel: 2, maxCR: 0.25, canFly: false },
];

export function getWildshapeLimit(level, isMoonDruid = false) {
  const limit = limitsByLevel.find((entry) => level >= entry.minLevel) ?? null;
  return isMoonDruid && limit ? { ...limit, maxCR: level / 3 } : limit;
}

export function isWildshapeEligible(beast, level, isMoonDruid = false) {
  const limit = getWildshapeLimit(level, isMoonDruid);
  return Boolean(limit) && beast.challengeRating <= limit.maxCR && (limit.canFly || !beast.speed.fly);
}

export function getWildshapeArmorClass(beast, isMoonDruid, wisdom, bonusAc = 0) {
  const wisdomModifier = Math.floor((wisdom - 10) / 2);
  const baseArmorClass = isMoonDruid ? Math.max(beast.armorClass, 13 + wisdomModifier) : beast.armorClass;
  return baseArmorClass + bonusAc;
}

export function formatCR(cr) {
  return ({ 0.125: "1/8", 0.25: "1/4", 0.5: "1/2" }[cr] ?? String(cr));
}
