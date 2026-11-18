/* ============================================================================
   PHÀM NHÂN TU TIÊN — UPDATE v1.4
   "Tâm ma đột phá · Tự nhập giá đấu giá · Nhiệm vụ trưởng lão · Lọc cảnh giới"
   Nạp sau update_v1_3.js
   ============================================================================ */

const PN_V14 = { VERSION: '1.4.0' };

/* --------------- 1. TÂM MA TRƯỚC KHI XUNG KÍCH ĐẠI CẢNH GIỚI --------------- */

let v14BuffTamMa = 0;

function v14MoTamMaDotPha() {
  if (document.getElementById('modal-tam-ma-dotpha')) return;
  if (typeof dongXacNhanDotPha === 'function') dongXacNhanDotPha();
  if (typeof dungAutoTuLuyen === 'function') dungAutoTuLuyen('⏸ Treo máy dừng: Tâm ma bình cảnh!');
  v14BuffTamMa = 0;
  const coAnThan = (typeof soLuongVat === 'function' ? soLuongVat('dan_an_than') : 0) + (typeof soLuongVat === 'function' ? soLuongVat('dan_thanh_tam') : 0);
  const el = document.createElement('div');
  el.id = 'modal-tam-ma-dotpha';
  el.className = 'modal-backdrop open';
  el.style.zIndex = '9700';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `
    <div class="modal-box">
      <div class="panel-title">🌑 TÂM MA BÌNH CẢNH</div>
      <p>Ngay trước cửa ải đại cảnh giới, tâm ma hiện hình: những chấp niệm sâu kín nhất kéo ngược linh lực của bạn. Nếu xử lý không khéo, tỉ lệ đột phá sẽ bị ảnh hưởng.</p>
      <div class="hint-line">Tỉ lệ hiện tại: <b>${Math.round(tinhTiLeDotPhaDaiCanh() * 100)}%</b>. Các lựa chọn dưới đây sẽ thay đổi tỉ lệ này trước khi xung kích.</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
        <button class="btn" onclick="v14XuLyTamMaDotPha(1)">🧘 Trấn áp bằng đạo tâm <span class="muted">(kiểm định Ngộ tính & Thần thức)</span></button>
        <button class="btn" onclick="v14XuLyTamMaDotPha(2)" ${coAnThan > 0 ? '' : 'disabled title="Cần 1 An Thần Hoàn hoặc Thanh Tâm Tán"'}>💊 Dùng đan an thần <span class="muted">(có ${coAnThan})</span></button>
        <button class="btn" onclick="v14XuLyTamMaDotPha(3)">⚔️ Cưỡng ép xung kích <span class="muted">(mất HP, không đổi tỉ lệ)</span></button>
        <button class="btn" onclick="v14XuLyTamMaDotPha(4)">↩️ Hủy đột phá, giữ nguyên Tu vi</button>
      </div>
    </div>`;
  document.body.appendChild(el);
}

function v14DongTamMaDotPha() {
  const el = document.getElementById('modal-tam-ma-dotpha');
  if (el) el.remove();
}

function v14TiepTucDotPha() {
  v14DongTamMaDotPha();
  window.__v14DangXuLyTamMa = true;
  try {
    if (typeof window.__v14GocXacNhan === 'function') window.__v14GocXacNhan();
  } finally {
    window.__v14DangXuLyTamMa = false;
    window.__v14DaHoiTamMa = false;
    luuGame();
  }
}

