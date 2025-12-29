(() => {
  // ====== MENU ======
  const btnMenu = document.getElementById("btnMenu");
  const btnClose = document.getElementById("btnClose");
  const drawer = document.getElementById("drawer");
  const backdrop = document.getElementById("backdrop");

  function openMenu(){
    drawer.classList.add("open");
    backdrop.classList.add("show");
    btnMenu.setAttribute("aria-expanded", "true");
    drawer.setAttribute("aria-hidden", "false");
  }
  function closeMenu(){
    drawer.classList.remove("open");
    backdrop.classList.remove("show");
    btnMenu.setAttribute("aria-expanded", "false");
    drawer.setAttribute("aria-hidden", "true");
  }

  btnMenu && btnMenu.addEventListener("click", openMenu);
  btnClose && btnClose.addEventListener("click", closeMenu);
  backdrop && backdrop.addEventListener("click", closeMenu);
  drawer && drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));

  // Year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // ====== PARALLAX ======
  const nebula = document.querySelector(".bg-nebula");
  const earth = document.querySelector(".earth");
  const moon = document.querySelector(".moon");
  const sat = document.querySelector(".satellite");

  let mx = 0, my = 0;

  window.addEventListener("pointermove", (e) => {
    const w = window.innerWidth, h = window.innerHeight;
    mx = (e.clientX / w) * 2 - 1;
    my = (e.clientY / h) * 2 - 1;
  }, { passive: true });

  function parallaxTick(){
    const nx = mx * 10;
    const ny = my * 10;

    if (nebula) nebula.style.transform = `translate3d(${nx * -0.8}px, ${ny * -0.6}px, 0) scale(1.06)`;
    if (earth)  earth.style.transform  = `translate3d(${nx * 1.1}px, ${ny * 0.8}px, 0)`;
    if (moon)   moon.style.transform   = `translate3d(${nx * 1.8}px, ${ny * 1.2}px, 0)`;
    if (sat)    sat.style.transform    = `translate3d(${nx * -1.4}px, ${ny * -1.1}px, 0) rotate(${mx * 1.5}deg)`;

    requestAnimationFrame(parallaxTick);
  }
  requestAnimationFrame(parallaxTick);

  // ====== CANVAS: ESTRELLAS + COMETAS INFINITOS ======
  const canvas = document.getElementById("space");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 0, H = 0;

  function rand(min, max){ return Math.random() * (max - min) + min; }

  function resize(){
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    buildStars();
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  // Estrellas
  const stars = [];

  function buildStars(){
    stars.length = 0;
    const count = Math.floor((W * H) / 2400);
    for (let i = 0; i < count; i++){
      stars.push({
        x: rand(0, W),
        y: rand(0, H),
        r: rand(0.4, 1.6),
        a: rand(0.12, 0.95),
        tw: rand(0.004, 0.02),
        ph: rand(0, Math.PI * 2),
        drift: rand(0.05, 0.28)
      });
    }
  }

  // Cometas
  const comets = [];

  function spawnComet(){
    const side = Math.floor(rand(0, 4));
    let x, y;

    if (side === 0) { x = rand(-80, W + 80); y = rand(-120, -20); }
    if (side === 1) { x = rand(W + 20, W + 120); y = rand(-80, H + 80); }
    if (side === 2) { x = rand(-80, W + 80); y = rand(H + 20, H + 120); }
    if (side === 3) { x = rand(-120, -20); y = rand(-80, H + 80); }

    const tx = rand(0, W);
    const ty = rand(0, H);

    const ang = Math.atan2(ty - y, tx - x) + rand(-0.35, 0.35);
    const sp = rand(3.2, 6.2);

    comets.push({
      x, y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      life: 0,
      maxLife: rand(80, 140),
      len: rand(120, 220),
      w: rand(1.2, 2.2),
      glow: rand(0.25, 0.55)
    });
  }

  let cometTimer = 0;
  function cometLogic(){
    cometTimer--;
    if (cometTimer <= 0){
      const burst = Math.random() < 0.25 ? 2 : 1;
      for (let i = 0; i < burst; i++) spawnComet();
      cometTimer = Math.floor(rand(80, 200));
    }
  }

  // Loop
  let t = 0;
  function tick(){
    t += 1;

    ctx.clearRect(0, 0, W, H);

    const scroll = (t * 0.18) % H;

    // Estrellas
    for (let i = 0; i < stars.length; i++){
      const s = stars[i];

      const tw = (Math.sin(s.ph + t * s.tw) + 1) * 0.5;
      const a = s.a * (0.55 + tw * 0.65);

      let yy = s.y + scroll * s.drift;
      if (yy > H) yy -= H;

      const px = mx * 8 * (s.r * 0.6);
      const py = my * 6 * (s.r * 0.6);

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.arc(s.x + px, yy + py, s.r, 0, Math.PI * 2);
      ctx.fill();

      if (s.r > 1.2){
        ctx.beginPath();
        ctx.fillStyle = `rgba(180,220,255,${a * 0.22})`;
        ctx.arc(s.x + px, yy + py, s.r * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Cometas
    cometLogic();
    for (let i = comets.length - 1; i >= 0; i--){
      const c = comets[i];
      c.x += c.vx;
      c.y += c.vy;
      c.life++;

      const tx = c.x - c.vx * (c.len / 10);
      const ty = c.y - c.vy * (c.len / 10);

      const grad = ctx.createLinearGradient(c.x, c.y, tx, ty);
      grad.addColorStop(0, `rgba(220,245,255,0.95)`);
      grad.addColorStop(0.35, `rgba(160,220,255,0.35)`);
      grad.addColorStop(1, `rgba(160,220,255,0)`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = c.w;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = `rgba(190,240,255,${c.glow})`;
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fill();

      if (c.life > c.maxLife){
        comets.splice(i, 1);
      }
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
