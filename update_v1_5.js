/* ============================================================================
   PHÀM NHÂN TU TIÊN — UPDATE v1.5
   "Toái đan thành anh · Từ điều bản mệnh · Chức vị tông môn · Thị trường đấu giá
    · Thành tựu & Thống kê"
   Nạp sau update_v1_4.js
   ============================================================================ */

const PN_V15 = { VERSION: '1.5.0' };

/* ---------------------- 1. TỪ ĐIỀU (AFFIX) BẢN MỆNH ---------------------- */

const V15_AFFIX = [
  { loai: 'atk', ten: 'Công kích', base: 0.03 },
  { loai: 'def', ten: 'Phòng thủ', base: 0.03 },
  { loai: 'hp', ten: 'Khí huyết', base: 0.02 },
  { loai: 'mp', ten: 'Linh lực', base: 0.02 },
  { loai: 'crit', ten: 'Bạo kích', base: 0.015 },
  { loai: 'evade', ten: 'Né tránh', base: 0.01 }
];

function v15ThemAffixBanMenh() {
  if (!state || !state.banMenh) return null;
  if (!Array.isArray(state.banMenh.affixes)) state.banMenh.affixes = [];
  if (state.banMenh.affixes.length >= 5) return null;
  const mau = V15_AFFIX[Math.floor(Math.random() * V15_AFFIX.length)];
  const pct = Math.round(mau.base * (0.8 + Math.random() * 0.5) * 1000) / 1000;
  const a = { loai: mau.loai, ten: mau.ten, pct };
  state.banMenh.affixes.push(a);
  return a;
}

/* --------------------- 2. CHỨC VỊ TÔNG MÔN / THÁI THƯỢNG --------------------- */

function v15HeSoChucVu() {
  if (!state || !state.tongMon) return 1;
  const capBac = Number(state.tongMon.capBac) || 0;
  if (capBac >= 5) return 1.6;
  if (capBac >= 4) return 1.4;
  if (capBac >= 3) return 1.2;
  return 1;
}

/* --------------------- 3. THỐNG KÊ & THÀNH TỰU --------------------- */

const V15_THANH_TUU = [
  { id: 'sat_10', ten: 'Sát yêu nhập môn', desc: 'Thắng 10 trận', kiem: t => t.thang >= 10, thuong: 300 },
  { id: 'sat_50', ten: 'Săn thú chuyên nghiệp', desc: 'Thắng 50 trận', kiem: t => t.thang >= 50, thuong: 1200 },
  { id: 'sat_200', ten: 'Yêu thú khắc tinh', desc: 'Thắng 200 trận', kiem: t => t.thang >= 200, thuong: 5000 },
  { id: 'bicanh_5', ten: 'Nhà thám hiểm', desc: 'Hoàn thành 5 bí cảnh', kiem: t => t.biCanh >= 5, thuong: 600 },
  { id: 'bicanh_20', ten: 'Bí cảnh thợ săn', desc: 'Hoàn thành 20 bí cảnh', kiem: t => t.biCanh >= 20, thuong: 2500 },
  { id: 'dotpha_3', ten: 'Đại năng', desc: 'Đột phá đại cảnh giới 3 lần', kiem: t => t.dotPha >= 3, thuong: 1500 },
  { id: 'lt_10k', ten: 'Tiểu phú tu sĩ', desc: 'Từng sở hữu 10.000 Linh thạch', kiem: t => t.ltCaoNhat >= 10000, thuong: 1000 },
  { id: 'banmenh_5', ten: 'Bản mệnh viên mãn', desc: 'Bản mệnh pháp bảo cấp 5', kiem: () => !!(state.banMenh && (state.banMenh.cap || 0) >= 5), thuong: 3000 }
];

function v15ThongKe() {
  if (!state) return { thang: 0, biCanh: 0, dotPha: 0, dauGia: 0, nhiemVu: 0, ltCaoNhat: 0 };
  if (!state.thongKe || typeof state.thongKe !== 'object') {
    state.thongKe = { thang: 0, biCanh: 0, dotPha: 0, dauGia: 0, nhiemVu: 0, ltCaoNhat: 0 };
  }
  const t = state.thongKe;
  for (const k of ['thang', 'biCanh', 'dotPha', 'dauGia', 'nhiemVu', 'ltCaoNhat']) {
    if (typeof t[k] !== 'number') t[k] = 0;
  }
  if (!state.thanhTuu || typeof state.thanhTuu !== 'object') state.thanhTuu = {};
  return t;
}

