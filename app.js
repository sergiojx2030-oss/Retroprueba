(() => {
  const root = document.documentElement;

  function setVars(x, y){
    root.style.setProperty("--mx", String(x));
    root.style.setProperty("--my", String(y));
  }

  // Default center
  setVars(0.5, 0.5);

  window.addEventListener("mousemove", (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    setVars(x, y);
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (!e.touches || !e.touches.length) return;
    const t = e.touches[0];
    const x = t.clientX / window.innerWidth;
    const y = t.clientY / window.innerHeight;
    setVars(x, y);
  }, { passive: true });

  // If user prefers reduced motion, keep it calm
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce && reduce.matches){
    setVars(0.5, 0.5);
  }
})();
