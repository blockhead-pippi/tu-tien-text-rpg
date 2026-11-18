# CHANGELOG:

## v1.1.0 — "QoL + Tempo + Discoverability"

### 1) Sửa lỗi & trải nghiệm (QoL)
- **Favicon**: thêm icon SVG inline → hết lỗi console `favicon.ico 404`.
- **Nhãn bế quan chính xác hơn**: hiển thị `≈ TV` (trước đây ghi `+40 TV` nhưng thực nhận 37–41 do linh khí/ngộ tính), kèm tooltip giải thích dao động ±8%.
- **Tooltip tỉ lệ đột phá**: rê chuột lên nút *Xung kích Đại Cảnh Giới* để xem chi tiết: Nền · Linh căn · Thể chất · Công pháp · Khí vận/Thần thức · Đan hỗ trợ.
- **Định dạng số thống nhất** `1.516` (vi-VN) ở thanh tu vi, chiến lợi phẩm bản đồ.
- **Modal a11y**: hộp thoại tạo nhân vật có `role="dialog"`, `aria-modal`, tiêu đề `aria-labelledby`; **ESC** đóng hộp thoại tạo nhân vật/hướng dẫn.
- **Nút không còn "kẹt"**: nút *Đang tu* ở công pháp hiện tại chuyển sang trạng thái `disabled` + tooltip.
- **Khai lò Đan Phòng**: tự khoá khi thiếu nguyên liệu/không ở Động Phủ, hiện `🔒 Thiếu NL` + tooltip liệt kê nguyên liệu thiếu.
- **Bí cảnh khoá theo cảnh giới**: nút bí cảnh ngoài phạm vi cảnh giới bị `disabled` kèm lý do (`🔒 Yêu cầu ...`).
- **Toast thông báo** (góc phải dưới, phía trên nút Bản Đồ): mua/bán, offline, treo máy, cảnh báo túi đầy, lỗi thao tác.

### 2) Nhịp độ (Tempo)
- **Treo máy tự bế quan**: nút *⏳ Treo máy* — mỗi 6 giây = 1 năm bế quan; tự dừng khi đủ Tu vi, gặp sự kiện/chiến đấu, hoặc kiếp kết thúc.
- **Tiến độ offline**: khi mở lại game sau ≥10 phút, tự tính bế quan offline (tối đa 12 giờ → 4 năm game, hiệu suất 60%), ghi biên niên sử + toast.
- **Lưu mốc thời gian**: `state.tsLuu` được ghi mỗi lần lưu để tính offline chính xác.
- **Cân bằng Trúc Cơ**: `tuViCan` bậc Trúc Cơ Sơ Kỳ **4.500 → 3.200** (giảm "sốc" sau Luyện Khí Đại Viên Mãn). *Bản gốc được sao lưu tại `data.js.bak_v11`.*
- **Phím tắt**: `M` bản đồ (có sẵn), **Space** = bế quan 1 năm, **B** = đột phá, **Esc** = đóng hộp thoại.

### 3) Khám phá hệ thống (Discoverability)
- **Nút ❓ Hướng dẫn** trên thanh tiêu đề: checklist 9 mốc tu tiên (Động Phủ, Linh Điền, Pháp bảo, Bí thuật, Công pháp theo cảnh giới, Luyện đan, Tông môn, Bản đồ, Đột phá) — mục nào xong được đánh dấu ✅, mục chưa xong có nút mở thẳng tab tương ứng.
- **Dòng gợi ý ngữ cảnh** ngay dưới nút hành động: cảnh báo chưa có pháp bảo / công pháp lỗi thời / thiếu bí thuật / túi gần đầy / đủ tu vi nhưng thiếu đan đột phá / chưa nhập tông môn.
- **Công pháp "Lỗi thời"**: hiện cảnh báo ngay trong Đạo Tịch + gợi ý **tên công pháp cùng cảnh giới đang bán** (ví dụ Trúc Cơ: Đoạt Nguyên Ma Kinh 1.100 LT, Vạn Mộc Trường Sinh Quyết 900 LT…).
- **Cửa hàng thông minh hơn**:
  - Hàng được chọn theo **trọng số**: ưu tiên món đúng cảnh giới + vừa túi tiền.
  - **Luôn có ít nhất 1 pháp bảo rẻ** để người mới trang bị được (Trảm Thiết Đao 50 LT, Thanh Tật Kiếm 95 LT…).
  - Khi ở **đỉnh đại cảnh giới**, chợ chắc chắn có **đan hỗ trợ đột phá**.
  - Ưu tiên bày **bí thuật** khi người chơi còn slot trống (0/3).
  - Nhãn `Phù hợp cảnh giới` trên món đồ tương ứng.
- **Mua số lượng**: mỗi món tiêu hao có thêm nút **Mua 5** (tự giới hạn theo Linh thạch + số ô túi; thông báo rõ số lượng thực mua).

### 4) Cân bằng chiến đấu
- **Quái scale theo cảnh giới người chơi**: khi người chơi vượt cảnh giới quái, HP ×(1+0,65/đại cảnh giới) tối đa ×3,4; Công ×(1+0,32) tối đa ×2,4; Thủ tương tự. Hết cảnh "boss Phàm Nhân 78 HP" xuất hiện trước tu sĩ Trúc Cơ.

### 5) Sửa lỗi dữ liệu
- **Hảo cảm tiền định**: xuất thân cam kết `+HC` (ví dụ Mặc Đại Phu +20) trước đây bị suy giảm ngay từ năm 2 → giờ **giữ nguyên cho tới lần tương tác đầu tiên**, sau đó mới phai theo thời gian.
- **Túi đầy**: đồ rẻ (giá bán ≤ 25 LT) được **tự động bán** để nhường chỗ, ghi log + toast; đồ giá trị vẫn chặn kèm thông báo rõ (tránh mất loot quý mà không hiểu lý do).

### 6) Giao diện bản đồ
- **Sương mù mềm hơn**: giảm opacity 0,88 → 0,74, thêm blur 1,3px và nhịp thở chậm hơn → bớt cảm giác "khối đen chữ nhật".

---

## v1.1.1 — Hotfix sau playtest Trúc Cơ → Kết Đan

