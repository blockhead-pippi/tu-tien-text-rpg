// =========================================================================
// Tác giả: Gemini (Antigravity)
// update_v1_9.js — Bản cập nhật v1.9:
//   1. Phẩm chất Kim Đan (CG3) & Nguyên Anh (CG4) + chỉ số bị động vĩnh viễn
//   2. Biên Niên Nguyên Tác Phàm Nhân Tu Tiên & Hành trình Hàn Lập (Khán giả / Tham gia)
//   3. Đại Hội Thí Luyện Huyết Sắc Cấm Địa Liên Tông (Thất Đại Phái Việt Quốc)
//   4. Hệ thống Linh Thú Đồng Hành (Ấp trứng, Cho ăn Yêu đan, Tiến giai, Trợ chiến)
//      (Lưu ý: KHÔNG có Chưởng Thiên Bình cho người chơi — vật phẩm thuộc về Hàn Lập)
//   5. Mở rộng Đạo Lữ (Song Tu & Tiếp ứng) & Sư Đồ (Thu nhận đệ tử, Truyền công, Cống nạp)
// =========================================================================

// ==========================================
// 1. PHẨM CHẤT KIM ĐAN & NGUYÊN ANH
// ==========================================

const V19_PHAM_CHAT_DAO_CO = {
  ha: {
    key: 'ha',
    ten: 'Hạ Phẩm',
    cls: 'muted',
    kimDan: { hpPct: 0.05, mpPct: 0.05, atkPct: 0.04, defPct: 0.04, tocDoPct: 0.04, thoNguyen: 15 },
    nguyenAnh: { hpPct: 0.06, mpPct: 0.06, atkPct: 0.05, defPct: 0.05, tocDoPct: 0.05, thoNguyen: 40 }
  },
  trung: {
    key: 'trung',
    ten: 'Trung Phẩm',
    cls: 'hl-realm',
    kimDan: { hpPct: 0.1, mpPct: 0.1, atkPct: 0.08, defPct: 0.08, tocDoPct: 0.08, thoNguyen: 35 },
    nguyenAnh: { hpPct: 0.12, mpPct: 0.12, atkPct: 0.1, defPct: 0.1, tocDoPct: 0.1, thoNguyen: 90 }
  },
  thuong: {
    key: 'thuong',
    ten: 'Thượng Phẩm',
    cls: 'hl-green',
    kimDan: { hpPct: 0.18, mpPct: 0.18, atkPct: 0.14, defPct: 0.14, tocDoPct: 0.14, thoNguyen: 70 },
    nguyenAnh: { hpPct: 0.2, mpPct: 0.2, atkPct: 0.16, defPct: 0.16, tocDoPct: 0.16, thoNguyen: 160 }
  },
  cuc: {
    key: 'cuc',
    ten: 'Cửu Chuyển · Cực Phẩm',
    cls: 'hl-gold',
    kimDan: { hpPct: 0.28, mpPct: 0.28, atkPct: 0.22, defPct: 0.22, tocDoPct: 0.22, thoNguyen: 120 },
    nguyenAnh: { hpPct: 0.32, mpPct: 0.32, atkPct: 0.25, defPct: 0.25, tocDoPct: 0.25, thoNguyen: 260 }
  }
};

function v19XuLyPhamChatDotPha(canhMoi, pillMeta = {}) {
  if (!state || (canhMoi !== 3 && canhMoi !== 4)) return null;
  if (!state.phamChatDaoCo || typeof state.phamChatDaoCo !== 'object') {
    state.phamChatDaoCo = { kimDan: null, nguyenAnh: null };
  }
  const slot = canhMoi === 3 ? 'kimDan' : 'nguyenAnh';
  if (state.phamChatDaoCo[slot]) return state.phamChatDaoCo[slot];

  let diem = 20;
  // 1. Đan dược hỗ trợ đột phá
  if (pillMeta && pillMeta.coDan) {
    const pcMap = { ha: 8, trung: 16, thuong: 25, cuc: 35 };
    diem += pcMap[pillMeta.pcKey] || 14;
  }
  // 2. Độ tương thích công pháp chủ tu với linh căn
  const tt = typeof tinhTuongThichLinhCan === 'function' ? tinhTuongThichLinhCan() : { khop: 'khong' };
  if (tt.khop === 'khop') diem += 18;
  else if (tt.khop === 'mot_phan') diem += 10;

  // 3. Căn cốt + Ngộ tính + Thần thức
  const cs = state.chiSo || {};
  diem += Math.min(25, Math.round(((cs.canCot || 10) + (cs.ngoTinh || 10) + (cs.thanThuc || 10)) * 0.25));

  // 4. Linh căn thuần khiết / Dị linh căn
  const lc = typeof layLinhCanDef === 'function' ? layLinhCanDef() : null;
  if (lc && (lc.heSoTuLuyen || 1) >= 1.75) diem += 12;
  else if (lc && (lc.heSoTuLuyen || 1) >= 1.4) diem += 6;

  // 5. Thiên cơ ngẫu nhiên nhỏ
  diem += Math.floor(Math.random() * 14);

  const key = diem >= 88 ? 'cuc' : diem >= 68 ? 'thuong' : diem >= 46 ? 'trung' : 'ha';
  const def = V19_PHAM_CHAT_DAO_CO[key];
  state.phamChatDaoCo[slot] = key;

  const tenCap = canhMoi === 3 ? 'Kim Đan' : 'Nguyên Anh';
  const b = def[slot];
  ghiNhatKy(
    `✨ Dị tượng ngưng tụ! ${tenCap} của bạn đạt phẩm chất 【${tenCap} ${def.ten}】 — Vĩnh viễn nhận: HP/LL +${Math.round(b.hpPct * 100)}%, Công/Thủ +${Math.round(b.atkPct * 100)}%, Tốc độ tu luyện +${Math.round(b.tocDoPct * 100)}%, Thọ nguyên +${b.thoNguyen} năm!`,
    key === 'cuc' || key === 'thuong' ? 'dai_cat' : 'tot'
  );
  return key;
}

function v19BonusDaoCo(loai) {
  if (!state || !state.phamChatDaoCo) return 0;
  let tong = 0;
  for (const slot of ['kimDan', 'nguyenAnh']) {
    const key = state.phamChatDaoCo[slot];
    if (!key || !V19_PHAM_CHAT_DAO_CO[key]) continue;
    tong += Number(V19_PHAM_CHAT_DAO_CO[key][slot]?.[loai]) || 0;
  }
  return tong;
}

function v19RenderTrangThaiDaoCo() {
  if (!state || !state.phamChatDaoCo) return '';
  const rows = [];
  if (state.phamChatDaoCo.kimDan && V19_PHAM_CHAT_DAO_CO[state.phamChatDaoCo.kimDan]) {
    const d = V19_PHAM_CHAT_DAO_CO[state.phamChatDaoCo.kimDan];
    const b = d.kimDan;
    rows.push(
      `<div class="stat-row"><span>Phẩm chất Kim Đan:</span> <b class="${d.cls}">${d.ten}</b> <span class="muted">(Công/Thủ +${Math.round(b.atkPct * 100)}% · Thọ +${b.thoNguyen}n)</span></div>`
    );
  }
  if (state.phamChatDaoCo.nguyenAnh && V19_PHAM_CHAT_DAO_CO[state.phamChatDaoCo.nguyenAnh]) {
    const d = V19_PHAM_CHAT_DAO_CO[state.phamChatDaoCo.nguyenAnh];
    const b = d.nguyenAnh;
    rows.push(
      `<div class="stat-row"><span>Phẩm chất Nguyên Anh:</span> <b class="${d.cls}">${d.ten}</b> <span class="muted">(Công/Thủ +${Math.round(b.atkPct * 100)}% · Thọ +${b.thoNguyen}n)</span></div>`
    );
  }
  return rows.join('');
}

// ==========================================
// 2. BIÊN NIÊN NGUYÊN TÁC & HÀNH TRÌNH HÀN LẬP
// ==========================================

