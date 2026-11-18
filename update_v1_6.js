/* =====================================================================
 * UPDATE v1.6 — CHU KỲ BÍ CẢNH · CÂN BẰNG KẾT ĐAN · AN TOÀN THAO TÁC
 *  - Mỗi bí cảnh có thời gian đóng/mở riêng, không thể farm liên tục
 *  - Toái Đan có nút "Hủy an toàn" + ESC, cảnh báo trước khi đổi pháp bảo Bản Mệnh
 *  - Quái vượt cảnh giới được scale uy lực; thưởng Linh thạch Kết Đan ×1.5
 *  - Chợ: thêm pháp bảo Kết Đan giá hợp lý, giảm giá đan Kết Đan
 *  - Nhiệm vụ trưởng lão: chuỗi 3 nhiệm vụ + thông báo lượt mới
 * ===================================================================== */
(function () {
  'use strict';

  /* ---------------------- 1. CHU KỲ ĐÓNG/MỞ BÍ CẢNH ---------------------- */

  // Các chu kỳ đặc biệt không ghi số năm cụ thể -> quy ước hợp lý
  const CHU_KY_DAC_BIET = {
    'bất định': 25,                   // mở thất thường, tạm tính 25 năm
    'đặc biệt': 30,
    'phong ấn vỡ mở': 50,
    'khi độ kiếp thành công': 50,
    'theo đại điển': 30
  };

  function v16ChuKyBiCanh(bc) {
    if (!bc) return 0;
    const raw = String(bc.chuKyMo || '').trim();
    if (!raw) return 0;
    const khoa = raw.toLowerCase();
    // "Thường trực": vẫn cho mở thường xuyên nhưng phải có thời gian hồi ngắn,
    // khác nhau theo quy mô bí cảnh (thời gian thám hiểm + cấp cao nhất + biến thiên theo id)
    if (khoa === 'thường trực') {
      const namTon = Math.max(1, Number(bc.namTon) || 1);
      const cgMax = Math.max(1, Number(bc.canhGioiMax) || 1);
      let h = 0;
      const id = String(bc.id || bc.ten || '');
      for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
      return Math.max(2, Math.min(20, Math.round(namTon * 2 + cgMax + (h % 3))));
    }
    if (Object.prototype.hasOwnProperty.call(CHU_KY_DAC_BIET, khoa)) return CHU_KY_DAC_BIET[khoa];
    const m = raw.match(/(\d[\d.,]*)\s*năm/i);
    if (m) {
      const so = Number(String(m[1]).replace(/[.,]/g, ''));
      if (Number.isFinite(so) && so > 0) return Math.round(so);
    }
    return 0;
  }

  // Nhãn hiển thị: giữ nguyên mô tả gốc, bổ sung số năm chu kỳ nếu chưa có
  function v16NhanChuKy(bc) {
    const raw = String((bc && bc.chuKyMo) || 'Thường trực');
    const so = v16ChuKyBiCanh(bc);
    if (!so || /năm/i.test(raw)) return raw;
    return `${raw} (≈${so} năm/lần)`;
  }
  window.v16NhanChuKy = v16NhanChuKy;

  function v16DamBaoState() {
    if (typeof state === 'undefined' || !state) return null;
    if (!state.biCanhMoLai || typeof state.biCanhMoLai !== 'object') state.biCanhMoLai = {};
    return state.biCanhMoLai;
  }

  // Số năm còn lại tới lần mở kế tiếp (0 = đang mở)
  function v16ConLaiBiCanh(biCanhId) {
    try {
      const soDo = v16DamBaoState();
      if (!soDo || !biCanhId) return 0;
      const namMo = Number(soDo[biCanhId]) || 0;
      const con = Math.ceil(namMo - (Number(state.nam) || 0));
      return con > 0 ? con : 0;
    } catch (e) {
      return 0;
    }
  }
  window.v16ChuKyBiCanh = v16ChuKyBiCanh;
  window.v16ConLaiBiCanh = v16ConLaiBiCanh;

  // Chặn vào bí cảnh khi chưa tới chu kỳ (kiểm tra cả ở tầng logic, không chỉ UI)
  (function bocVaoBiCanh() {
    if (typeof window.thamHiemBiCanh !== 'function') return;
    const goc = window.thamHiemBiCanh;
    window.thamHiemBiCanh = function (biCanhId) {
      const con = v16ConLaiBiCanh(biCanhId);
      if (con > 0) {
        const bc = (window.PN_DATA.biCanh || []).find(x => x.id === biCanhId);
        const ten = bc ? bc.ten : biCanhId;
        const chuKy = v16ChuKyBiCanh(bc);
        toast(`⏳ 【${ten}】 đang đóng (chu kỳ ${chuKy} năm) — mở lại sau ${con} năm.`, 'canh_bao', 6000);
        ghiNhatKy(`⏳ 【${ten}】 chưa tới kỳ mở (còn ${con} năm).`, 'canh_bao');
        return;
      }
      return goc.apply(this, arguments);
    };
  })();

  // Ghi nhận năm đóng khi kết thúc chuyến thám hiểm (hoàn thành hoặc rút lui)
  (function bocKetThucBiCanh() {
    if (typeof window.hoanThanhBiCanh !== 'function') return;
    const goc = window.hoanThanhBiCanh;
    window.hoanThanhBiCanh = function (rutLui) {
      const run = state && state.biCanhHienTai ? { ...state.biCanhHienTai } : null;
      const kq = goc.apply(this, arguments);
      try {
        const soDo = v16DamBaoState();
        if (run && run.id && soDo) {
          const bc = (window.PN_DATA.biCanh || []).find(x => x.id === run.id);
          const chuKy = v16ChuKyBiCanh(bc);
          if (chuKy > 0) {
            soDo[run.id] = (Number(state.nam) || 0) + chuKy;
            ghiNhatKy(
              `⏳ 【${run.ten}】 khép lại theo chu kỳ — mở lại vào năm ${soDo[run.id]} (sau ${chuKy} năm).`,
              'thuong'
            );
          }
        }
      } catch (e) { /* bỏ qua */ }
      return kq;
    };
  })();

  /* ------------------- 2. MODAL XÁC NHẬN DÙNG CHUNG ------------------- */

  function v16DongXacNhan() {
    const el = document.getElementById('modal-v16-xacnhan');
    if (el) el.remove();
  }
  window.v16DongXacNhan = v16DongXacNhan;

  function v16XacNhan(tuyChon) {
    v16DongXacNhan();
    const o = tuyChon || {};
    const el = document.createElement('div');
    el.id = 'modal-v16-xacnhan';
    el.className = 'modal-overlay';
    el.innerHTML = `
      <div class="modal-box">
        <div class="panel-title">${o.tieuDe || '⚠️ Xác nhận thao tác'}</div>
        <p>${o.noiDung || ''}</p>
        ${o.canhBao ? `<div class="hint-line">${o.canhBao}</div>` : ''}
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
          <button class="btn btn-primary" id="v16-xn-dong-y">${o.nutXacNhan || '✅ Đồng ý'}</button>
          <button class="btn" id="v16-xn-huy">↩️ Hủy bỏ</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    el.querySelector('#v16-xn-huy').onclick = () => {
      v16DongXacNhan();
      if (typeof o.onHuy === 'function') o.onHuy();
    };
    el.querySelector('#v16-xn-dong-y').onclick = () => {
      v16DongXacNhan();
      if (typeof o.onXacNhan === 'function') o.onXacNhan();
    };
  }
  window.v16XacNhan = v16XacNhan;
})();
/* ------------------- 3. AN TOÀN THAO TÁC & CÂN BẰNG ------------------- */
(function () {
  'use strict';

  // ESC: đóng Toái Đan (hủy an toàn) hoặc modal xác nhận
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (document.getElementById('modal-toai-dan') && typeof window.v15TDChon === 'function') {
      e.preventDefault();
      window.v15TDChon(9);
      return;
    }
    if (document.getElementById('modal-v16-xacnhan')) {
      e.preventDefault();
      if (typeof window.v16DongXacNhan === 'function') window.v16DongXacNhan();
    }
  });

  // Cảnh báo & chuyển liên kết khi đổi pháp bảo đang là Bản Mệnh
  (function bocDoiPhapBao() {
    if (typeof window.dungVatPham !== 'function') return;
    const goc = window.dungVatPham;
    window.dungVatPham = function (itemId) {
      try {
        const vp = typeof layVatPhamDef === 'function' ? layVatPhamDef(itemId) : null;
        const bm = state && state.banMenh;
        const laDoi = vp && vp.loai === 'phap_bao' && state && state.phapBao !== itemId;
        if (laDoi && bm && bm.key && bm.key !== itemId && (Number(bm.cap) || 0) > 0) {
          const capCu = Number(bm.cap) || 0;
          const capMoi = Math.floor(capCu / 2);
          v16XacNhan({
            tieuDe: '⚠️ Đổi pháp bảo đang là Bản Mệnh',
            noiDung: `Bản Mệnh đang liên kết với pháp bảo khác (Cấp <b>${capCu}</b>). Nếu đổi sang <b>${escapeHtml(vp.ten)}</b>, liên kết cũ sẽ đứt và cấp Bản Mệnh bị đặt lại.`,
            canhBao: `Bạn có thể chọn <b>chuyển liên kết</b>: giữ lại <b>${capMoi}/${capCu}</b> cấp Bản Mệnh (làm tròn xuống 50%) cùng các dòng thuộc tính đã khắc.`,
            nutXacNhan: `🔆 Đổi & giữ ${capMoi} cấp Bản Mệnh`,
            onXacNhan: function () {
              try {
                const aff = Array.isArray(bm.affixes) ? bm.affixes.slice(0, capMoi) : [];
                state.banMenh = { key: itemId, cap: capMoi, affixes: aff };
                ghiNhatKy(`🔆 Chuyển Bản Mệnh sang [${vp.ten}] — giữ ${capMoi}/${capCu} cấp.`, 'tot');
                toast(`🔆 Bản Mệnh đã chuyển sang ${vp.ten} (${capMoi} cấp)`, 'tot', 5000);
              } catch (e) { /* bỏ qua */ }
              goc.call(window, itemId);
            }
          });
          return;
        }
      } catch (e) { /* bỏ qua */ }
      return goc.apply(this, arguments);
    };
  })();

  // Xác nhận trước hành động phá hủy / tốn phí lớn của Động Phủ
  (function bocDongPhu() {
    if (typeof window.phaHuyDongPhu === 'function') {
      const gocPha = window.phaHuyDongPhu;
      window.phaHuyDongPhu = function () {
        const cayMat = ((state && state.dongPhu && state.dongPhu.linhDien) || []).filter(Boolean).length;
        const capDp = (state && state.dongPhu && state.dongPhu.cap) || 0;
        v16XacNhan({
          tieuDe: '💥 Phá hủy Động Phủ',
          noiDung: `Bạn sắp phá hủy <b>Động Phủ Cấp ${capDp}</b>${cayMat > 0 ? ` cùng <b>${cayMat} gốc thảo dược</b> chưa thu hoạch` : ''}. Chỉ thu hồi được 25% giá trị nâng cấp.`,
          canhBao: 'Thao tác này không thể hoàn tác!',
          nutXacNhan: '💥 Phá hủy',
          onXacNhan: function () {
            gocPha.apply(window, arguments);
          }
        });
      };
    }
    if (typeof window.doiDongPhuVeDay === 'function') {
      const gocDoi = window.doiDongPhuVeDay;
      window.doiDongPhuVeDay = function () {
        const gia = typeof giaDoiDongPhu === 'function' ? giaDoiDongPhu() : 0;
        v16XacNhan({
          tieuDe: '🚚 Di dời Động Phủ',
          noiDung: `Di dời Động Phủ & Tụ Linh Trận tới <b>【${layVungDef().ten}】</b> với phí <b>${Number(gia).toLocaleString('vi-VN')} LT</b>?`,
          nutXacNhan: `🚚 Dời (${Number(gia).toLocaleString('vi-VN')} LT)`,
          onXacNhan: function () {
            gocDoi.apply(window, arguments);
          }
        });
      };
    }
  })();

  // Quái vượt cảnh giới: tiết giảm uy lực; thưởng Linh thạch Kết Đan ×1.5
  (function bocChienDau() {
    if (typeof window.batDauChienDau !== 'function') return;
    const goc = window.batDauChienDau;
    let daCanhBao = false;
    window.batDauChienDau = function (dich) {
      try {
        if (dich && typeof dich === 'object' && typeof state !== 'undefined' && state) {
          const cgP = Number(state.canhGioi) || 0;
          const cgD = Number(dich.canhGioiDich) || 0;
          if (cgD > cgP) {
            const diff = cgD - cgP;
            const hsHp = Math.max(0.4, Math.pow(0.72, diff));
            const hsAtk = Math.max(0.5, Math.pow(0.8, diff));
            dich.hp = Math.max(1, Math.round((Number(dich.hp) || 1) * hsHp));
            dich.congKich = Math.max(1, Math.round((Number(dich.congKich) || 1) * hsAtk));
            dich.phongThu = Math.max(0, Math.round((Number(dich.phongThu) || 0) * hsAtk));
            if (!daCanhBao) {
              daCanhBao = true;
              toast(`⚠️ Đối thủ vượt ${diff} cảnh giới — uy lực đã được tiết giảm để cân bằng.`, 'canh_bao', 6000);
            }
          }
          if (cgP >= 3 && Number(dich.linhThach) > 0) {
            dich.linhThach = Math.round(Number(dich.linhThach) * 1.5);
          }
        }
      } catch (e) { /* bỏ qua */ }
      return goc.apply(this, arguments);
    };
  })();
})();
/* ------------------------- 4. KINH TẾ KẾT ĐAN ------------------------- */
(function () {
  'use strict';

  // Thêm pháp bảo cấp Kết Đan giá hợp lý để lấp khoảng trống trang bị
  const PB_KET_DAN = [
    {
      id: 'pb_thanh_giao_giap',
      ten: 'Thanh Giao Bảo Giáp',
      loai: 'phap_bao',
      phanCap: 'Pháp khí',
      canhGioi: 3,
      congKich: 180,
      phongThu: 560,
      gia: 9000,
      moTa: 'Bảo giáp dệt từ vảy Thanh Giao nghìn năm, phòng ngự vững chắc, phù hợp tu sĩ Kết Đan mới kết đan.'
    },
    {
      id: 'pb_huyen_thiet_trong_kiem',
      ten: 'Huyền Thiết Trọng Kiếm',
      loai: 'phap_bao',
      phanCap: 'Pháp khí',
      canhGioi: 3,
      congKich: 620,
      phongThu: 150,
      gia: 12000,
      moTa: 'Trọng kiếm đúc từ Huyền Thiết, nặng nhưng uy lực, một kiếm phá vỡ hộ thể chân nguyên.'
    },
    {
      id: 'pb_tu_linh_ngoc_boi',
      ten: 'Tụ Linh Ngọc Bội',
      loai: 'phap_bao',
      phanCap: 'Pháp khí',
      canhGioi: 3,
      congKich: 120,
      phongThu: 300,
      gia: 8000,
      moTa: 'Ngọc bội tụ linh khí trời đất, bổ trợ công thủ nhẹ nhàng cho tu sĩ Kết Đan.'
    }
  ];
  try {
    if (window.PN_DATA && Array.isArray(window.PN_DATA.vatPham)) {
      const daCo = new Set(window.PN_DATA.vatPham.map(v => v && v.id));
      PB_KET_DAN.forEach(v => {
        if (!daCo.has(v.id)) window.PN_DATA.vatPham.push({ ...v });
      });
    }
  } catch (e) { /* bỏ qua */ }

  // Điều chỉnh giá chợ: đan Kết Đan rẻ hơn, pháp bảo Kết Đan cao cấp giảm nhẹ
  (function bocGiaShop() {
    if (typeof window.layKhoHangShop !== 'function') return;
    const goc = window.layKhoHangShop;
    window.layKhoHangShop = function (vung, maxCg) {
      const kho = goc.apply(this, arguments);
      try {
        if (kho && Array.isArray(kho.items) && !kho.__v16Gia) {
          kho.__v16Gia = true;
          kho.items.forEach(it => {
            const cg = Number(it.canhGioi) || 0;
            const gia = Number(it.giaShop) || 0;
            if (it.loai === 'dan' && cg === 3 && Number(it.hieuUng && it.hieuUng.bonusDotPha) > 0) {
              it.giaShop = Math.max(1, Math.round(gia * 0.6));
            }
            if (it.loai === 'phap_bao' && cg === 3 && gia >= 20000) {
              it.giaShop = Math.max(1, Math.round(gia * 0.75));
            }
          });
        }
      } catch (e) { /* bỏ qua */ }
      return kho;
    };
  })();
})();

/* ---------------- 5. THÔNG BÁO & KHỞI TẠO v1.6 ---------------- */
(function () {
  'use strict';

  // Thông báo khi có lượt nhiệm vụ trưởng lão mới / bí cảnh mở lại
  (function bocQuaNam() {
    if (typeof window.quaNam !== 'function') return;
    const goc = window.quaNam;
    const daBaoMoLai = {};
    let daBaoChoNam = null;
    window.quaNam = function () {
      const kq = goc.apply(this, arguments);
      try {
        if (
          typeof state !== 'undefined' && state && !state.ketThuc &&
          !state.tranHienTai && !state.suKienHienTai && !state.hauChienNpc && !state.biCanhHienTai
        ) {
          const nam = Number(state.nam) || 0;
          if ((state.canhGioi || 0) >= 3 && state.tongMon) {
            const tt = state.v14NvTruongLao || { nam: -999 };
            // Chỉ báo 1 lần cho mỗi lượt (khi tt.nam đổi sau khi nhận nhiệm vụ)
            if (nam - (Number(tt.nam) || -999) >= 3 && daBaoChoNam !== tt.nam) {
              daBaoChoNam = tt.nam;
              toast('🎖️ Có lượt Nhiệm vụ Trưởng lão mới! (mục Tông Môn)', 'tot', 5000);
            }
          }
          const soDo = state.biCanhMoLai || {};
          Object.keys(soDo).forEach(id => {
            if (Number(soDo[id]) === nam && daBaoMoLai[id] !== nam) {
              daBaoMoLai[id] = nam;
              const bc = (window.PN_DATA.biCanh || []).find(x => x.id === id);
              toast(`🌀 【${bc ? bc.ten : id}】 đã mở lại theo chu kỳ!`, 'tot', 5500);
            }
          });
        }
      } catch (e) { /* bỏ qua */ }
      return kq;
    };
  })();

  // Di trú dữ liệu save cũ & ghi nhật ký phiên bản (1 lần / save)
  function v16DiTruSave() {
    try {
      if (typeof state === 'undefined' || !state) return;
      if (!state.biCanhMoLai || typeof state.biCanhMoLai !== 'object') state.biCanhMoLai = {};
      if (state.v14NvTruongLao && typeof state.v14NvTruongLao === 'object' && typeof state.v14NvTruongLao.count !== 'number') {
        state.v14NvTruongLao.count = 0;
      }
      if (!state.v16DaThongBao) {
        state.v16DaThongBao = true;
        if (typeof ghiNhatKy === 'function') {
          ghiNhatKy('🛠️ Cập nhật v1.6: mỗi bí cảnh có chu kỳ đóng/mở riêng; Toái Đan hủy an toàn; cân bằng quái & kinh tế Kết Đan.', 'tot');
        }
        if (typeof luuGame === 'function') luuGame();
        if (typeof veGiaoDien === 'function') veGiaoDien();
      }
    } catch (e) { /* bỏ qua */ }
  }
  // Phải chạy SAU khi game.js nạp save (DOMContentLoaded), nếu không sẽ ghi vào state mặc định
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(v16DiTruSave, 0); });
  } else {
    setTimeout(v16DiTruSave, 0);
  }
})();