### Đã sửa
1. **Tooltip đột phá gây hiểu nhầm**: nút *Đột phá Tiểu Cảnh Giới* từng hiển thị % (vd 43%) dù tiểu cảnh giới luôn thành công → nay ghi rõ “chắc chắn thành công (1 tháng)”.
2. **Chợ “bế tắc” công pháp**: khi slot Bí thuật còn trống, trọng số chợ luôn chọn Bí thuật → không bao giờ bày bán công pháp TU_LUYEN cùng cảnh giới để thay công pháp lỗi thời. Nay: **luôn bảo đảm 1 TU_LUYEN đúng cảnh giới** trong phiên chợ, giảm ưu tiên Bí thuật.
3. **Chợ lệch cảnh giới**: `maxCg = cảnh giới + 1` khiến tu sĩ Kết Đan chỉ thấy đồ **Nguyên Anh** giá 8.300–60.000 LT (không có đồ Kết Đan). Nay trọng số & bảo đảm dùng **cgMuc = min(cảnh giới người chơi, maxCg)** → hiện đúng công pháp/đan Kết Đan (3.000–8.000 LT).
4. **Header chợ** ghi “Cảnh giới ≤ X” dễ hiểu nhầm → nay ghi “Hàng phù hợp 【cảnh giới hiện tại】” + cảnh báo “có bày hàng vượt cấp” khi có.
5. **Badge “⚠️ Vượt cấp”** cho vật phẩm cao hơn cảnh giới người chơi (kèm tooltip cảnh giới cần đạt).

### Ghi nhận từ playtest (chưa sửa — đề xuất v1.2)
- **Mua khi túi đầy**: giao dịch bị chặn nhưng nút vẫn bấm được, chỉ báo qua log/toast → nên `disabled` + tooltip “Túi đầy”.
- **Đan đột phá không tính Dược kháng**: `dotPha()` trừ đan trực tiếp, không gọi `ghiNhanDungDan`.
- **Khai thác đổi công pháp**: chuyển sang công pháp có “Đột phá +%” ngay trước khi xung kích đại cảnh giới là miễn phí/tức thời → có thể tăng 8% tỉ lệ tùy ý. Đề xuất: đổi công pháp tốn thời gian/tu vi, hoặc chỉ tính bonus của công pháp đã tu luyện đủ lâu.
- **Biến cố lộ trình scale lệch**: phần thưởng scale theo cảnh giới (~×12 ở Kết Đan: +8.748 LT từ 1 biến cố) nhưng chi phí (899 LT) không scale → kinh tế “được mùa”.
- **Thiếu chỉ dẫn vùng**: sau Kết Đan, gợi ý mua công pháp nhưng không nói phải tới **phường thị/vùng linh khí cao**; không có bộ lọc “bí cảnh phù hợp cảnh giới” trên bản đồ.
- **Túi đầy lặp lại**: nhiều loại loot, ngưỡng auto-bán ≤25 LT quá thấp; thiếu kho/ngân hàng đồ và thiếu bán theo nhóm phẩm chất (chỉ có “Chọn Hạ phẩm”).
- **Không có hộp xác nhận** trước khi Xung kích Đại Cảnh Giới (35–68%) — một cú click nhầm mất hàng chục nghìn TV.
- **RNG phẩm chất đan**: 5 lần liên tiếp Trúc Cơ Đan ra Hạ phẩm (≈1,3% xác suất) → nên bảo đảm phẩm tối thiểu cho đan đột phá hoặc công bố tỉ lệ.

### Kết quả playtest đợt 2 (save hiện tại)
- Trúc Cơ Sơ Kỳ (2.978/3.200) → **Kết Đan Sơ Kỳ** ở tuổi **181**, thọ **590**.
- Thất bại Kết Đan lần 1 tại **64%** (mất 12.031 TV, rơi Hậu Kỳ, thương nhẹ) → hồi phục, cày lại, lần 2 thành công tại **68%**
  (Thanh Mộc Quyết +2% · Trúc Cơ Đan Trung phẩm +25% · nền 25% · thể chất +6% · khí vận/thần thức +12% · linh căn −2%).
- Di chuyển Kính Châu → **Liêu Châu** (LK ×2.2): tốc độ tu luyện 656 → **1.506**/năm; mua **Đan Hà Bất Diệt Kinh** (4.000 LT) → **5.098 TV/năm**.
- Mua & gắn **Đại Bi Chú** (Bí thuật 1/3), dùng chiêu “Từ Âm Phổ Tế” trong Đấu Pháp: hồi HP + hồi xuân 2 lượt, tốn 1.275 LL, CD 2h — hoạt động đúng.
- Săn yêu thú Kết Đan: địch 3.216 HP/449 ATK, thắng nhận +983 LT, +313 TV (scale hợp lý so với Trúc Cơ ~307 LT).

---

## v1.2.0 — "Fix bug + Tính năng từ playtest Trúc Cơ → Kết Đan"

### Sửa lỗi
1. **Mua khi túi đầy**: nút Mua 1 / Mua 5 bị `disabled` + tooltip “Túi trữ vật đã đầy…” (trước chỉ báo sau khi bấm).
2. **Đan đột phá & Dược kháng**: `dotPha()` giờ gọi `ghiNhanDungDan()` khi tự dùng đan → Dược kháng được ghi nhận đúng.
3. **Khai thác đổi công pháp**: chuyển chủ công pháp tốn **3 tháng chuyển hóa công lực**; **Đột phá +% của công pháp chỉ phát huy 0% → 50% → 100%** theo thâm niên (≥2 năm / ≥5 năm). Không còn kiểu đổi công pháp ngay trước đột phá để ăn +8%.
4. **“Được mùa” Linh thạch từ biến cố**: thưởng Linh thạch scale tối đa **×4** so với giá trị gốc (trước ×~12 ở Kết Đan).
5. **Đan hỗ trợ đột phá tối thiểu Trung phẩm** khi xuất hiện trong chợ (tránh chuỗi xui Hạ phẩm liên tiếp).

### Tính năng mới
6. **Hộp xác nhận Xung kích Đại Cảnh Giới**: hiện cảnh giới hiện tại → mục tiêu, Tu vi, tỉ lệ %, đan hỗ trợ, thâm niên công pháp, cảnh báo hậu quả thất bại (rơi tiểu cảnh, mất 65–75% TV, thương thế, nguy cơ Tẩu hỏa nhập ma). Có nút Hủy / Ta đã quyết; **ESC** để đóng.
7. **Kho Động Phủ (stash)**:
   - Khi túi đầy, **linh thảo / vật liệu / yêu đan / phù lục tự động vào kho** (không mất loot).
   - Tab Động Phủ có mục Kho: “Gửi hết nguyên liệu trong túi”, “Lấy hết kho ra túi”, “Lấy 1/Lấy hết” từng món.
