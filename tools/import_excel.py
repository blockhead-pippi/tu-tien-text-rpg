#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Đọc data/game-data.xlsx -> sinh lại data/*.js cho game.

Cách dùng:
    python tools/import_excel.py
    python tools/import_excel.py --dry-run
    python tools/import_excel.py --file data/game-data.xlsx

Sau khi import, data/index.js bật PN_DATA_SNAPSHOT = true để các update
v1.6.1/v1.7/v1.8 không biến đổi lại dữ liệu.
"""
import json
import os
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
DEFAULT_XLSX = DATA / 'game-data.xlsx'

PIPE_FIELDS = {
    'he', 'tuiDo', 'tuiDoTen', 'tuiDoMau', 'roiDo', 'roiDoTen',
    'tuSiTieuBieu', 'dacSan', 'congPhapTranPhai', 'congPhapIds',
    'phanThuongTen', 'nguyHiem', 'phanThuong', 'tags', 'tenKhac',
}
JSON_FIELDS = {'choices', 'quanHeNpc', 'vatPham', 'tongMon', 'chiSoPhang'}
NUMERIC_FIELDS = {
    'id', 'canhGioi', 'canhGioiMin', 'canhGioiMax', 'canhGioiYeuCau', 'canhGioiToiDa',
    'phamChat', 'gia', 'giaGoc', 'giaTheoCongThuc', 'slot', 'soTang', 'trongSo',
    'tuVi', 'tuViCan', 'linhThach', 'hp', 'congKich', 'phongThu', 'atk', 'def',
    'hpGoc', 'linhLucGoc', 'congKichGoc', 'phongThuGoc', 'thoNguyen', 'baseTuViNam',
    'haoCam', 'haoCamMacDinh', 'linhKhi', 'namTon', 'phiLinhThach',
    'soLuong', 'soLuongRa', 'tiLeGoc', 'heSo', 'phapLuc', 'hoiChieu', 'tang',
    'bonusDotPha', 'canCot', 'tuViBonus', 'nhanh', 'cap', 'capBac',
}
BOOL_FIELDS = {'coTheMua', 'coPhuongThi', 'conSong', 'theoKiep', 'tranPhai'}

SHEETS = [
    ('CanhGioi', 'canhGioi', None),
    ('LinhCan', 'linhCan', None),
    ('TheChat', 'theChat', None),
    ('XuatThan', 'xuatThan', None),
    ('VungDat', 'vungDat', None),
    ('TongMon', 'tongMon', None),
    ('BiCanh', 'biCanh', None),
    ('VatPham_DanDuoc', 'vatPham', 'dan'),
    ('VatPham_LinhThao', 'vatPham', 'linh_thao'),
    ('VatPham_TrangBi', 'vatPham', 'phap_bao'),
    ('VatPham_PhuLuc', 'vatPham', 'phu_luc'),
    ('VatPham_TruVat', 'vatPham', 'tru_vat'),
    ('VatPham_YeuDan', 'vatPham', 'yeu_dan'),
    ('VatPham_LinhVat', 'vatPham', 'linh_vat'),
    ('DanPhuong', 'danPhuong', None),
    ('NPC', 'npcs', None),
    ('NPC_Mau', 'npcMau', None),
    ('YeuThu', 'yeuThu', None),
    ('SuKienOffline', 'suKienOffline', None),
    ('CongPhap_TuLuyen', 'congPhap', 'TU_LUYEN'),
    ('CongPhap_BiThuat', 'congPhap', 'BI_THUAT'),
]

def to_num(v):
    if isinstance(v, bool) or v is None or v == '':
        return v
    if isinstance(v, (int, float)):
        return v
    s = str(v).strip()
    if re.fullmatch(r'-?\d+', s):
        return int(s)
    if re.fullmatch(r'-?\d+\.\d+', s):
        return float(s)
    return v

def to_bool(v):
    if isinstance(v, bool): return v
    return str(v).strip().lower() in ('1', 'true', 'yes', 'y', 'có', 'co')

def parse_json_cell(v):
    if not isinstance(v, str): return v
    s = v.strip()
    if not s: return None
    if s[0] in '[{':
        return json.loads(s)
    return v

def split_pipe(v):
    if v is None or v == '': return []
    if isinstance(v, list): return v
    return [x for x in str(v).split('|') if x != '']

def coerce(key, v):
    if v is None or v == '':
        return None
    if key in BOOL_FIELDS:
        return to_bool(v)
    # Ưu tiên JSON cho các ô chứa mảng/object (kể cả canhGioi dạng [0,2])
    if isinstance(v, str):
        s = v.strip()
        if s[:1] in '[{':
            try:
                return json.loads(s)
            except Exception:
                pass
    if key in NUMERIC_FIELDS:
        return to_num(v)
    if key in PIPE_FIELDS:
        return split_pipe(v)
    if key in JSON_FIELDS:
        return parse_json_cell(v)
    return to_num(v) if isinstance(v, str) and re.fullmatch(r'-?\d+(\.\d+)?', v) else v

def unflatten(row, default_loai=None):
    obj = {}
    for key, val in row.items():
        if key is None or val is None or val == '':
            continue
        key = str(key)
        if key.startswith('chiSoNen_chiSoPhang_'):
            obj.setdefault('chiSoNen', {}).setdefault('chiSoPhang', {})[key[len('chiSoNen_chiSoPhang_'):]] = to_num(val)
        elif key.startswith('chiSoNen_'):
            obj.setdefault('chiSoNen', {})[key[len('chiSoNen_'):]] = to_num(val)
        elif key.startswith('tuLuyen_'):
            obj.setdefault('tuLuyen', {})[key[len('tuLuyen_'):]] = to_num(val)
        elif key.startswith('hieuUng_'):
            obj.setdefault('hieuUng', {})[key[len('hieuUng_'):]] = to_num(val)
        elif key.startswith('chiSo_'):
            obj.setdefault('chiSo', {})[key[len('chiSo_'):]] = to_num(val)
        else:
            v = coerce(key, val)
            if v is not None:
                obj[key] = v
    if default_loai and not obj.get('loai'):
        obj['loai'] = default_loai
    return obj

def sheet_rows(wb, name):
    if name not in wb.sheetnames:
        raise SystemExit(f'Thiếu sheet: {name}')
    ws = wb[name]
    headers = [c.value for c in ws[1]]
    rows = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not any(v not in (None, '') for v in row):
            continue
        obj = {}
        for h, v in zip(headers, row):
            if h is None: continue
            if v is None or v == '': continue
            obj[str(h)] = v
        if obj.get('id') not in (None, ''):
            rows.append(obj)
    return rows

def num_key(a):
    return (0, int(a)) if str(a).isdigit() else (1, str(a))
def read_workbook(path):
    wb = load_workbook(path, data_only=True)
    data = {k: [] for _, k, _ in SHEETS}
    data.update({'roll': {}})
    for name, key, default in SHEETS:
        for raw in sheet_rows(wb, name):
            item = unflatten(raw, default)
            data[key].append(item)

    # Roll
    if 'Roll' in wb.sheetnames:
        ws = wb['Roll']
        for k, v in ws.iter_rows(min_row=2, values_only=True):
            if not k or k in ('linhCan', 'theChat', 'xuatThan'):
                continue
            data['roll'][str(k)] = parse_json_cell(v)

    # Kỹ năng
    skills = {}
    if 'KyNang' in wb.sheetnames:
        for raw in sheet_rows(wb, 'KyNang'):
            if not raw.get('congPhapId'):
                continue
            item = unflatten(raw)
            pid = str(item.pop('congPhapId'))
            skills.setdefault(pid, []).append(item)
    for cp in data['congPhap']:
        if cp.get('id') in skills:
            cp['kyNang'] = skills[cp['id']]

    # Nguyên liệu đan phương
    ingredients = {}
    if 'NguyenLieu' in wb.sheetnames:
        ws = wb['NguyenLieu']
        for pid, vid, sl in ws.iter_rows(min_row=2, values_only=True):
            if not pid or not vid:
                continue
            ingredients.setdefault(str(pid), []).append({'id': str(vid), 'soLuong': to_num(sl) or 1})
    for dp in data['danPhuong']:
        if dp.get('id') in ingredients:
            dp['nguyenLieu'] = ingredients[dp['id']]

    # Điền các trường rỗng mặc định để giữ cấu trúc gốc
    for c in data.get('canhGioi', []):
        c.setdefault('danDotPha', None)
    for t in data.get('theChat', []):
        t.setdefault('chiSo', {})
    for t in data.get('tongMon', []):
        for k in ('tuSiTieuBieu', 'dacSan', 'congPhapTranPhai', 'congPhapIds'):
            t.setdefault(k, [])
    for n in data.get('npcs', []):
        for k in ('tuiDo', 'tuiDoTen'):
            n.setdefault(k, [])
    for n in data.get('npcMau', []):
        for k in ('tuiDoMau', 'tuiDo'):
            n.setdefault(k, [])
    for y in data.get('yeuThu', []):
        for k in ('roiDo', 'roiDoTen'):
            y.setdefault(k, [])
    for b in data.get('biCanh', []):
        for k in ('phanThuongTen', 'nguyHiem', 'phanThuong'):
            b.setdefault(k, [])
    for c in data.get('congPhap', []):
        c.setdefault('he', [])
        c.setdefault('tags', [])
        c.setdefault('kyNang', [])
    for v in data.get('vatPham', []):
        v.setdefault('he', [])
    for x in data.get('xuatThan', []):
        x.setdefault('quanHeNpc', [])
    for s in data.get('suKienOffline', []):
        s.setdefault('choices', [])

    # Validate cơ bản
    for key in ['canhGioi','linhCan','theChat','xuatThan','vungDat','tongMon','biCanh','congPhap','vatPham','danPhuong','npcs','npcMau','yeuThu','suKienOffline']:
        arr = data.get(key, [])
        ids = [str(x.get('id')) for x in arr if x.get('id') is not None]
        dup = {x for x in ids if ids.count(x) > 1}
        if dup:
            raise SystemExit(f'ID trùng trong {key}: {sorted(dup)[:10]}')
        missing = [x for x in arr if x.get('id') is None]
        if missing:
            raise SystemExit(f'{key}: có {len(missing)} dòng thiếu id')
    for v in data['vatPham']:
        if not v.get('loai'):
            raise SystemExit(f"Vật phẩm {v.get('id')} thiếu loai")
    for cp in data['congPhap']:
        if cp.get('loai') not in ('TU_LUYEN', 'BI_THUAT'):
            raise SystemExit(f"Công pháp {cp.get('id')} có loai không hợp lệ: {cp.get('loai')}")
    return data

def _slug(s):
    s = str(s or '').lower().replace('đ', 'd')
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s or 'khac'

def _esc(s):
    return str(s).replace('</script', '<\\/script')

def _arr_js(arr):
    return '[\n' + ',\n'.join('  ' + json.dumps(x, ensure_ascii=False) for x in arr) + '\n]'

def _write(rel, text, files):
    p = DATA / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(_esc(text), encoding='utf-8')
    files.append(rel)

def _write_array(rel, key, arr, files):
    _write(rel, f"window.PN_DATA = window.PN_DATA || {{}};\nwindow.PN_DATA[{json.dumps(key)}] = {_arr_js(arr)};\n", files)

def _write_push(rel, key, arr, files):
    body = ',\n'.join('  ' + json.dumps(x, ensure_ascii=False) for x in arr)
    _write(rel, f"window.PN_DATA = window.PN_DATA || {{}};\nwindow.PN_DATA[{json.dumps(key)}] = window.PN_DATA[{json.dumps(key)}] || [];\nwindow.PN_DATA[{json.dumps(key)}].push(\n{body}\n);\n", files)

def _write_object(rel, key, obj, files):
    _write(rel, f"window.PN_DATA = window.PN_DATA || {{}};\nwindow.PN_DATA[{json.dumps(key)}] = {json.dumps(obj, ensure_ascii=False, indent=2)};\n", files)

def write_data(data):
    files = []
    # Xóa JS cũ, giữ README/xlsx/manifest
    for p in DATA.iterdir():
        if p.is_dir():
            shutil.rmtree(p)
        elif p.suffix == '.js':
            p.unlink()

    _write_array('core/canh-gioi.js', 'canhGioi', data['canhGioi'], files)
    _write_array('core/linh-can.js', 'linhCan', data['linhCan'], files)
    _write_array('core/the-chat.js', 'theChat', data['theChat'], files)
    _write_array('core/xuat-than.js', 'xuatThan', data['xuatThan'], files)
    _write_object('core/roll.js', 'roll', data.get('roll', {}), files)
    _write_array('world/vung-dat.js', 'vungDat', data['vungDat'], files)
    _write_array('world/tong-mon.js', 'tongMon', data['tongMon'], files)
    _write_array('world/bi-canh.js', 'biCanh', data['biCanh'], files)

    vp_groups = [
        ('vat-pham/dan-duoc.js', 'dan'), ('vat-pham/linh-thao.js', 'linh_thao'),
        ('vat-pham/trang-bi.js', 'phap_bao'), ('vat-pham/phu-luc.js', 'phu_luc'),
        ('vat-pham/tru-vat.js', 'tru_vat'), ('vat-pham/yeu-dan.js', 'yeu_dan'),
        ('vat-pham/linh-vat.js', 'linh_vat')
    ]
    for rel, loai in vp_groups:
        _write_push(rel, 'vatPham', [v for v in data['vatPham'] if v.get('loai') == loai], files)

    for cg in range(10):
        arr = [x for x in data['danPhuong'] if int(x.get('canhGioi') or 0) == cg]
        if arr:
            _write_push(f'dan-phuong/cg{cg}.js', 'danPhuong', arr, files)

    npc_by = {}
    for x in data['npcs']:
        npc_by.setdefault(_slug(x.get('vungId') or 'khac'), []).append(x)
    for k in sorted(npc_by):
        _write_push(f'npc/{k}.js', 'npcs', npc_by[k], files)
    _write_array('npc/npc-mau.js', 'npcMau', data['npcMau'], files)

    _write_array('yeu-thu.js', 'yeuThu', data['yeuThu'], files)

    sk = data['suKienOffline']
    chunk = (len(sk) + 3) // 4 if sk else 0
    for i in range(4):
        arr = sk[i*chunk:(i+1)*chunk] if chunk else []
        if arr:
            _write_push(f'su-kien-offline/0{i+1}.js', 'suKienOffline', arr, files)

    # Công pháp / bí thuật theo theLoai; file >50KB tách theo dải cảnh giới
    for loai, sub in [('TU_LUYEN', 'tu-luyen'), ('BI_THUAT', 'bi-thuat')]:
        by = {}
        for x in data['congPhap']:
            if x.get('loai') == loai:
                by.setdefault(_slug(x.get('theLoai') or 'khac'), []).append(x)
        for k in sorted(by):
            arr = by[k]
            if len(json.dumps(arr, ensure_ascii=False).encode('utf-8')) > 50000:
                bands = {'0-2': [], '3-5': [], '6-9': []}
                for x in arr:
                    cg = int(x.get('canhGioi') or 0)
                    bands['0-2' if cg <= 2 else '3-5' if cg <= 5 else '6-9'].append(x)
                for band, subarr in bands.items():
                    if subarr:
                        _write_push(f'cong-phap/{sub}/{k}-{band}.js', 'congPhap', subarr, files)
            else:
                _write_push(f'cong-phap/{sub}/{k}.js', 'congPhap', arr, files)

    files.append('index.js')
    files.append('manifest.json')
    _write_index_and_tags(files, data)
    print('Đã ghi', len(files) - 2, 'file dữ liệu + index.js + manifest.json')


def _write_index_and_tags(files, data):
    js_files = [f for f in files if f.endswith('.js') and f != 'index.js']
    # index.js — bật snapshot + alias các mảng roll
    index_js = """/* Bộ nạp dữ liệu — chạy sau tất cả file data, trước game.js */