function v14XuLyTamMaDotPha(kieu) {
  if (!state) return;
  const cpSum = tinhCongPhapTongHop();
  if (kieu === 1) {
    const cg = state.canhGioi || 0;
    const doKho = 12 + cg * 5;
    const suc = state.chiSo.thanThuc + cpSum.thanThuc + Math.floor((state.chiSo.ngoTinh + cpSum.ngoTinh) * 0.6);
    const tiLe = Math.max(15, Math.min(92, 50 + (suc - doKho) * 3));
    if (Math.random() * 100 < tiLe) {
      v14BuffTamMa = 0.08;
      state.dotPhaBuff = Math.min(0.3, (state.dotPhaBuff || 0) + v14BuffTamMa);
      ghiNhatKy(`🌑 Trấn áp Tâm ma thành công (${Math.round(tiLe)}%): +8% tỉ lệ đột phá lần này.`, 'tot');
      toast('🧘 Trấn áp Tâm ma thành công: +8% đột phá', 'tot', 5000);
    } else {
      v14BuffTamMa = -0.08;
      state.dotPhaBuff = Math.max(0, (state.dotPhaBuff || 0) - 0.08);
      state.hp = Math.max(1, Math.round(state.hp * 0.85));
      tangThuongThePlayer(1, 'tâm ma bình cảnh');
      ghiNhatKy(`🌑 Tâm ma phản phệ (${Math.round(tiLe)}% thất bại): -8% tỉ lệ đột phá, hao tổn khí huyết.`, 'nguy_hiem');
      toast('🌑 Tâm ma phản phệ: -8% đột phá, mất HP', 'canh_bao', 5500);
    }
    v14TiepTucDotPha();
    return;
  }
  if (kieu === 2) {
    const idAn = typeof soLuongVat === 'function' && soLuongVat('dan_an_than') > 0 ? 'dan_an_than' : typeof soLuongVat === 'function' && soLuongVat('dan_thanh_tam') > 0 ? 'dan_thanh_tam' : null;
    if (!idAn) {
      toast('Không còn đan an thần trong túi.', 'canh_bao');
      return;
    }
    themVat(idAn, -1);
    v14BuffTamMa = 0.05;
    state.dotPhaBuff = Math.min(0.3, (state.dotPhaBuff || 0) + v14BuffTamMa);
    ghiNhatKy('🌑 Dùng đan an thần trấn tâm: +5% tỉ lệ đột phá lần này.', 'tot');
    toast('💊 An thần: +5% đột phá', 'tot');
    v14TiepTucDotPha();
    return;
  }
  if (kieu === 3) {
    state.hp = Math.max(1, Math.round(state.hp * 0.8));
    ghiNhatKy('🌑 Cưỡng ép xung kích, tâm ma làm hao tổn 20% khí huyết.', 'canh_bao');
    toast('⚔️ Cưỡng ép: -20% HP, tỉ lệ giữ nguyên', 'canh_bao');
    v14TiepTucDotPha();
    return;
  }
  // Hủy
  if (v14BuffTamMa) state.dotPhaBuff = Math.max(0, (state.dotPhaBuff || 0) - v14BuffTamMa);
  v14BuffTamMa = 0;
  window.__v14DaHoiTamMa = false;
  v14DongTamMaDotPha();
  ghiNhatKy('🌑 Bạn thu công, tạm hoãn xung kích đại cảnh giới.', 'thuong');
  toast('Đã hủy đột phá — Tu vi giữ nguyên.', 'canh_bao');
  luuGame();
  veGiaoDien();
}

// Bọc xác nhận đột phá để chèn Tâm ma (Kết Đan trở lên, 45% mỗi lần thử)
(function bocXacNhanDotPha() {
  const goc = window.xacNhanDotPhaThatSu;
  if (typeof goc !== 'function') return;
  window.__v14GocXacNhan = goc;
  window.xacNhanDotPhaThatSu = function () {
    try {
      if (window.__v14DangXuLyTamMa) return goc.apply(this, arguments);
      const dinh = typeof laDinhPhongDaiCanh === 'function' && laDinhPhongDaiCanh();
      if (state && state.canhGioi >= 3 && dinh && !window.__v14DaHoiTamMa && Math.random() < 0.45) {
        window.__v14DaHoiTamMa = true;
        v14MoTamMaDotPha();
        return;
      }
    } catch (e) { /* bỏ qua */ }
    return goc.apply(this, arguments);
  };
})();

/* ------------------- 2. ĐẤU GIÁ: TỰ NHẬP GIÁ / MUA NGAY ------------------- */

let v14IdxNhapGia = null;

