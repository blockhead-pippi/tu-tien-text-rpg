/* =====================================================================
   Tác giả: Gemini (Antigravity)
   map_data.js — NHÂN GIỚI · PHÀM NHÂN TU TIÊN
   Data địa danh canon (tên đúng truyện, bố cục bán canon tham khảo).
   Tọa độ chuẩn % (0–100) trên viewBox 1600×1000 → responsive mọi màn hình.
   gate: 0 Phàm · 1 Luyện Khí · 2 Trúc Cơ · 3 Kết Đan · 4 Nguyên Anh · 5 Hóa Thần
   ===================================================================== */
window.NK_MAP_DATA = {
  version: 1,
  canhGioi: ["Phàm Nhân", "Luyện Khí", "Trúc Cơ", "Kết Đan", "Nguyên Anh", "Hóa Thần"],
  tuViNgưỡng: [0, 80, 400, 1200, 3000, 6000],
  thoNguyen: [141, 200, 500, 1000, 2000, 4000],
  tocDo: [1, 2, 4, 7, 12, 20],

  regions: [
    { id: "r_dai_tan",   ten: "ĐẠI TẤN",            box: [8, 6, 40, 28],   label: [24, 11], gate: 3 },
    { id: "r_mo_lan",    ten: "MỘ LAN THẢO NGUYÊN", box: [10, 30, 38, 46], label: [24, 34], gate: 3 },
    { id: "r_thien_nam", ten: "THIÊN NAM",           box: [6, 48, 44, 94],  label: [17, 54], gate: 0 },
    { id: "r_ngoai_tinh",ten: "NGOẠI TINH HẢI",      box: [54, 10, 97, 92], label: [88, 13], gate: 4 },
    { id: "r_noi_tinh",  ten: "NỘI TINH HẢI",        box: [62, 38, 82, 70], label: [72, 40], gate: 3 }
  ],

  locations: [
    { id: "loc_thanh_nguu", ten: "Thanh Ngưu Trấn", vung: "r_thien_nam", vungId: "kinh_chau", x: 14, y: 84, loai: "trấn", danger: 0, lx: 0.5, gate: 0,
      moTa: "Trấn nhỏ nơi Hàn Lập sinh ra. Gà gáy chó sủa, phàm khí nồng đậm — khởi điểm của mọi đạo đồ." },
    { id: "loc_that_huyen", ten: "Thất Huyền Môn", vung: "r_thien_nam", vungId: "kinh_chau", x: 17, y: 79, loai: "tông môn", danger: 1, lx: 0.6, gate: 0,
      moTa: "Môn phái võ lâm thế tục của Kính Châu. Đây là nơi Hàn Lập bái nhập giang hồ, học Trảm Thiết Đao." },
    { id: "loc_than_thu", ten: "Thần Thủ Cốc", vung: "r_thien_nam", vungId: "kinh_chau", x: 19.5, y: 82, loai: "cốc", danger: 1, lx: 0.65, gate: 0,
      moTa: "Cốc của Mặc Đại Phu — danh y thế tục, tán tu đoạt xá. Linh khí mỏng nhưng bí mật thì dày." },
    { id: "loc_kinh_chau", ten: "Kính Châu Thành", vung: "r_thien_nam", vungId: "lam_chau", x: 22, y: 76, loai: "thành", danger: 1, lx: 0.65, gate: 0,
      moTa: "Châu thành cực nam Việt Quốc. Phường thị nhỏ, tán tu lui tới, linh khí x0.65." },
    { id: "loc_viet_quoc", ten: "Việt Quốc Kinh Thành", vung: "r_thien_nam", vungId: "viet_quoc", x: 24, y: 66, loai: "thành", danger: 1, lx: 0.7, gate: 1,
      moTa: "Hoàng đô Việt Quốc. Thất phái tu tiên ngầm thao túng triều đình, phàm nhân không hay biết." },
    { id: "loc_hoang_phong", ten: "Hoàng Phong Cốc", vung: "r_thien_nam", vungId: "thai_nhac_son_mach", x: 26, y: 70, loai: "tông môn", danger: 2, lx: 0.9, gate: 1,
      moTa: "Một trong thất phái Việt Quốc, nơi Hàn Lập trúc cơ. Linh mạch bậc trung, quy củ nghiêm ngặt." },
    { id: "loc_huyet_sac", ten: "Huyết Sắc Cấm Địa", vung: "r_thien_nam", vungId: "viet_quoc", x: 31, y: 74, loai: "cấm địa", danger: 3, lx: 1.2, gate: 2,
      moTa: "Cấm địa mở cửa theo chu kỳ, linh dược trúc cơ đan mọc giữa sát cơ. Bước vào là cược mạng." },
    { id: "loc_thien_nam_chien", ten: "Chính–Ma Chiến Trường", vung: "r_thien_nam", vungId: "khuong_quoc", x: 30, y: 58, loai: "chiến trường", danger: 3, lx: 1.0, gate: 2,
      moTa: "Ranh giới chính ma Thiên Nam. Ma đạo lục phái nam xâm, xác tu sĩ phơi đồng, bảo vật rơi vãi." },
    { id: "loc_linh_thu_son", ten: "Linh Thú Sơn", vung: "r_thien_nam", vungId: "viet_quoc", x: 35, y: 63, loai: "tông môn", danger: 2, lx: 0.95, gate: 2,
      moTa: "Tông môn ngự thú của Việt Quốc. Linh thú gầm trong sương, đệ tử mang huyết khế trên tay." },
    { id: "loc_thien_khuyet", ten: "Thiên Khuyết Bảo", vung: "r_thien_nam", vungId: "nguyen_vo_quoc", x: 38, y: 56, loai: "thành bảo", danger: 2, lx: 0.9, gate: 2,
      moTa: "Pháo lũy tu tiên chắn bắc Thiên Nam. Tường đá khắc phù văn, tán tu tụ tập đổi chác." },
    { id: "loc_hai_cang", ten: "Hải Cảng Thiên Nam", vung: "r_thien_nam", vungId: "gia_nguyen_thanh", x: 44, y: 70, loai: "cảng", danger: 1, lx: 0.8, gate: 2,
      moTa: "Cửa biển đông Thiên Nam. Thuyền buôn lẫn thuyền tu sĩ rời bến, hướng Loạn Tinh Hải." },
    { id: "loc_mo_lan_cua", ten: "Mộ Lan Quan Ải", vung: "r_mo_lan", vungId: "thien_nam_minh_ngoai", x: 28, y: 44, loai: "quan ải", danger: 3, lx: 0.8, gate: 3,
      moTa: "Ải quan chắn thảo nguyên. Pháp sĩ Mộ Lan từng tràn qua đây như châu chấu, máu nhuộm cát." },
    { id: "loc_mo_lan_thao", ten: "Mộ Lan Thảo Nguyên", vung: "r_mo_lan", vungId: "mo_lan_thao_nguyen", x: 24, y: 38, loai: "thảo nguyên", danger: 3, lx: 0.85, gate: 3,
      moTa: "Thảo nguyên vô tận của tộc Mộ Lan. Linh khí loãng hơn Trung Nguyên nhưng pháp thuật tự thành một hệ." },
    { id: "loc_mo_lan_vuong", ten: "Mộ Lan Vương Trướng", vung: "r_mo_lan", vungId: "mo_lan_thao_nguyen", x: 20, y: 33, loai: "vương trướng", danger: 4, lx: 1.1, gate: 3,
      moTa: "Kim trướng của Mộ Lan vương. Thánh vật tộc pháp sĩ tỏa ánh lam, cấm chế trùng trùng." },
    { id: "loc_tan_kinh", ten: "Tấn Kinh", vung: "r_dai_tan", vungId: "tan_kinh", x: 22, y: 18, loai: "đô thị", danger: 2, lx: 1.3, gate: 3,
      moTa: "Kinh đô Đại Tấn — trung tâm tu tiên phồn hoa nhất Nhân Giới. Nguyên Anh đi đầy đường, đừng gây sự." },
    { id: "loc_phuong_thi", ten: "Tấn Kinh Phường Thị", vung: "r_dai_tan", vungId: "dai_tan", x: 18, y: 24, loai: "phường thị", danger: 1, lx: 1.2, gate: 2,
      moTa: "Phường thị lớn nhất thiên hạ. Bảo vật bày như rau cải, linh thạch chảy như nước — nếu ngươi có mạng giữ." },
    { id: "loc_hoang_cung", ten: "Đại Tấn Hoàng Cung", vung: "r_dai_tan", vungId: "tan_kinh", x: 25, y: 22, loai: "cung điện", danger: 3, lx: 1.4, gate: 3,
      moTa: "Hoàng cung Đại Tấn, long mạch quấn điện. Hoàng tộc tu sĩ giữ cấm chế thượng cổ hộ quốc." },
    { id: "loc_khon_ngo", ten: "Khôn Ngô Sơn", vung: "r_dai_tan", vungId: "lieu_chau", x: 30, y: 14, loai: "cấm địa", danger: 4, lx: 1.5, gate: 4,
      moTa: "Núi cổ bị phong ấn vạn năm. Bảo vật thượng cổ chôn dưới cấm chế, Nguyên Anh vào cũng rụng răng." },
    { id: "loc_khon_ngo_tran", ten: "Khôn Ngô Trấn", vung: "r_dai_tan", vungId: "lieu_chau", x: 33, y: 20, loai: "trấn", danger: 2, lx: 1.2, gate: 4,
      moTa: "Trấn nhỏ dưới chân Khôn Ngô Sơn. Tán tu đào bảo thuê, ngày ngày nhặt xác đồng đạo." },
    { id: "loc_thanh_linh", ten: "Thanh Linh Đảo", vung: "r_noi_tinh", vungId: "khoi_tinh_dao", x: 66, y: 46, loai: "đảo", danger: 2, lx: 1.1, gate: 2,
      moTa: "Đảo linh mạch bậc trung Nội Tinh Hải. Tán tu kết đan ẩn cư, chợ đêm đổi yêu đan." },
    { id: "loc_thien_tinh", ten: "Thiên Tinh Thành", vung: "r_noi_tinh", vungId: "thien_tinh_thanh", x: 72, y: 52, loai: "đô thị", danger: 2, lx: 1.4, gate: 3,
      moTa: "Thành chủ đảo Nội Tinh Hải, Tinh Cung trị vì. Vạn tu sĩ hải ngoại tụ về, phồn hoa hơn Tấn Kinh một bậc hải vị." },
    { id: "loc_tinh_cung", ten: "Tinh Cung", vung: "r_noi_tinh", vungId: "thien_tinh_thanh", x: 74, y: 48, loai: "thánh cung", danger: 3, lx: 1.5, gate: 3,
      moTa: "Cung điện lơ lửng trên Thiên Tinh Thành. Tinh Cung song thánh tọa trấn, cấm chế sao trời phủ đảo." },
    { id: "loc_nghich_tinh", ten: "Nghịch Tinh Minh Tổng Đàn", vung: "r_noi_tinh", vungId: "loan_tinh_hai", x: 68, y: 60, loai: "tông môn", danger: 3, lx: 1.2, gate: 3,
      moTa: "Tổng đàn phản loạn chống Tinh Cung. Ma tu hải ngoại tụ nghĩa — hoặc tụ lợi, khó nói." },
    { id: "loc_hai_nguyen", ten: "Hải Nguyên Đảo", vung: "r_noi_tinh", vungId: "tieu_chinh_toan_dao", x: 70, y: 66, loai: "đảo", danger: 2, lx: 1.1, gate: 2,
      moTa: "Đảo nam Nội Tinh Hải, cửa ngõ ra Ngoại Tinh Hải. Thuyền săn yêu thú neo kín bến." },
    { id: "loc_hu_thien", ten: "Hư Thiên Điện", vung: "r_noi_tinh", vungId: "loan_tinh_hai", x: 78, y: 44, loai: "cấm địa", danger: 5, lx: 1.8, gate: 4,
      moTa: "Cung điện hư không trôi nổi, mở cửa theo chu kỳ trăm năm. Bảo vật thượng cổ và sát trận cùng tồn tại." },
    { id: "loc_vu_an", ten: "Vụ Ẩn Đảo", vung: "r_ngoai_tinh", vungId: "ngoai_tinh_hai", x: 60, y: 22, loai: "đảo", danger: 3, lx: 1.3, gate: 3,
      moTa: "Đảo sương mù bắc Ngoại Tinh Hải. Yêu thú ẩn trong vụ, tán tu săn đan lạc lối là chuyện thường." },
    { id: "loc_yeu_hai", ten: "Yêu Thú Hải Vực", vung: "r_ngoai_tinh", vungId: "ngoai_tinh_hai", x: 88, y: 30, loai: "hải vực", danger: 4, lx: 1.6, gate: 4,
      moTa: "Vực biển yêu thú hoành hành. Yêu đan kết trong bụng đại yêu, mạng tu sĩ treo đầu sóng." },
    { id: "loc_hoang_dao", ten: "Hoang Đảo", vung: "r_ngoai_tinh", vungId: "ngoai_tinh_hai", x: 90, y: 62, loai: "đảo hoang", danger: 4, lx: 1.5, gate: 4,
      moTa: "Đảo hoang đông hải, không luật pháp không tông môn. Bảo vật trôi dạt và xương tu sĩ cùng trắng cát." },
    { id: "loc_liet_diem", ten: "Liệt Diễm Đảo", vung: "r_ngoai_tinh", vungId: "ngoai_tinh_hai", x: 84, y: 78, loai: "đảo", danger: 4, lx: 1.6, gate: 4,
      moTa: "Đảo núi lửa nam hải. Địa hỏa luyện bảo bậc nhất, yêu thú hỏa hệ chiếm cứ miệng núi." },
    { id: "loc_truyen_tong", ten: "Truyền Tống Trận Thượng Cổ", vung: "r_ngoai_tinh", vungId: "bang_dao", x: 50, y: 50, loai: "cấm địa", danger: 5, lx: 2.0, gate: 5,
      moTa: "Đảo nhỏ giữa hải tâm, trận văn thượng cổ chỉ thẳng Linh Giới. Chỉ Hóa Thần mới chịu nổi trận áp — cửa phi thăng." }
  ],

  routes: [
    ["loc_thanh_nguu","loc_that_huyen"],["loc_that_huyen","loc_than_thu"],["loc_than_thu","loc_kinh_chau"],
    ["loc_kinh_chau","loc_hoang_phong"],["loc_hoang_phong","loc_huyet_sac"],["loc_kinh_chau","loc_viet_quoc"],
    ["loc_viet_quoc","loc_thien_nam_chien"],["loc_thien_nam_chien","loc_linh_thu_son"],["loc_linh_thu_son","loc_thien_khuyet"],
    ["loc_thien_khuyet","loc_mo_lan_cua"],["loc_mo_lan_cua","loc_mo_lan_thao"],["loc_mo_lan_thao","loc_mo_lan_vuong"],
    ["loc_mo_lan_vuong","loc_tan_kinh"],["loc_tan_kinh","loc_hoang_cung"],["loc_tan_kinh","loc_phuong_thi"],
    ["loc_hoang_cung","loc_khon_ngo"],["loc_khon_ngo","loc_khon_ngo_tran"],["loc_hoang_phong","loc_hai_cang"],
    ["loc_hai_cang","loc_thanh_linh"],["loc_thanh_linh","loc_thien_tinh"],["loc_thien_tinh","loc_tinh_cung"],
    ["loc_thien_tinh","loc_nghich_tinh"],["loc_tinh_cung","loc_hu_thien"],["loc_thien_tinh","loc_hai_nguyen"],
    ["loc_hai_nguyen","loc_liet_diem"],["loc_thien_tinh","loc_vu_an"],["loc_vu_an","loc_yeu_hai"],
    ["loc_yeu_hai","loc_hoang_dao"],["loc_hoang_dao","loc_liet_diem"],["loc_hu_thien","loc_truyen_tong"]
  ],

  /* Kỳ ngộ theo bậc nguy hiểm 0–5. e: lt linh thạch, tv tu vi, mo tháng, tho năm tổn thọ, item */
  encounters: [
    [ { t: "Nhặt được túi linh thạch rơi bên đường — kẻ đánh rơi chắc đã không còn.", e: { lt: 12 } },
      { t: "Lão nông tặng củ linh sâm trồng lẫn trong ruộng. Phàm vật nhiễm linh khí, hiếm gặp.", e: { tv: 10, item: "Linh Sâm" } } ],
    [ { t: "Tán tu trọng thương nhờ hộ tống về trấn, trả hậu tạ rồi tắt thở.", e: { lt: 25, tv: 15 } },
      { t: "Đêm trú miếu hoang, ngộ ra một thức tâm pháp tàn khuyết.", e: { tv: 25 } },
      { t: "Chó đen hoang dẫn đường tới ổ linh thử, đoạt được linh chi.", e: { tv: 18, item: "Linh Chi", lt: 8 } } ],
    [ { t: "Ma tu tập kích giữa đường! Phản sát đoạt túi trữ vật.", e: { lt: 45, tv: 60, tho: 2 } },
      { t: "Hái được linh dược phụ trúc cơ đan trong khe núi.", e: { tv: 70, item: "Linh Dược Trúc Cơ" } },
      { t: "Cướp tu sĩ chặn đường. Lựa chọn: đánh hay nhịn?", choices: [
          { label: "Xuất thủ phản sát", e: { lt: 70, tv: 90, tho: 4 } },
          { label: "Nhẫn nhịn giao linh thạch", e: { lt: -20, tv: 10 } } ] },
      { t: "Trận chiến chính–ma tàn cuộc, nhặt xác đoạt bảo.", e: { lt: 55, tv: 75, tho: 1 } } ],
    [ { t: "Pháp sĩ Mộ Lan truy sát qua thảo nguyên. Độn quang thoát thân trong gang tấc.", e: { tv: 110, tho: 5, lt: 30 } },
      { t: "Đấu giá phường thị: nhặt sót được công pháp tàn quyển.", e: { lt: -35, tv: 140, item: "Công Pháp Tàn Quyển" } },
      { t: "Yêu thú trọng thương chắn đường. Lấy yêu đan hay tránh?", choices: [
          { label: "Thu lấy yêu đan", e: { tv: 160, item: "Yêu Đan", tho: 6 } },
          { label: "Vòng đường tránh", e: { tv: 30, mo: 3 } } ] },
      { t: "Tinh Cung tuần tra tặng phù lục hộ thân cho tán tu an phận.", e: { tv: 90, item: "Phù Lục Hộ Thân" } } ],
    [ { t: "Cấm chế cổ phản phệ! Chịu thương đoạt được bảo vật thượng cổ.", e: { tv: 220, lt: 90, tho: 12, item: "Bảo Vật Thượng Cổ" } },
      { t: "Đại yêu truy sát mười vạn dặm. Đốt huyết độn quang thoát kiếp.", e: { tv: 180, tho: 15 } },
      { t: "Hư Thiên Điện hé cửa: bảo vật trôi ra theo hải lưu.", e: { tv: 260, lt: 120, item: "Hư Thiên Bảo Vật" } },
      { t: "Nguyên Anh lão quái nhìn trúng căn cốt, truyền một đạo tâm đắc.", e: { tv: 300 } } ],
    [ { t: "Trận áp thượng cổ nghiền kinh mạch. Lấy mạng đổi ngộ đạo.", e: { tv: 420, tho: 25 } },
      { t: "Hóa Thần thần thức quét qua — một ánh nhìn cũng là cơ duyên.", e: { tv: 500 } },
      { t: "Nghịch linh chi khí tẩy rửa nhục thân, thoát thai hoán cốt.", e: { tv: 460, tho: 10, item: "Nghịch Linh Chi" } },
      { t: "Bảo vật phi thăng hiện thế, quần tu tranh đoạt. Đoạt hay nhường?", choices: [
          { label: "Liều mạng tranh đoạt", e: { tv: 700, lt: 200, tho: 30, item: "Phi Thăng Bảo Vật" } },
          { label: "Ẩn nhẫn quan chiến ngộ đạo", e: { tv: 380 } } ] } ]
  ],

  /* Ánh xạ vật phẩm kỳ ngộ bản đồ sang vật phẩm thật trong PN_DATA.vatPham */
  itemMap: {
    "Linh Sâm": "thao_nhan_sam",
    "Linh Chi": "thao_phuc_linh",
    "Linh Dược Trúc Cơ": "thao_linh_chi_tram_nam",
    "Công Pháp Tàn Quyển": "phu_pha_chuong",
    "Yêu Đan": "yeu_dan_tam_cap",
    "Phù Lục Hộ Thân": "phu_nghi_binh",
    "Bảo Vật Thượng Cổ": "bao_luc_hop_kinh",
    "Hư Thiên Bảo Vật": "bao_can_lam_bang_chau",
    "Nghịch Linh Chi": "thao_nghich_linh_hoa",
    "Phi Thăng Bảo Vật": "bao_huyen_thien_tram_linh_kiem"
  },

  /* Mẫu nút sự kiện động xuất hiện trên bản đồ kiểu Vạn Kiếp Tu Tiên */
  dynamicNodes: [
    {
      kind: "ky_ngo",
      badge: "✦ Kỳ Ngộ",
      icon: "✦",
      tenPool: ["Di Tích Tán Tu", "Kỳ Nhân Dừng Chân", "Trạm Dịch Hoang", "Tàn Hồn Thức Tỉnh"],
      moTa: "Linh quang dị thường lóe lên nơi hoang dã, dường như có cơ duyên tán tu hoặc bảo vật thất lạc.",
      mo: 1,
      minDanger: 0
    },
    {
      kind: "yeu_thu",
      badge: "🐾 Yêu Thú",
      icon: "🐾",
      tenPool: ["Sào Huyệt Yêu Thú", "Linh Thú Lạc Bầy", "Hang Ổ Yêu Khí", "Huyết Sát Chi Lâm"],
      moTa: "Yêu khí cuồn cuộn quanh vùng, có thể tới trảm yêu đoạt đan hoặc âm thầm thu thập di vật.",
      mo: 1,
      minDanger: 1
    },
    {
      kind: "linh_mach",
      badge: "🌿 Linh Thảo",
      icon: "🌿",
      tenPool: ["Linh Dược Cốc", "Suối Linh Tuyền", "Thung Lũng Linh Thảo", "Rừng Trúc Tĩnh Tâm"],
      moTa: "Thiên địa linh khí hội tụ thành tuyền mạch, linh thảo lâu năm tỏa hương thoang thoảng.",
      mo: 1,
      minDanger: 0
    },
    {
      kind: "co_dong",
      badge: "⛩️ Cổ Động Phủ",
      icon: "⛩",
      tenPool: ["Cổ Tu Động Phủ Ẩn", "Bí Động Tàn Tích", "Thạch Thất Tiền Bối", "Cổ Trận Phong Ấn"],
      moTa: "Hộ phủ cấm chế cổ xưa vừa nứt một khe hở, ẩn chứa linh thạch, công pháp và nguy cơ sát trận.",
      mo: 2,
      minDanger: 1
    }
  ]
};