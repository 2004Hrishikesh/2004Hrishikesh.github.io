// Arena: a bright, daylight-neutral building — pale maple floor, navy trim, soft grey stands,
// a hazy crowd that sways, a sponsor-board ribbon, and the project hotspots for the game.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

export const HOOP = { x: 12.4, y: 3.05, z: 0 };
export const COURT = { x0: -3, x1: 14, zw: 7.5, R3: 7.24, corner: 6.7 };

const FONT = '"Barlow Condensed", Impact, sans-serif';
const NAVY = '#233552', ORANGE = '#e8590c', HAZE = 0xdde3ea;
const LIGHT = { hemi: 1.25, key: 1.9, fill: 0.55 };

function courtTexture(player) {
  const N = 2048, S = N / 18, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d');
  const X = (x) => (x + 3) * S, Z = (z) => (z + 9) * S;

  g.fillStyle = NAVY; g.fillRect(0, 0, N, N); // apron
  // maple planks, laid over a slightly darker base so the seams between boards stay subtle
  const y0 = Z(-7.5), y1 = Z(7.5), ph = 0.09 * S;
  g.fillStyle = 'hsl(30 46% 57%)'; g.fillRect(0, y0, N, y1 - y0);
  for (let y = y0; y < y1; y += ph) {
    let x = -Math.random() * 200;
    while (x < N) {
      const w = 160 + Math.random() * 220;
      g.fillStyle = `hsl(${29 + Math.random() * 4} ${50 + Math.random() * 8}% ${63 + Math.random() * 6}%)`;
      g.fillRect(x, y, w - 1, Math.min(ph, y1 - y) - 0.6);
      x += w;
    }
  }
  g.fillStyle = 'rgba(110,70,30,0.07)';
  for (let i = 0; i < 2600; i++) g.fillRect(Math.random() * N, y0 + Math.random() * (y1 - y0), 30 + Math.random() * 90, 1);

  g.lineWidth = 0.055 * S; g.lineJoin = 'round';
  const line = (a, b, cc, d) => { g.beginPath(); g.moveTo(X(a), Z(b)); g.lineTo(X(cc), Z(d)); g.stroke(); };
  const arc = (x, z, r, a, b) => { g.beginPath(); g.arc(X(x), Z(z), r * S, a, b); g.stroke(); };
  const a0 = Math.asin(COURT.corner / COURT.R3), cx = HOOP.x - COURT.R3 * Math.cos(a0);

  // lines on bare wood are navy …
  g.strokeStyle = NAVY;
  line(0, -7.5, 0, 7.5);
  line(14, -6.7, cx, -6.7); line(14, 6.7, cx, 6.7); arc(HOOP.x, 0, COURT.R3, Math.PI - a0, Math.PI + a0);
  arc(8.2, 0, 1.8, Math.PI / 2, Math.PI * 1.5);
  for (const zz of [-2.45, 2.45]) for (const xx of [9.4, 10.3, 11.2, 12.1]) line(xx, zz, xx, zz + Math.sign(zz) * 0.22);

  // … the key and centre circle are painted, with white lines on top
  g.fillStyle = NAVY; g.fillRect(X(8.2), Z(-2.45), X(14) - X(8.2), Z(2.45) - Z(-2.45));
  g.beginPath(); g.arc(X(0), Z(0), 1.8 * S, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#ffffff';
  g.strokeRect(X(-3) - 20, Z(-7.5), X(14) - X(-3) + 20, Z(7.5) - Z(-7.5)); // sidelines + baseline
  g.strokeRect(X(8.2), Z(-2.45), X(14) - X(8.2), Z(2.45) - Z(-2.45));
  arc(0, 0, 1.8, 0, Math.PI * 2); line(0, -1.8, 0, 1.8);
  g.setLineDash([14, 14]); arc(8.2, 0, 1.8, -Math.PI / 2, Math.PI / 2); g.setLineDash([]);
  arc(HOOP.x, 0, 1.25, Math.PI / 2, Math.PI * 1.5);

  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 ${1.5 * S}px ${FONT}`; g.fillText('</>', X(0), Z(0.08));
  g.fillStyle = 'rgba(255,255,255,0.94)'; g.font = `900 ${1.0 * S}px ${FONT}`;
  g.fillText(player.name.toUpperCase(), X(6), Z(-8.2));
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.font = `700 ${0.6 * S}px ${FONT}`;
  g.fillText('PORTFOLIO ARENA  ·  ' + player.role.toUpperCase(), X(6), Z(8.25));

  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function spotTexture(n, label, color) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = color; g.globalAlpha = 0.82; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.fill();
  g.globalAlpha = 1; g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 116, 0, 7); g.stroke();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 120px ${FONT}`; g.fillText(n, 128, 112);
  g.font = `700 30px ${FONT}`; g.fillText(label, 128, 190);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function ribbonTexture(words) { // a white sponsor board listing the tech stack
  const c = document.createElement('canvas'); c.width = 2048; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#f7f8fa'; g.fillRect(0, 0, 2048, 64);
  g.font = `800 40px ${FONT}`; g.textBaseline = 'middle';
  let x = 24, i = 0; const cols = [NAVY, '#5a6577', ORANGE];
  while (x < 1900) { const w = words[i % words.length]; g.fillStyle = cols[i % 3]; g.fillText(w, x, 34); x += g.measureText(w).width + 64; i++; }
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
  scene.background = new THREE.Color(HAZE);
  scene.fog = new THREE.Fog(HAZE, 34, 120); // distance haze: the far stands soften instead of shouting

  // ── lights: broad and soft, like a well-lit practice facility
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd9c7ad, LIGHT.hemi); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff5e6, LIGHT.key);
  key.position.set(2, 22, 10); key.target.position.set(6.5, 0, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 11, bottom: -11, near: 1, far: 48 });
  key.shadow.bias = -0.0004; key.shadow.radius = 5;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xdfeaff, LIGHT.fill); fill.position.set(12, 10, -14); scene.add(fill);

  // ── floor: a mirror underneath a slightly transparent hardwood layer gives the polished look
  const mirror = new Reflector(new THREE.PlaneGeometry(18, 18), { textureWidth: 1024, textureHeight: 1024, color: 0x707070, clipBias: 0.003 });
  mirror.rotation.x = -Math.PI / 2; mirror.position.set(6, -0.012, 0); scene.add(mirror);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18),
    new THREE.MeshStandardMaterial({ map: courtTexture(player), roughness: 0.42, metalness: 0.02, transparent: true, opacity: 0.88 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(6, 0, 0); floor.receiveShadow = true; scene.add(floor);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 120), new THREE.MeshBasicMaterial({ color: 0xcdd4dd }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(6, -0.03, 0); scene.add(ground);

  // ── hoop
  const hoop = new THREE.Group(); scene.add(hoop);
  const pad = new THREE.MeshStandardMaterial({ color: 0x233552, roughness: 0.6 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 1.0), pad); base.position.set(15.4, 0.6, 0); base.castShadow = true;
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.0, 0.3), pad); pole.position.set(15.2, 2.2, 0); pole.rotation.z = 0.28;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.2, 0.26), pad); arm.position.set(13.85, 3.55, 0);
  hoop.add(base, pole, arm);
  const board = new THREE.Group(); board.position.set(12.78, 3.5, 0); hoop.add(board);
  board.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.07, 1.83), new THREE.MeshStandardMaterial({ color: 0xe6f1fb, transparent: true, opacity: 0.34, roughness: 0.1 })));
  { const c = document.createElement('canvas'); c.width = 512; c.height = 300; const g = c.getContext('2d');
    g.strokeStyle = NAVY; g.lineWidth = 12; g.strokeRect(6, 6, 500, 288); g.strokeStyle = ORANGE; g.lineWidth = 9; g.strokeRect(173, 150, 166, 126);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const lines = new THREE.Mesh(new THREE.PlaneGeometry(1.83, 1.07), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide }));
    lines.rotation.y = -Math.PI / 2; lines.position.x = -0.025; board.add(lines); }
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xf2590d, roughness: 0.4, emissive: 0xff3a00, emissiveIntensity: 0.12 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 8, 28), rimMat);
  rim.rotation.x = Math.PI / 2; rim.position.set(HOOP.x, HOOP.y, HOOP.z); rim.castShadow = true; hoop.add(rim);
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.1), rimMat); brace.position.set(HOOP.x + 0.3, HOOP.y, 0); hoop.add(brace);
  const net = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.13, 0.42, 14, 5, true),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.95, fog: false }));
  net.position.set(HOOP.x, HOOP.y - 0.21, HOOP.z); hoop.add(net);

  // ── stands: sloped seating decks with a wall behind each
  const standMats = [];
  const slab = (p, color) => { // p: four corners
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(p.flat(), 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
    const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }); mat.userData.base = color; standMats.push(mat);
    scene.add(new THREE.Mesh(geo, mat));
  };
  const SEAT = 0xaab5c4, WALL = 0xd6dce5;
  slab([[-11, 0.15, -10], [27, 0.15, -10], [27, 9.2, -23.4], [-11, 9.2, -23.4]], SEAT); slab([[-11, 9.2, -23.4], [27, 9.2, -23.4], [27, 15, -23.4], [-11, 15, -23.4]], WALL);
  slab([[16.8, 0.15, -10.5], [16.8, 0.15, 10.5], [28.2, 7.85, 10.5], [28.2, 7.85, -10.5]], SEAT); slab([[28.2, 7.85, -23.4], [28.2, 7.85, 20.2], [28.2, 14, 20.2], [28.2, 14, -23.4]], WALL);
  slab([[-11, 0, 9.2], [27, 0, 9.2], [27, 5.98, 20.2], [-11, 5.98, 20.2]], SEAT); slab([[-11, 5.98, 20.2], [27, 5.98, 20.2], [27, 6.6, 20.2], [-11, 6.6, 20.2]], WALL);

  // ── people: stands, benches, scorer's table, baseline photographers
  const people = [], seats = [];
  const HOME = [0xffffff, 0xe8590c, 0x233552, 0xffffff];
  const MIX = [0xf1f3f5, 0xdee2e6, 0xadb5bd, 0x868e96, 0x495057, 0x74a9d8, 0xf3c9a0, 0xa9d9b8, 0xd9b8e0, 0x33415c];
  const SK = [0x8d5a3b, 0x5c3a24, 0xc68e63, 0xe0b08a, 0x3f2a1c];
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const person = (x, y, z, shirt, lum) => people.push({ x, y, z, shirt, lum });
  const fan = () => (Math.random() < 0.28 ? pick(HOME) : pick(MIX));
  for (let r = 0; r < 14; r++) for (let x = -10; x < 26; x += 0.62) {
    const p = [x + (r % 2) * 0.3, 1.0 + r * 0.62, -10.6 - r * 0.92]; seats.push(p); person(...p, fan(), 0.72 + Math.random() * 0.2);
  }
  for (let r = 0; r < 12; r++) for (let z = -9.5; z < 9.5; z += 0.62) {
    const p = [17.4 + r * 0.92, 1.0 + r * 0.62, z + (r % 2) * 0.3]; seats.push(p); person(...p, fan(), 0.82 + Math.random() * 0.18);
  }
  for (let r = 0; r < 12; r++) for (let x = -10; x < 26; x += 0.62) { // near side: kept shallow so the sideline camera sees over it
    const p = [x + (r % 2) * 0.3, 0.6 + r * 0.5, 9.7 + r * 0.9]; seats.push(p); person(...p, fan(), 0.8 + Math.random() * 0.2);
  }
  for (let x = 0.6; x < 4.5; x += 0.64) person(x, 0.62, -8.6, 0xffffff, 1);              // home bench
  for (let x = 8.3; x < 12.2; x += 0.64) person(x, 0.62, -8.6, 0x233552, 1);             // visitors bench
  for (let x = 5.1; x < 7.7; x += 0.64) person(x, 0.66, -8.8, 0x495057, 1);              // scorer's table crew
  for (let z = -7; z < 7.2; z += 0.85) if (Math.abs(z) > 1.8) person(14.95 + Math.random() * 0.3, 0.3, z, 0x495057, 0.95); // photographers

  // each spectator sways a little on their own, and they rise in a ripple when the crowd is excited
  const crowdU = { uTime: { value: 0 }, uHype: { value: 0 } };
  const alive = (mat) => {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = crowdU.uTime; sh.uniforms.uHype = crowdU.uHype;
      sh.vertexShader = 'uniform float uTime;\nuniform float uHype;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        `#include <begin_vertex>
         #ifdef USE_INSTANCING
           float ph = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 2.3 + instanceMatrix[3].y * 0.9;
           transformed.y += sin(uTime * 1.6 + ph) * 0.02 + uHype * max(0.0, sin(uTime * 7.0 + ph)) * 0.22;
           transformed.x += sin(uTime * 0.9 + ph * 1.3) * 0.015;
         #endif`);
    };
    return mat;
  };
  const bodies = new THREE.InstancedMesh(new THREE.SphereGeometry(0.25, 7, 5), alive(new THREE.MeshBasicMaterial()), people.length);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 7, 5), alive(new THREE.MeshBasicMaterial()), people.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), tr = new THREE.Vector3();
  people.forEach((p, i) => {
    const j = Math.random() * 0.08, k = 0.9 + Math.random() * 0.2;
    m4.compose(tr.set(p.x, p.y + j, p.z), q, sc.set(k, 1.15 * k, 0.85 * k)); bodies.setMatrixAt(i, m4);
    m4.compose(tr.set(p.x, p.y + j + 0.4 * k, p.z), q, sc.set(1, 1, 1)); heads.setMatrixAt(i, m4);
    bodies.setColorAt(i, col.setHex(p.shirt).multiplyScalar(p.lum));
    heads.setColorAt(i, col.setHex(pick(SK)));
  });
  for (const m of [bodies, heads]) { m.frustumCulled = false; m.layers.set(1); scene.add(m); } // layer 1: skipped by the floor mirror, which keeps it cheap

  const table = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.78, 0.45), new THREE.MeshBasicMaterial({ color: 0xf7f8fa }));
  table.position.set(6.35, 0.39, -8.3); scene.add(table);
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.06, 0.5), new THREE.MeshBasicMaterial({ color: 0xe8590c }));
  tableTop.position.set(6.35, 0.8, -8.3); scene.add(tableTop);

  // ── sponsor boards
  const words = [...new Set(projects.flatMap((p) => p.stack))].map((w) => w.toUpperCase() + '  ·');
  const ribbonTex = ribbonTexture(words.length ? words : ['PORTFOLIO  ·']);
  ribbonTex.repeat.set(1.4, 1);
  const ribMat = new THREE.MeshBasicMaterial({ map: ribbonTex });
  const rib1 = new THREE.Mesh(new THREE.BoxGeometry(38, 0.85, 0.2), ribMat); rib1.position.set(8, 0.42, -9.3); scene.add(rib1);
  const boardMat = new THREE.MeshBasicMaterial({ color: 0xf7f8fa });
  const rib2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.85, 19.4), boardMat); rib2.position.set(16.3, 0.42, 0); scene.add(rib2);
  const rib3 = new THREE.Mesh(new THREE.BoxGeometry(38, 0.5, 0.2), boardMat); rib3.position.set(8, 0.25, 9.15); scene.add(rib3);

  // ── camera flashes in the stands
  const glow = glowTexture();
  const flashes = Array.from({ length: 14 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    s.scale.setScalar(1.5); scene.add(s); return s;
  });
  let flashRate = 0.6;
  const fire = (s) => { const p = seats[(Math.random() * seats.length) | 0]; s.position.set(p[0], p[1] + 0.4, p[2] + 0.3); s.material.opacity = 1; };

  // ── project hotspots (shown in the game only)
  const spots = projects.map((p, i) => {
    const g = new THREE.Group(); g.position.set(p.spot[0], 0, p.spot[1]); scene.add(g);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.72, 40),
      new THREE.MeshBasicMaterial({ map: spotTexture(String(i + 1), p.playName, p.color), transparent: true, depthWrite: false, fog: false }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = 0.02;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.7, 28, 1, true),
      new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false, fog: false }));
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
    // thermal view: the building goes cold and dark so that only bodies read as warm
    setThermal(on) {
      hemi.intensity = on ? 0.16 : LIGHT.hemi; key.intensity = on ? 0.35 : LIGHT.key; fill.intensity = on ? 0.04 : LIGHT.fill;
      scene.background.setHex(on ? 0x0c0d13 : HAZE); scene.fog.color.setHex(on ? 0x0c0d13 : HAZE);
      floor.material.color.setHex(on ? 0x3a3a48 : 0xffffff); ground.material.color.setHex(on ? 0x101117 : 0xcdd4dd);
      bodies.material.color.setHex(on ? 0x343434 : 0xffffff); heads.material.color.setHex(on ? 0x5c5c5c : 0xffffff);
      for (const m of standMats) m.color.setHex(on ? 0x1c1d24 : m.userData.base);
      ribMat.color.setHex(on ? 0x2a2a2a : 0xffffff); boardMat.color.setHex(on ? 0x22232b : 0xf7f8fa); rimMat.emissiveIntensity = on ? 0 : 0.12;
      table.material.color.setHex(on ? 0x1a1a22 : 0xf7f8fa); tableTop.material.color.setHex(on ? 0x22222a : 0xe8590c);
    },
    setDone(spot) { spot.done = true; spot.beam.material.color.set(0x2f9e44); spot.beam.material.opacity = 0.05; },
    update(dt, time, activeSpot) {
      ribbonTex.offset.x += dt * 0.03;
      netT += dt; boardT += dt;
      const w = Math.sin(netT * 30) * Math.exp(-netT * 5);
      net.scale.set(1 - w * 0.28, 1 + w * 0.4, 1 - w * 0.28);
      const bw = Math.sin(boardT * 55) * Math.exp(-boardT * 6) * 0.05;
      board.rotation.z = bw; rim.rotation.y = bw * 2; rim.position.y = HOOP.y - Math.abs(bw) * 0.8;
      flashRate += (0.6 - flashRate) * Math.min(1, dt * 0.9);
      hype *= Math.exp(-dt * 0.9);
      crowdU.uTime.value = time; crowdU.uHype.value = hype;
      for (const s of flashes) {
        if (s.material.opacity > 0.01) s.material.opacity *= Math.exp(-dt * 14);
        else if (Math.random() < flashRate * dt / flashes.length * 4) fire(s);
      }
      for (const s of spots) {
        const on = s === activeSpot, pulse = 0.5 + 0.5 * Math.sin(time * 3 + s.x);
        s.disc.scale.setScalar(on ? 1.12 : 1 + pulse * 0.04);
        if (!s.done) s.beam.material.opacity = on ? 0.26 : 0.08 + pulse * 0.06;
      }
    },
  };
}
