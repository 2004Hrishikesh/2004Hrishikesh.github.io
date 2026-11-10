import * as THREE from 'three';
import { buildArena, HOOP, COURT } from './arena.js';
import { makeBaller, poseMove, poseShoot, poseDunk, poseHang, poseDefend, poseDown, poseIdle } from './player.js';
import { PROJECTS, PLAYER } from './projects.js';
import { sfx } from './audio.js';
import { hud } from './hud.js';
import { page } from './page.js';
import { makeVision } from './vision.js';

const G = 9.8, BALL_R = 0.12;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const dampAngle = (a, b, k) => { const d = (((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * k; };
// vertical jump profile driven by meter progress: leaves floor at .25, peaks at .825 (the green zone), lands at 1.4
const jumpY = (p) => 0.72 * Math.sin(Math.PI * clamp((p - 0.25) / 1.15, 0, 1));

// ───────── renderer / scene ─────────
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 120);
function resize() { // the canvas is full-window on desktop and a pinned band on phones
  const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); new ResizeObserver(resize).observe(canvas); resize();

const arena = buildArena(scene, PLAYER, PROJECTS);

// ───────── actors ─────────
const me = makeBaller({ skin: 0x7a4a2c, jersey: 0xffc531, shorts: 0xffc531, trim: 0x5b2bd6, shoe: 0xffffff, number: PLAYER.number, numColor: '#5b2bd6', headband: true });
me.x = 4.5; me.z = 3; me.yaw = Math.PI / 2; scene.add(me.root);
const marker = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.6, 40), new THREE.MeshBasicMaterial({ color: 0xffc531, transparent: true, opacity: 0.9, depthWrite: false }));
marker.rotation.x = -Math.PI / 2; marker.position.y = 0.025; scene.add(marker);

camera.layers.enable(1); // name labels live on layer 1 so the floor mirror ignores them
const SKINS = [0x8d5a3b, 0x5c3a24, 0xc68e63, 0x4a301f, 0xdba882];
function nameSprite(text) {
  const c = document.createElement('canvas'); c.width = 320; c.height = 64; const g = c.getContext('2d');
  g.font = '800 40px "Barlow Condensed", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 7; g.strokeStyle = 'rgba(10,6,24,.85)'; g.strokeText(text, 160, 34); g.fillStyle = '#fff'; g.fillText(text, 160, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  sp.scale.set(1.9, 0.38, 1); sp.layers.set(1); sp.renderOrder = 5; scene.add(sp); return sp;
}
let castN = 0;
function cast(kind, n, name, x, z) {
  const i = castN++;
  const look = kind === 'mate' ? { jersey: 0xffc531, shorts: 0xffc531, trim: 0x5b2bd6, shoe: 0xffffff, numColor: '#5b2bd6' }
    : kind === 'ref' ? { jersey: 0xffffff, shorts: 0x111111, trim: 0x111111, shoe: 0x111111, numColor: 'rgba(0,0,0,0)', stripes: true, pants: true }
    : { jersey: 0x1e7a3c, shorts: 0x1e7a3c, trim: 0xf4f4f4, shoe: 0x16161c, numColor: '#f4f4f4' };
  const b = makeBaller({ ...look, skin: SKINS[(i * 3 + 1) % SKINS.length], number: n, hair: i % 4 === 2 ? null : 0x16110e, hairLen: i % 3 ? 0.48 : 0.4, headband: i % 5 === 3 });
  b.x = b.gx = x; b.z = b.gz = z; b.yaw = kind === 'mate' ? Math.PI / 2 : -Math.PI / 2; b.down = 0; b.seed = i * 1.7;
  b.label = name ? nameSprite(name) : null; scene.add(b.root); return b;
}
// your teammates are your tech stack; the other team is everything that ships late
const stackNames = PLAYER.teammates || [...new Set(PROJECTS.flatMap((p) => p.stack))];
const mates = [[11.5, 6.6, '3'], [6.0, -5.3, '11'], [12.0, -3.7, '34'], [2.4, 4.6, '7']]
  .map(([x, z, n], i) => cast('mate', n, stackNames[i] || 'Teammate', x, z));
const center = cast('rival', '0', 'Legacy Code', HOOP.x - 1.5, 0), shadow = cast('rival', '4', 'Bug', 7, 2);
const guards = [[mates[0], '1', 'Deadline'], [mates[1], '12', 'Merge Conflict'], [mates[3], '30', 'Scope Creep']].map(([m, n, name]) => {
  const d = Math.hypot(HOOP.x - m.x, HOOP.z - m.z); return cast('rival', n, name, m.x + (HOOP.x - m.x) / d * 1.15, m.z + (HOOP.z - m.z) / d * 1.15);
});
const defenders = [center, shadow, ...guards], bodies = [...defenders, ...mates];
const ref = cast('ref', '', '', 5.2, -8.0); ref.yaw = 0;
// everyone the "model view" overlay should detect, with a stable track id each
const tracked = [me, ...mates, ...defenders, ref].map((b, i) => ({ b, id: i + 1, hero: b === me, seed: i * 1.37 }));
const vision = makeVision(canvas, camera);
function setThermal(on) { document.body.classList.toggle('thermal', on); arena.setThermal(on); for (const t of tracked) t.b.setHot(on); }