8. **Bán theo nhóm**: thêm **Chọn Trung phẩm** và **Chọn nguyên liệu thừa** (tự loại trừ nguyên liệu cần cho các đan phương đã học) — dọn túi nhanh, an toàn.
9. **Gợi ý vùng phù hợp cảnh giới**: nếu vùng hiện tại không có phường thị/chợ cấp cảnh giới, game gợi ý vùng phường thị tốt nhất (linh khí cao nhất, yêu cầu cảnh giới phù hợp) trong dòng gợi ý, Hướng dẫn và toast.
10. **Bản đồ**: thêm bộ lọc **“Chỉ vùng phù hợp cảnh giới”** và **“Chỉ vùng có Phường Thị”** (39 → 14 vùng khi lọc ở Kết Đan).

### Đã test trực tiếp
- Hộp xác nhận đột phá: mở đúng ở Đại Viên Mãn, hiện 41%/thâm niên/hậu quả; bấm **Hủy** không đột phá, Tu vi giữ nguyên.
- Thâm niên: cùng công pháp +19% khi đủ thâm niên → **0% (chưa đủ)** khi vừa đổi.
- Cap thưởng: hiệu ứng 719 LT ở Kết Đan nhận **2.876 LT** (đúng ×4).
- Kho: 20/20 ô → gửi 16 loại → túi 4/20; lấy lại đủ 20/20, kho trống.
- Chọn nguyên liệu thừa: chọn 15 loại ≈ **1.415 LT** (không đụng nguyên liệu đan phương).
- Lọc bản đồ: 39 → **14 vùng** phù hợp cảnh giới Kết Đan.
- Mua khi túi đầy: 8/8 nút hiển thị `disabled` + tooltip đúng.
- Đan đột phá trong chợ: **Trung phẩm** (Giáng Trần Đan 4.000 LT) thay vì Hạ phẩm.
- `node --check` pass; console **0 error**.

---

## v1.3.0 — "Đấu giá · Bản mệnh pháp bảo · Tâm ma · Bí cảnh phù hợp"

### Tính năng mới
1. **🎪 Đấu Giá Phường Thị** (chỉ ở vùng có Phường Thị):
   - Mỗi năm 1 phiên, 4 món (2 món vừa túi tiền + 2 món cao cấp), giá khởi điểm 50–80% giá trị.
   - Trả giá +8%/lượt; **NPC có thể trả cao hơn** (55% khi giá còn rẻ, 22% khi đã cao), tối đa 6 lượt/món.
   - **Chốt phiên** để trả tiền & nhận món; nếu túi đầy vật phẩm tự vào Kho Động Phủ.
   - Trạng thái “Bạn/Người khác dẫn giá”, giá tham khảo, cảnh báo thiếu Linh thạch.
2. **🔆 Bản Mệnh Pháp Bảo (Đan Hỏa)** (yêu cầu Kết Đan):
   - Tế luyện pháp bảo đang trang bị thành bản mệnh: **500 LT · 6 tháng**.
   - Tôi luyện tối đa **5 cấp**, mỗi cấp **+8% uy lực pháp bảo**, giá `800 × (cấp+1) LT · 6 tháng`.
   - Bonus áp dụng trực tiếp vào Công/Thủ (đã test: 1.712→1.718 ATK, 638→640 DEF ở cấp 1 với Thanh Tật Kiếm).
3. **🌑 Tâm Ma khi bế quan** (Kết Đan trở lên, 10%/năm, tối đa 1 lần/năm):
   - **Thủ tâm như thành**: kiểm định Ngộ tính + Thần thức (tỉ lệ 15–92%) → thành công +1 Ngộ tính & +5% dược lực đột phá; thất bại mất 20% HP + thương thế.
   - **Lấy sát phá ma**: +2 năm tốc độ tu luyện Tu vi, mất 30% HP, 45% bị thương.
   - **Xuất quan tĩnh dưỡng**: hồi 15% HP, tốn 1 tháng.
   - Tự động dừng treo máy khi Tâm ma xuất hiện.
4. **🌌 Bí Cảnh Phù Hợp Cảnh Giới** (tab Bản Đồ):
   - Liệt kê tối đa 8 bí cảnh có phạm vi cảnh giới bao gồm cảnh giới hiện tại, kèm vùng (Linh khí), phí, thời gian, chu kỳ.
   - Nút **Đi tới (X tháng)** nếu khác vùng; nút **Vào bí cảnh** khi đang ở đúng vùng (nếu sai vùng thì khoá kèm tooltip).

### Sửa lỗi / tinh chỉnh
5. Modal (tạo nhân vật, hướng dẫn, xác nhận đột phá, tâm ma) nâng **z-index 9600** — không còn bị nút “Bản Đồ Nhân Giới” (z 9000) đè lên.
6. Đấu giá **ưu tiên sinh món vừa túi tiền** để phiên không bị “toàn món không mua nổi”.
7. Save migration: tự thêm `banMenh`, `tamMaNam`, `dauGia` cho save cũ (không mất dữ liệu).

