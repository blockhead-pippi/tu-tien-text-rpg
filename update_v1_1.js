/* ============================================================================
   PHÀM NHÂN TU TIÊN — UPDATE v1.1  "QoL + Tempo + Discoverability"
   Nạp SAU game.js và map.js. Không sửa trực tiếp lõi save/load cũ.
   Gồm: toast, tiến độ offline, treo máy tự bế quan, hướng dẫn/mục tiêu,
   gợi ý ngữ cảnh, mô tả tỉ lệ đột phá, cân bằng quái, mua nhiều, phím tắt.
   ============================================================================ */

const PN_V11 = {
  VERSION: '1.1.0',
  AUTO_MS: 6000,
  OFFLINE_MIN_PHUT: 10,
  OFFLINE_TOI_DA_GIO: 12,
  OFFLINE_NAM_TOI_DA: 4,
  OFFLINE_HIEU_SUAT: 0.6
};

/* ------------------------------ 1. TIỆN ÍCH ------------------------------ */

function fmtNum(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  return Math.round(v).toLocaleString('vi-VN');
}

function toast(msg, loai = 'thuong', ms = 4200) {
  try {
    let wrap = document.getElementById('toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'toast-wrap';
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = 'toast toast-' + (loai || 'thuong');
    el.innerHTML = String(msg || '');
    wrap.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast-out');
      setTimeout(() => el.remove(), 380);
    }, Math.max(1200, ms));
    while (wrap.children.length > 4) wrap.removeChild(wrap.firstChild);
  } catch (e) { /* bỏ qua */ }
}

/* --------------------- 2. TIẾN ĐỘ OFFLINE (BẾ QUAN TREO) ------------------- */

function xuLyTienDoOffline() {
  if (typeof state === 'undefined' || !state || state.ketThuc) return;
  if (state.tranHienTai || state.suKienHienTai || state.hauChienNpc || state.biCanhHienTai) return;
  const ts = Number(state.tsLuu || 0);
  if (!ts) return;
  const phut = (Date.now() - ts) / 60000;
  if (phut < PN_V11.OFFLINE_MIN_PHUT) return;

  const gio = Math.min(PN_V11.OFFLINE_TOI_DA_GIO, phut / 60);
  const nam = Math.min(PN_V11.OFFLINE_NAM_TOI_DA, gio * 0.5);
  if (nam < 0.25) return;

  const tocDo = tinhTocDoTuLuyenNam();
  const tuViNhan = Math.round(tocDo * nam * PN_V11.OFFLINE_HIEU_SUAT);
  state.tuVi += tuViNhan;
  ghiNhatKy(
    `💤 Offline ${(Math.round(gio * 10) / 10).toLocaleString('vi-VN')} giờ — tự bế quan ${(Math.round(nam * 10) / 10).toLocaleString('vi-VN')} năm, nhận +${tuViNhan.toLocaleString('vi-VN')} Tu vi (hiệu suất ${Math.round(PN_V11.OFFLINE_HIEU_SUAT * 100)}%).`,
    'tot'
  );
  tienThoiGian(Math.max(1, Math.round(nam * 12)));
  luuGame();
  toast(`💤 Offline ${(Math.round(gio * 10) / 10).toLocaleString('vi-VN')} giờ → +${fmtNum(tuViNhan)} Tu vi`, 'tot', 7000);
}

/* ---------------------- 3. TREO MÁY TỰ BẾ QUAN (AUTO) ---------------------- */

let v11AutoTimer = null;

function dangAutoTuLuyen() {
  return !!v11AutoTimer;
}

function dungAutoTuLuyen(lyDo) {
  if (v11AutoTimer) {
    clearInterval(v11AutoTimer);
    v11AutoTimer = null;
  }
  if (lyDo) toast(lyDo, 'canh_bao', 5000);
  if (typeof veGiaoDien === 'function' && state) veGiaoDien();
}

