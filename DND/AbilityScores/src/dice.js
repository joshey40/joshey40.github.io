const POINT_BUY = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

export function modifier(score) {
  return Math.floor((score - 10) / 2);
}

export function pointBuyValue(score) {
  if (score >= 8 && score <= 15) return POINT_BUY[score];
  let cost = 0;
  if (score > 15) {
    cost = 9;
    for (let v = 16; v <= score; v++) cost += v <= 17 ? 3 : 4;
  } else {
    for (let v = 7; v >= score; v--) cost -= v >= 6 ? 1 : v >= 4 ? 2 : 3;
  }
  return cost;
}

function dieDistribution(sides, reroll, mode) {
  const r = Math.max(0, Math.min(reroll, sides - 1));
  const p = new Array(sides + 1).fill(0);
  for (let v = 1; v <= sides; v++) {
    p[v] = mode === 'always'
      ? (v > r ? 1 / (sides - r) : 0)
      : (v > r ? 1 / sides : 0) + (r / sides) * (1 / sides);
  }
  return p;
}

function toDistribution(weights) {
  const values = [...weights.keys()].sort((a, b) => a - b);
  const total = values.reduce((s, v) => s + weights.get(v), 0);
  const probs = values.map(v => weights.get(v) / total);
  const cdf = [];
  probs.reduce((acc, p, i) => (cdf[i] = acc + p), 0);
  return { values, probs, cdf };
}

export function sampleFrom(dist, rng = Math.random) {
  const u = rng();
  let lo = 0, hi = dist.cdf.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (dist.cdf[mid] < u) lo = mid + 1; else hi = mid;
  }
  return dist.values[lo];
}

function rollDie(m, rng) {
  const roll = () => 1 + Math.floor(rng() * m.sides);
  const r = Math.min(m.reroll, m.sides - 1);
  const rerolled = [];
  let v = roll();
  if (m.rerollMode === 'always') {
    while (v <= r) { rerolled.push(v); v = roll(); }
  } else if (v <= r) {
    rerolled.push(v);
    v = roll();
  }
  return { value: v, rerolled };
}

export function rollScore(m, rng = Math.random) {
  const dice = Array.from({ length: m.dice }, () => rollDie(m, rng));
  const keep = Math.min(m.keep, m.dice);
  const order = dice.map((_, i) => i).sort((a, b) => dice[b].value - dice[a].value);
  order.forEach((idx, rank) => { dice[idx].kept = rank < keep; });
  const value = dice.reduce((s, d) => s + (d.kept ? d.value : 0), 0) + m.bonus;
  return { value, dice };
}

export function scoreDistribution(m) {
  const weights = new Map();
  const add = (v, w) => weights.set(v, (weights.get(v) || 0) + w);

  if (m.fixed) {
    m.fixed.forEach(v => add(v, 1));
    return toDistribution(weights);
  }

  const keep = Math.min(m.keep, m.dice);
  const outcomes = m.sides ** m.dice;
  if (outcomes <= 2_000_000) {
    const die = dieDistribution(m.sides, m.reroll, m.rerollMode);
    const vals = new Array(m.dice).fill(1);
    const buf = new Array(m.dice);
    for (let i = 0; i < outcomes; i++) {
      let w = 1;
      for (let j = 0; j < m.dice; j++) w *= die[vals[j]];
      if (w > 0) {
        for (let j = 0; j < m.dice; j++) buf[j] = vals[j];
        buf.sort((a, b) => b - a);
        let sum = m.bonus;
        for (let j = 0; j < keep; j++) sum += buf[j];
        add(sum, w);
      }
      for (let j = 0; j < m.dice; j++) {
        if (++vals[j] <= m.sides) break;
        vals[j] = 1;
      }
    }
    const dist = toDistribution(weights);
    dist.exact = true;
    return dist;
  }

  for (let i = 0; i < 200_000; i++) add(rollScore(m).value, 1);
  return toDistribution(weights);
}

const sum = a => a.reduce((s, v) => s + v, 0);

export const SET_METRICS = {
  total: { label: 'Total of scores', short: 'total', fn: sum },
  mods: { label: 'Sum of modifiers', short: 'Σ mods', fn: a => a.reduce((s, v) => s + modifier(v), 0) },
  pbe: { label: 'Point-buy value', short: 'point-buy', fn: a => a.reduce((s, v) => s + pointBuyValue(v), 0) },
  max: { label: 'Highest score', short: 'highest', fn: a => Math.max(...a) },
  min: { label: 'Lowest score', short: 'lowest', fn: a => Math.min(...a) },
};

