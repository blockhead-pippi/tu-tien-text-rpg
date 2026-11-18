/* ============================================================================
   PHÀM NHÂN TU TIÊN — UPDATE v1.2  "Fix bug + Tính năng từ playtest"
   Nạp sau update_v1_1.js.
   Gồm:
     1) Hộp xác nhận Xung kích Đại Cảnh Giới (kèm dự báo hậu quả)
     2) Kho Động Phủ (lấy/gửi nguyên liệu) — phối hợp auto-stash khi túi đầy
     3) Bán theo nhóm: Trung phẩm / nguyên liệu thừa
     4) Gợi ý vùng phường thị phù hợp cảnh giới
     5) Vá lỗi nhỏ & thông báo
   ============================================================================ */

const PN_V12 = { VERSION: '1.2.0' };

/* -------------------- 1. GỢI Ý VÙNG PHÙ HỢP CẢNH GIỚI -------------------- */

function goiYVungPhuHop() {
  if (typeof state === 'undefined' || !state) return null;
  const cg = state.canhGioi || 0;
  const hienTai = layVungDef();
  // Đang ở vùng có phường thị ngang tầm cảnh giới thì không cần gợi ý
  if (hienTai.coPhuongThi && Number(hienTai.canhGioiYeuCau || 0) >= Math.max(0, cg - 1)) return null;

  const ds = (window.PN_DATA.vungDat || [])
    .filter(v => v.coPhuongThi && Number(v.canhGioiYeuCau || 0) <= cg && v.id !== hienTai.id)
    .sort((a, b) => (Number(b.linhKhi) || 1) - (Number(a.linhKhi) || 1) || Number(b.canhGioiYeuCau || 0) - Number(a.canhGioiYeuCau || 0));
  return ds[0] || null;
}

/* ------------------ 2. XÁC NHẬN XUNG KÍCH ĐẠI CẢNH GIỚI ------------------ */

function v12MoTaHauQua() {
  const cgKe = Math.min(10, (state.canhGioi || 0) + 1);
  const tenKe = layCanhGioiDef(cgKe).ten;
  const tiLe = Math.round(tinhTiLeDotPhaDaiCanh() * 100);
  const pill = typeof timDanDotPhaTrongTui === 'function' ? timDanDotPhaTrongTui() : null;
  const hsThamNien = typeof heSoThamNienCongPhap === 'function' ? heSoThamNienCongPhap() : 1;
  const chiTiet = typeof moTaChiTietDotPha === 'function' ? moTaChiTietDotPha() : '';

  const dong = [];
  dong.push(`<div class="stat-row"><span>Cảnh giới hiện tại:</span> <b class="hl-realm">${tenCanhGioiDayDu()}</b></div>`);
  dong.push(`<div class="stat-row"><span>Mục tiêu:</span> <b class="hl-gold">${tenKe}</b></div>`);
  dong.push(`<div class="stat-row"><span>Tu vi:</span> <b>${state.tuVi.toLocaleString('vi-VN')} / ${tinhTuViCan().toLocaleString('vi-VN')}</b></div>`);
  dong.push(`<div class="stat-row"><span>Tỉ lệ thành công:</span> <b class="hl-green">${tiLe}%</b></div>`);
  dong.push(`<div class="stat-row"><span>Đan hỗ trợ:</span> <span>${pill ? `<b>${escapeHtml(pill.vp.ten)}</b> (+${Math.round(pill.bonus * 100)}% — sẽ tự dùng)` : '<span class="muted">Không có</span>'}</span></div>`);
  dong.push(`<div class="stat-row"><span>Thâm niên công pháp:</span> <span>${hsThamNien >= 1 ? '<b class="hl-green">Đã đủ (100%)</b>' : hsThamNien >= 0.5 ? '<b class="hl-warn" style="color:var(--gold)">Mới đổi (50%)</b>' : '<b class="hl-danger">Quá mới (0%)</b>'}</span></div>`);
  if (chiTiet) dong.push(`<div class="hint-line">${escapeHtml(chiTiet)}</div>`);

  dong.push(`<div class="hint-line">⚠️ <b>Nếu thất bại:</b> tụt 1 tiểu cảnh giới, mất khoảng 65–75% Tu vi, chịu thương thế và có nguy cơ <b>Tẩu hỏa nhập ma</b> (mất thêm tu vi/căn cốt). Đan hỗ trợ vẫn bị tiêu hao.</div>`);
  if ((state.canhGioi || 0) === 3 && typeof laDinhPhongDaiCanh === 'function' && laDinhPhongDaiCanh()) {
    dong.push(`<div class="hint-line">🌀 <b>Bước tiếp theo:</b> sau khi xác nhận sẽ bước vào <b>Toái Đan 3 chặng</b> (Tâm Ma → Thiên Lôi → Toái Đan). Vượt càng tốt càng tăng tỉ lệ, tối đa <b>+25%</b>; có thể <b>Hủy an toàn</b> ở mọi chặng (chặng 1 miễn phí, chặng sau −2% Tu vi).</div>`);
  }
  if ((state.thuongThe || 0) >= 2) {
    dong.push(`<div class="hint-line">🩺 Bạn đang bị thương (${layThuongTheDef().ten}) — nên <b>Điều dưỡng thương thế</b> trước khi xung kích.</div>`);
  }
  if ((state.dotPhaBuff || 0) > 0) {
    dong.push(`<div class="hint-line">💊 Đang mang dược lực đột phá +${Math.round(state.dotPhaBuff * 100)}%.</div>`);
  }
  return dong.join('');
}