const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 20, 14), new THREE.MeshStandardMaterial({ color: 0xd9641e, roughness: 0.75 }));
ball.castShadow = true; scene.add(ball);
{ const seam = new THREE.Mesh(new THREE.TorusGeometry(BALL_R + 0.001, 0.004, 4, 24), new THREE.MeshBasicMaterial({ color: 0x1a0d05 }));
  const s2 = seam.clone(); s2.rotation.y = Math.PI / 2; const s3 = seam.clone(); s3.rotation.x = Math.PI / 2; ball.add(seam, s2, s3); }
const B = { state: 'held', vel: new THREE.Vector3(), S: new THREE.Vector3(), E: new THREE.Vector3(), T: 1, t: 0, vy: 0, make: false, shot: null };

// ───────── game state ─────────
const dunkSpot = arena.spots.find((s) => s.proj.play === 'dunk');
const S = {
  mode: 'page', section: 'about', time: 0, clock: 120, home: 98, away: 99, missStreak: 0,
  action: 'free', p: 0, shot: null, hasBall: true, t: 0, vy: 0, from: new THREE.Vector3(), to: new THREE.Vector3(),
  meterHold: 0, meterState: '', vx: 0, vz: 0, ts: 1, dph: 0, cheer: 0, shake: 0, zoom: 0, activeSpot: null, finale: false, tasks: [],
};
const unlocked = new Set();
try { JSON.parse(localStorage.getItem('arena.unlocked') || '[]').forEach((id) => PROJECTS.some((p) => p.id === id) && unlocked.add(id)); } catch { /* storage unavailable */ }
arena.spots.forEach((s) => unlocked.has(s.proj.id) && arena.setDone(s));
const after = (sec, fn) => S.tasks.push({ at: S.time + sec, fn });

// ───────── input ─────────
const keys = new Set(), joy = { x: 0, y: 0 };
const MOVE = { KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1], KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0] };
window.addEventListener('keydown', (e) => {
  if (S.mode === 'page') return;
  if (S.mode === 'intro') { if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); start(); } else if (e.code === 'Escape') exitGame(); return; }
  if (S.mode === 'modal') { if (e.code === 'Escape' || e.code === 'Enter') { e.preventDefault(); hud.close(); } return; }
  if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) shootDown(); }
  else if (e.code === 'Tab') { e.preventDefault(); openList(); }
  else if (e.code === 'KeyM') mute();
  else if (e.code === 'Escape') { exitGame(); return; }
  else if (MOVE[e.code]) e.preventDefault();
  keys.add(e.code);
});
window.addEventListener('keyup', (e) => { keys.delete(e.code); if (e.code === 'Space') shootUp(); });
window.addEventListener('blur', () => { keys.clear(); shootUp(); });

const $ = (id) => document.getElementById(id);
$('btnStart').onclick = () => start();
$('btnSkip').onclick = () => exitGame();
$('btnExit').onclick = () => exitGame();
$('btnList').onclick = () => openList();
$('btnMute').onclick = () => mute();
function mute() { $('btnMute').textContent = sfx.toggle() ? 'SOUND OFF' : 'SOUND ON'; }
{ // touch controls
  const j = $('joy'), nub = j.firstElementChild, sb = $('btnShoot');
  const mv = (e) => { const r = j.getBoundingClientRect(); let x = (e.clientX - r.left) / r.width * 2 - 1, y = (e.clientY - r.top) / r.height * 2 - 1;
    const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } joy.x = x; joy.y = y; nub.style.transform = `translate(${x * 35}px,${y * 35}px)`; };
  const end = () => { joy.x = joy.y = 0; nub.style.transform = ''; };
  j.addEventListener('pointerdown', (e) => { j.setPointerCapture(e.pointerId); mv(e); });
  j.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') mv(e); });
  j.addEventListener('pointerup', end); j.addEventListener('pointercancel', end);
  sb.addEventListener('pointerdown', (e) => { e.preventDefault(); shootDown(); });
  sb.addEventListener('pointerup', shootUp); sb.addEventListener('pointercancel', shootUp);
}

function setMode(m) { S.mode = m; document.body.dataset.mode = m; arena.showSpots(m !== 'page'); resize(); }
function start() { if (S.mode !== 'intro') return; sfx.init(); sfx.buzzer(); setMode('play'); }
function enterGame() { if (S.mode !== 'page') return; D.step = 'idle'; D.id = null; page.caption(''); page.playing(null); setThermal(false); resetScene(4.5, 3); window.scrollTo(0, 0); setMode('intro'); }
function exitGame() { if (S.mode === 'page') return; keys.clear(); joy.x = joy.y = 0; resetScene(HOME[0], HOME[1]); setMode('page'); }
function openList() { if (S.mode !== 'play') return; sfx.ui(); S.mode = 'modal'; hud.showList(); }
hud.onClose = () => {
  S.mode = 'play'; keys.clear();
  if (!S.finale && unlocked.size === PROJECTS.length) {
    S.finale = true;
    after(0.5, () => { hud.callout('MVP!'); sfx.roar(1); arena.flashBurst(16); });
    after(2.4, () => { S.mode = 'modal'; hud.showList('GAME OVER — YOU SAW IT ALL', '🏆 ALL PROJECTS UNLOCKED'); });
  }
};

