# Cấu trúc project

## Dữ liệu

- **`data/game-data.xlsx`** — nguồn quản lý chính (25 sheet).
- `data/` — dữ liệu JS được sinh từ Excel. Xem `data/README.md`.
- `data/index.js` — bộ nạp nhỏ, bật `PN_DATA_SNAPSHOT` + alias `roll`.
- `data/manifest.json` — danh sách file + số lượng bản ghi.
- `tools/import_excel.py` — đọc Excel, sinh lại `data/*.js`, cập nhật `index.html`.
- `legacy/data.js` — file dữ liệu cũ 1,29 MB, chỉ để backup/đối chiếu, không nạp.

## Quy trình sửa dữ liệu

1. Mở `data/game-data.xlsx`, sửa/thêm/xóa dòng.
2. Chạy `python tools/import_excel.py` (hoặc nhờ Cline chạy).
3. Tải lại game (các script data có `?v=...` để tránh cache).
4. Dữ liệu Excel là nguồn cuối; các update v1.6.1/v1.7/v1.8 không ghi đè khi snapshot bật.

## Thứ tự nạp trong `index.html`

1. Các file trong `data/` (từ `core/` → `world/` → vật phẩm → đan phương → NPC → yêu thú → sự kiện → công pháp/bí thuật).
2. `data/index.js` — alias `roll.linhCan/theChat/xuatThan`, bảo đảm mảng.
3. `map_data.js` — dữ liệu bản đồ riêng.
4. `game.js` — logic game.
5. `map.js`.
6. `update_v1_1.js` … `update_v1_8.js` — các bản cân bằng/nội dung.

## Quy ước

- Không đặt dữ liệu mới vào `legacy/data.js`.
- Không copy dữ liệu giữa các file; chỉ tham chiếu bằng `id`.
- Mỗi file dữ liệu tự khởi tạo `window.PN_DATA` nên có thể nạp độc lập.
- Khi thêm file dữ liệu mới, cập nhật `index.html` giữa hai marker `DATA_FILES_START` / `DATA_FILES_END`,
  sau đó cập nhật `data/manifest.json` nếu muốn.