#!/usr/bin/env python3
"""obd_photos.py — 從 IE OBD Excel 取出「Ref. Picture」樣衣圖，存成 <款號>.jpg

Extract the sample-garment picture from IE "OBD" workbooks (.xls / .xlsx).

用法 Usage
    python3 tools/obd_photos.py <檔案或資料夾> [...] -o <輸出資料夾>
        [--pick first|largest|all] [--max 1200] [--quality 82]

    例：python3 tools/obd_photos.py "D:/IE/OBD" -o out_photos
        → out_photos/A0953.jpg …  + out_photos/manifest.json

輸出的 jpg 檔名就是 PSJERP 的款號鍵（大寫、只留英數），可以整個資料夾（或壓成 .zip）
丟進 PSJERP「智慧匯入」，會自動對到款式並上傳樣衣圖。

How it works
  * .xls (BIFF8): reads the "Workbook" OLE stream (olefile), re-joins MSODRAWINGGROUP +
    CONTINUE records, walks the OfficeArt BLIP store. JPEG/PNG/DIB blips are used directly;
    EMF/WMF blips (what Excel stores for pasted pictures) are inflated and the embedded
    device-independent bitmap (EMR_STRETCHDIBITS etc.) is decoded. The sheet's MSODRAWING
    records give which pictures sit on the "Ref. Picture" sheet and where (anchor).
  * .xlsx: reads xl/media via the sheet → drawing → image relationships (zipfile).
  * Style code: cell "Style:" on the Ref. Picture sheet (next non-empty cell in the row);
    falls back to the file name (…OBD-A0953… → A0953).
  * --pick first (default) = the top-left picture on the sheet (front view when the sheet has
    front + back sketches); largest = most pixels; all = every picture (A0953.jpg, A0953_2.jpg …).

需要 Requires: pillow, olefile, xlrd (for .xls cells), openpyxl (for .xlsx cells)
    pip install --break-system-packages pillow olefile xlrd openpyxl
"""
import argparse, io, json, os, re, struct, sys, zipfile, zlib
import xml.etree.ElementTree as ET

try:
    from PIL import Image
except ImportError:
    sys.exit('需要 Pillow：pip install --break-system-packages pillow')

SHEET_RE = re.compile(r'ref\.?\s*pic', re.I)
EXTS = ('.xls', '.xlsx', '.xlsm')


def style_key(s):
    """Same as PSJERP ks(): upper-case, letters and digits only."""
    return re.sub(r'[^A-Z0-9]+', '', str(s or '').upper())


def style_from_name(fn):
    b = os.path.splitext(os.path.basename(fn))[0]
    m = re.search(r'OBD[\s_\-]*([A-Za-z]*\d[A-Za-z0-9\-]*)', b, re.I)
    if m:
        return style_key(m.group(1))
    m = re.search(r'([A-Za-z]{0,4}\d{3,}[A-Za-z0-9]*)', b)
    return style_key(m.group(1)) if m else ''


# ───────────────────────── bitmap helpers ─────────────────────────
def dib_to_image(bmi, bits):
    """BITMAPINFO + pixel bits → PIL image (via an in-memory .bmp)."""
    bmp = b'BM' + struct.pack('<IHHI', 14 + len(bmi) + len(bits), 0, 0, 14 + len(bmi)) + bmi + bits
    im = Image.open(io.BytesIO(bmp))
    im.load()
    return im


def images_in_bytes(b):
    """JPEG / PNG streams found anywhere in a byte blob."""
    out = []
    for m in re.finditer(b'\xff\xd8\xff', b):
        e = b.find(b'\xff\xd9', m.start())
        while e != -1:
            try:
                im = Image.open(io.BytesIO(b[m.start():e + 2])); im.load(); out.append(im); break
            except Exception:
                e = b.find(b'\xff\xd9', e + 2)
    for m in re.finditer(b'\x89PNG\r\n\x1a\n', b):
        e = b.find(b'IEND', m.start())
        if e != -1:
            try:
                im = Image.open(io.BytesIO(b[m.start():e + 8])); im.load(); out.append(im)
            except Exception:
                pass
    return out