// ───────── shooting ─────────
const distHoop = (x, z) => Math.hypot(HOOP.x - x, HOOP.z - z);
const isThree = (x, z) => distHoop(x, z) > COURT.R3 || Math.abs(z) > COURT.corner;
const spotAt = (x, z) => arena.spots.find((s) => Math.hypot(s.x - x, s.z - z) < 0.95);
const sprinting = () => (S.mode === 'page' ? D.sprint : keys.has('ShiftLeft') || keys.has('ShiftRight') || Math.hypot(joy.x, joy.y) > 0.92);
// a full-speed drive can take off from further out
const inDunkRange = () => distHoop(me.x, me.z) < (Math.hypot(S.vx, S.vz) > 6.2 ? 5.2 : 3.7) && me.x < HOOP.x + 0.2;
const greenHalf = () => Math.min(0.15, 0.07 + 0.022 * S.missStreak);

function shootDown(force) { // force: a highlight definition from HL (page mode only)
  if ((S.mode !== 'play' && !force) || S.action !== 'free' || !S.hasBall) return;
  const spot = spotAt(me.x, me.z);
  let type = 'jumper', sp = null;
  if (inDunkRange()) { type = 'dunk'; sp = dunkSpot; }
  else if (spot && spot.proj.play !== 'dunk') { type = spot.proj.play; sp = spot; }
  if (force) { type = force.drive ? 'dunk' : force.type; sp = null; }
  let near = 99; for (const d of defenders) if (!d.down) near = Math.min(near, Math.hypot(d.x - me.x, d.z - me.z));
  const space = type === 'stepback' || type === 'fade';   // these moves create their own room
  const cover = type === 'dunk' ? '' : near < 1.7 && !space ? 'CONTESTED' : near > 3 ? 'WIDE OPEN' : 'OPEN';
  const w = greenHalf() * (cover === 'CONTESTED' ? 0.8 : cover === 'WIDE OPEN' ? 1.25 : 1);
  S.shot = { type, spot: sp, cover, demo: !!force, spin: !!(force && force.spin), reverse: !!(force && force.reverse),
    windmill: force ? !!force.windmill : type === 'dunk' && distHoop(me.x, me.z) > 3.4,
    dur: type === 'dunk' ? 0.5 : 0.95, gs: type === 'dunk' ? 0.4 : 0.825 - w, ge: type === 'dunk' ? 1 : 0.825 + w };
  if (type !== 'dunk') S.vx = S.vz = 0;
  S.action = 'charging'; S.p = 0; S.meterState = ''; S.meterHold = 0;
}
function shootUp() { if (S.action === 'charging') release(); }

function release() {
  const sh = S.shot, p = S.p;
  if (sh.type === 'dunk') {
    sh.make = p >= sh.gs;
    S.meterState = sh.make ? 'green' : 'miss'; S.meterHold = 0.5;
    S.action = 'dunking'; S.t = 0;
    S.from.set(me.x, 0, me.z); S.to.set(HOOP.x - 0.3, 0, HOOP.z + (sh.reverse ? 0.29 : -0.29)); sh.yaw0 = me.yaw;
    sh.flight = 0.5 + S.from.distanceTo(S.to) * 0.07; S.vx = S.vz = 0;
    sfx.squeak();
    return;
  }
  const mid = (sh.gs + sh.ge) / 2, w = (sh.ge - sh.gs) / 2, err = p - mid;
  let grade, make;
  if (Math.abs(err) <= w) { grade = 'EXCELLENT'; make = true; }
  else if (Math.abs(err) <= w + 0.09) { grade = err < 0 ? 'SLIGHTLY EARLY' : 'SLIGHTLY LATE'; make = Math.random() < 0.4; }
  else { grade = err < 0 ? 'EARLY' : 'LATE'; make = false; }
  if (sh.demo) { grade = 'EXCELLENT'; make = true; }
  else hud.feedback(`${grade} · ${sh.cover}`, grade === 'EXCELLENT' ? 'green' : make ? 'warn' : 'bad');
  ball.material.emissive.setHex(grade === 'EXCELLENT' ? 0x18e070 : 0x000000);
  S.meterState = grade === 'EXCELLENT' ? 'green' : 'miss'; S.meterHold = 0.6;
  sh.make = make; sh.three = isThree(me.x, me.z);

  // launch the ball on a scripted arc
  B.state = 'flight'; B.t = 0; B.shot = sh; B.make = make;
  B.S.copy(ball.position); B.E.set(HOOP.x, HOOP.y, HOOP.z);
  if (!make) { // short when early, long when late
    const d = Math.hypot(HOOP.x - me.x, HOOP.z - me.z) || 1, k = (err < 0 ? -1 : 1) * 0.24;
    B.E.x += (HOOP.x - me.x) / d * k; B.E.z += (HOOP.z - me.z) / d * k + (Math.random() - 0.5) * 0.12;
  }
  B.T = 0.78 + distHoop(me.x, me.z) * 0.055;
  B.vy = (B.E.y - B.S.y + 0.5 * G * B.T * B.T) / B.T;
  S.hasBall = false; S.action = 'released';
}