### Đã test trực tiếp trên save Kết Đan Sơ Kỳ
- Đấu giá: 4 món (322/96/4.705/159 LT) → đặt giá 104 LT thắng **Phá Chướng Phù**, LT 3.050→2.946, túi đầy nên vật phẩm tự vào Kho ✓.
- Bản mệnh: tế luyện (500 LT, 6 tháng) → cấp 1 (800 LT, 6 tháng) → hệ số **1.08**, ATK/DEF tăng tương ứng ✓.
- Tâm ma: modal hiển thị 3 lựa chọn; chọn “Thủ tâm” kiểm định **92% → thành công** (+1 Ngộ tính, +5% đột phá) ✓ (đã hoàn nguyên chỉ số do test cưỡng bức).
- Bí cảnh phù hợp: 7 mục, có Hư Thiên Điện (Kết Đan–Nguyên Anh · Thiên Tinh Thành LK x2.4) ✓.
- `node --check` pass; console **0 error**.
- File thêm: `update_v1_1.js` (nạp sau `game.js`; toàn bộ logic mới nằm ở đây, không phá lõi cũ).
- File sửa: `index.html`, `game.js`, `map.js`, `map_skin.css`, `data.js` (1 giá trị cân bằng).
- Sao lưu: `data.js.bak_v11`.
- Kiểm tra cú pháp: `node --check` pass cho `game.js`, `update_v1_1.js`, `map.js`.
- Đã test trực tiếp trên trình duyệt: tạo nhân vật mới, guide modal, ESC, mua/bán, Mua 5, trang bị pháp bảo, treo máy, offline (giả lập 2 giờ), scale quái, toast, hảo cảm khởi đầu giữ nguyên sau 1 năm.
- Chưa làm trong v1.1 (đề xuất v1.2+): luyện khí/pháp bảo crafting, đấu giá/phường thị, sư đồ–đạo lữ nâng cao, thiên kiếp/tâm ma, luân hồi đa kiếp, thống kê–thành tựu.

---

## v1.4.0 — "Tâm ma đột phá · Nhiệm vụ trưởng lão · Vật liệu bản mệnh · Tự nhập giá"

### Tính năng mới
1. **🌑 Tâm ma trước Xung kích Đại Cảnh Giới** (Kết Đan+, 45% mỗi lần xác nhận):
   - **Trấn áp bằng đạo tâm**: kiểm định Ngộ tính + Thần thức → thành công **+8%** tỉ lệ đột phá lần này; thất bại **−8%** + mất 15% HP + thương thế.
   - **Dùng đan an thần** (An Thần Hoàn / Thanh Tâm Tán): tiêu 1 viên, **+5%**.
   - **Cưỡng ép xung kích**: mất 20% HP, tỉ lệ giữ nguyên.
   - **Hủy đột phá**: giữ nguyên Tu vi, **hoàn lại buff** đã nhận (chống khai thác).
   - Tự dừng treo máy khi tâm ma xuất hiện; modal z-index 9700.
2. **🎖️ Nhiệm vụ Trưởng lão (Kết Đan+)** — trong tab 🏛️ Tông Môn:
   - 2 nhiệm vụ: **Truy sát Ma Tu** (6 tháng) và **Hộ tống Trưởng lão** (12 tháng), nhận qua Truyền Âm Phù.
   - **3 năm/lượt**; kiểm định theo cảnh giới + Thần thức/Khí vận.
   - Thưởng: **Linh thạch + Cống hiến + cơ hội Yêu đan**; thất bại mất 25% HP + thương thế.
3. **🔆 Nâng Bản Mệnh bằng nguyên liệu**:
   - Cấp `c` cần **300 × (c+1) LT + (c+1) Yêu đan** (đếm cả túi và Kho Động Phủ), 6 tháng.
   - Thiếu Yêu đan bị chặn kèm thông báo số lượng còn thiếu; UI hiển thị “X LT + Y Yêu đan”.
4. **🎪 Đấu giá: Tự nhập giá & Mua ngay**:
   - **✏️ Tự nhập**: modal nhập giá, validate `[giá kế tiếp, LT hiện có]`; NPC vẫn có thể trả cao hơn.
   - **Mua ngay**: trả `max(giá + 8%, 145% giá trị)` để thắng ngay món đó.
5. **🗺️ Lọc bản đồ theo cảnh giới**: dropdown Phàm Nhân → Độ Kiếp; lọc đồng thời **danh sách vùng** và **danh sách bí cảnh phù hợp**.

### Đã test trực tiếp (state được hoàn nguyên sau mỗi test)
- Lọc cảnh giới: 46 vùng → **14 vùng** khi chọn Kết Đan; 7 bí cảnh hiển thị đúng.
- Nhiệm vụ trưởng lão: “Hộ tống” kiểm định **92% → thành công**, +500 LT, +120 Cống hiến, +1 năm tuổi ✓.
- Bản mệnh: thiếu Yêu đan → chặn; thêm 2 Yêu đan → lên **cấp 2**, −600 LT, hệ số **1.16**, ATK 1.718→**1.725** ✓.
- Đấu giá: “Tự nhập” mở modal (min 90), đặt 95 → NPC counter **100**; “Mua ngay” Hồi Xuân Hoàn **116 LT**, vật phẩm vào túi ✓.
- Tâm ma đột phá: modal 4 lựa chọn (nút đan an thần bị khoá khi có 0 viên); chọn “Cưỡng ép” → −20% HP rồi tiếp tục xung kích ✓.
- Console **0 error**; `node --check` pass toàn bộ.

### Ghi chú save
- Test phát hiện **click lặp** làm bản mệnh lên cấp 2 ngoài ý muốn → đã **hoàn lại cấp 1 + 1.600 LT**, xoá log tương ứng.
- Mọi thay đổi do test cưỡng bức (tâm ma, nhiệm vụ, đấu giá, nâng bản mệnh thử) đều **khôi phục nguyên trạng** bằng snapshot.
- Trạng thái hiện tại: Kết Đan Sơ Kỳ · 9.073/32.000 TV · 183/590 tuổi · 1.646 LT · Bản mệnh cấp 1 · Kho 17 loại.

---

## v1.5.0 — "Toái đan thành anh · Từ điều bản mệnh · Chức vị · Thành tựu"

### Tính năng mới
1. **🌀 Toái Đan Thành Anh** (Kết Đan Đỉnh Phong → Nguyên Anh):
   - Khi xác nhận đột phá lên Nguyên Anh, mở **3 chặng**:
     - **Tâm Ma**: giữ đạo tâm (kiểm định Ngộ tính + Thần thức), dùng đan an thần (+1 điểm), hoặc nhắm mắt xông qua (−20% HP).
     - **Thiên Lôi**: dùng Bản Mệnh Pháp Bảo chống đỡ (−12% HP, +1 điểm nếu bản mệnh ≥ cấp 2), cứng chống (−30% HP, +1 điểm nếu còn >50% HP), hoặc tạm lùi (mất 5% Tu vi, hoãn đột phá).
     - **Toái Đan**: dốc toàn lực (+2 điểm, khó) hoặc ổn định (+1 điểm, dễ).
   - Điểm thử thách cộng dồn thành **+10% → +25%** tỉ lệ đột phá trước khi roll thật.
   - Thất bại ở bước toái đan: **−12% Tu vi, trọng thương**, không roll đột phá.
