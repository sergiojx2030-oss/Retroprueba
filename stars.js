(() => {
  const canvas = document.getElementById("spaceCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = 1;

  const STAR_COUNT = 650;
  const STAR_TINY_RATIO = 0.78;
  const COMET_MAX = 4;
  const COMET_SPAWN_CHANCE = 0.02;
  const SPEED = 0.45;
  const TWINKLE = 0.018;

  let mouseX = 0.5, mouseY = 0.5;

  const stars = [];
  const comets = [];

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = canvas.clientWidth = window.innerWidth;
    h = canvas.clientHeight = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  function makeStar() {
    const isTiny = Math.random() < STAR_TINY_RATIO;
    const size = isTiny ? rand(0.35, 1.0) : rand(1.0, 2.2);
    const depth = rand(0.15, 1.0);
    return {
      x: rand(0, w),
      y: rand(0, h),
      r: size,
      z: depth,
      a: rand(0.25, 0.9),
      tw: rand(0.6, 1.4),
      ph: rand(0, Math.PI * 2),
    };
  }

  function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) stars.push(makeStar());
  }

  function spawnComet() {
    const edge = Math.floor(rand(0, 3));
    let x, y;

    if (edge === 0) {
      x = rand(-w * 0.2, w * 1.2);
      y = rand(-120, -20);
    } else if (edge === 1) {
      x = rand(-120, -20);
      y = rand(0, h * 0.9);
    } else {
      x = rand(w + 20, w + 120);
      y = rand(0, h * 0.85);
    }

    const angleBase = rand(Math.PI * 0.20, Math.PI * 0.52);
    const angle = edge === 2 ? Math.PI - angleBase : angleBase;

    const sp = rand(8.0, 13.5);
    const vx = Math.cos(angle) * sp;
    const vy = Math.sin(angle) * sp;

    comets.push({
      x, y, vx, vy,
      life: 0,
      maxLife: rand(45, 90),
      width: rand(1.2, 2.4),
      len: rand(140, 240),
      glow: rand(0.22, 0.36),
    });
  }

  function drawStar(s) {
    const px = (mouseX - 0.5) * 42 * s.z;
    const py = (mouseY - 0.5) * 28 * s.z;

    s.ph += TWINKLE * s.tw;
    const tw = (Math.sin(s.ph) + 1) * 0.5;
    const alpha = clamp(s.a + tw * 0.25, 0.05, 1);

    ctx.beginPath();
    ctx.arc(s.x + px, s.y + py, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  }

  function updateStars() {
    for (const s of stars) {
      s.y -= SPEED * (0.6 + s.z * 1.4);
      s.x -= SPEED * (0.08 + s.z * 0.18);

      if (s.y < -10) { s.y = h + rand(0, 40); s.x = rand(0, w); }
      if (s.x < -20) { s.x = w + rand(0, 40); s.y = rand(0, h); }
    }
  }

  function drawComet(c) {
    ctx.save();

    const tx = c.x - c.vx * (c.len / 12);
    const ty = c.y - c.vy * (c.len / 12);

    const grad = ctx.createLinearGradient(c.x, c.y, tx, ty);
    grad.addColorStop(0, `rgba(255,255,255,0.92)`);
    grad.addColorStop(0.25, `rgba(190,230,255,0.55)`);
    grad.addColorStop(1, `rgba(255,255,255,0)`);

    ctx.strokeStyle = grad;
    ctx.lineWidth = c.width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    ctx.fillStyle = `rgba(255,255,255,0.9)`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = c.glow;
    ctx.fillStyle = `rgba(120,220,255,1)`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function updateComets() {
    for (let i = comets.length - 1; i >= 0; i--) {
      const c = comets[i];
      c.x += c.vx;
      c.y += c.vy;
      c.life += 1;

      if (c.life > c.maxLife || c.x < -300 || c.x > w + 300 || c.y > h + 300) {
        comets.splice(i, 1);
      }
    }

    if (comets.length < COMET_MAX && Math.random() < COMET_SPAWN_CHANCE) {
      spawnComet();
    }
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);

    updateStars();
    for (const s of stars) drawStar(s);

    updateComets();
    for (const c of comets) drawComet(c);

    requestAnimationFrame(frame);
  }

  function onMove(e){
    const x = (e.touches ? e.touches[0].clientX : e.clientX) / w;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) / h;
    mouseX = clamp(x, 0, 1);
    mouseY = clamp(y, 0, 1);
  }

  window.addEventListener("resize", () => {
    resize();
    initStars();
  });

  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });

  resize();
  initStars();
  frame();
})();