function scored(sh, kind) {
  if (sh.demo) { S.cheer = 1.8; arena.flashBurst(10); vision.event('score'); after(1.2, giveBall); return; } // highlight reel: no score, no unlocks
  const pts = kind === 'dunk' ? 2 : sh.three ? 3 : 2;
  S.home += pts; S.missStreak = 0; S.cheer = 1.8; hud.score(S.home, S.away, true);
  const sp = sh.spot, fresh = sp && !unlocked.has(sp.proj.id);
  hud.callout(sp ? sp.proj.call : kind === 'dunk' ? 'SLAM!' : sh.three ? 'BANG!' : 'BUCKET!');
  sfx.roar(fresh ? 1 : 0.6); arena.flashBurst(fresh ? 16 : 8);
  if (fresh) {
    unlocked.add(sp.proj.id); arena.setDone(sp); hud.pips(unlocked);
    try { localStorage.setItem('arena.unlocked', JSON.stringify([...unlocked])); } catch { /* ignore */ }
    after(1.7, () => { S.mode = 'modal'; hud.showProject(sp.proj, true); });
  }
  after(1.5, giveBall);
}
function missed() { S.missStreak++; sfx.groan(); after(1.5, giveBall); }
function giveBall() { if (S.hasBall || B.state === 'pass') return; B.state = 'pass'; B.t = 0; B.S.copy(ball.position); }

// ───────── per-frame updates ─────────
const v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
let lastDir = [0, 0], squeakAt = 0, bounceWas = 0;

function updatePlayer(dt) {
  let ix = joy.x, iz = joy.y;
  for (const k of keys) if (MOVE[k]) { ix += MOVE[k][0]; iz += MOVE[k][1]; }
  if (S.mode === 'page') { ix = D.ix; iz = D.iz; }
  let mag = Math.hypot(ix, iz); if (mag > 1) { ix /= mag; iz /= mag; mag = 1; }
  const toHoop = Math.atan2(HOOP.x - me.x, HOOP.z - me.z);
  const hx = Math.sin(toHoop), hz = Math.cos(toHoop);
  const turn = 1 - Math.exp(-dt * 14);

  if (S.action === 'free') {
    const top = sprinting() ? 7.6 : 5.4, acc = 1 - Math.exp(-dt * (mag > 0.15 ? 11 : 15));
    S.vx += (ix * top - S.vx) * acc; S.vz += (iz * top - S.vz) * acc;
    me.x += S.vx * dt; me.z += S.vz * dt; me.y = 0;
    const m = Math.min(1.25, Math.hypot(S.vx, S.vz) / 5.4);
    if (mag > 0.15) {
      me.yaw = dampAngle(me.yaw, Math.atan2(ix, iz), turn);
      if (ix * lastDir[0] + iz * lastDir[1] < 0.2 && S.time > squeakAt) { sfx.squeak(); squeakAt = S.time + 0.25; }
      lastDir = [ix / mag, iz / mag];
    } else { lastDir = [0, 0]; if (S.mode === 'page') me.yaw = dampAngle(me.yaw, -Math.PI / 2, 1 - Math.exp(-dt * 3)); } // idle: face the viewer
    for (const d of bodies) { // don't run through other players
      const dx = me.x - d.x, dz = me.z - d.z, dd = Math.hypot(dx, dz);
      if (dd < 0.8 && dd > 0.001 && !d.down) { me.x = d.x + dx / dd * 0.8; me.z = d.z + dz / dd * 0.8; }
    }
    me.x = clamp(me.x, -2.4, 13.6); me.z = clamp(me.z, -7.6, 7.6);
    S.dph += dt * lerp(3.1, 6.2, Math.min(1, m)); const bounce = Math.abs(Math.sin(S.dph));
    poseMove(me, S.time, Math.min(1, m), S.hasBall, bounce);
    if (S.hasBall) {
      me.local(-0.34, 0.4, v1); v1.y = BALL_R + 0.02 + bounce * 0.84;
      ball.position.lerp(v1, 1 - Math.exp(-dt * 30));
      if (bounce < 0.25 && bounceWas >= 0.25) sfx.bounce(0.7);
      bounceWas = bounce;
    }
  } else if (S.action === 'charging' || S.action === 'released') {
    const sh = S.shot, dunk = sh.type === 'dunk';
    S.p += dt / sh.dur;
    me.yaw = dampAngle(me.yaw, toHoop, turn);
    if (dunk) {
      me.x = clamp(me.x + S.vx * dt, -2.4, HOOP.x - 0.9); me.z = clamp(me.z + S.vz * dt, -7.6, 7.6);
      const f = Math.exp(-dt * 3.5); S.vx *= f; S.vz *= f;
      me.crouch(0.3 + 0.35 * Math.min(1, S.p)); me.T.lean = 0.3; me.T.shRx = -0.9; me.T.elR = -1.3; me.T.shLx = -0.9; me.T.elL = -1.3; me.T.tilt = 0;
    } else {
      me.y = jumpY(S.p);
      if (sh.type === 'stepback' && S.p < 0.3) { const sp = 1.3 / (0.3 * sh.dur); me.x -= hx * sp * dt; me.z -= hz * sp * dt; }
      if (sh.type === 'fade' && S.p > 0.2 && me.y > 0) { me.x -= hx * 1.25 * dt; me.z -= hz * 1.25 * dt; }
      me.x = clamp(me.x, -2.4, 13.6); me.z = clamp(me.z, -7.6, 7.6);
      poseShoot(me, S.p, S.action === 'released', sh.type === 'fade' ? 1 : 0);
    }
    if (S.action === 'charging') {
      me.handPos('R', v1); v1.y += 0.11; v1.x += hx * 0.06; v1.z += hz * 0.06;
      ball.position.lerp(v1, 1 - Math.exp(-dt * 40));
      if (S.p >= 1) release();
    } else if (S.p >= 1.4) { S.action = 'free'; me.y = 0; }
  } else if (S.action === 'dunking') {
    const sh = S.shot; S.t += dt; const k = Math.min(1, S.t / sh.flight), e = 1 - (1 - k) * (1 - k);
    me.x = lerp(S.from.x, S.to.x, k); me.z = lerp(S.from.z, S.to.z, k);
    me.y = 0.86 * e + (sh.windmill ? 1.05 : 0.8) * Math.sin(Math.PI * k);
    if (sh.spin) me.yaw = lerp(sh.yaw0, Math.PI / 2, k) + Math.PI * 2 * smooth(0.08, 0.88, k);          // full 360 in the air
    else if (sh.reverse) me.yaw = dampAngle(me.yaw, k > 0.28 ? -Math.PI / 2 : Math.PI / 2, 1 - Math.exp(-dt * 9)); // turn the back to the rim
    else me.yaw = dampAngle(me.yaw, Math.PI / 2, turn);
    poseDunk(me, k, sh.windmill, sh.reverse); S.zoom = 1;
    me.handPos('R', v1); v1.y += 0.1; ball.position.lerp(v1, 1 - Math.exp(-dt * 45));
    if (k > 0.45) for (const d of defenders) if (!d.down && Math.hypot(d.x - me.x, d.z - me.z) < 1.35) knockDown(d); // anyone in the lane gets posterized
    if (k >= 1) {
      S.hasBall = false; B.state = 'free'; S.action = 'hang'; S.t = 0;
      S.shake = 0.5; arena.slam(); sfx.dunk();
      if (!center.down && Math.hypot(center.x - HOOP.x, center.z - HOOP.z) < 2.6) knockDown(center);
      if (sh.make) { ball.position.set(HOOP.x, HOOP.y - 0.05, HOOP.z); B.vel.set(0, -8, 0); scored(sh, 'dunk'); }
      else { ball.position.set(HOOP.x - 0.2, HOOP.y + 0.2, HOOP.z); B.vel.set(-3.5, 4.5, (Math.random() - 0.5) * 3); sfx.rim(); hud.feedback('RIM STUFFED — HOLD LONGER', 'bad'); missed(); }
    }
  } else if (S.action === 'hang') {
    S.t += dt; poseHang(me, S.time); if (S.shot.reverse) me.T.shRx = -3.6; S.zoom = 1;
    if (S.t > 0.55) { S.action = 'fall'; S.vy = 0; }
  } else if (S.action === 'fall') {
    S.vy -= G * dt; me.y += S.vy * dt; me.x -= 1.4 * dt; me.yaw = dampAngle(me.yaw, Math.PI / 2, turn); me.crouch(0.3); me.T.shRx = -1.2; me.T.elR = -0.4; me.T.tilt = 0; me.T.lean = 0.1;
    if (me.y <= 0) { me.y = 0; S.action = 'free'; S.vx = S.vz = 0; sfx.bounce(0.9); }
  }
  me.apply(dt);
  marker.position.x = me.x; marker.position.z = me.z;
}