function batTatAutoTuLuyen() {
  if (v11AutoTimer) {
    dungAutoTuLuyen('⏹ Đã dừng treo máy tu luyện.');
    return;
  }
  if (typeof state === 'undefined' || !state || state.ketThuc) return;
  if (state.tranHienTai || state.suKienHienTai || state.hauChienNpc || state.biCanhHienTai) {
    toast('Không thể treo máy khi đang có sự kiện / chiến đấu.', 'canh_bao');
    return;
  }
  toast('⏳ Bắt đầu treo máy: mỗi 6 giây = 1 năm bế quan. Tự dừng khi đủ Tu vi hoặc gặp sự kiện.', 'tot', 5200);
  v11AutoTimer = setInterval(() => {
    if (typeof state === 'undefined' || !state || state.ketThuc) return dungAutoTuLuyen('⏹ Treo máy dừng: kiếp đã kết thúc.');
    if (state.tranHienTai || state.suKienHienTai || state.hauChienNpc || state.biCanhHienTai) {
      return dungAutoTuLuyen('⏸ Treo máy tạm dừng: có sự kiện / chiến đấu cần xử lý.');
    }
    if (state.tuVi >= tinhTuViCan()) {
      return dungAutoTuLuyen('✅ Đã tích đủ Tu vi — hãy bấm Đột phá để lên cảnh giới!');
    }
    beQuan(1);
  }, PN_V11.AUTO_MS);
  if (typeof veGiaoDien === 'function') veGiaoDien();
}

/* --------------- 4. HƯỚNG DẪN / MỤC TIÊU (DISCOVERABILITY) --------------- */

function v11CoTheLuyenDan() {
  if (!state || !Array.isArray(state.danPhuongDaHoc)) return false;
  return window.PN_DATA.danPhuong
    .filter(dp => state.danPhuongDaHoc.includes(dp.id))
    .some(dp => dp.nguyenLieu.every(n => soLuongVat(n.id) >= n.soLuong));
}

function v11DsCongPhapPhuHop() {
  const cg = state.canhGioi || 0;
  return (window.PN_DATA.congPhap || [])
    .filter(c => c.loai === 'TU_LUYEN' && c.coTheMua !== false && Number(c.canhGioi) === cg)
    .sort((a, b) => (b.tuLuyen?.heSoTocDo || 1) - (a.tuLuyen?.heSoTocDo || 1));
}

function v11CongPhapLoiThoi() {
  const cp = layCongPhapDef();
  if (!cp) return null;
  const gt = tinhHeSoVuotCanh(cp.canhGioi || 0, cp.canhGioiToiDa);
  return gt.vuot > 0 ? gt : null;
}

function v11MoTaCongPhapGoiY() {
  const ds = v11DsCongPhapPhuHop().slice(0, 3);
  if (ds.length === 0) return 'Tàng Kinh Các / bí cảnh cùng cảnh giới';
  return ds.map(c => `${c.ten} (${fmtNum(c.gia)} LT)`).join(', ');
}

