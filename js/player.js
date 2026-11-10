// Procedural low-poly baller: a jointed rig built from primitives and posed in code.
// Facing direction is local +Z. "R" arm (the ball hand) sits at local -X.
import * as THREE from 'three';

const THIGH = 0.47, SHIN = 0.47, FOOT = 0.13, UARM = 0.33, FARM = 0.3;
export const STAND_Y = THIGH + SHIN + FOOT;

function numberTexture(text, color) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 92px "Barlow Condensed", Impact, sans-serif';
  g.fillText(text, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function limb(len, r, mat) {
  const pivot = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.01, len - 2 * r), 4, 10), mat);
  m.position.y = -len / 2; m.castShadow = true;
  const end = new THREE.Group(); end.position.y = -len;
  pivot.add(m, end);
  return { pivot, end };
}

export function makeBaller(o) {
  const M = (c, rough = 0.7) => new THREE.MeshStandardMaterial({ color: c, roughness: rough });
  const skin = M(o.skin), jersey = M(o.jersey, 0.55), shorts = M(o.shorts, 0.6), shoe = M(o.shoe, 0.4), trim = M(o.trim, 0.5);

  const shinMat = o.pants ? shorts : skin;
  if (o.stripes) { // referee shirt
    const c = document.createElement('canvas'); c.width = 64; c.height = 8; const g = c.getContext('2d');
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#111' : '#f4f4f4'; g.fillRect(i * 8, 0, 8, 8); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.x = 3;
    jersey.map = t; jersey.color.set(0xffffff);
  }
  const root = new THREE.Group(), tilt = new THREE.Group(), body = new THREE.Group();
  root.add(tilt); tilt.add(body); body.position.y = STAND_Y;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.19, 0.6, 14), jersey);
  torso.scale.z = 0.62; torso.position.y = 0.3; torso.castShadow = true; body.add(torso);
  const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.225, 0.3, 14), shorts);
  hem.scale.z = 0.72; hem.position.y = -0.09; hem.castShadow = true; body.add(hem);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.196, 0.2, 0.05, 14), trim);
  band.scale.z = 0.66; band.position.y = 0.04; body.add(band);

  const numMat = new THREE.MeshBasicMaterial({ map: numberTexture(o.number, o.numColor), transparent: true });
  const nf = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), numMat); nf.position.set(0, 0.36, 0.158);
  const nb = nf.clone(); nb.position.z = -0.158; nb.rotation.y = Math.PI;
  body.add(nf, nb);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.1, 8), skin); neck.position.y = 0.64; body.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 12), skin); head.position.y = 0.8; head.scale.y = 1.12; head.castShadow = true; body.add(head);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0b0b0b });
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), eyeMat); eye.position.set(sx * 0.045, 0.825, 0.116); body.add(eye);
  }
  if (o.hair !== null) {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.128, 16, 10, 0, Math.PI * 2, 0, Math.PI * (o.hairLen || 0.48)), M(o.hair ?? 0x16110e, 0.9));
    hair.position.y = 0.815; hair.scale.y = 1.1; body.add(hair);
  }
  if (o.headband) {
    const hb = new THREE.Mesh(new THREE.TorusGeometry(0.122, 0.016, 6, 20), trim);
    hb.rotation.x = Math.PI / 2; hb.position.y = 0.85; body.add(hb);
  }

  const J = {};
  for (const [side, sx] of [['L', 1], ['R', -1]]) {
    const up = limb(UARM, 0.055, skin); up.pivot.position.set(sx * 0.29, 0.55, 0); body.add(up.pivot);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), jersey); up.pivot.add(cap);
    const lo = limb(FARM, 0.045, skin); up.end.add(lo.pivot);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 6), skin); lo.end.add(hand);
    J['sh' + side] = up.pivot; J['el' + side] = lo.pivot; J['hand' + side] = hand;

    const th = limb(THIGH, 0.085, shorts); th.pivot.position.set(sx * 0.115, -0.05, 0); body.add(th.pivot);
    const sh = limb(SHIN, 0.062, shinMat); th.end.add(sh.pivot);
    if (!o.pants) { const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.05, 0.14, 8), trim); sock.position.y = -SHIN + 0.09; sh.pivot.add(sock); }
    const ft = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.1, 0.29), shoe); ft.position.set(0, -SHIN - 0.03, 0.065); ft.castShadow = true; sh.pivot.add(ft);
    J['hip' + side] = th.pivot; J['kn' + side] = sh.pivot;
  }

  // pose targets — animation = set targets, joints ease toward them
  const T = { shLx: 0, shLz: 0.1, shRx: 0, shRz: -0.1, elL: 0, elR: 0, hipL: 0, hipR: 0, knL: 0, knR: 0, lean: 0, tilt: 0, bodyY: STAND_Y };
  const v = new THREE.Vector3();

  return {
    root, T, J, x: 0, z: 0, y: 0, yaw: 0,
    crouch(c) { T.hipL = T.hipR = -c; T.knL = T.knR = 2 * c; T.bodyY = FOOT + (THIGH + SHIN) * Math.cos(c); },
    apply(dt, rate = 16) {
      const k = 1 - Math.exp(-dt * rate);
      const e = (obj, ax, t) => { obj.rotation[ax] += (t - obj.rotation[ax]) * k; };
      e(J.shL, 'x', T.shLx); e(J.shL, 'z', T.shLz); e(J.shR, 'x', T.shRx); e(J.shR, 'z', T.shRz);
      e(J.elL, 'x', T.elL); e(J.elR, 'x', T.elR);
      e(J.hipL, 'x', T.hipL); e(J.hipR, 'x', T.hipR); e(J.knL, 'x', T.knL); e(J.knR, 'x', T.knR);
      e(body, 'x', T.lean); e(tilt, 'x', T.tilt);
      body.position.y += (T.bodyY - body.position.y) * k;
      root.position.set(this.x, this.y, this.z);
      root.rotation.y = this.yaw;
    },
    handPos(side, out) { root.updateMatrixWorld(true); return J['hand' + side].getWorldPosition(out || v); },
    // local (x,z) offset → world, given current yaw
    local(lx, lz, out) {
      const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
      return out.set(this.x + lx * c + lz * s, 0, this.z - lx * s + lz * c);
    },
  };
}

