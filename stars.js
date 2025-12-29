(() => {
  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d", { alpha: true });

  const DPR = Math.min(2, window.devicePixelRatio || 1);

  let W = 0, H = 0;
  let stars = [];
  let comets = [];
  let mouseX = 0.5, mouseY = 0.5;
  let t = 0;

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize(){
    W = Math.max(1, Math.floor(window.innerWidth));
    H = Math.max(1, Math.floor(window.innerHeight));

    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Star density
    const density = Math.floor((W * H) / 8500);
    const count = Math.max(150, density);

    stars = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.6 + 0.2,
      a: Math.random() * 0.65 + 0.15,
      tw: Math.random() * 10,
      sp: Math.random() * 0.9 + 0.1,
      layer: Math.random()
    }));

    comets = [];
    if (!reduceMotion){
      spawnComet(true);
      spawnComet(true);
    }
  }

  function setPointer(nx, ny){
    mouseX = Math.max(0, Math.min(1, nx));
    mouseY = Math.max(0, Math.min(1, ny));
  }

  window.addEventListener("mousemove", (e) => {
    setPointer(e.clientX / W, e.clientY / H);
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (!e.touches || !e.touches.length) return;
    const p = e.touches[0];
    setPointer(p.clientX / W, p.clientY / H);
  }, { passive: true });

  window.addEventListener("resize", resize);

  function spawnComet(initial){
    // Spawn from left or right, move diagonally, vary up/down
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? -140 : (W + 140);
    const y = Math.random() * H;

    const baseVx = 3.2 + Math.random() * 2.6;
    const vx = fromLeft ? baseVx : -baseVx;

    // Up/down variation
    const vy = (Math.random() * 2.4 - 1.2) + (Math.random() < 0.5 ? 0.7 : -0.7);

    comets.push({
      x, y,
      vx, vy,
      len: 140 + Math.random() * 220,
      w: 1.0 + Math.random() * 1.8,
      glow: 0.16 + Math.random() * 0.18,
      // Delay before becoming visible (stagger)
      delay: initial ? (Math.random() * 80) : (140 + Math.random() * 260),
      life: 0
    });
  }

  function drawStars(px, py){
    for (const s of stars){
      const tw = 0.65 + 0.35 * Math.sin(t * (0.75 + s.sp) + s.tw);
      const alpha = s.a * tw;

      const x = s.x + px * (0.12 + s.layer * 0.9);
      const y = s.y + py * (0.12 + s.layer * 0.9);

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fill();

      // Soft glow for larger stars
      if (s.r > 1.25){
        ctx.beginPath();
        ctx.fillStyle = `rgba(170,215,255,${alpha * 0.15})`;
        ctx.arc(x, y, s.r * 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawComets(){
    for (let i = comets.length - 1; i >= 0; i--){
      const c = comets[i];
      c.life++;

      if (c.life < c.delay) continue;

      c.x += c.vx;
      c.y += c.vy;

      const ang = Math.atan2(c.vy, c.vx);
      const tx = Math.cos(ang);
      const ty = Math.sin(ang);

      const headX = c.x;
      const headY = c.y;

      const tailX = headX - tx * c.len;
      const tailY = headY - ty * c.len;

      // Tail gradient
      const g = ctx.createLinearGradient(headX, headY, tailX, tailY);
      g.addColorStop(0.0, `rgba(255,255,255,0.85)`);
      g.addColorStop(0.25, `rgba(200,230,255,0.35)`);
      g.addColorStop(1.0, `rgba(200,230,255,0)`);

      ctx.lineCap = "round";
      ctx.strokeStyle = g;
      ctx.lineWidth = c.w;
      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      // Head glow
      ctx.beginPath();
      ctx.fillStyle = `rgba(170,215,255,${c.glow})`;
      ctx.arc(headX, headY, 10, 0, Math.PI * 2);
      ctx.fill();

      // Remove if far out of bounds
      if (headX < -300 || headX > W + 300 || headY < -300 || headY > H + 300){
        comets.splice(i, 1);
        spawnComet(false);
      }
    }
  }

  function loop(){
    t += reduceMotion ? 0.004 : 0.013;

    ctx.clearRect(0, 0, W, H);

    // Parallax (small)
    const px = (mouseX - 0.5) * 22;
    const py = (mouseY - 0.5) * 22;

    drawStars(px, py);

    if (!reduceMotion){
      drawComets();
    }

    requestAnimationFrame(loop);
  }

  resize();
  loop();
})();