function knockDown(d) {
  d.down = 2.6; d.yaw = Math.atan2(me.x - d.x, me.z - d.z);
  d.slide = [d.x - me.x, d.z - me.z]; const m = Math.hypot(...d.slide) || 1; d.slide = [d.slide[0] / m, d.slide[1] / m];
}

function updateDefenders(dt) {
  const toHoop = Math.atan2(HOOP.x - me.x, HOOP.z - me.z), hx = Math.sin(toHoop), hz = Math.cos(toHoop);
  const shooting = (S.action === 'charging' || S.action === 'released') && S.shot.type !== 'dunk';
  const dh = distHoop(me.x, me.z);
  const goals = [
    [center, HOOP.x - hx * Math.min(1.6, dh * 0.5), HOOP.z - hz * Math.min(1.6, dh * 0.5), 2.6, dh < 6 || S.action === 'dunking'],
    shadow.hold ? [shadow, shadow.hold[0], shadow.hold[1], 3.6, true] : [shadow, me.x + hx * 1.3, me.z + hz * 1.3, 3.6, shooting],
    ...guards.map((g) => [g, g.gx + Math.sin(S.time * 0.8 + g.seed) * 0.3, g.gz + Math.cos(S.time * 0.6 + g.seed) * 0.2, 1.6, false]),
  ];
  for (const [d, gx, gz, sp, up] of goals) {
    if (d.down > 0) {
      d.down -= dt;
      if (d.down > 2.2) { d.x += d.slide[0] * 3.2 * dt; d.z += d.slide[1] * 3.2 * dt; }
      if (d.down > 0.6) { poseDown(d); d.y = 0.14; } else { poseDefend(d, S.time, false, 0); d.y = 0; }
      if (d.down <= 0) d.down = 0;
      d.apply(dt, d.down > 0.6 ? 9 : 5); continue;
    }
    // the on-ball defender backs off so the paint stays open for drives
    const tx = d === shadow && dh < 3.2 ? d.x : gx, tz = d === shadow && dh < 3.2 ? d.z : gz;
    const dx = tx - d.x, dz = tz - d.z, dd = Math.hypot(dx, dz), step = Math.min(dd, sp * dt);
    if (dd > 0.02 && !(d === shadow && shooting)) { d.x += dx / dd * step; d.z += dz / dd * step; }
    d.x = clamp(d.x, -2, 13.4); d.z = clamp(d.z, -7.2, 7.2);
    d.yaw = dampAngle(d.yaw, Math.atan2(me.x - d.x, me.z - d.z), 1 - Math.exp(-dt * 8));
    d.y = d === shadow && shooting ? jumpY(S.p - 0.12) * 0.75 : 0;
    poseDefend(d, S.time, up, dd > 0.1 ? 1 : 0);
    d.apply(dt);
  }
}

