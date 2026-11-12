// Procedural athlete. Body parts are lofted tubes with anatomical tapers (calves, forearms,
// a shaped head and chest) hung on a jointed rig. Motion is made lifelike three ways:
//   • every joint is a damped spring, so limbs accelerate, overshoot slightly and settle
//   • legs can be driven by foot targets (two-bone IK), so a planted foot does not slide
//   • the head tracks a look target, and feet stay flat on the floor by themselves
// Facing direction is local +Z. The "R" arm (the ball hand) sits at local -X.
import * as THREE from 'three';

const THIGH = 0.47, SHIN = 0.47, ANKLE = 0.08, HIP_Y = -0.05, HIP_X = 0.1, UARM = 0.33, FARM = 0.3, PALM = 0.085;
export const SHOULDER_X = 0.235;
export const STAND_Y = THIGH + SHIN + ANKLE - HIP_Y; // height of the hips when standing straight
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sat = (x) => clamp(x, 0, 1);
const smooth = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const wrap = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const stepLen = (sp) => clamp(0.42 + 0.19 * sp, 0.5, 1.9); // metres per step at a given speed

// ───────────── geometry ─────────────
// A tube of elliptical cross-sections stacked along Y. rings: [y, radiusX, radiusZ, centreZ = 0]
function loft(rings, seg = 14, capA = true, capB = true) {
  const n = rings.length, up = rings[n - 1][0] > rings[0][0];
  const pos = [], nor = [], uv = [], idx = [];
  for (let i = 0; i < n; i++) {
    const [y, rx, rz, cz = 0] = rings[i], a = rings[Math.max(0, i - 1)], b = rings[Math.min(n - 1, i + 1)];
    const slope = ((b[1] + b[2]) - (a[1] + a[2])) / 2 / (b[0] - a[0]); // how fast the radius changes with height
    for (let j = 0; j <= seg; j++) {
      const t = j / seg * TAU, c = Math.cos(t), s = Math.sin(t);
      pos.push(rx * c, y, cz + rz * s);
      const nx = rz * c, nz = rx * s, h = Math.hypot(nx, nz) || 1, l = Math.hypot(1, slope);
      nor.push(nx / h / l, -slope / l, nz / h / l); uv.push(j / seg, i / (n - 1));
    }
  }
  const tri = (a, b, c) => (up ? idx.push(a, b, c) : idx.push(a, c, b));
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; tri(a, b, a + 1); tri(a + 1, b, b + 1); }
  const cap = (ri, faceUp) => {
    const c = pos.length / 3; pos.push(0, rings[ri][0], rings[ri][3] || 0); nor.push(0, faceUp ? 1 : -1, 0); uv.push(0.5, ri ? 1 : 0);
    for (let j = 0; j < seg; j++) { const a = ri * (seg + 1) + j; if (faceUp) idx.push(c, a + 1, a); else idx.push(c, a, a + 1); }
  };
  if (capA) cap(0, !up);
  if (capB) cap(n - 1, up);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