function goiYViecNenLam() {
  if (typeof state === 'undefined' || !state) return '';
  const y = [];
  const biThuat = (state.biThuat || []).length;
  const maxBt = typeof MAX_BI_THUAT === 'number' ? MAX_BI_THUAT : 3;
  const loiThoi = v11CongPhapLoiThoi();
  const oTrong = (state.tuiDoMaxO || 10) - soOTrongTui();

  if (!state.phapBao) {
    y.push('Chưa trang bị <b>Pháp bảo</b> — ra Cửa Hàng mua binh khí rẻ (Trảm Thiết Đao ~50 LT, Thanh Tật Kiếm ~95 LT).');
  }
  if (loiThoi) {
    y.push(`Chủ công pháp <span class="hl-warn">đã lỗi thời (${loiThoi.nhan})</span> — nên đổi sang: <b>${escapeHtml(v11MoTaCongPhapGoiY())}</b>.`);
  }
  if (biThuat < maxBt) {
    y.push(`Bí thuật ${biThuat}/${maxBt} slot — mua bí thuật ở chợ (Lĩnh ngộ) rồi vào Túi Đồ gắn vào slot phụ.`);
  }
  if (oTrong <= 1) {
    y.push('Túi trữ vật gần đầy — bán bớt ở <b>Quầy Thu Mua</b>, hoặc vào tab 🏡 Động Phủ bấm <b>📦 Gửi hết nguyên liệu vào Kho</b> để dọn chỗ.');
  }
  if (state.canhGioi >= 1 && laDinhPhongDaiCanh() && state.tuVi >= tinhTuViCan()) {
    const dan = timDanDotPhaTrongTui();
    y.push(
      dan
        ? `Đang mang đan đột phá <b>${escapeHtml(dan.vp.ten)}</b> — hệ thống tự dùng khi bấm Đột phá (xem tỉ lệ trong tooltip).`
        : 'Đủ Tu vi đột phá nhưng chưa có đan hỗ trợ — mua <b>đan đột phá</b> ở chợ để tăng tỉ lệ thành công.'
    );
  }
  if (!state.tongMon) {
    y.push('Chưa bái nhập tông môn — vào Địa Điểm → <b>Tông Môn</b> để nhận nhiệm vụ, cống hiến và kho bảo vật.');
  }
  // v1.2: gợi ý vùng phường thị phù hợp khi chợ hiện tại không phục vụ được cảnh giới
  if (typeof goiYVungPhuHop === 'function') {
    const v = goiYVungPhuHop();
    if (v) {
      y.push(
        `Vùng hiện tại <b>${escapeHtml(layVungDef().ten)}</b> không có Phường Thị cấp cao — nên tới <b>${escapeHtml(v.ten)}</b> (Linh khí x${v.linhKhi}) để mua công pháp/đan 【${layCanhGioiDef(state.canhGioi).ten}】. Mở tab 🗺️ Bản Đồ để đi.`
      );
    }
  }
  if (y.length === 0) {
    y.push('Mọi thứ ổn — bế quan, lịch luyện hoặc vào <b>Bản Đồ (phím M)</b> để tìm kỳ ngộ.');
  }
  return `<div class="hint-line">💡 <b>Gợi ý:</b> ${y.slice(0, 3).join(' ')}</div>`;
}

