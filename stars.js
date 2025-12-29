(() => {
  const canvas = document.getElementById("starsCanvas");
  const ctx = canvas.getContext("2d");

  let w = 0;
  let h = 0;
  let dpr = 1;

  const layers = [
    { count: 280, speed: 0.18, sizeMin: 0.3, sizeMax: 1.2, tw: 0.010 },
    { count: 180, speed: 0.35, sizeMin: 0.5, sizeMax: 1.6, tw: 0.014 },
    { count: 80,  speed: 0.65, sizeMin: 0.8, sizeMax: 2.1, tw: 0.018 }
  ];

  let stars = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.floor(window.innerWidth * dpr);
    h = Math.floor(window.innerHeight * dpr);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    initStars(true);
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function initStars(resetAll) {
    const newStars = [];
    layers.forEach((layer, li) => {
      for (let i = 0; i < layer.count; i++) {
        newStars.push({
          layer: li,
          x: resetAll ? rand(0, w) : rand(0, w),
          y: resetAll ? rand(0, h) : rand(0, h),
          r: rand(layer.sizeMin, layer.sizeMax) * dpr,
          a: rand(0.35, 1),
          tw: rand(0, Math.PI * 2),
        });
      }
    });
    stars = newStars;
  }

  function drawStar(x, y, r, alpha) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  }

  function tick(t) {
    ctx.clearRect(0, 0, w, h);

    // movimiento "infinito" diagonal muy sutil
    const dxBase = 0.12 * dpr;
    const dyBase = 0.18 * dpr;

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const layer = layers[s.layer];

      // twinkle (brillo)
      s.tw += layer.tw;
      const twinkle = 0.28 + 0.72 * (0.5 + 0.5 * Math.sin(s.tw));

      const alpha = Math.min(1, Math.max(0.08, s.a * twinkle));

      drawStar(s.x, s.y, s.r, alpha);

      // parallax drift
      s.x -= dxBase * layer.speed;
      s.y += dyBase * layer.speed;

      // wrap para infinito
      if (s.x < -10) s.x = w + 10;
      if (s.y > h + 10) s.y = -10;
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(tick);
})();
