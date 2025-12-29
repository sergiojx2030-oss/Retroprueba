(() => {
  // Year
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());

  // Drawer menu
  const menuBtn = document.getElementById("menuBtn");
  const closeBtn = document.getElementById("closeBtn");
  const drawer = document.getElementById("drawer");
  const backdrop = document.getElementById("backdrop");

  function openDrawer() {
    drawer.classList.add("open");
    backdrop.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    menuBtn.setAttribute("aria-expanded", "true");
  }

  function closeDrawer() {
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  if (menuBtn) menuBtn.addEventListener("click", openDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  // Close when click link
  drawer?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeDrawer));

  // Comets: random from different edges + natural direction
  const layer = document.getElementById("cometsLayer");

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function spawnComet() {
    if (!layer) return;

    const comet = document.createElement("div");
    comet.className = "comet";

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // edges: top, left, right
    const edge = pick(["top", "left", "right", "top", "left"]);
    let x = 0, y = 0, angle = 0;

    if (edge === "top") {
      x = rand(-100, vw + 100);
      y = rand(-40, 60);
      angle = rand(20, 70); // down-right
    } else if (edge === "left") {
      x = rand(-120, -40);
      y = rand(0, vh * 0.7);
      angle = rand(-10, 35); // right / slightly down
    } else {
      x = rand(vw + 40, vw + 120);
      y = rand(0, vh * 0.6);
      angle = rand(145, 190); // left / slightly down
    }

    // little variation so it never looks "same"
    const scale = rand(0.65, 1.15);
    const duration = rand(1.2, 2.2);
    const dist = rand(520, 980);

    comet.style.left = `${x}px`;
    comet.style.top = `${y}px`;
    comet.style.transform = `rotate(${angle}deg) scale(${scale})`;

    layer.appendChild(comet);

    // animate with WAAPI
    const rad = (angle * Math.PI) / 180;
    const vx = Math.cos(rad) * dist;
    const vy = Math.sin(rad) * dist;

    comet.animate(
      [
        { transform: `rotate(${angle}deg) scale(${scale}) translate(0px, 0px)`, opacity: 0.0 },
        { opacity: 0.9, offset: 0.12 },
        { transform: `rotate(${angle}deg) scale(${scale}) translate(${vx}px, ${vy}px)`, opacity: 0.0 }
      ],
      { duration: duration * 1000, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" }
    );

    setTimeout(() => comet.remove(), duration * 1000 + 200);
  }

  // spawn loop (random interval)
  function cometLoop() {
    spawnComet();
    const next = rand(700, 1600); // frequency
    setTimeout(cometLoop, next);
  }

  cometLoop();
})();
