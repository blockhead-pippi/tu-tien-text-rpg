/* =====================================================================
 * UPDATE v1.6.1 — ĐAN DƯỢC CHUYÊN BIỆT · TỒN KHO 1–9 · GATE CẢNH GIỚI
 *  - Mỗi đan chỉ còn MỘT tác dụng: hồi HP / hồi MP / tăng Tu vi /
 *    tăng tỷ lệ đột phá / tăng Căn cốt / tăng Thọ nguyên
 *  - Bổ sung đan hồi Linh lực và đan đột phá còn thiếu (cg0, cg2, cg3, cg6–9)
 *  - Chợ chỉ bán đan dược/trang bị ngang hoặc thấp hơn cảnh giới hiện tại
 *  - Đan dược có tồn kho ngẫu nhiên 1–9 mỗi phiên chợ
 *  - Hiệu lực đan suy giảm khi lệch cảnh giới; đan đột phá cũ bị vô hiệu
 * ===================================================================== */
(function () {
  'use strict';

  const PHAN_LOAI = {
    dan_thanh_tam: 'mp', dan_hoang_long: 'hp', dan_kim_tuy: 'tv',
    dan_hoang_luyen: 'hp', dan_thanh_linh: 'mp', dan_tinh_linh: 'mp', dan_hoi_xuan: 'hp', dan_ngung_khi: 'tv',
    dan_tinh_tuy: 'cc', dan_an_than: 'mp', dan_tiet_khi: 'tv', dan_thanh_hoa: 'mp', dan_hoan_nguyen: 'hp',
    dan_chan_nguyen: 'tv', dan_tu_duong: 'tv', dan_ngoc_tuy: 'cc', dan_tuc_menh: 'hp', dan_hop_khi: 'tv', dan_dinh_nhan: 'mp',
    dan_thanh_tinh: 'tv', dan_xich_hoa: 'tv', dan_han_bang: 'mp', dan_hap_linh: 'mp', dan_duong_hon: 'mp',
    dan_ngu_huynh: 'tv', dan_tu_tinh: 'tv', dan_hoang_ngoc: 'tv', dan_long_lan: 'cc', dan_thanh_nguyen: 'tv', dan_that_chau: 'tv',
    dan_boi_anh: 'tv', dan_hoi_anh: 'hp', dan_u_minh_giai_doc: 'hp', dan_tuyet_phach: 'mp', dan_van_nien_linh_nhu: 'mp',
    dan_van_nien_thiet_moc: 'cc', dan_tinh_huyet_ky_hoan: 'hp', dan_thai_at_tai_tao: 'hp', dan_niet_ban_hoi_xuan: 'hp',
    dan_huyen_ngoc_khu_doc: 'hp', dan_thanh_anh: 'tv', dan_huyet_diem_luyen_the: 'cc', dan_tu_diem_chan_hoa: 'tv',
    dan_phong_loi_kich_hoat: 'mp', dan_thien_bang_phong_loi: 'mp', dan_ngu_linh_ngoc_tuy: 'cc', dan_dia_tuyen_hoi_phap: 'hp', dan_van_tho: 'tho',
    dan_moc_tinh_van_tho: 'tho', dan_dia_uyen_moc_linh: 'tho', dan_thach_tuy_ho_the: 'cc', dan_kim_khuyet_sinh_co: 'mp', dan_cuu_diep_tai_sinh: 'hp'
  };

  function v161MoTa(cat, cg, hu) {
    let ten = 'tu sĩ';
    try { ten = layCanhGioiDef(cg).ten; } catch (e) { /* bỏ qua */ }
    if (cat === 'hp') return `Đan dược chuyên hồi phục Khí huyết dành cho ${ten}. Chỉ hồi máu, không tăng Tu vi hay hỗ trợ đột phá.`;
    if (cat === 'mp') return `Đan dược chuyên hồi phục Linh lực dành cho ${ten}. Chỉ hồi Linh lực, không hồi Khí huyết hay tăng Tu vi.`;
    if (cat === 'tv') return `Đan dược bổ sung Tu vi dành cho ${ten}. Chỉ tăng Tu vi, không hồi máu/linh lực.`;
    if (cat === 'dp') return `Đan dược hỗ trợ đột phá đại cảnh giới, tăng ${Math.round((Number(hu.bonusDotPha) || 0) * 100)}% tỷ lệ thành công. Không hồi máu hay tăng Tu vi.`;
    if (cat === 'cc') return `Đan dược tôi luyện Căn cốt vĩnh viễn +${hu.canCot || 1}. Không hồi máu hay tăng Tu vi.`;
    if (cat === 'tho') return `Đan dược kéo dài Thọ nguyên +${hu.thoNguyen || 0} năm. Không hồi máu hay tăng Tu vi.`;
    return '';
  }

  function v161ChuyenHoaDan(v) {
    const old = v.hieuUng || {};
    const cg = Number(v.canhGioi) || 0;
    let cat = PHAN_LOAI[v.id];
    if (!cat) cat = Number(old.bonusDotPha) > 0 ? 'dp' : 'tv';
    let hu = {};
    if (cat === 'hp') hu.hp = Math.max(10, Math.round(Number(old.hp) || 10));
    else if (cat === 'mp') hu.mp = Math.max(15, Math.round((Number(old.hp) || 10) * 2));
    else if (cat === 'tv') hu.tuVi = Math.max(10, Math.round(Number(old.tuVi) || 10));
    else if (cat === 'cc') hu.canCot = Math.max(1, Math.round(Number(old.canCot) || 1));
    else if (cat === 'tho') hu.thoNguyen = Math.max(5 + cg * 8, Math.round(Number(old.thoNguyen) || 0));
    else if (cat === 'dp') hu.bonusDotPha = Math.max(0.05, Math.min(0.7, Number(old.bonusDotPha) || 0.1));
    else hu.tuVi = Math.max(10, Math.round(Number(old.tuVi) || 10));
    v.hieuUng = hu;
    v.__v161Loai = cat;
    v.moTa = v161MoTa(cat, cg, hu);
  }

  try {
    if (window.PN_DATA && Array.isArray(window.PN_DATA.vatPham)) {
      window.PN_DATA.vatPham.filter(v => v && v.loai === 'dan').forEach(v161ChuyenHoaDan);
    }
  } catch (e) { /* bỏ qua */ }
})();
/* ------------------- 2. BỔ SUNG ĐAN CÒN THIẾU ------------------- */
(function () {
  'use strict';

  function moTa(cat, cg, hu) {
    let ten = 'tu sĩ';
    try { ten = layCanhGioiDef(cg).ten; } catch (e) { /* bỏ qua */ }
    if (cat === 'hp') return `Đan dược chuyên hồi phục Khí huyết dành cho ${ten}. Chỉ hồi máu, không tăng Tu vi hay hỗ trợ đột phá.`;
    if (cat === 'mp') return `Đan dược chuyên hồi phục Linh lực dành cho ${ten}. Chỉ hồi Linh lực, không hồi Khí huyết hay tăng Tu vi.`;
    if (cat === 'tv') return `Đan dược bổ sung Tu vi dành cho ${ten}. Chỉ tăng Tu vi, không hồi máu/linh lực.`;
    if (cat === 'dp') return `Đan dược hỗ trợ đột phá đại cảnh giới, tăng ${Math.round((Number(hu.bonusDotPha) || 0) * 100)}% tỷ lệ thành công. Không hồi máu hay tăng Tu vi.`;
    if (cat === 'cc') return `Đan dược tôi luyện Căn cốt vĩnh viễn +${hu.canCot || 1}. Không hồi máu hay tăng Tu vi.`;
    if (cat === 'tho') return `Đan dược kéo dài Thọ nguyên +${hu.thoNguyen || 0} năm. Không hồi máu hay tăng Tu vi.`;
    return '';
  }

  const DAN_MOI = [
    { id: 'dan_luyen_khi_161', ten: 'Luyện Khí Đan', cg: 0, gia: 120, loai: 'dp', giaTri: 0.1 },
    { id: 'dan_ket_dan_161', ten: 'Kết Đan Đan', cg: 2, gia: 2500, loai: 'dp', giaTri: 0.2 },
    { id: 'dan_hoi_nguyen_161', ten: 'Hồi Nguyên Đan', cg: 3, gia: 6000, loai: 'hp', giaTri: 900 },
    { id: 'dan_luc_hop_hoi_nguyen_161', ten: 'Lục Hợp Hồi Nguyên Đan', cg: 6, gia: 140000, loai: 'hp', giaTri: 12000 },
    { id: 'dan_luc_hop_tu_linh_161', ten: 'Lục Hợp Tụ Linh Đan', cg: 6, gia: 140000, loai: 'mp', giaTri: 14000 },
    { id: 'dan_luc_hop_tang_nguyen_161', ten: 'Lục Hợp Tăng Nguyên Đan', cg: 6, gia: 150000, loai: 'tv', giaTri: 200000 },
    { id: 'dan_hop_the_hoi_nguyen_161', ten: 'Hợp Thể Hồi Nguyên Đan', cg: 7, gia: 300000, loai: 'hp', giaTri: 35000 },
    { id: 'dan_hop_the_tu_linh_161', ten: 'Hợp Thể Tụ Linh Đan', cg: 7, gia: 300000, loai: 'mp', giaTri: 38000 },
    { id: 'dan_hop_the_tang_nguyen_161', ten: 'Hợp Thể Tăng Nguyên Đan', cg: 7, gia: 320000, loai: 'tv', giaTri: 700000 },
    { id: 'dan_hop_the_luyen_the_161', ten: 'Hợp Thể Luyện Thể Đan', cg: 7, gia: 340000, loai: 'cc', giaTri: 6 },
    { id: 'dan_dai_thua_hoi_nguyen_161', ten: 'Đại Thừa Hồi Nguyên Đan', cg: 8, gia: 700000, loai: 'hp', giaTri: 90000 },
    { id: 'dan_dai_thua_tu_linh_161', ten: 'Đại Thừa Tụ Linh Đan', cg: 8, gia: 700000, loai: 'mp', giaTri: 95000 },
    { id: 'dan_dai_thua_tang_nguyen_161', ten: 'Đại Thừa Tăng Nguyên Đan', cg: 8, gia: 750000, loai: 'tv', giaTri: 1800000 },
    { id: 'dan_dai_thua_truong_tho_161', ten: 'Đại Thừa Trường Thọ Đan', cg: 8, gia: 800000, loai: 'tho', giaTri: 8000 },
    { id: 'dan_do_kiep_hoi_nguyen_161', ten: 'Độ Kiếp Hồi Nguyên Đan', cg: 9, gia: 1200000, loai: 'hp', giaTri: 200000 },
    { id: 'dan_do_kiep_tu_linh_161', ten: 'Độ Kiếp Tụ Linh Đan', cg: 9, gia: 1200000, loai: 'mp', giaTri: 210000 },
    { id: 'dan_do_kiep_tang_nguyen_161', ten: 'Độ Kiếp Tăng Nguyên Đan', cg: 9, gia: 1300000, loai: 'tv', giaTri: 5000000 },
    { id: 'dan_do_kiep_luyen_the_161', ten: 'Độ Kiếp Luyện Thể Đan', cg: 9, gia: 1400000, loai: 'cc', giaTri: 25 }
  ];

  try {
    if (window.PN_DATA && Array.isArray(window.PN_DATA.vatPham)) {
      const daCo = new Set(window.PN_DATA.vatPham.map(v => v && v.id));
      DAN_MOI.forEach(d => {
        if (daCo.has(d.id)) return;
        const hu = {};
        if (d.loai === 'hp') hu.hp = d.giaTri;
        else if (d.loai === 'mp') hu.mp = d.giaTri;
        else if (d.loai === 'tv') hu.tuVi = d.giaTri;
        else if (d.loai === 'cc') hu.canCot = d.giaTri;
        else if (d.loai === 'tho') hu.thoNguyen = d.giaTri;
        else if (d.loai === 'dp') hu.bonusDotPha = d.giaTri;
        window.PN_DATA.vatPham.push({
          id: d.id, ten: d.ten, loai: 'dan', canhGioi: d.cg, gia: d.gia,
          hieuUng: hu, __v161Loai: d.loai, moTa: moTa(d.loai, d.cg, hu)
        });
      });
    }
  } catch (e) { /* bỏ qua */ }
})();
/* --------------- 3. SUY GIẢM THEO CẢNH GIỚI & TỒN KHO 1–9 --------------- */
(function () {
  'use strict';

  function v161HeSoLechCap(vp) {
    try {
      if (!vp || typeof state === 'undefined' || !state) return 1;
      const cgCur = Number(state.canhGioi) || 0;
      const cgVp = Number(vp.canhGioi) || 0;
      const lech = cgCur - cgVp;
      if (lech <= 1) return 1;
      return Math.max(0.35, 1 - 0.3 * (lech - 1));
    } catch (e) {
      return 1;
    }
  }
  window.v161HeSoLechCap = v161HeSoLechCap;

  function v161Hash(str) {
    let h = 2166136261;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function v161ShopKey() {
    try {
      if (typeof shopHangCache !== 'undefined' && shopHangCache && shopHangCache.key) return shopHangCache.key;
    } catch (e) { /* bỏ qua */ }
    return 'shop';
  }

  function v161TonKhoGoc(sKey) {
    return 1 + (v161Hash(v161ShopKey() + '|' + sKey) % 9);
  }

  function v161DaMua(key, sKey) {
    try {
      const map = state.shopDaMua || {};
      const m = map[key] || {};
      return Number(m[sKey]) || 0;
    } catch (e) {
      return 0;
    }
  }

  function v161TonKhoCon(sKey) {
    const key = v161ShopKey();
    return Math.max(0, v161TonKhoGoc(sKey) - v161DaMua(key, sKey));
  }

  function v161GhiNhanMua(sKey, soLuong) {
    try {
      if (!state) return;
      if (!state.shopDaMua || typeof state.shopDaMua !== 'object') state.shopDaMua = {};
      const key = v161ShopKey();
      if (!state.shopDaMua[key] || typeof state.shopDaMua[key] !== 'object') state.shopDaMua[key] = {};
      state.shopDaMua[key][sKey] = (Number(state.shopDaMua[key][sKey]) || 0) + Math.max(1, Number(soLuong) || 1);
      const keys = Object.keys(state.shopDaMua);
      if (keys.length > 40) keys.slice(0, keys.length - 40).forEach(k => delete state.shopDaMua[k]);
      if (typeof luuGame === 'function') luuGame();
      if (typeof veGiaoDien === 'function') veGiaoDien();
    } catch (e) { /* bỏ qua */ }
  }

  window.v161TonKhoGoc = v161TonKhoGoc;
  window.v161TonKhoCon = v161TonKhoCon;

  // Mua 1 đan: chặn khi hết hàng, ghi nhận số đã mua
  if (typeof window.muaVatPham === 'function') {
    const gocMua = window.muaVatPham;
    window.muaVatPham = function (loaiMua, idOrKey, soLuongMua) {
      try {
        const soLuong = Number(soLuongMua) || 1;
        if (loaiMua === 'vat_pham' && soLuong > 1) return gocMua.apply(this, arguments);
        const vp = typeof layVatPhamDef === 'function' ? layVatPhamDef(idOrKey) : null;
        if (loaiMua === 'vat_pham' && vp && vp.loai === 'dan') {
          const con = v161TonKhoCon(idOrKey);
          if (con <= 0) {
            toast('📦 Món đan này đã hết hàng trong phiên chợ hiện tại!', 'canh_bao');
            return;
          }
          const truoc = soLuongVat(idOrKey);
          const kq = gocMua.apply(this, arguments);
          const sau = soLuongVat(idOrKey);
          if (sau > truoc) v161GhiNhanMua(idOrKey, sau - truoc);
          return kq;
        }
      } catch (e) { /* bỏ qua */ }
      return gocMua.apply(this, arguments);
    };
  }

  // Mua nhiều: giới hạn theo tồn kho còn lại
  if (typeof window.muaNhieuVatPham === 'function') {
    const gocNhieu = window.muaNhieuVatPham;
    window.muaNhieuVatPham = function (idOrKey, soLuong) {
      try {
        const vp = typeof layVatPhamDef === 'function' ? layVatPhamDef(idOrKey) : null;
        if (vp && vp.loai === 'dan') {
          const con = v161TonKhoCon(idOrKey);
          if (con <= 0) {
            toast('📦 Món đan này đã hết hàng trong phiên chợ hiện tại!', 'canh_bao');
            return;
          }
          const mua = Math.min(Math.max(1, Number(soLuong) || 1), con);
          const truoc = soLuongVat(idOrKey);
          const kq = gocNhieu.call(this, idOrKey, mua);
          const sau = soLuongVat(idOrKey);
          if (sau > truoc) v161GhiNhanMua(idOrKey, sau - truoc);
          return kq;
        }
      } catch (e) { /* bỏ qua */ }
      return gocNhieu.apply(this, arguments);
    };
  }

  // Di trú save & ghi nhận phiên bản
  function v161Init() {
    try {
      if (typeof state === 'undefined' || !state) return;
      if (!state.shopDaMua || typeof state.shopDaMua !== 'object') state.shopDaMua = {};
      if (!state.v161DaThongBao) {
        state.v161DaThongBao = true;
        if (typeof ghiNhatKy === 'function') {
          ghiNhatKy('🛠️ Cập nhật v1.6.1: đan dược chuyên biệt (HP/MP/Tu vi/Đột phá), tồn kho 1–9, chợ chỉ bán đồ ngang cảnh giới.', 'tot');
        }
        if (typeof luuGame === 'function') luuGame();
        if (typeof veGiaoDien === 'function') veGiaoDien();
      }
    } catch (e) { /* bỏ qua */ }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(v161Init, 0); });
  } else {
    setTimeout(v161Init, 0);
  }
})();