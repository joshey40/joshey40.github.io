import { SET_METRICS, keptValues, modifier, pointBuyValue, rollArray, scoreDistribution, simulateArrays } from './dice.js';
import { lineChart } from './chart.js';

const COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9', '#e66767'];
const SIMULATIONS = 40_000;
const PBE_BIN = 3;

const base = { dice: 4, sides: 6, keep: 3, reroll: 0, rerollMode: 'always', bonus: 0, scores: 6, extra: 0, sets: 1, keepBy: 'total', rerollIf: 'off', rerollBelow: 0 };

const methods = [
  { id: '4d6', name: '4d6 drop lowest', enabled: true },
  { id: '3d6', name: '3d6 in order', dice: 3, enabled: true },
  { id: '2d6+6', name: '2d6 + 6', dice: 2, keep: 2, bonus: 6, enabled: true },
  { id: '4d6r1', name: '4d6 drop lowest, reroll 1s', reroll: 1 },
  { id: 'best2', name: '4d6 drop lowest, best of 2 sets', sets: 2 },
  { id: '4d6x7', name: '4d6 drop lowest, 7 rolls keep 6', extra: 1 },
  { id: 'std', name: 'Standard Array', fixed: [15, 14, 13, 12, 10, 8], enabled: true },
  { id: 'custom', name: '1d20', dice: 1, sides: 20, keep: 1, custom: true },
].map((m, i) => ({ ...base, enabled: false, ...m, color: COLORS[i] }));

const cache = new Map();
const $ = sel => document.querySelector(sel);
const tooltip = $('#tooltip');

const pct = v => `${(v * 100).toFixed(v > 0 && v < 0.01 ? 2 : 1)}%`;
const num = (v, d = 1) => v.toFixed(d);
const signed = v => (v >= 0 ? `+${v}` : `${v}`);
const signedNum = (v, d = 1) => (v >= 0 ? '+' : '') + v.toFixed(d);
const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function describe(m) {
  if (m.fixed) return m.fixed.join(', ');
  let s = `${m.dice}d${m.sides}`;
  if (m.keep < m.dice) s += ` keep ${m.keep}`;
  if (m.bonus) s += ` ${m.bonus > 0 ? '+' : '−'} ${Math.abs(m.bonus)}`;
  if (m.reroll) s += `, reroll ≤${m.reroll}${m.rerollMode === 'once' ? ' once' : ''}`;
  if (m.extra) s += `, ${m.scores + m.extra} rolls keep ${m.scores}`;
  else if (m.scores !== 6) s += `, ${m.scores} scores`;
  if (m.sets > 1) s += `, best of ${m.sets} sets by ${SET_METRICS[m.keepBy].short}`;
  if (SET_METRICS[m.rerollIf]) s += `, reroll set if ${SET_METRICS[m.rerollIf].short} < ${m.rerollBelow}`;
  return s;
}

function stats(m) {
  const key = JSON.stringify([m.fixed, m.dice, m.sides, m.keep, m.reroll, m.rerollMode, m.bonus, m.scores, m.extra, m.sets, m.keepBy, m.rerollIf, m.rerollBelow]);
  if (!cache.has(m.id) || cache.get(m.id).key !== key) {
    const dist = scoreDistribution(m);
    const sim = simulateArrays(m, dist, m.fixed ? 1 : SIMULATIONS);
    const arrayRules = !m.fixed && (m.extra > 0 || m.sets > 1 || !!SET_METRICS[m.rerollIf]);
    cache.set(m.id, { key, dist, sim, scoreDist: arrayRules ? sim.pooled : dist });
  }
  return cache.get(m.id);
}

function renderMethodList() {
  $('#method-list').innerHTML = methods.map(m => `
    <label class="method-chip ${m.enabled ? 'is-on' : ''}">
      <input type="checkbox" data-id="${m.id}" ${m.enabled ? 'checked' : ''} />
      <span class="swatch" style="background:${m.color}"></span>
      <span class="chip-text"><strong>${escapeHtml(m.name)}</strong><small>${escapeHtml(describe(m))}</small></span>
    </label>`).join('');
}