let GEO = null;
function geometries() { // built once and shared by every player
  if (GEO) return GEO;
  const shoe = loft([[-0.085, 0.030, 0.028, 0.032], [-0.06, 0.043, 0.040, 0.020], [0, 0.047, 0.046, 0.014], [0.08, 0.050, 0.036, 0.024],
    [0.16, 0.047, 0.026, 0.034], [0.205, 0.034, 0.018, 0.042], [0.228, 0.014, 0.009, 0.051]], 12);
  shoe.rotateX(Math.PI / 2); // the loft runs heel → toe
  const head = [[0.068, 0.034, 0.040, 0.026], [0.092, 0.058, 0.064, 0.020], [0.130, 0.074, 0.084, 0.010], [0.172, 0.081, 0.096, 0.002],
    [0.212, 0.078, 0.097, -0.004], [0.250, 0.064, 0.083, -0.008], [0.280, 0.038, 0.052, -0.010], [0.292, 0.012, 0.018, -0.010]];
  const hair = (lo) => loft([[lo, 0.083, 0.099, -0.016], [0.214, 0.0815, 0.101, -0.016], [0.252, 0.068, 0.088, -0.016], [0.283, 0.042, 0.057, -0.016], [0.297, 0.012, 0.018, -0.014]], 16, false);
  GEO = {
    torso: loft([[-0.04, 0.148, 0.104, 0], [0.07, 0.150, 0.107, 0.004], [0.20, 0.168, 0.120, 0.008], [0.33, 0.196, 0.130, 0.006],
      [0.43, 0.210, 0.122, -0.002], [0.48, 0.196, 0.106, -0.008], [0.515, 0.140, 0.086, -0.012], [0.54, 0.074, 0.062, -0.012]], 20),
    pelvis: loft([[-0.14, 0.120, 0.105], [-0.09, 0.165, 0.118], [0, 0.168, 0.120], [0.07, 0.156, 0.110], [0.11, 0.150, 0.106]], 20),
    band: loft([[0.082, 0.156, 0.111], [0.118, 0.155, 0.110]], 20, false, false),
    neck: loft([[0, 0.052, 0.054], [0.05, 0.047, 0.050], [0.10, 0.046, 0.050]], 12, false, false),
    head: loft(head, 18), hair: hair(0.182), hairShort: hair(0.2),
    ear: new THREE.SphereGeometry(0.022, 8, 6), eye: new THREE.SphereGeometry(0.0085, 6, 5), nose: new THREE.ConeGeometry(0.014, 0.042, 6),
    brow: new THREE.BoxGeometry(0.03, 0.006, 0.008), headband: new THREE.TorusGeometry(0.086, 0.012, 6, 22),
    delt: new THREE.SphereGeometry(0.07, 12, 9), elbow: new THREE.SphereGeometry(0.042, 10, 7), knee: new THREE.SphereGeometry(0.056, 10, 8),
    uarm: loft([[0.03, 0.050, 0.054], [-0.04, 0.062, 0.066], [-0.14, 0.057, 0.061], [-0.25, 0.047, 0.050], [-0.33, 0.041, 0.043]], 12),
    farm: loft([[0, 0.043, 0.044], [-0.07, 0.049, 0.051], [-0.18, 0.040, 0.041], [-0.27, 0.031, 0.032], [-0.30, 0.029, 0.030]], 12),
    hand: loft([[0, 0.016, 0.027], [-0.04, 0.019, 0.041], [-0.09, 0.018, 0.044], [-0.14, 0.013, 0.037], [-0.178, 0.008, 0.022]], 10),
    thumb: new THREE.CapsuleGeometry(0.011, 0.045, 3, 6),
    thigh: loft([[0.02, 0.086, 0.090], [-0.10, 0.092, 0.096], [-0.24, 0.080, 0.084], [-0.37, 0.064, 0.068], [-0.47, 0.055, 0.057]], 14),
    shortLeg: loft([[0.05, 0.094, 0.100], [-0.06, 0.104, 0.108], [-0.18, 0.108, 0.112], [-0.30, 0.112, 0.116]], 14, false, false),
    pantLeg: loft([[0.05, 0.094, 0.100], [-0.10, 0.100, 0.104], [-0.30, 0.080, 0.084], [-0.47, 0.064, 0.066]], 14, false, false),
    shin: loft([[0, 0.055, 0.057, 0], [-0.09, 0.060, 0.066, -0.012], [-0.21, 0.053, 0.059, -0.012], [-0.34, 0.040, 0.043, -0.004], [-0.44, 0.034, 0.036, 0], [-0.48, 0.034, 0.036, 0]], 12),
    sock: loft([[-0.33, 0.043, 0.046, -0.004], [-0.40, 0.039, 0.041, -0.001], [-0.47, 0.038, 0.040, 0]], 12, false, false),
    shoe, sole: new THREE.BoxGeometry(0.096, 0.022, 0.3),
  };
  return GEO;
}