const V19_BIEN_NIEN_NGUYEN_TAC = [
  {
    id: 'nt_that_huyen_mon',
    nam: 4,
    tieuDe: 'Biến Cố Thất Huyền Môn & Loạn Dã Lang Bang',
    vungId: 'kinh_chau',
    hanLap: {
      canhGioi: 1,
      tieuCanh: 2,
      vungId: 'kinh_chau',
      danhHieu: 'Đệ tử Thần Thủ Cốc — Tán tu rời Thất Huyền Môn',
      linhThach: 120,
      tuiDo: ['bao_tram_thiet_dao', 'cp_truong_xuan_cong', 'dan_hoang_long'],
      kyUc: 'Phá tan âm mưu đoạt xá của Mặc Đại Phu, cứu Thất Huyền Môn khỏi Dã Lang Bang rồi lặng lẽ lên đường tới Gia Nguyên Thành.'
    },
    moTa: 'Tại dãy Thái Lăng thuộc Kính Châu, Dã Lang Bang cấu kết tán tu Kim Quang Thượng Nhân đánh úp Thất Huyền Môn. Một thiếu niên da ngăm tên Hàn Lập từ Thần Thủ Cốc đã lặng lẽ xoay chuyển cục diện, diệt trừ Kim Quang Thượng Nhân rồi âm thầm rời núi bước vào Tu Tiên Giới.',
    choices: () => [
      {
        text: '👁️ Đứng ngoài quan sát biến cố nhân thế (Làm khán giả · +Tu vi ngộ đạo)',
        effects: [
          { tuVi: 35, v19GhiNhan: { id: 'nt_that_huyen_mon', nhan: 'Khán giả quan sát' }, log: '📜 Bạn lặng lẽ đứng ngoài nhìn gió nổi mây vần tại Thất Huyền Môn, cảm ngộ được đạo lý "ẩn nhẫn tự bảo" (+Tu vi).' }
        ]
      },
      {
        text: '🤝 Lên núi trợ giúp Thất Huyền Môn đẩy lui Dã Lang Bang (+Hảo cảm Hàn Lập & Vương Tuyệt Sở)',
        effects: [
          { tuVi: 55, linhThach: 45, haoCamNpc: { npcId: 'npc_han_lap', delta: 12, lyDo: 'Cùng bảo vệ Thất Huyền Môn khỏi loạn Dã Lang Bang.' }, haoCamNpc2: null, v19GhiNhan: { id: 'nt_that_huyen_mon', nhan: 'Tham gia cứu Thất Huyền Môn' }, log: '⚔️ Bạn xuất thủ hỗ trợ Thất Huyền Môn đánh tan Dã Lang Bang, kết một phần thiện duyên với Hàn Lập đang chuẩn bị rời núi!' }
        ]
      },
      {
        text: '🕵️ Lần theo dấu vết chiến trường thu nhặt di vật của Kim Quang Thượng Nhân',
        check: { chiSo: 'khiVan', doKho: 12 },
        success: [
          { linhThach: 90, addItem: 'phu_kim_quang', v19GhiNhan: { id: 'nt_that_huyen_mon', nhan: 'Thu chiến lợi phẩm' }, log: '💎 Bạn nhặt được di vật sót lại sau trận chiến với Kim Quang Thượng Nhân (+90 LT và phù lục hộ thân)!' }
        ],
        failure: [
          { hp: -15, v19GhiNhan: { id: 'nt_that_huyen_mon', nhan: 'Thám thính bất thành' }, log: '💨 Hiện trường đã bị dọn sạch dấu vết, bạn chỉ gặp tàn binh Dã Lang Bang quấy nhiễu.' }
        ]
      }
    ]
  },
  {
    id: 'nt_thang_tien_dai_hoi',
    nam: 10,
    tieuDe: 'Thái Nam Tiểu Hội & Thăng Tiên Đại Hội Việt Quốc',
    vungId: 'viet_quoc',
    hanLap: {
      canhGioi: 1,
      tieuCanh: 9,
      vungId: 'thai_nhac_son_mach',
      danhHieu: 'Đệ tử ngoại môn Hoàng Phong Cốc (Bách Dược Viên)',
      linhThach: 450,
      tuiDo: ['bao_thanh_tat_kiem', 'cp_truong_xuan_cong', 'dan_hoang_long'],
      kyUc: 'Dự Thái Nam Tiểu Hội, dùng Thăng Tiên Lệnh bái nhập Hoàng Phong Cốc và xin ra trông coi Bách Dược Viên.'
    },
    moTa: 'Thất Đại Tông Môn Việt Quốc mở Thăng Tiên Đại Hội tại Thái Nam Cốc thu nhận đệ tử. Hàn Lập xuất trình Thăng Tiên Lệnh đoạt từ Kim Quang Thượng Nhân, tuy chỉ là Tứ Linh Căn nhưng vẫn thuận lợi gia nhập Hoàng Phong Cốc và nhận được một viên Trúc Cơ Đan.',
    choices: () => [
      {
        text: '👁️ Đứng ngoài xem náo nhiệt Thái Nam Tiểu Hội (Làm khán giả · +Tu vi)',
        effects: [
          { tuVi: 90, v19GhiNhan: { id: 'nt_thang_tien_dai_hoi', nhan: 'Khán giả quan sát' }, log: '📜 Bạn dạo quanh Thái Nam Cốc ngắm nhìn cảnh tượng Thăng Tiên Đại Hội, mở rộng kiến văn tu tiên giới.' }
        ]
      },
      {
        text: '🍵 Tìm gặp Hàn Lập tại phường thị Thái Nam trao đổi đan dược & tin tức',
        effects: [
          { tuVi: 110, linhThach: 80, haoCamNpc: { npcId: 'npc_han_lap', delta: 15, lyDo: 'Giao lưu trao đổi tâm đắc tại Thái Nam Tiểu Hội.' }, v19GhiNhan: { id: 'nt_thang_tien_dai_hoi', nhan: 'Kết giao Hàn Lập tại Thái Nam' }, log: '🤝 Bạn cùng Hàn Lập hàn huyên đôi câu ở góc phường thị Thái Nam; đối phương tuy kín tiếng nhưng vẫn ghi nhớ thiện ý của bạn (+15 Hảo cảm Hàn Lập).' }
        ]
      },
      {
        text: '⚔️ Lên lôi đài Thăng Tiên tỷ thí cùng tán tu bốn phương (+Linh thạch & Danh tiếng)',
        check: { chiSo: 'thanThuc', doKho: 15 },
        success: [
          { tuVi: 140, linhThach: 180, addItem: 'dan_hoang_long', v19GhiNhan: { id: 'nt_thang_tien_dai_hoi', nhan: 'Thắng lôi đài Thăng Tiên' }, log: '🏆 Bạn liên tiếp đánh bại nhiều tán tu trên lôi đài Thái Nam, nhận thưởng Linh thạch và Hoàng Long Đan!' }
        ],
        failure: [
          { hp: -30, tuVi: 80, v19GhiNhan: { id: 'nt_thang_tien_dai_hoi', nhan: 'Tỷ thí thất bại' }, log: '⚔️ Gặp cao thủ thế gia trên lôi đài, bạn bị đánh lui nhưng vẫn thu được kinh nghiệm thực chiến.' }
        ]
      }
    ]
  },
  {
    id: 'nt_huyet_sac_cam_dia',
    nam: 18,
    tieuDe: 'Đại Hội Huyết Sắc Cấm Địa Thất Đại Phái',
    vungId: 'viet_quoc',
    hanLap: {
      canhGioi: 2,
      tieuCanh: 0,
      vungId: 'thai_nhac_son_mach',
      danhHieu: 'Đệ tử Trúc Cơ Hoàng Phong Cốc — Môn hạ Lý Hóa Nguyên',
      linhThach: 2600,
      tuiDo: ['bao_kim_quang_chuyen_phu_bao', 'bao_moc_giao_giap', 'dan_truc_co'],
      kyUc: 'Sống sót rời khỏi Huyết Sắc Cấm Địa sau trận chiến với Mặc Giao cùng Nam Cung Uyển, hiến linh dược và đột phá Trúc Cơ Kỳ.'
    },
    moTa: 'Huyết Sắc Cấm Địa năm năm mở một lần đã tới kỳ! Đệ tử tinh anh Luyện Khí tầng cao của Thất Đại Phái đổ vào tranh đoạt linh thảo luyện Trúc Cơ Đan. Bên trong cấm địa, Hàn Lập gặp Nam Cung Uyển, cùng hợp lực đánh bại Mặc Giao cấp hai rồi toàn thân trở ra, thuận lợi Trúc Cơ!',
    choices: () => [
      {
        text: '👁️ Ở bên ngoài cấm địa theo dõi kết quả Thất Phái (Làm khán giả · An toàn)',
        effects: [
          { tuVi: 180, v19GhiNhan: { id: 'nt_huyet_sac_cam_dia', nhan: 'Khán giả ngoài cấm địa' }, log: '📜 Bạn đứng ngoài doanh trại Thất Phái chứng kiến từng tốp đệ tử sống sót rời khỏi Huyết Sắc Cấm Địa, thấm thía sự tàn khốc của đường tu tiên.' }
        ]
      },
      {
        text: '🌿 Nhân lúc hỗn loạn lén hái linh thảo ngoài rìa Cấm Địa (+Linh thảo & Cơ hội Trúc Cơ Đan)',
        check: { chiSo: 'khiVan', doKho: 18 },
        success: [
          { tuVi: 240, addItem: 'dan_truc_co', v19GhiNhan: { id: 'nt_huyet_sac_cam_dia', nhan: 'Tham gia đoạt Trúc Cơ Đan' }, log: '🌟 Bạn khéo léo né tránh giao tranh, thu hoạch đầy túi linh thảo và đổi được 1 viên 【Trúc Cơ Đan】!' }
        ],
        failure: [
          { hp: -60, tuVi: 160, linhThach: 220, v19GhiNhan: { id: 'nt_huyet_sac_cam_dia', nhan: 'Bị tập kích rút lui' }, log: '💥 Bị đệ tử Thiên Khuyết Bảo truy đuổi, bạn đành vứt lại một phần linh thảo để thoát thân.' }
        ]
      },
      {
        text: '⚔️ Xông sâu vào lõi Cấm Địa tranh bảo với đệ tử Thất Phái (Chiến đấu · Thưởng lớn)',
        effects: [
          {
            v19GhiNhan: { id: 'nt_huyet_sac_cam_dia', nhan: 'Quyết chiến trong Huyết Sắc Cấm Địa' },
            combat: {
              ten: 'Cuồng Đồ Thiên Khuyết Bảo (Luyện Khí Tầng 13)',
              hp: 760,
              congKich: 185,
              phongThu: 110,
              linhThach: 650,
              loot: 'dan_truc_co',
              canhGioiDich: 1,
              tieuCanhDich: 12,
              giuNguyenChiSo: true
            },
            log: '⚔️ Bạn xông thẳng vào khu vực trung tâm Huyết Sắc Cấm Địa, chạm trán cao thủ Thiên Khuyết Bảo chặn đường cướp bảo!'
          }
        ]
      }
    ]
  },
  {
    id: 'nt_ma_dao_xam_luoc',
    nam: 36,
    tieuDe: 'ĐẠI BIẾN: Ma Đạo Lục Tông Xâm Lược Việt Quốc!',
    vungId: 'viet_quoc',
    hanLap: {
      canhGioi: 2,
      tieuCanh: 2,
      vungId: 'khoi_tinh_dao',
      danhHieu: 'Tán tu Trúc Cơ Hậu Kỳ tại Khôi Tinh Đảo (Loạn Tinh Hải)',
      linhThach: 9500,
      tuiDo: ['bao_thanh_truc_phong_van_kiem', 'bao_than_phong_chu', 'cp_thanh_nguyen_kiem_quyet'],
      kyUc: 'Thoát khỏi chiến hỏa Ma Đạo Lục Tông xâm lược Việt Quốc, dùng Cổ Truyền Tống Trận vượt biển sang Loạn Tinh Hải ẩn tu.'
    },
    moTa: 'Khói lửa ngút trời khắp Việt Quốc! Ma Đạo Lục Tông (Quỷ Linh Môn, Hợp Hoan Tông, Ma Diệm Tông...) đồng loạt phát động đại chiến, Thất Đại Chính Phái liên tiếp thất thủ; Hoàng Phong Cốc Lệnh Hồ Lão Tổ buộc phải rút quân bỏ rơi ngoại vi. Hàn Lập mượn Cổ Truyền Tống Trận bí mật vượt không gian chạy tới Loạn Tinh Hải!',
    choices: () => [
      {
        text: '👁️ Ẩn mình tránh chiến hỏa, đứng ngoài quan sát đại biến (Làm khán giả · An toàn)',
        effects: [
          { tuVi: 450, v19GhiNhan: { id: 'nt_ma_dao_xam_luoc', nhan: 'Khán giả lánh nạn' }, log: '📜 Bạn ẩn giấu khí tức tránh xa chiến trường Việt Quốc, chứng kiến Thất Phái suy tàn và Ma Đạo Lục Tông chiếm cứ sơn hà.' }
        ]
      },
      {
        text: '🌀 Theo dấu Cổ Truyền Tống Trận di tản sang 【Khôi Tinh Đảo — Loạn Tinh Hải】',
        effects: [
          { chuyenVung: 'khoi_tinh_dao', tuVi: 520, linhThach: 400, haoCamNpc: { npcId: 'npc_han_lap', delta: 10, lyDo: 'Cùng lưu lạc sang Loạn Tinh Hải tránh họa Ma Đạo.' }, v19GhiNhan: { id: 'nt_ma_dao_xam_luoc', nhan: 'Truyền tống sang Loạn Tinh Hải' }, log: '🌀 Quang mang truyền tống lóe sáng! Bạn thoát khỏi chiến hỏa Việt Quốc, đặt chân tới 【Khôi Tinh Đảo】 tại Loạn Tinh Hải mở ra chương mới!' }
        ]
      },
      {
        text: '⚔️ Hộ vệ Chính Đạo tử chiến Tiên Phong Ma Đạo Lục Tông (+Cống hiến & Chiến lợi phẩm)',
        effects: [
          {
            congHien: 180,
            v19GhiNhan: { id: 'nt_ma_dao_xam_luoc', nhan: 'Tử chiến hộ Việt Quốc' },
            combat: {
              ten: 'Tiên Phong Quỷ Linh Môn (Trúc Cơ Hậu Kỳ)',
              hp: 2450,
              congKich: 540,
              phongThu: 350,
              linhThach: 2200,
              loot: 'dan_giang_tran',
              canhGioiDich: 2,
              tieuCanhDich: 2,
              giuNguyenChiSo: true
            },
            log: '⚔️ Bạn rút pháp bảo nghênh chiến đội tiên phong Quỷ Linh Môn giữa biển lửa Việt Quốc!'
          }
        ]
      }
    ]
  },
  {
    id: 'nt_hu_thien_dien',
    nam: 65,
    tieuDe: 'ĐẠI BIẾN: Hư Thiên Điện Mở Cửa Tại Loạn Tinh Hải!',
    vungId: 'loan_tinh_hai',
    hanLap: {
      canhGioi: 3,
      tieuCanh: 2,
      vungId: 'thien_tinh_thanh',
      danhHieu: 'Đại Tu Sĩ Kết Đan Hậu Kỳ — Khách Khanh Thiên Tinh Thành',
      linhThach: 38000,
      tuiDo: ['bao_thanh_truc_phong_van_kiem', 'bao_hu_thien_dinh', 'bao_hoa_lan_thuan'],
      kyUc: 'Xâm nhập Hư Thiên Điện ba trăm năm mở một lần, vượt qua Cực Âm Tổ Sư & Tinh Cung đoạt được đệ nhất bí bảo Nhân Giới 【Hư Thiên Đỉnh】!'
    },
    moTa: 'Hư Thiên Điện ba trăm năm xuất thế một lần đã mở ra tại Loạn Tinh Hải! Hàng trăm tu sĩ Kết Đan và Nguyên Anh Lão Quái (Tinh Cung, Nghịch Tinh Minh, Cực Âm Tổ Sư) đổ xô vào tranh bảo. Giữa muôn trùng tính kế, Hàn Lập dựa vào Phệ Kim Trùng và mưu trí đã đoạt đi đệ nhất bí bảo Nhân Giới — Hư Thiên Đỉnh!',
    choices: () => [
      {
        text: '👁️ Đứng ngoài Hải Vực nghe tin đồn Hư Thiên Điện (Làm khán giả · +Tu vi)',
        effects: [
          { tuVi: 950, v19GhiNhan: { id: 'nt_hu_thien_dien', nhan: 'Khán giả Loạn Tinh Hải' }, log: '📜 Tin tức Hư Thiên Đỉnh biến mất làm chấn động toàn bộ Loạn Tinh Hải; bạn lặng lẽ nghe phong thanh và củng cố đạo tâm.' }
        ]
      },
      {
        text: '🗺️ Tiến vào Ngoại Điện Hư Thiên tìm cổ dược & pháp bảo thất lạc',
        check: { chiSo: 'ngoTinh', doKho: 24 },
        success: [
          { tuVi: 1400, linhThach: 3500, addItem: 'bao_hoa_lan_thuan', v19GhiNhan: { id: 'nt_hu_thien_dien', nhan: 'Thám hiểm Ngoại Điện Hư Thiên' }, log: '🌟 Bạn phá giải cấm chế cổ ở Ngoại Điện Hư Thiên, thu hoạch 3,500 Linh thạch và cổ bảo 【Hoa Lân Thuẫn】!' }
        ],
        failure: [
          { hp: -180, tuVi: 800, v19GhiNhan: { id: 'nt_hu_thien_dien', nhan: 'Trúng cấm chế Hư Thiên Điện' }, log: '💥 Cấm chế cổ trận tại Hư Thiên Điện quá hung hiểm, bạn bị thương nhẹ phải truyền tống ra ngoài.' }
        ]
      },
      {
        text: '⚔️ Can thiệp tranh bảo tại Nội Điện đối đầu Khôi Lỗi Thủ Vệ Hư Thiên',
        effects: [
          {
            v19GhiNhan: { id: 'nt_hu_thien_dien', nhan: 'Quyết chiến Nội Điện Hư Thiên' },
            combat: {
              ten: 'Cổ Khôi Lỗi Thủ Vệ Hư Thiên (Kết Đan Trung Kỳ)',
              hp: 7600,
              congKich: 1850,
              phongThu: 1280,
              linhThach: 7500,
              loot: 'dan_ket_anh',
              canhGioiDich: 3,
              tieuCanhDich: 1,
              giuNguyenChiSo: true
            },
            log: '⚔️ Bạn bước vào Nội Điện Hư Thiên, kích hoạt Cổ Khôi Lỗi Thủ Vệ trấn giữ bảo khố!'
          }
        ]
      }
    ]
  },
  {
    id: 'nt_mo_lan_xam_lang',
    nam: 95,
    tieuDe: 'ĐẠI BIẾN: Đại Chiến Mộ Lan Pháp Sĩ Xâm Lăng Thiên Nam!',
    vungId: 'thien_nam_minh_ngoai',
    hanLap: {
      canhGioi: 4,
      tieuCanh: 1,
      vungId: 'van_mong_son',
      danhHieu: 'Thái Thượng Trưởng Lão Nguyên Anh — Lạc Vân Tông (Khê Quốc)',
      linhThach: 120000,
      tuiDo: ['bao_thanh_truc_phong_van_kiem', 'bao_hu_thien_dinh', 'bao_phong_loi_duc'],
      kyUc: 'Kết thành Nguyên Anh trở về Thiên Nam gia nhập Lạc Vân Tông, hiển lộ thần uy trong Đại chiến Mộ Lan chấn động Cửu Quốc Minh và Chính Ma lưỡng đạo.'
    },
    moTa: 'Thảo nguyên Mộ Lan linh khí cạn kiệt, hàng vạn Pháp Sĩ Mộ Lan cùng Thánh Thú dẫn quân tràn sang biên giới Thiên Nam! Cửu Quốc Minh, Chính Đạo Minh và Ma Đạo Lục Tông buộc phải đình chiến liên thủ. Hàn Lập lúc này đã ngưng kết Nguyên Anh, trở thành Thái Thượng Trưởng Lão Lạc Vân Tông, danh chấn Thiên Nam!',
    choices: () => [
      {
        text: '👁️ Đứng ngoài chiến tuyến quan sát đại chiến Thiên Nam (Làm khán giả · +Tu vi)',
        effects: [
          { tuVi: 1800, v19GhiNhan: { id: 'nt_mo_lan_xam_lang', nhan: 'Khán giả đại chiến Thiên Nam' }, log: '📜 Bạn đứng ngoài chiến hỏa chứng kiến liên minh Thiên Nam đẩy lùi Mộ Lan Pháp Sĩ và nghe danh "Hàn Lão Ma" vang dội khắp chín nước.' }
        ]
      },
      {
        text: '⚔️ Xuất chiến tiền tuyến Ngu Chinh Quốc nghênh chiến Mộ Lan Đại Pháp Sĩ',
        effects: [
          {
            congHien: 320,
            haoCamNpc: { npcId: 'npc_han_lap', delta: 15, lyDo: 'Cùng kề vai kháng địch Mộ Lan tại biên giới Thiên Nam.' },
            v19GhiNhan: { id: 'nt_mo_lan_xam_lang', nhan: 'Tham chiến đẩy lui Mộ Lan' },
            combat: {
              ten: 'Mộ Lan Thần Sư Tiền Phong (Kết Đan Hậu Kỳ)',
              hp: 9400,
              congKich: 2350,
              phongThu: 1620,
              linhThach: 12000,
              loot: 'dan_hoa_anh',
              canhGioiDich: 3,
              tieuCanhDich: 2,
              giuNguyenChiSo: true
            },
            log: '⚔️ Tiếng tù và vang rền biên ải! Bạn lao thẳng vào đội hình Mộ Lan Thần Sư lập đại công!'
          }
        ]
      },
      {
        text: '🕵️ Tập kích tuyến tiếp tế hậu phương Mộ Lan đoạt Linh thạch & Yêu đan',
        check: { chiSo: 'thanThuc', doKho: 28 },
        success: [
          { linhThach: 8500, tuVi: 2200, v19GhiNhan: { id: 'nt_mo_lan_xam_lang', nhan: 'Đánh úp hậu cần Mộ Lan' }, log: '💎 Bạn cắt đứt thành công đoàn vận lương của Mộ Lan Pháp Sĩ, thu về 8,500 Linh thạch cùng lượng lớn tài nguyên!' }
        ],
        failure: [
          { hp: -320, tuVi: 1200, v19GhiNhan: { id: 'nt_mo_lan_xam_lang', nhan: 'Bị pháp sư Mộ Lan phát giác' }, log: '💥 Bị pháp trận cảnh giới phát hiện, bạn kịp thời rút lui nhưng tiêu hao không ít khí huyết.' }
        ]
      }
    ]
  },
  {
    id: 'nt_con_ngo_son',
    nam: 135,
    tieuDe: 'ĐẠI BIẾN: Côn Ngô Sơn Khai Phong Tại Đại Tấn — Cổ Ma Xuất Thế!',
    vungId: 'dai_tan',
    hanLap: {
      canhGioi: 5,
      tieuCanh: 0,
      vungId: 'dai_tan',
      danhHieu: 'Đại Tu Sĩ Hóa Thần Sơ Kỳ — Đệ Nhất Nhân Giới',
      linhThach: 450000,
      tuiDo: ['bao_thanh_truc_phong_van_kiem', 'bao_hu_thien_dinh', 'bao_phong_loi_duc', 'bao_tam_diem_phien'],
      kyUc: 'Tiến vào Trấn Ma Tháp Côn Ngô Sơn, chém phân thân Cổ Ma Nguyên Sát, đoạt Thông Thiên Linh Bảo và đột phá Hóa Thần Kỳ tại Đại Tấn.'
    },
    moTa: 'Côn Ngô Sơn phong ấn hàng vạn năm tại Liêu Châu — Đại Tấn bất ngờ khai mở! Thập Đại Chính Ma Đại Tấn cùng Nguyên Anh hậu kỳ đại tu sĩ kéo tới tranh đoạt Thông Thiên Linh Bảo, vô tình làm lung lay Trấn Ma Tháp khiến Cổ Ma Nguyên Sát xuất thế. Hàn Lập đại triển thần uy trấn áp ma đầu và bước vào Hóa Thần Kỳ!',
    choices: () => [
      {
        text: '👁️ Đứng từ xa chiêm ngưỡng dị tượng Côn Ngô Sơn (Làm khán giả · +Tu vi & Ngộ tính)',
        effects: [
          { tuVi: 3600, chiSo: { ngoTinh: 2 }, v19GhiNhan: { id: 'nt_con_ngo_son', nhan: 'Khán giả Côn Ngô Sơn' }, log: '📜 Từ ngoài ngàn dặm cảm nhận khí tức Hóa Thần và Thông Thiên Linh Bảo, bạn ngộ ra huyền cơ pháp tắc (+2 Ngộ tính, +Tu vi).' }
        ]
      },
      {
        text: '🏔️ Tìm kiếm cổ dược và tàn bảo ở vòng ngoài Côn Ngô Sơn',
        check: { chiSo: 'khiVan', doKho: 32 },
        success: [
          { tuVi: 4800, linhThach: 25000, chiSo: { thanThuc: 4 }, v19GhiNhan: { id: 'nt_con_ngo_son', nhan: 'Thu hoạch ngoại vi Côn Ngô Sơn' }, log: '🌟 Bạn nhặt được di bảo thượng cổ sót lại bên ngoài Trấn Ma Tháp (+25,000 LT, +4 Thần thức)!' }
        ],
        failure: [
          { hp: -600, tuVi: 2400, v19GhiNhan: { id: 'nt_con_ngo_son', nhan: 'Tránh dư ba Cổ Ma' }, log: '💥 Dư ba ma khí của Nguyên Sát quét qua làm bạn chấn động khí huyết, may kịp lùi xa.' }
        ]
      },
      {
        text: '⚔️ Trợ chiến đại tu sĩ Đại Tấn chém Ma Tướng Trấn Ma Tháp (Cực kỳ hung hiểm)',
        effects: [
          {
            haoCamNpc: { npcId: 'npc_han_lap', delta: 20, lyDo: 'Cùng đại tu sĩ Nhân Giới trấn áp Cổ Ma tại Côn Ngô Sơn.' },
            v19GhiNhan: { id: 'nt_con_ngo_son', nhan: 'Trấn ma Côn Ngô Sơn' },
            combat: {
              ten: 'Huyết Ma Tướng Côn Ngô (Nguyên Anh Sơ Kỳ)',
              hp: 24500,
              congKich: 5900,
              phongThu: 4000,
              linhThach: 35000,
              canhGioiDich: 4,
              tieuCanhDich: 0,
              giuNguyenChiSo: true
            },
            log: '⚔️ Bạn xông vào Côn Ngô Sơn quyết chiến với Ma Tướng thoát ra từ Trấn Ma Tháp!'
          }
        ]
      }
    ]
  },
  {
    id: 'nt_phi_thang_linh_gioi',
    nam: 180,
    tieuDe: 'KỲ TÍCH NHÂN GIỚI: Hàn Lập Vượt Không Gian Tiết Điểm Phi Thăng Linh Giới!',
    vungId: 'bang_dao',
    hanLap: {
      canhGioi: 6,
      tieuCanh: 0,
      vungId: 'thien_uyen_thanh',
      danhHieu: 'Tu sĩ Phi Thăng — Luyện Hư Kỳ Thiên Uyên Thành (Linh Giới)',
      linhThach: 1200000,
      tuiDo: ['bao_thanh_truc_phong_van_kiem', 'bao_hu_thien_dinh', 'bao_phong_loi_duc'],
      kyUc: 'Từ Băng Đảo Cực Bắc vượt qua Không Gian Tiết Điểm tiến vào Linh Giới, bước tiếp con đường Đại Thừa & Chân Tiên.'
    },
    moTa: 'Bầu trời Băng Đảo Cực Bắc xé rách một vết nứt không gian vạn trượng! Đệ nhất cường giả Nhân Giới — Hàn Lập — sau hơn hai trăm năm khổ tu đã mang theo Hư Thiên Đỉnh và bầy Phệ Kim Trùng xuyên qua Không Gian Tiết Điểm, chính thức phi thăng lên Linh Giới, để lại truyền thuyết bất hủ khắp Thiên Nam và Đại Tấn!',
    choices: () => [
      {
        text: '👁️ Quan sát quang mang phi thăng, lĩnh ngộ Không Gian Pháp Tắc (Làm khán giả · +Ngộ tính & Thần thức)',
        effects: [
          { tuVi: 6500, chiSo: { ngoTinh: 4, thanThuc: 6 }, v19GhiNhan: { id: 'nt_phi_thang_linh_gioi', nhan: 'Chứng kiến Hàn Lập phi thăng' }, log: '🌌 Chứng kiến vết nứt không gian phi thăng của Hàn Lập, đạo tâm bạn bừng sáng (+4 Ngộ tính, +6 Thần thức, +Tu vi)!' }
        ]
      },
      {
        text: '✨ Gom nhặt tinh hoa linh khí & mảnh vỡ không gian sót lại tại Băng Đảo',
        check: { chiSo: 'khiVan', doKho: 30 },
        success: [
          { tuVi: 9000, linhThach: 40000, thoNguyen: 30, v19GhiNhan: { id: 'nt_phi_thang_linh_gioi', nhan: 'Thu hoạch tinh hoa tiết điểm' }, log: '🌟 Bạn thu thập được tinh hoa không gian hiếm có tại Băng Đảo (+40,000 LT, +30 năm Thọ nguyên, +Tu vi)!' }
        ],
        failure: [
          { tuVi: 4500, linhThach: 10000, v19GhiNhan: { id: 'nt_phi_thang_linh_gioi', nhan: 'Chứng kiến từ xa' }, log: '💨 Phong bạo không gian quá mạnh, bạn kịp thu một ít linh thạch rồi rút an toàn.' }
        ]
      }
    ]
  }
];

