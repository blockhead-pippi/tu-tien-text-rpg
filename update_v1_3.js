/* ============================================================================
   PHÀM NHÂN TU TIÊN — UPDATE v1.3  "Đấu giá · Bản mệnh · Tâm ma · Bí cảnh"
   Nạp sau update_v1_2.js
   ============================================================================ */

const PN_V13 = { VERSION: '1.3.0' };

/* ---------------------- 1. ĐẤU GIÁ PHƯỜNG THỊ ---------------------- */

function v13SinhPhienDauGia(vung) {
  const cg = state.canhGioi || 0;
  const nganSach = Math.max(400, Number(state.linhThach) || 0);
  // v1.5: giá thị trường dao động theo vùng (linh khí) + ngẫu nhiên từng phiên
  const thiTruong = Math.max(0.8, Math.min(1.4, 0.85 + (Number(vung.linhKhi) || 1) * 0.12 + Math.random() * 0.18));
  const pool = (window.PN_DATA.vatPham || []).filter(
    v =>
      ['phap_bao', 'dan', 'phu_luc', 'linh_thao', 'yeu_dan', 'tru_vat'].includes(v.loai) &&
      layCanhGioiVatPham(v) <= Math.min(4, cg + 1) &&
      (v.gia || 0) > 40
  );
  const giaTriCua = v => {
    const key = taoItemKey(v.id);
    return Math.max(1, Math.round((v.gia || 0) * layPhamChatVatPham(key).heSo));
  };
  const re = pool.filter(v => giaTriCua(v) <= nganSach * 1.2);
  const vua = pool.filter(v => giaTriCua(v) <= nganSach * 3);
  const copyRe = [...re];
  const copyVua = [...vua];
  const daChon = new Set();
  const lots = [];
  const layTu = (arr, soLuong) => {
    let dem = 0;
    while (dem < soLuong && arr.length > 0) {
      const i = Math.floor(Math.random() * arr.length);
      const v = arr.splice(i, 1)[0];
      if (!v || daChon.has(v.id)) continue;
      daChon.add(v.id);
      const key = taoItemKey(v.id);
      const pc = layPhamChatVatPham(key);
      const giaTri = Math.max(1, Math.round((v.gia || 0) * pc.heSo * thiTruong));
      const giaKhoi = Math.max(10, Math.round(giaTri * (0.5 + Math.random() * 0.3)));
      lots.push({ id: v.id, key, pc: pc.key, ten: v.ten, loai: v.loai, giaTri, gia: giaKhoi, chuNhan: null, luot: 0, boQua: false, daChot: false });
      dem += 1;
    }
  };
  layTu(copyRe, 2);   // 2 món vừa túi tiền
  layTu(copyVua, 2);  // 2 món cao cấp hơn
  return { nam: state.nam, vungId: vung.id, lots, ketThuc: false, thiTruong };
}

function v13DamBaoPhienDauGia(vung) {
  if (
    !state.dauGia ||
    state.dauGia.nam !== state.nam ||
    state.dauGia.vungId !== vung.id ||
    !Array.isArray(state.dauGia.lots) ||
    state.dauGia.lots.length === 0
  ) {
    state.dauGia = v13SinhPhienDauGia(vung);
  }
  return state.dauGia;
}