// ───────────── poses ─────────────
const lerp = (a, b, k) => a + (b - a) * k;
const sat = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export function poseMove(b, time, m, hasBall, bounce) {
  const T = b.T, ph = time * 11.5;
  b.crouch(0.22);
  T.hipL += Math.sin(ph) * 0.75 * m; T.hipR += -Math.sin(ph) * 0.75 * m;
  T.knL += Math.max(0, Math.cos(ph)) * 0.9 * m; T.knR += Math.max(0, -Math.cos(ph)) * 0.9 * m;
  T.lean = 0.1 + 0.14 * m; T.tilt = 0;
  T.shLx = -Math.sin(ph) * 0.7 * m - 0.1; T.shLz = 0.18; T.elL = -0.5 - 0.3 * m;
  if (hasBall) { T.shRx = -0.3; T.shRz = -0.12; T.elR = -0.55 - 0.7 * bounce; }
  else { T.shRx = Math.sin(ph) * 0.7 * m - 0.1; T.shRz = -0.18; T.elR = -0.5 - 0.3 * m; }
}

export function poseShoot(b, p, released, fade) {
  const T = b.T, a = smooth(0.05, 0.6, p);
  const c = p < 0.25 ? lerp(0.25, 0.62, p / 0.25) : lerp(0.62, 0.04, sat((p - 0.25) / 0.2));
  b.crouch(p > 1.25 ? 0.3 : c);
  T.lean = lerp(0.12, -0.04, a); T.tilt = -fade * 0.34 * smooth(0.2, 0.6, p);
  T.shRx = lerp(-0.7, -2.75, a); T.shRz = -0.05; T.elR = released ? -0.12 : lerp(-1.7, -1.15, a);
  T.shLx = lerp(-0.7, -2.5, a) + (released ? 0.9 : 0); T.shLz = -0.1; T.elL = released ? -0.5 : lerp(-1.6, -1.0, a);
  if (fade) { T.hipR = -0.7; T.knR = 0.9; }
}