function moHuongDan() {
  if (typeof state === 'undefined' || !state) {
    toast('Hãy tạo nhân vật trước khi xem hướng dẫn.', 'canh_bao');
    return;
  }
  const d = document.getElementById('modal-guide');
  const box = document.getElementById('guide-content');
  if (!d || !box) return;

  const biThuat = (state.biThuat || []).length;
  const maxBt = typeof MAX_BI_THUAT === 'number' ? MAX_BI_THUAT : 3;
  const coDp = state.dongPhu && Array.isArray(state.dongPhu.linhDien);
  const trongCay = coDp && state.dongPhu.linhDien.some(Boolean);
  const loiThoi = v11CongPhapLoiThoi();

  const items = [
    {
      done: (state.dongPhu?.cap || 1) >= 2,
      icon: '🏡',
      title: 'Nâng cấp Động Phủ / Tụ Linh Trận',
      desc: `Cấp ${state.dongPhu?.cap || 1} — tăng linh khí nơi tu luyện, mở thêm ô Linh Điền.`,
      action: "chonTab('dong_phu')",
      label: 'Mở Động Phủ'
    },
    {
      done: trongCay,
      icon: '🌱',
      title: 'Trồng linh thảo ở Linh Điền',
      desc: trongCay
        ? 'Đang có cây sinh trưởng. Thu hoạch khi chín để luyện đan hoặc bán.'
        : 'Gieo hạt ở Linh Điền; để cây già cho sản lượng x2–x3.',
      action: "chonTab('dong_phu')",
      label: 'Mở Linh Điền'
    },
    {
      done: !!state.phapBao,
      icon: '🗡️',
      title: 'Trang bị Pháp bảo',
      desc: state.phapBao
        ? `Đang dùng: ${escapeHtml((layVatPhamDef(state.phapBao) || {}).ten || state.phapBao)}.`
        : 'Pháp bảo tăng mạnh Công/Thủ. Chợ đầu game có binh khí 50–120 LT.',
      action: "chonTab('phuong_thi')",
      label: 'Mở Cửa Hàng'
    },
    {
      done: biThuat > 0,
      icon: '📘',
      title: `Học & gắn Bí thuật (${biThuat}/${maxBt})`,
      desc: 'Bí thuật cho kỹ năng chủ động và nội tại trong Đấu Pháp. Mua ở chợ (Lĩnh ngộ) hoặc Tàng Kinh Các, rồi gắn ở Túi Đồ.',
      action: "chonTab('tui_do')",
      label: 'Mở Túi Đồ'
    },
    {
      done: !loiThoi,
      icon: '🔄',
      title: 'Cập nhật chủ công pháp theo cảnh giới',
      desc: loiThoi
        ? `Công pháp hiện tại ${loiThoi.nhan}. Gợi ý: ${escapeHtml(v11MoTaCongPhapGoiY())}.`
        : 'Chủ công pháp còn hiệu lực tốt với cảnh giới hiện tại.',
      action: "chonTab('phuong_thi')",
      label: 'Tìm công pháp'
    },
    {
      done: v11CoTheLuyenDan(),
      icon: '🔥',
      title: 'Luyện đan lần đầu',
      desc: 'Khi đủ nguyên liệu cho đan phương đã học, mở Đan Phòng để luyện đan tăng Tu vi / hồi phục / hỗ trợ đột phá.',
      action: "chonTab('dong_phu')",
      label: 'Mở Đan Phòng'
    },
    {
      done: !!state.tongMon,
      icon: '🏛️',
      title: 'Bái nhập tông môn',
      desc: state.tongMon
        ? 'Đã là đệ tử — nhận ngọc giản nhiệm vụ, việc thường trực và đổi bảo vật.'
        : 'Tông môn cho nhiệm vụ, cống hiến, kho công pháp/pháp bảo theo cấp.',
      action: "chonTab('tong_mon')",
      label: 'Mở Tông Môn'
    },
    {
      done: !!state.daMoBanDo,
      icon: '🗺️',
      title: 'Khám phá Bản Đồ Nhân Giới',
      desc: 'Bấm nút 🗺️ hoặc phím M: di chuyển tốn thời gian và lộ phí; điểm sự kiện cho tu vi / linh thạch / bảo vật.',
      action: 'moBanDoTuongTac()',
      label: 'Mở bản đồ'
    },
    {
      done: !!layVungDef().coPhuongThi,
      icon: '🏯',
      title: 'Tới vùng có Phường Thị phù hợp cảnh giới',
      desc: layVungDef().coPhuongThi
        ? `Đang ở vùng có phường thị: ${escapeHtml(layVungDef().ten)} (Linh khí x${layVungDef().linhKhi}).`
        : (() => {
            const v = typeof goiYVungPhuHop === 'function' ? goiYVungPhuHop() : null;
            return v
              ? `Vùng hiện tại không bán đồ cấp 【${layCanhGioiDef(state.canhGioi).ten}】. Gợi ý: ${escapeHtml(v.ten)} (Linh khí x${v.linhKhi}) — đi mất ${tinhThangDiChuyen(v.id)} tháng.`
              : 'Di chuyển tới vùng có phường thị để mua công pháp/đan đúng cảnh giới.';
          })(),
      action: "chonTab('ban_do')",
      label: 'Mở Bản Đồ'
    },
    {
      done: (state.canhGioi || 0) >= 1,
      icon: '⚡',
      title: 'Đột phá đại cảnh giới đầu tiên',
      desc:
        (state.canhGioi || 0) >= 1
          ? `Đã đạt ${tenCanhGioiDayDu()}. Mốc kế: ${layCanhGioiDef(Math.min(10, state.canhGioi + 1)).ten}.`
          : 'Tích đủ Tu vi rồi Xung kích Đại Cảnh Giới (đột phá lớn có tỉ lệ — xem tooltip).',
      action: '',
      label: ''
    }
  ];

  box.innerHTML =
    items
      .map(
        it => `
      <div class="guide-item ${it.done ? 'done' : 'todo'}">
        <div class="g-ico">${it.done ? '✅' : it.icon}</div>
        <div class="g-body">
          <div class="g-title">${escapeHtml(it.title)}</div>
          <div class="g-desc">${it.desc}</div>
        </div>
        ${it.action ? `<button class="btn btn-sm g-link" onclick="${it.action}; dongHuongDan()">${it.label}</button>` : ''}
      </div>`
      )
      .join('') +
    `
      <div class="hint-line" style="margin-top:6px">⌨️ <b>Phím tắt:</b> <b>M</b> mở/đóng bản đồ · <b>Space</b> bế quan 1 năm · <b>B</b> đột phá · <b>Esc</b> đóng hộp thoại.</div>
      <div class="hint-line">📌 Mẹo: rê chuột lên nút Đột phá để xem chi tiết tỉ lệ; xem <b>Dược kháng</b> trong Túi Đồ trước khi uống nhiều đan cùng loại.</div>`;

  d.classList.add('open');
}

