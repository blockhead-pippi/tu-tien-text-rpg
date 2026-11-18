# Công cụ Excel ↔ data JS

## Quy trình

1. Mở **`data/game-data.xlsx`**.
2. Sửa/thêm/xóa dòng trong các sheet.
3. Chạy:

```bash
python tools/import_excel.py
```

4. Tải lại game. Các script data được gắn `?v=<timestamp>` nên trình duyệt không dùng cache cũ.

Kiểm tra trước khi ghi:

```bash
python tools/import_excel.py --dry-run
```

## Cấu trúc workbook

| Sheet | Nội dung |
|---|---|
| `CanhGioi`, `LinhCan`, `TheChat`, `XuatThan` | dữ liệu khởi tạo |
| `VungDat`, `TongMon`, `BiCanh` | thế giới |
| `VatPham_*` | vật phẩm tách theo `loai` (đan, thảo, trang bị, phù lục, túi, yêu đan, linh vật) |
| `DanPhuong` + `NguyenLieu` | đan phương và nguyên liệu |
| `NPC`, `NPC_Mau`, `YeuThu` | NPC / yêu thú |
| `SuKienOffline` | sự kiện offline (choices dạng JSON) |
| `CongPhap_TuLuyen`, `CongPhap_BiThuat` | công pháp / bí thuật |
| `KyNang` | kỹ năng, liên kết `congPhapId` |
| `Roll` | họ tên / tên / hệ tên |

## Quy tắc sửa

- Không đổi tên cột `id`, `ten`, `loai`; mỗi `id` duy nhất trong một nhóm.
- Cột nhiều giá trị: ngăn bằng `|` (`he`, `tuiDo`, `roiDo`, `phanThuong`…).
- Cột JSON: `choices`, `quanHeNpc`, `vatPham` (xuất thân), `tongMon` (xuất thân).
- `chiSoNen_*`, `chiSoPhang_*`, `tuLuyen_*`, `hieuUng_*` là các cột đã tách phẳng.
- `KyNang` phải có `congPhapId`; `NguyenLieu` phải có `danPhuongId`.
- Thêm/xóa dòng là đủ; tool tự gom lại file JS và cập nhật `index.html`.

## Snapshot

Sau khi import, `data/index.js` có:

```js
window.PN_DATA_SNAPSHOT = true;
```

Vì vậy các script `update_v1_6_1.js`, `update_v1_7.js`, `update_v1_8.js` sẽ **bỏ qua
phần biến đổi dữ liệu** để không ghi đè dữ liệu Excel. Các tính năng gameplay khác
(chu kỳ bí cảnh, tồn kho, UI…) vẫn hoạt động.

## Lưu ý

- Không sửa tay `data/*.js` rồi mong giữ thay đổi: lần import sau sẽ ghi đè từ Excel.
- File gốc cũ: `legacy/data.js` (không nạp).
- Nếu cần thêm một **loại vật phẩm mới**, phải thêm sheet + mapping trong `import_excel.py`.
- Nên giữ một bản backup Excel trước khi sửa lớn.