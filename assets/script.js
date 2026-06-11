const root = document.documentElement;
const THEMES = ["dark", "light", "vaporwave", "win98"];
const ICONS = {
  dark:      '<img src="assets/icons/theme-dark.png"      alt="dark mode"      />',
  light:     '<img src="assets/icons/theme-light.png"     alt="light mode"     />',
  vaporwave: '<img src="assets/icons/theme-vaporwave.png" alt="vaporwave mode" />',
  win98:     '<img src="assets/icons/theme-win98.png"     alt="win98 mode"     />',
};
let gridAnim = null;
let currentTheme = root.getAttribute("site-theme") || "dark";
if (currentTheme === "vaporwave") startGrid();

// Called after each view renders to wire up the toggle button in that view.
function initToggle() {
  const btn = document.getElementById("toggleBtn");
  if (!btn) return;
  btn.innerHTML = ICONS[currentTheme];
  btn.addEventListener("click", () => {
    const toIdx = (THEMES.indexOf(currentTheme) + 1) % THEMES.length;
    currentTheme = THEMES[toIdx];
    root.setAttribute("site-theme", currentTheme);
    localStorage.setItem("theme", currentTheme);
    btn.innerHTML = ICONS[currentTheme];
    if (currentTheme === "vaporwave") startGrid();
    else stopGrid();
  });
}

// --- Synthwave grid ---
function startGrid() {
  const gc = document.getElementById("grid-canvas");
  const ctx = gc.getContext("2d");
  gc.width = window.innerWidth;
  gc.height = window.innerHeight;
  let t = 0;
  function draw() {
    const W = gc.width,
      H = gc.height;
    ctx.clearRect(0, 0, W, H);
    t += 0.0015;
    const hz = H * 0.52;

    const hg = ctx.createLinearGradient(0, hz - 40, 0, hz + 40);
    hg.addColorStop(0, "rgba(253,185,155,0)");
    hg.addColorStop(0.5, "rgba(253,185,155,0.2)");
    hg.addColorStop(1, "rgba(253,185,155,0)");
    ctx.fillStyle = hg;
    ctx.fillRect(0, hz - 40, W, 80);

    ctx.strokeStyle = "rgba(167,112,239,0.28)";
    ctx.lineWidth = 0.7;
    for (let i = 0; i <= 14; i++) {
      const x = (i / 14) * W;
      ctx.beginPath();
      ctx.moveTo(x, hz);
      ctx.lineTo(W / 2 + (x - W / 2) * 0.04, H);
      ctx.stroke();
    }

    for (let j = 0; j < 16; j++) {
      const p = Math.pow((j / 16 + t) % 1, 2.4);
      const y = hz + p * (H - hz);
      ctx.strokeStyle = `rgba(207,139,243,${0.08 + p * 0.28})`;
      ctx.lineWidth = 0.4 + p * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const sx = W / 2,
      sy = hz - 30,
      sr = 50;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    sg.addColorStop(0, "rgba(253,185,155,0.85)");
    sg.addColorStop(0.45, "rgba(207,139,243,0.5)");
    sg.addColorStop(1, "rgba(167,112,239,0)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, sr - 2, 0, Math.PI * 2);
    ctx.clip();
    [0.38, 0.48, 0.57, 0.64, 0.7, 0.75, 0.8].forEach((f) => {
      ctx.fillStyle = "rgba(13,0,26,0.5)";
      ctx.fillRect(sx - sr, sy - sr + f * sr * 2, sr * 2, 3 + f * 7);
    });
    ctx.restore();

    gridAnim = requestAnimationFrame(draw);
  }
  draw();
}

function stopGrid() {
  if (gridAnim) {
    cancelAnimationFrame(gridAnim);
    gridAnim = null;
  }
  const gc = document.getElementById("grid-canvas");
  if (gc) gc.getContext("2d").clearRect(0, 0, gc.width, gc.height);
}

// --- Petal drawing ---
function drawPetal(ctx, r, color, alpha) {
  ctx.globalAlpha = alpha;
  const pw = r * 0.52;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(pw, -r * 0.3, pw, -r * 0.85, 0, -r);
  ctx.bezierCurveTo(-pw, -r * 0.85, -pw, -r * 0.3, 0, 0);
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
  ctx.fillStyle = "rgba(255,220,230,0.9)";
  ctx.fill();
  ctx.globalAlpha = 1;
}

// --- Particles ---
(function () {
  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");
  let W,
    H,
    particles = [],
    mouse = { x: -9999, y: -9999 };

  const COUNT = 55;
  const LINK_DIST = 140;
  const MOUSE_DIST = 180;
  const LINK_ALPHA = 0.18;
  const MOUSE_ALPHA = 0.28;
  const WOBBLE_AMOUNT = 0.35;
  const PETAL_COLORS = ["#f7a8c4", "#f2bdd4", "#e87baa", "#f9c4d8", "#ec93bb"];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function initP() {
    particles = [];
    for (let i = 0; i < COUNT; i++) {
      if (currentTheme === "light") {
        const isSakura = Math.random() < 0.4;
        particles.push({
          type: isSakura ? "sakura" : "petal",
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
          color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
        });
      } else {
        particles.push({
          type: "dot",
          x: Math.random() * W,
          y: Math.random() * H,
          vx: rand(-0.18, 0.18),
          vy: rand(-0.18, 0.18),
          r: rand(1.2, 2.2),
          alpha: rand(0.3, 0.7),
        });
      }
    }
  }

  function lineColor() {
    if (currentTheme === "vaporwave") return "167,112,239";
    if (currentTheme === "light") return "212,83,126";
    return "127,119,221";
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const lc = lineColor();
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x,
          dy = particles[i].y - particles[j].y;
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
      const mdx = particles[i].x - mouse.x,
        mdy = particles[i].y - mouse.y;
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
    particles.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.type === "sakura") {
        ctx.rotate(p.rot);
        drawSakura(ctx, p.r, p.color, p.alpha);
      } else if (p.type === "petal") {
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
    particles.forEach((p) => {
      if (p.type === "sakura" || p.type === "petal") {
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * WOBBLE_AMOUNT;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        if (p.y > H + 16) p.y = -16;
        if (p.x < -16) p.x = W + 16;
        if (p.x > W + 16) p.x = -16;
      } else {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
      }
    });
  }

  let lastTheme = currentTheme;
  function loop() {
    if (lastTheme !== currentTheme) {
      initP();
      lastTheme = currentTheme;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener("resize", () => {
    const gc = document.getElementById("grid-canvas");
    gc.width = window.innerWidth;
    gc.height = window.innerHeight;
    resize();
    initP();
  });
  resize();
  initP();
  loop();
})();

// --- Cursor ---
(function () {
  const dot = document.getElementById("cursor-dot"),
    ring = document.getElementById("cursor-ring");
  let rx = 0,
    ry = 0,
    mx = 0,
    my = 0;
  document.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + "px";
    dot.style.top = my + "px";
  });
  (function anim() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + "px";
    ring.style.top = ry + "px";
    requestAnimationFrame(anim);
  })();
})();

// --- Shared UI — called after each view renders ---

function initToggleAndReveal() {
  initToggle();
  applyReveal();
  applyMagnetic();
  applyCursorHover();
}

function applyReveal() {
  const BASE_DELAY = 80;
  let di = 0;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add("visible"), di * BASE_DELAY);
          di++;
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  document.querySelectorAll("[data-reveal]").forEach((el) => obs.observe(el));
}

