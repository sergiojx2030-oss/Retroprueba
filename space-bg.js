(() => {
  const canvas = document.getElementById("space-bg");
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: true });

  if (!gl) {
    console.warn("WebGL2 no disponible. Fondo desactivado.");
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const vertSrc = `#version 300 es
  precision highp float;
  in vec2 a_pos;
  out vec2 v_uv;
  void main(){
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }`;

  const fragSrc = `#version 300 es
  precision highp float;

  out vec4 outColor;
  in vec2 v_uv;

  uniform vec2 u_res;
  uniform float u_time;
  uniform vec2 u_mouse;     // 0..1
  uniform float u_motion;   // 0 or 1

  // Hash / noise helpers
  float hash21(vec2 p){
    p = fract(p*vec2(123.34, 456.21));
    p += dot(p, p+45.32);
    return fract(p.x*p.y);
  }

  float noise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
  }

  float fbm(vec2 p){
    float v = 0.0;
    float a = 0.55;
    for(int i=0;i<5;i++){
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  // Star field
  float stars(vec2 uv, float t){
    vec2 p = uv * vec2(u_res.x/u_res.y, 1.0);
    p *= 420.0;
    vec2 ip = floor(p);
    vec2 fp = fract(p);

    float h = hash21(ip);
    float s = smoothstep(0.995, 1.0, h); // sparse
    float d = length(fp - vec2(0.5));
    float core = smoothstep(0.25, 0.0, d);

    float tw = 0.6 + 0.4*sin(t*2.0 + h*6.2831);
    return s * core * tw;
  }

  // Comet streak (procedural)
  float comet(vec2 uv, float t, float seed){
    float id = floor(seed);
    float r = fract(seed);

    // path parameters
    float speed = mix(0.06, 0.12, r);
    float phase = r * 10.0 + id * 3.1;
    float tt = fract(t*speed + phase);

    // spawn window (only part of the time)
    float window = smoothstep(0.02, 0.10, tt) * (1.0 - smoothstep(0.70, 0.90, tt));
    if(window <= 0.001) return 0.0;

    // line direction (diagonal)
    vec2 dir = normalize(vec2(1.0, -0.55));
    vec2 start = vec2(-0.2, 1.15) + vec2(r*1.4, -r*0.4);
    vec2 pos = start + dir * (tt * 1.8);

    // distance to line segment around pos
    vec2 q = uv - pos;
    float along = dot(q, dir);
    float perp = length(q - dir*along);

    float head = smoothstep(0.06, 0.0, perp) * smoothstep(0.20, -0.05, along);
    float tail = exp(-max(along, 0.0)*18.0) * smoothstep(0.08, 0.0, perp);

    return (head + tail*0.9) * window;
  }

  void main(){
    vec2 uv = v_uv;

    // Parallax with inertia feel (mouse affects sampling)
    vec2 m = (u_mouse - 0.5);
    vec2 par = m * vec2(0.06, 0.04) * u_motion;

    vec2 p = uv + par;

    // Base cosmic gradient (A: blue -> purple)
    vec3 cA = vec3(0.05, 0.10, 0.28); // deep blue
    vec3 cB = vec3(0.22, 0.07, 0.35); // deep purple
    float g = smoothstep(0.0, 1.0, p.y);
    vec3 base = mix(cA, cB, g);

    // Nebula layers
    float t = u_time * 0.10 * u_motion;
    vec2 npos = (p - 0.5) * vec2(u_res.x/u_res.y, 1.0);
    float n1 = fbm(npos*2.2 + vec2(t, -t*0.6));
    float n2 = fbm(npos*3.8 + vec2(-t*0.8, t));

    float neb = smoothstep(0.18, 0.95, n1) * 0.55 + smoothstep(0.25, 0.98, n2) * 0.35;

    vec3 glowBlue = vec3(0.18, 0.35, 1.0);
    vec3 glowPurp = vec3(0.70, 0.22, 0.95);
    vec3 nebCol = mix(glowBlue, glowPurp, n2);
    base += neb * nebCol * 0.18;

    // Vignette
    float d = distance(uv, vec2(0.5));
    base *= smoothstep(0.95, 0.30, d);

    // Stars (two densities)
    float st1 = stars(uv + par*0.6, u_time*0.25) * 0.95;
    float st2 = stars(uv*1.03 + vec2(0.13, 0.07) - par*0.2, u_time*0.18) * 0.65;
    float st = (st1 + st2);

    // Comets (few)
    float cm = 0.0;
    cm += comet(uv + par*0.5, u_time, 1.12);
    cm += comet(uv + par*0.5, u_time, 2.78);
    cm += comet(uv + par*0.5, u_time, 3.41);

    vec3 col = base;
    col += st * vec3(0.9, 0.95, 1.0) * 0.85;
    col += cm * vec3(0.55, 0.75, 1.0) * 0.65;

    // Subtle film grain
    float gr = (hash21(uv*u_res + u_time) - 0.5) * 0.02;
    col += gr;

    outColor = vec4(col, 1.0);
  }`;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function link(vs, fs) {
    const pr = gl.createProgram();
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(pr));
      gl.deleteProgram(pr);
      return null;
    }
    return pr;
  }

  const vs = compile(gl.VERTEX_SHADER, vertSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
  const prog = link(vs, fs);
  gl.useProgram(prog);

  const quad = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
  ]);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "u_res");
  const uTime = gl.getUniformLocation(prog, "u_time");
  const uMouse = gl.getUniformLocation(prog, "u_mouse");
  const uMotion = gl.getUniformLocation(prog, "u_motion");

  let w = 0, h = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.floor(window.innerWidth * dpr);
    h = Math.floor(window.innerHeight * dpr);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  // Mouse with inertia
  let targetMouse = { x: 0.5, y: 0.5 };
  let smoothMouse = { x: 0.5, y: 0.5 };

  function setMouseFromEvent(clientX, clientY) {
    targetMouse.x = clientX / window.innerWidth;
    targetMouse.y = 1.0 - (clientY / window.innerHeight);
  }

  window.addEventListener("mousemove", (e) => setMouseFromEvent(e.clientX, e.clientY), { passive: true });
  window.addEventListener("touchmove", (e) => {
    const t = e.touches && e.touches[0];
    if (t) setMouseFromEvent(t.clientX, t.clientY);
  }, { passive: true });

  const motion = prefersReducedMotion ? 0.0 : 1.0;

  let t0 = performance.now();
  function frame(now) {
    const dt = Math.min((now - t0) / 1000, 0.05);
    t0 = now;

    // inertia smoothing
    const k = prefersReducedMotion ? 0.06 : 0.10;
    smoothMouse.x += (targetMouse.x - smoothMouse.x) * k;
    smoothMouse.y += (targetMouse.y - smoothMouse.y) * k;

    gl.uniform1f(uTime, now / 1000);
    gl.uniform2f(uMouse, smoothMouse.x, smoothMouse.y);
    gl.uniform1f(uMotion, motion);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
