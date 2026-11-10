// "Model view": draws what a vision system would output for the scene — boxes, pose
// keypoints, track IDs, ball trajectory — plus a small readout panel per project.
// Everything here is computed from the 3D scene itself (ground truth), styled as
// model output. No model runs in the browser, and the panel says so.
import * as THREE from 'three';

const KP = ['head', 'shL', 'shR', 'elL', 'elR', 'handL', 'handR', 'hipL', 'hipR', 'knL', 'knR', 'footL', 'footR'];
const BONES = [[0, 1], [0, 2], [1, 2], [1, 3], [3, 5], [2, 4], [4, 6], [1, 7], [2, 8], [7, 8], [7, 9], [9, 11], [8, 10], [10, 12]];
const MONO = '600 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const $ = (id) => document.getElementById(id);

const TITLES = {
  detect: 'OBJECT DETECTION · POSE · TRACKING',
  anomaly: 'VIDEO ANOMALY DETECTION',
  thermal: 'THERMAL PERSON DETECTION',
  summary: 'TEXT SUMMARISATION',
  telemetry: 'DATA PIPELINE · LIVE TELEMETRY',
  cron: 'SCHEDULED PIPELINE',
};
// one-line "captions" in the spirit of a captioning model describing each moment
const CAPTIONS = {
  idle: 'a player dribbles a basketball near the free-throw line',
  run: 'a player drives hard toward the basket',
  gather: 'a player gathers the ball and rises',
  shot: 'a player releases a jump shot',
  flight: 'the ball is in the air, heading for the hoop',
  dunk: 'a player leaps and dunks over a defender',
  down: 'a defender falls to the floor under the rim',
  cheer: 'teammates raise their arms',
};
const SCRIPTS = {
  summary: {
    start: 'in  ▸ "He brings it up, crosses half court, squares his feet and looks at the rim from way, way downtown…"  (22 words)',
    release: 'in  ▸ "…and he lets it fly from the logo, the whole building rises with it…"  (+14 words)',
    score: 'out ▸ "Half-court shot. Good."  (4 words · 89% shorter)',
  },
  cron: {
    start: '06:00:00  schedule fired · GitHub Actions',
    shoot: '06:00:04  fetched today\'s dining menu',
    release: '06:00:11  LLM built the plan · protein target met',
    score: '06:00:12  HTML email sent ✓  — no server involved',
  },
  telemetry: { score: 'clean ▸ 1 outlier capped (hang time) · 0 missing values' },
};

