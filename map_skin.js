/* =====================================================================
   map_skin.js v3 — renderer 3 giới diện, đọc thẳng dữ liệu chính chủ.
   Giữ nguyên hook map.js: .nk-mk[data-id], .nk-fog[data-r], #nkToken,
   #nkTrail, locked/current/sel, nk-hide-*, pan/zoom viewBox, click ủy quyền.
   Chỉ hiển thị giới diện đang chọn; logic game vẫn thấy toàn bộ 140 điểm.
   ===================================================================== */
(function () {
  "use strict";
  if (window.__nkSkin3) return; window.__nkSkin3 = true;
  var D = window.NK_MAP_DATA; if (!D) return;
  var svg = document.getElementById("nkSvg"); if (!svg) return;
  var W = 1600, H = 1000;
  function realm() { return D.activeRealm || "nhan_gioi"; }
  function inRealm(l) { return (l.realm || "nhan_gioi") === realm(); }
  function seeded(s) { return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function smooth(pts) {
    var n = pts.length, d = "M" + pts[0][0] + " " + pts[0][1];
    for (var i = 0; i < n; i++) { var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += "C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + " " + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + " " + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + " " + p2[0] + " " + p2[1]; }
    return d + "Z";
  }
  function blob(cx, cy, rx, ry, seed, n) { var r = seeded(seed), p = []; n = n || 10;
    for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, w = 1 + .2 * Math.sin(seed * 3.1 + i * 2.7) + .1 * (r() - .5);
      p.push([+(cx + Math.cos(a) * rx * w).toFixed(1), +(cy + Math.sin(a) * ry * w).toFixed(1)]); } return smooth(p); }
  function about(pts, cx, cy, f) { return pts.map(function (p) { return [+(cx + (p[0] - cx) * f).toFixed(1), +(cy + (p[1] - cy) * f).toFixed(1)]; }); }
  function P(a) { return a.map(function (p) { return [p[0] * 16, p[1] * 10]; }); }

  var GEO = {
    nhan_gioi: {
      lands: [P([[6,52],[8,44],[10,38],[13,33],[12,27],[14,21],[17,16],[21,11],[26,8],[31,7],[35,9],[38,13],[40,18],[38,23],[40,27],[43,31],[45,36],[42,40],[44,45],[41,49],[43,54],[40,58],[42,63],[39,67],[41,72],[37,77],[34,82],[30,87],[26,91],[21,93],[16,91],[12,86],[9,80],[8,74],[10,69],[7,64],[8,58]])],
      isleBox: [55, 8, 97, 94], isles: 190,
      macro: [["THIÊN NAM", 17, 58, 0], ["LOẠN TINH HẢI", 78, 12, 0], ["ĐẠI TẤN", 21, 9, 0], ["MỘ LAN THẢO NGUYÊN", 19, 31, 1], ["VIỆT QUỐC", 24, 65, 1]],
      rivers: ["M352 150 q-30 90 10 170 q30 70 -20 150 q-30 70 10 150 q20 60 -10 120", "M560 210 q40 100 -10 190 q-30 80 20 160"],
      ranges: [[[16,20],[20,16],[25,13],[30,15],[33,19]], [[18,36],[23,39],[27,36]], [[15,58],[20,62],[25,60],[30,65]], [[18,72],[23,79],[29,77]], [[14,86],[19,88]]],
      trees: [[12,30,36,45],[13,60,28,92]]
    },
    linh_gioi: {
      lands: [P([[5,40],[8,28],[13,20],[20,14],[28,11],[36,13],[43,17],[48,24],[52,32],[55,40],[53,48],[56,56],[52,62],[48,68],[44,74],[38,80],[30,85],[22,88],[14,85],[9,78],[6,70],[8,62],[5,54],[7,47]]),
              P([[66,20],[72,15],[80,14],[88,17],[94,23],[96,31],[93,39],[95,47],[90,54],[83,58],[75,57],[69,52],[66,45],[68,37],[65,29]]),
              P([[78,66],[84,62],[91,64],[96,70],[95,78],[90,85],[83,88],[77,84],[75,76],[76,70]])],
      isleBox: [56, 6, 66, 94], isles: 46,
      macro: [["PHONG NGUYÊN ĐẠI LỤC", 26, 26, 0], ["LÔI MINH ĐẠI LỤC", 80, 22, 0], ["MAN HOANG", 13, 62, 0], ["HUYẾT THIÊN", 86, 70, 0], ["ĐỊA UYÊN", 52, 76, 1], ["PHONG LÔI HẢI", 60, 12, 1]],
      rivers: ["M480 260 q-40 120 20 220 q40 90 -20 180", "M1240 300 q40 100 -10 190"],
      ranges: [[[38,58],[42,62],[46,66],[40,66]], [[16,16],[20,20],[14,22]], [[44,50],[48,54]]],
      trees: [[10,60,26,84],[48,62,60,74],[20,26,30,36]],
      abyss: [52, 81], bolts: [[58,16],[62,22],[60,28],[64,10]]
    },
    ma_gioi: {
      lands: [P([[14,30],[20,22],[28,18],[37,17],[45,20],[51,26],[54,34],[52,42],[55,50],[51,58],[46,65],[39,70],[31,72],[23,69],[17,63],[13,55],[15,47],[12,39]]),
              P([[60,52],[66,48],[73,50],[78,56],[76,64],[70,70],[63,68],[59,61]])],
      isleBox: [56, 40, 84, 78], isles: 40,
      macro: [["MA GIỚI", 33, 26, 0], ["MA NGUYÊN HẢI", 68, 46, 0], ["HUYỄN DẠ CƯƠNG VỰC", 28, 50, 1]],
      rivers: ["M560 320 q-30 100 20 180 q30 80 -10 150"],
      ranges: [[[36,32],[40,36],[44,32]], [[24,60],[28,64]]],
      trees: [[18,56,34,68]],
      bolts: [[70,58],[74,64],[66,66]]
    }
  };
  var ICON = { "vùng":"◆","đô thị":"★","đảo":"◍","hải vực":"≈","tông môn":"⛩","gia tộc":"⌂","bang hội":"⚑","quân đoàn":"⚔","thương hội":"⚖","bí cảnh":"✦","cấm địa":"☠","động phủ":"⛰","phường thị":"⚖" };
  var TIER_R = { 1: 13, 2: 10, 3: 8, 4: 6 }, TIER_F = { 1: 20, 2: 17, 3: 15, 4: 13 };

  function build() {
    var g = GEO[realm()] || GEO.nhan_gioi, R = seeded(realm() === "nhan_gioi" ? 77 : realm() === "linh_gioi" ? 131 : 211);
    svg.classList.remove("nk-realm-linh", "nk-realm-ma");
    if (realm() === "linh_gioi") svg.classList.add("nk-realm-linh");
    if (realm() === "ma_gioi") svg.classList.add("nk-realm-ma");
    var s = '<defs><linearGradient id="nkSeaGrad" x1="0" y1="0" x2="0" y2="1"><stop class="nk-sea-grad" offset="0"/><stop class="nk-sea-grad2" offset="1"/></linearGradient>' +
      '<linearGradient id="nkLandGrad" x1="0" y1="0" x2="1" y2="1"><stop class="nk-land-hi" offset="0"/><stop class="nk-land-lo" offset="1"/></linearGradient>' +
      '<filter id="nkMist" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="12"/><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="30"/></filter>' +
      '<filter id="nkGrain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .05 0"/></filter>' +
      '<pattern id="nkWaves" width="46" height="26" patternUnits="userSpaceOnUse"><path class="nk-wave" d="M4 14 q6 -7 12 0 q6 7 12 0"/></pattern>' +
      '<marker id="nkArrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="var(--nk-shallow)"/></marker></defs>' +
      '<rect width="1600" height="1000" fill="url(#nkSeaGrad)"/><rect width="1600" height="1000" fill="url(#nkWaves)"/><g id="nkGrid">';
    for (var gx = 160; gx < W; gx += 160) s += '<line class="nk-gridline" x1="' + gx + '" y1="0" x2="' + gx + '" y2="1000"/>';
    for (var gy = 100; gy < H; gy += 100) s += '<line class="nk-gridline" x1="0" y1="' + gy + '" x2="1600" y2="' + gy + '"/>';
    s += '</g><path class="nk-current" d="M900 120 q120 180 40 360 q-60 160 60 320" marker-end="url(#nkArrow)"/>';
    g.lands.forEach(function (pts) {
      var cx = pts.reduce(function (a, p) { return a + p[0]; }, 0) / pts.length, cy = pts.reduce(function (a, p) { return a + p[1]; }, 0) / pts.length, d = smooth(pts);
      s += '<path class="nk-depth" stroke-width="10" opacity=".16" d="' + smooth(about(pts, cx, cy, 1.09)) + '"/>' +
           '<path class="nk-shallow-halo" stroke-width="13" opacity=".33" d="' + d + '"/>' +
           '<path class="nk-coast" d="' + d + '"/>' +
           '<path class="nk-coast-inner" d="' + smooth(about(pts, cx, cy, .965)) + '"/>';
    });
    var named = D.locations.filter(function (l) { return inRealm(l) && /đảo|hải vực/.test(l.loai); });
    var b = g.isleBox;
    for (var i = 0; i < g.isles; i++) {
      var x = b[0] + R() * (b[2] - b[0]), y = b[1] + R() * (b[3] - b[1]);
      if (named.some(function (l) { return Math.hypot(l.x - x, l.y - y) < 3.4; })) continue;
      var sz = .45 + R() * 1.5;
      s += '<path class="nk-isle-deco" d="' + blob(x * 16, y * 10, sz * 16, sz * 10, 100 + i, 8) + '"/>';
    }
    named.forEach(function (l, idx) {
      var rx = (l.tier <= 2 ? 4 : 2.5) * 16, ry = (l.tier <= 2 ? 2.9 : 1.8) * 10;
      s += '<path class="nk-shallow-halo" stroke-width="8" opacity=".3" d="' + blob(l.x * 16, l.y * 10, rx * 1.25, ry * 1.25, 300 + idx, 9) + '"/>' +
           '<path class="nk-isle" d="' + blob(l.x * 16, l.y * 10, rx, ry, 300 + idx, 9) + '"/>';
    });
    (g.ranges || []).forEach(function (range) { range.forEach(function (m, j) { var sc = .9 + (j % 3) * .25;
      s += '<path class="nk-mtn" transform="translate(' + (m[0] * 16 - 10 * sc) + ' ' + (m[1] * 10 - 9 * sc) + ') scale(' + sc + ')" d="M0 16 L8 0 L16 16 M6 16 L12 6 L18 16 M12 16 L17 8 L22 16"/>'; }); });
    (g.trees || []).forEach(function (tb, bi) { var r = seeded(500 + bi);
      for (var t = 0; t < 42; t++) s += '<path class="nk-tree" transform="translate(' + ((tb[0] + r() * (tb[2] - tb[0])) * 16).toFixed(0) + ' ' + ((tb[1] + r() * (tb[3] - tb[1])) * 10).toFixed(0) + ')" d="M0 0 L3 -6 L6 0 Z"/>'; });
    (g.rivers || []).forEach(function (d) { s += '<path class="nk-river" d="' + d + '"/>'; });
    if (g.abyss) { var ax = g.abyss[0] * 16, ay = g.abyss[1] * 10;
      for (var k = 0; k < 5; k++) s += '<ellipse class="nk-abyss" cx="' + ax + '" cy="' + ay + '" rx="' + (26 + k * 20) + '" ry="' + (14 + k * 11) + '" stroke-width="' + (2 - k * .3) + '" opacity="' + (.6 - k * .1) + '"/>';
      s += '<ellipse cx="' + ax + '" cy="' + ay + '" rx="22" ry="12" fill="var(--nk-fogcolor)" opacity=".8"/>'; }
    (g.bolts || []).forEach(function (p, i) { var x = p[0] * 16, y = p[1] * 10;
      s += '<path class="nk-bolt" d="M' + x + ' ' + y + ' l-10 22 l14 -4 l-12 26 l18 -6 l-10 24" opacity="' + (.75 - i * .08) + '"/>'; });
    s += '<g id="nkFogG">';
    D.regions.forEach(function (r, ri) {
      if ((r.realm || "nhan_gioi") !== realm() || !r.gate) return;
      var bx = r.box[0] * 16, by = r.box[1] * 10, bw = (r.box[2] - r.box[0]) * 16, bh = (r.box[3] - r.box[1]) * 10;
      s += '<g class="nk-fog" data-r="' + r.id + '"><path d="' + blob(bx + bw * .5, by + bh * .5, bw * .52, bh * .52, 40 + ri, 9) + '"/></g>';
    });
    s += '</g><g id="nkRegionLbl">';
    g.macro.forEach(function (m) { s += '<text class="nk-region' + (m[3] ? ' sub' : '') + '" x="' + m[1] * 16 + '" y="' + m[2] * 10 + '">' + m[0] + '</text>'; });
    s += '</g><g id="nkRoutes">';
    D.routes.forEach(function (e) {
      var a = null, bb = null;
      for (var i = 0; i < D.locations.length; i++) { if (D.locations[i].id === e[0]) a = D.locations[i]; if (D.locations[i].id === e[1]) bb = D.locations[i]; }
      if (!a || !bb || !inRealm(a) || !inRealm(bb)) return;
      var gate = /tiết điểm|phi thăng|truyền tống|cổ trận/i.test(a.ten + bb.ten);
      var sea = gate ? false : (/đảo|hải vực|cảng/.test(a.loai) || /đảo|hải vực|cảng/.test(bb.loai));
      var mx = (a.x + bb.x) / 2 * 16, my = (a.y + bb.y) / 2 * 10, dx = (bb.x - a.x) * 16, dy = (bb.y - a.y) * 10, L = Math.hypot(dx, dy) || 1;
      s += '<path class="nk-route' + (gate ? ' gate' : sea ? ' sea' : '') + '" d="M' + a.x * 16 + ' ' + a.y * 10 + ' Q' + (mx - dy / L * 18) + ' ' + (my + dx / L * 18) + ' ' + bb.x * 16 + ' ' + bb.y * 10 + '"/>';
    });
    s += '</g><g id="nkMarkers">';
    D.locations.forEach(function (l) {
      if (!inRealm(l)) return;
      var t = l.tier || 3, r = TIER_R[t] || 8, kind = l.ref ? l.ref.kind : "";
      s += '<g class="nk-mk" data-id="' + l.id + '" data-tier="' + t + '" data-kind="' + kind + '" transform="translate(' + l.x * 16 + ' ' + l.y * 10 + ')" tabindex="0" role="button" aria-label="' + l.ten + '">' +
        ((l.danger >= 4 && kind === "biCanh") ? '<circle class="nk-danger-ring" r="' + (r + 5) + '"/>' : '') +
        '<circle class="dot" r="' + r + '"/><text class="ic" font-size="' + (r * 1.15) + '">' + (ICON[l.loai] || "●") + '</text>' +
        '<text class="lbl" x="' + (r + 5) + '" y="4" font-size="' + (TIER_F[t] || 15) + '">' + l.ten + '</text></g>';
    });
    var rm = D.realms.filter(function (r) { return r.id === realm(); })[0] || D.realms[0];
    s += '</g><path id="nkTrail" d=""/><g id="nkToken" style="display:none"><circle r="7"/></g>' +
      '<g class="nk-cartouche" transform="translate(28 26)"><rect width="360" height="64" rx="6"/><rect class="inner" x="5" y="5" width="350" height="54" rx="4"/>' +
      '<text class="t" x="16" y="30">' + rm.ten.toUpperCase() + '</text><text class="s" x="16" y="48">' + rm.sub + ' · địa danh chính chủ từ data game</text></g>' +
      '<g id="nkCompass" transform="translate(1520 90)"><circle r="30" fill="none" stroke="var(--nk-ink2)" stroke-width="1" opacity=".6"/><path d="M0 -30 L6 0 L0 30 L-6 0 Z"/><path d="M-30 0 L0 6 L30 0 L0 -6 Z" opacity=".6"/><text x="-5" y="-38">B</text></g>' +
      '<g transform="translate(40 950)"><rect width="160" height="5" fill="var(--nk-ink2)" opacity=".7"/><rect width="80" height="5" fill="var(--nk-gold)" opacity=".8"/><text x="0" y="22" style="font:600 12px Georgia;fill:var(--nk-ink2)">1 ô ≈ 1 vạn dặm</text></g>' +
      '<rect width="1600" height="1000" filter="url(#nkGrain)" pointer-events="none"/>';
    svg.innerHTML = s;
    applyState();
  }

  function state() { try { return window.NhanGioiMap && window.NhanGioiMap.getState(); } catch (e) { return null; } }
  function applyState() {
    var st = state(); if (!st) return;
    D.regions.forEach(function (r) { var el = svg.querySelector('.nk-fog[data-r="' + r.id + '"]'); if (el) el.classList.toggle("open", st.cg >= r.gate); });
    var cur = null;
    D.locations.forEach(function (l) {
      var g = svg.querySelector('.nk-mk[data-id="' + l.id + '"]'); if (!g) return;
      g.classList.toggle("locked", st.cg < l.gate);
      g.classList.toggle("current", l.id === st.loc);
      g.classList.toggle("sel", l.id === st.sel);
      var pulse = g.querySelector(".nk-pulse");
      if (l.id === st.loc && !pulse) { var c = document.createElementNS("http://www.w3.org/2000/svg", "circle"); c.setAttribute("class", "nk-pulse"); c.setAttribute("r", "10"); g.insertBefore(c, g.firstChild); }
      if (l.id !== st.loc && pulse) pulse.remove();
      if (l.id === st.loc) cur = l;
    });
    var tok = document.getElementById("nkToken");
    if (tok) { if (cur && inRealm(cur) && !st.traveling) { tok.style.display = ""; tok.setAttribute("transform", "translate(" + cur.x * 16 + " " + cur.y * 10 + ")"); } else if (!st.traveling) tok.style.display = "none"; }
  }

  var raf = 0;
  function layout() {
    raf = 0;
    var vb = (svg.getAttribute("viewBox") || "0 0 1600 1000").split(/\s+/).map(Number);
    var vw = vb[2] || W, vx = vb[0] || 0, vy = vb[1] || 0, vh = vb[3] || H;
    var cw = svg.clientWidth || 1200, ch = svg.clientHeight || 750;
    var k = Math.min(4, Math.max(.5, (vw / W) * (1200 / cw)));
    var maxTier = vw > 1150 ? 2 : vw > 650 ? 3 : 4, kept = [];
    var mks = Array.prototype.slice.call(svg.querySelectorAll(".nk-mk"));
    mks.sort(function (a, b) { return (+a.dataset.tier) - (+b.dataset.tier); });
    mks.forEach(function (g) {
      var l = null; for (var i = 0; i < D.locations.length; i++) if (D.locations[i].id === g.dataset.id) l = D.locations[i];
      if (!l) return;
      var t = +g.dataset.tier || 3;
      g.setAttribute("transform", "translate(" + l.x * 16 + " " + l.y * 10 + ") scale(" + k.toFixed(3) + ")");
      var force = g.classList.contains("current") || g.classList.contains("sel"), show = force || t <= maxTier;
      if (show) {
        var fs = (TIER_F[t] || 15) * .75, sx = (l.x * 16 - vx) * cw / vw, sy = (l.y * 10 - vy) * ch / vh;
        var off = ((TIER_R[t] || 8) + 5) * .75, w = l.ten.length * fs * .6, h = fs + 4;
        var box = [sx + off, sy - h / 2, w, h];
        var hit = kept.some(function (b) { return box[0] < b[0] + b[2] && box[0] + box[2] > b[0] && box[1] < b[1] + b[3] && box[1] + box[3] > b[1]; });
        if (hit && !force) show = false; else kept.push(box);
      }
      g.classList.toggle("nk-lbl-off", !show);
    });
  }
  function queue() { if (!raf) raf = requestAnimationFrame(layout); }

  function rebuild() { build(); layout(); syncTabs(); }
  window.__nkSkinRebuild = rebuild;

  /* realm tabs trên header */
  var tabs = document.createElement("div");
  tabs.id = "nkRealmTabs";
  var ctl = document.querySelector("#nkOverlay .nk-ctl") || document.querySelector("#nkOverlay header");
  if (ctl) ctl.insertBefore(tabs, ctl.firstChild);
  function syncTabs() {
    var st = state();
    tabs.innerHTML = "";
    D.realms.forEach(function (r) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = r.id === realm() ? "on" : "";
      b.innerHTML = r.ten + "<small>" + (st && st.cg >= r.gate ? "đã mở" : "cần cảnh giới " + r.gate) + "</small>";
      b.title = r.sub;
      b.onclick = function () { window.NKRealm.set(r.id); };
      tabs.appendChild(b);
    });
  }

  /* legend */
  var wrap = document.getElementById("nkMapWrap");
  var legend = document.createElement("div");
  legend.id = "nkLegend"; legend.className = "nk-scroll";
  legend.innerHTML = '<h4>Chú giải</h4>' +
    '<div class="row"><span class="sw t1"></span> Vùng đất / đô thành trọng yếu</div>' +
    '<div class="row"><span class="sw"></span> Tông môn · gia tộc · thế lực</div>' +
    '<div class="row"><span class="sw bc"></span> Bí cảnh · cấm địa · động phủ</div>' +
    '<div class="row"><span class="sw t3"></span> Đảo / hải vực / điểm nhỏ</div>' +
    '<div class="row"><span class="sw land"></span> Quan đạo / tuyến bộ</div>' +
    '<div class="row"><span class="sw sea"></span> Tuyến hải</div>' +
    '<div class="row"><span class="sw gate"></span> Truyền tống / cửa giới diện</div>' +
    '<div class="row">Sương mờ = vùng chưa đủ cảnh giới mở</div>';
  if (wrap) wrap.appendChild(legend);
  var vc = document.getElementById("nkViewCtl");
  if (vc) { var lb = document.createElement("button"); lb.className = "nk-btn"; lb.type = "button"; lb.textContent = "🧭"; lb.title = "Chú giải";
    lb.onclick = function () { legend.classList.toggle("open"); lb.classList.toggle("on", legend.classList.contains("open")); }; vc.appendChild(lb); }

  /* drawer: hồ sơ chính chủ (bí cảnh thưởng/nguy hiểm, tông môn tu sĩ/công pháp) */
  var din = document.getElementById("nkDrawerIn");
  if (din) new MutationObserver(function () {
    if (din.querySelector(".nk-src")) return;
    var st = state(); if (!st) return;
    var l = null; for (var i = 0; i < D.locations.length; i++) if (D.locations[i].id === st.sel) l = D.locations[i];
    if (!l) return;
    var idx = window.NK_LORE_INDEX || {}, rec = l.ref ? idx[l.ref.id] : null;
    var rm = D.realms.filter(function (r) { return r.id === (l.realm || "nhan_gioi"); })[0];
    var h = '<span class="c1">● ' + (rm ? rm.ten : "Nhân Giới") + ' · ' + (l.ref ? (l.ref.kind === "vungDat" ? "Vùng Đất" : l.ref.kind === "tongMon" ? "Tông Môn / Thế Lực" : "Bí Cảnh") : "Địa danh") + ' · ' + (l.vungId || "") + '</span>';
    if (rec && l.ref.kind === "biCanh") {
      h += '<span class="head">Chu kỳ · phí vào</span><span class="chip meta">' + rec.chuKyMo + '</span><span class="chip meta">' + (rec.phiLinhThach ? rec.phiLinhThach + " LT" : "Miễn phí") + '</span><span class="chip meta">Cảnh giới ' + rec.canhGioiMin + '–' + rec.canhGioiMax + '</span>';
      h += '<span class="head">Phần thưởng</span>' + rec.phanThuongTen.map(function (x) { return '<span class="chip reward">✦ ' + x + '</span>'; }).join("");
      h += '<span class="head">Nguy hiểm</span>' + rec.nguyHiem.map(function (x) { return '<span class="chip risk">☠ ' + x + '</span>'; }).join("");
    } else if (rec && l.ref.kind === "tongMon") {
      h += '<span class="head">Phe · đỉnh cao</span><span class="chip meta">' + rec.phe + '</span><span class="chip meta">Cảnh giới ' + rec.canhGioiCaoNhat + '</span>';
      h += '<span class="head">Tu sĩ tiêu biểu</span>' + rec.tuSiTieuBieu.map(function (x) { return '<span class="chip">' + x + '</span>'; }).join("");
      h += '<span class="head">Công pháp trấn phái</span>' + rec.congPhapTranPhai.map(function (x) { return '<span class="chip reward">' + x + '</span>'; }).join("");
      h += '<span class="head">Đặc sản</span>' + rec.dacSan.map(function (x) { return '<span class="chip reward">✦ ' + x + '</span>'; }).join("");
    } else if (rec && l.ref.kind === "vungDat") {
      h += '<span class="head">Linh khí · phường thị</span><span class="chip meta">×' + rec.linhKhi + '</span><span class="chip meta">' + (rec.coPhuongThi ? "Có phường thị" : "Không phường thị") + '</span><span class="chip meta">Yêu cầu cảnh giới ' + rec.canhGioiYeuCau + '</span>';
    }
    var div = document.createElement("div"); div.className = "nk-src"; div.innerHTML = h; din.appendChild(div);
  }).observe(din, { childList: true });

  build(); layout(); syncTabs();
  new MutationObserver(function (m) { var onlyClass = m.every(function (x) { return x.attributeName === "class"; }); if (!onlyClass) queue(); applyState(); syncTabs(); }).observe(svg, { attributes: true, attributeFilter: ["viewBox"] });
  window.addEventListener("resize", queue);
  document.addEventListener("nk:state", function () { applyState(); queue(); syncTabs(); });
})();