function v19DamBaoBienNien() {
  if (!state) return null;
  if (!state.bienNienNguyenTac || typeof state.bienNienNguyenTac !== 'object') {
    state.bienNienNguyenTac = { daXayRa: {}, luaChon: {}, hanLapMoc: 0 };
  }
  if (!state.bienNienNguyenTac.daXayRa) state.bienNienNguyenTac.daXayRa = {};
  if (!state.bienNienNguyenTac.luaChon) state.bienNienNguyenTac.luaChon = {};
  return state.bienNienNguyenTac;
}

function v19DongBoHanLap(mocEv) {
  if (!state || !state.npcs || !mocEv || !mocEv.hanLap) return;
  const hl = state.npcs.npc_han_lap;
  if (!hl || !hl.conSong) return;
  const h = mocEv.hanLap;
  if (h.canhGioi > (hl.canhGioi || 0) || (h.canhGioi === hl.canhGioi && (h.tieuCanh || 0) > (hl.tieuCanh || 0))) {
    hl.canhGioi = h.canhGioi;
    hl.tieuCanh = h.tieuCanh || 0;
    const tcHl = typeof layTuChatNpc === 'function' ? layTuChatNpc(hl.tuChat || 'yeu_nghiet') : { heSoChienDau: 1.25 };
    const cs = typeof tinhChiSoDichChuan === 'function'
      ? tinhChiSoDichChuan(hl.canhGioi, hl.tieuCanh, tcHl.heSoChienDau, tcHl.heSoChienDau, tcHl.heSoChienDau)
      : { hp: 300, congKich: 60, phongThu: 35 };
    hl.hp = cs.hp;
    hl.congKich = cs.congKich;
    hl.phongThu = cs.phongThu;
    const defCg = typeof layCanhGioiDef === 'function' ? layCanhGioiDef(hl.canhGioi) : { thoNguyen: 200 };
    hl.thoNguyen = Math.max(hl.thoNguyen || 120, (defCg.thoNguyen || 200) + 80);
  }
  if (h.vungId) hl.vungId = h.vungId;
  if (h.danhHieu) hl.danhHieu = h.danhHieu;
  if (h.linhThach) hl.linhThach = Math.max(hl.linhThach || 0, h.linhThach);
  if (Array.isArray(h.tuiDo)) hl.tuiDo = [...h.tuiDo];
  if (h.kyUc && typeof ghiKyUcNpc === 'function') ghiKyUcNpc(hl, h.kyUc);
}