function moXacNhanDotPha() {
  const body = document.getElementById('confirm-dotpha-body');
  const modal = document.getElementById('modal-confirm-dotpha');
  if (!body || !modal) return;
  body.innerHTML = v12MoTaHauQua();
  modal.classList.add('open');
}

function dongXacNhanDotPha() {
  const modal = document.getElementById('modal-confirm-dotpha');
  if (modal) modal.classList.remove('open');
}

function xacNhanDotPhaThatSu() {
  window.__pnDaXacNhanDotPha = true;
  dongXacNhanDotPha();
  try {
    if (typeof dotPha === 'function') dotPha();
  } finally {
    window.__pnDaXacNhanDotPha = false;
  }
}

// Bọc dotPha: chặn thao tác nhầm khi xung kích đại cảnh giới
(function bocDotPha() {
  if (typeof window.dotPha !== 'function') return;
  const goc = window.dotPha;
  window.dotPha = function () {
    try {
      if (typeof state !== 'undefined' && state && typeof laDinhPhongDaiCanh === 'function' && laDinhPhongDaiCanh()) {
        const busy = state.ketThuc || state.tranHienTai || state.suKienHienTai || state.hauChienNpc;
        if (!busy && !window.__pnDaXacNhanDotPha) {
          moXacNhanDotPha();
          return;
        }
      }
    } catch (e) { /* nếu lỗi thì cho chạy như cũ */ }
    return goc.apply(this, arguments);
  };
})();

/* --------------------------- 3. KHO ĐỘNG PHỦ --------------------------- */

const V12_KHO_LOAI = ['linh_thao', 'linh_vat', 'yeu_dan', 'phu_luc'];

function layMotTuKho(key, soLuong) {
  if (!state || !key) return;
  state.khoDo = state.khoDo || {};
  const co = Number(state.khoDo[key] || 0);
  if (co <= 0) return;
  const n = Math.max(1, Math.min(co, Number(soLuong) || 1));
  const daCoTrongTui = soLuongVat(key) > 0;
  if (!daCoTrongTui && soOTrongTui() >= (state.tuiDoMaxO || 10)) {
    toast('⚠️ Túi trữ vật đã đầy — hãy bán bớt hoặc mở rộng túi', 'canh_bao');
    return;
  }
  state.tuiDo[key] = (state.tuiDo[key] || 0) + n;
  state.khoDo[key] = co - n;
  if (state.khoDo[key] <= 0) delete state.khoDo[key];
  const vp = layVatPhamDef(key);
  toast(`📤 Lấy ${n} × ${vp ? vp.ten : key} từ Kho Động Phủ`, 'tot');
  luuGame();
  veGiaoDien();
}

