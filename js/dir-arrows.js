// Builds the drifting arrow icons behind each direction card's text/cover/icon.
// Values below were tuned live and locked in. Each card's arrows only animate
// once that direction is the chosen one (see .tok-dir.chosen in style.css).

const ICONS = {
  up:   { rotate: 45,  path: '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>' },
  down: { rotate: -45, path: '<line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/>' },
  flow: { rotate: 0,   path: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>' },
};

const PARAMS = {
  up:   { rows: 30, spread: 600, speed: 15.5, size: 15, opacity: 0.15, gapMin: 24, gapMax: 102, iconsPerRow: 5 },
  down: { rows: 30, spread: 600, speed: 15.5, size: 15, opacity: 0.15, gapMin: 24, gapMax: 102, iconsPerRow: 5 },
  flow: { rows: 3,  spread: 70,  speed: 26,   size: 15, opacity: 0.22, gapMin: 14, gapMax: 60,  iconsPerRow: 14 },
};

function svgFor(kind, gap, jitter){
  const icon = ICONS[kind];
  return `<svg style="margin-right:${gap}px; transform:rotate(${icon.rotate}deg) translateY(${jitter}px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.path}</svg>`;
}

function buildRowHTML(kind, p){
  const seq = [];
  for (let i = 0; i < p.iconsPerRow; i++){
    const gap = p.gapMin + Math.random() * (p.gapMax - p.gapMin);
    const jitter = (Math.random() * 12 - 6);
    seq.push(svgFor(kind, gap.toFixed(1), jitter.toFixed(1)));
  }
  // duplicate the sequence so the translateX(-50%)->translateX(0%) loop tiles seamlessly
  return seq.join('') + seq.join('');
}

function buildWrapper(wrapper, kind){
  if (!wrapper) return;
  const p = PARAMS[kind];
  wrapper.style.setProperty('--tok-arrow-size', p.size + 'px');
  wrapper.style.setProperty('--tok-arrow-opacity', p.opacity);
  wrapper.style.setProperty('--tok-arrow-speed', p.speed + 's');
  wrapper.innerHTML = '';
  const rows = p.rows;
  const half = p.spread / 2;
  for (let r = 0; r < rows; r++){
    const top = rows === 1 ? 50 : 50 - half + (half * 2 * r) / (rows - 1);
    const row = document.createElement('div');
    row.className = 'tok-dir-flow-arrows-row';
    row.style.top = top + '%';
    const track = document.createElement('div');
    track.className = 'tok-dir-flow-arrows-track';
    track.style.animationDelay = (-r * p.speed / Math.max(rows, 1)).toFixed(2) + 's';
    track.innerHTML = buildRowHTML(kind, p);
    row.appendChild(track);
    wrapper.appendChild(row);
  }
}

function wrapperFor(kind){
  if (kind === 'up') return document.querySelector('.tok-dir-flow-arrows.diag-up');
  if (kind === 'down') return document.querySelector('.tok-dir-flow-arrows.diag-down');
  return document.querySelector('.tok-dir-flow-arrows:not(.diag-up):not(.diag-down)');
}

// Brief "selection pulse": on pick, arrows jump ~15% faster and a bit
// brighter, then ease back down to the locked-in defaults over ~900ms —
// a subtle extra cue that the direction just changed.
//
// Speed is driven via Animation.playbackRate rather than by changing
// --tok-arrow-speed (animation-duration): CSS animations derive their
// current position from total elapsed time divided by duration, so
// shrinking then growing the duration mid-flight recomputes that phase
// and makes the icons visibly jump backward. playbackRate just scales how
// fast time advances from wherever the animation currently is, so it
// speeds up and settles back down without ever reversing.
const PULSE = {
  rateFactor: 1 / 0.85,  // how much faster at peak, e.g. 1/0.85 = ~15% faster
  opacityFactor: 1.4,    // how much brighter at peak, multiplies the default opacity
  durationMs: 900,
};

function pulse(kind){
  const wrapper = wrapperFor(kind);
  if (!wrapper) return;
  const p = PARAMS[kind];
  const tracks = wrapper.querySelectorAll('.tok-dir-flow-arrows-track');
  // Disable the CSS opacity transition for the duration of the pulse so it
  // doesn't fight the per-frame values driven here.
  tracks.forEach(track => { track.style.transition = 'none'; });

  const anims = Array.from(tracks).flatMap(track => track.getAnimations());
  const peakOpacity = Math.min(p.opacity * PULSE.opacityFactor, 1);

  // A card that's just been switched from paused to running has a *pending*
  // animation: its start time isn't committed yet. Writing playbackRate
  // every frame while pending cancels and re-queues that start task each
  // time, so the animation never actually commits and looks frozen. Wait
  // for it to actually start before driving playbackRate.
  Promise.all(anims.map(anim => anim.ready)).then(() => {
    const start = performance.now();
    const duration = PULSE.durationMs;
    const rateFactor = PULSE.rateFactor;

    function step(now){
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const rate = rateFactor + (1 - rateFactor) * ease;
      const opacity = peakOpacity + (p.opacity - peakOpacity) * ease;
      anims.forEach(anim => { anim.playbackRate = rate; });
      wrapper.style.setProperty('--tok-arrow-opacity', opacity.toFixed(3));
      if (t < 1){
        requestAnimationFrame(step);
      } else {
        anims.forEach(anim => { anim.playbackRate = 1; });
        tracks.forEach(track => { track.style.transition = ''; });
      }
    }
    requestAnimationFrame(step);
  });
}

window.tokPulseDirArrows = pulse;

// TEMP DEBUG: lets the selection-pulse strength/duration be tuned live.
// Remove this block once values are locked in.
function buildPulseTuner(){
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed; left:8px; top:8px; z-index:9999; background:rgba(20,20,24,0.92); color:#fff; font:12px/1.4 system-ui,sans-serif; padding:10px 12px; border-radius:10px; width:220px; box-shadow:0 4px 24px rgba(0,0,0,0.4);';
  panel.innerHTML = `
    <div style="font-weight:600; margin-bottom:6px;">Pulse tuner (debug)</div>
    <label style="display:block; margin-bottom:8px;">Peak speed-up (x):
      <input type="number" id="tokPulseRate" value="${PULSE.rateFactor.toFixed(2)}" step="0.05" style="width:60px; margin-left:4px;"><br>
      <input type="range" id="tokPulseRateRange" min="1" max="6" step="0.05" value="${PULSE.rateFactor}" style="width:100%;">
    </label>
    <label style="display:block; margin-bottom:8px;">Peak opacity (x default):
      <input type="number" id="tokPulseOpacity" value="${PULSE.opacityFactor.toFixed(2)}" step="0.1" style="width:60px; margin-left:4px;"><br>
      <input type="range" id="tokPulseOpacityRange" min="1" max="6" step="0.1" value="${PULSE.opacityFactor}" style="width:100%;">
    </label>
    <label style="display:block; margin-bottom:10px;">Duration (ms):
      <input type="number" id="tokPulseDuration" value="${PULSE.durationMs}" step="50" style="width:60px; margin-left:4px;"><br>
      <input type="range" id="tokPulseDurationRange" min="100" max="5000" step="50" value="${PULSE.durationMs}" style="width:100%;">
    </label>
    <div style="display:flex; gap:6px;">
      <button id="tokPulseTestUp" style="flex:1;">Up</button>
      <button id="tokPulseTestFlow" style="flex:1;">Flow</button>
      <button id="tokPulseTestDown" style="flex:1;">Down</button>
    </div>
  `;
  document.body.appendChild(panel);

  function wire(numId, rangeId, key){
    const num = panel.querySelector('#' + numId);
    const range = panel.querySelector('#' + rangeId);
    const sync = (val) => {
      num.value = val; range.value = val;
      PULSE[key] = parseFloat(val);
    };
    num.addEventListener('input', () => sync(num.value));
    range.addEventListener('input', () => sync(range.value));
  }
  wire('tokPulseRate', 'tokPulseRateRange', 'rateFactor');
  wire('tokPulseOpacity', 'tokPulseOpacityRange', 'opacityFactor');
  wire('tokPulseDuration', 'tokPulseDurationRange', 'durationMs');

  function trigger(kind){
    document.querySelectorAll('.tok-dir').forEach(c => c.classList.toggle('chosen', c.dataset.dir === kind));
    pulse(kind);
  }
  panel.querySelector('#tokPulseTestUp').addEventListener('click', () => trigger('up'));
  panel.querySelector('#tokPulseTestFlow').addEventListener('click', () => trigger('flow'));
  panel.querySelector('#tokPulseTestDown').addEventListener('click', () => trigger('down'));
}

document.addEventListener('DOMContentLoaded', () => {
  buildWrapper(document.querySelector('.tok-dir-flow-arrows.diag-up'), 'up');
  buildWrapper(document.querySelector('.tok-dir-flow-arrows.diag-down'), 'down');
  buildWrapper(document.querySelector('.tok-dir-flow-arrows:not(.diag-up):not(.diag-down)'), 'flow');
  buildPulseTuner();
});