function v19KiemTraDaiBienTheGioi() {
  if (!state || state.ketThuc || state.tranHienTai || state.hauChienNpc || state.suKienHienTai || state.biCanhHienTai) {
    return false;
  }
  const bn = v19DamBaoBienNien();
  for (let i = 0; i < V19_BIEN_NIEN_NGUYEN_TAC.length; i++) {
    const ev = V19_BIEN_NIEN_NGUYEN_TAC[i];
    if (bn.daXayRa[ev.id]) continue;
    if ((state.nam || 1) < ev.nam) break;

    bn.daXayRa[ev.id] = state.nam;
    bn.hanLapMoc = Math.max(bn.hanLapMoc || 0, i + 1);
    v19DongBoHanLap(ev);

    ghiNhatKy(`🌍 [BIÊN NIÊN NGUYÊN TÁC — Năm ${state.nam}] ${ev.tieuDe}! (Bạn có thể chọn đứng ngoài làm khán giả hoặc trực tiếp tham gia).`, 'dai_cat');
    state.suKienHienTai = {
      id: ev.id,
      ten: `📜 NGUYÊN TÁC: ${ev.tieuDe}`,
      canhGioi: [Math.max(0, state.canhGioi), Math.max(0, state.canhGioi)],
      text: `${ev.moTa}\n\n[Thiên đạo diễn tiến theo nguyên tác Phàm Nhân Tu Tiên — bạn có thể chọn đứng ngoài làm khán giả an toàn hoặc trực tiếp nhập cuộc!]`,
      choices: ev.choices()
    };
    return true;
  }
  return false;
}