function renderLegends(active) {
  const html = active.map(m => `<span class="legend-item"><span class="swatch" style="background:${m.color}"></span>${escapeHtml(m.name)}</span>`).join('');
  document.querySelectorAll('.legend').forEach(l => {
    const rolledOnly = l.dataset.rolledOnly !== undefined;
    l.innerHTML = rolledOnly
      ? active.filter(m => !m.fixed).map(m => `<span class="legend-item"><span class="swatch" style="background:${m.color}"></span>${escapeHtml(m.name)}</span>`).join('')
      : html;
  });
}

function renderSummary(active) {
  const head = `<thead><tr>
    <th>Method</th><th title="Average single score">Avg score</th><th title="Standard deviation of a single score">SD</th>
    <th>Avg highest</th><th>Avg lowest</th><th title="Sum of all six modifiers">Σ modifiers</th>
    <th title="Point-buy value of the array (27 = standard)">Point-buy eq.</th><th>Beats 27 pts</th><th>Below 27 pts</th>
    <th>Has an 18</th><th>Has a score ≤ 7</th></tr></thead>`;
  const rows = active.map(m => {
    const { sim } = stats(m);
    const name = `<span class="swatch" style="background:${m.color}"></span>${escapeHtml(m.name)}`;
    if (sim.impossible) {
      return `<tr><th scope="row">${name}<small class="warn">Reroll rule is (practically) never met</small></th><td colspan="10" class="muted-cell">—</td></tr>`;
    }
    const notes = [];
    if (sim.setsPerCharacter > m.sets * 1.005) notes.push(`<small>~${num(sim.setsPerCharacter, sim.setsPerCharacter < 10 ? 2 : 0)} sets rolled per character</small>`);
    if (sim.n < sim.target) notes.push(`<small class="warn">Rare rule: only ${sim.n.toLocaleString()} characters simulated</small>`);
    const note = notes.join('');
    return `<tr>
      <th scope="row">${name}${note}</th>
      <td>${num(sim.mean, 2)}</td><td>${num(sim.sd, 2)}</td>
      <td>${num(sim.rankMeans[0])}</td><td>${num(sim.rankMeans[sim.rankMeans.length - 1])}</td>
      <td>${signedNum(sim.modMean)}</td><td>${num(sim.pbeMean)}</td>
      <td>${pct(sim.pBeat27)}</td><td>${pct(sim.pUnder27)}</td>
      <td>${pct(sim.pAny18)}</td><td>${pct(sim.pAnyLow)}</td></tr>`;
  }).join('');
  $('#summary-table').innerHTML = head + `<tbody>${rows}</tbody>`;
  $('#sim-note').textContent = `Single-score odds are exact where possible; array stats from ${SIMULATIONS.toLocaleString()} simulated characters per method.`;
}