def emf_images(e):
    out = []
    j = 0
    while j + 8 <= len(e):
        rt, rs = struct.unpack_from('<II', e, j)
        try:
            if rt == 81:    # EMR_STRETCHDIBITS
                offB, cbB, offBits, cbBits = struct.unpack_from('<IIII', e, j + 48)
            elif rt == 80:  # EMR_SETDIBITSTODEVICE
                offB, cbB, offBits, cbBits = struct.unpack_from('<IIII', e, j + 48)
            elif rt in (76, 77):  # EMR_BITBLT / EMR_STRETCHBLT
                offB, cbB, offBits, cbBits = struct.unpack_from('<IIII', e, j + 84)
            else:
                offB = 0
            if offB and cbB and cbBits:
                out.append(dib_to_image(e[j + offB:j + offB + cbB], e[j + offBits:j + offBits + cbBits]))
        except Exception:
            pass
        if rs < 8:
            break
        j += rs
    return out or images_in_bytes(e)


def wmf_images(w):
    out = []
    j = 18 if w[:4] != b'\xd7\xcd\xc6\x9a' else 40   # skip (placeable) header
    while j + 6 <= len(w):
        size, fn = struct.unpack_from('<IH', w, j)
        if size < 3:
            break
        rec = w[j:j + size * 2]
        try:
            if fn == 0x0F43:      # META_STRETCHDIB: 6 + 4 + 9 words
                dib = rec[6 + 4 + 18:]
            elif fn == 0x0B41:    # META_DIBSTRETCHBLT
                dib = rec[6 + 4 + 16:]
            elif fn == 0x0940:    # META_DIBBITBLT
                dib = rec[6 + 4 + 12:]
            else:
                dib = None
            if dib:
                out.append(dib_alone(dib))
        except Exception:
            pass
        j += size * 2
    return out or images_in_bytes(w)


def dib_alone(dib):
    """A packed DIB (header + palette + bits) → image."""
    hsz, w, h, planes, bpp, comp = struct.unpack_from('<IiiHHI', dib, 0)
    clr = struct.unpack_from('<I', dib, 32)[0] if hsz >= 36 else 0
    ncol = clr or (1 << bpp if bpp <= 8 else 0)
    extra = 12 if comp == 3 and hsz == 40 else 0
    off = hsz + extra + ncol * 4
    return dib_to_image(dib[:off], dib[off:])


def blip_images(rtype, inst, data):
    """One OfficeArt BLIP record body → list of images."""
    if rtype in (0xF01A, 0xF01B, 0xF01C):          # EMF / WMF / PICT (metafile header 34 bytes)
        two = inst in (0x3D5, 0x217, 0x543)
        h = 16 * (2 if two else 1)
        cb, = struct.unpack_from('<I', data, h)
        cs, = struct.unpack_from('<I', data, h + 28)
        comp = data[h + 32]
        raw = data[h + 34:h + 34 + cs]
        if comp == 0:
            try:
                raw = zlib.decompress(raw)
            except Exception:
                raw = zlib.decompressobj().decompress(raw)
        if rtype == 0xF01A:
            return emf_images(raw)
        if rtype == 0xF01B:
            return wmf_images(raw)
        return images_in_bytes(raw)
    # bitmap blips: uid(16 or 32) + tag(1)
    two = inst in (0x46B, 0x6E3, 0x6E1, 0x7A9, 0x6E5, 0x6E9)
    body = data[(32 if two else 16) + 1:]
    if rtype == 0xF01F:                              # DIB
        try:
            return [dib_alone(body)]
        except Exception:
            return []
    ims = images_in_bytes(body)
    if not ims:
        try:
            im = Image.open(io.BytesIO(body)); im.load(); ims = [im]
        except Exception:
            pass
    return ims


