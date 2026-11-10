// Tiny synthesised sound kit (Web Audio) — no audio files needed.
let ctx = null, master = null, noiseBuf = null, crowd = null;
let muted = false;

function noise() {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  return s;
}
function env(g, t0, a, peak, d) {
  g.gain.cancelScheduledValues(t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
}
function tone(freq, type, a, peak, d, slideTo) {
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + a + d);
  env(g, t, a, peak, d);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + a + d + 0.05);
}
function burst(freq, q, a, peak, d, type = 'bandpass', slideTo) {
  const t = ctx.currentTime;
  const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + a + d);
  env(g, t, a, peak, d);
  n.connect(f).connect(g).connect(master);
  n.start(t); n.stop(t + a + d + 0.05);
}

export const sfx = {
  init() {
    if (ctx) { ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // constant arena murmur
    const n = noise(), f = ctx.createBiquadFilter();
    crowd = ctx.createGain();
    f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 0.4;
    crowd.gain.value = 0.05;
    n.connect(f).connect(crowd).connect(master); n.start();
  },
  toggle() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.8;
    return muted;
  },
  bounce(v = 1) { if (!ctx) return; tone(120, 'sine', 0.004, 0.5 * v, 0.11, 55); burst(900, 1, 0.002, 0.12 * v, 0.04); },
  squeak() { if (!ctx) return; tone(1900 + Math.random() * 700, 'triangle', 0.01, 0.06, 0.07, 2900); },
  swish() { if (!ctx) return; burst(5200, 0.8, 0.01, 0.5, 0.32, 'bandpass', 1400); },
  rim() { if (!ctx) return; [437, 712, 1183, 1790].forEach((f, i) => tone(f, 'square', 0.002, 0.09 / (i + 1), 0.28)); },
  dunk() {
    if (!ctx) return;
    tone(90, 'sine', 0.004, 0.9, 0.35, 38);
    [330, 541, 872].forEach((f) => tone(f, 'square', 0.002, 0.07, 0.5));
    burst(300, 0.6, 0.004, 0.5, 0.25, 'lowpass');
  },
  roar(amount = 1) {
    if (!ctx) return;
    const t = ctx.currentTime;
    crowd.gain.cancelScheduledValues(t);
    crowd.gain.setValueAtTime(crowd.gain.value, t);
    crowd.gain.linearRampToValueAtTime(0.05 + 0.4 * amount, t + 0.25);
    crowd.gain.exponentialRampToValueAtTime(0.05, t + 3.2);
    burst(1500, 0.3, 0.3, 0.22 * amount, 2.2);
  },
  groan() { if (!ctx) return; burst(260, 0.7, 0.15, 0.14, 0.7); },
  buzzer() { if (!ctx) return; tone(196, 'sawtooth', 0.01, 0.12, 0.7); tone(247, 'sawtooth', 0.01, 0.1, 0.7); },
  ui() { if (!ctx) return; tone(660, 'triangle', 0.005, 0.12, 0.09, 990); },
};