2. **🔆 Từ điều (affix) Bản Mệnh Pháp Bảo**:
   - Mỗi cấp tôi luyện nhận **1 từ điều ngẫu nhiên** (tối đa 5): Công kích / Phòng thủ / Khí huyết / Linh lực / Bạo kích / Né tránh.
   - Giá trị ngẫu nhiên 80–130% chuẩn; cộng trực tiếp vào 6 chỉ số tương ứng và hiển thị trong tab Động Phủ.
3. **🏛️ Chức vị Tông Môn & Thái Thượng Trưởng Lão**:
   - Bổ sung cấp **Thái Thượng Trưởng Lão** (6.000 Công tích · cảnh giới Hợp Thể) vào hệ thống chức vị (tổng 6 cấp).
   - **Nhiệm vụ Trưởng lão được nhân thưởng theo chức vị**: Chân Truyền ×1.2 · Trưởng Lão ×1.4 · Thái Thượng ×1.6 (Linh thạch + Cống hiến), hiển thị ngay trong mục nhiệm vụ.
4. **🎪 Thị trường đấu giá biến động**:
   - Giá trị/giá khởi điểm mỗi phiên nhân hệ số **0,8–1,4** theo Linh khí vùng + ngẫu nhiên phiên.
   - Hiển thị “Thị trường ±X%” ở tiêu đề phiên; cùng món hàng ở vùng khác sẽ có giá khác.
5. **📊 Thành tựu & Thống kê** (nút mới trên thanh tiêu đề):
   - Theo dõi: trận thắng, bí cảnh hoàn thành, đột phá đại cảnh giới, thắng/mua đấu giá, nhiệm vụ trưởng lão, Linh thạch cao nhất từng có.
   - **8 thành tựu** kèm thưởng Linh thạch (300 → 5.000 LT): sát yêu 10/50/200, bí cảnh 5/20, đột phá 3, tài sản 10k, bản mệnh cấp 5; mỗi thành tựu nhận thưởng 1 lần.

### Đã test trực tiếp (hoàn nguyên state sau mỗi test)
- Toái đan: modal 3 chặng đúng thứ tự; đi 心魔→天劫→碎丹 được **4 điểm**, thành công kiểm định 71% → **+22% đột phá**, tiếp tục roll thật ✓; chọn “tạm lùi” → **−5% Tu vi**, không roll ✓.
- Từ điều: nâng bản mệnh lên cấp 2 sinh từ điều **Né tránh +1%**, log ghi rõ, chỉ số cập nhật ✓.
- Chức vị: đặt capBac 4 → hệ số **×1.4**, mục nhiệm vụ hiển thị “thưởng ×1.4” ✓; danh sách chức vị có **6 cấp**.
- Thị trường: phiên Liêu Châu có hệ số **1.20**, giá các món điều chỉnh theo ✓.
- Thành tựu: giả lập 12 trận thắng → nhận “Sát yêu nhập môn” **+300 LT**, đánh dấu đã nhận ✓.
- Console **0 error**; `node --check` pass toàn bộ.

### Ghi chú
- Thống kê **bắt đầu đếm từ khi cài v1.5** (không truy hồi lịch sử cũ).
- Nút **📊 Thành tựu** nằm cạnh “❓ Hướng dẫn” trên thanh tiêu đề.
- Save tương thích ngược: tự thêm `thongKe`, `thanhTuu`, `banMenh.affixes`.
- Trạng thái save sau test: Kết Đan Sơ Kỳ · 9.073/32.000 TV · 183/590 tuổi · 1.646 LT · Bản mệnh cấp 1 · thống kê 0 · 0 thành tựu đã nhận.

---

## v1.6.0 — "Chu kỳ bí cảnh · An toàn Toái Đan · Cân bằng Kết Đan"

### Sửa lỗi
1. **⏳ Chu kỳ đóng/mở bí cảnh** (lỗi nghiêm trọng, cho phép farm vô hạn):
   - Mỗi bí cảnh lưu **năm mở lại** riêng trong `state.biCanhMoLai`; vào lại trước kỳ bị **chặn ở cả UI lẫn logic** (`v16ConLaiBiCanh`).
   - Bảng quy ước: `300 năm 1 lần` → 300 · `10000 năm` → 10000 · `3000 năm` → 3000 · `5 năm` → 5 · `Bất định` → 25 · `Đặc biệt` → 30 · `Phong ấn vỡ mở`/`Khi độ kiếp thành công` → 50 · `Theo đại điển` → 30.
   - **"Thường trực"** = mở thường xuyên nhưng vẫn có hồi ngắn **2–20 năm**, tính theo thời gian thám hiểm + cấp cao nhất + biến thiên theo id (Hải Để Thạch Điện ≈10 năm, Tam Tinh Đảo ≈8 năm…). **Toàn bộ 40/40 bí cảnh đều có chu kỳ.**
   - Kết thúc chuyến (hoàn thành, rút lui hoặc độn thuật bỏ chạy) đều ghi nhận đóng bí cảnh; nút hiển thị `⏳ mở lại sau X năm` và bị disable.
2. **🌀 Toái Đan — Hủy an toàn**:
   - Thêm nút **↩️ Hủy an toàn** ở cả 3 chặng: chặng 1 **miễn phí**, chặng 2–3 **−2% Tu vi**; nhấn **ESC** cũng hủy (trước đây chỉ có "tạm lùi" −5%).
   - Hộp xác nhận đột phá Kết Đan Đỉnh Phong ghi rõ: sẽ qua **3 chặng**, tối đa **+25%**, có thể hủy.
3. **🔆 Đổi pháp bảo đang là Bản Mệnh**:
   - Trước khi trang bị vũ khí khác, hiện modal cảnh báo; cho chọn **chuyển liên kết giữ 50% cấp** (kèm từ điều đã khắc) thay vì mất trắng.
4. **💥 Xác nhận hành động phá hủy**: Phá hủy Động Phủ và Di dời Động Phủ đều qua modal xác nhận (tránh bấm nhầm).
5. **Hiển thị**: sửa `mất -1.641 Khí huyết` → `mất 1.641 Khí huyết`; Linh Điền cap số năm khi đã chín (`4/4 năm` thay vì `168.4/4`); nhãn chu kỳ dạng `Thường trực (≈8 năm/lần)`.

