(() => {
  const root = document.documentElement;
  const mqDark = window.matchMedia('(prefers-color-scheme: dark)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Theme toggle ---------- */
  const currentTheme = () => root.dataset.theme || (mqDark.matches ? 'dark' : 'light');
  document.querySelector('.theme-toggle').addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    readColors();
  });
  mqDark.addEventListener('change', readColors);

  /* ---------- Nav: border on scroll + active section ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const links = [...document.querySelectorAll('.nav-links a')];
  const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(a => a.classList.remove('active'));
        const a = byId.get(e.target.id);
        if (a) a.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => io.observe(s));

  /* ---------- LeetCode: refresh snapshot from data/leetcode.json ---------- */
  const fmt = n => Number(n).toLocaleString('en-US');
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  fetch('data/leetcode.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(d => {
      const set = (k, v) => document.querySelectorAll(`[data-lc="${k}"]`).forEach(el => { el.textContent = v; });
      set('solved', fmt(d.solved));
      set('acceptanceLine', d.acceptance != null ? `${d.acceptance}% acceptance` : '');
      set('ranking', fmt(d.ranking));
      set('badges', fmt(d.badges));
      const total = d.difficulty.reduce((a, x) => a + x.solved, 0) || 1;
      const parts = [];
      d.difficulty.forEach(x => {
        const pct = Math.round((x.solved / total) * 100);
        set(`${x.name}.solved`, fmt(x.solved));
        set(`${x.name}.total`, fmt(x.total));
        const seg = document.querySelector(`[data-lc-seg="${x.name}"]`);
        if (seg) {
          seg.style.flexGrow = x.solved;
          seg.style.display = x.solved ? '' : 'none';
          seg.dataset.tip = `${x.name} · ${fmt(x.solved)} solved · ${pct}%`;
          const lbl = seg.querySelector('.seg-lbl');
          if (lbl) lbl.textContent = pct >= 7 ? `${pct}%` : '';
        }
        parts.push(`${x.name} ${fmt(x.solved)} (${pct}%)`);
      });
      const aria = document.querySelector('[data-lc-aria]');
      if (aria) aria.setAttribute('aria-label', `Solved by difficulty: ${parts.join(', ')}`);

      const langs = document.querySelector('[data-lc-list="languages"]');
      if (langs && d.languages && d.languages.length) {
        const max = Math.max(...d.languages.map(l => l.solved)) || 1;
        langs.innerHTML = d.languages.slice(0, 4).map(l =>
          `<li><span class="lang-name">${esc(l.name)}</span><span class="lang-bar"><i style="width:${(l.solved / max * 100).toFixed(1)}%"></i></span><span class="mono lang-n">${fmt(l.solved)}</span></li>`
        ).join('');
      }
      const topics = document.querySelector('[data-lc-list="topics"]');
      if (topics && d.topics && d.topics.length) {
        topics.innerHTML = d.topics.slice(0, 9).map(t => `<li>${esc(t.name)} <b>${fmt(t.solved)}</b></li>`).join('');
      }
      const up = document.querySelector('[data-lc="updated"]');
      if (up && d.updated) {
        up.setAttribute('datetime', d.updated);
        up.textContent = new Date(d.updated + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    })
    .catch(() => { /* keep the baked-in snapshot */ });

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Hero: event-stream canvas ----------
     Messages flow left → right through partitions, like trades through a pipeline.
     Three highlighted lanes = orders, executions, clearing. */
  const canvas = document.querySelector('.stream');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, lanes = [], msgs = [], colors = {}, raf = 0, last = 0;

  function readColors() {
    const cs = getComputedStyle(root);
    colors = {
      accent: cs.getPropertyValue('--accent').trim(),
      lane: cs.getPropertyValue('--lane').trim(),
      muted: cs.getPropertyValue('--muted').trim(),
    };
    if (reduceMotion.matches) draw(0);
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const n = W < 720 ? 7 : 11;
    const top = H * 0.12, bottom = H * 0.92;
    const hot = new Set([Math.floor(n * 0.3), Math.floor(n * 0.5), Math.floor(n * 0.7)]);
    lanes = Array.from({ length: n }, (_, i) => ({
      y: top + (bottom - top) * (i / (n - 1)),
      speed: 40 + Math.random() * 60,
      hot: hot.has(i),
    }));
    msgs = [];
    lanes.forEach((lane, li) => {
      const count = Math.max(2, Math.round(W / 260));
      for (let k = 0; k < count; k++) msgs.push(spawn(li, Math.random() * W));
    });
    if (reduceMotion.matches) draw(0);
  }

  function spawn(li, x) {
    const lane = lanes[li];
    return {
      li, x: x ?? -40 - Math.random() * 200,
      w: 10 + Math.random() * 26,
      v: lane.speed * (0.8 + Math.random() * 0.5),
      a: lane.hot ? 0.55 + Math.random() * 0.45 : 0.12 + Math.random() * 0.2,
    };
  }

  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    // lanes
    ctx.lineWidth = 1;
    lanes.forEach(l => {
      ctx.strokeStyle = colors.lane;
      ctx.beginPath(); ctx.moveTo(0, l.y + 0.5); ctx.lineTo(W, l.y + 0.5); ctx.stroke();
    });
    // messages
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i], l = lanes[m.li];
      m.x += m.v * dt;
      if (m.x > W + 40) { msgs[i] = spawn(m.li); continue; }
      ctx.globalAlpha = m.a;
      ctx.fillStyle = l.hot ? colors.accent : colors.muted;
      roundRect(m.x, l.y - 2.5, m.w, 5, 2.5);
      if (l.hot) { // short trailing tail
        ctx.globalAlpha = m.a * 0.25;
        ctx.fillRect(m.x - m.w * 1.6, l.y - 0.5, m.w * 1.6, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.fill();
  }

  function loop(t) {
    const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    draw(dt);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    cancelAnimationFrame(raf); last = 0;
    if (reduceMotion.matches) draw(0); else raf = requestAnimationFrame(loop);
  }

  // Pause when hero is off-screen or tab hidden
  const heroIO = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !document.hidden) start(); else cancelAnimationFrame(raf);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf); else start();
  });
  reduceMotion.addEventListener('change', start);

  readColors();
  resize();
  window.addEventListener('resize', () => { resize(); });
  heroIO.observe(canvas);
})();