export function makeVision(stage, camera) {
  const cv = $('vision'), g = cv.getContext('2d'), chart = $('vpChart'), cg = chart.getContext('2d');
  const v = new THREE.Vector3();
  let W = 0, H = 0, alpha = 0, score = 0.05, fps = 60, sweep = 0, mode = 'detect', lines = [];
  const hist = new Array(160).fill(0.05), trail = [];
  const tele = { top: 0, dist: 0, air: 0 };
  let enabled = true;
  try { enabled = localStorage.getItem('arena.modelview') !== 'off'; } catch { /* ignore */ }

  function fit() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth; H = stage.clientHeight;
    if (cv.width !== Math.round(W * d) || cv.height !== Math.round(H * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); }
    g.setTransform(d, 0, 0, d, 0, 0);
  }
  const proj = (p) => { v.copy(p).project(camera); return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H, v.z]; };

  function tagLabel(x, y, text, color) {
    g.font = MONO; const w = g.measureText(text).width + 8;
    g.fillStyle = color; g.fillRect(x, y - 14, w, 14);
    g.fillStyle = '#05040b'; g.fillText(text, x + 4, y - 3.5);
  }

  function drawActor(a, time, thermal) {
    const pts = [];
    for (const k of KP) { const p = proj(a.b.J[k].getWorldPosition(v)); if (p[2] > 1) return false; pts.push(p); }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    const h = y1 - y0, pad = h * 0.07; x0 -= pad * 1.6; x1 += pad * 1.6; y0 -= h * 0.11; y1 += pad;
    if (x1 < 0 || x0 > W || y1 < 0 || y0 > H || h < 14) return false;
    const fallen = a.b.down > 0.6;
    const col = thermal ? '#eafff4' : fallen ? '#ff5d6c' : a.hero ? '#ffc531' : '#4df3ff';

    if (!thermal) { // pose skeleton
      g.strokeStyle = col; g.globalAlpha = alpha * 0.75; g.lineWidth = 1.4; g.beginPath();
      for (const [i, j] of BONES) { g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[j][0], pts[j][1]); }
      g.stroke();
      g.fillStyle = '#fff'; g.globalAlpha = alpha * 0.9;
      for (const p of pts) g.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3);
    }
    // corner-bracket box
    const c = Math.min(12, (x1 - x0) * 0.3);
    g.globalAlpha = alpha; g.strokeStyle = col; g.lineWidth = a.hero ? 2 : 1.5; g.beginPath();
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { g.moveTo(x + sx * c, y); g.lineTo(x, y); g.lineTo(x, y + sy * c); }
    g.stroke();
    if (h > (W < 700 ? 52 : 34) || a.hero) {
      const conf = (0.93 + 0.05 * Math.sin(a.seed * 7.3 + time * 0.9) - (fallen ? 0.2 : 0)).toFixed(2);
      tagLabel(x0, y0 - 2, W < 700 ? `#${a.id} ${conf}` : `${fallen ? 'person·down' : 'person'} ${conf}  #${a.id}`, col); // short labels on a small stage
    }
    return true;
  }

  function drawBall(ball, traj, time) {
    trail.push(ball.position.clone()); if (trail.length > 26) trail.shift();
    g.lineWidth = 2; g.strokeStyle = '#ff9a3d';
    for (let i = 1; i < trail.length; i++) {
      const a = proj(trail[i - 1]), b = proj(trail[i]);
      g.globalAlpha = alpha * (i / trail.length) * 0.8; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    }
    const p = proj(ball.position), r = Math.max(7, 900 / Math.max(6, camera.position.distanceTo(ball.position)) * 0.12);
    g.globalAlpha = alpha; g.beginPath(); g.arc(p[0], p[1], r + 3, 0, 7); g.stroke();
    if (traj && traj.length > 1) { // predicted flight path
      g.setLineDash([5, 5]); g.strokeStyle = '#ffc531'; g.lineWidth = 1.6; g.beginPath();
      traj.forEach((t, i) => { const q = proj(t); if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); });
      g.stroke(); g.setLineDash([]);
      const e = proj(traj[traj.length - 1]);
      g.beginPath(); g.arc(e[0], e[1], 9 + 3 * Math.sin(time * 10), 0, 7); g.stroke();
      tagLabel(e[0] + 12, e[1], 'trajectory · P(make) 0.96', '#ffc531');
    } else tagLabel(p[0] + r + 5, p[1] - r, 'ball 0.99', '#ff9a3d');
  }

  function drawChart() {
    const w = chart.width, h = chart.height; cg.clearRect(0, 0, w, h);
    cg.strokeStyle = 'rgba(255,255,255,.25)'; cg.setLineDash([4, 4]); cg.lineWidth = 1;
    cg.beginPath(); cg.moveTo(0, h * 0.5); cg.lineTo(w, h * 0.5); cg.stroke(); cg.setLineDash([]);
    cg.lineWidth = 2; cg.strokeStyle = score > 0.5 ? '#ff5d6c' : '#4df3ff'; cg.beginPath();
    hist.forEach((s, i) => { const x = i / (hist.length - 1) * w, y = h - 3 - s * (h - 6); if (i) cg.lineTo(x, y); else cg.moveTo(x, y); });
    cg.stroke();
    cg.lineTo(w, h); cg.lineTo(0, h); cg.closePath(); cg.fillStyle = score > 0.5 ? 'rgba(255,93,108,.16)' : 'rgba(77,243,255,.1)'; cg.fill();
  }

  return {
    get enabled() { return enabled; },
    toggle() { enabled = !enabled; try { localStorage.setItem('arena.modelview', enabled ? 'on' : 'off'); } catch { /* ignore */ } return enabled; },
    setMode(m) { mode = m || 'detect'; lines = []; tele.top = tele.dist = tele.air = 0; this.event('start'); },
    event(name) { const s = SCRIPTS[mode] && SCRIPTS[mode][name]; if (s) { lines.push(s); if (lines.length > 4) lines.shift(); } },

    // s: { show, time, actors, ball, traj, phase, anyDown, speed, air, heroY }
    draw(dt, s) {
      fit();
      fps += (1 / Math.max(dt, 0.001) - fps) * 0.05;
      alpha += ((s.show && enabled ? (s.busy ? 1 : 0.6) : 0) - alpha) * Math.min(1, dt * 6);
      g.clearRect(0, 0, W, H);
      const thermal = mode === 'thermal';
      let seen = 0;
      if (alpha > 0.02) {
        for (const a of s.actors) if (drawActor(a, s.time, thermal)) seen++;
        drawBall(s.ball, s.traj, s.time);
        sweep = (sweep + dt * 0.22) % 1.25; // slow scan line, so it reads as a live feed
        g.globalAlpha = alpha * 0.16; g.fillStyle = '#4df3ff'; g.fillRect(0, sweep * H, W, 2);
        g.globalAlpha = 1;
      }

      // simulated anomaly score: calm while dribbling, spikes on the dunk
      const target = s.anyDown ? 0.97 : s.phase === 'dunk' ? 0.92 : s.phase === 'flight' ? 0.58 : s.phase === 'run' ? 0.3 : s.phase === 'gather' || s.phase === 'shot' ? 0.36 : 0.06;
      score += (target + (Math.random() - 0.5) * 0.05 - score) * Math.min(1, dt * 7); score = Math.min(0.99, Math.max(0.01, score));
      hist.push(score); hist.shift();
      tele.top = Math.max(tele.top, s.speed); tele.dist += s.speed * dt; tele.air = Math.max(tele.air, s.heroY);

      // readout panel
      $('vpTitle').textContent = TITLES[mode];
      $('vpFps').textContent = Math.round(fps) + ' fps';
      chart.style.display = mode === 'anomaly' ? '' : 'none';
      const big = $('vpBig'), txt = $('vpText');
      if (mode === 'anomaly') {
        drawChart();
        big.innerHTML = `${score.toFixed(2)} <small class="${score > 0.5 ? 'bad' : ''}">${score > 0.5 ? 'ANOMALY' : 'normal'}</small>`;
        txt.textContent = `caption ▸ "${CAPTIONS[s.anyDown ? 'down' : s.phase] || CAPTIONS.idle}"`;
      } else if (mode === 'thermal') {
        big.innerHTML = `${seen} <small>people in frame</small>`;
        txt.textContent = 'CLAHE contrast · label-safe augmentation · YOLO-style boxes';
      } else if (mode === 'telemetry') {
        big.innerHTML = `${(s.speed * 3.6).toFixed(1)} <small>km/h</small>`;
        txt.textContent = `top ${(tele.top * 3.6).toFixed(1)} km/h · dist ${tele.dist.toFixed(1)} m · apex ${tele.air.toFixed(2)} m` + (lines.length ? '\n' + lines.join('\n') : '');
      } else if (mode === 'summary' || mode === 'cron') {
        big.textContent = ''; txt.textContent = lines.join('\n');
      } else {
        big.innerHTML = `${seen} <small>people</small> · 1 <small>ball</small>`;
        txt.textContent = `13 keypoints each · ${seen} tracks live`;
      }
    },
  };
}