// teammates, referee and the name labels under everyone's feet
function updateExtras(dt) {
  S.cheer -= dt;
  for (const m of mates) {
    m.yaw = dampAngle(m.yaw, Math.atan2(me.x - m.x, me.z - m.z), 1 - Math.exp(-dt * 5));
    poseIdle(m, S.time, S.cheer > 0, m.seed); m.apply(dt);
  }
  ref.yaw = dampAngle(ref.yaw, Math.atan2(ball.position.x - ref.x, ball.position.z - ref.z), 1 - Math.exp(-dt * 3));
  poseIdle(ref, S.time * 0.5, false, 0.4); ref.T.shLx = ref.T.shRx = 0.25; ref.T.elL = ref.T.elR = -0.2; ref.apply(dt);
  for (const b of bodies) b.label.position.set(b.x, -0.1, b.z + 0.25);
}

function updateBall(dt) {
  if (B.state === 'flight') {
    B.t += dt; const k = Math.min(1, B.t / B.T);
    ball.position.set(lerp(B.S.x, B.E.x, k), B.S.y + B.vy * B.t - 0.5 * G * B.t * B.t, lerp(B.S.z, B.E.z, k));
    if (k >= 1) {
      const vx = (B.E.x - B.S.x) / B.T, vz = (B.E.z - B.S.z) / B.T, vy = B.vy - G * B.T;
      B.state = 'free';
      if (B.make) { B.vel.set(vx * 0.12, vy * 0.55, vz * 0.12); arena.swish(); sfx.swish(); scored(B.shot, 'jumper'); }
      else { B.vel.set(-vx * 0.35 + (Math.random() - 0.5) * 2, 3.4 + Math.random() * 1.5, -vz * 0.35 + (Math.random() - 0.5) * 3); sfx.rim(); arena.slam(); missed(); }
    }
  } else if (B.state === 'pass') { // inbound pass back to the ball handler
    B.t += dt; const k = Math.min(1, B.t / 0.42);
    v1.set(me.x, me.y + 1.15, me.z); ball.position.lerpVectors(B.S, v1, k); ball.position.y += Math.sin(Math.PI * k) * 0.9;
    if (k >= 1) { B.state = 'held'; S.hasBall = true; ball.material.emissive.setHex(0); sfx.bounce(0.4); }
  } else if (B.state === 'free') {
    B.vel.y -= G * dt; ball.position.addScaledVector(B.vel, dt);
    if (ball.position.y < BALL_R) {
      ball.position.y = BALL_R;
      if (Math.abs(B.vel.y) > 1.2) sfx.bounce(Math.min(1, Math.abs(B.vel.y) / 7));
      B.vel.y = -B.vel.y * 0.62; B.vel.x *= 0.82; B.vel.z *= 0.82;
    }
  }
  ball.rotation.x += dt * 6; ball.rotation.z += dt * 3;
}

const camPos = new THREE.Vector3(-10.5, 8.6, 0), camLook = new THREE.Vector3(8, 1.4, 0), camT = { p: new THREE.Vector3(), l: new THREE.Vector3() };
let viewShift = 0;
function updateCamera(dt) {
  const wide = camera.aspect < 1.5 ? clamp(1.5 / camera.aspect, 1, 2.05) : 1;
  const z = S.zoom; S.zoom = Math.max(0, S.zoom - dt * 1.2);
  let fov = 30, rate = 3.5;
  if (S.mode === 'page') { // behind-the-ball angle; each section of the page gets its own shot
    rate = 2.2;
    if (S.section === 'experience') { camT.p.set(-1.5, 6.5, 16); camT.l.set(8.5, 1.6, 0); }
    else if (S.section === 'contact') { camT.p.set(1.5, 3.4, 9.3); camT.l.set(HOOP.x - 2, 2.3, 0); fov = 34; }
    else if (S.section === 'about') { camT.p.set(-10.5, 8.6, Math.sin(S.time * 0.12) * 2.5); camT.l.set(8, 1.4, 0); }
    else { camT.p.set(Math.min(-8, me.x - 11.5), 6.8, me.z * 0.25); camT.l.set(lerp(8.5, HOOP.x - 1, z * 0.7), lerp(1.6, 2.4, z), me.z * 0.2); }
  } else { // the game keeps the sideline broadcast angle
    const cx = lerp(7.4 + (me.x - 7.4) * 0.28, HOOP.x - 2.5, z * 0.6);
    camT.p.set(cx, 8.6, 22); camT.l.set(cx, lerp(1.7, 2.3, z), -0.4);
  }
  const k = 1 - Math.exp(-dt * rate);
  camPos.lerp(camT.p, k); camLook.lerp(camT.l, k);
  camera.fov += (fov * wide * lerp(1, 0.8, z) - camera.fov) * k;
  // on wide screens the text sits on the left, so slide the whole picture to the right
  const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
  viewShift += ((S.mode === 'page' && window.innerWidth > 860 ? 0.2 : 0) - viewShift) * k;
  camera.setViewOffset(w, h, -viewShift * w, 0, w, h);
  S.shake *= Math.exp(-dt * 7);
  camera.position.set(camPos.x + (Math.random() - 0.5) * S.shake, camPos.y + (Math.random() - 0.5) * S.shake, camPos.z);
  camera.lookAt(camLook);
}