function renderCharts(enabled) {
  const active = enabled.filter(m => !stats(m).sim.impossible);
  const rolled = active.filter(m => !m.fixed);

  const allValues = active.flatMap(m => stats(m).scoreDist.values);
  const lo = Math.min(3, ...allValues), hi = Math.max(18, ...allValues);
  const scoreXs = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  lineChart($('#chart-dist'), {
    xs: scoreXs,
    series: active.map(m => {
      const d = stats(m).scoreDist;
      return { name: m.name, color: m.color, dotsOnly: !!m.fixed, values:scoreXs.map(v => { const i = d.values.indexOf(v); return i < 0 ? 0 : d.probs[i]; }) };
    }),
    yFormat: v => `${Math.round(v * 100)}%`,
    valueFormat: pct,
    tooltipTitle: v => `Score ${v} (${signed(modifier(v))})`,
    xLabel: 'Score',
    yMin: 0,
    tooltip,
  });

  const ranks = Math.max(...active.map(m => stats(m).sim.rankMeans.length));
  const rankXs = Array.from({ length: ranks }, (_, i) => i + 1);
  const ordinal = n => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10]}`;
  const rankSeries = active.map(m => ({ name: m.name, color: m.color, values: rankXs.map(r => stats(m).sim.rankMeans[r - 1] ?? null) }));
  const rankValues = rankSeries.flatMap(s => s.values.filter(v => v != null));
  lineChart($('#chart-rank'), {
    xs: rankXs,
    series: rankSeries,
    xFormat: ordinal,
    tooltipTitle: r => `${ordinal(r)} highest score`,
    valueFormat: v => `${num(v)} (${signed(modifier(Math.round(v)))})`,
    yMin: Math.max(0, Math.floor(Math.min(...rankValues) - 1)),
    yMax: Math.ceil(Math.max(...rankValues) + 1),
    xLabel: 'Scores in the array, sorted from highest to lowest',
    tooltip,
  });

  const bins = new Map(rolled.map(m => {
    const h = new Map();
    const { sim } = stats(m);
    sim.pbeHist.forEach((count, v) => {
      const b = Math.floor(v / PBE_BIN) * PBE_BIN;
      h.set(b, (h.get(b) || 0) + count / sim.n);
    });
    return [m.id, h];
  }));
  const keys = [...bins.values()].flatMap(h => [...h.keys()]);
  const pbeXs = [];
  if (keys.length) for (let b = Math.min(...keys, 27); b <= Math.max(...keys, 27); b += PBE_BIN) pbeXs.push(b);
  lineChart($('#chart-pbe'), {
    xs: pbeXs,
    series: rolled.map(m => ({ name: m.name, color: m.color, values: pbeXs.map(b => bins.get(m.id).get(b) ?? 0) })),
    yFormat: v => `${Math.round(v * 100)}%`,
    valueFormat: pct,
    xFormat: v => `${v}`,
    tooltipTitle: b => `${b} to ${b + PBE_BIN - 1} points`,
    refLines: [{ x: 27, label: '27 pts · point buy / standard array' }],
    xLabel: 'Point-buy value of the whole array',
    yMin: 0,
    maxXTicks: 10,
    tooltip,
  });
}

function scoreCards(set) {
  return set.map(s => `
    <div class="score-card ${s.dropped ? 'is-dropped' : ''}">
      <span class="score-value">${s.value}</span>
      <span class="score-mod">${signed(modifier(s.value))}</span>
      <span class="dice">${s.dice.map(d => `<span class="die ${d.kept ? '' : 'is-dropped'}" title="${d.rerolled.length ? `rerolled ${d.rerolled.join(', ')}` : ''}">${d.rerolled.length ? '↻' : ''}${d.value}</span>`).join('')}</span>
    </div>`).join('');
}

function setSummary(values) {
  return `Σ mods ${signed(SET_METRICS.mods.fn(values))} · ${SET_METRICS.pbe.fn(values)} pts · total ${SET_METRICS.total.fn(values)}`;
}

function renderRolls() {
  const active = methods.filter(m => m.enabled);
  $('#roll-results').innerHTML = active.map(m => {
    const { sets, chosen, attempts, failed } = rollArray(m);
    const head = `<span class="swatch" style="background:${m.color}"></span><strong>${escapeHtml(m.name)}</strong>`;
    if (failed) {
      return `<article class="roll-row"><header>${head}<span class="roll-meta warn">No valid set after ${attempts.toLocaleString()} tries</span></header></article>`;
    }
    const values = keptValues(sets[chosen]);
    const extraSets = m.fixed ? 0 : attempts - m.sets;
    const meta = [setSummary(values)];
    if (extraSets > 0) meta.push(`${extraSets} set${extraSets > 1 ? 's' : ''} rerolled`);
    const others = sets
      .map((set, i) => ({ set, i }))
      .filter(({ i }) => i !== chosen)
      .map(({ set, i }) => `<div class="other-set"><span>Set ${i + 1} (discarded):</span> <strong>${keptValues(set).join(' · ')}</strong> <span>${setSummary(keptValues(set))}</span></div>`)
      .join('');
    const label = sets.length > 1 ? `<span class="set-label">Set ${chosen + 1} kept (highest ${SET_METRICS[m.keepBy].short})</span>` : '';
    return `<article class="roll-row">
      <header>${head}${label}<span class="roll-meta">${meta.join(' · ')}</span></header>
      <div class="score-cards">${scoreCards(sets[chosen])}</div>
      ${others}
    </article>`;
  }).join('') || '<p class="empty">Enable a method to roll.</p>';
}

function render() {
  const active = methods.filter(m => m.enabled);
  renderMethodList();
  renderLegends(active);
  if (!active.length) {
    $('#summary-table').innerHTML = '';
    ['#chart-dist', '#chart-rank', '#chart-pbe'].forEach(s => { $(s).innerHTML = '<p class="empty">Enable at least one method.</p>'; });
    return;
  }
  renderSummary(active);
  renderCharts(active);
}

function readCustomForm() {
  const custom = methods.find(m => m.custom);
  const f = $('#custom-form');
  const int = (name, min, max) => Math.min(max, Math.max(min, parseInt(f.elements[name].value, 10) || 0));
  custom.name = f.elements.name.value.trim() || 'Custom';
  custom.sides = int('sides', 2, 100);
  custom.dice = int('dice', 1, 12);
  while (custom.sides ** custom.dice > 2e9 && custom.dice > 1) custom.dice--;
  custom.keep = Math.min(int('keep', 1, 12), custom.dice);
  custom.reroll = Math.min(int('reroll', 0, 99), custom.sides - 1);
  custom.rerollMode = f.elements.rerollMode.value;
  custom.bonus = int('bonus', -20, 20);
  custom.scores = int('scores', 1, 10);
  custom.extra = int('extra', 0, 6);
  custom.sets = int('sets', 1, 5);
  custom.keepBy = f.elements.keepBy.value;
  custom.rerollIf = f.elements.rerollIf.value;
  custom.rerollBelow = int('rerollBelow', -100, 300);
  custom.enabled = true;
}

function fillCustomForm() {
  const custom = methods.find(m => m.custom);
  const f = $('#custom-form');
  for (const key of ['name', 'dice', 'sides', 'keep', 'reroll', 'rerollMode', 'bonus', 'scores', 'extra', 'sets', 'keepBy', 'rerollIf', 'rerollBelow']) {
    f.elements[key].value = custom[key];
  }
}

function loadIntoCustom(id) {
  const src = methods.find(m => m.id === id);
  const custom = methods.find(m => m.custom);
  if (!src || src.fixed) return;
  Object.assign(custom, { ...src, id: custom.id, color: custom.color, custom: true, enabled: true, name: `${src.name} (custom)` });
  fillCustomForm();
  render();
}

let debounce;
$('#custom-form').addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => { readCustomForm(); render(); }, 250);
});
$('#custom-form').addEventListener('submit', e => e.preventDefault());

const metricOptions = Object.entries(SET_METRICS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');
$('#custom-form').elements.keepBy.innerHTML = metricOptions;
$('#custom-form').elements.rerollIf.innerHTML = '<option value="off">Never</option>' + metricOptions;

$('#copy-from').innerHTML = '<option value="">Copy from preset…</option>' + methods
  .filter(m => !m.fixed && !m.custom)
  .map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
$('#copy-from').addEventListener('change', e => { loadIntoCustom(e.target.value); e.target.value = ''; });

$('#method-list').addEventListener('change', e => {
  const m = methods.find(x => x.id === e.target.dataset.id);
  if (!m) return;
  m.enabled = e.target.checked;
  render();
});

$('#roll-btn').addEventListener('click', renderRolls);

let lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
  if (Math.abs(window.innerWidth - lastWidth) < 20) return;
  lastWidth = window.innerWidth;
  clearTimeout(debounce);
  debounce = setTimeout(() => { const active = methods.filter(m => m.enabled); if (active.length) renderCharts(active); }, 150);
});

fillCustomForm();
render();
renderRolls();