function applyMagnetic() {
  const STRENGTH = 0.18;
  const LEAVE =
    "transform 0.4s cubic-bezier(0.23,1,0.32,1),opacity 0.6s,background 0.2s,border-color 0.2s";
  const ENTER =
    "transform 0.1s ease,opacity 0.6s,background 0.2s,border-color 0.2s";
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * STRENGTH}px,${(e.clientY - (r.top + r.height / 2)) * STRENGTH}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "translate(0,0)";
      el.style.transition = LEAVE;
    });
    el.addEventListener("mouseenter", () => {
      el.style.transition = ENTER;
    });
  });
}

function applyCursorHover() {
  document
    .querySelectorAll("a,[data-magnetic],button,.masonry-item")
    .forEach((el) => {
      el.addEventListener("mouseenter", () =>
        document.body.classList.add("hovering"),
      );
      el.addEventListener("mouseleave", () =>
        document.body.classList.remove("hovering"),
      );
    });
}

// --- Home view ---
const homeView = {
  title: "welcome to dru's domain",
  html: `
<button class="theme-toggle-btn home-toggle" id="toggleBtn" data-reveal aria-label="Toggle theme">
  <img src="assets/icons/theme-dark.png" alt="dark mode" />
</button>
<main>
  <div class="banner-wrap" data-reveal>
    <div class="banner">
      <img src="assets/images/banner.webp" alt="banner" />
    </div>
  </div>
  <div class="header-text" data-reveal>
    <h1>welcome to dru's domain expansion</h1>
    <h1 id="bio-cycler">Click me!</h1>
  </div>
  <div class="win98-window">
    <div class="win98-titlebar">
      <span>About Me</span>
      <div class="win98-titlebar-btns"><span>_</span><span>□</span><span>✕</span></div>
    </div>
    <div class="about-box" data-reveal>
      <div class="about-section">
        <span class="about-label">About</span>
        <p>
        Hello! If you're here, you've either met me at a convention, rave, someplace online, or some other event.</br>
        </br>
        Andrew - he/him - 25 - raver, tech nerd, a true night owl</br>
        </br>
        I love meeting new people. Shoot me a friend request on Discord (@druuji) and let me know where you're coming from!
        </p>
      </div>
      <div class="about-divider"></div>
      <div class="about-section">
        <span class="about-label">Interests</span>
        <p>
        anime, manga, manhwa, light novels</br>
        dubstep, riddim, UK garage, drum & bass, future bass, color bass, R&B and K-R&B</br>
        </br>
        I mostly play FFXIV, MTG Commander, League, and Marvel Rivals. Got a huge Steam backlog that I need to get through eventually.</br>
        Retired gacha gamer 🥀💔</br>
        </br>
        Find me on FFXIV: Yae Kasumi @ Jenova (Aether)
        </p>
      </div>
      <div class="about-divider"></div>
      <div class="about-section">
        <span class="about-label">Currently</span>
        <p>
        upcoming events:</br>
        - Offkai Expo 2026</br>
        - ALA 2027 (?)</br>
        - EDC Dawn 2027</br>
        </br>
        always adding more to this page ❤️</br>
        </p>
      </div>
    </div>
  </div>
  <div class="status" data-reveal>
    <div class="status-dot"></div>Bay Area, CA
  </div>
  <div class="links-section">
    <div class="win98-window">
      <div class="win98-titlebar">
        <span>Connect</span>
        <div class="win98-titlebar-btns"><span>_</span><span>□</span><span>✕</span></div>
      </div>
      <div class="win98-section-body">
        <div class="section-label" data-reveal>Connect</div>
        <a href="https://twitch.tv/druuji" class="link-card" data-reveal data-magnetic>
          <div class="link-icon"><img src="assets/icons/twitch.svg" alt="Twitch" /></div>
          <div class="link-info"><strong>Twitch</strong><span>twitch.tv/druuji</span></div>
          <span class="link-arrow">→</span>
        </a>
        <a href="https://www.instagram.com/iamnotandru/" class="link-card" data-reveal data-magnetic>
          <div class="link-icon"><img src="assets/icons/instagram.svg" alt="Instagram" /></div>
          <div class="link-info"><strong>Instagram</strong><span>Personal IG page</span></div>
          <span class="link-arrow">→</span>
        </a>
        <a href="https://bsky.app/profile/bnuuy.club" class="link-card" data-reveal data-magnetic>
          <div class="link-icon"><img src="assets/icons/bsky.svg" alt="Bluesky" /></div>
          <div class="link-info"><strong>Bluesky</strong><span>@bnuuy.club - gpose archive</span></div>
          <span class="link-arrow">→</span>
        </a>
        <a href="https://tomestone.gg/character/47113691/yae-kasumi" class="link-card" data-reveal data-magnetic>
          <div class="link-icon"><img src="https://assets.tomestone.gg/static/logo.webp" alt="Tomestone" /></div>
          <div class="link-info"><strong>Tomestone</strong><span>For my fellow Eorzea gamers</span></div>
          <span class="link-arrow">→</span>
        </a>
        <div class="link-card discord-toggle" id="discord-toggle" data-reveal data-magnetic>
          <div class="link-icon discord-icon"><img src="assets/icons/discord.svg" alt="Discord" /></div>
          <div class="link-info"><strong>Discord</strong><span>Click to view</span></div>
          <span class="discord-chevron">▾</span>
        </div>
        <div class="discord-dropdown" id="discord-dropdown">
          <img src="https://discord.dog/126105851504099328.png" alt="Discord profile card" />
        </div>
      </div>
    </div>
    <div class="divider" data-reveal></div>
    <div class="win98-window">
      <div class="win98-titlebar">
        <span>Projects</span>
        <div class="win98-titlebar-btns"><span>_</span><span>□</span><span>✕</span></div>
      </div>
      <div class="win98-section-body">
        <div class="section-label" data-reveal>Projects</div>
        <a href="#keyboards" class="link-card" data-reveal data-magnetic>
          <div class="link-icon amber"><img src="assets/icons/keeb.png" alt="Keyboard Portfolio" /></div>
          <div class="link-info"><strong>Keyboard Portfolio</strong><span>My custom keebs built over the years</span></div>
          <span class="link-arrow">→</span>
        </a>
        <a href="#commissions" class="link-card" data-reveal data-magnetic>
          <div class="link-icon amber"><img src="assets/icons/gallery.png" alt="Art Commissions" /></div>
          <div class="link-info"><strong>Art Commissions</strong><span>Amazing artwork I've commissioned</span></div>
          <span class="link-arrow">→</span>
        </a>
        <a href="https://github.com/hi-im-andrew/hi-im-andrew.github.io" class="link-card" data-reveal data-magnetic>
          <div class="link-icon amber"><img src="assets/icons/github.svg" alt="This Website" /></div>
          <div class="link-info"><strong>This Website</strong><span>GitHub repository of the website you're looking at</span></div>
          <span class="link-arrow">→</span>
        </a>
      </div>
    </div>
    <div class="divider" data-reveal></div>
    <div class="win98-window">
      <div class="win98-titlebar">
        <span>Music</span>
        <div class="win98-titlebar-btns"><span>_</span><span>□</span><span>✕</span></div>
      </div>
      <div class="win98-section-body">
        <div class="section-label" data-reveal>Music</div>
        <a href="https://soundcloud.com/ippatsu" class="link-card" data-reveal data-magnetic>
          <div class="link-icon"><img src="assets/icons/soundcloud.svg" alt="SoundCloud" /></div>
          <div class="link-info"><strong>SoundCloud</strong><span>I make stupid shit</span></div>
          <span class="link-arrow">→</span>
        </a>
        <a href="https://open.spotify.com/user/8j7f7yivb2aycjatum80e80rx?si=6d65ddb5c89744f9" class="link-card" data-reveal data-magnetic>
          <div class="link-icon teal"><img src="assets/icons/spotify.svg" alt="Spotify" /></div>
          <div class="link-info"><strong>Spotify</strong><span>Playlists and such</span></div>
          <span class="link-arrow">→</span>
        </a>
      </div>
    </div>
  </div>
</main>
<footer data-reveal>made by yours truly · banner art by <a href="https://x.com/Louu_Heroo" class="footer-link">@louu_heroo</a> · 2026</footer>
`,
  init() {
    const lines = [
      "i use arch btw",
      "IT professional",
      "homelabber",
      "keeb enthusiast",
      "producer & DJ",
      "dubstep connoisseur",
      "too many hours in FFXIV",
      "MTG Commander player",
      "Umamusume enjoyer",
      "always building something",
      "lazy gym rat",
      "bottom text",
      "expect some more of these bits",
      "click the toggle button in the top right corner if you haven't already!!",
    ];
    let idx = 0;
    const el = document.getElementById("bio-cycler");
    el.addEventListener("click", () => {
      idx = (idx + 1) % lines.length;
      el.textContent = lines[idx];
    });

    const discordToggle = document.getElementById("discord-toggle");
    const discordDropdown = document.getElementById("discord-dropdown");
    discordToggle.addEventListener("click", () => {
      const open = discordToggle.classList.toggle("open");
      discordDropdown.classList.toggle("open", open);
    });

    return null;
  },
};

// --- Router ---
const VIEWS = {
  "": homeView,
  commissions: createGalleryView({
    dataUrl: "assets/commissions.json",
    title: "commissions",
    subtitle: "commissioned works · dru's domain",
  }),
  keyboards: createGalleryView({
    dataUrl: "assets/keyboards.json",
    title: "keyboard portfolio",
    subtitle: "my custom keebs · dru's domain",
  }),
};

let _teardown = null;

function navigate(hash, instant) {
  const view = document.getElementById("view");
  const def = VIEWS[hash] || VIEWS[""];

  const swap = () => {
    if (_teardown) {
      _teardown();
      _teardown = null;
    }
    view.innerHTML = def.html;
    document.title = def.title || "welcome to dru's domain";
    _teardown = def.init ? def.init() || null : null;
    initToggleAndReveal();
    view.classList.remove("fading");
  };

  if (instant) {
    swap();
  } else {
    view.classList.add("fading");
    setTimeout(swap, 150);
  }
}

window.addEventListener("hashchange", () => navigate(location.hash.slice(1)));
navigate(location.hash.slice(1), true); // instant on first load