// ───────── highlight reel: what plays behind the page ─────────
const HOME = [6.4, 1.4];
const HL = {
  windmill: { label: 'Windmill poster dunk', drive: true, start: [2.6, 0.5], at: 4.7, windmill: true },
  spin360: { label: '360 dunk', drive: true, start: [4.4, -2.8], at: 4.3, spin: true },
  reverse: { label: 'Reverse dunk', drive: true, start: [5.6, 3.2], at: 3.9, reverse: true },
  halfcourt: { label: 'Half-court shot', type: 'logo', start: [1.0, 0.4], open: true },
  stepback: { label: 'Step-back three', type: 'stepback', start: [7.0, 5.3] },
  fade: { label: 'Fadeaway', type: 'fade', start: [8.4, 2.9] },
};
const D = { ix: 0, iz: 0, sprint: false, step: 'idle', t: 0, hl: null, id: null, idleT: 0 };
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function resetScene(x, z) {
  S.tasks.length = 0; S.action = 'free'; S.p = 0; S.hasBall = true; B.state = 'held';
  S.vx = S.vz = 0; S.ts = 1; S.zoom = 0; S.shake = 0; S.meterHold = 0; S.cheer = 0;
  ball.material.emissive.setHex(0);
  me.x = x; me.z = z; me.y = 0; me.yaw = Math.atan2(HOOP.x - x, HOOP.z - z);
  for (const d of defenders) { d.down = 0; d.y = 0; d.x = d.gx; d.z = d.gz; }
  shadow.hold = null;
  const dx = HOOP.x - x, dz = HOOP.z - z, dd = Math.hypot(dx, dz) || 1;
  shadow.x = x + dx / dd * 1.3; shadow.z = z + dz / dd * 1.3;
  me.apply(1); ball.position.set(x, 0.7, z);
}

function playHighlight(key, id, title, panel) {
  const hl = HL[key]; if (!hl || S.mode !== 'page') return;
  if (D.id === id && D.step !== 'idle' && D.step !== 'home') return; // already running this one
  resetScene(hl.start[0], hl.start[1]);
  if (hl.drive) { shadow.hold = [HOOP.x - 2.9, me.z >= 0 ? -1 : 1]; shadow.x = shadow.hold[0]; shadow.z = shadow.hold[1]; } // help defender waits in the lane
  if (hl.open) { shadow.hold = [HOOP.x - 4.6, 0.9]; shadow.x = shadow.hold[0]; shadow.z = shadow.hold[1]; } // nobody guards a half-court heave
  D.hl = hl; D.id = id; D.step = hl.drive ? 'run' : 'set'; D.t = 0;
  page.caption(`${hl.label} — ${title}`); page.playing(id);
  D.idleT = 0; vision.setMode(panel); setThermal(panel === 'thermal');
}

function director(dt) {
  D.ix = D.iz = 0; D.sprint = false; D.t += dt;
  const hl = D.hl;
  if (D.step === 'idle') { // nobody is hovering: keep the court alive with a rolling highlight reel
    D.idleT = (D.idleT || 0) + dt;
    if (D.idleT > 7 && !calm && !document.hidden) { const keys = Object.keys(HL), k = keys[(Math.random() * keys.length) | 0]; playHighlight(k, 'reel', 'highlight reel', 'detect'); }
    return;
  }
  if (D.step === 'run') {
    const tx = HOOP.x - 0.6 - me.x, tz = HOOP.z - me.z, d = Math.hypot(tx, tz) || 1;
    D.ix = tx / d; D.iz = tz / d; D.sprint = true;
    if (distHoop(me.x, me.z) < hl.at || D.t > 3) { shootDown(hl); D.step = 'charge'; vision.event('shoot'); }
  } else if (D.step === 'set') {
    if (D.t > 0.55) { shootDown(hl); D.step = 'charge'; vision.event('shoot'); }
  } else if (D.step === 'charge') {
    if (S.action === 'charging' && S.p >= (hl.drive ? 0.5 : 0.825)) { release(); vision.event('release'); }
    if (S.action !== 'charging') { D.step = 'wait'; D.t = 0; }
  } else if (D.step === 'wait') {
    if ((S.action === 'free' && S.hasBall) || D.t > 8) { D.step = 'home'; D.t = 0; shadow.hold = null; }
  } else if (D.step === 'home') {
    const tx = HOME[0] - me.x, tz = HOME[1] - me.z, d = Math.hypot(tx, tz);
    if (d < 0.35 || D.t > 6) { D.step = 'idle'; D.idleT = 0; page.caption(''); page.playing(null); vision.setMode('detect'); setThermal(false); } else { D.ix = tx / d * 0.75; D.iz = tz / d * 0.75; }
  }
}

