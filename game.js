// Tác giả: Gemini (Antigravity)
// Engine xử lý trung tâm: Phàm Nhân Tu Tiên — Sandbox Biên Niên 10 Cảnh Giới (Offline-first + AI Hybrid)

const SAVE_KEY = 'pn_tu_tien_save_v2';
const THEME_KEY = 'pn_tu_tien_theme_v1';
const AI_CFG_KEY = 'pn_tu_tien_ai_cfg_v1';
const MAX_LINH_DIEN = 9;
const MAX_BI_THUAT = 3;
const MAX_TUI_DO_O = 100;

let state = null;
let activeTab = 'dong_phu'; // 'dong_phu' | 'dia_diem' | 'npc' | 'ban_do' | 'tui_do'
let diaDiemSubTab = 'kham_pha'; // 'kham_pha' | 'cua_hang' | 'tong_mon' | 'nha_npc'
let selectedNpcId = null;
let shopSellSelected = new Set();
let aiBusy = false;

const uiFilter = {
  shopQuery: '',
  shopType: 'all', // 'all' | 'dan' | 'phu_luc' | 'tru_vat' | 'linh_thao' | 'phap_bao' | 'cong_phap' | 'dan_phuong'
  shopTab: 'mua', // 'mua' | 'ban'
  npcQuery: '',
  npcScope: 'ban_be', // 'ban_be' | 'ke_thu' | 'the_luc' | 'all'
  tmQuery: '',
  tmScope: 'vung', // 'vung' | 'all'
  tmSubTab: 'nhiem_vu', // 'nhiem_vu' | 'chap_su' | 'bao_kho'
  nhaQuery: '',
  mapQuery: '',
  bagQuery: ''
};

let aiConfig = {
  provider: 'gemini',
  geminiKey: '',
  geminiModel: 'gemini-2.5-flash',
  openaiKey: '',
  openaiBaseUrl: 'https://openrouter.ai/api/v1',
  openaiModel: 'openai/gpt-4o-mini'
};

// ==========================================
// 1. TIỆN ÍCH CHUNG & ROLL NHÂN VẬT NGẪU NHIÊN
// ==========================================

function pickWeighted(arr) {
  if (!arr || arr.length === 0) return null;
  const total = arr.reduce((s, x) => s + (Number(x.trongSo) || 1), 0);
  let r = Math.random() * total;
  for (const item of arr) {
    r -= Number(item.trongSo) || 1;
    if (r <= 0) return item;
  }
  return arr[arr.length - 1];
}

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function rollTenTheoGioiTinh(gioiTinh = 'nam') {
  const roll = window.PN_DATA.roll;
  const ho = pickRandom(roll.hoMau) || 'Lâm';
  const tenPool = gioiTinh === 'nu' ? roll.tenNuMau : roll.tenNamMau;
  const ten = pickRandom(tenPool) || 'Thanh Phong';
  return `${ho} ${ten}`;
}

function taiCauHinhAI() {
  try {
    const raw = localStorage.getItem(AI_CFG_KEY);
    if (raw) aiConfig = { ...aiConfig, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Không đọc được cấu hình AI:', e);
  }
}

function luuCauHinhAI() {
  try {
    localStorage.setItem(AI_CFG_KEY, JSON.stringify(aiConfig));
  } catch (e) {
    console.warn('Không lưu được cấu hình AI:', e);
  }
}

const NPC_TU_CHAT = [
  { id: 'binh_thuong', ten: 'Bình thường', trongSo: 50, heSoTocDo: 0.85, heSoChienDau: 0.95, heSoTuoi: 1.12 },
  { id: 'tinh_anh', ten: 'Tinh anh', trongSo: 30, heSoTocDo: 1.15, heSoChienDau: 1.08, heSoTuoi: 1.0 },
  { id: 'thien_tai', ten: 'Thiên tài', trongSo: 15, heSoTocDo: 1.45, heSoChienDau: 1.22, heSoTuoi: 0.78 },
  { id: 'yeu_nghiet', ten: 'Tuyệt thế yêu nghiệt', trongSo: 5, heSoTocDo: 1.85, heSoChienDau: 1.40, heSoTuoi: 0.62 }
];

const TUOI_KHUNG_CG = [
  [15, 52],      // 0: Phàm Nhân
  [18, 85],      // 1: Luyện Khí
  [45, 175],     // 2: Trúc Cơ
  [130, 380],    // 3: Kết Đan
  [320, 760],    // 4: Nguyên Anh
  [700, 1600],   // 5: Hóa Thần
  [1600, 3600],  // 6: Luyện Hư
  [3600, 7800],  // 7: Hợp Thể
  [8500, 19500], // 8: Đại Thừa
  [19000, 48000] // 9: Độ Kiếp
];

function layTuChatNpc(id) {
  return NPC_TU_CHAT.find(t => t.id === id) || NPC_TU_CHAT[0];
}

function suyDoanGioiTinhNpc(ten = '') {
  const nuKeywords = [
    'uyển', 'âm', 'dao', 'thiến', 'linh', 'phượng', 'nguyệt', 'chi', 'mi', 'thanh',
    'tuyết', 'lan', 'hương', 'tiên tử', 'nữ', 'nhược', 'bích', 'huyên', 'sương', 'cầm'
  ];
  const tl = ten.toLowerCase();
  return nuKeywords.some(k => tl.includes(k)) ? 'nu' : 'nam';
}

const NPC_TINH_CACH = [
  { id: 'trong_nghia', ten: 'Trọng nghĩa · Tri ân', moTa: 'Chính trực, trọng tình nghĩa, có ân tất báo.' },
  { id: 'hoa_dong', ten: 'Ôn hòa · Khiêm nhường', moTa: 'Điềm đạm, dĩ hòa vi quý, dễ hóa giải ân oán.' },
  { id: 'cuong_truc', ten: 'Cường trực · Hiếu chiến', moTa: 'Thẳng thắn, phục kẻ mạnh, trọng tỷ thí sòng phẳng.' },
  { id: 'thuc_dung', ten: 'Thực dụng · Đa nghi', moTa: 'Cân đo lợi ích, cảnh giác cao độ, khó đặt lòng tin.' },
  { id: 'kieu_ngao', ten: 'Kiêu ngạo · Trọng sĩ diện', moTa: 'Tự tôn cực cao, ghét bị thương hại hay coi thường.' },
  { id: 'am_doc', ten: 'Âm hiểm · Tàn độc', moTa: 'Thù dai nhớ lâu, ngoài mặt nhẫn nhịn nhưng ngấm ngầm báo thù.' }
];

function layTinhCachNpcDef(id) {
  return NPC_TINH_CACH.find(t => t.id === id) || NPC_TINH_CACH[1];
}

function suyDoanTinhCachNpc(text = '', danhHieu = '') {
  const s = `${text} ${danhHieu}`.toLowerCase();
  if (/âm hiểm|nham hiểm|tà|ma|độc|tàn|đoạt xá|hút|sát|dụ dỗ|lừa|quỷ|hắc sát/.test(s)) return 'am_doc';
  if (/kiêu|sĩ diện|ngạo|hách dịch|trêu đùa|tôn nghiêm|bề trên/.test(s)) return 'kieu_ngao';
  if (/thẳng|nóng|cộc|thực chiến|kiếm|cuồng|hiếu chiến|tỷ thí/.test(s)) return 'cuong_truc';
  if (/đa nghi|thực dụng|tính toán|buôn|cảnh giác|ép giá|lợi ích|sòng phẳng|thương/.test(s)) return 'thuc_dung';
  if (/chính trực|nghĩa|bao che|trung thành|thiện|nhân|giúp/.test(s)) return 'trong_nghia';
  return pickRandom(NPC_TINH_CACH).id;
}

function khoiTaoHoSoNpc(baseNpc) {
  const cg = Math.max(0, Math.min(9, Number(baseNpc.canhGioi) || 0));
  const cgDef = layCanhGioiDef(cg);
  const roll = window.PN_DATA.roll;
  const lc = baseNpc.linhCan
    ? layLinhCanDef(baseNpc.linhCan)
    : pickWeighted(roll.linhCan) || roll.linhCan[0];

  // Tư chất NPC: danh nhân bậc cao (>= 4) tối thiểu là Tinh anh hoặc Thiên tài
  let tcNpc = baseNpc.tuChat ? layTuChatNpc(baseNpc.tuChat) : null;
  if (!tcNpc) {
    if (!baseNpc.ngauNhien && cg >= 4) {
      tcNpc = pickWeighted(NPC_TU_CHAT.slice(1)) || NPC_TU_CHAT[2];
    } else {
      tcNpc = pickWeighted(NPC_TU_CHAT) || NPC_TU_CHAT[0];
    }
  }

  const thoMax = Math.max(70, Math.round(cgDef.thoNguyen * (0.95 + Math.random() * 0.18)));
  const khung = TUOI_KHUNG_CG[cg] || [18, 80];
  const tuoiMin = Math.max(14, Math.round(khung[0] * tcNpc.heSoTuoi));
  const tuoiMax = Math.min(thoMax - Math.max(10, Math.round(thoMax * 0.12)), Math.max(tuoiMin + 8, Math.round(khung[1] * tcNpc.heSoTuoi)));
  const tuoi = baseNpc.tuoi || (tuoiMin + Math.floor(Math.random() * Math.max(1, tuoiMax - tuoiMin + 1)));

  const tieuMax = Math.max(0, (cgDef.tieuCanh || []).length - 1);
  const tieuCanh = baseNpc.tieuCanh ?? Math.floor(Math.random() * (tieuMax + 1));
  const tmPool = (window.PN_DATA.tongMon || []).filter(t => t.vungId === baseNpc.vungId);
  const tmPick = baseNpc.tongMonId ? layTongMonDef(baseNpc.tongMonId) : (tmPool.length > 0 && Math.random() < 0.65 ? pickRandom(tmPool) : null);
  const tcLoai = baseNpc.tinhCachLoai || suyDoanTinhCachNpc(baseNpc.tinhCach, baseNpc.danhHieu);

  return {
    ...baseNpc,
    vungGocId: baseNpc.vungGocId || baseNpc.vungId,
    gioiTinh: baseNpc.gioiTinh || suyDoanGioiTinhNpc(baseNpc.ten),
    tinhCachLoai: tcLoai,
    linhCan: lc.id,
    tuChat: tcNpc.id,
    tuoi,
    thoNguyen: baseNpc.thoNguyen || thoMax,
    canhGioi: cg,
    tieuCanh,
    tuVi: baseNpc.tuVi ?? Math.floor(Math.random() * ((cgDef.tuViCan[tieuCanh] || 100) * 0.7)),
    // Bắt đầu bằng 0 (Người xa lạ) cho mọi NPC player chưa từng tiếp xúc
    haoCam: 0,
    haoCamRaw: 0,
    namTuongTacCuoi: 0,
    hp: Math.round((baseNpc.hp || cgDef.hpGoc * 1.25) * tcNpc.heSoChienDau),
    congKich: Math.round((baseNpc.congKich || cgDef.congKichGoc * 1.15) * tcNpc.heSoChienDau),
    phongThu: Math.round((baseNpc.phongThu || cgDef.phongThuGoc * 1.15) * tcNpc.heSoChienDau),
    thuongThe: 0, // 0: Khỏe mạnh, 1: Nhẹ, 2: Ám tật/Nặng, 3: Nguy kịch
    tongMonId: tmPick ? tmPick.id : null,
    daoLuId: null,
    laDaoLuNguoiChoi: false,
    quenBiet: [],
    banBe: [],
    cuuNhan: [],
    conSong: true,
    lyDoMat: '',
    kyUc: Array.isArray(baseNpc.kyUc) ? baseNpc.kyUc : []
  };
}

function taoNpcNgauNhienTuMau(mau, vungOverride = null, idxSuffix = 1, cgOverride = null) {
  const gioiTinh = Math.random() < 0.35 ? 'nu' : 'nam';
  const ten = rollTenTheoGioiTinh(gioiTinh);
  const vungId = vungOverride || mau.vungId || 'kinh_chau';
  const vungDef = layVungDef(vungId);
  const minCg = cgOverride !== null ? cgOverride : Math.max(mau.canhGioiMin ?? 0, vungDef.canhGioiYeuCau ?? 0);
  const maxCg = cgOverride !== null ? cgOverride : Math.min(9, Math.max(minCg, mau.canhGioiMax ?? minCg + 1));
  const cg = minCg + Math.floor(Math.random() * (maxCg - minCg + 1));
  const cgDef = layCanhGioiDef(cg);
  const tmPool = (window.PN_DATA.tongMon || []).filter(t => t.vungId === vungId);
  const tmPick = tmPool.length > 0 && Math.random() < 0.6 ? pickRandom(tmPool) : null;
  const danhHieu = tmPick ? `${mau.goi} · ${tmPick.ten}` : `${mau.goi} (${mau.phe || 'Tán Tu'})`;
  const tcLoai = Math.random() < 0.7 ? suyDoanTinhCachNpc(mau.tinhCach, danhHieu) : pickRandom(NPC_TINH_CACH).id;

  return khoiTaoHoSoNpc({
    id: `${mau.id}_${Date.now().toString(36)}_${idxSuffix}_${Math.floor(Math.random() * 999)}`,
    ten,
    gioiTinh,
    danhHieu,
    vungId,
    tongMonId: tmPick ? tmPick.id : null,
    canhGioi: cg,
    tinhCach: mau.tinhCach,
    tinhCachLoai: tcLoai,
    tuiDo: [...(mau.tuiDo || [])],
    linhThach: Math.round(40 * Math.pow(3, cg) * (0.7 + Math.random() * 0.6)),
    hp: Math.round(cgDef.hpGoc * (1.15 + Math.random() * 0.4)),
    congKich: Math.round(cgDef.congKichGoc * (1.05 + Math.random() * 0.3)),
    phongThu: Math.round(cgDef.phongThuGoc * (1.05 + Math.random() * 0.3)),
    ngauNhien: true
  });
}

function lienKetQuanHeNpc(a, b, loai) {
  if (!a || !b || a.id === b.id) return;
  a.quenBiet = a.quenBiet || [];
  b.quenBiet = b.quenBiet || [];
  a.banBe = a.banBe || [];
  b.banBe = b.banBe || [];
  a.cuuNhan = a.cuuNhan || [];
  b.cuuNhan = b.cuuNhan || [];
  if (loai === 'quen') {
    if (!a.quenBiet.includes(b.id) && !a.banBe.includes(b.id) && !a.cuuNhan.includes(b.id)) {
      a.quenBiet.push(b.id);
      b.quenBiet.push(a.id);
    }
  } else if (loai === 'ban') {
    a.quenBiet = a.quenBiet.filter(x => x !== b.id);
    b.quenBiet = b.quenBiet.filter(x => x !== a.id);
    if (!a.banBe.includes(b.id)) a.banBe.push(b.id);
    if (!b.banBe.includes(a.id)) b.banBe.push(a.id);
  } else if (loai === 'cuu') {
    a.quenBiet = a.quenBiet.filter(x => x !== b.id);
    b.quenBiet = b.quenBiet.filter(x => x !== a.id);
    a.banBe = a.banBe.filter(x => x !== b.id);
    b.banBe = b.banBe.filter(x => x !== a.id);
    if (!a.cuuNhan.includes(b.id)) a.cuuNhan.push(b.id);
    if (!b.cuuNhan.includes(a.id)) b.cuuNhan.push(a.id);
  }
}

function khoiTaoQuanHeGiuaNpc(npcsMap) {
  const byVung = {};
  for (const n of Object.values(npcsMap)) {
    (byVung[n.vungId] = byVung[n.vungId] || []).push(n);
  }
  for (const list of Object.values(byVung)) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      // Mỗi NPC có 1-3 mối quan hệ ban đầu với người cùng vùng/tông môn
      const soQh = 1 + Math.floor(Math.random() * Math.min(3, list.length - 1));
      for (let k = 0; k < soQh; k++) {
        const b = list[(i + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length];
        if (!b || b.id === a.id) continue;
        const cungTong = a.tongMonId && a.tongMonId === b.tongMonId;
        const r = Math.random();
        if (cungTong || r < 0.55) lienKetQuanHeNpc(a, b, 'quen');
        else if (r < 0.85) lienKetQuanHeNpc(a, b, 'ban');
        else lienKetQuanHeNpc(a, b, 'cuu');
      }
    }
  }
}

function rollHeLinhCan(lcDef) {
  const pool = [...(lcDef.hePool || ['KIM', 'MOC', 'THUY', 'HOA', 'THO'])];
  const soHe = Math.min(pool.length, Math.max(1, Number(lcDef.soHe) || 1));
  // Xáo trộn Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, soHe);
}

function tenHeLinhCanText(heArr) {
  const map = (window.PN_DATA.roll && window.PN_DATA.roll.heTen) || {};
  return (heArr || []).map(h => map[h] || h).join(' · ');
}

function tinhTuongThichLinhCan(cpId = state?.congPhap) {
  const cp = layCongPhapDef(cpId);
  const cpHe = Array.isArray(cp.he) ? cp.he : [];
  if (cpHe.length === 0) {
    return { khop: 'trung_tinh', tocDoMult: 1.0, atkBonus: 0, label: 'Vô thuộc tính (100%)' };
  }
  const myHe = Array.isArray(state?.linhCanHe) ? state.linhCanHe : [];
  const hop = cpHe.some(h => myHe.includes(h));
  if (hop) {
    return { khop: 'hop', tocDoMult: 1.20, atkBonus: 0.15, label: `Khớp hệ ${tenHeLinhCanText(cpHe)} (+20% Tu luyện, +15% Công)` };
  }
  return { khop: 'lech', tocDoMult: 0.80, atkBonus: -0.10, label: `Lệch hệ ${tenHeLinhCanText(cpHe)} (-20% Tu luyện, -10% Công)` };
}

function taoKiepMoi(opts = {}) {
  const roll = window.PN_DATA.roll;
  const gioiTinh = opts.gioiTinh || (Math.random() < 0.3 ? 'nu' : 'nam');
  const ten = (opts.ten || '').trim() || rollTenTheoGioiTinh(gioiTinh);
  const lcDef =
    window.PN_DATA.linhCan.find(l => l.id === opts.linhCanId) ||
    pickWeighted(roll.linhCan) ||
    window.PN_DATA.linhCan[0];
  const linhCanHe = Array.isArray(opts.linhCanHe) && opts.linhCanHe.length > 0 ? opts.linhCanHe : rollHeLinhCan(lcDef);
  const tcDef =
    window.PN_DATA.theChat.find(t => t.id === opts.theChatId) ||
    pickWeighted(roll.theChat) ||
    window.PN_DATA.theChat[0];
  const xtDef =
    window.PN_DATA.xuatThan.find(x => x.id === opts.xuatThanId) ||
    pickWeighted(roll.xuatThan) ||
    window.PN_DATA.xuatThan[0];

  // Roll 4 chỉ số gốc + cộng thưởng từ Thể chất & Xuất thân
  const chiSo = {
    canCot: Math.max(4, 8 + Math.floor(Math.random() * 7) + (tcDef.chiSo?.canCot || 0) + (xtDef.chiSo?.canCot || 0)),
    ngoTinh: Math.max(4, 8 + Math.floor(Math.random() * 7) + (tcDef.chiSo?.ngoTinh || 0) + (xtDef.chiSo?.ngoTinh || 0)),
    khiVan: Math.max(4, 8 + Math.floor(Math.random() * 7) + (tcDef.chiSo?.khiVan || 0) + (xtDef.chiSo?.khiVan || 0)),
    thanThuc: Math.max(4, 8 + Math.floor(Math.random() * 7) + (tcDef.chiSo?.thanThuc || 0) + (xtDef.chiSo?.thanThuc || 0))
  };

  // Khởi tạo 73 NPC danh nhân (có biến động ngẫu nhiên mỗi kiếp) + ~230 NPC ngẫu nhiên phủ đều 40 vùng (~300 NPC)
  const npcsState = {};
  const allVungs = window.PN_DATA.vungDat || [];
  for (const n of window.PN_DATA.npcs) {
    const clone = JSON.parse(JSON.stringify(n));
    const vungTuongDuong = allVungs.filter(v => Math.abs((v.canhGioiYeuCau || 0) - (clone.canhGioi || 0)) <= 1);
    if (vungTuongDuong.length > 0 && Math.random() < 0.35) {
      clone.vungId = pickRandom(vungTuongDuong).id;
    }
    if (Math.random() < 0.25) clone.tinhCachLoai = pickRandom(NPC_TINH_CACH).id;
    const varBien = 0.88 + Math.random() * 0.27;
    if (clone.hp) clone.hp = Math.round(clone.hp * varBien);
    if (clone.congKich) clone.congKich = Math.round(clone.congKich * varBien);
    if (clone.phongThu) clone.phongThu = Math.round(clone.phongThu * varBien);
    delete clone.tuoi;
    delete clone.tuVi;
    npcsState[n.id] = khoiTaoHoSoNpc(clone);
  }
  const mauPool = window.PN_DATA.npcMau || [];
  let randIdx = 1;
  if (mauPool.length > 0 && allVungs.length > 0) {
    // Bước 1: Đảm bảo mỗi vùng trong 40 vùng đều có tối thiểu 5 NPC phù hợp cảnh giới vùng
    for (const v of allVungs) {
      const mauVung = mauPool.filter(m => m.vungId === v.id);
      for (let j = 0; j < 5; j++) {
        const mau = mauVung.length > 0 ? pickRandom(mauVung) : pickRandom(mauPool);
        const cgMin = v.canhGioiYeuCau || 0;
        const cgTarget = Math.min(9, cgMin + (Math.random() < 0.65 ? 0 : Math.random() < 0.7 ? 1 : 2));
        const npcRand = taoNpcNgauNhienTuMau(mau, v.id, randIdx++, cgTarget);
        npcsState[npcRand.id] = npcRand;
      }
    }
    // Bước 2: Bổ sung thêm tới ~300 NPC toàn thế giới
    while (Object.keys(npcsState).length < 300) {
      const v = pickRandom(allVungs);
      const mau = pickRandom(mauPool);
      const cgMin = v.canhGioiYeuCau || 0;
      const cgTarget = Math.min(9, cgMin + Math.floor(Math.random() * 2));
      const npcRand = taoNpcNgauNhienTuMau(mau, v.id, randIdx++, cgTarget);
      npcsState[npcRand.id] = npcRand;
    }
  }
  khoiTaoQuanHeGiuaNpc(npcsState);

  const cpKhoiDau = xtDef.congPhap || 'cp_chinh_duong_kinh';
  const dsCpKhoiDau = [cpKhoiDau];
  const biThuatKhoiDau = [];
  for (const btid of xtDef.biThuat || []) {
    const btDef = layCongPhapDef(btid);
    if (btDef) {
      if (!dsCpKhoiDau.includes(btid)) dsCpKhoiDau.push(btid);
      if (btDef.loai === 'BI_THUAT' && biThuatKhoiDau.length < MAX_BI_THUAT) biThuatKhoiDau.push(btid);
    }
  }
  const tuiDoKhoiDau = { ...(xtDef.vatPham || { dan_hoang_long: 1 }) };
  const pbKhoiDau = xtDef.phapBao && tuiDoKhoiDau[xtDef.phapBao] > 0 ? xtDef.phapBao : null;
  const vungKhoiDau = xtDef.vung || 'kinh_chau';

  // Áp dụng mối quan hệ NPC ban đầu từ Xuất Thân
  const qhKhoiDauLog = [];
  for (const qh of xtDef.quanHeNpc || []) {
    const targetNpc = npcsState[qh.npcId];
    if (targetNpc && targetNpc.conSong) {
      const diem = Math.max(-100, Math.min(100, Number(qh.haoCam) || 0));
      targetNpc.haoCamRaw = diem;
      targetNpc.haoCam = diem;
      targetNpc.namTuongTacCuoi = 1;
      if (qh.lyDo) {
        targetNpc.kyUc = targetNpc.kyUc || [];
        targetNpc.kyUc.push(`Năm 1: ${qh.lyDo}`);
      }
      qhKhoiDauLog.push(`${targetNpc.ten} (${diem >= 0 ? '+' + diem : diem} HC)`);
    }
  }

  const tongMonKhoiDau = xtDef.tongMon
    ? {
        id: xtDef.tongMon.id,
        capBac: xtDef.tongMon.capBac || 0,
        congHien: xtDef.tongMon.congHien || 30,
        congTich: xtDef.tongMon.congHien || 30,
        namBongLoc: 0,
        namKhaoHachLai: 0,
        namQuyen: 0,
        ltDaQuyenNam: 0,
        donKy: -1,
        donDaGiao: false,
        bangKy: -1,
        bangViec: [],
        viecNhan: [],
        viecVatNhan: {}
      }
    : null;
  const theLucKhoiDau = { ...(xtDef.theLucHaoCam || {}) };
  if (tongMonKhoiDau && !(tongMonKhoiDau.id in theLucKhoiDau)) {
    theLucKhoiDau[tongMonKhoiDau.id] = 15;
  }

  state = {
    version: 2,
    kiep: state && state.kiep ? state.kiep + 1 : 1,
    ten,
    gioiTinh,
    linhCan: lcDef.id,
    linhCanHe,
    theChat: tcDef.id,
    xuatThan: xtDef.id,
    nam: 1,
    thang: 1,
    tuoi: 14 + Math.floor(Math.random() * 4),
    canhGioi: Number(xtDef.canhGioi) || 0,
    tieuCanh: Number(xtDef.tieuCanh) || 0,
    tuVi: Number(xtDef.tuVi) || 0,
    hp: 90,
    linhThach: xtDef.linhThach || 30,
    thoNguyenBonus: tcDef.thoNguyenBonus || 0,
    dotPhaBuff: 0,
    ketThuc: null,
    chiSo,

    // Công pháp chính + tối đa 3 Bí thuật phụ
    congPhap: cpKhoiDau,
    biThuat: biThuatKhoiDau,
    congPhapDaHoc: dsCpKhoiDau,
    phapBao: pbKhoiDau,

    tuiDo: tuiDoKhoiDau,
    tuiDoMaxO: 10,
    thuongThe: 0,
    danPhuongDaHoc: ['dp_hoang_long_dan', 'dp_kim_tuy_hoan'],
    vungHienTai: vungKhoiDau,

    // Động phủ cố định 1 vùng: bắt đầu 3 ô Linh Điền, nâng cấp tối đa 9 ô (Cấp 7)
    dongPhu: {
      cap: 1,
      ten: 'Động Phủ Sơ Khai',
      vungId: vungKhoiDau,
      linhDien: [null, null, null]
    },

    // Tông môn & Hảo cảm thế lực
    tongMon: tongMonKhoiDau,
    theLucHaoCam: theLucKhoiDau,

    npcs: npcsState,
    diaDiemCon: {}, // { [vungId]: [{ id, ten, loai, moTa, daKhamPha }] }
    suKienDaGap: {}, // { [skId]: namCuoi } - chống lặp giống Đạo Diễn VKTT
    hatNhanQua: [], // [{ id, loai: 'an_nghia'|'thu_oan'|'co_duyen', npcId, tenDoiTuong, namNo, moTa }]
    suKienHienTai: null,
    biCanhHienTai: null,
    hauChienNpc: null,
    tranHienTai: null,
    namTruySatCuoi: 0,
    nhatKy: [
      {
        nam: 1,
        thang: 1,
        loai: 'he_thong',
        text: `Bạn sinh ra với xuất thân 【${xtDef.ten}】 tại 【${layVungDef(vungKhoiDau).ten}】, mang 【${lcDef.ten}: ${tenHeLinhCanText(linhCanHe)}】 và thể chất 【${tcDef.ten} (${tcDef.pham || 'Phàm phẩm'})】.${qhKhoiDauLog.length > 0 ? ` Nhân duyên tiền định: ${qhKhoiDauLog.join(', ')}.` : ''} Hành trình của ${ten} chính thức bắt đầu!`
      }
    ]
  };

  state.hp = tinhHpMax();
  state.mp = tinhMpMax();
  selectedNpcId = null;
  luuGame();
  veGiaoDien();
}

function luuGame() {
  if (!state) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Không thể lưu game:', e);
  }
}

function taiGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.ten && typeof parsed.canhGioi === 'number') {
      state = parsed;
      if (!Array.isArray(state.biThuat)) state.biThuat = [];
      if (typeof state.dotPhaBuff !== 'number') state.dotPhaBuff = 0;
      if (typeof state.tuiDoMaxO !== 'number') state.tuiDoMaxO = 10;
      if (typeof state.thuongThe !== 'number' || state.thuongThe < 0) state.thuongThe = 0;
      if (typeof state.mp !== 'number' || Number.isNaN(state.mp)) state.mp = tinhMpMax();
      state.mp = Math.min(tinhMpMax(), Math.max(0, state.mp));
      if (!Array.isArray(state.linhCanHe) || state.linhCanHe.length === 0) {
        state.linhCanHe = rollHeLinhCan(layLinhCanDef(state.linhCan));
      }
      if (!state.theLucHaoCam || typeof state.theLucHaoCam !== 'object') state.theLucHaoCam = {};
      if (!state.diaDiemCon || typeof state.diaDiemCon !== 'object') state.diaDiemCon = {};
      if (!state.suKienDaGap || typeof state.suKienDaGap !== 'object') state.suKienDaGap = {};
      if (!Array.isArray(state.hatNhanQua)) state.hatNhanQua = [];
      if (typeof state.thang !== 'number' || state.thang < 1) state.thang = 1;
      if (typeof state.namTruySatCuoi !== 'number') state.namTruySatCuoi = 0;
      if (!('biCanhHienTai' in state)) state.biCanhHienTai = null;
      if (!('hauChienNpc' in state)) state.hauChienNpc = null;
      if (state.dongPhu && state.dongPhu.vungId === undefined) state.dongPhu.vungId = state.vungHienTai || 'kinh_chau';
      if (state.tongMon) chuanHoaTongMonState();
      for (const n of Object.values(state.npcs || {})) {
        if (n && !n.tinhCachLoai) n.tinhCachLoai = suyDoanTinhCachNpc(n.tinhCach, n.danhHieu);
      }
      return true;
    }
  } catch (e) {
    console.warn('Lỗi đọc save:', e);
  }
  return false;
}

function ghiNhatKy(text, loai = 'thuong') {
  if (!state) return;
  state.nhatKy.unshift({
    nam: state.nam,
    thang: state.thang || 1,
    tuoi: state.tuoi,
    loai,
    text
  });
  if (state.nhatKy.length > 140) state.nhatKy.length = 140;
}

// ==========================================
// 2. TRA CỨU ĐỊNH NGHĨA & CÔNG THỨC CHỈ SỐ
// ==========================================

function layCanhGioiDef(cg = state.canhGioi) {
  return window.PN_DATA.canhGioi[cg] || window.PN_DATA.canhGioi[0];
}

function layLinhCanDef(id = state.linhCan) {
  return window.PN_DATA.linhCan.find(l => l.id === id) || window.PN_DATA.linhCan[0];
}

function layTheChatDef(id = state.theChat) {
  return window.PN_DATA.theChat.find(t => t.id === id) || window.PN_DATA.theChat[0];
}

function layXuatThanDef(id = state.xuatThan) {
  return window.PN_DATA.xuatThan.find(x => x.id === id) || window.PN_DATA.xuatThan[0];
}

function layCongPhapDef(id = state.congPhap) {
  return window.PN_DATA.congPhap.find(c => c.id === id) || window.PN_DATA.congPhap[0];
}

function layVatPhamDef(id) {
  if (!id) return undefined;
  const baseId = String(id).split('@')[0];
  return window.PN_DATA.vatPham.find(v => v.id === baseId);
}

function layVungDef(id = state.vungHienTai) {
  return window.PN_DATA.vungDat.find(v => v.id === id) || window.PN_DATA.vungDat[0];
}

function layTongMonDef(id) {
  return window.PN_DATA.tongMon.find(t => t.id === id);
}

function tenCanhGioiDayDu(cg = state.canhGioi, tieu = state.tieuCanh) {
  const def = layCanhGioiDef(cg);
  const tenTieu = def.tieuCanh[tieu] || def.tieuCanh[0];
  return `${def.ten} — ${tenTieu}`;
}

// Cơ chế giảm trừ Công pháp / Bí thuật / Trang bị cảnh giới thấp khi lên cảnh giới cao (tham khảo staleEffectFactor của VKTT) (Tác giả: Gemini (Antigravity))
function tinhHeSoVuotCanh(canhGioiGoc = 0, canhGioiToiDa = null) {
  const curCg = state?.canhGioi || 0;
  const tran =
    canhGioiToiDa !== undefined && canhGioiToiDa !== null
      ? Number(canhGioiToiDa)
      : (Number(canhGioiGoc) || 0) + 1;
  const vuot = Math.max(0, curCg - tran);
  if (vuot <= 0) return { vuot: 0, heSo: 1.0, tyLeHieuUng: 1.0, nhan: '' };
  if (vuot === 1) return { vuot: 1, heSo: 0.55, tyLeHieuUng: 0.5, nhan: '⚠️ Lỗi thời (-45% uy lực)' };
  return { vuot, heSo: 0.2, tyLeHieuUng: 0.0, nhan: '🚫 Đã quá cũ (-80% uy lực · mất hiệu ứng)' };
}

function layCanhGioiPhapBao(pb) {
  if (!pb) return 0;
  if (typeof pb.canhGioi === 'number') return pb.canhGioi;
  const pc = String(pb.phanCap || '');
  if (/Thông Thiên Linh Bảo/i.test(pc)) return 9;
  if (/Cổ bảo|bản mệnh|Pháp bảo/i.test(pc)) return 4;
  if (/Phù bảo/i.test(pc)) return 2;
  if (/Pháp khí/i.test(pc)) return 1;
  return 0;
}

// Bảng quy đổi hiệu ứng nội tại cho Công pháp & Bí thuật (Tác giả: Gemini (Antigravity))
const BI_THUAT_PASSIVE_MAP = {
  TAN_CONG: { congKichPct: 0.06, baoKichPct: 0.02, nhan: 'Sát phạt' },
  PHONG_THU: { phongThuPct: 0.08, hpPct: 0.05, nhan: 'Hộ thân' },
  TRI_LIEU: { hoiPhucPct: 0.05, hpPct: 0.06, nhan: 'Chữa thương' },
  KHONG_CHE: { baoKichPct: 0.03, thanThuc: 1, nhan: 'Khống chế' },
  DON_THUAT: { neTranhPct: 0.04, chayTronPct: 0.08, nhan: 'Độn thuật' },
  HO_TRO: { congKichPct: 0.05, uyLucKnPct: 0.08, tocDoBonus: 0.03, nhan: 'Phụ trợ' }
};

function phanTichThuocTinhCongPhap(c, apDungGiamTru = true) {
  const r = {
    heSoTocDo: 1.0,
    tiLeDotPha: 0,
    congKichPct: 0,
    phongThuPct: 0,
    hpPct: 0,
    linhLucPct: 0,
    hoiPhucPct: 0,
    hoiMpPct: 0,
    baoKichPct: 0,
    neTranhPct: 0,
    chayTronPct: 0,
    phanDamPct: 0,
    uyLucKnPct: 0,
    thanThuc: 0,
    ngoTinh: 0,
    canCot: 0,
    khiVan: 0,
    thoNguyenBonus: 0,
    kyNangChuDong: []
  };
  if (!c) return r;

  if (c.loai === 'TU_LUYEN' && c.tuLuyen) {
    r.heSoTocDo *= Number(c.tuLuyen.heSoTocDo) || 1.0;
    r.tiLeDotPha += Number(c.tuLuyen.tiLeDotPha) || 0;
  }

  const cs = c.chiSoNen || {};
  r.congKichPct += Number(cs.congKich) || 0;
  r.phongThuPct += Number(cs.phongThu) || 0;
  r.hpPct += Number(cs.khiHuyet) || 0;
  r.hoiPhucPct += Number(cs.hoiPhuc) || 0;
  r.thanThuc += Number(cs.thanThuc) || 0;
  r.thoNguyenBonus += Number(cs.thoNguyen) || 0;

  if (Number(cs.linhLuc) > 0) {
    r.congKichPct += Number(cs.linhLuc);
    r.hpPct += Number(cs.linhLuc) * 0.5;
    r.linhLucPct += Number(cs.linhLuc) * 2;
  }
  if (Number(cs.linhLucVanHanh) > 0) {
    const llvh = Number(cs.linhLucVanHanh);
    r.congKichPct += Math.round(llvh * 4) / 100;
    r.linhLucPct += Math.round(llvh * 10) / 100;
    r.hoiMpPct += Math.min(0.06, Math.round(llvh * 1.5) / 100);
    if (c.loai === 'TU_LUYEN' && r.heSoTocDo <= 1.01) {
      r.heSoTocDo += Math.min(0.2, Math.round(llvh * 4) / 100);
    }
  }
  if (Number(cs.khangTamMa) > 0) r.tiLeDotPha += Number(cs.khangTamMa);
  if (Number(cs.liemTuc) > 0) {
    r.phongThuPct += Number(cs.liemTuc);
    r.neTranhPct += Number(cs.liemTuc) * 0.5;
  }

  // Hỗ trợ cả chiSoPhang dạng số lẫn dạng object { thanThuc, thanPhap, khiVan, daoTam, canCot, ngoTinh }
  if (typeof cs.chiSoPhang === 'number') {
    r.thanThuc += cs.chiSoPhang;
  } else if (cs.chiSoPhang && typeof cs.chiSoPhang === 'object') {
    const p = cs.chiSoPhang;
    r.thanThuc += Number(p.thanThuc) || 0;
    r.ngoTinh += Number(p.ngoTinh) || 0;
    r.canCot += Number(p.canCot) || 0;
    r.khiVan += Number(p.khiVan) || 0;
    if (Number(p.thanPhap)) {
      r.neTranhPct += Number(p.thanPhap) * 0.03;
      r.chayTronPct += Number(p.thanPhap) * 0.02;
    }
    if (Number(p.daoTam)) r.tiLeDotPha += Number(p.daoTam) * 0.02;
  }

  const tierScale = 1 + (Number(c.canhGioi) || 0) * 0.25;
  if (Array.isArray(c.kyNang)) {
    for (const kn of c.kyNang) {
      const m = BI_THUAT_PASSIVE_MAP[kn.loai] || BI_THUAT_PASSIVE_MAP.HO_TRO;
      const thuDongBoost = kn.kieu === 'THU_DONG' ? 1.5 : 1.0;
      const mult = tierScale * thuDongBoost;
      if (m.congKichPct) r.congKichPct += m.congKichPct * mult;
      if (m.phongThuPct) r.phongThuPct += m.phongThuPct * mult;
      if (m.hpPct) r.hpPct += m.hpPct * mult;
      if (m.hoiPhucPct) r.hoiPhucPct += m.hoiPhucPct * mult;
      if (m.baoKichPct) r.baoKichPct += m.baoKichPct * mult;
      if (m.neTranhPct) r.neTranhPct += m.neTranhPct * mult;
      if (m.chayTronPct) r.chayTronPct += m.chayTronPct * mult;
      if (m.uyLucKnPct) r.uyLucKnPct += m.uyLucKnPct * mult;
      if (m.tocDoBonus) r.heSoTocDo += m.tocDoBonus * mult;
      if (m.thanThuc) r.thanThuc += Math.max(1, Math.round(m.thanThuc * mult));

      if (kn.kieu === 'CHU_DONG') {
        r.kyNangChuDong.push({ ...kn, nguonTen: c.ten, nguonCg: c.canhGioi ?? 0, nguonCgToiDa: c.canhGioiToiDa ?? null });
      } else if (kn.kieu === 'THU_DONG') {
        if (kn.loai === 'PHONG_THU') r.phanDamPct += 0.12;
        if (kn.loai === 'HO_TRO') r.thanThuc += 1 + Math.floor((c.canhGioi || 0) * 0.5);
      }
    }
  }

  // Giảm trừ uy lực công pháp/bí thuật cảnh giới thấp khi tu sĩ lên cảnh giới cao hơn trần
  if (apDungGiamTru && state) {
    const gt = tinhHeSoVuotCanh(c.canhGioi, c.canhGioiToiDa);
    if (gt.heSo < 1) {
      const f = gt.heSo;
      r.heSoTocDo = 1 + (r.heSoTocDo - 1) * f;
      r.tiLeDotPha *= f;
      r.congKichPct *= f;
      r.phongThuPct *= f;
      r.hpPct *= f;
      r.linhLucPct *= f;
      r.hoiPhucPct *= f;
      r.hoiMpPct *= f;
      r.baoKichPct *= f;
      r.neTranhPct *= f;
      r.chayTronPct *= f;
      r.phanDamPct *= gt.tyLeHieuUng;
      r.uyLucKnPct *= f;
      r.thanThuc = Math.floor(r.thanThuc * f);
      r.ngoTinh = Math.floor(r.ngoTinh * f);
      r.canCot = Math.floor(r.canCot * f);
      r.khiVan = Math.floor(r.khiVan * f);
      r.thoNguyenBonus = Math.floor(r.thoNguyenBonus * f);
    }
  }
  return r;
}

function tinhCongPhapTongHop() {
  const cpChinh = layCongPhapDef(state.congPhap);
  const list = [cpChinh, ...(state.biThuat || []).map(id => layCongPhapDef(id))].filter(Boolean);

  const out = {
    heSoTocDo: 1.0,
    tiLeDotPha: 0,
    congKichPct: 0,
    phongThuPct: 0,
    hpPct: 0,
    linhLucPct: 0,
    hoiPhucPct: 0,
    hoiMpPct: 0,
    baoKichPct: 0,
    neTranhPct: 0,
    chayTronPct: 0,
    phanDamPct: 0,
    uyLucKnPct: 0,
    thanThuc: 0,
    ngoTinh: 0,
    canCot: 0,
    khiVan: 0,
    thoNguyenBonus: 0,
    kyNangChuDong: []
  };

  for (const c of list) {
    const p = phanTichThuocTinhCongPhap(c);
    out.heSoTocDo *= p.heSoTocDo;
    out.tiLeDotPha += p.tiLeDotPha;
    out.congKichPct += p.congKichPct;
    out.phongThuPct += p.phongThuPct;
    out.hpPct += p.hpPct;
    out.linhLucPct += p.linhLucPct;
    out.hoiPhucPct += p.hoiPhucPct;
    out.hoiMpPct += p.hoiMpPct;
    out.baoKichPct += p.baoKichPct;
    out.neTranhPct += p.neTranhPct;
    out.chayTronPct += p.chayTronPct;
    out.phanDamPct += p.phanDamPct;
    out.uyLucKnPct += p.uyLucKnPct;
    out.thanThuc += p.thanThuc;
    out.ngoTinh += p.ngoTinh;
    out.canCot += p.canCot;
    out.khiVan += p.khiVan;
    out.thoNguyenBonus += p.thoNguyenBonus;
    out.kyNangChuDong.push(...p.kyNangChuDong);
  }
  return out;
}

function tinhTuViCan() {
  const def = layCanhGioiDef();
  return def.tuViCan[state.tieuCanh] || 99999999999;
}

function laDinhPhongDaiCanh() {
  const def = layCanhGioiDef();
  return state.tieuCanh >= def.tieuCanh.length - 1;
}

function tinhThoNguyenMax() {
  const def = layCanhGioiDef();
  const cpSum = tinhCongPhapTongHop();
  return Math.max(
    45,
    Math.round(def.thoNguyen + cpSum.thoNguyenBonus + (state.thoNguyenBonus || 0) + state.chiSo.canCot * 1.5)
  );
}

function tinhHpMax() {
  const def = layCanhGioiDef();
  const cpSum = tinhCongPhapTongHop();
  const tc = layTheChatDef();
  const heSoTieu = 1 + state.tieuCanh * 0.18;
  const goc = def.hpGoc * heSoTieu + (state.chiSo.canCot + cpSum.canCot) * (8 + Math.pow(2.3, state.canhGioi) * 5);
  return Math.max(50, Math.round(goc * Math.max(0.5, 1 + cpSum.hpPct + (tc.hpBonus || 0))));
}

// Linh lực (MP) tối đa & tiêu hao khi thi triển chiêu thức (Tác giả: Gemini (Antigravity))
function tinhMpMax() {
  const def = layCanhGioiDef();
  const cpSum = tinhCongPhapTongHop();
  const tc = layTheChatDef();
  const heSoTieu = 1 + state.tieuCanh * 0.16;
  const goc = Math.round(def.hpGoc * 0.65) * heSoTieu + (state.chiSo.thanThuc + cpSum.thanThuc) * (6 + Math.pow(2.2, state.canhGioi) * 4);
  return Math.max(40, Math.round(goc * Math.max(0.6, 1 + (cpSum.linhLucPct || 0) + (tc.tocDoBonus || 0) * 0.5)));
}

function tinhTieuHaoLinhLucPct(kn) {
  return Math.max(0.08, Math.min(0.4, (Number(kn?.phapLuc) || 0.05) + 0.08));
}

function tinhTieuHaoLinhLuc(kn) {
  return Math.max(8, Math.round(tinhMpMax() * tinhTieuHaoLinhLucPct(kn)));
}

// Cơ chế Thương thế của Người chơi: 0 Khỏe mạnh, 1 Thương nhẹ, 2 Trọng thương, 3 Nguy kịch (Tác giả: Gemini (Antigravity))
const THUONG_THE_PLAYER_DEF = [
  { cap: 0, ten: 'Khỏe mạnh', heSoChienDau: 1.0, heSoTuLuyen: 1.0, phatDotPha: 0, cls: 'hl-green' },
  { cap: 1, ten: 'Thương nhẹ (-10%)', heSoChienDau: 0.9, heSoTuLuyen: 0.9, phatDotPha: 0, cls: 'hl-gold' },
  { cap: 2, ten: 'Trọng thương (-22%)', heSoChienDau: 0.78, heSoTuLuyen: 0.75, phatDotPha: -0.1, cls: 'hl-danger' },
  { cap: 3, ten: 'Nguy kịch (-35% · Khóa Đột phá)', heSoChienDau: 0.65, heSoTuLuyen: 0.55, phatDotPha: -0.25, cls: 'hl-danger' }
];

function layThuongTheDef() {
  const cap = Math.max(0, Math.min(3, Math.round(state?.thuongThe || 0)));
  return THUONG_THE_PLAYER_DEF[cap];
}

function tangThuongThePlayer(soBac = 1, lyDo = '') {
  if (!state || state.ketThuc) return;
  const cu = state.thuongThe || 0;
  const moi = Math.min(3, cu + Math.max(1, soBac));
  state.thuongThe = moi;
  if (moi > cu) {
    const def = layThuongTheDef();
    ghiNhatKy(`🩹 Do ${lyDo || 'chấn thương nặng'}, thể trạng chuyển sang 【${def.ten}】!`, 'nguy_hiem');
  }
}

function hoiPhucThuongThe(soBac = 1) {
  if (!state || (state.thuongThe || 0) <= 0) return false;
  state.thuongThe = Math.max(0, (state.thuongThe || 0) - Math.max(1, soBac));
  return true;
}

function dieuDuongThuongThe() {
  if (!state || state.ketThuc || state.tranHienTai || state.hauChienNpc || state.suKienHienTai || state.biCanhHienTai) return;
  if ((state.thuongThe || 0) <= 0 && state.hp >= tinhHpMax()) return;
  tienThoiGian(2);
  if (state.ketThuc) {
    luuGame();
    veGiaoDien();
    return;
  }
  const hoiHp = Math.max(20, Math.round(tinhHpMax() * 0.35));
  const hoiMp = Math.max(15, Math.round(tinhMpMax() * 0.4));
  state.hp = Math.min(tinhHpMax(), state.hp + hoiHp);
  state.mp = Math.min(tinhMpMax(), (state.mp ?? 0) + hoiMp);
  const daHa = hoiPhucThuongThe(1);
  const ttMoi = layThuongTheDef().ten;
  ghiNhatKy(
    `🩺 Tĩnh tọa điều tức dưỡng thương (2 tháng): +${hoiHp.toLocaleString()} HP, +${hoiMp.toLocaleString()} LL${daHa ? `, thương thế hồi phục còn 【${ttMoi}】` : ''}.`,
    'tot'
  );
  luuGame();
  veGiaoDien();
}

function layThuocTinhPhapBao(pb) {
  if (!pb) return [];
  if (Array.isArray(pb.he) && pb.he.length > 0) return pb.he;
  const txt = `${pb.ten || ''} ${pb.moTa || ''}`.toLowerCase();
  const res = [];
  if (/kiếm|đao|kim|thiết|đồng|chung|nhận|kích|thương|chùy/.test(txt)) res.push('KIM');
  if (/hỏa|diễm|chu|viêm|lò|xích|nhật|phượng/.test(txt)) res.push('HOA');
  if (/băng|hàn|tuyết|sương/.test(txt)) res.push('BANG');
  else if (/thủy|hải|lam|giang|lộ/.test(txt)) res.push('THUY');
  if (/mộc|thanh|liên|trúc|diệp|thảo|hoa|gỗ/.test(txt)) res.push('MOC');
  if (/thổ|sơn|ấn|đỉnh|thạch|hoàng/.test(txt)) res.push('THO');
  if (/lôi|sét|điện/.test(txt)) res.push('LOI');
  if (/phong|vũ|phi|dực/.test(txt)) res.push('PHONG');
  if (/âm|hồn|ma|quỷ|cốt|huyết|thi/.test(txt)) res.push('AM');
  return res.slice(0, 2);
}

function tinhTuongThichPhapBao(pb = state?.phapBao ? layVatPhamDef(state.phapBao) : null) {
  if (!pb) return { khop: 'khong', pbMult: 1.0, he: [], label: '' };
  const pbHe = layThuocTinhPhapBao(pb);
  if (pbHe.length === 0) return { khop: 'trung_tinh', pbMult: 1.0, he: [], label: 'Vô thuộc tính' };
  const myHe = Array.isArray(state?.linhCanHe) ? state.linhCanHe : [];
  if (pbHe.some(h => myHe.includes(h))) {
    return { khop: 'hop', pbMult: 1.15, he: pbHe, label: `${tenHeLinhCanText(pbHe)} · Hợp hệ +15%` };
  }
  return { khop: 'lech', pbMult: 0.90, he: pbHe, label: `${tenHeLinhCanText(pbHe)} · Lệch hệ -10%` };
}

// Mô tả ngắn gọn từng chiêu thức để hiển thị trong Cửa hàng, Túi đồ và Chiến đấu (Tác giả: Gemini (Antigravity))
const KY_NANG_LOAI_NHAN = {
  TAN_CONG: 'Tấn công',
  PHONG_THU: 'Phòng thủ',
  TRI_LIEU: 'Trị liệu',
  KHONG_CHE: 'Khống chế',
  DON_THUAT: 'Độn thuật',
  HO_TRO: 'Hỗ trợ'
};

function moTaKyNangNgan(kn) {
  if (!kn) return '';
  const kieuTxt = kn.kieu === 'THU_DONG' ? 'Thụ động' : 'Chủ động';
  const loaiTxt = KY_NANG_LOAI_NHAN[kn.loai] || kn.loai || 'Bí thuật';
  const heSoTxt = kn.kieu === 'CHU_DONG' && Number(kn.heSo) > 0 ? ` x${kn.heSo}` : '';
  const mpTxt = kn.kieu === 'CHU_DONG' ? ` · ${Math.round(tinhTieuHaoLinhLucPct(kn) * 100)}% LL` : '';
  const cdTxt = kn.kieu === 'CHU_DONG' ? ` · CD ${kn.hoiChieu || 0}h` : '';
  let extra = '';
  if (kn.kieu === 'CHU_DONG') {
    if (kn.loai === 'TRI_LIEU') extra = ' (Hồi HP + Hồi xuân 2 lượt)';
    else if (kn.loai === 'DON_THUAT') extra = ' (+35% Né 2 lượt · +30% Chạy)';
    else if (kn.loai === 'PHONG_THU') extra = ' (-65% ST nhận · Phản đòn 20%)';
    else if (kn.loai === 'KHONG_CHE') extra = ' (Choáng địch 1 lượt)';
    else if (kn.loai === 'HO_TRO') extra = ' (+25% Công · +10% Bạo)';
  }
  return `${kn.ten} [${kieuTxt} · ${loaiTxt}${heSoTxt}${mpTxt}${cdTxt}]${extra}`;
}

function moTaCongPhapNgan(cp) {
  if (!cp) return '';
  const parts = [];
  const heTxt = Array.isArray(cp.he) && cp.he.length > 0 ? tenHeLinhCanText(cp.he) : 'Vô hệ';
  parts.push(`Hệ: ${heTxt}`);
  const p = phanTichThuocTinhCongPhap(cp, false);
  if (p.heSoTocDo > 1.005) parts.push(`Tu luyện x${p.heSoTocDo.toFixed(2).replace(/\.00$/, '')}`);
  if (p.tiLeDotPha > 0) parts.push(`Đột phá +${Math.round(p.tiLeDotPha * 100)}%`);
  if (p.congKichPct > 0) parts.push(`Công +${Math.round(p.congKichPct * 100)}%`);
  if (p.phongThuPct > 0) parts.push(`Thủ +${Math.round(p.phongThuPct * 100)}%`);
  if (p.hpPct > 0) parts.push(`HP +${Math.round(p.hpPct * 100)}%`);
  if (p.linhLucPct > 0) parts.push(`Linh lực +${Math.round(p.linhLucPct * 100)}%`);
  if (p.hoiPhucPct > 0) parts.push(`Hồi phục +${Math.round(p.hoiPhucPct * 100)}%`);
  if (p.baoKichPct > 0) parts.push(`Bạo +${Math.round(p.baoKichPct * 100)}%`);
  if (p.neTranhPct > 0) parts.push(`Né +${Math.round(p.neTranhPct * 100)}%`);
  if (p.uyLucKnPct > 0) parts.push(`Uy lực chiêu +${Math.round(p.uyLucKnPct * 100)}%`);
  if (p.phanDamPct > 0) parts.push(`Phản đòn +${Math.round(p.phanDamPct * 100)}%`);
  if (p.chayTronPct > 0) parts.push(`Độn tẩu +${Math.round(p.chayTronPct * 100)}%`);
  if (p.thanThuc > 0) parts.push(`Thần thức +${p.thanThuc}`);
  if (p.ngoTinh > 0) parts.push(`Ngộ tính +${p.ngoTinh}`);
  if (p.canCot > 0) parts.push(`Căn cốt +${p.canCot}`);
  if (p.khiVan > 0) parts.push(`Khí vận +${p.khiVan}`);
  if (Array.isArray(cp.kyNang) && cp.kyNang.length > 0) {
    parts.push(`Chiêu: ${cp.kyNang.map(moTaKyNangNgan).join('; ')}`);
  }
  if (state) {
    const gt = tinhHeSoVuotCanh(cp.canhGioi, cp.canhGioiToiDa);
    if (gt.nhan) parts.push(gt.nhan);
  }
  return parts.join(' · ');
}

// Rank vật phẩm (cố định theo bậc) vs Phẩm chất chất lượng (random từng món: Hạ/Trung/Thượng/Cực phẩm) (Tác giả: Gemini (Antigravity))
const PHAM_CHAT_CHAT_LUONG = [
  { key: 'ha', ten: 'Hạ phẩm', heSo: 0.85, trongSo: 42, cls: 'muted' },
  { key: 'trung', ten: 'Trung phẩm', heSo: 1.0, trongSo: 35, cls: '' },
  { key: 'thuong', ten: 'Thượng phẩm', heSo: 1.25, trongSo: 17, cls: 'hl-realm' },
  { key: 'cuc', ten: 'Cực phẩm', heSo: 1.55, trongSo: 6, cls: 'hl-gold' }
];

const RANK_BAC_NHAN = ['Phàm giai', 'Nhất giai', 'Nhị giai', 'Tam giai', 'Tứ giai', 'Ngũ giai', 'Lục giai', 'Thất giai', 'Bát giai', 'Cửu giai'];

function tachItemKey(itemKey) {
  const s = String(itemKey || '');
  const i = s.indexOf('@');
  if (i < 0) return { baseId: s, pcKey: 'trung', fullKey: s };
  return { baseId: s.slice(0, i), pcKey: s.slice(i + 1) || 'trung', fullKey: s };
}

function rollPhamChatKey() {
  const picked = pickWeighted(PHAM_CHAT_CHAT_LUONG);
  return picked ? picked.key : 'trung';
}

function taoItemKey(baseOrFull, pcOverride = null) {
  const { baseId, pcKey } = tachItemKey(baseOrFull);
  const key = pcOverride || (String(baseOrFull || '').includes('@') ? pcKey : rollPhamChatKey());
  return `${baseId}@${key}`;
}

function layPhamChatVatPham(itemKeyOrPcKey) {
  const s = String(itemKeyOrPcKey || '');
  const pcKey = s.includes('@') ? tachItemKey(s).pcKey : s;
  return PHAM_CHAT_CHAT_LUONG.find(p => p.key === pcKey) || PHAM_CHAT_CHAT_LUONG[1];
}

function layRankVatPham(vp) {
  if (!vp) return 'Phàm phẩm';
  if (vp.loai === 'linh_thao') return layBacLinhThao(vp).tenBac;
  if (vp.loai === 'phap_bao') {
    if (vp.phanCap) return vp.phanCap;
    const cg = Number(vp.canhGioi ?? 0);
    if (cg <= 0) return 'Binh khí thế tục';
    if (cg === 1) return 'Pháp khí';
    if (cg === 2) return 'Linh khí';
    if (cg === 3) return 'Phù bảo';
    if (cg <= 5) return 'Pháp bảo';
    return 'Thông Thiên Linh Bảo';
  }
  const c = Math.max(0, Math.min(9, Number(vp.canhGioi ?? vp.bac ?? 0) || 0));
  return RANK_BAC_NHAN[c] || 'Tiên giai';
}

function moTaVatPhamNgan(vp, itemKey = null) {
  if (!vp) return '';
  const pc = layPhamChatVatPham(itemKey);
  const rankTen = layRankVatPham(vp);
  const heSo = pc.heSo || 1;
  const parts = [`Bậc: ${rankTen}`, `${pc.ten}`];
  if (vp.loai === 'phap_bao') {
    const tt = tinhTuongThichPhapBao(vp);
    const heTxt = tt.he.length > 0 ? tenHeLinhCanText(tt.he) : 'Vô hệ';
    const atk = Math.round((Number(vp.congKich) || 0) * heSo);
    const def = Math.round((Number(vp.phongThu) || 0) * heSo);
    parts.push(`⚔️ Công +${atk.toLocaleString()}`, `🛡️ Thủ +${def.toLocaleString()}`, `Hệ: ${heTxt}`);
    if (state) {
      const pbGt = tinhHeSoVuotCanh(layCanhGioiPhapBao(vp), /Thông Thiên Linh Bảo/i.test(vp.phanCap || '') ? 9 : null);
      if (pbGt.nhan) parts.push(pbGt.nhan);
    }
  } else if (vp.loai === 'dan' && vp.hieuUng) {
    const hu = vp.hieuUng;
    if (hu.hp) parts.push(`❤️ Hồi +${Math.round(Number(hu.hp) * heSo).toLocaleString()} HP`);
    if (hu.tuVi) parts.push(`✨ +${Math.round(Number(hu.tuVi) * heSo).toLocaleString()} Tu vi`);
    if (hu.bonusDotPha) {
      const bGoc = Number(hu.bonusDotPha) > 1 ? Number(hu.bonusDotPha) : Math.round(Number(hu.bonusDotPha) * 100);
      parts.push(`⚡ Đột phá +${Math.round(bGoc * heSo)}%`);
    }
    if (hu.thoNguyen) parts.push(`⏳ +${hu.thoNguyen} năm Thọ`);
  } else if (vp.loai === 'linh_thao') {
    parts.push(`🌱 Chín ${layBacLinhThao(vp).namChin} năm`);
  } else if (vp.loai === 'tru_vat' && vp.sucChua) {
    parts.push(`🎒 +${vp.sucChua} ô`);
  }
  return parts.join(' · ');
}

function tinhCongKich() {
  const def = layCanhGioiDef();
  const cpSum = tinhCongPhapTongHop();
  const lc = layLinhCanDef();
  const tc = layTheChatDef();
  const tuongThich = tinhTuongThichLinhCan();
  const pb = state.phapBao ? layVatPhamDef(state.phapBao) : null;
  const pbCompat = tinhTuongThichPhapBao(pb);
  const pbPcMult = state.phapBao ? layPhamChatVatPham(state.phapBao).heSo : 1;
  const pbGt = pb ? tinhHeSoVuotCanh(layCanhGioiPhapBao(pb), /Thông Thiên Linh Bảo/i.test(pb.phanCap || '') ? 9 : null) : { heSo: 1 };
  const heSoTieu = 1 + state.tieuCanh * 0.16;
  let atk =
    def.congKichGoc * heSoTieu +
    Math.round((pb ? Number(pb.congKich) || 0 : 0) * pbPcMult * pbCompat.pbMult * pbGt.heSo) +
    (state.chiSo.thanThuc + cpSum.thanThuc) * Math.max(2, Math.pow(2.2, state.canhGioi));
  atk *= Math.max(0.5, 1 + cpSum.congKichPct + (lc.bonusChienDau || 0) + (tc.chienDauBonus || 0) + tuongThich.atkBonus);
  atk *= layThuongTheDef().heSoChienDau;
  return Math.round(atk);
}

function tinhPhongThu() {
  const def = layCanhGioiDef();
  const cpSum = tinhCongPhapTongHop();
  const tc = layTheChatDef();
  const pb = state.phapBao ? layVatPhamDef(state.phapBao) : null;
  const pbCompat = tinhTuongThichPhapBao(pb);
  const pbPcMult = state.phapBao ? layPhamChatVatPham(state.phapBao).heSo : 1;
  const pbGt = pb ? tinhHeSoVuotCanh(layCanhGioiPhapBao(pb), /Thông Thiên Linh Bảo/i.test(pb.phanCap || '') ? 9 : null) : { heSo: 1 };
  const heSoTieu = 1 + state.tieuCanh * 0.15;
  const p =
    def.phongThuGoc * heSoTieu +
    Math.round((pb ? Number(pb.phongThu) || 0 : 0) * pbPcMult * pbCompat.pbMult * pbGt.heSo) +
    (state.chiSo.canCot + cpSum.canCot) * Math.max(1.5, Math.pow(2.0, state.canhGioi));
  return Math.round(p * Math.max(0.5, 1 + cpSum.phongThuPct + (tc.phongThuBonus || 0)) * layThuongTheDef().heSoChienDau);
}

function tinhBaoKichPct() {
  const tc = layTheChatDef();
  const cpSum = tinhCongPhapTongHop();
  return Math.max(
    0.02,
    Math.min(
      0.55,
      0.05 +
        (state.chiSo.khiVan + cpSum.khiVan) * 0.0025 +
        (state.chiSo.ngoTinh + cpSum.ngoTinh) * 0.002 +
        (tc.baoKichBonus || 0) +
        cpSum.baoKichPct
    )
  );
}

function tinhNeTranhPct() {
  const tc = layTheChatDef();
  const cpSum = tinhCongPhapTongHop();
  return Math.max(
    0.01,
    Math.min(0.45, (state.chiSo.khiVan + cpSum.khiVan) * 0.0035 + (tc.neTranhBonus || 0) + cpSum.neTranhPct)
  );
}

function tinhUyLucKyNang() {
  const cpSum = tinhCongPhapTongHop();
  return (1 + (state.chiSo.ngoTinh + cpSum.ngoTinh) * 0.008) * (1 + cpSum.uyLucKnPct);
}

// Công thức sát thương tỷ lệ giáp + bạo kích + né tránh (không bị 0 dmg hay 1-hit vô lý)
function tinhSatThuong(atk, def, heSoChieu = 1.0, critPct = 0.05, evadePct = 0, boQuaGiapPct = 0) {
  if (evadePct > 0 && Math.random() < evadePct) {
    return { dmg: 0, ne: true, baoKich: false };
  }
  const defThuc = Math.max(0, def * (1 - boQuaGiapPct));
  const heSoGiamGiap = atk / Math.max(1, atk + defThuc * 0.9);
  const ngauNhien = 0.9 + Math.random() * 0.22;
  let dmg = atk * heSoChieu * heSoGiamGiap * ngauNhien;
  const baoKich = critPct > 0 && Math.random() < critPct;
  if (baoKich) dmg *= 1.55;
  const toiThieu = Math.max(3, Math.round(atk * heSoChieu * 0.12));
  return { dmg: Math.max(toiThieu, Math.round(dmg)), ne: false, baoKich };
}

function coDongPhu() {
  return !!state && !!state.dongPhu && !!state.dongPhu.vungId;
}

function dangODongPhu() {
  return coDongPhu() && state.vungHienTai === state.dongPhu.vungId;
}

// Linh khí Động Phủ = Linh khí vùng đặt động phủ * (1 + (cap - 1) * 0.25)
function tinhLinhKhiDongPhu() {
  if (!coDongPhu()) return layVungDef().linhKhi || 1;
  const dpVung = layVungDef(state.dongPhu.vungId);
  const lk = (dpVung.linhKhi || 1) * (1 + (Math.max(1, state.dongPhu.cap) - 1) * 0.25);
  return Math.round(lk * 100) / 100;
}

function tinhLinhKhiHienTaiTuLuyen() {
  return dangODongPhu() ? tinhLinhKhiDongPhu() : layVungDef().linhKhi || 1;
}

// Nén bội số linh khí để giữ cân bằng từ Phàm Giới (0.65) đến Động Phủ Linh Giới (15+)
function tinhHeSoLinhKhi(lk) {
  const val = Math.max(0.45, Number(lk) || 1);
  if (val <= 1) return Math.max(0.55, val);
  return 1 + Math.sqrt(val - 1) * 0.45;
}

function tinhTocDoTuLuyenNam() {
  const def = layCanhGioiDef();
  const lc = layLinhCanDef();
  const tc = layTheChatDef();
  const cp = layCongPhapDef();
  const cpSum = tinhCongPhapTongHop();
  const tuongThich = tinhTuongThichLinhCan();

  // Nếu tu công pháp vượt trần canhGioiToiDa của công pháp đó -> giảm tốc độ
  const vuotTran = cp.canhGioiToiDa !== undefined && state.canhGioi > cp.canhGioiToiDa ? 0.55 : 1.0;
  const heSoLinhCan = lc.heSoTuLuyen || 1.0;
  const heSoLinhKhi = tinhHeSoLinhKhi(tinhLinhKhiHienTaiTuLuyen());
  const heSoHoTro = Math.max(
    0.5,
    1 +
      (cpSum.heSoTocDo - 1) +
      (tc.tocDoBonus || 0) +
      (tuongThich.tocDoMult - 1) +
      (state.chiSo.ngoTinh + cpSum.ngoTinh + cpSum.thanThuc * 0.4) * 0.008
  );
  const base = def.baseTuViNam || 40;
  return Math.max(10, Math.round(base * heSoLinhCan * heSoLinhKhi * heSoHoTro * vuotTran * layThuongTheDef().heSoTuLuyen));
}

function timDanDotPhaTrongTui() {
  const cgHienTai = state.canhGioi;
  let best = null;
  for (const [id, sl] of Object.entries(state.tuiDo || {})) {
    if (sl <= 0) continue;
    const vp = layVatPhamDef(id);
    if (!vp || vp.loai !== 'dan') continue;
    const rawBonus = Number(vp.hieuUng?.bonusDotPha) || 0;
    if (rawBonus <= 0) continue;
    const bonus = rawBonus * layPhamChatVatPham(id).heSo;
    // Hợp dùng cho đột phá từ cgHienTai -> cgHienTai + 1
    if (vp.canhGioi === cgHienTai || vp.canhGioi === cgHienTai + 1) {
      if (!best || bonus > best.bonus) best = { vp, vpKey: id, bonus };
    }
  }
  return best;
}

function tinhTiLeDotPhaDaiCanh() {
  const def = layCanhGioiDef();
  const lc = layLinhCanDef();
  const tc = layTheChatDef();
  const cpSum = tinhCongPhapTongHop();
  let tiLe =
    (def.tiLeDotPha || 0.2) +
    (lc.bonusDotPha || 0) +
    (tc.dotPhaBonus || 0) +
    cpSum.tiLeDotPha +
    (layThuongTheDef().phatDotPha || 0) +
    (state.chiSo.khiVan + cpSum.khiVan + state.chiSo.thanThuc + cpSum.thanThuc) * 0.0025;

  if (state.dotPhaBuff > 0) {
    tiLe += state.dotPhaBuff;
  } else {
    const bestPill = timDanDotPhaTrongTui();
    if (bestPill) tiLe += bestPill.bonus;
  }
  return Math.max(0.05, Math.min(0.95, tiLe));
}

// ==========================================
// 3. TÚI ĐỒ & TRÔI THỜI GIAN
// ==========================================

function soLuongVat(idOrKey) {
  if (!state || !state.tuiDo || !idOrKey) return 0;
  const s = String(idOrKey);
  if (s.includes('@')) return state.tuiDo[s] || 0;
  let tong = state.tuiDo[s] || 0;
  const prefix = `${s}@`;
  for (const [k, sl] of Object.entries(state.tuiDo)) {
    if (sl > 0 && k.startsWith(prefix)) tong += sl;
  }
  return tong;
}

function soOTrongTui() {
  return Object.values(state.tuiDo || {}).filter(sl => sl > 0).length;
}

function giaNangCapTuiDo() {
  const cur = state.tuiDoMaxO || 10;
  const buoc = Math.max(0, Math.floor((cur - 10) / 5));
  return Math.round(60 * Math.pow(1.42, buoc));
}

function nangCapTuiDo() {
  const cur = state.tuiDoMaxO || 10;
  if (cur >= MAX_TUI_DO_O) {
    ghiNhatKy(`Túi trữ vật đã đạt giới hạn tối đa ${MAX_TUI_DO_O} ô!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  const gia = giaNangCapTuiDo();
  if (state.linhThach < gia) {
    ghiNhatKy(`Cần ${gia.toLocaleString()} Linh thạch để luyện chế mở rộng Túi trữ vật (+5 ô)!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  state.linhThach -= gia;
  state.tuiDoMaxO = Math.min(MAX_TUI_DO_O, cur + 5);
  ghiNhatKy(`🎒 Mở rộng không gian Túi trữ vật lên ${state.tuiDoMaxO}/${MAX_TUI_DO_O} ô!`, 'tot');
  luuGame();
  veGiaoDien();
}

function themVat(idOrKey, soLuong = 1, pcOverride = null) {
  if (!idOrKey || soLuong === 0) return false;
  const s = String(idOrKey);
  if (soLuong > 0) {
    const targetKey = s.includes('@') ? s : taoItemKey(s, pcOverride || rollPhamChatKey());
    const hienCo = state.tuiDo[targetKey] || 0;
    const maxO = state.tuiDoMaxO || 10;
    if (hienCo === 0 && soOTrongTui() >= maxO) {
      const vp = layVatPhamDef(targetKey);
      ghiNhatKy(
        `⚠️ Túi trữ vật đã đầy (${soOTrongTui()}/${maxO} ô), không thể nhặt thêm [${vp ? vp.ten : targetKey}]! Hãy vào Cửa Hàng bán bớt đồ hoặc mở rộng túi.`,
        'canh_bao'
      );
      return false;
    }
    state.tuiDo[targetKey] = hienCo + soLuong;
    return true;
  }

  // Trừ số lượng (soLuong < 0): nếu truyền fullKey thì trừ đúng ô đó, nếu truyền baseId thì ưu tiên trừ từ phẩm chất thấp trước
  let canTru = Math.abs(soLuong);
  if (s.includes('@') || (state.tuiDo[s] || 0) >= canTru) {
    const hienCo = state.tuiDo[s] || 0;
    const moi = Math.max(0, hienCo - canTru);
    if (moi === 0) delete state.tuiDo[s];
    else state.tuiDo[s] = moi;
    return hienCo > 0;
  }
  const thuTu = ['ha', 'trung', 'thuong', 'cuc'];
  const keys = thuTu.map(p => `${s}@${p}`).concat([s]);
  for (const k of keys) {
    if (canTru <= 0) break;
    const co = state.tuiDo[k] || 0;
    if (co <= 0) continue;
    const tru = Math.min(co, canTru);
    canTru -= tru;
    if (co - tru <= 0) delete state.tuiDo[k];
    else state.tuiDo[k] = co - tru;
  }
  return true;
}

function capBacQuanHe(npc) {
  if (!npc) return 'Người xa lạ';
  if (npc.laDaoLuNguoiChoi) return 'Đạo lữ';
  const hc = npc.haoCam || 0;
  if (hc >= 80) return 'Tri kỷ';
  if (hc >= 40) return 'Bạn tốt';
  if (hc >= 15) return 'Quen biết';
  if (hc > 0) return 'Sơ giao';
  if (hc === 0) return 'Người xa lạ';
  if (hc >= -30) return 'Lạnh nhạt';
  return 'Cừu địch';
}

function thayDoiHaoCam(npc, delta, capNhatTuongTac = true) {
  if (!npc) return 0;
  const base = typeof npc.haoCamRaw === 'number' ? npc.haoCamRaw : Number(npc.haoCam) || 0;
  const moi = Math.max(-100, Math.min(100, base + delta));
  npc.haoCamRaw = moi;
  npc.haoCam = Math.round(moi);
  if (capNhatTuongTac && state) npc.namTuongTacCuoi = state.nam;
  return npc.haoCam;
}

function giamHaoCamTheoNam(npc, namBuoc) {
  if (!npc || npc.laDaoLuNguoiChoi) return; // Đạo lữ không bị trừ điểm theo năm
  if (state.nam - (npc.namTuongTacCuoi || 0) < 1) return;
  const cur = typeof npc.haoCamRaw === 'number' ? npc.haoCamRaw : Number(npc.haoCam) || 0;
  if (cur === 0) return;

  let next = cur;
  if (cur >= 80) {
    // Tri kỷ: giảm cực chậm (-0.25/năm), giữ nền tối thiểu 70
    next = Math.max(70, cur - 0.25 * namBuoc);
  } else if (cur >= 40) {
    // Bạn tốt: giảm chậm (-0.5/năm)
    next = Math.max(25, cur - 0.5 * namBuoc);
  } else if (cur > 0) {
    // Quen biết / Sơ giao: giảm về 0 (-1/năm)
    next = Math.max(0, cur - 1.0 * namBuoc);
  } else if (cur > -80) {
    // Lạnh nhạt / Cừu địch nhẹ: nguội dần về 0 (+0.5/năm)
    next = Math.min(0, cur + 0.5 * namBuoc);
  }
  npc.haoCamRaw = next;
  npc.haoCam = Math.round(next);
}

function laBanTotTroLen(npc) {
  return !!npc && (npc.laDaoLuNguoiChoi || (npc.haoCam || 0) >= 40);
}

function ghiKyUcNpc(npc, msg) {
  if (!npc) return;
  if (!Array.isArray(npc.kyUc)) npc.kyUc = [];
  npc.kyUc.push(`Năm ${state.nam}: ${msg}`);
  if (npc.kyUc.length > 12) npc.kyUc.shift();
}

// CHỈ báo tin ra Nhật ký khi người chơi đang ở cùng vùng VÀ mức thân thiết từ Bạn tốt (>= 40) trở lên
function baoTinNpc(npc, msg, loai = 'thuong') {
  ghiKyUcNpc(npc, msg);
  if (npc.vungId === state.vungHienTai && laBanTotTroLen(npc)) {
    ghiNhatKy(`🕊️ [Tin tức ${capBacQuanHe(npc)} · ${npc.ten}] ${msg}`, loai);
  }
}

function chayVongDoiNpc(namBuoc) {
  if (!state || !state.npcs || namBuoc <= 0) return;
  const allList = Object.values(state.npcs);
  const aliveByVung = {};
  const aliveList = [];

  // 1. Lão - Bệnh - Tử & Tu luyện - Đột phá
  for (const npc of allList) {
    if (!npc.conSong) continue;
    if (typeof npc.tuoi !== 'number') {
      const def = layCanhGioiDef(npc.canhGioi);
      npc.tuoi = 20 + npc.canhGioi * 20;
      npc.thoNguyen = npc.thoNguyen || def.thoNguyen;
      npc.thuongThe = npc.thuongThe || 0;
      npc.quenBiet = npc.quenBiet || [];
      npc.banBe = npc.banBe || [];
      npc.cuuNhan = npc.cuuNhan || [];
    }

    npc.tuoi += namBuoc;
    giamHaoCamTheoNam(npc, namBuoc);

    // Bệnh tật / Thương thế: tự hồi phục hoặc nặng thêm
    if (npc.thuongThe > 0) {
      if (Math.random() < (npc.thuongThe === 1 ? 0.45 : 0.25)) {
        npc.thuongThe = Math.max(0, npc.thuongThe - 1);
        if (npc.thuongThe === 0) {
          baoTinNpc(npc, `${npc.ten} đã điều dưỡng khỏi hẳn ám tật, khôi phục phong độ đỉnh cao.`, 'tot');
        }
      } else if (npc.thuongThe >= 3 && Math.random() < 0.25) {
        npc.conSong = false;
        npc.lyDoMat = 'Trọng thương phát tác, đạo cơ tan vỡ';
        baoTinNpc(npc, `${npc.ten} vì trọng thương lâu ngày không lành đã vẫn lạc tại ${layVungDef(npc.vungId).ten}.`, 'nguy_hiem');
        continue;
      }
    }

    // Kiểm tra hết thọ nguyên (Lão -> Tử)
    const thoThucTe = Math.max(40, (npc.thoNguyen || 80) - (npc.thuongThe || 0) * 15);
    if (npc.tuoi >= thoThucTe) {
      npc.conSong = false;
      npc.lyDoMat = 'Thọ nguyên cạn kiệt, tọa hóa';
      baoTinNpc(npc, `${npc.ten} thọ nguyên đã hết ở tuổi ${npc.tuoi}, yên lặng tọa hóa trong động phủ.`, 'canh_bao');
      continue;
    }

    // Tu luyện & Đột phá (ảnh hưởng bởi Tư chất NPC)
    const cgDef = layCanhGioiDef(npc.canhGioi);
    const vung = layVungDef(npc.vungId);
    const lc = layLinhCanDef(npc.linhCan);
    const tcNpc = layTuChatNpc(npc.tuChat);
    const heSoThuong = npc.thuongThe === 0 ? 1 : npc.thuongThe === 1 ? 0.7 : 0.4;
    const tvMoiNam = (cgDef.baseTuViNam || 40) * (lc.heSoTuLuyen || 1) * tcNpc.heSoTocDo * tinhHeSoLinhKhi(vung.linhKhi || 1) * heSoThuong;
    npc.tuVi = (npc.tuVi || 0) + Math.round(tvMoiNam * namBuoc * (0.8 + Math.random() * 0.4));

    const tieuCan = cgDef.tuViCan[npc.tieuCanh || 0] || 999999999;
    if (npc.tuVi >= tieuCan && npc.thuongThe < 3) {
      const tieuMax = (cgDef.tieuCanh || []).length - 1;
      if ((npc.tieuCanh || 0) < tieuMax) {
        npc.tuVi -= tieuCan;
        npc.tieuCanh = (npc.tieuCanh || 0) + 1;
      } else if (npc.canhGioi < 9) {
        const tiLe = Math.min(0.85, (cgDef.tiLeDotPha || 0.25) + (lc.bonusDotPha || 0) + 0.15);
        if (Math.random() < tiLe) {
          npc.tuVi = 0;
          npc.canhGioi += 1;
          npc.tieuCanh = 0;
          const moiDef = layCanhGioiDef(npc.canhGioi);
          npc.thoNguyen = Math.max(npc.thoNguyen, moiDef.thoNguyen);
          npc.hp = Math.round(moiDef.hpGoc * 1.25 * tcNpc.heSoChienDau);
          npc.congKich = Math.round(moiDef.congKichGoc * 1.15 * tcNpc.heSoChienDau);
          npc.phongThu = Math.round(moiDef.phongThuGoc * 1.15 * tcNpc.heSoChienDau);
          baoTinNpc(npc, `${npc.ten} bế quan khổ tu, thuận lợi đột phá lên 【${moiDef.ten}】!`, 'dai_cat');
        } else {
          npc.tuVi = Math.round(tieuCan * 0.6);
          if (npc.canhGioi >= 6 && Math.random() < 0.18) {
            npc.conSong = false;
            npc.lyDoMat = 'Bỏ mạng dưới Thiên Kiếp khi xung kích đại cảnh';
            baoTinNpc(npc, `${npc.ten} xung kích đại cảnh giới thất bại, hình thần câu diệt dưới Thiên Kiếp!`, 'nguy_hiem');
            continue;
          } else {
            npc.thuongThe = Math.min(3, (npc.thuongThe || 0) + 1);
            baoTinNpc(npc, `${npc.ten} xung kích đại cảnh thất bại, kinh mạch phản phệ trọng thương.`, 'canh_bao');
          }
        }
      }
    }

    aliveList.push(npc);
    (aliveByVung[npc.vungId] = aliveByVung[npc.vungId] || []).push(npc);
  }

  // 2. Du lịch, Thám hiểm, Kết giao, Đạo lữ, Ân oán (chạy trên một tỷ lệ NPC mỗi nhịp)
  const vungPool = window.PN_DATA.vungDat || [];
  for (const npc of aliveList) {
    if (!npc.conSong) continue;
    const r = Math.random();

    // Du lịch sang vùng khác (~7%) — giữ đúng giới diện Nhân Giới (<=5) hoặc Linh/Ma Giới (>=6)
    if (r < 0.07 && npc.thuongThe < 2 && vungPool.length > 0) {
      const hopVung = vungPool.filter(v => {
        if (v.id === npc.vungId) return false;
        const vCg = v.canhGioiYeuCau || 0;
        if (npc.canhGioi >= 6) return vCg >= 6 && vCg <= npc.canhGioi;
        return vCg <= Math.min(5, npc.canhGioi) && vCg >= Math.max(0, npc.canhGioi - 2);
      });
      if (hopVung.length > 0) {
        const dich = pickRandom(hopVung);
        npc.vungId = dich.id;
        baoTinNpc(npc, `${npc.ten} rời động phủ du lịch tới 【${dich.ten}】 tìm kiếm cơ duyên.`, 'thuong');
      }
      continue;
    }

    // Thám hiểm bí cảnh / di tích (~6%)
    if (r < 0.13) {
      const bcVung = (window.PN_DATA.biCanh || []).filter(b => b.vungId === npc.vungId && npc.canhGioi >= b.canhGioiMin && npc.canhGioi <= b.canhGioiMax);
      const tenNoi = bcVung.length > 0 ? pickRandom(bcVung).ten : `di tích cổ tại ${layVungDef(npc.vungId).ten}`;
      const kq = Math.random();
      if (kq < 0.65) {
        const lt = Math.round(50 * Math.pow(2.4, npc.canhGioi));
        npc.linhThach = (npc.linhThach || 0) + lt;
        npc.tuVi = (npc.tuVi || 0) + Math.round((layCanhGioiDef(npc.canhGioi).baseTuViNam || 50) * 1.5);
        baoTinNpc(npc, `${npc.ten} thám hiểm ${tenNoi} thu hoạch khá nhiều linh thạch và cơ duyên.`, 'tot');
      } else if (kq < 0.92) {
        npc.thuongThe = Math.min(3, (npc.thuongThe || 0) + 1);
        baoTinNpc(npc, `${npc.ten} gặp cấm chế hung hiểm trong ${tenNoi}, bị trọng thương rút lui.`, 'canh_bao');
      } else {
        npc.conSong = false;
        npc.lyDoMat = `Tử nạn khi thám hiểm ${tenNoi}`;
        baoTinNpc(npc, `${npc.ten} đã vẫn lạc trong lúc thám hiểm ${tenNoi}!`, 'nguy_hiem');
      }
      continue;
    }

    // Tương tác xã hội với NPC cùng vùng: Quen biết -> Bạn tốt -> Đạo lữ / Ân oán (~6%)
    const cungVung = (aliveByVung[npc.vungId] || []).filter(x => x.id !== npc.id && x.conSong);
    if (r < 0.19 && cungVung.length > 0) {
      const other = pickRandom(cungVung);
      const rollSoc = Math.random();
      if (rollSoc < 0.28 && !(npc.quenBiet || []).includes(other.id) && !(npc.banBe || []).includes(other.id)) {
        lienKetQuanHeNpc(npc, other, 'quen');
        baoTinNpc(npc, `${npc.ten} tình cờ làm quen với ${other.ten} tại ${layVungDef(npc.vungId).ten}.`, 'thuong');
      } else if (rollSoc < 0.50 && !(npc.banBe || []).includes(other.id)) {
        lienKetQuanHeNpc(npc, other, 'ban');
        baoTinNpc(npc, `${npc.ten} cùng ${other.ten} luận đạo tương đắc, kết làm bạn tốt.`, 'tot');
      } else if (rollSoc < 0.64 && !npc.daoLuId && !other.daoLuId && !npc.laDaoLuNguoiChoi && !other.laDaoLuNguoiChoi && npc.gioiTinh !== other.gioiTinh && Math.abs(npc.canhGioi - other.canhGioi) <= 1) {
        lienKetQuanHeNpc(npc, other, 'ban');
        npc.daoLuId = other.id;
        other.daoLuId = npc.id;
        baoTinNpc(npc, `${npc.ten} và ${other.ten} kết thành Đạo Lữ, cùng nhau dìu dắt trên con đường trường sinh!`, 'dai_cat');
      } else if (rollSoc >= 0.74) {
        if (!(npc.cuuNhan || []).includes(other.id)) {
          lienKetQuanHeNpc(npc, other, 'cuu');
          baoTinNpc(npc, `${npc.ten} xảy ra xung đột tranh đoạt tài nguyên với ${other.ten}, kết thành ân oán!`, 'canh_bao');
        } else {
          const win = npc.canhGioi > other.canhGioi || (npc.canhGioi === other.canhGioi && Math.random() < 0.5);
          const keThua = win ? other : npc;
          const keThang = win ? npc : other;
          if (Math.random() < 0.35) {
            keThua.conSong = false;
            keThua.lyDoMat = `Bị cừu nhân ${keThang.ten} chém giết`;
            baoTinNpc(keThua, `${keThua.ten} đụng độ cừu nhân ${keThang.ten} và bị chém giết tại ${layVungDef(keThua.vungId).ten}!`, 'nguy_hiem');
          } else {
            keThua.thuongThe = Math.min(3, (keThua.thuongThe || 0) + 1);
            baoTinNpc(keThua, `${keThua.ten} huyết chiến với cừu nhân ${keThang.ten}, phải bỏ chạy trong tình trạng trọng thương.`, 'canh_bao');
          }
        }
      }
    }
  }

  // 3. Biến cố Diệt Môn hiếm gặp (~1.5% mỗi nhịp)
  const tmList = window.PN_DATA.tongMon || [];
  if (tmList.length > 0 && Math.random() < 0.015) {
    const tmNan = pickRandom(tmList);
    const monDo = aliveList.filter(n => n.tongMonId === tmNan.id && n.conSong);
    if (monDo.length > 0) {
      for (const m of monDo) {
        if (Math.random() < 0.4) {
          m.conSong = false;
          m.lyDoMat = `Tử thủ sơn môn khi ${tmNan.ten} gặp đại nạn diệt môn`;
          baoTinNpc(m, `【Đại biến】${tmNan.ten} bị đại địch vây công diệt môn, ${m.ten} tuẫn đạo vẫn lạc!`, 'nguy_hiem');
        } else {
          m.tongMonId = null;
          m.thuongThe = Math.min(3, (m.thuongThe || 0) + 1);
          m.danhHieu = `Tán tu (Cựu đệ tử ${tmNan.ten})`;
          baoTinNpc(m, `【Đại biến】${tmNan.ten} bị diệt môn, ${m.ten} mang thương tích phá vòng vây lưu lạc thành tán tu!`, 'canh_bao');
        }
      }
    }
  }

  // 4. Sinh thế hệ mới giữ cân bằng ~300 NPC sống & dọn bớt NPC ngẫu nhiên đã mất quá lâu
  const mauPool = window.PN_DATA.npcMau || [];
  let aliveCount = Object.values(state.npcs).filter(n => n.conSong).length;
  let sinhIdx = 1;
  while (aliveCount < 285 && mauPool.length > 0 && vungPool.length > 0 && sinhIdx <= 12) {
    const v = pickRandom(vungPool);
    const mauVung = mauPool.filter(m => m.vungId === v.id);
    const mau = mauVung.length > 0 ? pickRandom(mauVung) : pickRandom(mauPool);
    const moi = taoNpcNgauNhienTuMau(mau, v.id, sinhIdx++, v.canhGioiYeuCau || 0);
    moi.tuoi = 14 + Math.floor(Math.random() * 8);
    state.npcs[moi.id] = moi;
    aliveCount++;
  }

  const allIds = Object.keys(state.npcs);
  if (allIds.length > 360) {
    for (const id of allIds) {
      const n = state.npcs[id];
      if (n && n.ngauNhien && !n.conSong && !laBanTotTroLen(n) && id !== selectedNpcId) {
        delete state.npcs[id];
        if (Object.keys(state.npcs).length <= 330) break;
      }
    }
  }
}

function kiemTraDotNhapDongPhu(soNam) {
  if (!coDongPhu() || state.ketThuc || state.tranHienTai || state.suKienHienTai || state.biCanhHienTai) return;
  if (state.nam < 3) return;

  const oNha = dangODongPhu();
  const cap = state.dongPhu.cap || 1;
  const tiLeNam = Math.max(0.01, (oNha ? 0.015 : 0.065) - (cap - 1) * 0.007);
  const tiLeDot = 1 - Math.pow(1 - tiLeNam, Math.min(10, Math.max(1, soNam)));
  if (Math.random() >= tiLeDot) return;

  const dpVung = layVungDef(state.dongPhu.vungId);
  const npcPool = Object.values(state.npcs || {}).filter(
    n => n.conSong && n.vungId === dpVung.id && (n.haoCam || 0) <= 10 && n.canhGioi <= state.canhGioi + 1
  );
  const dungNpc = npcPool.length > 0 && Math.random() < 0.3;
  const keThuNpc = dungNpc ? pickRandom(npcPool) : null;

  const ytCap = Math.min(state.canhGioi, dpVung.canhGioiYeuCau ?? state.canhGioi);
  const ytPool = (window.PN_DATA.yeuThu || []).filter(y => y.canhGioi <= ytCap);
  const ytPick = pickRandom(ytPool.length > 0 ? ytPool : window.PN_DATA.yeuThu || []);

  const tenKeThu = keThuNpc
    ? `${keThuNpc.ten} (${layCanhGioiDef(keThuNpc.canhGioi).ten})`
    : ytPick
    ? `${ytPick.ten} (${layCanhGioiDef(ytPick.canhGioi).ten})`
    : `Tà tu lang thang (${layCanhGioiDef(ytCap).ten})`;

  if (oNha) {
    const cgDef = layCanhGioiDef(ytCap);
    const enemy = keThuNpc
      ? {
          ten: tenKeThu,
          hp: keThuNpc.hp,
          congKich: keThuNpc.congKich,
          phongThu: keThuNpc.phongThu,
          linhThach: keThuNpc.linhThach,
          npcId: keThuNpc.id,
          canhGioiDich: keThuNpc.canhGioi
        }
      : ytPick
      ? {
          ten: tenKeThu,
          hp: ytPick.hp,
          congKich: ytPick.congKich,
          phongThu: ytPick.phongThu,
          linhThach: ytPick.linhThach,
          loot: ytPick.loot,
          canhGioiDich: ytPick.canhGioi
        }
      : {
          ten: tenKeThu,
          hp: cgDef.hpGoc,
          congKich: cgDef.congKichGoc,
          phongThu: cgDef.phongThuGoc,
          linhThach: Math.round(25 * Math.pow(2.5, ytCap)),
          canhGioiDich: ytCap
        };
    if (keThuNpc) {
      thayDoiHaoCam(keThuNpc, -20, true);
      ghiKyUcNpc(keThuNpc, `Đột nhập động phủ của ${state.ten} tại ${dpVung.ten}!`);
    }
    state.tranHienTai = {
      ...enemy,
      hpDich: enemy.hp,
      hpDichMax: enemy.hp,
      hiep: 1,
      cooldowns: {},
      logTran: [`🚨 [${tenKeThu}] phá cấm chế đột nhập Động Phủ tại ${dpVung.ten}!`]
    };
    ghiNhatKy(`🚨 Cảnh báo cấm chế! [${tenKeThu}] đang đột nhập Động Phủ của bạn tại [${dpVung.ten}]!`, 'nguy_hiem');
    return;
  }

  // Khi chủ nhân đi vắng, Hộ Phủ Trận tự động phòng ngự
  const tiLeChan = Math.min(0.92, 0.42 + cap * 0.08);
  if (Math.random() < tiLeChan) {
    ghiNhatKy(
      `🛡️ Hộ Phủ Trận (Cấp ${cap}) tại [${dpVung.ten}] tự động kích hoạt, đánh lui [${tenKeThu}] toan đột nhập Động Phủ!`,
      'tot'
    );
    return;
  }

  const idxCoCay = state.dongPhu.linhDien.findIndex(o => o !== null);
  if (idxCoCay !== -1 && Math.random() < 0.55) {
    const oMat = state.dongPhu.linhDien[idxCoCay];
    const vpMat = layVatPhamDef(oMat.itemId);
    state.dongPhu.linhDien[idxCoCay] = null;
    if (keThuNpc) {
      thayDoiHaoCam(keThuNpc, -20, true);
      ghiKyUcNpc(keThuNpc, `Đào trộm [${vpMat ? vpMat.ten : oMat.itemId}] trong động phủ của ${state.ten}.`);
    }
    ghiNhatKy(
      `🚨 Trong lúc bạn vắng nhà, [${tenKeThu}] phá vỡ cấm chế Động Phủ tại [${dpVung.ten}], nhổ mất [${vpMat ? vpMat.ten : oMat.itemId}] ở Linh Điền #${idxCoCay + 1}!`,
      'nguy_hiem'
    );
  } else {
    const matLt = Math.min(state.linhThach, Math.max(15, Math.round(state.linhThach * 0.1)));
    state.linhThach = Math.max(0, state.linhThach - matLt);
    if (keThuNpc) {
      thayDoiHaoCam(keThuNpc, -20, true);
      ghiKyUcNpc(keThuNpc, `Lẻn vào động phủ của ${state.ten} cướp ${matLt} Linh thạch.`);
    }
    ghiNhatKy(
      `🚨 Khi bạn ở xa, [${tenKeThu}] đột nhập Động Phủ tại [${dpVung.ten}], cướp mất ${matLt.toLocaleString()} Linh thạch!`,
      'nguy_hiem'
    );
  }
}

function kiemTraSuKienTruySat(epBuoc = false) {
  if (!state || state.ketThuc || state.tranHienTai || state.hauChienNpc || state.suKienHienTai || state.biCanhHienTai) {
    return false;
  }
  if (!epBuoc && (state.nam < 3 || state.nam - (state.namTruySatCuoi || 0) < 2)) return false;

  // 1. Kiểm tra NPC thù hận (<= -30) kéo tới báo thù
  const npcThu = Object.values(state.npcs || {}).filter(
    n => n.conSong && (n.haoCam || 0) <= -30 && n.canhGioi <= state.canhGioi + 2
  );
  // 2. Kiểm tra Thế lực thù địch (<= -35) cử Chấp Pháp Đường truy sát
  const tmThuIds = Object.keys(state.theLucHaoCam || {}).filter(id => (state.theLucHaoCam[id] || 0) <= -35);

  if (npcThu.length === 0 && tmThuIds.length === 0) return false;

  const chonTheLuc = tmThuIds.length > 0 && (npcThu.length === 0 || Math.random() < 0.45);
  if (!epBuoc && Math.random() >= (chonTheLuc ? 0.14 : 0.12)) return false;

  state.namTruySatCuoi = state.nam;

  if (!chonTheLuc) {
    const keThu = pickRandom(npcThu);
    // Kẻ thù chủ động lần theo dấu vết tới vùng của bạn
    keThu.vungId = state.vungHienTai;
    const phiHoa = Math.max(80, Math.round(95 * Math.pow(2.2, Math.max(state.canhGioi, keThu.canhGioi))));
    const tcDef = layTinhCachNpcDef(keThu.tinhCachLoai);
    state.suKienHienTai = {
      ten: `Cừu Nhân Tìm Tới Cửa: 【${keThu.ten}】`,
      canhGioi: [keThu.canhGioi, keThu.canhGioi],
      text: `[${keThu.ten}] (${tenCanhGioiDayDu(keThu.canhGioi, keThu.tieuCanh || 0)} · Tính cách: ${tcDef.ten} · Hảo cảm ${keThu.haoCam}/100) mang hận năm xưa, lần theo khí tức chặn đường bạn tại 【${layVungDef().ten}】 đòi thanh toán ân oán!`,
      choices: [
        {
          text: `⚔️ Rút kiếm nghênh chiến [${keThu.ten}]`,
          effects: [
            {
              combat: {
                ten: `${keThu.ten} (${layCanhGioiDef(keThu.canhGioi).ten})`,
                hp: keThu.hp,
                congKich: keThu.congKich,
                phongThu: keThu.phongThu,
                linhThach: keThu.linhThach,
                npcId: keThu.id,
                canhGioiDich: keThu.canhGioi,
                giuNguyenChiSo: true
              },
              log: `⚔️ Bạn nghênh chiến cuộc truy sát của [${keThu.ten}]!`
            }
          ]
        },
        {
          text: `💎 Nộp ${phiHoa.toLocaleString()} Linh thạch cầu hòa xóa bỏ hận cũ`,
          requires: { linhThach: phiHoa },
          effects: [
            {
              haoCamNpc: { npcId: keThu.id, delta: 25, lyDo: `Nhận ${phiHoa.toLocaleString()} LT bồi thường từ ${state.ten}.` },
              log: `🤝 [${keThu.ten}] thu lấy ${phiHoa.toLocaleString()} Linh thạch rồi hừ lạnh bỏ qua lần này.`
            }
          ]
        },
        {
          text: `💨 Thi triển thân pháp thoát khỏi vòng vây`,
          check: { chiSo: 'khiVan', doKho: 16 },
          success: [{ log: `💨 Nhờ nhanh trí ẩn nấp, bạn cắt đuôi thành công [${keThu.ten}]!` }],
          failure: [
            {
              hp: -25,
              combat: {
                ten: `${keThu.ten} (${layCanhGioiDef(keThu.canhGioi).ten})`,
                hp: keThu.hp,
                congKich: keThu.congKich,
                phongThu: keThu.phongThu,
                linhThach: keThu.linhThach,
                npcId: keThu.id,
                canhGioiDich: keThu.canhGioi,
                giuNguyenChiSo: true
              },
              log: `💥 Thoát thân thất bại! [${keThu.ten}] áp sát ép bạn phải tử chiến!`
            }
          ]
        }
      ]
    };
    ghiNhatKy(`⚠️ Báo động! Cừu nhân [${keThu.ten}] tìm tới 【${layVungDef().ten}】 trả thù!`, 'nguy_hiem');
    return true;
  }

  // Event Thế lực truy sát
  const tmId = pickRandom(tmThuIds);
  const tm = layTongMonDef(tmId);
  const cgChapSu = Math.min(tm?.canhGioiCaoNhat || 9, state.canhGioi + (Math.random() < 0.35 ? 1 : 0));
  const cgDef = layCanhGioiDef(cgChapSu);
  const phiChuoc = Math.max(120, Math.round(140 * Math.pow(2.3, state.canhGioi)));
  const chapSu = {
    ten: `Chấp Sự Chấp Pháp Đường · ${tm ? tm.ten : tmId} (${cgDef.ten})`,
    hp: Math.round(cgDef.hpGoc * 1.35),
    congKich: Math.round(cgDef.congKichGoc * 1.2),
    phongThu: Math.round(cgDef.phongThuGoc * 1.15),
    linhThach: Math.round(80 * Math.pow(2.5, cgChapSu)),
    canhGioiDich: cgChapSu,
    giuNguyenChiSo: true
  };

  state.suKienHienTai = {
    ten: `Lệnh Truy Sát Của 【${tm ? tm.ten : tmId}】`,
    canhGioi: [cgChapSu, cgChapSu],
    text: `Vì kết oán sâu nặng với 【${tm ? tm.ten : tmId}】 (Hảo cảm ${layHaoCamTheLuc(tmId)}/100), Chấp Pháp Đường của tông môn này đã treo thưởng truy nã bạn! Một đội cao thủ do ${chapSu.ten} dẫn đầu vừa bao vây bạn tại 【${layVungDef().ten}】!`,
    choices: [
      {
        text: `⚔️ Phá vòng vây, quyết chiến Chấp Sự Tông Môn`,
        effects: [
          {
            theLucDelta: { tmId, delta: -8 },
            combat: chapSu,
            log: `⚔️ Bạn vung pháp bảo xông thẳng vào trận hình truy sát của 【${tm ? tm.ten : tmId}】!`
          }
        ]
      },
      {
        text: `💰 Nộp ${phiChuoc.toLocaleString()} Linh thạch chuộc tội & giảng hòa`,
        requires: { linhThach: phiChuoc },
        effects: [
          {
            theLucDelta: { tmId, delta: 22 },
            log: `💎 Nộp ${phiChuoc.toLocaleString()} LT bồi thường cho 【${tm ? tm.ten : tmId}】, lệnh truy sát tạm được gỡ bỏ (+22 Hảo cảm thế lực)!`
          }
        ]
      },
      {
        text: `🏃 Liều mình phá vây bỏ trốn`,
        check: { chiSo: 'khiVan', doKho: 18 },
        success: [{ log: `🏃 Bạn mượn địa hình hiểm trở thoát khỏi sự truy lùng của 【${tm ? tm.ten : tmId}】!` }],
        failure: [
          {
            hp: -35,
            combat: chapSu,
            log: `💥 Bị phong tỏa bốn phía! Bạn bị thương nhẹ và buộc phải tử chiến phá vây!`
          }
        ]
      }
    ]
  };
  ghiNhatKy(`🚨 Thế lực 【${tm ? tm.ten : tmId}】 phát lệnh truy sát, Chấp Pháp Đường đã chặn đường tại 【${layVungDef().ten}】!`, 'nguy_hiem');
  return true;
}

function tienThoiGian(soThang) {
  if (!state || state.ketThuc || soThang <= 0) return;
  const namLe = soThang / 12;
  state.thang = (state.thang || 1) + soThang;
  const namTroi = Math.floor((state.thang - 1) / 12);
  state.thang = ((state.thang - 1) % 12) + 1;

  const cpSum = tinhCongPhapTongHop();
  const tc = layTheChatDef();
  const lkHoi = tinhLinhKhiHienTaiTuLuyen();
  const hoiLinhKhi = Math.min(0.2, Math.max(0, (lkHoi - 1) * 0.03));
  const hoiPhucTyLe = 0.22 + cpSum.hoiPhucPct + (tc.hoiPhucBonus || 0) + hoiLinhKhi;
  state.hp = Math.min(tinhHpMax(), state.hp + Math.round(tinhHpMax() * hoiPhucTyLe * namLe));
  const mpMax = tinhMpMax();
  if (typeof state.mp !== 'number') state.mp = mpMax;
  state.mp = Math.min(mpMax, state.mp + Math.round(mpMax * Math.max(hoiPhucTyLe, 0.35 + (cpSum.hoiMpPct || 0)) * namLe));

  // Linh điền sinh trưởng theo tỷ lệ thời gian thực tế (soThang / 12 năm)
  if (coDongPhu()) {
    const tocDoCay = tinhTocDoSinhTruongLinhDien();
    for (const o of state.dongPhu.linhDien) {
      if (o) o.namTrong = Math.round(((o.namTrong || 0) + namLe * tocDoCay) * 10) / 10;
    }
  }

  if (namTroi > 0) {
    state.nam += namTroi;
    state.tuoi += namTroi;

    // Chạy vòng đời tự hành của ~300 NPC (chia nhịp tối đa 5 năm để mượt)
    let conLai = namTroi;
    while (conLai > 0) {
      const buoc = Math.min(5, conLai);
      chayVongDoiNpc(buoc);
      conLai -= buoc;
    }

    const maxTho = tinhThoNguyenMax();
    if (state.tuoi >= maxTho) {
      state.ketThuc = {
        thangLoi: false,
        lyDo: `Thọ nguyên đã cạn ở tuổi ${state.tuoi} (Giới hạn ${maxTho} năm). Bạn tọa hóa trong động phủ, khép lại một kiếp tu tiên.`
      };
      ghiNhatKy(`⚠️ ${state.ketThuc.lyDo}`, 'nguy_hiem');
      return;
    }

    if ((state.thuongThe || 0) > 0 && state.hp >= tinhHpMax() * 0.7 && Math.random() < 0.35 * Math.min(3, namTroi)) {
      if (hoiPhucThuongThe(1)) {
        ghiNhatKy(`🩺 Tĩnh dưỡng lâu ngày, thương thế dịu bớt còn 【${layThuongTheDef().ten}】.`, 'tot');
      }
    }

    kiemTraDotNhapDongPhu(namTroi);
    kiemTraQuaHanNhiemVuTongMon();
  }

  if (!kiemTraSuKienTruySat(false)) {
    kiemTraNoNhanQua(false);
  }
}

function quaNam(soNam) {
  if (soNam <= 0) return;
  tienThoiGian(Math.max(1, Math.round(soNam * 12)));
}

// ==========================================
// 4. BẾ QUAN, ĐỘT PHÁ & ĐỘNG PHỦ (3 -> 9 Ô)
// ==========================================

function beQuan(soNam) {
  if (state.ketThuc || state.tranHienTai || state.hauChienNpc || state.suKienHienTai) return;
  const oNha = dangODongPhu();
  const tocDo = tinhTocDoTuLuyenNam();
  const tuViNhan = Math.round(tocDo * soNam * (0.92 + Math.random() * 0.16));
  state.tuVi += tuViNhan;
  tienThoiGian(soNam * 12);

  ghiNhatKy(
    `🧘 Bế quan ${soNam} năm tại ${oNha ? `Động Phủ 【${layVungDef().ten}】 (Linh khí x${tinhLinhKhiDongPhu()})` : `【${layVungDef().ten}】 (Linh khí x${layVungDef().linhKhi})`}, hấp thu linh khí nhận +${tuViNhan.toLocaleString()} Tu vi.`,
    'tot'
  );
  if (!state.ketThuc && !state.suKienHienTai && !state.tranHienTai && soNam >= 5) {
    const tiLeBq = oNha ? 0.1 : 0.24;
    if (Math.random() < tiLeBq) kiemTraBienCoHanhDong('be_quan');
  }
  luuGame();
  veGiaoDien();
}

function dotPha() {
  if (state.ketThuc || state.tranHienTai || state.hauChienNpc) return;
  const can = tinhTuViCan();
  if (state.tuVi < can) {
    ghiNhatKy(`Chưa đủ tu vi để xung kích! Cần ${can.toLocaleString()} Tu vi.`, 'canh_bao');
    veGiaoDien();
    return;
  }

  // Đột phá Tiểu cảnh giới (tốn 1 tháng điều tức)
  if (!laDinhPhongDaiCanh()) {
    state.tuVi -= can;
    state.tieuCanh += 1;
    tienThoiGian(1);
    state.hp = tinhHpMax();
    state.mp = tinhMpMax();
    ghiNhatKy(`✨ Linh lực quán thông kinh mạch (1 tháng)! Bạn thuận lợi tiến lên 【${tenCanhGioiDayDu()}】!`, 'tot');
    luuGame();
    veGiaoDien();
    return;
  }

  // Đột phá Đại cảnh giới (0 -> 10, tốn 6 tháng xung kích)
  if (state.canhGioi >= 10) return;
  if ((state.thuongThe || 0) >= 3) {
    ghiNhatKy('⚠️ Đạo cơ đang ở trạng thái 【Nguy kịch】! Hãy điều dưỡng thương thế hoặc uống đan dược trước khi xung kích Đại cảnh giới.', 'canh_bao');
    veGiaoDien();
    return;
  }
  const tiLe = tinhTiLeDotPhaDaiCanh();
  let tenDanDung = '';

  if (state.dotPhaBuff > 0) {
    tenDanDung = ` (Đang mang dược lực đột phá +${Math.round(state.dotPhaBuff * 100)}%)`;
    state.dotPhaBuff = 0;
  } else {
    const bestPill = timDanDotPhaTrongTui();
    if (bestPill) {
      themVat(bestPill.vpKey || bestPill.vp.id, -1);
      tenDanDung = ` (Đã phục dụng [${bestPill.vp.ten}] +${Math.round(bestPill.bonus * 100)}%)`;
    }
  }

  tienThoiGian(6);
  if (state.ketThuc) {
    luuGame();
    veGiaoDien();
    return;
  }

  if (Math.random() < tiLe) {
    state.tuVi = 0;
    state.canhGioi += 1;
    state.tieuCanh = 0;
    state.chiSo.thanThuc += 5 + state.canhGioi * 4;
    state.chiSo.canCot += 3 + state.canhGioi * 3;
    state.hp = tinhHpMax();
    state.mp = tinhMpMax();
    state.thuongThe = 0;

    const cgMoi = layCanhGioiDef();
    ghiNhatKy(
      `🌩️ Thiên địa dị tượng! Sau 6 tháng xung kích bình cảnh${tenDanDung}, bạn phá kén thành công bước vào 【${cgMoi.ten}】! Thọ nguyên đạt ${tinhThoNguyenMax()} năm!`,
      'dai_cat'
    );

    if (state.canhGioi >= 10) {
      state.ketThuc = {
        thangLoi: true,
        lyDo: `Chúc mừng Chân Tiên ${state.ten}! Ở tuổi ${state.tuoi}, bạn đã vượt qua Cửu Cửu Thiên Kiếp, chính thức Phi Thăng Tiên Giới, chứng đạo trường sinh!`
      };
    }
  } else {
    const tonThatTuVi = Math.round(can * 0.30);
    state.tuVi = Math.max(0, state.tuVi - tonThatTuVi);
    state.hp = Math.max(10, Math.round(state.hp * 0.45));
    state.mp = Math.max(0, Math.round((state.mp ?? tinhMpMax()) * 0.4));
    state.thuongThe = Math.min(3, (state.thuongThe || 0) + 1);
    ghiNhatKy(
      `💥 Xung kích đại cảnh giới thất bại${tenDanDung} (Tỷ lệ ${Math.round(tiLe * 100)}%)! Hao tổn ${tonThatTuVi.toLocaleString()} Tu vi và rơi vào 【${layThuongTheDef().ten}】.`,
      'nguy_hiem'
    );
  }

  luuGame();
  veGiaoDien();
}

function giaNangCapDongPhu() {
  return Math.round(320 * Math.pow(1.9, Math.max(0, (state?.dongPhu?.cap || 1) - 1)));
}

function giaDoiDongPhu() {
  const vung = layVungDef();
  return Math.round(250 * Math.pow(1.6, Math.max(0, (state?.dongPhu?.cap || 1) - 1)) * Math.max(1, vung.linhKhi || 1));
}

function kiemTraTaiDongPhu(hanhDong = 'sử dụng Động Phủ') {
  if (!coDongPhu()) {
    ghiNhatKy(`⚠️ Bạn chưa khai lập Động Phủ! Hãy vào tab [🏡 Động Phủ] để lập phủ tại 【${layVungDef().ten}】.`, 'canh_bao');
    veGiaoDien();
    return false;
  }
  if (dangODongPhu()) return true;
  const dpVung = layVungDef(state.dongPhu.vungId);
  ghiNhatKy(`⚠️ Động Phủ đang đặt tại 【${dpVung.ten}】! Hãy quay về đó, dời phủ, hoặc phá hủy Động Phủ cũ để lập nơi mới và ${hanhDong}.`, 'canh_bao');
  veGiaoDien();
  return false;
}

function phaHuyDongPhu() {
  if (!coDongPhu()) return;
  const dpVung = layVungDef(state.dongPhu.vungId);
  const hoanLai = state.dongPhu.cap > 1 ? Math.round(giaNangCapDongPhu() * 0.25) : 50;
  const cayMat = (state.dongPhu.linhDien || []).filter(Boolean).length;
  state.linhThach += hoanLai;
  state.dongPhu = {
    cap: 0,
    ten: 'Chưa lập Động Phủ',
    vungId: null,
    linhDien: []
  };
  ghiNhatKy(
    `💥 Bạn đã tự tay phá hủy Động Phủ tại 【${dpVung.ten}】${cayMat > 0 ? ` (bỏ lại ${cayMat} gốc thảo dược chưa thu hoạch)` : ''}, thu hồi trận kỳ đổi được +${hoanLai.toLocaleString()} Linh thạch! Nay có thể di chuyển tới vùng đất mới để khai lập Động Phủ.`,
    'canh_bao'
  );
  luuGame();
  veGiaoDien();
}

function lapDongPhuTaiDay() {
  if (coDongPhu()) return;
  state.dongPhu = {
    cap: 1,
    ten: 'Động Phủ Mới',
    vungId: state.vungHienTai,
    linhDien: [null, null, null]
  };
  ghiNhatKy(
    `🏔️ Bạn chọn linh mạch tại 【${layVungDef().ten}】 khai sơn phá đá, lập Động Phủ Cấp 1 (3 ô Linh Điền · Linh khí x${tinhLinhKhiDongPhu()})!`,
    'tot'
  );
  luuGame();
  veGiaoDien();
}

function doiDongPhuVeDay() {
  if (!coDongPhu() || dangODongPhu()) return;
  const gia = giaDoiDongPhu();
  if (state.linhThach < gia) {
    ghiNhatKy(`Cần ${gia.toLocaleString()} Linh thạch để di dời Động Phủ & Tụ Linh Trận tới 【${layVungDef().ten}】!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  state.linhThach -= gia;
  state.dongPhu.vungId = state.vungHienTai;
  ghiNhatKy(
    `🏔️ Di dời Động Phủ (Cấp ${state.dongPhu.cap}) tới 【${layVungDef().ten}】 thành công! Linh khí Động Phủ đạt x${tinhLinhKhiDongPhu()}.`,
    'tot'
  );
  luuGame();
  veGiaoDien();
}

function nangCapDongPhu() {
  if (!kiemTraTaiDongPhu('nâng cấp Tụ Linh Trận')) return;
  const gia = giaNangCapDongPhu();
  if (state.linhThach < gia) {
    ghiNhatKy(`Cần ${gia.toLocaleString()} Linh thạch để nâng cấp Động phủ và Tụ Linh Trận!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  state.linhThach -= gia;
  state.dongPhu.cap += 1;
  let themO = false;
  if (state.dongPhu.linhDien.length < MAX_LINH_DIEN) {
    state.dongPhu.linhDien.push(null);
    themO = true;
  }
  ghiNhatKy(
    `🏔️ Nâng cấp Động Phủ lên Cấp ${state.dongPhu.cap}: Linh khí Động Phủ đạt x${tinhLinhKhiDongPhu()}, tốc độ Linh Điền x${tinhTocDoSinhTruongLinhDien()}${themO ? `, mở thêm ô Linh Điền #${state.dongPhu.linhDien.length}/${MAX_LINH_DIEN}` : ', Linh Điền đã đạt tối đa 9 ô'}!`,
    'tot'
  );
  luuGame();
  veGiaoDien();
}

// Phân 6 bậc độ hiếm Linh Dược dựa theo giá trị (gia)
function layBacLinhThao(vp) {
  const gia = Number(vp?.gia) || 10;
  if (gia <= 80) return { bac: 1, tenBac: 'Phàm thảo', namChin: 4 };
  if (gia <= 800) return { bac: 2, tenBac: 'Linh thảo sơ giai', namChin: 12 };
  if (gia <= 5000) return { bac: 3, tenBac: 'Huyền giai linh dược', namChin: 30 };
  if (gia <= 60000) return { bac: 4, tenBac: 'Địa giai kỳ trân', namChin: 70 };
  if (gia <= 250000) return { bac: 5, tenBac: 'Thiên giai linh bảo', namChin: 140 };
  return { bac: 6, tenBac: 'Tiên phẩm thần thảo', namChin: 260 };
}

// Linh khí Động Phủ rút ngắn thời gian trưởng thành Linh Dược, tối đa x2.0 (tức giảm tối đa 50% thời gian chín)
function tinhTocDoSinhTruongLinhDien() {
  if (!coDongPhu()) return 1.0;
  const lkDp = tinhLinhKhiDongPhu();
  const cap = state?.dongPhu?.cap || 1;
  const mult = 1 + Math.max(0, lkDp - 1) * 0.14 + (cap - 1) * 0.12;
  return Math.min(2.0, Math.max(0.8, Math.round(mult * 100) / 100));
}

function trongLinhThao(indexO, itemId) {
  if (!kiemTraTaiDongPhu('gieo trồng Linh Điền')) return;
  const vp = layVatPhamDef(itemId);
  if (!vp || soLuongVat(itemId) <= 0 || state.dongPhu.linhDien[indexO]) return;
  themVat(itemId, -1);
  state.dongPhu.linhDien[indexO] = { itemId, namTrong: 0 };
  const bac = layBacLinhThao(vp);
  ghiNhatKy(
    `🌱 Gieo trồng 1 gốc [${vp.ten}] (${bac.tenBac} · Cần ${bac.namChin} năm để chín) xuống ô Linh Điền #${indexO + 1}.`,
    'thuong'
  );
  luuGame();
  veGiaoDien();
}

// Chọn hạt giống / linh thảo có sẵn trong túi từ dropdown ô đất (Tác giả: Gemini (Antigravity))
function trongLinhThaoTuSelect(indexO) {
  const sel = document.getElementById(`linh-dien-seed-${indexO}`);
  if (!sel || !sel.value) return;
  trongLinhThao(indexO, sel.value);
}

function sanLuongLinhDien(o) {
  if (!o) return 0;
  const vp = layVatPhamDef(o.itemId);
  const bac = layBacLinhThao(vp);
  const nam = Number(o.namTrong) || 0;
  if (nam < bac.namChin) return 0;
  if (nam >= bac.namChin * 2) return 3;
  return 2;
}

function thuHoachLinhDien(indexO) {
  if (!kiemTraTaiDongPhu('thu hoạch Linh Điền')) return;
  const o = state.dongPhu.linhDien[indexO];
  if (!o) return;
  const vp = layVatPhamDef(o.itemId);
  const bac = layBacLinhThao(vp);
  const sanLuong = sanLuongLinhDien(o);
  if (sanLuong <= 0) {
    ghiNhatKy(`🌱 [${vp ? vp.ten : o.itemId}] mới đạt ${o.namTrong}/${bac.namChin} năm, chưa chín để thu hoạch!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  themVat(o.itemId, sanLuong);
  state.dongPhu.linhDien[indexO] = null;
  ghiNhatKy(
    `🌿 Thu hoạch ô Linh Điền #${indexO + 1} (${o.namTrong}/${bac.namChin} năm), nhận ${sanLuong} gốc [${vp ? vp.ten : o.itemId}]!`,
    'tot'
  );
  luuGame();
  veGiaoDien();
}

function luyenDan(dpId) {
  if (!kiemTraTaiDongPhu('khai lò luyện đan')) return;
  const dp = window.PN_DATA.danPhuong.find(d => d.id === dpId);
  if (!dp) return;
  for (const nl of dp.nguyenLieu) {
    if (soLuongVat(nl.id) < nl.soLuong) {
      const vp = layVatPhamDef(nl.id);
      ghiNhatKy(`Thiếu nguyên liệu: Cần ${nl.soLuong} [${vp ? vp.ten : nl.id}].`, 'canh_bao');
      veGiaoDien();
      return;
    }
  }
  for (const nl of dp.nguyenLieu) themVat(nl.id, -nl.soLuong);

  const bonusLinhKhi = Math.min(0.08, Math.max(0, (tinhLinhKhiDongPhu() - 1) * 0.015));
  const tiLe = Math.min(0.95, (dp.tiLeGoc || 0.7) + state.chiSo.ngoTinh * 0.004 + bonusLinhKhi);
  const danDef = layVatPhamDef(dp.sanPham);
  if (Math.random() < tiLe) {
    themVat(dp.sanPham, dp.soLuongRa || 1);
    ghiNhatKy(`🔥 Khai lò luyện đan thành công! Thu được ${dp.soLuongRa || 1} viên [${danDef ? danDef.ten : dp.sanPham}].`, 'tot');
  } else {
    ghiNhatKy(`💨 Hỏa hầu bất ổn, mẻ luyện [${danDef ? danDef.ten : dp.sanPham}] bị cháy khét!`, 'canh_bao');
  }
  luuGame();
  veGiaoDien();
}

// ==========================================
// 5. VẬT PHẨM, CÔNG PHÁP, BÍ THUẬT & PHƯỜNG THỊ
// ==========================================

function dungVatPham(itemId) {
  if (soLuongVat(itemId) <= 0) return;
  const vp = layVatPhamDef(itemId);
  if (!vp) return;

  if (vp.loai === 'tru_vat') {
    const sucChua = Math.min(MAX_TUI_DO_O, Number(vp.sucChua) || 20);
    if ((state.tuiDoMaxO || 10) >= sucChua) {
      ghiNhatKy(`Túi trữ vật hiện tại (${state.tuiDoMaxO} ô) đã lớn hơn hoặc bằng [${vp.ten}].`, 'canh_bao');
      veGiaoDien();
      return;
    }
    themVat(itemId, -1);
    state.tuiDoMaxO = sucChua;
    ghiNhatKy(`🎒 Trang bị [${vp.ten}], dung tích Túi trữ vật mở rộng lên ${state.tuiDoMaxO}/${MAX_TUI_DO_O} ô!`, 'dai_cat');
    luuGame();
    veGiaoDien();
    return;
  }

  if (vp.loai === 'phap_bao') {
    state.phapBao = state.phapBao === itemId ? null : itemId;
    ghiNhatKy(
      state.phapBao ? `⚔️ Trang bị pháp bảo [${vp.ten}].` : `Thu hồi [${vp.ten}] vào túi trữ vật.`,
      'thuong'
    );
    luuGame();
    veGiaoDien();
    return;
  }

  if (vp.loai === 'dan' && vp.hieuUng) {
    const pc = layPhamChatVatPham(itemId);
    const heSo = pc.heSo || 1;
    themVat(itemId, -1);
    const hu = vp.hieuUng;
    const msg = [];
    if (hu.tuVi) {
      const tv = Math.max(1, Math.round(Number(hu.tuVi) * heSo));
      state.tuVi += tv;
      msg.push(`+${tv.toLocaleString()} Tu vi`);
    }
    if (hu.hp) {
      const hp = Math.max(1, Math.round(Number(hu.hp) * heSo));
      state.hp = Math.min(tinhHpMax(), state.hp + hp);
      msg.push(`+${hp.toLocaleString()} Khí huyết`);
    }
    if (hu.hp || hu.tuVi) {
      const hoiMp = Math.max(15, Math.round(tinhMpMax() * 0.3 * heSo));
      state.mp = Math.min(tinhMpMax(), (state.mp ?? 0) + hoiMp);
      msg.push(`+${hoiMp.toLocaleString()} Linh lực`);
      if ((state.thuongThe || 0) > 0 && hoiPhucThuongThe(Number(hu.hp) >= 150 || pc.key === 'cuc' ? 2 : 1)) {
        msg.push(`Thương thế hồi còn 【${layThuongTheDef().ten}】`);
      }
    }
    if (hu.thoNguyen) {
      state.thoNguyenBonus += Number(hu.thoNguyen);
      msg.push(`+${hu.thoNguyen} năm Thọ nguyên`);
    }
    if (hu.canCot) {
      state.chiSo.canCot += Number(hu.canCot);
      msg.push(`+${hu.canCot} Căn cốt`);
    }
    if (hu.bonusDotPha) {
      const bGoc = Number(hu.bonusDotPha) > 1 ? Number(hu.bonusDotPha) / 100 : Number(hu.bonusDotPha);
      const b = Math.round(bGoc * heSo * 100) / 100;
      state.dotPhaBuff = Math.max(state.dotPhaBuff || 0, b);
      msg.push(`+${Math.round(b * 100)}% tỷ lệ Đột phá đại cảnh tới`);
    }
    ghiNhatKy(`💊 Phục dụng [${vp.ten} · ${pc.ten}]: ${msg.join(', ') || 'Không có biến hóa rõ rệt'}.`, 'tot');
    luuGame();
    veGiaoDien();
  }
}

function muaVatPham(loaiMua, idOrKey) {
  if (loaiMua === 'vat_pham') {
    const vp = layVatPhamDef(idOrKey);
    if (!vp) return;
    const hasPc = String(idOrKey || '').includes('@');
    const pc = layPhamChatVatPham(idOrKey);
    const giaMua = hasPc ? Math.max(1, Math.round((vp.gia || 0) * pc.heSo)) : vp.gia || 0;
    if (state.linhThach < giaMua) {
      ghiNhatKy(`Không đủ ${giaMua.toLocaleString()} Linh thạch để mua [${vp.ten} · ${pc.ten}]!`, 'canh_bao');
      veGiaoDien();
      return;
    }
    if (vp.loai === 'tru_vat') {
      const sucChua = Math.min(MAX_TUI_DO_O, Number(vp.sucChua) || 20);
      if ((state.tuiDoMaxO || 10) >= sucChua) {
        ghiNhatKy(`Túi trữ vật hiện tại (${state.tuiDoMaxO} ô) đã lớn hơn hoặc bằng [${vp.ten}]!`, 'canh_bao');
        veGiaoDien();
        return;
      }
      state.linhThach -= giaMua;
      state.tuiDoMaxO = sucChua;
      ghiNhatKy(`🎒 Mua và sử dụng [${vp.ten}], dung tích Túi trữ vật tăng lên ${state.tuiDoMaxO}/${MAX_TUI_DO_O} ô!`, 'dai_cat');
      luuGame();
      veGiaoDien();
      return;
    }
    if (!themVat(idOrKey, 1, hasPc ? pc.key : null)) {
      veGiaoDien();
      return;
    }
    state.linhThach -= giaMua;
    ghiNhatKy(`💰 Mua 1 [${vp.ten} · ${pc.ten}] với giá ${giaMua.toLocaleString()} Linh thạch.`, 'thuong');
  } else if (loaiMua === 'cong_phap') {
    const id = idOrKey;
    const cp = layCongPhapDef(id);
    if (!cp || state.congPhapDaHoc.includes(id)) return;
    if (state.linhThach < cp.gia) {
      ghiNhatKy(`Cần ${cp.gia.toLocaleString()} Linh thạch để thỉnh ngọc giản [${cp.ten}]!`, 'canh_bao');
      veGiaoDien();
      return;
    }
    state.linhThach -= cp.gia;
    state.congPhapDaHoc.push(id);
    trangBiCongPhapHoacBiThuat(id);
    return;
  } else if (loaiMua === 'dan_phuong') {
    const id = idOrKey;
    const dp = window.PN_DATA.danPhuong.find(d => d.id === id);
    if (!dp || state.danPhuongDaHoc.includes(id)) return;
    const giaDp = Math.max(150, Math.round(180 * Math.pow(2.4, dp.canhGioi || 1)));
    if (state.linhThach < giaDp) {
      ghiNhatKy(`Cần ${giaDp.toLocaleString()} Linh thạch để mua cổ phương [${dp.ten}]!`, 'canh_bao');
      veGiaoDien();
      return;
    }
    state.linhThach -= giaDp;
    state.danPhuongDaHoc.push(id);
    ghiNhatKy(`📖 Học được đan phương mới: [${dp.ten}]!`, 'tot');
  }
  luuGame();
  veGiaoDien();
}

function giaBanVatPham(vp, itemKey) {
  const pc = layPhamChatVatPham(itemKey);
  return Math.max(1, Math.round(((vp && vp.gia) || 10) * pc.heSo * 0.65));
}

function banVatPham(itemId, soLuong = 1) {
  const cur = soLuongVat(itemId);
  if (cur <= 0) return;
  const vp = layVatPhamDef(itemId);
  if (!vp) return;
  const slBan = Math.max(1, Math.min(cur, Number(soLuong) || 1));
  if (state.phapBao === itemId && cur <= slBan) state.phapBao = null;
  const gia1 = giaBanVatPham(vp, itemId);
  const tong = gia1 * slBan;
  themVat(itemId, -slBan);
  if (soLuongVat(itemId) <= 0) shopSellSelected.delete(itemId);
  state.linhThach += tong;
  ghiNhatKy(`🪙 Bán ${slBan} [${vp.ten} · ${layPhamChatVatPham(itemId).ten}], thu về +${tong.toLocaleString()} Linh thạch.`, 'thuong');
  luuGame();
  veGiaoDien();
}

function chonHaPhamBanDo() {
  const dsIds = layDanhSachIdBanTrongTui(uiFilter.shopQuery).filter(id => layPhamChatVatPham(id).key === 'ha');
  for (const id of dsIds) shopSellSelected.add(id);
  veCotPhai();
}

function toggleChonBanDo(itemId) {
  if (shopSellSelected.has(itemId)) shopSellSelected.delete(itemId);
  else if (soLuongVat(itemId) > 0) shopSellSelected.add(itemId);
  veCotPhai();
}

function layDanhSachIdBanTrongTui(query = '') {
  const q = String(query || '').trim().toLowerCase();
  return Object.entries(state?.tuiDo || {})
    .filter(([id, sl]) => {
      if (sl <= 0) return false;
      const vp = layVatPhamDef(id);
      return vp && (!q || vp.ten.toLowerCase().includes(q));
    })
    .map(([id]) => id);
}

function chonTatCaBanDo() {
  const dsIds = layDanhSachIdBanTrongTui(uiFilter.shopQuery);
  const daChonHet = dsIds.length > 0 && dsIds.every(id => shopSellSelected.has(id));
  if (daChonHet) {
    for (const id of dsIds) shopSellSelected.delete(id);
  } else {
    for (const id of dsIds) shopSellSelected.add(id);
  }
  veCotPhai();
}

function banNhanhDaChon() {
  const ids = [...shopSellSelected].filter(id => soLuongVat(id) > 0);
  if (ids.length === 0) {
    ghiNhatKy('Hãy chọn ít nhất 1 vật phẩm (hoặc bấm Chọn tất cả) để bán nhanh!', 'canh_bao');
    veGiaoDien();
    return;
  }
  let tongLt = 0;
  let tongSl = 0;
  let soLoai = 0;
  for (const id of ids) {
    const sl = soLuongVat(id);
    const vp = layVatPhamDef(id);
    if (!vp || sl <= 0) continue;
    if (state.phapBao === id) state.phapBao = null;
    const gia1 = giaBanVatPham(vp, id);
    tongLt += gia1 * sl;
    tongSl += sl;
    soLoai += 1;
    themVat(id, -sl);
  }
  shopSellSelected.clear();
  state.linhThach += tongLt;
  ghiNhatKy(`⚡ Bán nhanh ${soLoai} loại (${tongSl} vật phẩm) tại Cửa Hàng, thu về +${tongLt.toLocaleString()} Linh thạch!`, 'tot');
  luuGame();
  veGiaoDien();
}

function trangBiCongPhapHoacBiThuat(cid) {
  const cp = layCongPhapDef(cid);
  if (!cp || !state.congPhapDaHoc.includes(cid)) return;
  if (cp.loai === 'BI_THUAT') {
    if (state.biThuat.includes(cid)) {
      state.biThuat = state.biThuat.filter(x => x !== cid);
      ghiNhatKy(`🔄 Đã gỡ Bí thuật phụ [${cp.ten}].`, 'thuong');
    } else {
      if (state.biThuat.length >= MAX_BI_THUAT) state.biThuat.shift();
      state.biThuat.push(cid);
      ghiNhatKy(`⚡ Trang bị Bí thuật phụ [${cp.ten}] (${state.biThuat.length}/${MAX_BI_THUAT} slot)!`, 'tot');
    }
  } else {
    state.congPhap = cid;
    ghiNhatKy(`🔄 Chuyển sang vận chuyển chủ công pháp 【${cp.ten}】!`, 'tot');
  }
  luuGame();
  veGiaoDien();
}

// ==========================================
// 6. HỆ THỐNG TÔNG MÔN & NHIỆM VỤ TÔNG MÔN (Áp dụng cơ chế VKTT)
// Tác giả: Gemini (Antigravity)
// ==========================================

const TONG_MON_CHUC_VI = [
  { ten: 'Đệ Tử Ký Danh', yeuCauCongHien: 0, yeuCauCg: 0, bongLoc: 35, bongCh: 4, tichToiDaNam: 2, linhMachHeSo: 0, phiLinhMachNam: 0, giamGiaBaoKho: 1.0 },
  { ten: 'Đệ Tử Ngoại Môn', yeuCauCongHien: 100, yeuCauCg: 1, bongLoc: 120, bongCh: 8, tichToiDaNam: 5, linhMachHeSo: 0.25, phiLinhMachNam: 18, giamGiaBaoKho: 1.0 },
  { ten: 'Đệ Tử Nội Môn', yeuCauCongHien: 350, yeuCauCg: 2, bongLoc: 480, bongCh: 15, tichToiDaNam: 10, linhMachHeSo: 0.45, phiLinhMachNam: 24, giamGiaBaoKho: 0.9 },
  { ten: 'Đệ Tử Chân Truyền', yeuCauCongHien: 900, yeuCauCg: 3, bongLoc: 1800, bongCh: 25, tichToiDaNam: 15, linhMachHeSo: 0.7, phiLinhMachNam: 32, giamGiaBaoKho: 0.8 },
  { ten: 'Trưởng Lão Tông Môn', yeuCauCongHien: 2200, yeuCauCg: 4, bongLoc: 6500, bongCh: 40, tichToiDaNam: 25, linhMachHeSo: 1.0, phiLinhMachNam: 42, giamGiaBaoKho: 0.7 }
];

const TONG_MON_KY_NAM = 3;
const MAX_NHIEM_VU_TONG_MON = 3;

function chuanHoaTongMonState() {
  if (!state || !state.tongMon) return null;
  const tm = state.tongMon;
  if (typeof tm.congHien !== 'number' || Number.isNaN(tm.congHien)) tm.congHien = 0;
  if (typeof tm.congTich !== 'number' || Number.isNaN(tm.congTich)) tm.congTich = tm.congHien;
  if (typeof tm.namBongLoc !== 'number') tm.namBongLoc = Math.max(0, (state.nam || 1) - 1);
  if (typeof tm.namKhaoHachLai !== 'number') tm.namKhaoHachLai = 0;
  if (typeof tm.namQuyen !== 'number') tm.namQuyen = 0;
  if (typeof tm.ltDaQuyenNam !== 'number') tm.ltDaQuyenNam = 0;
  if (typeof tm.donKy !== 'number') tm.donKy = -1;
  if (typeof tm.donDaGiao !== 'boolean') tm.donDaGiao = false;
  if (typeof tm.bangKy !== 'number') tm.bangKy = -1;
  if (!Array.isArray(tm.bangViec)) tm.bangViec = [];
  if (!Array.isArray(tm.viecNhan)) tm.viecNhan = [];
  if (!tm.viecVatNhan || typeof tm.viecVatNhan !== 'object') tm.viecVatNhan = {};
  return tm;
}

function thayDoiCongHienTongMon(delta) {
  const tm = chuanHoaTongMonState();
  if (!tm || !delta) return 0;
  const val = Math.round(Number(delta) || 0);
  tm.congHien = Math.max(0, tm.congHien + val);
  if (val > 0) tm.congTich = Math.max(tm.congHien, (tm.congTich || 0) + val);
  return tm.congHien;
}

function layHaoCamTheLuc(tmId) {
  if (!state || !tmId) return 0;
  return Number((state.theLucHaoCam && state.theLucHaoCam[tmId]) || 0);
}

function capBacTheLuc(diem) {
  if (diem >= 80) return 'Chí giao';
  if (diem >= 50) return 'Khách khanh';
  if (diem >= 15) return 'Thân thiện';
  if (diem > -15) return 'Trung lập';
  if (diem > -40) return 'Lạnh nhạt';
  if (diem > -75) return 'Thù địch';
  return 'Tử địch';
}

function thayDoiHaoCamTheLuc(tmId, delta) {
  if (!state || !tmId) return 0;
  if (!state.theLucHaoCam) state.theLucHaoCam = {};
  const cur = Number(state.theLucHaoCam[tmId] || 0);
  const moi = Math.max(-100, Math.min(100, Math.round(cur + delta)));
  state.theLucHaoCam[tmId] = moi;
  return moi;
}

function giaTangLeVatTheLuc(tm) {
  return Math.max(80, Math.round(70 * Math.pow(1.9, tm?.canhGioiCaoNhat || 1)));
}

function tangQuaTheLuc(tmId) {
  const tm = layTongMonDef(tmId);
  if (!tm) return;
  if (tm.vungId && tm.vungId !== state.vungHienTai) {
    ghiNhatKy(`⚠️ Cần di chuyển tới 【${layVungDef(tm.vungId).ten}】 mới có thể dâng lễ cho thế lực [${tm.ten}]!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  const chiPhi = giaTangLeVatTheLuc(tm);
  if (state.linhThach < chiPhi) {
    ghiNhatKy(`Cần ${chiPhi.toLocaleString()} Linh thạch để chuẩn bị lễ vật dâng lên [${tm.ten}]!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  state.linhThach -= chiPhi;
  const moi = thayDoiHaoCamTheLuc(tmId, 15);
  ghiNhatKy(`🎁 Dâng lễ vật (${chiPhi.toLocaleString()} LT) cho 【${tm.ten}】, hảo cảm thế lực đạt 【${capBacTheLuc(moi)} (${moi}/100)】!`, 'tot');
  luuGame();
  veGiaoDien();
}

function laTongMonTaDao(tmDef) {
  const phe = String(tmDef?.phe || '').toLowerCase();
  return phe.includes('ma') || phe.includes('quỷ') || phe.includes('yêu') || phe.includes('trùng');
}

function timDongMinhTongMon() {
  if (!state || !state.npcs || !state.tongMon) return null;
  const tmId = state.tongMon.id;
  const candidates = Object.values(state.npcs).filter(
    n =>
      n &&
      n.conSong &&
      ((n.tongMonId === tmId && (n.haoCam || 0) >= 15) || n.laDaoLu || (n.haoCam || 0) >= 50)
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => (b.tongMonId === tmId ? 15 : 0) + (b.haoCam || 0) - ((a.tongMonId === tmId ? 15 : 0) + (a.haoCam || 0)));
  return candidates[0];
}

function chonVungNhiemVuTongMon(tmDef) {
  const ds = (window.PN_DATA.vungDat || []).filter(v => (v.canhGioiYeuCau || 0) <= (state.canhGioi || 0));
  if (tmDef?.vungId && (layVungDef(tmDef.vungId).canhGioiYeuCau || 0) <= (state.canhGioi || 0) && Math.random() < 0.45) {
    return layVungDef(tmDef.vungId);
  }
  return pickRandom(ds.length > 0 ? ds : window.PN_DATA.vungDat) || layVungDef();
}

const TONG_MON_NV_MAU = [
  {
    loai: 'tru_yeu_ho_son',
    tieuDe: v => `Trừ ${v.yeuThu} quấy nhiễu dưới chân núi`,
    moTa: v => `Dân dưới chân núi gửi thư cầu cứu tới sơn môn: 【${v.yeuThu}】 đêm nào cũng mò xuống phá hoại. Dấu vết dẫn thẳng tới 【${v.vungTen}】.`,
    coDongMinh: true,
    chBase: 26,
    ltMult: 0.95,
    han: 3,
    kieuDich: 'yeu_thu'
  },
  {
    loai: 'yeu_duoc_vien',
    tieuDe: v => `Diệt ${v.yeuThu} phá hoại dược viên`,
    moTa: v => `Mấy luống linh thảo ngoài rìa 【${v.vungTen}】 bị đào bới tan hoang. Chấp sự sư thúc bảo đêm nay con 【${v.yeuThu}】 ăn quen mùi chắc chắn sẽ quay lại.`,
    coDongMinh: true,
    chBase: 24,
    ltMult: 0.9,
    han: 3,
    kieuDich: 'yeu_thu'
  },
  {
    loai: 'thuy_yeu_dam',
    tieuDe: v => `Trừ ${v.yeuThu} dưới đầm ${v.vungTen}`,
    moTa: v => `Đầm nước nơi tông môn lấy linh thủy tại 【${v.vungTen}】 đột nhiên vẩn đục mùi tanh, một con 【${v.yeuThu}】 ẩn mình dưới đáy đầm liên tục tập kích đệ tử.`,
    coDongMinh: true,
    coDanhUp: { chiSo: 'thanThuc', doKho: 15, nhan: 'Lặn xuống đánh úp vào huyệt yếu (-25% HP địch)' },
    chBase: 28,
    ltMult: 1.0,
    han: 3,
    kieuDich: 'yeu_thu'
  },
  {
    loai: 'yeu_dau_dan',
    tieuDe: v => `Diệt ${v.yeuThu} đầu đàn tinh anh`,
    moTa: v => `Trận hộ sơn ngoại vi ở 【${v.vungTen}】 bị thú triều nhỏ cào rách. Con 【${v.yeuThu} (Tinh anh)】 đang dẫn bầy chiếm cứ khe núi.`,
    coDongMinh: true,
    laTinhAnh: true,
    chBase: 36,
    ltMult: 1.35,
    han: 3,
    kieuDich: 'yeu_thu'
  },
  {
    loai: 'ap_tai_linh_thach',
    tieuDe: v => `Áp tải linh thạch từ mỏ ${v.vungTen}`,
    moTa: v => `Mỏ linh thạch ở 【${v.vungTen}】 gom đủ sản lượng nửa năm đóng vào sáu sọt mây. Mùi linh khí nồng đậm dọc đường rất dễ dẫn yêu thú hoặc sơn tặc tới cướp.`,
    tonThang: 2,
    chBase: 38,
    ltMult: 1.4,
    han: 2,
    kieuDich: 'yeu_thu'
  },
  {
    loai: 'ap_tai_dan_duoc',
    tieuDe: v => `Hộ tống hộp đan tới ${v.vungTen}`,
    moTa: v => `Hộp gỗ trầm niêm phong bùa chú chứa đan dược đáp lễ của sư môn cần đưa gấp qua 【${v.vungTen}】. Đi được nửa đường bỗng nghe tiếng thú gầm trong rừng sâu.`,
    tonThang: 2,
    chBase: 34,
    ltMult: 1.25,
    han: 2,
    kieuDich: 'yeu_thu'
  },
  {
    loai: 'ho_tong_de_tu',
    tieuDe: v => `Đón tân đệ tử linh căn tại ${v.vungTen}`,
    moTa: v => `Năm nay tông môn tuyển được một thiếu niên có linh căn tốt tại 【${v.vungTen}】. Trên đường dẫn về sơn môn, yêu thú bất ngờ chặn lối rừng thông.`,
    tonThang: 2,
    chBase: 32,
    ltMult: 1.15,
    han: 2,
    kieuDich: 'yeu_thu'
  },
  {
    loai: 'phan_do_bi_kip',
    tieuDe: v => `Truy bắt phản đồ trộm kinh thư tại ${v.vungTen}`,
    moTa: v => `Tàng Kinh Các phát hiện thất lạc một bộ công pháp. Lần theo dấu vết tới 【${v.vungTen}】, thấy gã đệ tử phản môn đã lộn trái áo bào, bó chặt quyển kinh sau lưng.`,
    coDongMinh: true,
    chBase: 35,
    ltMult: 1.3,
    han: 3,
    kieuDich: 'phan_do'
  },
  {
    loai: 'phan_do_dan_phong',
    tieuDe: v => `Truy hồi đan dược thất lạc ở ${v.vungTen}`,
    moTa: v => `Đan phòng mất nửa lò đan dược. Tìm tới căn nhà tranh ở 【${v.vungTen}】, thấy kẻ trộm đang đút đan cho đứa trẻ sốt mê man: "Đợi nó hạ sốt, ta tự theo ngươi về chịu phạt."`,
    coChoDoi: true,
    chBase: 36,
    ltMult: 1.2,
    han: 3,
    kieuDich: 'phan_do'
  },
  {
    loai: 'phan_do_chan_truyen',
    tieuDe: v => `Thanh lý môn hộ đệ tử phản tông tinh anh`,
    moTa: v => `Chấp sự đưa thẻ ngọc khắc lệnh truy sát: kẻ phản bội từng là cao đồ của tông, nay mang bí thuật trấn phái bỏ trốn tới 【${v.vungTen}】.`,
    coDongMinh: true,
    laTinhAnh: true,
    chBase: 48,
    ltMult: 1.6,
    han: 3,
    kieuDich: 'phan_do'
  },
  {
    loai: 'diet_ma_tu',
    pheYeuCau: 'chinh',
    tieuDe: v => `Phá đàn huyết tế của ma tu ở ${v.vungTen}`,
    moTa: v => `Ngoài 【${v.vungTen}】 dựng một tế đàn đá tà ác, ma tu đang vẽ huyết phù bắt dân thường tế luyện. Không ra tay ngay thì hậu quả khôn lường!`,
    coDongMinh: true,
    coDanhUp: { chiSo: 'canCot', doKho: 16, nhan: 'Đánh lén chặt đứt trận kỳ trước (-25% HP địch)' },
    chBase: 40,
    ltMult: 1.45,
    han: 3,
    kieuDich: 'ma_tu'
  },
  {
    loai: 'giet_mat_tham',
    pheYeuCau: 'ta',
    tieuDe: v => `Diệt mật thám chính đạo quanh ${v.vungTen}`,
    moTa: v => `Có kẻ giả dạng tiều phu vẽ bản đồ đường lên núi quanh 【${v.vungTen}】 vừa đốt phù truyền tin. Phải diệt khẩu trước khi tin lọt ra ngoài!`,
    coDongMinh: true,
    chBase: 38,
    ltMult: 1.4,
    han: 3,
    kieuDich: 'mat_tham'
  }
];

function taoNhiemVuTongMonNgauNhien(tmDef, cgDich, slotIdx) {
  const taDao = laTongMonTaDao(tmDef);
  const poolMau = TONG_MON_NV_MAU.filter(m => {
    if (m.pheYeuCau === 'chinh' && taDao) return false;
    if (m.pheYeuCau === 'ta' && !taDao) return false;
    return true;
  });
  const mau = pickRandom(poolMau) || TONG_MON_NV_MAU[0];
  const vung = chonVungNhiemVuTongMon(tmDef);
  const ytPool = (window.PN_DATA.yeuThu || []).filter(y => (y.canhGioi ?? 0) <= Math.min(9, cgDich + 1));
  const yeuThu = pickRandom(ytPool) || (window.PN_DATA.yeuThu && window.PN_DATA.yeuThu[0]) || { ten: 'Yêu Thú Hoang Dã' };
  const capBac = state.tongMon?.capBac || 0;
  const heSoCap = 1 + capBac * 0.14;
  const congHien = Math.max(15, Math.round(mau.chBase * (1 + Math.max(0, cgDich - state.canhGioi) * 0.3) * heSoCap));
  const linhThach = Math.max(25, Math.round(45 * Math.pow(2.3, cgDich) * (mau.ltMult || 1)));
  const tenDich =
    mau.kieuDich === 'yeu_thu'
      ? `${yeuThu.ten}${mau.laTinhAnh ? ' (Tinh anh)' : ''}`
      : mau.kieuDich === 'ma_tu'
      ? `Huyết Sát Ma Tu (${layCanhGioiDef(cgDich).ten})`
      : mau.kieuDich === 'mat_tham'
      ? `Mật Thám Chính Đạo (${layCanhGioiDef(cgDich).ten})`
      : `Phản Đồ ${tmDef ? tmDef.ten : 'Sư Môn'}${mau.laTinhAnh ? ' (Tinh anh)' : ''}`;

  return {
    id: `nvtm_${state.nam}_${slotIdx}_${Math.random().toString(36).slice(2, 6)}`,
    loai: mau.loai,
    ten: mau.tieuDe({ yeuThu: yeuThu.ten, vungTen: vung.ten }),
    moTa: mau.moTa({ yeuThu: yeuThu.ten, vungTen: vung.ten }),
    vungId: vung.id,
    vungTen: vung.ten,
    canhGioiDich: cgDich,
    tenDich,
    laTinhAnh: !!mau.laTinhAnh,
    coDongMinh: !!mau.coDongMinh,
    coChoDoi: !!mau.coChoDoi,
    coDanhUp: mau.coDanhUp || null,
    tonThang: mau.tonThang || 0,
    congHien,
    linhThach,
    hanNam: mau.han || 3
  };
}

function sinhDonCuaTong() {
  const tm = chuanHoaTongMonState();
  if (!tm) return null;
  const cg = state.canhGioi || 0;
  const pool = (window.PN_DATA.vatPham || []).filter(
    v => ['dan', 'phu_luc', 'linh_thao', 'yeu_dan'].includes(v.loai) && (v.canhGioi ?? v.bac ?? 0) <= cg + 1 && (v.gia || 0) > 0
  );
  const vp = pickRandom(pool.length > 0 ? pool : window.PN_DATA.vatPham);
  if (!vp) return null;
  const soLuong = (vp.gia || 20) > 250 ? 1 : (vp.gia || 20) > 70 ? 2 : 3;
  const congHien = Math.max(15, Math.round(Math.sqrt(Math.max(10, vp.gia || 20)) * 3.2 * soLuong));
  tm.donCuaTong = { id: vp.id, ten: vp.ten, soLuong, congHien };
  tm.donDaGiao = false;
  return tm.donCuaTong;
}

function damBaoDuLieuTongMon() {
  const tm = chuanHoaTongMonState();
  if (!tm) return null;
  const ky = Math.floor((Math.max(1, state.nam) - 1) / TONG_MON_KY_NAM);
  const tmDef = layTongMonDef(tm.id);
  if (tm.bangKy !== ky || tm.bangViec.length === 0) {
    tm.bangKy = ky;
    const offsets = [-1, 0, 0, 1];
    tm.bangViec = offsets.map((d, idx) => {
      const cg = Math.max(0, Math.min(9, (state.canhGioi || 0) + d));
      return taoNhiemVuTongMonNgauNhien(tmDef, cg, idx);
    });
  }
  if (tm.donKy !== ky || !tm.donCuaTong) {
    tm.donKy = ky;
    sinhDonCuaTong();
  }
  return tm;
}

function giaNhapTongMon(tmId) {
  const tm = layTongMonDef(tmId);
  if (!tm) return;
  if (state.tongMon) {
    ghiNhatKy('Bạn đang là người của tông môn khác! Hãy rời tông môn trước nếu muốn bái sư nơi mới.', 'canh_bao');
    veGiaoDien();
    return;
  }
  const hcTm = layHaoCamTheLuc(tmId);
  if (hcTm <= -30) {
    ghiNhatKy(`【${tm.ten}】 đang mang thù oán với bạn (Hảo cảm ${hcTm}/100), từ chối thu nhận!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  const cgMin = Math.max(0, (tm.canhGioiCaoNhat || 1) - 3);
  if (state.canhGioi < cgMin) {
    ghiNhatKy(`Cảnh giới chưa đủ để gia nhập [${tm.ten}] (Cần ít nhất 【${layCanhGioiDef(cgMin).ten}】)!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  state.tongMon = {
    id: tmId,
    capBac: 0,
    congHien: 30,
    congTich: 30,
    namBongLoc: Math.max(0, (state.nam || 1) - 1),
    namKhaoHachLai: 0,
    namQuyen: 0,
    ltDaQuyenNam: 0,
    donKy: -1,
    donDaGiao: false,
    bangKy: -1,
    bangViec: [],
    viecNhan: [],
    viecVatNhan: {}
  };
  damBaoDuLieuTongMon();
  const hcMoi = thayDoiHaoCamTheLuc(tmId, 10);
  ghiNhatKy(`🏛️ Bạn bái nhập sơn môn 【${tm.ten}】 (${tm.phe}), nhận thân phận ${TONG_MON_CHUC_VI[0].ten} (Hảo cảm thế lực: ${hcMoi}/100)!`, 'dai_cat');
  luuGame();
  veGiaoDien();
}

function phiXuongNuiEmDep() {
  if (!state || !state.tongMon) return 0;
  return state.tongMon.capBac === 0 ? 0 : 30 * (state.tongMon.capBac + 1);
}

function moModalRoiTongMon() {
  if (!state.tongMon || state.ketThuc || state.tranHienTai || state.hauChienNpc || state.suKienHienTai) return;
  const tmDef = layTongMonDef(state.tongMon.id);
  const phi = phiXuongNuiEmDep();
  state.suKienHienTai = {
    id: `sk_roi_tong_${Date.now()}`,
    bienCo: 'tong_mon',
    ten: `🚪 Chấp Sự Đường — Bàn chuyện rời 【${tmDef ? tmDef.ten : 'Sư Môn'}】`,
    text: `Chấp sự trưởng lão lật sổ đệ tử, chậm rãi nói: "Muốn xuống núi êm đẹp thì nộp lại ${phi} Cống hiến làm lệ phí xóa tên, hai bên dứt khoát. Nếu tự ý bỏ trốn, Chấp Pháp Đường sẽ ghi danh truy nã!"`,
    choices: [
      {
        text: phi > 0 ? `Nộp ${phi} Cống hiến, chắp tay xin xuống núi êm đẹp` : `Xin xóa tên đệ tử ký danh, xuống núi êm đẹp`,
        requires: phi > 0 ? { congHien: phi } : null,
        effects: [{ roiTongMonKieu: 'em_dep' }]
      },
      {
        text: `Lén bỏ trốn khỏi sơn môn lúc canh ba (bị Chấp Pháp Đường truy nã!)`,
        effects: [{ roiTongMonKieu: 'bo_tron' }]
      },
      {
        text: `Thôi, ở lại sơn môn tiếp tục tu hành`,
        effects: []
      }
    ]
  };
  veGiaoDien();
}

function roiTongMon(kieu = 'em_dep') {
  if (!state.tongMon) return;
  const tmId = state.tongMon.id;
  const tm = layTongMonDef(tmId);
  const phi = phiXuongNuiEmDep();
  if (kieu === 'em_dep' && state.tongMon.congHien >= phi) {
    const hcMoi = thayDoiHaoCamTheLuc(tmId, -8);
    ghiNhatKy(`📜 Tên bạn được gạch khỏi sổ đệ tử 【${tm ? tm.ten : tmId}】 một cách êm đẹp (Lệ phí ${phi} CH · Hảo cảm: ${hcMoi}/100).`, 'canh_bao');
  } else {
    const hcMoi = thayDoiHaoCamTheLuc(tmId, -45);
    gieoHatNhanQua({
      loai: 'truy_na_tong_mon',
      tmId,
      canhGioi: state.canhGioi,
      tenDoiTuong: tm ? tm.ten : tmId,
      namCho: 2 + Math.floor(Math.random() * 4),
      moTa: `Phản đồ trốn khỏi 【${tm ? tm.ten : tmId}】 bị Chấp Pháp Đường phát lệnh truy nã`
    });
    ghiNhatKy(`🏃 Bạn tự ý bỏ trốn khỏi 【${tm ? tm.ten : tmId}】! Hảo cảm tụt còn ${hcMoi}/100, Chấp Pháp Đường đã ghi tên truy nã!`, 'nguy_hiem');
  }
  state.tongMon = null;
  luuGame();
  veGiaoDien();
}

function lamViecThuongTrucTongMon(loai) {
  const tm = chuanHoaTongMonState();
  if (!tm || state.ketThuc || state.tranHienTai || state.hauChienNpc || state.suKienHienTai) return;
  const tmDef = layTongMonDef(tm.id);

  if (loai === 'tran_thu_linh_dien') {
    tienThoiGian(12);
    if (state.ketThuc) { luuGame(); veGiaoDien(); return; }
    const tvNhan = Math.round(tinhTocDoTuLuyenNam() * 1.0);
    const chNhan = Math.round((16 + tm.capBac * 6) * Math.pow(1.22, state.canhGioi));
    state.tuVi += tvNhan;
    thayDoiCongHienTongMon(chNhan);
    thayDoiHaoCamTheLuc(tm.id, 2);
    ghiNhatKy(`🌾 Trấn thủ Linh Điền 1 năm tại 【${tmDef?.ten || 'Sư Môn'}】: +${tvNhan.toLocaleString()} Tu vi, +${chNhan} Cống hiến, +2 Hảo cảm.`, 'tot');

    // Cơ chế biến cố 45% giống scene xam_pham trong VKTT ev.nhiem_vu_tong_mon
    if (!state.suKienHienTai && !state.tranHienTai && Math.random() < 0.45) {
      const cgDich = state.canhGioi;
      const cgDef = layCanhGioiDef(cgDich);
      const chThem = Math.max(12, Math.round(16 * (1 + cgDich * 0.25)));
      state.suKienHienTai = {
        id: `sk_linh_dien_xam_pham_${Date.now()}`,
        bienCo: 'tong_mon',
        ten: '🌿 Trấn Thủ Linh Điền — Kẻ Xâm Phạm',
        text: `Đêm cuối phiên trấn thủ, trận kỳ quanh linh điền sư môn bỗng rung lên bần bật! Một tên tán tu lén lách qua khe trận, đang vơ vét linh thảo bỏ vào túi trữ vật.`,
        choices: [
          {
            text: `Ra tay bắt giữ kẻ trộm (Thắng: +${chThem} Cống hiến & vật phẩm)`,
            effects: [
              {
                combat: {
                  ten: `Kẻ Trộm Linh Điền (${cgDef.ten})`,
                  hp: Math.round(cgDef.hpGoc * 1.05),
                  congKich: Math.round(cgDef.congKichGoc * 1.0),
                  phongThu: cgDef.phongThuGoc,
                  linhThach: Math.round(45 * Math.pow(2.2, cgDich)),
                  canhGioiDich: cgDich,
                  giuNguyenChiSo: true,
                  linhDienSuMon: { congHien: chThem, tmId: tm.id }
                }
              }
            ]
          },
          {
            text: `Đánh động cho hắn bỏ chạy (an toàn, không công không tội)`,
            effects: [{ log: `💨 Kẻ trộm giật mình bỏ chạy thục mạng. Phiên trấn thủ khép lại bình yên.` }]
          }
        ]
      };
    }
    luuGame();
    veGiaoDien();
    return;
  }

  if (tm.capBac > 1) {
    ghiNhatKy('Việc tạp dịch chỉ dành cho Đệ Tử Ký Danh và Ngoại Môn!', 'canh_bao');
    veGiaoDien();
    return;
  }

  tienThoiGian(6);
  if (state.ketThuc) { luuGame(); veGiaoDien(); return; }
  const tvNhan = Math.round(tinhTocDoTuLuyenNam() * 0.25);
  state.tuVi += tvNhan;

  if (loai === 'quet_tang_kinh_cac') {
    thayDoiCongHienTongMon(8);
    let themMsg = '';
    const lastNgo = tm.viecVatNhan.ngoTinhNam || -99;
    if (state.nam - lastNgo >= 3 && Math.random() < 0.35) {
      tm.viecVatNhan.ngoTinhNam = state.nam;
      state.chiSo.ngoTinh = (state.chiSo.ngoTinh || 10) + 1;
      themMsg = ' · 💡 Trộm đọc được tâm đắc tiền nhân: +1 Ngộ tính!';
    }
    ghiNhatKy(`🧹 Quét dọn Tàng Kinh Các (6 tháng): +8 Cống hiến, +${tvNhan.toLocaleString()} Tu vi${themMsg}`, 'tot');
  } else if (loai === 'ganh_nuoc_linh_tuyen') {
    thayDoiCongHienTongMon(8);
    let themMsg = '';
    const lastCot = tm.viecVatNhan.canCotNam || -99;
    if (state.nam - lastCot >= 3 && Math.random() < 0.35) {
      tm.viecVatNhan.canCotNam = state.nam;
      state.chiSo.canCot = (state.chiSo.canCot || 10) + 1;
      themMsg = ' · 💪 Hàn khí linh tuyền tôi luyện gân cốt: +1 Căn cốt!';
    }
    ghiNhatKy(`🪣 Gánh nước Linh Tuyền (6 tháng): +8 Cống hiến, +${tvNhan.toLocaleString()} Tu vi${themMsg}`, 'tot');
  } else {
    thayDoiCongHienTongMon(7);
    const pool = (window.PN_DATA.vatPham || []).filter(v => ['dan', 'linh_thao', 'phu_luc'].includes(v.loai) && (v.canhGioi ?? 0) <= Math.max(1, state.canhGioi));
    const qua = Math.random() < 0.55 ? pickRandom(pool) : null;
    const themOk = qua ? themVat(qua.id, 1) : false;
    ghiNhatKy(
      `⚗️ Phụ việc Đan Phòng / Khí Đường (6 tháng): +7 Cống hiến, +${tvNhan.toLocaleString()} Tu vi${themOk ? ` · 🎁 Sư huynh thưởng [${qua.ten}]` : ''}.`,
      'tot'
    );
  }
  luuGame();
  veGiaoDien();
}

function nhanNhiemVuTongMon(nvId) {
  const tm = damBaoDuLieuTongMon();
  if (!tm) return;
  if (tm.viecNhan.length >= MAX_NHIEM_VU_TONG_MON) {
    ghiNhatKy(`Bạn đang ôm tối đa ${MAX_NHIEM_VU_TONG_MON} nhiệm vụ tông môn, hãy hoàn thành bớt trước!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  const idx = tm.bangViec.findIndex(v => v.id === nvId);
  if (idx < 0) {
    ghiNhatKy('Ngọc giản nhiệm vụ này không còn trên bảng!', 'canh_bao');
    veGiaoDien();
    return;
  }
  const [nv] = tm.bangViec.splice(idx, 1);
  tm.viecNhan.push({ ...nv, namNhan: state.nam, hetHanNam: state.nam + (nv.hanNam || 3) });
  ghiNhatKy(`📋 Nhận nhiệm vụ tông môn: 【${nv.ten}】 (Hạn: Năm ${state.nam + (nv.hanNam || 3)}).`, 'tot');
  luuGame();
  veGiaoDien();
}

function boNhiemVuTongMon(nvId) {
  const tm = chuanHoaTongMonState();
  if (!tm) return;
  const idx = tm.viecNhan.findIndex(v => v.id === nvId);
  if (idx < 0) return;
  const [nv] = tm.viecNhan.splice(idx, 1);
  const phatCh = Math.max(3, Math.round(nv.congHien * 0.2));
  thayDoiCongHienTongMon(-phatCh);
  const hcMoi = thayDoiHaoCamTheLuc(tm.id, -3);
  ghiNhatKy(`❌ Bạn hủy bỏ nhiệm vụ 【${nv.ten}】! Bị Chấp sự phạt -${phatCh} Cống hiến, -3 Hảo cảm thế lực (${hcMoi}/100).`, 'canh_bao');
  luuGame();
  veGiaoDien();
}

function kiemTraQuaHanNhiemVuTongMon() {
  const tm = chuanHoaTongMonState();
  if (!tm || !Array.isArray(tm.viecNhan) || tm.viecNhan.length === 0) return;
  const conLai = [];
  for (const nv of tm.viecNhan) {
    if ((state.nam || 1) > nv.hetHanNam && state.tranHienTai?.tongMonQuestId !== nv.id) {
      const phatCh = Math.max(3, Math.round(nv.congHien * 0.2));
      thayDoiCongHienTongMon(-phatCh);
      thayDoiHaoCamTheLuc(tm.id, -3);
      ghiNhatKy(`⏰ Quá hạn nhiệm vụ tông môn 【${nv.ten}】! Chấp sự phạt -${phatCh} Cống hiến, -3 Hảo cảm.`, 'canh_bao');
    } else {
      conLai.push(nv);
    }
  }
  tm.viecNhan = conLai;
}

function hoanThanhNhiemVuTongMon(nvId, dongMinhNpcId = null) {
  const tm = chuanHoaTongMonState();
  if (!tm) return false;
  const idx = tm.viecNhan.findIndex(v => v.id === nvId);
  if (idx < 0) return false;
  const [nv] = tm.viecNhan.splice(idx, 1);

  thayDoiCongHienTongMon(nv.congHien);
  state.linhThach += nv.linhThach;
  const hcMoi = thayDoiHaoCamTheLuc(tm.id, 4);

  let dmMsg = '';
  if (dongMinhNpcId && state.npcs && state.npcs[dongMinhNpcId]?.conSong) {
    const dm = state.npcs[dongMinhNpcId];
    thayDoiHaoCam(dm, 6, true);
    ghiKyUcNpc(dm, `Cùng ${state.ten} hoàn thành nhiệm vụ tông môn "${nv.ten}".`);
    dmMsg = ` · 🤝 [${dm.ten}] +6 Hảo cảm`;
  }

  ghiNhatKy(
    `🏅 Hoàn thành nhiệm vụ tông môn 【${nv.ten}】! Thưởng: +${nv.congHien} Cống hiến (Tổng công tích: ${tm.congTich}), +${nv.linhThach.toLocaleString()} LT, +4 Hảo cảm thế lực (${hcMoi}/100)${dmMsg}.`,
    'dai_cat'
  );
  return true;
}

function thucHienNhiemVuTongMon(nvId) {
  const tm = chuanHoaTongMonState();
  if (!tm || state.ketThuc || state.tranHienTai || state.hauChienNpc || state.suKienHienTai) return;
  const nv = tm.viecNhan.find(v => v.id === nvId);
  if (!nv) return;

  let thangDi = 0;
  if (nv.vungId && state.vungHienTai !== nv.vungId) {
    const vungDich = layVungDef(nv.vungId);
    if (state.canhGioi < (vungDich.canhGioiYeuCau || 0)) {
      ghiNhatKy(`⚠️ Khu vực 【${vungDich.ten}】 quá nguy hiểm (Cần ${layCanhGioiDef(vungDich.canhGioiYeuCau).ten})! Bạn có thể bỏ việc nếu vượt quá khả năng.`, 'canh_bao');
      veGiaoDien();
      return;
    }
    thangDi = tinhThangDiChuyen(nv.vungId);
    state.vungHienTai = nv.vungId;
    damBaoDiaDiemVung(nv.vungId);
    tienThoiGian(thangDi + (nv.tonThang || 0));
    if (state.ketThuc) { luuGame(); veGiaoDien(); return; }
  } else if (nv.tonThang > 0) {
    tienThoiGian(nv.tonThang);
    if (state.ketThuc) { luuGame(); veGiaoDien(); return; }
  }

  const cgDef = layCanhGioiDef(Math.min(9, nv.canhGioiDich));
  const heSoDich = nv.laTinhAnh ? 1.4 : 1.12;
  const combatBase = {
    ten: nv.tenDich,
    hp: Math.round(cgDef.hpGoc * heSoDich),
    congKich: Math.round(cgDef.congKichGoc * (nv.laTinhAnh ? 1.2 : 1.02)),
    phongThu: Math.round(cgDef.phongThuGoc * (nv.laTinhAnh ? 1.15 : 1.0)),
    linhThach: Math.round(40 * Math.pow(2.2, nv.canhGioiDich)),
    canhGioiDich: nv.canhGioiDich,
    giuNguyenChiSo: true,
    tongMonQuestId: nv.id
  };

  const dm = nv.coDongMinh ? timDongMinhTongMon() : null;
  const choices = [
    {
      text: `Lập tức ra tay giải quyết mục tiêu`,
      effects: [{ combat: combatBase }]
    }
  ];

  if (nv.coDanhUp) {
    choices.push({
      text: nv.coDanhUp.nhan,
      check: { chiSo: nv.coDanhUp.chiSo, doKho: nv.coDanhUp.doKho },
      success: [{ combat: { ...combatBase, hpMult: 0.75 }, log: '⚡ Đánh úp thành công, địch mất 25% khí huyết đầu trận!' }],
      failure: [{ combat: { ...combatBase }, log: '⚠️ Đánh úp bị phát hiện, phải đối đầu trực diện!' }]
    });
  }

  if (nv.coChoDoi) {
    choices.push({
      text: `Chờ đứa bé hạ sốt rồi mới quyết đấu công bằng (+3 Hảo cảm thế lực khi thắng)`,
      effects: [
        { combat: combatBase, log: `🌅 Gần sáng đứa trẻ hạ sốt, đối phương đứng dậy rút kiếm nghênh chiến không oán thán.` }
      ]
    });
  }

  if (dm) {
    choices.push({
      text: `🤝 Cùng 【${dm.ten}】 hợp lực ra tay (đồng minh trợ chiến mỗi lượt)`,
      effects: [{ combat: { ...combatBase, dongMinhNpcId: dm.id, dongMinhTen: dm.ten } }]
    });
  }

  choices.push({
    text: `Để lúc khác (quay lại chuẩn bị thêm)`,
    effects: []
  });

  state.suKienHienTai = {
    id: `sk_tm_${nv.id}`,
    bienCo: 'tong_mon',
    ten: `📜 Tông Vụ: ${nv.ten}`,
    text: `${thangDi > 0 ? `(Lên đường mất ${thangDi} tháng tới 【${nv.vungTen}】)\n` : ''}${nv.moTa}`,
    choices
  };
  luuGame();
  veGiaoDien();
}

function giaoDonCuaTong() {
  const tm = damBaoDuLieuTongMon();
  if (!tm || !tm.donCuaTong || tm.donDaGiao) return;
  const don = tm.donCuaTong;
  if (soLuongVat(don.id) < don.soLuong) {
    ghiNhatKy(`Cần đủ [${don.ten}] x${don.soLuong} mới có thể giao đơn cho tông môn!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  themVat(don.id, -don.soLuong);
  tm.donDaGiao = true;
  thayDoiCongHienTongMon(don.congHien);
  const hcMoi = thayDoiHaoCamTheLuc(tm.id, 3);
  ghiNhatKy(`📦 Giao đơn thu mua [${don.ten}] x${don.soLuong}: +${don.congHien} Cống hiến, +3 Hảo cảm (${hcMoi}/100)!`, 'tot');
  luuGame();
  veGiaoDien();
}

function nhanBongLocTongMon() {
  const tm = chuanHoaTongMonState();
  if (!tm) return;
  const cv = TONG_MON_CHUC_VI[tm.capBac] || TONG_MON_CHUC_VI[0];
  const soNam = Math.min(cv.tichToiDaNam, Math.max(0, (state.nam || 1) - (tm.namBongLoc ?? state.nam)));
  if (soNam <= 0) {
    ghiNhatKy('Năm nay bạn đã lĩnh bổng lộc tông môn rồi, hãy đợi sang năm sau!', 'canh_bao');
    veGiaoDien();
    return;
  }
  const thuongLt = Math.round(cv.bongLoc * soNam * Math.pow(1.45, Math.max(0, state.canhGioi - cv.yeuCauCg)));
  const thuongCh = Math.round((cv.bongCh || 0) * soNam);
  tm.namBongLoc = state.nam;
  state.linhThach += thuongLt;
  if (thuongCh > 0) thayDoiCongHienTongMon(thuongCh);
  ghiNhatKy(`💎 Lĩnh bổng lộc ${soNam} năm [${cv.ten}]: +${thuongLt.toLocaleString()} Linh thạch${thuongCh > 0 ? `, +${thuongCh} Cống hiến` : ''}.`, 'tot');
  luuGame();
  veGiaoDien();
}

function thangCapTongMon() {
  const tm = chuanHoaTongMonState();
  if (!tm || state.ketThuc || state.tranHienTai || state.hauChienNpc || state.suKienHienTai) return;
  const nextIdx = tm.capBac + 1;
  if (nextIdx >= TONG_MON_CHUC_VI.length) return;
  const nextCv = TONG_MON_CHUC_VI[nextIdx];
  if ((tm.congTich || 0) < nextCv.yeuCauCongHien || state.canhGioi < nextCv.yeuCauCg) {
    ghiNhatKy(
      `Để tấn thăng [${nextCv.ten}] cần Công tích ≥ ${nextCv.yeuCauCongHien} (hiện có ${tm.congTich}) và cảnh giới 【${layCanhGioiDef(nextCv.yeuCauCg).ten}】!`,
      'canh_bao'
    );
    veGiaoDien();
    return;
  }
  if ((tm.namKhaoHachLai || 0) > state.nam) {
    ghiNhatKy(`⏳ Bạn vừa trượt khảo hạch trước đó, cần đợi tới Năm ${tm.namKhaoHachLai} mới được thi lại!`, 'canh_bao');
    veGiaoDien();
    return;
  }

  // Lên Ngoại Môn (bậc 1): phong thẳng; từ Nội Môn trở lên: phải qua Khảo hạch Lôi đài (giống VKTT!)
  if (nextIdx < 2) {
    tm.capBac = nextIdx;
    thayDoiHaoCamTheLuc(tm.id, 5);
    ghiNhatKy(`🎖️ Chúc mừng bạn được sắc phong thành 【${nextCv.ten}】 (Không bị trừ điểm Cống hiến)!`, 'dai_cat');
    luuGame();
    veGiaoDien();
    return;
  }

  const cgThi = nextCv.yeuCauCg;
  const cgDef = layCanhGioiDef(cgThi);
  const tmDef = layTongMonDef(tm.id);
  state.suKienHienTai = {
    id: `sk_khao_hach_${nextIdx}_${Date.now()}`,
    bienCo: 'tong_mon',
    ten: `⚔️ Lôi Đài Khảo Hạch Tấn Thăng 【${nextCv.ten}】`,
    text: `Giám khảo của 【${tmDef?.ten || 'Sư Môn'}】 bước lên lôi đài: "Công tích và tu vi của ngươi đã đủ, nhưng muốn nhận áo bào ${nextCv.ten} phải vượt qua trận tỷ thí thực lực (${cgDef.ten}) trước toàn môn!"`,
    choices: [
      {
        text: `Bước lên lôi đài tiếp chiêu khảo hạch`,
        effects: [
          {
            combat: {
              ten: `Giám Khảo Lôi Đài (${cgDef.ten})`,
              hp: Math.round(cgDef.hpGoc * (1.1 + nextIdx * 0.08)),
              congKich: Math.round(cgDef.congKichGoc * (1.02 + nextIdx * 0.04)),
              phongThu: cgDef.phongThuGoc,
              linhThach: Math.round(30 * Math.pow(2.0, cgThi)),
              canhGioiDich: cgThi,
              giuNguyenChiSo: true,
              khaoHachCapBac: nextIdx
            }
          }
        ]
      },
      {
        text: `Chưa chuẩn bị kỹ, tạm hoãn khảo hạch`,
        effects: []
      }
    ]
  };
  veGiaoDien();
}

function hoanThanhKhaoHachTongMon(capBacMoi) {
  const tm = chuanHoaTongMonState();
  if (!tm || capBacMoi <= tm.capBac || capBacMoi >= TONG_MON_CHUC_VI.length) return;
  tm.capBac = capBacMoi;
  tm.namKhaoHachLai = 0;
  const hcMoi = thayDoiHaoCamTheLuc(tm.id, 5);
  const cv = TONG_MON_CHUC_VI[capBacMoi];
  ghiNhatKy(`🎖️ Thắng trận Khảo Hạch Lôi Đài! Chính thức sắc phong 【${cv.ten}】 (+5 Hảo cảm: ${hcMoi}/100)!`, 'dai_cat');
}

function beQuanLinhMachTongMon(soNam = 1) {
  const tm = chuanHoaTongMonState();
  if (!tm || state.ketThuc || state.tranHienTai || state.hauChienNpc || state.suKienHienTai) return;
  const cv = TONG_MON_CHUC_VI[tm.capBac] || TONG_MON_CHUC_VI[0];
  if (tm.capBac < 1) {
    ghiNhatKy('⚠️ Cần đạt chức vị Đệ Tử Ngoại Môn trở lên mới được dùng Linh Mạch Sư Môn!', 'canh_bao');
    veGiaoDien();
    return;
  }
  const phi = cv.phiLinhMachNam * soNam;
  if (tm.congHien < phi) {
    ghiNhatKy(`Cần ${phi} Cống hiến để thuê Linh Mạch Sư Môn ${soNam} năm!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  thayDoiCongHienTongMon(-phi);
  const heSo = 1 + cv.linhMachHeSo;
  const tuViNhan = Math.round(tinhTocDoTuLuyenNam() * heSo * soNam * (0.95 + Math.random() * 0.1));
  state.tuVi += tuViNhan;
  tienThoiGian(soNam * 12);
  ghiNhatKy(`🏔️ Bế quan ${soNam} năm trên Linh Mạch Sư Môn (Hệ số x${heSo.toFixed(2)}, -${phi} CH): thu được +${tuViNhan.toLocaleString()} Tu vi!`, 'dai_cat');
  luuGame();
  veGiaoDien();
}

function tinhCongHienQuyenGop(soLt) {
  const tm = chuanHoaTongMonState();
  if (!tm) return { ch: 0, block: 100 };
  const block = Math.max(80, Math.round(80 * Math.pow(2, state.canhGioi || 0)));
  let daQuyen = tm.namQuyen === state.nam ? tm.ltDaQuyenNam : 0;
  let con = Math.max(0, Math.floor(soLt));
  let ch = 0;
  const tyLeGoc = Math.max(8, Math.round(block / 10)); // ~10 CH mỗi block đầu
  while (con > 0) {
    const buoc = Math.floor(daQuyen / block);
    const denMoc = block * (buoc + 1) - daQuyen;
    const dung = Math.min(con, denMoc);
    const heSo = Math.pow(0.8, buoc);
    ch += (dung / block) * tyLeGoc * heSo;
    daQuyen += dung;
    con -= dung;
  }
  return { ch: Math.floor(ch + 1e-9), block };
}

function quyenLinhThachTongMon(soLt) {
  const tm = chuanHoaTongMonState();
  if (!tm) return;
  const val = Math.floor(Number(soLt) || 0);
  if (val <= 0 || state.linhThach < val) {
    ghiNhatKy(`Không đủ ${val.toLocaleString()} Linh thạch để quyên góp!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  const { ch } = tinhCongHienQuyenGop(val);
  if (ch < 1) {
    ghiNhatKy('Số linh thạch quá ít, tông môn chưa thể ghi nhận công tích!', 'canh_bao');
    veGiaoDien();
    return;
  }
  if (tm.namQuyen !== state.nam) {
    tm.namQuyen = state.nam;
    tm.ltDaQuyenNam = 0;
  }
  state.linhThach -= val;
  tm.ltDaQuyenNam += val;
  thayDoiCongHienTongMon(ch);
  ghiNhatKy(`💠 Quyên góp ${val.toLocaleString()} Linh thạch cho tông môn: nhận +${ch} Cống hiến (hiệu suất giảm dần theo mức quyên trong năm).`, 'tot');
  luuGame();
  veGiaoDien();
}

function layDsBaoKhoVatTu() {
  const maxCg = Math.min(9, (state?.canhGioi || 0) + 1);
  return (window.PN_DATA.vatPham || [])
    .filter(v => ['dan', 'phu_luc'].includes(v.loai) && (v.canhGioi ?? 0) <= maxCg && (v.gia || 0) > 0)
    .sort((a, b) => (a.canhGioi ?? 0) - (b.canhGioi ?? 0) || (a.gia || 0) - (b.gia || 0))
    .slice(0, 8);
}

function phiDoiVatTuBaoKho(vp, tmId) {
  const cv = state?.tongMon ? TONG_MON_CHUC_VI[state.tongMon.capBac] || TONG_MON_CHUC_VI[0] : TONG_MON_CHUC_VI[0];
  const base = Math.max(12, Math.round(Math.sqrt(Math.max(20, vp.gia || 20)) * 3.8));
  const giamKhachKhanh = layHaoCamTheLuc(tmId) >= 50 ? 0.9 : 1;
  return Math.max(10, Math.round(base * (cv.giamGiaBaoKho || 1) * giamKhachKhanh));
}

function doiVatTuBaoKho(vpId) {
  const tm = chuanHoaTongMonState();
  if (!tm) return;
  const vp = layVatPhamDef(vpId);
  if (!vp) return;
  const phi = phiDoiVatTuBaoKho(vp, tm.id);
  if (tm.congHien < phi) {
    ghiNhatKy(`Cần ${phi} Cống hiến để đổi [${vp.ten}] tại Bảo Khố!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  if (!themVat(vp.id, 1)) {
    veGiaoDien();
    return;
  }
  thayDoiCongHienTongMon(-phi);
  ghiNhatKy(`🏛️ Đổi tại Bảo Khố Sư Môn: [${vp.ten}] (-${phi} Cống hiến).`, 'tot');
  luuGame();
  veGiaoDien();
}

function phiDoiBaoKhoTongMon(cp, tmId) {
  const cv = state?.tongMon ? TONG_MON_CHUC_VI[state.tongMon.capBac] || TONG_MON_CHUC_VI[0] : TONG_MON_CHUC_VI[0];
  const base = Math.max(80, (cp.canhGioi + 1) * 120);
  const giamKhachKhanh = layHaoCamTheLuc(tmId) >= 50 ? 0.9 : 1;
  return Math.max(50, Math.round(base * (cv.giamGiaBaoKho || 1) * giamKhachKhanh));
}

function doiBaoKhoTongMon(cpId) {
  const tm = chuanHoaTongMonState();
  if (!tm) return;
  const cp = layCongPhapDef(cpId);
  if (!cp || state.congPhapDaHoc.includes(cpId)) return;
  const phiCongHien = phiDoiBaoKhoTongMon(cp, tm.id);
  if (tm.congHien < phiCongHien) {
    ghiNhatKy(`Cần ${phiCongHien} Điểm cống hiến để đổi bí tịch [${cp.ten}]!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  thayDoiCongHienTongMon(-phiCongHien);
  state.congPhapDaHoc.push(cpId);
  trangBiCongPhapHoacBiThuat(cpId);
}

// ==========================================
// 7. DI CHUYỂN BẢN ĐỒ, BÍ CẢNH & SĂN YÊU THÚ
// ==========================================

function tinhThangDiChuyen(vungId) {
  const list = window.PN_DATA.vungDat || [];
  const curIdx = list.findIndex(v => v.id === state.vungHienTai);
  const dstIdx = list.findIndex(v => v.id === vungId);
  if (curIdx < 0 || dstIdx < 0 || curIdx === dstIdx) return 1;
  const dist = Math.abs(dstIdx - curIdx);
  const cg = state.canhGioi || 0;
  const heSo = cg === 0 ? 1.5 : cg === 1 ? 1.0 : cg === 2 ? 0.65 : Math.max(0.25, 0.5 - (cg - 3) * 0.08);
  return Math.max(1, Math.min(18, Math.round(Math.max(1, dist * 0.7) * heSo)));
}

function diChuyenVung(vungId) {
  if (state.ketThuc || state.tranHienTai || state.hauChienNpc) return;
  const vung = layVungDef(vungId);
  if (state.canhGioi < vung.canhGioiYeuCau) {
    ghiNhatKy(
      `Tu vi chưa đủ! Cần đạt ít nhất 【${layCanhGioiDef(vung.canhGioiYeuCau).ten}】 mới đi tới [${vung.ten}] được.`,
      'canh_bao'
    );
    veGiaoDien();
    return;
  }
  if (state.vungHienTai === vungId) return;
  const thang = tinhThangDiChuyen(vungId);
  state.vungHienTai = vungId;
  damBaoDiaDiemVung(vungId);
  tienThoiGian(thang);
  ghiNhatKy(`🦅 Lên đường suốt ${thang} tháng tới vùng đất mới: 【${vung.ten}】 (Linh khí x${vung.linhKhi}).`, 'tot');
  if (!state.ketThuc && !state.suKienHienTai && !state.tranHienTai && thang >= 2 && Math.random() < 0.3) {
    kiemTraBienCoHanhDong('duong');
  }
  luuGame();
  veGiaoDien();
}

// Địa điểm con ngẫu nhiên trong từng vùng (Tác giả: Gemini (Antigravity))
const DIA_DIEM_CON_MAU = {
  su_kien: [
    { ten: 'Trạm Dịch Cổ Tán Tu', moTa: 'Nơi tụ họp tán tu trao đổi tin tức, dễ kích hoạt kỳ ngộ giang hồ.', nguyHiem: 'Đạo tặc rình rập' },
    { ten: 'Hẻm Núi Thanh Phong', moTa: 'Đường mòn hẻo lánh giữa vách đá dựng đứng, thường có tu sĩ qua lại.', nguyHiem: 'Phục kích bất ngờ' },
    { ten: 'Phế Tích Cổ Đạo Quán', moTa: 'Đạo quán đổ nát từ trăm năm trước, ẩn chứa cơ duyên hoặc tàn hồn.', nguyHiem: 'Cơ quan cổ xưa' },
    { ten: 'Bến Đò Vô Danh', moTa: 'Bến nước sương mù giăng kín, nhiều khách thương tu tiên dừng chân.', nguyHiem: 'Ám lưu hung hiểm' }
  ],
  yeu_thu: [
    { ten: 'Sào Huyệt Yêu Thú', moTa: 'Hang ổ yêu thú bản địa tụ tập, thích hợp đi săn lấy yêu đan và rèn luyện thực chiến.', nguyHiem: 'Yêu thú cuồng bạo' },
    { ten: 'Đầm Lầy Độc Chướng', moTa: 'Vùng lầy âm u đầy yêu vật ẩn náu trong bùn lầy và sương độc.', nguyHiem: 'Độc chướng & phục kích' },
    { ten: 'Rừng Rậm Huyết Sát', moTa: 'Khu rừng rậm rạp vết cào thú dữ, mùi máu tanh thoang thoảng trong gió.', nguyHiem: 'Bầy thú săn mồi' },
    { ten: 'Bãi Đá Yêu Khí', moTa: 'Những tảng đá lởm chởm ám nặng yêu khí, nơi yêu thú cấp cao thường lui tới.', nguyHiem: 'Yêu linh tập kích' }
  ],
  linh_mach: [
    { ten: 'Linh Dược Cốc', moTa: 'Thung lũng nhỏ đọng sương mai, thỉnh thoảng mọc ra linh thảo tự nhiên.', nguyHiem: 'Độc trùng thủ dược' },
    { ten: 'Suối Linh Tuyền Nhỏ', moTa: 'Mạch nước ngầm mang linh khí tinh thuần, giúp điều tức và thu hái thảo mộc.', nguyHiem: 'Linh khí dao động' },
    { ten: 'Rừng Trúc Tĩnh Tâm', moTa: 'Rừng trúc xanh rì yên ả, thích hợp tĩnh tọa cảm ngộ thiên địa một thoáng.', nguyHiem: 'Ảo ảnh sương mù' }
  ],
  dong_phu: [
    { ten: 'Cổ Tu Động Phủ Ẩn', moTa: 'Động phủ bị phong ấn của tiền nhân ngẫu nhiên lộ diện sau khe núi, bên trong như một Bí cảnh thu nhỏ!', nguyHiem: 'Hộ phủ cấm chế cổ xưa' },
    { ten: 'Bí Động Tàn Tích', moTa: 'Hang đá sâu thẳm phát ra quang mang pháp trận, ẩn chứa cơ duyên và yêu thú thủ hộ.', nguyHiem: 'Cổ trận sát phạt' },
    { ten: 'Thạch Thất Tiền Bối', moTa: 'Mật thất bỏ hoang giữa vách đá, lưu giữ di bảo hoặc công pháp của tu sĩ tọa hóa.', nguyHiem: 'Khôi lỗi thủ vệ' }
  ]
};

function sinhDiaDiemCon(vung, loaiOverride = null) {
  let loai = loaiOverride;
  if (!loai) {
    const r = Math.random();
    if (r < 0.28) loai = 'dong_phu';
    else if (r < 0.56) loai = 'yeu_thu';
    else if (r < 0.80) loai = 'su_kien';
    else loai = 'linh_mach';
  }
  const mauList = DIA_DIEM_CON_MAU[loai] || DIA_DIEM_CON_MAU.su_kien;
  const mau = pickRandom(mauList);
  const hauTo = ['Đông', 'Tây', 'Nam', 'Bắc', 'Thượng', 'Hạ', 'Thâm Uyên', 'Hoang Dã'];
  const tenDayDu = Math.random() < 0.55 ? `${mau.ten} (${pickRandom(hauTo)})` : mau.ten;
  return {
    id: `dd_${vung.id}_${loai}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    ten: tenDayDu,
    loai,
    moTa: mau.moTa,
    nguyHiem: mau.nguyHiem,
    daKhamPha: false
  };
}

function damBaoDiaDiemVung(vungId = state.vungHienTai) {
  if (!state.diaDiemCon || typeof state.diaDiemCon !== 'object') state.diaDiemCon = {};
  const list = state.diaDiemCon[vungId];
  if (Array.isArray(list) && list.length > 0) return list;
  const vung = layVungDef(vungId);
  const khoiTao = [
    sinhDiaDiemCon(vung, 'su_kien'),
    sinhDiaDiemCon(vung, 'yeu_thu'),
    sinhDiaDiemCon(vung, 'linh_mach'),
    sinhDiaDiemCon(vung, Math.random() < 0.45 ? 'dong_phu' : 'su_kien')
  ];
  state.diaDiemCon[vungId] = khoiTao;
  return khoiTao;
}

function timDiaDiemNgauNhien() {
  if (state.ketThuc || state.tranHienTai || state.hauChienNpc || state.suKienHienTai || state.biCanhHienTai) return;
  const vung = layVungDef();
  const list = damBaoDiaDiemVung(vung.id);
  tienThoiGian(1);
  if (state.ketThuc || state.suKienHienTai || state.tranHienTai) {
    luuGame();
    veGiaoDien();
    return;
  }
  const ddMoi = sinhDiaDiemCon(vung, Math.random() < 0.34 ? 'dong_phu' : null);
  // Giữ tối đa 8 địa điểm con mỗi vùng, ưu tiên bỏ bớt điểm cũ đã khám phá
  while (list.length >= 8) {
    const idxOld = list.findIndex(d => d.daKhamPha && d.loai !== 'dong_phu');
    list.splice(idxOld >= 0 ? idxOld : 0, 1);
  }
  list.unshift(ddMoi);
  ghiNhatKy(
    `🔍 Thám thính tại 【${vung.ten}】 (1 tháng), phát hiện địa điểm mới: 【${ddMoi.ten}】!`,
    ddMoi.loai === 'dong_phu' ? 'dai_cat' : 'tot'
  );
  luuGame();
  veGiaoDien();
}

function khamPhaDiaDiemCon(ddId) {
  if (state.ketThuc || state.tranHienTai || state.hauChienNpc || state.suKienHienTai || state.biCanhHienTai) return;
  const vung = layVungDef();
  const list = damBaoDiaDiemVung(vung.id);
  const idx = list.findIndex(d => d.id === ddId);
  if (idx < 0) return;
  const dd = list[idx];

  if (dd.loai === 'su_kien') {
    dd.daKhamPha = true;
    lichLuyenOffline();
    return;
  }
  if (dd.loai === 'yeu_thu') {
    dd.daKhamPha = true;
    sanYeuThuVung();
    return;
  }
  if (dd.loai === 'linh_mach') {
    if (dd.daKhamPha) {
      ghiNhatKy(`Linh khí tại 【${dd.ten}】 đã thu thập cạn, hãy dò tìm địa điểm mới!`, 'canh_bao');
      veGiaoDien();
      return;
    }
    dd.daKhamPha = true;
    tienThoiGian(1);
    if (state.ketThuc || state.suKienHienTai || state.tranHienTai) {
      luuGame();
      veGiaoDien();
      return;
    }
    const maxCg = Math.min(9, Math.max(vung.canhGioiYeuCau || 0, state.canhGioi));
    const poolThao = (window.PN_DATA.vatPham || []).filter(v => {
      if (v.loai !== 'linh_thao') return false;
      if (maxCg <= 1 && (v.gia || 0) > 400) return false;
      if (maxCg <= 2 && (v.gia || 0) > 5000) return false;
      return true;
    });
    const thao = poolThao.length > 0 ? pickRandom(poolThao) : null;
    const tv = Math.max(10, Math.round(tinhTocDoTuLuyenNam() * 0.25));
    state.tuVi += tv;
    const hoi = Math.max(10, Math.round(tinhHpMax() * 0.15));
    state.hp = Math.min(tinhHpMax(), state.hp + hoi);
    if (thao && themVat(thao.id, 1)) {
      ghiNhatKy(`🌿 Khám phá 【${dd.ten}】 (1 tháng), hái được [${thao.ten}], hồi +${hoi} HP và +${tv} Tu vi!`, 'tot');
    } else {
      ghiNhatKy(`🌿 Điều tức tại 【${dd.ten}】 (1 tháng), hồi +${hoi} HP và lĩnh ngộ +${tv} Tu vi!`, 'tot');
    }
    luuGame();
    veGiaoDien();
    return;
  }
  if (dd.loai === 'dong_phu') {
    list.splice(idx, 1);
    tienThoiGian(2);
    if (state.ketThuc || state.suKienHienTai || state.tranHienTai) {
      luuGame();
      veGiaoDien();
      return;
    }
    const cgMin = Math.max(0, vung.canhGioiYeuCau || 0);
    const cgMax = Math.min(9, Math.max(cgMin, state.canhGioi + 1));
    const bcCustom = {
      id: dd.id,
      ten: dd.ten,
      vungId: vung.id,
      canhGioiMin: cgMin,
      canhGioiMax: cgMax,
      nguyHiem: [dd.nguyHiem || 'Cổ trận cấm chế'],
      phanThuongTen: ['Di bảo động phủ tiền nhân', 'Linh thảo trăm năm', 'Bí tịch tàn quyển'],
      phanThuong: []
    };
    state.biCanhHienTai = {
      id: dd.id,
      ten: dd.ten,
      buoc: 1,
      tongBuoc: 3 + Math.floor(Math.random() * 3), // 3..5 chặng ngẫu nhiên
      thuHoach: [],
      huongTiep: null,
      loaiTruoc: null,
      suKienBuoc: null,
      bcCustom
    };
    state.biCanhHienTai.suKienBuoc = sinhSuKienBiCanh();
    ghiNhatKy(`🌌 Phát hiện và tiến vào Động phủ bí ẩn 【${dd.ten}】 tại ${vung.ten} (${state.biCanhHienTai.tongBuoc} chặng ngẫu nhiên)!`, 'dai_cat');
    luuGame();
    veGiaoDien();
  }
}

function chonVatPhamBiCanh(bc, loaiUuTien = null) {
  const maxCg = Math.min(9, Math.max(state.canhGioi, bc.canhGioiMax ?? state.canhGioi));
  const daNhat = (state.biCanhHienTai && state.biCanhHienTai.thuHoach) || [];
  if (!loaiUuTien && Array.isArray(bc.phanThuong) && bc.phanThuong.length > 0 && Math.random() < 0.45) {
    const chon = pickRandom(bc.phanThuong);
    const vp = layVatPhamDef(chon);
    if (vp) return vp;
  }
  const pool = (window.PN_DATA.vatPham || []).filter(v => {
    if (v.loai === 'tru_vat') return false;
    if ((v.canhGioi ?? 0) > maxCg) return false;
    if (loaiUuTien && v.loai !== loaiUuTien) return false;
    if (v.loai === 'linh_thao' && maxCg <= 1 && (v.gia || 0) > 400) return false;
    if (v.loai === 'linh_thao' && maxCg <= 2 && (v.gia || 0) > 5000) return false;
    return !daNhat.includes(v.ten);
  });
  if (pool.length > 0) return pickRandom(pool);
  const fallback = (bc.phanThuong || []).map(id => layVatPhamDef(id)).filter(Boolean);
  return fallback.length > 0 ? pickRandom(fallback) : null;
}

function layBiCanhRunDef(run) {
  if (!run) return null;
  if (run.bcCustom) return run.bcCustom;
  return (window.PN_DATA.biCanh || []).find(b => b.id === run.id) || {
    id: run.id,
    ten: run.ten,
    canhGioiMin: state.canhGioi,
    canhGioiMax: state.canhGioi,
    phanThuong: []
  };
}

function sinhSuKienBiCanh() {
  const run = state.biCanhHienTai;
  if (!run) return null;
  const bc = layBiCanhRunDef(run);
  const cgMin = Math.max(0, bc.canhGioiMin ?? state.canhGioi);
  const cgMax = Math.min(state.canhGioi + 1, Math.max(cgMin, bc.canhGioiMax ?? state.canhGioi));
  const nguyHiemTxt = pickRandom(bc.nguyHiem || []) || 'Cấm chế cổ xưa rình rập';
  const baoVatTxt = pickRandom(bc.phanThuongTen || []) || 'Bảo vật vô danh';

  const timYeuThuBiCanh = () => {
    const allYt = window.PN_DATA.yeuThu || [];
    let pool = allYt.filter(y => y.canhGioi >= cgMin && y.canhGioi <= cgMax && y.canhGioi <= state.canhGioi + 1);
    if (pool.length === 0) pool = allYt.filter(y => y.canhGioi <= state.canhGioi);
    if (pool.length === 0) pool = allYt;
    return pickRandom(pool);
  };

  if (run.buoc >= run.tongBuoc) {
    const boss = timYeuThuBiCanh();
    const cgBoss = Math.min(9, cgMax);
    const cdef = layCanhGioiDef(cgBoss);
    return {
      loai: 'boss_tang_cuoi',
      tieuDe: `Lõi Bí Cảnh 【${bc.ten}】`,
      moTa: `Tiến tới tầng sâu nhất của 【${bc.ten}】, khí tức linh bảo [${baoVatTxt}] tỏa sáng rực rỡ sau lớp [${nguyHiemTxt}]. Trước mặt là thủ vệ [${boss ? boss.ten : 'Cổ Thú Thủ Hộ'}] (${layCanhGioiDef(boss ? boss.canhGioi : cgBoss).ten}) đang canh giữ!`,
      boss: boss
        ? {
            ten: `${boss.ten} · Thủ Vệ Lõi`,
            hp: Math.round(boss.hp * 1.2),
            congKich: Math.round(boss.congKich * 1.1),
            phongThu: Math.round(boss.phongThu * 1.05),
            linhThach: Math.round((boss.linhThach || 100) * 1.8),
            loot: boss.loot,
            canhGioiDich: boss.canhGioi
          }
        : {
            ten: `Thủ Vệ Cổ Trận (${cdef.ten})`,
            hp: Math.round(cdef.hpGoc * 1.3),
            congKich: Math.round(cdef.congKichGoc * 1.1),
            phongThu: cdef.phongThuGoc,
            linhThach: Math.round(140 * Math.pow(2.5, cgBoss)),
            canhGioiDich: cgBoss
          },
      choices: [
        { kieu: 'boss_danh', nhan: `⚔️ Quyết chiến Thủ Vệ đoạt đại bảo vật` },
        { kieu: 'boss_len', nhan: `🧿 Lợi dụng sơ hở đoạt bảo rồi rút (${Math.round(Math.min(80, 42 + (state.chiSo.khiVan + state.chiSo.thanThuc) * 0.45))}%)` },
        { kieu: 'rut_lui', nhan: `🚪 Rút lui an toàn, bảo toàn thu hoạch` }
      ]
    };
  }

  let loaiPool = ['yeu_thu', 'npc', 'bao_tang', 'di_chuyen', 'ky_ngo'].filter(l => l !== run.loaiTruoc);
  if (run.huongTiep && loaiPool.includes(run.huongTiep)) {
    loaiPool.push(run.huongTiep, run.huongTiep);
  }
  const loai = pickRandom(loaiPool);
  run.loaiTruoc = loai;
  run.huongTiep = null;

  if (loai === 'yeu_thu') {
    const yt = timYeuThuBiCanh();
    return {
      loai,
      tieuDe: 'Chạm Trán Yêu Thú Bí Cảnh',
      moTa: `Đang băng qua hành lang đổ nát của 【${bc.ten}】, một con [${yt.ten}] (${layCanhGioiDef(yt.canhGioi).ten}) bất ngờ lao ra chặn đường!`,
      yeuThu: yt,
      choices: [
        { kieu: 'danh_yt', nhan: `⚔️ Giao chiến tiêu diệt [${yt.ten}]` },
        {
          kieu: 'lach_yt',
          nhan:
            soLuongVat('phu_nghi_binh') > 0
              ? `🧿 Dùng [Nghi Binh Ẩn Thân Phù] lách qua (100% · Tiêu hao 1 phù)`
              : `🍃 Vận thân pháp lách qua (${Math.round(Math.min(85, 50 + (state.chiSo.khiVan + state.chiSo.ngoTinh) * 0.7))}%)`
        },
        { kieu: 'rut_lui', nhan: `🚪 Rút lui khỏi Bí cảnh` }
      ]
    };
  }

  if (loai === 'npc') {
    const npcPool = Object.values(state.npcs || {}).filter(
      n => n.conSong && n.canhGioi >= Math.max(0, cgMin - 1) && n.canhGioi <= state.canhGioi + 1
    );
    const npc = pickRandom(npcPool.length > 0 ? npcPool : Object.values(state.npcs || {}).filter(n => n.conSong));
    const phiTin = Math.max(35, Math.round(45 * Math.pow(2.1, state.canhGioi)));
    if (npc) {
      return {
        loai,
        tieuDe: 'Kỳ Ngộ Đồng Đạo Trong Bí Cảnh',
        moTa: `Giữa sương mù tại 【${bc.ten}】, bạn chạm mặt [${npc.ten}] (${tenCanhGioiDayDu(npc.canhGioi, npc.tieuCanh || 0)} · ${capBacQuanHe(npc)}). Đối phương cũng đang truy tìm tung tích [${baoVatTxt}].`,
        npcId: npc.id,
        phiTin,
        choices: [
          { kieu: 'npc_hop_tac', nhan: `🤝 Bắt tay hợp tác thám hiểm (+10 Hảo cảm)` },
          { kieu: 'npc_giao_dich', nhan: `🎁 Đổi tin tức & bảo vật (${phiTin.toLocaleString()} LT)` },
          { kieu: 'npc_danh', nhan: `🗡️ Ra tay tranh đoạt túi trữ vật` },
          { kieu: 'di_tiep', nhan: `⏩ Lặng lẽ lướt qua, tiến về phía trước` }
        ]
      };
    }
  }

  if (loai === 'bao_tang') {
    const vp = chonVatPhamBiCanh(bc);
    const lt = Math.round(90 * Math.pow(2.3, state.canhGioi));
    return {
      loai,
      tieuDe: 'Phát Hiện Cấm Chế Bảo Rương',
      moTa: `Sau bức tường đá có một thạch thất tỏa hào quang chứa ${vp ? `[${vp.ten}]` : `[${baoVatTxt}]`}, nhưng xung quanh đang giăng [${nguyHiemTxt}]!`,
      itemId: vp ? vp.id : null,
      linhThach: lt,
      choices: [
        { kieu: 'pha_cam_luc', nhan: `💥 Cường lực phá giải cấm chế` },
        { kieu: 'pha_cam_tri', nhan: `🧠 Vận Thần Thức dò trận nhãn (Theo Ngộ tính/Thần thức)` },
        { kieu: 'di_tiep', nhan: `⏩ Bỏ qua cạm bẫy, đi tiếp về phía trước` }
      ]
    };
  }

  if (loai === 'ky_ngo') {
    const lt = Math.round(110 * Math.pow(2.4, state.canhGioi));
    return {
      loai,
      tieuDe: 'Bia Đá Cổ Tu Lưu Truyền',
      moTa: `Trước mắt hiện ra một tấm cổ bi phủ đầy phù văn của tiền nhân để lại tại 【${bc.ten}】, dường như ẩn chứa tâm đắc công pháp cùng tàn dư linh khí.`,
      linhThach: lt,
      choices: [
        { kieu: 'linh_ngo_bia', nhan: `📜 Tĩnh tâm tham ngộ văn bia (+Tu vi / Cơ hội học bí tịch)` },
        { kieu: 'nhat_lt', nhan: `💎 Thu nhặt Linh thạch rải rác quanh tế đàn (+${lt.toLocaleString()} LT)` },
        { kieu: 'di_tiep', nhan: `⏩ Không dừng lại, tiến về phía trước` }
      ]
    };
  }

  // Mặc định: 'di_chuyen' ngã rẽ chọn hướng
  return {
    loai: 'di_chuyen',
    tieuDe: 'Ngã Rẽ Sâu Trong Bí Cảnh',
    moTa: `Con đường phía trước trong 【${bc.ten}】 chia làm nhiều lối: một lối thông sâu vào mật thất tỏa bảo quang, một lối dẫn sang dược viên bỏ hoang đầy sương mù.`,
    choices: [
      { kieu: 'di_loi', nhan: `🧭 Tiến về phía trước hướng Lõi Bí Cảnh (Tăng cơ hội gặp Bảo tàng)` },
      { kieu: 'di_duoc_vien', nhan: `🌿 Rẽ vào Linh Dược Viên hái thảo dược` },
      { kieu: 'nghi_ngoi', nhan: `⛺ Tạm dừng điều tức hồi phục (+30% Khí huyết)` },
      { kieu: 'rut_lui', nhan: `🚪 Rút lui khỏi Bí cảnh (Giữ toàn bộ thu hoạch)` }
    ]
  };
}

function hoanThanhBiCanh(rutLui = false) {
  const run = state.biCanhHienTai;
  if (!run) return;
  const ds = run.thuHoach.length > 0 ? run.thuHoach.join(', ') : 'Chưa thu được bảo vật nào';
  ghiNhatKy(
    `${rutLui ? '🚪 Rời khỏi' : '🏆 Hoàn thành thám hiểm'} 【${run.ten}】 (${run.buoc}/${run.tongBuoc} chặng). Chiến lợi phẩm: ${ds}.`,
    rutLui ? 'thuong' : 'dai_cat'
  );
  state.biCanhHienTai = null;
}

function tienBuocBiCanh() {
  const run = state.biCanhHienTai;
  if (!run) return;
  if (run.buoc >= run.tongBuoc) {
    hoanThanhBiCanh(false);
  } else {
    run.buoc += 1;
    run.suKienBuoc = sinhSuKienBiCanh();
  }
}

function thamHiemBiCanh(biCanhId) {
  if (state.ketThuc || state.tranHienTai || state.biCanhHienTai || state.suKienHienTai) return;
  const bc = window.PN_DATA.biCanh.find(b => b.id === biCanhId);
  if (!bc) return;

  if (state.canhGioi < bc.canhGioiMin || state.canhGioi > bc.canhGioiMax) {
    ghiNhatKy(
      `Cấm chế của [${bc.ten}] chỉ cho phép tu sĩ từ 【${layCanhGioiDef(bc.canhGioiMin).ten}】 đến 【${layCanhGioiDef(bc.canhGioiMax).ten}】 tiến vào!`,
      'canh_bao'
    );
    veGiaoDien();
    return;
  }
  if (state.linhThach < bc.phiLinhThach) {
    ghiNhatKy(`Cần ${bc.phiLinhThach.toLocaleString()} Linh thạch để vào [${bc.ten}]!`, 'canh_bao');
    veGiaoDien();
    return;
  }

  state.linhThach -= bc.phiLinhThach;
  quaNam(bc.namTon || 1);
  if (state.ketThuc) {
    luuGame();
    veGiaoDien();
    return;
  }

  state.biCanhHienTai = {
    id: bc.id,
    ten: bc.ten,
    buoc: 1,
    tongBuoc: 4 + Math.floor(Math.random() * 3), // 4..6 chặng ngẫu nhiên mỗi chuyến đi
    thuHoach: [],
    huongTiep: null,
    loaiTruoc: null,
    suKienBuoc: null
  };
  state.biCanhHienTai.suKienBuoc = sinhSuKienBiCanh();
  ghiNhatKy(`🌌 Bạn bước vào Bí Cảnh 【${bc.ten}】 (Tổng ${state.biCanhHienTai.tongBuoc} chặng thám hiểm ngẫu nhiên)!`, 'tot');
  luuGame();
  veGiaoDien();
}

function hanhDongBiCanh(idx) {
  const run = state.biCanhHienTai;
  if (!run || !run.suKienBuoc || state.tranHienTai) return;
  const sk = run.suKienBuoc;
  const ch = sk.choices[idx];
  if (!ch) return;
  const bc = layBiCanhRunDef(run);

  if (ch.kieu === 'rut_lui') {
    hoanThanhBiCanh(true);
    luuGame();
    veGiaoDien();
    return;
  }

  if (ch.kieu === 'danh_yt' && sk.yeuThu) {
    const yt = sk.yeuThu;
    batDauChienDau({
      ten: `${yt.ten} (${layCanhGioiDef(yt.canhGioi).ten})`,
      hp: yt.hp,
      congKich: yt.congKich,
      phongThu: yt.phongThu,
      linhThach: yt.linhThach,
      loot: yt.loot,
      canhGioiDich: yt.canhGioi,
      tuBiCanh: true
    });
    return;
  }

  if (ch.kieu === 'lach_yt') {
    const dungPhu = soLuongVat('phu_nghi_binh') > 0;
    if (dungPhu) themVat('phu_nghi_binh', -1);
    const tyLe = dungPhu ? 1.0 : Math.min(0.85, 0.5 + (state.chiSo.khiVan + state.chiSo.ngoTinh) * 0.007);
    if (Math.random() < tyLe) {
      ghiNhatKy(`🍃 ${dungPhu ? 'Dùng [Nghi Binh Ẩn Thân Phù] ' : ''}Lách qua [${sk.yeuThu.ten}] an toàn và tiếp tục tiến sâu.`, 'thuong');
    } else {
      const matHp = Math.max(10, Math.round(tinhHpMax() * 0.16));
      state.hp = Math.max(1, state.hp - matHp);
      ghiNhatKy(`💨 Lách qua vội vàng bị [${sk.yeuThu.ten}] cào trúng (-${matHp} Khí huyết) nhưng vẫn thoát được!`, 'canh_bao');
    }
    tienBuocBiCanh();
  } else if (ch.kieu === 'npc_hop_tac') {
    const npc = state.npcs[sk.npcId];
    if (npc) {
      thayDoiHaoCam(npc, 10, true);
      ghiKyUcNpc(npc, `Hợp tác thám hiểm cùng ${state.ten} tại ${bc.ten}.`);
    }
    const vp = Math.random() < 0.65 ? chonVatPhamBiCanh(bc) : null;
    if (vp && themVat(vp.id, 1)) {
      run.thuHoach.push(vp.ten);
      ghiNhatKy(`🤝 Cùng [${npc ? npc.ten : 'Đạo hữu'}] hợp tác mở cơ quan, thu được [${vp.ten}]!`, 'tot');
    } else {
      const tv = Math.round(tinhTocDoTuLuyenNam() * 0.7);
      state.tuVi += tv;
      run.thuHoach.push(`+${tv} Tu vi`);
      ghiNhatKy(`🤝 Đồng hành cùng [${npc ? npc.ten : 'Đạo hữu'}] khám phá di tích, lĩnh ngộ +${tv.toLocaleString()} Tu vi!`, 'tot');
    }
    tienBuocBiCanh();
  } else if (ch.kieu === 'npc_giao_dich') {
    const npc = state.npcs[sk.npcId];
    if (state.linhThach < sk.phiTin) {
      ghiNhatKy(`Không đủ ${sk.phiTin.toLocaleString()} Linh thạch để trao đổi với [${npc ? npc.ten : 'đạo hữu'}]!`, 'canh_bao');
      veGiaoDien();
      return;
    }
    state.linhThach -= sk.phiTin;
    if (npc) thayDoiHaoCam(npc, 8, true);
    const vp = chonVatPhamBiCanh(bc);
    if (vp && themVat(vp.id, 1)) {
      run.thuHoach.push(vp.ten);
      ghiNhatKy(`🎁 Trao đổi ${sk.phiTin.toLocaleString()} LT với [${npc ? npc.ten : 'Đạo hữu'}], đổi lấy [${vp.ten}]!`, 'tot');
    }
    tienBuocBiCanh();
  } else if (ch.kieu === 'npc_danh') {
    const npc = state.npcs[sk.npcId];
    if (npc) {
      thayDoiHaoCam(npc, -25, true);
      ghiKyUcNpc(npc, `Bị ${state.ten} đánh úp tranh bảo trong ${bc.ten}!`);
      batDauChienDau({
        ten: `${npc.ten} (${layCanhGioiDef(npc.canhGioi).ten})`,
        hp: npc.hp,
        congKich: npc.congKich,
        phongThu: npc.phongThu,
        linhThach: npc.linhThach,
        npcId: npc.id,
        canhGioiDich: npc.canhGioi,
        tuBiCanh: true
      });
      return;
    }
    tienBuocBiCanh();
  } else if (ch.kieu === 'pha_cam_luc' || ch.kieu === 'pha_cam_tri') {
    const tiLe =
      ch.kieu === 'pha_cam_tri'
        ? Math.min(0.92, 0.45 + (state.chiSo.ngoTinh + state.chiSo.thanThuc) * 0.008)
        : Math.min(0.85, 0.42 + (tinhCongKich() / Math.max(1, layCanhGioiDef().congKichGoc * 2.5)) * 0.25);
    if (Math.random() < tiLe) {
      const vp = sk.itemId ? layVatPhamDef(sk.itemId) : chonVatPhamBiCanh(bc);
      if (vp && themVat(vp.id, 1)) {
        run.thuHoach.push(vp.ten);
        ghiNhatKy(`✨ Phá giải cấm chế thành công, thu vào túi [${vp.ten}]!`, 'dai_cat');
      } else {
        state.linhThach += sk.linhThach || 100;
        run.thuHoach.push(`+${sk.linhThach || 100} LT`);
        ghiNhatKy(`💎 Mở rương thu được +${(sk.linhThach || 100).toLocaleString()} Linh thạch!`, 'tot');
      }
    } else {
      const matHp = Math.max(12, Math.round(tinhHpMax() * 0.18));
      state.hp = Math.max(1, state.hp - matHp);
      ghiNhatKy(`💥 Cấm chế phản phệ gây mất -${matHp.toLocaleString()} Khí huyết!`, 'canh_bao');
    }
    tienBuocBiCanh();
  } else if (ch.kieu === 'linh_ngo_bia') {
    const tv = Math.round(tinhTocDoTuLuyenNam() * 1.1);
    state.tuVi += tv;
    run.thuHoach.push(`+${tv} Tu vi`);
    const cpChuaHoc = (window.PN_DATA.congPhap || []).filter(
      c => !state.congPhapDaHoc.includes(c.id) && (c.canhGioi ?? 0) <= Math.min(9, bc.canhGioiMax ?? state.canhGioi)
    );
    if (cpChuaHoc.length > 0 && Math.random() < 0.25 + state.chiSo.ngoTinh * 0.005) {
      const cp = pickRandom(cpChuaHoc);
      state.congPhapDaHoc.push(cp.id);
      run.thuHoach.push(`Bí tịch ${cp.ten}`);
      ghiNhatKy(`📜 Lĩnh ngộ văn bia cổ tu: +${tv.toLocaleString()} Tu vi và ngộ ra công pháp 【${cp.ten}】!`, 'dai_cat');
    } else {
      ghiNhatKy(`📜 Tham ngộ phù văn cổ bi, tâm cảnh sáng suốt hơn (+${tv.toLocaleString()} Tu vi)!`, 'tot');
    }
    tienBuocBiCanh();
  } else if (ch.kieu === 'nhat_lt') {
    state.linhThach += sk.linhThach || 100;
    run.thuHoach.push(`+${sk.linhThach || 100} LT`);
    ghiNhatKy(`💎 Thu nhặt quanh tế đàn được +${(sk.linhThach || 100).toLocaleString()} Linh thạch!`, 'tot');
    tienBuocBiCanh();
  } else if (ch.kieu === 'di_loi') {
    const tv = Math.round(tinhTocDoTuLuyenNam() * 0.45);
    state.tuVi += tv;
    run.huongTiep = 'bao_tang';
    ghiNhatKy(`🧭 Tiến sâu vào Lõi Bí Cảnh, hấp thu linh khí sót lại (+${tv.toLocaleString()} Tu vi).`, 'thuong');
    tienBuocBiCanh();
  } else if (ch.kieu === 'di_duoc_vien') {
    const thao = chonVatPhamBiCanh(bc, 'linh_thao');
    if (thao && themVat(thao.id, 1)) {
      run.thuHoach.push(thao.ten);
      ghiNhatKy(`🌿 Lối mòn dẫn vào Linh Dược Viên hoang phế, hái được 1 gốc [${thao.ten}]!`, 'tot');
    } else {
      ghiNhatKy(`🌿 Dược viên đã bị người đi trước hái sạch, đành đi tiếp.`, 'thuong');
    }
    run.huongTiep = 'yeu_thu';
    tienBuocBiCanh();
  } else if (ch.kieu === 'nghi_ngoi') {
    const hoi = Math.round(tinhHpMax() * 0.3);
    state.hp = Math.min(tinhHpMax(), state.hp + hoi);
    ghiNhatKy(`⛺ Tạm dừng vận công điều tức (+${hoi.toLocaleString()} Khí huyết).`, 'tot');
    tienBuocBiCanh();
  } else if (ch.kieu === 'boss_danh' && sk.boss) {
    batDauChienDau({
      ...sk.boss,
      tuBiCanh: true,
      laBossBiCanh: true
    });
    return;
  } else if (ch.kieu === 'boss_len') {
    const tyLe = Math.min(0.8, 0.42 + (state.chiSo.khiVan + state.chiSo.thanThuc) * 0.0045);
    if (Math.random() < tyLe) {
      const vp = chonVatPhamBiCanh(bc);
      if (vp && themVat(vp.id, 1)) {
        run.thuHoach.push(vp.ten);
        ghiNhatKy(`🧿 Thừa lúc Thủ Vệ lơ là, bạn chớp lấy [${vp.ten}] rồi thoát ra an toàn!`, 'dai_cat');
      }
      hoanThanhBiCanh(false);
    } else {
      const matHp = Math.max(15, Math.round(tinhHpMax() * 0.25));
      state.hp = Math.max(1, state.hp - matHp);
      ghiNhatKy(`💥 Bị Thủ Vệ Lõi phát giác đánh lùi (-${matHp.toLocaleString()} Khí huyết), phải tháo chạy khỏi Bí cảnh!`, 'nguy_hiem');
      hoanThanhBiCanh(true);
    }
    luuGame();
    veGiaoDien();
    return;
  } else {
    // 'di_tiep'
    ghiNhatKy(`⏩ Bạn tiếp tục tiến về phía trước trong 【${bc.ten}】.`, 'thuong');
    tienBuocBiCanh();
  }

  luuGame();
  veGiaoDien();
}

function sanYeuThuVung() {
  if (state.ketThuc || state.tranHienTai || state.suKienHienTai) return;
  const allYt = window.PN_DATA.yeuThu || [];
  // Chỉ gặp yêu thú ngang cảnh giới hoặc thấp hơn (không vượt đại cảnh giới gây mất cân bằng)
  let pool = allYt.filter(y => y.vungId === state.vungHienTai && y.canhGioi === state.canhGioi);
  if (pool.length === 0) {
    pool = allYt.filter(
      y => y.vungId === state.vungHienTai && y.canhGioi <= state.canhGioi && y.canhGioi >= Math.max(0, state.canhGioi - 1)
    );
  }
  if (pool.length === 0) {
    pool = allYt.filter(y => y.canhGioi === state.canhGioi);
  }
  if (pool.length === 0) {
    pool = allYt.filter(y => y.canhGioi <= state.canhGioi);
  }

  const yt = pickRandom(pool);
  if (!yt) return;
  tienThoiGian(1);
  if (state.ketThuc) {
    luuGame();
    veGiaoDien();
    return;
  }

  // Điều chỉnh sức mạnh yêu thú mượt theo tiểu cảnh giới hiện tại của người chơi
  const tieuLen = Math.max(1, (layCanhGioiDef().tieuCanh || []).length);
  const heSoTieu = yt.canhGioi === state.canhGioi ? 0.72 + (state.tieuCanh / tieuLen) * 0.55 : 1.0;
  const lootId = pickRandom(yt.roiDo || []);
  batDauChienDau({
    ten: `${yt.ten} (${layCanhGioiDef(yt.canhGioi).ten})`,
    hp: Math.round(yt.hp * heSoTieu),
    congKich: Math.round(yt.congKich * heSoTieu),
    phongThu: Math.round(yt.phongThu * heSoTieu),
    linhThach: yt.linhThach,
    loot: lootId,
    canhGioiDich: yt.canhGioi
  });
}

// ==========================================
// 8. SỰ KIỆN LỊCH LUYỆN OFFLINE & CHIẾN ĐẤU
// ==========================================

function scaleGiaTriTheoCanhGioi(val, eventMinCg = 0) {
  const diff = Math.max(0, state.canhGioi - eventMinCg);
  if (diff <= 0) return val;
  return Math.round(val * Math.pow(2.3, Math.min(diff, 5)));
}

// Bộ máy Sự kiện kiểu Vạn Kiếp Tu Tiên: Biến cố dọc đường/bế quan, Nhân quả nở hoa, Chống lặp, Kiểm định % (Tác giả: Gemini (Antigravity))
const CHI_SO_NHAN = {
  canCot: 'Căn cốt',
  ngoTinh: 'Ngộ tính',
  khiVan: 'Khí vận',
  thanThuc: 'Thần thức'
};

function tinhChiSoHieuDung(key) {
  const cpSum = tinhCongPhapTongHop();
  return (state?.chiSo?.[key] || 10) + (cpSum?.[key] || 0);
}

function tinhTiLeKiemDinh(check) {
  if (!check || !state) return 50;
  const val = tinhChiSoHieuDung(check.chiSo || 'ngoTinh');
  const doKhoScale = (Number(check.doKho) || 15) + (state.canhGioi || 0) * 4;
  // P(val + rand(0..14) >= doKhoScale) = (val + 14 - doKhoScale) / 14
  const pct = Math.round(((val + 14 - doKhoScale) / 14) * 100);
  return Math.max(10, Math.min(95, pct));
}

function moTaCheckLuaChon(lc) {
  if (!lc || !lc.check) return '';
  const tenCs = CHI_SO_NHAN[lc.check.chiSo] || lc.check.chiSo || 'Chỉ số';
  const pct = tinhTiLeKiemDinh(lc.check);
  const cls = pct >= 70 ? 'hl-green' : pct >= 40 ? 'hl-gold' : 'hl-danger';
  return ` <span class="${cls}">[${tenCs} · ${pct}%]</span>`;
}

function gieoHatNhanQua({ loai, npcId = null, tenDoiTuong = '', namCho = 3, moTa = '' }) {
  if (!state) return;
  if (!Array.isArray(state.hatNhanQua)) state.hatNhanQua = [];
  if (state.hatNhanQua.length >= 12) state.hatNhanQua.shift();
  const npc = npcId && state.npcs ? state.npcs[npcId] : null;
  state.hatNhanQua.push({
    id: `nq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    loai: loai || 'co_duyen',
    npcId: npcId || null,
    tenDoiTuong: tenDoiTuong || (npc ? npc.ten : 'Cố nhân vô danh'),
    namNo: (state.nam || 1) + Math.max(1, namCho),
    moTa: moTa || ''
  });
}

function kiemTraNoNhanQua(epChay = false) {
  if (!state || state.ketThuc || state.suKienHienTai || state.tranHienTai || state.hauChienNpc) return false;
  if (!Array.isArray(state.hatNhanQua) || state.hatNhanQua.length === 0) return false;
  const idx = state.hatNhanQua.findIndex(h => epChay || (state.nam || 1) >= h.namNo);
  if (idx < 0) return false;
  if (!epChay && Math.random() > 0.55) return false;

  const [hat] = state.hatNhanQua.splice(idx, 1);
  const npc = hat.npcId && state.npcs ? state.npcs[hat.npcId] : null;
  const tenDt = (npc && npc.conSong ? npc.ten : hat.tenDoiTuong) || 'Đạo hữu năm xưa';
  const vung = layVungDef();
  const cdef = layCanhGioiDef();
  const ltThuong = Math.round(90 * Math.pow(2.4, state.canhGioi));
  const tvThuong = Math.max(25, Math.round((cdef.baseTuViNam || 40) * 0.45));

  if (hat.loai === 'an_nghia') {
    const quaPool = (window.PN_DATA.vatPham || []).filter(v => (v.loai === 'dan' || v.loai === 'linh_thao') && (v.canhGioi ?? 0) <= state.canhGioi);
    const qua = pickRandom(quaPool);
    state.suKienHienTai = {
      id: `sk_nq_${hat.id}`,
      bienCo: 'nhan_qua',
      ten: `🌱 Nhân Quả Nở Hoa: Cố nhân 【${tenDt}】 đáp lễ`,
      text: `Đang dừng bước tại 【${vung.ten}】, một tu sĩ tiến lại chắp tay: "${hat.moTa || `Ân tình năm xưa với ${tenDt} đến nay chưa từng quên.`}" Hôm nay tương phùng, đối phương dâng lên lễ vật tạ ân.`,
      choices: [
        {
          text: `Nhận lễ vật và đàm đạo (${ltThuong.toLocaleString()} LT${qua ? ` + ${qua.ten}` : ''})`,
          effects: [
            { linhThach: ltThuong, addItem: qua ? qua.id : null, log: `🤝 Nhận lễ tạ ân của 【${tenDt}】 (+${ltThuong.toLocaleString()} LT${qua ? `, [${qua.ten}]` : ''})!` },
            ...(npc && npc.conSong ? [{ haoCamNpc: { npcId: npc.id, delta: 12, lyDo: `Tái ngộ và đáp ân ${state.ten} tại ${vung.ten}.` } }] : [])
          ]
        },
        {
          text: `Khách khí từ chối lễ, chỉ xin lĩnh giáo tâm đắc tu hành (+Tu vi & +Ngộ tính)`,
          effects: [
            { tuVi: tvThuong, chiSo: { ngoTinh: 1 }, log: `📜 Cùng 【${tenDt}】 luận đạo một canh giờ, tâm cảnh khoáng đạt (+${tvThuong.toLocaleString()} Tu vi, +1 Ngộ tính)!` },
            ...(npc && npc.conSong ? [{ haoCamNpc: { npcId: npc.id, delta: 15, lyDo: `Cùng ${state.ten} luận đạo tạ ân.` } }] : [])
          ]
        }
      ]
    };
    ghiNhatKy(`🌱 Nhân quả 【Ân nghĩa】 với [${tenDt}] đã nở hoa tại ${vung.ten}!`, 'dai_cat');
    return true;
  }

  if (hat.loai === 'thu_oan') {
    const cgDich = Math.min(9, state.canhGioi);
    const cgDef = layCanhGioiDef(cgDich);
    state.suKienHienTai = {
      id: `sk_nq_${hat.id}`,
      bienCo: 'nhan_qua',
      ten: `⚡ Nhân Quả Báo Ứng: 【${tenDt}】 tìm tới tính sổ`,
      text: `Ác nhân hay oán thù cũ không tự nhiên tiêu tan. Tại 【${vung.ten}】, sát khí bỗng khóa chặt lấy bạn — ${hat.moTa || `người liên quan đến ân oán với [${tenDt}]`} đã lần theo dấu vết tìm tới đòi nợ máu!`,
      choices: [
        {
          text: `Rút binh khí nghênh chiến giải quyết dứt điểm`,
          effects: [
            {
              combat: {
                ten: `Tầm Cừu Giả · ${tenDt}`,
                hp: Math.round(cgDef.hpGoc * 1.15),
                congKich: Math.round(cgDef.congKichGoc * 1.1),
                phongThu: cgDef.phongThuGoc,
                linhThach: ltThuong,
                canhGioiDich: cgDich,
                giuNguyenChiSo: true,
                npcId: npc && npc.conSong ? npc.id : null
              }
            }
          ]
        },
        {
          text: `Đoán trước phục kích, mượn địa hình thoái lui`,
          check: { chiSo: 'thanThuc', doKho: 17 },
          success: [{ log: `🦅 Nhờ Thần thức nhạy bén, bạn né tránh trận phục kích của 【${tenDt}】 an toàn!` }],
          failure: [{ hp: -35, thuongThe: 1, log: `💥 Tính sai đường lui, bị dư ba kiếm khí quét trúng trọng thương!` }]
        }
      ]
    };
    ghiNhatKy(`⚡ Nhân quả 【Thù oán】 với [${tenDt}] phát tác tại ${vung.ten}!`, 'nguy_hiem');
    return true;
  }

  if (hat.loai === 'truy_na_tong_mon') {
    const cgDich = Math.min(9, Math.max(state.canhGioi, hat.canhGioi || state.canhGioi));
    const cgDef = layCanhGioiDef(cgDich);
    state.suKienHienTai = {
      id: `sk_nq_${hat.id}`,
      bienCo: 'nhan_qua',
      ten: `⚖️ Chấp Pháp Truy Nã: 【${tenDt}】 chặn đường`,
      text: `Ngoài địa giới 【${vung.ten}】, mấy bóng áo bào sư môn cũ hạ xuống chặn trước mặt bạn. Đệ tử Chấp Pháp Đường của 【${tenDt}】 giơ lệnh bài truy nã phản đồ: "Tự tiện phản môn bỏ trốn, theo môn quy hôm nay phải thanh lý!"`,
      choices: [
        {
          text: `Rút pháp bảo nghênh chiến Chấp Pháp Đường`,
          effects: [
            {
              combat: {
                ten: `Chấp Pháp Đệ Tử · ${tenDt}`,
                hp: Math.round(cgDef.hpGoc * 1.25),
                congKich: Math.round(cgDef.congKichGoc * 1.15),
                phongThu: Math.round(cgDef.phongThuGoc * 1.1),
                linhThach: Math.round(ltThuong * 1.1),
                canhGioiDich: cgDich,
                giuNguyenChiSo: true
              }
            }
          ]
        },
        {
          text: `Nộp ${Math.round(ltThuong * 1.4).toLocaleString()} LT xin hòa giải xóa sổ truy nã`,
          requires: { linhThach: Math.round(ltThuong * 1.4) },
          effects: [
            {
              theLucDelta: hat.tmId ? { tmId: hat.tmId, delta: 12 } : null,
              log: `💰 Bạn nộp linh thạch bồi thường cho Chấp Pháp Đường 【${tenDt}】, lệnh truy nã được thu hồi!`
            }
          ]
        },
        {
          text: `Thi triển độn thuật liều mạng thoát thân`,
          check: { chiSo: 'khiVan', doKho: 18 },
          success: [{ log: `💨 Bạn vượt qua vòng vây Chấp Pháp Đường 【${tenDt}】 trong gang tấc!` }],
          failure: [{ hp: -40, thuongThe: 1, log: `💥 Bị trận kỳ Chấp Pháp Đường quét trúng khi tháo chạy, thương thế gia tăng!` }]
        }
      ]
    };
    ghiNhatKy(`⚖️ Chấp Pháp Đường của 【${tenDt}】 lần tới truy nã tại ${vung.ten}!`, 'nguy_hiem');
    return true;
  }

  // 'co_duyen'
  const thaoPool = (window.PN_DATA.vatPham || []).filter(v => ['linh_thao', 'dan', 'phu_luc'].includes(v.loai) && (v.canhGioi ?? 0) <= state.canhGioi + 1);
  const vatQuy = pickRandom(thaoPool);
  state.suKienHienTai = {
    id: `sk_nq_${hat.id}`,
    bienCo: 'nhan_qua',
    ten: `✨ Nhân Quả Kỳ Ngộ: Tin tức từ 【${tenDt}】`,
    text: `Cơ duyên năm xưa ngươi gieo xuống hôm nay kết trái tại 【${vung.ten}】: ${hat.moTa || `một đầu mối bảo tàng bất ngờ truyền tới đúng lúc ngươi đi ngang.`}`,
    choices: [
      {
        text: `Theo manh mối thám thính thu hoạch bảo vật`,
        check: { chiSo: 'khiVan', doKho: 15 },
        success: [{ linhThach: ltThuong, addItem: vatQuy ? vatQuy.id : null, log: `🎁 Thuận lợi thu về cơ duyên (+${ltThuong.toLocaleString()} LT${vatQuy ? `, [${vatQuy.ten}]` : ''})!` }],
        failure: [{ tuVi: Math.round(tvThuong * 0.5), log: `🍃 Bảo tàng đã có người nhanh chân hơn, chỉ thu được chút linh khí tàn dư.` }]
      },
      {
        text: `Không tham lam dị bảo, tĩnh tâm ngộ đạo`,
        effects: [{ tuVi: tvThuong, mp: 100, log: `🧘 Giữ vững đạo tâm, thu hoạch +${tvThuong.toLocaleString()} Tu vi.` }]
      }
    ]
  };
  return true;
}

function chonSuKienTuKho(pool) {
  if (!Array.isArray(pool) || pool.length === 0) return null;
  if (!state.suKienDaGap || typeof state.suKienDaGap !== 'object') state.suKienDaGap = {};
  const namHienTai = state.nam || 1;
  // Ưu tiên sự kiện hết hồi chiêu (>= 6 năm) hoặc chưa từng gặp trong kiếp này
  let hopLe = pool.filter(s => !state.suKienDaGap[s.id] || namHienTai - state.suKienDaGap[s.id] >= 6);
  if (hopLe.length === 0) hopLe = pool;
  const chuaGap = hopLe.filter(s => !state.suKienDaGap[s.id]);
  const chon = chuaGap.length > 0 && Math.random() < 0.8 ? pickRandom(chuaGap) : pickRandom(hopLe);
  if (chon) state.suKienDaGap[chon.id] = namHienTai;
  return chon;
}

function kiemTraBienCoHanhDong(loaiBienCo) {
  if (!state || state.ketThuc || state.suKienHienTai || state.tranHienTai || state.hauChienNpc) return false;
  const vung = layVungDef();
  const cdef = layCanhGioiDef();
  const cg = state.canhGioi || 0;
  const ltChuan = Math.round(65 * Math.pow(2.4, cg));
  const tvChuan = Math.max(20, Math.round((cdef.baseTuViNam || 40) * 0.4));

  if (loaiBienCo === 'duong') {
    const mau = pickRandom([
      {
        id: 'bc_duong_mai_lo',
        ten: `🛤️ Biến Cố Dọc Đường: Tán tu chặn lối tại 【${vung.ten}】`,
        text: `Trên đường di chuyển qua vùng giáp ranh 【${vung.ten}】, một nhóm tán tu hung hãn bất ngờ phóng phi kiếm chặn ngang lối đi: "Qua địa bàn này phải nộp ${ltChuan.toLocaleString()} Linh thạch mãi lộ, bằng không để lại túi trữ vật!"`,
        choices: [
          {
            text: `Nộp ${ltChuan.toLocaleString()} Linh thạch tiêu tài miễn họa`,
            requires: { linhThach: ltChuan },
            effects: [{ linhThach: -ltChuan, log: `🪙 Nộp ${ltChuan.toLocaleString()} LT mua đường bình an qua ${vung.ten}.` }]
          },
          {
            text: `Quát lớn rút pháp bảo giao chiến`,
            effects: [
              {
                combat: {
                  ten: `Đầu Lĩnh Kiếp Tu (${cdef.ten})`,
                  hp: Math.round(cdef.hpGoc * 1.05),
                  congKich: Math.round(cdef.congKichGoc * 0.95),
                  phongThu: Math.round(cdef.phongThuGoc * 0.9),
                  linhThach: Math.round(ltChuan * 1.6),
                  canhGioiDich: cg,
                  giuNguyenChiSo: true
                }
              }
            ]
          },
          {
            text: `Vận Khí vận & Thân pháp luồn lách né tránh`,
            check: { chiSo: 'khiVan', doKho: 15 },
            success: [{ tuVi: tvChuan, log: `💨 Thoát khỏi vòng vây dọc đường và thu hoạch thêm kinh nghiệm hành tẩu!` }],
            failure: [{ hp: -25, thuongThe: 1, log: `💥 Bị ám khí quẹt trúng bả vai khi phá vây thoát thân!` }]
          }
        ]
      },
      {
        id: 'bc_duong_thuong_nhan',
        ten: `🛒 Biến Cố Dọc Đường: Du thương bí ẩn`,
        text: `Dọc cổ đạo hướng về 【${vung.ten}】, bạn bắt gặp một du thương mặc áo bào xám đang nghỉ chân bên suối, bày ra mấy hộp ngọc có linh khí dao động bất thường.`,
        choices: [
          {
            text: `Mua 1 túi vật phẩm ngẫu nhiên (${ltChuan.toLocaleString()} LT)`,
            requires: { linhThach: ltChuan },
            effects: [
              {
                linhThach: -ltChuan,
                nhanQua: { loai: 'co_duyen', tenDoiTuong: 'Du Thương Áo Xám', namCho: 3, moTa: 'Đầu mối kho báu cổ do vị du thương năm xưa gửi gắm' },
                log: `🤝 Giao dịch cùng du thương áo xám và gieo một mối duyên kỳ ngộ cho tương lai!`
              }
            ]
          },
          {
            text: `Dùng Thần thức giám định thật giả trước khi quyết định`,
            check: { chiSo: 'thanThuc', doKho: 16 },
            success: [{ linhThach: Math.round(ltChuan * 0.8), tuVi: tvChuan, log: `👁️ Nhìn thấu hàng thật giá hời, trao đổi kiếm lời một khoản Linh thạch!` }],
            failure: [{ log: `🌫️ Lão thương nhân chỉ mỉm cười thu hộp ngọc rồi biến mất trong sương mù.` }]
          },
          {
            text: `Chắp tay cáo từ, tiếp tục lên đường`,
            effects: [{ log: `🚶 Bạn tiếp tục hành trình tới ${vung.ten}.` }]
          }
        ]
      }
    ]);
    state.suKienHienTai = mau;
    ghiNhatKy(`🛤️ Trên đường di chuyển tới 【${vung.ten}】 bất ngờ phát sinh biến cố!`, 'canh_bao');
    return true;
  }

  if (loaiBienCo === 'be_quan') {
    const mauBq = pickRandom([
      {
        id: 'bc_bq_yeu_thu_danh_hoi',
        ten: `🐾 Biến Cố Bế Quan: Yêu thú đánh hơi linh khí`,
        text: `Trong lúc bế quan thu nạp linh khí tại 【${vung.ten}】, dao động linh lực quá mạnh khiến một con yêu thú hung hãn đánh hơi tìm tới ngoài cửa động!`,
        choices: [
          {
            text: `Xuất quan chém giết yêu thú bảo toàn tĩnh tu`,
            effects: [
              {
                combat: {
                  ten: `Yêu Thú Quấy Nhiễu (${cdef.ten})`,
                  hp: Math.round(cdef.hpGoc * 1.1),
                  congKich: cdef.congKichGoc,
                  phongThu: cdef.phongThuGoc,
                  linhThach: ltChuan,
                  canhGioiDich: cg,
                  giuNguyenChiSo: true
                }
              }
            ]
          },
          {
            text: `Thu liễm toàn bộ khí tức giả làm đá gỗ`,
            check: { chiSo: 'canCot', doKho: 15 },
            success: [{ log: `🪨 Khí tức thu liễm hoàn mỹ, con yêu thú lượn quanh một vòng rồi bỏ đi.` }],
            failure: [{ hp: -30, thuongThe: 1, log: `💥 Thu khí quá gấp khiến chân khí nghịch hành trọng thương!` }]
          }
        ]
      },
      {
        id: 'bc_bq_linh_co_nhat_dong',
        ten: `✨ Biến Cố Bế Quan: Linh cơ nhất động`,
        text: `Chu thiên vận chuyển suốt nhiều năm đột nhiên xuất hiện một luồng thanh khí xông thẳng lên Nê Hoàn Cung — đây là cơ hội đột ngộ hiếm có nhưng cũng tiềm ẩn tẩu hỏa nếu ép quá sức!`,
        choices: [
          {
            text: `Thừa cơ trùng kích kinh mạch lĩnh ngộ`,
            check: { chiSo: 'ngoTinh', doKho: 16 },
            success: [{ tuVi: Math.round(tvChuan * 2.2), chiSo: { thanThuc: 1 }, log: `⚡ Đốn ngộ đại thành! Nhận thêm +${Math.round(tvChuan * 2.2).toLocaleString()} Tu vi và +1 Thần thức!` }],
            failure: [{ thuongThe: 1, hp: -25, log: `🩸 Ép kinh mạch quá độ dẫn đến nội thương nhẹ!` }]
          },
          {
            text: `Cẩn trọng giữ vững tâm thần, thuận theo tự nhiên`,
            effects: [{ tuVi: tvChuan, log: `🧘 An ổn giữ vững căn cơ (+${tvChuan.toLocaleString()} Tu vi).` }]
          }
        ]
      }
    ]);
    state.suKienHienTai = mauBq;
    ghiNhatKy(`⚡ Trong lúc bế quan tại 【${vung.ten}】 phát sinh biến cố!`, 'canh_bao');
    return true;
  }

  return false;
}

function lichLuyenOffline() {
  if (state.ketThuc || state.tranHienTai || state.hauChienNpc || state.suKienHienTai) return;
  tienThoiGian(2);
  if (state.ketThuc || state.suKienHienTai || state.tranHienTai) {
    luuGame();
    veGiaoDien();
    return;
  }

  const vung = layVungDef();
  let pool = window.PN_DATA.suKienOffline.filter(sk => {
    const cg = sk.canhGioi || [0, 9];
    const hopCg = state.canhGioi >= cg[0] && state.canhGioi <= cg[1];
    const hopVung = Array.isArray(sk.vung) && sk.vung.includes(state.vungHienTai);
    return hopCg && hopVung;
  });
  if (pool.length === 0) {
    pool = window.PN_DATA.suKienOffline.filter(sk => {
      const cg = sk.canhGioi || [0, 9];
      const hopCg = state.canhGioi >= cg[0] && state.canhGioi <= cg[1];
      if (!hopCg) return false;
      const txt = `${sk.ten} ${sk.text}`.toLowerCase();
      // Khớp phong thổ sơ bộ giống Đạo Diễn VKTT: thành thị ưu tiên phường thị, hoang dã ưu tiên sơn mạch/địa điểm
      if (vung.coPhuongThi) return !/hải đảo|ngoại hải/.test(txt);
      return true;
    });
  }
  if (pool.length === 0) pool = window.PN_DATA.suKienOffline;

  const picked = chonSuKienTuKho(pool);
  const sk = JSON.parse(JSON.stringify(picked));
  // Chèn tên đạo hữu đang có mặt ở vùng nếu là sự kiện chạm trán chung
  const npcTaiVung = Object.values(state.npcs || {}).filter(n => n.conSong && n.vungId === vung.id);
  if (npcTaiVung.length > 0 && typeof sk.text === 'string' && sk.text.includes('{npc}')) {
    sk.text = sk.text.replace(/\{npc\}/g, pickRandom(npcTaiVung).ten);
  }
  state.suKienHienTai = sk;
  luuGame();
  veGiaoDien();
}

function timVatPhamTheoLoai(loai) {
  for (const [id, sl] of Object.entries(state.tuiDo || {})) {
    if (sl <= 0) continue;
    const vp = layVatPhamDef(id);
    if (vp && vp.loai === loai) return vp;
  }
  return null;
}

function kiemTraDieuKienLuaChon(lc) {
  const req = lc && lc.requires;
  if (!req) return { du: true, nhan: '' };

  if (req.linhThach && state.linhThach < req.linhThach) {
    return { du: false, nhan: `Thiếu ${req.linhThach.toLocaleString()} Linh thạch` };
  }
  if (req.congHien && (!state.tongMon || state.tongMon.congHien < req.congHien)) {
    return { du: false, nhan: `Thiếu ${req.congHien} Cống hiến` };
  }
  if (req.itemId && soLuongVat(req.itemId) <= 0) {
    const vp = layVatPhamDef(req.itemId);
    return { du: false, nhan: `Cần: ${req.tenYeuCau || (vp ? vp.ten : req.itemId)}` };
  }
  if (req.itemLoai && !timVatPhamTheoLoai(req.itemLoai)) {
    return { du: false, nhan: `Cần: ${req.tenYeuCau || req.itemLoai}` };
  }
  if (req.phapBao && !state.phapBao && !timVatPhamTheoLoai('phap_bao')) {
    return { du: false, nhan: `Cần: ${req.tenYeuCau || 'Pháp bảo'}` };
  }

  // Nhãn khi đủ điều kiện
  if (req.itemId) {
    const vp = layVatPhamDef(req.itemId);
    return { du: true, nhan: `Dùng 1 ${vp ? vp.ten : req.tenYeuCau}` };
  }
  if (req.itemLoai) {
    const vp = timVatPhamTheoLoai(req.itemLoai);
    return { du: true, nhan: `Dùng 1 ${vp.ten}` };
  }
  if (req.phapBao) {
    return { du: true, nhan: `Đang có Pháp bảo` };
  }
  if (req.linhThach) {
    return { du: true, nhan: `Tiêu ${req.linhThach.toLocaleString()} LT` };
  }
  if (req.congHien) {
    return { du: true, nhan: `Nộp ${req.congHien} Cống hiến` };
  }
  return { du: true, nhan: '' };
}

function tieuHaoDieuKienLuaChon(lc) {
  const req = lc && lc.requires;
  if (!req) return;
  if (req.linhThach) state.linhThach = Math.max(0, state.linhThach - req.linhThach);
  if (req.congHien && state.tongMon) thayDoiCongHienTongMon(-req.congHien);
  if (req.itemId && !req.khongTieuHao) themVat(req.itemId, -1);
  if (req.itemLoai && !req.khongTieuHao) {
    const vp = timVatPhamTheoLoai(req.itemLoai);
    if (vp) themVat(vp.id, -1);
  }
}

function chonLuaChonSuKien(idx) {
  if (!state.suKienHienTai) return;
  const sk = state.suKienHienTai;
  const lc = sk.choices[idx];
  if (!lc) return;

  const checkReq = kiemTraDieuKienLuaChon(lc);
  if (!checkReq.du) {
    ghiNhatKy(`⚠️ Không thể chọn mục này (${checkReq.nhan})!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  tieuHaoDieuKienLuaChon(lc);

  let dsHieuUng = lc.effects || [];
  if (lc.check) {
    const tiLePct = tinhTiLeKiemDinh(lc.check);
    const thanhCong = Math.random() * 100 < tiLePct;
    const tenCs = CHI_SO_NHAN[lc.check.chiSo] || lc.check.chiSo || 'Chỉ số';
    ghiNhatKy(
      `🎲 Kiểm định [${tenCs}] (${tiLePct}%) → ${thanhCong ? 'Thành công!' : 'Thất bại!'}`,
      thanhCong ? 'tot' : 'canh_bao'
    );
    dsHieuUng = thanhCong ? lc.success || [] : lc.failure || [];
  }

  const baseCg = Array.isArray(sk.canhGioi) ? sk.canhGioi[0] : 0;
  state.suKienHienTai = null;
  thucThiHieuUng(dsHieuUng, baseCg);
  luuGame();
  veGiaoDien();
}

function thucThiHieuUng(dsHieuUng, baseCg = state.canhGioi) {
  if (!Array.isArray(dsHieuUng)) return;
  for (const ef of dsHieuUng) {
    if (ef.tuVi) {
      const v = scaleGiaTriTheoCanhGioi(Number(ef.tuVi), baseCg);
      state.tuVi = Math.max(0, state.tuVi + v);
    }
    if (ef.linhThach) {
      const v = Number(ef.linhThach) > 0 ? scaleGiaTriTheoCanhGioi(Number(ef.linhThach), baseCg) : Number(ef.linhThach);
      state.linhThach = Math.max(0, state.linhThach + v);
    }
    if (ef.hp) {
      const rawHp = Number(ef.hp);
      const v = rawHp < 0 ? -Math.min(Math.round(tinhHpMax() * 0.4), scaleGiaTriTheoCanhGioi(Math.abs(rawHp), baseCg)) : scaleGiaTriTheoCanhGioi(rawHp, baseCg);
      state.hp = Math.max(1, Math.min(tinhHpMax(), state.hp + v));
    }
    if (ef.mp) {
      state.mp = Math.max(0, Math.min(tinhMpMax(), (state.mp ?? tinhMpMax()) + Number(ef.mp)));
    }
    if (ef.thuongThe) {
      const deltaT = Number(ef.thuongThe);
      if (deltaT > 0) tangThuongThePlayer(deltaT, 'biến cố bất ngờ');
      else if (deltaT < 0) hoiPhucThuongThe(Math.abs(deltaT));
    }
    if (ef.nhanQua && typeof ef.nhanQua === 'object') {
      gieoHatNhanQua(ef.nhanQua);
    }
    if (ef.thoNguyen) state.thoNguyenBonus += Number(ef.thoNguyen);
    if (ef.log) ghiNhatKy(ef.log, 'tot');
    if (ef.addItem) {
      const vp = layVatPhamDef(ef.addItem);
      const sl = ef.soLuong || 1;
      if (vp && themVat(ef.addItem, sl)) {
        ghiNhatKy(`🎒 Thu được vật phẩm: [${vp.ten}] x${sl}.`, 'tot');
      }
    }
    if (ef.chiSo && typeof ef.chiSo === 'object') {
      for (const [k, v] of Object.entries(ef.chiSo)) {
        if (k in state.chiSo) state.chiSo[k] += Number(v);
      }
    }
    if (ef.haoCamNpc && state.npcs[ef.haoCamNpc.npcId]) {
      const target = state.npcs[ef.haoCamNpc.npcId];
      thayDoiHaoCam(target, Number(ef.haoCamNpc.delta) || 0, true);
      if (ef.haoCamNpc.lyDo) ghiKyUcNpc(target, ef.haoCamNpc.lyDo);
    }
    if (ef.theLucDelta && ef.theLucDelta.tmId) {
      thayDoiHaoCamTheLuc(ef.theLucDelta.tmId, Number(ef.theLucDelta.delta) || 0);
    }
    if (ef.congHien) {
      thayDoiCongHienTongMon(Number(ef.congHien) || 0);
    }
    if (ef.roiTongMonKieu) {
      roiTongMon(ef.roiTongMonKieu);
    }
    if (ef.combat) {
      const cb = { ...ef.combat };
      if (!cb.giuNguyenChiSo) {
        cb.hp = scaleGiaTriTheoCanhGioi(cb.hp || 150, baseCg);
        cb.congKich = scaleGiaTriTheoCanhGioi(cb.congKich || 22, baseCg);
        cb.phongThu = scaleGiaTriTheoCanhGioi(cb.phongThu || 10, baseCg);
        cb.linhThach = scaleGiaTriTheoCanhGioi(cb.linhThach || 50, baseCg);
      }
      if (cb.hpMult && cb.hp) cb.hp = Math.max(10, Math.round(cb.hp * cb.hpMult));
      cb.canhGioiDich = typeof cb.canhGioiDich === 'number' ? cb.canhGioiDich : typeof cb.canhGioi === 'number' ? cb.canhGioi : baseCg;
      batDauChienDau(cb);
    }
  }
}

function suyDoanCanhGioiDich(dich) {
  if (typeof dich.canhGioiDich === 'number') return dich.canhGioiDich;
  if (typeof dich.canhGioi === 'number') return dich.canhGioi;
  if (dich.npcId && state.npcs && state.npcs[dich.npcId]) return state.npcs[dich.npcId].canhGioi;
  const ten = String(dich.ten || '');
  const list = (window.PN_DATA && window.PN_DATA.canhGioi) || [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (ten.includes(list[i].ten)) return list[i].id;
  }
  return state ? state.canhGioi : 0;
}

// Tỷ lệ độn thuật bỏ chạy: tính theo chênh lệch cảnh giới, Khí vận & Độn thuật (chênh >= 3 đại cảnh giới bị Thần thức khóa chết ~1-5%)
function tinhTiLeChayTron(t) {
  if (!t || !state) return 50;
  const cgDich = typeof t.canhGioiDich === 'number' ? t.canhGioiDich : suyDoanCanhGioiDich(t);
  const diff = cgDich - state.canhGioi;
  const cpSum = tinhCongPhapTongHop();
  const kv = (state.chiSo.khiVan || 10) + (cpSum.khiVan || 0);
  const bonusDonThuat = Math.round((cpSum.chayTronPct || 0) * 100) + (t.buffChayTron || 0);
  let base = 50;
  if (diff <= 0) base = 58 + (-diff) * 14 + kv * 0.55;
  else if (diff === 1) base = Math.max(12, Math.min(42, 28 + kv * 0.35));
  else if (diff === 2) base = Math.max(4, Math.min(16, 10 + kv * 0.2));
  else base = Math.max(1, Math.min(5, 2 + kv * 0.1));
  const capMax = diff >= 3 ? Math.min(35, 5 + (t.buffChayTron || 0)) : 95;
  return Math.round(Math.min(capMax, base + bonusDonThuat));
}

// Trạng thái chiến đấu: Trúng độc, Xuất huyết, Thiêu đốt, Tuyệt hồi, Phá giáp, Hàn khí (Tác giả: Gemini (Antigravity))
const TRANG_THAI_DEF = {
  trung_doc: { nhan: '☠️ Trúng độc', loai: 'dot' },
  xuat_huyet: { nhan: '🩸 Xuất huyết', loai: 'dot' },
  thieu_dot: { nhan: '🔥 Thiêu đốt', loai: 'dot' },
  tuyet_hoi: { nhan: '🚫 Tuyệt hồi', loai: 'debuff' },
  pha_giap: { nhan: '💔 Phá giáp', loai: 'debuff' },
  han_khi: { nhan: '❄️ Hàn khí', loai: 'debuff' }
};

function dinhDangTrangThai(ttMap) {
  return Object.entries(ttMap || {})
    .filter(([, v]) => v && v.luot > 0)
    .map(([k, v]) => `${(TRANG_THAI_DEF[k] || {}).nhan || k} (${v.luot}h)`)
    .join(' · ');
}

function ganTrangThaiTran(mucTieuMap, kieu, luot, pct = 0.2, satThuong = 0) {
  if (!mucTieuMap || !TRANG_THAI_DEF[kieu]) return;
  const cu = mucTieuMap[kieu];
  mucTieuMap[kieu] = {
    luot: Math.max(cu?.luot || 0, Math.max(1, luot || 2)),
    pct: Math.max(cu?.pct || 0, pct),
    satThuong: Math.max(cu?.satThuong || 0, satThuong)
  };
}

function apDungHieuUngKyNang(kn, atkTa, satThuongHit, t) {
  const list = Array.isArray(kn?.hieuUng) ? kn.hieuUng : [];
  if (list.length === 0 || !t) return;
  const gtKn =
    kn.nguonCg !== undefined || kn.canhGioi !== undefined
      ? tinhHeSoVuotCanh(kn.nguonCg ?? kn.canhGioi, kn.nguonCgToiDa)
      : { heSo: 1, tyLeHieuUng: 1 };
  const baseDmg = Math.max(10, satThuongHit || atkTa * (Number(kn.heSo) || 1.2));
  const rules = [
    { re: /trúng độc/i, key: 'trung_doc', defPct: 0.2, dot: true },
    { re: /xuất huyết/i, key: 'xuat_huyet', defPct: 0.2, dot: true },
    { re: /thiêu đốt|gây cháy|vết cháy/i, key: 'thieu_dot', defPct: 0.2, dot: true },
    { re: /tuyệt hồi|giảm\s*\d+%\s*hồi phục/i, key: 'tuyet_hoi', defPct: 0.55 },
    { re: /phá giáp/i, key: 'pha_giap', defPct: 0.25 },
    { re: /hàn khí/i, key: 'han_khi', defPct: 0.2 }
  ];
  for (const raw of list) {
    const txt = String(raw || '');
    const mTiLe = txt.match(/t[ỉi]\s*l[ệe]\s*(\d+)\s*%/i);
    const tiLe = (mTiLe ? Math.min(1, Number(mTiLe[1]) / 100) : 0.75) * gtKn.tyLeHieuUng;
    const mLuot = txt.match(/(\d+)\s*l[ưu][ơợ]t/i);
    const luot = mLuot ? Math.max(1, Math.min(4, Number(mLuot[1]))) : 2;
    const mPct = txt.match(/(\d+)\s*%/);
    const pct = mPct ? Math.min(0.8, Math.max(0.1, Number(mPct[1]) / 100)) : null;

    if (/hút.*(tinh\s*huyết|máu)|hút\s*huyết/i.test(txt) && satThuongHit > 0 && gtKn.heSo > 0) {
      const hoi = Math.max(2, Math.round(satThuongHit * 0.18 * gtKn.heSo));
      state.hp = Math.min(tinhHpMax(), state.hp + hoi);
      t.logTran.push(`🩸 Hút tinh huyết hồi phục +${hoi.toLocaleString()} Khí huyết!`);
    }
    if (/khống chế/i.test(txt) && tiLe > 0 && Math.random() < tiLe) {
      t.choangDich = Math.max(t.choangDich || 0, 1);
    }

    for (const r of rules) {
      if (!r.re.test(txt)) continue;
      if (tiLe > 0 && Math.random() < tiLe) {
        const valPct = pct ?? r.defPct;
        const dmgMoiLuot = r.dot ? Math.max(2, Math.round(baseDmg * valPct * gtKn.heSo)) : 0;
        ganTrangThaiTran(t.trangThaiDich, r.key, luot, valPct * gtKn.heSo, dmgMoiLuot);
        t.logTran.push(`⚡ [${t.ten}] dính ${TRANG_THAI_DEF[r.key].nhan} (${luot} lượt)!`);
      }
      break;
    }
  }
}

function suyDoanHieuUngDichTanCong(t) {
  const ten = String(t?.ten || '').toLowerCase();
  if (/độc|rết|bọ cạp|xà|rắn|ngô công|nhện|chướng|trùng|hủ/.test(ten)) return { key: 'trung_doc', tiLe: 0.28, pct: 0.14 };
  if (/hỏa|diễm|viêm|xích|phượng|dung nham|lôi/.test(ten)) return { key: 'thieu_dot', tiLe: 0.26, pct: 0.14 };
  if (/hổ|lang|báo|ưng|huyết|sát|kiếm|đao|trảo/.test(ten)) return { key: 'xuat_huyet', tiLe: 0.25, pct: 0.14 };
  if (/băng|hàn|tuyết|quỷ|ma|âm|oán|tuyệt/.test(ten)) return { key: 'tuyet_hoi', tiLe: 0.22, pct: 0.5 };
  return null;
}

function capNhatThuongTheSauTran(tenDich) {
  const hpMax = tinhHpMax();
  if (state.hp > 0 && state.hp < hpMax * 0.25) {
    tangThuongThePlayer(2, `huyết chiến đến cạn kiệt khí huyết với [${tenDich}]`);
  } else if (state.hp > 0 && state.hp < hpMax * 0.45) {
    tangThuongThePlayer(1, `bị đánh trọng thương khi giao chiến với [${tenDich}]`);
  }
}

function batDauChienDau(dich) {
  const cdef = layCanhGioiDef();
  const hpDich = dich.hp || Math.round(cdef.hpGoc * 1.4);
  state.tranHienTai = {
    ten: dich.ten || 'Tu Sĩ Bí Ẩn',
    hpDich,
    hpDichMax: hpDich,
    congKich: dich.congKich || Math.round(cdef.congKichGoc * 1.25),
    phongThu: dich.phongThu || Math.round(cdef.phongThuGoc * 1.15),
    linhThach: dich.linhThach || Math.round(45 * Math.pow(2.5, state.canhGioi)),
    loot: dich.loot || null,
    npcId: dich.npcId || null,
    canhGioiDich: suyDoanCanhGioiDich(dich),
    tuBiCanh: !!dich.tuBiCanh,
    laBossBiCanh: !!dich.laBossBiCanh,
    tongMonQuestId: dich.tongMonQuestId || null,
    khaoHachCapBac: dich.khaoHachCapBac || 0,
    dongMinhNpcId: dich.dongMinhNpcId || null,
    dongMinhTen: dich.dongMinhTen || '',
    linhDienSuMon: dich.linhDienSuMon || null,
    hiep: 1,
    cooldowns: {},
    trangThaiDich: {},
    trangThaiTa: {},
    giamSatThuong: 0,
    choangDich: 0,
    buffAtk: 0,
    logTran: [`⚔️ Chạm trán 【${dich.ten}】 (Khí huyết: ${hpDich.toLocaleString()})!`]
  };
  veGiaoDien();
}

function hanhDongChienDau(kieu) {
  const t = state.tranHienTai;
  if (!t) return;

  if (kieu === 'bo_chay' || kieu.startsWith('dung_phu_chay:')) {
    let tiLeChay = tinhTiLeChayTron(t) / 100;
    let nhanPhu = '';
    if (kieu.startsWith('dung_phu_chay:')) {
      const phuId = kieu.slice(14);
      const vpPhu = layVatPhamDef(phuId);
      if (!vpPhu || soLuongVat(phuId) <= 0) return;
      themVat(phuId, -1);
      nhanPhu = `[${vpPhu.ten}] `;
      tiLeChay = phuId === 'phu_truyen_tong' ? 1.0 : Math.max(0.35, Math.min(0.95, tiLeChay + 0.45));
    }

    if (Math.random() < tiLeChay) {
      ghiNhatKy(`💨 Bạn kích hoạt ${nhanPhu}độn thuật thoát khỏi tay [${t.ten}]!`, 'canh_bao');
      const laBiCanh = !!t.tuBiCanh;
      const khaoHachCap = t.khaoHachCapBac || 0;
      const tenDichThoat = t.ten;
      state.tranHienTai = null;
      capNhatThuongTheSauTran(tenDichThoat);
      if (khaoHachCap > 0 && state.tongMon) {
        state.tongMon.namKhaoHachLai = state.nam + 1;
        ghiNhatKy(`⚔️ Khảo hạch tấn thăng thất bại, hãy tu luyện thêm và thi lại từ Năm ${state.tongMon.namKhaoHachLai}!`, 'canh_bao');
      }
      if (laBiCanh && state.biCanhHienTai) hoanThanhBiCanh(true);
    } else {
      const kqTruy = tinhSatThuong(t.congKich, tinhPhongThu(), 0.85, 0.05, 0, 0.1);
      const satThuongBi = kqTruy.dmg;
      state.hp = Math.max(0, state.hp - satThuongBi);
      t.logTran.push(
        `Độn thuật thất bại (${Math.round(tiLeChay * 100)}%)! Bị uy áp của [${t.ten}] đánh trúng mất ${satThuongBi.toLocaleString()} Khí huyết.`
      );
      kiemTraKetThucTran();
    }
    luuGame();
    veGiaoDien();
    return;
  }

  if (kieu === 'toc_chien') {
    let safety = 0;
    const cpSum = tinhCongPhapTongHop();
    while (state.tranHienTai && t.hpDich > 0 && state.hp > 0 && safety < 40) {
      safety++;
      const knSan = cpSum.kyNangChuDong.find(
        k => !((t.cooldowns && t.cooldowns[k.id]) > 0) && (state.mp ?? 0) >= tinhTieuHaoLinhLuc(k)
      );
      if (knSan) hanhDongChienDau(`ky_nang:${knSan.id}`);
      else if (!((t.cooldowns && t.cooldowns._pb) > 0)) hanhDongChienDau('phap_bao');
      else hanhDongChienDau('thuong');
    }
    return;
  }

  const cpSumTran = tinhCongPhapTongHop();
  if (typeof state.mp !== 'number') state.mp = tinhMpMax();
  if (!t.trangThaiDich) t.trangThaiDich = {};
  if (!t.trangThaiTa) t.trangThaiTa = {};
  const giamAtkTa = t.trangThaiTa.han_khi?.luot > 0 ? Math.max(0.6, 1 - (t.trangThaiTa.han_khi.pct || 0.2)) : 1;
  const giamDefDich = t.trangThaiDich.pha_giap?.luot > 0 ? Math.max(0.4, 1 - (t.trangThaiDich.pha_giap.pct || 0.25)) : 1;
  const giamHoiTa = t.trangThaiTa.tuyet_hoi?.luot > 0 ? Math.max(0.2, 1 - (t.trangThaiTa.tuyet_hoi.pct || 0.5)) : 1;
  const atkTa = Math.round(tinhCongKich() * (1 + (t.buffAtk || 0)) * giamAtkTa);
  const defDichThuc = Math.max(0, Math.round(t.phongThu * giamDefDich));
  const critTa = Math.min(0.85, tinhBaoKichPct() + (t.buffCrit || 0));
  const neTa = Math.min(0.8, tinhNeTranhPct() + ((t.buffNeLuot || 0) > 0 ? t.buffNe || 0 : 0));
  const heSoKn = tinhUyLucKyNang();
  let satThuongTa = 0;
  let boQuaPhanKich = false;

  if (kieu.startsWith('ky_nang:')) {
    const knId = kieu.slice(8);
    const kn = cpSumTran.kyNangChuDong.find(x => x.id === knId);
    const mpCost = kn ? tinhTieuHaoLinhLuc(kn) : 0;
    if (!kn || (t.cooldowns[knId] || 0) > 0 || state.mp < mpCost) return;

    state.mp = Math.max(0, state.mp - mpCost);
    const gtKn =
      kn.nguonCg !== undefined || kn.canhGioi !== undefined
        ? tinhHeSoVuotCanh(kn.nguonCg ?? kn.canhGioi, kn.nguonCgToiDa)
        : { vuot: 0, heSo: 1, tyLeHieuUng: 1, nhan: '' };
    const fKn = gtKn.heSo;
    const tagGt = gtKn.vuot > 0 ? ` [${Math.round(fKn * 100)}% uy lực]` : '';
    const cdGoc = typeof kn.hoiChieu === 'number' ? kn.hoiChieu : 2;
    t.cooldowns[knId] = cdGoc > 0 ? cdGoc + 1 : 0;
    const rawHeSo = Number(kn.heSo) || 0;
    const heSo = (rawHeSo > 0 ? rawHeSo : 1.55) * heSoKn * fKn;
    if (kn.loai === 'TRI_LIEU') {
      const tyLeHoi = Math.max(0.28, rawHeSo > 0 ? Math.min(0.45, rawHeSo * 0.3) : 0.3) * heSoKn * fKn;
      const hoi = Math.max(1, Math.round(tinhHpMax() * tyLeHoi * giamHoiTa));
      state.hp = Math.min(tinhHpMax(), state.hp + hoi);
      t.hoiXuan = Math.max(0.03, 0.12 * fKn);
      t.hoiXuanLuot = 2;
      t.logTran.push(`Hiệp ${t.hiep}: Thi triển [${kn.ten}]${tagGt} (-${mpCost} LL), hồi phục +${hoi.toLocaleString()} HP${giamHoiTa < 1 ? ' (bị Tuyệt hồi giảm hồi)' : ''} và duy trì Hồi xuân!`);
    } else if (kn.loai === 'PHONG_THU') {
      t.giamSatThuong = Math.max(0.12, 0.65 * fKn);
      t.phanDamTam = 0.2 * gtKn.tyLeHieuUng;
      const kq = tinhSatThuong(atkTa, defDichThuc, Math.max(0.85, rawHeSo) * heSoKn * fKn, critTa, 0.04, 0);
      satThuongTa = kq.dmg;
      t.logTran.push(`Hiệp ${t.hiep}: Vận [${kn.ten}]${tagGt} (-${mpCost} LL) hộ thân (-${Math.round(t.giamSatThuong * 100)}% ST nhận), phản kích ${satThuongTa.toLocaleString()}${kq.baoKich ? ' 💥Bạo kích!' : ''}`);
    } else if (kn.loai === 'KHONG_CHE') {
      const choang = gtKn.tyLeHieuUng > 0 && Math.random() < gtKn.tyLeHieuUng;
      if (choang) t.choangDich = 1;
      const kq = tinhSatThuong(atkTa, defDichThuc, Math.max(1.0, rawHeSo || 1.2) * heSoKn * fKn, critTa, 0.02, 0);
      satThuongTa = kq.dmg;
      t.logTran.push(`Hiệp ${t.hiep}: Tung [${kn.ten}]${tagGt} (-${mpCost} LL)${choang ? ' khống chế đối thủ' : ' (không đủ uy áp khống chế)'}, gây ${satThuongTa.toLocaleString()} ST${kq.baoKich ? ' 💥Bạo kích!' : ''}!`);
    } else if (kn.loai === 'DON_THUAT') {
      t.buffNe = 0.35 * fKn;
      t.buffNeLuot = 2;
      t.buffChayTron = Math.round(30 * fKn);
      const kq = tinhSatThuong(atkTa, defDichThuc, 0.8 * heSoKn * fKn, critTa, 0.02, 0);
      satThuongTa = kq.dmg;
      t.logTran.push(`Hiệp ${t.hiep}: Thi triển độn thuật [${kn.ten}]${tagGt} (-${mpCost} LL · +${Math.round(t.buffNe * 100)}% Né · +${t.buffChayTron}% Chạy), đánh lén ${satThuongTa.toLocaleString()} ST!`);
    } else if (kn.loai === 'HO_TRO') {
      t.buffAtk = (t.buffAtk || 0) + 0.25 * fKn;
      t.buffCrit = (t.buffCrit || 0) + 0.1 * fKn;
      const kq = tinhSatThuong(atkTa, defDichThuc, Math.max(1.15, rawHeSo || 1.15) * heSoKn * fKn, critTa, 0.04, 0);
      satThuongTa = kq.dmg;
      t.logTran.push(`Hiệp ${t.hiep}: Kích phát [${kn.ten}]${tagGt} (-${mpCost} LL · +${Math.round(25 * fKn)}% Công · +${Math.round(10 * fKn)}% Bạo), gây ${satThuongTa.toLocaleString()} ST!`);
    } else {
      const kq = tinhSatThuong(atkTa, defDichThuc, Math.max(0.35, heSo), critTa, 0.04, 0.15 * gtKn.tyLeHieuUng);
      satThuongTa = kq.dmg;
      t.logTran.push(`Hiệp ${t.hiep}: Tuyệt kỹ [${kn.ten}]${tagGt} (-${mpCost} LL) bùng phát, gây ${satThuongTa.toLocaleString()} sát thương${kq.baoKich ? ' 💥Bạo kích!' : ''}!`);
    }
    apDungHieuUngKyNang(kn, atkTa, satThuongTa, t);
  } else if (kieu.startsWith('dung_phu:')) {
    const phuId = kieu.slice(9);
    const vp = layVatPhamDef(phuId);
    if (!vp || soLuongVat(phuId) <= 0) return;
    themVat(phuId, -1);
    const heSoPhu = phuId === 'phu_thien_loi' ? 2.1 : 1.75;
    const kq = tinhSatThuong(atkTa, defDichThuc, heSoPhu, critTa + 0.1, 0, 0.5);
    satThuongTa = kq.dmg;
    t.logTran.push(`Hiệp ${t.hiep}: Phóng 1 [${vp.ten}] xuyên 50% giáp địch, gây ${satThuongTa.toLocaleString()} sát thương${kq.baoKich ? ' 💥Bạo kích!' : ''}!`);
  } else if (kieu.startsWith('dung_dan:')) {
    const danId = kieu.slice(9);
    const vp = layVatPhamDef(danId);
    if (!vp || soLuongVat(danId) <= 0) return;
    const pcDan = layPhamChatVatPham(danId);
    themVat(danId, -1);
    const hpBase = Math.max(tinhHpMax() * 0.22, (Number(vp.hieuUng?.hp) || 40) * pcDan.heSo);
    const hoi = Math.max(1, Math.round(hpBase * giamHoiTa));
    const hoiMp = Math.max(15, Math.round(tinhMpMax() * 0.3 * pcDan.heSo));
    state.hp = Math.min(tinhHpMax(), state.hp + hoi);
    state.mp = Math.min(tinhMpMax(), state.mp + hoiMp);
    hoiPhucThuongThe(pcDan.key === 'cuc' ? 2 : 1);
    t.logTran.push(`Hiệp ${t.hiep}: Phục dụng 1 [${vp.ten} · ${pcDan.ten}], hồi +${hoi.toLocaleString()} HP${giamHoiTa < 1 ? ' (bị Tuyệt hồi)' : ''} & +${hoiMp.toLocaleString()} Linh lực!`);
  } else if (kieu === 'dieu_tuc') {
    const hoiMp = Math.max(12, Math.round(tinhMpMax() * (0.25 + (cpSumTran.hoiMpPct || 0))));
    state.mp = Math.min(tinhMpMax(), state.mp + hoiMp);
    t.giamSatThuong = Math.max(t.giamSatThuong || 0, 0.25);
    t.logTran.push(`Hiệp ${t.hiep}: Thu liễm tâm thần điều tức (-25% ST nhận lượt này), hồi phục +${hoiMp.toLocaleString()} Linh lực!`);
  } else if (kieu === 'phap_bao') {
    if ((t.cooldowns._pb || 0) > 0) return;
    t.cooldowns._pb = 2 + 1; // Hồi chiêu 2 hiệp (cuối lượt trừ 1 còn 2)
    const pb = state.phapBao ? layVatPhamDef(state.phapBao) : null;
    const pbGt = pb ? tinhHeSoVuotCanh(layCanhGioiPhapBao(pb), /Thông Thiên Linh Bảo/i.test(pb.phanCap || '') ? 9 : null) : { heSo: 1, tyLeHieuUng: 1, vuot: 0 };
    const heSo = pb ? Math.max(1.0, 1.0 + 0.5 * pbGt.heSo) : 1.25;
    const xuyenGiap = pb ? 0.15 * pbGt.tyLeHieuUng : 0;
    const kq = tinhSatThuong(atkTa, defDichThuc, heSo, critTa, 0.05, xuyenGiap);
    satThuongTa = kq.dmg;
    const moTaChieu = pb ? `thúc giục 【${pb.ten}】${pbGt.vuot > 0 ? ` (${Math.round(pbGt.heSo * 100)}% uy lực)` : ''}` : 'dồn linh lực tung sát chiêu';
    t.logTran.push(
      kq.ne
        ? `Hiệp ${t.hiep}: Bạn ${moTaChieu} nhưng [${t.ten}] đã kịp né tránh!`
        : `Hiệp ${t.hiep}: Bạn ${moTaChieu}, gây ${satThuongTa.toLocaleString()} sát thương${kq.baoKich ? ' 💥Bạo kích!' : ''}!`
    );
  } else {
    const kq = tinhSatThuong(atkTa, defDichThuc, 1.0, critTa, 0.05, 0);
    satThuongTa = kq.dmg;
    const hoiMp = Math.max(4, Math.round(tinhMpMax() * (0.06 + (cpSumTran.hoiMpPct || 0))));
    state.mp = Math.min(tinhMpMax(), state.mp + hoiMp);
    t.logTran.push(
      kq.ne
        ? `Hiệp ${t.hiep}: Bạn vận công pháp tấn công nhưng [${t.ten}] né được! (+${hoiMp} LL)`
        : `Hiệp ${t.hiep}: Bạn vận công pháp tấn công, gây ${satThuongTa.toLocaleString()} sát thương${kq.baoKich ? ' 💥Bạo kích!' : ''}! (+${hoiMp} LL)`
    );
  }

  if (satThuongTa > 0) t.hpDich = Math.max(0, t.hpDich - satThuongTa);

  // Đồng minh sư môn / đạo hữu trợ chiến (nếu đi cùng trong nhiệm vụ tông môn)
  if (t.hpDich > 0 && t.dongMinhNpcId) {
    const dmDmg = Math.max(4, Math.round(atkTa * (0.28 + Math.random() * 0.12)));
    t.hpDich = Math.max(0, t.hpDich - dmDmg);
    t.logTran.push(`🤝 Đồng minh 【${t.dongMinhTen || 'Đạo hữu'}】 phối hợp công kích, gây thêm ${dmDmg.toLocaleString()} sát thương!`);
  }

  // Rút máu theo lượt trên địch (Trúng độc / Xuất huyết / Thiêu đốt)
  if (t.hpDich > 0) {
    for (const [k, stObj] of Object.entries(t.trangThaiDich)) {
      if (!stObj || stObj.luot <= 0) continue;
      if (TRANG_THAI_DEF[k]?.loai === 'dot' && stObj.satThuong > 0 && t.hpDich > 0) {
        t.hpDich = Math.max(0, t.hpDich - stObj.satThuong);
        t.logTran.push(`${TRANG_THAI_DEF[k].nhan} rút của [${t.ten}] ${stObj.satThuong.toLocaleString()} HP!`);
      }
      stObj.luot -= 1;
    }
  }

  if (t.hpDich > 0) {
    if (t.choangDich > 0) {
      t.choangDich -= 1;
      boQuaPhanKich = true;
      t.logTran.push(`[${t.ten}] bị khống chế, mất lượt phản kích!`);
    }
    if (!boQuaPhanKich) {
      const giamAtkDich = t.trangThaiDich.han_khi?.luot > 0 ? Math.max(0.65, 1 - (t.trangThaiDich.han_khi.pct || 0.2)) : 1;
      const giamDefTa = t.trangThaiTa.pha_giap?.luot > 0 ? Math.max(0.5, 1 - (t.trangThaiTa.pha_giap.pct || 0.25)) : 1;
      const kqDich = tinhSatThuong(Math.round(t.congKich * giamAtkDich), Math.round(tinhPhongThu() * giamDefTa), 1.0, 0.05, neTa, 0);
      if (kqDich.ne) {
        t.logTran.push(`[${t.ten}] phản kích nhưng nhờ Khí vận bạn đã né tránh thành công!`);
      } else {
        let satThuongDich = kqDich.dmg;
        if (t.giamSatThuong > 0) {
          satThuongDich = Math.max(1, Math.round(satThuongDich * (1 - t.giamSatThuong)));
          t.giamSatThuong = 0;
        }
        state.hp = Math.max(0, state.hp - satThuongDich);
        t.logTran.push(`[${t.ten}] phản kích gây ${satThuongDich.toLocaleString()} sát thương${kqDich.baoKich ? ' 💥' : ''}!`);
        const efDich = suyDoanHieuUngDichTanCong(t);
        if (efDich && state.hp > 0 && Math.random() < efDich.tiLe) {
          const dmgDotTa = TRANG_THAI_DEF[efDich.key].loai === 'dot' ? Math.max(3, Math.round(satThuongDich * efDich.pct)) : 0;
          ganTrangThaiTran(t.trangThaiTa, efDich.key, 2, efDich.pct, dmgDotTa);
          t.logTran.push(`⚠️ Đòn đánh của [${t.ten}] khiến bạn dính ${TRANG_THAI_DEF[efDich.key].nhan} (2 lượt)!`);
        }
        const phanTong = (cpSumTran.phanDamPct || 0) + (t.phanDamTam || 0);
        if (phanTong > 0 && satThuongDich > 0) {
          const stPhan = Math.max(1, Math.round(satThuongDich * phanTong));
          t.hpDich = Math.max(0, t.hpDich - stPhan);
          t.logTran.push(`⚡ Hộ thể phản chấn lại [${t.ten}] ${stPhan.toLocaleString()} sát thương!`);
        }
        t.phanDamTam = 0;
      }
    }
  }

  // Duy trì Hồi Xuân, rút máu DoT trên người chơi & giảm hiệu lực buff
  if (state.hp > 0 && t.hpDich > 0) {
    if ((t.hoiXuanLuot || 0) > 0) {
      const hoiThem = Math.max(1, Math.round(tinhHpMax() * (t.hoiXuan || 0.1) * giamHoiTa));
      state.hp = Math.min(tinhHpMax(), state.hp + hoiThem);
      t.hoiXuanLuot -= 1;
      t.logTran.push(`🌿 Hồi xuân tái tạo +${hoiThem.toLocaleString()} HP${giamHoiTa < 1 ? ' (bị Tuyệt hồi)' : ''}!`);
    }
    for (const [k, stObj] of Object.entries(t.trangThaiTa)) {
      if (!stObj || stObj.luot <= 0) continue;
      if (TRANG_THAI_DEF[k]?.loai === 'dot' && stObj.satThuong > 0 && state.hp > 0) {
        state.hp = Math.max(0, state.hp - stObj.satThuong);
        t.logTran.push(`${TRANG_THAI_DEF[k].nhan} khiến bạn mất ${stObj.satThuong.toLocaleString()} HP!`);
      }
      stObj.luot -= 1;
    }
  }
  if ((t.buffNeLuot || 0) > 0) t.buffNeLuot -= 1;

  // Giảm cooldown
  for (const kid of Object.keys(t.cooldowns || {})) {
    if (t.cooldowns[kid] > 0) t.cooldowns[kid] -= 1;
  }

  t.hiep += 1;
  kiemTraKetThucTran();
  luuGame();
  veGiaoDien();
}

function thuHoachDoNpc(npc, maxNpcCg, choBiTich = true, tiLePhapBao = 0.45) {
  const ds = [];
  for (const itemNpc of npc.tuiDo || []) {
    const vp = layVatPhamDef(itemNpc);
    if (vp) {
      if (themVat(itemNpc, 1)) ds.push(`[${vp.ten}]`);
    } else if (choBiTich && window.PN_DATA.congPhap.some(c => c.id === itemNpc) && !state.congPhapDaHoc.includes(itemNpc)) {
      state.congPhapDaHoc.push(itemNpc);
      ds.push(`bí tịch 【${layCongPhapDef(itemNpc).ten}】`);
    }
  }
  if (Math.random() < tiLePhapBao) {
    const pbPool = window.PN_DATA.vatPham.filter(v => v.loai === 'phap_bao' && (v.canhGioi ?? 0) <= maxNpcCg && (v.canhGioi ?? 0) >= Math.max(0, maxNpcCg - 2));
    const pbDrop = pickRandom(pbPool);
    if (pbDrop && themVat(pbDrop.id, 1)) ds.push(`trang bị [${pbDrop.ten}]`);
  }
  if (choBiTich && Math.random() < 0.35) {
    const cpPool = window.PN_DATA.congPhap.filter(c => (c.canhGioi ?? 0) <= maxNpcCg && !state.congPhapDaHoc.includes(c.id));
    const cpDrop = pickRandom(cpPool);
    if (cpDrop) {
      state.congPhapDaHoc.push(cpDrop.id);
      ds.push(`bí tịch 【${cpDrop.ten}】`);
    }
  }
  if (Math.random() < 0.6) {
    const danPool = window.PN_DATA.vatPham.filter(v => (v.loai === 'dan' || v.loai === 'phu_luc') && (v.canhGioi ?? 0) <= maxNpcCg);
    const danDrop = pickRandom(danPool);
    if (danDrop && themVat(danDrop.id, 1)) ds.push(`[${danDrop.ten}]`);
  }
  if (Math.random() < 0.5) {
    const vlPool = window.PN_DATA.vatPham.filter(v => ['linh_thao', 'yeu_dan', 'linh_vat'].includes(v.loai) && (v.canhGioi ?? v.bac ?? 0) <= Math.max(1, maxNpcCg));
    const vlDrop = pickRandom(vlPool);
    if (vlDrop && themVat(vlDrop.id, 1)) ds.push(`vật liệu [${vlDrop.ten}]`);
  }
  return ds;
}

function xuLyHauChienNpc(kieu) {
  const h = state.hauChienNpc;
  if (!h) return;
  const npc = state.npcs[h.npcId];
  state.hauChienNpc = null;

  if (!npc) {
    if (h.laBiCanh && state.biCanhHienTai) tienBuocBiCanh();
    luuGame();
    veGiaoDien();
    return;
  }

  const maxNpcCg = Math.min(9, Math.max(0, npc.canhGioi ?? h.canhGioiDich ?? state.canhGioi));

  if (kieu === 'ket_lieu') {
    npc.conSong = false;
    npc.lyDoMat = `Bị ${state.ten} kết liễu sau trận đấu pháp`;
    state.linhThach += h.linhThach;
    npc.linhThach = Math.max(0, Math.round((npc.linhThach || 0) * 0.2));
    for (const banId of npc.banBe || []) {
      const ban = state.npcs[banId];
      if (ban && ban.conSong) {
        thayDoiHaoCam(ban, -40);
        ghiKyUcNpc(ban, `Căm phẫn vì bạn tốt ${npc.ten} bị ${state.ten} sát hại!`);
      }
    }
    if (npc.daoLuId && state.npcs[npc.daoLuId]?.conSong) {
      const dl = state.npcs[npc.daoLuId];
      thayDoiHaoCam(dl, -80);
      ghiKyUcNpc(dl, `Thề trả thù ${state.ten} vì đã giết đạo lữ ${npc.ten}!`);
    }
    let tmTxt = '';
    if (npc.tongMonId) {
      const tmNpc = layTongMonDef(npc.tongMonId);
      const hcTm = thayDoiHaoCamTheLuc(npc.tongMonId, -25);
      tmTxt = ` · Hảo cảm 【${tmNpc ? tmNpc.ten : npc.tongMonId}】 còn ${hcTm}/100`;
    }
    const doNhat = thuHoachDoNpc(npc, maxNpcCg, true, 0.55);
    npc.tuiDo = [];
    ghiNhatKy(
      `💀 Bạn kết liễu 【${npc.ten}】! Đoạt +${h.linhThach.toLocaleString()} Linh thạch${doNhat.length ? `, ${doNhat.join(', ')}` : ''}${tmTxt}.`,
      'nguy_hiem'
    );
    if (h.laBiCanh && state.biCanhHienTai) {
      state.biCanhHienTai.thuHoach.push(`+${h.linhThach.toLocaleString()} LT`, ...doNhat);
    }
  } else if (kieu === 'si_nhuc') {
    npc.thuongThe = Math.min(3, (npc.thuongThe || 0) + 1);
    const hcMoi = thayDoiHaoCam(npc, -45, true);
    ghiKyUcNpc(npc, `Bị ${state.ten} đánh bại và buông lời sỉ nhục nhã, thề rửa hận!`);
    let tmTxt = '';
    if (npc.tongMonId) {
      const tmNpc = layTongMonDef(npc.tongMonId);
      const hcTm = thayDoiHaoCamTheLuc(npc.tongMonId, -8);
      tmTxt = ` · 【${tmNpc ? tmNpc.ten : npc.tongMonId}】 ${hcTm}/100`;
    }
    const tvThem = Math.max(10, Math.round((h.tuViThuong || 20) * 0.5));
    state.tuVi += tvThem;
    ghiNhatKy(
      `😈 Bạn sỉ nhục 【${npc.ten}】 một trận rồi tha mạng! Đối phương căm hận tột độ (${capBacQuanHe(npc)} ${hcMoi}/100)${tmTxt}, niệm đầu thông suốt +${tvThem.toLocaleString()} Tu vi.`,
      'canh_bao'
    );
    gieoHatNhanQua({ loai: 'thu_oan', npcId: npc.id, namCho: 2 + Math.floor(Math.random() * 4), moTa: `Mối nhục bị đánh bại và sỉ nhục năm xưa của [${npc.ten}]` });
  } else if (kieu === 'cuop') {
    npc.thuongThe = Math.min(3, (npc.thuongThe || 0) + 1);
    state.linhThach += h.linhThach;
    npc.linhThach = Math.max(0, Math.round((npc.linhThach || 0) * 0.35));
    const hcMoi = thayDoiHaoCam(npc, -30, true);
    ghiKyUcNpc(npc, `Bị ${state.ten} đánh bại và cướp sạch túi trữ vật!`);
    for (const banId of npc.banBe || []) {
      const ban = state.npcs[banId];
      if (ban && ban.conSong) thayDoiHaoCam(ban, -15);
    }
    let tmTxt = '';
    if (npc.tongMonId) {
      const tmNpc = layTongMonDef(npc.tongMonId);
      const hcTm = thayDoiHaoCamTheLuc(npc.tongMonId, -15);
      tmTxt = ` · 【${tmNpc ? tmNpc.ten : npc.tongMonId}】 ${hcTm}/100`;
    }
    const doNhat = thuHoachDoNpc(npc, maxNpcCg, false, 0.4);
    npc.tuiDo = [];
    ghiNhatKy(
      `💰 Bạn cướp túi trữ vật của 【${npc.ten}】 rồi bỏ đi (+${h.linhThach.toLocaleString()} Linh thạch${doNhat.length ? `, ${doNhat.join(', ')}` : ''}) · Quan hệ: ${capBacQuanHe(npc)} (${hcMoi}/100)${tmTxt}.`,
      'tot'
    );
    if (h.laBiCanh && state.biCanhHienTai) {
      state.biCanhHienTai.thuHoach.push(`+${h.linhThach.toLocaleString()} LT`, ...doNhat);
    }
  } else {
    // 'buong_tha' — Phản ứng phân hóa theo tính cách NPC
    const tcLoai = npc.tinhCachLoai || suyDoanTinhCachNpc(npc.tinhCach, npc.danhHieu);
    const tcDef = layTinhCachNpcDef(tcLoai);
    const PHAN_UNG_BUONG_THA = {
      trong_nghia: {
        delta: 40,
        tmDelta: 8,
        loaiLog: 'dai_cat',
        kyUc: `Ghi khắc ân không giết của ${state.ten}, cảm phục ân nghĩa sâu sắc.`,
        msg: 'vô cùng cảm động trước ân bất sát, chắp tay ghi tạc ân tình'
      },
      hoa_dong: {
        delta: 28,
        tmDelta: 5,
        loaiLog: 'dai_cat',
        kyUc: `Bại dưới tay ${state.ten} nhưng được khoan dung tha mạng, ân oán hóa giải.`,
        msg: 'cảm kích sự khoan dung, vui vẻ hóa giải ân oán'
      },
      cuong_truc: {
        delta: 25,
        tmDelta: 3,
        loaiLog: 'tot',
        kyUc: `Tâm phục khẩu phục thực lực của ${state.ten}, hẹn ngày tái chiến sòng phẳng.`,
        msg: 'tâm phục khẩu phục thực lực của bạn, ôm quyền hẹn ngày tái đấu'
      },
      thuc_dung: {
        delta: (npc.haoCam || 0) >= 0 ? 8 : -8,
        tmDelta: 0,
        loaiLog: 'thuong',
        kyUc: `Được ${state.ten} tha mạng nhưng vẫn đa nghi dè chừng dụng ý thực sự.`,
        msg: (npc.haoCam || 0) >= 0 ? 'bán tín bán nghi, giữ thái độ dè chừng' : 'nghi ngờ bạn còn mưu đồ khác, ánh mắt đầy cảnh giác'
      },
      kieu_ngao: {
        delta: -22,
        tmDelta: -5,
        loaiLog: 'canh_bao',
        kyUc: `Coi việc bị ${state.ten} thương hại tha mạng là vết nhơ sỉ nhục, thề có ngày rửa nhục!`,
        msg: 'tự tôn tổn thương nghiêm trọng, cho rằng bị thương hại nên càng sinh lòng oán hận'
      },
      am_doc: {
        delta: -32,
        tmDelta: -10,
        loaiLog: 'nguy_hiem',
        kyUc: `Ngoài mặt nhận thua nhưng ghi hận ${state.ten} thấu xương, chờ cơ hội ám toán báo thù!`,
        msg: 'ngoài mặt chắp tay cúi đầu nhưng ánh mắt đầy sát khí, ngấm ngầm ghi hận trả thù'
      }
    };
    const rx = PHAN_UNG_BUONG_THA[tcLoai] || PHAN_UNG_BUONG_THA.hoa_dong;
    const hcMoi = thayDoiHaoCam(npc, rx.delta, true);
    ghiKyUcNpc(npc, rx.kyUc);

    let tmTxt = '';
    if (npc.tongMonId && rx.tmDelta !== 0) {
      const tmNpc = layTongMonDef(npc.tongMonId);
      const hcTm = thayDoiHaoCamTheLuc(npc.tongMonId, rx.tmDelta);
      tmTxt = ` · 【${tmNpc ? tmNpc.ten : npc.tongMonId}】 ${rx.tmDelta >= 0 ? '+' : ''}${rx.tmDelta} (${hcTm}/100)`;
    }

    let quaCamOn = '';
    if (tcLoai === 'trong_nghia' && (npc.linhThach || 0) > 20 && Math.random() < 0.6) {
      const ltTang = Math.max(15, Math.round((npc.linhThach || 50) * 0.15));
      npc.linhThach -= ltTang;
      state.linhThach += ltTang;
      quaCamOn = ` · Đối phương tặng lại +${ltTang.toLocaleString()} LT cảm tạ`;
    }

    if (rx.delta >= 20) {
      gieoHatNhanQua({ loai: 'an_nghia', npcId: npc.id, namCho: 2 + Math.floor(Math.random() * 4), moTa: `Ân không giết đối với [${npc.ten}] năm xưa` });
    } else if (rx.delta <= -15) {
      gieoHatNhanQua({ loai: 'thu_oan', npcId: npc.id, namCho: 2 + Math.floor(Math.random() * 4), moTa: `Lòng thù hận tích tụ sau khi [${npc.ten}] bại trận bị tha` });
    }
    const tvThem = Math.max(8, Math.round((h.tuViThuong || 20) * 0.3));
    state.tuVi += tvThem;
    ghiNhatKy(
      `🕊️ Bạn thu hồi pháp bảo buông tha 【${npc.ten}】 (${tcDef.ten})! Đối phương ${rx.msg} (${capBacQuanHe(npc)} ${hcMoi}/100)${tmTxt}${quaCamOn}, đạo tâm +${tvThem.toLocaleString()} Tu vi.`,
      rx.loaiLog
    );
  }

  if (h.laBiCanh && state.biCanhHienTai) {
    tienBuocBiCanh();
  }
  luuGame();
  veGiaoDien();
}

function kiemTraKetThucTran() {
  const t = state.tranHienTai;
  if (!t) return;

  if (t.hpDich <= 0) {
    const cgDich = typeof t.canhGioiDich === 'number' ? t.canhGioiDich : state.canhGioi;
    const baseDich = layCanhGioiDef(Math.min(9, cgDich)).baseTuViNam || 40;
    const tuViThuong =
      cgDich >= state.canhGioi - 1
        ? Math.max(15, Math.round(baseDich * (0.18 + Math.max(0, cgDich - state.canhGioi) * 0.14) * (0.85 + Math.random() * 0.3)))
        : Math.max(8, Math.round(baseDich * 0.08));
    state.tuVi += tuViThuong;

    if (t.npcId && state.npcs[t.npcId]) {
      const npc = state.npcs[t.npcId];
      const laBiCanh = !!t.tuBiCanh;
      state.hauChienNpc = {
        npcId: npc.id,
        ten: t.ten,
        linhThach: t.linhThach,
        tuViThuong,
        canhGioiDich: cgDich,
        laBiCanh
      };
      state.tranHienTai = null;
      capNhatThuongTheSauTran(t.ten);
      ghiNhatKy(`⚔️ Bạn đã đánh bại 【${t.ten}】 (+${tuViThuong.toLocaleString()} Tu vi)! Hãy lựa chọn cách xử trí đối phương.`, 'tot');
      return;
    }

    state.linhThach += t.linhThach;
    let chuoiLoot = `+${t.linhThach.toLocaleString()} Linh thạch, +${tuViThuong.toLocaleString()} Tu vi`;

    if (t.loot) {
      const vp = layVatPhamDef(t.loot);
      if (vp) {
        themVat(t.loot, 1);
        chuoiLoot += `, thu được [${vp.ten}]`;
      }
    }

    // Quái Yêu Thú rơi vật liệu ngẫu nhiên (Yêu đan / Linh thảo / Linh vật) phù hợp cảnh giới
    const matPool = window.PN_DATA.vatPham.filter(v => {
      if (!['yeu_dan', 'linh_thao', 'linh_vat'].includes(v.loai)) return false;
      const cap = v.canhGioi ?? v.bac ?? 0;
      if (v.loai === 'linh_thao' && cgDich <= 1 && (v.gia || 0) > 250) return false;
      return cap <= Math.max(1, cgDich);
    });
    const matDrop = pickRandom(matPool);
    if (matDrop && themVat(matDrop.id, 1)) {
      chuoiLoot += `, thu được vật liệu [${matDrop.ten}]`;
    }

    ghiNhatKy(`🏆 Chiến thắng 【${t.ten}】! Chiến lợi phẩm: ${chuoiLoot}.`, 'tot');
    const laBiCanh = !!t.tuBiCanh;
    const laBossBc = !!t.laBossBiCanh;
    const tongMonQuestId = t.tongMonQuestId || null;
    const dongMinhNpcId = t.dongMinhNpcId || null;
    const khaoHachCapBac = t.khaoHachCapBac || 0;
    const linhDienSuMon = t.linhDienSuMon || null;
    const tenDichThang = t.ten;
    state.tranHienTai = null;
    capNhatThuongTheSauTran(tenDichThang);
    if (tongMonQuestId) {
      hoanThanhNhiemVuTongMon(tongMonQuestId, dongMinhNpcId);
    }
    if (khaoHachCapBac > 0) {
      hoanThanhKhaoHachTongMon(khaoHachCapBac);
    }
    if (linhDienSuMon && state.tongMon) {
      thayDoiCongHienTongMon(linhDienSuMon.congHien || 15);
      const hcMoi = thayDoiHaoCamTheLuc(linhDienSuMon.tmId || state.tongMon.id, 3);
      ghiNhatKy(`🌾 Đánh đuổi kẻ xâm phạm Linh Điền sư môn: thưởng thêm +${linhDienSuMon.congHien || 15} Cống hiến, +3 Hảo cảm (${hcMoi}/100)!`, 'dai_cat');
    }
    if (laBiCanh && state.biCanhHienTai) {
      state.biCanhHienTai.thuHoach.push(`+${t.linhThach.toLocaleString()} LT`);
      if (t.loot && layVatPhamDef(t.loot)) state.biCanhHienTai.thuHoach.push(layVatPhamDef(t.loot).ten);
      if (laBossBc) {
        const bcCur = layBiCanhRunDef(state.biCanhHienTai);
        const vpCore = bcCur ? chonVatPhamBiCanh(bcCur) : null;
        if (vpCore && themVat(vpCore.id, 1)) {
          state.biCanhHienTai.thuHoach.push(vpCore.ten);
          ghiNhatKy(`🎁 Đánh bại Thủ Vệ Lõi, đoạt đại bảo vật [${vpCore.ten}]!`, 'dai_cat');
        }
      }
      tienBuocBiCanh();
    }
  } else if (state.hp <= 0) {
    state.biCanhHienTai = null;
    state.hauChienNpc = null;
    state.ketThuc = {
      thangLoi: false,
      lyDo: `Bạn đã vẫn lạc trong trận huyết chiến với [${t.ten}] ở tuổi ${state.tuoi}. Đạo đồ khép lại!`
    };
    ghiNhatKy(`☠️ ${state.ketThuc.lyDo}`, 'nguy_hiem');
    state.tranHienTai = null;
  }
}

// ==========================================
// 9. NPC (DANH NHÂN + NGẪU NHIÊN) & AI HYBRID
// ==========================================

function gapNpcNgauNhien() {
  const mauPool = window.PN_DATA.npcMau || [];
  const hopVung = mauPool.filter(m => m.vungId === state.vungHienTai);
  const mau = pickRandom(hopVung.length > 0 ? hopVung : mauPool);
  if (!mau) return;
  const npcMoi = taoNpcNgauNhienTuMau(mau, state.vungHienTai, Object.keys(state.npcs).length + 1);
  state.npcs[npcMoi.id] = npcMoi;
  selectedNpcId = npcMoi.id;
  ghiNhatKy(`👤 Bạn tình cờ gặp gỡ [${npcMoi.ten}] (${npcMoi.danhHieu}) tại [${layVungDef().ten}].`, 'tot');
  luuGame();
  veGiaoDien();
}

function kiemTraCungDiaDiemNpc(npc, hanhDong = 'tương tác trực tiếp') {
  if (npc.vungId === state.vungHienTai) return true;
  const vNpc = layVungDef(npc.vungId);
  ghiNhatKy(`⚠️ [${npc.ten}] đang ở 【${vNpc.ten}】. Bạn cần di chuyển tới đó mới có thể ${hanhDong}!`, 'canh_bao');
  veGiaoDien();
  return false;
}

function tangQuaNpc(npcId) {
  const npc = state.npcs[npcId];
  if (!npc || !npc.conSong) return;
  if (!kiemTraCungDiaDiemNpc(npc, 'tặng quà')) return;
  const chiPhi = Math.round(45 * Math.pow(2.2, npc.canhGioi));
  if (state.linhThach < chiPhi) {
    ghiNhatKy(`Cần ${chiPhi.toLocaleString()} Linh thạch làm lễ vật cho [${npc.ten}]!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  state.linhThach -= chiPhi;
  thayDoiHaoCam(npc, 15, true);
  ghiKyUcNpc(npc, `Nhận lễ vật từ ${state.ten} (trị giá ${chiPhi.toLocaleString()} LT).`);
  ghiNhatKy(`🎁 Tặng lễ vật cho [${npc.ten}], quan hệ đạt 【${capBacQuanHe(npc)} (${npc.haoCam}/100)】!`, 'tot');
  luuGame();
  veGiaoDien();
}

function luanDaoNpc(npcId) {
  const npc = state.npcs[npcId];
  if (!npc || !npc.conSong) return;
  if (!kiemTraCungDiaDiemNpc(npc, 'luận đạo')) return;
  if ((npc.haoCam || 0) < 20) {
    ghiNhatKy(`[${npc.ten}] chưa đủ tin tưởng (Cần Hảo cảm >= 20 mới chịu luận đạo).`, 'canh_bao');
    veGiaoDien();
    return;
  }
  tienThoiGian(3);
  const tuViTang = Math.round(tinhTocDoTuLuyenNam() * 0.4);
  state.tuVi += tuViTang;
  thayDoiHaoCam(npc, 5, true);
  ghiKyUcNpc(npc, `Luận đạo cùng ${state.ten}.`);
  ghiNhatKy(`🍵 Luận đạo cùng [${npc.ten}] suốt 3 tháng (+${tuViTang.toLocaleString()} Tu vi · ${capBacQuanHe(npc)} ${npc.haoCam}/100).`, 'tot');
  luuGame();
  veGiaoDien();
}

function ketDaoLuNpc(npcId) {
  const npc = state.npcs[npcId];
  if (!npc || !npc.conSong) return;
  if (!kiemTraCungDiaDiemNpc(npc, 'kết Đạo Lữ')) return;
  const daCoDaoLu = Object.values(state.npcs).find(n => n.laDaoLuNguoiChoi && n.conSong);
  if (daCoDaoLu) {
    ghiNhatKy(`Bạn đã kết làm Đạo lữ với [${daCoDaoLu.ten}] rồi!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  if (npc.daoLuId && state.npcs[npc.daoLuId]?.conSong) {
    ghiNhatKy(`[${npc.ten}] đã có Đạo lữ là [${state.npcs[npc.daoLuId].ten}]!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  if ((npc.haoCam || 0) < 80) {
    ghiNhatKy(`Cần đạt mức Tri kỷ (Hảo cảm >= 80) mới có thể kết Đạo lữ với [${npc.ten}]!`, 'canh_bao');
    veGiaoDien();
    return;
  }
  npc.laDaoLuNguoiChoi = true;
  thayDoiHaoCam(npc, Math.max(0, 95 - (npc.haoCam || 0)), true);
  ghiKyUcNpc(npc, `Kết làm Đạo Lữ với ${state.ten}.`);
  ghiNhatKy(`💞 Bạn và [${npc.ten}] thề nguyện kết làm Đạo Lữ, cùng nhau vấn đạo trường sinh!`, 'dai_cat');
  luuGame();
  veGiaoDien();
}

function danhCuopNpc(npcId) {
  const npc = state.npcs[npcId];
  if (!npc || !npc.conSong) return;
  if (!kiemTraCungDiaDiemNpc(npc, 'đánh cướp')) return;
  thayDoiHaoCam(npc, -25, true);
  ghiKyUcNpc(npc, `Bị ${state.ten} đánh úp mưu đoạt túi trữ vật!`);
  ghiNhatKy(`🗡️ Bạn bất ngờ đánh úp [${npc.ten}] để đoạt túi trữ vật!`, 'nguy_hiem');
  batDauChienDau({
    ten: `${npc.ten} (${layCanhGioiDef(npc.canhGioi).ten})`,
    hp: npc.hp,
    congKich: npc.congKich,
    phongThu: npc.phongThu,
    linhThach: npc.linhThach,
    npcId: npc.id,
    canhGioiDich: npc.canhGioi
  });
}

function layKeyHienTai() {
  return aiConfig.provider === 'gemini' ? aiConfig.geminiKey.trim() : aiConfig.openaiKey.trim();
}

async function goiAiJson(systemPrompt, userPrompt) {
  const key = layKeyHienTai();
  if (!key) throw new Error('Chưa nhập API Key trong [⚙️ Cài đặt AI].');

  if (aiConfig.provider === 'gemini') {
    const model = (aiConfig.geminiModel || 'gemini-2.5-flash').trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.85, responseMimeType: 'application/json' }
      })
    });
    if (!res.ok) throw new Error(`Gemini API lỗi (${res.status}): ${(await res.text()).slice(0, 180)}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(lamSachJson(text));
  }

  const baseUrl = (aiConfig.openaiBaseUrl || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
  const model = (aiConfig.openaiModel || 'openai/gpt-4o-mini').trim();
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.85,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });
  if (!res.ok) throw new Error(`OpenAI/OpenRouter lỗi (${res.status}): ${(await res.text()).slice(0, 180)}`);
  const data = await res.json();
  return JSON.parse(lamSachJson(data?.choices?.[0]?.message?.content || '{}'));
}

function lamSachJson(str) {
  return String(str).replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
}

async function lichLuyenAI() {
  if (state.ketThuc || state.tranHienTai || state.suKienHienTai || aiBusy) return;
  if (!layKeyHienTai()) {
    ghiNhatKy('⚠️ Chưa gắn API Key, chuyển sang Sự kiện Lịch luyện Offline.', 'canh_bao');
    lichLuyenOffline();
    return;
  }

  aiBusy = true;
  veGiaoDien();

  const poolVat = window.PN_DATA.vatPham
    .filter(v => (v.canhGioi ?? v.bac ?? 1) <= state.canhGioi + 1)
    .slice(0, 35)
    .map(v => `${v.id} (${v.ten})`)
    .join(', ');

  const sys = `Bạn là Đạo Diễn game sandbox thế giới Phàm Nhân Tu Tiên (người chơi là tu sĩ tự do, KHÔNG phải Hàn Lập).
Chỉ trả về DUY NHẤT 1 JSON hợp lệ:
{
  "ten": "Tiêu đề sự kiện",
  "text": "Mô tả tình huống 3-5 câu sát thế giới PNTT",
  "choices": [
    { "text": "Lựa chọn 1", "effects": [{ "tuVi": 200, "linhThach": -30, "hp": -10, "addItem": "thao_hoang_tinh", "log": "Kết quả..." }] },
    { "text": "Lựa chọn 2 (giao chiến)", "effects": [{ "combat": { "ten": "Đối thủ", "hp": ${Math.round(tinhHpMax() * 0.9)}, "congKich": ${Math.round(tinhCongKich() * 0.9)}, "phongThu": ${Math.round(tinhPhongThu() * 0.8)}, "linhThach": ${Math.round(60 * Math.pow(2.4, state.canhGioi))} }, "log": "Ra tay!" }] },
    { "text": "Lựa chọn 3 (rút lui)", "effects": [{ "tuVi": ${Math.round(tinhTocDoTuLuyenNam() * 0.4)}, "log": "Cẩn trọng rút lui." }] }
  ]
}
Lưu ý: tuVi thưởng trong [-${Math.round(tinhTocDoTuLuyenNam() * 0.4)}, +${Math.round(tinhTocDoTuLuyenNam() * 1.4)}]. Nếu dùng addItem, chỉ chọn trong: ${poolVat}.`;

  const usr = `Tu sĩ: ${state.ten}, Cảnh giới: ${tenCanhGioiDayDu()}, Khí huyết: ${state.hp}/${tinhHpMax()}, Linh thạch: ${state.linhThach}, Vùng: ${layVungDef().ten} (${layVungDef().moTa}). Hãy tạo 1 sự kiện kỳ ngộ.`;

  try {
    tienThoiGian(2);
    const sk = await goiAiJson(sys, usr);
    if (sk && sk.ten && sk.text && Array.isArray(sk.choices)) {
      state.suKienHienTai = sk;
      ghiNhatKy(`✨ [AI Đạo Diễn] Kỳ ngộ tại ${layVungDef().ten}: 【${sk.ten}】`, 'tot');
    } else {
      throw new Error('JSON thiếu trường bắt buộc');
    }
  } catch (err) {
    ghiNhatKy(`⚠️ Lỗi gọi AI (${err.message}). Chuyển sang Offline.`, 'canh_bao');
    lichLuyenOffline();
  } finally {
    aiBusy = false;
    luuGame();
    veGiaoDien();
  }
}

async function chatVoiNpc(npcId, loiNoi) {
  const npc = state.npcs[npcId];
  if (!npc || !npc.conSong || !loiNoi.trim() || aiBusy) return;
  const cauHoi = loiNoi.trim();

  if (!layKeyHienTai()) {
    thayDoiHaoCam(npc, 2, true);
    const phanHoi = `${npc.ten} khẽ gật đầu: "Đạo hữu ${state.ten}, tu tiên giới tại ${layVungDef(npc.vungId).ten} ẩn chứa nhiều hung hiểm. Khi gắn API Key ở [⚙️ Cài đặt AI], ta và đạo hữu có thể đối thoại sâu hơn!"`;
    ghiKyUcNpc(npc, `Trò chuyện với ${state.ten}: "${cauHoi}"`);
    ghiNhatKy(`💬 Bạn nói với [${npc.ten}]: "${cauHoi}"\n👉 ${phanHoi}`, 'thuong');
    luuGame();
    veGiaoDien();
    return;
  }

  aiBusy = true;
  veGiaoDien();

  const sys = `Bạn nhập vai NPC "${npc.ten}" (${npc.danhHieu}) trong thế giới Phàm Nhân Tu Tiên.
Tính cách: ${npc.tinhCach}. Cảnh giới: ${layCanhGioiDef(npc.canhGioi).ten}. Hảo cảm: ${npc.haoCam} (-100..+100).
Túi đồ: ${(npc.tuiDo || []).join(', ')}. Ký ức: ${(npc.kyUc || []).slice(-4).join(' | ') || 'Mới gặp'}.
Trả về DUY NHẤT 1 JSON:
{ "phanHoi": "2-4 câu đúng khẩu khí", "haoCamThayDoi": 5, "tangVatPham": null, "troMatDanhNhau": false }
Quy tắc: haoCamThayDoi từ -25 đến +15; tangVatPham chỉ điền item ID trong túi đồ nếu hảo cảm >= 40.`;

  const usr = `Tu sĩ ${state.ten} (${tenCanhGioiDayDu()}) nói: "${cauHoi}"`;

  try {
    const kq = await goiAiJson(sys, usr);
    const delta = Math.max(-30, Math.min(20, Number(kq.haoCamThayDoi) || 0));
    thayDoiHaoCam(npc, delta, true);
    const loiNpc = kq.phanHoi || `${npc.ten} trầm ngâm không đáp.`;
    ghiKyUcNpc(npc, `${state.ten}: "${cauHoi}" -> "${loiNpc}"`);
    let phuChu = ` (Hảo cảm ${delta >= 0 ? '+' + delta : delta} => ${npc.haoCam}/100)`;
    if (kq.tangVatPham && npc.tuiDo.includes(kq.tangVatPham) && npc.haoCam >= 35) {
      const vp = layVatPhamDef(kq.tangVatPham);
      if (vp) {
        themVat(kq.tangVatPham, 1);
        npc.tuiDo = npc.tuiDo.filter(x => x !== kq.tangVatPham);
        phuChu += ` · 🎁 Tặng [${vp.ten}]!`;
      }
    }
    ghiNhatKy(`💬 Bạn: "${cauHoi}"\n🗣️ [${npc.ten}]: "${loiNpc}"${phuChu}`, 'tot');
    if (kq.troMatDanhNhau) danhCuopNpc(npcId);
  } catch (err) {
    ghiNhatKy(`⚠️ Lỗi AI (${err.message}).`, 'canh_bao');
  } finally {
    aiBusy = false;
    luuGame();
    veGiaoDien();
  }
}

// ==========================================
// 10. RENDER GIAO DIỆN (3 CỘT)
// ==========================================

function apDungTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  const btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = theme === 'dark' ? '☀️ Đổi sang Light Theme' : '🌙 Đổi sang Dark Theme';
}

function doiTheme() {
  apDungTheme((document.documentElement.getAttribute('data-theme') || 'dark') === 'dark' ? 'light' : 'dark');
}

function chonTab(tab) {
  if (tab === 'tong_mon') {
    activeTab = 'dia_diem';
    diaDiemSubTab = 'tong_mon';
  } else if (tab === 'phuong_thi') {
    activeTab = 'dia_diem';
    diaDiemSubTab = 'cua_hang';
  } else {
    activeTab = tab;
  }
  veGiaoDien();
}

function chonDiaDiemSubTab(sub) {
  diaDiemSubTab = sub;
  veCotPhai();
}

function thamNhaNpc(npcId) {
  selectedNpcId = npcId;
  uiFilter.npcScope = 'all';
  uiFilter.npcQuery = '';
  activeTab = 'npc';
  veGiaoDien();
}

function veGiaoDien() {
  if (!state) return;

  const lcDef = layLinhCanDef();
  const tcDef = layTheChatDef();
  const xtDef = layXuatThanDef();
  const cpDef = layCongPhapDef();
  const pbDef = state.phapBao ? layVatPhamDef(state.phapBao) : null;
  const vungDef = layVungDef();
  const tmDef = state.tongMon ? layTongMonDef(state.tongMon.id) : null;
  const tuViCan = tinhTuViCan();
  const phanTramTuVi = Math.min(100, Math.round((state.tuVi / tuViCan) * 100));

  const coDp = coDongPhu();
  const dpVungDef = coDp ? layVungDef(state.dongPhu.vungId) : null;
  const lkDongPhu = tinhLinhKhiDongPhu();
  const oDongPhu = dangODongPhu();
  const heSoLk = tinhHeSoLinhKhi(tinhLinhKhiHienTaiTuLuyen());

  document.getElementById('col-status').innerHTML = `
    <div class="panel-title">📜 ĐẠO TỊCH TU SĨ</div>
    <div class="stat-row"><span>Đạo hiệu:</span> <b>${escapeHtml(state.ten)} (Kiếp ${state.kiep})</b></div>
    <div class="stat-row"><span>Cảnh giới:</span> <b class="hl-realm">${tenCanhGioiDayDu()}</b></div>
    <div class="stat-row"><span>Thời gian / Tuổi:</span> <b>Năm ${state.nam} · T${state.thang || 1} (${state.tuoi}/${tinhThoNguyenMax()}t)</b></div>
    <div class="stat-row"><span>Vùng hiện tại:</span> <b>${vungDef.ten}</b> <span class="muted">(LK x${vungDef.linhKhi})</span></div>
    <div class="stat-row"><span>Động phủ:</span> ${coDp ? `<b>${dpVungDef.ten}</b> <span class="muted">(Cấp ${state.dongPhu.cap} · LK x${lkDongPhu}${oDongPhu ? ' · Đang ở' : ' · Ở xa'})</span>` : '<span class="muted">Chưa lập Động Phủ</span>'}</div>
    <div class="stat-row"><span>Tông môn:</span> <b>${tmDef ? `${tmDef.ten} (${TONG_MON_CHUC_VI[state.tongMon.capBac].ten})` : 'Tán tu'}</b></div>
    <div class="stat-row"><span>Linh căn:</span> <span>${lcDef.ten} <b class="hl-realm">[${tenHeLinhCanText(state.linhCanHe)}]</b> <span class="muted">(${lcDef.heSoTuLuyen}x)</span></span></div>
    <div class="stat-row"><span>Thể chất:</span> <span>${tcDef.ten} <span class="badge">${tcDef.pham || 'Phàm phẩm'}</span></span></div>
    <div class="stat-row"><span>Xuất thân:</span> <span>${xtDef.ten}</span></div>
    <div class="stat-row"><span>Tu vi:</span> <b>${state.tuVi.toLocaleString()} / ${tuViCan.toLocaleString()}</b></div>
    <div class="progress-bar"><div class="progress-fill" style="width:${phanTramTuVi}%"></div></div>

    <div class="panel-title" style="margin-top:12px">⚡ THUỘC TÍNH & TRANG BỊ</div>
    <div class="stat-row"><span>Khí huyết:</span> <b>${state.hp.toLocaleString()} / ${tinhHpMax().toLocaleString()}</b></div>
    <div class="stat-row"><span>Thể trạng:</span> <b class="${layThuongTheDef().cls}">${layThuongTheDef().ten}</b></div>
    <div class="stat-row"><span>Linh lực (MP):</span> <b class="hl-realm">${Math.round(state.mp ?? tinhMpMax()).toLocaleString()} / ${tinhMpMax().toLocaleString()}</b></div>
    <div class="stat-row"><span>Linh thạch:</span> <b class="hl-gold">${state.linhThach.toLocaleString()} viên</b></div>
    <div class="stat-row"><span>Tốc độ tu luyện:</span> <span>~${tinhTocDoTuLuyenNam().toLocaleString()} /năm <span class="muted">(Linh khí ${heSoLk.toFixed(2)}x)</span></span></div>
    <div class="stat-row"><span>Công kích / Phòng thủ:</span> <b>${tinhCongKich().toLocaleString()} / ${tinhPhongThu().toLocaleString()}</b></div>
    <div class="stat-row"><span>Bạo kích / Né tránh:</span> <span>${Math.round(tinhBaoKichPct() * 100)}% / ${Math.round(tinhNeTranhPct() * 100)}%</span></div>
    <div class="stat-row"><span>Căn cốt / Ngộ tính:</span> <span>${state.chiSo.canCot + (tinhCongPhapTongHop().canCot || 0)} / ${state.chiSo.ngoTinh + (tinhCongPhapTongHop().ngoTinh || 0)}</span></div>
    <div class="stat-row"><span>Khí vận / Thần thức:</span> <span>${state.chiSo.khiVan + (tinhCongPhapTongHop().khiVan || 0)} / ${state.chiSo.thanThuc + (tinhCongPhapTongHop().thanThuc || 0)}</span></div>
    <div class="stat-row"><span>Chủ công pháp:</span> <span><b>${cpDef.ten}</b> <span class="muted">(${tinhTuongThichLinhCan().label} · ${moTaCongPhapNgan(cpDef)})</span></span></div>
    <div class="stat-row"><span>Bí thuật (${(state.biThuat || []).length}/${MAX_BI_THUAT}):</span> <span>${
      (state.biThuat || [])
        .map(id => {
          const b = layCongPhapDef(id);
          return `<b>${b.ten}</b> <span class="muted">(${moTaCongPhapNgan(b)})</span>`;
        })
        .join('<br>') || 'Chưa gắn'
    }</span></div>
    <div class="stat-row"><span>Pháp bảo:</span> ${
      pbDef
        ? (() => {
            const pcPb = layPhamChatVatPham(state.phapBao);
            const pbGt = tinhHeSoVuotCanh(layCanhGioiPhapBao(pbDef), /Thông Thiên Linh Bảo/i.test(pbDef.phanCap || '') ? 9 : null);
            const atkPb = Math.round((pbDef.congKich || 0) * pcPb.heSo * pbGt.heSo);
            const defPb = Math.round((pbDef.phongThu || 0) * pcPb.heSo * pbGt.heSo);
            return `<span><b>${pbDef.ten}</b> <span class="badge">${layRankVatPham(pbDef)}</span> <span class="badge ${pcPb.cls}">${pcPb.ten}</span> <span class="muted">(Công +${atkPb.toLocaleString()} · Thủ +${defPb.toLocaleString()} · ${tinhTuongThichPhapBao(pbDef).label}${pbGt.nhan ? ` · <b class="hl-danger">${pbGt.nhan}</b>` : ''})</span></span>`;
          })()
        : '<b>Chưa trang bị</b>'
    }</div>
    ${state.dotPhaBuff > 0 ? `<div class="stat-row"><span>Dược lực đột phá:</span> <b class="hl-green">+${Math.round(state.dotPhaBuff * 100)}%</b></div>` : ''}
  `;

  veCotGiua();
  veCotPhai();
}

function veCotGiua() {
  const elInteraction = document.getElementById('main-interaction');
  const elLog = document.getElementById('main-log');

  if (state.ketThuc) {
    elInteraction.innerHTML = `
      <div class="event-box">
        <div class="event-title">${state.ketThuc.thangLoi ? '🌟 PHI THĂNG CHÂN TIÊN GIỚI' : '🕯️ ĐẠO ĐỒ KHÉP LẠI'}</div>
        <p>${escapeHtml(state.ketThuc.lyDo)}</p>
        <p class="muted">Tổng kết: Đạt 【${tenCanhGioiDayDu()}】 ở tuổi ${state.tuoi} (Năm thứ ${state.nam}).</p>
        <div class="choice-list">
          <button class="btn btn-primary" onclick="moModalKiepMoi()">🎲 Luân Hồi Roll Kiếp Mới</button>
        </div>
      </div>`;
  } else if (state.tranHienTai) {
    const t = state.tranHienTai;
    const cpSum = tinhCongPhapTongHop();
    const pb = state.phapBao ? layVatPhamDef(state.phapBao) : null;
    const cdPb = (t.cooldowns && t.cooldowns._pb) || 0;
    const mpCur = Math.round(state.mp ?? tinhMpMax());
    const mpMax = tinhMpMax();
    const skillBtns = cpSum.kyNangChuDong
      .map(kn => {
        const cd = (t.cooldowns && t.cooldowns[kn.id]) || 0;
        const mpCost = tinhTieuHaoLinhLuc(kn);
        const thieuMp = mpCur < mpCost;
        const gtKn = tinhHeSoVuotCanh(kn.nguonCg ?? 0, kn.nguonCgToiDa);
        const gtTag = gtKn.vuot > 0 ? ` · ${gtKn.nhan}` : '';
        const lyDoKhoa = cd > 0 ? ` · Đang hồi ${cd}h` : thieuMp ? ` · Thiếu LL (${mpCost})` : ` · Tốn ${mpCost} LL`;
        return `<button class="btn btn-ai" onclick="hanhDongChienDau('ky_nang:${kn.id}')" ${cd > 0 || thieuMp ? 'disabled' : ''}>✨ ${escapeHtml(moTaKyNangNgan(kn))} · [${escapeHtml(kn.nguonTen)}]${lyDoKhoa}${gtTag}</button>`;
      })
      .join('');

    const phuChienDau = ['phu_thien_loi', 'phu_hoa_cau'].find(id => soLuongVat(id) > 0);
    const phuVp = phuChienDau ? layVatPhamDef(phuChienDau) : null;
    const danHoiEntry = Object.entries(state.tuiDo || {})
      .filter(([, sl]) => sl > 0)
      .map(([key]) => ({ key, vp: layVatPhamDef(key) }))
      .find(x => x.vp && x.vp.loai === 'dan' && (Number(x.vp.hieuUng?.hp) > 0 || Number(x.vp.hieuUng?.tuVi) > 0));
    const danHoi = danHoiEntry ? { ...danHoiEntry.vp, key: danHoiEntry.key } : null;

    const phuChay = ['phu_truyen_tong', 'phu_nghi_binh'].find(id => soLuongVat(id) > 0);
    const phuChayVp = phuChay ? layVatPhamDef(phuChay) : null;
    const tiLeChayPct = tinhTiLeChayTron(t);
    const tiLePhuPct =
      phuChay === 'phu_truyen_tong' ? 100 : Math.round(Math.max(35, Math.min(95, tiLeChayPct + 45)));

    const ttDichTxt = dinhDangTrangThai(t.trangThaiDich);
    const ttTaTxt = dinhDangTrangThai(t.trangThaiTa);
    const buffTaParts = [];
    if ((t.hoiXuanLuot || 0) > 0) buffTaParts.push(`🌿 Hồi xuân (${t.hoiXuanLuot}h)`);
    if ((t.buffNeLuot || 0) > 0) buffTaParts.push(`💨 Độ̣n ảnh +Né (${t.buffNeLuot}h)`);
    if (ttTaTxt) buffTaParts.push(ttTaTxt);

    elInteraction.innerHTML = `
      <div class="event-box combat-box">
        <div class="event-title">⚔️ ĐẤU PHÁP: ${escapeHtml(t.ten)} (Hiệp ${t.hiep})</div>
        <div class="stat-row"><span>Khí huyết địch:</span> <b class="hl-danger">${t.hpDich.toLocaleString()} / ${t.hpDichMax.toLocaleString()}</b> <span class="muted">(Công ${t.congKich.toLocaleString()} · Thủ ${t.phongThu.toLocaleString()})</span></div>
        ${ttDichTxt ? `<div class="muted" style="margin:-2px 0 4px">Trạng thái địch: <b class="hl-danger">${escapeHtml(ttDichTxt)}</b></div>` : ''}
        <div class="stat-row"><span>Khí huyết / Linh lực:</span> <span><b class="hl-green">${state.hp.toLocaleString()}/${tinhHpMax().toLocaleString()} HP</b> · <b class="hl-realm">${mpCur.toLocaleString()}/${mpMax.toLocaleString()} LL</b></span> <span class="muted">(Công ${tinhCongKich().toLocaleString()} · Thủ ${tinhPhongThu().toLocaleString()})</span></div>
        ${buffTaParts.length > 0 ? `<div class="muted" style="margin:-2px 0 4px">Trạng thái bạn: <b>${escapeHtml(buffTaParts.join(' · '))}</b></div>` : ''}
        <div class="combat-log-mini">${t.logTran.slice(-5).map(l => `<div>• ${escapeHtml(l)}</div>`).join('')}</div>
        <div class="choice-list">
          <button class="btn" onclick="hanhDongChienDau('thuong')">1. Vận công pháp tấn công (x1.0 ST · +6% Linh lực)</button>
          <button class="btn btn-primary" onclick="hanhDongChienDau('phap_bao')" ${cdPb > 0 ? 'disabled' : ''}>
            2. ${pb ? `Tế Pháp Bảo: ${escapeHtml(pb.ten)} (x1.5 · xuyên 15% giáp)` : 'Tụ lực sát chiêu (x1.25 · chưa đeo Pháp bảo)'} ${cdPb > 0 ? `(Hồi ${cdPb} hiệp)` : ''}
          </button>
          ${skillBtns}
          <button class="btn" onclick="hanhDongChienDau('dieu_tuc')">🧘 Điều tức hồi linh (+25% Linh lực · -25% ST nhận lượt này)</button>
          ${phuVp ? `<button class="btn btn-ai" onclick="hanhDongChienDau('dung_phu:${phuVp.id}')">🧿 Phóng ${escapeHtml(phuVp.ten)} (Còn ${soLuongVat(phuVp.id)} · xuyên 50% giáp)</button>` : ''}
          ${danHoi ? `<button class="btn" onclick="hanhDongChienDau('dung_dan:${danHoi.key || danHoi.id}')">💊 Uống ${escapeHtml(danHoi.ten)} [${layPhamChatVatPham(danHoi.key || danHoi.id).ten}] (Còn ${soLuongVat(danHoi.key || danHoi.id)} · hồi HP & LL)</button>` : ''}
          <button class="btn" onclick="hanhDongChienDau('toc_chien')">⚡ Tốc chiến tự động phân thắng bại</button>
          ${phuChayVp ? `<button class="btn btn-ai" onclick="hanhDongChienDau('dung_phu_chay:${phuChayVp.id}')">🧿 Tế [${escapeHtml(phuChayVp.ten)}] độn tẩu (${tiLePhuPct}% · Còn ${soLuongVat(phuChayVp.id)})</button>` : ''}
          <button class="btn btn-danger" onclick="hanhDongChienDau('bo_chay')">💨 Độn thuật bỏ chạy (${tiLeChayPct}%${(t.canhGioiDich ?? state.canhGioi) - state.canhGioi >= 2 ? ' · Bị áp chế cảnh giới' : ''})</button>
        </div>
      </div>`;
  } else if (state.hauChienNpc) {
    const h = state.hauChienNpc;
    const npc = state.npcs[h.npcId];
    const tcTen = npc ? layTinhCachNpcDef(npc.tinhCachLoai).ten : '';
    elInteraction.innerHTML = `
      <div class="event-box combat-box">
        <div class="event-title">⚖️ XỬ TRÍ BẠI TƯỚNG: 【${escapeHtml(h.ten)}】</div>
        <p class="event-text">Đối phương đã bại trận gục dưới tay bạn! (Đã thu +${(h.tuViThuong || 0).toLocaleString()} Tu vi)${npc ? ` · Tính cách: <b class="hl-realm">[${escapeHtml(tcTen)}]</b> · Quan hệ: <b>${capBacQuanHe(npc)} (${npc.haoCam}/100)</b>` : ''}</p>
        <div class="choice-list">
          <button class="btn btn-danger" onclick="xuLyHauChienNpc('ket_lieu')">💀 1. Kết liễu — Đoạt sạch Linh thạch, Trang bị & Bí tịch (Cừu oán bằng hữu & Tông môn -25)</button>
          <button class="btn" onclick="xuLyHauChienNpc('si_nhuc')">😈 2. Sỉ nhục & Cảnh cáo — Tha mạng nhưng làm nhục (-45 Hảo cảm NPC, +50% Tu vi)</button>
          <button class="btn btn-primary" onclick="xuLyHauChienNpc('cuop')">💰 3. Cướp sạch — Lấy Linh thạch & đồ mang theo rồi thả (-30 Hảo cảm, Tông môn -15)</button>
          <button class="btn btn-ai" onclick="xuLyHauChienNpc('buong_tha')">🕊️ 4. Buông tha — Không lấy đồ (Phản ứng tùy tính cách: cảm động hoặc ghi hận, +30% Tu vi)</button>
        </div>
      </div>`;
  } else if (state.biCanhHienTai) {
    const run = state.biCanhHienTai;
    const sk = run.suKienBuoc || sinhSuKienBiCanh();
    elInteraction.innerHTML = `
      <div class="event-box">
        <div class="event-title">🌌 THÁM HIỂM BÍ CẢNH: 【${escapeHtml(run.ten)}】 (Chặng ${run.buoc}/${run.tongBuoc})</div>
        <div class="muted" style="margin-bottom:6px"><b>${escapeHtml(sk.tieuDe)}</b></div>
        <p class="event-text">${escapeHtml(sk.moTa)}</p>
        <div class="muted" style="margin-bottom:8px">🎒 Thu hoạch trong chuyến đi: <b>${run.thuHoach.length > 0 ? escapeHtml(run.thuHoach.join(', ')) : 'Chưa có'}</b></div>
        <div class="choice-list">
          ${sk.choices
            .map((c, i) => {
              const thieuLt = c.kieu === 'npc_giao_dich' && state.linhThach < (sk.phiTin || 0);
              return `<button class="btn ${i === 0 ? 'btn-primary' : c.kieu === 'rut_lui' ? 'btn-danger' : ''}" onclick="hanhDongBiCanh(${i})" ${thieuLt ? 'disabled' : ''}>${i + 1}. ${escapeHtml(c.nhan)}</button>`;
            })
            .join('')}
        </div>
      </div>`;
  } else if (state.suKienHienTai) {
    const sk = state.suKienHienTai;
    elInteraction.innerHTML = `
      <div class="event-box">
        <div class="event-title">📖 KỲ NGỘ: ${escapeHtml(sk.ten)}</div>
        <p class="event-text">${escapeHtml(sk.text)}</p>
        <div class="choice-list">
          ${sk.choices
            .map((c, i) => {
              const reqInfo = kiemTraDieuKienLuaChon(c);
              const checkTag = moTaCheckLuaChon(c);
              const tag = reqInfo.nhan
                ? reqInfo.du
                  ? ` <span class="hl-green">[${escapeHtml(reqInfo.nhan)}]</span>`
                  : ` <span class="hl-danger">[${escapeHtml(reqInfo.nhan)}]</span>`
                : '';
              return `<button class="btn" onclick="chonLuaChonSuKien(${i})" ${reqInfo.du ? '' : 'disabled'}>${i + 1}. ${escapeHtml(c.text)}${checkTag}${tag}</button>`;
            })
            .join('')}
        </div>
      </div>`;
  } else {
    const duTuVi = state.tuVi >= tinhTuViCan();
    const laDaiCanh = laDinhPhongDaiCanh();
    const tiLeDp = Math.round(tinhTiLeDotPhaDaiCanh() * 100);
    const vung = layVungDef();
    const dsBiCanhVung = (window.PN_DATA.biCanh || []).filter(b => b.vungId === vung.id);
    const providerName = aiConfig.provider === 'gemini' ? 'Gemini' : 'OpenAI/OpenRouter';
    const coKey = !!layKeyHienTai();

    elInteraction.innerHTML = `
      <div class="event-box">
        <div class="event-title">🏔️ HÀNH ĐỘNG TẠI 【${vung.ten.toUpperCase()}】</div>
        <p class="muted">${vung.moTa}</p>
        <div class="action-grid">
          <button class="btn" onclick="beQuan(1)">🧘 Bế quan 1 năm (+${tinhTocDoTuLuyenNam().toLocaleString()} TV)</button>
          <button class="btn" onclick="beQuan(5)">🧘 Bế quan 5 năm (+${(tinhTocDoTuLuyenNam() * 5).toLocaleString()} TV)</button>
          <button class="btn" onclick="beQuan(10)">🧘 Bế quan 10 năm (+${(tinhTocDoTuLuyenNam() * 10).toLocaleString()} TV)</button>
          <button class="btn ${duTuVi ? 'btn-primary' : ''}" onclick="dotPha()">
            ⚡ ${laDaiCanh ? `Xung kích Đại Cảnh Giới (${tiLeDp}%)` : 'Đột phá Tiểu Cảnh Giới'}
          </button>
          ${
            (state.thuongThe || 0) > 0 || state.hp < tinhHpMax()
              ? `<button class="btn ${(state.thuongThe || 0) >= 2 ? 'btn-danger' : 'btn-primary'}" style="grid-column: 1 / -1" onclick="dieuDuongThuongThe()">
                  🩺 Điều dưỡng thương thế (2 tháng · Hiện tại: ${layThuongTheDef().ten})
                </button>`
              : ''
          }
          <button class="btn" style="grid-column: 1 / -1" onclick="chonTab('dia_diem'); chonDiaDiemSubTab('kham_pha')">
            🏞️ Khám phá 【${escapeHtml(vung.ten)}】 (Lịch luyện · Săn Yêu thú · Động phủ ẩn)
          </button>
          <button class="btn btn-ai" style="grid-column: 1 / -1" onclick="lichLuyenAI()" ${aiBusy ? 'disabled' : ''}>
            ${aiBusy ? '⏳ AI Đạo Diễn đang suy diễn...' : `✨ Lịch luyện AI (${providerName}${coKey ? '' : ' · Chưa gắn Key'} · 2 tháng)`}
          </button>
          ${dsBiCanhVung
            .map(
              bc => `<button class="btn btn-primary" style="grid-column: 1 / -1" onclick="thamHiemBiCanh('${bc.id}')">
                🌌 Bí Cảnh: 【${bc.ten}】 (Cần ${layCanhGioiDef(bc.canhGioiMin).ten}–${layCanhGioiDef(bc.canhGioiMax).ten} · Phí ${bc.phiLinhThach.toLocaleString()} LT · ${bc.namTon} năm)
              </button>`
            )
            .join('')}
        </div>
      </div>`;
  }

  elLog.innerHTML = state.nhatKy
    .map(
      item => `
      <div class="log-entry log-${item.loai}">
        <span class="log-year">[Năm ${item.nam}${item.thang ? `·T${item.thang}` : ''}${item.tuoi ? ` · ${item.tuoi}t` : ''}]</span>
        <span>${escapeHtml(item.text).replace(/\n/g, '<br>')}</span>
      </div>`
    )
    .join('');
}

// Kho hàng ngẫu nhiên theo vùng & năm (đảm bảo bày bán đa dạng Pháp bảo, Đan dược, Phù lục, Túi trữ vật, Thảo dược, Vật liệu, Công pháp)
let shopNonce = 0;
let shopHangCache = { key: '', items: [], congPhap: [], danPhuong: [] };

function chonNgauNhienNhieu(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function layKhoHangShop(vung, maxCg) {
  const key = `${vung.id}_${state.nam}_${maxCg}_${shopNonce}`;
  if (shopHangCache.key === key) return shopHangCache;

  const hopCg = cg => cg <= maxCg;
  const allVp = window.PN_DATA.vatPham || [];
  const pbList = allVp.filter(v => v.loai === 'phap_bao' && hopCg(v.canhGioi ?? 0));
  const danList = allVp.filter(v => v.loai === 'dan' && hopCg(v.canhGioi ?? 0));
  const phuList = allVp.filter(v => v.loai === 'phu_luc' && hopCg(v.canhGioi ?? 0));
  const truList = allVp.filter(v => v.loai === 'tru_vat' && hopCg(v.canhGioi ?? 0));
  const thaoList = allVp.filter(v => {
    if (v.loai !== 'linh_thao') return false;
    if (maxCg <= 1 && (v.gia || 0) > 400) return false;
    if (maxCg <= 2 && (v.gia || 0) > 5000) return false;
    return true;
  });
  const vlList = allVp.filter(v => ['yeu_dan', 'linh_vat'].includes(v.loai) && hopCg(v.canhGioi ?? v.bac ?? 0));

  const pickedItems = [
    ...chonNgauNhienNhieu(pbList, vung.coPhuongThi ? 6 : 3),
    ...chonNgauNhienNhieu(danList, vung.coPhuongThi ? 6 : 4),
    ...chonNgauNhienNhieu(phuList, 3),
    ...chonNgauNhienNhieu(truList, 2),
    ...chonNgauNhienNhieu(thaoList, vung.coPhuongThi ? 6 : 4),
    ...chonNgauNhienNhieu(vlList, 3)
  ].map(v => {
    const shopKey = taoItemKey(v.id);
    const pc = layPhamChatVatPham(shopKey);
    return { ...v, shopKey, pcKey: pc.key, giaShop: Math.max(1, Math.round((v.gia || 0) * pc.heSo)) };
  });

  const cpList = (window.PN_DATA.congPhap || []).filter(
    c => c.coTheMua !== false && hopCg(c.canhGioi ?? 0) && !state.congPhapDaHoc.includes(c.id)
  );
  const dpList = (window.PN_DATA.danPhuong || []).filter(
    d => hopCg(d.canhGioi ?? 1) && !state.danPhuongDaHoc.includes(d.id)
  );

  shopHangCache = {
    key,
    items: pickedItems,
    congPhap: chonNgauNhienNhieu(cpList, vung.coPhuongThi ? 5 : 3),
    danPhuong: chonNgauNhienNhieu(dpList, 3)
  };
  return shopHangCache;
}

function lamMoiShopVung() {
  if (state.linhThach < 10) {
    ghiNhatKy('Cần 10 Linh thạch để dò hỏi thương nhân đổi phiên hàng mới!', 'canh_bao');
    veGiaoDien();
    return;
  }
  state.linhThach -= 10;
  shopNonce += 1;
  ghiNhatKy(`🔄 Thương hội tại 【${layVungDef().ten}】 vừa mở sạp hàng mới (-10 LT)!`, 'thuong');
  luuGame();
  veGiaoDien();
}

function veCotPhai() {
  const focusedId = document.activeElement && document.activeElement.id;
  const selStart = focusedId && focusedId.startsWith('filter-') ? document.activeElement.selectionStart : null;

  const tabDiaDiemBtn = document.getElementById('tab-btn-dia_diem');
  if (tabDiaDiemBtn) {
    tabDiaDiemBtn.textContent = `📍 ${layVungDef().ten}`;
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === activeTab);
  });
  const el = document.getElementById('tab-content');

  // TAB 1: ĐỘNG PHỦ CỐ ĐỊNH (3 -> 9 Ô), LINH KHÍ & LUYỆN ĐAN
  if (activeTab === 'dong_phu') {
    if (!coDongPhu()) {
      const vungHienTai = layVungDef();
      el.innerHTML = `
        <div class="sub-section">
          <div class="sub-title">🏚️ Chưa Có Động Phủ Cố Định</div>
          <p class="muted">Bạn đã phá hủy Động Phủ cũ hoặc chưa khai lập Động Phủ. Hãy di chuyển tới vùng đất có Linh khí mong muốn rồi khai lập Động Phủ mới (hiện tại: 【${escapeHtml(vungHienTai.ten)}】 · Linh khí x${vungHienTai.linhKhi}).</p>
          <button class="btn btn-sm btn-primary" onclick="lapDongPhuTaiDay()">🏔️ Khai lập Động Phủ tại 【${escapeHtml(vungHienTai.ten)}】</button>
        </div>
        <div class="sub-section">
          <div class="sub-title">🔥 Đan Phòng</div>
          <div class="muted">Cần khai lập Động Phủ trước khi có thể đặt Đan Lô luyện đan.</div>
        </div>`;
      return;
    }

    const giaNangCap = giaNangCapDongPhu();
    const giaDoi = giaDoiDongPhu();
    const oNha = dangODongPhu();
    const dpVung = layVungDef(state.dongPhu.vungId);
    const lkDongPhu = tinhLinhKhiDongPhu();
    const tocDoCay = tinhTocDoSinhTruongLinhDien();
    const giamTgPct = Math.round((1 - 1 / tocDoCay) * 100);
    const dsThaoTrongTui = window.PN_DATA.vatPham
      .filter(v => v.loai === 'linh_thao' && soLuongVat(v.id) > 0)
      .sort((a, b) => (a.canhGioi ?? 0) - (b.canhGioi ?? 0) || a.ten.localeCompare(b.ten, 'vi'));
    const tiLeDotNhapNam = (Math.max(0.01, (oNha ? 0.015 : 0.065) - (state.dongPhu.cap - 1) * 0.007) * 100).toFixed(1);

    el.innerHTML = `
      <div class="sub-section">
        <div class="sub-title">🏡 Động Phủ Cấp ${state.dongPhu.cap} · Đặt tại 【${escapeHtml(dpVung.ten)}】</div>
        <div class="stat-row"><span>Linh khí Động Phủ:</span> <b class="hl-realm">x${lkDongPhu}</b> <span class="muted">(Vùng x${dpVung.linhKhi} + Tụ Linh Trận +${(state.dongPhu.cap - 1) * 25}%)</span></div>
        <div class="stat-row"><span>Trạng thái & Đột nhập:</span> <span>${oNha ? '<b class="hl-green">Đang tọa trấn</b>' : '<b class="hl-danger">Đang vắng nhà</b>'} <span class="muted">(Nguy cơ đột nhập ~${tiLeDotNhapNam}%/năm)</span></span></div>
        ${
          !oNha
            ? `<div class="muted hl-danger" style="margin:6px 0">⚠️ Bạn đang ở 【${escapeHtml(layVungDef().ten)}】 — cần quay về 【${escapeHtml(dpVung.ten)}】 để hưởng Linh khí Động Phủ, chăm Linh Điền & Luyện Đan (hoặc dời/phá hủy phủ).</div>
               <div class="row-actions">
                 <button class="btn btn-sm btn-primary" onclick="diChuyenVung('${dpVung.id}')">🚀 Về ${escapeHtml(dpVung.ten)} (${tinhThangDiChuyen(dpVung.id)} tháng)</button>
                 <button class="btn btn-sm" onclick="doiDongPhuVeDay()">🏔️ Dời Động Phủ về đây (${giaDoi.toLocaleString()} LT)</button>
                 <button class="btn btn-sm btn-danger" onclick="phaHuyDongPhu()">💥 Phá hủy Động Phủ</button>
               </div>`
            : `<div class="row-actions">
                 <button class="btn btn-sm" onclick="nangCapDongPhu()">
                   ⬆️ Nâng cấp Tụ Linh & Hộ Phủ Trận (${giaNangCap.toLocaleString()} LT${state.dongPhu.linhDien.length < MAX_LINH_DIEN ? ' · +1 ô Linh Điền' : ''})
                 </button>
                 <button class="btn btn-sm btn-danger" onclick="phaHuyDongPhu()">💥 Phá hủy Động Phủ</button>
               </div>`
        }
      </div>

      <div class="sub-section">
        <div class="sub-title">🌱 Vườn Linh Điền (${state.dongPhu.linhDien.length}/${MAX_LINH_DIEN} ô · Tốc độ x${tocDoCay}${giamTgPct > 0 ? `, giảm ${giamTgPct}% thời gian chín` : ''})</div>
        <p class="muted">Thời gian chín chia 6 bậc: Phàm (4 năm), Sơ (12), Huyền (30), Địa (70), Thiên (140), Tiên (260). Linh khí Động Phủ giảm tối đa 50% thời gian chín (max x2.0). Chín đạt x2 gốc, để già gấp đôi đạt x3.</p>
        ${state.dongPhu.linhDien
          .map((o, idx) => {
            if (!o) {
              return `
                <div class="card-row">
                  <div style="min-width:95px"><b>Ô #${idx + 1}:</b> <span class="muted">Đất trống</span></div>
                  <div class="row-actions" style="flex:1;justify-content:flex-end;min-width:0">
                    ${
                      dsThaoTrongTui.length > 0
                        ? `<select id="linh-dien-seed-${idx}" style="max-width:220px;padding:4px 6px;font-size:12.5px" ${oNha ? '' : 'disabled'}>
                            ${dsThaoTrongTui
                              .map(th => {
                                const bac = layBacLinhThao(th);
                                return `<option value="${th.id}">${escapeHtml(th.ten)} (x${soLuongVat(th.id)} · ${bac.namChin}n · ${bac.tenBac})</option>`;
                              })
                              .join('')}
                          </select>
                          <button class="btn btn-sm btn-primary" onclick="trongLinhThaoTuSelect(${idx})" ${oNha ? '' : 'disabled'}>🌱 Gieo trồng</button>`
                        : '<span class="muted">Trong túi chưa có hạt giống / linh thảo</span>'
                    }
                  </div>
                </div>`;
            }
            const vp = layVatPhamDef(o.itemId);
            const bac = layBacLinhThao(vp);
            const sl = sanLuongLinhDien(o);
            const pct = Math.min(100, Math.round(((o.namTrong || 0) / bac.namChin) * 100));
            return `
              <div class="card-row">
                <div>
                  <b>Ô #${idx + 1}: ${vp ? vp.ten : o.itemId}</b> <span class="badge">${bac.tenBac}</span>
                  <div class="${sl > 0 ? 'hl-green' : 'muted'}">${o.namTrong}/${bac.namChin} năm (${pct}%)${sl > 0 ? ` → Chín (x${sl} gốc)` : ' · Đang sinh trưởng'}</div>
                </div>
                <button class="btn btn-sm ${sl > 0 ? 'btn-primary' : ''}" onclick="thuHoachLinhDien(${idx})" ${oNha && sl > 0 ? '' : 'disabled'}>
                  ${sl > 0 ? `🌿 Thu hoạch (x${sl})` : `Chưa chín (${pct}%)`}
                </button>
              </div>`;
          })
          .join('')}
      </div>

      <div class="sub-section">
        <div class="sub-title">🔥 Đan Phòng (${state.danPhuongDaHoc.length} đan phương đã học)</div>
        ${window.PN_DATA.danPhuong
          .filter(dp => state.danPhuongDaHoc.includes(dp.id))
          .map(dp => {
            const nlText = dp.nguyenLieu.map(n => `${(layVatPhamDef(n.id) || {}).ten || n.id} (${soLuongVat(n.id)}/${n.soLuong})`).join(' + ');
            return `
              <div class="card-row">
                <div><b>${dp.ten}</b><div class="muted">Cần: ${nlText} → ${dp.soLuongRa} viên</div></div>
                <button class="btn btn-sm btn-primary" onclick="luyenDan('${dp.id}')" ${oNha ? '' : 'disabled'}>🔥 Khai lò</button>
              </div>`;
          })
          .join('')}
      </div>`;
  }

  // TAB 2: ĐỊA ĐIỂM HIỆN TẠI (KHÁM PHÁ / CỬA HÀNG / TÔNG MÔN / TU SĨ TẠI ĐÂY)
  else if (activeTab === 'dia_diem') {
    const vung = layVungDef();
    const dsTmTaiVung = window.PN_DATA.tongMon.filter(t => t.vungId === vung.id);
    const dsNpcTaiVung = Object.values(state.npcs).filter(n => n.vungId === vung.id && n.conSong);
    const dsDiaDiem = damBaoDiaDiemVung(vung.id);
    let bodyHtml = '';

    // Sub-tab 0: KHÁM PHÁ ĐỊA ĐIỂM NGẪU NHIÊN (Lịch luyện / Săn Yêu thú / Linh mạch / Động phủ Bí cảnh ẩn)
    if (diaDiemSubTab === 'kham_pha') {
      const iconTheoLoai = {
        su_kien: '🌲 Lịch Luyện',
        yeu_thu: '👹 Săn Yêu Thú',
        linh_mach: '🌿 Dược Cốc / Linh Tuyền',
        dong_phu: '🌌 Động Phủ Ẩn (Bí Cảnh)'
      };
      const nutTheoLoai = dd => {
        if (dd.loai === 'su_kien') return `<button class="btn btn-sm btn-primary" onclick="khamPhaDiaDiemCon('${dd.id}')">🌲 Lịch luyện (2 tháng)</button>`;
        if (dd.loai === 'yeu_thu') return `<button class="btn btn-sm btn-danger" onclick="khamPhaDiaDiemCon('${dd.id}')">👹 Săn Yêu thú (1 tháng)</button>`;
        if (dd.loai === 'linh_mach') {
          return dd.daKhamPha
            ? `<button class="btn btn-sm" disabled>Đã thu hái</button>`
            : `<button class="btn btn-sm btn-primary" onclick="khamPhaDiaDiemCon('${dd.id}')">🌿 Hái dược (1 tháng)</button>`;
        }
        return `<button class="btn btn-sm btn-primary" onclick="khamPhaDiaDiemCon('${dd.id}')">🌌 Thám hiểm Động phủ (2 tháng)</button>`;
      };
      bodyHtml = `
        <div class="sub-box">
          <div class="filter-bar" style="justify-content:space-between;align-items:center">
            <span class="muted">Các điểm kỳ ngộ, sào huyệt & động phủ bí ẩn quanh <b>${escapeHtml(vung.ten)}</b></span>
            <button class="btn btn-sm btn-primary" onclick="timDiaDiemNgauNhien()">🔍 Dò tìm địa điểm mới (1 tháng)</button>
          </div>
          ${dsDiaDiem
            .map(
              dd => `<div class="card-row">
                <div>
                  <b>${escapeHtml(dd.ten)}</b> <span class="badge">${iconTheoLoai[dd.loai] || dd.loai}</span>
                  <div class="muted">${escapeHtml(dd.moTa)} · Nguy hiểm: ${escapeHtml(dd.nguyHiem || 'Bình thường')}</div>
                </div>
                <div class="row-actions">${nutTheoLoai(dd)}</div>
              </div>`
            )
            .join('')}
        </div>`;
    }

    // Sub-tab 1: CỬA HÀNG (Phường thị / Tạp hóa tại địa điểm — Random đa dạng mặt hàng)
    else if (diaDiemSubTab === 'cua_hang') {
      const q = uiFilter.shopQuery.trim().toLowerCase();
      const tp = uiFilter.shopType;
      const shopTab = uiFilter.shopTab || 'mua';
      const maxCg = vung.coPhuongThi ? state.canhGioi + 1 : Math.min(2, state.canhGioi + 1);
      const kho = layKhoHangShop(vung, maxCg);
      const dsBanAll = layDanhSachIdBanTrongTui('');

      let tabBody = '';
      if (shopTab === 'ban') {
        const dsBanFiltered = layDanhSachIdBanTrongTui(q);
        for (const sid of [...shopSellSelected]) {
          if (soLuongVat(sid) <= 0) shopSellSelected.delete(sid);
        }
        const daChonHet = dsBanFiltered.length > 0 && dsBanFiltered.every(id => shopSellSelected.has(id));
        const selValid = [...shopSellSelected].filter(id => soLuongVat(id) > 0);
        const tongLtChon = selValid.reduce((sum, id) => {
          const vp = layVatPhamDef(id);
          return sum + giaBanVatPham(vp, id) * soLuongVat(id);
        }, 0);

        tabBody = `
          <div class="filter-bar">
            <input id="filter-shop" type="text" placeholder="Tìm vật phẩm trong túi để bán..." value="${escapeHtml(uiFilter.shopQuery)}" oninput="uiFilter.shopQuery=this.value; veCotPhai()" />
            <button class="btn btn-sm" onclick="chonTatCaBanDo()">${daChonHet ? '⬜ Bỏ chọn tất cả' : '☑️ Chọn tất cả'}</button>
            <button class="btn btn-sm" onclick="chonHaPhamBanDo()">☑️ Chọn Hạ phẩm</button>
            <button class="btn btn-sm btn-primary" onclick="banNhanhDaChon()" ${selValid.length > 0 ? '' : 'disabled'}>
              ⚡ Bán đồ nhanh (${selValid.length} loại · +${tongLtChon.toLocaleString()} LT)
            </button>
          </div>
          ${
            dsBanFiltered.length === 0
              ? '<div class="muted">Túi đồ không có vật phẩm phù hợp để bán.</div>'
              : dsBanFiltered
                  .map(id => {
                    const vp = layVatPhamDef(id);
                    const sl = soLuongVat(id);
                    const pc = layPhamChatVatPham(id);
                    const rankTen = layRankVatPham(vp);
                    const dangDeo = state.phapBao === id;
                    const checked = shopSellSelected.has(id);
                    const gia1 = giaBanVatPham(vp, id);
                    const giaHet = gia1 * sl;
                    return `<div class="card-row">
                      <div style="display:flex;gap:8px;align-items:flex-start;min-width:0">
                        <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleChonBanDo('${id}')" style="width:auto;margin-top:3px;cursor:pointer" />
                        <div>
                          <b>${vp.ten}</b> <span class="badge">${rankTen}</span> <span class="badge ${pc.cls}">${pc.ten}</span> <span class="hl-gold">x${sl}</span> ${dangDeo ? '<span class="hl-green">[Đang đeo]</span>' : ''}
                          <div class="hl-realm">${moTaVatPhamNgan(vp, id)}</div>
                          <div class="muted">${vp.moTa}</div>
                        </div>
                      </div>
                      <div class="row-actions">
                        <button class="btn btn-sm" onclick="banVatPham('${id}', 1)">Bán 1 (+${gia1.toLocaleString()} LT)</button>
                        ${sl > 1 ? `<button class="btn btn-sm btn-primary" onclick="banVatPham('${id}', ${sl})">Bán hết (+${giaHet.toLocaleString()} LT)</button>` : ''}
                      </div>
                    </div>`;
                  })
                  .join('')
          }`;
      } else {
        const cards = [];
        const matchVpType = loai => {
          if (tp === 'all') return true;
          if (tp === 'vat_lieu') return loai === 'yeu_dan' || loai === 'linh_vat';
          return loai === tp;
        };

        if (['all', 'dan', 'linh_thao', 'phap_bao', 'phu_luc', 'tru_vat', 'vat_lieu'].includes(tp)) {
          for (const v of kho.items) {
            if (!matchVpType(v.loai)) continue;
            if (q && !v.ten.toLowerCase().includes(q) && !(v.moTa || '').toLowerCase().includes(q)) continue;
            const sKey = v.shopKey || taoItemKey(v.id, v.pcKey || 'trung');
            const pc = layPhamChatVatPham(sKey);
            const rankTen = layRankVatPham(v);
            const giaHien = v.giaShop || Math.max(1, Math.round((v.gia || 0) * pc.heSo));
            cards.push(`<div class="card-row">
              <div><b>${v.ten}</b> <span class="badge">${rankTen}</span> <span class="badge ${pc.cls}">${pc.ten}</span> <span class="hl-gold">(${giaHien.toLocaleString()} LT)</span><div class="hl-realm">${moTaVatPhamNgan(v, sKey)}</div><div class="muted">${v.moTa}</div></div>
              <button class="btn btn-sm" onclick="muaVatPham('vat_pham', '${sKey}')">Mua</button>
            </div>`);
          }
        }
        if (tp === 'all' || tp === 'cong_phap') {
          for (const c of kho.congPhap) {
            if (state.congPhapDaHoc.includes(c.id)) continue;
            if (q && !c.ten.toLowerCase().includes(q) && !(c.moTa || '').toLowerCase().includes(q)) continue;
            cards.push(`<div class="card-row">
              <div><b>[${c.loai === 'BI_THUAT' ? 'Bí thuật' : 'Công pháp'}] ${c.ten}</b> <span class="badge">${layCanhGioiDef(c.canhGioi).ten}</span> <span class="hl-gold">(${(c.gia || 0).toLocaleString()} LT)</span><div class="hl-realm">${moTaCongPhapNgan(c)}</div><div class="muted">${c.moTa}</div></div>
              <button class="btn btn-sm btn-primary" onclick="muaVatPham('cong_phap', '${c.id}')">Lĩnh ngộ</button>
            </div>`);
          }
        }
        if (tp === 'all' || tp === 'dan_phuong') {
          for (const d of kho.danPhuong) {
            if (state.danPhuongDaHoc.includes(d.id)) continue;
            if (q && !d.ten.toLowerCase().includes(q)) continue;
            const giaDp = Math.max(150, Math.round(180 * Math.pow(2.4, d.canhGioi || 1)));
            cards.push(`<div class="card-row">
              <div><b>[Đan phương] ${d.ten}</b> <span class="hl-gold">(${giaDp.toLocaleString()} LT)</span><div class="muted">${d.moTa}</div></div>
              <button class="btn btn-sm" onclick="muaVatPham('dan_phuong', '${d.id}')">Mua phương</button>
            </div>`);
          }
        }

        tabBody = `
          <div class="filter-bar">
            <input id="filter-shop" type="text" placeholder="Tìm tên vật phẩm / công pháp..." value="${escapeHtml(uiFilter.shopQuery)}" oninput="uiFilter.shopQuery=this.value; veCotPhai()" />
            <select style="width:auto" onchange="uiFilter.shopType=this.value; veCotPhai()">
              <option value="all" ${tp === 'all' ? 'selected' : ''}>Tất cả (${kho.items.length + kho.congPhap.length + kho.danPhuong.length})</option>
              <option value="phap_bao" ${tp === 'phap_bao' ? 'selected' : ''}>Trang bị / Pháp bảo</option>
              <option value="dan" ${tp === 'dan' ? 'selected' : ''}>Đan dược</option>
              <option value="phu_luc" ${tp === 'phu_luc' ? 'selected' : ''}>Phù lục</option>
              <option value="tru_vat" ${tp === 'tru_vat' ? 'selected' : ''}>Túi / Nhẫn trữ vật</option>
              <option value="linh_thao" ${tp === 'linh_thao' ? 'selected' : ''}>Linh thảo</option>
              <option value="vat_lieu" ${tp === 'vat_lieu' ? 'selected' : ''}>Vật liệu / Yêu đan</option>
              <option value="cong_phap" ${tp === 'cong_phap' ? 'selected' : ''}>Công pháp / Bí thuật</option>
              <option value="dan_phuong" ${tp === 'dan_phuong' ? 'selected' : ''}>Đan phương</option>
            </select>
            <button class="btn btn-sm" onclick="lamMoiShopVung()">🔄 Đổi phiên hàng (10 LT)</button>
          </div>
          ${cards.length > 0 ? cards.join('') : '<div class="muted">Phiên chợ này chưa có mặt hàng phù hợp bộ lọc (thử bấm Đổi phiên hàng hoặc chọn Tất cả).</div>'}`;
      }

      bodyHtml = `
        <div class="sub-title">${vung.coPhuongThi ? `🏮 Vạn Bảo Lâu — ${vung.ten}` : `🏪 Tạp Hóa Du Phương — ${vung.ten}`} (Phiên chợ Năm ${state.nam} · Cảnh giới ≤ ${layCanhGioiDef(Math.min(9, maxCg)).ten})</div>
        ${vung.coPhuongThi ? '' : '<p class="muted" style="margin-top:0">Địa điểm này chưa có Phường Thị lớn — sạp hàng du phương số lượng ít hơn.</p>'}
        <div class="filter-bar">
          <button class="btn btn-sm ${shopTab === 'mua' ? 'btn-primary' : ''}" onclick="uiFilter.shopTab='mua'; veCotPhai()">🛍️ Mua Hàng</button>
          <button class="btn btn-sm ${shopTab === 'ban' ? 'btn-primary' : ''}" onclick="uiFilter.shopTab='ban'; veCotPhai()">💰 Quầy Thu Mua (${dsBanAll.length} loại)</button>
        </div>
        ${tabBody}`;
    }

    // Sub-tab 2: TÔNG MÔN / THẾ LỰC (Tác giả: Gemini (Antigravity))
    else if (diaDiemSubTab === 'tong_mon') {
      const tmState = state.tongMon ? damBaoDuLieuTongMon() : null;
      const curTm = tmState ? layTongMonDef(tmState.id) : null;
      const cv = tmState ? TONG_MON_CHUC_VI[tmState.capBac] || TONG_MON_CHUC_VI[0] : null;
      const nextCv = tmState && tmState.capBac + 1 < TONG_MON_CHUC_VI.length ? TONG_MON_CHUC_VI[tmState.capBac + 1] : null;
      const hcCurTm = curTm ? layHaoCamTheLuc(curTm.id) : 0;
      const q = uiFilter.tmQuery.trim().toLowerCase();
      const listTm = window.PN_DATA.tongMon
        .filter(t => (uiFilter.tmScope === 'vung' ? t.vungId === state.vungHienTai : true))
        .filter(t => !q || t.ten.toLowerCase().includes(q) || (t.phe || '').toLowerCase().includes(q));

      let suMonHtml = '';
      if (curTm && tmState) {
        const tmSub = uiFilter.tmSubTab || 'nhiem_vu';
        const namTichBong = Math.min(cv.tichToiDaNam, Math.max(0, (state.nam || 1) - (tmState.namBongLoc ?? state.nam)));
        let subContent = '';

        if (tmSub === 'nhiem_vu') {
          const dsNhan = tmState.viecNhan || [];
          const dsBang = tmState.bangViec || [];
          const don = tmState.donCuaTong;
          const coTrongTui = don ? soLuongVat(don.id) : 0;
          const kyConLai = TONG_MON_KY_NAM - ((Math.max(1, state.nam) - 1) % TONG_MON_KY_NAM);

          subContent = `
            <div class="sub-title" style="margin-top:8px">📌 Nhiệm Vụ Đang Nhận (${dsNhan.length}/${MAX_NHIEM_VU_TONG_MON})</div>
            ${
              dsNhan.length === 0
                ? '<div class="muted">Chưa nhận ngọc giản nhiệm vụ nào. Hãy chọn từ Bảng Ngọc Giản bên dưới.</div>'
                : dsNhan
                    .map(nv => {
                      const conNam = Math.max(0, nv.hetHanNam - state.nam);
                      return `<div class="card-row">
                        <div>
                          <b>${escapeHtml(nv.ten)}</b> <span class="badge">${layCanhGioiDef(nv.canhGioiDich).ten}</span>
                          <span class="badge">📍 ${escapeHtml(nv.vungTen)}</span>
                          <span class="badge ${conNam <= 1 ? 'hl-danger' : ''}">Hạn: Năm ${nv.hetHanNam} (còn ${conNam} năm)</span>
                          <div class="muted">Thưởng: +${nv.congHien} CH · +${nv.linhThach.toLocaleString()} LT · +4 Hảo cảm</div>
                        </div>
                        <div class="row-actions">
                          <button class="btn btn-sm btn-primary" onclick="thucHienNhiemVuTongMon('${nv.id}')">⚔️ Thực hiện</button>
                          <button class="btn btn-sm btn-danger" onclick="boNhiemVuTongMon('${nv.id}')">✖ Bỏ (-20% CH)</button>
                        </div>
                      </div>`;
                    })
                    .join('')
            }

            <div class="sub-title" style="margin-top:10px">📜 Bảng Ngọc Giản Tông Môn (Làm mới sau ${kyConLai} năm)</div>
            ${
              dsBang.length === 0
                ? '<div class="muted">Bảng ngọc giản kỳ này đã được nhận hết, chờ sang kỳ mới!</div>'
                : dsBang
                    .map(
                      nv => `<div class="card-row">
                        <div>
                          <b>${escapeHtml(nv.ten)}</b> <span class="badge">${layCanhGioiDef(nv.canhGioiDich).ten}</span>
                          <span class="badge">📍 ${escapeHtml(nv.vungTen)}</span>
                          <div class="muted">Hạn ${nv.hanNam} năm · Thưởng: +${nv.congHien} CH · +${nv.linhThach.toLocaleString()} LT</div>
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="nhanNhiemVuTongMon('${nv.id}')">📥 Nhận việc</button>
                      </div>`
                    )
                    .join('')
            }

            <div class="sub-title" style="margin-top:10px">🏯 Việc Thường Trực Trong Tông</div>
            <div class="card-row">
              <div>
                <b>🌾 Trấn thủ Linh Điền Sư Môn (12 tháng)</b>
                <div class="muted">Tu luyện x1.0 tại tông + Cống hiến; 45% đụng kẻ trộm linh thảo thưởng thêm CH.</div>
              </div>
              <button class="btn btn-sm btn-primary" onclick="lamViecThuongTrucTongMon('tran_thu_linh_dien')">Thực hiện</button>
            </div>
            ${
              tmState.capBac <= 1
                ? `<div class="card-row">
                    <div><b>🧹 Quét dọn Tàng Kinh Các (6 tháng)</b><div class="muted">+8 CH · 25% Tu vi năm · 35% ngộ tâm đắc (+1 Ngộ tính, mỗi 3 năm).</div></div>
                    <button class="btn btn-sm" onclick="lamViecThuongTrucTongMon('quet_tang_kinh_cac')">Làm (6T)</button>
                  </div>
                  <div class="card-row">
                    <div><b>🪣 Gánh nước Linh Tuyền (6 tháng)</b><div class="muted">+8 CH · 25% Tu vi năm · 35% tôi luyện (+1 Căn cốt, mỗi 3 năm).</div></div>
                    <button class="btn btn-sm" onclick="lamViecThuongTrucTongMon('ganh_nuoc_linh_tuyen')">Làm (6T)</button>
                  </div>
                  <div class="card-row">
                    <div><b>⚗️ Phụ việc Đan Phòng / Khí Đường (6 tháng)</b><div class="muted">+7 CH · 25% Tu vi năm · 55% được sư huynh thưởng đan dược/linh thảo.</div></div>
                    <button class="btn btn-sm" onclick="lamViecThuongTrucTongMon('phu_viec_dan_khi')">Làm (6T)</button>
                  </div>`
                : '<div class="muted" style="margin-top:4px">Từ Nội Môn trở lên không cần làm việc tạp dịch Ký danh/Ngoại môn.</div>'
            }

            ${
              don
                ? `<div class="sub-title" style="margin-top:10px">📦 Đơn Thu Mua Của Tông (Kỳ 3 năm)</div>
                  <div class="card-row">
                    <div>
                      <b>Cần nộp: ${escapeHtml(don.ten)} x${don.soLuong}</b> <span class="badge">Đang có: ${coTrongTui}/${don.soLuong}</span>
                      <div class="muted">Thưởng: +${don.congHien} Cống hiến, +3 Hảo cảm thế lực</div>
                    </div>
                    ${
                      tmState.donDaGiao
                        ? '<span class="hl-green">Đã hoàn thành kỳ này</span>'
                        : `<button class="btn btn-sm btn-primary" onclick="giaoDonCuaTong()" ${coTrongTui >= don.soLuong ? '' : 'disabled'}>Giao đơn (+${don.congHien} CH)</button>`
                    }
                  </div>`
                : ''
            }`;
        } else if (tmSub === 'chap_su') {
          const quyen1 = Math.max(100, Math.round(100 * Math.pow(2, state.canhGioi || 0)));
          const quyen2 = quyen1 * 3;
          const kq1 = tinhCongHienQuyenGop(quyen1);
          const kq2 = tinhCongHienQuyenGop(quyen2);
          subContent = `
            <div class="sub-title" style="margin-top:8px">🏛️ Chấp Sự Đường & Tấn Thăng</div>
            <div class="card-row" style="display:block">
              <div>Bổng lộc tích lũy: <b>${namTichBong} năm</b> (tối đa ${cv.tichToiDaNam} năm · +${cv.bongLoc.toLocaleString()} LT & +${cv.bongCh} CH/năm cơ bản)</div>
              <div class="muted" style="margin:4px 0">${
                nextCv
                  ? `Mốc kế tiếp <b>${nextCv.ten}</b>: cần Công tích ≥ ${nextCv.yeuCauCongHien} (đang có ${tmState.congTich}) & cảnh giới 【${layCanhGioiDef(nextCv.yeuCauCg).ten}】${tmState.capBac + 1 >= 2 ? ' + vượt Khảo hạch Lôi đài' : ''}.`
                  : 'Bạn đã đạt chức vị cao nhất trong tông môn!'
              }</div>
              <div class="row-actions" style="margin-top:8px">
                <button class="btn btn-sm btn-primary" onclick="nhanBongLocTongMon()" ${namTichBong > 0 ? '' : 'disabled'}>💎 Lĩnh bổng lộc (${namTichBong} năm)</button>
                ${nextCv ? `<button class="btn btn-sm" onclick="thangCapTongMon()">🎖️ ${tmState.capBac + 1 >= 2 ? 'Khảo hạch tấn thăng' : 'Tấn thăng chức vị'}</button>` : ''}
                <button class="btn btn-sm btn-danger" onclick="moModalRoiTongMon()">🚪 Bàn chuyện rời tông</button>
              </div>
            </div>

            <div class="sub-title" style="margin-top:10px">🏔️ Linh Mạch Sư Môn</div>
            <div class="card-row">
              <div>
                <b>Động tu luyện Linh Mạch (${cv.ten})</b>
                <div class="muted">${
                  tmState.capBac >= 1
                    ? `Hệ số linh khí sư môn x${(1 + cv.linhMachHeSo).toFixed(2)} · Phí ${cv.phiLinhMachNam} CH/năm · An toàn không gặp biến cố.`
                    : 'Cần đạt chức vị Đệ Tử Ngoại Môn trở lên mới mở khóa Linh Mạch Sư Môn.'
                }</div>
              </div>
              <div class="row-actions">
                <button class="btn btn-sm btn-primary" onclick="beQuanLinhMachTongMon(1)" ${tmState.capBac >= 1 ? '' : 'disabled'}>1 năm (${cv.phiLinhMachNam} CH)</button>
                <button class="btn btn-sm" onclick="beQuanLinhMachTongMon(3)" ${tmState.capBac >= 1 ? '' : 'disabled'}>3 năm (${cv.phiLinhMachNam * 3} CH)</button>
              </div>
            </div>

            <div class="sub-title" style="margin-top:10px">💠 Cúng Dường / Quyên Linh Thạch</div>
            <div class="card-row">
              <div>
                <b>Quyên Linh Thạch đổi Cống hiến</b>
                <div class="muted">Đã quyên năm ${state.nam}: ${(tmState.namQuyen === state.nam ? tmState.ltDaQuyenNam : 0).toLocaleString()} LT (Hiệu suất giảm 20% mỗi mốc ${kq1.block.toLocaleString()} LT/năm).</div>
              </div>
              <div class="row-actions">
                <button class="btn btn-sm" onclick="quyenLinhThachTongMon(${quyen1})">${quyen1.toLocaleString()} LT (+${kq1.ch} CH)</button>
                <button class="btn btn-sm" onclick="quyenLinhThachTongMon(${quyen2})">${quyen2.toLocaleString()} LT (+${kq2.ch} CH)</button>
              </div>
            </div>`;
        } else {
          const dsBaoKho = layDsBaoKhoVatTu();
          const giamChucViPct = Math.round((1 - (cv.giamGiaBaoKho || 1)) * 100);
          const discountTags = [
            giamChucViPct > 0 ? `Giảm ${giamChucViPct}% chức vị` : '',
            hcCurTm >= 50 ? 'Giảm 10% Khách khanh' : ''
          ].filter(Boolean);
          const discountNote = discountTags.length > 0 ? ` <span class="hl-green">(${discountTags.join(' + ')})</span>` : '';

          subContent = `
            ${
              (curTm.congPhapIds || []).length > 0
                ? `<div class="sub-title" style="margin-top:8px">📘 Tàng Kinh Các Trấn Phái${discountNote}</div>` +
                  curTm.congPhapIds
                    .map(cid => {
                      const cp = layCongPhapDef(cid);
                      const daHoc = state.congPhapDaHoc.includes(cid);
                      const phi = phiDoiBaoKhoTongMon(cp, curTm.id);
                      return `<div class="card-row">
                        <div><b>[${cp.loai === 'BI_THUAT' ? 'Bí thuật' : 'Công pháp'}] ${cp.ten}</b> <span class="badge">${layCanhGioiDef(cp.canhGioi).ten}</span><div class="hl-realm">${moTaCongPhapNgan(cp)}</div><div class="muted">${cp.moTa}</div></div>
                        ${daHoc ? '<span class="hl-green">Đã học</span>' : `<button class="btn btn-sm btn-primary" onclick="doiBaoKhoTongMon('${cid}')">Đổi (${phi} CH)</button>`}
                      </div>`;
                    })
                    .join('')
                : ''
            }
            <div class="sub-title" style="margin-top:10px">🏮 Bảo Khố Vật Tư${discountNote}</div>
            ${dsBaoKho
              .map(vp => {
                const phi = phiDoiVatTuBaoKho(vp, curTm.id);
                return `<div class="card-row">
                  <div><b>${escapeHtml(vp.ten)}</b> <span class="badge">${layCanhGioiDef(vp.canhGioi ?? 0).ten}</span><div class="muted">${escapeHtml(vp.moTa || '')}</div></div>
                  <button class="btn btn-sm btn-primary" onclick="doiVatTuBaoKho('${vp.id}')">Đổi (${phi} CH)</button>
                </div>`;
              })
              .join('')}`;
        }

        suMonHtml = `
          <div class="sub-section">
            <div class="sub-title">🏛️ Sư Môn Hiện Tại: ${curTm.ten} (${curTm.phe})</div>
            <div class="card-row" style="display:block">
              <div>Chức vị: <b class="hl-realm">${cv.ten}</b> · Cống hiến: <b class="hl-gold">${tmState.congHien}</b> · Công tích: <b>${tmState.congTich}</b>${nextCv ? `/${nextCv.yeuCauCongHien}` : ' (Tối đa)'} · Hảo cảm: <b>${capBacTheLuc(hcCurTm)} (${hcCurTm}/100)</b></div>
              <div class="muted" style="margin:4px 0">${curTm.moTa}</div>
              <div class="filter-bar" style="margin-top:8px;margin-bottom:0">
                <button class="btn btn-sm ${tmSub === 'nhiem_vu' ? 'btn-primary' : ''}" onclick="uiFilter.tmSubTab='nhiem_vu'; veCotPhai()">📜 Điện Nhiệm Vụ (${(tmState.viecNhan || []).length}/${MAX_NHIEM_VU_TONG_MON})</button>
                <button class="btn btn-sm ${tmSub === 'chap_su' ? 'btn-primary' : ''}" onclick="uiFilter.tmSubTab='chap_su'; veCotPhai()">🏛️ Chấp Sự & Linh Mạch</button>
                <button class="btn btn-sm ${tmSub === 'bao_kho' ? 'btn-primary' : ''}" onclick="uiFilter.tmSubTab='bao_kho'; veCotPhai()">📘 Tàng Kinh & Bảo Khố</button>
              </div>
            </div>
            ${subContent}
          </div>`;
      }

      bodyHtml = `
        ${suMonHtml}
        <div class="sub-title">🏯 Tông Môn & Thế Lực (${listTm.length})</div>
        <div class="filter-bar">
          <input id="filter-tm" type="text" placeholder="Tìm tên tông môn / phe..." value="${escapeHtml(uiFilter.tmQuery)}" oninput="uiFilter.tmQuery=this.value; veCotPhai()" />
          <button class="btn btn-sm ${uiFilter.tmScope === 'vung' ? 'btn-primary' : ''}" onclick="uiFilter.tmScope='vung'; veCotPhai()">Tại ${escapeHtml(vung.ten)} (${dsTmTaiVung.length})</button>
          <button class="btn btn-sm ${uiFilter.tmScope === 'all' ? 'btn-primary' : ''}" onclick="uiFilter.tmScope='all'; veCotPhai()">Tất cả (60)</button>
        </div>
        ${
          listTm.length === 0
            ? '<div class="muted">Không có Tông môn / Thế lực nào đóng tại địa điểm này. Bấm "Tất cả (60)" để xem toàn bộ.</div>'
            : listTm
                .slice(0, 45)
                .map(t => {
                  const hcTm = layHaoCamTheLuc(t.id);
                  const cungVungTm = t.vungId === state.vungHienTai;
                  return `<div class="card-row">
                    <div>
                      <b>${t.ten}</b> <span class="badge">${t.phe}</span> <span class="badge">${layVungDef(t.vungId).ten}</span>
                      <span class="badge">Hảo cảm: ${capBacTheLuc(hcTm)} (${hcTm})</span>
                      <div class="muted">Tối cao: ${layCanhGioiDef(t.canhGioiCaoNhat).ten} · ${t.moTa}</div>
                    </div>
                    <div class="row-actions">
                      ${
                        state.tongMon && state.tongMon.id === t.id
                          ? '<span class="hl-green">Đang ở</span>'
                          : `<button class="btn btn-sm btn-primary" onclick="giaNhapTongMon('${t.id}')">Bái nhập</button>`
                      }
                      <button class="btn btn-sm" onclick="tangQuaTheLuc('${t.id}')" ${cungVungTm ? '' : `disabled title="Cần tới ${escapeHtml(layVungDef(t.vungId).ten)} để dâng lễ"`}>🎁 Tặng lễ</button>
                    </div>
                  </div>`;
                })
                .join('')
        }`;
    }

    // Sub-tab 3: TẤT CẢ TU SĨ / NPC ĐANG CÓ MẶT TẠI ĐỊA ĐIỂM (CƯ TRÚ + DU LỊCH / DỪNG CHÂN)
    else {
      const q = uiFilter.nhaQuery.trim().toLowerCase();
      const nhaList = dsNpcTaiVung.filter(
        n => !q || n.ten.toLowerCase().includes(q) || (n.danhHieu || '').toLowerCase().includes(q)
      );
      bodyHtml = `
        <div class="sub-title">👥 Tu Sĩ Hiện Có Mặt Tại ${vung.ten} (${nhaList.length})</div>
        <div class="filter-bar">
          <input id="filter-nha" type="text" placeholder="Tìm tu sĩ / đạo hiệu..." value="${escapeHtml(uiFilter.nhaQuery)}" oninput="uiFilter.nhaQuery=this.value; veCotPhai()" />
          <button class="btn btn-sm btn-ai" onclick="gapNpcNgauNhien()">🔍 Thăm dò quanh đây</button>
        </div>
        ${
          nhaList.length === 0
            ? '<div class="muted">Hiện chưa có tu sĩ nào có mặt tại địa điểm này.</div>'
            : nhaList
                .slice(0, 45)
                .map(n => {
                  const coNhaTaiDay = !n.vungGocId || n.vungGocId === vung.id;
                  const trangThaiO = coNhaTaiDay
                    ? n.canhGioi >= 2
                      ? 'Động phủ tại đây'
                      : 'Cư trú tại đây'
                    : `Đang dừng chân (Gốc: ${layVungDef(n.vungGocId).ten})`;
                  return `<div class="card-row">
                    <div>
                      <b>${escapeHtml(n.ten)}</b> <span class="badge">${layCanhGioiDef(n.canhGioi).ten}</span> <span class="badge">${capBacQuanHe(n)} (${n.haoCam || 0})</span>
                      <div class="muted">${escapeHtml(n.danhHieu)} · ${escapeHtml(trangThaiO)} · Tuổi ${n.tuoi}/${n.thoNguyen}</div>
                    </div>
                    <div class="row-actions">
                      <button class="btn btn-sm" onclick="tangQuaNpc('${n.id}')">🎁 Quà</button>
                      <button class="btn btn-sm btn-primary" onclick="thamNhaNpc('${n.id}')">Chi tiết</button>
                    </div>
                  </div>`;
                })
                .join('')
        }`;
    }

    el.innerHTML = `
      <div class="sub-section">
        <div class="sub-title">📍 ${vung.ten} <span class="muted">(Linh khí x${vung.linhKhi})</span></div>
        <div class="filter-bar">
          <button class="btn btn-sm ${diaDiemSubTab === 'kham_pha' ? 'btn-primary' : ''}" onclick="chonDiaDiemSubTab('kham_pha')">🏞️ Khám Phá (${dsDiaDiem.length})</button>
          <button class="btn btn-sm ${diaDiemSubTab === 'cua_hang' ? 'btn-primary' : ''}" onclick="chonDiaDiemSubTab('cua_hang')">🏮 Cửa Hàng</button>
          <button class="btn btn-sm ${diaDiemSubTab === 'tong_mon' ? 'btn-primary' : ''}" onclick="chonDiaDiemSubTab('tong_mon')">🏛️ Tông Môn (${dsTmTaiVung.length})</button>
          <button class="btn btn-sm ${diaDiemSubTab === 'nha_npc' ? 'btn-primary' : ''}" onclick="chonDiaDiemSubTab('nha_npc')">👥 Tu Sĩ Tại Đây (${dsNpcTaiVung.length})</button>
        </div>
        ${bodyHtml}
      </div>`;
  }

  // TAB 4: QUAN HỆ (BẠN BÈ, KẺ THÙ, THẾ LỰC HẢO CẢM, TẤT CẢ NPC)
  else if (activeTab === 'npc') {
    const q = uiFilter.npcQuery.trim().toLowerCase();
    const tatCaNpc = Object.values(state.npcs);
    const soBanBe = tatCaNpc.filter(n => n.laDaoLuNguoiChoi || (n.haoCam || 0) >= 15).length;
    const soKeThu = tatCaNpc.filter(n => (n.haoCam || 0) < 0).length;
    const allTm = window.PN_DATA.tongMon || [];

    if (!['ban_be', 'ke_thu', 'the_luc', 'all'].includes(uiFilter.npcScope)) {
      uiFilter.npcScope = 'ban_be';
    }

    if (uiFilter.npcScope === 'the_luc') {
      const dsTheLuc = allTm
        .filter(t => !q || t.ten.toLowerCase().includes(q) || (t.phe || '').toLowerCase().includes(q) || layVungDef(t.vungId).ten.toLowerCase().includes(q))
        .slice()
        .sort((a, b) => {
          const ha = layHaoCamTheLuc(a.id);
          const hb = layHaoCamTheLuc(b.id);
          if (Math.abs(hb) !== Math.abs(ha)) return Math.abs(hb) - Math.abs(ha);
          const ca = a.vungId === state.vungHienTai ? 1 : 0;
          const cb = b.vungId === state.vungHienTai ? 1 : 0;
          return cb - ca;
        });

      el.innerHTML = `
        <div class="sub-section">
          <div class="sub-title">🤝 Quan Hệ Tu Tiên Giới</div>
          <div class="filter-bar">
            <input id="filter-npc" type="text" placeholder="Tìm tên tông môn / vùng / phe..." value="${escapeHtml(uiFilter.npcQuery)}" oninput="uiFilter.npcQuery=this.value; veCotPhai()" />
            <button class="btn btn-sm" onclick="uiFilter.npcScope='ban_be'; veCotPhai()">🤝 Bạn bè (${soBanBe})</button>
            <button class="btn btn-sm" onclick="uiFilter.npcScope='ke_thu'; veCotPhai()">⚔️ Kẻ thù (${soKeThu})</button>
            <button class="btn btn-sm btn-primary" onclick="uiFilter.npcScope='the_luc'; veCotPhai()">🏯 Thế lực (${allTm.length})</button>
            <button class="btn btn-sm" onclick="uiFilter.npcScope='all'; veCotPhai()">🌐 Tất cả (${tatCaNpc.length})</button>
          </div>
          <p class="muted" style="margin:4px 0 8px">Hảo cảm Thế lực (-100..+100): ≥ 50 (Khách khanh) giảm 10% phí cống hiến Tàng Kinh Các; ≤ -30 bị cự tuyệt bái nhập. Sát hại đệ tử tông môn giảm -25 hảo cảm.</p>
          ${
            dsTheLuc.length === 0
              ? '<div class="muted">Không có thế lực nào phù hợp bộ lọc.</div>'
              : dsTheLuc
                  .map(t => {
                    const hc = layHaoCamTheLuc(t.id);
                    const cap = capBacTheLuc(hc);
                    const cls = hc >= 15 ? 'hl-green' : hc <= -15 ? 'hl-danger' : '';
                    const cungVungTm = t.vungId === state.vungHienTai;
                    const laSuMon = state.tongMon && state.tongMon.id === t.id;
                    const phiLe = giaTangLeVatTheLuc(t);
                    return `<div class="card-row">
                      <div>
                        <b>${escapeHtml(t.ten)}</b> ${laSuMon ? '<span class="hl-green">[Sư môn]</span>' : ''} <span class="badge">${escapeHtml(t.phe)}</span> <span class="badge">${cungVungTm ? '📍 ' : ''}${escapeHtml(layVungDef(t.vungId).ten)}</span>
                        <div class="muted">Hảo cảm: <b class="${cls}">${cap} (${hc}/100)</b> · Tối cao: ${layCanhGioiDef(t.canhGioiCaoNhat).ten}</div>
                      </div>
                      <button class="btn btn-sm" onclick="tangQuaTheLuc('${t.id}')" ${cungVungTm ? '' : `disabled title="Cần tới ${escapeHtml(layVungDef(t.vungId).ten)} để dâng lễ"`}>
                        🎁 Dâng lễ (${phiLe.toLocaleString()} LT)
                      </button>
                    </div>`;
                  })
                  .join('')
          }
        </div>`;
    } else {
      let dsNpc = tatCaNpc;
      if (uiFilter.npcScope === 'ban_be') dsNpc = dsNpc.filter(n => n.laDaoLuNguoiChoi || (n.haoCam || 0) >= 15);
      else if (uiFilter.npcScope === 'ke_thu') dsNpc = dsNpc.filter(n => (n.haoCam || 0) < 0);
      if (q) dsNpc = dsNpc.filter(n => n.ten.toLowerCase().includes(q) || (n.danhHieu || '').toLowerCase().includes(q));

      if (dsNpc.length === 0) {
        selectedNpcId = null;
      } else if (!selectedNpcId || !dsNpc.some(n => n.id === selectedNpcId)) {
        selectedNpcId = dsNpc[0].id;
      }
      const npcChon = selectedNpcId ? state.npcs[selectedNpcId] : null;
      const sucKhoeText = n => (!n.conSong ? `☠️ Đã mất (${n.lyDoMat || 'Vẫn lạc'})` : n.thuongThe === 0 ? 'Khỏe mạnh' : n.thuongThe === 1 ? 'Thương nhẹ' : n.thuongThe === 2 ? 'Ám tật / Trọng thương' : 'Nguy kịch');
      const daoLuTen = npcChon
        ? npcChon.laDaoLuNguoiChoi
          ? `${state.ten} (Bạn)`
          : npcChon.daoLuId && state.npcs[npcChon.daoLuId]
          ? state.npcs[npcChon.daoLuId].ten
          : 'Chưa có'
        : '';
      const cungDiaDiem = npcChon ? npcChon.vungId === state.vungHienTai : false;
      const vungNpcChon = npcChon ? layVungDef(npcChon.vungId) : null;

      el.innerHTML = `
        <div class="sub-section">
          <div class="sub-title">🤝 Quan Hệ Tu Tiên Giới (${dsNpc.length})</div>
          <div class="filter-bar">
            <input id="filter-npc" type="text" placeholder="Tìm tên NPC..." value="${escapeHtml(uiFilter.npcQuery)}" oninput="uiFilter.npcQuery=this.value; veCotPhai()" />
            <button class="btn btn-sm ${uiFilter.npcScope === 'ban_be' ? 'btn-primary' : ''}" onclick="uiFilter.npcScope='ban_be'; veCotPhai()">🤝 Bạn bè (${soBanBe})</button>
            <button class="btn btn-sm ${uiFilter.npcScope === 'ke_thu' ? 'btn-primary' : ''}" onclick="uiFilter.npcScope='ke_thu'; veCotPhai()">⚔️ Kẻ thù (${soKeThu})</button>
            <button class="btn btn-sm" onclick="uiFilter.npcScope='the_luc'; veCotPhai()">🏯 Thế lực (${allTm.length})</button>
            <button class="btn btn-sm ${uiFilter.npcScope === 'all' ? 'btn-primary' : ''}" onclick="uiFilter.npcScope='all'; veCotPhai()">🌐 Tất cả (${tatCaNpc.length})</button>
            <button class="btn btn-sm btn-ai" onclick="gapNpcNgauNhien()">🔍 Gặp đạo hữu</button>
          </div>
          <div class="npc-selector">
            ${dsNpc
              .slice(0, 48)
              .map(
                n => `<button class="btn btn-sm ${n.id === selectedNpcId ? 'btn-primary' : ''}" onclick="chonNpc('${n.id}')">
                  ${escapeHtml(n.ten)} ${n.laDaoLuNguoiChoi ? '💞' : (n.haoCam || 0) >= 40 ? '🤝' : (n.haoCam || 0) < 0 ? '⚔️' : ''} ${n.vungId === state.vungHienTai ? '📍' : ''} ${!n.conSong ? '☠️' : ''}
                </button>`
              )
              .join('') || '<span class="muted">Chưa có nhân vật nào trong mục này. Hãy tới tab địa điểm hiện tại để gặp gỡ tu sĩ quanh vùng!</span>'}
          </div>
        </div>

        ${
          npcChon
            ? `<div class="sub-section">
                <div class="sub-title">${escapeHtml(npcChon.ten)} (${npcChon.gioiTinh === 'nu' ? 'Nữ' : 'Nam'}) — <span class="hl-realm">${tenCanhGioiDayDu(npcChon.canhGioi, npcChon.tieuCanh || 0)}</span></div>
                <div class="muted">${escapeHtml(npcChon.danhHieu)} · Tư chất: <b>${layTuChatNpc(npcChon.tuChat).ten}</b> · Hiện ở: <b>${escapeHtml(vungNpcChon.ten)}</b> ${cungDiaDiem ? '<span class="hl-green">(Cùng địa điểm)</span>' : '<span class="hl-danger">(Khác địa điểm)</span>'}</div>
                <div class="stat-row" style="margin-top:6px">
                  <span>Quan hệ với bạn: <b>${capBacQuanHe(npcChon)} (${npcChon.haoCam}/100)</b></span>
                  <span>Tuổi / Thọ: <b>${npcChon.tuoi || '?'} / ${npcChon.thoNguyen || '?'}</b></span>
                </div>
                <div class="stat-row">
                  <span>Tình trạng: <b>${sucKhoeText(npcChon)}</b></span>
                  <span>Linh thạch: <b>${(npcChon.linhThach || 0).toLocaleString()}</b></span>
                </div>
                <div class="stat-row">
                  <span>Đạo lữ: <b>${escapeHtml(daoLuTen)}</b></span>
                  <span>Quen / Bạn / Cừu: <b>${(npcChon.quenBiet || []).length} / ${(npcChon.banBe || []).length} / ${(npcChon.cuuNhan || []).length}</b></span>
                </div>
                <div class="muted" style="margin:4px 0">
                  ${
                    [
                      (npcChon.banBe || []).length > 0
                        ? `<b>Bạn tốt:</b> ${npcChon.banBe.slice(0, 5).map(id => state.npcs[id] ? `<a href="#" onclick="nhayToiNpc('${id}');return false" style="color:var(--green)">${escapeHtml(state.npcs[id].ten)}</a>` : '').filter(Boolean).join(', ')}`
                        : '',
                      (npcChon.quenBiet || []).length > 0
                        ? `<b>Quen biết:</b> ${npcChon.quenBiet.slice(0, 5).map(id => state.npcs[id] ? `<a href="#" onclick="nhayToiNpc('${id}');return false" style="color:var(--realm)">${escapeHtml(state.npcs[id].ten)}</a>` : '').filter(Boolean).join(', ')}`
                        : '',
                      (npcChon.cuuNhan || []).length > 0
                        ? `<b>Cừu nhân:</b> ${npcChon.cuuNhan.slice(0, 5).map(id => state.npcs[id] ? `<a href="#" onclick="nhayToiNpc('${id}');return false" style="color:var(--danger)">${escapeHtml(state.npcs[id].ten)}</a>` : '').filter(Boolean).join(', ')}`
                        : ''
                    ].filter(Boolean).join(' · ') || '<i>Chưa có mối quan hệ giang hồ nào.</i>'
                  }
                </div>
                <p class="muted" style="margin:6px 0"><b>Tính cách:</b> <span class="badge">${escapeHtml(layTinhCachNpcDef(npcChon.tinhCachLoai).ten)}</span> ${escapeHtml(npcChon.tinhCach)}</p>
                <div class="muted"><b>Mang theo:</b> ${(npcChon.tuiDo || []).map(id => (layVatPhamDef(id) || layCongPhapDef(id) || {}).ten || id).join(', ') || 'Trống'}</div>
                ${
                  npcChon.conSong
                    ? `${
                        cungDiaDiem
                          ? `<div class="row-actions" style="margin-top:10px">
                              <button class="btn btn-sm" onclick="tangQuaNpc('${npcChon.id}')">🎁 Tặng quà (+15 HC)</button>
                              <button class="btn btn-sm" onclick="luanDaoNpc('${npcChon.id}')">🍵 Luận đạo (3 tháng)</button>
                              ${!npcChon.laDaoLuNguoiChoi && (npcChon.haoCam || 0) >= 80 ? `<button class="btn btn-sm btn-primary" onclick="ketDaoLuNpc('${npcChon.id}')">💞 Kết Đạo Lữ</button>` : ''}
                              <button class="btn btn-sm btn-danger" onclick="danhCuopNpc('${npcChon.id}')">🗡️ Đánh cướp</button>
                            </div>`
                          : `<div class="muted hl-danger" style="margin-top:10px">⚠️ [${escapeHtml(npcChon.ten)}] đang ở 【${escapeHtml(vungNpcChon.ten)}】. Cần di chuyển tới đó để gặp mặt (Tặng quà, Luận đạo, Kết Đạo Lữ, Đánh cướp).</div>`
                      }
                      <div class="ai-chat-box">
                        <div class="sub-title">${cungDiaDiem ? '💬 Đối thoại & Biên niên' : '📜 Truyền âm phù & Biên niên'} ${escapeHtml(npcChon.ten)}</div>
                        <div class="npc-memory">${(npcChon.kyUc || []).slice(-6).map(k => `<div class="memory-line">• ${escapeHtml(k)}</div>`).join('') || '<div class="muted">Chưa có ghi chép nào.</div>'}</div>
                        <div class="chat-input-row">
                          <input id="input-chat-npc" type="text" placeholder="${cungDiaDiem ? 'Nhập lời nói...' : 'Gửi truyền âm...'}" onkeydown="if(event.key==='Enter') guiChatNpc('${npcChon.id}')" />
                          <button class="btn btn-sm btn-ai" onclick="guiChatNpc('${npcChon.id}')" ${aiBusy ? 'disabled' : ''}>${aiBusy ? '...' : 'Gửi'}</button>
                        </div>
                      </div>`
                    : `<div class="ai-chat-box"><div class="sub-title">🕯️ Biên niên trước khi vẫn lạc</div><div class="npc-memory">${(npcChon.kyUc || []).slice(-6).map(k => `<div class="memory-line">• ${escapeHtml(k)}</div>`).join('') || '<div class="muted">Không có ghi chép.</div>'}</div></div>`
                }
              </div>`
            : ''
        }`;
    }
  }

  // TAB 5: BẢN ĐỒ (40 VÙNG ĐẤT TỪ NHÂN GIỚI ĐẾN LINH GIỚI / MA GIỚI)
  else if (activeTab === 'ban_do') {
    const q = uiFilter.mapQuery.trim().toLowerCase();
    const dsVung = window.PN_DATA.vungDat.filter(v => !q || v.ten.toLowerCase().includes(q) || (v.moTa || '').toLowerCase().includes(q));
    el.innerHTML = `
      <div class="sub-section">
        <div class="sub-title">🗺️ Bản Đồ Tu Tiên Giới (${dsVung.length} vùng)</div>
        <div class="filter-bar">
          <input id="filter-map" type="text" placeholder="Tìm vùng đất (Việt Quốc, Loạn Tinh Hải, Linh Giới...)" value="${escapeHtml(uiFilter.mapQuery)}" oninput="uiFilter.mapQuery=this.value; veCotPhai()" />
        </div>
        ${dsVung
          .map(v => {
            const dangO = state.vungHienTai === v.id;
            return `<div class="card-row">
              <div>
                <b>${v.ten}</b> ${dangO ? '<span class="hl-green">[Đang ở đây]</span>' : ''}
                <div class="muted">Yêu cầu: ${layCanhGioiDef(v.canhGioiYeuCau).ten} · Linh khí: x${v.linhKhi}</div>
                <div class="muted">${v.moTa}</div>
              </div>
              ${dangO ? '' : `<button class="btn btn-sm btn-primary" onclick="diChuyenVung('${v.id}')">Đi tới (${tinhThangDiChuyen(v.id)} tháng)</button>`}
            </div>`;
          })
          .join('')}
      </div>`;
  }

  // TAB 6: TÚI ĐỒ, CÔNG PHÁP & BÍ THUẬT
  else if (activeTab === 'tui_do') {
    const q = uiFilter.bagQuery.trim().toLowerCase();
    const entries = Object.entries(state.tuiDo)
      .filter(([, sl]) => sl > 0)
      .filter(([id]) => {
        const vp = layVatPhamDef(id);
        return vp && (!q || vp.ten.toLowerCase().includes(q));
      });

    const curMaxO = state.tuiDoMaxO || 10;
    const usedO = soOTrongTui();
    const giaUpTui = giaNangCapTuiDo();

    el.innerHTML = `
      <div class="sub-section">
        <div class="sub-title">🎒 Túi Trữ Vật (${usedO}/${curMaxO} ô · Tối đa ${MAX_TUI_DO_O} ô)</div>
        <div class="filter-bar">
          <input id="filter-bag" type="text" placeholder="Lọc vật phẩm trong túi..." value="${escapeHtml(uiFilter.bagQuery)}" oninput="uiFilter.bagQuery=this.value; veCotPhai()" />
          ${
            curMaxO < MAX_TUI_DO_O
              ? `<button class="btn btn-sm btn-primary" onclick="nangCapTuiDo()">⬆️ Mở rộng +5 ô (${giaUpTui.toLocaleString()} LT)</button>`
              : `<span class="badge hl-green">Đã đạt tối đa 100 ô</span>`
          }
          <button class="btn btn-sm" onclick="chonTab('dia_diem'); uiFilter.shopTab='ban'; chonDiaDiemSubTab('cua_hang')">🏪 Vào Quầy Thu Mua</button>
        </div>
        ${
          entries.length === 0
            ? '<div class="muted">Không có vật phẩm nào.</div>'
            : entries
                .map(([id, sl]) => {
                  const vp = layVatPhamDef(id);
                  const pc = layPhamChatVatPham(id);
                  const rankTen = layRankVatPham(vp);
                  const dangDeo = state.phapBao === id;
                  const actBtn =
                    vp.loai === 'dan'
                      ? `<button class="btn btn-sm btn-primary" onclick="dungVatPham('${id}')">Phục dụng</button>`
                      : vp.loai === 'phap_bao'
                      ? `<button class="btn btn-sm btn-primary" onclick="dungVatPham('${id}')">${dangDeo ? 'Tháo' : 'Trang bị'}</button>`
                      : '';
                  return `<div class="card-row">
                    <div>
                      <b>${vp.ten}</b> <span class="badge">${rankTen}</span> <span class="badge ${pc.cls}">${pc.ten}</span> <span class="hl-gold">x${sl}</span> ${dangDeo ? '<span class="hl-green">[Đang đeo]</span>' : ''}
                      <div class="hl-realm">${moTaVatPhamNgan(vp, id)}</div>
                      <div class="muted">${vp.moTa}</div>
                    </div>
                    ${actBtn ? `<div class="row-actions">${actBtn}</div>` : ''}
                  </div>`;
                })
                .join('')
        }
      </div>

      <div class="sub-section">
        <div class="sub-title">📘 Công Pháp & Bí Thuật Đã Học (${state.congPhapDaHoc.length})</div>
        ${state.congPhapDaHoc
          .map(cid => {
            const cp = layCongPhapDef(cid);
            const isBt = cp.loai === 'BI_THUAT';
            const dangDung = isBt ? (state.biThuat || []).includes(cid) : state.congPhap === cid;
            return `<div class="card-row">
              <div>
                <b>[${isBt ? 'Bí thuật' : 'Chủ tu'}] ${cp.ten}</b> ${dangDung ? '<span class="hl-green">[Đang dùng]</span>' : ''}
                <div class="hl-realm">${moTaCongPhapNgan(cp)}</div>
                <div class="muted">${cp.moTa}</div>
              </div>
              <button class="btn btn-sm ${dangDung ? '' : 'btn-primary'}" onclick="trangBiCongPhapHoacBiThuat('${cid}')">
                ${isBt ? (dangDung ? 'Gỡ bỏ' : 'Gắn phụ') : dangDung ? 'Đang tu' : 'Chuyển công'}
              </button>
            </div>`;
          })
          .join('')}
      </div>`;
  }

  if (focusedId && focusedId.startsWith('filter-')) {
    const fEl = document.getElementById(focusedId);
    if (fEl) {
      fEl.focus();
      if (typeof selStart === 'number') fEl.setSelectionRange(selStart, selStart);
    }
  }
}

function chonNpc(id) {
  selectedNpcId = id;
  veGiaoDien();
}

function nhayToiNpc(id) {
  if (!state.npcs[id]) return;
  uiFilter.npcScope = 'all';
  uiFilter.npcQuery = '';
  selectedNpcId = id;
  activeTab = 'npc';
  veGiaoDien();
}

function guiChatNpc(npcId) {
  const inp = document.getElementById('input-chat-npc');
  if (!inp || !inp.value.trim()) return;
  chatVoiNpc(npcId, inp.value);
}

// ==========================================
// 11. MODAL AI, SAVE/LOAD & ROLL NHÂN VẬT
// ==========================================

function moModalAi() {
  document.getElementById('ai-provider').value = aiConfig.provider;
  document.getElementById('gemini-key').value = aiConfig.geminiKey;
  document.getElementById('gemini-model').value = aiConfig.geminiModel;
  document.getElementById('openai-key').value = aiConfig.openaiKey;
  document.getElementById('openai-url').value = aiConfig.openaiBaseUrl;
  document.getElementById('openai-model').value = aiConfig.openaiModel;
  document.getElementById('modal-ai').classList.add('open');
}

function dongModalAi() {
  document.getElementById('modal-ai').classList.remove('open');
}

function luuTuModalAi() {
  aiConfig.provider = document.getElementById('ai-provider').value;
  aiConfig.geminiKey = document.getElementById('gemini-key').value.trim();
  aiConfig.geminiModel = document.getElementById('gemini-model').value.trim() || 'gemini-2.5-flash';
  aiConfig.openaiKey = document.getElementById('openai-key').value.trim();
  aiConfig.openaiBaseUrl = document.getElementById('openai-url').value.trim() || 'https://openrouter.ai/api/v1';
  aiConfig.openaiModel = document.getElementById('openai-model').value.trim() || 'openai/gpt-4o-mini';
  luuCauHinhAI();
  dongModalAi();
  ghiNhatKy(`⚙️ Đã lưu cấu hình AI (${aiConfig.provider}).`, 'he_thong');
  veGiaoDien();
}

let rolledHePreview = [];
let rolledBuild = {
  linhCanId: '',
  theChatId: '',
  xuatThanId: ''
};

function rollTenNhanVat() {
  const gender = document.getElementById('new-gender').value || 'nam';
  document.getElementById('new-name').value = rollTenTheoGioiTinh(gender);
}

function rollTatCaNhanVat(giuTenVaGioiTinh = false) {
  if (!giuTenVaGioiTinh) {
    const gender = Math.random() < 0.3 ? 'nu' : 'nam';
    document.getElementById('new-gender').value = gender;
    rollTenNhanVat();
  }
  const roll = window.PN_DATA.roll || window.PN_DATA;
  const lcPick = pickWeighted(roll.linhCan || window.PN_DATA.linhCan);
  const tcPick = pickWeighted(roll.theChat || window.PN_DATA.theChat);
  const xtPick = pickWeighted(roll.xuatThan || window.PN_DATA.xuatThan);
  rolledBuild = {
    linhCanId: lcPick.id,
    theChatId: tcPick.id,
    xuatThanId: xtPick.id
  };
  rolledHePreview = rollHeLinhCan(lcPick);
  capNhatXemTruocRoll();
}

function capNhatXemTruocRoll() {
  if (!rolledBuild.linhCanId) {
    rollTatCaNhanVat(true);
    return;
  }
  const lc = layLinhCanDef(rolledBuild.linhCanId);
  const tc = layTheChatDef(rolledBuild.theChatId);
  const xt = layXuatThanDef(rolledBuild.xuatThanId);
  const cp = layCongPhapDef(xt.congPhap);
  const cgText = xt.canhGioi ? layCanhGioiDef(xt.canhGioi).ten + (xt.tieuCanh ? ` Tầng ${xt.tieuCanh + 1}` : '') : 'Phàm Nhân';
  const qhText = (xt.quanHeNpc || [])
    .map(q => {
      const npcBase = (window.PN_DATA.npcs || []).find(n => n.id === q.npcId);
      return `${npcBase ? npcBase.ten : q.npcId} (${q.haoCam >= 0 ? '+' + q.haoCam : q.haoCam})`;
    })
    .join(', ');

  document.getElementById('roll-preview').innerHTML = `
    <div><b>🌟 Linh căn:</b> <span class="hl-realm">${escapeHtml(lc.ten)} [${escapeHtml(tenHeLinhCanText(rolledHePreview))}]</span> (Tu luyện x${lc.heSoTuLuyen}, Đột phá ${lc.bonusDotPha >= 0 ? '+' : ''}${Math.round(lc.bonusDotPha * 100)}%)<div class="muted">${escapeHtml(lc.moTa)}</div></div>
    <div style="margin-top:6px"><b>🧬 Thể chất:</b> <b>${escapeHtml(tc.ten)}</b> <span class="badge">${escapeHtml(tc.pham || 'Phàm phẩm')}</span><div class="muted">${escapeHtml(tc.moTa)}</div></div>
    <div style="margin-top:6px"><b>📜 Xuất thân:</b> <b>${escapeHtml(xt.ten)}</b> (${escapeHtml(layVungDef(xt.vung).ten)} · ${cgText} · ${xt.tuVi || 0} Tu vi · ${xt.linhThach} LT)
      <div class="muted">${escapeHtml(xt.moTa)}</div>
      <div class="muted">Khởi đầu: Công pháp <b>${escapeHtml(cp.ten)}</b>${xt.tongMon ? ` · Tông môn <b>${escapeHtml(layTongMonDef(xt.tongMon.id).ten)}</b>` : ''}${qhText ? ` · Quan hệ NPC: <b>${escapeHtml(qhText)}</b>` : ''}</div>
    </div>
  `;
}

function moModalKiepMoi() {
  rollTatCaNhanVat(false);
  document.getElementById('modal-newgame').classList.add('open');
}

function dongModalKiepMoi() {
  document.getElementById('modal-newgame').classList.remove('open');
}

function xacNhanKiepMoi() {
  if (!rolledBuild.linhCanId) rollTatCaNhanVat(true);
  const opts = {
    ten: document.getElementById('new-name').value.trim(),
    gioiTinh: document.getElementById('new-gender').value,
    linhCanId: rolledBuild.linhCanId,
    linhCanHe: [...rolledHePreview],
    theChatId: rolledBuild.theChatId,
    xuatThanId: rolledBuild.xuatThanId
  };
  dongModalKiepMoi();
  taoKiepMoi(opts);
}

function xuatSaveFile() {
  if (!state) return;
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pntt-${state.ten}-nam${state.nam}.json`;
  a.click();
}

function nhapSaveFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (parsed && parsed.ten && typeof parsed.canhGioi === 'number') {
        state = parsed;
        luuGame();
        ghiNhatKy('📂 Đã tải ngọc giản lưu trữ thành công!', 'he_thong');
        veGiaoDien();
      }
    } catch (e) {
      alert('File save không hợp lệ!');
    }
  };
  reader.readAsText(file);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.addEventListener('DOMContentLoaded', () => {
  apDungTheme(localStorage.getItem(THEME_KEY) || 'dark');
  taiCauHinhAI();
  if (!taiGame()) {
    taoKiepMoi({});
    moModalKiepMoi();
  } else {
    veGiaoDien();
  }
});