export function poseDunk(b, k, windmill, reverse) {
  const T = b.T, slam = k > 0.8;
  T.bodyY = STAND_Y; T.lean = slam ? 0.3 : -0.12; T.tilt = slam ? 0.12 : -0.1;
  T.shRx = slam ? -2.45 : -3.55; T.shRz = -0.1; T.elR = slam ? -0.05 : -0.55;
  if (windmill) { // ball arm sweeps a full circle: down, behind, overhead, then through the rim
    const sh = b.J.shR.rotation;
    if (slam) { if (sh.x > 1) sh.x -= Math.PI * 2; }
    else { T.shRx = lerp(0.5, 3.83, smooth(0.08, 0.8, k)); T.elR = -0.1; }
  }
  if (reverse && slam) { T.shRx = -3.65; T.elR = -0.1; T.lean = -0.18; T.tilt = -0.22; } // over the head, back to the rim
  T.shLx = -0.5; T.shLz = 1.0; T.elL = -0.4;
  T.hipL = -1.1; T.knL = 1.6; T.hipR = -0.35; T.knR = 1.2;
}

export function poseHang(b, time) {
  const T = b.T, s = Math.sin(time * 9) * 0.25;
  T.bodyY = STAND_Y; T.lean = 0.1; T.tilt = s * 0.3;
  T.shRx = -3.05; T.shRz = 0; T.elR = 0; T.shLx = -0.3; T.shLz = 0.7; T.elL = -0.6;
  T.hipL = -0.5 + s; T.knL = 0.9; T.hipR = -0.3 - s; T.knR = 0.7;
}

export function poseDefend(b, time, handsUp, m) {
  const T = b.T, ph = time * 9;
  b.crouch(handsUp ? 0.18 : 0.36);
  T.hipL += Math.sin(ph) * 0.3 * m; T.hipR -= Math.sin(ph) * 0.3 * m;
  T.lean = handsUp ? 0 : 0.18; T.tilt = 0;
  if (handsUp) { T.shLx = T.shRx = -2.9; T.shLz = 0.22; T.shRz = -0.22; T.elL = T.elR = -0.12; }
  else { T.shLx = T.shRx = -0.35; T.shLz = 1.05; T.shRz = -1.05; T.elL = T.elR = -0.5; }
}

export function poseIdle(b, time, cheer, seed) {
  const T = b.T, s = Math.sin(time * 1.7 + seed);
  b.crouch(0.12 + 0.03 * s); T.lean = 0.06; T.tilt = 0;
  if (cheer) { T.shLx = T.shRx = -2.9 + 0.2 * Math.sin(time * 14 + seed); T.shLz = 0.35; T.shRz = -0.35; T.elL = T.elR = -0.3; }
  else if (Math.sin(time * 0.6 + seed * 3) > 0.55) { T.shLx = -2.6; T.shLz = 0.2; T.elL = -0.3; T.shRx = -0.2; T.shRz = -0.15; T.elR = -0.4; } // calling for the ball
  else { T.shLx = T.shRx = -0.15; T.shLz = 0.15; T.shRz = -0.15; T.elL = T.elR = -0.35 + 0.05 * s; }
}

export function poseDown(b) {
  const T = b.T;
  T.bodyY = STAND_Y; T.tilt = -1.5; T.lean = 0;
  T.shLx = T.shRx = -2.2; T.shLz = 0.9; T.shRz = -0.9; T.elL = T.elR = -0.3;
  T.hipL = -0.9; T.knL = 0.8; T.hipR = -0.5; T.knR = 1.1;
}