### Cân bằng Kết Đan
6. **Quái vượt cảnh giới**: HP ×0,72^chênh, công/phòng ×0,8^chênh (sàn 40–50%) + cảnh báo khi vào trận; boss Nguyên Anh không còn "tự sát" với người chơi Kết Đan.
7. **Thưởng Linh thạch săn/bí cảnh ở Kết Đan ×1,5** (áp dụng khi `canhGioi ≥ 3`).
8. **Chợ**: thêm 3 pháp bảo Kết Đan giá hợp lý — **Thanh Giao Bảo Giáp** (9.000 LT), **Tụ Linh Ngọc Bội** (8.000 LT), **Huyền Thiết Trọng Kiếm** (12.000 LT); đan đột phá Kết Đan **giảm 40%** (Giáng Trần 4.000 → 2.400; Định Thần 6.500 → 3.900); pháp bảo cấp 3 trên 20.000 LT giảm 25%.
9. **Nhiệm vụ Trưởng lão**: hiện tiến độ chuỗi; hoàn thành **2 lần** mở nhiệm vụ đặc biệt **Trấn áp Yêu Triều** (24 tháng, thưởng lớn, 90% Yêu đan); có toast thông báo khi có lượt mới.
10. **Tâm ma định kỳ**: Kết Đan+ bảo đảm ít nhất **1 lần mỗi 10 năm bế quan** (ngoài 10%/lượt) để nội dung tâm ma thực sự xuất hiện.

### Đã test trực tiếp
- Chu kỳ: 40/40 bí cảnh có chu kỳ; Hư Thiên Điện **300 năm**, Hải Để **10 năm**, Tam Tinh Đảo **8 năm**; vào Hư Thiên Điện → rút lui → ghi năm mở lại **523**, gọi vào lại bị chặn, nút UI `disabled` kèm “mở lại sau 300 năm” ✓.
- Chợ Thiên Tinh Thành: Thanh Giao Bảo Giáp **7.650 LT**, Tụ Linh Ngọc Bội **8.000 LT**; Giáng Trần Đan **2.400 LT**, Định Thần Đan **3.900 LT** ✓.
- Bản mệnh: giả lập cấp 3 → đổi vũ khí hiện modal cảnh báo; bấm **Hủy** → pháp bảo & bản mệnh không đổi ✓.
- Toái Đan: mở chặng 1 → nhấn **ESC** → modal đóng, Tu vi **không đổi**, cờ `__v15DaToaiDan` reset ✓.
- Console **0 error**; `node --check` pass `game.js` + toàn bộ `update_v1_*.js`.

### Ghi chú
- Save tương thích ngược: tự thêm `biCanhMoLai`, `v14NvTruongLao.count`, `v16DaThongBao`.
- Dữ liệu test đã khôi phục (không còn cooldown thử nghiệm, bản mệnh về cấp 0, vật phẩm thử đã xóa).
- Trạng thái save sau test: **Kết Đan Đại Viên Mãn** · năm **223** · **137.269/108.000 TV** · **6.976 LT** · Bản mệnh cấp 0 · không còn cooldown test.

---

## v1.6.1 — "Đan dược chuyên biệt · Tồn kho 1–9 · Gate cảnh giới"

### Đan dược được viết lại theo **một tác dụng duy nhất**
- Toàn bộ **110 đan cũ + 18 đan mới = 128 đan**, mỗi đan chỉ còn **đúng 1 nhóm hiệu ứng**:
  - ❤️ **Hồi Khí huyết** (18 loại)
  - 💧 **Hồi Linh lực** (18 loại — trước đây không có)
  - ✨ **Tăng Tu vi** (20 loại)
  - ⚡ **Tăng tỷ lệ đột phá** (60 loại)
  - 💪 **Tăng Căn cốt** (9 loại)
  - ⏳ **Tăng Thọ nguyên** (3 loại)
- Mô tả `moTa` của từng đan được sinh lại đúng tác dụng, ghi rõ “chỉ hồi máu / chỉ hồi Linh lực / chỉ tăng Tu vi / …”.
- Bổ sung đan còn thiếu:
  - **Luyện Khí Đan** (cg0, +10% đột phá) và **Kết Đan Đan** (cg2, +20% đột phá).
  - **Hồi Nguyên Đan** (cg3, hồi HP).
  - Bộ đan cg6–9: Hồi nguyên / Tụ linh / Tăng nguyên / Luyện thể / Trường thọ — khắc phục việc cấp 7–9 trước đây **chỉ có đan đột phá**.
- Đan hồi HP/MP vẫn dùng được ở cảnh giới cao nhưng **suy giảm theo chênh cấp** (`35%–100%`), đan Tu vi/Căn cốt quá cũ (lệch >2 cấp) bị chặn.
- **Đan đột phá cũ bị vô hiệu** nếu lệch >1 cấp (Trúc Cơ Đan tại Kết Đan không còn cộng +25%); nếu lệch đúng 1 cấp thì hiệu lực còn **70%** (Kết Đan Đan +20% → +14% tại Kết Đan).
- Ngoài chiến đấu: đan hồi HP/MP có sàn **8% HP/MP max** (× hệ số lệch cấp); trong chiến đấu chỉ đan HP/MP mới dùng được, sàn **22%** tương ứng.

### Chợ & tồn kho
- **Chỉ bán đúng cảnh giới hiện tại** với **đan dược & pháp bảo**; phù lục, túi trữ vật, yêu đan/linh vật và linh thảo chỉ bán **ngang hoặc thấp hơn** cảnh giới hiện tại. Công pháp/đan phương vẫn có thể vượt 1 cấp.
- **Đan dược có tồn kho ngẫu nhiên 1–9** mỗi phiên chợ:
  - Hiển thị `📦 Còn X/Y`; hết hàng thì nút Mua bị khóa.
  - Nút **Mua 5** tự giới hạn theo tồn kho còn lại.
  - Tồn kho ổn định theo phiên (không reroll khi reload), ghi nhận vào `state.shopDaMua`.
