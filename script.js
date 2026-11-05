/* Open-Set Recognition + XAI · Coming Soon
   Vanilla JS, no dependencies. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Header + mobile nav ---------- */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");

  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }
  toggle.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  menu.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu.classList.contains("open")) { closeMenu(); toggle.focus(); }
  });

  /* ---------- Active nav link ---------- */
  var navLinks = Array.prototype.slice.call(menu.querySelectorAll('a[href^="#"]'));
  if ("IntersectionObserver" in window) {
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + entry.target.id;
          a.classList.toggle("active", on);
          if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (a) {
      var s = document.querySelector(a.getAttribute("href"));
      if (s) sectionObs.observe(s);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { revealObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Hero background: chaos to clarity ---------- */
  var canvas = document.getElementById("bg-canvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, pts = [], t0 = 0, running = true, raf = null;
    var cols = ["34,211,238", "59,130,246", "167,139,250", "45,212,191"];
    function seed() {
      pts = [];
      var nb = W < 700 ? 8 : 12, per = W < 700 ? 9 : 12;
      var x0 = W < 900 ? W * 0.12 : W * 0.56, x1 = W < 900 ? W * 0.88 : W * 0.94;
      var base = H * 0.86, gap = (x1 - x0) / nb;
      for (var b = 0; b < nb; b++) {
        var hgt = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(b * 0.9 + 1.2)) * (0.6 + b / nb * 0.4);
        var n = Math.round(per * hgt);
        for (var i = 0; i < n; i++) {
          pts.push({ tx: x0 + b * gap + gap / 2, ty: base - i * (H * 0.5 / per),
            sx: Math.random() * W, sy: Math.random() * H, ph: Math.random() * Math.PI * 2,
            col: cols[b % cols.length] });
        }
      }
    }
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed(); draw(reduceMotion ? 1 : 0, 0);
    }
    function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
    function draw(k, time) {
      ctx.clearRect(0, 0, W, H);
      if (k > 0.6) {
        ctx.strokeStyle = "rgba(148,170,220," + ((k - 0.6) * 0.3).toFixed(3) + ")";
        ctx.beginPath(); var bx = W < 900 ? W * 0.1 : W * 0.55; ctx.moveTo(bx, H * 0.86 + 8); ctx.lineTo(W < 900 ? W * 0.9 : W * 0.95, H * 0.86 + 8); ctx.stroke();
      }
      pts.forEach(function (p) {
        var wob = (1 - k) * 18;
        var x = p.sx + (p.tx - p.sx) * k + Math.cos(time * 0.0006 + p.ph) * wob;
        var y = p.sy + (p.ty - p.sy) * k + Math.sin(time * 0.0007 + p.ph) * wob;
        var a = 0.25 + k * 0.45;
        ctx.fillStyle = "rgba(" + (k < 0.15 ? "148,163,184" : p.col) + "," + a.toFixed(3) + ")";
        var s = 2 + k * 2.2;
        if (k > 0.85) ctx.fillRect(x - s, y - s * 0.6, s * 2, s * 1.2);
        else { ctx.beginPath(); ctx.arc(x, y, s * 0.8, 0, Math.PI * 2); ctx.fill(); }
      });
    }
    var CYCLE = 11000;
    function phase(t) {
      var c = (t % CYCLE) / CYCLE;
      if (c < 0.25) return 0;                    // chaos
      if (c < 0.5) return ease((c - 0.25) / 0.25); // organise
      if (c < 0.85) return 1;                    // clarity
      return 1 - ease((c - 0.85) / 0.15);        // release
    }
    function step(ts) { if (!t0) t0 = ts; draw(phase(ts - t0), ts); if (running) raf = requestAnimationFrame(step); }
    function start() { if (!running && !reduceMotion) { running = true; raf = requestAnimationFrame(step); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    resize();
    if (reduceMotion) running = false; else raf = requestAnimationFrame(step);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }).observe(canvas);
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  }

  /* ---------- Dashboard preview (computed from sales_data.xlsx) ---------- */
  var D = window.SALES;
  if (D && document.getElementById("trend")) {
    var fR = document.getElementById("f-region"), fP = document.getElementById("f-product"), fS = document.getElementById("f-segment");
    function fill(sel, arr) { arr.forEach(function (v, i) { var o = document.createElement("option"); o.value = String(i); o.textContent = v; sel.appendChild(o); }); }
    fill(fR, D.regions); fill(fP, D.products); fill(fS, D.segments);

    var eur = function (v) {
      if (Math.abs(v) >= 1e6) return "€" + (v / 1e6).toFixed(2) + "M";
      if (Math.abs(v) >= 1e3) return "€" + (v / 1e3).toFixed(0) + "k";
      return "€" + v.toFixed(0);
    };
    var pct = function (v) { return (v * 100).toFixed(1) + "%"; };
    var NS = "http://www.w3.org/2000/svg";
    function el(n, a, txt) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; }

    function filtered() {
      var r = fR.value, p = fP.value, s = fS.value;
      return D.rows.filter(function (x) {
        return (r === "" || x[1] === +r) && (p === "" || x[2] === +p) && (s === "" || x[3] === +s);
      });
    }
    function sumBy(rows, idx, n) {
      var out = []; for (var i = 0; i < n; i++) out.push({ u: 0, rev: 0, cost: 0, pr: 0 });
      rows.forEach(function (x) { var o = out[x[idx]]; o.u += x[4]; o.rev += x[5]; o.cost += x[6]; o.pr += x[7]; });
      return out;
    }

    function drawTrend(rows) {
      var box = document.getElementById("trend"); box.innerHTML = "";
      var m = sumBy(rows, 0, 12);
      var w = box.clientWidth || 900, h = box.clientHeight || 280, pl = 58, pr = 12, pt = 12, pb = 30;
      var raw = Math.max.apply(null, m.map(function (o) { return o.rev; })) || 1;
      var mag = Math.pow(10, Math.floor(Math.log10(raw / 4))), stepv = [1, 2, 2.5, 3, 4, 5, 10].map(function (f) { return f * mag; }).filter(function (v) { return v * 4 >= raw; })[0];
      var max = stepv * 4;
      var svg = el("svg", { viewBox: "0 0 " + w + " " + h, class: "trend-svg" });
      var X = function (i) { return pl + i * (w - pl - pr) / 11; }, Y = function (v) { return pt + (h - pt - pb) * (1 - v / max); };
      for (var g = 0; g <= 4; g++) {
        var v = max * g / 4, y = Y(v);
        svg.appendChild(el("line", { x1: pl, x2: w - pr, y1: y, y2: y, class: "grid" }));
        svg.appendChild(el("text", { x: pl - 10, y: y + 4, class: "axis", "text-anchor": "end" }, eur(v)));
      }
      var every = w < 520 ? 2 : 1;
      D.months.forEach(function (mm, i) { if (i % every === 0) svg.appendChild(el("text", { x: X(i), y: h - 8, class: "axis", "text-anchor": "middle" }, mm.slice(0, 3))); });
      function series(key, cls) {
        var d = m.map(function (o, i) { return (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(o[key]).toFixed(1); }).join(" ");
        var area = d + " L" + X(11) + " " + Y(0) + " L" + X(0) + " " + Y(0) + " Z";
        svg.appendChild(el("path", { d: area, class: "area " + cls }));
        var line = el("path", { d: d, class: "line " + cls });
        svg.appendChild(line);
        m.forEach(function (o, i) {
          var c = el("circle", { cx: X(i), cy: Y(o[key]), r: 3.5, class: "pt " + cls });
          c.appendChild(el("title", {}, D.months[i] + " · " + (key === "rev" ? "Revenue " : "Profit ") + "€" + Math.round(o[key]).toLocaleString("en-IE")));
          svg.appendChild(c);
        });
      }
      series("rev", "s-rev"); series("pr", "s-pr");
      box.appendChild(svg);
    }

    function drawBars(id, rows, idx, names) {
      var box = document.getElementById(id); box.innerHTML = "";
      var g = sumBy(rows, idx, names.length);
      var max = Math.max.apply(null, g.map(function (o) { return o.rev; })) || 1;
      var best = -1, bi = -1;
      g.forEach(function (o, i) { var mg = o.rev ? o.pr / o.rev : 0; if (o.rev && mg > best) { best = mg; bi = i; } });
      g.forEach(function (o, i) {
        var row = document.createElement("div"); row.className = "bar-row" + (i === bi ? " top" : "");
        var mg = o.rev ? o.pr / o.rev : 0;
        row.innerHTML = '<span class="bar-name"></span><span class="bar-track"><span class="bar-rev"></span><span class="bar-pr"></span></span><span class="bar-val"></span>';
        row.querySelector(".bar-name").textContent = names[i];
        row.querySelector(".bar-rev").style.width = (o.rev / max * 100).toFixed(1) + "%";
        row.querySelector(".bar-pr").style.width = (o.pr / max * 100).toFixed(1) + "%";
        row.querySelector(".bar-val").textContent = o.rev ? eur(o.rev) + " · " + pct(mg) : "–";
        row.title = names[i] + ": revenue €" + Math.round(o.rev).toLocaleString("en-IE") + ", profit €" + Math.round(o.pr).toLocaleString("en-IE") + ", margin " + pct(mg);
        box.appendChild(row);
      });
    }

    function drawHeat(rows) {
      var box = document.getElementById("heat"); box.innerHTML = "";
      var cell = []; for (var r = 0; r < 4; r++) { cell.push([]); for (var p = 0; p < 4; p++) cell[r].push({ rev: 0, pr: 0 }); }
      rows.forEach(function (x) { var c = cell[x[1]][x[2]]; c.rev += x[5]; c.pr += x[7]; });
      var vals = []; cell.forEach(function (r) { r.forEach(function (c) { if (c.rev) vals.push(c.pr / c.rev); }); });
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      var head = document.createElement("div"); head.className = "heat-row heat-head"; head.setAttribute("role", "row");
      head.innerHTML = '<span role="columnheader"></span>';
      D.products.forEach(function (p) { var s = document.createElement("span"); s.setAttribute("role", "columnheader"); s.textContent = p; head.appendChild(s); });
      box.appendChild(head);
      cell.forEach(function (r, ri) {
        var row = document.createElement("div"); row.className = "heat-row"; row.setAttribute("role", "row");
        var nm = document.createElement("span"); nm.className = "heat-name"; nm.setAttribute("role", "rowheader"); nm.textContent = D.regions[ri]; row.appendChild(nm);
        r.forEach(function (c, pi) {
          var s = document.createElement("span"); s.setAttribute("role", "cell");
          if (!c.rev) { s.className = "heat-cell empty"; s.textContent = "–"; }
          else {
            var mg = c.pr / c.rev, k = hi > lo ? (mg - lo) / (hi - lo) : 0.5;
            s.className = "heat-cell" + (mg === hi && vals.length > 1 ? " hi" : "") + (mg === lo && vals.length > 1 ? " lo" : "");
            s.style.setProperty("--k", k.toFixed(3));
            s.textContent = pct(mg);
            s.title = D.regions[ri] + " · " + D.products[pi] + ": margin " + pct(mg);
          }
          row.appendChild(s);
        });
        box.appendChild(row);
      });
    }

    function update() {
      var rows = filtered();
      var t = rows.reduce(function (a, x) { a.u += x[4]; a.rev += x[5]; a.cost += x[6]; a.pr += x[7]; return a; }, { u: 0, rev: 0, cost: 0, pr: 0 });
      document.getElementById("k-rev").textContent = eur(t.rev);
      document.getElementById("k-cost").textContent = eur(t.cost);
      document.getElementById("k-pr").textContent = eur(t.pr);
      document.getElementById("k-mg").textContent = t.rev ? pct(t.pr / t.rev) : "–";
      document.getElementById("k-u").textContent = t.u.toLocaleString("en-IE");
      drawTrend(rows);
      drawBars("bar-region", rows, 1, D.regions);
      drawBars("bar-product", rows, 2, D.products);
      drawBars("bar-segment", rows, 3, D.segments);
      drawHeat(rows);
    }
    [fR, fP, fS].forEach(function (s) { s.addEventListener("change", update); });
    document.getElementById("f-reset").addEventListener("click", function () { fR.value = fP.value = fS.value = ""; update(); });
    update();
    var lastW = 0, rz;
    window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { var w = document.getElementById("trend").clientWidth; if (w !== lastW) { lastW = w; drawTrend(filtered()); } }, 150); });
  }
})();