function renderDauGiaHtml(vung) {
  const phien = v13DamBaoPhienDauGia(vung);
  const tenLoai = { phap_bao: 'Pháp bảo', dan: 'Đan dược', phu_luc: 'Phù lục', linh_thao: 'Linh thảo', yeu_dan: 'Yêu đan', tru_vat: 'Túi trữ vật' };
  const rows = phien.lots
    .map((lot, idx) => {
      const pc = layPhamChatVatPham(lot.key);
      const giaTiep = Math.max(lot.gia + 1, Math.round(lot.gia * 1.08));
      const giaMuaNgay = Math.max(giaTiep, Math.round(lot.giaTri * 1.45));
      const chuNhan =
        lot.chuNhan === 'ban'
          ? '<b class="hl-green">Bạn đang dẫn giá</b>'
          : lot.chuNhan === 'npc'
          ? '<b class="hl-danger">Người khác dẫn giá</b>'
          : '<span class="muted">Chưa có ai trả giá</span>';
      const hetPhien = phien.ketThuc || lot.daChot;
      const hanhDong = hetPhien
        ? `<span class="badge">${lot.daChot ? '✅ Đã thắng' : lot.chuNhan === 'ban' ? '⏳ Chờ chốt' : '—'}</span>`
        : lot.boQua
        ? '<span class="badge">Đã bỏ qua</span>'
        : `<button class="btn btn-sm btn-primary" onclick="datGiaDauGia(${idx})" ${state.linhThach < giaTiep ? 'disabled title="Không đủ Linh thạch"' : ''}>Đặt giá ${giaTiep.toLocaleString('vi-VN')} LT</button>
           <button class="btn btn-sm" onclick="v14MoNhapGia(${idx})">✏️ Tự nhập</button>
           <button class="btn btn-sm ${state.linhThach >= giaMuaNgay ? 'btn-primary' : ''}" onclick="v14MuaNgayDauGia(${idx})" ${state.linhThach < giaMuaNgay ? 'disabled title="Không đủ Linh thạch"' : ''}>Mua ngay ${giaMuaNgay.toLocaleString('vi-VN')} LT</button>
           <button class="btn btn-sm" onclick="boQuaDauGia(${idx})">Bỏ qua</button>`;
      return `<div class="card-row">
        <div>
          <b>${escapeHtml(lot.ten)}</b> <span class="badge">${tenLoai[lot.loai] || lot.loai}</span> <span class="badge ${pc.cls}">${pc.ten}</span>
          <div class="hl-gold">Giá hiện tại: ${lot.gia.toLocaleString('vi-VN')} LT <span class="muted">(tham khảo ${lot.giaTri.toLocaleString('vi-VN')})</span></div>
          <div class="muted">${chuNhan} · ${lot.luot}/6 lượt</div>
        </div>
        <div class="row-actions">${hanhDong}</div>
      </div>`;
    })
    .join('');

  const soThang = phien.lots.filter(l => l.chuNhan === 'ban' && !l.daChot).length;
  const thiTruongTxt = phien.thiTruong ? ` · Thị trường ${Math.round((phien.thiTruong - 1) * 100) >= 0 ? '+' : ''}${Math.round((phien.thiTruong - 1) * 100)}%` : '';
  return `<div class="sub-title">🎪 Phiên Đấu Giá Năm ${phien.nam} · ${escapeHtml(vung.ten)} <span class="muted">(Linh thạch: ${state.linhThach.toLocaleString('vi-VN')}${thiTruongTxt})</span></div>
    <p class="muted" style="margin-top:0">Mỗi năm một phiên, mỗi phiên 4 món. NPC có thể trả cao hơn khi giá còn thấp. Bấm <b>Chốt phiên</b> để trả tiền và nhận các món bạn đang dẫn giá.</p>
    ${phien.ketThuc ? '<div class="hint-line">🔨 Phiên này đã kết thúc. Năm sau sẽ có phiên mới (bế quan/du lịch để sang năm).</div>' : ''}
    ${rows}
    <div class="row-actions" style="margin-top:8px">
      <button class="btn btn-primary" onclick="chotPhienDauGia()" ${soThang > 0 && !phien.ketThuc ? '' : 'disabled'}>🔨 Chốt phiên (${soThang} món đang dẫn giá)</button>
      <button class="btn btn-sm" onclick="lamMoiPhienDauGia()">🔄 Sang phiên năm mới</button>
    </div>`;
}

function datGiaDauGia(idx) {
  const phien = state.dauGia;
  if (!phien || phien.ketThuc) return;
  const lot = phien.lots[idx];
  if (!lot || lot.daChot || lot.boQua) return;
  const giaMoi = Math.max(lot.gia + 1, Math.round(lot.gia * 1.08));
  if (state.linhThach < giaMoi) {
    toast('⚠️ Không đủ Linh thạch để trả giá', 'canh_bao');
    return;
  }
  lot.gia = giaMoi;
  lot.chuNhan = 'ban';
  lot.luot += 1;

  const tyLe = lot.gia < lot.giaTri * 1.15 ? 0.55 : 0.22;
  if (lot.luot < 6 && Math.random() < tyLe) {
    const giaNpc = Math.max(lot.gia + 1, Math.round(lot.gia * 1.05));
    lot.gia = giaNpc;
    lot.chuNhan = 'npc';
    toast(`⚠️ Có người trả cao hơn cho ${lot.ten}: ${giaNpc.toLocaleString('vi-VN')} LT`, 'canh_bao');
  } else {
    toast(`💰 Bạn đang dẫn giá ${lot.ten} (${lot.gia.toLocaleString('vi-VN')} LT)`, 'tot');
  }
  luuGame();
  veCotPhai();
}

