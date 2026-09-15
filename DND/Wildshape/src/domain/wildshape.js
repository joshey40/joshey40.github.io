// Rules helper: verify it against the rules source used at your table before play.
const limitsByLevel = [
  { minLevel: 8, maxCR: 1, canFly: true },
  { minLevel: 4, maxCR: 0.5, canFly: false },
  { minLevel: 2, maxCR: 0.25, canFly: false },
];

export function getWildshapeLimit(level) {
  return limitsByLevel.find((limit) => level >= limit.minLevel) ?? null;
}

export function isWildshapeEligible(beast, level) {
  const limit = getWildshapeLimit(level);
  return Boolean(limit) && beast.challengeRating <= limit.maxCR && (limit.canFly || !beast.speed.fly);
}

export function formatCR(cr) {
  return ({ 0.125: "1/8", 0.25: "1/4", 0.5: "1/2" }[cr] ?? String(cr));
}
