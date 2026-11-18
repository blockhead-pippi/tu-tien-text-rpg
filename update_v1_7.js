/* =====================================================================
 * UPDATE v1.7 — CÂN BẰNG CÔNG PHÁP & BÍ THUẬT
 *  - Chuẩn hoá tốc độ tu luyện / tỉ lệ đột phá theo cảnh giới + phẩm chất
 *  - Chuẩn hoá chiSoNen, chặn các chỉ số vượt trần (nhất là linhLucVanHanh)
 *  - Mỗi bí thuật có thụ động riêng (không còn trùng y hệt)
 *  - Chuẩn hoá uy lực / pháp lực / hồi chiêu của kỹ năng
 *  - Tự động thêm dòng mô tả thuộc tính v1.7
 * ===================================================================== */
(function () {
  'use strict';
  // Snapshot từ Excel: dữ liệu đã cân bằng sẵn
  if (window.PN_DATA_SNAPSHOT) return;
  const CP = (window.PN_DATA && window.PN_DATA.congPhap) || [];
  if (!CP.length) return;

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const round = (x, d = 2) => Math.round(Number(x) * Math.pow(10, d)) / Math.pow(10, d);
  const hash = s => {
    let h = 2166136261;
    const t = String(s || '');
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  };
  const h01 = s => (hash(s) % 10000) / 10000;
  const cgOf = c => clamp(Number(c.canhGioi) || 0, 0, 9);
  const pcOf = c => clamp(Number(c.phamChat) || 3, 1, 8);
  const roleOf = c => {
    if (c.loai === 'BI_THUAT') {
      const kn = (c.kyNang || [])[0];
      return kn ? kn.loai : 'HO_TRO';
    }
    return c.theLoai || 'NGU_HANH';
  };

  const ROLE_STATS = {
    NGU_HANH: ['congKich', 'linhLucVanHanh', 'phongThu'],
    KIEM_PHAP: ['congKich', 'chiSoPhang.thanPhap'],
    THE_TU: ['khiHuyet', 'phongThu', 'chiSoPhang.canCot'],
    NGHE_THU: ['linhLucVanHanh', 'hoiPhuc', 'thanThuc'],
    PHU_TRO: ['hoiPhuc', 'khiHuyet', 'linhLucVanHanh'],
    DOC_THUAT: ['congKich', 'khangTamMa', 'thanThuc'],
    TRAN_PHAP: ['phongThu', 'liemTuc', 'khangTamMa'],
    DAN_DAO: ['khiHuyet', 'hoiPhuc', 'thoNguyen'],
    PHU_LUC: ['thanThuc', 'chiSoPhang.ngoTinh'],
    VO_DAO: ['congKich', 'phongThu', 'khiHuyet'],
    BIEN_HOA: ['chiSoPhang.thanPhap', 'khangTamMa'],
    TAN_CONG: ['congKich', 'chiSoPhang.thanPhap'],
    PHONG_THU: ['phongThu', 'khiHuyet', 'liemTuc'],
    TRI_LIEU: ['hoiPhuc', 'khiHuyet', 'linhLucVanHanh'],
    KHONG_CHE: ['khangTamMa', 'thanThuc', 'linhLucVanHanh'],
    DON_THUAT: ['chiSoPhang.thanPhap', 'liemTuc'],
    HO_TRO: ['linhLucVanHanh', 'hoiPhuc', 'thanThuc']
  };

  const getPath = (obj, path) => path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  const setPath = (obj, path, val) => {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  };

  function giaTriTheoVai(key, cg, pc, seed) {
    const vary = 0.8 + h01(String(seed || '') + '|' + key) * 0.4;
    if (key === 'linhLucVanHanh') return round((0.5 + cg * 0.55 + pc * 0.1) * vary, 2);
    if (key === 'liemTuc') return Math.round((5 + cg * 2) * vary);
    if (key === 'thoNguyen') return Math.round((100 + cg * 250) * vary);
    if (key === 'thanThuc') return Math.max(1, Math.round((1 + cg * 0.3 + pc * 0.1) * vary));
    if (key.startsWith('chiSoPhang.')) return Math.max(1, Math.round((1 + cg * 0.4) * vary));
    return round((0.02 + cg * 0.008 + Math.max(0, pc - 4) * 0.004) * vary, 3);
  }

  function chuanHoaChiSo(c) {
    const cg = cgOf(c);
    const pc = pcOf(c);
    const cs = Object.assign({}, c.chiSoNen || {});

    // Trần phần trăm theo cảnh giới
    const capPct = (base, perCg) => base + cg * perCg + Math.max(0, pc - 4) * 0.006;
    ['congKich', 'phongThu', 'khiHuyet', 'linhLuc', 'hoiPhuc', 'khangTamMa'].forEach(k => {
      const v = Number(cs[k]);
      if (!(v > 0)) return;
      const caps = {
        congKich: capPct(0.10, 0.035),
        phongThu: capPct(0.08, 0.032),
        khiHuyet: capPct(0.08, 0.036),
        linhLuc: capPct(0.05, 0.023),
        hoiPhuc: capPct(0.05, 0.019),
        khangTamMa: capPct(0.05, 0.021)
      };
      cs[k] = round(Math.min(v, caps[k]), 3);
    });
    if (Number(cs.linhLucVanHanh) > 0) {
      cs.linhLucVanHanh = round(clamp(Number(cs.linhLucVanHanh), 0.5, 1 + cg * 1.1 + pc * 0.2), 2);
    }
    if (Number(cs.liemTuc) > 0) cs.liemTuc = round(clamp(Number(cs.liemTuc), 5, 10 + cg * 3), 1);
    if (Number(cs.thoNguyen) > 0) cs.thoNguyen = Math.round(Math.min(Number(cs.thoNguyen), 1000 + cg * 1200));
    if (Number(cs.thanThuc) > 0) {
      const v = Number(cs.thanThuc);
      cs.thanThuc = v <= 1 ? Math.max(1, Math.round(1 + cg * 0.35 + pc * 0.15)) : Math.round(v);
    }
    // Chuẩn hoá chiSoPhang
    if (cs.chiSoPhang && typeof cs.chiSoPhang === 'object') {
      Object.keys(cs.chiSoPhang).forEach(k => {
        const v = Number(cs.chiSoPhang[k]);
        if (!Number.isFinite(v)) return;
        cs.chiSoPhang[k] = clamp(Math.round(v * 100) / 100, -3, 2 + cg);
      });
    }

    // Bổ sung 2 chỉ số chính theo vai trò nếu thiếu
    const vai = roleOf(c);
    const prim = ROLE_STATS[vai] || ROLE_STATS.NGU_HANH;
    prim.slice(0, 2).forEach(k => {
      if (!(Number(getPath(cs, k)) > 0)) setPath(cs, k, giaTriTheoVai(k, cg, pc, c.id));
    });

    // Chỉ số phụ duy nhất theo id (để không còn bí thuật trùng nhau)
    const uniqueKeys = ['chiSoPhang.thanThuc', 'chiSoPhang.ngoTinh', 'chiSoPhang.canCot', 'chiSoPhang.khiVan', 'chiSoPhang.thanPhap', 'chiSoPhang.daoTam'];
    const uk = uniqueKeys[hash(c.id + '|v17') % uniqueKeys.length];
    const uv = 1 + (hash(c.id + '|v17v') % 3) + Math.floor(cg / 3);
    setPath(cs, uk, Math.max(Number(getPath(cs, uk)) || 0, uv));

    c.chiSoNen = cs;
  }
  window.v17ChuanHoaChiSo = chuanHoaChiSo;
  window.v17RoleOf = roleOf;
  window.v17Helpers = { clamp, round, hash, h01, cgOf, pcOf, getPath, setPath };
})();
/* --------------- 2. ÁP DỤNG: TỐC ĐỘ, KỸ NĂNG, TRẦN CẢNH GIỚI --------------- */
(function () {
  'use strict';
  // Snapshot từ Excel: không chuẩn hoá lại
  if (window.PN_DATA_SNAPSHOT) return;
  const CP = (window.PN_DATA && window.PN_DATA.congPhap) || [];
  const H = window.v17Helpers || {};
  const clamp = H.clamp || ((x, a, b) => Math.max(a, Math.min(b, x)));
  const round = H.round || ((x, d = 2) => Math.round(Number(x) * Math.pow(10, d)) / Math.pow(10, d));
  const cgOf = H.cgOf || (c => clamp(Number(c.canhGioi) || 0, 0, 9));
  const pcOf = H.pcOf || (c => clamp(Number(c.phamChat) || 3, 1, 8));
  const h01 = H.h01 || (() => 0.5);
  const chuanHoa = window.v17ChuanHoaChiSo;

  const SPEED_RANGE = [
    [1.0, 1.35], [1.08, 1.42], [1.15, 1.5], [1.22, 1.6], [1.3, 1.7],
    [1.38, 1.8], [1.45, 1.9], [1.52, 2.0], [1.6, 2.1], [1.7, 2.2]
  ];
  const DOT_MAX = [0.03, 0.04, 0.05, 0.06, 0.08, 0.09, 0.1, 0.11, 0.12, 0.14];

  function chuanHoaTuLuyen(c) {
    const cg = cgOf(c);
    const range = SPEED_RANGE[cg] || SPEED_RANGE[9];
    const tl = c.tuLuyen || {};
    let speed = Number(tl.heSoTocDo);
    if (!Number.isFinite(speed) || speed <= 0) speed = (range[0] + range[1]) / 2;
    tl.heSoTocDo = round(clamp(speed, range[0], range[1]), 2);
    const dot = Number(tl.tiLeDotPha);
    tl.tiLeDotPha = round(clamp(Number.isFinite(dot) ? dot : 0, 0, DOT_MAX[cg]), 3);
    c.tuLuyen = tl;
  }

  function chuanHoaKyNang(c) {
    if (!Array.isArray(c.kyNang)) return;
    const cg = cgOf(c);
    const pc = pcOf(c);
    c.kyNang.forEach(kn => {
      if (!kn) return;
      const role = kn.loai || 'HO_TRO';
      const maxHe = {
        TAN_CONG: 1.0 + cg * 0.5,
        PHONG_THU: 0.9 + cg * 0.35,
        TRI_LIEU: 0.9 + cg * 0.35,
        KHONG_CHE: 0.8 + cg * 0.3,
        DON_THUAT: 0.7 + cg * 0.25,
        HO_TRO: 0.8 + cg * 0.4
      }[role] || (0.8 + cg * 0.3);
      let he = Number(kn.heSo);
      if (!Number.isFinite(he) || he <= 0) he = Math.max(0.6, maxHe * 0.6);
      he = clamp(he, 0.5, maxHe) * (0.95 + h01(kn.id || c.id) * 0.1);
      kn.heSo = round(he, 2);
      kn.phapLuc = round(clamp(Number(kn.phapLuc) || 0.05, 0.01, 0.35), 3);
      kn.hoiChieu = clamp(Math.round(Number(kn.hoiChieu) || 0), 0, 8);
      kn.tang = clamp(Math.round(Number(kn.tang) || 1), 1, 9);
      if (Array.isArray(kn.hieuUng)) {
        kn.hieuUng = kn.hieuUng.map(t => String(t).replace(/Sát thương\s*=\s*\d+%\s*công kích/i, `Sát thương = ${Math.round(kn.heSo * 100)}% công kích`));
      }
    });
    // Trần cảnh giới hợp lệ
    c.canhGioiToiDa = clamp(Number(c.canhGioiToiDa) || cg, cg, 9);
  }

  CP.forEach(c => {
    if (!c) return;
    if (typeof chuanHoa === 'function') chuanHoa(c);
    c.canhGioiToiDa = clamp(Number(c.canhGioiToiDa) || cgOf(c), cgOf(c), 9);
    if (c.loai === 'TU_LUYEN') chuanHoaTuLuyen(c);
    chuanHoaKyNang(c);
  });
})();
/* --------------- 3. KHỬ TRÙNG & MÔ TẢ THUỘC TÍNH --------------- */
(function () {
  'use strict';
  // Snapshot từ Excel: không khử trùng / viết lại mô tả
  if (window.PN_DATA_SNAPSHOT) return;
  const CP = (window.PN_DATA && window.PN_DATA.congPhap) || [];
  const H = window.v17Helpers || {};
  const clamp = H.clamp || ((x, a, b) => Math.max(a, Math.min(b, x)));
  const round = H.round || ((x, d = 2) => Math.round(Number(x) * Math.pow(10, d)) / Math.pow(10, d));
  const getPath = H.getPath || (() => undefined);
  const setPath = H.setPath || (() => {});
  const cgOf = H.cgOf || (c => clamp(Number(c.canhGioi) || 0, 0, 9));

  const sig = c => JSON.stringify({
    loai: c.loai,
    cg: c.canhGioi,
    cgMax: c.canhGioiToiDa,
    cs: c.chiSoNen || {},
    tl: c.tuLuyen || {},
    kn: (c.kyNang || []).map(k => [k.loai, k.kieu, k.heSo, k.phapLuc, k.hoiChieu, k.tang])
  });

  const seen = new Set();
  CP.forEach(c => {
    let s = sig(c);
    let lan = 0;
    while (seen.has(s) && lan < 12) {
      if (!c.chiSoNen || typeof c.chiSoNen !== 'object') c.chiSoNen = {};
      const k = ['chiSoPhang.ngoTinh', 'chiSoPhang.khiVan', 'chiSoPhang.daoTam'][lan % 3];
      const cur = Number(getPath(c.chiSoNen, k)) || 0;
      setPath(c.chiSoNen, k, cur + 1);
      s = sig(c);
      lan++;
    }
    seen.add(s);
  });

  function moTaHieuUng(c) {
    let p;
    try { p = phanTichThuocTinhCongPhap(c, false); } catch (e) { p = null; }
    if (!p) return '';
    const parts = [];
    if (c.loai === 'TU_LUYEN') {
      parts.push(`Tu luyện ×${round(p.heSoTocDo, 2)}`);
      if (p.tiLeDotPha > 0) parts.push(`Đột phá +${Math.round(p.tiLeDotPha * 100)}%`);
    } else {
      const kn = (c.kyNang || [])[0];
      if (kn) {
        let vai = kn.loai;
        try { if (typeof KY_NANG_LOAI_NHAN !== 'undefined') vai = KY_NANG_LOAI_NHAN[kn.loai] || vai; } catch (e) { /* bỏ qua */ }
        parts.push(`Bí thuật ${vai}`);
      }
    }
    if (p.congKichPct > 0) parts.push(`Công +${Math.round(p.congKichPct * 100)}%`);
    if (p.phongThuPct > 0) parts.push(`Thủ +${Math.round(p.phongThuPct * 100)}%`);
    if (p.hpPct > 0) parts.push(`HP +${Math.round(p.hpPct * 100)}%`);
    if (p.linhLucPct > 0) parts.push(`Linh lực +${Math.round(p.linhLucPct * 100)}%`);
    if (p.hoiPhucPct > 0) parts.push(`Hồi phục +${Math.round(p.hoiPhucPct * 100)}%`);
    if (p.thanThuc > 0) parts.push(`Thần thức +${p.thanThuc}`);
    if (p.ngoTinh > 0) parts.push(`Ngộ tính +${p.ngoTinh}`);
    if (p.canCot > 0) parts.push(`Căn cốt +${p.canCot}`);
    if (p.khiVan > 0) parts.push(`Khí vận +${p.khiVan}`);
    if (p.thoNguyenBonus > 0) parts.push(`Thọ +${Math.round(p.thoNguyenBonus)} năm`);
    if (Number(c.chiSoNen && c.chiSoNen.linhLucVanHanh) > 0) parts.push(`Vận hành linh lực ${round(c.chiSoNen.linhLucVanHanh, 1)}`);
    return parts.join(' · ');
  }

  CP.forEach(c => {
    const base = String(c.moTa || '').replace(/\s*【v1\.7】[\s\S]*$/, '').trim();
    const extra = moTaHieuUng(c);
    c.moTa = extra ? `${base}${base ? '\n' : ''}【v1.7】${extra}` : base;
  });

  function v17Init() {
    try {
      if (typeof state === 'undefined' || !state) return;
      if (!state.v17DaCanBang) {
        state.v17DaCanBang = true;
        if (typeof ghiNhatKy === 'function') {
          ghiNhatKy('🛠️ Cập nhật v1.7: cân bằng 423 công pháp/bí thuật, mỗi bí thuật có thụ động riêng, không còn trùng nhau.', 'tot');
        }
        if (typeof luuGame === 'function') luuGame();
        if (typeof veGiaoDien === 'function') veGiaoDien();
      }
    } catch (e) { /* bỏ qua */ }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(v17Init, 0); });
  } else {
    setTimeout(v17Init, 0);
  }
})();