function updateHud(dt) {
  const proj = (x, y, z) => { v2.set(x, y, z).project(camera); return [(v2.x * 0.5 + 0.5) * window.innerWidth, (-v2.y * 0.5 + 0.5) * window.innerHeight]; };
  const [tx, ty] = proj(me.x, me.y + 2.22, me.z);
  hud.tag(tx, ty, S.action === 'free');
  S.meterHold -= dt;
  const showMeter = S.action === 'charging' || S.meterHold > 0;
  if (showMeter) { const [mx, my] = proj(me.x, me.y + 1.5, me.z); hud.meter(true, mx + 46, my, S.p, S.shot.gs, S.shot.ge, S.action === 'charging' ? '' : S.meterState); }
  else hud.meter(false);

  const spot = spotAt(me.x, me.z); S.activeSpot = inDunkRange() ? dunkSpot : spot && spot.proj.play !== 'dunk' ? spot : null;
  let msg;
  if (!S.hasBall || S.action !== 'free') msg = '';
  else if (S.activeSpot) {
    const p = S.activeSpot.proj, got = unlocked.has(p.id);
    msg = p.play === 'dunk' ? `<kbd>HOLD SPACE</kbd> <b>${p.playName}</b> ${got ? '— again, for the crowd' : `— unlocks “${p.title}”`}`
      : `<kbd>HOLD SPACE</kbd> release on green · <b>${p.playName}</b> ${got ? '— already unlocked' : `unlocks “${p.title}”`}`;
  } else {
    const next = arena.spots.find((s) => !unlocked.has(s.proj.id));
    msg = next ? `Head to spot <b>${arena.spots.indexOf(next) + 1}</b> · ${next.proj.playName}` : 'All projects unlocked — keep hooping, or press <kbd>TAB</kbd>';
  }
  hud.prompt(msg);
}

// ───────── main loop ─────────
hud.init(); hud.pips(unlocked); hud.score(S.home, S.away);
let closedOut = false;
page.init({
  onHighlight: (p) => p && playHighlight(p.highlight, p.id, p.title, p.panel),
  visionOn: () => vision.enabled,
  onVision: () => vision.toggle(),
  onGame: () => enterGame(),
  onSection: (id) => {
    S.section = id;
    if (id === 'contact' && !closedOut && D.step === 'idle') { closedOut = true; playHighlight('fade', 'contact', 'the game-winner', 'detect'); }
  },
});
resetScene(HOME[0], HOME[1]); setMode('page');
let last = performance.now();
function slowTarget() {
  if (S.action === 'dunking') return S.t / S.shot.flight > 0.5 ? 0.32 : 1;
  if (S.action === 'hang' && S.t < 0.05) return 0.12;                      // hit-stop on the slam
  if (B.state === 'flight' && B.shot.demo && B.t / B.T > 0.72) return 0.45;
  if (B.state === 'flight' && B.make && B.shot.spot && !unlocked.has(B.shot.spot.proj.id) && B.t / B.T > 0.7) return 0.4;
  return 1;
}
function tick(dt) {
  if (S.mode === 'play' || S.mode === 'page') {
    const game = S.mode === 'play';
    S.ts += (slowTarget() - S.ts) * (1 - Math.exp(-dt * 14)); dt *= S.ts;
    S.time += dt;
    for (let i = S.tasks.length - 1; i >= 0; i--) if (S.tasks[i].at <= S.time) { const t = S.tasks.splice(i, 1)[0]; t.fn(); }
    if (!game) director(dt);
    updatePlayer(dt); updateDefenders(dt); updateExtras(dt); updateBall(dt);
    if (game) { S.clock -= dt; if (S.clock <= 0) { S.clock = 120; sfx.buzzer(); } updateHud(dt); hud.clock(S.clock); }
  } else if (S.mode === 'intro') {
    S.time += dt; poseMove(me, S.time, 0, true, Math.abs(Math.sin(S.time * 3.1))); me.apply(dt);
    me.local(-0.34, 0.4, v1); v1.y = BALL_R + 0.02 + Math.abs(Math.sin(S.time * 3.1)) * 0.84; ball.position.copy(v1);
    marker.position.x = me.x; marker.position.z = me.z;
    for (const d of defenders) { poseDefend(d, S.time, false, 0); d.apply(dt); }
    updateExtras(dt);
  }
  arena.update(dt, S.time, S.mode === 'play' ? S.activeSpot : null);
  updateCamera(dt);
}
const traj = [];
function drawVision(dt) {
  traj.length = 0;
  if (B.state === 'flight') for (let t = B.t; t <= B.T + 0.001; t += (B.T - B.t) / 14 + 0.001) { // the rest of the arc the ball is on
    const k = t / B.T; traj.push(new THREE.Vector3(lerp(B.S.x, B.E.x, k), B.S.y + B.vy * t - 0.5 * G * t * t, lerp(B.S.z, B.E.z, k)));
  }
  const phase = S.action === 'dunking' || S.action === 'hang' ? 'dunk' : B.state === 'flight' ? 'flight' : S.action === 'released' ? 'shot'
    : S.action === 'charging' ? 'gather' : S.cheer > 0.6 ? 'cheer' : Math.hypot(S.vx, S.vz) > 4 ? 'run' : 'idle';
  vision.draw(dt, {
    show: S.mode === 'page', busy: D.step !== 'idle', time: S.time, actors: tracked, ball, traj, phase,
    anyDown: defenders.some((d) => d.down > 0.6), speed: Math.hypot(S.vx, S.vz), heroY: me.y,
  });
}
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  tick(dt);
  renderer.render(scene, camera);
  drawVision(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// debug handle for testing from the console
window.__arena = { S, me, B, D, unlocked, defenders, shootDown, shootUp, start, tick, playHighlight, enterGame, exitGame, render: () => { renderer.render(scene, camera); drawVision(1 / 60); } };