function v19RenderGhiChuHanLap(npc) {
  if (!npc || npc.id !== 'npc_han_lap') return '';
  const bn = v19DamBaoBienNien();
  const mocIdx = Math.max(0, (bn?.hanLapMoc || 0) - 1);
  const nextEv = V19_BIEN_NIEN_NGUYEN_TAC[bn?.hanLapMoc || 0];
  return `<div class="hint-line" style="margin:6px 0">
    <b>🌟 Nhân Vật Nguyên Tác (Phàm Nhân Tu Tiên):</b> Hành trình của Hàn Lập tự động diễn tiến theo dòng thời gian Biên Niên Sử (ẩn giấu bí mật <i>Chưởng Thiên Bình</i>).
    ${nextEv ? `<br>⏳ Đại sự tiếp theo dự kiến: <b>Năm ${nextEv.nam}</b> — <i>${escapeHtml(nextEv.tieuDe)}</i>.` : '<br>🌌 Hàn Lập đã hoàn tất hành trình Nhân Giới và phi thăng Linh Giới!'}
  </div>`;
}

function v19RenderBienNienNguyenTac() {
  if (!state) return '';
  const bn = v19DamBaoBienNien();
  const hl = state.npcs?.npc_han_lap;
  const hlInfo = hl
    ? hl.conSong
      ? `<b>${escapeHtml(hl.ten)}</b> · <span class="hl-realm">${tenCanhGioiDayDu(hl.canhGioi, hl.tieuCanh || 0)}</span> · Đang ở: <b>${escapeHtml(layVungDef(hl.vungId).ten)}</b>`
      : '<b>Hàn Lập</b> · <span class="hl-danger">Đã vẫn lạc (lệch nguyên tác)</span>'
    : 'Chưa ghi nhận';

  return `
    <div class="sub-section">
      <div class="sub-title">📜 Biên Niên Nguyên Tác & Tung Tích Hàn Lập</div>
      <div class="stat-row"><span>Tung tích Hàn Lập:</span> <span>${hlInfo}</span></div>
      <div class="muted" style="margin:4px 0 8px">Thế giới vận hành song song theo tiểu thuyết <i>Phàm Nhân Tu Tiên</i>. Khi tới mốc năm, bạn có thể chọn làm <b>khán giả đứng ngoài</b> hoặc <b>trực tiếp nhập cuộc</b>!</div>
      ${V19_BIEN_NIEN_NGUYEN_TAC.map(ev => {
        const da = !!bn.daXayRa[ev.id];
        const ch = bn.luaChon[ev.id];
        return `<div class="card-row">
          <div>
            <b>Năm ${ev.nam} · ${escapeHtml(ev.tieuDe)}</b>
            ${da ? `<span class="badge hl-green">Đã xảy ra${ch ? ` (${escapeHtml(ch)})` : ''}</span>` : `<span class="badge">Còn ${Math.max(1, ev.nam - (state.nam || 1))} năm</span>`}
            <div class="muted">Địa điểm trọng tâm: ${escapeHtml(layVungDef(ev.vungId).ten)}</div>
          </div>
          ${hl && hl.conSong ? `<button class="btn btn-sm" onclick="nhayToiNpc('npc_han_lap')">Xem Hàn Lập</button>` : ''}
        </div>`;
      }).join('')}
    </div>`;
}

// ==========================================
// 3. ĐẠI HỘI THÍ LUYỆN HUYẾT SẮC CẤM ĐỊA LIÊN TÔNG
// ==========================================

function v19RenderDaiHoiHuyetSac() {
  if (!state) return '';
  const vungHop = ['viet_quoc', 'thai_nhac_son_mach', 'kinh_chau', 'nguyen_vo_quoc'].includes(state.vungHienTai);
  if (!vungHop || state.canhGioi !== 1) return '';
  const namCon = Math.max(0, 5 - ((state.nam || 1) - (state.namHuyetSacCuoi || -10)));
  const sanSang = namCon <= 0;
  return `
    <div class="sub-section" style="border:1px solid var(--accent);border-radius:6px;padding:10px;background:var(--bg-card);margin-bottom:12px">
      <div class="sub-title" style="margin-bottom:4px">🩸 Đại Hội Thí Luyện Huyết Sắc Cấm Địa (Thất Đại Phái Việt Quốc)</div>
      <div class="muted" style="margin-bottom:8px">5 năm mở một lần dành riêng cho tu sĩ <b>Luyện Khí kỳ</b>! Vào Cấm Địa thu hái linh thảo cổ đổi <b>Trúc Cơ Đan</b>, tích điểm bảng xếp hạng Thất Phái và có cơ duyên chạm mặt Hàn Lập, Nam Cung Uyển hay Phong Nhạc.</div>
      <div class="row-actions">
        <button class="btn btn-sm ${sanSang ? 'btn-primary' : ''}" onclick="v19ThamGiaHuyetSacLienTong()" ${sanSang ? '' : 'disabled'}>
          ${sanSang ? '🩸 Báo Danh Dự Huyết Sắc Thí Luyện (6 tháng · Phí 30 LT)' : `⏳ Cấm Địa đang đóng (Mở lại sau ${namCon} năm)`}
        </button>
      </div>
    </div>`;
}

function v19ThamGiaHuyetSacLienTong() {
  if (!state || state.ketThuc || state.tranHienTai || state.suKienHienTai || state.biCanhHienTai) return;
  if (state.canhGioi !== 1) {
    ghiNhatKy('⚠️ Huyết Sắc Cấm Địa chỉ cho phép tu sĩ Luyện Khí kỳ tiến vào!', 'canh_bao');
    veGiaoDien();
    return;
  }
  const namCon = Math.max(0, 5 - ((state.nam || 1) - (state.namHuyetSacCuoi || -10)));
  if (namCon > 0) {
    ghiNhatKy(`⏳ Huyết Sắc Cấm Địa chưa tới kỳ mở cửa (còn ${namCon} năm).`, 'canh_bao');
    veGiaoDien();
    return;
  }
  if (state.linhThach < 30) {
    ghiNhatKy('⚠️ Cần 30 Linh thạch lệ phí vào trận Huyết Sắc Thí Luyện!', 'canh_bao');
    veGiaoDien();
    return;
  }

  state.linhThach -= 30;
  state.namHuyetSacCuoi = state.nam;
  tienThoiGian(6);
  if (state.ketThuc) { luuGame(); veGiaoDien(); return; }

  const tmTen = state.tongMon ? layTongMonDef(state.tongMon.id).ten : 'Tán Tu Liên Minh';
  state.suKienHienTai = {
    id: `huyet_sac_lien_tong_${state.nam}`,
    ten: `🩸 HUYẾT SẮC THÍ LUYỆN LIÊN TÔNG (Đại diện: ${tmTen})`,
    canhGioi: [1, 1],
    text: `Cổng ánh sáng Huyết Sắc Cấm Địa mở ra! Đệ tử tinh anh của Thất Đại Phái Việt Quốc (Hoàng Phong Cốc, Yểm Nguyệt Tông, Linh Thú Sơn, Thiên Khuyết Bảo, Hóa Đao Ổ, Cự Kiếm Môn, Thanh Hư Môn) đồng loạt lao vào bên trong. Phía xa thoáng thấy bóng dáng một thiếu niên mặc áo xanh Hoàng Phong Cốc (Hàn Lập) lặng lẽ lẩn vào rừng rậm. Bạn chọn chiến lược nào?`,
    choices: [
      {
        text: '🌿 Đi vòng ngoại vi lặng lẽ hái linh thảo cổ & tránh giao tranh (Tỷ lệ an toàn cao · Cơ hội nhận Trúc Cơ Đan)',
        check: { chiSo: 'khiVan', doKho: 15 },
        success: [
          { tuVi: 220, congHien: 75, addItem: 'dan_truc_co', haoCamNpc: { npcId: 'npc_han_lap', delta: 8, lyDo: 'Chạm mặt gật đầu chào nhau trong Huyết Sắc Cấm Địa mà không động thủ.' }, log: '🌟 Bạn thu hoạch đầy linh dược 300 năm, tình cờ chạm mặt Hàn Lập rồi hai bên ăn ý rút lui. Ra khỏi Cấm Địa, trưởng lão đổi thưởng cho bạn 1 viên 【Trúc Cơ Đan】 & +75 Cống hiến!' }
        ],
        failure: [
          { tuVi: 150, linhThach: 160, congHien: 35, log: '🌿 Linh thảo quý đã bị đệ tử Yểm Nguyệt Tông hái trước, bạn chỉ gom được ít dược phụ và +35 Cống hiến.' }
        ]
      },
      {
        text: '⚔️ Xông thẳng vào Điện Trung Tâm tranh đoạt đại dược (Chạm trán Phong Nhạc — Thắng thưởng Trúc Cơ Đan +150 CH!)',
        effects: [
          {
            congHien: 150,
            combat: {
              ten: 'Phong Nhạc · Cuồng Đồ Thiên Khuyết Bảo (Luyện Khí Tầng 13)',
              hp: 820,
              congKich: 215,
              phongThu: 120,
              linhThach: 900,
              loot: 'dan_truc_co',
              npcId: 'npc_phong_nhac',
              canhGioiDich: 1,
              tieuCanhDich: 12,
              giuNguyenChiSo: true
            },
            log: '⚔️ Bạn xông vào Điện Trung Tâm Huyết Sắc Cấm Địa, đụng độ ngay sát tinh Phong Nhạc của Thiên Khuyết Bảo!'
          }
        ]
      },
      {
        text: '🤝 Liên kết đồng môn Thất Phái yểm trợ bảo vệ nhau (+90 Cống hiến · +Linh thạch · An toàn)',
        effects: [
          { tuVi: 180, linhThach: 240, congHien: 90, log: '🤝 Bạn cùng các sư huynh đệ lập trận bảo vệ nhau suốt 5 ngày thí luyện, giúp tông môn đứng đầu bảng xếp hạng (+90 Cống hiến, +240 LT)!' }
        ]
      }
    ]
  };
  luuGame();
  veGiaoDien();
}