function numberTexture(text, color) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 92px "Barlow Condensed", Impact, sans-serif';
  g.fillText(text, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ───────────── rig ─────────────
export function makeBaller(o) {
  const G = geometries();
  const M = (c, rough) => new THREE.MeshStandardMaterial({ color: c, roughness: rough });
  const skin = M(o.skin, 0.62), jersey = M(o.jersey, 0.8), shorts = M(o.shorts, 0.8), shoe = M(o.shoe, 0.5), trim = M(o.trim, 0.6);
  const hairM = M(o.hair ?? 0x1a1411, 0.95), dark = new THREE.MeshBasicMaterial({ color: 0x15110f }), sole = M(0xf2f2f2, 0.6);
  const cuff = new THREE.MeshStandardMaterial({ color: o.shorts, roughness: 0.8, side: THREE.DoubleSide });
  const legM = o.pants ? shorts : skin;
  if (o.stripes) { // referee shirt
    const c = document.createElement('canvas'); c.width = 64; c.height = 8; const g = c.getContext('2d');
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#1c1c1f' : '#f4f4f4'; g.fillRect(i * 8, 0, 8, 8); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.x = 3;
    jersey.map = t; jersey.color.set(0xffffff);
  }
  const part = (g, m, parent, x = 0, y = 0, z = 0) => { const mesh = new THREE.Mesh(g, m); mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh; };
  const grp = (parent, x = 0, y = 0, z = 0, order) => { const g = new THREE.Group(); g.position.set(x, y, z); if (order) g.rotation.order = order; parent.add(g); return g; };

  const root = new THREE.Group(), tilt = grp(root), hips = grp(tilt, 0, STAND_Y, 0, 'YXZ'), spine = grp(hips, 0, 0.08, 0, 'YXZ'), neck = grp(spine, 0, 0.512, -0.012, 'YXZ');
  part(G.pelvis, shorts, hips); part(G.band, trim, hips);
  part(G.torso, jersey, spine);
  const numMat = new THREE.MeshBasicMaterial({ map: numberTexture(o.number, o.numColor), transparent: true });
  const nf = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), numMat); nf.position.set(0, 0.31, 0.139); spine.add(nf);
  const nb = nf.clone(); nb.position.z = -0.127; nb.rotation.y = Math.PI; spine.add(nb);

  // head
  part(G.neck, skin, neck); part(G.head, skin, neck);
  if (o.hair !== null) part(o.hairLen && o.hairLen < 0.45 ? G.hairShort : G.hair, hairM, neck);
  for (const sx of [-1, 1]) {
    const ear = part(G.ear, skin, neck, sx * 0.082, 0.165, -0.004); ear.scale.set(0.45, 1, 0.7);
    part(G.eye, dark, neck, sx * 0.031, 0.17, 0.0905).castShadow = false; part(G.brow, dark, neck, sx * 0.031, 0.188, 0.093).castShadow = false;
  }
  const nose = part(G.nose, skin, neck, 0, 0.146, 0.104); nose.rotation.x = Math.PI / 2 + 0.25;
  if (o.headband) { const hb = part(G.headband, trim, neck, 0, 0.205, -0.004); hb.rotation.x = Math.PI / 2; hb.scale.set(1, 1.2, 1); }

  const J = { head: neck };
  for (const [s, sx] of [['L', 1], ['R', -1]]) {
    const sh = grp(spine, sx * SHOULDER_X, 0.47, -0.005); part(G.delt, skin, sh); part(G.uarm, skin, sh);
    const el = grp(sh, 0, -UARM, 0); part(G.elbow, skin, el); part(G.farm, skin, el);
    const wr = grp(el, 0, -FARM, 0); part(G.hand, skin, wr);
    const th = part(G.thumb, skin, wr, 0, -0.06, 0.046); th.rotation.x = -0.55;
    J['sh' + s] = sh; J['el' + s] = el; J['wr' + s] = wr; J['hand' + s] = grp(wr, 0, -PALM, 0);

    const hp = grp(hips, sx * HIP_X, HIP_Y, 0); part(G.thigh, legM, hp); part(o.pants ? G.pantLeg : G.shortLeg, cuff, hp);
    const kn = grp(hp, 0, -THIGH, 0); part(G.knee, legM, kn); part(G.shin, legM, kn); if (!o.pants) part(G.sock, trim, kn);
    const an = grp(kn, 0, -SHIN, 0); part(G.shoe, shoe, an); part(G.sole, sole, an, 0, -0.069, 0.07);
    J['hip' + s] = hp; J['kn' + s] = kn; J['foot' + s] = an;
  }

  // pose targets — an animation sets these; the springs below chase them
  const T = {
    shLx: 0, shLz: 0.12, shRx: 0, shRz: -0.12, elL: -0.15, elR: -0.15, wrL: 0, wrR: 0,
    hipL: 0, hipR: 0, knL: 0, knR: 0, abL: 0.03, abR: -0.03, toeL: 0, toeR: 0,
    ikL: false, ikR: false, fL: [0, 0, 0], fR: [0, 0, 0],   // foot targets: [sideways, forward, lift] from the spot under the hips
    lean: 0, tilt: 0, tiltZ: 0, bodyY: STAND_Y, sway: 0, spX: 0, spY: 0, spZ: 0, pvY: 0, pvZ: 0, headX: 0, headY: 0,
  };

  // one damped spring per joint: w = how fast it follows, z = how much it resists overshooting
  const CH = {}, goal = {};
  const ch = (name, w, z, x = 0) => { CH[name] = { x, v: 0, w, z }; };
  for (const s of ['L', 'R']) { ch('sh' + s + 'x', 17, 0.72); ch('sh' + s + 'z', 17, 0.78); ch('el' + s, 19, 0.74); ch('wr' + s, 24, 0.7); ch('hip' + s + 'x', 38, 0.9); ch('hip' + s + 'z', 26, 0.9); ch('kn' + s, 38, 0.9); ch('an' + s, 30, 0.9); }
  ch('spX', 13, 0.82); ch('spY', 14, 0.82); ch('spZ', 12, 0.85); ch('hdX', 11, 0.9); ch('hdY', 11, 0.9);
  ch('pvX', 14, 0.9); ch('pvY', 16, 0.85); ch('pvZ', 14, 0.88); ch('tiltX', 14, 0.88); ch('tiltZ', 9, 0.9); ch('bodyY', 24, 0.86, STAND_Y); ch('sway', 10, 0.9);

  const v = new THREE.Vector3();
  const self = {
    root, T, J, x: 0, z: 0, y: 0, yaw: 0, seed: 0, gait: 0, stepScale: 1, look: null,
    loc: { px: null, pz: 0, pyaw: 0, fwd: 0, lat: 0, speed: 0, raw: 0, accel: 0, yawRate: 0 },

    crouch(c) { T.ikL = T.ikR = false; T.hipL = T.hipR = -c; T.knL = T.knR = 2 * c; T.bodyY = ANKLE - HIP_Y + (THIGH + SHIN) * Math.cos(c); },
    get(name) { return CH[name].x; },
    shift(name, dx) { CH[name].x += dx; },      // move a joint without disturbing its motion (used to unwind a full arm circle)
    nudge(name, dv) { CH[name].v += dv; },      // kick a joint, e.g. the hips dropping on a landing
    setHot(on) { for (const [m, k] of [[skin, 1], [jersey, 0.5], [shorts, 0.42], [cuff, 0.42], [shoe, 0.2], [hairM, 0.7]]) { m.emissive.setHex(on ? 0xffffff : 0x000000); m.emissiveIntensity = k; } },

    // how the body is actually moving, measured from where it was last frame
    locomote(dt) {
      const L = this.loc;
      if (L.px === null) { L.px = this.x; L.pz = this.z; L.pyaw = this.yaw; }
      let vx = (this.x - L.px) / dt, vz = (this.z - L.pz) / dt; L.px = this.x; L.pz = this.z;
      if (Math.hypot(vx, vz) > 15) vx = vz = 0;   // a teleport, not a sprint
      const s = Math.sin(this.yaw), c = Math.cos(this.yaw), sp = Math.hypot(vx, vz), k = 1 - Math.exp(-dt * 12);
      L.fwd += (vx * s + vz * c - L.fwd) * k; L.lat += (vx * c - vz * s - L.lat) * k; L.speed = Math.hypot(L.fwd, L.lat);
      L.accel += ((sp - L.raw) / dt - L.accel) * (1 - Math.exp(-dt * 6)); L.raw = sp;
      L.yawRate += (wrap(this.yaw - L.pyaw) / dt - L.yawRate) * (1 - Math.exp(-dt * 8)); L.pyaw = this.yaw;
      if (this.y < 0.03) this.gait = (this.gait + Math.PI * L.speed * dt / (stepLen(L.speed) * this.stepScale)) % TAU; // stride follows distance covered
    },

    goals() {
      const g = goal, pvX = T.lean * 0.35;
      g.tiltX = T.tilt; g.tiltZ = T.tiltZ; g.pvX = pvX; g.pvY = T.pvY; g.pvZ = T.pvZ; g.bodyY = T.bodyY; g.sway = T.sway;
      g.spX = T.lean * 0.65 + T.spX; g.spY = T.spY; g.spZ = T.spZ;
      for (const s of ['L', 'R']) {
        g['sh' + s + 'x'] = T['sh' + s + 'x']; g['sh' + s + 'z'] = T['sh' + s + 'z']; g['el' + s] = T['el' + s]; g['wr' + s] = T['wr' + s];
        let hx, kx, ab;
        if (T['ik' + s]) { // two-bone IK: put the ankle on its target
          const f = T['f' + s], drop = Math.max(0.2, CH.bodyY.x + HIP_Y - ANKLE - f[2]), dx = f[0] - (s === 'L' ? HIP_X : -HIP_X) - T.sway;
          const dv = Math.hypot(drop, dx), d = clamp(Math.hypot(dv, f[1]), 0.25, THIGH + SHIN - 0.004);
          ab = Math.atan2(dx, drop);
          hx = Math.atan2(-f[1], dv) - Math.acos(clamp((THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d), -1, 1));
          kx = Math.PI - Math.acos(clamp((THIGH * THIGH + SHIN * SHIN - d * d) / (2 * THIGH * SHIN), -1, 1));
        } else { hx = T['hip' + s]; kx = T['kn' + s]; ab = T['ab' + s]; }
        g['hip' + s + 'x'] = hx - pvX; g['hip' + s + 'z'] = ab - T.pvZ; g['kn' + s] = kx;
        g['an' + s] = clamp(T['toe' + s] - T.tilt - hx - kx, -0.8, 0.95); // cancels the leg's angles so the sole stays level
      }
      if (this.look) { // turn the head toward the look target, within what a neck can do
        const dx = this.look.x - this.x, dy = this.look.y - (this.y + CH.bodyY.x + 0.78), dz = this.look.z - this.z;
        const yaw = wrap(Math.atan2(dx, dz) - this.yaw - CH.pvY.x - CH.spY.x);
        g.hdY = Math.abs(yaw) > 2.1 ? 0 : clamp(yaw, -1.1, 1.1);
        g.hdX = clamp(-Math.atan2(dy, Math.hypot(dx, dz)) - CH.pvX.x - CH.spX.x - CH.tiltX.x, -0.7, 0.55);
      } else { g.hdY = T.headY; g.hdX = T.headX; }
      return g;
    },

    write() {
      tilt.rotation.x = CH.tiltX.x; tilt.rotation.z = CH.tiltZ.x;
      hips.position.x = CH.sway.x; hips.position.y = CH.bodyY.x; hips.rotation.set(CH.pvX.x, CH.pvY.x, CH.pvZ.x);
      spine.rotation.set(CH.spX.x, CH.spY.x, CH.spZ.x); neck.rotation.set(CH.hdX.x, CH.hdY.x, 0);
      for (const s of ['L', 'R']) {
        J['sh' + s].rotation.x = CH['sh' + s + 'x'].x; J['sh' + s].rotation.z = CH['sh' + s + 'z'].x; J['el' + s].rotation.x = CH['el' + s].x; J['wr' + s].rotation.x = CH['wr' + s].x;
        J['hip' + s].rotation.x = CH['hip' + s + 'x'].x; J['hip' + s].rotation.z = CH['hip' + s + 'z'].x; J['kn' + s].rotation.x = CH['kn' + s].x; J['foot' + s].rotation.x = CH['an' + s].x;
      }
      root.position.set(this.x, this.y, this.z); root.rotation.y = this.yaw;
    },

    snap() { // jump straight to the current pose (after a teleport)
      const g = this.goals(); for (const n in CH) { CH[n].x = g[n]; CH[n].v = 0; }
      const L = this.loc; L.px = null; L.fwd = L.lat = L.speed = L.raw = L.accel = L.yawRate = 0;
      this.write();
    },

    apply(dt, rate = 16) {
      if (dt >= 0.5) return this.snap();
      if (dt < 1e-5) return;
      this.locomote(dt);
      const g = this.goals(), n = Math.max(1, Math.ceil(dt / 0.011)), h = dt / n, rs = rate / 16;
      for (const name in CH) {
        const c = CH[name], t = g[name], w = c.w * rs, k = w * w, d = 2 * c.z * w;
        for (let i = 0; i < n; i++) { c.v += (k * (t - c.x) - d * c.v) * h; c.x += c.v * h; }
      }
      this.write();
    },

    // aim an arm so the palm lands on a point in the world (shoulder swing + spread, then the elbow)
    reach(side, target) {
      const sh = J['sh' + side], F = FARM + PALM;
      spine.updateWorldMatrix(true, false);
      v.copy(target); spine.worldToLocal(v); v.sub(sh.position);
      let d = v.length(); const max = UARM + F - 0.012;
      if (d > max) { v.multiplyScalar(max / d); d = max; } d = Math.max(d, 0.14);
      const e = -Math.acos(clamp((d * d - UARM * UARM - F * F) / (2 * UARM * F), -1, 1));
      const A = UARM + F * Math.cos(e), B = -F * Math.sin(e), tz = Math.asin(clamp(v.x / Math.max(A, 0.05), -1, 1));
      T['sh' + side + 'x'] = wrap(Math.atan2(v.z, v.y) - Math.atan2(B, -A * Math.cos(tz)));
      T['sh' + side + 'z'] = tz; T['el' + side] = e;
    },

    handPos(side, out) { root.updateMatrixWorld(true); return J['hand' + side].getWorldPosition(out || v); },
    // local (x,z) offset → world, given current yaw
    local(lx, lz, out) {
      const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
      return out.set(this.x + lx * c + lz * s, 0, this.z - lx * s + lz * c);
    },
  };
  self.snap();
  return self;
}

