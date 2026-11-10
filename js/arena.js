// Arena: glossy hardwood, hoop, crowd, LED ribbon, flashbulbs and project hotspots.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

export const HOOP = { x: 12.4, y: 3.05, z: 0 };
export const COURT = { x0: -3, x1: 14, zw: 7.5, R3: 7.24, corner: 6.7 };

const FONT = '"Barlow Condensed", Impact, sans-serif';

function courtTexture(player) {
  const N = 2048, S = N / 18, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d');
  const X = (x) => (x + 3) * S, Z = (z) => (z + 9) * S;

  // apron
  g.fillStyle = '#1a1038'; g.fillRect(0, 0, N, N);
  // hardwood planks
  const y0 = Z(-7.5), y1 = Z(7.5), ph = 0.09 * S;
  for (let y = y0; y < y1; y += ph) {
    let x = -Math.random() * 200;
    while (x < N) {
      const w = 160 + Math.random() * 220, l = 58 + Math.random() * 9, s = 52 + Math.random() * 8;
      g.fillStyle = `hsl(${27 + Math.random() * 5} ${s}% ${l}%)`;
      g.fillRect(x, y, w - 1, Math.min(ph, y1 - y) - 0.6);
      x += w;
    }
  }
  g.fillStyle = 'rgba(60,30,10,0.10)';
  for (let i = 0; i < 2600; i++) g.fillRect(Math.random() * N, y0 + Math.random() * (y1 - y0), 30 + Math.random() * 90, 1);

  // painted areas
  g.fillStyle = 'rgba(64,32,140,0.88)'; g.fillRect(X(8.2), Z(-2.45), X(14) - X(8.2), Z(2.45) - Z(-2.45));
  g.beginPath(); g.arc(X(0), Z(0), 1.8 * S, 0, Math.PI * 2); g.fill();

  g.strokeStyle = '#f6f2e8'; g.lineWidth = 0.055 * S; g.lineJoin = 'round';
  const line = (a, b, cc, d) => { g.beginPath(); g.moveTo(X(a), Z(b)); g.lineTo(X(cc), Z(d)); g.stroke(); };
  g.strokeRect(X(-3) - 20, Z(-7.5), X(14) - X(-3) + 20, Z(7.5) - Z(-7.5)); // sidelines + baseline
  line(0, -7.5, 0, 7.5);                                                  // half court
  g.beginPath(); g.arc(X(0), Z(0), 1.8 * S, 0, Math.PI * 2); g.stroke();
  g.strokeRect(X(8.2), Z(-2.45), X(14) - X(8.2), Z(2.45) - Z(-2.45));      // key
  g.beginPath(); g.arc(X(8.2), Z(0), 1.8 * S, Math.PI / 2, Math.PI * 1.5); g.stroke();
  g.setLineDash([14, 14]); g.beginPath(); g.arc(X(8.2), Z(0), 1.8 * S, -Math.PI / 2, Math.PI / 2); g.stroke(); g.setLineDash([]);
  const a0 = Math.asin(COURT.corner / COURT.R3), cx = HOOP.x - COURT.R3 * Math.cos(a0);
  line(14, -6.7, cx, -6.7); line(14, 6.7, cx, 6.7);
  g.beginPath(); g.arc(X(HOOP.x), Z(0), COURT.R3 * S, Math.PI - a0, Math.PI + a0); g.stroke();
  g.beginPath(); g.arc(X(HOOP.x), Z(0), 1.25 * S, Math.PI / 2, Math.PI * 1.5); g.stroke();
  for (const zz of [-2.45, 2.45]) for (const xx of [9.4, 10.3, 11.2, 12.1]) line(xx, zz, xx, zz + Math.sign(zz) * 0.22);

  // logos
  g.fillStyle = '#ffc531'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 ${1.5 * S}px ${FONT}`; g.fillText('</>', X(0), Z(0.08));
  g.fillStyle = 'rgba(255,197,49,0.92)'; g.font = `900 ${1.0 * S}px ${FONT}`;
  g.fillText(player.name.toUpperCase(), X(6), Z(-8.2));
  g.fillStyle = 'rgba(246,242,232,0.5)'; g.font = `700 ${0.6 * S}px ${FONT}`;
  g.fillText('PORTFOLIO ARENA  ·  ' + player.role.toUpperCase(), X(6), Z(8.25));

  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function spotTexture(n, label, color) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = color; g.globalAlpha = 0.28; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.fill();
  g.globalAlpha = 1; g.strokeStyle = color; g.lineWidth = 12; g.beginPath(); g.arc(128, 128, 116, 0, 7); g.stroke();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 120px ${FONT}`; g.fillText(n, 128, 112);
  g.font = `700 30px ${FONT}`; g.fillText(label, 128, 190);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function ribbonTexture(words) {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#0a0618'; g.fillRect(0, 0, 2048, 64);
  g.font = `800 44px ${FONT}`; g.textBaseline = 'middle';
  let x = 20, i = 0; const cols = ['#ffc531', '#ffffff', '#b07bff'];
  while (x < 1900) { const w = words[i % words.length]; g.fillStyle = cols[i % 3]; g.fillText(w, x, 34); x += g.measureText(w).width + 60; i++; }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
}

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,0.6)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function buildArena(scene, player, projects) {
  scene.background = new THREE.Color(0x0b0914);

  // ── lights
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x24163f, 0.75));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
  key.position.set(4, 20, 9); key.target.position.set(6.5, 0, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 11, bottom: -11, near: 1, far: 45 });
  key.shadow.bias = -0.0004; key.shadow.radius = 4;
  scene.add(key, key.target);
  const rimLight = new THREE.SpotLight(0xffe2b0, 420, 30, 0.5, 0.6, 1.6);
  rimLight.position.set(9, 13, 0); rimLight.target.position.set(HOOP.x - 1.5, 0, 0);
  scene.add(rimLight, rimLight.target);

  // ── glossy floor: mirror underneath a slightly transparent hardwood layer
  const mirror = new Reflector(new THREE.PlaneGeometry(18, 18), { textureWidth: 1024, textureHeight: 1024, color: 0x9a9a9a, clipBias: 0.003 });
  mirror.rotation.x = -Math.PI / 2; mirror.position.set(6, -0.012, 0); scene.add(mirror);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18),
    new THREE.MeshStandardMaterial({ map: courtTexture(player), roughness: 0.32, metalness: 0.05, transparent: true, opacity: 0.76 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(6, 0, 0); floor.receiveShadow = true; scene.add(floor);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), new THREE.MeshBasicMaterial({ color: 0x08060f }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(6, -0.03, 0); scene.add(ground);

  // ── hoop
  const hoop = new THREE.Group(); scene.add(hoop);
  const dark = new THREE.MeshStandardMaterial({ color: 0x15151c, roughness: 0.5 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 1.0), dark); base.position.set(15.4, 0.6, 0); base.castShadow = true;
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.0, 0.3), dark); pole.position.set(15.2, 2.2, 0); pole.rotation.z = 0.28;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.2, 0.26), dark); arm.position.set(13.85, 3.55, 0);
  hoop.add(base, pole, arm);
  const board = new THREE.Group(); board.position.set(12.78, 3.5, 0); hoop.add(board);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.07, 1.83),
    new THREE.MeshStandardMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.28, roughness: 0.1 }));
  board.add(glass);
  { const c = document.createElement('canvas'); c.width = 512; c.height = 300; const g = c.getContext('2d');
    g.strokeStyle = '#fff'; g.lineWidth = 12; g.strokeRect(6, 6, 500, 288); g.lineWidth = 9; g.strokeRect(173, 150, 166, 126);
    const t = new THREE.CanvasTexture(c);
    const lines = new THREE.Mesh(new THREE.PlaneGeometry(1.83, 1.07), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide }));
    lines.rotation.y = -Math.PI / 2; lines.position.x = -0.025; board.add(lines); }
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xff5a1f, roughness: 0.35, emissive: 0xff3a00, emissiveIntensity: 0.25 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 8, 28), rimMat);
  rim.rotation.x = Math.PI / 2; rim.position.set(HOOP.x, HOOP.y, HOOP.z); rim.castShadow = true; hoop.add(rim);
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.1), rimMat); brace.position.set(HOOP.x + 0.3, HOOP.y, 0); hoop.add(brace);
  const net = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.13, 0.42, 14, 5, true),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.85 }));
  net.position.set(HOOP.x, HOOP.y - 0.21, HOOP.z); hoop.add(net);

  // ── people: stands, benches, scorer's table, baseline photographers, foreground silhouettes
  const people = [], seats = [];
  const HOME = [0xffc531, 0x5b2bd6, 0xffc531, 0x3c1aa6], MIX = [0xe8e4da, 0x2a2a3a, 0x8a8a9a, 0x24506a, 0x7a2a3a, 0x55556a, 0x1b1b24];
  const SK = [0x8d5a3b, 0x5c3a24, 0xc68e63, 0xe0b08a, 0x3f2a1c];
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const person = (x, y, z, shirt, lum) => people.push({ x, y, z, shirt, lum });
  const fan = () => (Math.random() < 0.3 ? pick(HOME) : pick(MIX));
  for (let r = 0; r < 14; r++) for (let x = -10; x < 26; x += 0.62) {
    const p = [x + (r % 2) * 0.3, 1.0 + r * 0.62, -10.6 - r * 0.92]; seats.push(p); person(...p, fan(), 0.3 + Math.random() * 0.32);
  }
  for (let r = 0; r < 12; r++) for (let z = -9.5; z < 9.5; z += 0.62) {
    const p = [17.4 + r * 0.92, 1.0 + r * 0.62, z + (r % 2) * 0.3]; seats.push(p); person(...p, fan(), 0.28 + Math.random() * 0.3);
  }
  for (let x = 0.6; x < 4.5; x += 0.64) person(x, 0.62, -8.6, 0xffc531, 0.95);          // home bench
  for (let x = 8.3; x < 12.2; x += 0.64) person(x, 0.62, -8.6, 0x1e7a3c, 0.95);         // visitors bench
  for (let x = 5.1; x < 7.7; x += 0.64) person(x, 0.66, -8.8, 0x1b1b24, 0.9);           // scorer's table crew
  for (let z = -7; z < 7.2; z += 0.85) if (Math.abs(z) > 1.8) person(14.95 + Math.random() * 0.3, 0.3, z, 0x1b1b24, 0.7); // photographers
  for (let r = 0; r < 12; r++) for (let x = -10; x < 26; x += 0.62) { // near side: kept shallow so the sideline camera sees over it
    const p = [x + (r % 2) * 0.3, 0.6 + r * 0.5, 9.7 + r * 0.9]; seats.push(p); person(...p, fan(), r < 3 ? 0.2 + Math.random() * 0.12 : 0.3 + Math.random() * 0.3);
  }
  const crowd = new THREE.Group(); scene.add(crowd);
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.46, 0.58, 0.3), new THREE.MeshBasicMaterial(), people.length);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshBasicMaterial(), people.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  people.forEach((p, i) => {
    const j = Math.random() * 0.1;
    m4.makeTranslation(p.x, p.y + j, p.z); bodies.setMatrixAt(i, m4);
    m4.makeTranslation(p.x, p.y + j + 0.44, p.z); heads.setMatrixAt(i, m4);
    bodies.setColorAt(i, col.setHex(p.shirt).multiplyScalar(p.lum));
    heads.setColorAt(i, col.setHex(pick(SK)).multiplyScalar(Math.min(1, p.lum * 1.1)));
  });
  crowd.add(bodies, heads);
  const table = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.78, 0.45), new THREE.MeshBasicMaterial({ color: 0x3c1aa6 }));
  table.position.set(6.35, 0.39, -8.3); scene.add(table);
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.06, 0.5), new THREE.MeshBasicMaterial({ color: 0xffc531 }));
  tableTop.position.set(6.35, 0.8, -8.3); scene.add(tableTop);

  // ── LED ribbon boards
  const words = [...new Set(projects.flatMap((p) => p.stack))].map((w) => w.toUpperCase() + '  ·');
  const ribbonTex = ribbonTexture(words.length ? words : ['PORTFOLIO  ·']);
  ribbonTex.repeat.set(1.4, 1);
  const ribMat = new THREE.MeshBasicMaterial({ map: ribbonTex });
  const rib1 = new THREE.Mesh(new THREE.BoxGeometry(30, 0.85, 0.2), ribMat); rib1.position.set(7, 0.42, -9.3); scene.add(rib1);
  const rib2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.85, 18.6), new THREE.MeshBasicMaterial({ color: 0x120a2a })); rib2.position.set(16.3, 0.42, 0); scene.add(rib2);

  // ── camera flashes in the stands
  const glow = glowTexture();
  const flashes = Array.from({ length: 16 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.setScalar(1.6); scene.add(s); return s;
  });
  let flashRate = 0.6;
  const fire = (s) => { const p = seats[(Math.random() * seats.length) | 0]; s.position.set(p[0], p[1] + 0.4, p[2] + 0.3); s.material.opacity = 1; };

  // ── project hotspots
  const spots = projects.map((p, i) => {
    const g = new THREE.Group(); g.position.set(p.spot[0], 0, p.spot[1]); scene.add(g);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.72, 40),
      new THREE.MeshBasicMaterial({ map: spotTexture(String(i + 1), p.playName, p.color), transparent: true, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = 0.02;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.7, 28, 1, true),
      new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    beam.position.y = 0.85;
    g.add(disc, beam);
    return { proj: p, g, disc, beam, x: p.spot[0], z: p.spot[1], done: false };
  });

  let netT = 9, boardT = 9, hype = 0;
  return {
    spots, rim,
    swish() { netT = 0; },
    slam() { netT = 0; boardT = 0; },
    flashBurst(n = 10) { flashRate = 14; hype = 1; flashes.slice(0, n).forEach(fire); },
    showSpots(v) { for (const s of spots) s.g.visible = v; },
    setDone(spot) { spot.done = true; spot.beam.material.color.set(0x3dffa2); spot.beam.material.opacity = 0.05; },
    update(dt, time, activeSpot) {
      ribbonTex.offset.x += dt * 0.035;
      netT += dt; boardT += dt;
      const w = Math.sin(netT * 30) * Math.exp(-netT * 5);
      net.scale.set(1 - w * 0.28, 1 + w * 0.4, 1 - w * 0.28);
      const bw = Math.sin(boardT * 55) * Math.exp(-boardT * 6) * 0.05;
      board.rotation.z = bw; rim.rotation.y = bw * 2; rim.position.y = HOOP.y - Math.abs(bw) * 0.8;
      flashRate += (0.6 - flashRate) * Math.min(1, dt * 0.9);
      hype *= Math.exp(-dt * 0.9);
      crowd.position.y = Math.abs(Math.sin(time * 11)) * 0.16 * hype;
      for (const s of flashes) {
        if (s.material.opacity > 0.01) s.material.opacity *= Math.exp(-dt * 14);
        else if (Math.random() < flashRate * dt / flashes.length * 4) fire(s);
      }
      for (const s of spots) {
        const on = s === activeSpot, pulse = 0.5 + 0.5 * Math.sin(time * 3 + s.x);
        s.disc.scale.setScalar(on ? 1.12 : 1 + pulse * 0.04);
        if (!s.done) s.beam.material.opacity = on ? 0.22 : 0.05 + pulse * 0.05;
      }
    },
  };
}