// ==========================================
// 4. HỆ THỐNG LINH THÚ ĐỒNG HÀNH (KHÔNG CÓ CHƯỞNG THIÊN BÌNH)
// ==========================================

const V19_LINH_THU_POOL = [
  {
    id: 'lt_phe_kim_trung',
    ten: 'Phệ Kim Trùng (Ấu Trùng)',
    icon: '🪲',
    vaiTro: 'Công kích & Phá Giáp',
    giaBase: 220,
    passive: { atkPct: 0.04, defPct: 0.01, hpPct: 0 },
    effectKey: 'pha_giap',
    kyNangTen: 'Phệ Kim Phá Giáp',
    moTa: 'Kỳ trùng thượng cổ chuyên cắn nuốt linh khí và pháp bảo, trong trận gặm phá phòng ngự địch gây [Phá giáp].'
  },
  {
    id: 'lt_luc_duc_suong_ngo',
    ten: 'Lục Dực Sương Ngô',
    icon: '❄️',
    vaiTro: 'Khống chế & Hàn Khí',
    giaBase: 260,
    passive: { atkPct: 0.03, defPct: 0.02, hpPct: 0.01 },
    effectKey: 'han_khi',
    kyNangTen: 'Sương Hàn Đống Kết',
    moTa: 'Kỳ trùng băng hệ có sáu cánh trong suốt, phun hàn vụ làm giảm công kích đối thủ ([Hàn khí]).'
  },
  {
    id: 'lt_hoa_giao',
    ten: 'Xích Hỏa Giao (Ấu Thú)',
    icon: '🐉',
    vaiTro: 'Thiêu Đốt & Bộc Phá',
    giaBase: 300,
    passive: { atkPct: 0.05, defPct: 0, hpPct: 0.02 },
    effectKey: 'thieu_dot',
    kyNangTen: 'Giao Diễm Phần Thiên',
    moTa: 'Ấu thú mang huyết mạch chân long hỏa hệ, phun giao diễm gây sát thương thiêu đốt liên tục.'
  },
  {
    id: 'lt_loi_bang',
    ten: 'Lôi Bằng Ấu Điểu',
    icon: '🦅',
    vaiTro: 'Tốc Công & Xuyên Giáp',
    giaBase: 280,
    passive: { atkPct: 0.045, defPct: 0.01, hpPct: 0.01 },
    effectKey: 'loi_kich',
    kyNangTen: 'Lôi Đình Phá Không',
    moTa: 'Linh cầm phong lôi tốc độ cực nhanh, phóng tia lôi điện xuyên 45% phòng ngự kẻ địch.'
  },
  {
    id: 'lt_huyen_quy',
    ten: 'Huyền Vũ Linh Quy',
    icon: '🐢',
    vaiTro: 'Hộ Chủ & Phòng Ngự',
    giaBase: 240,
    passive: { atkPct: 0, defPct: 0.05, hpPct: 0.04 },
    effectKey: 'ho_thuan',
    kyNangTen: 'Huyền Thủy Hộ Chủ',
    moTa: 'Linh thú thủy thổ phòng ngự kiên cố, tạo màn thủy thuẫn giảm 20% sát thương nhận và hồi nhẹ khí huyết chủ nhân.'
  },
  {
    id: 'lt_linh_hau',
    ten: 'Thiết Giáp Linh Hầu',
    icon: '🐒',
    vaiTro: 'Cân Bằng & Tầm Bảo',
    giaBase: 210,
    passive: { atkPct: 0.025, defPct: 0.025, hpPct: 0.02 },
    effectKey: 'xuat_huyet',
    kyNangTen: 'Thiết Trảo Tầm Bảo',
    moTa: 'Linh hầu linh mẫn am hiểu tìm bảo, tấn công gây [Xuất huyết] và hay nhặt thêm linh thạch trên chiến trường.'
  }
];

function v19LayLinhThuDef(id) {
  return V19_LINH_THU_POOL.find(x => x.id === id) || V19_LINH_THU_POOL[0];
}

function v19ExpCanLinhThu(cap) {
  return Math.round(100 * Math.pow(2.1, Math.max(0, (cap || 1) - 1)));
}

function v19GiaThuPhucLinhThu(def) {
  const cg = state?.canhGioi || 0;
  return Math.round((def.giaBase || 220) * Math.max(1, Math.pow(1.75, Math.min(4, cg))));
}

function v19BonusLinhThu(loai) {
  if (!state || !state.linhThu) return 0;
  const def = v19LayLinhThuDef(state.linhThu.id);
  const base = Number(def.passive?.[loai]) || 0;
  if (base <= 0) return 0;
  const hsCap = 1 + Math.max(0, (state.linhThu.cap || 1) - 1) * 0.35;
  const hsThanMat = 1 + Math.min(100, state.linhThu.doThanMat || 0) * 0.004;
  return Math.min(0.25, base * hsCap * hsThanMat);
}