function layHetKhoRaTui() {
  if (!state) return;
  const ds = Object.entries(state.khoDo || {}).filter(([, sl]) => sl > 0);
  if (ds.length === 0) return;
  let layDuoc = 0;
  let biKet = 0;
  for (const [key, sl] of ds) {
    const daCo = soLuongVat(key) > 0;
    if (!daCo && soOTrongTui() >= (state.tuiDoMaxO || 10)) {
      biKet += 1;
      continue;
    }
    state.tuiDo[key] = (state.tuiDo[key] || 0) + sl;
    state.khoDo[key] = 0;
    delete state.khoDo[key];
    layDuoc += 1;
  }
  if (layDuoc > 0) toast(`📤 Đã lấy ${layDuoc} loại từ Kho Động Phủ`, 'tot');
  if (biKet > 0) toast(`⚠️ Túi đầy — còn ${biKet} loại ở lại trong kho`, 'canh_bao');
  luuGame();
  veGiaoDien();
}

function guiHetNguyenLieuVaoKho() {
  if (!state) return;
  state.khoDo = state.khoDo || {};
  let soLoai = 0;
  let soLuong = 0;
  for (const [key, sl] of Object.entries(state.tuiDo || {})) {
    if (sl <= 0) continue;
    const vp = layVatPhamDef(key);
    if (!vp || !V12_KHO_LOAI.includes(vp.loai)) continue;
    state.khoDo[key] = (state.khoDo[key] || 0) + sl;
    delete state.tuiDo[key];
    soLoai += 1;
    soLuong += sl;
  }
  if (soLoai === 0) {
    toast('Không có nguyên liệu nào trong túi để gửi kho.', 'canh_bao');
    return;
  }
  ghiNhatKy(`📦 Gửi ${soLuong} nguyên liệu (${soLoai} loại) vào Kho Động Phủ để dọn túi.`, 'thuong');
  toast(`📦 Đã gửi ${soLoai} loại nguyên liệu vào kho`, 'tot');
  luuGame();
  veGiaoDien();
}

/* ------------------ 4. BÁN NHANH THEO NHÓM PHẨM CHẤT ------------------ */

function chonTrungPhamBanDo() {
  const ds = layDanhSachIdBanTrongTui(uiFilter.shopQuery).filter(id => layPhamChatVatPham(id).key === 'trung');
  for (const id of ds) shopSellSelected.add(id);
  toast(`☑️ Đã chọn ${ds.length} món Trung phẩm`, ds.length ? 'tot' : 'canh_bao');
  veCotPhai();
}

function chonNguyenLieuThuaBanDo() {
  const canChoDan = new Set();
  (window.PN_DATA.danPhuong || [])
    .filter(dp => Array.isArray(state.danPhuongDaHoc) && state.danPhuongDaHoc.includes(dp.id))
    .forEach(dp => (dp.nguyenLieu || []).forEach(n => canChoDan.add(n.id)));

  const ds = layDanhSachIdBanTrongTui(uiFilter.shopQuery).filter(id => {
    const vp = layVatPhamDef(id);
    if (!vp || !['linh_thao', 'linh_vat', 'yeu_dan'].includes(vp.loai)) return false;
    const base = tachItemKey(id).baseId;
    return !canChoDan.has(base); // không đụng nguyên liệu cho đan phương đã học
  });
  for (const id of ds) shopSellSelected.add(id);
  toast(`☑️ Đã chọn ${ds.length} loại nguyên liệu thừa (không dùng cho đan phương đã học)`, ds.length ? 'tot' : 'canh_bao');
  veCotPhai();
}

/* ------------------------------ 5. KHỞI TẠO ------------------------------ */

window.addEventListener('DOMContentLoaded', () => {
  // ESC đóng hộp xác nhận đột phá
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const modal = document.getElementById('modal-confirm-dotpha');
    if (modal && modal.classList.contains('open')) {
      dongXacNhanDotPha();
    }
  });

  // Nhắc nhẹ nếu vùng hiện tại không phục vụ được cảnh giới (sau khi đã có nhân vật)
  setTimeout(() => {
    try {
      if (typeof state === 'undefined' || !state) return;
      const v = goiYVungPhuHop();
      if (v && state.canhGioi >= 2) {
        toast(`🏯 Vùng này không có chợ cấp 【${layCanhGioiDef(state.canhGioi).ten}】 — gợi ý tới ${v.ten} (LK x${v.linhKhi}). Xem tab 🗺️ Bản Đồ.`, 'canh_bao', 6500);
      }
    } catch (e) {}
  }, 2500);

  console.info(`[PNTT v${PN_V12.VERSION}] Đã nạp: xác nhận đột phá, Kho Động Phủ, bán theo nhóm, gợi ý vùng.`);
});