// ───────────── poses ─────────────
function neutral(T) { // everything a pose may leave untouched goes back to rest
  T.wrL = T.wrR = 0; T.abL = 0.03; T.abR = -0.03; T.toeL = T.toeR = 0; T.ikL = T.ikR = false;
  T.tilt = T.tiltZ = T.sway = T.spX = T.spY = T.spZ = T.pvY = T.pvZ = T.headX = T.headY = 0;
}

// Legs from foot targets. A planted foot moves back under the body exactly as fast as the
// body moves forward, so it stays put on the floor; then it lifts and swings through.
function gaitLegs(b, width, stagger, lift = 1, reach = 0.86) {
  const T = b.T, L = b.loc, sp = L.speed, g = smooth(0.2, 1.5, sp), run = sat(sp / 6.5);
  const step = stepLen(sp) * b.stepScale, f = Math.min(0.5, reach / (2 * step)); // f: share of the cycle a foot is on the floor
  const ux = sp > 0.05 ? L.lat / sp : 0, uz = sp > 0.05 ? L.fwd / sp : 1, travel = 2 * step * f * g;
  for (const s of ['L', 'R']) {
    const sgn = s === 'L' ? 1 : -1, ps = TAU * f;
    let p = (b.gait + (s === 'L' ? 0 : Math.PI)) % TAU, along, up = 0, toe = 0;
    if (p < 0) p += TAU;
    if (p < ps) { const u = p / ps; along = 0.5 - u; toe = u > 0.7 ? (u - 0.7) / 0.3 * 0.5 : u < 0.15 ? (u - 0.15) / 0.15 * 0.2 : 0; }      // planted: heel strike → toe-off
    else { const u = (p - ps) / (TAU - ps); along = -0.5 * Math.cos(Math.PI * u); up = Math.sin(Math.PI * Math.pow(u, 0.8)); toe = u < 0.35 ? 0.5 * (1 - u / 0.35) : u > 0.8 ? -(u - 0.8) : 0; } // swinging through
    const F = T['f' + s];
    F[0] = sgn * width + ux * along * travel; F[1] = sgn * stagger * (1 - g) + uz * along * travel; F[2] = up * (0.05 + 0.3 * run) * g * lift;
    T['ik' + s] = true; T['toe' + s] = toe * g;
  }
  return f;
}