function v15DemTuNhatKy(text) {
  const t = v15ThongKe();
  const s = String(text || '');
  if (s.startsWith('🏆 Chiến thắng')) t.thang += 1;
  if (s.includes('Hoàn thành thám hiểm')) t.biCanh += 1;
  if (s.includes('Thiên địa dị tượng')) t.dotPha += 1;
  if (s.startsWith('🎪 Thắng đấu giá') || s.startsWith('🎪 Mua ngay')) t.dauGia += 1;
  if (s.startsWith('🎖️ Hoàn thành')) t.nhiemVu += 1;
  if ((state.linhThach || 0) > t.ltCaoNhat) t.ltCaoNhat = state.linhThach || 0;
}

function moThanhTuu() {
  if (typeof state === 'undefined' || !state) {
    if (typeof toast === 'function') toast('Hãy tạo nhân vật trước.', 'canh_bao');
    return;
  }
  const t = v15ThongKe();
  const old = document.getElementById('modal-thanh-tuu');
  if (old) old.remove();
  const el = document.createElement('div');
  el.id = 'modal-thanh-tuu';
  el.className = 'modal-backdrop open';
  el.style.zIndex = '9700';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');

  const dongThongKe = [
    ['⚔️ Trận thắng', t.thang],
    ['🌌 Bí cảnh hoàn thành', t.biCanh],
    ['⚡ Đột phá đại cảnh giới', t.dotPha],
    ['🎪 Thắng/mua đấu giá', t.dauGia],
    ['🎖️ Nhiệm vụ trưởng lão', t.nhiemVu],
    ['💰 Linh thạch cao nhất', `${Number(t.ltCaoNhat || 0).toLocaleString('vi-VN')} LT`]
  ]
    .map(([k, v]) => `<div class="stat-row"><span>${k}:</span> <b>${typeof v === 'number' ? v.toLocaleString('vi-VN') : v}</b></div>`)
    .join('');

  const dongThanhTuu = V15_THANH_TUU.map(tt => {
    const daNhan = !!state.thanhTuu[tt.id];
    const dat = !!tt.kiem(t);
    return `<div class="card-row">
      <div>
        <b>${escapeHtml(tt.ten)}</b> ${daNhan ? '<span class="badge hl-green">Đã nhận</span>' : dat ? '<span class="badge hl-gold">Hoàn thành</span>' : '<span class="badge">Chưa đạt</span>'}
        <div class="muted">${escapeHtml(tt.desc)} · Thưởng ${tt.thuong.toLocaleString('vi-VN')} LT</div>
      </div>
      <button class="btn btn-sm ${dat && !daNhan ? 'btn-primary' : ''}" onclick="v15NhanThuongThanhTuu('${tt.id}')" ${daNhan || !dat ? 'disabled' : ''}>
        ${daNhan ? 'Đã nhận' : dat ? 'Nhận thưởng' : 'Chưa đạt'}
      </button>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="modal-box">
      <div class="panel-title">📊 THÀNH TỰU & THỐNG KÊ</div>
      <div class="sub-title" style="margin-top:6px">Thống kê kiếp tu tiên</div>
      ${dongThongKe}
      <div class="sub-title" style="margin-top:12px">Thành tựu (${Object.keys(state.thanhTuu).length}/${V15_THANH_TUU.length})</div>
      ${dongThanhTuu}
      <div class="row-actions" style="justify-content:flex-end;margin-top:12px">
        <button class="btn btn-primary" onclick="document.getElementById('modal-thanh-tuu').remove()">Đóng</button>
      </div>
    </div>`;
  document.body.appendChild(el);
}

function v15NhanThuongThanhTuu(id) {
  const tt = V15_THANH_TUU.find(x => x.id === id);
  if (!tt || !state) return;
  const t = v15ThongKe();
  if (state.thanhTuu[id]) return;
  if (!tt.kiem(t)) {
    toast('Chưa đạt điều kiện thành tựu này.', 'canh_bao');
    return;
  }
  state.thanhTuu[id] = true;
  state.linhThach += tt.thuong;
  if (state.linhThach > t.ltCaoNhat) t.ltCaoNhat = state.linhThach;
  ghiNhatKy(`🏅 Nhận thành tựu [${tt.ten}]: +${tt.thuong.toLocaleString('vi-VN')} Linh thạch.`, 'dai_cat');
  toast(`🏅 Thành tựu ${tt.ten}: +${tt.thuong.toLocaleString('vi-VN')} LT`, 'tot', 5500);
  luuGame();
  moThanhTuu();
  veGiaoDien();
}

/* ----------------------- 4. TOÁI ĐAN THÀNH ANH (Nguyên Anh) ----------------------- */

let v15TD = null;

function v15MoToaiDan() {
  v15TD = { buoc: 1, diem: 0 };
  v15VeToaiDan();
}

function v15VeToaiDan() {
  if (!v15TD) return;
  let el = document.getElementById('modal-toai-dan');
  if (!el) {
    el = document.createElement('div');
    el.id = 'modal-toai-dan';
    el.className = 'modal-backdrop open';
    el.style.zIndex = '9750';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    document.body.appendChild(el);
  }
  const cpSum = tinhCongPhapTongHop();
  const hpPct = Math.round((state.hp / tinhHpMax()) * 100);
  let tenBuoc = '';
  let moTa = '';
  let nut = '';

  if (v15TD.buoc === 1) {
    tenBuoc = 'Tâm Ma';
    moTa = 'Đan điền rung chuyển, tâm ma hóa thành ảo ảnh người thân và kẻ thù cũ. Muốn toái đan, trước hết phải giữ được đạo tâm.';
    nut = `
      <button class="btn" onclick="v15TDChon(1)">🧘 Giữ vững đạo tâm <span class="muted">(kiểm định Ngộ tính + Thần thức)</span></button>
      <button class="btn" onclick="v15TDChon(2)">💊 Dùng đan an thần <span class="muted">(có ${typeof soLuongVat === 'function' ? soLuongVat('dan_an_than') + soLuongVat('dan_thanh_tam') : 0})</span></button>
      <button class="btn" onclick="v15TDChon(3)">⚔️ Nhắm mắt xông qua <span class="muted">(−20% HP)</span></button>`;
  } else if (v15TD.buoc === 2) {
    tenBuoc = 'Thiên Lôi';
    moTa = 'Mây đen tụ lại, một đạo thiên lôi giáng thẳng xuống đỉnh đầu — kiếp nạn cuối của Kết Đan trước khi kết anh.';
    nut = `
      <button class="btn" onclick="v15TDChon(4)" ${state.banMenh && state.banMenh.key === state.phapBao ? '' : 'disabled title="Cần Bản Mệnh Pháp Bảo đang liên kết"'}>🛡️ Dùng bản mệnh pháp bảo chống đỡ <span class="muted">(−12% HP)</span></button>
      <button class="btn" onclick="v15TDChon(5)">💪 Dùng thân thể cứng chống <span class="muted">(−30% HP)</span></button>
      <button class="btn" onclick="v15TDChon(6)">🚪 Tạm lùi, hoãn toái đan <span class="muted">(−5% Tu vi)</span></button>`;
  } else {
    tenBuoc = 'Toái Đan';
    moTa = 'Kim đan rực sáng trong đan điền. Phải nghiền nát nó, để nguyên khí hòa vào thức hải mà sinh ra Nguyên Anh.';
    nut = `
      <button class="btn btn-primary" onclick="v15TDChon(7)">💥 Toái đan dốc toàn lực <span class="muted">(khó hơn, +2 điểm)</span></button>
      <button class="btn" onclick="v15TDChon(8)">🧘 Toái đan ổn định <span class="muted">(dễ hơn, +1 điểm)</span></button>`;
  }

  el.innerHTML = `
    <div class="modal-box">
      <div class="panel-title">🌀 TOÁI ĐAN THÀNH ANH · Chặng ${v15TD.buoc}/3: ${tenBuoc}</div>
      <p>${moTa}</p>
      <div class="hint-line">Điểm thử thách: <b>${v15TD.diem}</b> · Khí huyết: <b>${hpPct}%</b> · Mỗi điểm tăng ~+3% tỉ lệ đột phá sau cùng.</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">${nut}
        <button class="btn" onclick="v15TDChon(9)">↩️ Hủy an toàn ${v15TD.buoc === 1 ? '(miễn phí)' : '(−2% Tu vi)'}</button>
      </div>
    </div>`;
}

function v15TDChon(k) {
  if (!state || !v15TD) return;
  const cpSum = tinhCongPhapTongHop();
  const maxHp = tinhHpMax();
  const matHp = pct => {
    state.hp = Math.max(1, Math.round(state.hp - maxHp * pct));
  };

  if (k === 1) {
    const doKho = 20 + (state.canhGioi || 0) * 5;
    const suc = state.chiSo.thanThuc + cpSum.thanThuc + Math.floor((state.chiSo.ngoTinh + cpSum.ngoTinh) * 0.8);
    const tiLe = Math.max(25, Math.min(90, 55 + (suc - doKho) * 2));
    if (Math.random() * 100 < tiLe) {
      v15TD.diem += 1;
      toast(`🧘 Giữ được đạo tâm (${Math.round(tiLe)}%): +1 điểm`, 'tot');
    } else {
      matHp(0.15);
      v15TD.diem = Math.max(0, v15TD.diem - 1);
      toast('🌑 Tâm ma cắn trả: −15% HP, −1 điểm', 'canh_bao');
    }
    v15TD.buoc = 2;
    return v15VeToaiDan();
  }
  if (k === 2) {
    const idAn = soLuongVat('dan_an_than') > 0 ? 'dan_an_than' : soLuongVat('dan_thanh_tam') > 0 ? 'dan_thanh_tam' : null;
    if (!idAn) {
      toast('Không còn đan an thần.', 'canh_bao');
      return;
    }
    themVat(idAn, -1);
    v15TD.diem += 1;
    toast('💊 An thần đan trấn tâm: +1 điểm', 'tot');
    v15TD.buoc = 2;
    return v15VeToaiDan();
  }
  if (k === 3) {
    matHp(0.2);
    v15TD.buoc = 2;
    toast('⚔️ Xông qua tâm ma: −20% HP', 'canh_bao');
    return v15VeToaiDan();
  }
  if (k === 4) {
    matHp(0.12);
    if (state.banMenh && (state.banMenh.cap || 0) >= 2) {
      v15TD.diem += 1;
      toast('🛡️ Bản mệnh hộ thể: −12% HP, +1 điểm', 'tot');
    } else {
      toast('🛡️ Bản mệnh hộ thể: −12% HP', 'tot');
    }
    v15TD.buoc = 3;
    return v15VeToaiDan();
  }
  if (k === 5) {
    const conHp = state.hp - maxHp * 0.3;
    matHp(0.3);
    if (conHp > maxHp * 0.5) {
      v15TD.diem += 1;
      toast('💪 Cứng chống thiên lôi: −30% HP, +1 điểm', 'tot');
    } else {
      toast('💪 Cứng chống thiên lôi: −30% HP', 'canh_bao');
    }
    v15TD.buoc = 3;
    return v15VeToaiDan();
  }
  if (k === 6) {
    state.tuVi = Math.max(0, Math.round((state.tuVi || 0) * 0.95));
    const el6 = document.getElementById('modal-toai-dan');
    if (el6) el6.remove();
    v15TD = null;
    window.__v15DaToaiDan = false;
    ghiNhatKy('🌀 Tạm lùi trước thiên lôi, hoãn toái đan (mất 5% Tu vi).', 'canh_bao');
    toast('🚪 Đã hoãn toái đan (−5% Tu vi)', 'canh_bao');
    luuGame();
    veGiaoDien();
    return;
  }
  if (k === 7 || k === 8) {
    const kho = k === 7 ? 8 + (state.canhGioi || 0) * 5 : 0;
    const suc = state.chiSo.ngoTinh + cpSum.ngoTinh + Math.floor((state.chiSo.thanThuc + cpSum.thanThuc) * 0.6);
    const tiLe = Math.max(25, Math.min(92, (k === 7 ? 50 : 65) + suc - kho));
    if (Math.random() * 100 < tiLe) {
      v15TD.diem += k === 7 ? 2 : 1;
      v15HoanTatToaiDan(tiLe);
    } else {
      v15ThatBaiToaiDan(`toái đan thất bại (${Math.round(tiLe)}%)`);
    }
    return;
  }
  if (k === 9) {
    const buoc = v15TD.buoc;
    if (buoc > 1) state.tuVi = Math.max(0, Math.round((state.tuVi || 0) * 0.98));
    const el9 = document.getElementById('modal-toai-dan');
    if (el9) el9.remove();
    v15TD = null;
    window.__v15DaToaiDan = false;
    ghiNhatKy(`🌀 Hủy Toái Đan ở chặng ${buoc}${buoc > 1 ? ' (mất 2% Tu vi)' : ' (miễn phí)'}.`, 'thuong');
    toast(`↩️ Đã hủy Toái Đan${buoc > 1 ? ' (−2% Tu vi)' : ''}`, 'canh_bao');
    luuGame();
    veGiaoDien();
    return;
  }
}

function v15HoanTatToaiDan(tiLe) {
  const buff = Math.min(0.25, 0.1 + Math.max(0, v15TD ? v15TD.diem : 0) * 0.03);
  state.dotPhaBuff = Math.min(0.35, (state.dotPhaBuff || 0) + buff);
  ghiNhatKy(`🌀 Toái đan thành anh thành công (kiểm định ${Math.round(tiLe || 0)}%, điểm ${v15TD ? v15TD.diem : 0}): +${Math.round(buff * 100)}% tỉ lệ đột phá lần này!`, 'dai_cat');
  toast(`🌀 Toái đan thành công! +${Math.round(buff * 100)}% đột phá`, 'tot', 6500);
  const el = document.getElementById('modal-toai-dan');
  if (el) el.remove();
  v15TD = null;
  const goc = window.__v15GocXacNhan;
  window.__v14DangXuLyTamMa = true;
  window.__v14DaHoiTamMa = true;
  try {
    if (typeof goc === 'function') goc();
  } finally {
    window.__v14DangXuLyTamMa = false;
    window.__v14DaHoiTamMa = false;
    window.__v15DaToaiDan = false;
  }
}

function v15ThatBaiToaiDan(lyDo) {
  state.tuVi = Math.max(0, Math.round((state.tuVi || 0) * 0.88));
  state.hp = Math.max(1, Math.round(state.hp * 0.3));
  tangThuongThePlayer(1, 'toái đan thất bại');
  ghiNhatKy(`🌀 ${lyDo}: tiêu tán 12% Tu vi, trọng thương.`, 'nguy_hiem');
  toast('🌀 Toái đan thất bại! Mất 12% Tu vi, trọng thương', 'canh_bao', 6500);
  const el = document.getElementById('modal-toai-dan');
  if (el) el.remove();
  v15TD = null;
  window.__v15DaToaiDan = false;
  luuGame();
  veGiaoDien();
}

// Bọc xác nhận đột phá: Kết Đan Đỉnh Phong → mở màn Toái Đan (Nguyên Anh)
(function bocToaiDan() {
  const goc = window.xacNhanDotPhaThatSu;
  if (typeof goc !== 'function') return;
  window.__v15GocXacNhan = goc;
  window.xacNhanDotPhaThatSu = function () {
    try {
      const dinh = typeof laDinhPhongDaiCanh === 'function' && laDinhPhongDaiCanh();
      if (state && state.canhGioi === 3 && dinh && !window.__v15DaToaiDan) {
        window.__v15DaToaiDan = true;
        if (typeof dongXacNhanDotPha === 'function') dongXacNhanDotPha();
        if (typeof dungAutoTuLuyen === 'function') dungAutoTuLuyen('⏸ Treo máy dừng: Toái đan thành anh!');
        v15MoToaiDan();
        return;
      }
    } catch (e) { /* bỏ qua */ }
    return goc.apply(this, arguments);
  };
})();

/* ------------------------------ 5. KHỞI TẠO ------------------------------ */

// Thêm chức vị Thái Thượng Trưởng Lão (nếu chưa có)
try {
  if (typeof TONG_MON_CHUC_VI !== 'undefined' && TONG_MON_CHUC_VI.length === 5) {
    TONG_MON_CHUC_VI.push({
      ten: 'Thái Thượng Trưởng Lão',
      yeuCauCongHien: 6000,
      yeuCauCg: 5,
      bongLoc: 20000,
      bongCh: 80,
      tichToiDaNam: 40,
      linhMachHeSo: 1.4,
      phiLinhMachNam: 60,
      giamGiaBaoKho: 0.55
    });
  }
} catch (e) { /* bỏ qua */ }

window.addEventListener('DOMContentLoaded', () => {
  try {
    if (typeof state !== 'undefined' && state) {
      v15ThongKe();
      if (!state.banMenh || typeof state.banMenh !== 'object') state.banMenh = { key: null, cap: 0 };
      if (!Array.isArray(state.banMenh.affixes)) state.banMenh.affixes = [];
    }
  } catch (e) {}

  if (typeof window.ghiNhatKy === 'function' && !window.__v15WrapKy) {
    const gocKy = window.ghiNhatKy;
    window.ghiNhatKy = function (text, loai) {
      try {
        if (typeof state !== 'undefined' && state) v15DemTuNhatKy(text);
      } catch (e) {}
      return gocKy.apply(this, arguments);
    };
    window.__v15WrapKy = true;
  }

  console.info(`[PNTT v${PN_V15.VERSION}] Đã nạp: Toái đan thành anh, từ điều bản mệnh, chức vị Thái Thượng, thị trường đấu giá, thành tựu.`);
});