const SIM_BUDGET = 800_000;
const ROLL_ATTEMPT_LIMIT = 20_000;

function meetsMinimum(m, arr) {
  return m.fixed || !SET_METRICS[m.rerollIf] || SET_METRICS[m.rerollIf].fn(arr) >= m.rerollBelow;
}

function isBetter(m, a, b) {
  const diff = SET_METRICS[m.keepBy].fn(a) - SET_METRICS[m.keepBy].fn(b);
  return diff !== 0 ? diff > 0 : sum(a) > sum(b);
}

function drawArray(m, dist, rng) {
  if (m.fixed) return [...m.fixed].sort((a, b) => b - a);
  const all = Array.from({ length: m.scores + m.extra }, () => sampleFrom(dist, rng));
  return all.sort((a, b) => b - a).slice(0, m.scores);
}

export function simulateArrays(m, dist, target, rng = Math.random) {
  const size = m.fixed ? m.fixed.length : m.scores;
  const sets = m.fixed ? 1 : m.sets;
  const rankSums = new Float64Array(size);
  const pooled = new Map();
  const pbeHist = new Map();
  let modSum = 0, pbeSum = 0, totalSum = 0, drawn = 0, accepted = 0, n = 0;
  let any18 = 0, anyLow = 0, beat27 = 0, under27 = 0;

  characters: for (let i = 0; i < target; i++) {
    let best = null;
    for (let s = 0; s < sets; s++) {
      let arr;
      do {
        if (drawn >= SIM_BUDGET) break characters;
        arr = drawArray(m, dist, rng);
        drawn++;
      } while (!meetsMinimum(m, arr));
      accepted++;
      if (!best || isBetter(m, arr, best)) best = arr;
    }

    let mods = 0, pbe = 0;
    best.forEach((v, r) => {
      rankSums[r] += v;
      mods += modifier(v);
      pbe += pointBuyValue(v);
      pooled.set(v, (pooled.get(v) || 0) + 1);
    });
    totalSum += sum(best);
    modSum += mods;
    pbeSum += pbe;
    pbeHist.set(pbe, (pbeHist.get(pbe) || 0) + 1);
    if (best[0] >= 18) any18++;
    if (best[best.length - 1] <= 7) anyLow++;
    if (pbe > 27) beat27++;
    if (pbe < 27) under27++;
    n++;
  }

  const acceptRate = drawn ? accepted / drawn : 0;
  if (n === 0) return { impossible: true, acceptRate, n };

  const pooledDist = toDistribution(pooled);
  const mean = pooledDist.values.reduce((s, v, i) => s + v * pooledDist.probs[i], 0);
  const variance = pooledDist.values.reduce((s, v, i) => s + (v - mean) ** 2 * pooledDist.probs[i], 0);

  return {
    rankMeans: [...rankSums].map(s => s / n),
    pooled: pooledDist,
    mean,
    sd: Math.sqrt(variance),
    totalMean: totalSum / n,
    modMean: modSum / n,
    pbeMean: pbeSum / n,
    pbeHist,
    pAny18: any18 / n,
    pAnyLow: anyLow / n,
    pBeat27: beat27 / n,
    pUnder27: under27 / n,
    acceptRate,
    setsPerCharacter: sets / acceptRate,
    n,
    target,
  };
}

function rollSet(m, rng) {
  const all = Array.from({ length: m.scores + m.extra }, () => rollScore(m, rng));
  const dropped = new Set(all.map((_, i) => i).sort((a, b) => all[a].value - all[b].value).slice(0, m.extra));
  return all.map((s, i) => ({ ...s, dropped: dropped.has(i) }));
}

export const keptValues = set => set.filter(s => !s.dropped).map(s => s.value);

export function rollArray(m, rng = Math.random) {
  if (m.fixed) {
    return { sets: [m.fixed.map(value => ({ value, dice: [], dropped: false }))], chosen: 0, attempts: 1 };
  }
  const sets = [];
  let attempts = 0;
  for (let s = 0; s < m.sets; s++) {
    let set;
    do {
      if (attempts >= ROLL_ATTEMPT_LIMIT) return { sets, chosen: -1, attempts, failed: true };
      set = rollSet(m, rng);
      attempts++;
    } while (!meetsMinimum(m, keptValues(set)));
    sets.push(set);
  }
  let chosen = 0;
  sets.forEach((set, i) => { if (isBetter(m, keptValues(set), keptValues(sets[chosen]))) chosen = i; });
  return { sets, chosen, attempts };
}