function v14MoNhapGia(idx) {
  const phien = state.dauGia;
  const lot = phien && phien.lots ? phien.lots[idx] : null;
  if (!lot || phien.ketThuc || lot.daChot || lot.boQua) return;
  v14IdxNhapGia = idx;
  const min = Math.max(lot.gia + 1, Math.round(lot.gia * 1.08));
  const max = Math.max(min, Math.floor(state.linhThach));
  const el = document.createElement('div');
  el.id = 'modal-nhap-gia';
  el.className = 'modal-backdrop open';
  el.style.zIndex = '9700';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `
    <div class="modal-box">
      <div class="panel-title">✏️ TỰ NHẬP GIÁ — ${escapeHtml(lot.ten)}</div>
      <p class="muted" style="margin-top:0">Giá hiện tại: <b>${lot.gia.toLocaleString('vi-VN')} LT</b> · Giá trị tham khảo: ${lot.giaTri.toLocaleString('vi-VN')} LT</p>
      <div class="form-group">
        <label>Giá bạn muốn trả (${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} LT):</label>
        <input id="v14-nhap-gia-input" type="number" min="${min}" max="${max}" step="1" value="${min}" />
      </div>
      <div class="hint-line">Trả giá quá cao sẽ lỗ; trả vừa đủ có thể bị NPC trả cao hơn ngay sau đó.</div>
      <div class="row-actions" style="justify-content:flex-end;margin-top:12px">
        <button class="btn" onclick="v14DongNhapGia()">Hủy</button>
        <button class="btn btn-primary" onclick="v14XacNhanNhapGia()">Xác nhận trả giá</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  const inp = document.getElementById('v14-nhap-gia-input');
  if (inp) setTimeout(() => inp.focus(), 30);
}

function v14DongNhapGia() {
  const el = document.getElementById('modal-nhap-gia');
  if (el) el.remove();
  v14IdxNhapGia = null;
}

function v14XacNhanNhapGia() {
  const idx = v14IdxNhapGia;
  const phien = state.dauGia;
  const lot = phien && phien.lots ? phien.lots[idx] : null;
  const inp = document.getElementById('v14-nhap-gia-input');
  if (!lot || !inp) return;
  const min = Math.max(lot.gia + 1, Math.round(lot.gia * 1.08));
  const gia = Math.floor(Number(inp.value) || 0);
  if (!Number.isFinite(gia) || gia < min) {
    toast(`⚠️ Giá phải từ ${min.toLocaleString('vi-VN')} LT trở lên`, 'canh_bao');
    return;
  }
  if (gia > state.linhThach) {
    toast('⚠️ Bạn không đủ Linh thạch cho mức giá này', 'canh_bao');
    return;
  }
  lot.gia = gia;
  lot.chuNhan = 'ban';
  lot.luot += 1;
  const tyLe = lot.gia < lot.giaTri * 1.15 ? 0.55 : 0.22;
  if (lot.luot < 6 && Math.random() < tyLe) {
    const giaNpc = Math.max(lot.gia + 1, Math.round(lot.gia * 1.05));
    lot.gia = giaNpc;
    lot.chuNhan = 'npc';
    toast(`⚠️ Có người trả cao hơn cho ${lot.ten}: ${giaNpc.toLocaleString('vi-VN')} LT`, 'canh_bao', 5200);
  } else {
    toast(`💰 Bạn dẫn giá ${lot.ten} (${lot.gia.toLocaleString('vi-VN')} LT)`, 'tot');
  }
  v14DongNhapGia();
  luuGame();
  veCotPhai();
}

function v14MuaNgayDauGia(idx) {
  const phien = state.dauGia;
  const lot = phien && phien.lots ? phien.lots[idx] : null;
  if (!lot || phien.ketThuc || lot.daChot || lot.boQua) return;
  const gia = Math.max(Math.max(lot.gia + 1, Math.round(lot.gia * 1.08)), Math.round(lot.giaTri * 1.45));
  if (state.linhThach < gia) {
    toast('⚠️ Không đủ Linh thạch để mua ngay', 'canh_bao');
    return;
  }
  state.linhThach -= gia;
  themVat(lot.key, 1);
  lot.gia = gia;
  lot.chuNhan = 'ban';
  lot.daChot = true;
  ghiNhatKy(`🎪 Mua ngay [${lot.ten}] tại đấu giá với giá ${gia.toLocaleString('vi-VN')} Linh thạch.`, 'dai_cat');
  toast(`🎪 Mua ngay ${lot.ten} (−${gia.toLocaleString('vi-VN')} LT)`, 'tot', 5500);
  luuGame();
  veGiaoDien();
}

/* --------------------- 3. NHIỆM VỤ TRƯỞNG LÃO (KẾT ĐAN+) --------------------- */

function v14TrangThaiNvTruongLao() {
  if (!state) return null;
  if (!state.v14NvTruongLao || typeof state.v14NvTruongLao !== 'object') state.v14NvTruongLao = { nam: -999 };
  return state.v14NvTruongLao;
}

function v14DsNhiemVuTruongLao() {
  const cg = state.canhGioi || 0;
  const heSo = 1 + Math.max(0, cg - 3) * 0.6;
  const ds = [
    {
      id: 'truy_sat',
      ten: 'Truy sát Ma Tu',
      thang: 6,
      lt: Math.round(900 * heSo),
      ch: 80,
      moTa: 'Ma tu ẩn náu gần đây, tông môn ban lệnh truy sát. Nguy hiểm nhưng thưởng hậu.'
    },
    {
      id: 'ho_tong',
      ten: 'Hộ tống Trưởng lão đi sứ',
      thang: 12,
      lt: Math.round(500 * heSo),
      ch: 120,
      moTa: 'Hộ tống trưởng lão tới phường thị kế tiếp; ít nguy hiểm, cống hiến cao.'
    }
  ];
  // Chuỗi nhiệm vụ: sau 2 lần hoàn thành sẽ mở "Trấn áp Yêu Triều"
  if ((v14TrangThaiNvTruongLao().count || 0) >= 2) {
    ds.push({
      id: 'tran_ap',
      ten: 'Trấn áp Yêu Triều',
      thang: 24,
      lt: Math.round(2600 * heSo),
      ch: 300,
      moTa: 'Yêu triều tràn xuống chân núi, trưởng lão giao ngươi dẫn đội trấn giữ. Cực kỳ nguy hiểm, phần thưởng hậu hĩnh.'
    });
  }
  return ds;
}

function renderNhiemVuTruongLao() {
  if (typeof state === 'undefined' || !state || !state.tongMon || (state.canhGioi || 0) < 3) return '';
  const tt = v14TrangThaiNvTruongLao();
  const conHan = typeof tt.nam === 'number' && state.nam - tt.nam < 3;
  const ds = v14DsNhiemVuTruongLao();
  const chainCount = tt.count || 0;
  return `<div class="sub-section">
    <div class="sub-title">🎖️ Nhiệm Vụ Trưởng Lão (Kết Đan+) <span class="badge">Khách khanh</span></div>
    <p class="muted" style="margin-top:0">Lệnh truyền qua Truyền Âm Phù — 3 năm mới có một lượt. Thành công nhận Linh thạch, Cống hiến và có cơ hội nhận Yêu đan.${typeof v15HeSoChucVu === 'function' && v15HeSoChucVu() > 1 ? ` <b class="hl-green">Chức vị hiện tại: thưởng ×${v15HeSoChucVu()}</b>` : ''} ${chainCount >= 2 ? `<b class="hl-green">· Chuỗi đã hoàn thành ${chainCount} lần — đã mở [Trấn áp Yêu Triều]</b>` : `<span class="muted">· Chuỗi: ${chainCount}/2 lần hoàn thành để mở nhiệm vụ đặc biệt</span>`}</p>
    ${
      conHan
        ? `<div class="muted">Đã nhận nhiệm vụ năm ${tt.nam} — còn ${3 - (state.nam - tt.nam)} năm mới có lượt mới.</div>`
        : ds
            .map(
              nv => `<div class="card-row">
                <div>
                  <b>${nv.ten}</b> <span class="badge">${nv.thang} tháng</span>
                  <div class="muted">${nv.moTa}</div>
                  <div class="hl-gold">Thưởng: +${nv.lt.toLocaleString('vi-VN')} LT · +${nv.ch} Cống hiến · cơ hội Yêu đan</div>
                </div>
                <button class="btn btn-sm btn-primary" onclick="nhanNhiemVuTruongLao('${nv.id}')">🎖️ Nhận lệnh</button>
              </div>`
            )
            .join('')
    }
  </div>`;
}

function nhanNhiemVuTruongLao(loai) {
  if (!state || !state.tongMon) return;
  if ((state.canhGioi || 0) < 3) {
    toast('Chỉ Kết Đan trở lên mới nhận nhiệm vụ trưởng lão.', 'canh_bao');
    return;
  }
  if (state.tranHienTai || state.suKienHienTai || state.hauChienNpc) {
    toast('Đang bận — chưa thể nhận lệnh.', 'canh_bao');
    return;
  }
  const tt = v14TrangThaiNvTruongLao();
  if (state.nam - (tt.nam || -999) < 3) {
    toast('Chưa tới lượt nhiệm vụ mới (3 năm/lần).', 'canh_bao');
    return;
  }
  if (state.hp < tinhHpMax() * 0.3) {
    toast('Khí huyết quá thấp — hãy điều dưỡng trước.', 'canh_bao');
    return;
  }
  const nv = v14DsNhiemVuTruongLao().find(x => x.id === loai);
  if (!nv) return;
  tt.nam = state.nam;

  const cpSum = tinhCongPhapTongHop();
  const suc = (state.canhGioi || 0) * 10 + Math.floor((state.chiSo.thanThuc + cpSum.thanThuc + state.chiSo.khiVan) / 8);
  const tiLe = Math.max(35, Math.min(92, (loai === 'tran_ap' ? 45 : loai === 'truy_sat' ? 55 : 70) + suc));
  tienThoiGian(nv.thang);
  if (state.ketThuc) {
    luuGame();
    veGiaoDien();
    return;
  }
  const heSoChucVu = typeof v15HeSoChucVu === 'function' ? v15HeSoChucVu() : 1;
  const thuongLt = Math.round(nv.lt * heSoChucVu);
  const thuongCh = Math.round(nv.ch * heSoChucVu);
  if (Math.random() * 100 < tiLe) {
    state.linhThach += thuongLt;
    thayDoiCongHienTongMon(thuongCh);
    tt.count = (tt.count || 0) + 1;
    const nhanDan = Math.random() < (loai === 'tran_ap' ? 0.9 : loai === 'truy_sat' ? 0.6 : 0.35);
    if (nhanDan) themVat('yeu_dan_nhi_cap', 1);
    ghiNhatKy(
      `🎖️ Hoàn thành [${nv.ten}] (kiểm định ${Math.round(tiLe)}%): +${thuongLt.toLocaleString('vi-VN')} Linh thạch, +${thuongCh} Cống hiến${heSoChucVu > 1 ? ` (chức vị ×${heSoChucVu})` : ''}${nhanDan ? ', nhận 1 Yêu đan' : ''}.`,
      'dai_cat'
    );
    toast(`🎖️ Hoàn thành ${nv.ten}: +${thuongLt.toLocaleString('vi-VN')} LT, +${thuongCh} CH${nhanDan ? ', +1 Yêu đan' : ''}`, 'tot', 6500);
  } else {
    state.hp = Math.max(1, Math.round(state.hp * 0.75));
    tangThuongThePlayer(1, 'nhiệm vụ trưởng lão thất bại');
    ghiNhatKy(`🎖️ Thất bại [${nv.ten}] (kiểm định ${Math.round(tiLe)}%): hao tổn khí huyết, bị thương.`, 'nguy_hiem');
    toast(`🎖️ Thất bại ${nv.ten}: mất 25% HP, bị thương`, 'canh_bao', 6000);
  }
  luuGame();
  veGiaoDien();
}

/* ------------------------------ 4. KHỞI TẠO ------------------------------ */

window.addEventListener('DOMContentLoaded', () => {
  console.info(`[PNTT v${PN_V14.VERSION}] Đã nạp: Tâm ma đột phá, tự nhập giá/mua ngay, nhiệm vụ trưởng lão, lọc cảnh giới.`);
});