def walk_oa(b, o, end, cb, depth=0):
    while o + 8 <= end:
        vi, ty, ln = struct.unpack_from('<HHI', b, o)
        ver, inst = vi & 0xF, vi >> 4
        cb(ty, ver, inst, b, o + 8, min(end, o + 8 + ln))
        if ver == 0xF and depth < 12:
            walk_oa(b, o + 8, min(end, o + 8 + ln), cb, depth + 1)
        o += 8 + ln


# ───────────────────────── .xls ─────────────────────────
def biff_records(d):
    i = 0
    while i + 4 <= len(d):
        t, l = struct.unpack_from('<HH', d, i)
        yield i, t, d[i + 4:i + 4 + l]
        i += 4 + l


def xls_pictures(path):
    import olefile
    ole = olefile.OleFileIO(path)
    name = 'Workbook' if ole.exists('Workbook') else 'Book'
    d = ole.openstream(name).read()
    # globals: BOUNDSHEET → sheet names / offsets; MSODRAWINGGROUP (+CONTINUE)
    sheets, grp, prev = [], b'', None
    for pos, t, b in biff_records(d):
        if t == 0x0085:
            off = struct.unpack_from('<I', b, 0)[0]
            cch, flg = b[6], b[7]
            nm = b[8:8 + cch * 2].decode('utf-16le', 'replace') if flg & 1 else b[8:8 + cch].decode('latin-1')
            sheets.append((nm, off))
        if t == 0x00EB:
            grp += b; prev = 0xEB
        elif t == 0x003C and prev == 0xEB:
            grp += b
        elif t != 0x003C:
            prev = t
        if t == 0x000A:   # end of workbook globals
            break
    # BLIP store (1-based index = pib)
    blips = []

    def on_grp(ty, ver, inst, b, s, e):
        if ty == 0xF007:   # FBSE: 36-byte header + name, then embedded BLIP
            cbName = b[s + 33]
            q = s + 36 + cbName
            if q + 8 <= e:
                vi, bt, ln = struct.unpack_from('<HHI', b, q)
                blips.append((bt, vi >> 4, b[q + 8:q + 8 + ln]))
            else:
                blips.append(None)
    walk_oa(grp, 0, len(grp), on_grp)

    def sheet_pics(off):
        dg, prev = b'', None
        for pos, t, b in biff_records(d[off:]):
            if t == 0x00EC:
                dg += b; prev = 0xEC
            elif t == 0x003C and prev == 0xEC:
                dg += b
            elif t != 0x003C:
                prev = t
            if t == 0x000A:
                break
        pics, cur = [], {}

        def on_dg(ty, ver, inst, b, s, e):
            nonlocal cur
            if ty == 0xF004:            # SpContainer starts
                cur = {}; pics.append(cur)
            elif ty == 0xF00B:          # FOPT: property table
                for k in range(inst):
                    pid, val = struct.unpack_from('<HI', b, s + k * 6)
                    if pid & 0x3FFF == 0x0104:
                        cur['pib'] = val
            elif ty == 0xF010 and e - s >= 18:   # ClientAnchor
                c1, _, r1 = struct.unpack_from('<HHH', b, s + 2)
                cur['at'] = (r1, c1)
        walk_oa(dg, 0, len(dg), on_dg)
        return [p for p in pics if p.get('pib')]

    target = [s for s in sheets if SHEET_RE.search(s[0])]
    use = target[0] if target else None
    refs = sheet_pics(use[1]) if use else []
    out = []
    if refs:
        refs.sort(key=lambda p: p.get('at', (9999, 9999)))
        for p in refs:
            bl = blips[p['pib'] - 1] if 0 < p['pib'] <= len(blips) else None
            if bl:
                ims = blip_images(*bl)
                if ims:
                    out.append(max(ims, key=lambda im: im.size[0] * im.size[1]))
    else:   # no anchor info → every picture in the workbook
        for bl in blips:
            if bl:
                ims = blip_images(*bl)
                if ims:
                    out.append(max(ims, key=lambda im: im.size[0] * im.size[1]))
    return (use[0] if use else ''), out