function dongHuongDan() {
  const d = document.getElementById('modal-guide');
  if (d) d.classList.remove('open');
}

/* ------------------- 5. MÔ TẢ CHI TIẾT TỈ LỆ ĐỘT PHÁ ------------------- */

function moTaChiTietDotPha() {
  if (typeof state === 'undefined' || !state) return '';
  // v1.1.1: tiểu cảnh giới luôn thành công, không hiển thị % gây hiểu nhầm
  if (!laDinhPhongDaiCanh()) {
    return 'Đột phá tiểu cảnh giới: chắc chắn thành công sau 1 tháng điều tức (không thể thất bại).';
  }
  const def = layCanhGioiDef();
  const lc = layLinhCanDef();
  const tc = layTheChatDef();
  const cpSum = tinhCongPhapTongHop();
  const phan = [`Nền ${Math.round((def.tiLeDotPha || 0) * 100)}%`];
  if (lc.bonusDotPha) phan.push(`Linh căn ${Math.round(lc.bonusDotPha * 100)}%`);
  if (tc.dotPhaBonus) phan.push(`Thể chất ${Math.round(tc.dotPhaBonus * 100)}%`);
  if (cpSum.tiLeDotPha) {
    const hs = cpSum.tiLeDotPha > 0 && typeof heSoThamNienCongPhap === 'function' ? heSoThamNienCongPhap() : 1;
    phan.push(`Công pháp ${Math.round(cpSum.tiLeDotPha * 100 * hs)}%${hs < 1 ? ' (thâm niên chưa đủ)' : ''}`);
  }
  const csBonus = (state.chiSo.khiVan + cpSum.khiVan + state.chiSo.thanThuc + cpSum.thanThuc) * 0.0025;
  if (csBonus) phan.push(`Khí vận/Thần thức ${Math.round(csBonus * 100)}%`);
  if (state.dotPhaBuff > 0) phan.push(`Dược lực +${Math.round(state.dotPhaBuff * 100)}%`);
  else {
    const pill = timDanDotPhaTrongTui();
    if (pill) phan.push(`${pill.vp.ten} +${Math.round(pill.bonus * 100)}%`);
  }
  const tong = Math.round(tinhTiLeDotPhaDaiCanh() * 100);
  return `Tỉ lệ đột phá ${tong}%: ${phan.join(' · ')}`;
}

/* --------------------- 6. CÂN BẰNG QUÁI THEO CẢNH GIỚI --------------------- */

function v11CanBangDich(dich) {
  if (!dich || typeof state === 'undefined' || !state) return dich;
  const cgDich = Number(dich.canhGioiDich || 0);
  const diff = Math.max(0, (state.canhGioi || 0) - cgDich);
  if (diff <= 0) return dich;
  const heSoHp = Math.min(3.4, 1 + diff * 0.65 + (state.tieuCanh || 0) * 0.02);
  const heSoAtk = Math.min(2.4, 1 + diff * 0.32);
  const heSoDef = Math.min(2.2, 1 + diff * 0.22);
  return Object.assign({}, dich, {
    hp: Math.max(1, Math.round((dich.hp || 1) * heSoHp)),
    congKich: Math.max(1, Math.round((dich.congKich || 1) * heSoAtk)),
    phongThu: Math.round((dich.phongThu || 0) * heSoDef)
  });
}

/* --------------- 7. MUA NHIỀU VẬT PHẨM + TIỆN ÍCH BỔ SUNG --------------- */

