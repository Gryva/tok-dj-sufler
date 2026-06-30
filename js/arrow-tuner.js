// TEMP DEBUG TOOL — lets the direction-card arrow animation be tuned live
// from a floating panel instead of hardcoded values. Remove this file (and
// its <script> tag in index.html) once the look is locked in.

const ICONS = {
  up:   { rotate: 45,  path: '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>' },
  down: { rotate: -45, path: '<line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/>' },
  flow: { rotate: 0,   path: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>' },
};

const params = {
  rows: 3,
  spread: 70,      // % of card height the rows are spread across
  speed: 7,        // seconds per loop
  size: 13,        // px
  opacity: 0.22,
  gapMin: 14,
  gapMax: 40,
  iconsPerRow: 14,
};

function svgFor(kind, gap, jitter){
  const icon = ICONS[kind];
  return `<svg style="margin-right:${gap}px; transform:rotate(${icon.rotate}deg) translateY(${jitter}px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.path}</svg>`;
}

function buildRowHTML(kind){
  const seq = [];
  for (let i = 0; i < params.iconsPerRow; i++){
    const gap = params.gapMin + Math.random() * (params.gapMax - params.gapMin);
    const jitter = (Math.random() * 12 - 6);
    seq.push(svgFor(kind, gap.toFixed(1), jitter.toFixed(1)));
  }
  // duplicate the sequence so the translateX(-50%)->translateX(0%) loop tiles seamlessly
  return seq.join('') + seq.join('');
}

function rebuildWrapper(wrapper, kind){
  if (!wrapper) return;
  wrapper.innerHTML = '';
  const rows = kind === 'flow' ? 1 : params.rows;
  const half = params.spread / 2;
  for (let r = 0; r < rows; r++){
    const top = rows === 1 ? 50 : 50 - half + (half * 2 * r) / (rows - 1);
    const track = document.createElement('div');
    track.className = 'tok-dir-flow-arrows-track';
    track.style.top = top + '%';
    track.style.animationDelay = (-r * params.speed / Math.max(rows, 1)).toFixed(2) + 's';
    track.innerHTML = buildRowHTML(kind);
    wrapper.appendChild(track);
  }
}

function applyCSSVars(){
  const root = document.documentElement.style;
  root.setProperty('--tok-arrow-size', params.size + 'px');
  root.setProperty('--tok-arrow-opacity', params.opacity);
  root.setProperty('--tok-arrow-speed', params.speed + 's');
}

function rebuildAll(){
  applyCSSVars();
  rebuildWrapper(document.querySelector('.tok-dir-flow-arrows.diag-up'), 'up');
  rebuildWrapper(document.querySelector('.tok-dir-flow-arrows.diag-down'), 'down');
  rebuildWrapper(document.querySelector('.tok-dir-flow-arrows:not(.diag-up):not(.diag-down)'), 'flow');
}

function buildPanel(){
  const panel = document.createElement('div');
  panel.id = 'tokArrowTuner';
  panel.style.cssText = 'position:fixed; left:8px; top:8px; z-index:9999; background:rgba(20,20,24,0.92); color:#fff; font:12px/1.4 system-ui,sans-serif; padding:10px 12px; border-radius:10px; width:220px; max-height:60vh; overflow:auto; box-shadow:0 4px 24px rgba(0,0,0,0.4);';

  const controls = [
    { key: 'rows', label: 'Rows', min: 1, max: 40, step: 1 },
    { key: 'spread', label: 'Spread %', min: 0, max: 400, step: 1 },
    { key: 'speed', label: 'Speed (s)', min: 0.1, max: 60, step: 0.1 },
    { key: 'size', label: 'Icon size (px)', min: 1, max: 100, step: 1 },
    { key: 'opacity', label: 'Opacity', min: 0, max: 1, step: 0.01 },
    { key: 'gapMin', label: 'Gap min (px)', min: 0, max: 300, step: 1 },
    { key: 'gapMax', label: 'Gap max (px)', min: 0, max: 300, step: 1 },
    { key: 'iconsPerRow', label: 'Icons per row', min: 1, max: 120, step: 1 },
  ];

  // Each control also gets a free-typed number input next to it, so the
  // slider's min/max never actually caps what you can set — drag for quick
  // changes, or type any value (even outside the slider's range) directly.
  let html = '<div style="font-weight:600; margin-bottom:6px;">Arrow tuner (debug)</div>';
  controls.forEach(c => {
    html += `<label style="display:block; margin-bottom:6px;">${c.label}:
      <input type="number" data-key="${c.key}" data-role="number" value="${params[c.key]}" step="${c.step}" style="width:60px; margin-left:4px;"><br>
      <input type="range" data-key="${c.key}" data-role="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${params[c.key]}" style="width:100%;">
    </label>`;
  });
  html += '<button id="tokArrowReroll" style="width:100%; margin-top:4px; padding:6px; border-radius:6px; border:none; cursor:pointer;">Re-roll spacing</button>';
  panel.innerHTML = html;
  document.body.appendChild(panel);

  panel.querySelectorAll('input[data-key]').forEach(input => {
    input.addEventListener('input', () => {
      const key = input.dataset.key;
      const val = parseFloat(input.value);
      if (Number.isNaN(val)) return;
      params[key] = val;
      panel.querySelectorAll(`input[data-key="${key}"]`).forEach(sibling => {
        if (sibling !== input) sibling.value = val;
      });
      rebuildAll();
    });
  });
  panel.querySelector('#tokArrowReroll').addEventListener('click', rebuildAll);
}

function forceArrowsVisible(){
  // The up/down arrows are normally gated behind the `.chosen` class (they
  // only animate once that direction is picked). Override that while the
  // debug panel is active so they're visible for tuning regardless of state.
  const style = document.createElement('style');
  style.textContent = `
    .tok-dir-flow-arrows.diag-up .tok-dir-flow-arrows-track,
    .tok-dir-flow-arrows.diag-down .tok-dir-flow-arrows-track {
      animation-play-state: running !important;
      opacity: var(--tok-arrow-opacity, 0.22) !important;
    }
  `;
  document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', () => {
  forceArrowsVisible();
  rebuildAll();
  buildPanel();
});