def xls_cells(path, sheet):
    try:
        import xlrd
        wb = xlrd.open_workbook(path, on_demand=True)
        sh = wb.sheet_by_name(sheet) if sheet else None
        if sh is None:
            return []
        return [[c.value for c in sh.row(r)] for r in range(min(sh.nrows, 40))]
    except Exception:
        return []


# ───────────────────────── .xlsx ─────────────────────────
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'rel': 'http://schemas.openxmlformats.org/package/2006/relationships',
      'xdr': 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
      'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}


def _rels(z, part):
    d, f = os.path.split(part)
    rp = f'{d}/_rels/{f}.rels'
    if rp not in z.namelist():
        return {}
    out = {}
    for r in ET.fromstring(z.read(rp)).findall('rel:Relationship', NS):
        tgt = r.get('Target')
        if tgt.startswith('/'):
            p = tgt[1:]
        else:
            p = os.path.normpath(os.path.join(d, tgt)).replace('\\', '/')
        out[r.get('Id')] = p
    return out


def xlsx_pictures(path):
    z = zipfile.ZipFile(path)
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    wrels = _rels(z, 'xl/workbook.xml')
    sheets = [(s.get('name'), wrels.get(s.get('{%s}id' % NS['r']))) for s in wb.find('m:sheets', NS)]
    target = [s for s in sheets if SHEET_RE.search(s[0] or '')]
    use = target[0] if target else None

    def pics_of(part):
        res = []
        sx = ET.fromstring(z.read(part))
        srels = _rels(z, part)
        for dr in sx.iter('{%s}drawing' % NS['m']):
            dp = srels.get(dr.get('{%s}id' % NS['r']))
            if not dp or dp not in z.namelist():
                continue
            drels = _rels(z, dp)
            dx = ET.fromstring(z.read(dp))
            for anc in list(dx):
                fr = anc.find('xdr:from', NS)
                at = (int(fr.find('xdr:row', NS).text), int(fr.find('xdr:col', NS).text)) if fr is not None else (9999, 9999)
                for bl in anc.iter('{%s}blip' % NS['a']):
                    ip = drels.get(bl.get('{%s}embed' % NS['r']))
                    if ip and ip in z.namelist():
                        res.append((at, ip))
        return sorted(res)

    refs = pics_of(use[1]) if use and use[1] else []
    if not refs:
        refs = [((9999, 9999), n) for n in z.namelist() if n.startswith('xl/media/')]
    out = []
    for _, ip in refs:
        b = z.read(ip)
        ims = []
        try:
            im = Image.open(io.BytesIO(b)); im.load(); ims = [im]
            if im.format in ('WMF', 'EMF'):
                raise ValueError
        except Exception:
            ims = emf_images(b) if b[:4] == b'\x01\x00\x00\x00' else wmf_images(b)
        if ims:
            out.append(max(ims, key=lambda im: im.size[0] * im.size[1]))
    return (use[0] if use else ''), out


def xlsx_cells(path, sheet):
    try:
        import openpyxl
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        if not sheet or sheet not in wb.sheetnames:
            return []
        return [list(r) for r in wb[sheet].iter_rows(max_row=40, values_only=True)]
    except Exception:
        return []


# ───────────────────────── main ─────────────────────────
def label_value(rows, pat):
    for r in rows:
        for i, v in enumerate(r):
            s = str(v or '').strip()
            if re.match(pat, s, re.I):
                rest = re.sub(pat + r'\s*:?\s*', '', s, flags=re.I).strip()
                if rest:
                    return rest
                for w in r[i + 1:]:
                    if isinstance(w, float) and w.is_integer():
                        return str(int(w))          # xlrd 數字款號 1505.0 → 1505
                    if str(w or '').strip():
                        return re.sub(r'^(\d+)\.0$', r'\1', str(w).strip())
    return ''


