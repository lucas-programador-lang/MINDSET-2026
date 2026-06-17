/* ============================================================
   MINDSET 2026 — JavaScript: 3D Canvas, Particles, Scroll FX
   ============================================================ */

"use strict";

/* ── Sticky header ── */
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ── Mobile menu ── */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

/* ═══════════════════════════════════════════
   3D CANVAS BACKGROUND — Starfield + Grid
═══════════════════════════════════════════ */
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');

  let W, H, stars = [], gridLines = [], mouse = { x: 0, y: 0 };
  let animId;

  const STAR_COUNT  = 180;
  const GRID_COLS   = 14;
  const GRID_ROWS   = 10;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildStars();
    buildGrid();
  }

  function buildStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x:    Math.random() * W,
        y:    Math.random() * H,
        z:    Math.random() * 1.6 + 0.2,
        size: Math.random() * 1.2 + 0.2,
        speed:Math.random() * 0.08 + 0.01,
        opacity: Math.random() * 0.6 + 0.1,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.005
      });
    }
  }

  function buildGrid() {
    gridLines = [];
    const colW = W / GRID_COLS;
    const rowH = H / GRID_ROWS;
    for (let c = 0; c <= GRID_COLS; c++) {
      gridLines.push({ x1: c * colW, y1: 0, x2: c * colW, y2: H, axis: 'v' });
    }
    for (let r = 0; r <= GRID_ROWS; r++) {
      gridLines.push({ x1: 0, y1: r * rowH, x2: W, y2: r * rowH, axis: 'h' });
    }
  }

  // Parallax mouse
  window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / W - 0.5) * 2;
    mouse.y = (e.clientY / H - 0.5) * 2;
  }, { passive: true });

  let tick = 0;

  function drawGrid() {
    // Perspective vanishing point near mouse
    const vx = W * 0.5 + mouse.x * 40;
    const vy = H * 0.5 + mouse.y * 20;

    ctx.save();
    gridLines.forEach((l, i) => {
      const dist = l.axis === 'v'
        ? Math.abs(l.x1 - vx) / W
        : Math.abs(l.y1 - vy) / H;
      const alpha = 0.025 * (1 - dist * 0.6);
      ctx.strokeStyle = `rgba(56,217,245,${alpha})`;
      ctx.lineWidth   = 0.5;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawStars() {
    stars.forEach(s => {
      s.twinkle += s.twinkleSpeed;
      const twinkledOpacity = s.opacity * (0.6 + 0.4 * Math.sin(s.twinkle));

      // Slight parallax with mouse
      const px = s.x + mouse.x * s.z * 6;
      const py = s.y + mouse.y * s.z * 4;

      // Drift upward
      s.y -= s.speed;
      if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W; }

      ctx.beginPath();
      ctx.arc(px, py, s.size * s.z, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,230,255,${twinkledOpacity})`;
      ctx.fill();
    });
  }

  // Nebula blobs (static, drawn once via off-screen canvas, composited)
  function drawNebula() {
    const t = tick * 0.0015;
    const cx1 = W * 0.25 + Math.sin(t * 0.7) * W * 0.04;
    const cy1 = H * 0.35 + Math.cos(t * 0.5) * H * 0.03;
    const r1  = Math.min(W, H) * 0.3;

    const g1 = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, r1);
    g1.addColorStop(0, 'rgba(139,92,246,0.06)');
    g1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    const cx2 = W * 0.75 + Math.cos(t * 0.6) * W * 0.04;
    const cy2 = H * 0.65 + Math.sin(t * 0.4) * H * 0.03;
    const r2  = Math.min(W, H) * 0.28;

    const g2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r2);
    g2.addColorStop(0, 'rgba(56,217,245,0.05)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    const cx3 = W * 0.5 + Math.sin(t * 0.3 + 1) * W * 0.06;
    const cy3 = H * 0.2 + Math.cos(t * 0.55) * H * 0.04;
    const r3  = Math.min(W, H) * 0.22;

    const g3 = ctx.createRadialGradient(cx3, cy3, 0, cx3, cy3, r3);
    g3.addColorStop(0, 'rgba(245,200,66,0.04)');
    g3.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, W, H);
  }

  // Shooting star
  let shootingStar = null;
  let nextShoot    = 3000;

  function spawnShootingStar() {
    const startX = Math.random() * W * 0.7;
    const startY = Math.random() * H * 0.3;
    shootingStar = {
      x: startX, y: startY,
      vx: 6 + Math.random() * 4,
      vy: 3 + Math.random() * 2,
      len: 80 + Math.random() * 60,
      alpha: 1,
      life: 1
    };
    nextShoot = Date.now() + 4000 + Math.random() * 6000;
  }

  function drawShootingStar() {
    if (!shootingStar) return;
    const s = shootingStar;
    s.x += s.vx;
    s.y += s.vy;
    s.life -= 0.025;
    if (s.life <= 0 || s.x > W + 100 || s.y > H + 100) { shootingStar = null; return; }
    ctx.save();
    const grad = ctx.createLinearGradient(s.x - s.vx * s.len / s.vx, s.y - s.vy * s.len / s.vy, s.x, s.y);
    grad.addColorStop(0, `rgba(255,255,255,0)`);
    grad.addColorStop(1, `rgba(255,255,255,${s.life * 0.8})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(s.x - s.vx * (s.len / 6), s.y - s.vy * (s.len / 6));
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
    ctx.restore();
  }

  function loop() {
    tick++;
    ctx.clearRect(0, 0, W, H);

    // Deep background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#04060e');
    bg.addColorStop(0.5, '#060816');
    bg.addColorStop(1, '#04060e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawNebula();
    drawGrid();
    drawStars();

    if (Date.now() > nextShoot) spawnShootingStar();
    drawShootingStar();

    animId = requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  loop();
})();

/* ═══════════════════════════════════════════
   FLOATING PARTICLES (DOM)
═══════════════════════════════════════════ */
(function initParticles() {
  const container = document.getElementById('particles-container');
  const COUNT     = 30;
  const COLORS    = ['#38d9f5', '#f5c842', '#8b5cf6', '#22d3a0'];

  for (let i = 0; i < COUNT; i++) {
    const p     = document.createElement('span');
    p.className = 'particle';
    const size  = 1.5 + Math.random() * 2;
    const col   = COLORS[Math.floor(Math.random() * COLORS.length)];
    const dur   = 8 + Math.random() * 16;
    const delay = Math.random() * 20;
    const left  = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 120;

    p.style.cssText = `
      width:${size}px; height:${size}px;
      background:${col};
      left:${left}%;
      top:${100 + Math.random() * 10}%;
      animation-duration:${dur}s;
      animation-delay:-${delay}s;
      box-shadow:0 0 ${size * 3}px ${col};
    `;

    p.style.setProperty('--drift', `${drift}px`);

    container.appendChild(p);
  }

  // Add keyframe via style tag
  const style = document.createElement('style');
  style.textContent = `
    @keyframes particle-fall {
      0%   { transform: translateY(0) translateX(0); opacity:0; }
      10%  { opacity: 0.7; }
      90%  { opacity: 0.4; }
      100% { transform: translateY(-110vh) translateX(var(--drift)); opacity:0; }
    }
  `;
  document.head.appendChild(style);
})();

/* ═══════════════════════════════════════════
   REVEAL ON SCROLL (IntersectionObserver)
═══════════════════════════════════════════ */
(function initReveal() {
  const items = document.querySelectorAll('.reveal-up');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el    = entry.target;
        const delay = parseInt(el.dataset.delay || 0, 10);
        setTimeout(() => {
          el.classList.add('visible');
          // Trigger chance-bar fill
          el.querySelectorAll('.chance-fill').forEach(fill => {
            fill.parentElement.parentElement.classList.add('visible');
          });
        }, delay);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach(el => observer.observe(el));
})();

/* ── Plan cards: also trigger chance bars via card visibility ── */
(function initChanceBars() {
  const cards = document.querySelectorAll('.plan-card');
  const obs   = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  cards.forEach(c => obs.observe(c));
})();

/* ═══════════════════════════════════════════
   COUNTER ANIMATION
═══════════════════════════════════════════ */
(function initCounters() {
  const nums = document.querySelectorAll('.stat-number[data-target]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el      = entry.target;
      const target  = parseInt(el.dataset.target, 10);
      const prefix  = el.dataset.prefix || '';
      const suffix  = el.dataset.suffix || '';
      const dur     = 1600;
      const start   = performance.now();

      function step(now) {
        const elapsed = now - start;
        const prog    = Math.min(elapsed / dur, 1);
        const eased   = 1 - Math.pow(1 - prog, 3); // ease-out cubic
        const val     = Math.round(eased * target);
        el.textContent = prefix + val.toLocaleString('pt-BR') + suffix;
        if (prog < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  nums.forEach(n => observer.observe(n));
})();

/* ═══════════════════════════════════════════
   3D TILT on Plan Cards (mouse tracking)
═══════════════════════════════════════════ */
(function initTilt() {
  const cards = document.querySelectorAll('.plan-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx   = rect.left + rect.width / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / (rect.width  / 2);
      const dy   = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `translateY(-8px) rotateX(${-dy * 5}deg) rotateY(${dx * 5}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform .1s ease, border-color .4s, box-shadow .4s';
    });
  });
})();

/* ═══════════════════════════════════════════
   SMOOTH SCROLL for anchor links
═══════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ═══════════════════════════════════════════
   HERO PARALLAX on scroll
═══════════════════════════════════════════ */
const heroInner = document.querySelector('.hero-inner');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (heroInner && y < window.innerHeight) {
    heroInner.style.transform = `translateY(${y * 0.15}px)`;
    heroInner.style.opacity   = 1 - y / (window.innerHeight * 0.75);
  }
}, { passive: true });

/* ═══════════════════════════════════════════
   GLITCH TEXT EFFECT on logo icon
═══════════════════════════════════════════ */
(function glitchLogo() {
  const icons = document.querySelectorAll('.logo-icon');
  const chars = ['◈','◆','◇','◉','●','◎'];
  icons.forEach(icon => {
    const orig = icon.textContent;
    setInterval(() => {
      if (Math.random() > 0.97) {
        icon.textContent = chars[Math.floor(Math.random() * chars.length)];
        setTimeout(() => { icon.textContent = orig; }, 80);
      }
    }, 500);
  });
})();

/* ═══════════════════════════════════════════
   FLOATING CARDS animation offset
═══════════════════════════════════════════ */
(function animateFloatingCards() {
  const cards = document.querySelectorAll('.floating-card');
  let startTime = null;

  function frame(ts) {
    if (!startTime) startTime = ts;
    const t = (ts - startTime) / 1000;
    cards.forEach((card, i) => {
      const offset = i * 2.1;
      const y = Math.sin(t * 0.8 + offset) * 10;
      const r = Math.sin(t * 0.5 + offset) * 1.5;
      card.style.transform = `translateY(${y}px) rotate(${r}deg)`;
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