- Sửa lỗi **giá hiển thị ≠ giá thu**: mua hàng giờ dùng đúng `giaShop` (đã gồm phẩm chất/giảm giá), không còn tính giá gốc.
- Linh thảo được lọc theo cảnh giới ở **mọi cấp** (trước đây từ Trúc Cơ trở lên bán cả thảo cấp 5–9).

### Trang bị
- Chỉ **trang bị pháp bảo ngang hoặc thấp hơn cảnh giới hiện tại**; pháp bảo vượt cấp bị chặn kèm thông báo (vẫn có thể cất trong túi chờ đột phá).

### Đã test trực tiếp
- Cấu trúc đan: **128/128 đan chỉ có 1 hiệu ứng**, không còn đan “vừa HP vừa Tu vi”.
- Phủ sóng theo cấp: **cg0–cg9 đều có đủ HP / MP / Tu vi / Đột phá** (cg7–9 trước đây trống HP/MP/TV).
- Chợ Kết Đan: chỉ còn đan cg3 (Giáng Trần, Định Thần, Thanh Tinh, Xích Hỏa, Hạp Linh, Hàn Băng), **không còn đan cg2/cg4**; pháp bảo đúng cg3; linh thảo ≤ cg3.
- Mua thử Giáng Trần: giá **3.720 LT**, tồn kho **6 → 5**, UI hiển thị đúng `Còn 5/6`; “Mua 5” với tồn 3 mua đúng **3** rồi hết hàng.
- Tác dụng:
  - Hồi Xuân Hoàn cg1 tại Kết Đan: hồi **+593 HP**, **không** hồi MP/Tu vi.
  - Thanh Tâm Tán cg0 tại Kết Đan: hồi **+270 MP**, **không** hồi HP/Tu vi.
  - Thanh Tinh Đan cg3: **+6.500 Tu vi**, không hồi HP/MP.
  - Trúc Cơ Đan tại Kết Đan: bị chặn “đan đột phá đã lỗi thời”, không tiêu hao.
  - Giáng Trần Đan: +15% đột phá, tiêu hao đúng 1 viên.
  - Hư Thiên Đỉnh (cg4) tại Kết Đan: chặn trang bị, không mất vật phẩm.
- Console **0 error**; `node --check` pass `game.js`, `update_v1_1.js`, `update_v1_6_1.js`.

### Ghi chú
- Save tương thích ngược: thêm `shopDaMua`, `v161DaThongBao`.
- Dữ liệu test đã khôi phục: không còn đan thử, LT/TV/HP/MP/túi đồ/shopDaMua như trước test.
- Trạng thái save: **Kết Đan Đại Viên Mãn** · năm **223** · **137.269/108.000 TV** · **6.976 LT** · Bản mệnh cấp 0.

---

## v1.7.0 — "Cân bằng Công pháp & Bí thuật"

### Kết quả rà soát dữ liệu
- Tổng **423 mục**: **209 TU_LUYEN** + **214 BI_THUAT**.
- Trước cập nhật: **31 nhóm trùng signature / 81 mục** (nhiều bí thuật chỉ khác tên, cùng kỹ năng/chỉ số), 0 trùng tên, 0 trùng `kyNang.id`.
- Sau cập nhật: **0 nhóm trùng signature**, 0 trùng tên, 0 trùng skill id.

### Thay đổi chính
1. **TU_LUYEN — tốc độ tu luyện theo cảnh giới**:
   - Chuẩn hoá `heSoTocDo` theo dải: cg0 **1,00–1,35** · cg1 **1,08–1,24** · cg2 **1,15–1,40** · cg3 **1,22–1,60** · cg4 **1,30–1,70** · cg5 **1,38–1,80** · cg6 **1,45–1,90** · cg7 **1,52–2,00** · cg8 **1,60–1,88** · cg9 **1,70–2,00**.
   - `tiLeDotPha` giới hạn theo cấp (tối đa 0,03 → 0,14), không còn cộng dồn vô hạn.
2. **Chuẩn hoá `chiSoNen`**:
   - Chặn các chỉ số vượt trần: Công tối đa **43,9%**, Thủ **39,2%**, HP **42,8%**, Linh lực **28,1%**, Hồi phục **22,6%**, Kháng tâm ma **26,3%**.
   - `linhLucVanHanh` giảm từ tối đa **28,6 → 12,5** (trước đây cộng tới +114% Công và +286% MP).
   - `liemTuc` 5–21; `thanThuc` chuẩn hoá về số nguyên 1–5; `thoNguyen` tối đa 11.800 năm.
   - Bổ sung 2 chỉ số chính theo vai trò (Ngũ Hành / Kiếm pháp / Thể tu / Nghệ thuật / Phụ trợ / Độc thuật / Trận pháp / Đan đạo…).
   - Mỗi mục có thêm **chỉ số phụ duy nhất** theo `id` (Thần thức / Ngộ tính / Căn cốt / Khí vận / Thân pháp / Đạo tâm) → không còn trùng y hệt.
3. **BI_THUAT — thụ động riêng**:
   - Toàn bộ 214 bí thuật được gán `chiSoNen` theo vai trò kỹ năng (Tấn công / Phòng thủ / Trị liệu / Khống chế / Độn thuật / Hỗ trợ).
   - Các nhóm trùng cũ (ví dụ 5 bí thuật cg0 cùng `TAN_CONG 0.9x`) nay khác nhau về chỉ số thụ động, uy lực và mô tả.
4. **Kỹ năng chủ động**:
   - Uy lực `heSo` chuẩn hoá **0,5–5,44** theo cảnh giới/vai trò (trước có skill 6x quá mạnh).
   - Pháp lực tiêu hao **0,01–0,35**; hồi chiêu **0–8** (trước có 10).
   - Mô tả `Sát thương = X% công kích` tự cập nhật theo `heSo` mới.
5. **Mô tả thuộc tính**:
   - `moTa` của mọi công pháp/bí thuật có thêm dòng **【v1.7】** tóm tắt hiệu ứng thực tế.
   - `moTaCongPhapNgan` hiển thị thêm **Vận hành linh lực**, **Hồi Linh lực**, **Thọ nguyên**.

