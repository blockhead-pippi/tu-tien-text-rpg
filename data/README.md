# Cấu trúc dữ liệu game

Thư mục này chứa toàn bộ dữ liệu game, tách từ `legacy/data.js` (file cũ ~1,29 MB).
Mỗi file là một nhóm dữ liệu độc lập, **không chứa trùng dữ liệu của file khác**.

## Nguồn dữ liệu chính: Excel

- File quản lý: **`data/game-data.xlsx`**
- Sửa trực tiếp trong Excel, sau đó chạy:

```bash
python tools/import_excel.py
```

Tool sẽ sinh lại toàn bộ `data/*.js`, cập nhật `index.html` và bật
`window.PN_DATA_SNAPSHOT = true` trong `data/index.js`.
Ở chế độ snapshot, các update `v1.6.1 / v1.7 / v1.8` **không biến đổi lại dữ liệu**,
nên dữ liệu Excel là nguồn cuối cùng.

> Nếu sửa tay `data/*.js` mà không sửa Excel, lần import sau sẽ ghi đè.
> Hãy sửa Excel rồi import.

## Cách nạp

`index.html` nạp lần lượt các file trong thư mục này, sau đó nạp `data/index.js`,
rồi mới tới `map_data.js` / `game.js` / các file `update_v1_*.js`.

Mỗi file dữ liệu tự khởi tạo:

```js
window.PN_DATA = window.PN_DATA || {};
window.PN_DATA.vatPham = window.PN_DATA.vatPham || [];
window.PN_DATA.vatPham.push(/* ... */);
```

`data/index.js` làm 3 việc:
- Bật `PN_DATA_SNAPSHOT` để các update không ghi đè dữ liệu Excel.
- Gắn `PN_DATA.roll.linhCan / theChat / xuatThan` trỏ tới mảng top-level tương ứng
  (tránh nhân bản 3 mảng này).
- Bảo đảm mọi mảng top-level luôn tồn tại.

## Bản đồ file

| Thư mục / file | Nội dung |
|---|---|
| `core/canh-gioi.js` | 11 cảnh giới, tu vi cần, hệ số gốc |
| `core/linh-can.js` | Linh căn |
| `core/the-chat.js` | Thể chất |
| `core/xuat-than.js` | Xuất thân / kiếp mới |
| `core/roll.js` | Họ tên, tên nam/nữ, hệ tên (không chứa 3 mảng linh căn/thể chất/xuất thân) |
| `world/vung-dat.js` | 40 vùng đất |
| `world/tong-mon.js` | 60 tông môn |
| `world/bi-canh.js` | 40 bí cảnh |
| `vat-pham/dan-duoc.js` | Đan dược |
| `vat-pham/linh-thao.js` | Linh thảo |
| `vat-pham/trang-bi.js` | Pháp bảo / trang bị |
| `vat-pham/phu-luc.js` | Phù lục |
| `vat-pham/tru-vat.js` | Túi trữ vật |
| `vat-pham/yeu-dan.js` | Yêu đan |
| `vat-pham/linh-vat.js` | Linh vật |
| `dan-phuong/cg0.js` … `cg9.js` | Đan phương theo cảnh giới |
| `npc/<vung>.js` | NPC theo từng vùng |
| `npc/npc-mau.js` | Mẫu NPC ngẫu nhiên |
| `yeu-thu.js` | Yêu thú |
| `su-kien-offline/01.js` … `04.js` | Sự kiện offline, chia 4 phần theo thứ tự gốc |
| `cong-phap/tu-luyen/<thể loại>.js` | Công pháp tu luyện theo thể loại |
| `cong-phap/bi-thuat/<thể loại>.js` | Bí thuật theo thể loại |
| `index.js` | Bộ nạp / alias nhỏ |
| `manifest.json` | Danh sách file + số lượng bản ghi hiện tại |

Các file `ngu-hanh`, `nghe-thu` lớn đã được tách thêm theo dải cảnh giới
(`-0-2`, `-3-5`, `-6-9`) để không file nào quá lớn.

## Nguyên tắc khi thêm/sửa dữ liệu

1. **Sửa trong `data/game-data.xlsx`**, không sửa trực tiếp `data/*.js` (sẽ bị ghi đè khi import).
2. Mỗi item (`id`) chỉ nằm trong **một** sheet; tham chiếu bằng ID, không copy object.
3. Cột nhiều giá trị dùng dấu `|`; cột JSON phải là JSON hợp lệ.
4. `KyNang` liên kết qua `congPhapId`; `NguyenLieu` liên kết qua `danPhuongId`.
5. Sau khi sửa: chạy `python tools/import_excel.py` (hoặc nhờ Cline).
6. `data/manifest.json` chỉ để tra cứu; không nạp như script.

## Kiểm tra nhanh

Mở Console và chạy:

```js
({
  snapshot: PN_DATA_SNAPSHOT === true,
  congPhap: PN_DATA.congPhap.length,   // 423
  vatPham: PN_DATA.vatPham.length,     // 390 (đã gồm update + dữ liệu Excel)
  dan: PN_DATA.vatPham.filter(v => v.loai === 'dan').length,       // 128
  trangBi: PN_DATA.vatPham.filter(v => v.loai === 'phap_bao').length, // 121
  npcs: PN_DATA.npcs.length,           // 73
  yeuThu: PN_DATA.yeuThu.length,       // 43
  suKien: PN_DATA.suKienOffline.length // 80
})
```

File gốc cũ được giữ tại `legacy/data.js` để đối chiếu/rollback, **không được nạp**.