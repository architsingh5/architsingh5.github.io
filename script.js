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