function v19ThuPhucLinhThu(ltId) {
  if (!state || !kiemTraTaiDongPhu('thu phục & ấp trứng Linh Thú')) return;
  const def = v19LayLinhThuDef(ltId);
  const gia = v19GiaThuPhucLinhThu(def);
  if (state.linhThu && state.linhThu.id === ltId) {
    ghiNhatKy(`🐾 Bạn đã có 【${def.ten}】 đồng hành rồi!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  if (state.linhThach < gia) {
    ghiNhatKy(`⚠️ Cần ${gia.toLocaleString()} Linh thạch để mua linh noãn & khế ước 【${def.ten}】!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  state.linhThach -= gia;
  const capBd = Math.max(1, Math.min(state.canhGioi || 1, 3));
  state.linhThu = {
    id: def.id,
    ten: def.ten,
    cap: capBd,
    exp: 0,
    doThanMat: 25
  };
  ghiNhatKy(`🐾 Ký kết huyết khế thành công! ${def.icon} 【${def.ten}】 (Cấp ${capBd}) chính thức đồng hành cùng bạn!`, 'dai_cat');
  luuGame();
  veGiaoDien();
}

function v19ChoAnLinhThu(kieu) {
  if (!state || !state.linhThu) return;
  if (!kiemTraTaiDongPhu('chăm sóc Linh Thú')) return;
  const lt = state.linhThu;
  const def = v19LayLinhThuDef(lt.id);
  let expThem = 0;
  let tmThem = 0;
  let nguonTxt = '';

  if (kieu === 'yeu_dan') {
    const ydEntry = Object.entries(state.tuiDo || {})
      .filter(([, sl]) => sl > 0)
      .map(([key]) => ({ key, vp: layVatPhamDef(key) }))
      .filter(x => x.vp && x.vp.loai === 'yeu_dan')
      .sort((a, b) => (a.vp.canhGioi ?? 0) - (b.vp.canhGioi ?? 0))[0];
    if (!ydEntry) {
      ghiNhatKy('⚠️ Trong túi trữ vật không có Yêu Đan để cho Linh Thú ăn!', 'canh_bao');
      veGiaoDien();
      return;
    }
    themVat(ydEntry.key, -1);
    const cgYd = Number(ydEntry.vp.canhGioi ?? 1);
    expThem = Math.round(75 * Math.pow(1.9, Math.max(0, cgYd)));
    tmThem = 8;
    nguonTxt = `1 viên [${ydEntry.vp.ten}]`;
  } else {
    const giaLt = Math.max(40, Math.round(55 * Math.pow(1.85, Math.max(0, (lt.cap || 1) - 1))));
    if (state.linhThach < giaLt) {
      ghiNhatKy(`⚠️ Cần ${giaLt.toLocaleString()} Linh thạch để luyện linh thực cho 【${lt.ten}】!`, 'canh_bao');
      veGiaoDien();
      return;
    }
    state.linhThach -= giaLt;
    expThem = Math.round(45 * Math.pow(1.75, Math.max(0, (lt.cap || 1) - 1)));
    tmThem = 5;
    nguonTxt = `${giaLt.toLocaleString()} Linh thạch`;
  }

  lt.exp = (lt.exp || 0) + expThem;
  lt.doThanMat = Math.min(100, (lt.doThanMat || 0) + tmThem);
  let thangCapMsg = '';
  const maxCap = Math.min(9, (state.canhGioi || 0) + 1);
  while (lt.cap < maxCap && lt.exp >= v19ExpCanLinhThu(lt.cap)) {
    lt.exp -= v19ExpCanLinhThu(lt.cap);
    lt.cap += 1;
    thangCapMsg = ` 🌟 Tiến giai thành công lên 【Cấp ${lt.cap} (${RANK_BAC_NHAN[lt.cap] || `Giai ${lt.cap}`})】!`;
  }
  ghiNhatKy(`🐾 Cho ${def.icon} 【${lt.ten}】 ăn ${nguonTxt}: +${expThem.toLocaleString()} EXP, Thân mật ${lt.doThanMat}/100.${thangCapMsg}`, thangCapMsg ? 'dai_cat' : 'tot');
  luuGame();
  veGiaoDien();
}

function v19HuanLuyenLinhThu() {
  if (!state || !state.linhThu || state.ketThuc || state.tranHienTai || state.suKienHienTai) return;
  if (!kiemTraTaiDongPhu('huấn luyện Linh Thú')) return;
  tienThoiGian(1);
  if (state.ketThuc) { luuGame(); veGiaoDien(); return; }
  const lt = state.linhThu;
  const def = v19LayLinhThuDef(lt.id);
  const expThem = Math.round(35 * Math.pow(1.7, Math.max(0, (lt.cap || 1) - 1)));
  lt.exp = (lt.exp || 0) + expThem;
  lt.doThanMat = Math.min(100, (lt.doThanMat || 0) + 10);
  const maxCap = Math.min(9, (state.canhGioi || 0) + 1);
  let thangCapMsg = '';
  if (lt.cap < maxCap && lt.exp >= v19ExpCanLinhThu(lt.cap)) {
    lt.exp -= v19ExpCanLinhThu(lt.cap);
    lt.cap += 1;
    thangCapMsg = ` 🌟 Đột phá lên 【Cấp ${lt.cap}】!`;
  }
  ghiNhatKy(`🐾 Tâm linh tương thông huấn luyện ${def.icon} 【${lt.ten}】 (1 tháng): +${expThem.toLocaleString()} EXP, Thân mật ${lt.doThanMat}/100.${thangCapMsg}`, 'tot');
  luuGame();
  veGiaoDien();
}

function v19LinhThuHoTroChienDau(t, atkTa, defDichThuc) {
  if (!state || !state.linhThu || !t || t.hpDich <= 0) return;
  const lt = state.linhThu;
  const def = v19LayLinhThuDef(lt.id);
  // Kích hoạt mỗi 2 hiệp (hoặc 65% mỗi hiệp nếu Thân mật >= 80)
  const kichHoat = t.hiep % 2 === 1 || ((lt.doThanMat || 0) >= 80 && Math.random() < 0.65);
  if (!kichHoat) return;

  const hsCap = 0.2 + Math.min(0.32, (lt.cap || 1) * 0.055) + (lt.doThanMat || 0) * 0.0012;
  const xuyenGiap = def.effectKey === 'loi_kich' ? 0.45 : def.effectKey === 'pha_giap' ? 0.25 : 0.1;
  const kq = tinhSatThuong(Math.round(atkTa * hsCap), defDichThuc, 1.0, 0.12, 0.03, xuyenGiap);
  const dmg = Math.max(3, kq.dmg);

  if (def.effectKey === 'ho_thuan') {
    const hoi = Math.max(5, Math.round(tinhHpMax() * (0.04 + (lt.cap || 1) * 0.01)));
    state.hp = Math.min(tinhHpMax(), state.hp + hoi);
    t.giamSatThuong = Math.max(t.giamSatThuong || 0, 0.2);
    t.hpDich = Math.max(0, t.hpDich - Math.round(dmg * 0.65));
    t.logTran.push(`${def.icon} Linh Thú 【${lt.ten}】 thi triển [${def.kyNangTen}]: Hộ thuẫn -20% ST, hồi +${hoi.toLocaleString()} HP & phản kích ${Math.round(dmg * 0.65).toLocaleString()} ST!`);
    return;
  }

  t.hpDich = Math.max(0, t.hpDich - dmg);
  let efMsg = '';
  if (['pha_giap', 'han_khi', 'thieu_dot', 'xuat_huyet'].includes(def.effectKey) && Math.random() < 0.55) {
    const isDot = def.effectKey === 'thieu_dot' || def.effectKey === 'xuat_huyet';
    ganTrangThaiTran(t.trangThaiDich, def.effectKey, 2, 0.2, isDot ? Math.max(4, Math.round(dmg * 0.35)) : 0);
    efMsg = ` + gây ${(TRANG_THAI_DEF[def.effectKey] || {}).nhan || def.effectKey}`;
  } else if (def.effectKey === 'xuat_huyet' && Math.random() < 0.35) {
    const ltNhat = Math.max(5, Math.round(10 * Math.pow(1.9, state.canhGioi || 0)));
    state.linhThach += ltNhat;
    efMsg = ` (nhặt rơi +${ltNhat} LT)`;
  }
  t.logTran.push(`${def.icon} Linh Thú 【${lt.ten}】 xuất kích [${def.kyNangTen}], gây ${dmg.toLocaleString()} sát thương${efMsg}!`);
}

function v19RenderTrangThaiLinhThu() {
  if (!state || !state.linhThu) return '';
  const lt = state.linhThu;
  const def = v19LayLinhThuDef(lt.id);
  return `<div class="stat-row"><span>Linh thú:</span> <span>${def.icon} <b>${escapeHtml(lt.ten)}</b> <span class="badge">Cấp ${lt.cap}</span> <span class="muted">(Thân mật ${lt.doThanMat}/100)</span></span></div>`;
}

function v19RenderLinhThuDongPhu() {
  if (!state) return '';
  const oNha = dangODongPhu();
  const lt = state.linhThu;
  if (lt) {
    const def = v19LayLinhThuDef(lt.id);
    const expCan = v19ExpCanLinhThu(lt.cap);
    const pct = Math.min(100, Math.round(((lt.exp || 0) / expCan) * 100));
    const maxCap = Math.min(9, (state.canhGioi || 0) + 1);
    const coYeuDan = Object.entries(state.tuiDo || {}).some(([k, sl]) => sl > 0 && layVatPhamDef(k)?.loai === 'yeu_dan');
    const giaLtAn = Math.max(40, Math.round(55 * Math.pow(1.85, Math.max(0, (lt.cap || 1) - 1))));
    return `
      <div class="sub-section">
        <div class="sub-title">🐾 Linh Thú Đường — Đồng Hành Chiến Đấu</div>
        <div class="card-row" style="display:block">
          <div>${def.icon} <b>${escapeHtml(lt.ten)}</b> <span class="badge">Cấp ${lt.cap}/${maxCap} (${RANK_BAC_NHAN[lt.cap] || `Giai ${lt.cap}`})</span> <span class="badge hl-green">${def.vaiTro}</span></div>
          <div class="muted" style="margin:4px 0">${escapeHtml(def.moTa)}</div>
          <div class="stat-row"><span>Kinh nghiệm tiến giai:</span> <b>${(lt.exp || 0).toLocaleString()} / ${expCan.toLocaleString()} (${pct}%)</b></div>
          <div class="stat-row"><span>Độ thân mật:</span> <b class="hl-gold">${lt.doThanMat}/100</b> <span class="muted">(≥80 tăng tần suất trợ chiến!)</span></div>
          <div class="muted">Gia trì chủ nhân: Công +${Math.round(v19BonusLinhThu('atkPct') * 100)}% · Thủ +${Math.round(v19BonusLinhThu('defPct') * 100)}% · HP +${Math.round(v19BonusLinhThu('hpPct') * 100)}% · Chiêu trợ chiến: <b>${def.kyNangTen}</b></div>
          <div class="row-actions" style="margin-top:8px">
            <button class="btn btn-sm btn-primary" onclick="v19ChoAnLinhThu('yeu_dan')" ${oNha && coYeuDan ? '' : 'disabled title="Cần ở Động Phủ và có Yêu Đan trong túi"'}>🔮 Cho ăn Yêu Đan (+EXP lớn)</button>
            <button class="btn btn-sm" onclick="v19ChoAnLinhThu('linh_thach')" ${oNha ? '' : 'disabled'}>💎 Cho ăn Linh Thạch (${giaLtAn.toLocaleString()} LT)</button>
            <button class="btn btn-sm" onclick="v19HuanLuyenLinhThu()" ${oNha ? '' : 'disabled'}>🧘 Huấn luyện (1 tháng · +10 TM)</button>
          </div>
        </div>
      </div>`;
  }

  return `
    <div class="sub-section">
      <div class="sub-title">🐾 Linh Thú Đường (Chưa thu phục Linh Thú)</div>
      <p class="muted" style="margin-top:0">Thu phục một loài kỳ trùng hoặc ấu thú làm bạn đồng hành! Linh Thú gia trì chỉ số vĩnh viễn và tự động trợ chiến mỗi 2 hiệp trong đấu pháp.</p>
      ${V19_LINH_THU_POOL.map(def => {
        const gia = v19GiaThuPhucLinhThu(def);
        return `<div class="card-row">
          <div>
            <b>${def.icon} ${escapeHtml(def.ten)}</b> <span class="badge">${def.vaiTro}</span> <span class="hl-gold">(${gia.toLocaleString()} LT)</span>
            <div class="muted">${escapeHtml(def.moTa)}</div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="v19ThuPhucLinhThu('${def.id}')" ${oNha ? '' : 'disabled title="Cần về Động Phủ để ấp trứng & lập huyết khế"'}>🐾 Thu phục</button>
        </div>`;
      }).join('')}
    </div>`;
}

// ==========================================
// 5. ĐẠO LỮ SONG TU & HỆ THỐNG SƯ ĐỒ (ĐỆ TỬ)
// ==========================================

function v19SongTuDaoLu(npcId) {
  if (!state || state.ketThuc || state.tranHienTai || state.suKienHienTai || state.biCanhHienTai) return;
  const npc = state.npcs && state.npcs[npcId];
  if (!npc || !npc.conSong || !npc.laDaoLuNguoiChoi) {
    ghiNhatKy('⚠️ Chỉ có thể Song Tu với Đạo Lữ đã kết duyên!', 'canh_bao');
    veGiaoDien();
    return;
  }
  if (npc.vungId !== state.vungHienTai) {
    ghiNhatKy(`⚠️ Đạo Lữ 【${npc.ten}】 đang ở 【${layVungDef(npc.vungId).ten}】, hãy tới đó gặp mặt trước!`, 'canh_bao');
    veGiaoDien();
    return;
  }

  const tocDo = tinhTocDoTuLuyenNam();
  const tvNhan = Math.round(tocDo * 1.35 * (0.95 + Math.random() * 0.1));
  state.tuVi += tvNhan;
  tienThoiGian(12);
  if (state.ketThuc) { luuGame(); veGiaoDien(); return; }

  state.hp = tinhHpMax();
  state.mp = tinhMpMax();
  const daHa = hoiPhucThuongThe(1);
  if (typeof state.tamMaNam === 'number') state.tamMaNam = state.nam;
  thayDoiHaoCam(npc, 6, true);
  ghiKyUcNpc(npc, `Cùng đạo lữ ${state.ten} Song Tu một năm, linh lực giao hòa tiến cảnh thần tốc.`);
  ghiNhatKy(
    `💞 Song Tu 1 năm cùng Đạo Lữ 【${npc.ten}】: Âm dương điều hòa, nhận +${tvNhan.toLocaleString()} Tu vi (1.35x tốc độ), Khí huyết & Linh lực viên mãn${daHa ? `, thương thế hồi còn 【${layThuongTheDef().ten}】` : ''}, Đạo tâm ổn định (+6 Hảo cảm)!`,
    'dai_cat'
  );
  luuGame();
  veGiaoDien();
}

const V19_HO_DE_TU = ['Lâm', 'Trần', 'Lý', 'Triệu', 'Tô', 'Diệp', 'Mộ', 'Hàn', 'Liễu', 'Bạch', 'Chu', 'Thẩm'];
const V19_TEN_DE_TU = ['Thanh Phong', 'Tử Huyên', 'Mặc Vũ', 'Vân Phi', 'Linh Nhi', 'Trường Sinh', 'Tiểu Phàm', 'Nhược Thủy', 'Huyền Minh', 'Cẩm Tước'];

function v19ThuNhanDeTu() {
  if (!state || !kiemTraTaiDongPhu('thu nhận đệ tử')) return;
  if ((state.canhGioi || 0) < 3) {
    ghiNhatKy('⚠️ Cần đạt cảnh giới 【Kết Đan Kỳ】 trở lên mới đủ uy vọng khai sơn thu đồ!', 'canh_bao');
    veGiaoDien();
    return;
  }
  if (!Array.isArray(state.deTu)) state.deTu = [];
  if (state.deTu.length >= 3) {
    ghiNhatKy('⚠️ Môn hạ đã đủ 3 vị đệ tử chân truyền!', 'canh_bao');
    veGiaoDien();
    return;
  }
  const phi = 300;
  if (state.linhThach < phi) {
    ghiNhatKy(`⚠️ Cần ${phi} Linh thạch chuẩn bị lễ nhập môn & tài nguyên ban đầu cho đệ tử!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  state.linhThach -= phi;
  const ten = `${pickRandom(V19_HO_DE_TU)} ${pickRandom(V19_TEN_DE_TU)}`;
  const lcPool = [
    { ten: 'Tam Linh Căn', hs: 1.1 },
    { ten: 'Song Linh Căn (Thượng Phẩm)', hs: 1.4 },
    { ten: 'Dị Linh Căn', hs: 1.65 },
    { ten: 'Thiên Linh Căn (Cực Hiếm)', hs: 2.0 }
  ];
  const r = Math.random();
  const lc = r < 0.08 ? lcPool[3] : r < 0.25 ? lcPool[2] : r < 0.6 ? lcPool[1] : lcPool[0];
  const dt = {
    id: `dt_${Date.now()}_${Math.floor(Math.random() * 999)}`,
    ten,
    linhCanTen: lc.ten,
    heSoTuLuyen: lc.hs,
    canhGioi: 1,
    tieuCanh: 0,
    tuVi: 0,
    congPhapId: null,
    congPhapTen: 'Chưa truyền công',
    trungThanh: 75,
    namThuNhan: state.nam
  };
  state.deTu.push(dt);
  ghiNhatKy(`🎓 Bạn thu nhận 【${dt.ten}】 (${dt.linhCanTen}) làm đệ tử nhập thất! Hãy truyền lại công pháp cũ để đệ tử mau chóng thành tài và cống nạp tài nguyên cho sư tôn.`, 'dai_cat');
  luuGame();
  veGiaoDien();
}

function v19TruyenCongDeTu(dtId) {
  if (!state || !Array.isArray(state.deTu)) return;
  const dt = state.deTu.find(x => x.id === dtId);
  if (!dt) return;
  const sel = document.getElementById(`sel-cp-dt-${dtId}`);
  const cpId = sel ? sel.value : (state.congPhapDaHoc || [])[0];
  const cp = layCongPhapDef(cpId);
  if (!cp) return;
  dt.congPhapId = cp.id;
  dt.congPhapTen = cp.ten;
  dt.heSoCongPhap = 1 + Math.min(0.8, ((cp.canhGioi || 0) + 1) * 0.16);
  dt.trungThanh = Math.min(100, (dt.trungThanh || 75) + 12);
  ghiNhatKy(`📜 Bạn truyền thụ 【${cp.ten}】 cho đệ tử 【${dt.ten}】! Tốc độ tu luyện của đồ đệ tăng mạnh (Trung thành ${dt.trungThanh}/100).`, 'tot');
  luuGame();
  veGiaoDien();
}

function v19DuoiDeTu(dtId) {
  if (!state || !Array.isArray(state.deTu)) return;
  const idx = state.deTu.findIndex(x => x.id === dtId);
  if (idx < 0) return;
  const [dt] = state.deTu.splice(idx, 1);
  ghiNhatKy(`🚪 Bạn cho đệ tử 【${dt.ten}】 xuất sư rời khỏi môn hạ.`, 'thuong');
  luuGame();
  veGiaoDien();
}

function v19RenderSuDoDongPhu() {
  if (!state) return '';
  const oNha = dangODongPhu();
  const ds = Array.isArray(state.deTu) ? state.deTu : [];
  if ((state.canhGioi || 0) < 3) {
    return `
      <div class="sub-section">
        <div class="sub-title">🎓 Môn Hạ Sư Đồ (Mở khóa tại 【Kết Đan Kỳ】)</div>
        <div class="muted">Đạt Kết Đan Kỳ trở lên có thể thu nhận tối đa 3 đệ tử, truyền lại công pháp cũ không dùng nữa và nhận linh thạch / linh thảo cống nạp hàng năm.</div>
      </div>`;
  }
  const cpDaHoc = (state.congPhapDaHoc || []).map(id => layCongPhapDef(id)).filter(Boolean);
  return `
    <div class="sub-section">
      <div class="sub-title">🎓 Môn Hạ Sư Đồ (${ds.length}/3 Đệ tử)</div>
      <div class="row-actions" style="margin-bottom:8px">
        <button class="btn btn-sm btn-primary" onclick="v19ThuNhanDeTu()" ${oNha && ds.length < 3 ? '' : 'disabled'}>🎓 Chiêu thu Đệ tử nhập thất (300 LT)</button>
      </div>
      ${
        ds.length === 0
          ? '<div class="muted">Chưa thu nhận đệ tử nào. Thu đệ tử để truyền thừa công pháp cũ và nhận cống nạp định kỳ!</div>'
          : ds
              .map(dt => {
                const cgTxt = tenCanhGioiDayDu(dt.canhGioi || 1, dt.tieuCanh || 0);
                return `<div class="card-row" style="display:block">
                  <div><b>${escapeHtml(dt.ten)}</b> <span class="badge hl-realm">${cgTxt}</span> <span class="badge">${escapeHtml(dt.linhCanTen)}</span> <span class="muted">Trung thành: ${dt.trungThanh}/100</span></div>
                  <div class="muted" style="margin:3px 0">Công pháp đang tu: <b>${escapeHtml(dt.congPhapTen || 'Chưa truyền công')}</b> · Hàng năm tự tu luyện & hiếu kính sư tôn.</div>
                  <div class="row-actions" style="margin-top:6px">
                    <select id="sel-cp-dt-${dt.id}" style="max-width:210px;padding:4px 6px;font-size:12px">
                      ${cpDaHoc.map(c => `<option value="${c.id}" ${dt.congPhapId === c.id ? 'selected' : ''}>${escapeHtml(c.ten)} (${layCanhGioiDef(c.canhGioi).ten})</option>`).join('')}
                    </select>
                    <button class="btn btn-sm btn-primary" onclick="v19TruyenCongDeTu('${dt.id}')">📜 Truyền công</button>
                    <button class="btn btn-sm btn-danger" onclick="v19DuoiDeTu('${dt.id}')">Xuất sư</button>
                  </div>
                </div>`;
              })
              .join('')
      }
    </div>`;
}

// ==========================================
// 6. TICK THỜI GIAN HÀNG NĂM (v1.9)
// ==========================================

function v19TienThoiGian(namTroi) {
  if (!state || namTroi <= 0) return;

  // 1. Linh Thú hấp thu linh khí tự trưởng thành nhẹ
  if (state.linhThu) {
    const lt = state.linhThu;
    const expTu = Math.round(18 * Math.pow(1.6, Math.max(0, (lt.cap || 1) - 1)) * namTroi);
    lt.exp = (lt.exp || 0) + expTu;
    const maxCap = Math.min(9, (state.canhGioi || 0) + 1);
    if (lt.cap < maxCap && lt.exp >= v19ExpCanLinhThu(lt.cap)) {
      lt.exp -= v19ExpCanLinhThu(lt.cap);
      lt.cap += 1;
      ghiNhatKy(`🐾 Linh Thú 【${lt.ten}】 hấp thu linh khí động phủ, tự mình đột phá lên 【Cấp ${lt.cap}】!`, 'dai_cat');
    }
  }

  // 2. Đệ tử tự tu luyện, đột phá & cống nạp tài nguyên cho sư tôn
  if (Array.isArray(state.deTu) && state.deTu.length > 0) {
    let tongLtCong = 0;
    for (const dt of state.deTu) {
      const defCg = layCanhGioiDef(dt.canhGioi || 1);
      const tvNam = (defCg.baseTuViNam || 45) * (dt.heSoTuLuyen || 1.1) * (dt.heSoCongPhap || 1.0);
      dt.tuVi = (dt.tuVi || 0) + Math.round(tvNam * namTroi);
      const can = (defCg.tuViCan && defCg.tuViCan[dt.tieuCanh || 0]) || 999999;
      if (dt.tuVi >= can && (dt.canhGioi || 1) < Math.max(1, (state.canhGioi || 1) - 1)) {
        dt.tuVi -= can;
        const maxTieu = (defCg.tieuCanh || []).length - 1;
        if ((dt.tieuCanh || 0) < maxTieu) {
          dt.tieuCanh = (dt.tieuCanh || 0) + 1;
        } else {
          dt.canhGioi = (dt.canhGioi || 1) + 1;
          dt.tieuCanh = 0;
          ghiNhatKy(`🎓 Đệ tử 【${dt.ten}】 khổ tu công pháp bạn truyền thụ, thuận lợi đột phá lên 【${layCanhGioiDef(dt.canhGioi).ten}】!`, 'tot');
        }
      }
      // Cống nạp Linh thạch hàng năm (theo cảnh giới đệ tử)
      tongLtCong += Math.round(35 * Math.pow(2.2, dt.canhGioi || 1) * namTroi);
    }
    if (tongLtCong > 0) {
      state.linhThach += tongLtCong;
      ghiNhatKy(`🎓 Môn hạ đệ tử hiếu kính sư tôn +${tongLtCong.toLocaleString()} Linh thạch sau ${namTroi} năm lịch luyện.`, 'thuong');
    }
  }
}
