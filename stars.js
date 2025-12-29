(() => {
  const canvas = document.getElementById("spaceCanvas");
  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = 1;

  const STAR_COUNT = 700;
  const STAR_TINY_RATIO = 0.80;
  const COMET_MAX = 5;

  // mas cometas (visible)
  const COMET_SPAWN_CHANCE = 0.040; // subido
  const SPEED = 0.55;
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
      a: rand(0.25, 0.95),
      tw: rand(0.6, 1.6),
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

    if (edge === 0) { x = rand(-w * 0.2, w * 1.2); y = rand(-140, -30); }
    else if (edge === 1) { x = rand(-160, -30); y = rand(0, h * 0.9); }
    else { x = rand(w + 30, w + 160); y = rand(0, h * 0.85); }

    const angleBase = rand(Math.PI * 0.20, Math.PI * 0.55);
    const angle = edge === 2 ? Math.PI - angleBase : angleBase;

    const sp = rand(10.5, 16.5); // mas rapido = mas visible
    const vx = Math.cos(angle) * sp;
    const vy = Math.sin(angle) * sp;

    comets.push({
      x, y, vx, vy,
      life: 0,
      maxLife: rand(55, 110),
      width: rand(1.8, 3.0),
      len: rand(220, 360), // cola mas larga
      glow: rand(0.30, 0.48),
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
    const tx = c.x - c.vx * (c.len / 12);
    const ty = c.y - c.vy * (c.len / 12);

    const grad = ctx.createLinearGradient(c.x, c.y, tx, ty);
    grad.addColorStop(0, `rgba(255,255,255,0.98)`);
    grad.addColorStop(0.18, `rgba(190,230,255,0.75)`);
    grad.addColorStop(1, `rgba(255,255,255,0)`);

    ctx.strokeStyle = grad;
    ctx.lineWidth = c.width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    ctx.fillStyle = `rgba(255,255,255,0.95)`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = c.glow;
    ctx.fillStyle = `rgba(120,220,255,1)`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function updateComets() {
    for (let i = comets.length - 1; i >= 0; i--) {
      const c = comets[i];
      c.x += c.vx;
      c.y += c.vy;
      c.life += 1;

      if (c.life > c.maxLife || c.x < -400 || c.x > w + 400 || c.y > h + 400) {
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

  window.addEventListener("resize", () => { resize(); initStars(); });
  window.addEventListener("mousemove", onMove, { passive:true });
  window.addEventListener("touchmove", onMove, { passive:true });

  resize();
  initStars();
  frame();
})();