// dribbling, running, or standing with the ball
export function poseMove(b, time, m, hasBall, bounce) {
  const T = b.T, L = b.loc, sp = L.speed, g = smooth(0.2, 1.5, sp), run = sat(sp / 6.5), still = 1 - g;
  neutral(T);
  const f = gaitLegs(b, lerp(0.17, 0.08, g), 0.1), mid = b.gait - Math.PI * f; // mid = 0 when the left foot is directly under the body
  T.bodyY = STAND_Y - 0.085 - 0.04 * run - (0.018 + 0.03 * run) * g * Math.cos(2 * mid) - 0.03 * still * (1 - bounce);
  T.lean = 0.1 + 0.2 * run + clamp(L.accel * 0.03, -0.14, 0.2);    // lean into acceleration, sit back when braking
  T.tiltZ = clamp(-L.yawRate * sp * 0.012, -0.2, 0.2);              // bank into turns
  const c = Math.cos(b.gait - 0.4), amp = g * (0.3 + 0.6 * run);
  T.pvY = -0.13 * g * c; T.spY = 0.3 * g * c; T.pvZ = 0.05 * g * Math.sin(b.gait); // hips and shoulders counter-rotate
  T.shLx = 0.12 + amp * c; T.shLz = 0.14; T.elL = -0.35 - 1.05 * run * g - 0.25 * amp * (1 - c);
  if (hasBall) { T.shRx = -0.35; T.shRz = -0.16; T.elR = -0.55 - 0.7 * bounce; T.wrR = 0.55 - bounce; }
  else { T.shRx = 0.12 - amp * c; T.shRz = -0.14; T.elR = -0.35 - 1.05 * run * g - 0.25 * amp * (1 + c); }
  T.sway = 0.03 * still * Math.sin(time * 0.8 + b.seed); T.spZ = -0.03 * still * Math.sin(time * 0.8 + b.seed); // weight shifts when standing
  T.spX = 0.012 * Math.sin(time * 1.7 + b.seed);                                                                 // breathing
}