function muaNhieuVatPham(itemKey, soLuong) {
  if (!state || !itemKey) return;
  const vp = layVatPhamDef(itemKey);
  if (!vp) return;
  if (vp.loai === 'tru_vat') return muaVatPham('vat_pham', itemKey);

  const pc = layPhamChatVatPham(itemKey);
  const shopVp = (typeof shopHangCache !== 'undefined' && shopHangCache && Array.isArray(shopHangCache.items))
    ? shopHangCache.items.find(x => x && x.shopKey === itemKey)
    : null;
  const gia = shopVp && shopVp.giaShop ? Number(shopVp.giaShop) : Math.max(1, Math.round((vp.gia || 0) * pc.heSo));
  const mongMuon = Math.max(1, Math.min(99, Number(soLuong) || 1));

  const coStack = soLuongVat(itemKey) > 0;
  let toiDaTheoTui = mongMuon;
  if (!coStack) {
    const oTrong = (state.tuiDoMaxO || 10) - soOTrongTui();
    toiDaTheoTui = Math.min(toiDaTheoTui, Math.max(0, oTrong));
  }
  const toiDaTheoLt = Math.floor(state.linhThach / gia);
  const seMua = Math.min(toiDaTheoTui, toiDaTheoLt, mongMuon);

  if (seMua <= 0) {
    toast(coStack || soOTrongTui() < (state.tuiDoMaxO || 10) ? 'Không đủ Linh thạch để mua.' : 'Túi đầy — hãy dọn túi trước khi mua.', 'canh_bao');
    return;
  }
  themVat(itemKey, seMua);
  state.linhThach -= gia * seMua;
  ghiNhatKy(`💰 Mua ${seMua} [${vp.ten} · ${pc.ten}] với giá ${(gia * seMua).toLocaleString('vi-VN')} Linh thạch.`, 'thuong');
  toast(`💰 Mua ${seMua} × ${escapeHtml(vp.ten)} (−${fmtNum(gia * seMua)} LT)`, 'tot');
  luuGame();
  veGiaoDien();
}

/* ---------------------------- 8. KHỞI TẠO ---------------------------- */

(function v11KhoiTao() {
  // Bọc hàm chiến đấu để quái không còn quá yếu khi người chơi vượt cảnh giới
  if (typeof window.batDauChienDau === 'function') {
    const gocChienDau = window.batDauChienDau;
    window.batDauChienDau = function (dich) {
      return gocChienDau.call(this, v11CanBangDich(dich));
    };
  }

  // Đánh dấu đã mở bản đồ (checklist hướng dẫn)
  if (typeof window.moBanDoTuongTac === 'function') {
    const gocMap = window.moBanDoTuongTac;
    window.moBanDoTuongTac = function (opts) {
      try {
        if (state) state.daMoBanDo = true;
      } catch (e) {}
      return gocMap.call(this, opts);
    };
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('toast-wrap')) {
      const w = document.createElement('div');
      w.id = 'toast-wrap';
      w.className = 'toast-wrap';
      document.body.appendChild(w);
    }

    if (typeof state !== 'undefined' && state) {
      xuLyTienDoOffline();
      veGiaoDien();
      if (v11CongPhapLoiThoi()) {
        toast('⚠️ Chủ công pháp đã lỗi thời — mở ❓ Hướng dẫn để xem gợi ý thay thế.', 'canh_bao', 6000);
      }
    }

    document.addEventListener('keydown', e => {
      const tag = (e.target && e.target.tagName) || '';
      if (/INPUT|SELECT|TEXTAREA/.test(tag)) return;

      if (e.key === 'Escape') {
        const g = document.getElementById('modal-guide');
        if (g && g.classList.contains('open')) {
          dongHuongDan();
          return;
        }
        const m = document.getElementById('modal-newgame');
        if (m && m.classList.contains('open') && typeof dongModalKiepMoi === 'function') {
          dongModalKiepMoi();
        }
        return;
      }

      if (typeof state === 'undefined' || !state || state.ketThuc) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (state.tranHienTai || state.suKienHienTai || state.hauChienNpc || state.biCanhHienTai) return;
      if (document.querySelector('.modal-backdrop.open')) return;
      const nkOv = document.getElementById('nkOverlay');
      if (nkOv && !nkOv.hidden) return; // không xử lý phím tắt khi bản đồ đang mở

      if (e.code === 'Space') {
        if (e.target && e.target.tagName === 'BUTTON') return;
        e.preventDefault();
        beQuan(1);
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        if (state.tuVi >= tinhTuViCan()) dotPha();
        else toast('Chưa đủ Tu vi để đột phá.', 'canh_bao');
      }
    });
  });

  console.info(`[PNTT v${PN_V11.VERSION}] Đã nạp bản cập nhật QoL: toast, offline, treo máy, hướng dẫn, cân bằng quái.`);
})();