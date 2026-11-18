/* =====================================================================
 * UPDATE v1.8 — CÂN BẰNG PHÁP BẢO / TRANG BỊ
 *  - Kéo các món lệch trần về dải sức mạnh theo cảnh giới
 *  - Giữ vai trò Công kích / Phòng thủ / Cân bằng, không làm mất bản sắc
 *  - Chuẩn hoá giá theo tổng uy lực, chặn giá trên trời
 *  - Gán hệ thuộc tính rõ ràng để tương thích linh căn có ý nghĩa
 *  - Thêm mô tả thuộc tính v1.8
 * ===================================================================== */
(function () {
  'use strict';
  // Snapshot từ Excel: không cân bằng lại pháp bảo
  if (window.PN_DATA_SNAPSHOT) return;
  const DS = (window.PN_DATA && window.PN_DATA.vatPham) || [];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const round = x => Math.max(0, Math.round(Number(x) || 0));
  const hash = s => {
    let h = 2166136261;
    const t = String(s || '');
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  };
  const h01 = s => (hash(s) % 10000) / 10000;

  // [tổng lực tối thiểu, tối đa] theo cảnh giới
  const RANGE = [
    [40, 80], [60, 500], [240, 720], [700, 3500], [2800, 6500],
    [8300, 14000], [12000, 20000], [40000, 70000], [80000, 140000], [120000, 180000]
  ];
  // Giá / tổng lực
  const GIA_RATIO = [
    [0.5, 2], [2, 6], [4, 8], [10, 25], [18, 45],
    [35, 75], [45, 90], [45, 90], [50, 95], [70, 120]
  ];

  function vaiTro(atk, def) {
    if (atk > def * 1.7) return 'Công kích';
    if (def > atk * 1.7) return 'Phòng thủ';
    return 'Cân bằng';
  }

  DS.filter(v => v && v.loai === 'phap_bao').forEach(v => {
    const cgNum = Number(v.canhGioi);
    const cg = clamp(Number.isFinite(cgNum) ? cgNum : 0, 0, 9);
    const atk0 = Math.max(0, Number(v.congKich) || 0);
    const def0 = Math.max(0, Number(v.phongThu) || 0);
    const tong0 = atk0 + def0;
    if (tong0 <= 0) return;

    const [minT, maxT] = RANGE[cg];
    // Giữ món rẻ/siêu rẻ dưới sàn (đồ khởi đầu), chỉ kéo các món vượt trần
    const tongMoi = clamp(tong0, Math.min(minT, tong0), maxT);
    const tiLeAtk = atk0 / tong0;
    let atk, def;
    if (atk0 === 0) { atk = 0; def = tongMoi; }
    else if (def0 === 0) { atk = tongMoi; def = 0; }
    else {
      atk = round(tongMoi * tiLeAtk);
      def = tongMoi - atk;
    }
    // Biến thiên nhỏ theo id khi có điều chỉnh, tránh tạo cặp chỉ số trùng nhau
    const coDieuChinh = Math.abs(tongMoi - tong0) > 0.5;
    if (coDieuChinh && atk > 0 && def > 0) {
      const nhich = Math.round(tongMoi * (h01(v.id + '|v18') - 0.5) * 0.02);
      atk = Math.max(1, atk + nhich);
      def = Math.max(1, def - nhich);
    }
    v.congKich = atk;
    v.phongThu = def;

    const tongMoi2 = atk + def;
    const [minR, maxR] = GIA_RATIO[cg];
    const ratioCu = Number(v.gia) > 0 ? Number(v.gia) / tong0 : minR;
    const ratioMoi = clamp(ratioCu, minR, maxR);
    const rawGia = Math.max(1, Math.round(tongMoi2 * ratioMoi));
    const step = rawGia >= 1000000 ? 10000 : rawGia >= 100000 ? 1000 : rawGia >= 1000 ? 100 : 10;
    v.gia = Math.max(1, Math.round(rawGia / step) * step);

    // Gán hệ rõ ràng (nếu nhận diện được) — không đổi hành vi vì game vốn suy ra từ tên/mô tả
    try {
      if ((!Array.isArray(v.he) || v.he.length === 0) && typeof layThuocTinhPhapBao === 'function') {
        const he = layThuocTinhPhapBao(v);
        if (Array.isArray(he) && he.length) v.he = he;
      }
    } catch (e) { /* bỏ qua */ }

    const role = vaiTro(atk, def);
    const base = String(v.moTa || '').replace(/\s*【v1\.8】[\s\S]*$/, '').trim();
    v.moTa = `${base}${base ? '\n' : ''}【v1.8】Công ${atk.toLocaleString('vi-VN')} · Thủ ${def.toLocaleString('vi-VN')} · Tổng ${tongMoi2.toLocaleString('vi-VN')} · ${role} · Giá ${v.gia.toLocaleString('vi-VN')} LT`;
    v.__v18Tong = tongMoi2;
    v.__v18Vai = role;
  });
})();
/* ------------------------- KHỞI TẠO / GHI NHẬN ------------------------- */
(function () {
  'use strict';
  function v18Init() {
    try {
      if (typeof state === 'undefined' || !state) return;
      if (!state.v18DaCanBang) {
        state.v18DaCanBang = true;
        if (typeof ghiNhatKy === 'function') {
          ghiNhatKy('🛠️ Cập nhật v1.8: cân bằng pháp bảo/trang bị theo cảnh giới, chuẩn hoá giá và vai trò Công/Thủ.', 'tot');
        }
        if (typeof luuGame === 'function') luuGame();
        if (typeof veGiaoDien === 'function') veGiaoDien();
      }
    } catch (e) { /* bỏ qua */ }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(v18Init, 0); });
  } else {
    setTimeout(v18Init, 0);
  }
})();