function boQuaDauGia(idx) {
  const phien = state.dauGia;
  if (!phien || phien.ketThuc) return;
  const lot = phien.lots[idx];
  if (!lot) return;
  lot.boQua = true;
  if (lot.chuNhan === 'ban') lot.chuNhan = null;
  luuGame();
  veCotPhai();
}

function chotPhienDauGia() {
  const phien = state.dauGia;
  if (!phien || phien.ketThuc) return;
  let tong = 0;
  const nhan = [];
  for (const lot of phien.lots) {
    if (lot.chuNhan !== 'ban' || lot.daChot) continue;
    if (state.linhThach < lot.gia) {
      toast(`⚠️ Không đủ ${lot.gia.toLocaleString('vi-VN')} LT cho ${lot.ten}`, 'canh_bao');
      continue;
    }
    state.linhThach -= lot.gia;
    themVat(lot.key, 1);
    tong += lot.gia;
    nhan.push(lot.ten);
    lot.daChot = true;
  }
  phien.ketThuc = true;
  if (nhan.length > 0) {
    ghiNhatKy(`🎪 Thắng đấu giá ${nhan.length} món (${nhan.join(', ')}) với tổng ${tong.toLocaleString('vi-VN')} Linh thạch.`, 'dai_cat');
    toast(`🎪 Nhận ${nhan.length} món đấu giá (−${tong.toLocaleString('vi-VN')} LT)`, 'tot', 6000);
  } else {
    toast('Phiên đấu giá kết thúc — không có món nào bạn dẫn giá.', 'canh_bao');
  }
  luuGame();
  veGiaoDien();
}

function lamMoiPhienDauGia() {
  const phien = state.dauGia;
  if (phien && state.nam <= phien.nam) {
    toast('Mỗi năm chỉ có 1 phiên — hãy bế quan hoặc du lịch để sang năm sau.', 'canh_bao');
    return;
  }
  state.dauGia = null;
  luuGame();
  veGiaoDien();
}

/* -------------------- 2. BẢN MỆNH PHÁP BẢO (ĐAN HỎA) -------------------- */

// v1.4: chi phí nâng bản mệnh = Linh thạch (giảm) + Yêu đan theo cấp
function v14ChiPhiBanMenh(cap) {
  const c = Math.max(0, Number(cap) || 0);
  return { lt: 300 * (c + 1), yeuDan: c + 1 };
}

function v14DemYeuDan() {
  if (!state) return 0;
  let tong = 0;
  for (const [key, sl] of Object.entries(state.tuiDo || {})) {
    if (sl <= 0) continue;
    const vp = layVatPhamDef(key);
    if (vp && vp.loai === 'yeu_dan') tong += sl;
  }
  for (const [key, sl] of Object.entries(state.khoDo || {})) {
    if (sl <= 0) continue;
    const vp = layVatPhamDef(key);
    if (vp && vp.loai === 'yeu_dan') tong += sl;
  }
  return tong;
}

function v14TieuHaoYeuDan(soLuong) {
  let can = Math.max(0, Number(soLuong) || 0);
  const truTheo = obj => {
    for (const [key, sl] of Object.entries(obj || {})) {
      if (can <= 0) break;
      if (sl <= 0) continue;
      const vp = layVatPhamDef(key);
      if (!vp || vp.loai !== 'yeu_dan') continue;
      const tru = Math.min(sl, can);
      obj[key] = sl - tru;
      if (obj[key] <= 0) delete obj[key];
      can -= tru;
    }
  };
  truTheo(state.tuiDo);
  if (can > 0) truTheo(state.khoDo);
  return can === 0;
}

