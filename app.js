(() => {
  const root = document.documentElement;

  function setParallax(x, y){
    root.style.setProperty("--parxX", `${x * 18}px`);
    root.style.setProperty("--parxY", `${y * 14}px`);
  }

  function onMove(e){
    const cx = (e.touches ? e.touches[0].clientX : e.clientX);
    const cy = (e.touches ? e.touches[0].clientY : e.clientY);
    const x = (cx / window.innerWidth) * 2 - 1;
    const y = (cy / window.innerHeight) * 2 - 1;
    setParallax(x, y);
  }

  window.addEventListener("mousemove", onMove, { passive:true });
  window.addEventListener("touchmove", onMove, { passive:true });

  // Tilt ligero
  const tilts = Array.from(document.querySelectorAll(".tilt"));
  const tiltStrength = 7;

  function handleTilt(e, el){
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    const rx = (-y * tiltStrength).toFixed(2);
    const ry = (x * tiltStrength).toFixed(2);
    el.style.transform = `translateY(-2px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }
  function resetTilt(el){ el.style.transform = ""; }

  tilts.forEach(el => {
    el.addEventListener("mousemove", (e) => handleTilt(e, el), { passive:true });
    el.addEventListener("mouseleave", () => resetTilt(el));
  });

  // Year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // ===== SATELITE auto-detect (por tus broncas de mayusculas/rutas) =====
  const sat = document.getElementById("satImg");
  if (sat){
    const candidates = [
      "assets/satellite.png",
      "assets/satellite.PNG",
      "satellite.png",
      "satellite.PNG"
    ];

    const tryLoad = (i) => {
      if (i >= candidates.length) return;
      sat.src = candidates[i];
      sat.onerror = () => tryLoad(i + 1);
    };

    tryLoad(0);
  }
})();
