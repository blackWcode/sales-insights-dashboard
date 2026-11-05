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

  /* ---------- Interactive dashboard (computed from sales_data.xlsx) ---------- */
  var D = window.SALES;
  if (D && document.getElementById("trend")) {
    var DIM = { m: 0, r: 1, p: 2, s: 3 };
    var NAMES = { m: D.months, r: D.regions, p: D.products, s: D.segments };
    var sel = { m: document.getElementById("f-month"), r: document.getElementById("f-region"), p: document.getElementById("f-product"), s: document.getElementById("f-segment") };
    var state = { m: "", r: "", p: "", s: "" }, metric = "rev";
    var MLABEL = { rev: "Revenue", pr: "Profit", mg: "Profit margin", u: "Units sold" };
    var dash = document.getElementById("dash"), tip = document.getElementById("tip");

    Object.keys(sel).forEach(function (k) {
      NAMES[k].forEach(function (v, i) { var o = document.createElement("option"); o.value = String(i); o.textContent = v; sel[k].appendChild(o); });
      sel[k].addEventListener("change", function () { state[k] = sel[k].value; update(); });
    });

    var eur = function (v) {
      var a = Math.abs(v);
      if (a >= 1e6) return "€" + (v / 1e6).toFixed(2) + "M";
      if (a >= 1e3) return "€" + (v / 1e3).toFixed(a >= 1e5 ? 0 : 1) + "k";
      return "€" + v.toFixed(0);
    };
    var full = function (v) { return "€" + Math.round(v).toLocaleString("en-IE"); };
    var pct = function (v) { return (v * 100).toFixed(1) + "%"; };
    function fmt(o, key) { return key === "mg" ? pct(val(o, key)) : key === "u" ? Math.round(o.u).toLocaleString("en-IE") : eur(o[key]); }
    function val(o, key) { return key === "mg" ? (o.rev ? o.pr / o.rev : 0) : o[key]; }
    var NS = "http://www.w3.org/2000/svg";
    function el(n, a, txt) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; }

    // rows matching every filter except those listed in `skip`
    function rowsExcept(skip) {
      return D.rows.filter(function (x) {
        for (var k in state) {
          if (skip.indexOf(k) > -1 || state[k] === "") continue;
          if (x[DIM[k]] !== +state[k]) return false;
        }
        return true;
      });
    }
    function blank() { return { u: 0, rev: 0, cost: 0, pr: 0 }; }
    function add(o, x) { o.u += x[4]; o.rev += x[5]; o.cost += x[6]; o.pr += x[7]; }
    function sumBy(rows, idx, n) { var out = []; for (var i = 0; i < n; i++) out.push(blank()); rows.forEach(function (x) { add(out[x[idx]], x); }); return out; }

    function toggle(k, i) { state[k] = state[k] === String(i) ? "" : String(i); update(); }

    /* tooltip */
    function showTip(html, target) {
      tip.innerHTML = html; tip.hidden = false;
      var db = dash.getBoundingClientRect(), tb = target.getBoundingClientRect();
      var x = tb.left - db.left + tb.width / 2, y = tb.top - db.top;
      tip.style.left = "0px"; tip.style.top = "0px";
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      x = Math.max(8, Math.min(db.width - tw - 8, x - tw / 2));
      y = y - th - 10; if (y < 4) y = tb.bottom - db.top + 10;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    }
    function hideTip() { tip.hidden = true; }
    function tipHTML(title, o) {
      return "<strong>" + title + "</strong>" +
        "<span>Revenue <b>" + full(o.rev) + "</b></span>" +
        "<span>Profit <b>" + full(o.pr) + "</b></span>" +
        "<span>Margin <b>" + pct(val(o, "mg")) + "</b></span>" +
        "<span>Units <b>" + Math.round(o.u).toLocaleString("en-IE") + "</b></span>";
    }
    function hover(node, html) {
      node.addEventListener("mouseenter", function () { showTip(html(), node); });
      node.addEventListener("mouseleave", hideTip);
      node.addEventListener("focus", function () { showTip(html(), node); });
      node.addEventListener("blur", hideTip);
    }

    /* KPIs */
    function drawKpis() {
      var t = blank(); rowsExcept([]).forEach(function (x) { add(t, x); });
      document.getElementById("k-rev").textContent = eur(t.rev);
      document.getElementById("k-cost").textContent = eur(t.cost);
      document.getElementById("k-pr").textContent = eur(t.pr);
      document.getElementById("k-mg").textContent = t.rev ? pct(t.pr / t.rev) : "–";
      document.getElementById("k-u").textContent = t.u.toLocaleString("en-IE");
    }

    /* Trend (not filtered by month; selected month highlighted) */
    function drawTrend() {
      var box = document.getElementById("trend"); box.innerHTML = "";
      var m = sumBy(rowsExcept(["m"]), 0, 12);
      var w = box.clientWidth || 900, h = box.clientHeight || 280, pl = 58, pr = 12, pt = 12, pb = 30;
      var raw = Math.max.apply(null, m.map(function (o) { return o.rev; })) || 1;
      var mag = Math.pow(10, Math.floor(Math.log10(raw / 4)));
      var stepv = [1, 2, 2.5, 3, 4, 5, 10].map(function (f) { return f * mag; }).filter(function (v) { return v * 4 >= raw; })[0];
      var max = stepv * 4;
      var svg = el("svg", { viewBox: "0 0 " + w + " " + h, class: "trend-svg" });
      var cw = (w - pl - pr) / 12;
      var X = function (i) { return pl + cw * i + cw / 2; }, Y = function (v) { return pt + (h - pt - pb) * (1 - v / max); };
      for (var g = 0; g <= 4; g++) {
        var v = max * g / 4, y = Y(v);
        svg.appendChild(el("line", { x1: pl, x2: w - pr, y1: y, y2: y, class: "grid" }));
        svg.appendChild(el("text", { x: pl - 10, y: y + 4, class: "axis", "text-anchor": "end" }, eur(v)));
      }
      if (state.m !== "") {
        var si = +state.m;
        svg.appendChild(el("rect", { x: pl + cw * si, y: pt, width: cw, height: h - pt - pb, class: "sel-col" }));
      }
      var every = w < 520 ? 2 : 1;
      D.months.forEach(function (mm, i) {
        if (i % every === 0 || String(i) === state.m) svg.appendChild(el("text", { x: X(i), y: h - 8, class: "axis" + (String(i) === state.m ? " axis-on" : ""), "text-anchor": "middle" }, mm.slice(0, 3)));
      });
      function series(key, cls) {
        var d = m.map(function (o, i) { return (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(o[key]).toFixed(1); }).join(" ");
        svg.appendChild(el("path", { d: d + " L" + X(11) + " " + Y(0) + " L" + X(0) + " " + Y(0) + " Z", class: "area " + cls }));
        svg.appendChild(el("path", { d: d, class: "line " + cls }));
        m.forEach(function (o, i) {
          var on = String(i) === state.m;
          svg.appendChild(el("circle", { cx: X(i), cy: Y(o[key]), r: on ? 6 : 3.5, class: "pt " + cls + (on ? " pt-on" : "") }));
        });
      }
      series("rev", "s-rev"); series("pr", "s-pr");
      var guide = el("line", { x1: 0, x2: 0, y1: pt, y2: h - pb, class: "guide", visibility: "hidden" });
      svg.appendChild(guide);
      m.forEach(function (o, i) {
        var hit = el("rect", { x: pl + cw * i, y: pt, width: cw, height: h - pt - pb, class: "hit", tabindex: "0", role: "button",
          "aria-label": D.months[i] + ": revenue " + full(o.rev) + ", profit " + full(o.pr) + ". Press to filter by this month.",
          "aria-pressed": String(String(i) === state.m) });
        hit.addEventListener("click", function () { toggle("m", i); });
        hit.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle("m", i); } });
        hit.addEventListener("mouseenter", function () { guide.setAttribute("x1", X(i)); guide.setAttribute("x2", X(i)); guide.setAttribute("visibility", "visible"); });
        hit.addEventListener("mouseleave", function () { guide.setAttribute("visibility", "hidden"); });
        hover(hit, function () { return tipHTML(D.months[i], o); });
        svg.appendChild(hit);
      });
      box.appendChild(svg);
    }

    /* Bars (each panel ignores its own filter so you can see and switch the selection) */
    function drawBars(id, k) {
      var box = document.getElementById(id); box.innerHTML = "";
      var names = NAMES[k], g = sumBy(rowsExcept([k]), DIM[k], names.length);
      var vals = g.map(function (o) { return val(o, metric); });
      var max = Math.max.apply(null, vals) || 1;
      var min = metric === "mg" ? Math.min.apply(null, vals) * 0.9 : 0;
      var best = vals.indexOf(Math.max.apply(null, vals));
      g.forEach(function (o, i) {
        var b = document.createElement("button");
        b.type = "button";
        var on = state[k] === String(i), dim = state[k] !== "" && !on;
        b.className = "bar-row" + (i === best ? " top" : "") + (on ? " on" : "") + (dim ? " dim" : "");
        b.setAttribute("aria-pressed", String(on));
        b.setAttribute("aria-label", names[i] + ", " + MLABEL[metric] + " " + fmt(o, metric) + ". Press to " + (on ? "clear filter" : "filter by " + names[i]));
        b.innerHTML = '<span class="bar-name"></span><span class="bar-track"><span class="bar-fill"></span></span><span class="bar-val"></span>';
        b.querySelector(".bar-name").textContent = names[i];
        var share = max > min ? (vals[i] - min) / (max - min) : 1;
        b.querySelector(".bar-fill").style.width = (8 + share * 92).toFixed(1) + "%";
        b.querySelector(".bar-fill").className = "bar-fill m-" + metric;
        b.querySelector(".bar-val").textContent = fmt(o, metric);
        b.addEventListener("click", function () { toggle(k, i); });
        hover(b, function () { return tipHTML(names[i], o); });
        box.appendChild(b);
      });
    }

    /* Heatmap region × product (ignores region and product filters) */
    function drawHeat() {
      var box = document.getElementById("heat"); box.innerHTML = "";
      document.getElementById("heat-title").textContent = MLABEL[metric] + " · region × product";
      var cell = []; for (var r = 0; r < 4; r++) { cell.push([]); for (var p = 0; p < 4; p++) cell[r].push(blank()); }
      rowsExcept(["r", "p"]).forEach(function (x) { add(cell[x[1]][x[2]], x); });
      var vals = []; cell.forEach(function (row) { row.forEach(function (c) { vals.push(val(c, metric)); }); });
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      var head = document.createElement("div"); head.className = "heat-row heat-head"; head.setAttribute("role", "row");
      head.innerHTML = '<span role="columnheader"></span>';
      D.products.forEach(function (p) { var s = document.createElement("span"); s.setAttribute("role", "columnheader"); s.textContent = p; head.appendChild(s); });
      box.appendChild(head);
      cell.forEach(function (row, ri) {
        var line = document.createElement("div"); line.className = "heat-row"; line.setAttribute("role", "row");
        var nm = document.createElement("span"); nm.className = "heat-name"; nm.setAttribute("role", "rowheader"); nm.textContent = D.regions[ri]; line.appendChild(nm);
        row.forEach(function (c, pi) {
          var wrap = document.createElement("span"); wrap.setAttribute("role", "cell");
          var b = document.createElement("button"); b.type = "button";
          var v = val(c, metric), k = hi > lo ? (v - lo) / (hi - lo) : 0.5;
          var on = state.r === String(ri) && state.p === String(pi);
          var dim = (state.r !== "" || state.p !== "") && !((state.r === "" || state.r === String(ri)) && (state.p === "" || state.p === String(pi)));
          b.className = "heat-cell" + (v === hi ? " hi" : "") + (v === lo ? " lo" : "") + (on ? " on" : "") + (dim ? " dim" : "");
          b.style.setProperty("--k", k.toFixed(3));
          b.textContent = fmt(c, metric);
          b.setAttribute("aria-pressed", String(on));
          b.setAttribute("aria-label", D.regions[ri] + " " + D.products[pi] + ": " + MLABEL[metric] + " " + fmt(c, metric) + ". Press to filter.");
          b.addEventListener("click", function () {
            if (on) { state.r = ""; state.p = ""; } else { state.r = String(ri); state.p = String(pi); }
            update();
          });
          hover(b, function () { return tipHTML(D.regions[ri] + " · " + D.products[pi], c); });
          wrap.appendChild(b); line.appendChild(wrap);
        });
        box.appendChild(line);
      });
    }

    /* Filter chips */
    function drawChips() {
      var box = document.getElementById("chips"); box.innerHTML = "";
      var any = false;
      ["m", "r", "p", "s"].forEach(function (k) {
        if (state[k] === "") return;
        any = true;
        var b = document.createElement("button"); b.type = "button"; b.className = "chip";
        b.innerHTML = '<span></span><i aria-hidden="true">×</i>';
        b.querySelector("span").textContent = NAMES[k][+state[k]];
        b.setAttribute("aria-label", "Remove filter " + NAMES[k][+state[k]]);
        b.addEventListener("click", function () { state[k] = ""; update(); });
        box.appendChild(b);
      });
      if (!any) { var s = document.createElement("span"); s.className = "chips-empty"; s.textContent = "No filters: showing all 768 rows"; box.appendChild(s); }
    }

    function update() {
      hideTip();
      Object.keys(sel).forEach(function (k) { sel[k].value = state[k]; });
      drawKpis(); drawTrend();
      drawBars("bar-region", "r"); drawBars("bar-product", "p"); drawBars("bar-segment", "s");
      drawHeat(); drawChips();
    }

    document.querySelectorAll(".metric-toggle button").forEach(function (b) {
      b.addEventListener("click", function () {
        metric = b.getAttribute("data-metric");
        document.querySelectorAll(".metric-toggle button").forEach(function (o) { var on = o === b; o.classList.toggle("is-on", on); o.setAttribute("aria-checked", String(on)); });
        update();
      });
    });
    document.getElementById("f-reset").addEventListener("click", function () { state = { m: "", r: "", p: "", s: "" }; update(); });
    update();
    var lastW = 0, rz;
    window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { var w = document.getElementById("trend").clientWidth; if (w !== lastW) { lastW = w; drawTrend(); } }, 150); });
  }
})();
