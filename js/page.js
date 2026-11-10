// The recruiter-facing page: plain scrolling content laid over the live arena.
import { PROJECTS, PLAYER, PROFILE } from './projects.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const has = (href) => href && href !== '#';
const ext = (href, label, cls = '') => (has(href) ? `<a class="btn ${cls}" href="${esc(href)}" target="_blank" rel="noopener">${label}</a>` : '');
const HL_NAME = { windmill: 'Windmill dunk', spin360: '360 dunk', reverse: 'Reverse dunk', halfcourt: 'Half-court shot', stepback: 'Step-back three', fade: 'Fadeaway' };
const SECTIONS = [['about', '1ST', 'About'], ['projects', '2ND', 'Projects'], ['experience', '3RD', 'Experience'], ['contact', '4TH', 'Contact']];

export const page = {
  // cb: { onHighlight(project), onSection(id), onGame() }
  init(cb) {
    const L = PLAYER.links, P = PROFILE;
    $('brandNo').textContent = '#' + PLAYER.number;
    $('brandName').textContent = PLAYER.name;
    $('navLinks').innerHTML = SECTIONS.map(([id, q, label]) => `<a href="#${id}" data-s="${id}"><i>${q}</i>${label}</a>`).join('');

    const kicker = (i) => `<div class="kicker"><b>${SECTIONS[i][1]} QUARTER</b><span>${SECTIONS[i][2]}</span></div>`;
    $('page').innerHTML = `
      <section id="about">
        ${kicker(0)}
        <h1>${esc(PLAYER.name)}</h1>
        <p class="lead">${esc(P.headline)}</p>
        <p>${esc(P.bio)}</p>
        <div class="row">
          <a class="btn solid" href="#projects">View projects</a>
          ${ext(L.github, 'GitHub ↗')}${ext(L.linkedin, 'LinkedIn ↗')}${ext(L.resume, 'Résumé ↗')}
          ${has(L.email) ? `<a class="btn" href="${esc(L.email)}">Email</a>` : ''}
        </div>
        <dl class="facts">${P.facts.map((f) => `<div><dt>${esc(f.k)}</dt><dd>${esc(f.v)}</dd></div>`).join('')}</dl>
      </section>

      <section id="projects">
        ${kicker(1)}
        <h2>Projects</h2>
        <p class="hint"><span class="mouse">Hover</span><span class="touch">Tap ▶ on</span> a project and the player runs a play for it on the court.</p>
        ${PROJECTS.map((p, i) => `
        <article class="card" data-id="${p.id}" style="--accent:${p.color}" tabindex="0">
          <header>
            <span class="no">${String(i + 1).padStart(2, '0')}</span>
            <div><h3>${esc(p.title)}</h3><small>${esc(p.when || '')}</small></div>
            <button class="playbtn" data-play="${p.id}" title="Run this play on the court">▶ ${HL_NAME[p.highlight] || 'Play'}</button>
          </header>
          <p>${esc(p.tagline)}</p>
          <div class="stats">${p.metrics.map((m) => `<div><b>${esc(m.v)}</b><span>${esc(m.k)}</span></div>`).join('')}</div>
          <div class="tags">${p.stack.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
          <details><summary>How it works</summary><ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></details>
          <div class="row">${ext(p.demo, esc(p.demoLabel || 'Live demo ↗'), 'solid')}${ext(p.repo, 'GitHub repo ↗')}</div>
        </article>`).join('')}
      </section>

      <section id="experience">
        ${kicker(2)}
        <h2>Experience</h2>
        ${P.experience.map((e) => `
        <article class="entry">
          <h3>${esc(e.role)}</h3><div class="meta">${esc(e.org)} · ${esc(e.where)} · ${esc(e.when)}</div>
          <ul>${e.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        </article>`).join('')}
        <h2>Publication</h2>
        <article class="entry">
          <h3>${esc(P.publication.title)}</h3>
          <div class="meta">${esc(P.publication.authors)}</div><p>${esc(P.publication.venue)}</p>
          <div class="row">${ext(P.publication.url, 'Read on IEEE Xplore ↗')}</div>
        </article>
        <h2>Education</h2>
        ${P.education.map((e) => `
        <article class="entry"><h3>${esc(e.school)}</h3><div class="meta">${esc(e.degree)} · ${esc(e.when)}</div><p>${esc(e.note)}</p></article>`).join('')}
        <h2>Skills</h2>
        <div class="skills">${P.skills.map((s) => `<div><h4>${esc(s.k)}</h4><div class="tags">${s.v.map((x) => `<span>${esc(x)}</span>`).join('')}</div></div>`).join('')}</div>
      </section>

      <section id="contact">
        ${kicker(3)}
        <h2 class="big">Let's talk.</h2>
        <p class="lead">I'm happy to walk through any of these projects in detail.</p>
        <div class="row">
          ${has(L.email) ? `<a class="btn solid" href="${esc(L.email)}">${esc(L.email.replace('mailto:', ''))}</a>` : ''}
          ${ext(L.linkedin, 'LinkedIn ↗')}${ext(L.github, 'GitHub ↗')}${ext(L.resume, 'Résumé ↗')}
        </div>
        <p class="foot">The court behind this page is drawn live in the browser with Three.js — no images, models or video.
          <button class="linkbtn" data-game>Want to take the shots yourself? Play the game ▶</button></p>
      </section>`;

    // project cards: hover / focus / tap runs the play
    let timer = 0;
    const run = (id) => cb.onHighlight(PROJECTS.find((p) => p.id === id));
    for (const card of document.querySelectorAll('.card')) {
      const id = card.dataset.id;
      card.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; clearTimeout(timer); timer = setTimeout(() => run(id), 140); });
      card.addEventListener('pointerleave', () => clearTimeout(timer));
      card.addEventListener('focus', () => run(id));
    }
    $('page').addEventListener('click', (e) => {
      const b = e.target.closest('[data-play]'); if (b) run(b.dataset.play);
      if (e.target.closest('[data-game]')) cb.onGame();
    });
    $('btnPlay').addEventListener('click', () => cb.onGame());
    const vb = $('btnVision'); vb.textContent = 'Model view: ' + (cb.visionOn() ? 'on' : 'off');
    vb.addEventListener('click', () => { vb.textContent = 'Model view: ' + (cb.onVision() ? 'on' : 'off'); });

    // entrance animations: fade sections in and count the numbers up
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const countUp = (el) => {
      const m = el.textContent.match(/^([^\d]*)([\d,]*\.?\d+)(.*)$/); if (!m || calm) return;
      const end = parseFloat(m[2].replace(/,/g, '')), dec = (m[2].split('.')[1] || '').length, commas = m[2].includes(','), t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 900), e = 1 - Math.pow(1 - k, 3), val = (end * e).toFixed(dec);
        el.textContent = m[1] + (commas ? Number(val).toLocaleString('en-US') : val) + m[3];
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const reveal = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) {
        en.target.classList.add('in'); reveal.unobserve(en.target);
        en.target.querySelectorAll('.stats b').forEach(countUp);
      }
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('#page .card, #page .entry, #page section > h2, #page .skills > div, #page .kicker').forEach((el, i) => {
      el.classList.add('reveal'); el.style.transitionDelay = (i % 3) * 60 + 'ms'; reveal.observe(el);
    });
    const bar = $('progress');
    const onScroll = () => { const max = document.documentElement.scrollHeight - window.innerHeight; bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`; };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    // which "quarter" is on screen
    const links = [...$('navLinks').children];
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) {
        links.forEach((a) => a.classList.toggle('on', a.dataset.s === en.target.id));
        cb.onSection(en.target.id);
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('#page > section').forEach((s) => io.observe(s));
  },

  caption(text) { const c = $('caption'); c.textContent = text ? '▶ ' + text : ''; c.classList.toggle('on', !!text); },
  playing(id) { document.querySelectorAll('.card').forEach((c) => c.classList.toggle('playing', c.dataset.id === id)); },
};
