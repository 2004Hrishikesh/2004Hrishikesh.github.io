// DOM overlay: scorebug, shot meter, callouts and the jumbotron modal.
import { PROJECTS, PLAYER } from './projects.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// links left as '#' in js/projects.js are simply not shown; the first link shown gets the gold style
const links = (pairs) => pairs.filter(([href]) => href && href !== '#')
  .map(([href, label], i) => `<a class="${i ? '' : 'solid'}" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`).join('');

function retrigger(el, cls) { el.classList.remove('show'); void el.offsetWidth; el.className = cls + ' show'; }

export const hud = {
  onClose: null, open: false, unlocked: new Set(),

  init() {
    $('cardName').textContent = `#${PLAYER.number} ${PLAYER.name}`;
    $('cardRole').textContent = PLAYER.role;
    $('tHome').textContent = PLAYER.team; $('tAway').textContent = PLAYER.rival;
    $('tag').textContent = PLAYER.tag || PLAYER.name;
    $('pips').innerHTML = PROJECTS.map(() => '<i></i>').join('');
    $('modal').addEventListener('click', (e) => {
      const t = e.target.closest('[data-act]');
      if (e.target.id === 'modal') return this.close();
      if (!t) return;
      if (t.dataset.act === 'close') this.close();
      if (t.dataset.act === 'list') this.showList();
      if (t.dataset.act === 'open') this.showProject(PROJECTS.find((p) => p.id === t.dataset.id), false);
    });
  },

  score(home, away, bump) { $('sHome').textContent = home; $('sAway').textContent = away; if (bump) { $('sHome').classList.remove('bump'); void $('sHome').offsetWidth; $('sHome').classList.add('bump'); } },
  clock(sec) { const s = Math.max(0, Math.ceil(sec)); $('clock').textContent = `${(s / 60) | 0}:${String(s % 60).padStart(2, '0')}`; },
  pips(set) { this.unlocked = set; [...$('pips').children].forEach((el, i) => el.classList.toggle('on', set.has(PROJECTS[i].id))); },
  prompt(html) { if ($('prompt').innerHTML !== html) $('prompt').innerHTML = html; },
  feedback(text, cls) { $('feedback').textContent = text; retrigger($('feedback'), cls); },
  callout(text) { $('callout').textContent = text; retrigger($('callout'), ''); },
  tag(x, y, show) { const t = $('tag'); t.style.display = show ? '' : 'none'; t.style.left = x + 'px'; t.style.top = y + 'px'; },
  meter(on, x, y, p, gs, ge, state) {
    const m = $('meter');
    m.className = (on ? 'on ' : '') + (state || '');
    if (!on) return;
    m.style.left = x + 'px'; m.style.top = y + 'px';
    m.children[0].style.bottom = gs * 100 + '%'; m.children[0].style.height = (ge - gs) * 100 + '%';
    m.children[1].style.height = Math.min(1, p) * 100 + '%';
  },

  _show(html, accent) {
    $('modalBody').innerHTML = html;
    const j = $('modal').querySelector('.jumbo');
    j.style.setProperty('--accent', accent || '#ffc531');
    if (!this.open) { $('modal').classList.remove('hidden'); j.style.animation = 'none'; void j.offsetWidth; j.style.animation = ''; }
    this.open = true; $('modal').scrollTop = 0;
  },
  showProject(p, fresh) {
    const done = this.unlocked.has(p.id);
    this._show(`
      <div class="jm-head">
        <div class="jm-kick">${fresh ? '🔓 PROJECT UNLOCKED · ' : done ? '✓ UNLOCKED · ' : '🔒 NOT SCORED YET · '}${esc(p.playName)}</div>
        <h2>${esc(p.title)}</h2><p>${esc(p.tagline)}</p>
      </div>
      <div class="jm-main">
        <div><h3>KEY FEATURES &amp; ARCHITECTURE</h3><ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>
        <div>
          <h3>BOX SCORE</h3><div class="stats">${p.metrics.map((m) => `<div><b>${esc(m.v)}</b><span>${esc(m.k)}</span></div>`).join('')}</div>
          <h3>TECH STACK</h3><div class="tags">${p.stack.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
        </div>
      </div>
      <div class="jm-foot">
        ${links([[p.demo, p.demoLabel || 'LIVE DEMO ↗'], [p.repo, 'GITHUB REPO ↗']])}
        <span class="sp"></span>
        <button data-act="list">ALL PROJECTS</button><button data-act="close">BACK TO GAME ⏎</button>
      </div>`, p.color);
  },
  showList(title = 'ALL PROJECTS', kick = 'THE BOX SCORE') {
    const L = PLAYER.links;
    this._show(`
      <div class="jm-head"><div class="jm-kick">${kick} · ${this.unlocked.size}/${PROJECTS.length} UNLOCKED</div><h2>${title}</h2>
        <p>${esc(PLAYER.name)} — ${esc(PLAYER.role)}. Click any project, or go score it on the court.</p></div>
      <div class="jm-list">${PROJECTS.map((p, i) => `
        <button data-act="open" data-id="${p.id}" style="--accent:${p.color}">
          <small>${this.unlocked.has(p.id) ? '✓' : '🔒'} PLAY ${i + 1} · ${esc(p.playName)}</small>
          <strong>${esc(p.title)}</strong><em>${p.stack.map(esc).join(' · ')}</em>
        </button>`).join('')}</div>
      <div class="jm-foot">
        ${links([[L.github, 'GITHUB ↗'], [L.linkedin, 'LINKEDIN ↗'], [L.resume, 'RÉSUMÉ ↗'], [L.email, 'EMAIL ↗']])}
        <span class="sp"></span><button data-act="close">BACK TO GAME ⏎</button>
      </div>`, '#ffc531');
  },
  close() {
    if (!this.open) return;
    this.open = false; $('modal').classList.add('hidden');
    if (this.onClose) this.onClose();
  },
};