window.PN_DATA_SNAPSHOT = true;
(function () {
  'use strict';
  const D = window.PN_DATA = window.PN_DATA || {};
  D.roll = D.roll || {};
  if (Array.isArray(D.linhCan)) D.roll.linhCan = D.linhCan;
  if (Array.isArray(D.theChat)) D.roll.theChat = D.theChat;
  if (Array.isArray(D.xuatThan)) D.roll.xuatThan = D.xuatThan;
  ['canhGioi','linhCan','theChat','xuatThan','vungDat','tongMon','biCanh','congPhap','vatPham','danPhuong','npcs','npcMau','yeuThu','suKienOffline'].forEach(k => {
    if (!Array.isArray(D[k])) D[k] = [];
  });
})();
"""
    (DATA / 'index.js').write_text(_esc(index_js), encoding='utf-8')

    manifest = {
        'generatedAt': datetime.now().isoformat(timespec='seconds'),
        'snapshot': True,
        'files': js_files + ['index.js'],
        'counts': counts(data)
    }
    (DATA / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')

    stamp = datetime.now().strftime('%Y%m%d%H%M%S')
    tags = '\n'.join(f'  <script src="data/{f}?v={stamp}"></script>' for f in js_files + ['index.js'])
    idx = ROOT / 'index.html'
    html = idx.read_text(encoding='utf-8')
    new_html = re.sub(r'<!-- DATA_FILES_START -->[\s\S]*?<!-- DATA_FILES_END -->',
                      '<!-- DATA_FILES_START -->\n' + tags + '\n  <!-- DATA_FILES_END -->', html, count=1)
    if new_html == html and 'DATA_FILES_START' not in html:
        raise SystemExit('index.html thiếu marker DATA_FILES_START / DATA_FILES_END')
    idx.write_text(new_html, encoding='utf-8')


def counts(data):
    return {k: len(v) for k, v in data.items() if isinstance(v, list)}

def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--file', default=str(DEFAULT_XLSX))
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()
    path = Path(args.file).resolve()
    if not path.exists():
        raise SystemExit(f'Không tìm thấy Excel: {path}')
    print('Đọc:', path)
    data = read_workbook(path)
    print('Số lượng:', counts(data))
    if args.dry_run:
        print('DRY RUN — không ghi file.')
        return
    write_data(data)
    print('Đã import xong. Chạy lại game để kiểm tra.')

if __name__ == '__main__':
    main()