// jump shot: dip, rise, set point above the forehead, then full extension and a wrist snap
export function poseShoot(b, p, released, fade) {
  const T = b.T, a = smooth(0.1, 0.6, p);
  neutral(T);
  if (p < 0.34) { b.crouch(p < 0.2 ? lerp(0.3, 0.74, smooth(0, 0.2, p)) : lerp(0.74, 0.04, smooth(0.2, 0.33, p))); T.abL = 0.09; T.abR = -0.09; }
  else if (p < 1.28) { T.bodyY = STAND_Y; T.hipL = -0.1; T.knL = 0.28; T.hipR = fade ? -0.8 : -0.16; T.knR = fade ? 1.05 : 0.36; T.toeL = T.toeR = 0.55; }
  else b.crouch(0.3);
  T.lean = lerp(0.2, 0, a); T.spX = -0.1 * a - fade * 0.28 * smooth(0.25, 0.7, p); T.tilt = -fade * 0.3 * smooth(0.22, 0.6, p);
  if (!released) {
    T.shRx = lerp(-0.45, -1.95, a); T.shRz = 0.04; T.elR = lerp(-1.9, -1.25, a); T.wrR = -0.85 * a;
    T.shLx = lerp(-0.45, -1.8, a); T.shLz = -0.3; T.elL = lerp(-1.9, -1.35, a); T.wrL = -0.3;
  } else {
    T.shRx = -2.72; T.shRz = 0.02; T.elR = -0.05; T.wrR = 1.2;   // the follow-through, held until landing
    T.shLx = -1.7; T.shLz = 0.05; T.elL = -1.15;
  }
}

