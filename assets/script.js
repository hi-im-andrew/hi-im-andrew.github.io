const root = document.documentElement;
const THEMES = ['dark', 'light', 'y2k'];
const ICONS = {
  dark:  '<img src="assets/icons/theme-dark.png"  alt="dark mode"  />',
  light: '<img src="assets/icons/theme-light.png" alt="light mode" />',
  y2k:   '<img src="assets/icons/theme-y2k.png"   alt="y2k mode"  />'
};
let gridAnim = null;
let currentTheme = root.getAttribute('site-theme') || 'dark';
document.getElementById('toggleBtn').innerHTML = ICONS[currentTheme];
if (currentTheme === 'y2k') startGrid();

document.getElementById('toggleBtn').addEventListener('click', () => {
  const toIdx = (THEMES.indexOf(currentTheme) + 1) % THEMES.length;
  currentTheme = THEMES[toIdx];
  root.setAttribute('site-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  document.getElementById('toggleBtn').innerHTML = ICONS[currentTheme];
  if (currentTheme === 'y2k') startGrid(); else stopGrid();
});

// --- Synthwave grid ---
function startGrid() {
  const gc = document.getElementById('grid-canvas');
  const ctx = gc.getContext('2d');
  gc.width = window.innerWidth;
  gc.height = window.innerHeight;
  let t = 0;
  function draw() {
    const W = gc.width, H = gc.height;
    ctx.clearRect(0, 0, W, H);
    t += 0.0015;
    const hz = H * 0.52;

    // Horizon glow
    const hg = ctx.createLinearGradient(0, hz - 40, 0, hz + 40);
    hg.addColorStop(0,   'rgba(253,185,155,0)');
    hg.addColorStop(0.5, 'rgba(253,185,155,0.2)');
    hg.addColorStop(1,   'rgba(253,185,155,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, hz - 40, W, 80);

    // Vertical lines
    ctx.strokeStyle = 'rgba(167,112,239,0.28)';
    ctx.lineWidth = 0.7;
    for (let i = 0; i <= 14; i++) {
      const x = (i / 14) * W;
      ctx.beginPath();
      ctx.moveTo(x, hz);
      ctx.lineTo(W / 2 + (x - W / 2) * 0.04, H);
      ctx.stroke();
    }

    // Horizontal lines
    for (let j = 0; j < 16; j++) {
      const p = Math.pow(((j / 16 + t) % 1), 2.4);
      const y = hz + p * (H - hz);
      ctx.strokeStyle = `rgba(207,139,243,${0.08 + p * 0.28})`;
      ctx.lineWidth = 0.4 + p * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Sun
    const sx = W / 2, sy = hz - 30, sr = 50;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    sg.addColorStop(0,    'rgba(253,185,155,0.85)');
    sg.addColorStop(0.45, 'rgba(207,139,243,0.5)');
    sg.addColorStop(1,    'rgba(167,112,239,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, sr - 2, 0, Math.PI * 2);
    ctx.clip();
    [0.38, 0.48, 0.57, 0.64, 0.70, 0.75, 0.80].forEach(f => {
      ctx.fillStyle = 'rgba(13,0,26,0.5)';
      ctx.fillRect(sx - sr, sy - sr + f * sr * 2, sr * 2, 3 + f * 7);
    });
    ctx.restore();

    gridAnim = requestAnimationFrame(draw);
  }
  draw();
}

function stopGrid() {
  if (gridAnim) { cancelAnimationFrame(gridAnim); gridAnim = null; }
  const gc = document.getElementById('grid-canvas');
  if (gc) gc.getContext('2d').clearRect(0, 0, gc.width, gc.height);
}

// --- Petal drawing ---
// Draws one petal shape. drawSakura calls this 5 times rotated around the center.
function drawPetal(ctx, r, color, alpha) {
  ctx.globalAlpha = alpha;
  const pw = r * 0.52;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo( pw, -r * 0.3,  pw, -r * 0.85, 0, -r);
  ctx.bezierCurveTo(-pw, -r * 0.85, -pw, -r * 0.3,  0,  0);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawSakura(ctx, r, color, alpha) {
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((i / 5) * Math.PI * 2 - Math.PI / 2);
    drawPetal(ctx, r, color, alpha);
    ctx.restore();
  }
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,220,230,0.9)';
  ctx.fill();
  ctx.globalAlpha = 1;
}

// --- Particles ---
(function () {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], mouse = { x: -9999, y: -9999 };

  const COUNT          = 55;
  const LINK_DIST      = 140;
  const MOUSE_DIST     = 180;
  const LINK_ALPHA     = 0.18;
  const MOUSE_ALPHA    = 0.28;
  const WOBBLE_AMOUNT  = 0.35;
  const PETAL_COLORS   = ['#f7a8c4', '#f2bdd4', '#e87baa', '#f9c4d8', '#ec93bb'];

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function initP() {
    particles = [];
    for (let i = 0; i < COUNT; i++) {
      if (currentTheme === 'light') {
        const isSakura = Math.random() < 0.4;
        particles.push({
          type: isSakura ? 'sakura' : 'petal',
          x: Math.random() * W,
          y: Math.random() * H,
          vx: rand(-0.15, 0.15),
          vy: rand(0.3, 0.85),
          r: isSakura ? rand(6, 11) : rand(5, 10),
          rot: rand(0, Math.PI * 2),
          rotSpeed: rand(-0.014, 0.014),
          wobble: rand(0, Math.PI * 2),
          wobbleSpeed: rand(0.018, 0.045),
          alpha: rand(0.4, 0.82),
          color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)]
        });
      } else {
        particles.push({
          type: 'dot',
          x: Math.random() * W, y: Math.random() * H,
          vx: rand(-0.18, 0.18), vy: rand(-0.18, 0.18),
          r: rand(1.2, 2.2), alpha: rand(0.3, 0.7)
        });
      }
    }
  }

  function lineColor() {
    if (currentTheme === 'y2k')   return '167,112,239';
    if (currentTheme === 'light') return '212,83,126';
    return '127,119,221';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const lc = lineColor();

    for (let i = 0; i < particles.length; i++) {
      // Particle-to-particle links
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK_DIST) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${lc},${LINK_ALPHA * (1 - d / LINK_DIST)})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
      // Mouse connection
      const mdx = particles[i].x - mouse.x, mdy = particles[i].y - mouse.y;
      const md = Math.sqrt(mdx * mdx + mdy * mdy);
      if (md < MOUSE_DIST) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${lc},${MOUSE_ALPHA * (1 - md / MOUSE_DIST)})`;
        ctx.lineWidth = 0.7;
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }

    particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.type === 'sakura') {
        ctx.rotate(p.rot);
        drawSakura(ctx, p.r, p.color, p.alpha);
      } else if (p.type === 'petal') {
        ctx.rotate(p.rot);
        drawPetal(ctx, p.r, p.color, p.alpha);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${lc},${p.alpha})`;
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function update() {
    particles.forEach(p => {
      if (p.type === 'sakura' || p.type === 'petal') {
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * WOBBLE_AMOUNT;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        if (p.y > H + 16) p.y = -16;
        if (p.x < -16) p.x = W + 16;
        if (p.x > W + 16) p.x = -16;
      } else {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      }
    });
  }

  let lastTheme = currentTheme;
  function loop() {
    if (lastTheme !== currentTheme) { initP(); lastTheme = currentTheme; }
    update(); draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('resize', () => {
    const gc = document.getElementById('grid-canvas');
    gc.width = window.innerWidth;
    gc.height = window.innerHeight;
    resize();
    initP();
  });
  resize(); initP(); loop();
})();