def process(path, out_dir, pick, maxpx, quality):
    ext = os.path.splitext(path)[1].lower()
    if ext == '.xls':
        sheet, pics = xls_pictures(path); rows = xls_cells(path, sheet)
    else:
        sheet, pics = xlsx_pictures(path); rows = xlsx_cells(path, sheet)
    sty_txt = label_value(rows, r'style')
    pic_txt = label_value(rows, r'pi\w*ture')
    style = style_key(sty_txt) or style_from_name(path)
    res = {'style': style, 'source_file': os.path.basename(path), 'sheet_name_text': pic_txt,
           'sheet_style_text': sty_txt, 'file_style': style_from_name(path), 'sheet': sheet,
           'pictures_found': len(pics)}
    if not style:
        res['error'] = 'no style code'; return res
    if not pics:
        res['error'] = 'no picture'; return res
    if pick == 'largest':
        sel = [max(pics, key=lambda im: im.size[0] * im.size[1])]
    elif pick == 'all':
        sel = pics
    else:
        sel = pics[:1]
    files = []
    for n, im in enumerate(sel):
        im = im.convert('RGBA') if im.mode in ('P', 'LA') else im
        if im.mode == 'RGBA':
            bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[3]); im = bg
        im = im.convert('RGB')
        im.thumbnail((maxpx, maxpx), Image.LANCZOS)
        fn = f'{style}.jpg' if n == 0 else f'{style}_{n + 1}.jpg'
        im.save(os.path.join(out_dir, fn), 'JPEG', quality=quality, optimize=True)
        files.append(fn)
        res.setdefault('width', im.size[0]); res.setdefault('height', im.size[1])
    res['files'] = files
    return res


def main():
    ap = argparse.ArgumentParser(description='Extract Ref. Picture sample photos from IE OBD workbooks.')
    ap.add_argument('inputs', nargs='+', help='.xls/.xlsx files or folders (searched recursively)')
    ap.add_argument('-o', '--out', default='obd_photos_out', help='output folder (default obd_photos_out)')
    ap.add_argument('--pick', choices=['first', 'largest', 'all'], default='first')
    ap.add_argument('--max', type=int, default=1200, help='max width/height in px (default 1200)')
    ap.add_argument('--quality', type=int, default=82, help='JPEG quality (default 82)')
    a = ap.parse_args()
    files = []
    for p in a.inputs:
        if os.path.isdir(p):
            for root, _, fs in os.walk(p):
                files += [os.path.join(root, f) for f in sorted(fs) if f.lower().endswith(EXTS) and not f.startswith('~$')]
        elif os.path.isfile(p):
            files.append(p)
        else:
            print('找不到 not found:', p, file=sys.stderr)
    os.makedirs(a.out, exist_ok=True)
    mpath = os.path.join(a.out, 'manifest.json')
    manifest = []
    if os.path.exists(mpath):
        try:
            manifest = json.load(open(mpath, encoding='utf-8'))
        except Exception:
            manifest = []
    ok = bad = 0
    for f in files:
        try:
            r = process(f, a.out, a.pick, a.max, a.quality)
        except Exception as e:
            r = {'style': style_from_name(f), 'source_file': os.path.basename(f), 'sheet_name_text': '', 'error': f'{type(e).__name__}: {e}'}
        manifest = [m for m in manifest if m.get('source_file') != r['source_file']] + [r]
        if r.get('error'):
            bad += 1; print(f'✗ {os.path.basename(f)}: {r["error"]}')
        else:
            ok += 1; print(f'✓ {os.path.basename(f)} → {", ".join(r["files"])}  ({r.get("width")}×{r.get("height")}, {r["sheet_name_text"]})')
    json.dump(manifest, open(mpath, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'完成 done: {ok} ok, {bad} failed → {os.path.abspath(a.out)}')
    return 0 if ok or not files else 1


if __name__ == '__main__':
    sys.exit(main())