// last step before a dunk: a long, low plant on the left foot with the ball swinging up from the hip
export function poseGather(b, p) {
  const T = b.T, k = sat(p);
  neutral(T);
  T.bodyY = STAND_Y - 0.12 - 0.12 * Math.sin(Math.PI * k);
  T.ikL = T.ikR = true; T.fL[0] = 0.11; T.fL[1] = lerp(0.15, 0.42, k); T.fL[2] = 0; T.fR[0] = -0.11; T.fR[1] = lerp(-0.2, -0.36, k); T.fR[2] = 0; T.toeR = 0.4 * k;
  T.lean = lerp(0.34, 0.14, k); T.spX = 0.14;
  T.shRx = lerp(0.5, -0.7, k); T.shRz = 0.2; T.elR = -1.1; T.shLx = lerp(0.6, -0.7, k); T.shLz = -0.2; T.elL = -1.1;
}

// in the air on the way to the rim
export function poseDunk(b, k, windmill, reverse) {
  const T = b.T, slam = k > 0.8;
  neutral(T);
  T.bodyY = STAND_Y; T.toeL = T.toeR = 0.6;
  T.hipL = lerp(0.35, -0.55, smooth(0.1, 0.55, k)); T.knL = lerp(0.15, 1.35, smooth(0.1, 0.5, k)); // push-off leg trails, then tucks
  T.hipR = lerp(-1.35, -1.0, smooth(0.3, 0.7, k)); T.knR = 1.55;                                   // knee drive
  if (slam) { T.hipL = -0.25; T.knL = 0.7; T.hipR = -0.7; T.knR = 1.0; }
  T.spX = slam ? 0.3 : -0.34 * smooth(0, 0.3, k); T.lean = slam ? 0.12 : -0.06; T.tilt = slam ? 0.06 : -0.08; // arch back, then crunch through the rim
  T.shRx = slam ? -2.8 : -3.5; T.shRz = -0.08; T.elR = slam ? -0.05 : -0.95; T.wrR = slam ? 0.9 : -0.4;
  T.shLx = -0.7; T.shLz = 0.95; T.elL = -0.55;
  if (windmill) { // the ball arm sweeps a full circle: down, behind, overhead, then through the rim
    if (slam) { if (b.get('shRx') > 1) b.shift('shRx', -TAU); }
    else { T.shRx = lerp(0.5, 3.83, smooth(0.08, 0.8, k)); T.elR = -0.12; T.wrR = 0; }
  }
  if (reverse && slam) { T.shRx = -3.3; T.elR = -0.1; T.spX = -0.2; T.lean = -0.05; T.tilt = -0.1; } // over the head, back to the rim
}

// hanging on the rim: the body swings like a pendulum and settles
export function poseHang(b, time, t = 0) {
  const T = b.T, sw = 0.5 * Math.exp(-2.2 * t) * Math.cos(7.5 * t);
  neutral(T);
  T.bodyY = STAND_Y; T.tilt = sw * 0.12; T.lean = 0.05; T.spX = 0.12 - sw * 0.25; T.toeL = T.toeR = 0.5;
  T.shRx = -3.05; T.shRz = 0; T.elR = -0.08; T.wrR = 0.5; T.shLx = -0.5 + sw * 0.4; T.shLz = 0.5; T.elL = -0.7;
  T.hipL = -0.3 - sw * 0.9; T.knL = 0.75 + sw * 0.3; T.hipR = -0.45 - sw * 0.8; T.knR = 0.95 + sw * 0.3;
}

// dropping back to the floor
export function poseAir(b) {
  const T = b.T;
  neutral(T);
  T.bodyY = STAND_Y; T.lean = 0.12; T.hipL = -0.2; T.knL = 0.35; T.hipR = -0.3; T.knR = 0.5; T.toeL = T.toeR = 0.35;
  T.shLx = -0.6; T.shLz = 0.75; T.elL = -0.5; T.shRx = -0.9; T.shRz = -0.75; T.elR = -0.5;
}