// --- Cursor ---
(function () {
  const dot = document.getElementById('cursor-dot'), ring = document.getElementById('cursor-ring');
  let rx = 0, ry = 0, mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  });
  (function anim() {
    rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(anim);
  })();
  document.querySelectorAll('a,[data-magnetic],button').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
  });
})();

// --- Scroll reveal ---
(function () {
  const reveals = document.querySelectorAll('[data-reveal]');
  const BASE_DELAY = 80;
  let di = 0;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), di * BASE_DELAY);
        di++;
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  reveals.forEach(el => obs.observe(el));
})();

// --- Magnetic hover ---
(function () {
  const MAGNETIC_STRENGTH   = 0.18;
  const LEAVE_TRANSITION    = 'transform 0.4s cubic-bezier(0.23,1,0.32,1),opacity 0.6s,background 0.2s,border-color 0.2s';
  const ENTER_TRANSITION    = 'transform 0.1s ease,opacity 0.6s,background 0.2s,border-color 0.2s';

  document.querySelectorAll('[data-magnetic]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const tx = (e.clientX - (r.left + r.width  / 2)) * MAGNETIC_STRENGTH;
      const ty = (e.clientY - (r.top  + r.height / 2)) * MAGNETIC_STRENGTH;
      el.style.transform = `translate(${tx}px,${ty}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0,0)';
      el.style.transition = LEAVE_TRANSITION;
    });
    el.addEventListener('mouseenter', () => {
      el.style.transition = ENTER_TRANSITION;
    });
  });
})();

// --- Bio cycler ---
(function () {
  const lines = [
    "i use arch btw",
    "IT professional",
    "homelabber",
    "keeb enthusiast",
    "producer & DJ",
    "dubstep connoisseur",
    "spent way too much time in FFXIV",
    "MTG Commander player",
    "Umamusume enjoyer",
    "always building something",
    "lazy gym rat",
    "bottom text",
    "expect some more of these bits",
    "click the toggle button below if you haven't already!!"
  ];
  let idx = 0;
  const el = document.getElementById('bio-cycler');
  el.addEventListener('click', () => {
    idx = (idx + 1) % lines.length;
    el.textContent = lines[idx];
  });
})();
