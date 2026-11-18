/* =====================================================================
   Tác giả: Gemini (Antigravity)
   map.js — engine bản đồ Nhân Giới, tự mount, zero-dependency.
   Hỗ trợ nút sự kiện động kiểu Vạn Kiếp Tu Tiên, click di chuyển trên map,
   và đồng bộ 2 chiều qua adapter với game.js.
   API: window.NhanGioiMap.{open,close,getState,setAdapter,sync,focusLocation,focusEvent,refreshEvents,setTheme,reset}
   ===================================================================== */
(function () {
  "use strict";
  if (window.NhanGioiMap) return;
  var D = window.NK_MAP_DATA;
  if (!D) { console.warn("[NK] thiếu map_data.js"); return; }

  /* ---------- state ---------- */
  var KEY = "nk_map_save_v1";
  var evSeq = 0;
  function fresh() {
    return {
      v: 1, cg: 0, tv: 0, lt: 20, months: 0, loc: "loc_thanh_nguu", sel: "loc_thanh_nguu",
      selEv: null, evNodes: [],
      items: {}, trips: 0, kyNgo: 0, log: [], traveling: false, won: false, dead: false,
      speed: 1, muted: false, theme: "dark",
      layers: { labels: true, routes: true, grid: false, fog: true, events: true },
      view: { x: 0, y: 0, w: 1600, h: 1000 }
    };
  }
  var S = fresh();
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var p = JSON.parse(raw);
      if (p && p.v === 1) {
        S = Object.assign(fresh(), p, { traveling: false });
        if (!S.layers) S.layers = fresh().layers;
        if (typeof S.layers.events !== "boolean") S.layers.events = true;
        if (!Array.isArray(S.evNodes)) S.evNodes = [];
      }
    }
  } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  var adapter = null, extMeta = null;
  function hasReadyAdapter() { return Boolean(adapter && adapter.read && extMeta && extMeta.ready); }
  function syncFromAdapter() {
    if (!adapter || !adapter.read) return false;
    try {
      var r = adapter.read();
      if (!r || r.ready === false) {
        extMeta = r || { ready: false };
        return false;
      }
      extMeta = r;
      if (typeof r.linhThach === "number") S.lt = Math.max(0, Math.floor(r.linhThach));
      if (typeof r.tuVi === "number") S.tv = Math.max(0, Math.floor(r.tuVi));
      if (typeof r.canhGioi === "number") S.cg = Math.max(0, Math.min(5, r.canhGioi));
      if (typeof r.months === "number") S.months = Math.max(0, Math.floor(r.months));
      if (r.loc && loc(r.loc).id === r.loc && !S.traveling) {
        if (S.sel === S.loc && !S.selEv) S.sel = r.loc;
        S.loc = r.loc;
      }
      if (typeof r.dead === "boolean") S.dead = r.dead;
      if (typeof r.won === "boolean") S.won = r.won;
      if (r.theme === "light" || r.theme === "dark") {
        S.theme = r.theme;
        if (ov) ov.setAttribute("data-nk-theme", S.theme);
      }
      return true;
    } catch (e) { return false; }
  }
  function syncOut() {
    try {
      if (adapter && adapter.write && hasReadyAdapter()) {
        adapter.write({ linhThach: S.lt, tuVi: S.tv, canhGioi: S.cg, viTri: S.loc });
      }
      document.dispatchEvent(new CustomEvent("nk:state", { detail: { linhThach: S.lt, tuVi: S.tv, canhGioi: S.cg, viTri: S.loc } }));
    } catch (e) {}
  }

  /* ---------- helpers ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function loc(id) { for (var i = 0; i < D.locations.length; i++) if (D.locations[i].id === id) return D.locations[i]; return D.locations[0]; }
  function reg(id) { for (var i = 0; i < D.regions.length; i++) if (D.regions[i].id === id) return D.regions[i]; return D.regions[0]; }
  function findEv(id) { for (var i = 0; i < S.evNodes.length; i++) if (S.evNodes[i].id === id) return S.evNodes[i]; return null; }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function esc(str) { return String(str == null ? "" : str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function realCg() { return hasReadyAdapter() && typeof extMeta.realCanhGioi === "number" ? extMeta.realCanhGioi : S.cg; }
  function age() { return hasReadyAdapter() && typeof extMeta.tuoi === "number" ? extMeta.tuoi : 16 + S.months / 12; }
  function tho() { return hasReadyAdapter() && typeof extMeta.thoNguyen === "number" ? extMeta.thoNguyen : D.thoNguyen[S.cg]; }
  function timeStr(m) {
    if (m == null && hasReadyAdapter() && typeof extMeta.nam === "number") {
      return "Năm " + extMeta.nam + " · T" + (extMeta.thang || 1);
    }
    var mm = (m == null ? S.months : m);
    return "Năm " + (Math.floor(mm / 12) + 1) + " · T" + (mm % 12 + 1);
  }
  function distXY(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function speedTier() { return D.tocDo[Math.max(0, Math.min(5, realCg()))] || 1; }
  function travelMonths(a, b) { return Math.max(1, Math.min(18, Math.round(dist(a, b) * 0.85 / speedTier()))); }
  function eventTravelMonths(a, ev) {
    var base = Math.round(distXY(a.x, a.y, ev.x, ev.y) * 0.7 / speedTier());
    return Math.max(ev.mo || 1, Math.min(8, base));
  }
  function travelCost(m) {
    if (m <= 1) return 1;
    return Math.ceil(m * (hasReadyAdapter() ? Math.max(1, realCg() + 1) * 0.6 : 0.4));
  }
  function unlocked(l) { return l.id === S.loc || realCg() >= l.gate; }
  function isGameBusy() { return hasReadyAdapter() && Boolean(extMeta.busy); }
  function log(msg, kind) { S.log.unshift({ t: timeStr(), msg: msg, kind: kind || "" }); if (S.log.length > 60) S.log.pop(); renderLog(); }

  /* ---------- audio (WebAudio, tied to visible events) ---------- */
  var AC = null, master = null, ambGain = null;
  function audio() {
    if (AC) return AC;
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = S.muted ? 0 : 1; master.connect(AC.destination);
      ambGain = AC.createGain(); ambGain.gain.value = 0; ambGain.connect(master);
      var len = AC.sampleRate * 2, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      var src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
      var lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 320;
      var g = AC.createGain(); g.gain.value = .05;
      src.connect(lp); lp.connect(g); g.connect(ambGain); src.start();
      setInterval(function () { if (!S.muted && overlayOpen) pluck([220, 261.6, 293.7, 329.6, 392][rnd(5)] * (rnd(2) ? 1 : 2), .05); }, 7000);
    } catch (e) { AC = null; }
    return AC;
  }
  function pluck(f, v) { if (!AC || S.muted) return; try {
    var o = AC.createOscillator(), g = AC.createGain(); o.type = "triangle"; o.frequency.value = f;
    g.gain.setValueAtTime(v, AC.currentTime); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + 1.3);
    o.connect(g); g.connect(master); o.start(); o.stop(AC.currentTime + 1.4);
  } catch (e) {} }
  function bell(f) { pluck(f, .12); pluck(f * 2.01, .06); pluck(f * 2.99, .03); }
  function drum() { if (!AC || S.muted) return; try {
    var o = AC.createOscillator(), g = AC.createGain(); o.type = "sine";
    o.frequency.setValueAtTime(120, AC.currentTime); o.frequency.exponentialRampToValueAtTime(45, AC.currentTime + .25);
    g.gain.setValueAtTime(.22, AC.currentTime); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + .35);
    o.connect(g); g.connect(master); o.start(); o.stop(AC.currentTime + .4);
  } catch (e) {} }
  function whoosh() { if (!AC || S.muted) return; try {
    var len = AC.sampleRate * .6, b = AC.createBuffer(1, len, AC.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = b; f.type = "bandpass"; f.frequency.value = 900; g.gain.value = .12;
    s.connect(f); f.connect(g); g.connect(master); s.start();
  } catch (e) {} }
  function setAmb(on) { if (ambGain) try { ambGain.gain.linearRampToValueAtTime(on && !S.muted ? 1 : 0, AC.currentTime + .6); } catch (e) {} }

  /* ---------- DOM ---------- */
  var overlayOpen = false;
  var launcher = document.createElement("button");
  launcher.id = "nkLauncher"; launcher.type = "button"; launcher.textContent = "🗺️ Bản Đồ Nhân Giới";
  document.body.appendChild(launcher);

  var ov = document.createElement("div");
  ov.id = "nkOverlay"; ov.hidden = true; ov.setAttribute("data-nk-theme", S.theme);
  ov.innerHTML =
    '<header><h1>Nhân Giới · Phàm Nhân Tu Tiên<small>Click địa danh hoặc nút sự kiện động để độn quang & kích hoạt cơ duyên</small></h1>' +
    '<div class="nk-hud">' +
      '<span class="nk-chip">🕯️ <b id="nkAge"></b></span>' +
      '<span class="nk-chip">⚡ <b id="nkCg"></b><span class="bar"><i id="nkTvBar"></i></span><b id="nkTv"></b></span>' +
      '<span class="nk-chip">💎 <b id="nkLt"></b> LT</span>' +
      '<span class="nk-chip">📍 <b id="nkPos"></b></span>' +
    '</div>' +
    '<div class="nk-ctl nk-scroll">' +
      '<button class="nk-btn gold" id="nkScan" title="Dò tìm lại các điểm sự kiện trên bản đồ (1 tháng)">🔄 Dò cơ duyên</button>' +
      '<select id="nkSpeed" class="nk-btn" title="Tốc độ độn quang"><option value="1">×1</option><option value="2">×2</option><option value="4">×4</option></select>' +
      '<button class="nk-btn" id="nkAudio"></button>' +
      '<button class="nk-btn" id="nkTheme">🌓Theme</button>' +
      '<button class="nk-btn" id="nkLayersBtn">🗂️ Lớp</button>' +
      '<button class="nk-btn" id="nkExport">⬇ Save</button>' +
      '<button class="nk-btn" id="nkImport">⬆ Save</button>' +
      '<button class="nk-btn danger" id="nkReset">↺ Kiếp mới</button>' +
      '<button class="nk-btn" id="nkClose">✕ Đóng</button>' +
      '<input type="file" id="nkFile" accept=".json,application/json" hidden>' +
    '</div></header>' +
    '<div id="nkBody"><div id="nkMapWrap">' +
      '<svg id="nkSvg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid meet" aria-label="Bản đồ Nhân Giới"></svg>' +
      '<div id="nkProgress"></div>' +
      '<div id="nkViewCtl"><button class="nk-btn" id="nkZin">＋</button><button class="nk-btn" id="nkZout">－</button><button class="nk-btn" id="nkZreset">⟲</button></div>' +
      '<div id="nkLayers" class="nk-scroll">' +
        '<label><input type="checkbox" data-l="labels"> Địa danh</label>' +
        '<label><input type="checkbox" data-l="routes"> Tuyến đường</label>' +
        '<label><input type="checkbox" data-l="events"> Sự kiện động</label>' +
        '<label><input type="checkbox" data-l="grid"> Lưới tọa độ</label>' +
        '<label><input type="checkbox" data-l="fog"> Sương phong ấn</label>' +
      '</div>' +
    '</div>' +
    '<aside id="nkDrawer"><div class="inner nk-scroll" id="nkDrawerIn"></div></aside></div>' +
    '<div id="nkLog" class="nk-scroll"></div>' +
    '<div id="nkToast"></div>' +
    '<div class="nk-modal" id="nkEnc" hidden><div class="nk-card nk-scroll"><h3 id="nkEncT">Kỳ Ngộ</h3><p id="nkEncP"></p><div class="fx" id="nkEncFx"></div><div class="row" id="nkEncRow"></div></div></div>' +
    '<div class="nk-modal" id="nkEnd" hidden><div class="nk-card nk-scroll"><h3 id="nkEndT"></h3><p id="nkEndP"></p><div class="row"><button class="nk-btn gold" id="nkEndRestart">↺ Nhập kiếp mới</button><button class="nk-btn" id="nkEndClose">Ở lại nhân giới</button></div></div></div>' +
    '<div class="nk-modal" id="nkConfirm" hidden><div class="nk-card"><h3>Tán công trùng tu?</h3><p>Xóa toàn bộ tu vi, linh thạch và biên niên lữ hành hiện tại. Hành động này không thể hoàn tác.</p><div class="row"><button class="nk-btn danger" id="nkYes">Tán công</button><button class="nk-btn" id="nkNo">Giữ lại</button></div></div></div>';
  document.body.appendChild(ov);

  /* ---------- SVG build ---------- */
  var svg = $("#nkSvg");
  function islePath(cx, cy, rx, ry, seed) {
    var pts = [], n = 10;
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2;
      var w = 1 + .22 * Math.sin(seed * 3.7 + i * 2.3);
      pts.push((cx + Math.cos(a) * rx * w).toFixed(1) + " " + (cy + Math.sin(a) * ry * w).toFixed(1));
    }
    return "M" + pts.join("L") + "Z";
  }
  var CONT = [[6,52],[9,40],[13,33],[12,24],[17,16],[22,10],[28,7],[34,9],[38,14],[41,20],[38,26],[42,30],[45,36],[41,42],[44,48],[40,54],[43,60],[39,66],[42,72],[37,78],[33,84],[28,90],[22,93],[16,90],[12,84],[8,78],[10,70],[6,64],[8,58]];
  var ISLES = [[72,52,7,5,1],[74,47,3,2,2],[68,60,3.5,2.5,3],[78,44,3,2,4],[66,46,2.5,2,5],[70,66,3,2,6],[88,30,4,3,7],[90,62,3.5,2.5,8],[84,78,3,2.5,9],[60,22,2.5,2,10],[56,50,2,1.5,11],[94,44,2,1.5,12],[80,16,2.5,1.8,13],[62,84,2.5,1.8,14],[86,90,2,1.5,15],[50,50,1.6,1.2,16]];
  var MTN = [[16,20],[20,16],[26,13],[31,17],[24,24],[18,36],[23,40],[28,37],[15,58],[20,62],[26,60],[31,66],[18,72],[24,80],[30,78],[35,70],[14,86],[66,45],[72,50],[76,46],[88,29],[90,61],[84,77]];
  var ICON = { "trấn": "●", "thành": "◆", "đô thị": "★", "tông môn": "⛩", "cấm địa": "☠", "cốc": "▲", "đảo": "◍", "đảo hoang": "◍", "hải vực": "≈", "cảng": "⚓", "quan ải": "⚑", "thảo nguyên": "≋", "vương trướng": "⛺", "cung điện": "♛", "thánh cung": "♛", "phường thị": "⚖", "chiến trường": "⚔", "thành bảo": "⛨" };
  function buildSvg() {
    var s = '<defs>' +
      '<filter id="nkGrain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .06 0"/></filter>' +
      '<filter id="nkRough"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="7"/><feDisplacementMap in="SourceGraphic" scale="7"/></filter>' +
      '<pattern id="nkWaves" width="46" height="26" patternUnits="userSpaceOnUse"><path class="nk-wave" d="M4 14 q6 -7 12 0 q6 7 12 0"/></pattern>' +
      '</defs>' +
      '<rect x="0" y="0" width="1600" height="1000" fill="var(--nk-sea)"/>' +
      '<rect x="0" y="0" width="1600" height="1000" fill="url(#nkWaves)"/>' +
      '<g id="nkGrid">';
    for (var gx = 160; gx < 1600; gx += 160) s += '<line class="nk-gridline" x1="' + gx + '" y1="0" x2="' + gx + '" y2="1000"/>';
    for (var gy = 100; gy < 1000; gy += 100) s += '<line class="nk-gridline" x1="0" y1="' + gy + '" x2="1600" y2="' + gy + '"/>';
    s += '</g><g filter="url(#nkRough)">' +
      '<path class="nk-coast" d="M' + CONT.map(function (p) { return (p[0] * 16) + " " + (p[1] * 10); }).join("L") + 'Z"/>';
    ISLES.forEach(function (i) { s += '<path class="nk-isle" d="' + islePath(i[0] * 16, i[1] * 10, i[2] * 16, i[3] * 10, i[4]) + '"/>'; });
    s += '</g><g>';
    MTN.forEach(function (m) { s += '<path class="nk-mtn" transform="translate(' + (m[0] * 16 - 9) + ' ' + (m[1] * 10 - 8) + ')" d="M0 14 L7 0 L14 14 M5 14 L10 5 L15 14"/>'; });
    s += '<path class="nk-river" d="M352 160 q-30 90 10 170 q30 70 -20 150 q-30 70 10 140"/>' +
         '<path class="nk-river" d="M560 220 q40 100 -10 190 q-30 80 20 160"/></g>' +
      '<g id="nkFogG">';
    D.regions.forEach(function (r) {
      s += '<rect class="nk-fog" data-r="' + r.id + '" x="' + (r.box[0] * 16) + '" y="' + (r.box[1] * 10) + '" width="' + ((r.box[2] - r.box[0]) * 16) + '" height="' + ((r.box[3] - r.box[1]) * 10) + '" rx="26"/>';
    });
    s += '</g><g id="nkRegionLbl">';
    D.regions.forEach(function (r) { s += '<text class="nk-region" x="' + (r.label[0] * 16) + '" y="' + (r.label[1] * 10) + '">' + r.ten + '</text>'; });
    s += '</g><g id="nkRoutes">';
    D.routes.forEach(function (e) {
      var a = loc(e[0]), b = loc(e[1]);
      var mx = (a.x + b.x) / 2 * 16, my = (a.y + b.y) / 2 * 10;
      var dx = (b.x - a.x) * 16, dy = (b.y - a.y) * 10, L = Math.hypot(dx, dy) || 1;
      s += '<path class="nk-route" d="M' + (a.x * 16) + ' ' + (a.y * 10) + ' Q' + (mx - dy / L * 22) + ' ' + (my + dx / L * 22) + ' ' + (b.x * 16) + ' ' + (b.y * 10) + '"/>';
    });
    s += '</g><g id="nkMarkers">';
    D.locations.forEach(function (l) {
      s += '<g class="nk-mk" data-id="' + l.id + '" transform="translate(' + (l.x * 16) + ' ' + (l.y * 10) + ')" tabindex="0" role="button" aria-label="' + esc(l.ten) + '">' +
        '<circle class="dot" r="9"/><text class="ic">' + (ICON[l.loai] || "●") + '</text>' +
        '<text class="lbl" x="13" y="4">' + esc(l.ten) + '</text></g>';
    });
    s += '</g><g id="nkEvNodes"></g><path id="nkTrail" d=""/><g id="nkToken" style="display:none"><circle r="7"/></g>' +
      '<g id="nkCompass" transform="translate(70 90)"><path d="M0 -34 L8 0 L0 34 L-8 0 Z"/><path d="M-34 0 L0 8 L34 0 L0 -8 Z" opacity=".6"/><text x="-5" y="-42" style="font:700 15px Georgia">B</text></g>' +
      '<g transform="translate(60 950)"><rect width="160" height="5" fill="var(--nk-ink2)" opacity=".7"/><text x="0" y="22" style="font:600 12px Georgia;fill:var(--nk-ink2)">1 ô ≈ 1 vạn dặm</text></g>' +
      '<rect x="0" y="0" width="1600" height="1000" filter="url(#nkGrain)" pointer-events="none"/>';
    svg.innerHTML = s;
  }
  buildSvg();

  /* ---------- dynamic event nodes (VKTT style) ---------- */
  function pointFree(nx, ny, existing) {
    for (var i = 0; i < D.locations.length; i++) {
      if (distXY(nx, ny, D.locations[i].x, D.locations[i].y) < 2.2) return false;
    }
    for (var j = 0; j < existing.length; j++) {
      if (distXY(nx, ny, existing[j].x, existing[j].y) < 2.4) return false;
    }
    return true;
  }

  function ensureEventNodes(forceRefresh) {
    if (!Array.isArray(D.dynamicNodes) || !D.dynamicNodes.length) { S.evNodes = []; return []; }
    if (forceRefresh) { S.evNodes = []; S.selEv = null; }
    S.evNodes = (S.evNodes || []).filter(function (n) {
      if (!n || !n.id || !n.baseLocId) return false;
      var l = loc(n.baseLocId);
      return unlocked(l) && (typeof n.expMonths !== "number" || n.expMonths > S.months);
    });
    if (S.selEv && !findEv(S.selEv)) S.selEv = null;

    var unlockedLocs = D.locations.filter(function (l) { return unlocked(l) && l.id !== "loc_truyen_tong"; });
    if (!unlockedLocs.length) return S.evNodes;
    var targetCount = Math.min(7, Math.max(4, Math.floor(unlockedLocs.length * 0.55)));
    var tries = 0;
    while (S.evNodes.length < targetCount && tries < 36) {
      tries++;
      var baseLoc = S.evNodes.length === 0 ? loc(S.loc) : unlockedLocs[rnd(unlockedLocs.length)];
      if (!unlocked(baseLoc)) baseLoc = unlockedLocs[rnd(unlockedLocs.length)];
      var tmpls = D.dynamicNodes.filter(function (t) { return baseLoc.danger >= (t.minDanger || 0); });
      if (!tmpls.length) tmpls = [D.dynamicNodes[0]];
      var tmpl = tmpls[rnd(tmpls.length)];
      var nx = baseLoc.x + 2.5, ny = baseLoc.y - 2.3;
      for (var aTry = 0; aTry < 10; aTry++) {
        var ang = Math.random() * Math.PI * 2;
        var rad = 2.6 + Math.random() * 3.8;
        var tx = Math.min(93, Math.max(8, +(baseLoc.x + Math.cos(ang) * rad).toFixed(1)));
        var ty = Math.min(91, Math.max(9, +(baseLoc.y + Math.sin(ang) * rad).toFixed(1)));
        if (pointFree(tx, ty, S.evNodes)) { nx = tx; ny = ty; break; }
      }
      var tenPool = tmpl.tenPool || ["Cơ Duyên Ẩn"];
      S.evNodes.push({
        id: "ev_" + Date.now().toString(36) + "_" + (++evSeq),
        kind: tmpl.kind,
        badge: tmpl.badge,
        icon: tmpl.icon,
        ten: tenPool[rnd(tenPool.length)],
        moTa: tmpl.moTa,
        baseLocId: baseLoc.id,
        vung: baseLoc.vung,
        vungId: baseLoc.vungId || "kinh_chau",
        danger: Math.max(baseLoc.danger || 0, tmpl.minDanger || 0),
        lx: baseLoc.lx || 1,
        x: nx,
        y: ny,
        mo: tmpl.mo || 1,
        expMonths: S.months + 24 + rnd(48)
      });
    }
    return S.evNodes;
  }

  /* ---------- render ---------- */
  function renderLog() {
    $("#nkLog").innerHTML = S.log.map(function (e) {
      return '<div class="e"><span class="t">' + e.t + '</span><span class="' + e.kind + '">' + e.msg + '</span></div>';
    }).join("") || '<div class="e"><span class="t">—</span><span>Biên niên lữ hành trống. Click địa danh hoặc điểm sự kiện trên bản đồ để khởi hành.</span></div>';
  }
  function updateHUD() {
    var ready = syncFromAdapter();
    $("#nkAge").textContent = Math.floor(age()) + " / " + tho() + " thọ";
    if (ready) {
      $("#nkCg").textContent = extMeta.canhGioiTen || D.canhGioi[S.cg];
      var tvCan = Math.max(1, extMeta.tuViCan || 80);
      $("#nkTvBar").style.width = Math.min(100, Math.round(S.tv / tvCan * 100)) + "%";
      $("#nkTv").textContent = S.tv.toLocaleString() + "/" + tvCan.toLocaleString();
      $("#nkExport").hidden = true;
      $("#nkImport").hidden = true;
      $("#nkReset").hidden = true;
    } else {
      $("#nkCg").textContent = D.canhGioi[S.cg];
      var next = S.cg < 5 ? D.tuViNgưỡng[S.cg + 1] : D.tuViNgưỡng[5];
      var base = D.tuViNgưỡng[S.cg];
      $("#nkTvBar").style.width = Math.min(100, (S.tv - base) / Math.max(1, next - base) * 100) + "%";
      $("#nkTv").textContent = S.tv + (S.cg < 5 ? "/" + next : " MAX");
      $("#nkExport").hidden = false;
      $("#nkImport").hidden = false;
      $("#nkReset").hidden = false;
    }
    $("#nkLt").textContent = S.lt.toLocaleString();
    $("#nkPos").textContent = loc(S.loc).ten;
    $("#nkAudio").textContent = S.muted ? "🔕 Âm tắt" : "🔔 Âm bật";
    $("#nkAudio").classList.toggle("on", !S.muted);
    $("#nkSpeed").value = String(S.speed);
  }
  function renderEventNodesLayer() {
    var g = $("#nkEvNodes");
    if (!g) return;
    ensureEventNodes(false);
    g.innerHTML = S.evNodes.map(function (ev) {
      var sel = ev.id === S.selEv ? " sel" : "";
      return '<g class="nk-ev-node k-' + ev.kind + sel + '" data-ev="' + ev.id + '" transform="translate(' + (ev.x * 16) + ' ' + (ev.y * 10) + ')" tabindex="0" role="button" aria-label="' + esc(ev.ten) + '">' +
        '<circle class="ev-ring" r="10"/><circle class="ev-dot" r="8"/><text class="ev-ic">' + ev.icon + '</text>' +
        '<text class="ev-lbl" x="12" y="4">' + esc(ev.ten) + '</text></g>';
    }).join("");
  }
  function updateMap() {
    var cls = [];
    if (!S.layers.labels) cls.push("nk-hide-labels");
    if (!S.layers.routes) cls.push("nk-hide-routes");
    if (!S.layers.grid) cls.push("nk-hide-grid");
    if (!S.layers.fog) cls.push("nk-hide-fog");
    if (!S.layers.events) cls.push("nk-hide-events");
    svg.setAttribute("class", cls.join(" "));
    svg.setAttribute("viewBox", S.view.x + " " + S.view.y + " " + S.view.w + " " + S.view.h);
    D.regions.forEach(function (r) {
      var el = svg.querySelector('.nk-fog[data-r="' + r.id + '"]');
      if (el) el.classList.toggle("open", realCg() >= r.gate);
    });
    D.locations.forEach(function (l) {
      var g = svg.querySelector('.nk-mk[data-id="' + l.id + '"]');
      if (!g) return;
      g.classList.toggle("locked", !unlocked(l));
      g.classList.toggle("current", l.id === S.loc);
      g.classList.toggle("sel", !S.selEv && l.id === S.sel);
      var pulse = g.querySelector(".nk-pulse");
      if (l.id === S.loc && !pulse) {
        var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("class", "nk-pulse"); c.setAttribute("r", "10"); g.insertBefore(c, g.firstChild);
      }
      if (l.id !== S.loc && pulse) pulse.remove();
    });
    renderEventNodesLayer();
    var t = $("#nkToken"), cur = loc(S.loc);
    if (!S.traveling) { t.style.display = ""; t.setAttribute("transform", "translate(" + (cur.x * 16) + " " + (cur.y * 10) + ")"); }
  }
  function fxHtml(e) {
    var h = "";
    if (e.lt) h += '<span class="' + (e.lt > 0 ? "lt" : "dn") + '">' + (e.lt > 0 ? "+" : "") + e.lt + " LT</span>";
    if (e.tv) h += '<span class="up">+' + Number(e.tv).toLocaleString("vi-VN") + " tu vi</span>";
    if (e.hp) h += '<span class="up">+' + Number(e.hp).toLocaleString("vi-VN") + " Khí huyết</span>";
    if (e.tho) h += '<span class="dn">−' + e.tho + (hasReadyAdapter() ? " năm tổn thọ" : " năm thọ") + "</span>";
    if (e.mo) h += '<span class="dn">+' + e.mo + " tháng</span>";
    if (e.itemTen || e.item) h += '<span class="it">✦ ' + esc(e.itemTen || e.item) + '</span>';
    return h || '<span class="up">Bình an vô sự</span>';
  }
  function renderDrawer() {
    var busy = isGameBusy();
    var ev = S.selEv ? findEv(S.selEv) : null;
    if (ev) {
      var base = loc(ev.baseLocId), rEv = reg(ev.vung), cur = loc(S.loc);
      var mEv = eventTravelMonths(cur, ev), cEv = travelCost(mEv);
      var hEv = '<div class="nk-crumb">' + rEv.ten + ' · Gần ' + esc(base.ten) + '</div><h2>' + ev.icon + ' ' + esc(ev.ten) + '</h2>' +
        '<div class="nk-badges"><span class="nk-badge d' + Math.min(5, ev.danger) + '">' + esc(ev.badge) + '</span>' +
        '<span class="nk-badge">Nguy hiểm ' + "★".repeat(Math.max(1, ev.danger)) + '</span>' +
        '<span class="nk-badge lx">Linh khí ×' + ev.lx + '</span></div>' +
        '<div class="nk-lore">' + esc(ev.moTa) + '</div>' +
        '<div class="nk-preview"><div><span>Thời gian</span><b>' + mEv + ' tháng</b></div><div><span>Lộ phí</span><b>' + cEv + ' LT</b></div><div><span>Khoảng cách</span><b>' + Math.round(distXY(cur.x, cur.y, ev.x, ev.y)) + ' ô</b></div></div>' +
        '<div class="nk-actions">' +
          '<button class="nk-btn gold" id="nkGoEv"' + (S.traveling || S.lt < cEv || S.won || S.dead || busy ? " disabled" : "") + '>⚡ Độn quang tới điểm sự kiện (' + mEv + ' tháng)</button>' +
          (busy ? '<button class="nk-btn" disabled>⚠️ Hãy xử lý trận chiến / sự kiện đang mở trước</button>' : "") +
          (S.lt < cEv ? '<button class="nk-btn" disabled>Thiếu linh thạch lộ phí</button>' : "") +
          '<button class="nk-btn" id="nkBackLoc">← Xem địa danh ' + esc(base.ten) + '</button>' +
        '</div>';
      $("#nkDrawerIn").innerHTML = hEv;
      var goEv = $("#nkGoEv"); if (goEv) goEv.onclick = function () { travelToEvent(ev.id); };
      var backLoc = $("#nkBackLoc"); if (backLoc) backLoc.onclick = function () { S.selEv = null; S.sel = ev.baseLocId; updateMap(); renderDrawer(); save(); };
      return;
    }

    var l = loc(S.sel), r = reg(l.vung), here = l.id === S.loc, lock = !unlocked(l);
    var m = travelMonths(loc(S.loc), l), c = travelCost(m);
    var nearbyEvs = S.evNodes.filter(function (n) { return n.baseLocId === l.id; });
    var h = '<div class="nk-crumb">' + r.ten + " · " + l.loai + '</div><h2>' + esc(l.ten) + '</h2>' +
      '<div class="nk-badges"><span class="nk-badge d' + l.danger + '">Nguy hiểm ' + "★".repeat(Math.max(1, l.danger)) + '</span>' +
      '<span class="nk-badge lx">Linh khí ×' + l.lx + '</span>' +
      '<span class="nk-badge">' + (lock ? "🔒 Cần " + D.canhGioi[l.gate] : "Đã mở") + '</span></div>' +
      '<div class="nk-lore">' + esc(l.moTa) + '</div>';
    if (!here) {
      h += '<div class="nk-preview"><div><span>Thời gian</span><b>' + m + ' tháng</b></div><div><span>Lộ phí</span><b>' + c + ' LT</b></div><div><span>Khoảng cách</span><b>' + Math.round(dist(loc(S.loc), l)) + ' ô</b></div></div>' +
        '<div class="nk-actions"><button class="nk-btn gold" id="nkGo"' + (lock || S.traveling || S.lt < c || S.won || S.dead || busy ? " disabled" : "") + '>🚀 Độn quang đến ' + esc(l.ten) + '</button>' +
        (lock ? '<button class="nk-btn" disabled>🔒 Phong ấn — cần ' + D.canhGioi[l.gate] + '</button>' : "") +
        (busy ? '<button class="nk-btn" disabled>⚠️ Hãy xử lý trận chiến / sự kiện đang mở trước</button>' : "") +
        (S.lt < c && !lock ? '<button class="nk-btn" disabled>Thiếu linh thạch — nhận ủy thác hoặc bế quan</button>' : "") + '</div>';
    } else {
      var beGain = hasReadyAdapter() && extMeta.beQuan12Preview ? extMeta.beQuan12Preview : Math.round(24 * l.lx * (1 + S.cg * .35));
      h += '<div class="nk-actions">' +
        '<button class="nk-btn gold" id="nkBe"' + (S.traveling || S.won || S.dead || busy ? " disabled" : "") + '>🧘 Bế quan 12 tháng (+' + beGain.toLocaleString() + ' tu vi)</button>' +
        (/thành|đô thị|phường thị|cảng|trấn/.test(l.loai) ? '<button class="nk-btn" id="nkUy"' + (S.traveling || S.won || S.dead || busy ? " disabled" : "") + '>📜 Nhận ủy thác (3 tháng, +Linh thạch)</button>' : "") +
        (l.loai === "cấm địa" ? '<button class="nk-btn danger" id="nkTham"' + (S.traveling || S.won || S.dead || busy ? " disabled" : "") + '>☠ Thám hiểm cấm địa (6 tháng, thưởng ×1.8)</button>' : "") +
        (hasReadyAdapter() && adapter.onOpenLocalPanel ? '<button class="nk-btn" id="nkLocal">🏛️ Vào Địa Phương (Cửa hàng · Tông môn · Bí cảnh)</button>' : "") +
        (!hasReadyAdapter() && l.id === "loc_truyen_tong" && S.cg >= 5 ? '<button class="nk-btn gold" id="nkPhi">🌌 PHI THĂNG LINH GIỚI</button>' : "") +
        '</div>';
      if (!hasReadyAdapter()) {
        var items = Object.keys(S.items);
        if (items.length) h += '<div class="nk-sec">Túi đồ lữ hành</div><div class="nk-items">' + items.map(function (i) { return '<span class="nk-item">' + esc(i) + (S.items[i] > 1 ? " ×" + S.items[i] : "") + '</span>'; }).join("") + '</div>';
      }
    }
    if (nearbyEvs.length) {
      h += '<div class="nk-sec">Điểm sự kiện quanh ' + esc(l.ten) + '</div><div class="nk-actions">';
      nearbyEvs.forEach(function (nev) {
        h += '<button class="nk-btn" data-pick-ev="' + nev.id + '">' + nev.icon + ' ' + esc(nev.ten) + '</button>';
      });
      h += '</div>';
    }
    $("#nkDrawerIn").innerHTML = h;
    var go = $("#nkGo"); if (go) go.onclick = function () { travelTo(l.id); };
    var be = $("#nkBe"); if (be) be.onclick = beQuan;
    var uy = $("#nkUy"); if (uy) uy.onclick = uyThac;
    var th = $("#nkTham"); if (th) th.onclick = function () { advanceMonths(6); rollEncounter(l, true); after(); };
    var locBtn = $("#nkLocal"); if (locBtn) locBtn.onclick = function () { close(); if (adapter && adapter.onOpenLocalPanel) adapter.onOpenLocalPanel(l); };
    var ph = $("#nkPhi"); if (ph) ph.onclick = win;
    Array.prototype.forEach.call(document.querySelectorAll("[data-pick-ev]"), function (b) {
      b.onclick = function () { S.selEv = b.getAttribute("data-pick-ev"); updateMap(); renderDrawer(); save(); };
    });
  }
  function updateAll() { updateHUD(); updateMap(); renderDrawer(); save(); syncOut(); }

  /* ---------- progression ---------- */
  function checkBreak() {
    if (hasReadyAdapter()) return;
    while (S.cg < 5 && S.tv >= D.tuViNgưỡng[S.cg + 1]) {
      S.cg++;
      log("⚡ ĐỘT PHÁ — " + D.canhGioi[S.cg] + "! Thọ nguyên tăng lên " + tho() + " năm.", "gold");
      bell(392); bell(523);
      D.regions.forEach(function (r) { if (r.gate === S.cg) log("🌫️ Sương phong ấn tan: " + r.ten + " đã mở.", "info"); });
      toast("⚡ Đột phá " + D.canhGioi[S.cg] + "!");
    }
  }
  function checkEnd() {
    if (hasReadyAdapter()) { syncFromAdapter(); return; }
    if (!S.dead && age() >= tho()) {
      S.dead = true; drum();
      $("#nkEndT").textContent = "Thọ Nguyên Cạn Kiệt";
      $("#nkEndP").textContent = "Năm " + (Math.floor(S.months / 12) + 1) + ", tuổi " + Math.floor(age()) + ". Đạo đồ " + D.canhGioi[S.cg] + " tọa hóa giữa đường lữ hành — " + S.trips + " chuyến, " + S.kyNgo + " kỳ ngộ, " + S.lt + " linh thạch để lại cho người sau. Thiên đạo vô tình, kiếp sau cẩn trọng hơn.";
      $("#nkEnd").hidden = false;
    }
  }
  function after() { checkBreak(); checkEnd(); ensureEventNodes(false); updateAll(); }
  function advanceMonths(m) {
    if (!m || m <= 0) return;
    if (hasReadyAdapter() && adapter.onAdvanceMonths) {
      adapter.onAdvanceMonths(m);
      syncFromAdapter();
    } else {
      S.months += m;
    }
  }
  function apply(e, contextLoc) {
    S.kyNgo++;
    if (hasReadyAdapter() && adapter.onApplyReward) {
      var res = adapter.onApplyReward(e, contextLoc || loc(S.loc));
      syncFromAdapter();
      return res || e;
    }
    if (e.lt) S.lt = Math.max(0, S.lt + e.lt);
    if (e.tv) S.tv += e.tv;
    if (e.mo) S.months += e.mo;
    if (e.tho) S.months += e.tho * 12;
    if (e.item) S.items[e.item] = (S.items[e.item] || 0) + 1;
    return e;
  }

  function showEncModal(title, text, fxObj, choices) {
    drum();
    $("#nkEncT").textContent = title;
    $("#nkEncP").textContent = text;
    if (choices && choices.length) {
      $("#nkEncFx").innerHTML = "";
      $("#nkEncRow").innerHTML = "";
      choices.forEach(function (ch) {
        var b = document.createElement("button");
        b.className = "nk-btn " + (ch.cls || "gold");
        b.textContent = ch.label;
        b.onclick = function () {
          if (ch.action) {
            var resAct = ch.action();
            if (resAct === "closeMap") return;
            $("#nkEncFx").innerHTML = fxHtml(resAct || {});
            log("✦ " + title + " → " + ch.label, "gold");
          } else {
            var eApplied = apply(Object.assign({}, ch.e), ch.loc);
            log("✦ " + text + " → " + ch.label, "gold");
            $("#nkEncFx").innerHTML = fxHtml(eApplied);
          }
          $("#nkEncRow").innerHTML = "";
          var ok = document.createElement("button"); ok.className = "nk-btn"; ok.textContent = "Tiếp tục lữ hành";
          ok.onclick = function () { $("#nkEnc").hidden = true; after(); };
          $("#nkEncRow").appendChild(ok);
        };
        $("#nkEncRow").appendChild(b);
      });
    } else {
      var applied = apply(Object.assign({}, fxObj));
      log("✦ " + text, applied.tho ? "bad" : "good");
      $("#nkEncFx").innerHTML = fxHtml(applied);
      $("#nkEncRow").innerHTML = '<button class="nk-btn gold" id="nkEncOk">Tiếp tục lữ hành</button>';
      $("#nkEncOk").onclick = function () { $("#nkEnc").hidden = true; after(); };
    }
    $("#nkEnc").hidden = false;
  }

  function rollEncounter(l, explore) {
    var tier = Math.min(5, l.danger + (explore ? 1 : 0));
    var pool = D.encounters[tier] || D.encounters[0];
    var enc = pool[rnd(pool.length)];
    if (enc.choices) {
      var mappedChoices = enc.choices.map(function (ch) {
        var e2 = Object.assign({}, ch.e);
        if (explore) { if (e2.tv) e2.tv = Math.round(e2.tv * 1.8); if (e2.lt > 0) e2.lt = Math.round(e2.lt * 1.8); }
        return { label: ch.label, e: e2, loc: l };
      });
      showEncModal("Kỳ Ngộ · " + l.ten, enc.t, null, mappedChoices);
    } else {
      var e = Object.assign({}, enc.e);
      if (explore) { if (e.tv) e.tv = Math.round(e.tv * 1.8); if (e.lt > 0) e.lt = Math.round(e.lt * 1.8); }
      showEncModal("Kỳ Ngộ · " + l.ten, enc.t, e, null);
    }
  }

  function resolveEventNode(ev, baseLoc) {
    var mult = Math.max(1, 1 + ev.danger * 0.45);
    if (ev.kind === "yeu_thu") {
      showEncModal(
        ev.icon + " " + ev.ten + " · " + baseLoc.ten,
        "Bạn bắt gặp yêu thú bản địa ẩn nấp quanh " + baseLoc.ten + ". Muốn trực tiếp xuất thủ trảm yêu đoạt đan hay âm thầm thu thập dấu vết rồi rút lui?",
        null,
        [
          {
            label: "⚔️ Trảm yêu đoạt đan (Đấu pháp)",
            cls: "gold",
            action: function () {
              if (hasReadyAdapter() && adapter.onTriggerCombat) {
                $("#nkEnc").hidden = true;
                close();
                adapter.onTriggerCombat(ev);
                return "closeMap";
              }
              return apply({ tv: Math.round(55 * mult), lt: Math.round(25 * mult), item: "Yêu Đan", tho: ev.danger >= 2 ? 2 : 0 }, baseLoc);
            }
          },
          {
            label: "🥷 Âm thầm thu tàn tích (An toàn)",
            cls: "",
            e: { tv: Math.round(20 * mult), lt: Math.round(14 * mult) },
            loc: baseLoc
          }
        ]
      );
      return;
    }
    if (ev.kind === "linh_mach") {
      var herbName = ev.danger >= 2 ? "Linh Dược Trúc Cơ" : rnd(2) ? "Linh Sâm" : "Linh Chi";
      showEncModal(
        ev.icon + " " + ev.ten + " · " + baseLoc.ten,
        "Linh khí thiên địa hội tụ giữa rừng sâu núi thẳm gần " + baseLoc.ten + ", ánh linh quang tỏa ra quanh khóm thảo mộc.",
        null,
        [
          { label: "🌿 Thu hái linh thảo", cls: "gold", e: { tv: Math.round(26 * mult), item: herbName }, loc: baseLoc },
          { label: "🧘 Tĩnh tọa thổ nạp linh tuyền", cls: "", e: { tv: Math.round(48 * mult), hp: 9999 }, loc: baseLoc }
        ]
      );
      return;
    }
    if (ev.kind === "co_dong") {
      var liuLieu = Math.random() < 0.72;
      var relic = ev.danger >= 4 ? "Bảo Vật Thượng Cổ" : ev.danger >= 2 ? "Công Pháp Tàn Quyển" : "Linh Chi";
      showEncModal(
        ev.icon + " " + ev.ten + " · " + baseLoc.ten,
        "Phát hiện vết nứt cổ trận dẫn vào động phủ tiền nhân gần " + baseLoc.ten + ". Cấm chế vẫn còn lờ mờ xoay chuyển.",
        null,
        [
          {
            label: "🔥 Phá cấm chế thám bảo",
            cls: "gold",
            e: liuLieu ? { tv: Math.round(65 * mult), lt: Math.round(35 * mult), item: relic } : { tv: Math.round(40 * mult), tho: Math.max(1, ev.danger) },
            loc: baseLoc
          },
          {
            label: "🧭 Dò xét ngoài động (An toàn)",
            cls: "",
            e: { tv: Math.round(28 * mult), lt: Math.round(16 * mult) },
            loc: baseLoc
          }
        ]
      );
      return;
    }
    rollEncounter(baseLoc, true);
  }

  /* ---------- travel ---------- */
  var raf = 0;
  function animateTravel(ax, ay, bx, by, monthsTotal, costLt, onArrive) {
    if (costLt > 0) {
      if (hasReadyAdapter() && adapter.onApplyReward) adapter.onApplyReward({ lt: -costLt, _travelFee: true }, loc(S.loc));
      else S.lt = Math.max(0, S.lt - costLt);
    }
    S.traveling = true; whoosh();
    var pAx = ax * 16, pAy = ay * 10, pBx = bx * 16, pBy = by * 10;
    var dx = pBx - pAx, dy = pBy - pAy, L = Math.hypot(dx, dy) || 1;
    var cx = (pAx + pBx) / 2 - dy / L * 40, cy = (pAy + pBy) / 2 + dx / L * 40;
    var trail = $("#nkTrail"), token = $("#nkToken");
    trail.setAttribute("d", "M" + pAx + " " + pAy + " Q" + cx + " " + cy + " " + pBx + " " + pBy);
    token.style.display = "";
    var dur = Math.min(7500, Math.max(950, monthsTotal * 120 / S.speed));
    var t0 = performance.now(), prog = $("#nkProgress");
    prog.style.display = "block";
    cancelAnimationFrame(raf);
    function step(now) {
      var t = Math.min(1, (now - t0) / dur);
      var e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      var x = (1 - e) * (1 - e) * pAx + 2 * (1 - e) * e * cx + e * e * pBx;
      var y = (1 - e) * (1 - e) * pAy + 2 * (1 - e) * e * cy + e * e * pBy;
      token.setAttribute("transform", "translate(" + x + " " + y + ")");
      prog.textContent = "🚀 Độn quang… còn " + Math.max(0, Math.round(monthsTotal * (1 - e))) + " tháng";
      if (t < 1) { raf = requestAnimationFrame(step); return; }
      S.traveling = false;
      trail.setAttribute("d", ""); prog.style.display = "none";
      bell(329.6);
      onArrive();
    }
    raf = requestAnimationFrame(step);
    updateAll();
  }

  function travelTo(id) {
    syncFromAdapter();
    var a = loc(S.loc), b = loc(id);
    if (S.traveling || S.won || S.dead || isGameBusy() || !unlocked(b) || a.id === b.id) return;
    var m = travelMonths(a, b), c = travelCost(m);
    if (S.lt < c) { toast("Thiếu linh thạch lộ phí!"); return; }
    animateTravel(a.x, a.y, b.x, b.y, m, c, function () {
      S.trips++; S.loc = id; S.sel = id; S.selEv = null;
      advanceMonths(m);
      if (hasReadyAdapter() && adapter.onArriveLocation) adapter.onArriveLocation(b, m);
      log("🚶 Đến " + b.ten + " sau " + m + " tháng (−" + c + " LT).", "info");
      rollEncounter(b, false);
      after();
    });
  }

  function travelToEvent(evId) {
    syncFromAdapter();
    var ev = findEv(evId);
    if (!ev || S.traveling || S.won || S.dead || isGameBusy()) return;
    var a = loc(S.loc), base = loc(ev.baseLocId);
    if (!unlocked(base)) { toast("🔒 Khu vực chưa mở!"); return; }
    var m = eventTravelMonths(a, ev), c = travelCost(m);
    if (S.lt < c) { toast("Thiếu linh thạch lộ phí!"); return; }
    animateTravel(a.x, a.y, ev.x, ev.y, m, c, function () {
      S.trips++; S.loc = base.id; S.sel = base.id; S.selEv = null;
      S.evNodes = S.evNodes.filter(function (n) { return n.id !== ev.id; });
      advanceMonths(m);
      if (hasReadyAdapter() && adapter.onArriveLocation) adapter.onArriveLocation(base, m);
      ensureEventNodes(false);
      log("⚡ Đến điểm sự kiện [" + ev.ten + "] gần " + base.ten + " (" + m + " tháng).", "info");
      resolveEventNode(ev, base);
      after();
    });
  }

  function beQuan() {
    if (S.traveling || S.won || S.dead || isGameBusy()) return;
    var l = loc(S.loc);
    advanceMonths(12);
    var res = apply({ tv: Math.round(24 * l.lx * (1 + S.cg * .35)), _beQuan12: true }, l);
    pluck(261.6, .09);
    log("🧘 Bế quan 12 tháng tại " + l.ten + ": +" + (res.tv || 0).toLocaleString() + " tu vi.", "good");
    after();
  }
  function uyThac() {
    if (S.traveling || S.won || S.dead || isGameBusy()) return;
    advanceMonths(3);
    var l = loc(S.loc);
    var res = apply({ lt: 15 + rnd(26) }, l);
    pluck(392, .08);
    log("📜 Ủy thác hoàn thành: +" + (res.lt || 0).toLocaleString() + " linh thạch.", "gold");
    after();
  }
  function scanEvents() {
    if (S.traveling || S.won || S.dead || isGameBusy()) return;
    advanceMonths(1);
    ensureEventNodes(true);
    pluck(494, .07);
    log("🔄 Thả thần thức dò tìm quanh Nhân Giới: phát hiện " + S.evNodes.length + " điểm sự kiện mới.", "info");
    toast("🔄 Đã làm mới " + S.evNodes.length + " điểm cơ duyên trên bản đồ!");
    after();
  }
  function win() {
    S.won = true; bell(523); bell(659); bell(784);
    $("#nkEndT").textContent = "🌌 Phi Thăng Linh Giới";
    $("#nkEndP").textContent = "Trận văn thượng cổ sáng rực, thiên môn mở ra. Đạo đồ " + D.canhGioi[S.cg] + " bước khỏi Nhân Giới sau " + (Math.floor(S.months / 12) + 1) + " năm lữ hành, " + S.trips + " chuyến độn quang, " + S.kyNgo + " kỳ ngộ và " + S.lt + " linh thạch mang theo. Linh Giới chờ ngươi ở map tầng hai.";
    $("#nkEnd").hidden = false;
    log("🌌 PHI THĂNG THÀNH CÔNG — hẹn ngày Linh Giới.", "gold");
    updateAll();
  }

  /* ---------- toast ---------- */
  var toastT = 0;
  function toast(msg) {
    var t = $("#nkToast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }

  /* ---------- pan / zoom ---------- */
  function clampView() {
    S.view.w = Math.min(1600, Math.max(420, S.view.w));
    S.view.h = S.view.w * 1000 / 1600;
    S.view.x = Math.min(1600 - S.view.w, Math.max(0, S.view.x));
    S.view.y = Math.min(1000 - S.view.h, Math.max(0, S.view.y));
  }
  function zoom(f, px, py) {
    var w = S.view.w * f;
    var rx = (px == null ? .5 : px), ry = (py == null ? .5 : py);
    S.view.x += (S.view.w - w) * rx; S.view.y += (S.view.h - w * 1000 / 1600) * ry;
    S.view.w = w; clampView(); updateMap(); save();
  }
  var drag = null;
  svg.addEventListener("pointerdown", function (e) {
    if (e.target.closest(".nk-mk") || e.target.closest(".nk-ev-node")) return;
    drag = { x: e.clientX, y: e.clientY, vx: S.view.x, vy: S.view.y };
    svg.classList.add("drag"); svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var r = svg.getBoundingClientRect(), sc = S.view.w / r.width;
    S.view.x = drag.vx - (e.clientX - drag.x) * sc;
    S.view.y = drag.vy - (e.clientY - drag.y) * sc;
    clampView(); updateMap();
  });
  svg.addEventListener("pointerup", function () { drag = null; svg.classList.remove("drag"); save(); });
  svg.addEventListener("wheel", function (e) {
    e.preventDefault();
    var r = svg.getBoundingClientRect();
    zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  }, { passive: false });
  $("#nkZin").onclick = function () { zoom(1 / 1.25); };
  $("#nkZout").onclick = function () { zoom(1.25); };
  $("#nkZreset").onclick = function () { S.view = { x: 0, y: 0, w: 1600, h: 1000 }; updateMap(); save(); };

  /* ---------- markers & dynamic nodes ---------- */
  svg.addEventListener("click", function (e) {
    var evG = e.target.closest(".nk-ev-node");
    if (evG) {
      var evId = evG.getAttribute("data-ev");
      var ev = findEv(evId);
      if (!ev) return;
      if (S.selEv === evId) { travelToEvent(evId); return; }
      S.selEv = evId; S.sel = ev.baseLocId;
      pluck(523, .05);
      toast("Bấm thêm lần nữa vào [" + ev.ten + "] để độn quang tới ngay!");
      updateMap(); renderDrawer(); save();
      return;
    }
    var g = e.target.closest(".nk-mk"); if (!g) return;
    var l = loc(g.getAttribute("data-id"));
    var wasSame = !S.selEv && S.sel === l.id;
    S.selEv = null;
    S.sel = l.id;
    if (!unlocked(l)) {
      toast("🔒 " + l.ten + " — cần cảnh giới " + D.canhGioi[l.gate]);
      pluck(300, .05); updateMap(); renderDrawer(); save(); return;
    }
    if (wasSame && l.id !== S.loc) { travelTo(l.id); return; }
    pluck(440, .05);
    if (l.id !== S.loc) toast("Bấm thêm lần nữa vào [" + l.ten + "] để độn quang tới!");
    updateMap(); renderDrawer(); save();
  });
  svg.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var evG = e.target.closest(".nk-ev-node");
    if (evG) {
      e.preventDefault();
      var evId = evG.getAttribute("data-ev");
      if (S.selEv === evId) travelToEvent(evId);
      else { var ev = findEv(evId); if (ev) { S.selEv = evId; S.sel = ev.baseLocId; updateMap(); renderDrawer(); } }
      return;
    }
    var g = e.target.closest(".nk-mk"); if (!g) return;
    e.preventDefault();
    var id = g.getAttribute("data-id");
    if (!S.selEv && S.sel === id && id !== S.loc) travelTo(id);
    else { S.selEv = null; S.sel = id; updateMap(); renderDrawer(); }
  });

  /* ---------- controls ---------- */
  $("#nkScan").onclick = scanEvents;
  $("#nkSpeed").onchange = function () { S.speed = +this.value; save(); };
  $("#nkAudio").onclick = function () {
    S.muted = !S.muted; audio();
    if (master) master.gain.value = S.muted ? 0 : 1;
    setAmb(overlayOpen); updateHUD(); save();
  };
  $("#nkTheme").onclick = function () {
    S.theme = S.theme === "dark" ? "light" : "dark";
    ov.setAttribute("data-nk-theme", S.theme); save();
  };
  $("#nkLayersBtn").onclick = function () { $("#nkLayers").classList.toggle("open"); };
  Array.prototype.forEach.call(document.querySelectorAll("#nkLayers input"), function (cb) {
    var k = cb.getAttribute("data-l");
    cb.checked = !!S.layers[k];
    cb.onchange = function () { S.layers[k] = cb.checked; updateMap(); save(); };
  });
  $("#nkExport").onclick = function () {
    var blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "nhan_gioi_save.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 800);
    toast("⬇ Đã xuất save nhân giới");
  };
  $("#nkImport").onclick = function () { $("#nkFile").click(); };
  $("#nkFile").onchange = function () {
    var f = this.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var p = JSON.parse(rd.result);
        if (!p || p.v !== 1 || !loc(p.loc)) throw 0;
        S = Object.assign(fresh(), p, { traveling: false });
        ov.setAttribute("data-nk-theme", S.theme);
        Array.prototype.forEach.call(document.querySelectorAll("#nkLayers input"), function (cb) { cb.checked = !!S.layers[cb.getAttribute("data-l")]; });
        renderLog(); updateAll(); toast("⬆ Đã nhập save nhân giới");
      } catch (e) { toast("⚠ File save không hợp lệ"); }
    };
    rd.readAsText(f); this.value = "";
  };
  $("#nkReset").onclick = function () { $("#nkConfirm").hidden = false; };
  $("#nkNo").onclick = function () { $("#nkConfirm").hidden = true; };
  $("#nkYes").onclick = function () { doReset(); $("#nkConfirm").hidden = true; };
  $("#nkEndRestart").onclick = function () { doReset(); $("#nkEnd").hidden = true; };
  $("#nkEndClose").onclick = function () { $("#nkEnd").hidden = true; };
  function doReset() {
    var keep = { speed: S.speed, muted: S.muted, theme: S.theme, layers: S.layers };
    S = Object.assign(fresh(), keep);
    cancelAnimationFrame(raf);
    $("#nkTrail").setAttribute("d", ""); $("#nkProgress").style.display = "none";
    ensureEventNodes(true);
    log("↺ Nhập kiếp mới — đạo đồ khởi lại từ Thanh Ngưu Trấn.", "info");
    updateAll();
  }
  $("#nkClose").onclick = close;

  /* ---------- open / close / mount ---------- */
  function open(opts) {
    if (adapter && adapter.canPlay && !adapter.canPlay()) return;
    syncFromAdapter();
    if (opts && opts.evId && findEv(opts.evId)) {
      var ev = findEv(opts.evId);
      S.selEv = ev.id; S.sel = ev.baseLocId;
    } else if (opts && opts.locId) {
      S.selEv = null; S.sel = loc(opts.locId).id;
    }
    ov.hidden = false; overlayOpen = true;
    audio(); if (AC && AC.state === "suspended") AC.resume();
    setAmb(true);
    renderLog(); updateAll();
    $("#nkClose").focus();
  }
  function close() {
    ov.hidden = true; overlayOpen = false; setAmb(false);
    cancelAnimationFrame(raf);
    if (S.traveling) { S.traveling = false; $("#nkProgress").style.display = "none"; $("#nkTrail").setAttribute("d", ""); updateAll(); }
    if (!launcher.hidden && document.body && !document.body.classList.contains("no-char")) launcher.focus();
  }
  launcher.onclick = function () { open(); };
  document.addEventListener("keydown", function (e) {
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === "Escape") {
      if (!$("#nkEnc").hidden) $("#nkEnc").hidden = true;
      else if (!$("#nkConfirm").hidden) $("#nkConfirm").hidden = true;
      else if (!$("#nkEnd").hidden) $("#nkEnd").hidden = true;
      else if (overlayOpen) close();
    }
    if ((e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey) {
      if (adapter && adapter.canPlay && !adapter.canPlay()) return;
      overlayOpen ? close() : open();
    }
  });

  window.NhanGioiMap = {
    open: open,
    close: close,
    reset: doReset,
    getState: function () { return JSON.parse(JSON.stringify(S)); },
    getEventNodes: function () { ensureEventNodes(false); return JSON.parse(JSON.stringify(S.evNodes)); },
    refreshEvents: function () { ensureEventNodes(true); updateAll(); return JSON.parse(JSON.stringify(S.evNodes)); },
    focusLocation: function (locId) { open({ locId: locId }); },
    focusEvent: function (evId) { open({ evId: evId }); },
    setTheme: function (t) { if (t === "dark" || t === "light") { S.theme = t; ov.setAttribute("data-nk-theme", t); save(); } },
    sync: function () { syncFromAdapter(); updateAll(); },
    setAdapter: function (a) { adapter = a; syncFromAdapter(); ensureEventNodes(false); updateAll(); }
  };

  if (!S.log.length) log("📜 Đạo đồ giáng sinh Thanh Ngưu Trấn. Thiên đạo mênh mông, khởi hành từ bước đầu.", "info");
  ensureEventNodes(false);
  renderLog(); updateAll();
})();