function teLuyenBanMenh() {
  if (!state) return;
  if (state.canhGioi < 3) {
    toast('Cần đạt 【Kết Đan】 mới có thể tế luyện bản mệnh.', 'canh_bao');
    return;
  }
  if (!state.phapBao) {
    toast('Hãy trang bị một pháp bảo trước.', 'canh_bao');
    return;
  }
  if (state.tranHienTai || state.suKienHienTai || state.hauChienNpc) {
    toast('Đang bận — không thể tế luyện.', 'canh_bao');
    return;
  }
  if (state.linhThach < 500) {
    toast('Cần 500 Linh thạch để tế luyện.', 'canh_bao');
    return;
  }
  state.linhThach -= 500;
  state.banMenh = { key: state.phapBao, cap: 0 };
  tienThoiGian(6);
  const pb = layVatPhamDef(state.phapBao);
  ghiNhatKy(`🔆 Dùng Đan Hỏa tế luyện [${pb ? pb.ten : state.phapBao}] thành Bản Mệnh Pháp Bảo (6 tháng).`, 'dai_cat');
  toast(`🔆 Đã tế luyện ${pb ? pb.ten : 'pháp bảo'} thành Bản Mệnh!`, 'tot', 6000);
  luuGame();
  veGiaoDien();
}

function nangCapBanMenh() {
  if (!state || !state.banMenh || state.banMenh.key !== state.phapBao) {
    toast('Pháp bảo hiện tại chưa phải bản mệnh.', 'canh_bao');
    return;
  }
  const cap = state.banMenh.cap || 0;
  if (cap >= 5) return;
  if (state.tranHienTai || state.suKienHienTai || state.hauChienNpc) {
    toast('Đang bận — không thể tôi luyện.', 'canh_bao');
    return;
  }
  const cp = v14ChiPhiBanMenh(cap);
  if (state.linhThach < cp.lt) {
    toast(`Cần ${cp.lt.toLocaleString('vi-VN')} Linh thạch để tôi luyện.`, 'canh_bao');
    return;
  }
  const soYeuDan = v14DemYeuDan();
  if (soYeuDan < cp.yeuDan) {
    toast(`Cần ${cp.yeuDan} Yêu đan (đang có ${soYeuDan}) — săn yêu thú hoặc mua ở chợ.`, 'canh_bao');
    return;
  }
  state.linhThach -= cp.lt;
  v14TieuHaoYeuDan(cp.yeuDan);
  state.banMenh.cap = cap + 1;
  let tenAffix = '';
  if (typeof v15ThemAffixBanMenh === 'function') {
    const a = v15ThemAffixBanMenh();
    if (a) tenAffix = `, từ điều mới: ${a.ten} +${Math.round((a.pct || 0) * 100)}%`;
  }
  tienThoiGian(6);
  ghiNhatKy(`🔆 Đan Hỏa tôi luyện bản mệnh lên cấp ${cap + 1}/5 (+${(cap + 1) * 8}% uy lực pháp bảo), tiêu hao ${cp.yeuDan} Yêu đan${tenAffix}.`, 'tot');
  toast(`🔆 Bản mệnh lên cấp ${cap + 1} (+${(cap + 1) * 8}% uy lực)${tenAffix}`, 'tot', 5500);
  luuGame();
  veGiaoDien();
}

/* --------------------- 3. TÂM MA KHI BẾ QUAN (KẾT ĐAN+) --------------------- */

function v13MoTamMa() {
  if (document.getElementById('modal-tam-ma')) return;
  if (typeof dungAutoTuLuyen === 'function') dungAutoTuLuyen('⏸ Treo máy dừng: Tâm ma quấy nhiễu!');
  const el = document.createElement('div');
  el.id = 'modal-tam-ma';
  el.className = 'modal-backdrop open';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `
    <div class="modal-box">
      <div class="panel-title">🌑 TÂM MA QUẤY NHIỄU</div>
      <p>Trong lúc bế quan, thức hải chấn động: tạp niệm, sợ hãi và chấp niệm năm xưa hóa thành ảo ảnh. Nếu không vượt qua, công lực dễ tổn hại.</p>
      <div class="hint-line">Chọn cách đối mặt — mỗi lựa chọn có cái giá riêng.</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
        <button class="btn" onclick="v13XuLyTamMa(1)">🧘 Thủ tâm như thành — dùng Ngộ tính & Thần thức trấn áp tâm ma</button>
        <button class="btn" onclick="v13XuLyTamMa(2)">⚔️ Lấy sát phá ma — nghiền nát tâm ma (tổn HP, đổi lấy Tu vi)</button>
        <button class="btn" onclick="v13XuLyTamMa(3)">🚪 Xuất quan tĩnh dưỡng — an toàn, bỏ lỡ cơ duyên</button>
      </div>
    </div>`;
  document.body.appendChild(el);
}

