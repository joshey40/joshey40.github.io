const SVG_NS = 'http://www.w3.org/2000/svg';

function niceTicks(min, max, count = 5) {
  const span = max - min || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(f => f * mag).find(s => s >= raw);
  const ticks = [];
  const top = Math.ceil(max / step - 1e-9) * step;
  for (let v = Math.ceil(min / step) * step; v <= top + step * 1e-9; v += step) ticks.push(+v.toFixed(10));
  return { ticks, step };
}

function el(name, attrs = {}, parent) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

export function lineChart(container, opts) {
  const {
    xs, series, tooltip,
    xFormat = v => v,
    yFormat = v => v,
    valueFormat = yFormat,
    tooltipTitle = x => xFormat(x),
    yMin: yMinOpt, yMax: yMaxOpt,
    refLines = [],
    height = 280,
    xLabel, maxXTicks = 12,
  } = opts;

  container.innerHTML = '';
  if (!series.length || !xs.length) {
    container.innerHTML = '<p class="empty">Enable at least one rolled method.</p>';
    return;
  }

  const W = Math.max(240, container.clientWidth);
  const H = height;
  const m = { t: 14, r: 18, b: xLabel ? 44 : 28, l: 48 };
  const values = series.flatMap(s => s.values.filter(v => v != null));
  const yMin = yMinOpt ?? Math.min(0, ...values);
  const { ticks: yTicks } = niceTicks(yMin, yMaxOpt ?? Math.max(...values));
  const yMax = Math.max(yMaxOpt ?? 0, yTicks[yTicks.length - 1]);
  const xMin = xs[0], xMax = xs[xs.length - 1];

  const x = v => m.l + (xMax === xMin ? 0.5 : (v - xMin) / (xMax - xMin)) * (W - m.l - m.r);
  const y = v => m.t + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - m.t - m.b);

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
  const grid = el('g', { class: 'grid' }, svg);
  yTicks.forEach(t => {
    el('line', { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t) }, grid);
    const label = el('text', { x: m.l - 8, y: y(t), 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'tick' }, grid);
    label.textContent = yFormat(t);
  });

  const every = Math.ceil(xs.length / maxXTicks);
  xs.forEach((v, i) => {
    if (i % every !== 0 && i !== xs.length - 1) return;
    const label = el('text', { x: x(v), y: H - m.b + 18, 'text-anchor': 'middle', class: 'tick' }, grid);
    label.textContent = xFormat(v);
  });
  if (xLabel) {
    const label = el('text', { x: (m.l + W - m.r) / 2, y: H - 6, 'text-anchor': 'middle', class: 'axis-label' }, grid);
    label.textContent = xLabel;
  }
  el('line', { x1: m.l, x2: W - m.r, y1: y(yMin), y2: y(yMin), class: 'baseline' }, svg);

  refLines.forEach(ref => {
    if (ref.x < xMin || ref.x > xMax) return;
    const g = el('g', { class: 'ref' }, svg);
    el('line', { x1: x(ref.x), x2: x(ref.x), y1: m.t, y2: y(yMin) }, g);
    const label = el('text', { x: x(ref.x) + 6, y: m.t + 10 }, g);
    label.textContent = ref.label;
  });

  series.forEach(s => {
    if (s.dotsOnly) {
      s.values.forEach((v, i) => {
        if (v) el('circle', { cx: x(xs[i]), cy: y(v), r: 4, fill: s.color, class: 'hover-dot' }, svg);
      });
      return;
    }
    let d = '';
    let pen = false;
    s.values.forEach((v, i) => {
      if (v == null) { pen = false; return; }
      d += `${pen ? 'L' : 'M'}${x(xs[i]).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    el('path', { d, class: 'series-line', stroke: s.color }, svg);
  });

  const hover = el('g', { class: 'hover', visibility: 'hidden' }, svg);
  const cross = el('line', { y1: m.t, y2: y(yMin), class: 'crosshair' }, hover);
  const dots = series.map(s => el('circle', { r: 4, fill: s.color, class: 'hover-dot' }, hover));
  const overlay = el('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'transparent' }, svg);

  const hide = () => { hover.setAttribute('visibility', 'hidden'); tooltip.hidden = true; };
  const show = evt => {
    const rect = svg.getBoundingClientRect();
    const px = (evt.clientX - rect.left) * (W / rect.width);
    let idx = 0;
    xs.forEach((v, i) => { if (Math.abs(x(v) - px) < Math.abs(x(xs[idx]) - px)) idx = i; });
    const xv = xs[idx];
    cross.setAttribute('x1', x(xv));
    cross.setAttribute('x2', x(xv));
    series.forEach((s, i) => {
      const v = s.values[idx];
      dots[i].setAttribute('visibility', v == null ? 'hidden' : 'visible');
      if (v != null) { dots[i].setAttribute('cx', x(xv)); dots[i].setAttribute('cy', y(v)); }
    });
    hover.setAttribute('visibility', 'visible');

    const rows = series
      .map(s => ({ s, v: s.values[idx] }))
      .filter(r => r.v != null)
      .sort((a, b) => b.v - a.v)
      .map(({ s, v }) => `<div class="tt-row"><span class="swatch" style="background:${s.color}"></span><span>${s.name}</span><strong>${valueFormat(v)}</strong></div>`)
      .join('');
    tooltip.innerHTML = `<div class="tt-title">${tooltipTitle(xv)}</div>${rows}`;
    tooltip.hidden = false;
    const tw = tooltip.offsetWidth;
    const left = evt.clientX + 16 + tw > window.innerWidth ? evt.clientX - 16 - tw : evt.clientX + 16;
    tooltip.style.left = `${Math.max(8, left)}px`;
    tooltip.style.top = `${evt.clientY + 12}px`;
  };
  overlay.addEventListener('pointermove', show);
  overlay.addEventListener('pointerdown', show);
  overlay.addEventListener('pointerleave', hide);

  container.appendChild(svg);
}
