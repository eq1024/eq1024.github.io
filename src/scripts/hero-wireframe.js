(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  var canvas = document.getElementById('hero-wire');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var hero = canvas.parentElement;
  var W, H;
  var t = 0;
  var running = true;

  // 16 vertices of a tesseract (±1, ±1, ±1, ±1)
  var V = [];
  for (var i = 0; i < 16; i++) {
    V.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
  }
  // edges: vertex pairs differing in exactly one bit
  var E = [];
  for (var a = 0; a < 16; a++) {
    for (var b = a + 1; b < 16; b++) {
      var x = a ^ b;
      if (x === 1 || x === 2 || x === 4 || x === 8) E.push([a, b]);
    }
  }

  var ACCENT = '255, 92, 26';
  var LINE = '148, 170, 195';

  function resize() {
    var r = hero.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    W = r.width; H = r.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rot(p, i, j, a) {
    var c = Math.cos(a), s = Math.sin(a);
    var q = p.slice();
    q[i] = p[i] * c - p[j] * s;
    q[j] = p[i] * s + p[j] * c;
    return q;
  }

  function project(p) {
    var q = rot(p, 0, 3, t * 0.45);   // XW plane
    q = rot(q, 1, 2, t * 0.3);        // YZ plane
    q = rot(q, 0, 1, t * 0.18);       // XY plane
    var w4 = 2.6 / (2.6 - q[3]);      // 4D → 3D
    var x3 = q[0] * w4, y3 = q[1] * w4, z3 = q[2] * w4;
    var d3 = 4.2 / (4.2 - z3);        // 3D → 2D
    return {
      x: W * 0.68 + x3 * d3 * H * 0.21,
      y: H * 0.40 + y3 * d3 * H * 0.21,
      depth: w4 * d3
    };
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    var pts = V.map(project);

    for (var i = 0; i < E.length; i++) {
      var p1 = pts[E[i][0]], p2 = pts[E[i][1]];
      var depth = (p1.depth + p2.depth) / 2;
      var alpha = Math.max(0.05, Math.min(0.5, (depth - 0.55) * 0.5));
      ctx.strokeStyle = 'rgba(' + LINE + ',' + alpha.toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    for (var v = 0; v < pts.length; v++) {
      var p = pts[v];
      var near = p.depth > 1.15;
      var s = near ? 4 : 2.5;
      ctx.fillStyle = near
        ? 'rgba(' + ACCENT + ',0.95)'
        : 'rgba(' + LINE + ',' + Math.max(0.15, (p.depth - 0.6) * 0.5).toFixed(3) + ')';
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }

    t += 0.0055;
    requestAnimationFrame(frame);
  }

  resize();
  frame();

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(resize, 200);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var vis = entries[0].isIntersecting;
      if (vis && !running) { running = true; frame(); }
      else if (!vis) { running = false; }
    }).observe(canvas);
  }
})();