function v13DongTamMa() {
  const el = document.getElementById('modal-tam-ma');
  if (el) el.remove();
}

function v13XuLyTamMa(kieu) {
  if (!state) return;
  const cpSum = tinhCongPhapTongHop();
  const cg = state.canhGioi || 0;
  if (kieu === 1) {
    const doKho = 8 + cg * 5;
    const suc = state.chiSo.thanThuc + cpSum.thanThuc + Math.floor((state.chiSo.ngoTinh + cpSum.ngoTinh) * 0.5);
    const tiLe = Math.max(15, Math.min(92, 50 + (suc - doKho) * 3));
    if (Math.random() * 100 < tiLe) {
      state.dotPhaBuff = Math.min(0.25, (state.dotPhaBuff || 0) + 0.05);
      state.chiSo.ngoTinh += 1;
      ghiNhatKy(`🌑 Vượt qua Tâm ma (${Math.round(tiLe)}%): đạo tâm kiên định, +1 Ngộ tính và +5% dược lực đột phá lần sau.`, 'dai_cat');
      toast('🧘 Trấn áp Tâm ma thành công: +1 Ngộ tính, +5% đột phá', 'tot', 6000);
    } else {
      state.hp = Math.max(1, Math.round(state.hp * 0.8));
      tangThuongThePlayer(1, 'tâm ma phản phệ');
      ghiNhatKy(`🌑 Tâm ma phản phệ (kiểm định ${Math.round(tiLe)}% thất bại): hao tổn khí huyết và bị thương.`, 'nguy_hiem');
      toast('🌑 Tâm ma phản phệ! Mất HP và bị thương', 'canh_bao', 6000);
    }
  } else if (kieu === 2) {
    const tv = Math.max(10, Math.round(tinhTocDoTuLuyenNam() * 2));
    state.tuVi += tv;
    state.hp = Math.max(1, Math.round(state.hp * 0.7));
    const biThuong = Math.random() < 0.45;
    if (biThuong) tangThuongThePlayer(1, 'lấy sát phá ma');
    ghiNhatKy(`⚔️ Lấy sát phá ma: nhận +${tv.toLocaleString('vi-VN')} Tu vi, tổn hao khí huyết${biThuong ? ' và bị thương' : ''}.`, 'tot');
    toast(`⚔️ Phá ma: +${tv.toLocaleString('vi-VN')} Tu vi (tổn HP${biThuong ? ' + thương thế' : ''})`, 'tot', 6000);
  } else {
    state.hp = Math.min(tinhHpMax(), Math.round(state.hp * 1.15));
    tienThoiGian(1);
    ghiNhatKy('🚪 Xuất quan tĩnh dưỡng né Tâm ma, hồi phục khí huyết.', 'thuong');
    toast('🚪 Xuất quan an toàn — hồi phục HP', 'tot');
  }
  v13DongTamMa();
  luuGame();
  veGiaoDien();
}

// Bọc beQuan: Kết Đan trở lên có 10% gặp Tâm ma mỗi năm bế quan (tối đa 1 lần/năm)
(function bocBeQuan() {
  if (typeof window.beQuan !== 'function') return;
  const goc = window.beQuan;
  window.beQuan = function (soNam) {
    const kq = goc.apply(this, arguments);
    try {
      const busy = state.ketThuc || state.tranHienTai || state.suKienHienTai || state.hauChienNpc || state.biCanhHienTai;
      // Tâm ma định kỳ: Kết Đan+ bảo đảm ít nhất 1 lần mỗi 10 năm bế quan, ngoài ra 10%/lượt
      const canCuong = state.nam - (state.tamMaNam || 0) >= 10;
      if (!busy && (state.canhGioi || 0) >= 3 && (Number(soNam) || 0) >= 1 && state.tamMaNam !== state.nam && (canCuong || Math.random() < 0.1)) {
        state.tamMaNam = state.nam;
        v13MoTamMa();
      }
    } catch (e) { /* bỏ qua */ }
    return kq;
  };
})();

/* ------------------------------ 4. KHỞI TẠO ------------------------------ */

window.addEventListener('DOMContentLoaded', () => {
  console.info(`[PNTT v${PN_V13.VERSION}] Đã nạp: Đấu giá phường thị, Bản mệnh pháp bảo, Tâm ma, Bí cảnh phù hợp cảnh giới.`);
});