// defensive stance: wide base, chest up, active hands, quick shuffle steps
export function poseDefend(b, time, handsUp, m) {
  const T = b.T, w = Math.sin(time * 4.2 + b.seed * 3);
  neutral(T);
  gaitLegs(b, handsUp ? 0.2 : 0.27, 0.04, 0.5, 0.6);
  T.bodyY = STAND_Y - (handsUp ? 0.1 : 0.2); T.lean = handsUp ? 0.04 : 0.34; T.spX = handsUp ? -0.04 : -0.16;
  if (handsUp) { T.shRx = -3.0; T.shRz = -0.1; T.elR = -0.1; T.shLx = -2.5 + 0.1 * w; T.shLz = 0.35; T.elL = -0.35; }
  else { T.shLx = -0.75 + 0.12 * w; T.shLz = 0.9; T.elL = -0.6; T.shRx = -1.05 - 0.15 * w; T.shRz = -0.5; T.elR = -0.55; T.wrL = T.wrR = -0.4; }
}

// knocked over: reel back, hit the floor, rock up to a squat, stand. Returns how high the body sits.
export function poseFall(b, t) {
  const T = b.T;
  neutral(T); T.bodyY = STAND_Y;
  if (t < 0.4) {
    const k = t / 0.4; T.tilt = -0.25 - 0.9 * k; T.spX = -0.3; T.headX = 0.3;
    T.shLx = T.shRx = -2.3; T.shLz = 0.9; T.shRz = -0.9; T.elL = T.elR = -0.4; T.hipL = -0.7 * k; T.knL = 0.5 * k; T.hipR = -0.2; T.knR = 0.4;
    return 0.05 * k;
  }
  if (t < 1.55) {
    T.tilt = -1.5; T.spX = 0.22; T.headX = 0.35; T.shLx = T.shRx = -0.2; T.shLz = 1.25; T.shRz = -1.25; T.elL = T.elR = -0.35;
    T.hipL = -1.0; T.knL = 1.5; T.hipR = -0.55; T.knR = 0.9;
    return 0.14;
  }
  if (t < 2.1) { b.crouch(1.15); T.tilt = -0.55; T.spX = 0.7; T.shLx = T.shRx = -1.1; T.shLz = 0.3; T.shRz = -0.3; T.elL = T.elR = -0.6; return 0.04; }
  b.crouch(lerp(1.0, 0.35, sat((t - 2.1) / 0.5))); T.lean = 0.35; T.shLx = T.shRx = -0.5; T.shLz = 0.4; T.shRz = -0.4; T.elL = T.elR = -0.6;
  return 0;
}

// teammates and the referee: stand, shift weight, call for the ball, celebrate — and walk if they are moving
export function poseIdle(b, time, cheer, seed) {
  const T = b.T, g = smooth(0.2, 1.5, b.loc.speed), still = 1 - g, s = Math.sin(time * 0.7 + seed), kind = Math.floor(seed * 1.3) % 3;
  neutral(T);
  gaitLegs(b, 0.13, 0.05);
  T.bodyY = STAND_Y - 0.04 - 0.03 * g; T.lean = 0.05 + 0.08 * g;
  T.sway = 0.035 * s * still; T.pvZ = 0.05 * s * still; T.spZ = -0.05 * s * still; T.spX = 0.012 * Math.sin(time * 1.6 + seed);
  const c = Math.cos(b.gait - 0.4);
  if (cheer) { const pump = Math.sin(time * 13 + seed); T.shLx = T.shRx = -2.85 + 0.25 * pump; T.shLz = 0.4; T.shRz = -0.4; T.elL = T.elR = -0.35 - 0.3 * pump; T.spX = -0.1; }
  else if (g > 0.3) { T.shLx = 0.1 + 0.35 * g * c; T.shRx = 0.1 - 0.35 * g * c; T.shLz = 0.12; T.shRz = -0.12; T.elL = T.elR = -0.4; }
  else if (kind === 0 && Math.sin(time * 0.3 + seed) > 0.55) { T.lean = 0.5; T.bodyY = STAND_Y - 0.11; T.shLx = T.shRx = -0.3; T.shLz = 0.1; T.shRz = -0.1; T.elL = T.elR = -0.12; } // hands on knees
  else if (kind === 1 && Math.sin(time * 0.55 + seed * 3) > 0.45) { T.shLx = -2.75 + 0.12 * Math.sin(time * 7); T.shLz = 0.25; T.elL = -0.3; T.shRx = -0.1; T.shRz = -0.12; T.elR = -0.3; } // calling for the ball
  else { T.shLx = T.shRx = 0.05 + 0.04 * s; T.shLz = 0.13; T.shRz = -0.13; T.elL = T.elR = -0.3; }
}