### Đã test trực tiếp
- 423 mục, **0 nhóm trùng signature**, 0 trùng tên, 0 trùng skill id.
- Công pháp hiện tại **Đan Hà Bất Diệt Kinh**: Tu luyện **×1,60**, Công **+23%**, HP **+19%**, Linh lực **+45%**, Căn cốt **+3**, Vận hành linh lực **4,5**.
- Bí thuật hiện tại **Đại Bi Chú**: HP **+16%**, Hồi phục **+14%**, Thần thức **+3**; chiêu **Từ Âm Phổ Tế** 0,97x · 18% LL · CD 2.
- `tinhCongPhapTongHop`: Công **22,9%**, HP **35,4%**, Linh lực **45%**, Hồi phục **13,85%**, Thần thức **+3**, Căn cốt **+3**.
- Dải thuộc tính sau cân bằng: Công 2–43,9% · Thủ 0,7–39,2% · HP 1–42,8% · Linh lực 2–28,1% · Hồi phục 2–22,6% · Kháng tâm ma 1–26,3% · Vận hành LL 0,5–12,5 · kỹ năng 0,5–5,44x.
- Console **0 error**; `node --check` pass `game.js` + toàn bộ `update_v1_*.js`.

### Ghi chú
- Chỉ **cân bằng lại thuộc tính**, không thêm/xoá ID; save cũ vẫn học/trang bị được bình thường.
- Dữ liệu cân bằng được áp dụng khi nạp game qua `update_v1_7.js` (không sửa tay 423 entry trong `data.js`).
- Save hiện tại: **Kết Đan Đại Viên Mãn** · năm **223** · **137.269 TV** · **6.976 LT**; công pháp/bí thuật đang dùng đã nhận thuộc tính mới.

---

## v1.8.0 — "Cân bằng Pháp bảo / Trang bị"

### Kết quả rà soát
- Tổng **121 pháp bảo** (118 gốc + 3 món nhập môn từ v1.6.1).
- Trước cân bằng có các món lệch trần rõ rệt:
  - cg4: **Hư Thiên Đỉnh / Hắc Phong Kỳ / Bát Linh Xích** tổng 8.700–10.500 (trung vị cg4 chỉ 4.100), giá tới **500.000 LT**.
  - cg5: top **17.200** (trung vị 11.000).
  - cg7: **Huyền Thiên Trảm Linh Kiếm** tổng **100.000**, giá **15.000.000 LT** (trung vị cg7 ~68.000 / ~3,4 triệu).
  - cg8: **Nguyên Hợp Ngũ Cực Sơn** tổng **215.000** (trung vị 123.000).
  - Giá/tổng lực có món **166,7** (cg6) và **150,0** (cg7), trong khi trung vị chỉ ~50–60.
- Lỗi tiềm ẩn: mọi món `Thông Thiên Linh Bảo` đều được coi là **hạn mức cấp 9**, kể cả món cg4/cg6/cg7 → không bị giảm uy lực khi lên cảnh giới cao.

### Thay đổi chính
1. **Dải tổng lực theo cảnh giới** (Công + Thủ):
   - cg0: 55 · cg1: 65–500 · cg2: 240–720 · cg3: 420–3.500 · cg4: 2.800–6.500
   - cg5: 8.300–14.000 · cg6: 11.900–19.800 · cg7: 50.000–70.000 · cg8: 88.000–140.000 · cg9: 128.000–170.000.
   - Giữ nguyên các món **nhập môn giá rẻ** cg3 (420–770) để người chơi mới vẫn có lựa chọn.
2. **Giá theo tổng lực**:
   - Chặn tỷ lệ giá/tổng lực: cg1 **2–6**, cg2 **4–8**, cg3 **10–25**, cg4 **18–45**, cg5 **35–75**, cg6 **45–90**, cg7 **45–90**, cg8 **50–95**, cg9 **70–120**.
   - Ví dụ: Hư Thiên Đỉnh **500.000 → 293.000 LT**; Huyền Thiên Trảm Linh Kiếm **15.000.000 → 6.300.000 LT**; Nguyên Hợp Ngũ Cực Sơn **12.000.000 → 7.810.000 LT**.
   - Giá được làm tròn theo bậc (10/100/1.000/10.000 LT).
3. **Vai trò trang bị**:
   - Mỗi món được phân loại **Công kích / Phòng thủ / Cân bằng** theo tỷ lệ Công–Thủ, hiển thị trong mô tả v1.8.
   - Không làm mất các món chuyên biệt (atk=0 hoặc def=0 vẫn giữ nguyên hướng).
4. **Hệ thuộc tính**:
   - Toàn bộ **121/121** món được gán `he` rõ ràng từ tên/mô tả (Kim, Mộc, Thủy, Hỏa, Thổ, Băng, Lôi, Phong, Ám…) để tương thích linh căn có ý nghĩa.
5. **Sửa hạn mức Thông Thiên**:
   - Chỉ món `Thông Thiên Linh Bảo` có `canhGioi >= 8` mới được miễn giảm trừ vượt cảnh giới; món cg4–7 giờ bị giảm đúng quy tắc.

### Đã test trực tiếp
- **121 món**, 0 cặp trùng chỉ số Công/Thủ/cấp, 0 món thiếu mô tả v1.8, 0 món thiếu hệ, 0 món giá 0.
- Dải tổng lực sau cân bằng đúng bảng trên; giá/tổng lực nằm trong giới hạn.
- Trang bị hiện tại **Chân Dương Kính**: giữ nguyên **Công 260 · Thủ 190**; giá 2.150 → **2.200 LT** (làm tròn).
- Nhân vật hiện tại: **Công 2.570 · Thủ 997** (không thay đổi so với trước cân bằng).
- Hư Thiên Đỉnh: 10.500 → **6.500 tổng lực**, giá **293.000 LT**.
- Huyền Thiên Trảm Linh Kiếm: 100.000 → **70.000 tổng lực**, giá **6.300.000 LT**.
- Nguyên Hợp Ngũ Cực Sơn: 215.000 → **140.000 tổng lực**, giá **7.810.000 LT**.
- Console **0 error**; `node --check` pass `game.js` + toàn bộ `update_v1_*.js`.

### Ghi chú
- Chỉ cân bằng **thuộc tính/giá/hệ**, không thêm/xoá ID; trang bị đang mặc và trong túi giữ nguyên.
- Áp dụng runtime qua `update_v1_8.js` (không sửa tay 121 entry trong `data.js`).
- Save hiện tại: **Kết Đan Đại Viên Mãn** · năm **223** · **137.269 TV** · **6.976 LT**.
